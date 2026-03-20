from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ODataOrderPayload(BaseModel):
    id_1c: str = Field(alias="Ref_Key")
    code: str = Field(alias="Code", default="")
    client_name: str = Field(alias="ClientName", default="")
    direction_code: str = Field(alias="DirectionCode", default="")
    direction_name: str = Field(alias="DirectionName", default="")
    airport_destination: str = Field(alias="AirportDest", default="")
    temperature_mode: str = Field(alias="TemperatureMode", default="ambient")
    cargo_type: str = Field(alias="CargoType", default="general")
    weight: float = Field(alias="Weight", default=0.0)
    volume: float = Field(alias="Volume", default=0.0)
    places: int = Field(alias="Places", default=0)
    is_urgent: bool = Field(alias="Urgent", default=False)
    is_vip: bool = Field(alias="VIP", default=False)
    status: str = Field(alias="Status", default="new")
    delivery_date: datetime | None = Field(alias="DeliveryDate", default=None)

    model_config = ConfigDict(populate_by_name=True)


class ODataResponse(BaseModel):
    value: list[ODataOrderPayload]
