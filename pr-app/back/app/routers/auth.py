"""Login, logout, current-user endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import LoginIn, UserOut
from ..security import COOKIE_NAME, clear_session, current_user, issue_session, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter_by(username=payload.username).one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
    issue_session(db, user, response)
    return user


@router.post("/logout")
def logout(
    response: Response,
    pr_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> dict:
    clear_session(db, pr_token, response)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> User:
    return user
