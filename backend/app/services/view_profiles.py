from __future__ import annotations

from app.models.entities import UserViewProfile
from app.schemas.view_profile import (UserViewProfileCreate,
                                      UserViewProfileUpdate)
from sqlalchemy.orm import Session


def list_view_profiles(db: Session, user_id: int = 1) -> list[UserViewProfile]:
    return (
        db.query(UserViewProfile)
        .filter(UserViewProfile.user_id == user_id)
        .order_by(UserViewProfile.is_default.desc(), UserViewProfile.profile_name.asc())
        .all()
    )


def create_view_profile(db: Session, payload: UserViewProfileCreate) -> UserViewProfile:
    profile = UserViewProfile(**payload.model_dump())
    if profile.is_default:
        db.query(UserViewProfile).filter(
            UserViewProfile.user_id == profile.user_id
        ).update({"is_default": False})
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_view_profile(
    db: Session, profile_id: int, payload: UserViewProfileUpdate
) -> UserViewProfile:
    profile = db.get(UserViewProfile, profile_id)
    if profile is None:
        raise ValueError("View profile not found")

    if payload.is_default is True:
        db.query(UserViewProfile).filter(
            UserViewProfile.user_id == profile.user_id
        ).update({"is_default": False})

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


def delete_view_profile(db: Session, profile_id: int) -> None:
    profile = db.get(UserViewProfile, profile_id)
    if profile is None:
        raise ValueError("View profile not found")
    db.delete(profile)
    db.commit()
