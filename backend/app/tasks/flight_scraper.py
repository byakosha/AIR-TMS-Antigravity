import logging

from app.core.celery_app import celery_app
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.flight_scraper.update_flight_statuses")
def update_flight_statuses() -> dict:
    """
    Periodic task to query an external flight aggregator API or scrape
    status boards to update the real-time status of tracked flights.
    """
    logger.info("Starting flight status scraping update")

    db = SessionLocal()
    updated_flights_count = 0

    try:
        # TODO: Lookup Active Flights requiring tracking
        # active_flights = db.query(Flight).filter(...)

        # TODO: Make requests to flight scraper microservice / external API
        # Example: requests.post(SCRAPER_URL, json={"flights": [...]})

        # Mock logic
        logger.info("Successfully mocked flight status updates.")
        updated_flights_count = 0

    except Exception as exc:
        logger.error(f"Failed to update flight statuses: {exc}")
        db.rollback()
        raise exc
    finally:
        db.close()

    return {"status": "success", "updated_flights": updated_flights_count}
