from pathlib import Path

from flask import current_app, url_for

from models import Photo


def _relative_media_path(photo: Photo) -> str:
    upload_folder = Path(current_app.config["UPLOAD_FOLDER"]).resolve()
    photo_path = Path(photo.file_path).resolve()

    try:
        relative = photo_path.relative_to(upload_folder)
        return str(relative).replace("\\", "/")
    except ValueError:
        return photo_path.name


def photo_to_api(photo: Photo) -> dict:
    payload = photo.to_dict()
    payload["url"] = url_for("media.get_upload", relative_path=_relative_media_path(photo), _external=False)
    payload["title"] = photo.filename
    payload["date"] = payload.get("uploaded_at")
    payload["tags"] = [face["person_name"] for face in payload.get("faces", []) if face.get("person_name")]
    return payload
