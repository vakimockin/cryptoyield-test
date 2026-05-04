import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, unique=True)

    balance_btc = Column(Numeric(20, 8), nullable=False, default=Decimal("0"))
    balance_eth = Column(Numeric(20, 8), nullable=False, default=Decimal("0"))
    balance_usdt = Column(Numeric(20, 8), nullable=False, default=Decimal("0"))

    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class DepositAddress(Base):
    __tablename__ = "deposit_addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    currency = Column(String(10), nullable=False)
    address = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_deposit_addresses_user_currency", "user_id", "currency"),
        UniqueConstraint("user_id", "currency", name="uq_deposit_addresses_user_currency"),
    )


class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    address = Column(String, nullable=False)
    currency = Column(String(10), nullable=False)
    amount = Column(Numeric(20, 8), nullable=False)
    tx_hash = Column(String, nullable=False)
    status = Column(String(20), nullable=False, default="confirmed")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_deposits_tx_hash", "tx_hash"),
        Index("ix_deposits_user_created", "user_id", "created_at"),
        UniqueConstraint("tx_hash", name="uq_deposits_tx_hash"),
    )
