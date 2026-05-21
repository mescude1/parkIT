"""HTTP endpoints for the payment guarantee flow (epic #20, "Pago al Valet").

Payment processing is *simulated* — there is no real gateway. The flow:

    1. Valet creates a Payment for a finished service        (POST /payments)
    2a. Client pays it                                       (POST /payments/<id>/pay)
    2b. Client fails to pay -> the platform covers the valet
        and a severe Sanction is raised against the client   (POST /payments/<id>/default)

This guarantees the valet always gets paid, and penalizes owners who default.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_

from app.database import db
from app.model import Service
from app.model.payment import (
    Payment,
    PAYMENT_PENDING,
    PAYMENT_PAID,
    PAYMENT_COVERED,
)
from app.model.sanction import (
    Sanction,
    SEVERITY_SEVERE,
    STATUS_ACTIVE,
    STATUS_RESOLVED,
)

bp_payments = Blueprint('payments', __name__, url_prefix='/payments')
bp_sanctions = Blueprint('sanctions', __name__, url_prefix='/sanctions')

# When the platform covers a defaulted payment, the owner owes what the app
# paid plus a penalty fee on top (1.5x = 50% surcharge).
SANCTION_PENALTY_MULTIPLIER = 1.5


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

@bp_payments.route('', methods=['POST'])
@jwt_required()
def create_payment():
    """The valet registers the payment owed for a finished service."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    service_id = data.get('service_id')
    amount = data.get('amount')

    if not service_id or amount is None:
        return jsonify({
            'status': 'error',
            'message': 'service_id and amount are required',
        }), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({
            'status': 'error',
            'message': 'amount must be a positive number',
        }), 400

    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404
    if service.driver_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Only the assigned valet may register the payment',
        }), 403

    existing = Payment.query.filter_by(service_id=service_id).first()
    if existing:
        return jsonify({
            'status': 'error',
            'message': 'Payment already exists for this service',
            'payment': existing.to_dict(),
        }), 409

    payment = Payment(
        service_id=service_id,
        payer_id=service.user_id,
        payee_id=service.driver_id,
        amount=amount,
        currency=data.get('currency', 'COP'),
        status=PAYMENT_PENDING,
        created_at=datetime.utcnow(),
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Payment created',
        'payment': payment.to_dict(),
    }), 201


@bp_payments.route('/<int:payment_id>/pay', methods=['POST'])
@jwt_required()
def pay_payment(payment_id):
    """The vehicle owner pays (simulated — just flips the status)."""
    user_id = int(get_jwt_identity())
    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'status': 'error', 'message': 'Payment not found'}), 404
    if payment.payer_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Only the vehicle owner may pay this',
        }), 403
    if payment.status != PAYMENT_PENDING:
        return jsonify({
            'status': 'error',
            'message': f'Payment is already {payment.status}',
        }), 409

    data = request.get_json(silent=True) or {}
    payment.status = PAYMENT_PAID
    payment.method = data.get('method') or 'mock'
    payment.paid_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Payment completed',
        'payment': payment.to_dict(),
    }), 200


@bp_payments.route('/<int:payment_id>/default', methods=['POST'])
@jwt_required()
def default_payment(payment_id):
    """Owner failed to pay: the platform covers the valet and the owner is
    sanctioned. Only the valet (payee) may report a default."""
    user_id = int(get_jwt_identity())
    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'status': 'error', 'message': 'Payment not found'}), 404
    if payment.payee_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Only the valet may report a default',
        }), 403
    if payment.status != PAYMENT_PENDING:
        return jsonify({
            'status': 'error',
            'message': f'Payment is already {payment.status}',
        }), 409

    # The platform covers the valet's pay — they are guaranteed their money.
    payment.status = PAYMENT_COVERED
    payment.method = 'app_coverage'
    payment.paid_at = datetime.utcnow()

    # Raise a severe sanction against the owner for the amount the app
    # covered, plus a penalty surcharge.
    penalty = round(payment.amount * SANCTION_PENALTY_MULTIPLIER, 2)
    sanction = Sanction(
        user_id=payment.payer_id,
        payment_id=payment.id,
        reason='Non-payment of valet service; covered by the platform',
        severity=SEVERITY_SEVERE,
        amount=penalty,
        status=STATUS_ACTIVE,
        created_at=datetime.utcnow(),
    )
    db.session.add(sanction)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Valet paid by the platform; owner sanctioned',
        'payment': payment.to_dict(),
        'sanction': sanction.to_dict(),
    }), 200


@bp_payments.route('/by-service/<int:service_id>', methods=['GET'])
@jwt_required()
def payment_by_service(service_id):
    user_id = int(get_jwt_identity())
    service = Service.query.get(service_id)
    if not service:
        return jsonify({'status': 'error', 'message': 'Service not found'}), 404
    if user_id not in (service.user_id, service.driver_id):
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    payment = Payment.query.filter_by(service_id=service_id).first()
    return jsonify({
        'status': 'success',
        'payment': payment.to_dict() if payment else None,
    }), 200


@bp_payments.route('/mine', methods=['GET'])
@jwt_required()
def my_payments():
    """All payments where the caller is either the payer or the payee."""
    user_id = int(get_jwt_identity())
    payments = Payment.query.filter(
        or_(Payment.payer_id == user_id, Payment.payee_id == user_id)
    ).order_by(Payment.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'payments': [p.to_dict() for p in payments],
    }), 200


# ---------------------------------------------------------------------------
# Sanctions
# ---------------------------------------------------------------------------

@bp_sanctions.route('/mine', methods=['GET'])
@jwt_required()
def my_sanctions():
    user_id = int(get_jwt_identity())
    sanctions = Sanction.query.filter_by(
        user_id=user_id
    ).order_by(Sanction.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'sanctions': [s.to_dict() for s in sanctions],
        'active_count': sum(1 for s in sanctions if s.status == STATUS_ACTIVE),
    }), 200


@bp_sanctions.route('/<int:sanction_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_sanction(sanction_id):
    """Mark a sanction as resolved once the owner settles the debt.

    Note: in a production system this would be admin-gated. For this
    simulated flow the sanctioned user settles their own debt.
    """
    user_id = int(get_jwt_identity())
    sanction = Sanction.query.get(sanction_id)
    if not sanction:
        return jsonify({'status': 'error', 'message': 'Sanction not found'}), 404
    if sanction.user_id != user_id:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    if sanction.status != STATUS_ACTIVE:
        return jsonify({
            'status': 'error',
            'message': f'Sanction is already {sanction.status}',
        }), 409

    sanction.status = STATUS_RESOLVED
    sanction.resolved_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Sanction resolved',
        'sanction': sanction.to_dict(),
    }), 200
