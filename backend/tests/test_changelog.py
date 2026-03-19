from app.models.entities import PlanningWorkbenchRow
from app.schemas.workbench import SplitWorkbenchRowRequest
from app.services.workbench import get_entity_changelog, seed_demo_workbench, split_workbench_row


def test_change_log_records_split_operation(db_session):
    seed_demo_workbench(db_session)
    row = db_session.query(PlanningWorkbenchRow).filter(PlanningWorkbenchRow.airport_code == "SVO").one()

    split_workbench_row(
        db_session,
        row,
        SplitWorkbenchRowRequest(
            split_places_count=3,
            operator_comment="audit test",
        ),
    )
    db_session.commit()

    changes = get_entity_changelog(db_session, "PlanningWorkbenchRow", row.id)
    assert changes
    assert changes[0].action_type == "split"
    assert changes[0].comment == "audit test"

