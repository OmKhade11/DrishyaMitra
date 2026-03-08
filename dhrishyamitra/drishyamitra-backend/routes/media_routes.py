from pathlib import Path

from flask import Blueprint, current_app, send_from_directory


media_bp = Blueprint("media", __name__, url_prefix="/api/uploads")


@media_bp.get("/<path:relative_path>")
def get_upload(relative_path: str):
    upload_folder = Path(current_app.config["UPLOAD_FOLDER"]).resolve()
    return send_from_directory(str(upload_folder), relative_path)
