"""One-shot: create all tables (idempotent).

Invoked by the `init-db` Docker Compose service. Safe to re-run."""
from __future__ import annotations

import time

from app.db import Base, engine
from app import models  # noqa: F401  ensures models register with Base.metadata


def _wait_for_db(retries: int = 30, delay: float = 1.0) -> None:
    """Postgres can take a beat to be ready even after healthcheck flips.

    We catch the broad `Exception` here rather than `sqlalchemy.exc.OperationalError`
    — the driver may raise different concrete types depending on what's wrong
    (connection refused, auth not ready, db not yet created), and we treat them
    all the same way: wait and retry.
    """
    last_err: Exception | None = None
    for _ in range(retries):
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
            return
        except Exception as exc:  # noqa: BLE001 — retry on any connection issue
            last_err = exc
            time.sleep(delay)
    raise RuntimeError(f"Database did not become reachable: {last_err}")


def main() -> None:
    _wait_for_db()
    Base.metadata.create_all(engine)
    print("init-db: schema is present.")


if __name__ == "__main__":
    main()
