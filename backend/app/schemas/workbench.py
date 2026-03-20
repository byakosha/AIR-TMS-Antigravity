from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkbenchFilters(BaseModel):
    workbench_date: datetime | None = None
    workbench_date_from: datetime | None = None
    workbench_date_to: datetime | None = None
    airport_code: str | None = None
    direction_code: str | None = None
    temperature_mode: str | None = None
    booking_status: str | None = None
    handover_status: str | None = None
    execution_status: str | None = None
    color_tag: str | None = None
    has_awb: bool | None = None
    has_flight: bool | None = None
    is_outside_final_manifest: bool | None = None
    search: str | None = None


class WorkbenchRowRead(BaseModel):
    id: int
    workbench_date: datetime
    direction_code: str
    direction_name: str
    airport_code: str
    linked_order_ids: list[int]
    temperature_mode: str
    cargo_profile: str
    box_type_summary: str | None
    places_count: int
    weight_total: float
    volume_total: float
    awb_id: int | None
    awb_number: str | None
    planned_flight_id: int | None
    planned_flight_number: str | None
    booking_status: str
    handover_status: str
    execution_status: str
    operator_comment: str | None
    color_tag: str | None
    custom_sort_order: int
    owner_user_id: int | None
    is_outside_final_manifest: bool

    model_config = ConfigDict(from_attributes=True)


class SplitWorkbenchRowRequest(BaseModel):
    split_places_count: int
    split_weight: float | None = None
    split_volume: float | None = None
    split_linked_order_ids: list[int] | None = None
    awb_number: str | None = None
    planned_flight_number: str | None = None
    color_tag: str | None = None
    operator_comment: str | None = None


class CreateManualOrderRequest(BaseModel):
    direction_code: str
    airport_code: str
    places_count: int
    weight_total: float
    volume_total: float
    temperature_mode: str
    box_type_summary: str | None = None


class MergeWorkbenchRowsRequest(BaseModel):
    row_ids: list[int]
    target_row_id: int | None = None
    operator_comment: str | None = None


class AssignAwbRequest(BaseModel):
    awb_number: str
    is_manual_number: bool = True
    carrier_id: int | None = None
    agent_id: int | None = None
    agreement_id: int | None = None
    temperature_mode: str | None = None
    route_from: str | None = None
    route_to: str | None = None
    comments: str | None = None


class AssignFlightRequest(BaseModel):
    flight_number: str
    carrier_code: str
    airport_departure: str
    airport_arrival: str
    etd: datetime
    eta: datetime | None = None
    source_type: str = "manual"


class FixPlanRequest(BaseModel):
    row_ids: list[int] | None = None


class OperationResult(BaseModel):
    status: str
    message: str
    affected_row_ids: list[int] = Field(default_factory=list)
