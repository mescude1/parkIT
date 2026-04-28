from datetime import datetime

from app.database import db


class Conversation(db.Model):
    """
    A conversation thread.

    Two flavors are supported:
        - Legacy "support" thread: tied to a single user (user_id) and an
          agent role (the original chat_admin flow). client_id/valet_id and
          valet_request_id are NULL.
        - "service" thread: links a cliente and a valet around a specific
          ValetRequest. Both participants are stored explicitly.

    The ``kind`` column lets the API discriminate between the two without
    having to inspect the FK columns.
    """

    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    valet_request_id = db.Column(
        db.Integer, db.ForeignKey('valet_requests.id'), nullable=True, index=True
    )
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    valet_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    kind = db.Column(db.String(20), nullable=False, default='support')
    status = db.Column(db.String(20), nullable=False, default='open')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def has_participant(self, user_id: int) -> bool:
        """Return True if the given user is a participant in this conversation."""
        return user_id in {self.user_id, self.client_id, self.valet_id}

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'valet_request_id': self.valet_request_id,
            'client_id': self.client_id,
            'valet_id': self.valet_id,
            'kind': self.kind,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
