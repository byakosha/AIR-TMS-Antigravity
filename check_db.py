import sqlite3
import os

db_paths = ["backend/air_dispatch.db", "air_dispatch.db"]

for path in db_paths:
    if os.path.exists(path):
        print(f"Checking {path}...")
        try:
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            tables = ["planning_workbench_rows", "air_waybills", "flights", "orders"]
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"  {table}: {count}")
                except sqlite3.OperationalError as e:
                    print(f"  {table}: Error - {e}")
            conn.close()
        except Exception as e:
            print(f"  Failed to connect: {e}")
    else:
        print(f"{path} does not exist.")
