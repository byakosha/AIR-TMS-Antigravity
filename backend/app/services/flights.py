from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.entities import Flight

DEMO_FLIGHTS = [
    Flight(
        flight_number="SU-012",
        carrier_code="SU",
        airport_departure="SVO",
        airport_arrival="LED",
        etd=datetime(2026, 3, 19, 8, 20, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 19, 9, 55, tzinfo=timezone.utc),
        status_api="scheduled",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 19, 6, 0, tzinfo=timezone.utc),
    ),
    Flight(
        flight_number="FV-302",
        carrier_code="FV",
        airport_departure="LED",
        airport_arrival="MOW",
        etd=datetime(2026, 3, 19, 15, 10, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 19, 17, 0, tzinfo=timezone.utc),
        status_api="scheduled",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 19, 7, 0, tzinfo=timezone.utc),
    ),
    Flight(
        flight_number="SU-870",
        carrier_code="SU",
        airport_departure="AER",
        airport_arrival="SVO",
        etd=datetime(2026, 3, 21, 9, 40, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 21, 12, 55, tzinfo=timezone.utc),
        status_api="boarding",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 21, 8, 0, tzinfo=timezone.utc),
    ),
    Flight(
        flight_number="SU-123",
        carrier_code="SU",
        airport_departure="KHV",
        airport_arrival="MOW",
        etd=datetime(2026, 3, 20, 17, 10, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 20, 22, 15, tzinfo=timezone.utc),
        status_api="scheduled",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 20, 11, 0, tzinfo=timezone.utc),
    ),
    Flight(
        flight_number="S7-2044",
        carrier_code="S7",
        airport_departure="DME",
        airport_arrival="KGD",
        etd=datetime(2026, 3, 20, 11, 35, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 20, 13, 25, tzinfo=timezone.utc),
        status_api="delayed",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 20, 8, 30, tzinfo=timezone.utc),
    ),
    Flight(
        flight_number="R3-557",
        carrier_code="R3",
        airport_departure="UUS",
        airport_arrival="DME",
        etd=datetime(2026, 3, 21, 13, 15, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 21, 17, 20, tzinfo=timezone.utc),
        status_api="scheduled",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 21, 10, 10, tzinfo=timezone.utc),
    ),
]


def seed_demo_flights(db: Session) -> int:
    existing_numbers = {row[0] for row in db.query(Flight.flight_number).all()}
    created = 0
    for demo_flight in DEMO_FLIGHTS:
        if demo_flight.flight_number in existing_numbers:
            continue
        db.add(demo_flight)
        created += 1
    if created:
        db.commit()
    return created
