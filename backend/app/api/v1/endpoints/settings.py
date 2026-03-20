from app.db.session import get_db
from app.schemas.settings import SettingsSummaryRead
from app.services.settings import get_settings_summary
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/summary", response_model=SettingsSummaryRead)
def read_settings_summary(db: Session = Depends(get_db)) -> SettingsSummaryRead:
    return get_settings_summary(db)
