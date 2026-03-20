import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal
from app.core.security import get_current_user
from app.models.entities import User

app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", email="admin@test.com", role="admin")

client = TestClient(app)

def test_import_csv_valid_file():
    # Helper to clean up before test
    db: Session = SessionLocal()
    # Assuming testing DB is used or we just add a row and check it
    
    csv_content = (
        "Направление;Аэропорт;Места;Вес;Объем;Температура;Груз;Тара;Клиент\n"
        "SVO-VVO;VVO;12;125.5;1.2;+2..+8;Pharma;Термобокс 50L x12;BIOCAD\n"
        "SVO-KHV;KHV;5;50.0;0.5;+15..+25;General;Коробка;Ozon"
    )
    
    # Send CSV without auth since it's mocked
    files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
    response = client.post("/api/v1/workbench/import-csv", files=files)
    
    print("\n--- TEST /import-csv OUTPUT ---")
    print("Status:", response.status_code)
    print("Response JSON:", response.json())
    print("-------------------------------")
    
    assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
    data = response.json()
    assert data["status"] == "ok"
    assert "2 строк" in data["message"] or "2 orders" in data["message"]
