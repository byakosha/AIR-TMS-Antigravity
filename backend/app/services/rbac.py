from enum import Enum


class Role(str, Enum):
    admin = "admin"
    planner = "planner"
    execution_operator = "execution_operator"
    supervisor = "supervisor"


ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.admin: {"settings:*", "planning:*", "booking:*", "execution:*", "audit:*"},
    Role.planner: {"planning:read", "planning:write", "booking:write"},
    Role.execution_operator: {"execution:read", "execution:write"},
    Role.supervisor: {"planning:read", "booking:read", "execution:read", "audit:read"},
}


def has_permission(role: Role, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(role, set())
    return permission in permissions or permission.split(":")[0] + ":*" in permissions
