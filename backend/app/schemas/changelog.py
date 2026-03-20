from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChangeLogRead(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action_type: str
    before_json: dict | None
    after_json: dict | None
    reason_code: str | None
    comment: str | None
    user_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
