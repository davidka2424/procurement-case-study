"""User admin — exposed via Swagger only (no frontend page)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import UserCreate, UserEdit, UserOut
from ..security import hash_password, require_role

router = APIRouter(tags=["users"])

finance_only = require_role("finance")


@router.post("/create-user", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(finance_only),
) -> User:
    if db.query(User).filter_by(username=payload.username).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/edit-user/{user_id}", response_model=UserOut)
def edit_user(
    user_id: int,
    payload: UserEdit,
    db: Session = Depends(get_db),
    _: User = Depends(finance_only),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if payload.username is not None:
        user.username = payload.username
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    if payload.role is not None:
        user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
