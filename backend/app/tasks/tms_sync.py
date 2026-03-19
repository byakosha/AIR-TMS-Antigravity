import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.entities import Order, PlanningWorkbenchRow
from app.services.tms_client import tms_client

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.tms_sync.sync_orders_from_tms")
def sync_orders_from_tms() -> dict:
    """
    Periodic task to fetch new or updated orders from the 1C TMS system.
    Parses OData objects into canonical representations securely.
    """
    logger.info("Starting periodic sync of orders from 1C TMS")
    
    db = SessionLocal()
    processed_count = 0
    new_rows_count = 0
    
    try:
        # Fetch the payloads (will fall back to mock payloads if unreachable)
        incoming_orders = tms_client.fetch_recent_orders()
        
        for p in incoming_orders:
            # Upsert into Orders table
            order = db.query(Order).filter(Order.external_id_1c == p.id_1c).first()
            if not order:
                order = Order(
                    external_id_1c=p.id_1c,
                    client_name=p.client_name,
                    direction_code=p.direction_code,
                    direction_name=p.direction_name,
                    destination_airport=p.airport_destination,
                    temperature_mode=p.temperature_mode,
                    cargo_type=p.cargo_type,
                    urgency_flag=p.is_urgent,
                    vip_flag=p.is_vip,
                    weight=p.weight,
                    volume=p.volume,
                    places_planned=p.places,
                    status=p.status
                )
                db.add(order)
                db.flush() # flush to get order.id
                
                # Automatically map new logical orders to the active Planning Workbench
                row = PlanningWorkbenchRow(
                    workbench_date=p.delivery_date or datetime.now(timezone.utc),
                    direction_code=p.direction_code,
                    direction_name=p.direction_name,
                    airport_code=p.airport_destination,
                    linked_order_ids=[order.id],
                    temperature_mode=p.temperature_mode,
                    cargo_profile=p.cargo_type,
                    places_count=p.places,
                    weight_total=p.weight,
                    volume_total=p.volume,
                )
                db.add(row)
                new_rows_count += 1
            else:
                # Update existing order details securely
                order.client_name = p.client_name
                order.weight = p.weight
                order.volume = p.volume
                order.places_planned = p.places
                order.status = p.status
            
            processed_count += 1
            
        db.commit()
        logger.info(f"Successfully processed {processed_count} orders. Generated {new_rows_count} new workbench items.")
        
    except Exception as exc:
        logger.error(f"Failed to sync with 1C TMS: {exc}")
        db.rollback()
        raise exc
    finally:
        db.close()
        
    return {"status": "success", "processed_orders": processed_count, "new_rows": new_rows_count}
