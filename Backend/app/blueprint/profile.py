from datetime import datetime

from flask import Blueprint, request, jsonify, abort, Response, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app.database import db
from app.model import User

bp_profile = Blueprint('profile', __name__, url_prefix='/profile')


@bp_profile.route('/register', methods=('POST',))
def register() -> Response:
    """Register a new user.

    Returns:
        response: flask.Response object with the application/json mimetype.
    """

    if not request.is_json:
        abort(400)

    data = request.get_json()

    # Verificar que los datos requeridos están presentes
    required_fields = ["username", "password", "name", "last_name", "email",
                       "cellphone", "type", "profile_img", "id_img",
                       "driver_license_img", "contract", "vehicle_type"]

    for field in required_fields:
        if field not in data:
            return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400

    username = data.get('username')
    password = data.get('password')

    if not (username and password):
        return jsonify({'status': 'error', 'message': 'username and password are required'}), 400

    new_user = User()
    new_user.username = username
    new_user.password_hash = password

    new_user.name = data.get("name")
    new_user.last_name = data.get("last_name")
    new_user.email = data.get("email")
    new_user.cellphone = data.get("cellphone")
    new_user.type = data.get("type")
    new_user.profile_img = data.get("profile_img")
    new_user.id_img = data.get("id_img")
    new_user.driver_license_img = data.get("driver_license_img")
    new_user.contract = data.get("contract")
    new_user.vehicle_type = data.get("vehicle_type")
    new_user.is_deleted = False
    new_user.created_at = datetime.utcnow()

    # Guardar en la base de datos
    db.session.add(new_user)
    db.session.commit()

    # Crear un token JWT para el usuario registrado
    access_token = create_access_token(identity=str(new_user.id))

    return make_response(jsonify(
        {'status': 'success', 'message': 'User registered', 'access_token': access_token}
    ), 201)


@bp_profile.route('/user-profile', methods=['GET'])
@jwt_required()
def get_profile() -> Response:
    """Obtener datos del perfil del usuario autenticado."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404

    return make_response(jsonify({'status': 'success', 'message': 'Profile data', 'user': user.to_dict()}), 200)


@bp_profile.route('/edit-profile', methods=['POST'])
@jwt_required()
def edit_profile() -> Response:
    """Actualizar todos los datos del perfil del usuario autenticado."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return make_response(jsonify({'status': 'error', 'message': 'User not found'}), 404)

    data = request.json
    if not data:
        return make_response(jsonify({'status': 'error', 'message': 'No data provided'}), 400)

    # Lista de campos editables (excluyendo ID y datos internos)
    editable_fields = [
        "username", "name", "last_name", "email", "cellphone",
        "type", "profile_img", "id_img", "driver_license_img",
        "contract", "vehicle_type"
    ]

    for key, value in data.items():
        if key == "password":
            user.password_hash = value
        elif key in editable_fields:
            setattr(user, key, value)

    db.session.commit()
    return make_response(jsonify({'status': 'success', 'message': 'Profile updated successfully'}), 200)


@bp_profile.route('/generate-enrollment-contracts', methods=['POST'])
@jwt_required()
def generate_enrollment_contracts():
    """Generar contratos de inscripción para el usuario autenticado."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return make_response(jsonify({'status': 'error', 'message': 'User not found'}), 404)

    data = request.json
    user.contract = data.get("contract", user.contract)

    db.session.commit()
    return make_response(jsonify({'status': 'success', 'message': 'Enrollment contracts generated'}), 200)
