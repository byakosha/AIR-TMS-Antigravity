from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.auth import AuthUserRead, LoginRequest, TokenResponse
from app.services.users import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token(subject=user.username, role=user.role, expires_minutes=settings.access_token_expire_minutes)
    return TokenResponse(access_token=token, role=user.role, user=AuthUserRead.model_validate(user))


@router.get("/me", response_model=AuthUserRead)
def read_me(current_user: User = Depends(get_current_user)) -> AuthUserRead:
    return AuthUserRead.model_validate(current_user)
