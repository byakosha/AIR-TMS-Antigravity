from datetime import datetime
from pydantic import BaseModel, ConfigDict

class FlightBase(BaseModel):
    flight_number: str
    carrier_code: str
    airport_departure: str
    airport_arrival: str
    etd: datetime
    eta: datetime | None = None
    status_api: str | None = None
    status_internal: str | None = None

class FlightCreate(FlightBase):
    pass

class FlightUpdate(BaseModel):
    etd: datetime | None = None
    eta: datetime | None = None
    status_api: str | None = None
    status_internal: str | None = None

class FlightResponse(FlightBase):
    id: int
    source_type: str
    last_synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
