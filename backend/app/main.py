from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.bootstrap import initialize_database, seed_if_needed
from app.core.config import settings

app = FastAPI(
    title="BIOCARD Aviation TMS API",
    version="0.1.0",
    description="MVP backend for aviation planning, booking, and execution workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://(localhost|127\.0\.0\.1).*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "biocard-aviation-tms", "status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()
    seed_if_needed()




