# BIOCARD Aviation TMS (MVP Rebuild)

Internal web system to replace Excel-based aviation dispatch workflow for BIOCARD.

## Tech Stack

- Backend: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, Celery, Redis
- Frontend: React, TypeScript, Ant Design, Zustand, TanStack Table (planned)
- DB: PostgreSQL
- Infra: Docker, Docker Compose, Nginx
- Auth: JWT + RBAC

## Repository Layout

```
.
├─ backend/
├─ frontend/
├─ infra/
├─ .env.example
├─ docker-compose.yml
├─ CHANGELOG.md
└─ README.md
```

## MVP Scope (Current Baseline)

- Project skeleton with separated backend/frontend/infra.
- Domain model baseline for key entities:
  - `Order`
  - `PlanningWorkbenchRow`
  - `AirWaybill`
  - `Flight`
  - `FlightAssignment`
  - `BookingRecord`
  - `PartialExecutionItem`
  - `ChangeLog`
  - `UserViewProfile`
- API scaffolding for:
  - health check
  - auth/JWT stub
  - orders
  - planning workbench
- Frontend shell with pages:
  - Settings
  - Planning
  - Booking
  - Execution

## Local Run (Docker Compose)

1. Copy env file:
   - `cp .env.example .env` (Linux/macOS)
   - `Copy-Item .env.example .env` (PowerShell)
2. Start services:
   - `docker compose up --build`
3. Open:
   - Frontend: `http://localhost`
   - API docs: `http://localhost:8000/docs`

## Local Run (without Docker)

### Backend

1. Create venv and install:
   - `cd backend`
   - `python -m venv .venv`
   - `.venv\Scripts\Activate.ps1` (PowerShell)
   - `pip install -r requirements.txt`
2. Run API:
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### Local Database

- Default local mode now uses SQLite at `backend/air_dispatch.db`.
- If you want PostgreSQL later, set `DATABASE_URL` in `.env`.

### Frontend

1. Install and run:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Migrations

Alembic is preconfigured. Next step:

1. `cd backend`
2. `alembic revision --autogenerate -m "init domain"`
3. `alembic upgrade head`

## Deployment Baseline

- Build with Docker Compose for staging.
- Use reverse proxy (Nginx) for frontend + API routing.
- For production:
  - place backend/frontend images in registry
  - use managed PostgreSQL/Redis
  - set secure `SECRET_KEY`, CORS and network policies
  - configure TLS at ingress/load balancer level

## Branching & Git Policy

- `main`: stable releases
- `dev`: integration branch
- feature branches: `feature/...`
- fixes: `fix/...`

## Known MVP Limitations

- Auth endpoint currently returns demo JWT payload (stub mode).
- CRUD and business rules are partial skeletons.
- External integrations (1C TMS/API scraper/carriers) are placeholders.
- Celery worker is scaffolded but no scheduled jobs implemented yet.
