from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.view_profile import UserViewProfileCreate, UserViewProfileRead, UserViewProfileUpdate
from app.services.view_profiles import (
    create_view_profile as create_view_profile_service,
    delete_view_profile as delete_view_profile_service,
    list_view_profiles as list_view_profiles_service,
    update_view_profile as update_view_profile_service,
)

router = APIRouter()


@router.get("", response_model=list[UserViewProfileRead])
def list_view_profiles(user_id: int = Query(default=1), db: Session = Depends(get_db)) -> list[UserViewProfile]:
    return list_view_profiles_service(db, user_id)


@router.post("", response_model=UserViewProfileRead)
def create_view_profile(payload: UserViewProfileCreate, db: Session = Depends(get_db)) -> UserViewProfile:
    return create_view_profile_service(db, payload)


@router.get("/{profile_id}", response_model=UserViewProfileRead)
def get_view_profile(profile_id: int, db: Session = Depends(get_db)) -> UserViewProfile:
    from app.models.entities import UserViewProfile

    profile = db.get(UserViewProfile, profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="View profile not found")
    return profile


@router.patch("/{profile_id}", response_model=UserViewProfileRead)
def update_view_profile(profile_id: int, payload: UserViewProfileUpdate, db: Session = Depends(get_db)) -> UserViewProfile:
    try:
        return update_view_profile_service(db, profile_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="View profile not found") from exc


@router.delete("/{profile_id}")
def delete_view_profile(profile_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    try:
        delete_view_profile_service(db, profile_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="View profile not found") from exc
    return {"deleted": True}
