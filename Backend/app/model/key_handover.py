"""KeyHandover model — record of where the valet leaves the keys after parking.

The valet captures: drop-off location (free-text label + optional GPS) and
mandatory photo evidence so there's no ambiguity when the cliente later picks
up the vehicle. Status flips from 'stored' to 'returned' once the cliente
collects the keys back.
"""

from datetime import datetime

from sqlalchemy import ForeignKey

from app.database import db


class KeyHandover(db.Model):
    __tablename__ = 'key_handovers'

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(
        db.Integer, ForeignKey('services.id'), nullable=False, index=True
    )
    valet_id = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    location_label = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    evidence_photo = db.Column(db.String, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='stored')
    stored_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    returned_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'valet_id': self.valet_id,
            'location_label': self.location_label,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'evidence_photo': self.evidence_photo,
            'notes': self.notes,
            'status': self.status,
            'stored_at': self.stored_at.isoformat() if self.stored_at else None,
            'returned_at': self.returned_at.isoformat() if self.returned_at else None,
        }
