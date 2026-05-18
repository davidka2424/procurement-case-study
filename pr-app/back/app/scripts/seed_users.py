"""One-shot: insert seed users.

Invoked by the `seed-users` Docker Compose service. Idempotent — if any of
the seed usernames already exists, that user is left alone."""
from __future__ import annotations

from app.db import SessionLocal
from app.models import User
from app.security import hash_password


SEED_USERS: list[tuple[str, str, str]] = [
    ("alice",    "password123", "employee"),
    ("bob",      "password123", "employee"),
    ("finadmin", "password123", "finance"),
]


def main() -> None:
    with SessionLocal() as db:
        existing = {u.username for u in db.query(User).all()}
        added: list[str] = []
        for username, password, role in SEED_USERS:
            if username in existing:
                continue
            db.add(User(
                username=username,
                password_hash=hash_password(password),
                role=role,
            ))
            added.append(f"{username} ({role})")
        db.commit()
        if added:
            print(f"seed-users: inserted {len(added)} → {', '.join(added)}")
        else:
            print("seed-users: all seed users already present.")


if __name__ == "__main__":
    main()
