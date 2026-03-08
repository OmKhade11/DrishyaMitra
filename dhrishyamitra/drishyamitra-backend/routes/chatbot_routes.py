import re
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

from models import Face, Person, Photo
from routes.serializers import photo_to_api
from services.chatbot_service import ChatbotService
from services.delivery_service import DeliveryService


chat_bp = Blueprint("chat", __name__, url_prefix="/api")
delivery_service = DeliveryService()


def _latest_photo_for_person(name: str):
    return (
        Photo.query.join(Face, Face.photo_id == Photo.id)
        .join(Person, Person.id == Face.person_id)
        .filter(Person.name.ilike(f"%{name}%"))
        .order_by(Photo.uploaded_at.desc())
        .first()
    )


def _normalize_person_query(name: str) -> str:
    normalized = name.strip().lower()
    normalized = re.sub(r"^(person|people)\s+", "", normalized)
    normalized = re.sub(r"\s+photos?$", "", normalized)
    return normalized.strip()


def _month_bounds(year: int, month: int):
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def _resolve_date_window(text: str):
    now = datetime.utcnow()

    if "last month" in text:
        year = now.year
        month = now.month - 1
        if month == 0:
            month = 12
            year -= 1
        return _month_bounds(year, month)

    if "this month" in text:
        return _month_bounds(now.year, now.month)

    year_match = re.search(r"\b(20\d{2})\b", text)
    if year_match:
        year = int(year_match.group(1))
        return datetime(year, 1, 1), datetime(year + 1, 1, 1)

    return None, None


def _apply_time_filter(query, text: str):
    start, end = _resolve_date_window(text)
    if start and end:
        query = query.filter(Photo.uploaded_at >= start, Photo.uploaded_at < end)
    return query


def _send_email_many(photos: list[Photo], recipient: str) -> tuple[int, int]:
    success = 0
    for photo in photos:
        result = delivery_service.send_email(
            photo,
            recipient=recipient,
            subject="Photos from Drishyamitra",
            body="Shared via AI assistant.",
        )
        if result.get("success"):
            success += 1
    return success, len(photos)


def _handle_delivery_command(text: str, context: dict | None = None):
    normalized = text.strip()

    email_many_cmd = re.search(
        r"(?:email|mail)\s+(?:this|these|those|all)?\s*photos?\s+to\s+([^\s]+@[^\s]+)",
        normalized,
        re.IGNORECASE,
    )
    if email_many_cmd:
        recipient = email_many_cmd.group(1)
        photo_ids = (context or {}).get("photo_ids") or []
        photos = []

        if photo_ids:
            photos = Photo.query.filter(Photo.id.in_(photo_ids)).order_by(Photo.uploaded_at.desc()).all()
        else:
            photos = Photo.query.order_by(Photo.uploaded_at.desc()).limit(4).all()

        if not photos:
            return {"bot_response": "No photos available to send.", "engine": "smart-query", "photos": []}

        sent, total = _send_email_many(photos, recipient)
        return {
            "bot_response": f"Sent {sent}/{total} photo(s) to {recipient}.",
            "engine": "smart-query",
            "photos": [photo_to_api(photo) for photo in photos],
        }

    email_cmd = re.search(r"(?:email|mail)\s+photo\s+(\d+)\s+to\s+([^\s]+@[^\s]+)", normalized, re.IGNORECASE)
    if email_cmd:
        photo_id = int(email_cmd.group(1))
        recipient = email_cmd.group(2)
        photo = Photo.query.get(photo_id)
        if not photo:
            return {"bot_response": f"Photo {photo_id} not found.", "engine": "smart-query", "photos": []}

        result = delivery_service.send_email(photo, recipient=recipient, subject="Photo from Drishyamitra", body="Shared via AI assistant.")
        status = "sent" if result.get("success") else "failed"
        return {
            "bot_response": f"Email delivery {status} for photo {photo_id} to {recipient}.",
            "engine": "smart-query",
            "photos": [photo_to_api(photo)],
        }

    return None


def _smart_reply(message: str, context: dict | None = None) -> dict | None:
    text = message.lower().strip()

    delivery = _handle_delivery_command(message, context=context)
    if delivery is not None:
        return delivery

    if re.search(r"\b(show|find)( me)?\s+all\s+photos\b", text):
        query = Photo.query.order_by(Photo.uploaded_at.desc())
        query = _apply_time_filter(query, text)
        photos = query.all()
        return {
            "bot_response": f"Showing all {len(photos)} photo(s).",
            "engine": "smart-query",
            "photos": [photo_to_api(photo) for photo in photos],
        }

    person_match = re.search(r"(?:show|find)(?: me)?\s+photos?\s+of\s+(.+)", text)
    if person_match:
        raw_name = person_match.group(1).strip()
        raw_name = raw_name.split(" from ")[0].strip()
        name = _normalize_person_query(raw_name)

        query = (
            Photo.query.join(Face, Face.photo_id == Photo.id)
            .join(Person, Person.id == Face.person_id)
            .filter(Person.name.ilike(f"%{name}%"))
            .order_by(Photo.uploaded_at.desc())
        )
        query = _apply_time_filter(query, text)

        photos = query.all()
        dedup = {photo.id: photo for photo in photos}
        count = len(dedup)
        return {
            "bot_response": f"Found {count} photo(s) for {name}.",
            "engine": "smart-query",
            "photos": [photo_to_api(photo) for photo in dedup.values()],
        }

    if "people" in text and "recognized" in text:
        people = Person.query.order_by(Person.name.asc()).all()
        names = ", ".join([p.name for p in people][:8])
        return {
            "bot_response": f"I currently know {len(people)} people: {names if names else 'none yet'}.",
            "engine": "smart-query",
            "photos": [],
        }

    return None


@chat_bp.post("/chat")
def chat() -> tuple:
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    context = data.get("context")
    context = context if isinstance(context, dict) else {}

    if not message:
        return jsonify({"error": "Message required"}), 400

    smart = _smart_reply(message, context=context)
    if smart is not None:
        return jsonify({"user_message": message, **smart})

    service = ChatbotService(
        api_key=current_app.config.get("GROQ_API_KEY", ""),
        model=current_app.config.get("GROQ_MODEL", "llama-3.1-8b-instant"),
    )
    result = service.ask(message=message, context=context.get("text"))

    return jsonify(
        {
            "user_message": message,
            "bot_response": result["bot_response"],
            "engine": result["engine"],
            "photos": [],
        }
    )
