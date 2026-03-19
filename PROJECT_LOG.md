# BIOCARD Aviation TMS - Project Log & Developer Guide

## 1. Project Overview & Core Ideas
The **Antigravity Air Dispatch TMS** is a specialized, cockpit-like Transportation Management System designed for BIOCARD. Its primary goal is to unify the aviation stage of logistics, allowing dispatchers to easily track, book, and execute air freight orders. 
- **Core Idea 1**: Eliminate manual Excel sheets by directly importing orders via OData integration with the *1C TMS AXELOT* system.
- **Core Idea 2**: Provide a clear "Pipeline" view (Planning -> Booking -> Execution) where users can drag-and-drop orders onto flights and AWB (Air Waybills).
- **Core Idea 3**: Seamless React front-end communicating with a high-performance Python FastAPI backend, supported by background Celery tasks for real-time syncing.

---

## 2. Technical Stack & Hardware Requirements
To run this application, whether developing locally or migrating to a new machine, you need the following infrastructure:

### Backend (API Server)
* **Language**: Python 3.10 or higher.
* **Framework**: FastAPI (run via Uvicorn).
* **Database**: SQLite (for local development) or PostgreSQL (for production).
* **Async Workers**: Celery + Redis (requires Redis server or Docker to function properly).

### Frontend (User Interface)
* **Runtime**: Node.js v18 or higher.
* **Framework**: React 18, Vite, TypeScript.
* **Component Library**: Ant Design.

### Production Environment (Strongly Recommended)
* **Docker Engine & Docker Compose**: Rather than installing Python/Node manually on a production server, this repository contains a complete `docker-compose.yml` file. Docker automatically builds and hosts the backend, frontend (Nginx), PostgreSQL, and Redis in isolated containers.

---

## 3. Migration & Startup Instructions (Local Native Development)
If you copy this codebase to a new Windows/Mac machine, follow these exact steps to start the stack without Docker:

### A. Start the Backend API
1. Open a terminal and navigate to the `backend` folder: `cd backend`
2. Create an isolated Python environment: `python -m venv venv`
3. Activate the environment: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
4. Install all Python libraries: `pip install -r requirements.txt`
5. Create a `.env` file referencing the local database: `DATABASE_URL=sqlite:///./tms.db`
6. Start the server on port 8001: 
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

### B. Start the Frontend UI
1. Open a new terminal and navigate to the `frontend` folder: `cd frontend`
2. Install all Node modules: `npm install`
3. Verify your `.env` correctly points to the backend server's port 8001:
   `VITE_API_BASE_URL=http://localhost:8001/api/v1`
4. Start the Vite development server:
   ```bash
   npm run dev -- --host --port 5174
   ```

---

## 4. Project Log & Development Solutions (March 2026)

* **UI/UX Enterprise Standardization**: We stripped initial hardcoded prototype colors (the red planning buttons) in favor of a clean, globally standardized Ant Design Blue enterprise aesthetic.
* **State Routing Fixes**: Integrated `react-router-dom` `useNavigate()` to completely repair all dead call-to-action buttons on the Overview / Dashboard pages, tying the Hero cards directly to the Planning board logic.
* **Translation Architecture**: Built dictionary maps to convert raw backend English database keys (e.g., `handed_over_partial`, `pending`) to smooth Russian user-facing strings in all Dropdowns and Tags.
* **1C TMS OData Integration**: Engineered the `tms_client.py` and `tms_sync.py` services to parse external 1C OData payloads. Because the external 1C server wasn't live yet, we injected a deterministic mock data engine that executes via a manual health-check trigger (`POST /api/v1/health/test-1c-sync`).
* **Flight Selection API**: Solved the manual entry bottleneck by building a `/api/v1/flights` endpoint and tying it to a searchable `<Select>` autocomplete dropdown inside the UI Modals, computing ETD/ETA calculations automatically.
* **CORS Hotfixes**: Deeply configured FastAPI's `CORSMiddleware` using wildcard regular expressions to solve restrictive cross-origin port-blocking when testing via multiple loopback configurations (`127.0.0.1` vs `localhost:5174`).
