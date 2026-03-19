from __future__ import annotations

import time

from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine
from app.models import entities  # noqa: F401
from app.services.flights import seed_demo_flights
from app.services.users import seed_demo_users
from app.services.workbench import seed_demo_workbench


def initialize_database(retries: int = 10, delay_seconds: float = 2.0) -> None:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with engine.begin() as connection:
                connection.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            return
        except Exception as exc:  # pragma: no cover - bootstrap path
            last_error = exc
            if attempt < retries:
                time.sleep(delay_seconds)
            else:
                raise last_error


def seed_if_needed() -> None:
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        seed_demo_workbench(db)
        seed_demo_flights(db)
        seed_demo_users(db)
    finally:
        db.close()
