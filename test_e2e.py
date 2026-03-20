import requests
import json
import base64

# Simple script to login directly with DB user and test endpoints
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.db.session import SessionLocal
from app.models.entities import User
from app.core.security import create_access_token

db = SessionLocal()
user = db.query(User).first()
token = create_access_token(subject=user.username, role=user.role, expires_minutes=60)

headers = {"Authorization": f"Bearer {token}"}

print("[Test 1] Uploading CSV file (testing encoding fallback)...")
with open('test.csv', 'rb') as f:
    # Try different encoding first to simulate Russian Excel
    content = f.read().decode('utf-8').encode('windows-1251')

with open('test_cp1251.csv', 'wb') as f:
    f.write(content)

with open('test_cp1251.csv', 'rb') as f:
    files = {'file': ('test_cp1251.csv', f, 'text/csv')}
    res = requests.post("http://localhost:8000/api/v1/workbench/import-csv", headers=headers, files=files)
    print("Import Status:", res.status_code)
    print("Import Response:", res.json())

print("\n[Test 2] Triggering Auto-Plan...")
res = requests.post("http://localhost:8000/api/v1/workbench/auto-plan", headers=headers)
print("Auto-Plan Status:", res.status_code)
print("Auto-Plan Response:", res.json())

print("\n[Test 3] Fetch Workbench Rows...")
res = requests.get("http://localhost:8000/api/v1/workbench", headers=headers)
print("Workbench Status:", res.status_code)
rows = res.json()
print(f"Total rows fetched: {len(rows)}")
groups = {}
for row in rows:
    groups[row.get('awb_number')] = groups.get(row.get('awb_number'), 0) + 1
print("Grouped by AWB Number:", groups)
