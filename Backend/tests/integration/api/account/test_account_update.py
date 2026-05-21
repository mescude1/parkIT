"""Integration tests for PUT /account (full account update)."""

from flask import json

from tests.integration.api.helpers import auth_header, make_cliente


# Happy path -----------------------------------------------------------------

def test_update_account_with_valid_data_returns_200(client, session):
    user = make_cliente('acc_put_ok')

    response = client.put(
        '/account',
        data=json.dumps({
            'name': 'Nuevo',
            'last_name': 'Nombre',
            'cellphone': '3110000000',
            'password': 'newsecret',
        }),
        content_type='application/json',
        headers=auth_header(user),
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body['status'] == 'success'
    assert body['data']['name'] == 'Nuevo'
    assert body['data']['cellphone'] == '3110000000'


# Alternative flow -----------------------------------------------------------

def test_update_account_without_json_content_type_returns_400(client, session):
    user = make_cliente('acc_put_ct')

    response = client.put(
        '/account',
        data=json.dumps({'name': 'X'}),
        headers=auth_header(user),
    )
    assert response.status_code == 400


def test_update_account_with_empty_body_returns_400(client, session):
    user = make_cliente('acc_put_empty')

    response = client.put(
        '/account',
        data=json.dumps({}),
        content_type='application/json',
        headers=auth_header(user),
    )
    assert response.status_code == 400


def test_update_account_with_short_password_returns_400(client, session):
    user = make_cliente('acc_put_pw')

    response = client.put(
        '/account',
        data=json.dumps({'password': 'ab'}),
        content_type='application/json',
        headers=auth_header(user),
    )
    assert response.status_code == 400
    assert response.get_json()['status'] == 'fail'
