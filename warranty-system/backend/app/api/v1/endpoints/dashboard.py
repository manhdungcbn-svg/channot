"""
Dashboard API - Tổng hợp data cho Dashboard
"""
from fastapi import APIRouter
from datetime import datetime, timedelta
from app.database import TICKETS, PRODUCTS, CUSTOMERS, TRANSACTIONS, NOTIFICATIONS, check_warranty_status, success_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
async def get_dashboard():
    """Get dashboard data"""
    now = datetime.now()
    
    # Stats
    total_tickets = len(TICKETS)
    pending_tickets = sum(1 for t in TICKETS if t["status"] in ["received", "checking", "repairing"])
    completed_tickets = sum(1 for t in TICKETS if t["status"] == "completed")
    warranty_rate = int((completed_tickets / total_tickets * 100) if total_tickets > 0 else 0)
    
    # By status
    by_status = {}
    for status in ["received", "checking", "repairing", "completed", "rejected"]:
        by_status[status] = sum(1 for t in TICKETS if t["status"] == status)
    
    # Products stats
    total_products = len(PRODUCTS)
    valid_products = sum(1 for p in PRODUCTS if check_warranty_status(p)["valid"])
    
    # Recent tickets
    recent_tickets = sorted(TICKETS, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    
    # Recent activities
    activities = []
    for ticket in TICKETS[:5]:
        activities.append({
            "id": ticket["id"],
            "type": "ticket_created",
            "icon": "📋",
            "title": "Phiếu mới" if ticket["status"] == "received" else "Cập nhật",
            "description": f"{ticket['ticket_code']} - {ticket['product_name']}",
            "status": ticket["status_text"],
            "time": ticket["created_at"],
            "user": ticket.get("customer_name", "Khách hàng")
        })
    
    # Chart data - tickets by month (mock)
    monthly = [
        {"month": "T1", "tickets": 12, "completed": 10},
        {"month": "T2", "tickets": 19, "completed": 15},
        {"month": "T3", "tickets": 15, "completed": 14},
        {"month": "T4", "tickets": 22, "completed": 18},
        {"month": "T5", "tickets": 28, "completed": 24},
        {"month": "T6", "tickets": 35, "completed": 30}
    ]
    
    # Categories
    categories = {}
    for p in PRODUCTS:
        cat = p["category"]
        categories[cat] = categories.get(cat, 0) + 1
    
    return success_response({
        "stats": {
            "totalTickets": total_tickets,
            "pendingTickets": pending_tickets,
            "completedTickets": completed_tickets,
            "warrantyRate": warranty_rate,
            "totalProducts": total_products,
            "validProducts": valid_products,
            "totalCustomers": len(CUSTOMERS)
        },
        "byStatus": by_status,
        "recentTickets": recent_tickets,
        "activities": activities,
        "monthly": monthly,
        "categories": categories
    })

@router.get("/stats")
async def get_stats():
    """Get dashboard stats only"""
    total_tickets = len(TICKETS)
    pending_tickets = sum(1 for t in TICKETS if t["status"] in ["received", "checking", "repairing"])
    completed_tickets = sum(1 for t in TICKETS if t["status"] == "completed")
    
    return success_response({
        "totalTickets": total_tickets,
        "pendingTickets": pending_tickets,
        "completedTickets": completed_tickets,
        "totalProducts": len(PRODUCTS),
        "totalCustomers": len(CUSTOMERS)
    })
