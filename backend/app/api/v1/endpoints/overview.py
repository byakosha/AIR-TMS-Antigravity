from app.db.session import get_db
from app.schemas.overview import OverviewSummaryRead
from app.services.overview import get_overview_summary
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/summary", response_model=OverviewSummaryRead)
def read_overview_summary(db: Session = Depends(get_db)) -> OverviewSummaryRead:
    return get_overview_summary(db)
