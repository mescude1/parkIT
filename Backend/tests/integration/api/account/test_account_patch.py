"""Integration tests for PATCH /account (partial account update)."""

from flask import json

from tests.integration.api.helpers import auth_header, make_cliente


# Happy path -----------------------------------------------------------------

def test_patch_account_single_field_returns_200(client, session):
    user = make_cliente('acc_patch_ok')

    response = client.patch(
        '/account',
        data=json.dumps({'name': 'SoloNombre'}),
        content_type='application/json',
        headers=auth_header(user),
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body['status'] == 'success'
    assert body['data']['name'] == 'SoloNombre'
    # Other fields are untouched.
    assert body['data']['username'] == 'acc_patch_ok'


def test_patch_account_with_valid_password_returns_200(client, session):
    user = make_cliente('acc_patch_pw')

    response = client.patch(
        '/account',
        data=json.dumps({'password': 'brandnew'}),
        content_type='application/json',
        headers=auth_header(user),
    )
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'


# Alternative flow -----------------------------------------------------------

def test_patch_account_without_json_content_type_returns_400(client, session):
    user = make_cliente('acc_patch_ct')

    response = client.patch(
        '/account',
        data=json.dumps({'name': 'X'}),
        headers=auth_header(user),
    )
    assert response.status_code == 400


def test_patch_account_with_empty_body_returns_400(client, session):
    user = make_cliente('acc_patch_empty')

    response = client.patch(
        '/account',
        data=json.dumps({}),
        content_type='application/json',
        headers=auth_header(user),
    )
    assert response.status_code == 400


def test_patch_account_with_short_password_returns_400(client, session):
    user = make_cliente('acc_patch_short')

    response = client.patch(
        '/account',
        data=json.dumps({'password': 'ab'}),
        content_type='application/json',
        headers=auth_header(user),
    )
    assert response.status_code == 400
    assert response.get_json()['status'] == 'fail'
