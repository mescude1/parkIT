"""Unit tests for the Belonging model.

These exercise the Python-level behaviour of the model — primarily the
``photos`` property (JSON serialization) and ``to_dict`` — without going
through a real DB.
"""

from app.model.belonging import Belonging


# Happy path -----------------------------------------------------------------

def test_belonging_serializes_photos_round_trip(app):
    """photos getter/setter encodes and decodes a list correctly."""
    b = Belonging()
    b.description = 'Maletín gris'
    b.quantity = 2
    b.photos = ['a.jpg', 'b.jpg']

    assert b.photos == ['a.jpg', 'b.jpg']
    assert '"a.jpg"' in b.photos_json
    assert '"b.jpg"' in b.photos_json


def test_belonging_to_dict_returns_expected_fields(app):
    """to_dict exposes every public attribute including the decoded photos."""
    b = Belonging()
    b.id = 7
    b.valet_request_id = 12
    b.service_id = 30
    b.owner_id = 4
    b.description = 'Laptop'
    b.quantity = 1
    b.photos = ['x.jpg']
    b.reported_missing = False
    b.is_deleted = False

    payload = b.to_dict()

    assert payload['id'] == 7
    assert payload['valet_request_id'] == 12
    assert payload['service_id'] == 30
    assert payload['owner_id'] == 4
    assert payload['description'] == 'Laptop'
    assert payload['quantity'] == 1
    assert payload['photos'] == ['x.jpg']
    assert payload['reported_missing'] is False


# Alternative flow -----------------------------------------------------------

def test_belonging_photos_default_to_empty_list(app):
    """If photos_json is None or junk, the getter still returns a list."""
    b = Belonging()
    # Never assigned — photos_json is None.
    assert b.photos == []

    # Bad JSON should not crash the getter.
    b.photos_json = 'not-json-at-all'
    assert b.photos == []

    # Valid JSON but not a list should be ignored.
    b.photos_json = '{"foo": "bar"}'
    assert b.photos == []
