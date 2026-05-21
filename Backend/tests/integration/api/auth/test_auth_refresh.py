"""Tests for the token refresh endpoint.

SKIPPED: the '/auth/refresh' endpoint no longer exists. The token system
was refactored — autho.py now only exposes '/autho/login' and
'/autho/logout' (logout adds the JTI to TokenBlacklist). There is no
refresh-token flow to test. These tests are kept, skipped, as a record;
delete the file once the team confirms refresh will not return.
"""

import pytest

pytestmark = pytest.mark.skip(
    reason="'/auth/refresh' endpoint removed in the token-system refactor"
)

from flask_jwt_extended import decode_token  # noqa: E402


def test_auth_refresh_a_valid_token_returning_200_status_code(client, session, auth):
    response = client.post('/auth/refresh',
                           content_type='application/json',
                           headers=auth['refresh_token'])
    assert response.status_code == 200
    assert response.json['status'] == 'success'

    access_token_decoded = decode_token(response.json['data']['access_token'])
    assert access_token_decoded['identity'] == 'test'

    from app.model import Token
    assert session.query(Token).filter_by(jti=access_token_decoded['jti'],
                                          user_identity='test').first()


def test_auth_refresh_an_invalid_token_returning_422_status_code(client):
    response = client.post('/auth/refresh',
                           content_type='application/json',
                           headers={'Authorization': 'Bearer invalid-token'})
    assert response.status_code == 422
    assert response.json['msg'] == 'Not enough segments'
