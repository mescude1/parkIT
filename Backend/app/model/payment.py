"""Payment model — guarantees the valet's pay for a completed service.

Lifecycle (epic #20, "Pago al Valet"):

    pending ──pay──> paid
       │
       └──default──> defaulted ──> covered_by_app

If the vehicle owner does not pay, the request is marked ``defaulted`` and
the platform takes over the payment (``covered_by_app``) so the valet still
gets their money. Defaulting also raises a Sanction against the owner.

Payment processing is simulated: there is no real gateway. The ``status``
column plus timestamps are the source of truth.
"""

from datetime import datetime

from sqlalchemy import ForeignKey

from app.database import db

PAYMENT_PENDING = 'pending'
PAYMENT_PAID = 'paid'
PAYMENT_DEFAULTED = 'defaulted'
PAYMENT_COVERED = 'covered_by_app'

VALID_PAYMENT_STATUSES = {
    PAYMENT_PENDING, PAYMENT_PAID, PAYMENT_DEFAULTED, PAYMENT_COVERED,
}


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(
        db.Integer, ForeignKey('services.id'), nullable=False, index=True
    )
    payer_id = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    payee_id = db.Column(db.Integer, ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='COP')
    status = db.Column(db.String(20), nullable=False, default=PAYMENT_PENDING)
    method = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'service_id': self.service_id,
            'payer_id': self.payer_id,
            'payee_id': self.payee_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'method': self.method,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
        }
