import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.planning_rules import SupplyChainRule

def seed():
    db = SessionLocal()
    try:
        airports = [
            "SVO", "DME", "VKO", "ZIA", "LED", "AER", "ROV", "OVB", "SVX", "KJA",
            "KHV", "VVO", "UUS", "PKC", "YKS", "IKT", "UUD", "KZN", "UFA", "KUF",
            "GOJ", "PEE", "CEK", "OMS", "TJM", "MRV", "MCX", "GRV", "VOG", "KGD",
            "MMK", "ARH", "SYK", "NOZ", "TOF", "KEJ", "BAX"
        ]
        
        # We will map them to generic carrier "SU" (Aeroflot) and "S7" interchangeably.
        count = 0
        for i, code in enumerate(airports):
            carrier = "SU" if i % 2 == 0 else "S7"
            
            # Check if rule exists
            # We create a generic fallback rule for each port
            existing = db.query(SupplyChainRule).filter(
                SupplyChainRule.airport_code == code,
                SupplyChainRule.cargo_profile.is_(None),
                SupplyChainRule.temperature_mode.is_(None)
            ).first()
            
            if not existing:
                rule = SupplyChainRule(
                    airport_code=code,
                    carrier_code=carrier,
                    cargo_profile=None,
                    temperature_mode=None
                )
                db.add(rule)
                count += 1
                
        db.commit()
        print(f"Successfully seeded {count} Supply Chain Rules for Russian ports.")
    except Exception as e:
        db.rollback()
        print(f"Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
