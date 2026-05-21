"""Integration tests for the registration endpoints.

The old '/auth/register' endpoint was replaced by two dedicated endpoints
under the register blueprint:
    POST /register/cliente  — vehicle owner
    POST /register/valet    — valet driver

Each returns 201 on success, 400 for a wrong Content-Type, 409 for a
duplicate username/email, and 422 for missing/invalid fields.
"""

from flask import json


CLIENTE_PAYLOAD = {
    'name': 'Ana',
    'last_name': 'Gomez',
    'username': 'ana_cliente',
    'password': 'secret123',
    'email': 'ana@example.com',
    'institutional_email': 'ana@gmail.com',
    'cellphone': '3001234567',
    'profile_img': 'profile.jpg',
    'id_img': 'id.jpg',
}

VALET_PAYLOAD = {
    'name': 'Beto',
    'last_name': 'Ruiz',
    'username': 'beto_valet',
    'password': 'secret123',
    'email': 'beto@example.com',
    'cellphone': '3009876543',
    'vehicle_type': 'car',
    'profile_img': 'profile.jpg',
    'id_img': 'id.jpg',
    'driver_license_img': 'license.jpg',
}


def _post(client, path, payload, as_json=True):
    kwargs = {'content_type': 'application/json'} if as_json else {}
    return client.post(path, data=json.dumps(payload), **kwargs)


# Happy path -----------------------------------------------------------------

def test_register_cliente_with_valid_data_returns_201(client, session):
    response = _post(client, '/register/cliente', CLIENTE_PAYLOAD)

    assert response.status_code == 201
    body = response.get_json()
    assert body['status'] == 'success'
    assert body['data']['username'] == 'ana_cliente'
    assert body['data']['type'] == 'cliente'


def test_register_valet_with_valid_data_returns_201(client, session):
    response = _post(client, '/register/valet', VALET_PAYLOAD)

    assert response.status_code == 201
    body = response.get_json()
    assert body['status'] == 'success'
    assert body['data']['username'] == 'beto_valet'
    assert body['data']['type'] == 'valet'
    # A unique valet code is generated automatically.
    assert body['data']['valet_code']


# Alternative flow -----------------------------------------------------------

def test_register_cliente_wrong_content_type_returns_400(client, session):
    response = client.post('/register/cliente', data=json.dumps(CLIENTE_PAYLOAD))
    assert response.status_code == 400
    assert response.get_json()['status'] == 'error'


def test_register_cliente_missing_fields_returns_422(client, session):
    incomplete = {'name': 'Ana', 'username': 'ana2'}
    response = _post(client, '/register/cliente', incomplete)

    assert response.status_code == 422
    body = response.get_json()
    assert body['status'] == 'error'
    assert body['errors']  # field-level error list is populated


def test_register_cliente_non_gmail_institutional_email_returns_422(client, session):
    payload = dict(CLIENTE_PAYLOAD, institutional_email='ana@hotmail.com')
    response = _post(client, '/register/cliente', payload)
    assert response.status_code == 422


def test_register_valet_duplicate_username_returns_409(client, session):
    first = _post(client, '/register/valet', VALET_PAYLOAD)
    assert first.status_code == 201

    # Same username, different email -> still a username clash.
    duplicate = dict(VALET_PAYLOAD, email='other@example.com')
    response = _post(client, '/register/valet', duplicate)

    assert response.status_code == 409
    assert response.get_json()['status'] == 'error'


def test_register_valet_short_password_returns_422(client, session):
    payload = dict(VALET_PAYLOAD, password='123')
    response = _post(client, '/register/valet', payload)
    assert response.status_code == 422
