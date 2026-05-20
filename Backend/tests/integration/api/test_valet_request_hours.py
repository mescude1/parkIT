"""Integration tests for epic #31 — request within service hours and the
valet contact endpoint.

Covers:
    - Happy path: a cliente requests service during operating hours; an
      accepted request exposes the valet's contact details.
    - Alternative flow: a request outside operating hours is rejected
      (403); contact info is unavailable while the request is pending.
"""

from unittest.mock import patch

from flask import json

from tests.integration.api.helpers import (
    auth_header,
    make_cliente,
    make_valet,
    make_valet_request,
)


# Happy path -----------------------------------------------------------------

def test_request_created_within_service_hours(client, session):
    cliente = make_cliente('cli_hours_ok')

    with patch('app.blueprint.valet._within_service_hours', return_value=True):
        res = client.post(
            '/valet/request',
            data=json.dumps({'latitude': 4.63, 'longitude': -74.06}),
            content_type='application/json',
            headers=auth_header(cliente),
        )

    assert res.status_code == 201
    body = res.get_json()
    assert body['status'] == 'pending'
    assert 'request_id' in body


def test_contact_endpoint_returns_valet_details(client, session):
    cliente = make_cliente('cli_contact_ok')
    valet = make_valet('val_contact_ok')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.get(
        f'/valet/request/{req.id}/contact',
        headers=auth_header(cliente),
    )

    assert res.status_code == 200
    contact = res.get_json()['contact']
    assert contact['user_id'] == valet.id
    assert contact['cellphone'] == valet.cellphone
    assert contact['role'] == 'valet'


def test_service_hours_endpoint_is_public(client, session):
    """The /valet/service-hours endpoint needs no authentication."""
    res = client.get('/valet/service-hours')
    assert res.status_code == 200
    body = res.get_json()
    assert body['start'] == '06:00'
    assert body['end'] == '22:00'
    assert 'available_now' in body


# Alternative flow -----------------------------------------------------------

def test_request_rejected_outside_service_hours(client, session):
    cliente = make_cliente('cli_hours_closed')

    with patch('app.blueprint.valet._within_service_hours', return_value=False):
        res = client.post(
            '/valet/request',
            data=json.dumps({'latitude': 4.63, 'longitude': -74.06}),
            content_type='application/json',
            headers=auth_header(cliente),
        )

    assert res.status_code == 403
    body = res.get_json()
    assert 'service_hours' in body
    assert body['service_hours']['start'] == '06:00'


def test_contact_unavailable_for_pending_request(client, session):
    """A request that hasn't been accepted has no valet to contact."""
    cliente = make_cliente('cli_contact_pending')
    req = make_valet_request(cliente, valet_user=None, status='pending')

    res = client.get(
        f'/valet/request/{req.id}/contact',
        headers=auth_header(cliente),
    )
    assert res.status_code == 409


def test_contact_forbidden_for_stranger(client, session):
    cliente = make_cliente('cli_contact_strg')
    valet = make_valet('val_contact_strg')
    stranger = make_cliente('cli_contact_strg2')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.get(
        f'/valet/request/{req.id}/contact',
        headers=auth_header(stranger),
    )
    assert res.status_code == 403
