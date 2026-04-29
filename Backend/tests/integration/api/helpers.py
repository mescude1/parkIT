"""Shared helpers for the new-feature integration tests.

The legacy ``auth`` fixture in ``tests/conftest.py`` issues JWTs with
``identity='test'``. The blueprints added in this iteration (chat with
service threads, belongings, key handover, inspection) all do
``int(get_jwt_identity())`` exactly like ``autho.py:login`` does — so
they need numeric identities. These helpers create real ``User`` rows
and mint tokens whose identity is the user's primary key as a string.
"""

from datetime import datetime

from flask_jwt_extended import create_access_token

from app.database import db_session
from app.model import User, ValetRequest, Service


def _make_user(*, username, user_type='cliente'):
    user = User()
    user.username = username
    user.password_hash = 'x'
    user.name = username.title()
    user.last_name = 'Test'
    user.email = f'{username}@example.com'
    user.cellphone = '0000000000'
    user.type = user_type
    user.profile_img = 'p.jpg'
    user.id_img = 'i.jpg'
    user.driver_license_img = 'l.jpg'
    user.contract = None
    user.vehicle_type = 'car' if user_type == 'valet' else None
    user.created_at = datetime.utcnow()
    user.is_deleted = False
    user.is_verified = True
    db_session.add(user)
    db_session.commit()
    return user


def auth_header(user):
    """Return an Authorization header dict for the given user."""
    token = create_access_token(identity=str(user.id))
    return {'Authorization': f'Bearer {token}'}


def make_cliente(username='cliente1'):
    return _make_user(username=username, user_type='cliente')


def make_valet(username='valet1'):
    return _make_user(username=username, user_type='valet')


def make_valet_request(client_user, valet_user=None, status='accepted'):
    """Create a ValetRequest. If status='accepted', also create a Service
    and assign the valet to both records.
    """
    req = ValetRequest()
    req.client_id = client_user.id
    req.latitude = 4.65
    req.longitude = -74.05
    req.status = status
    req.created_at = datetime.utcnow()

    if status == 'accepted' and valet_user is not None:
        req.accepted_by = valet_user.id

    db_session.add(req)
    db_session.commit()

    service_id = None
    if status == 'accepted' and valet_user is not None:
        service = Service()
        service.driver_id = valet_user.id
        service.user_id = client_user.id
        service.created_at = datetime.utcnow()
        service.is_finished = False
        service.is_deleted = False
        db_session.add(service)
        db_session.commit()
        service_id = service.id

        req.service_id = service_id
        db_session.commit()

    return req
