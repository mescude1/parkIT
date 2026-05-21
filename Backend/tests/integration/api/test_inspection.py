"""Integration tests for /inspection endpoints.

Covers:
    - Happy path: valet captures 'before' inspection, then 'after';
      cliente reads both back. A speed reading above 10km/h becomes a
      persisted alert.
    - Alternative flow: only the assigned valet may write; an empty
      photos list is rejected; readings <= 10km/h are silently ignored
      (204) and never become alerts.
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

def test_inspection_before_and_after_are_persisted(client, session):
    cliente = make_cliente('cli_insp_ok')
    valet = make_valet('val_insp_ok')
    req = make_valet_request(cliente, valet, status='accepted')
    sid = _service_id(req)

    before = client.post(
        '/inspection',
        data=json.dumps({
            'service_id': sid,
            'stage': 'before',
            'photos': ['front.jpg', 'rear.jpg'],
            'notes': 'Sin daños visibles',
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert before.status_code == 201
    assert before.get_json()['inspection']['stage'] == 'before'

    after = client.post(
        '/inspection',
        data=json.dumps({
            'service_id': sid,
            'stage': 'after',
            'photos': ['front2.jpg'],
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert after.status_code == 201

    # Cliente lists both stages and any speed alerts.
    listed = client.get(
        f'/inspection/by-service/{sid}',
        headers=auth_header(cliente),
    )
    assert listed.status_code == 200
    body = listed.get_json()
    stages = sorted(i['stage'] for i in body['inspections'])
    assert stages == ['after', 'before']
    assert body['speed_alerts'] == []


def test_speed_alert_above_limit_is_persisted(client, session):
    cliente = make_cliente('cli_insp_spd')
    valet = make_valet('val_insp_spd')
    req = make_valet_request(cliente, valet, status='accepted')
    sid = _service_id(req)

    res = client.post(
        '/inspection/speed-alert',
        data=json.dumps({
            'service_id': sid,
            'speed_kmh': 18.5,
            'latitude': 4.65,
            'longitude': -74.05,
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert res.status_code == 201
    alert = res.get_json()['alert']
    assert alert['speed_kmh'] == 18.5
    assert alert['speed_limit_kmh'] == 10.0


# Alternative flow -----------------------------------------------------------

def test_inspection_rejects_empty_photos(client, session):
    cliente = make_cliente('cli_insp_empty')
    valet = make_valet('val_insp_empty')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.post(
        '/inspection',
        data=json.dumps({
            'service_id': _service_id(req),
            'stage': 'before',
            'photos': [],
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert res.status_code == 400
    assert 'photo' in res.get_json()['message'].lower()


def test_inspection_only_assigned_valet_can_write(client, session):
    """Another valet (not the one assigned to the service) is rejected."""
    cliente = make_cliente('cli_insp_other')
    valet = make_valet('val_insp_other')
    other_valet = make_valet('val_insp_other2')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.post(
        '/inspection',
        data=json.dumps({
            'service_id': _service_id(req),
            'stage': 'before',
            'photos': ['x.jpg'],
        }),
        content_type='application/json',
        headers=auth_header(other_valet),
    )
    assert res.status_code == 403


def test_speed_under_limit_is_silently_ignored(client, session):
    """Speeds at or below 10km/h return 204 and never become alerts."""
    cliente = make_cliente('cli_insp_under')
    valet = make_valet('val_insp_under')
    req = make_valet_request(cliente, valet, status='accepted')
    sid = _service_id(req)

    res = client.post(
        '/inspection/speed-alert',
        data=json.dumps({'service_id': sid, 'speed_kmh': 8.0}),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert res.status_code == 204

    listed = client.get(
        f'/inspection/by-service/{sid}',
        headers=auth_header(cliente),
    )
    assert listed.get_json()['speed_alerts'] == []
