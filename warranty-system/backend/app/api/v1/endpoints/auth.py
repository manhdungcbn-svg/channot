"""
Auth API Endpoints - Sử dụng seed data từ database module
"""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from app.database import USERS, success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@router.post("/login")
async def login(request: LoginRequest):
    """Login endpoint"""
    user = next((u for u in USERS if u["email"] == request.email), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    if user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    # Return user without password
    user_response = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }
    
    return success_response({
        "user": user_response,
        "token": f"mock-jwt-token-{user['id']}-{user['email']}"
    })

@router.post("/register")
async def register(request: RegisterRequest):
    """Register new user"""
    from app.database import get_next_id, CUSTOMERS
    
    # Check if email exists
    if any(u["email"] == request.email for u in USERS):
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")
    
    # Create user
    user_id = get_next_id(USERS)
    new_user = {
        "id": user_id,
        "email": request.email,
        "password": request.password,
        "name": request.name,
        "role": "customer"
    }
    USERS.append(new_user)
    
    # Create customer profile
    customer_id = get_next_id(CUSTOMERS)
    customer = {
        "id": customer_id,
        "name": request.name,
        "email": request.email,
        "phone": "",
        "address": "",
        "company": ""
    }
    CUSTOMERS.append(customer)
    
    return success_response({
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"]
        },
        "token": f"mock-jwt-token-{new_user['id']}-{new_user['email']}"
    })

@router.get("/me")
async def get_current_user():
    """Get current user info (mock)"""
    # In real app, get from JWT token
    user = USERS[0]  # Return admin as default
    return success_response({
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    })

@router.get("/users")
async def get_users():
    """Get all users (admin only)"""
    users_safe = [{"id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"]} for u in USERS]
    return success_response(users_safe)
