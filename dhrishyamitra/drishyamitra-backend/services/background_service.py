from pathlib import Path
import tempfile

import cv2
import numpy as np

from models import Face, Photo, db
from services.face_service import DeepFace, FaceService


class BackgroundService:
    def __init__(self) -> None:
        self.face_service = FaceService()

    def organize_photo_folder(self, photo: Photo) -> str:
        current = Path(photo.file_path)
        target_folder = current.parent / str(photo.uploaded_at.date())
        target_folder.mkdir(parents=True, exist_ok=True)

        target_path = target_folder / current.name
        if current != target_path and current.exists():
            current.replace(target_path)
            photo.file_path = str(target_path)
            db.session.commit()

        return photo.file_path

    @staticmethod
    def _cosine_distance(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        denom = np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
        if denom == 0:
            return 1.0
        return 1.0 - float(np.dot(vec_a, vec_b) / denom)

    @staticmethod
    def _bbox_iou(a: dict, b: dict) -> float:
        ax1, ay1, aw, ah = a["x"], a["y"], a["w"], a["h"]
        bx1, by1, bw, bh = b["x"], b["y"], b["w"], b["h"]
        ax2, ay2 = ax1 + aw, ay1 + ah
        bx2, by2 = bx1 + bw, by1 + bh

        inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
        inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
        if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
            return 0.0

        inter = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
        area_a = aw * ah
        area_b = bw * bh
        union = area_a + area_b - inter
        return float(inter / union) if union else 0.0

    @staticmethod
    def _extract_face_crop(photo_path: str, face: Face):
        image = cv2.imread(photo_path)
        if image is None:
            return None

        h, w = image.shape[:2]
        mx = int(face.bbox_w * 0.20)
        my = int(face.bbox_h * 0.20)

        x1 = max(0, face.bbox_x - mx)
        y1 = max(0, face.bbox_y - my)
        x2 = min(w, face.bbox_x + max(1, face.bbox_w) + mx)
        y2 = min(h, face.bbox_y + max(1, face.bbox_h) + my)

        if x2 <= x1 or y2 <= y1:
            return None

        return image[y1:y2, x1:x2]

    def _face_embedding(self, photo_path: str, face: Face, model_name: str = "Facenet512"):
        if DeepFace is None:
            return None

        crop = self._extract_face_crop(photo_path, face)
        if crop is None or crop.size == 0:
            return None

        resized = cv2.resize(crop, (224, 224), interpolation=cv2.INTER_AREA)

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=True) as tmp:
            if not cv2.imwrite(tmp.name, resized):
                return None

            try:
                reps = DeepFace.represent(
                    img_path=tmp.name,
                    model_name=model_name,
                    detector_backend="skip",
                    enforce_detection=False,
                )
            except Exception:
                try:
                    reps = DeepFace.represent(
                        img_path=tmp.name,
                        model_name=model_name,
                        detector_backend="opencv",
                        enforce_detection=False,
                    )
                except Exception:
                    return None

        if not reps:
            return None
        emb = reps[0].get("embedding")
        if emb is None:
            return None
        return np.asarray(emb, dtype=np.float32)

    def force_assign_unknown_faces(self, person_id: int, photo_ids: list[int] | None = None) -> int:
        query = Face.query.filter(Face.person_id.is_(None))
        if photo_ids:
            query = query.filter(Face.photo_id.in_(photo_ids))

        faces = query.all()
        for face in faces:
            face.person_id = person_id

        if faces:
            db.session.commit()
        return len(faces)

    def auto_label_unknown_faces(
        self,
        target_person_id: int | None = None,
        threshold: float = 0.45,
        model_name: str = "Facenet512",
        unknown_photo_ids: list[int] | None = None,
    ) -> int:
        if DeepFace is None:
            return 0

        labeled_query = Face.query.filter(Face.person_id.is_not(None))
        if target_person_id is not None:
            labeled_query = labeled_query.filter(Face.person_id == target_person_id)

        labeled_faces = labeled_query.all()
        if not labeled_faces:
            return 0

        person_embeddings: dict[int, list[np.ndarray]] = {}
        photo_cache: dict[int, str] = {}

        for face in labeled_faces:
            if face.person_id is None:
                continue
            if face.photo_id not in photo_cache:
                photo = Photo.query.get(face.photo_id)
                if not photo:
                    continue
                photo_cache[face.photo_id] = photo.file_path

            emb = self._face_embedding(photo_cache[face.photo_id], face, model_name=model_name)
            if emb is None:
                continue
            person_embeddings.setdefault(face.person_id, []).append(emb)

        if not person_embeddings:
            return 0

        person_centroids = {
            pid: np.mean(np.vstack(embeds), axis=0)
            for pid, embeds in person_embeddings.items()
            if embeds
        }
        if not person_centroids:
            return 0

        unknown_query = Face.query.filter(Face.person_id.is_(None))
        if unknown_photo_ids:
            unknown_query = unknown_query.filter(Face.photo_id.in_(unknown_photo_ids))

        unknown_faces = unknown_query.all()
        matched = 0

        for face in unknown_faces:
            if face.photo_id not in photo_cache:
                photo = Photo.query.get(face.photo_id)
                if not photo:
                    continue
                photo_cache[face.photo_id] = photo.file_path

            emb = self._face_embedding(photo_cache[face.photo_id], face, model_name=model_name)
            if emb is None:
                continue

            best_person_id = None
            best_distance = 1.0
            for person_id, centroid in person_centroids.items():
                distance = self._cosine_distance(emb, centroid)
                if distance < best_distance:
                    best_distance = distance
                    best_person_id = person_id

            if best_person_id is not None and best_distance <= threshold:
                face.person_id = best_person_id
                matched += 1

        if matched:
            db.session.commit()

        return matched

    def _detect_faces_for_photos(self, photos: list[Photo], force_redetect: bool = False) -> tuple[int, int]:
        processed = 0
        created_faces = 0

        for photo in photos:
            existing_faces = Face.query.filter_by(photo_id=photo.id).all()
            if existing_faces and not force_redetect:
                continue

            if force_redetect:
                # Refresh unknown detections so stale boxes do not block new detections.
                Face.query.filter_by(photo_id=photo.id, person_id=None).delete(synchronize_session=False)
                db.session.flush()
                existing_faces = Face.query.filter_by(photo_id=photo.id).all()

            result = self.face_service.detect_faces(photo.file_path, detector_backend="multi")
            processed += 1

            existing_boxes = [
                {"x": f.bbox_x, "y": f.bbox_y, "w": f.bbox_w, "h": f.bbox_h}
                for f in existing_faces
            ]

            for face_data in result:
                bbox = face_data["bbox"]
                if any(self._bbox_iou(bbox, box) >= 0.55 for box in existing_boxes):
                    continue

                face = Face(
                    photo_id=photo.id,
                    detector=face_data.get("detector", "multi"),
                    confidence=face_data.get("confidence"),
                    bbox_x=bbox["x"],
                    bbox_y=bbox["y"],
                    bbox_w=bbox["w"],
                    bbox_h=bbox["h"],
                )
                db.session.add(face)
                existing_boxes.append(bbox)
                created_faces += 1

        db.session.commit()
        return processed, created_faces

    def train_and_match_person(
        self,
        person_id: int,
        photo_ids: list[int] | None = None,
        threshold: float = 0.55,
        force_redetect: bool = True,
        force_assign: bool = False,
    ) -> dict:
        photos_query = Photo.query
        if photo_ids:
            photos_query = photos_query.filter(Photo.id.in_(photo_ids))

        photos = photos_query.order_by(Photo.uploaded_at.desc()).all()
        processed, created_faces = self._detect_faces_for_photos(photos, force_redetect=force_redetect)
        auto_matched_faces = self.auto_label_unknown_faces(
            target_person_id=person_id,
            threshold=threshold,
            unknown_photo_ids=photo_ids,
        )

        forced_assigned_faces = 0
        if force_assign and photo_ids:
            forced_assigned_faces = self.force_assign_unknown_faces(person_id=person_id, photo_ids=photo_ids)

        return {
            "photos_processed": processed,
            "faces_created": created_faces,
            "auto_matched_faces": auto_matched_faces,
            "forced_assigned_faces": forced_assigned_faces,
            "threshold": threshold,
            "force_redetect": force_redetect,
            "force_assign": force_assign,
        }

    def batch_detect_faces(self, limit: int = 10, force_redetect: bool = False) -> dict:
        if force_redetect:
            photos = Photo.query.order_by(Photo.uploaded_at.desc()).limit(limit).all()
        else:
            photos = (
                Photo.query.outerjoin(Face, Photo.id == Face.photo_id)
                .filter(Face.id.is_(None))
                .order_by(Photo.uploaded_at.desc())
                .limit(limit)
                .all()
            )

        processed, created_faces = self._detect_faces_for_photos(photos, force_redetect=force_redetect)
        auto_matched_faces = self.auto_label_unknown_faces()
        return {
            "photos_processed": processed,
            "faces_created": created_faces,
            "auto_matched_faces": auto_matched_faces,
            "force_redetect": force_redetect,
        }


    def scan_train_match_person(
        self,
        person_id: int,
        threshold: float = 0.60,
        force_assign_remaining: bool = True,
        limit: int = 2000,
    ) -> dict:
        scan = self.batch_detect_faces(limit=limit, force_redetect=True)
        match = self.train_and_match_person(
            person_id=person_id,
            photo_ids=None,
            threshold=threshold,
            force_redetect=False,
            force_assign=False,
        )

        forced_assigned_faces = 0
        if force_assign_remaining:
            forced_assigned_faces = self.force_assign_unknown_faces(person_id=person_id)

        return {
            "photos_processed": scan.get("photos_processed", 0),
            "faces_created": scan.get("faces_created", 0),
            "auto_matched_faces": match.get("auto_matched_faces", 0),
            "forced_assigned_faces": forced_assigned_faces,
            "threshold": threshold,
            "force_assign_remaining": force_assign_remaining,
        }
