"""Integration tests for the /belongings endpoints.

Covers:
    - Happy path: cliente declares an item, valet can read it, cliente
      reports it as missing later.
    - Alternative flow: a valet attempts to declare belongings on the
      client's behalf and is rejected; missing required fields → 400.
"""

from flask import json

from tests.integration.api.helpers import (
    auth_header,
    make_cliente,
    make_valet,
    make_valet_request,
)


# Happy path -----------------------------------------------------------------

def test_belonging_create_list_and_report_missing(client, session):
    cliente = make_cliente('cli_bel_ok')
    valet = make_valet('val_bel_ok')
    req = make_valet_request(cliente, valet, status='accepted')

    create = client.post(
        '/belongings',
        data=json.dumps({
            'valet_request_id': req.id,
            'description': 'Maletín gris',
            'quantity': 2,
            'photos': ['https://x/p1.jpg'],
        }),
        content_type='application/json',
        headers=auth_header(cliente),
    )

    assert create.status_code == 201
    item = create.get_json()['belonging']
    assert item['description'] == 'Maletín gris'
    assert item['quantity'] == 2
    assert item['photos'] == ['https://x/p1.jpg']
    assert item['reported_missing'] is False
    item_id = item['id']

    # Valet can list.
    listed = client.get(
        f'/belongings/by-request/{req.id}',
        headers=auth_header(valet),
    )
    assert listed.status_code == 200
    assert len(listed.get_json()['belongings']) == 1

    # Cliente flips reported_missing.
    patched = client.patch(
        f'/belongings/{item_id}',
        data=json.dumps({'reported_missing': True}),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert patched.status_code == 200
    updated = patched.get_json()['belonging']
    assert updated['reported_missing'] is True
    assert updated['missing_reported_at'] is not None


# Alternative flow -----------------------------------------------------------

def test_belonging_valet_cannot_declare_belongings(client, session):
    """Only the cliente (request owner) may create entries."""
    cliente = make_cliente('cli_bel_forbid')
    valet = make_valet('val_bel_forbid')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.post(
        '/belongings',
        data=json.dumps({
            'valet_request_id': req.id,
            'description': 'Llaves extra',
            'quantity': 1,
            'photos': [],
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert res.status_code == 403


def test_belonging_create_rejects_missing_fields(client, session):
    cliente = make_cliente('cli_bel_400')
    valet = make_valet('val_bel_400')
    req = make_valet_request(cliente, valet, status='accepted')

    # No description.
    bad1 = client.post(
        '/belongings',
        data=json.dumps({'valet_request_id': req.id, 'quantity': 1}),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert bad1.status_code == 400

    # Quantity below 1.
    bad2 = client.post(
        '/belongings',
        data=json.dumps({
            'valet_request_id': req.id,
            'description': 'Algo',
            'quantity': 0,
        }),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert bad2.status_code == 400
