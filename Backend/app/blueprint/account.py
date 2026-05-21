"""Blueprint to organize and group views related to the '/account' endpoint.

The account endpoints operate on the *authenticated* user. The JWT identity
carries the user's numeric id as a string (see autho.py:login, which issues
``create_access_token(identity=str(user.id))``), so every handler resolves the
user through ``int(get_jwt_identity())`` — consistently with the rest of the
modern blueprints.
"""

from flask import (
    abort, Blueprint, request, Response, make_response, jsonify
)
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database import db
from app.model import User

bp = Blueprint('account', __name__, url_prefix='/account')

# Fields a user is allowed to change on their own account.
EDITABLE_FIELDS = {'name', 'last_name', 'email', 'cellphone', 'profile_img'}
MIN_PASSWORD_LENGTH = 3


def _current_user():
    """Resolve the authenticated user from the numeric JWT identity."""
    return User.query.get(int(get_jwt_identity()))


def _apply_update(user: User, data: dict):
    """Apply whitelisted fields (and optional password) to the user.

    Returns an error message string if the update is invalid, else None.
    """
    for key, value in data.items():
        if key in EDITABLE_FIELDS:
            setattr(user, key, value)

    if 'password' in data:
        password = data.get('password') or ''
        if len(password) < MIN_PASSWORD_LENGTH:
            return 'password must be at least 3 characters'
        user.password_hash = password

    return None


@bp.route('', methods=('GET',))
@jwt_required()
def get_account() -> Response:
    """Retrieve the authenticated user's account."""
    user = _current_user()
    if not user:
        abort(404)

    return make_response(jsonify({
        'status': 'success',
        'data': user.to_dict()
    }), 200)


@bp.route('', methods=('PUT',))
@jwt_required()
def update_account() -> Response:
    """Update the authenticated user's account."""
    if not request.is_json:
        abort(400)

    user = _current_user()
    if not user:
        abort(404)

    data = request.get_json() or {}
    if not data:
        return make_response(jsonify({
            'status': 'fail',
            'message': 'bad request'
        }), 400)

    error = _apply_update(user, data)
    if error:
        return make_response(jsonify({'status': 'fail', 'message': error}), 400)

    db.session.commit()
    return make_response(jsonify({
        'status': 'success',
        'data': user.to_dict()
    }), 200)


@bp.route('', methods=('PATCH',))
@jwt_required()
def patch_account() -> Response:
    """Partially update the authenticated user's account."""
    if not request.is_json:
        abort(400)

    user = _current_user()
    if not user:
        abort(404)

    data = request.get_json() or {}
    if not data:
        return make_response(jsonify({
            'status': 'fail',
            'message': 'bad request'
        }), 400)

    error = _apply_update(user, data)
    if error:
        return make_response(jsonify({'status': 'fail', 'message': error}), 400)

    db.session.commit()
    return make_response(jsonify({
        'status': 'success',
        'data': user.to_dict()
    }), 200)


@bp.route('', methods=('DELETE',))
@jwt_required()
def delete_account() -> Response:
    """Soft-delete the authenticated user's account."""
    user = _current_user()
    if not user:
        abort(404)

    user.is_deleted = True
    db.session.commit()
    return make_response(jsonify({
        'status': 'success',
        'message': 'Account deleted'
    }), 200)
