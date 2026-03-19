from app.services.flights import seed_demo_flights
from app.services.overview import get_overview_summary
from app.services.users import seed_demo_users
from app.services.workbench import seed_demo_workbench


def test_overview_summary_reports_live_progress(db_session):
    seed_demo_workbench(db_session)
    seed_demo_flights(db_session)
    seed_demo_users(db_session)

    summary = get_overview_summary(db_session)

    assert len(summary.hero_stats) == 4
    assert len(summary.pipeline) == 4
    assert summary.hero_stats[0].value == "8"
    assert summary.hero_stats[2].value == "6"
    assert summary.hero_stats[3].value == "4"
    assert summary.alerts
    assert len(summary.snapshots) == 4
