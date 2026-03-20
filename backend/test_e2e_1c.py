import httpx
import json
import time

API_URL = "http://127.0.0.1:8000/api/v1"

def run_e2e_test():
    print("🚀 [Step 1] Simulating 1C Axelot Order Ingestion...")
    payload = {
        "batch_id": "TEST-BATCH-001",
        "orders": [
            {
                "order_id": 999111,
                "client_name": "BIOCAD",
                "direction_code": "LED-VVO",
                "direction_name": "Владивосток",
                "airport_code": "VVO",
                "temperature_mode": "+2..+8",
                "cargo_profile": "Pharma",
                "places_count": 22,
                "weight_total": 540.0,
                "volume_total": 4.5,
                "box_type_summary": "Термоконтейнер 50L x22",
                "operator_comment": "Автоматический E2E Тест"
            }
        ]
    }
    
    with httpx.Client() as client:
        resp = client.post(f"{API_URL}/integration/1c/orders", json=payload)
        print(f"📥 1C Ingestion Response: {resp.status_code}")
        print(resp.json())
        
        # Give it a second
        time.sleep(1)
        
        print("\n🔍 [Step 2] Finding the ingested order in Workbench...")
        workbench_resp = client.get(f"{API_URL}/workbench")
        rows = workbench_resp.json()
        target_row = next((r for r in rows if 999111 in (r.get("linked_order_ids") or [])), None)
        
        if not target_row:
            print("❌ Order not found in workbench!")
            return
            
        print(f"✅ Found ingested order! Row ID: {target_row['id']}")
        
        print("\n✈️ [Step 3] Dispatcher assigns AWB to the order (Manual Planning step)...")
        # Simulating dispatcher assigning AWB
        awb_payload = {
            "awb_number": "421-E2ETEST00",
            "route_from": "LED",
            "route_to": "VVO",
        }
        resp = client.post(f"{API_URL}/workbench/{target_row['id']}/assign-awb", json=awb_payload)
        print(f"📦 Assigned AWB -> {resp.json().get('awb_number')}")
        
        print("\n⏳ [Step 4] Triggering Tracking Scraper Job (Mock S7 scraper)...")
        # This will simulate tracking and if confirmed, push back to 1C
        track_resp = client.post(f"{API_URL}/integration/tracking/run")
        print(f"✅ Tracking Result: {track_resp.json()}")
        print("🎉 E2E Test completed successfully! Check the main backend logs to see the [1C Push] background task being fired.")

if __name__ == "__main__":
    run_e2e_test()
