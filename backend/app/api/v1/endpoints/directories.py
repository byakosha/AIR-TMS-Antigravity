from app.data.airports import AIRPORTS
from app.db.session import get_db
from app.models.entities import Client
from app.schemas.directory import (AirportDirectoryItem, ClientCreate,
                                   ClientResponse, ClientUpdate)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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


@router.get("/clients", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db)):
    """List all active and inactive clients."""
    return db.query(Client).order_by(Client.name).all()


@router.post(
    "/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED
)
def create_client(client_in: ClientCreate, db: Session = Depends(get_db)):
    """Create a new client."""
    db_client = db.query(Client).filter(Client.name == client_in.name).first()
    if db_client:
        raise HTTPException(
            status_code=400, detail="Client with this name already exists"
        )
    new_client = Client(**client_in.model_dump())
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client


@router.patch("/clients/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int, client_in: ClientUpdate, db: Session = Depends(get_db)
):
    """Update an existing client."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)

    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    """Delete a client."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(db_client)
    db.commit()
    return None
