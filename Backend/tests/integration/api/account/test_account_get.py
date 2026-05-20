"""Integration tests for GET /account.

Rewritten after the account endpoints were fixed to resolve the user from
the numeric JWT identity (int(get_jwt_identity())) consistently.
"""

from flask_jwt_extended import create_access_token

from tests.integration.api.helpers import auth_header, make_cliente


# Happy path -----------------------------------------------------------------

def test_get_account_of_existing_user_returns_200(client, session):
    user = make_cliente('acc_get_ok')

    response = client.get('/account', headers=auth_header(user))

    assert response.status_code == 200
    body = response.get_json()
    assert body['status'] == 'success'
    assert body['data']['username'] == 'acc_get_ok'
    assert body['data']['id'] == user.id


# Alternative flow -----------------------------------------------------------

def test_get_account_of_inexistent_user_returns_404(client, session):
    """A valid token whose identity points to no user yields 404."""
    token = create_access_token(identity='999999')
    response = client.get(
        '/account',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 404
