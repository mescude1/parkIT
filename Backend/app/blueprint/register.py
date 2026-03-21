"""Blueprint to organize and group views related
to the '/register' endpoint of HTTP REST API.

Handles valet driver registration including personal data
and required identity documents.
"""

from datetime import datetime

from flask import Blueprint, Response, jsonify, make_response, request

from app.database import db
from app.model.user import User

bp_register = Blueprint('register', __name__, url_prefix='/register')

# Tipo de usuario valet
VALET_USER_TYPE = 'valet'


@bp_register.route('/valet', methods=('POST',))
def register_valet() -> Response:
    """Registro de un conductor interesado en proveer el servicio de valet parking.

    El conductor debe enviar sus datos personales junto con sus documentos
    de identificacion en formato base64 o como URLs:
        - Cedula de ciudadania (id_img)
        - Carnet de estudiante o empleado (student_card_img)
        - Licencia de conduccion (driver_license_img)
        - Foto actual del conductor (profile_img)

    Body JSON esperado:
        name (str): Nombre del conductor.
        last_name (str): Apellido del conductor.
        username (str): Nombre de usuario unico.
        password (str): Contrasena del conductor.
        email (str): Correo electronico.
        cellphone (str): Numero de celular.
        vehicle_type (str): Tipo de vehiculo que conduce.
        profile_img (str): Foto actual del conductor (URL o base64).
        id_img (str): Foto de cedula de ciudadania (URL o base64).
        student_card_img (str): Foto de carnet de estudiante o empleado (URL o base64).
        driver_license_img (str): Foto de licencia de conduccion (URL o base64).

    Returns:
        response: flask.Response object with the application/json mimetype.
    """

    if not request.is_json:
        return make_response(jsonify({
            'status': 'error',
            'message': 'Content-Type debe ser application/json'
        }), 400)

    data = request.get_json()

    # --- Validacion de campos requeridos ---
    errors = _validate_valet_registration(data)
    if errors:
        return make_response(jsonify({
            'status': 'error',
            'message': 'Datos invalidos',
            'errors': errors
        }), 422)

    # --- Verificar que el username no exista ya ---
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return make_response(jsonify({
            'status': 'error',
            'message': 'El nombre de usuario ya esta en uso'
        }), 409)

    # --- Verificar que el email no exista ya ---
    existing_email = User.query.filter_by(email=data['email']).first()
    if existing_email:
        return make_response(jsonify({
            'status': 'error',
            'message': 'El correo electronico ya esta registrado'
        }), 409)

    # --- Crear el usuario valet ---
    new_valet = User(
        name=data['name'],
        last_name=data['last_name'],
        username=data['username'],
        email=data['email'],
        cellphone=data['cellphone'],
        vehicle_type=data['vehicle_type'],
        type=VALET_USER_TYPE,
        profile_img=data['profile_img'],
        id_img=data['id_img'],
        student_card_img=data['student_card_img'],
        driver_license_img=data['driver_license_img'],
        contract='',
        created_at=datetime.utcnow(),
        is_deleted=False,
        is_verified=False,
    )

    # Usar el setter del modelo para hashear la contrasena
    new_valet.password_hash = data['password']

    db.session.add(new_valet)
    db.session.commit()

    return make_response(jsonify({
        'status': 'success',
        'message': 'Valet registrado exitosamente. Pendiente de verificacion.',
        'data': new_valet.to_dict()
    }), 201)


def _validate_valet_registration(data: dict) -> list:
    """Valida los campos requeridos para el registro de un valet.

    Parameters:
        data (dict): Datos del body de la peticion.

    Returns:
        list: Lista de errores encontrados. Vacia si todo es valido.
    """

    errors = []

    required_fields = {
        'name': 'El nombre es requerido',
        'last_name': 'El apellido es requerido',
        'username': 'El nombre de usuario es requerido',
        'password': 'La contrasena es requerida',
        'email': 'El correo electronico es requerido',
        'cellphone': 'El numero de celular es requerido',
        'vehicle_type': 'El tipo de vehiculo es requerido',
        'profile_img': 'La foto del conductor es requerida',
        'id_img': 'La foto de la cedula de ciudadania es requerida',
        'student_card_img': 'La foto del carnet de estudiante o empleado es requerida',
        'driver_license_img': 'La foto de la licencia de conduccion es requerida',
    }

    for field, message in required_fields.items():
        if not data.get(field):
            errors.append({field: message})

    # Validaciones de formato basicas
    if data.get('password') and len(data['password']) < 6:
        errors.append({'password': 'La contrasena debe tener al menos 6 caracteres'})

    if data.get('email') and '@' not in data['email']:
        errors.append({'email': 'El formato del correo electronico es invalido'})

    return errors