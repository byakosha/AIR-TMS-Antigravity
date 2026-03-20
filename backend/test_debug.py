import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.entities import PlanningWorkbenchRow, User
from app.models.planning_rules import SupplyChainRule, AirlineDetails, AwbBlankRange
from app.api.v1.endpoints.workbench import auto_plan_workbench
from app.services.workbench import seed_demo_workbench

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

seed_demo_workbench(db)

rule = SupplyChainRule(airport_code="DME", carrier_code="SU")
db.add(rule)

airline = AirlineDetails(carrier_code="SU", name="Aeroflot", awb_prefix="555")
db.add(airline)
db.commit()

blank = AwbBlankRange(
    airline_id=airline.id,
    is_active=True,
    start_number=1000,
    end_number=2000,
    current_number=1000
)
db.add(blank)
db.commit()

dummy_user = User(username="test", password_hash="xx")

try:
    res = auto_plan_workbench(db, current_user=dummy_user)
    print("RES:", res)
except Exception as e:
    print("EXCEPTION:", repr(e))
    # Let's see what's in the DB
    print("RULES:", [(r.airport_code, r.carrier_code) for r in db.query(SupplyChainRule).all()])
    print("AIRLINES:", [(a.id, a.carrier_code) for a in db.query(AirlineDetails).all()])
    print("BLANKS:", [(b.airline_id, b.is_active, b.current_number) for b in db.query(AwbBlankRange).all()])
    
    unplanned = db.query(PlanningWorkbenchRow).filter(
        PlanningWorkbenchRow.awb_number.is_(None),
        PlanningWorkbenchRow.booking_status == "pending"
    ).all()
    print("UNPLANNED AIRPORTS:", [r.airport_code for r in unplanned])
