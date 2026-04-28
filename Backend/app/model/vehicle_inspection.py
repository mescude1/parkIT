"""VehicleInspection — photo evidence of the vehicle before and after the
service, plus a record of any speed-limit violations during the trip.

Two related models live in this file because they share the same lifecycle
(both are created during a Service):

    - VehicleInspection: a set of photos at a given stage ('before' / 'after').
    - SpeedAlert: timestamped events when the valet exceeded the 10km/h limit
      while operating the vehicle.
"""

import json
from datetime import datetime

from sqlalchemy import ForeignKey

from app.database import db


class VehicleInspection(db.Model):
    __tablename__ = 'vehicle_inspections'

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(
        db.Integer, ForeignKey('services.id'), nullable=False, index=True
    )
    captured_by = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    # 'before' (vehicle pickup) | 'after' (vehicle return)
    stage = db.Column(db.String(10), nullable=False)
    photos_json = db.Column(db.Text, nullable=False, default='[]')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @property
    def photos(self):
        try:
            data = json.loads(self.photos_json or '[]')
            return data if isinstance(data, list) else []
        except (ValueError, TypeError):
            return []

    @photos.setter
    def photos(self, value):
        self.photos_json = json.dumps(value or [])

    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'captured_by': self.captured_by,
            'stage': self.stage,
            'photos': self.photos,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SpeedAlert(db.Model):
    __tablename__ = 'speed_alerts'

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(
        db.Integer, ForeignKey('services.id'), nullable=False, index=True
    )
    valet_id = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    speed_kmh = db.Column(db.Float, nullable=False)
    speed_limit_kmh = db.Column(db.Float, nullable=False, default=10.0)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'valet_id': self.valet_id,
            'speed_kmh': self.speed_kmh,
            'speed_limit_kmh': self.speed_limit_kmh,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
