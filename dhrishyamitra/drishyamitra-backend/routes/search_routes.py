from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from models import Face, Person, Photo
from routes.serializers import photo_to_api


search_bp = Blueprint("search", __name__, url_prefix="/api")


@search_bp.get("/search/photos")
def search_photos() -> tuple:
    query = (request.args.get("q") or "").strip().lower()
    person = (request.args.get("person") or "").strip().lower()
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    photos_query = Photo.query

    if person:
        photos_query = (
            photos_query.join(Face, Face.photo_id == Photo.id)
            .join(Person, Person.id == Face.person_id)
            .filter(func.lower(Person.name).contains(person))
        )

    if query:
        photos_query = photos_query.filter(
            func.lower(Photo.filename).contains(query)
            | Photo.id.in_(
                Photo.query.join(Face, Face.photo_id == Photo.id)
                .join(Person, Person.id == Face.person_id)
                .filter(func.lower(Person.name).contains(query))
                .with_entities(Photo.id)
            )
        )

    if date_from:
        try:
            start = datetime.fromisoformat(date_from)
            photos_query = photos_query.filter(Photo.uploaded_at >= start)
        except ValueError:
            return jsonify({"error": "Invalid date_from. Use ISO format YYYY-MM-DD"}), 400

    if date_to:
        try:
            end = datetime.fromisoformat(date_to)
            photos_query = photos_query.filter(Photo.uploaded_at <= end)
        except ValueError:
            return jsonify({"error": "Invalid date_to. Use ISO format YYYY-MM-DD"}), 400

    photos = photos_query.order_by(Photo.uploaded_at.desc()).all()
    unique = {photo.id: photo for photo in photos}

    return jsonify({"photos": [photo_to_api(photo) for photo in unique.values()]})
