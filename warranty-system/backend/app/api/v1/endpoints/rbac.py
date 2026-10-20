"""
RBAC - Role Based Access Control
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/rbac", tags=["RBAC"])

# Roles definition
ROLES = {
    "admin": {
        "name": "Quản trị viên",
        "permissions": [
            "users.read", "users.write", "users.delete",
            "tickets.read", "tickets.write", "tickets.delete",
            "products.read", "products.write", "products.delete",
            "customers.read", "customers.write", "customers.delete",
            "wallet.read", "wallet.write",
            "reports.read", "reports.export",
            "settings.read", "settings.write",
            "finance.read", "finance.write",
        ]
    },
    "staff": {
        "name": "Nhân viên",
        "permissions": [
            "tickets.read", "tickets.write",
            "products.read", "products.write",
            "customers.read", "customers.write",
            "wallet.read", "wallet.write",
            "reports.read",
            "finance.read",
        ]
    },
    "technician": {
        "name": "Kỹ thuật viên",
        "permissions": [
            "tickets.read", "tickets.write",
            "products.read",
            "customers.read",
        ]
    },
    "customer": {
        "name": "Khách hàng",
        "permissions": [
            "tickets.read", "tickets.write",
            "products.read",
            "wallet.read", "wallet.write",
        ]
    },
}

# Mock users with roles
USERS = [
    {"id": 1, "email": "admin@warranty.vn", "password": "admin123", "role": "admin", "name": "Admin User"},
    {"id": 2, "email": "staff@warranty.vn", "password": "staff123", "role": "staff", "name": "Staff User"},
    {"id": 3, "email": "tech@warranty.vn", "password": "tech123", "role": "technician", "name": "Tech User"},
    {"id": 4, "email": "kh1@gmail.com", "password": "kh123", "role": "customer", "name": "Khách Hàng 1"},
]

class RoleResponse(BaseModel):
    role: str
    name: str
    permissions: List[str]

class PermissionCheck(BaseModel):
    required_permission: str
    user_email: str

@router.get("/roles")
async def get_all_roles():
    """Get all available roles"""
    return {
        "roles": [
            {"key": key, "name": value["name"], "permission_count": len(value["permissions"])}
            for key, value in ROLES.items()
        ]
    }

@router.get("/roles/{role}")
async def get_role(role: str):
    """Get role details"""
    if role not in ROLES:
        raise HTTPException(status_code=404, detail="Role not found")
    return RoleResponse(role=role, **ROLES[role])

@router.get("/permissions")
async def get_all_permissions():
    """Get all available permissions"""
    all_permissions = set()
    for role_data in ROLES.values():
        all_permissions.update(role_data["permissions"])
    return {
        "permissions": sorted(list(all_permissions)),
        "by_category": {
            "users": [p for p in all_permissions if p.startswith("users")],
            "tickets": [p for p in all_permissions if p.startswith("tickets")],
            "products": [p for p in all_permissions if p.startswith("products")],
            "customers": [p for p in all_permissions if p.startswith("customers")],
            "wallet": [p for p in all_permissions if p.startswith("wallet")],
            "reports": [p for p in all_permissions if p.startswith("reports")],
            "settings": [p for p in all_permissions if p.startswith("settings")],
            "finance": [p for p in all_permissions if p.startswith("finance")],
        }
    }

@router.post("/check")
async def check_permission(data: PermissionCheck):
    """Check if user has specific permission"""
    user = next((u for u in USERS if u["email"] == data.user_email), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = ROLES.get(user["role"])
    if not role:
        raise HTTPException(status_code=500, detail="Role not configured")
    
    has_permission = data.required_permission in role["permissions"]
    
    return {
        "user": user["email"],
        "role": user["role"],
        "required_permission": data.required_permission,
        "has_permission": has_permission,
        "all_permissions": role["permissions"]
    }

@router.post("/bulk-check")
async def bulk_check_permission(user_email: str, permissions: List[str]):
    """Check multiple permissions at once"""
    user = next((u for u in USERS if u["email"] == user_email), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = ROLES.get(user["role"])
    if not role:
        raise HTTPException(status_code=500, detail="Role not configured")
    
    results = {}
    for perm in permissions:
        results[perm] = perm in role["permissions"]
    
    return {
        "user": user_email,
        "role": user["role"],
        "permissions": results,
        "all_granted": all(results.values())
    }

@router.get("/users")
async def get_users():
    """Get all users with their roles"""
    return {
        "users": [
            {
                "id": u["id"],
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "role_name": ROLES[u["role"]]["name"],
                "permission_count": len(ROLES[u["role"]]["permissions"])
            }
            for u in USERS
        ]
    }

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: int, new_role: str):
    """Update user's role"""
    user = next((u for u in USERS if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if new_role not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user["role"] = new_role
    
    return {
        "success": True,
        "message": f"Cập nhật vai trò thành công",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "role_name": ROLES[new_role]["name"]
        }
    }
