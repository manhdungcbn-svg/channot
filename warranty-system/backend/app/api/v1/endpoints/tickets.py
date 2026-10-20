"""
Tickets API Endpoints - Sử dụng seed data từ database module
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from app.database import TICKETS, PRODUCTS, CUSTOMERS, success_response

router = APIRouter(prefix="/tickets", tags=["Tickets"])

STATUS_OPTIONS = ["received", "checking", "repairing", "completed", "rejected"]
STATUS_TEXTS = {
    "received": "Tiếp nhận",
    "checking": "Đang kiểm tra", 
    "repairing": "Đang sửa chữa",
    "completed": "Hoàn thành",
    "rejected": "Từ chối"
}

@router.get("/stats")
async def get_stats():
    """Get ticket statistics"""
    by_status = {}
    for s in STATUS_OPTIONS:
        by_status[s] = sum(1 for t in TICKETS if t["status"] == s)
    
    # Categories
    categories = {}
    for t in TICKETS:
        cat = t.get("category", "Khác")
        categories[cat] = categories.get(cat, 0) + 1
    
    return success_response({
        "total": len(TICKETS),
        "by_status": by_status,
        "pending": by_status["received"] + by_status["checking"] + by_status["repairing"],
        "completed": by_status["completed"],
        "rejected": by_status["rejected"],
        "categories": categories
    })

@router.get("")
async def get_tickets(
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get list of tickets"""
    tickets = [t.copy() for t in TICKETS]
    
    # Sort by created_at desc
    tickets.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    if status and status != "all":
        tickets = [t for t in tickets if t["status"] == status]
    
    if search:
        search_lower = search.lower()
        tickets = [t for t in tickets if 
                  search_lower in t.get("product_name", "").lower() or
                  search_lower in t.get("ticket_code", "").lower() or
                  search_lower in t.get("customer_name", "").lower()]
    
    return success_response({
        "tickets": tickets[:limit],
        "total": len(tickets),
        "status_counts": {s: sum(1 for t in TICKETS if t["status"] == s) for s in STATUS_OPTIONS}
    })

@router.get("/{ticket_id}")
async def get_ticket(ticket_id: int):
    """Get ticket by ID"""
    ticket = next((t for t in TICKETS if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = ticket.copy()
    
    # Get product info
    product = next((p for p in PRODUCTS if p["id"] == ticket.get("product_id")), None)
    if product:
        ticket["product"] = product
    
    # Get customer info
    customer = next((c for c in CUSTOMERS if c["id"] == ticket.get("customer_id")), None)
    if customer:
        ticket["customer"] = customer
    
    return success_response(ticket)

@router.post("")
async def create_ticket(data: dict):
    """Create new ticket"""
    from app.database import get_next_id
    
    # Find product
    serial = data.get("serial_number", "")
    product = None
    if serial:
        product = next((p for p in PRODUCTS if p["serial_number"].upper() == serial.upper()), None)
    
    # Find customer
    customer_id = data.get("customer_id")
    customer = None
    if customer_id:
        customer = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    elif product:
        customer = next((c for c in CUSTOMERS if c["id"] == product.get("customer_id")), None)
    
    ticket_id = get_next_id(TICKETS)
    now = datetime.now()
    
    ticket = {
        "id": ticket_id,
        "ticket_code": f"WR-{now.year}-{str(ticket_id).zfill(4)}",
        "product_id": product["id"] if product else None,
        "product_serial": serial or (product["serial_number"] if product else ""),
        "product_name": data.get("product_name", product["name"] if product else "Unknown"),
        "customer_id": customer["id"] if customer else None,
        "customer_name": customer["name"] if customer else data.get("customer_name", "Unknown"),
        "customer_phone": customer["phone"] if customer else data.get("customer_phone", ""),
        "issue_description": data.get("issue_description", ""),
        "status": "received",
        "status_text": STATUS_TEXTS["received"],
        "technician_id": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "notes": "",
        "repair_cost": 0
    }
    
    TICKETS.append(ticket)
    return success_response(ticket)

@router.put("/{ticket_id}/status")
async def update_ticket_status(ticket_id: int, status: str):
    """Update ticket status"""
    ticket = next((t for t in TICKETS if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if status not in STATUS_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {STATUS_OPTIONS}")
    
    ticket["status"] = status
    ticket["status_text"] = STATUS_TEXTS[status]
    ticket["updated_at"] = datetime.now().isoformat()
    
    return success_response(ticket)

@router.delete("/{ticket_id}")
async def delete_ticket(ticket_id: int):
    """Delete a ticket"""
    global TICKETS
    ticket = next((t for t in TICKETS if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    TICKETS = [t for t in TICKETS if t["id"] != ticket_id]
    return success_response({"message": "Ticket deleted"})
