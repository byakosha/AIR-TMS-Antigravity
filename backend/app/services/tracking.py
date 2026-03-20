import asyncio
import logging

import httpx
from app.models.entities import PlanningWorkbenchRow
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


async def scrape_s7_awb(awb_number: str) -> str:
    """
    Mock integration with S7 Airlines tracking API/Portal.
    Returns the mapped status: 'pending', 'confirmed', or 'error'
    """
    # Example logic: S7 typically uses 421- prefix
    try:
        # In reality, this would be an httpx GET or POST with BeautifulSoup to parse HTML
        # or a direct JSON API call if they provide one.
        logger.info(f"[S7 Scraper] Tracking AWB {awb_number}...")
        await asyncio.sleep(1)  # Simulate network delay

        # Mock logic: if AWB ends with even number, consider it confirmed
        if int(awb_number[-1]) % 2 == 0:
            return "confirmed"
        return "pending"
    except Exception as e:
        logger.error(f"[S7 Scraper] Failed to track {awb_number}: {e}")
        return "error"


async def scrape_aeroflot_awb(awb_number: str) -> str:
    """
    Mock integration with Aeroflot (SU) Cargo tracking.
    """
    try:
        logger.info(f"[SU Scraper] Tracking AWB {awb_number}...")
        await asyncio.sleep(1)
        if int(awb_number[-1]) % 2 == 0:
            return "confirmed"
        return "pending"
    except Exception as e:
        logger.error(f"[SU Scraper] Failed to track {awb_number}: {e}")
        return "error"


async def check_awb_status(awb_number: str) -> str:
    if awb_number.startswith("421-"):
        return await scrape_s7_awb(awb_number)
    elif awb_number.startswith("555-"):
        return await scrape_aeroflot_awb(awb_number)
    else:
        # Generic fallback or unhandled prefix
        logger.warning(f"No scraper available for AWB prefix in {awb_number}")
        # Default mock simulation for demonstration
        await asyncio.sleep(0.5)
        return "confirmed" if int(awb_number[-1]) % 2 == 0 else "pending"


async def run_tracking_job(db: Session) -> dict:
    """
    Finds all AWBs currently in 'pending' or 'draft' booking status,
    scrapes the airline portal for updates, and transitions them to 'confirmed'.
    """
    pending_rows = (
        db.query(PlanningWorkbenchRow)
        .filter(
            PlanningWorkbenchRow.awb_number.isnot(None),
            PlanningWorkbenchRow.booking_status.in_(["pending", "draft"]),
        )
        .all()
    )

    if not pending_rows:
        return {
            "status": "info",
            "message": "Нет ожидающих подтверждения AWB",
            "processed": 0,
            "confirmed": 0,
        }

    confirmed_count = 0
    # Group by AWB to avoid tracking the same AWB 10 times if it has 10 rows
    awb_groups = {}
    for row in pending_rows:
        awb_groups.setdefault(row.awb_number, []).append(row)

    for awb_number, rows in awb_groups.items():
        new_status = await check_awb_status(awb_number)

        if new_status == "confirmed":
            for r in rows:
                r.booking_status = "confirmed"
            confirmed_count += 1

    db.commit()
    return {
        "status": "success",
        "message": f"Опрошено {len(awb_groups)} уникальных AWB. Подтверждено: {confirmed_count}",
        "processed": len(awb_groups),
        "confirmed": confirmed_count,
    }
