"""Shared helpers for the new-feature integration tests.

The legacy ``auth`` fixture in ``tests/conftest.py`` issues JWTs with
``identity='test'``. The blueprints added in this iteration (chat with
service threads, belongings, key handover, inspection) all do
``int(get_jwt_identity())`` exactly like ``autho.py:login`` does — so
they need numeric identities. These helpers create real ``User`` rows
and mint tokens whose identity is the user's primary key as a string.

Note: we use ``db.session`` (the Flask-SQLAlchemy session) rather than
``app.database.db_session``. The latter is a module-level global that is
``None`` until ``database.init()`` runs, so importing it at module load
time would bind the name to ``None``. ``db`` is a stable instance and
``db.session`` is the same session the new blueprints write through.
"""

from datetime import datetime

from flask_jwt_extended import create_access_token

from app.database import db
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
    # contract and vehicle_type are NOT NULL on the users table.
    user.contract = 'contract.pdf'
    user.vehicle_type = 'car'
    user.created_at = datetime.utcnow()
    user.is_deleted = False
    user.is_verified = True
    db.session.add(user)
    db.session.commit()
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

    db.session.add(req)
    db.session.commit()

    service_id = None
    if status == 'accepted' and valet_user is not None:
        service = Service()
        service.driver_id = valet_user.id
        service.user_id = client_user.id
        service.created_at = datetime.utcnow()
        service.is_finished = False
        service.is_deleted = False
        db.session.add(service)
        db.session.commit()
        service_id = service.id

        req.service_id = service_id
        db.session.commit()

    return req
