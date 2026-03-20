from datetime import datetime

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import PlanningWorkbenchRow, User
from app.models.planning_rules import (AirlineDetails, AwbBlankRange,
                                       SupplyChainRule)
from app.schemas.changelog import ChangeLogRead
from app.schemas.workbench import (AssignAwbRequest, AssignFlightRequest,
                                   CreateManualOrderRequest, FixPlanRequest,
                                   MergeWorkbenchRowsRequest, OperationResult,
                                   SplitWorkbenchRowRequest, WorkbenchFilters,
                                   WorkbenchRowRead)
from app.services.workbench import (assign_awb_to_row, assign_flight_to_row,
                                    build_workbench_query, create_manual_order,
                                    export_workbench_rows_csv, fix_plan,
                                    get_entity_changelog, merge_workbench_rows,
                                    row_snapshot, seed_demo_workbench,
                                    split_workbench_row)
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/seed", response_model=OperationResult)
def seed_rows(db: Session = Depends(get_db)) -> OperationResult:
    created = seed_demo_workbench(db)
    return OperationResult(
        status="ok",
        message=f"Seeded {created} demo workbench rows",
        affected_row_ids=[],
    )


@router.post("/manual", response_model=WorkbenchRowRead)
def create_order(
    payload: CreateManualOrderRequest, db: Session = Depends(get_db)
) -> PlanningWorkbenchRow:
    row = create_manual_order(db, payload.model_dump())
    return row


@router.get("", response_model=list[WorkbenchRowRead])
def list_workbench_rows(
    workbench_date: datetime | None = Query(default=None),
    workbench_date_from: datetime | None = Query(default=None),
    workbench_date_to: datetime | None = Query(default=None),
    airport_code: str | None = Query(default=None),
    direction_code: str | None = Query(default=None),
    temperature_mode: str | None = Query(default=None),
    booking_status: str | None = Query(default=None),
    handover_status: str | None = Query(default=None),
    execution_status: str | None = Query(default=None),
    color_tag: str | None = Query(default=None),
    has_awb: bool | None = Query(default=None),
    has_flight: bool | None = Query(default=None),
    is_outside_final_manifest: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[PlanningWorkbenchRow]:
    filters = WorkbenchFilters(
        workbench_date=workbench_date,
        workbench_date_from=workbench_date_from,
        workbench_date_to=workbench_date_to,
        airport_code=airport_code,
        direction_code=direction_code,
        temperature_mode=temperature_mode,
        booking_status=booking_status,
        handover_status=handover_status,
        execution_status=execution_status,
        color_tag=color_tag,
        has_awb=has_awb,
        has_flight=has_flight,
        is_outside_final_manifest=is_outside_final_manifest,
        search=search,
    )
    return build_workbench_query(db, filters).limit(500).all()


@router.get("/export")
def export_workbench_rows(
    workbench_date: datetime | None = Query(default=None),
    workbench_date_from: datetime | None = Query(default=None),
    workbench_date_to: datetime | None = Query(default=None),
    airport_code: str | None = Query(default=None),
    direction_code: str | None = Query(default=None),
    temperature_mode: str | None = Query(default=None),
    booking_status: str | None = Query(default=None),
    handover_status: str | None = Query(default=None),
    execution_status: str | None = Query(default=None),
    color_tag: str | None = Query(default=None),
    has_awb: bool | None = Query(default=None),
    has_flight: bool | None = Query(default=None),
    is_outside_final_manifest: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    filters = WorkbenchFilters(
        workbench_date=workbench_date,
        workbench_date_from=workbench_date_from,
        workbench_date_to=workbench_date_to,
        airport_code=airport_code,
        direction_code=direction_code,
        temperature_mode=temperature_mode,
        booking_status=booking_status,
        handover_status=handover_status,
        execution_status=execution_status,
        color_tag=color_tag,
        has_awb=has_awb,
        has_flight=has_flight,
        is_outside_final_manifest=is_outside_final_manifest,
        search=search,
    )
    rows = build_workbench_query(db, filters).all()
    csv_data = export_workbench_rows_csv(rows)
    filename = f"workbench_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{row_id}/split", response_model=list[WorkbenchRowRead])
def split_row(
    row_id: int, payload: SplitWorkbenchRowRequest, db: Session = Depends(get_db)
) -> list[PlanningWorkbenchRow]:
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    try:
        rows = split_workbench_row(db, row, payload)
        db.commit()
        return rows
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/merge", response_model=WorkbenchRowRead)
def merge_rows(
    payload: MergeWorkbenchRowsRequest, db: Session = Depends(get_db)
) -> PlanningWorkbenchRow:
    rows = (
        db.query(PlanningWorkbenchRow)
        .filter(PlanningWorkbenchRow.id.in_(payload.row_ids))
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No rows found")
    if payload.target_row_id is not None:
        rows.sort(key=lambda row: 0 if row.id == payload.target_row_id else 1)
    try:
        merged = merge_workbench_rows(db, rows, payload.operator_comment)
        db.commit()
        return merged
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{row_id}/assign-awb", response_model=WorkbenchRowRead)
def assign_awb(
    row_id: int, payload: AssignAwbRequest, db: Session = Depends(get_db)
) -> PlanningWorkbenchRow:
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    assign_awb_to_row(db, row, payload)
    db.commit()
    db.refresh(row)
    return row


@router.post("/{row_id}/assign-flight", response_model=WorkbenchRowRead)
def assign_flight(
    row_id: int, payload: AssignFlightRequest, db: Session = Depends(get_db)
) -> PlanningWorkbenchRow:
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    assign_flight_to_row(db, row, payload)
    db.commit()
    db.refresh(row)
    return row


@router.post("/fix-plan", response_model=OperationResult)
def finalize_plan(
    payload: FixPlanRequest, db: Session = Depends(get_db)
) -> OperationResult:
    query = db.query(PlanningWorkbenchRow)
    if payload.row_ids:
        query = query.filter(PlanningWorkbenchRow.id.in_(payload.row_ids))
    rows = query.all()
    if not rows:
        raise HTTPException(status_code=404, detail="No rows found for plan fixation")
    errors = fix_plan(db, rows)
    if errors:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail={"message": "Plan fixation blocked", "errors": errors},
        )
    db.commit()
    return OperationResult(
        status="ok", message="Plan fixed", affected_row_ids=[row.id for row in rows]
    )


@router.post("/auto-plan")
def auto_plan_workbench(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.planning_engine import run_auto_planning

    result, warnings = run_auto_planning(db)
    if not result and warnings:
        raise HTTPException(status_code=400, detail=" | ".join(warnings))
    return result


@router.get("/snapshot/{row_id}")
def snapshot(row_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    return row_snapshot(row)


@router.get("/{row_id}/changes", response_model=list[ChangeLogRead])
def row_changes(row_id: int, db: Session = Depends(get_db)):
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    return get_entity_changelog(db, "PlanningWorkbenchRow", row_id)


@router.delete("/{row_id}", status_code=204)
def delete_workbench_row(
    row_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only administrators can delete orders"
        )

    row = db.get(PlanningWorkbenchRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Workbench row not found")

    db.delete(row)
    db.commit()
    return None


from pydantic import BaseModel


class UpdateWorkbenchRowRequest(BaseModel):
    places_count: int | None = None
    weight_total: float | None = None
    volume_total: float | None = None


@router.patch("/{row_id}", response_model=WorkbenchRowRead)
def update_workbench_row(
    row_id: int,
    payload: UpdateWorkbenchRowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only administrators can modify orders"
        )

    row = db.get(PlanningWorkbenchRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Workbench row not found")

    if payload.places_count is not None:
        row.places_count = payload.places_count
    if payload.weight_total is not None:
        row.weight_total = payload.weight_total
    if payload.volume_total is not None:
        row.volume_total = payload.volume_total

    db.commit()
    db.refresh(row)
    return row


import csv
import io


@router.post("/import-csv", response_model=OperationResult)
def import_workbench_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    content = file.file.read().decode("utf-8-sig")  # handle BOM if present
    csv_file = io.StringIO(content)

    first_line = content.split("\n")[0]
    delimiter = ";" if ";" in first_line else ","
    reader = csv.DictReader(csv_file, delimiter=delimiter)

    created_count = 0
    for row in reader:
        places_str = row.get("Места", "1").strip() or "1"
        weight_str = row.get("Вес", "1").strip() or "1"
        vol_str = row.get("Объем", "0").strip() or "0"

        try:
            places = int(float(places_str))
        except:
            places = 1

        try:
            weight = float(weight_str.replace(",", "."))
        except:
            weight = 1.0

        try:
            volume = float(vol_str.replace(",", "."))
        except:
            volume = 0.0

        direction = row.get("Направление", "").strip() or "UNKNOWN"
        airport = row.get("Аэропорт", "").strip() or "UNK"

        db_row = PlanningWorkbenchRow(
            workbench_date=datetime.now(),
            direction_code=direction,
            direction_name=direction,
            airport_code=airport,
            places_count=places,
            weight_total=weight,
            volume_total=volume,
            temperature_mode=row.get("Температура", "+15..+25").strip() or "+15..+25",
            cargo_profile=row.get("Груз", "General").strip() or "General",
            box_type_summary=row.get("Тара", "").strip(),
            booking_status="draft",
            operator_comment=f"Клиент: {row.get('Клиент', 'CSV Import').strip() or 'CSV Import'}",
        )
        db.add(db_row)
        created_count += 1

    db.commit()
    return OperationResult(
        status="ok",
        message=f"Импортировано {created_count} строк.",
        affected_row_ids=[],
    )
