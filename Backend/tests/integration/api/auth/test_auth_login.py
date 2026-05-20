"""Integration tests for the login endpoint (/autho/login).

The current endpoint (autho.py):
    - 200 with {'data': {'user': ..., 'access_token': ...}} on valid creds.
    - 401 with {'status': 'error', 'data': '401 Unauthorized'} otherwise.
    - 400 when the request has no JSON body at all.

Rewritten after the token-system refactor: the old tests targeted '/auth'
(now '/autho') and a Token model that no longer exists.
"""

from flask import json

from tests.integration.api.helpers import make_cliente


# Happy path -----------------------------------------------------------------

def test_login_with_correct_credentials_returns_200_and_token(client, session):
    """A valid username/password yields an access token that actually works."""
    make_cliente('login_ok')

    # helpers._make_user sets the password to 'x'.
    response = client.post(
        '/autho/login',
        data=json.dumps({'username': 'login_ok', 'password': 'x'}),
        content_type='application/json',
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body['data']['user']['username'] == 'login_ok'

    token = body['data']['access_token']
    assert isinstance(token, str) and len(token) > 0

    # The issued token is valid against a protected endpoint.
    protected = client.get(
        '/account',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert protected.status_code == 200
    assert protected.get_json()['data']['username'] == 'login_ok'


# Alternative flow -----------------------------------------------------------

def test_login_without_body_returns_400(client, session):
    """No JSON body at all -> the endpoint cannot parse the request."""
    response = client.post('/autho/login', content_type='application/json')
    assert response.status_code == 400


def test_login_with_inexistent_username_returns_401(client, session):
    response = client.post(
        '/autho/login',
        data=json.dumps({'username': 'does_not_exist', 'password': 'x'}),
        content_type='application/json',
    )
    assert response.status_code == 401
    assert response.get_json()['status'] == 'error'


def test_login_with_incorrect_password_returns_401(client, session):
    make_cliente('login_badpass')

    response = client.post(
        '/autho/login',
        data=json.dumps({'username': 'login_badpass', 'password': 'wrong'}),
        content_type='application/json',
    )
    assert response.status_code == 401
    assert response.get_json()['status'] == 'error'
