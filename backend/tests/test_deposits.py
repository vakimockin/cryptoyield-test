from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier

from fastapi.testclient import TestClient

from app.main import app
from app.models import Deposit, DepositAddress, User

TEST_USER_HEADER = {"X-User-Id": "33333333-3333-3333-3333-333333333333"}


def test_deposit_address_is_idempotent(client, test_user):
    first = client.post(
        "/api/deposits/address",
        json={"currency": "ETH"},
        headers=TEST_USER_HEADER,
    )
    second = client.post(
        "/api/deposits/address",
        json={"currency": "ETH"},
        headers=TEST_USER_HEADER,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["address"] == second.json()["address"]
    assert first.json()["currency"] == "ETH"


def test_webhook_is_idempotent_by_tx_hash(client, db, test_user):
    address = DepositAddress(
        user_id=test_user.id,
        currency="ETH",
        address="0x1111111111111111111111111111111111111111",
    )
    db.add(address)
    db.commit()

    payload = {
        "address": address.address,
        "tx_hash": "0xabc123",
        "amount": "12.5",
        "currency": "ETH",
    }

    first = client.post("/api/deposits/webhook", json=payload)
    second = client.post("/api/deposits/webhook", json=payload)

    db.expire_all()
    user = db.query(User).filter(User.id == test_user.id).one()
    deposits_count = db.query(Deposit).filter(Deposit.tx_hash == "0xabc123").count()

    assert first.status_code == 200
    assert first.json() == {"status": "confirmed"}
    assert second.status_code == 200
    assert second.json() == {"status": "ignored"}
    assert user.balance_eth == Decimal("12.50000000")
    assert deposits_count == 1


def test_webhook_unknown_address_returns_404(client, test_user):
    response = client.post(
        "/api/deposits/webhook",
        json={
            "address": "0x9999999999999999999999999999999999999999",
            "tx_hash": "0xmissing",
            "amount": "1.0",
            "currency": "ETH",
        },
    )

    assert response.status_code == 404


def test_webhook_concurrent_requests_sum_balance_correctly(db, test_user):
    address = DepositAddress(
        user_id=test_user.id,
        currency="ETH",
        address="0x2222222222222222222222222222222222222222",
    )
    db.add(address)
    db.commit()

    barrier = Barrier(2)
    payloads = [
        {
            "address": address.address,
            "tx_hash": "0xconcurrent1",
            "amount": "1.25",
            "currency": "ETH",
        },
        {
            "address": address.address,
            "tx_hash": "0xconcurrent2",
            "amount": "2.75",
            "currency": "ETH",
        },
    ]

    def send_webhook(payload: dict[str, str]):
        with TestClient(app) as threaded_client:
            barrier.wait()
            response = threaded_client.post("/api/deposits/webhook", json=payload)
            return response.status_code, response.json()

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(send_webhook, payloads))

    db.expire_all()
    user = db.query(User).filter(User.id == test_user.id).one()
    deposits_count = (
        db.query(Deposit).filter(Deposit.tx_hash.in_(["0xconcurrent1", "0xconcurrent2"])).count()
    )

    assert sorted(results) == [
        (200, {"status": "confirmed"}),
        (200, {"status": "confirmed"}),
    ]
    assert user.balance_eth == Decimal("4.00000000")
    assert deposits_count == 2
