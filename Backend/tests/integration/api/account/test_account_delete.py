"""Integration tests for DELETE /account (soft-deletes the account)."""

from flask_jwt_extended import create_access_token

from tests.integration.api.helpers import auth_header, make_cliente


# Happy path -----------------------------------------------------------------

def test_delete_account_returns_200_and_soft_deletes(client, session):
    user = make_cliente('acc_del_ok')

    response = client.delete('/account', headers=auth_header(user))

    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'

    # The account is flagged as deleted rather than physically removed.
    from app.model import User
    refreshed = User.query.get(user.id)
    assert refreshed is not None
    assert refreshed.is_deleted is True


# Alternative flow -----------------------------------------------------------

def test_delete_account_of_inexistent_user_returns_404(client, session):
    token = create_access_token(identity='999999')
    response = client.delete(
        '/account',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 404
