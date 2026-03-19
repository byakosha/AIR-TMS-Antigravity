from __future__ import annotations

from pydantic import BaseModel


class SettingsSectionItemRead(BaseModel):
    title: str
    description: str


class SettingsSectionRead(BaseModel):
    key: str
    title: str
    subtitle: str
    accent: str
    tags: list[str]
    items: list[SettingsSectionItemRead]
    actions: list[str]


class SettingsHeroStatRead(BaseModel):
    label: str
    value: str
    note: str


class SettingsSideMetricRead(BaseModel):
    label: str
    value: str


class SettingsSummaryRead(BaseModel):
    hero_stats: list[SettingsHeroStatRead]
    sections: list[SettingsSectionRead]
    operational_notes: list[str]
    side_metrics: list[SettingsSideMetricRead]
