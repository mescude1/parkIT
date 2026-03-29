from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import db
from app.model import Vehicle

# Crear un Blueprint para manejar las rutas relacionadas con vehículos
bp_vehicles = Blueprint('vehicles', __name__, url_prefix='/vehicles')


@bp_vehicles.route('/new-vehicle', methods=['POST'])
@jwt_required()
def new_vehicle():
    """Registrar un nuevo vehículo."""
    if not request.is_json:
        abort(400)

    data = request.get_json()
    user_id = int(get_jwt_identity())

    # Lista de campos obligatorios
    required_fields = ["model", "brand", "license_plate", "year", "vehicle_img",
                       "proof_insurance_img", "property_card", "type"]

    # Validar que todos los campos requeridos estén presentes
    for field in required_fields:
        if field not in data:
            return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400

    # Crear un nuevo objeto Vehicle y asignar valores
    new_vehicle = Vehicle(
        model=data.get("model"),
        brand=data.get("brand"),
        license_plate=data.get("license_plate"),
        year=data.get("year"),
        vehicle_img=data.get("vehicle_img"),
        proof_insurance_img=data.get("proof_insurance_img"),
        property_card=data.get("property_card"),
        owner=user_id,
        type=data.get("type"),
        is_deleted=False
    )

    # Guardar el nuevo vehículo en la base de datos
    db.session.add(new_vehicle)
    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Vehicle registered', 'vehicle_id': new_vehicle.id}), 201


@bp_vehicles.route('/edit-vehicle/<int:vehicle_id>', methods=['POST'])
@jwt_required()
def edit_vehicle(vehicle_id):
    """Editar un vehículo existente."""
    user_id = int(get_jwt_identity())
    vehicle = Vehicle.query.filter_by(id=vehicle_id, owner=user_id).first()

    if not vehicle:
        return jsonify({'status': 'error', 'message': 'Vehicle not found'}), 404

    # Obtener los datos de la solicitud
    data = request.json
    for key, value in data.items():
        if hasattr(vehicle, key):
            setattr(vehicle, key, value)

    # Guardar cambios en la base de datos
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Vehicle updated'}), 200


@bp_vehicles.route('/vehicle/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    """Obtener detalles de un vehículo específico."""
    user_id = int(get_jwt_identity())
    vehicle = Vehicle.query.filter_by(id=vehicle_id, owner=user_id).first()

    if not vehicle:
        return jsonify({'status': 'error', 'message': 'Vehicle not found'}), 404

    # Crear un diccionario con los datos del vehículo
    vehicle_data = {
        "id": vehicle.id,
        "model": vehicle.model,
        "brand": vehicle.brand,
        "license_plate": vehicle.license_plate,
        "year": vehicle.year,
        "vehicle_img": vehicle.vehicle_img,
        "proof_insurance_img": vehicle.proof_insurance_img,
        "property_card": vehicle.property_card,
        "type": vehicle.type
    }

    return jsonify({'status': 'success', 'message': 'Vehicle details', 'vehicle': vehicle_data}), 200


@bp_vehicles.route('/vehicles', methods=['GET'])
@jwt_required()
def get_all_vehicles():
    """Obtener todos los vehículos del usuario autenticado."""
    user_id = int(get_jwt_identity())
    vehicles = Vehicle.query.filter_by(owner=user_id, is_deleted=False).all()

    # Crear una lista con los datos de los vehículos
    vehicles_data = [{
        "id": v.id,
        "model": v.model,
        "brand": v.brand,
        "license_plate": v.license_plate,
        "year": v.year,
        "vehicle_img": v.vehicle_img,
        "proof_insurance_img": v.proof_insurance_img,
        "property_card": v.property_card,
        "type": v.type
    } for v in vehicles]

    return jsonify({'status': 'success', 'message': 'User vehicles', 'vehicles': vehicles_data}), 200
