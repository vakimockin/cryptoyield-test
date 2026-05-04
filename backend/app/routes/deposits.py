"""Deposit endpoints — implement here.

Endpoints to implement (see assignment PDF for full spec):

    POST /api/deposits/address      — return user's deposit address for a currency
    GET  /api/deposits              — list current user's deposits (paginated)
    POST /api/deposits/webhook      — public, idempotent: credit a confirmed deposit

Notes:
    - Use the `get_current_user` dependency for the two authenticated routes.
    - The webhook endpoint is public (no auth header) — find the user by address.
    - Use Decimal for money. Never float.
    - Idempotency on tx_hash and race-safety on balance updates are evaluated.
"""
from fastapi import APIRouter

router = APIRouter(tags=["deposits"])

# TODO(candidate): POST /deposits/address
# TODO(candidate): GET  /deposits
# TODO(candidate): POST /deposits/webhook
