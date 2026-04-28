"""HTTP endpoints for the key-handover flow.

Only the assigned valet of a service may register the drop-off. Both parties
(cliente and valet) of the service may read the record. The cliente confirms
collection by hitting ``/keys/<id>/return``.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database import db
from app.model import KeyHandover, Service

bp_keys = Blueprint('key_handover', __name__, url_prefix='/keys')


def _participants(service: Service):
    """Return (client_id, valet_id) for a Service."""
    return service.user_id, service.driver_id


@bp_keys.route('/dropoff', methods=['POST'])
@jwt_required()
def dropoff():
    """Valet registers the location of the keys with photo evidence."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    service_id = data.get('service_id')
    location_label = (data.get('location_label') or '').strip()
    evidence_photo = data.get('evidence_photo')

    if not service_id or not location_label or not evidence_photo:
        return jsonify({
            'status': 'error',
            'message': 'service_id, location_label and evidence_photo are required',
        }), 400

    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404

    if service.driver_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Only the assigned valet may register the keys',
        }), 403

    existing = KeyHandover.query.filter_by(service_id=service_id).first()
    if existing:
        return jsonify({
            'status': 'error',
            'message': 'Key handover already registered for this service',
            'handover': existing.to_dict(),
        }), 409

    handover = KeyHandover(
        service_id=service_id,
        valet_id=user_id,
        location_label=location_label,
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        evidence_photo=evidence_photo,
        notes=data.get('notes'),
        status='stored',
        stored_at=datetime.utcnow(),
    )
    db.session.add(handover)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Keys registered',
        'handover': handover.to_dict(),
    }), 201


@bp_keys.route('/by-service/<int:service_id>', methods=['GET'])
@jwt_required()
def by_service(service_id):
    user_id = int(get_jwt_identity())
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404

    client_id, valet_id = _participants(service)
    if user_id not in (client_id, valet_id):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    handover = KeyHandover.query.filter_by(service_id=service_id).first()
    if not handover:
        return jsonify({'status': 'success', 'handover': None}), 200
    return jsonify({'status': 'success', 'handover': handover.to_dict()}), 200


@bp_keys.route('/<int:handover_id>/return', methods=['POST'])
@jwt_required()
def return_keys(handover_id):
    """Mark the keys as returned to the cliente."""
    user_id = int(get_jwt_identity())
    handover = KeyHandover.query.get(handover_id)
    if not handover:
        return jsonify({'status': 'error', 'message': 'Handover not found'}), 404

    service = Service.query.get(handover.service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404

    if user_id not in (service.user_id, service.driver_id):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    handover.status = 'returned'
    handover.returned_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'success', 'handover': handover.to_dict()}), 200
