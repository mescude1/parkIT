from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.model.repository.user_repository import UserRepository

bp_display = Blueprint('display', __name__, url_prefix='/display')


@bp_display.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    data = request.get_json()
    token = data.get('token') if data else None

    if not token:
        return jsonify({"error": "Missing token"}), 400

    user_data = UserRepository.get_user_from_token(token)
    if not user_data:
        return jsonify({"error": "Invalid token"}), 401

    name = user_data['name']
    services = user_data['services'][-3:][::-1]  # Last 3 services, most recent first

    return jsonify({'status': 'success', 'message': {
        "name": name,
        "last_services": services
    }}), 200


@bp_display.route('/services', methods=['GET'])
@jwt_required()
def get_services():
    return jsonify({'status': 'success', 'message': 'List of services'}), 200


@bp_display.route('/vehicles', methods=['GET'])
@jwt_required()
def get_vehicles():
    return jsonify({'status': 'success', 'message': 'List of vehicles'}), 200
