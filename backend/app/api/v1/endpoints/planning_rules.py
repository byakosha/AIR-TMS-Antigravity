from typing import Any, List

from app.db.session import get_db
from app.models.planning_rules import (AirlineDetails, AwbBlankRange,
                                       SupplyChainRule)
from app.schemas.planning_rules import (AirlineDetailsCreate,
                                        AirlineDetailsResponse,
                                        AwbBlankRangeCreate,
                                        AwbBlankRangeResponse,
                                        SupplyChainRuleCreate,
                                        SupplyChainRuleResponse)
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

router = APIRouter()

# --- Airlines ---


@router.get("/airlines", response_model=List[AirlineDetailsResponse])
def get_airlines(db: Session = Depends(get_db)) -> Any:
    """Retrieve all airlines with their associated AWB ranges."""
    airlines = db.query(AirlineDetails).all()
    return airlines


@router.post("/airlines", response_model=AirlineDetailsResponse)
def create_airline(
    *,
    db: Session = Depends(get_db),
    airline_in: AirlineDetailsCreate,
) -> Any:
    """Create new airline."""
    existing = (
        db.query(AirlineDetails)
        .filter(AirlineDetails.carrier_code == airline_in.carrier_code)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Airline with this carrier code already exists."
        )

    airline = AirlineDetails(
        carrier_code=airline_in.carrier_code,
        name=airline_in.name,
        awb_prefix=airline_in.awb_prefix,
    )
    db.add(airline)
    db.commit()
    db.refresh(airline)
    return airline


# --- AWB Ranges ---


@router.post("/airlines/{airline_id}/ranges", response_model=AwbBlankRangeResponse)
def add_awb_range(
    *,
    airline_id: int,
    db: Session = Depends(get_db),
    range_in: AwbBlankRangeCreate,
) -> Any:
    """Add a new AWB blank range to an airline."""
    airline = db.query(AirlineDetails).filter(AirlineDetails.id == airline_id).first()
    if not airline:
        raise HTTPException(status_code=404, detail="Airline not found")

    if range_in.start_number > range_in.end_number:
        raise HTTPException(
            status_code=400,
            detail="Start number must be less than or equal to end number",
        )

    awb_range = AwbBlankRange(
        airline_id=airline_id,
        start_number=range_in.start_number,
        end_number=range_in.end_number,
        current_number=range_in.start_number,
        is_active=True,
    )
    db.add(awb_range)
    db.commit()
    db.refresh(awb_range)
    return awb_range


# --- Supply Chain Rules ---


@router.get("/supply-chains", response_model=List[SupplyChainRuleResponse])
def get_supply_chains(db: Session = Depends(get_db)) -> Any:
    """Retrieve all supply chain routing rules."""
    rules = db.query(SupplyChainRule).all()
    return rules


@router.post("/supply-chains", response_model=SupplyChainRuleResponse)
def create_supply_chain_rule(
    *,
    db: Session = Depends(get_db),
    rule_in: SupplyChainRuleCreate,
) -> Any:
    """Create a new supply chain routing rule."""
    existing = (
        db.query(SupplyChainRule)
        .filter(
            SupplyChainRule.airport_code == rule_in.airport_code,
            SupplyChainRule.departure_airport_code == rule_in.departure_airport_code,
            SupplyChainRule.cargo_profile == rule_in.cargo_profile,
            SupplyChainRule.temperature_mode == rule_in.temperature_mode,
        )
        .first()
    )

    if existing:
        existing.carrier_code = rule_in.carrier_code
        db.commit()
        db.refresh(existing)
        return existing

    rule = SupplyChainRule(
        departure_airport_code=rule_in.departure_airport_code,
        airport_code=rule_in.airport_code,
        carrier_code=rule_in.carrier_code,
        cargo_profile=rule_in.cargo_profile,
        temperature_mode=rule_in.temperature_mode,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/supply-chains/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supply_chain_rule(
    *,
    rule_id: int,
    db: Session = Depends(get_db),
):
    """Delete a supply chain rule."""
    rule = db.query(SupplyChainRule).filter(SupplyChainRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
