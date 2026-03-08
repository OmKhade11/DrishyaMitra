import mimetypes
import os
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from models import Face, Photo, db
from routes.serializers import photo_to_api
from services.face_service import FaceService
from werkzeug.utils import secure_filename


upload_bp = Blueprint("upload", __name__, url_prefix="/api")
face_service = FaceService()


def _store_photo(file_path: Path, user_id: int | None = None) -> Photo:
    size = file_path.stat().st_size if file_path.exists() else None
    mime_type = mimetypes.guess_type(file_path.name)[0]

    photo = Photo(
        filename=file_path.name,
        file_path=str(file_path),
        mime_type=mime_type,
        size_bytes=size,
        user_id=user_id,
    )
    db.session.add(photo)
    db.session.flush()

    faces = face_service.detect_faces(str(file_path), detector_backend="multi")
    for face_data in faces:
        bbox = face_data["bbox"]
        db.session.add(
            Face(
                photo_id=photo.id,
                detector=face_data.get("detector", "multi"),
                confidence=face_data.get("confidence"),
                bbox_x=bbox["x"],
                bbox_y=bbox["y"],
                bbox_w=bbox["w"],
                bbox_h=bbox["h"],
            )
        )

    return photo


@upload_bp.post("/upload")
def upload_photo() -> tuple:
    if "photo" not in request.files:
        return jsonify({"error": "No photo uploaded"}), 400

    file = request.files["photo"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)

    upload_folder = Path(current_app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)

    destination = upload_folder / filename
    suffix = 1
    while destination.exists():
        stem, ext = os.path.splitext(filename)
        destination = upload_folder / f"{stem}_{suffix}{ext}"
        suffix += 1

    file.save(destination)

    verify_jwt_in_request(optional=True)
    user_id = get_jwt_identity()

    photo = _store_photo(destination, user_id=int(user_id) if user_id else None)
    db.session.commit()

    photo = Photo.query.get(photo.id)
    return jsonify({"message": "Photo uploaded successfully", "photo": photo_to_api(photo)}), 201


@upload_bp.post("/library/import-folder")
def import_folder() -> tuple:
    data = request.get_json(silent=True) or {}
    folder_path = (data.get("folder_path") or "").strip()
    recursive = bool(data.get("recursive", True))
    limit = int(data.get("limit", 500))

    if not folder_path:
        return jsonify({"error": "folder_path is required"}), 400

    source = Path(folder_path)
    if not source.exists() or not source.is_dir():
        return jsonify({"error": "folder_path does not exist or is not a directory"}), 400

    exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    files = source.rglob("*") if recursive else source.glob("*")

    upload_folder = Path(current_app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)

    imported = []
    skipped = 0

    for item in files:
        if len(imported) >= limit:
            break
        if not item.is_file() or item.suffix.lower() not in exts:
            continue

        dest_name = secure_filename(item.name)
        destination = upload_folder / dest_name
        suffix = 1
        while destination.exists():
            stem, ext = os.path.splitext(dest_name)
            destination = upload_folder / f"{stem}_{suffix}{ext}"
            suffix += 1

        try:
            destination.write_bytes(item.read_bytes())
            photo = _store_photo(destination)
            imported.append(photo.id)
        except Exception:
            skipped += 1

    db.session.commit()

    photos = Photo.query.filter(Photo.id.in_(imported)).order_by(Photo.uploaded_at.desc()).all() if imported else []
    return jsonify(
        {
            "message": "Folder import completed",
            "imported_count": len(imported),
            "skipped_count": skipped,
            "photos": [photo_to_api(photo) for photo in photos],
        }
    )


@upload_bp.get("/photos")
def list_photos() -> tuple:
    photos = Photo.query.order_by(Photo.uploaded_at.desc()).all()
    return jsonify({"photos": [photo_to_api(photo) for photo in photos]})


@upload_bp.get("/photos/<int:photo_id>")
def get_photo(photo_id: int) -> tuple:
    photo = Photo.query.get(photo_id)
    if not photo:
        return jsonify({"error": "Photo not found"}), 404
    return jsonify({"photo": photo_to_api(photo)})


@upload_bp.delete("/photos/<int:photo_id>")
def delete_photo(photo_id: int) -> tuple:
    photo = Photo.query.get(photo_id)
    if not photo:
        return jsonify({"error": "Photo not found"}), 404

    path = Path(photo.file_path)
    if path.exists():
        path.unlink()

    db.session.delete(photo)
    db.session.commit()

    return jsonify({"message": "Photo deleted"})
