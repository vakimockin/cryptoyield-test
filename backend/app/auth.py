from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User


def get_current_user(
    x_user_id: Annotated[str, Header(alias="X-User-Id")],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Resolve the current user from the X-User-Id header.

    Test-only auth. In production this would be a JWT bearer token.
    """
    try:
        user_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id header") from None

    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user
