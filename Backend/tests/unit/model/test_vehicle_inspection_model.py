"""Unit tests for VehicleInspection and SpeedAlert models."""

from datetime import datetime

from app.model.vehicle_inspection import VehicleInspection, SpeedAlert


# VehicleInspection - happy path --------------------------------------------

def test_inspection_photos_round_trip(app):
    """Photos list survives the JSON encode/decode cycle."""
    i = VehicleInspection()
    i.photos = ['front.jpg', 'rear.jpg', 'left.jpg']

    assert i.photos == ['front.jpg', 'rear.jpg', 'left.jpg']


def test_inspection_to_dict_returns_expected_payload(app):
    i = VehicleInspection()
    i.id = 11
    i.service_id = 4
    i.captured_by = 2
    i.stage = 'before'
    i.notes = 'Sin daños visibles'
    i.created_at = datetime(2026, 4, 29, 10, 0, 0)
    i.photos = ['p.jpg']

    payload = i.to_dict()

    assert payload['stage'] == 'before'
    assert payload['photos'] == ['p.jpg']
    assert payload['notes'] == 'Sin daños visibles'
    assert payload['created_at'] == '2026-04-29T10:00:00'


# VehicleInspection - alternative flow --------------------------------------

def test_inspection_handles_invalid_photos_json(app):
    """A corrupted photos_json does not break the getter."""
    i = VehicleInspection()
    i.photos_json = 'corrupt[]['
    assert i.photos == []


# SpeedAlert ---------------------------------------------------------------

def test_speed_alert_to_dict_includes_speed_and_limit(app):
    """A speed alert exposes both the recorded speed and the limit."""
    a = SpeedAlert()
    a.id = 5
    a.service_id = 9
    a.valet_id = 2
    a.speed_kmh = 18.4
    a.speed_limit_kmh = 10.0
    a.latitude = 4.65
    a.longitude = -74.05
    a.created_at = datetime(2026, 4, 29, 11, 5, 0)

    payload = a.to_dict()

    assert payload['speed_kmh'] == 18.4
    assert payload['speed_limit_kmh'] == 10.0
    assert payload['service_id'] == 9
    assert payload['valet_id'] == 2
    assert payload['created_at'] == '2026-04-29T11:05:00'
