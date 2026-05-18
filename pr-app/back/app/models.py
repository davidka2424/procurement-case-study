"""SQLAlchemy models. Kept intentionally simple — there is no migrations setup,
no Alembic, no `Supplier` table. All of that is on the candidate's list."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))  # 'employee' | 'finance'

    requests: Mapped[list["PurchaseRequest"]] = relationship(
        back_populates="author_user", cascade="all, delete-orphan"
    )


class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Stored as the username string so it matches the spec ("request_author"),
    # but a FK on author_id would be cleaner — flag this in your review.
    request_author: Mapped[str] = mapped_column(String(80), index=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    request_name: Mapped[str] = mapped_column(String(200))
    request_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    supplier_name: Mapped[str] = mapped_column(String(200))
    supplier_email: Mapped[str] = mapped_column(String(200))
    request_details: Mapped[str] = mapped_column(Text)
    request_approval_status: Mapped[str] = mapped_column(String(40), default="initiated")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    author_user: Mapped[User | None] = relationship(back_populates="requests")


class Session(Base):
    """Naive session/token store. There is no expiry handling — fix this."""

    __tablename__ = "pr_sessions"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
