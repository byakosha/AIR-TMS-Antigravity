from pydantic import BaseModel, ConfigDict


class OrderCreate(BaseModel):
    external_id_1c: str
    client_name: str
    direction_code: str
    direction_name: str
    destination_airport: str
    temperature_mode: str = "ambient"
    cargo_type: str = "general"
    weight: float = 0
    volume: float = 0
    places_planned: int = 0


class OrderRead(OrderCreate):
    id: int
    status: str

    model_config = ConfigDict(from_attributes=True)
