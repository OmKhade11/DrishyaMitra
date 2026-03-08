from flask import Blueprint, jsonify, request

from models import Photo
from services.background_service import BackgroundService
from services.delivery_service import DeliveryService


delivery_bp = Blueprint("delivery", __name__, url_prefix="/api/delivery")
delivery_service = DeliveryService()
background_service = BackgroundService()


@delivery_bp.post("/email")
def deliver_email() -> tuple:
    data = request.get_json(silent=True) or {}

    photo_id = data.get("photo_id")
    recipient = (data.get("recipient_email") or "").strip()
    subject = data.get("subject", "Photo delivery from DrishyaMitra")
    body = data.get("body", "Sharing a photo with you.")

    if not photo_id or not recipient:
        return jsonify({"error": "photo_id and recipient_email are required"}), 400

    photo = Photo.query.get(photo_id)
    if not photo:
        return jsonify({"error": "Photo not found"}), 404

    result = delivery_service.send_email(photo, recipient=recipient, subject=subject, body=body)
    status_code = 200 if result["success"] else 500
    return jsonify(result), status_code


@delivery_bp.post("/whatsapp")
def deliver_whatsapp() -> tuple:
    data = request.get_json(silent=True) or {}

    photo_id = data.get("photo_id")
    recipient = (data.get("recipient_phone") or "").strip()
    caption = data.get("caption", "Photo from DrishyaMitra")

    if not photo_id or not recipient:
        return jsonify({"error": "photo_id and recipient_phone are required"}), 400

    photo = Photo.query.get(photo_id)
    if not photo:
        return jsonify({"error": "Photo not found"}), 404

    result = delivery_service.send_whatsapp(photo, recipient=recipient, caption=caption)
    status_code = 200 if result["success"] else 500
    return jsonify(result), status_code


@delivery_bp.get("/history")
def history() -> tuple:
    photo_id = request.args.get("photo_id", type=int)
    items = delivery_service.list_history(photo_id=photo_id)
    return jsonify({"history": items})


@delivery_bp.post("/batch-process")
def batch_process() -> tuple:
    data = request.get_json(silent=True) or {}
    limit = int(data.get("limit", 10))
    force_redetect = bool(data.get("force_redetect", False))
    result = background_service.batch_detect_faces(limit=limit, force_redetect=force_redetect)
    return jsonify(result)
