from flask import Blueprint, jsonify, request

from models import Face, Photo, db
from routes.serializers import photo_to_api
from services.face_service import FaceService


recognize_bp = Blueprint("recognition", __name__, url_prefix="/api")
face_service = FaceService()


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


@recognize_bp.post("/recognize")
def recognize() -> tuple:
    data = request.get_json(silent=True) or {}

    photo_id = data.get("photo_id")
    image_path = data.get("image_path")
    model_name = data.get("model_name", "Facenet512")
    detector_backend = data.get("detector_backend", "multi")

    photo = None
    if photo_id is not None:
        photo = Photo.query.get(photo_id)
        if not photo:
            return jsonify({"error": "Photo not found"}), 404
        image_path = photo.file_path

    if not image_path:
        return jsonify({"error": "image_path or photo_id is required"}), 400

    try:
        result = face_service.recognize_metadata(
            image_path=image_path,
            model_name=model_name,
            detector_backend=detector_backend,
        )
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404

    if photo:
        existing_faces = Face.query.filter_by(photo_id=photo.id).all()

        # Preserve labels by matching old/new boxes before refresh.
        carry_labels: list[int | None] = []
        for face_data in result["faces"]:
            bbox = face_data["bbox"]
            best_person_id = None
            best_iou = 0.0
            for old_face in existing_faces:
                old_bbox = {"x": old_face.bbox_x, "y": old_face.bbox_y, "w": old_face.bbox_w, "h": old_face.bbox_h}
                iou = _bbox_iou(bbox, old_bbox)
                if iou > best_iou:
                    best_iou = iou
                    best_person_id = old_face.person_id
            carry_labels.append(best_person_id if best_iou >= 0.45 else None)

        Face.query.filter_by(photo_id=photo.id).delete(synchronize_session=False)

        for idx, face_data in enumerate(result["faces"]):
            bbox = face_data["bbox"]
            db.session.add(
                Face(
                    photo_id=photo.id,
                    person_id=carry_labels[idx],
                    detector=face_data.get("detector", detector_backend),
                    confidence=face_data.get("confidence"),
                    bbox_x=bbox["x"],
                    bbox_y=bbox["y"],
                    bbox_w=bbox["w"],
                    bbox_h=bbox["h"],
                )
            )
        db.session.commit()

        refreshed = Photo.query.get(photo.id)
        return jsonify({**result, "photo": photo_to_api(refreshed)})

    return jsonify(result)


@recognize_bp.get("/photos/<int:photo_id>/faces")
def list_photo_faces(photo_id: int) -> tuple:
    photo = Photo.query.get(photo_id)
    if not photo:
        return jsonify({"error": "Photo not found"}), 404

    return jsonify({
        "photo_id": photo_id,
        "faces": [face.to_dict() for face in photo.faces],
    })
