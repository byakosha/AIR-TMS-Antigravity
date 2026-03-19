from __future__ import annotations

import csv
import io
from datetime import datetime, time, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.entities import (
    AirWaybill,
    ChangeLog,
    Flight,
    FlightAssignment,
    PlanningWorkbenchRow,
)
from app.schemas.workbench import (
    AssignAwbRequest,
    AssignFlightRequest,
    FixPlanRequest,
    MergeWorkbenchRowsRequest,
    SplitWorkbenchRowRequest,
    WorkbenchFilters,
)


def _utc_midnight(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def seed_demo_workbench(db: Session) -> int:
    demo_rows = [
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 19, 6, 0, tzinfo=timezone.utc),
            direction_code="MOW-SVO",
            direction_name="Moscow - Sheremetyevo",
            airport_code="SVO",
            linked_order_ids=[10021, 10022],
            temperature_mode="+2..+8",
            cargo_profile="temperature_controlled",
            box_type_summary="2 boxes",
            places_count=14,
            weight_total=120.5,
            volume_total=1.1,
            awb_number="555-12345675",
            planned_flight_number="SU-012",
            booking_status="pending",
            handover_status="not_handed_over",
            execution_status="pending",
            color_tag="gold",
            custom_sort_order=1,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 19, 11, 0, tzinfo=timezone.utc),
            direction_code="MOW-DME",
            direction_name="Moscow - Domodedovo",
            airport_code="DME",
            linked_order_ids=[10033],
            temperature_mode="+15..+25",
            cargo_profile="general",
            box_type_summary="1 pallet",
            places_count=6,
            weight_total=40.0,
            volume_total=0.4,
            booking_status="draft",
            handover_status="not_handed_over",
            execution_status="pending",
            color_tag="blue",
            custom_sort_order=2,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 20, 8, 30, tzinfo=timezone.utc),
            direction_code="MOW-VKO",
            direction_name="Moscow - Vnukovo",
            airport_code="VKO",
            linked_order_ids=[10040, 10041, 10042],
            temperature_mode="-20",
            cargo_profile="vip",
            box_type_summary="3 crates",
            places_count=9,
            weight_total=86.0,
            volume_total=0.9,
            booking_status="confirmed",
            handover_status="handed_over_partial",
            execution_status="flown_partial",
            operator_comment="Residual 2 places moved to next flight",
            color_tag="green",
            custom_sort_order=3,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 20, 12, 45, tzinfo=timezone.utc),
            direction_code="MOW-ZIA",
            direction_name="Moscow - Zhukovsky",
            airport_code="ZIA",
            linked_order_ids=[10051],
            temperature_mode="NO_TEMP_CONTROL",
            cargo_profile="general",
            box_type_summary="1 crate",
            places_count=4,
            weight_total=28.0,
            volume_total=0.24,
            booking_status="pending",
            handover_status="not_handed_over",
            execution_status="pending",
            color_tag="purple",
            custom_sort_order=4,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 20, 15, 20, tzinfo=timezone.utc),
            direction_code="LED-MOW",
            direction_name="Saint Petersburg - Moscow",
            airport_code="LED",
            linked_order_ids=[10061, 10062],
            temperature_mode="+8",
            cargo_profile="medical",
            box_type_summary="4 coolboxes",
            places_count=12,
            weight_total=92.4,
            volume_total=0.88,
            awb_number="555-12345676",
            planned_flight_number="FV-302",
            booking_status="confirmed",
            handover_status="handed_over_full",
            execution_status="pending",
            color_tag="blue",
            custom_sort_order=5,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 20, 17, 10, tzinfo=timezone.utc),
            direction_code="KHV-MOW",
            direction_name="Khabarovsk - Moscow",
            airport_code="KHV",
            linked_order_ids=[10071],
            temperature_mode="-70",
            cargo_profile="deep_freeze",
            box_type_summary="Dry ice box",
            places_count=2,
            weight_total=14.8,
            volume_total=0.16,
            booking_status="pending",
            handover_status="not_handed_over",
            execution_status="pending",
            color_tag="red",
            custom_sort_order=6,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 21, 9, 40, tzinfo=timezone.utc),
            direction_code="AER-MOW",
            direction_name="Sochi - Moscow",
            airport_code="AER",
            linked_order_ids=[10081, 10082, 10083],
            temperature_mode="NO_TEMP_CONTROL",
            cargo_profile="general",
            box_type_summary="2 pallets",
            places_count=8,
            weight_total=60.0,
            volume_total=0.72,
            awb_number="555-12345677",
            planned_flight_number="SU-870",
            booking_status="partial",
            handover_status="handed_over_partial",
            execution_status="flown_partial",
            operator_comment="One pallet moved to the next departure",
            color_tag="orange",
            custom_sort_order=7,
        ),
        PlanningWorkbenchRow(
            workbench_date=datetime(2026, 3, 21, 13, 15, tzinfo=timezone.utc),
            direction_code="UUS-MOW",
            direction_name="Yuzhno-Sakhalinsk - Moscow",
            airport_code="UUS",
            linked_order_ids=[10091],
            temperature_mode="+2..+8",
            cargo_profile="temperature_controlled",
            box_type_summary="1 pallet / 2 boxes",
            places_count=5,
            weight_total=34.2,
            volume_total=0.31,
            booking_status="draft",
            handover_status="not_handed_over",
            execution_status="pending",
            color_tag="gray",
            custom_sort_order=8,
        ),
    ]
    existing_rows = {
        row.direction_code: row
        for row in db.query(PlanningWorkbenchRow).filter(
            PlanningWorkbenchRow.direction_code.in_([row.direction_code for row in demo_rows])
        )
    }

    created_or_updated = 0
    for demo_row in demo_rows:
        existing_row = existing_rows.get(demo_row.direction_code)
        if existing_row is None:
            db.add(demo_row)
            created_or_updated += 1
            continue

        existing_row.workbench_date = demo_row.workbench_date
        existing_row.direction_name = demo_row.direction_name
        existing_row.airport_code = demo_row.airport_code
        existing_row.linked_order_ids = demo_row.linked_order_ids
        existing_row.temperature_mode = demo_row.temperature_mode
        existing_row.cargo_profile = demo_row.cargo_profile
        existing_row.box_type_summary = demo_row.box_type_summary
        existing_row.places_count = demo_row.places_count
        existing_row.weight_total = demo_row.weight_total
        existing_row.volume_total = demo_row.volume_total
        existing_row.awb_number = demo_row.awb_number
        existing_row.planned_flight_number = demo_row.planned_flight_number
        existing_row.booking_status = demo_row.booking_status
        existing_row.handover_status = demo_row.handover_status
        existing_row.execution_status = demo_row.execution_status
        existing_row.operator_comment = demo_row.operator_comment
        existing_row.color_tag = demo_row.color_tag
        existing_row.custom_sort_order = demo_row.custom_sort_order
        created_or_updated += 1

    db.commit()
    return created_or_updated


def create_changelog(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    action_type: str,
    before_json: dict | None,
    after_json: dict | None,
    comment: str | None = None,
) -> None:
    db.add(
        ChangeLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action_type=action_type,
            before_json=before_json,
            after_json=after_json,
            comment=comment,
        )
    )


def get_entity_changelog(db: Session, entity_type: str, entity_id: int, limit: int = 20) -> list[ChangeLog]:
    return (
        db.query(ChangeLog)
        .filter(ChangeLog.entity_type == entity_type, ChangeLog.entity_id == entity_id)
        .order_by(ChangeLog.created_at.desc(), ChangeLog.id.desc())
        .limit(limit)
        .all()
    )


def build_workbench_query(db: Session, filters: WorkbenchFilters):
    query = db.query(PlanningWorkbenchRow)

    if filters.workbench_date is not None:
        day = filters.workbench_date.date()
        start = datetime.combine(day, time.min, tzinfo=timezone.utc)
        end = datetime.combine(day, time.max, tzinfo=timezone.utc)
        query = query.filter(PlanningWorkbenchRow.workbench_date.between(start, end))
    if filters.workbench_date_from is not None:
        start = datetime.combine(filters.workbench_date_from.date(), time.min, tzinfo=timezone.utc)
        query = query.filter(PlanningWorkbenchRow.workbench_date >= start)
    if filters.workbench_date_to is not None:
        end = datetime.combine(filters.workbench_date_to.date(), time.max, tzinfo=timezone.utc)
        query = query.filter(PlanningWorkbenchRow.workbench_date <= end)

    if filters.airport_code:
        query = query.filter(PlanningWorkbenchRow.airport_code == filters.airport_code)
    if filters.direction_code:
        query = query.filter(PlanningWorkbenchRow.direction_code == filters.direction_code)
    if filters.temperature_mode:
        query = query.filter(PlanningWorkbenchRow.temperature_mode == filters.temperature_mode)
    if filters.booking_status:
        query = query.filter(PlanningWorkbenchRow.booking_status == filters.booking_status)
    if filters.handover_status:
        query = query.filter(PlanningWorkbenchRow.handover_status == filters.handover_status)
    if filters.execution_status:
        query = query.filter(PlanningWorkbenchRow.execution_status == filters.execution_status)
    if filters.color_tag:
        query = query.filter(PlanningWorkbenchRow.color_tag == filters.color_tag)
    if filters.has_awb is not None:
        query = query.filter(
            PlanningWorkbenchRow.awb_number.isnot(None)
            if filters.has_awb
            else PlanningWorkbenchRow.awb_number.is_(None)
        )
    if filters.has_flight is not None:
        query = query.filter(
            PlanningWorkbenchRow.planned_flight_number.isnot(None)
            if filters.has_flight
            else PlanningWorkbenchRow.planned_flight_number.is_(None)
        )
    if filters.is_outside_final_manifest is not None:
        query = query.filter(PlanningWorkbenchRow.is_outside_final_manifest == filters.is_outside_final_manifest)
    if filters.search:
        pattern = f"%{filters.search.strip()}%"
        query = query.filter(
            or_(
                PlanningWorkbenchRow.direction_code.ilike(pattern),
                PlanningWorkbenchRow.direction_name.ilike(pattern),
                PlanningWorkbenchRow.airport_code.ilike(pattern),
                PlanningWorkbenchRow.awb_number.ilike(pattern),
                PlanningWorkbenchRow.planned_flight_number.ilike(pattern),
                PlanningWorkbenchRow.operator_comment.ilike(pattern),
            )
        )
    return query.order_by(PlanningWorkbenchRow.custom_sort_order.asc(), PlanningWorkbenchRow.id.desc())


def export_workbench_rows_csv(rows: list[PlanningWorkbenchRow]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "workbench_date",
            "direction_code",
            "direction_name",
            "airport_code",
            "linked_order_ids",
            "temperature_mode",
            "cargo_profile",
            "box_type_summary",
            "places_count",
            "weight_total",
            "volume_total",
            "awb_number",
            "planned_flight_number",
            "booking_status",
            "handover_status",
            "execution_status",
            "operator_comment",
            "color_tag",
            "is_outside_final_manifest",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row.id,
                row.workbench_date.isoformat(),
                row.direction_code,
                row.direction_name,
                row.airport_code,
                "|".join(str(order_id) for order_id in row.linked_order_ids),
                row.temperature_mode,
                row.cargo_profile,
                row.box_type_summary or "",
                row.places_count,
                row.weight_total,
                row.volume_total,
                row.awb_number or "",
                row.planned_flight_number or "",
                row.booking_status,
                row.handover_status,
                row.execution_status,
                row.operator_comment or "",
                row.color_tag or "",
                row.is_outside_final_manifest,
            ]
        )
    return buffer.getvalue()


def create_or_get_awb(db: Session, awb_number: str, payload: AssignAwbRequest) -> AirWaybill:
    awb = db.query(AirWaybill).filter(AirWaybill.awb_number == awb_number).one_or_none()
    if awb is not None:
        return awb

    awb = AirWaybill(
        awb_number=awb_number,
        is_manual_number=payload.is_manual_number,
        carrier_id=payload.carrier_id,
        agent_id=payload.agent_id,
        agreement_id=payload.agreement_id,
        temperature_mode=payload.temperature_mode,
        route_from=payload.route_from,
        route_to=payload.route_to,
        comments=payload.comments,
    )
    db.add(awb)
    db.flush()
    return awb


def create_or_get_flight(db: Session, payload: AssignFlightRequest) -> Flight:
    flight = db.query(Flight).filter(Flight.flight_number == payload.flight_number).one_or_none()
    if flight is not None:
        return flight

    flight = Flight(
        flight_number=payload.flight_number,
        carrier_code=payload.carrier_code,
        airport_departure=payload.airport_departure,
        airport_arrival=payload.airport_arrival,
        etd=payload.etd,
        eta=payload.eta,
        source_type=payload.source_type,
    )
    db.add(flight)
    db.flush()
    return flight


def row_snapshot(row: PlanningWorkbenchRow) -> dict:
    return {
        "id": row.id,
        "workbench_date": row.workbench_date.isoformat(),
        "direction_code": row.direction_code,
        "direction_name": row.direction_name,
        "airport_code": row.airport_code,
        "linked_order_ids": row.linked_order_ids,
        "temperature_mode": row.temperature_mode,
        "cargo_profile": row.cargo_profile,
        "box_type_summary": row.box_type_summary,
        "places_count": row.places_count,
        "weight_total": row.weight_total,
        "volume_total": row.volume_total,
        "awb_id": row.awb_id,
        "awb_number": row.awb_number,
        "planned_flight_id": row.planned_flight_id,
        "planned_flight_number": row.planned_flight_number,
        "booking_status": row.booking_status,
        "handover_status": row.handover_status,
        "execution_status": row.execution_status,
        "operator_comment": row.operator_comment,
        "color_tag": row.color_tag,
        "custom_sort_order": row.custom_sort_order,
        "owner_user_id": row.owner_user_id,
        "is_outside_final_manifest": row.is_outside_final_manifest,
    }


def split_workbench_row(db: Session, row: PlanningWorkbenchRow, payload: SplitWorkbenchRowRequest) -> list[PlanningWorkbenchRow]:
    if payload.split_places_count <= 0 or payload.split_places_count >= row.places_count:
        raise ValueError("split_places_count must be between 1 and the source places_count - 1")

    source_before = row_snapshot(row)
    remaining_places = row.places_count - payload.split_places_count
    total_weight = row.weight_total or 0
    total_volume = row.volume_total or 0
    ratio = payload.split_places_count / row.places_count
    split_weight = payload.split_weight if payload.split_weight is not None else round(total_weight * ratio, 3)
    split_volume = payload.split_volume if payload.split_volume is not None else round(total_volume * ratio, 3)

    row.places_count = remaining_places
    row.weight_total = round(total_weight - split_weight, 3)
    row.volume_total = round(total_volume - split_volume, 3)
    if payload.operator_comment:
        row.operator_comment = payload.operator_comment

    split_row = PlanningWorkbenchRow(
        workbench_date=row.workbench_date,
        direction_code=row.direction_code,
        direction_name=row.direction_name,
        airport_code=row.airport_code,
        linked_order_ids=payload.split_linked_order_ids or list(row.linked_order_ids),
        temperature_mode=row.temperature_mode,
        cargo_profile=row.cargo_profile,
        box_type_summary=row.box_type_summary,
        places_count=payload.split_places_count,
        weight_total=split_weight,
        volume_total=split_volume,
        awb_number=payload.awb_number,
        planned_flight_number=payload.planned_flight_number,
        booking_status=row.booking_status,
        handover_status=row.handover_status,
        execution_status=row.execution_status,
        operator_comment=payload.operator_comment,
        color_tag=payload.color_tag or row.color_tag,
        custom_sort_order=row.custom_sort_order + 1,
        owner_user_id=row.owner_user_id,
        is_outside_final_manifest=row.is_outside_final_manifest,
    )
    db.add(split_row)
    db.flush()
    create_changelog(
        db,
        entity_type="PlanningWorkbenchRow",
        entity_id=row.id,
        action_type="split",
        before_json=source_before,
        after_json={"source_row": row_snapshot(row), "split_row": row_snapshot(split_row)},
        comment=payload.operator_comment,
    )
    return [row, split_row]


def merge_workbench_rows(db: Session, rows: list[PlanningWorkbenchRow], operator_comment: str | None = None) -> PlanningWorkbenchRow:
    if not rows:
        raise ValueError("row_ids cannot be empty")

    target = rows[0]
    before = [row_snapshot(row) for row in rows]
    merged_linked_ids = set(target.linked_order_ids)
    for row in rows[1:]:
        merged_linked_ids.update(row.linked_order_ids)
        target.places_count += row.places_count
        target.weight_total = round((target.weight_total or 0) + (row.weight_total or 0), 3)
        target.volume_total = round((target.volume_total or 0) + (row.volume_total or 0), 3)
        target.is_outside_final_manifest = target.is_outside_final_manifest or row.is_outside_final_manifest
        if row.awb_number and not target.awb_number:
            target.awb_number = row.awb_number
            target.awb_id = row.awb_id
        if row.planned_flight_number and not target.planned_flight_number:
            target.planned_flight_number = row.planned_flight_number
            target.planned_flight_id = row.planned_flight_id
        db.delete(row)

    target.linked_order_ids = sorted(merged_linked_ids)
    if operator_comment:
        target.operator_comment = operator_comment
    create_changelog(
        db,
        entity_type="PlanningWorkbenchRow",
        entity_id=target.id,
        action_type="merge",
        before_json={"rows": before},
        after_json=row_snapshot(target),
        comment=operator_comment,
    )
    db.flush()
    return target


def assign_awb_to_row(db: Session, row: PlanningWorkbenchRow, payload: AssignAwbRequest) -> AirWaybill:
    awb = create_or_get_awb(db, payload.awb_number, payload)
    before = row_snapshot(row)
    row.awb_id = awb.id
    row.awb_number = awb.awb_number
    if payload.temperature_mode:
        awb.temperature_mode = payload.temperature_mode
    if payload.route_from:
        awb.route_from = payload.route_from
    if payload.route_to:
        awb.route_to = payload.route_to
    create_changelog(
        db,
        entity_type="PlanningWorkbenchRow",
        entity_id=row.id,
        action_type="assign_awb",
        before_json=before,
        after_json=row_snapshot(row),
        comment=payload.comments,
    )
    return awb


def assign_flight_to_row(db: Session, row: PlanningWorkbenchRow, payload: AssignFlightRequest) -> Flight:
    flight = create_or_get_flight(db, payload)
    before = row_snapshot(row)
    row.planned_flight_id = flight.id
    row.planned_flight_number = flight.flight_number
    db.add(
        FlightAssignment(
            flight_id=flight.id,
            awb_id=row.awb_id,
            workbench_row_id=row.id,
            assignment_status="planned",
            assigned_places=row.places_count,
            assigned_weight=row.weight_total,
            planned_departure_date=flight.etd,
            manual_override_flag=True,
            comments="Assigned from Planning Workbench",
        )
    )
    create_changelog(
        db,
        entity_type="PlanningWorkbenchRow",
        entity_id=row.id,
        action_type="assign_flight",
        before_json=before,
        after_json=row_snapshot(row),
        comment=None,
    )
    return flight


def fix_plan(db: Session, rows: list[PlanningWorkbenchRow]) -> list[str]:
    errors: list[str] = []
    for row in rows:
        if not row.awb_number:
            errors.append(f"Row {row.id}: missing AWB")
        if not row.planned_flight_number:
            errors.append(f"Row {row.id}: missing flight")
        if row.places_count <= 0:
            errors.append(f"Row {row.id}: places_count must be positive")
    if errors:
        return errors

    for row in rows:
        row.booking_status = "fixed"
        row.handover_status = "fixed"
        row.execution_status = "fixed"
        create_changelog(
            db,
            entity_type="PlanningWorkbenchRow",
            entity_id=row.id,
            action_type="fix_plan",
            before_json=None,
            after_json=row_snapshot(row),
            comment="Plan fixed",
        )
    return []
