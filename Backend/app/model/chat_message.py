from datetime import datetime

from app.database import db


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey('conversations.id'), nullable=False
    )
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # 'user' / 'agent' for legacy support threads, 'cliente' / 'valet' for
    # service threads.
    sender_role = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    # Optional image (or other media) attached to the message.
    attachment_url = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'sender_role': self.sender_role,
            'message': self.message,
            'attachment_url': self.attachment_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
