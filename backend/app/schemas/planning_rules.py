from typing import List, Optional

from pydantic import BaseModel

# --- Supply Chain Rules ---


class SupplyChainRuleBase(BaseModel):
    airport_code: str
    carrier_code: str
    cargo_profile: Optional[str] = None
    temperature_mode: Optional[str] = None


class SupplyChainRuleCreate(SupplyChainRuleBase):
    pass


class SupplyChainRuleResponse(SupplyChainRuleBase):
    id: int

    class Config:
        from_attributes = True


# --- AWB Blank Ranges ---


class AwbBlankRangeBase(BaseModel):
    airline_id: int
    start_number: int
    end_number: int


class AwbBlankRangeCreate(AwbBlankRangeBase):
    pass


class AwbBlankRangeResponse(AwbBlankRangeBase):
    id: int
    current_number: int
    is_active: bool

    class Config:
        from_attributes = True


# --- Airlines ---


class AirlineDetailsBase(BaseModel):
    carrier_code: str
    name: str
    awb_prefix: str


class AirlineDetailsCreate(AirlineDetailsBase):
    pass


class AirlineDetailsResponse(AirlineDetailsBase):
    id: int
    awb_ranges: List[AwbBlankRangeResponse] = []

    class Config:
        from_attributes = True
