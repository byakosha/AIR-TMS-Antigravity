from app.api.v1.endpoints import (auth, directories, flights, health,
                                  integration, orders, overview,
                                  planning_rules, settings, users,
                                  view_profiles, workbench)
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(
    directories.router, prefix="/directories", tags=["directories"]
)
api_router.include_router(flights.router, prefix="/flights", tags=["flights"])
api_router.include_router(
    integration.router, prefix="/integration", tags=["integration"]
)
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(overview.router, prefix="/overview", tags=["overview"])
api_router.include_router(
    planning_rules.router, prefix="/planning-rules", tags=["planning-rules"]
)
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    view_profiles.router, prefix="/view-profiles", tags=["view-profiles"]
)
api_router.include_router(workbench.router, prefix="/workbench", tags=["workbench"])
