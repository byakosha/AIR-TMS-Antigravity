import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.entities import Order, PlanningWorkbenchRow, AirWaybill, Flight, FlightAssignment
from app.tasks.tms_sync import sync_orders_from_tms
from app.services.workbench import assign_awb_to_row, assign_flight_to_row, fix_plan
from app.schemas.workbench import AssignAwbRequest, AssignFlightRequest

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Monkeypatch the SessionLocal in tms_sync
import app.tasks.tms_sync
app.tasks.tms_sync.SessionLocal = lambda: SessionLocal()

print("1. Triggering TMS Sync...")
res = sync_orders_from_tms()
print(f"Sync result: {res}")

db = SessionLocal()

# 2. Check Orders and Workbench Rows
orders = db.query(Order).all()
print(f"Found {len(orders)} orders.")
rows = db.query(PlanningWorkbenchRow).all()
print(f"Found {len(rows)} workbench rows.")

if not rows:
    print("No rows generated, exiting!")
    sys.exit(1)

target_row = rows[0]
print(f"Targeting row {target_row.id} for {target_row.airport_code}")

# 3. Emulate Booking & Execution flow
print("Assigning AWB...")
assign_awb_to_row(
    db,
    target_row,
    AssignAwbRequest(
        awb_number="999-00001111",
        route_from="MOW",
        route_to=target_row.airport_code,
    )
)

print("Assigning Flight...")
assign_flight_to_row(
    db,
    target_row,
    AssignFlightRequest(
        flight_number="TEST-123",
        carrier_code="TE",
        airport_departure="MOW",
        airport_arrival=target_row.airport_code,
        etd=datetime.now(timezone.utc),
    )
)

print("Fixing Plan...")
errors = fix_plan(db, [target_row])
if errors:
    print(f"Errors during fix: {errors}")
    sys.exit(1)

db.commit()

# Verify state
db.refresh(target_row)
print(f"Booking status: {target_row.booking_status}")
print(f"Execution status: {target_row.execution_status}")
print(f"AWB: {target_row.awb_number}")
print(f"Flight: {target_row.planned_flight_number}")

print("\n--- Full E2E Success! ---")
