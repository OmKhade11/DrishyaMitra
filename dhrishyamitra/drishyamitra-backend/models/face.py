from datetime import datetime

from .db import db


class Person(db.Model):
    __tablename__ = "people"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    faces = db.relationship("Face", back_populates="person", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Face(db.Model):
    __tablename__ = "faces"

    id = db.Column(db.Integer, primary_key=True)
    photo_id = db.Column(db.Integer, db.ForeignKey("photos.id"), nullable=False, index=True)
    person_id = db.Column(db.Integer, db.ForeignKey("people.id"), nullable=True, index=True)

    detector = db.Column(db.String(50), nullable=False, default="opencv")
    confidence = db.Column(db.Float, nullable=True)

    bbox_x = db.Column(db.Integer, nullable=False)
    bbox_y = db.Column(db.Integer, nullable=False)
    bbox_w = db.Column(db.Integer, nullable=False)
    bbox_h = db.Column(db.Integer, nullable=False)

    detected_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    photo = db.relationship("Photo", back_populates="faces")
    person = db.relationship("Person", back_populates="faces")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "photo_id": self.photo_id,
            "person_id": self.person_id,
            "person_name": self.person.name if self.person else None,
            "detector": self.detector,
            "confidence": self.confidence,
            "bbox": {
                "x": self.bbox_x,
                "y": self.bbox_y,
                "w": self.bbox_w,
                "h": self.bbox_h,
            },
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
        }
