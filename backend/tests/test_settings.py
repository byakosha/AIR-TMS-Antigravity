from __future__ import annotations

from datetime import datetime, timezone

from app.data.airports import AIRPORTS
from app.models.entities import AirWaybill, Flight, PlanningWorkbenchRow
from app.services.settings import get_settings_summary


def test_get_settings_summary_reports_live_counts(db_session):
    awb = AirWaybill(
        awb_number="555-12345678",
        is_manual_number=True,
        temperature_mode="+2..+8",
        route_from="SVO",
        route_to="LED",
        places_count=4,
        weight_total=25.0,
        volume_total=0.4,
        status="draft",
        comments="demo awb",
    )
    flight = Flight(
        flight_number="SU-123",
        carrier_code="SU",
        airport_departure="SVO",
        airport_arrival="LED",
        etd=datetime(2026, 3, 19, 8, 0, tzinfo=timezone.utc),
        eta=datetime(2026, 3, 19, 10, 0, tzinfo=timezone.utc),
        status_api="scheduled",
        status_internal="planned",
        source_type="manual",
        last_synced_at=datetime(2026, 3, 19, 6, 0, tzinfo=timezone.utc),
    )

    db_session.add_all([awb, flight])
    db_session.flush()

    row = PlanningWorkbenchRow(
        workbench_date=datetime(2026, 3, 19, 0, 0, tzinfo=timezone.utc),
        direction_code="MOW-SVO",
        direction_name="Moscow - Sheremetyevo",
        airport_code="SVO",
        linked_order_ids=[101, 102],
        temperature_mode="+2..+8",
        cargo_profile="medical",
        box_type_summary="2 x coolbox",
        places_count=4,
        weight_total=25.0,
        volume_total=0.4,
        awb_id=awb.id,
        awb_number=awb.awb_number,
        planned_flight_id=flight.id,
        planned_flight_number=flight.flight_number,
        booking_status="confirmed",
        handover_status="handed_over_full",
        execution_status="pending",
        operator_comment="demo row",
        color_tag="blue",
        custom_sort_order=1,
        owner_user_id=1,
        is_outside_final_manifest=False,
    )
    db_session.add(row)
    db_session.commit()

    summary = get_settings_summary(db_session)

    assert len(summary.sections) == 5
    assert {section.key for section in summary.sections} == {"directories", "rules", "integrations", "access", "users"}
    assert summary.hero_stats[0].value == str(len(AIRPORTS))
    assert summary.hero_stats[1].value == "1"
    assert summary.hero_stats[2].value == "1"
    assert summary.hero_stats[3].value == "1"
    assert summary.operational_notes
