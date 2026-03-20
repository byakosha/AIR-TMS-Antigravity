from app.api.v1.endpoints.workbench import auto_plan_workbench
from app.models.entities import PlanningWorkbenchRow, User
from app.models.planning_rules import SupplyChainRule, AirlineDetails, AwbBlankRange
from app.services.workbench import seed_demo_workbench

def test_auto_plan_logic(db_session):
    seed_demo_workbench(db_session)
    
    # 1. Add Rule
    rule = SupplyChainRule(
        airport_code="ZIA",
        carrier_code="SU"
    )
    db_session.add(rule)
    
    # 2. Add Airline
    airline = AirlineDetails(
        carrier_code="SU",
        name="Aeroflot",
        awb_prefix="555"
    )
    db_session.add(airline)
    db_session.commit()
    
    # 3. Add Blanks
    blank = AwbBlankRange(
        airline_id=airline.id,
        is_active=True,
        start_number=1000,
        end_number=2000,
        current_number=1000
    )
    db_session.add(blank)
    db_session.commit()

    # 4. Dummy user
    dummy_user = User(username="test", password_hash="xx")

    # 5. Execute Auto Plan
    res = auto_plan_workbench(db_session, current_user=dummy_user)
    
    print("Auto-plan result:", res)
    assert res["status"] == "success"
    
    # 6. Verify ZIA got an AWB assigned correctly
    rows = db_session.query(PlanningWorkbenchRow).filter(PlanningWorkbenchRow.airport_code=="ZIA").all()
    assert len(rows) > 0
    for row in rows:
        if row.booking_status == "pending":
            assert row.awb_number is not None
            assert row.awb_number.startswith("555-0001000")
            assert row.is_auto_planned is True
