from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    role: Mapped[str] = mapped_column(String(64), index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id_1c: Mapped[str] = mapped_column(String(128), index=True)
    client_name: Mapped[str] = mapped_column(String(255))
    direction_code: Mapped[str] = mapped_column(String(32), index=True)
    direction_name: Mapped[str] = mapped_column(String(255))
    destination_airport: Mapped[str] = mapped_column(String(16), index=True)
    temperature_mode: Mapped[str] = mapped_column(String(64), default="ambient")
    cargo_type: Mapped[str] = mapped_column(String(128), default="general")
    urgency_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    vip_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    special_control_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    weight: Mapped[float] = mapped_column(Float, default=0)
    volume: Mapped[float] = mapped_column(Float, default=0)
    places_planned: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(64), default="new")


class PlanningWorkbenchRow(TimestampMixin, Base):
    __tablename__ = "planning_workbench_rows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    workbench_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    direction_code: Mapped[str] = mapped_column(String(32), index=True)
    direction_name: Mapped[str] = mapped_column(String(255))
    airport_code: Mapped[str] = mapped_column(String(16), index=True)
    linked_order_ids: Mapped[list[int]] = mapped_column(JSON, default=list)
    temperature_mode: Mapped[str] = mapped_column(String(64))
    cargo_profile: Mapped[str] = mapped_column(String(128), default="general")
    box_type_summary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    places_count: Mapped[int] = mapped_column(Integer, default=0)
    weight_total: Mapped[float] = mapped_column(Float, default=0)
    volume_total: Mapped[float] = mapped_column(Float, default=0)
    awb_id: Mapped[int | None] = mapped_column(ForeignKey("air_waybills.id"), nullable=True, index=True)
    awb_number: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    planned_flight_id: Mapped[int | None] = mapped_column(ForeignKey("flights.id"), nullable=True, index=True)
    planned_flight_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    booking_status: Mapped[str] = mapped_column(String(64), default="pending")
    handover_status: Mapped[str] = mapped_column(String(64), default="not_handed_over")
    execution_status: Mapped[str] = mapped_column(String(64), default="pending")
    operator_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    color_tag: Mapped[str | None] = mapped_column(String(32), nullable=True)
    custom_sort_order: Mapped[int] = mapped_column(Integer, default=0)
    owner_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    is_outside_final_manifest: Mapped[bool] = mapped_column(Boolean, default=False)
    is_auto_planned: Mapped[bool] = mapped_column(Boolean, default=False)


class AirWaybill(TimestampMixin, Base):
    __tablename__ = "air_waybills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    awb_number: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    is_manual_number: Mapped[bool] = mapped_column(Boolean, default=True)
    carrier_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    agreement_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    temperature_mode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    route_from: Mapped[str | None] = mapped_column(String(16), nullable=True)
    route_to: Mapped[str | None] = mapped_column(String(16), nullable=True)
    places_count: Mapped[int] = mapped_column(Integer, default=0)
    weight_total: Mapped[float] = mapped_column(Float, default=0)
    volume_total: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(64), default="draft")
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)


class Flight(TimestampMixin, Base):
    __tablename__ = "flights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    flight_number: Mapped[str] = mapped_column(String(64), index=True)
    carrier_code: Mapped[str] = mapped_column(String(16), index=True)
    airport_departure: Mapped[str] = mapped_column(String(16), index=True)
    airport_arrival: Mapped[str] = mapped_column(String(16), index=True)
    etd: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status_api: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status_internal: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_type: Mapped[str] = mapped_column(String(64), default="manual")
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FlightAssignment(TimestampMixin, Base):
    __tablename__ = "flight_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"), index=True)
    awb_id: Mapped[int | None] = mapped_column(ForeignKey("air_waybills.id"), nullable=True, index=True)
    workbench_row_id: Mapped[int | None] = mapped_column(
        ForeignKey("planning_workbench_rows.id"), nullable=True, index=True
    )
    assignment_status: Mapped[str] = mapped_column(String(64), default="planned")
    assigned_places: Mapped[int] = mapped_column(Integer, default=0)
    assigned_weight: Mapped[float] = mapped_column(Float, default=0)
    planned_departure_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    manual_override_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    split_group_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)


class BookingRecord(TimestampMixin, Base):
    __tablename__ = "booking_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    awb_id: Mapped[int] = mapped_column(ForeignKey("air_waybills.id"), index=True)
    carrier_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    booking_channel: Mapped[str] = mapped_column(String(64), default="manual")
    booking_status: Mapped[str] = mapped_column(String(64), default="pending")
    booking_response_raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    quota_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requested_flight_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    confirmed_flight_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    requested_departure_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_departure_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)


class PartialExecutionItem(TimestampMixin, Base):
    __tablename__ = "partial_execution_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_entity_type: Mapped[str] = mapped_column(String(64), index=True)
    parent_entity_id: Mapped[int] = mapped_column(Integer, index=True)
    flight_id: Mapped[int | None] = mapped_column(ForeignKey("flights.id"), nullable=True)
    awb_id: Mapped[int | None] = mapped_column(ForeignKey("air_waybills.id"), nullable=True)
    places_planned: Mapped[int] = mapped_column(Integer, default=0)
    places_flown: Mapped[int] = mapped_column(Integer, default=0)
    places_remaining: Mapped[int] = mapped_column(Integer, default=0)
    execution_status: Mapped[str] = mapped_column(String(64), default="pending")
    execution_comment: Mapped[str | None] = mapped_column(Text, nullable=True)


class ChangeLog(Base):
    __tablename__ = "change_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    entity_id: Mapped[int] = mapped_column(Integer, index=True)
    action_type: Mapped[str] = mapped_column(String(64))
    before_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    reason_code: Mapped[str | None] = mapped_column(String(128), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class UserViewProfile(TimestampMixin, Base):
    __tablename__ = "user_view_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    profile_name: Mapped[str] = mapped_column(String(128))
    visible_columns_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    column_order_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    saved_filters_json: Mapped[dict] = mapped_column(JSON, default=dict)
    color_rules_json: Mapped[dict] = mapped_column(JSON, default=dict)
    grouping_rules_json: Mapped[dict] = mapped_column(JSON, default=dict)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
