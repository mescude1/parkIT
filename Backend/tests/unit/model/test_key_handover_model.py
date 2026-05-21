"""Unit tests for the KeyHandover model."""

from datetime import datetime

from app.model.key_handover import KeyHandover


# Happy path -----------------------------------------------------------------

def test_key_handover_to_dict_returns_full_payload(app):
    """A freshly stored handover serializes every attribute."""
    h = KeyHandover()
    h.id = 1
    h.service_id = 9
    h.valet_id = 3
    h.location_label = 'Caja fuerte 14'
    h.latitude = 4.65
    h.longitude = -74.05
    h.evidence_photo = 'evidence.jpg'
    h.notes = 'Detrás del cilindro'
    h.status = 'stored'
    h.stored_at = datetime(2026, 4, 29, 12, 0, 0)
    h.returned_at = None

    payload = h.to_dict()

    assert payload['id'] == 1
    assert payload['service_id'] == 9
    assert payload['valet_id'] == 3
    assert payload['location_label'] == 'Caja fuerte 14'
    assert payload['evidence_photo'] == 'evidence.jpg'
    assert payload['status'] == 'stored'
    assert payload['stored_at'] == '2026-04-29T12:00:00'
    assert payload['returned_at'] is None


# Alternative flow -----------------------------------------------------------

def test_key_handover_returned_state_is_serialized(app):
    """When returned, both timestamp and status reflect the new state."""
    h = KeyHandover()
    h.status = 'returned'
    h.returned_at = datetime(2026, 4, 29, 14, 30, 0)
    h.stored_at = datetime(2026, 4, 29, 12, 0, 0)

    payload = h.to_dict()

    assert payload['status'] == 'returned'
    assert payload['returned_at'] == '2026-04-29T14:30:00'
