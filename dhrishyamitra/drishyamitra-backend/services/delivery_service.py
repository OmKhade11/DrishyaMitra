import mimetypes
import smtplib
from email.message import EmailMessage
from pathlib import Path

import requests
from flask import current_app

from models import DeliveryHistory, Photo, db


class DeliveryService:
    def _create_history(self, photo_id: int, channel: str, recipient: str) -> DeliveryHistory:
        item = DeliveryHistory(
            photo_id=photo_id,
            channel=channel,
            recipient=recipient,
            status="pending",
        )
        db.session.add(item)
        db.session.flush()
        return item

    def _build_email_message(self, photo: Photo, sender: str, recipient: str, subject: str, body: str) -> EmailMessage:
        message = EmailMessage()
        message["From"] = sender
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)

        file_path = Path(photo.file_path)
        with file_path.open("rb") as file_handle:
            image_data = file_handle.read()

        mime_type = mimetypes.guess_type(photo.filename)[0] or "application/octet-stream"
        maintype, subtype = mime_type.split("/", maxsplit=1)
        message.add_attachment(image_data, maintype=maintype, subtype=subtype, filename=photo.filename)
        return message

    def _send_with_tls_or_ssl(self, server: str, port: int, use_tls: bool, username: str, password: str, message: EmailMessage):
        with smtplib.SMTP(server, port, timeout=20) as smtp:
            if use_tls:
                smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)

    def send_email(self, photo: Photo, recipient: str, subject: str, body: str) -> dict:
        record = self._create_history(photo.id, "email", recipient)

        cfg = current_app.config
        username = cfg.get("MAIL_USERNAME")
        password = cfg.get("MAIL_PASSWORD")

        if not username or not password:
            record.status = "failed"
            record.message = "MAIL_USERNAME / MAIL_PASSWORD missing"
            db.session.commit()
            return {"success": False, "history": record.to_dict()}

        sender = cfg.get("MAIL_FROM", username)
        message = self._build_email_message(photo, sender, recipient, subject, body)

        server = cfg.get("MAIL_SERVER", "smtp.gmail.com")
        port = int(cfg.get("MAIL_PORT", 587))
        use_tls = bool(cfg.get("MAIL_USE_TLS", True))

        try:
            self._send_with_tls_or_ssl(server, port, use_tls, username, password, message)
            record.status = "sent"
            record.message = f"Email sent via {server}:{port}"
            db.session.commit()
            return {"success": True, "history": record.to_dict()}
        except Exception as first_exc:
            try:
                # Fallback: some systems block 587/TLS; try SMTP SSL 465.
                with smtplib.SMTP_SSL(server, 465, timeout=20) as smtp:
                    smtp.login(username, password)
                    smtp.send_message(message)

                record.status = "sent"
                record.message = f"Email sent via {server}:465 (SSL fallback)"
                db.session.commit()
                return {"success": True, "history": record.to_dict()}
            except Exception as second_exc:
                record.status = "failed"
                record.message = f"primary={first_exc}; fallback={second_exc}"
                db.session.commit()
                return {"success": False, "history": record.to_dict()}

    def send_whatsapp(self, photo: Photo, recipient: str, caption: str = "") -> dict:
        record = self._create_history(photo.id, "whatsapp", recipient)

        api_url = current_app.config.get("WHATSAPP_API_URL")
        token = current_app.config.get("WHATSAPP_TOKEN")

        if not api_url or not token:
            record.status = "failed"
            record.message = "WHATSAPP_API_URL / WHATSAPP_TOKEN missing"
            db.session.commit()
            return {"success": False, "history": record.to_dict()}

        try:
            payload = {
                "to": recipient,
                "caption": caption,
                "media_url": photo.file_path,
            }
            headers = {"Authorization": f"Bearer {token}"}

            response = requests.post(api_url, json=payload, headers=headers, timeout=20)
            response.raise_for_status()

            record.status = "sent"
            record.message = "WhatsApp request accepted"
            record.external_id = str(response.status_code)
            db.session.commit()

            return {"success": True, "history": record.to_dict()}

        except Exception as exc:
            record.status = "failed"
            record.message = str(exc)
            db.session.commit()
            return {"success": False, "history": record.to_dict()}

    def list_history(self, photo_id: int | None = None) -> list[dict]:
        query = DeliveryHistory.query.order_by(DeliveryHistory.created_at.desc())
        if photo_id is not None:
            query = query.filter_by(photo_id=photo_id)
        return [item.to_dict() for item in query.all()]
