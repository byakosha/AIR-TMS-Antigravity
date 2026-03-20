from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.entities import PlanningWorkbenchRow, User
from app.core.security import get_current_user

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PlanningWorkbenchRow)
    
    if start_date:
        sd = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        query = query.filter(PlanningWorkbenchRow.workbench_date >= sd)
    if end_date:
        ed = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        query = query.filter(PlanningWorkbenchRow.workbench_date <= ed)

    rows = query.all()
    
    daily_stats = {}
    cargo_stats = {}
    sla_stats = {"green": 0, "yellow": 0, "red": 0}
    pipeline_stats = {"draft": 0, "pending": 0, "confirmed": 0, "executed": 0}
    destinations_backlog = {}
    
    now = datetime.utcnow()
    
    for r in rows:
        # Date Aggregation
        date_str = r.workbench_date.strftime("%Y-%m-%d")
        if date_str not in daily_stats:
            daily_stats[date_str] = {"weight": 0, "volume_weight": 0, "places": 0}
        daily_stats[date_str]["weight"] += r.weight_total
        daily_stats[date_str]["volume_weight"] += (r.volume_total or 0) * 167
        daily_stats[date_str]["places"] += r.places_count
        
        # Cargo Type Aggregation
        cargo = r.cargo_profile or "General"
        cargo_stats[cargo] = cargo_stats.get(cargo, 0) + 1
        
        # SLA Calculation
        # Assuming aware datetime for r.workbench_date
        diff = (now - r.workbench_date).total_seconds() / 86400.0
        if diff < 1.5:
            sla_stats["green"] += 1
        elif diff <= 3:
            sla_stats["yellow"] += 1
        else:
            sla_stats["red"] += 1
            
        # Pipeline Stats
        status = r.booking_status or "draft"
        if status in pipeline_stats:
            pipeline_stats[status] += 1
            
        # Urgent Backlog Destinations
        if status in ("draft", "pending"):
            airport = r.airport_code or "Unknown"
            destinations_backlog[airport] = destinations_backlog.get(airport, 0) + r.weight_total

    # Formatting payload
    daily_weight = [{"name": k, "weight": round(v["weight"]), "volume_weight": round(v["volume_weight"]), "places": v["places"]} for k,v in sorted(daily_stats.items())]
    cargo_types = [{"name": k, "value": v} for k,v in sorted(cargo_stats.items(), key=lambda item: item[1], reverse=True)]
    top_destinations = [{"name": k, "weight": round(v)} for k,v in sorted(destinations_backlog.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    return {
        "daily_weight": daily_weight,
        "cargo_types": cargo_types,
        "sla_stats": sla_stats,
        "pipeline_stats": pipeline_stats,
        "top_destinations": top_destinations,
        "total_rows": len(rows),
        "total_awbs": sum(1 for r in rows if r.awb_number)
    }
