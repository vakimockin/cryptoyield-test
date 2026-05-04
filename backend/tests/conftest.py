from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.db import SessionLocal, engine
from app.main import app
from app.models import Base, Deposit, DepositAddress, User

TEST_USER_ID = UUID("33333333-3333-3333-3333-333333333333")


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Deposit).filter(Deposit.user_id == TEST_USER_ID).delete()
        db.query(DepositAddress).filter(DepositAddress.user_id == TEST_USER_ID).delete()
        db.query(User).filter(User.id == TEST_USER_ID).delete()
        db.commit()
        yield
    finally:
        db.query(Deposit).filter(Deposit.user_id == TEST_USER_ID).delete()
        db.query(DepositAddress).filter(DepositAddress.user_id == TEST_USER_ID).delete()
        db.query(User).filter(User.id == TEST_USER_ID).delete()
        db.commit()
        db.close()


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(db):
    user = User(id=TEST_USER_ID, email="test-user@cryptoyield.test")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c
