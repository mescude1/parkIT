"""HTTP endpoints for VehicleInspection (before/after photos) and SpeedAlerts.

The valet captures inspection photos before taking custody of the vehicle and
again before handing it back. The cliente can view both. The mobile client
should push a SpeedAlert whenever the device-measured speed exceeds 10km/h.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database import db
from app.model import Service
from app.model.vehicle_inspection import VehicleInspection, SpeedAlert

bp_inspection = Blueprint('inspection', __name__, url_prefix='/inspection')

SPEED_LIMIT_KMH = 10.0
VALID_STAGES = {'before', 'after'}


@bp_inspection.route('', methods=['POST'])
@jwt_required()
def create_inspection():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    service_id = data.get('service_id')
    stage = data.get('stage')
    photos = data.get('photos') or []

    if not service_id or stage not in VALID_STAGES:
        return jsonify({
            'status': 'error',
            'message': 'service_id and a valid stage (before|after) are required',
        }), 400
    if not isinstance(photos, list) or len(photos) == 0:
        return jsonify({
            'status': 'error',
            'message': 'At least one photo is required',
        }), 400

    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404
    if service.driver_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Only the assigned valet may register inspections',
        }), 403

    inspection = VehicleInspection(
        service_id=service_id,
        captured_by=user_id,
        stage=stage,
        notes=data.get('notes'),
        created_at=datetime.utcnow(),
    )
    inspection.photos = photos
    db.session.add(inspection)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'inspection': inspection.to_dict(),
    }), 201


@bp_inspection.route('/by-service/<int:service_id>', methods=['GET'])
@jwt_required()
def list_for_service(service_id):
    user_id = int(get_jwt_identity())
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404
    if user_id not in (service.user_id, service.driver_id):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    inspections = VehicleInspection.query.filter_by(
        service_id=service_id
    ).order_by(VehicleInspection.created_at.asc()).all()

    alerts = SpeedAlert.query.filter_by(
        service_id=service_id
    ).order_by(SpeedAlert.created_at.asc()).all()

    return jsonify({
        'status': 'success',
        'inspections': [i.to_dict() for i in inspections],
        'speed_alerts': [a.to_dict() for a in alerts],
    }), 200


@bp_inspection.route('/speed-alert', methods=['POST'])
@jwt_required()
def speed_alert():
    """The valet's app reports an over-limit speed reading."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    service_id = data.get('service_id')
    speed_kmh = data.get('speed_kmh')

    if not service_id or speed_kmh is None:
        return jsonify({
            'status': 'error',
            'message': 'service_id and speed_kmh are required',
        }), 400

    try:
        speed_kmh = float(speed_kmh)
    except (TypeError, ValueError):
        return jsonify({
            'status': 'error',
            'message': 'speed_kmh must be a number',
        }), 400

    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404
    if service.driver_id != user_id:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    if speed_kmh <= SPEED_LIMIT_KMH:
        # Silently ignore — nothing to record. Returning 204 keeps the
        # client logic uniform without requiring a body.
        return ('', 204)

    alert = SpeedAlert(
        service_id=service_id,
        valet_id=user_id,
        speed_kmh=speed_kmh,
        speed_limit_kmh=SPEED_LIMIT_KMH,
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        created_at=datetime.utcnow(),
    )
    db.session.add(alert)
    db.session.commit()

    return jsonify({'status': 'success', 'alert': alert.to_dict()}), 201
