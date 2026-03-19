from pydantic import BaseModel


class AirportDirectoryItem(BaseModel):
    code: str
    name: str

