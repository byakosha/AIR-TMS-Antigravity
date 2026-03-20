from typing import Optional

from pydantic import BaseModel


class AirportDirectoryItem(BaseModel):
    code: str
    name: str


class ClientBase(BaseModel):
    name: str
    inn: Optional[str] = None
    contract_number: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    inn: Optional[str] = None
    contract_number: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ClientResponse(ClientBase):
    id: int

    class Config:
        from_attributes = True
