"""Integration tests for the cliente<->valet chat thread.

Covers:
    - Happy path: a valet request that's been accepted lets both parties
      open the conversation, exchange messages, and read each other's.
    - Alternative flow: a cliente whose request has not been accepted
      yet cannot open the conversation; a stranger cannot read it.
"""

from flask import json

from tests.integration.api.helpers import (
    auth_header,
    make_cliente,
    make_valet,
    make_valet_request,
)


# Happy path -----------------------------------------------------------------

def test_chat_get_or_create_for_accepted_request_creates_thread(client, session):
    cliente = make_cliente('cli_chat_ok')
    valet = make_valet('val_chat_ok')
    req = make_valet_request(cliente, valet, status='accepted')

    res = client.post(
        f'/chat/conversation/by-request/{req.id}',
        headers=auth_header(cliente),
    )

    assert res.status_code == 200
    body = res.get_json()
    assert body['status'] == 'success'

    conv = body['conversation']
    assert conv['kind'] == 'service'
    assert conv['valet_request_id'] == req.id
    assert conv['client_id'] == cliente.id
    assert conv['valet_id'] == valet.id

    # Calling it again is idempotent — same conversation comes back.
    res2 = client.post(
        f'/chat/conversation/by-request/{req.id}',
        headers=auth_header(valet),
    )
    assert res2.status_code == 200
    assert res2.get_json()['conversation']['id'] == conv['id']


def test_chat_message_round_trip_between_cliente_and_valet(client, session):
    cliente = make_cliente('cli_chat_msg')
    valet = make_valet('val_chat_msg')
    req = make_valet_request(cliente, valet, status='accepted')

    open_res = client.post(
        f'/chat/conversation/by-request/{req.id}',
        headers=auth_header(cliente),
    )
    conv_id = open_res.get_json()['conversation']['id']

    # Cliente sends.
    send_cli = client.post(
        f'/chat/conversation/{conv_id}/message',
        data=json.dumps({'message': 'Hola, voy llegando.'}),
        content_type='application/json',
        headers=auth_header(cliente),
    )
    assert send_cli.status_code == 201
    assert send_cli.get_json()['message']['sender_role'] == 'cliente'

    # Valet sends.
    send_val = client.post(
        f'/chat/conversation/{conv_id}/message',
        data=json.dumps({
            'message': 'Listo, te veo en la entrada.',
            'attachment_url': 'https://x/y.jpg',
        }),
        content_type='application/json',
        headers=auth_header(valet),
    )
    assert send_val.status_code == 201
    val_msg = send_val.get_json()['message']
    assert val_msg['sender_role'] == 'valet'
    assert val_msg['attachment_url'] == 'https://x/y.jpg'

    # Both can read both messages.
    list_res = client.get(
        f'/chat/conversation/{conv_id}/messages',
        headers=auth_header(cliente),
    )
    assert list_res.status_code == 200
    msgs = list_res.get_json()['messages']
    roles = [m['sender_role'] for m in msgs]
    assert 'cliente' in roles and 'valet' in roles


# Alternative flow -----------------------------------------------------------

def test_chat_cannot_open_thread_for_pending_request(client, session):
    """If the request hasn't been accepted yet, the conversation can't be
    opened — there's no valet to pair with."""
    cliente = make_cliente('cli_chat_pending')
    req = make_valet_request(cliente, valet_user=None, status='pending')

    res = client.post(
        f'/chat/conversation/by-request/{req.id}',
        headers=auth_header(cliente),
    )

    assert res.status_code == 400
    assert 'accepted' in res.get_json()['message'].lower()


def test_chat_stranger_cannot_open_or_read_service_thread(client, session):
    """A user that's neither the cliente nor the assigned valet is rejected."""
    cliente = make_cliente('cli_chat_strg')
    valet = make_valet('val_chat_strg')
    stranger = make_cliente('cli_chat_strg2')
    req = make_valet_request(cliente, valet, status='accepted')

    # Stranger cannot get-or-create.
    forbidden = client.post(
        f'/chat/conversation/by-request/{req.id}',
        headers=auth_header(stranger),
    )
    assert forbidden.status_code == 403

    # Cliente opens the thread normally.
    opened = client.post(
        f'/chat/conversation/by-request/{req.id}',
        headers=auth_header(cliente),
    )
    conv_id = opened.get_json()['conversation']['id']

    # Stranger cannot read messages.
    read = client.get(
        f'/chat/conversation/{conv_id}/messages',
        headers=auth_header(stranger),
    )
    assert read.status_code == 403
