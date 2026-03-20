from app.db.session import get_db
from app.schemas.integrations import AxelotManifestOut, AxelotOrdersPayload
from app.schemas.workbench import OperationResult
from app.services.integrations_1c import (export_planned_manifest_to_axelot,
                                          ingest_axelot_orders,
                                          push_manifest_update_background)
from app.services.tracking import run_tracking_job
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/1c/orders")
def receive_axelot_orders(payload: AxelotOrdersPayload, db: Session = Depends(get_db)):
    """Receives a batch of orders from 1C Axelot TMS and ingests them into the Planning Workbench."""
    result = ingest_axelot_orders(db, payload)
    return result


@router.post("/1c/sync-manifest", response_model=AxelotManifestOut)
def sync_manifest_to_axelot(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Exports the current planned manifest (AWB and Flight assigned orders) in a format ready for 1C Axelot TMS."""
    result = export_planned_manifest_to_axelot(db)
    background_tasks.add_task(push_manifest_update_background, result)
    return result


@router.post("/tracking/run")
async def trigger_tracking_job(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """
    Manually triggers the background scraper job to check statuses
    of all 'pending' bookings on airline portals.
    """
    result = await run_tracking_job(db)

    # If any AWBs were confirmed, immediately trigger a push to 1C
    if result.get("confirmed", 0) > 0:
        manifest = export_planned_manifest_to_axelot(db)
        background_tasks.add_task(push_manifest_update_background, manifest)

    return result
