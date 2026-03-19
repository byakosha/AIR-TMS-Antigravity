from app.models.entities import User
from app.services.users import authenticate_user, seed_demo_users


def test_seed_demo_users_populates_roles(db_session):
    created = seed_demo_users(db_session)
    assert created == 4
    assert db_session.query(User).count() == 4


def test_authenticate_demo_user(db_session):
    seed_demo_users(db_session)
    user = authenticate_user(db_session, "admin", "admin123")
    assert user is not None
    assert user.role == "admin"


def test_login_and_user_crud_via_api(client):
    login_response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    users_response = client.get("/api/v1/users", headers=headers)
    assert users_response.status_code == 200
    assert len(users_response.json()) >= 4

    create_response = client.post(
        "/api/v1/users",
        json={
            "username": "planner2",
            "full_name": "Planner Two",
            "email": "planner2@biocard.local",
            "role": "planner",
            "password": "planner234",
            "is_active": True,
            "is_superuser": False,
        },
        headers=headers,
    )
    assert create_response.status_code == 200
    created_user = create_response.json()
    assert created_user["username"] == "planner2"

    patch_response = client.patch(
        f"/api/v1/users/{created_user['id']}",
        json={"full_name": "Planner Two Updated"},
        headers=headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["full_name"] == "Planner Two Updated"

    delete_response = client.delete(f"/api/v1/users/{created_user['id']}", headers=headers)
    assert delete_response.status_code == 200
