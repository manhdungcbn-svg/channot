"""
Seed Data Export - Xuất dữ liệu mẫu ra JSON
"""
from fastapi import APIRouter
from fastapi.responses import FileResponse
import json
import os

router = APIRouter(prefix="/seed", tags=["Seed Data"])

@router.get("/export")
async def export_seed_data():
    """Export seed data to JSON file"""
    from app.database import PRODUCTS, CUSTOMERS, TICKETS, USERS, WALLETS, TRANSACTIONS
    
    # Calculate stats
    total_tickets = len(TICKETS)
    pending_tickets = sum(1 for t in TICKETS if t["status"] in ["received", "checking", "repairing"])
    completed_tickets = sum(1 for t in TICKETS if t["status"] == "completed")
    
    data = {
        "stats": {
            "totalTickets": total_tickets,
            "pendingTickets": pending_tickets,
            "completedTickets": completed_tickets,
            "warrantyRate": int((completed_tickets / total_tickets * 100) if total_tickets > 0 else 0)
        },
        "products": PRODUCTS,
        "customers": CUSTOMERS,
        "tickets": TICKETS,
        "users": [{"id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"]} for u in USERS]
    }
    
    return {"success": True, "data": data}

@router.post("/reset")
async def reset_seed_data():
    """Reset database to initial seed state"""
    from app.database import init_seed_data
    
    init_seed_data()
    
    return {"success": True, "message": "Database reset to seed state"}

@router.get("/info")
async def get_seed_info():
    """Get seed data info"""
    from app.database import PRODUCTS, CUSTOMERS, TICKETS, USERS, WALLETS, TRANSACTIONS
    
    return {
        "success": True,
        "data": {
            "users": len(USERS),
            "customers": len(CUSTOMERS),
            "products": len(PRODUCTS),
            "tickets": len(TICKETS),
            "wallets": len(WALLETS),
            "transactions": len(TRANSACTIONS)
        }
    }
