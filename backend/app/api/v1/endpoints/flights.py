from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import Flight, User
from app.schemas.flight import FlightResponse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[FlightResponse])
def get_flights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a list of all flights available for assignment.
    """
    return db.query(Flight).order_by(Flight.etd.asc()).all()
