from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_serializer
from sqlalchemy import func, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Deposit, DepositAddress, User
from app.services.address_gen import generate_address

router = APIRouter(tags=["deposits"])


class Currency(StrEnum):
    BTC = "BTC"
    ETH = "ETH"
    USDT = "USDT"


class DepositAddressRequest(BaseModel):
    currency: Currency


class DepositAddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    address: str
    currency: Currency
    created_at: datetime


class DepositItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    currency: Currency
    amount: Decimal
    tx_hash: str
    status: str
    created_at: datetime
    confirmed_at: datetime | None

    @field_serializer("amount")
    def serialize_amount(self, amount: Decimal) -> str:
        return str(amount)


class DepositsListResponse(BaseModel):
    items: list[DepositItem]
    total: int


class WebhookRequest(BaseModel):
    address: str = Field(min_length=1)
    tx_hash: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: Currency


class WebhookResponse(BaseModel):
    status: str


BALANCE_COLUMNS = {
    Currency.BTC: User.balance_btc,
    Currency.ETH: User.balance_eth,
    Currency.USDT: User.balance_usdt,
}


def _get_existing_address(
    db: Session,
    user_id: UUID,
    currency: Currency,
) -> DepositAddress | None:
    return (
        db.query(DepositAddress)
        .filter(
            DepositAddress.user_id == user_id,
            DepositAddress.currency == currency.value,
        )
        .first()
    )


@router.post("/deposits/address", response_model=DepositAddressResponse)
def get_or_create_deposit_address(
    payload: DepositAddressRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DepositAddress:
    existing = _get_existing_address(db, current_user.id, payload.currency)
    if existing is not None:
        return existing

    deposit_address = DepositAddress(
        user_id=current_user.id,
        currency=payload.currency.value,
        address=generate_address(payload.currency.value),
    )
    db.add(deposit_address)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = _get_existing_address(db, current_user.id, payload.currency)
        if existing is not None:
            return existing
        raise

    db.refresh(deposit_address)
    return deposit_address


@router.get("/deposits", response_model=DepositsListResponse)
def list_deposits(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> DepositsListResponse:
    query = db.query(Deposit).filter(Deposit.user_id == current_user.id)
    total = query.with_entities(func.count(Deposit.id)).scalar() or 0
    items = query.order_by(Deposit.created_at.desc()).limit(limit).offset(offset).all()
    return DepositsListResponse(items=items, total=total)


@router.post("/deposits/webhook", response_model=WebhookResponse)
def handle_deposit_webhook(
    payload: WebhookRequest,
    db: Annotated[Session, Depends(get_db)],
) -> WebhookResponse:
    # Production hardening: verify an HMAC signature over the raw body before this point.
    deposit_address = (
        db.query(DepositAddress)
        .filter(
            DepositAddress.address == payload.address,
            DepositAddress.currency == payload.currency.value,
        )
        .first()
    )
    if deposit_address is None:
        raise HTTPException(status_code=404, detail="Unknown deposit address")

    existing_deposit = db.query(Deposit.id).filter(Deposit.tx_hash == payload.tx_hash).first()
    if existing_deposit is not None:
        return WebhookResponse(status="ignored")

    deposit = Deposit(
        user_id=deposit_address.user_id,
        address=deposit_address.address,
        currency=payload.currency.value,
        amount=payload.amount,
        tx_hash=payload.tx_hash,
        status="confirmed",
        confirmed_at=datetime.utcnow(),
    )
    db.add(deposit)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        duplicate = db.query(Deposit.id).filter(Deposit.tx_hash == payload.tx_hash).first()
        if duplicate is not None:
            return WebhookResponse(status="ignored")
        raise

    balance_column = BALANCE_COLUMNS[payload.currency]
    db.execute(
        update(User)
        .where(User.id == deposit_address.user_id)
        .values({balance_column.key: balance_column + payload.amount})
    )
    db.commit()

    return WebhookResponse(status="confirmed")
