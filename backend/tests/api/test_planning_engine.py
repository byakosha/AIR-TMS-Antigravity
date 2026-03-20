import pytest
from app.services.planning_engine import run_auto_planning
from app.models.entities import PlanningWorkbenchRow
from app.models.planning_rules import SupplyChainRule, AirlineDetails, AwbBlankRange

def test_run_auto_planning_empty(db_session):
    # Depending on how the db_session is injected in testing 
    # Let's mock the scenario. If testing framework isn't totally setup, 
    # we just provide the basic test structure that passes if no rows exist.
    result, warnings = run_auto_planning(db_session)
    assert result["status"] == "info"
    assert "Нет строк" in result["message"]

# Note: A full E2E setup requires a populated db_session fixture 
# which is typically provided in conftest.py. This script ensures 
# the planning logic compiles and doesn't crash on empty DBs.
