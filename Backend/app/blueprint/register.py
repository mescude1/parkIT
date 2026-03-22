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

VALET_USER_TYPE = 'valet'


def _generate_valet_code() -> str:
    """Genera un codigo unico para el valet en formato VAL-XXXXX.

    Busca el ultimo ID en la tabla y genera el siguiente codigo.
    Ejemplo: VAL-00001, VAL-00002, ...

    Returns:
        str: Codigo unico del valet.
    """
    last_valet = (
        User.query
        .filter_by(type=VALET_USER_TYPE)
        .order_by(User.id.desc())
        .first()
    )
    next_number = (last_valet.id + 1) if last_valet else 1
    return f'VAL-{next_number:05d}'


def _all_documents_present(data: dict) -> bool:
    """Verifica si todos los documentos requeridos para verificacion estan presentes.

    Parameters:
        data (dict): Datos del body de la peticion.

    Returns:
        bool: True si todos los documentos estan presentes.
    """
    required_docs = ['profile_img', 'id_img', 'student_card_img', 'driver_license_img']
    return all(data.get(doc) for doc in required_docs)


@bp_register.route('/valet', methods=('POST',))
def register_valet() -> Response:
    """Registro de un conductor interesado en proveer el servicio de valet parking.

    El conductor debe enviar sus datos personales junto con sus documentos
    de identificacion:
        - Cedula de ciudadania (id_img)
        - Carnet de estudiante o empleado (student_card_img)
        - Licencia de conduccion (driver_license_img)
        - Foto actual del conductor (profile_img)

    Al registrarse se genera automaticamente un codigo unico (ej: VAL-00123).
    Si todos los documentos estan presentes, is_verified se marca como True.

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
        201: Valet registrado exitosamente.
        400: Content-Type invalido.
        409: Username o email ya en uso.
        422: Campos requeridos faltantes o invalidos.
    """

    if not request.is_json:
        return make_response(jsonify({
            'status': 'error',
            'message': 'Content-Type debe ser application/json'
        }), 400)

    data = request.get_json()

    errors = _validate_valet_registration(data)
    if errors:
        return make_response(jsonify({
            'status': 'error',
            'message': 'Datos invalidos',
            'errors': errors
        }), 422)

    if User.query.filter_by(username=data['username']).first():
        return make_response(jsonify({
            'status': 'error',
            'message': 'El nombre de usuario ya esta en uso'
        }), 409)

    if User.query.filter_by(email=data['email']).first():
        return make_response(jsonify({
            'status': 'error',
            'message': 'El correo electronico ya esta registrado'
        }), 409)

    # Verificacion automatica: True si todos los documentos estan presentes
    is_verified = _all_documents_present(data)

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
        is_verified=is_verified,
        valet_code=_generate_valet_code(),
    )

    new_valet.password_hash = data['password']

    db.session.add(new_valet)
    db.session.commit()

    return make_response(jsonify({
        'status': 'success',
        'message': 'Valet registrado y verificado exitosamente.' if is_verified
        else 'Valet registrado. Documentos incompletos, pendiente de verificacion.',
        'data': new_valet.to_dict()
    }), 201)


@bp_register.route('/valet/identity/<string:valet_code>', methods=('GET',))
def get_valet_identity(valet_code: str) -> Response:
    """Consulta la identidad de un valet por su codigo unico.

    Permite al propietario del vehiculo verificar quien va a manejar su carro
    antes de entregar las llaves. Solo retorna valets verificados y activos.

    Parameters:
        valet_code (str): Codigo unico del valet (ej: VAL-00123).

    Returns:
        200: Datos publicos del valet verificado.
        403: El valet no esta verificado o no puede operar.
        404: Codigo de valet no encontrado.
    """

    valet = User.query.filter_by(valet_code=valet_code, type=VALET_USER_TYPE).first()

    if not valet:
        return make_response(jsonify({
            'status': 'error',
            'message': f'No se encontro un valet con el codigo {valet_code}'
        }), 404)

    if valet.is_deleted:
        return make_response(jsonify({
            'status': 'error',
            'message': 'Este valet no esta activo en el sistema'
        }), 403)

    if not valet.is_verified:
        return make_response(jsonify({
            'status': 'error',
            'message': 'Este valet no ha sido verificado y no puede operar'
        }), 403)

    # Solo se exponen datos publicos — no se retorna password ni datos sensibles
    return make_response(jsonify({
        'status': 'success',
        'data': {
            'valet_code': valet.valet_code,
            'name': valet.name,
            'last_name': valet.last_name,
            'profile_img': valet.profile_img,
            'id_img': valet.id_img,
            'vehicle_type': valet.vehicle_type,
            'is_verified': valet.is_verified,
        }
    }), 200)


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

    if data.get('password') and len(data['password']) < 6:
        errors.append({'password': 'La contrasena debe tener al menos 6 caracteres'})

    if data.get('email') and '@' not in data['email']:
        errors.append({'email': 'El formato del correo electronico es invalido'})

    return errors