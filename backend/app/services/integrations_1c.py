import datetime
import logging

import httpx
from app.models.entities import FlightAssignment, PlanningWorkbenchRow
from app.schemas.integrations import (AxelotManifestOut, AxelotOrdersPayload,
                                      AxelotPlannedOrderItem)
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def ingest_axelot_orders(db: Session, payload: AxelotOrdersPayload) -> dict:
    inserted_count = 0
    updated_count = 0
    skipped_count = 0

    # Load active rows to map existing order_ids
    active_rows = (
        db.query(PlanningWorkbenchRow)
        .filter(PlanningWorkbenchRow.booking_status != "flown_full")
        .all()
    )

    existing_order_map: dict[int, PlanningWorkbenchRow] = {}
    for row in active_rows:
        for oid in row.linked_order_ids:
            existing_order_map[oid] = row

    for order in payload.orders:
        if order.order_id in existing_order_map:
            existing_row = existing_order_map[order.order_id]
            if existing_row.booking_status in ["pending", "draft"]:
                existing_row.places_count = order.places_count
                existing_row.weight_total = order.weight_total
                existing_row.volume_total = order.volume_total
                existing_row.direction_code = order.direction_code
                existing_row.airport_code = order.airport_code
                existing_row.temperature_mode = order.temperature_mode
                existing_row.cargo_profile = order.cargo_profile
                existing_row.box_type_summary = order.box_type_summary
                existing_row.operator_comment = order.operator_comment
                updated_count += 1
            else:
                skipped_count += 1
        else:
            row = PlanningWorkbenchRow(
                workbench_date=datetime.date.today(),
                direction_code=order.direction_code,
                direction_name=order.direction_name,
                airport_code=order.airport_code,
                linked_order_ids=[order.order_id],
                temperature_mode=order.temperature_mode,
                cargo_profile=order.cargo_profile,
                box_type_summary=order.box_type_summary,
                client_name=order.client_name,
                places_count=order.places_count,
                weight_total=order.weight_total,
                volume_total=order.volume_total,
                booking_status="pending",
                handover_status="not_handed_over",
                execution_status="pending",
                operator_comment=order.operator_comment,
                custom_sort_order=0,
                is_outside_final_manifest=False,
            )
            db.add(row)
            inserted_count += 1

    db.commit()
    return {
        "status": "success",
        "inserted": inserted_count,
        "updated": updated_count,
        "skipped_locked": skipped_count,
        "batch_id": payload.batch_id,
    }


def export_planned_manifest_to_axelot(db: Session) -> AxelotManifestOut:
    rows = (
        db.query(PlanningWorkbenchRow)
        .filter(
            PlanningWorkbenchRow.awb_number.isnot(None),
            PlanningWorkbenchRow.planned_flight_number.isnot(None),
            PlanningWorkbenchRow.booking_status == "confirmed",
        )
        .all()
    )

    items = []
    for row in rows:
        for order_id in row.linked_order_ids:
            items.append(
                AxelotPlannedOrderItem(
                    order_id=order_id,
                    awb_number=row.awb_number,
                    planned_flight_number=row.planned_flight_number,
                    booking_status=row.booking_status,
                )
            )

    manifest_id = f"MANIFEST-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    return AxelotManifestOut(manifest_id=manifest_id, planned_orders=items)


async def push_manifest_update_background(manifest_out: AxelotManifestOut):
    """Background task to push manifest state to 1C Axelot webhook"""
    url = "https://axelot-tms.biocard.local/api/exchange"
    logger.info(
        f"[1C Push] Sending Manifest {manifest_out.manifest_id} with {len(manifest_out.planned_orders)} orders to {url}"
    )
    # async with httpx.AsyncClient() as client:
    #     await client.post(url, json=manifest_out.model_dump())
