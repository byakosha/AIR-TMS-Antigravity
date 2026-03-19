from __future__ import annotations

from pydantic import BaseModel


class OverviewStatRead(BaseModel):
    label: str
    value: str
    note: str


class OverviewStageRead(BaseModel):
    label: str
    value: str
    subtitle: str
    accent: str


class OverviewAlertRead(BaseModel):
    title: str
    description: str
    severity: str


class OverviewSnapshotRead(BaseModel):
    direction_code: str
    direction_name: str
    airport_code: str
    temperature_mode: str
    booking_status: str
    handover_status: str
    execution_status: str
    awb_number: str | None
    planned_flight_number: str | None
    places_count: int
    weight_total: float


class OverviewSummaryRead(BaseModel):
    hero_stats: list[OverviewStatRead]
    pipeline: list[OverviewStageRead]
    alerts: list[OverviewAlertRead]
    snapshots: list[OverviewSnapshotRead]
    operational_notes: list[str]
