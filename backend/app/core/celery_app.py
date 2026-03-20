from app.core.config import settings
from celery import Celery

celery_app = Celery(
    "biocard_aviation_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.tms_sync", "app.tasks.flight_scraper"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Moscow",
    enable_utc=True,
    # Example periodic tasks schedule
    beat_schedule={
        "sync-1c-tms-every-15-minutes": {
            "task": "app.tasks.tms_sync.sync_orders_from_tms",
            "schedule": 900.0,  # 15 minutes
        },
        "scrape-flight-statuses-every-30-minutes": {
            "task": "app.tasks.flight_scraper.update_flight_statuses",
            "schedule": 1800.0,  # 30 minutes
        },
    },
)
