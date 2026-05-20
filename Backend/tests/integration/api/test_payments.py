"""Integration tests for epic #20 — Pago al Valet (payments & sanctions).

Covers:
    - Happy path: valet creates a payment, the owner pays it.
    - Happy path: the owner defaults -> the platform covers the valet
      and a severe sanction is raised against the owner.
    - Alternative flow: only the valet may create the payment / report a
      default; only the owner may pay; a duplicate payment is rejected.
"""

from flask import json

from tests.integration.api.helpers import (
    auth_header,
    make_cliente,
    make_valet,
    make_valet_request,
)


def _service_id(req):
    return req.service_id


# Happy path -----------------------------------------------------------------

def test_payment_create_and_pay(client, session):
    cliente = make_cliente('cli_pay_ok')
    valet = make_valet('val_pay_ok')
    req = make_valet_request(cliente, valet, status='accepted')

    created = client.post(
        '/payments',
        data=json.dumps({'service_id': _service_id(req), 'amount': 15000}),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert created.status_code == 201
    payment = created.get_json()['payment']
    assert payment['status'] == 'pending'
    assert payment['payer_id'] == cliente.id
    assert payment['payee_id'] == valet.id
    payment_id = payment['id']

    paid = client.post(
        f'/payments/{payment_id}/pay',
        data=json.dumps({'method': 'card'}),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert paid.status_code == 200
    updated = paid.get_json()['payment']
    assert updated['status'] == 'paid'
    assert updated['method'] == 'card'
    assert updated['paid_at'] is not None


def test_payment_default_covers_valet_and_sanctions_owner(client, session):
    cliente = make_cliente('cli_pay_def')
    valet = make_valet('val_pay_def')
    req = make_valet_request(cliente, valet, status='accepted')

    created = client.post(
        '/payments',
        data=json.dumps({'service_id': _service_id(req), 'amount': 20000}),
        content_type='application/json',
        headers=auth_header(valet),
    )
    payment_id = created.get_json()['payment']['id']

    # Valet reports the owner never paid.
    defaulted = client.post(
        f'/payments/{payment_id}/default',
        headers=auth_header(valet),
    )
    assert defaulted.status_code == 200
    body = defaulted.get_json()

    # The platform covers the valet — payment ends as covered_by_app.
    assert body['payment']['status'] == 'covered_by_app'
    assert body['payment']['paid_at'] is not None

    # A severe sanction is raised against the owner, with a surcharge.
    sanction = body['sanction']
    assert sanction['user_id'] == cliente.id
    assert sanction['severity'] == 'severe'
    assert sanction['amount'] == 30000.0  # 20000 * 1.5
    assert sanction['status'] == 'active'

    # The owner sees the sanction in their list.
    mine = client.get('/sanctions/mine', headers=auth_header(cliente))
    assert mine.status_code == 200
    mine_body = mine.get_json()
    assert mine_body['active_count'] == 1
    assert len(mine_body['sanctions']) == 1


# Alternative flow -----------------------------------------------------------

def test_cliente_cannot_create_payment(client, session):
    """Only the assigned valet may register the payment."""
    cliente = make_cliente('cli_pay_forbid')
    valet = make_valet('val_pay_forbid')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.post(
        '/payments',
        data=json.dumps({'service_id': _service_id(req), 'amount': 10000}),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert res.status_code == 403


def test_only_owner_can_pay(client, session):
    cliente = make_cliente('cli_pay_owner')
    valet = make_valet('val_pay_owner')
    req = make_valet_request(cliente, valet, status='accepted')

    created = client.post(
        '/payments',
        data=json.dumps({'service_id': _service_id(req), 'amount': 12000}),
        content_type='application/json',
        headers=auth_header(valet),
    )
    payment_id = created.get_json()['payment']['id']

    # The valet (not the payer) cannot pay.
    res = client.post(
        f'/payments/{payment_id}/pay',
        headers=auth_header(valet),
    )
    assert res.status_code == 403


def test_duplicate_payment_is_rejected(client, session):
    cliente = make_cliente('cli_pay_dup')
    valet = make_valet('val_pay_dup')
    req = make_valet_request(cliente, valet, status='accepted')

    payload = {'service_id': _service_id(req), 'amount': 9000}
    first = client.post(
        '/payments',
        data=json.dumps(payload),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert first.status_code == 201

    second = client.post(
        '/payments',
        data=json.dumps(payload),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert second.status_code == 409


def test_only_valet_can_report_default(client, session):
    cliente = make_cliente('cli_pay_defforbid')
    valet = make_valet('val_pay_defforbid')
    req = make_valet_request(cliente, valet, status='accepted')

    created = client.post(
        '/payments',
        data=json.dumps({'service_id': _service_id(req), 'amount': 8000}),
        content_type='application/json',
        headers=auth_header(valet),
    )
    payment_id = created.get_json()['payment']['id']

    # The owner cannot mark their own payment as defaulted.
    res = client.post(
        f'/payments/{payment_id}/default',
        headers=auth_header(cliente),
    )
    assert res.status_code == 403
