from fastapi import APIRouter

from app.data.airports import AIRPORTS
from app.schemas.directory import AirportDirectoryItem

router = APIRouter()


@router.get("/airports", response_model=list[AirportDirectoryItem])
def list_airports(search: str | None = None) -> list[dict[str, str]]:
    if not search:
        return AIRPORTS

    term = search.casefold().strip()
    return [
        airport
        for airport in AIRPORTS
        if term in airport["code"].casefold() or term in airport["name"].casefold()
    ]
