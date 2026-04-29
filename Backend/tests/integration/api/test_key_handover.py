"""Integration tests for /keys (key handover) endpoints.

Covers:
    - Happy path: valet drops off the keys with photo evidence; cliente
      reads the record; cliente confirms return.
    - Alternative flow: cliente cannot register the drop-off; second
      drop-off on the same service is rejected (409).
"""

from flask import json

from tests.integration.api.helpers import (
    auth_header,
    make_cliente,
    make_valet,
    make_valet_request,
)


def _service_id(req):
    """Convenience — service_id is set when the request is accepted."""
    return req.service_id


# Happy path -----------------------------------------------------------------

def test_key_handover_full_flow(client, session):
    cliente = make_cliente('cli_keys_ok')
    valet = make_valet('val_keys_ok')
    req = make_valet_request(cliente, valet, status='accepted')

    drop = client.post(
        '/keys/dropoff',
        data=json.dumps({
            'service_id': _service_id(req),
            'location_label': 'Caja fuerte 14',
            'evidence_photo': 'https://x/keys.jpg',
            'notes': 'Detrás del cilindro',
            'latitude': 4.65,
            'longitude': -74.05,
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert drop.status_code == 201
    handover = drop.get_json()['handover']
    assert handover['status'] == 'stored'
    assert handover['location_label'] == 'Caja fuerte 14'
    assert handover['evidence_photo'] == 'https://x/keys.jpg'
    handover_id = handover['id']

    # Cliente can fetch the record.
    fetched = client.get(
        f'/keys/by-service/{_service_id(req)}',
        headers=auth_header(cliente),
    )
    assert fetched.status_code == 200
    assert fetched.get_json()['handover']['id'] == handover_id

    # Cliente confirms return.
    returned = client.post(
        f'/keys/{handover_id}/return',
        headers=auth_header(cliente),
    )
    assert returned.status_code == 200
    assert returned.get_json()['handover']['status'] == 'returned'
    assert returned.get_json()['handover']['returned_at'] is not None


# Alternative flow -----------------------------------------------------------

def test_key_handover_cliente_cannot_register_dropoff(client, session):
    cliente = make_cliente('cli_keys_forbid')
    valet = make_valet('val_keys_forbid')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.post(
        '/keys/dropoff',
        data=json.dumps({
            'service_id': _service_id(req),
            'location_label': 'Mi bolsillo',
            'evidence_photo': 'https://x/k.jpg',
        }),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert res.status_code == 403


def test_key_handover_rejects_duplicate_dropoff(client, session):
    cliente = make_cliente('cli_keys_dup')
    valet = make_valet('val_keys_dup')
    req = make_valet_request(cliente, valet, status='accepted')

    payload = {
        'service_id': _service_id(req),
        'location_label': 'Caja A',
        'evidence_photo': 'https://x/k.jpg',
    }
    first = client.post(
        '/keys/dropoff',
        data=json.dumps(payload),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert first.status_code == 201

    second = client.post(
        '/keys/dropoff',
        data=json.dumps(payload),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert second.status_code == 409
    assert 'already' in second.get_json()['message'].lower()
