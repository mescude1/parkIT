"""Integration tests for epic #29 — the map tracking endpoint.

Covers:
    - Happy path: an accepted request returns campus reference data, the
      meeting point and both parties' live locations.
    - Alternative flow: a stranger is rejected (403); an unknown request
      returns 404.
"""

from flask import json

from tests.integration.api.helpers import (
    auth_header,
    make_cliente,
    make_valet,
    make_valet_request,
)


# Happy path -----------------------------------------------------------------

def test_tracking_returns_campus_and_meeting_point(client, session):
    cliente = make_cliente('cli_track_ok')
    valet = make_valet('val_track_ok')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.get(
        f'/valet/request/{req.id}/tracking',
        headers=auth_header(cliente),
    )

    assert res.status_code == 200
    body = res.get_json()
    assert body['status'] == 'success'
    assert body['request_status'] == 'accepted'

    # Campus reference frame is always present.
    assert 'center' in body['campus']
    assert 'bounds' in body['campus']

    # Meeting point matches the request's coordinates.
    assert body['meeting_point']['latitude'] == req.latitude
    assert body['meeting_point']['longitude'] == req.longitude


def test_tracking_reflects_live_locations_and_distance(client, session):
    cliente = make_cliente('cli_track_loc')
    valet = make_valet('val_track_loc')
    req = make_valet_request(cliente, valet, status='accepted')

    # Both parties push a live location through the real endpoint.
    client.post(
        '/valet/location/update',
        data=json.dumps({'latitude': 4.6300, 'longitude': -74.0600}),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    client.post(
        '/valet/location/update',
        data=json.dumps({'latitude': 4.6310, 'longitude': -74.0610}),
        content_type='application/json',
        headers=auth_header(valet),
    )

    res = client.get(
        f'/valet/request/{req.id}/tracking',
        headers=auth_header(valet),
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body['client_location'] is not None
    assert body['valet_location'] is not None
    # A numeric straight-line distance is computed once the valet has a fix.
    assert isinstance(body['valet_distance_to_meeting_m'], (int, float))


# Alternative flow -----------------------------------------------------------

def test_tracking_forbidden_for_stranger(client, session):
    cliente = make_cliente('cli_track_strg')
    valet = make_valet('val_track_strg')
    stranger = make_cliente('cli_track_strg2')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.get(
        f'/valet/request/{req.id}/tracking',
        headers=auth_header(stranger),
    )
    assert res.status_code == 403


def test_tracking_unknown_request_returns_404(client, session):
    cliente = make_cliente('cli_track_404')

    res = client.get(
        '/valet/request/999999/tracking',
        headers=auth_header(cliente),
    )
    assert res.status_code == 404
