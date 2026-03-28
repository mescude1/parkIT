from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.model.user import User
from app.model.service import Service
from geopy.distance import geodesic, distance
from app.database import db

bp_valet = Blueprint('valet', __name__, url_prefix='/valet')


@bp_valet.route('/request-service', methods=['POST'])
@jwt_required()
def request_service():
    """
       1️⃣ Update the logged-in user's location.
       2️⃣ Find nearby drivers within 500 meters.
       3️⃣ Notify them.
       """

    # Step 1: Get User Data
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if latitude is None or longitude is None:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    # Step 2: Update User Location
    user.latitude = latitude
    user.longitude = longitude
    db.session.commit()

    # Step 3: Find Nearby Drivers
    drivers = User.query.filter(User.role == "driver").all()
    nearby_drivers = []

    for driver in drivers:
        if driver.latitude and driver.longitude:
            if distance((user.latitude, user.longitude), (driver.latitude, driver.longitude)).meters <= 500:
                nearby_drivers.append(driver.id)

    # Step 4: Notify Nearby Drivers
    if nearby_drivers:
        for driver_id in nearby_drivers:
            print(f"📢 Notification sent to Driver {driver_id}: A user nearby needs assistance!")
        return jsonify({"message": "Drivers notified", "drivers": nearby_drivers}), 200

    return jsonify({"message": "No nearby drivers found"}), 200


@bp_valet.route('/start-service', methods=['POST'])
@jwt_required()
def start_service():
    """
       1️⃣ Get the logged-in user's location.
       2️⃣ Retrieve the passed target user's location.
       3️⃣ Create a service record with a fixed price.
       4️⃣ Calculate ETA assuming walking speed (5 km/h).
       5️⃣ Return the user’s current location, target location, and ETA.
       """

    # Step 1: Get the logged-in user
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.latitude or not user.longitude:
        return jsonify({"error": "User location not available"}), 400

    # Step 2: Get request data
    data = request.get_json()
    target_user_id = data.get("target_user_id")
    target_user = User.query.get(target_user_id)

    if not target_user or not target_user.latitude or not target_user.longitude:
        return jsonify({"error": "Target user location not available"}), 400

    # Step 3: Create Service Record
    fixed_price = 50.00  # Fixed service price
    service = Service(
        user_id=user.id,
        target_user_id=target_user.id,
        user_latitude=user.latitude,
        user_longitude=user.longitude,
        target_latitude=target_user.latitude,
        target_longitude=target_user.longitude,
        price=fixed_price,
        created_at=datetime.utcnow()
    )
    db.session.add(service)
    db.session.commit()

    # Step 4: Calculate ETA (Assuming Walking Speed: 5 km/h)
    distance_km = geodesic((user.latitude, user.longitude), (target_user.latitude, target_user.longitude)).km
    walking_speed_kmh = 5  # Walking speed in km/h
    eta_minutes = (distance_km / walking_speed_kmh) * 60  # Convert hours to minutes

    # Step 5: Return Response
    return jsonify({
        "message": "Service created successfully",
        "service_id": service.id,
        "user_location": {"latitude": user.latitude, "longitude": user.longitude},
        "target_location": {"latitude": target_user.latitude, "longitude": target_user.longitude},
        "eta_minutes": round(eta_minutes, 2),
        "fixed_price": fixed_price
    }), 201


@bp_valet.route('/end-service', methods=['POST'])
@jwt_required()
def end_service():
    data = request.json
    return jsonify({'status': 'success', 'message': 'Service ended', 'details': data}), 200


@bp_valet.route('/cancel-service', methods=['POST'])
@jwt_required()
def cancel_service():
    data = request.json
    return jsonify({'status': 'success', 'message': 'Service canceled', 'details': data}), 200


@bp_valet.route('/pre-service-photo', methods=['POST'])
@jwt_required()
def pre_service_photo():
    data = request.json
    return jsonify({'status': 'success', 'message': 'Pre-service photo uploaded', 'details': data}), 200


@bp_valet.route('/post-service-photo', methods=['POST'])
@jwt_required()
def post_service_photo():
    data = request.json
    return jsonify({'status': 'success', 'message': 'Post-service photo uploaded', 'details': data}), 200


@bp_valet.route('/key-photo', methods=['POST'])
@jwt_required()
def key_photo():
    data = request.json
    return jsonify({'status': 'success', 'message': 'Key photo uploaded', 'details': data}), 200
