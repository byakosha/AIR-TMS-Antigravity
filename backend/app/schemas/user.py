from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    username: str
    full_name: str
    email: str | None = None
    role: str
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    role: str | None = None
    password: str | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None


class UserRead(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
