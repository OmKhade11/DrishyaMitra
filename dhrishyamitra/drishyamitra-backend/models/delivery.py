from datetime import datetime

from .db import db


class DeliveryHistory(db.Model):
    __tablename__ = "delivery_history"

    id = db.Column(db.Integer, primary_key=True)
    photo_id = db.Column(db.Integer, db.ForeignKey("photos.id"), nullable=False, index=True)

    channel = db.Column(db.String(30), nullable=False)
    recipient = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="pending")
    message = db.Column(db.Text, nullable=True)
    external_id = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    photo = db.relationship("Photo", back_populates="deliveries")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "photo_id": self.photo_id,
            "channel": self.channel,
            "recipient": self.recipient,
            "status": self.status,
            "message": self.message,
            "external_id": self.external_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
