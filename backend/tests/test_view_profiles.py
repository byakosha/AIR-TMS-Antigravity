from app.schemas.view_profile import UserViewProfileCreate, UserViewProfileUpdate
from app.services.view_profiles import create_view_profile, list_view_profiles, update_view_profile


def test_create_and_list_view_profiles(db_session):
    created = create_view_profile(
        db_session,
        UserViewProfileCreate(
            user_id=1,
            profile_name="Morning shift",
            visible_columns_json=["airport_code", "awb_number"],
            column_order_json=["airport_code", "awb_number"],
            saved_filters_json={"airport_code": "SVO"},
            color_rules_json={},
            grouping_rules_json={},
            is_default=True,
        ),
    )
    assert created.profile_name == "Morning shift"
    profiles = list_view_profiles(db_session, user_id=1)
    assert len(profiles) == 1
    assert profiles[0].is_default is True


def test_update_view_profile(db_session):
    created = create_view_profile(
        db_session,
        UserViewProfileCreate(
            user_id=1,
            profile_name="Dispatch view",
            visible_columns_json=["airport_code"],
            column_order_json=["airport_code"],
            saved_filters_json={},
            color_rules_json={},
            grouping_rules_json={},
            is_default=False,
        ),
    )
    updated = update_view_profile(
        db_session,
        created.id,
        UserViewProfileUpdate(profile_name="Dispatch view v2", is_default=True),
    )
    assert updated.profile_name == "Dispatch view v2"
    assert updated.is_default is True

