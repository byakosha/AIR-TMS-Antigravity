from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class UserViewProfileBase(BaseModel):
    profile_name: str
    visible_columns_json: list[str]
    column_order_json: list[str]
    saved_filters_json: dict
    color_rules_json: dict
    grouping_rules_json: dict
    is_default: bool = False


class UserViewProfileCreate(UserViewProfileBase):
    user_id: int = 1


class UserViewProfileUpdate(BaseModel):
    profile_name: str | None = None
    visible_columns_json: list[str] | None = None
    column_order_json: list[str] | None = None
    saved_filters_json: dict | None = None
    color_rules_json: dict | None = None
    grouping_rules_json: dict | None = None
    is_default: bool | None = None


class UserViewProfileRead(UserViewProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
