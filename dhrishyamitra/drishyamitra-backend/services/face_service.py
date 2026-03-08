from pathlib import Path
from typing import Any

import cv2

try:
    from deepface import DeepFace
except Exception:
    DeepFace = None


class FaceService:
    def __init__(self, cascade_path: str | None = None) -> None:
        if cascade_path is None:
            cascade_path = str(Path(__file__).resolve().parent.parent / "models" / "haarcascade_frontalface_default.xml")
        self.cascade = cv2.CascadeClassifier(cascade_path)

    @staticmethod
    def _bbox_iou(a: dict[str, int], b: dict[str, int]) -> float:
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
    def _load_image(image_path: str):
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Image not found: {image_path}")
        return image

    @staticmethod
    def _enhance_image(image):
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l2 = clahe.apply(l)
        enhanced = cv2.merge((l2, a, b))
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    @staticmethod
    def _sanitize_bbox(bbox: dict[str, int], img_w: int, img_h: int) -> dict[str, int] | None:
        x = max(0, int(bbox.get("x", 0)))
        y = max(0, int(bbox.get("y", 0)))
        w = int(bbox.get("w", 0))
        h = int(bbox.get("h", 0))
        if w <= 0 or h <= 0:
            return None

        if x + w > img_w:
            w = img_w - x
        if y + h > img_h:
            h = img_h - y

        min_side = max(20, int(min(img_w, img_h) * 0.025))
        if w < min_side or h < min_side:
            return None

        # Drop extreme aspect boxes that are not face-like.
        ratio = max(w / max(1, h), h / max(1, w))
        if ratio > 1.8:
            return None

        return {"x": x, "y": y, "w": w, "h": h}

    @staticmethod
    def _rank_face(face: dict[str, Any]) -> tuple[float, int]:
        conf = float(face.get("confidence")) if face.get("confidence") is not None else 0.0
        area = int(face["bbox"]["w"] * face["bbox"]["h"])
        return (conf, area)

    def _dedupe_faces(self, faces: list[dict[str, Any]], iou_threshold: float = 0.40) -> list[dict[str, Any]]:
        merged: list[dict[str, Any]] = []
        for face in faces:
            bbox = face.get("bbox") or {}
            if bbox.get("w", 0) < 18 or bbox.get("h", 0) < 18:
                continue

            duplicate_idx = None
            for i, existing in enumerate(merged):
                if self._bbox_iou(bbox, existing["bbox"]) >= iou_threshold:
                    duplicate_idx = i
                    break

            if duplicate_idx is None:
                merged.append(face)
                continue

            current_conf = face.get("confidence")
            existing_conf = merged[duplicate_idx].get("confidence")
            current_score = float(current_conf) if current_conf is not None else -1.0
            existing_score = float(existing_conf) if existing_conf is not None else -1.0
            if current_score > existing_score:
                merged[duplicate_idx] = face

        return merged

    def _opencv_detect_image(self, image, variant: str = "base") -> list[dict[str, Any]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        configs = [(1.1, 5, (30, 30)), (1.05, 4, (20, 20))]
        if variant == "enhanced":
            configs = [(1.05, 3, (20, 20)), (1.03, 3, (16, 16))]

        items: list[dict[str, Any]] = []
        h, w = image.shape[:2]
        for scale_factor, min_neighbors, min_size in configs:
            faces = self.cascade.detectMultiScale(
                gray,
                scaleFactor=scale_factor,
                minNeighbors=min_neighbors,
                minSize=min_size,
            )
            for (x, y, bw, bh) in faces:
                bbox = self._sanitize_bbox({"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)}, w, h)
                if not bbox:
                    continue
                items.append(
                    {
                        "bbox": bbox,
                        "confidence": None,
                        "detector": "opencv",
                        "variant": variant,
                    }
                )
        # Keep strongest candidates first to reduce noisy tails.
        items.sort(
            key=lambda f: (
                float(f.get("confidence")) if f.get("confidence") is not None else 0.0,
                f["bbox"]["w"] * f["bbox"]["h"],
            ),
            reverse=True,
        )
        return items[:60]

    def _deepface_detect_image(self, image, detector_backend: str, variant: str) -> list[dict[str, Any]]:
        if DeepFace is None:
            return self._opencv_detect_image(image, variant=variant)

        extracted = DeepFace.extract_faces(
            img_path=image,
            detector_backend=detector_backend,
            enforce_detection=False,
            align=True,
        )

        items: list[dict[str, Any]] = []
        h, w = image.shape[:2]
        for face in extracted:
            area = face.get("facial_area", {})
            bbox = self._sanitize_bbox(
                {
                    "x": int(area.get("x", 0)),
                    "y": int(area.get("y", 0)),
                    "w": int(area.get("w", 0)),
                    "h": int(area.get("h", 0)),
                },
                w,
                h,
            )
            if not bbox:
                continue
            confidence = face.get("confidence")
            if confidence is not None and float(confidence) < 0.75:
                continue

            items.append(
                {
                    "bbox": bbox,
                    "confidence": confidence,
                    "detector": detector_backend,
                    "variant": variant,
                }
            )

        items.sort(
            key=lambda f: (
                float(f.get("confidence")) if f.get("confidence") is not None else 0.0,
                f["bbox"]["w"] * f["bbox"]["h"],
            ),
            reverse=True,
        )
        return items[:40]

    def _opencv_detect(self, image_path: str) -> list[dict[str, Any]]:
        image = self._load_image(image_path)
        items = self._opencv_detect_image(image, variant="base")
        return self._dedupe_faces(items)

    def _deepface_detect(self, image_path: str, detector_backend: str) -> list[dict[str, Any]]:
        image = self._load_image(image_path)
        items = self._deepface_detect_image(image, detector_backend, variant="base")
        return self._dedupe_faces(items)

    def detect_faces(self, image_path: str, detector_backend: str = "opencv") -> list[dict[str, Any]]:
        detector = detector_backend.lower()
        image = self._load_image(image_path)
        enhanced = self._enhance_image(image)

        if detector in {"multi", "ensemble", "auto"}:
            candidates: list[dict[str, Any]] = []
            if DeepFace is not None:
                for backend in ("retinaface", "mtcnn"):
                    for img, variant in ((image, "base"), (enhanced, "enhanced")):
                        try:
                            candidates.extend(self._deepface_detect_image(img, backend, variant=variant))
                        except Exception:
                            continue
            try:
                candidates.extend(self._opencv_detect_image(image, variant="base"))
                candidates.extend(self._opencv_detect_image(enhanced, variant="enhanced"))
            except Exception:
                pass
            merged = self._dedupe_faces(candidates)
            merged.sort(key=self._rank_face, reverse=True)
            return merged[:30]

        if detector in {"opencv", "haarcascade"}:
            return self._dedupe_faces(self._opencv_detect_image(image, variant="base"))
        if detector in {"retinaface", "mtcnn"}:
            return self._dedupe_faces(self._deepface_detect_image(image, detector, variant="base"))
        return self._dedupe_faces(self._opencv_detect_image(image, variant="base"))

    def recognize_metadata(
        self,
        image_path: str,
        model_name: str = "Facenet512",
        detector_backend: str = "multi",
    ) -> dict[str, Any]:
        faces = self.detect_faces(image_path=image_path, detector_backend=detector_backend)

        deepface_ready = DeepFace is not None
        if deepface_ready:
            rep_backend = detector_backend if detector_backend in {"opencv", "retinaface", "mtcnn"} else "retinaface"
            try:
                DeepFace.represent(
                    img_path=image_path,
                    model_name=model_name,
                    detector_backend=rep_backend,
                    enforce_detection=False,
                )
            except Exception:
                deepface_ready = False

        return {
            "faces_detected": len(faces),
            "detector_backend": detector_backend,
            "model_name": model_name,
            "recognition_engine": "deepface" if deepface_ready else "opencv-fallback",
            "faces": faces,
        }
