"""Add idempotency constraints for deposits

Revision ID: 002
Revises: 001
Create Date: 2026-05-04

"""

from collections.abc import Sequence

from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_deposit_addresses_user_currency",
        "deposit_addresses",
        ["user_id", "currency"],
    )
    op.create_unique_constraint("uq_deposits_tx_hash", "deposits", ["tx_hash"])


def downgrade() -> None:
    op.drop_constraint("uq_deposits_tx_hash", "deposits", type_="unique")
    op.drop_constraint(
        "uq_deposit_addresses_user_currency",
        "deposit_addresses",
        type_="unique",
    )
