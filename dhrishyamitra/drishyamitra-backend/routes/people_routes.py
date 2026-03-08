from sqlalchemy import func

from flask import Blueprint, jsonify, request

from models import Face, Person, Photo, db
from routes.serializers import photo_to_api
from services.background_service import BackgroundService


people_bp = Blueprint("people", __name__, url_prefix="/api")
background_service = BackgroundService()


@people_bp.get("/people")
def list_people() -> tuple:
    people = Person.query.order_by(Person.name.asc()).all()

    response = []
    for person in people:
        count = Face.query.filter_by(person_id=person.id).count()
        response.append(
            {
                **person.to_dict(),
                "photo_count": count,
            }
        )

    unknown_faces = Face.query.filter(Face.person_id.is_(None)).count()
    total_faces = Face.query.count()

    return jsonify({
        "people": response,
        "unknown_faces": unknown_faces,
        "total_faces": total_faces,
    })


@people_bp.get("/people/summary")
def people_summary() -> tuple:
    return jsonify(
        {
            "recognized_people": Person.query.count(),
            "recognized_faces": Face.query.filter(Face.person_id.is_not(None)).count(),
            "unknown_faces": Face.query.filter(Face.person_id.is_(None)).count(),
            "total_faces": Face.query.count(),
            "photos_scanned": Photo.query.join(Face, Face.photo_id == Photo.id).distinct(Photo.id).count(),
            "total_photos": Photo.query.count(),
        }
    )


@people_bp.post("/people")
def create_person() -> tuple:
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    existing = Person.query.filter(func.lower(Person.name) == name.lower()).first()
    if existing:
        return jsonify({"person": existing.to_dict(), "message": "Person already exists"}), 200

    person = Person(name=name)
    db.session.add(person)
    db.session.commit()
    return jsonify({"person": person.to_dict()}), 201


@people_bp.patch("/people/<int:person_id>")
def rename_person(person_id: int) -> tuple:
    person = Person.query.get(person_id)
    if not person:
        return jsonify({"error": "Person not found"}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    person.name = name
    db.session.commit()
    return jsonify({"person": person.to_dict()})


@people_bp.delete("/people/<int:person_id>")
def delete_person(person_id: int) -> tuple:
    person = Person.query.get(person_id)
    if not person:
        return jsonify({"error": "Person not found"}), 404

    Face.query.filter_by(person_id=person_id).update({Face.person_id: None})
    db.session.delete(person)
    db.session.commit()

    return jsonify({"message": "Person deleted"})


@people_bp.post("/people/<int:person_id>/auto-match")
def auto_match_person_faces(person_id: int) -> tuple:
    person = Person.query.get(person_id)
    if not person:
        return jsonify({"error": "Person not found"}), 404

    matched = background_service.auto_label_unknown_faces(target_person_id=person_id)
    return jsonify({"person": person.to_dict(), "auto_matched_faces": matched})


@people_bp.post("/people/<int:person_id>/train-match")
def train_and_match_person(person_id: int) -> tuple:
    person = Person.query.get(person_id)
    if not person:
        return jsonify({"error": "Person not found"}), 404

    data = request.get_json(silent=True) or {}
    photo_ids = data.get("photo_ids")
    threshold = float(data.get("threshold", 0.55))
    force_redetect = bool(data.get("force_redetect", True))
    force_assign = bool(data.get("force_assign", False))

    if photo_ids is not None and not isinstance(photo_ids, list):
        return jsonify({"error": "photo_ids must be a list of integers"}), 400

    try:
        normalized_photo_ids = [int(pid) for pid in photo_ids] if photo_ids else None
    except Exception:
        return jsonify({"error": "photo_ids must contain integers only"}), 400

    result = background_service.train_and_match_person(
        person_id=person_id,
        photo_ids=normalized_photo_ids,
        threshold=threshold,
        force_redetect=force_redetect,
        force_assign=force_assign,
    )

    return jsonify({"person": person.to_dict(), **result})


@people_bp.post("/people/<int:person_id>/scan-train-match")
def scan_train_match_person(person_id: int) -> tuple:
    person = Person.query.get(person_id)
    if not person:
        return jsonify({"error": "Person not found"}), 404

    data = request.get_json(silent=True) or {}
    threshold = float(data.get("threshold", 0.60))
    force_assign_remaining = bool(data.get("force_assign_remaining", True))
    limit = int(data.get("limit", 2000))

    result = background_service.scan_train_match_person(
        person_id=person_id,
        threshold=threshold,
        force_assign_remaining=force_assign_remaining,
        limit=limit,
    )

    return jsonify({"person": person.to_dict(), **result})


@people_bp.get("/people/<int:person_id>/photos")
def person_photos(person_id: int) -> tuple:
    person = Person.query.get(person_id)
    if not person:
        return jsonify({"error": "Person not found"}), 404

    photos = (
        Photo.query.join(Face, Face.photo_id == Photo.id)
        .filter(Face.person_id == person_id)
        .order_by(Photo.uploaded_at.desc())
        .all()
    )
    dedup = {photo.id: photo for photo in photos}
    return jsonify({"person": person.to_dict(), "photos": [photo_to_api(photo) for photo in dedup.values()]})


@people_bp.patch("/faces/<int:face_id>/label")
def label_face(face_id: int) -> tuple:
    face = Face.query.get(face_id)
    if not face:
        return jsonify({"error": "Face not found"}), 404

    data = request.get_json(silent=True) or {}
    person_id = data.get("person_id")
    person_name = (data.get("person_name") or "").strip()

    person = None
    if person_id is not None:
        person = Person.query.get(person_id)
        if not person:
            return jsonify({"error": "Person not found"}), 404
    elif person_name:
        person = Person.query.filter(func.lower(Person.name) == person_name.lower()).first()
        if not person:
            person = Person(name=person_name)
            db.session.add(person)
            db.session.flush()
    else:
        return jsonify({"error": "person_id or person_name required"}), 400

    face.person_id = person.id
    db.session.commit()

    auto_matched_faces = background_service.auto_label_unknown_faces(target_person_id=person.id)

    return jsonify({
        "face": face.to_dict(),
        "person": person.to_dict(),
        "auto_matched_faces": auto_matched_faces,
    })
