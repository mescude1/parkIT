"""HTTP endpoints for the Belongings (pertenencias) module.

Allows the cliente (vehicle owner) to declare items inside their vehicle
before / during a valet service, attach photos, and later flag any item as
missing. The valet may read the list (read-only) so they know what's onboard.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database import db
from app.model import Belonging, ValetRequest

bp_belongings = Blueprint('belongings', __name__, url_prefix='/belongings')


def _can_view_request(user_id: int, valet_request: ValetRequest) -> bool:
    """The owner (cliente) and the assigned valet can view belongings."""
    return user_id == valet_request.client_id or user_id == valet_request.accepted_by


@bp_belongings.route('/by-request/<int:request_id>', methods=['GET'])
@jwt_required()
def list_for_request(request_id):
    user_id = int(get_jwt_identity())
    valet_request = ValetRequest.query.get(request_id)
    if not valet_request:
        return jsonify({'status': 'error', 'message': 'Request not found'}), 404
    if not _can_view_request(user_id, valet_request):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    items = Belonging.query.filter_by(
        valet_request_id=request_id, is_deleted=False
    ).order_by(Belonging.created_at.asc()).all()

    return jsonify({
        'status': 'success',
        'belongings': [b.to_dict() for b in items],
    }), 200


@bp_belongings.route('', methods=['POST'])
@jwt_required()
def create_belonging():
    """Create a belonging entry. Only the cliente (request owner) may create."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    request_id = data.get('valet_request_id')
    description = (data.get('description') or '').strip()
    quantity = data.get('quantity', 1)
    photos = data.get('photos') or []

    if not request_id or not description:
        return jsonify({
            'status': 'error',
            'message': 'valet_request_id and description are required',
        }), 400

    try:
        quantity = int(quantity)
        if quantity < 1:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({
            'status': 'error',
            'message': 'quantity must be a positive integer',
        }), 400

    valet_request = ValetRequest.query.get(request_id)
    if not valet_request:
        return jsonify({'status': 'error', 'message': 'Request not found'}), 404
    if user_id != valet_request.client_id:
        return jsonify({
            'status': 'error',
            'message': 'Only the client may declare belongings',
        }), 403

    item = Belonging(
        valet_request_id=request_id,
        service_id=valet_request.service_id,
        owner_id=user_id,
        description=description,
        quantity=quantity,
    )
    item.photos = photos if isinstance(photos, list) else []
    db.session.add(item)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Belonging registered',
        'belonging': item.to_dict(),
    }), 201


@bp_belongings.route('/<int:belonging_id>', methods=['PATCH'])
@jwt_required()
def update_belonging(belonging_id):
    """Update fields on a belonging.

    The cliente may edit description / quantity / photos.
    Either party may toggle ``reported_missing`` (cliente reports it; the
    backend timestamps when the flag flips to True).
    """
    user_id = int(get_jwt_identity())
    item = Belonging.query.filter_by(id=belonging_id, is_deleted=False).first()
    if not item:
        return jsonify({'status': 'error', 'message': 'Belonging not found'}), 404

    valet_request = ValetRequest.query.get(item.valet_request_id)
    if not valet_request or not _can_view_request(user_id, valet_request):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    data = request.get_json() or {}
    is_owner = user_id == item.owner_id

    if 'description' in data and is_owner:
        item.description = (data['description'] or '').strip() or item.description
    if 'quantity' in data and is_owner:
        try:
            q = int(data['quantity'])
            if q >= 1:
                item.quantity = q
        except (TypeError, ValueError):
            pass
    if 'photos' in data and is_owner and isinstance(data['photos'], list):
        item.photos = data['photos']
    if 'reported_missing' in data and is_owner:
        new_flag = bool(data['reported_missing'])
        if new_flag and not item.reported_missing:
            item.missing_reported_at = datetime.utcnow()
        item.reported_missing = new_flag

    db.session.commit()
    return jsonify({'status': 'success', 'belonging': item.to_dict()}), 200


@bp_belongings.route('/<int:belonging_id>', methods=['DELETE'])
@jwt_required()
def delete_belonging(belonging_id):
    user_id = int(get_jwt_identity())
    item = Belonging.query.filter_by(id=belonging_id, is_deleted=False).first()
    if not item:
        return jsonify({'status': 'error', 'message': 'Belonging not found'}), 404
    if user_id != item.owner_id:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    item.is_deleted = True
    db.session.commit()
    return jsonify({'status': 'success'}), 200
