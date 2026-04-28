"""Belonging model — items that the cliente declares are inside the vehicle.

Each entry can carry one or more photos (stored as a JSON-encoded list of URLs
in ``photos_json``). After the service ends the cliente may flag an item as
``reported_missing=True``, which then becomes the valet's responsibility per
the project's acceptance criteria.
"""

import json
from datetime import datetime

from sqlalchemy import ForeignKey

from app.database import db


class Belonging(db.Model):
    __tablename__ = 'belongings'

    id = db.Column(db.Integer, primary_key=True)
    valet_request_id = db.Column(
        db.Integer, ForeignKey('valet_requests.id'), nullable=False, index=True
    )
    service_id = db.Column(
        db.Integer, ForeignKey('services.id'), nullable=True, index=True
    )
    owner_id = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    # JSON-encoded list of photo URLs.
    photos_json = db.Column(db.Text, nullable=True)
    reported_missing = db.Column(db.Boolean, nullable=False, default=False)
    missing_reported_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)

    # ---- helpers --------------------------------------------------------

    @property
    def photos(self):
        if not self.photos_json:
            return []
        try:
            data = json.loads(self.photos_json)
            return data if isinstance(data, list) else []
        except (ValueError, TypeError):
            return []

    @photos.setter
    def photos(self, value):
        self.photos_json = json.dumps(value or [])

    def to_dict(self):
        return {
            'id': self.id,
            'valet_request_id': self.valet_request_id,
            'service_id': self.service_id,
            'owner_id': self.owner_id,
            'description': self.description,
            'quantity': self.quantity,
            'photos': self.photos,
            'reported_missing': self.reported_missing,
            'missing_reported_at': (
                self.missing_reported_at.isoformat()
                if self.missing_reported_at
                else None
            ),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
