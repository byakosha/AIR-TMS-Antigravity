from typing import List, Optional

from pydantic import BaseModel, Field


class AxelotOrderIn(BaseModel):
    order_id: int = Field(..., description="Unique order ID from 1C Axelot")
    client_name: str = Field(..., description="Client or Contactor Name")
    direction_code: str = Field(..., description="Route code, e.g., SVO-KHV")
    direction_name: str = Field(..., description="Route destination name")
    airport_code: str = Field(..., description="IATA code of the destination airport")
    temperature_mode: str = Field(
        ..., description="Temperature condition, e.g., '+2..+8'"
    )
    cargo_profile: str = Field(
        ..., description="Cargo profile, e.g., 'Pharma', 'General'"
    )
    places_count: int = Field(..., description="Number of pieces/boxes")
    weight_total: float = Field(..., description="Physical weight in kg")
    volume_total: float = Field(..., description="Volume in m3")
    box_type_summary: Optional[str] = Field(
        None, description="Summary of packaging types"
    )
    operator_comment: Optional[str] = Field(None, description="Any external comments")


class AxelotOrdersPayload(BaseModel):
    batch_id: str
    orders: List[AxelotOrderIn]


class AxelotPlannedOrderItem(BaseModel):
    order_id: int
    awb_number: Optional[str]
    planned_flight_number: Optional[str]
    booking_status: str


class AxelotManifestOut(BaseModel):
    manifest_id: str
    planned_orders: List[AxelotPlannedOrderItem]
