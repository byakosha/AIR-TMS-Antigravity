from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.users import (create_user, delete_user, list_users,
                                update_user)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()


def _require_admin(current_user: User) -> None:
    if current_user.role != "admin" and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )


@router.get("", response_model=list[UserRead])
def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserRead]:
    _require_admin(current_user)
    return [UserRead.model_validate(user) for user in list_users(db)]


@router.post("", response_model=UserRead)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    _require_admin(current_user)
    return UserRead.model_validate(create_user(db, payload))


@router.patch("/{user_id}", response_model=UserRead)
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    _require_admin(current_user)
    try:
        return UserRead.model_validate(update_user(db, user_id, payload))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.delete("/{user_id}")
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    _require_admin(current_user)
    try:
        delete_user(db, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    return {"status": "deleted"}
