from datetime import datetime, timezone

from app.models.entities import PlanningWorkbenchRow
from app.schemas.workbench import AssignAwbRequest, AssignFlightRequest, SplitWorkbenchRowRequest, WorkbenchFilters
from app.services.workbench import (
    assign_awb_to_row,
    assign_flight_to_row,
    build_workbench_query,
    export_workbench_rows_csv,
    fix_plan,
    seed_demo_workbench,
    split_workbench_row,
)


def test_seed_demo_workbench_populates_rows(db_session):
    created = seed_demo_workbench(db_session)
    assert created == 8
    assert db_session.query(PlanningWorkbenchRow).count() == 8


def test_workbench_filter_by_airport(db_session):
    seed_demo_workbench(db_session)
    rows = build_workbench_query(db_session, WorkbenchFilters(airport_code="SVO")).all()
    assert len(rows) == 1
    assert rows[0].airport_code == "SVO"


def test_workbench_filter_by_date_range_and_export_csv(db_session):
    seed_demo_workbench(db_session)
    rows = build_workbench_query(
        db_session,
        WorkbenchFilters(
            workbench_date_from=datetime(2026, 3, 19, tzinfo=timezone.utc),
            workbench_date_to=datetime(2026, 3, 19, tzinfo=timezone.utc),
        ),
    ).all()
    assert len(rows) == 2

    csv_text = export_workbench_rows_csv(rows)
    assert "direction_code,workbench_date" not in csv_text
    assert "SVO" in csv_text
    assert "DME" in csv_text


def test_workbench_filter_by_temperature_mode(db_session):
    seed_demo_workbench(db_session)
    rows = build_workbench_query(db_session, WorkbenchFilters(temperature_mode="+15..+25")).all()
    assert len(rows) == 1
    assert rows[0].airport_code == "DME"


def test_workbench_filter_by_no_temperature_control(db_session):
    seed_demo_workbench(db_session)
    rows = build_workbench_query(db_session, WorkbenchFilters(temperature_mode="NO_TEMP_CONTROL")).all()
    assert len(rows) == 2
    assert {row.airport_code for row in rows} == {"ZIA", "AER"}


def test_split_assign_and_fix_plan_flow(db_session):
    seed_demo_workbench(db_session)
    row = db_session.query(PlanningWorkbenchRow).filter(PlanningWorkbenchRow.airport_code == "SVO").one()

    split_workbench_row(
        db_session,
        row,
        SplitWorkbenchRowRequest(
            split_places_count=4,
            awb_number="555-00000001",
            planned_flight_number="SU-001",
            operator_comment="split for partial shipment",
        ),
    )
    db_session.commit()

    rows = db_session.query(PlanningWorkbenchRow).filter(PlanningWorkbenchRow.airport_code == "SVO").all()
    assert len(rows) == 2
    assert sum(item.places_count for item in rows) == 14

    target = rows[0]
    assign_awb_to_row(
        db_session,
        target,
        AssignAwbRequest(
            awb_number="555-12345675",
            route_from="MOW",
            route_to="SVO",
        ),
    )
    assign_flight_to_row(
        db_session,
        target,
        AssignFlightRequest(
            flight_number="SU-012",
            carrier_code="SU",
            airport_departure="MOW",
            airport_arrival="SVO",
            etd=datetime(2026, 3, 19, 10, 0, tzinfo=timezone.utc),
        ),
    )

    errors = fix_plan(db_session, [target])
    assert errors == []
