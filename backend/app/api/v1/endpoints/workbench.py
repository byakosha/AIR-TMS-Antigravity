from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import PlanningWorkbenchRow
from app.schemas.workbench import (
    AssignAwbRequest,
    AssignFlightRequest,
    FixPlanRequest,
    MergeWorkbenchRowsRequest,
    OperationResult,
    SplitWorkbenchRowRequest,
    WorkbenchFilters,
    WorkbenchRowRead,
)
from app.schemas.changelog import ChangeLogRead
from app.services.workbench import (
    assign_awb_to_row,
    assign_flight_to_row,
    build_workbench_query,
    fix_plan,
    get_entity_changelog,
    merge_workbench_rows,
    row_snapshot,
    seed_demo_workbench,
    split_workbench_row,
    export_workbench_rows_csv,
)

router = APIRouter()


@router.post("/seed", response_model=OperationResult)
def seed_rows(db: Session = Depends(get_db)) -> OperationResult:
    created = seed_demo_workbench(db)
    return OperationResult(status="ok", message=f"Seeded {created} demo workbench rows", affected_row_ids=[])


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
def split_row(row_id: int, payload: SplitWorkbenchRowRequest, db: Session = Depends(get_db)) -> list[PlanningWorkbenchRow]:
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
def merge_rows(payload: MergeWorkbenchRowsRequest, db: Session = Depends(get_db)) -> PlanningWorkbenchRow:
    rows = db.query(PlanningWorkbenchRow).filter(PlanningWorkbenchRow.id.in_(payload.row_ids)).all()
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
def assign_awb(row_id: int, payload: AssignAwbRequest, db: Session = Depends(get_db)) -> PlanningWorkbenchRow:
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    assign_awb_to_row(db, row, payload)
    db.commit()
    db.refresh(row)
    return row


@router.post("/{row_id}/assign-flight", response_model=WorkbenchRowRead)
def assign_flight(row_id: int, payload: AssignFlightRequest, db: Session = Depends(get_db)) -> PlanningWorkbenchRow:
    row = db.get(PlanningWorkbenchRow, row_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Workbench row not found")
    assign_flight_to_row(db, row, payload)
    db.commit()
    db.refresh(row)
    return row


@router.post("/fix-plan", response_model=OperationResult)
def finalize_plan(payload: FixPlanRequest, db: Session = Depends(get_db)) -> OperationResult:
    query = db.query(PlanningWorkbenchRow)
    if payload.row_ids:
        query = query.filter(PlanningWorkbenchRow.id.in_(payload.row_ids))
    rows = query.all()
    if not rows:
        raise HTTPException(status_code=404, detail="No rows found for plan fixation")
    errors = fix_plan(db, rows)
    if errors:
        db.rollback()
        raise HTTPException(status_code=400, detail={"message": "Plan fixation blocked", "errors": errors})
    db.commit()
    return OperationResult(status="ok", message="Plan fixed", affected_row_ids=[row.id for row in rows])


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
