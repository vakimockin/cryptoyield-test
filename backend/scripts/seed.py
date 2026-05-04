"""Seed two test users for the test task."""
import sys
from uuid import UUID

from app.db import SessionLocal
from app.models import User

SEED_USERS = [
    (UUID("11111111-1111-1111-1111-111111111111"), "alice@cryptoyield.test"),
    (UUID("22222222-2222-2222-2222-222222222222"), "bob@cryptoyield.test"),
]


def main() -> int:
    db = SessionLocal()
    try:
        for user_id, email in SEED_USERS:
            existing = db.query(User).filter(User.id == user_id).first()
            if existing:
                print(f"User {email} already exists, skipping")
                continue
            db.add(User(id=user_id, email=email))
            print(f"Created user: {email}  X-User-Id: {user_id}")
        db.commit()
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
