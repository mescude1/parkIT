from datetime import datetime

from flask import Blueprint, jsonify, request, render_template
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database import db
from app.model import User, Conversation, ChatMessage, ValetRequest

bp_chat = Blueprint('chat', __name__, url_prefix='/chat')


# ---------------------------------------------------------------------------
# Legacy "support" thread (cliente <-> agente)
# ---------------------------------------------------------------------------

@bp_chat.route('/conversation', methods=['POST'])
@jwt_required()
def get_or_create_conversation():
    """Get the user's open support conversation, or create one if none exists."""
    user_id = int(get_jwt_identity())

    conversation = Conversation.query.filter_by(
        user_id=user_id, kind='support', status='open'
    ).first()

    if not conversation:
        conversation = Conversation(
            user_id=user_id,
            kind='support',
            status='open',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(conversation)
        db.session.commit()

    return jsonify({
        "status": "success",
        "conversation": conversation.to_dict()
    }), 200


# ---------------------------------------------------------------------------
# Service thread (cliente <-> valet) tied to a ValetRequest
# ---------------------------------------------------------------------------

@bp_chat.route('/conversation/by-request/<int:request_id>', methods=['POST'])
@jwt_required()
def get_or_create_service_conversation(request_id):
    """Get-or-create the cliente<->valet conversation for a given ValetRequest.

    The request must be in 'accepted' status (so we know who the valet is).
    Only the cliente or the assigned valet may open this conversation.
    """
    user_id = int(get_jwt_identity())
    valet_request = ValetRequest.query.get(request_id)

    if not valet_request:
        return jsonify({"status": "error", "message": "Request not found"}), 404

    if valet_request.status != 'accepted' or not valet_request.accepted_by:
        return jsonify({
            "status": "error",
            "message": "Conversation is only available once a valet has accepted the request",
        }), 400

    if user_id not in (valet_request.client_id, valet_request.accepted_by):
        return jsonify({"status": "error", "message": "Forbidden"}), 403

    conversation = Conversation.query.filter_by(
        valet_request_id=request_id, kind='service'
    ).first()

    if not conversation:
        conversation = Conversation(
            valet_request_id=request_id,
            client_id=valet_request.client_id,
            valet_id=valet_request.accepted_by,
            kind='service',
            status='open',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(conversation)
        db.session.commit()

    return jsonify({
        "status": "success",
        "conversation": conversation.to_dict(),
    }), 200


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@bp_chat.route('/conversation/<int:conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for a conversation. Supports ?since= for incremental polling."""
    user_id = int(get_jwt_identity())
    conversation = Conversation.query.get(conversation_id)

    if not conversation:
        return jsonify({"status": "error", "message": "Conversation not found"}), 404

    # Service threads are private to the two participants. Support threads
    # remain readable by any authenticated user (agent view).
    if conversation.kind == 'service' and not conversation.has_participant(user_id):
        return jsonify({"status": "error", "message": "Forbidden"}), 403

    since = request.args.get('since')
    query = ChatMessage.query.filter_by(conversation_id=conversation_id)

    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(ChatMessage.created_at > since_dt)
        except (ValueError, TypeError):
            pass

    messages = query.order_by(ChatMessage.created_at.asc()).all()

    return jsonify({
        "status": "success",
        "messages": [m.to_dict() for m in messages]
    }), 200


@bp_chat.route('/conversation/<int:conversation_id>/message', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    """Send a message in a conversation."""
    user_id = int(get_jwt_identity())
    conversation = Conversation.query.get(conversation_id)

    if not conversation:
        return jsonify({"status": "error", "message": "Conversation not found"}), 404

    data = request.get_json() or {}
    text = (data.get('message') or '').strip()
    attachment_url = data.get('attachment_url')

    if not text and not attachment_url:
        return jsonify({
            "status": "error",
            "message": "Message text or attachment is required",
        }), 400

    if conversation.kind == 'service':
        if not conversation.has_participant(user_id):
            return jsonify({"status": "error", "message": "Forbidden"}), 403
        if user_id == conversation.client_id:
            sender_role = 'cliente'
        elif user_id == conversation.valet_id:
            sender_role = 'valet'
        else:
            sender_role = 'cliente'
    else:
        sender_role = 'user' if user_id == conversation.user_id else 'agent'

    msg = ChatMessage(
        conversation_id=conversation_id,
        sender_id=user_id,
        sender_role=sender_role,
        message=text,
        attachment_url=attachment_url,
        created_at=datetime.utcnow(),
    )
    db.session.add(msg)
    conversation.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": msg.to_dict()
    }), 201


@bp_chat.route('/conversations', methods=['GET'])
@jwt_required()
def list_conversations():
    """List open support conversations (for admin/agent view)."""
    conversations = Conversation.query.filter_by(
        kind='support', status='open'
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        user = User.query.get(conv.user_id) if conv.user_id else None
        last_msg = ChatMessage.query.filter_by(
            conversation_id=conv.id
        ).order_by(ChatMessage.created_at.desc()).first()

        result.append({
            **conv.to_dict(),
            'user_name': f"{user.name} {user.last_name}" if user else "Unknown",
            'last_message': last_msg.message[:50] if last_msg else None,
            'last_message_at': last_msg.created_at.isoformat() if last_msg else None,
        })

    return jsonify({
        "status": "success",
        "conversations": result
    }), 200


@bp_chat.route('/admin', methods=['GET'])
def admin_page():
    """Serve the agent chat admin interface."""
    return render_template('chat_admin.html')
