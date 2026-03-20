from __future__ import annotations

from datetime import datetime, timezone

from app.core.security import hash_password, verify_password
from app.models.entities import User
from app.schemas.user import UserCreate, UserUpdate
from sqlalchemy.orm import Session

DEMO_USERS = [
    UserCreate(
        username="admin",
        full_name="BIOCARD Admin",
        email="admin@biocard.local",
        role="admin",
        password="admin123",
        is_active=True,
        is_superuser=True,
    ),
    UserCreate(
        username="planner",
        full_name="Planning Dispatcher",
        email="planner@biocard.local",
        role="planner",
        password="planner123",
        is_active=True,
        is_superuser=False,
    ),
    UserCreate(
        username="execution",
        full_name="Execution Operator",
        email="execution@biocard.local",
        role="execution_operator",
        password="execution123",
        is_active=True,
        is_superuser=False,
    ),
    UserCreate(
        username="supervisor",
        full_name="Shift Supervisor",
        email="supervisor@biocard.local",
        role="supervisor",
        password="supervisor123",
        is_active=True,
        is_superuser=False,
    ),
]


def list_users(db: Session) -> list[User]:
    return (
        db.query(User)
        .order_by(User.is_superuser.desc(), User.role.asc(), User.username.asc())
        .all()
    )


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = get_user_by_username(db, username)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        username=payload.username,
        full_name=payload.full_name,
        email=payload.email,
        role=payload.role,
        password_hash=hash_password(payload.password),
        is_active=payload.is_active,
        is_superuser=payload.is_superuser,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, payload: UserUpdate) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise ValueError("User not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "password":
            user.password_hash = hash_password(value)
        else:
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise ValueError("User not found")
    db.delete(user)
    db.commit()


def seed_demo_users(db: Session) -> int:
    if db.query(User.id).limit(1).first():
        return 0

    db.add_all(
        User(
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            password_hash=hash_password(user.password),
            is_active=user.is_active,
            is_superuser=user.is_superuser,
        )
        for user in DEMO_USERS
    )
    db.commit()
    return len(DEMO_USERS)
