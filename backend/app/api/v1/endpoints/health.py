from fastapi import APIRouter
from app.tasks.tms_sync import sync_orders_from_tms

router = APIRouter()


@router.get("")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/test-1c-sync")
def trigger_1c_sync() -> dict:
    """
    Manually triggers the 1C TMS OData sync for debugging and verification.
    """
    return sync_orders_from_tms()

