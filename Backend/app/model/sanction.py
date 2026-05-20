"""Sanction model — penalty applied to a vehicle owner who fails to pay.

Per epic #20: if the owner does not pay, they receive a *severe* sanction.
A sanction is raised automatically when a Payment is marked ``defaulted``.
It stays ``active`` until explicitly resolved (e.g. the debt is settled).
"""

from datetime import datetime

from sqlalchemy import ForeignKey

from app.database import db

SEVERITY_SEVERE = 'severe'

STATUS_ACTIVE = 'active'
STATUS_RESOLVED = 'resolved'


class Sanction(db.Model):
    __tablename__ = 'sanctions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, ForeignKey('users.id'), nullable=False, index=True
    )
    payment_id = db.Column(
        db.Integer, ForeignKey('payments.id'), nullable=True
    )
    reason = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(20), nullable=False, default=SEVERITY_SEVERE)
    # Monetary penalty owed by the user (covers what the app paid + a fee).
    amount = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default=STATUS_ACTIVE)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'payment_id': self.payment_id,
            'reason': self.reason,
            'severity': self.severity,
            'amount': self.amount,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }
