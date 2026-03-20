from app.db.base import Base
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship


class AirlineDetails(Base):
    __tablename__ = "airline_details"

    id = Column(Integer, primary_key=True, index=True)
    carrier_code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    awb_prefix = Column(String(5), nullable=False)

    awb_ranges = relationship(
        "AwbBlankRange", back_populates="airline", cascade="all, delete-orphan"
    )


class AwbBlankRange(Base):
    __tablename__ = "awb_blank_ranges"

    id = Column(Integer, primary_key=True, index=True)
    airline_id = Column(Integer, ForeignKey("airline_details.id"), nullable=False)
    start_number = Column(Integer, nullable=False)
    end_number = Column(Integer, nullable=False)
    current_number = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

    airline = relationship("AirlineDetails", back_populates="awb_ranges")


class SupplyChainRule(Base):
    __tablename__ = "supply_chain_rules"

    id = Column(Integer, primary_key=True, index=True)
    airport_code = Column(
        String(10), index=True, nullable=False
    )  # No longer unique, allows multiple routing rules
    carrier_code = Column(
        String(10), nullable=False
    )  # Maps to AirlineDetails.carrier_code
    cargo_profile = Column(String(128), nullable=True)
    temperature_mode = Column(String(64), nullable=True)
