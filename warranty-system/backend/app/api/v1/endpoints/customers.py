"""
Customers Endpoints - Quản lý khách hàng nâng cao
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/customers", tags=["Customers"])

# Mock database
CUSTOMERS = [
    {
        "id": 1,
        "name": "Nguyễn Văn An",
        "email": "nva@email.com",
        "phone": "0912345678",
        "address": "123 Nguyễn Trãi, Q1, TP.HCM",
        "company": "Công ty ABC",
        "notes": "VIP customer",
        "created_at": "2026-01-15T10:00:00Z",
        "total_tickets": 5,
        "total_spent": 1500000,
        "tier": "gold"
    },
    {
        "id": 2,
        "name": "Trần Thị Bình",
        "email": "ttb@email.com",
        "phone": "0987654321",
        "address": "456 Lý Thường Kiệt, Q10, TP.HCM",
        "company": None,
        "notes": "",
        "created_at": "2026-02-20T14:30:00Z",
        "total_tickets": 3,
        "total_spent": 800000,
        "tier": "silver"
    },
    {
        "id": 3,
        "name": "Lê Minh Cường",
        "email": "lmc@company.vn",
        "phone": "0905123456",
        "address": "789 Điện Biên Phủ, Q3, TP.HCM",
        "company": "Công ty XYZ Corp",
        "notes": "Doanh nghiệp lớn",
        "created_at": "2026-03-10T09:00:00Z",
        "total_tickets": 12,
        "total_spent": 5500000,
        "tier": "platinum"
    },
    {
        "id": 4,
        "name": "Phạm Thị Dung",
        "email": "ptd@gmail.com",
        "phone": "0932123456",
        "address": "321 Nguyễn Huệ, Q1, TP.HCM",
        "company": None,
        "notes": "",
        "created_at": "2026-04-05T11:15:00Z",
        "total_tickets": 2,
        "total_spent": 350000,
        "tier": "basic"
    },
]

TICKETS_HISTORY = {
    1: [
        {"id": 101, "product": "Router Tenda AC10", "serial": "TDA-AC10-001", "status": "completed", "amount": 300000, "date": "2026-05-10", "issue": "Mất kết nối wifi"},
        {"id": 102, "product": "Laptop Dell XPS 15", "serial": "DELL-XPS-002", "status": "repairing", "amount": 0, "date": "2026-09-15", "issue": "Màn hình nhấp nháy"},
        {"id": 103, "product": "Bàn phím Logitech K380", "serial": "LOGI-K380-003", "status": "completed", "amount": 150000, "date": "2026-08-20", "issue": "Phím không hoạt động"},
    ],
    2: [
        {"id": 104, "product": "Tai nghe Sony WH-1000XM4", "serial": "SONY-WH4-004", "status": "completed", "amount": 500000, "date": "2026-06-15", "issue": "Bluetooth lỗi"},
    ],
}

# Schemas
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    phone: str = Field(..., min_length=8, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, min_length=5, max_length=100)
    phone: Optional[str] = Field(None, min_length=8, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    tier: Optional[str] = Field(None, description="basic, silver, gold, platinum")

class CustomerResponse(CustomerBase):
    id: int
    created_at: str
    total_tickets: int = 0
    total_spent: float = 0.0
    tier: str = "basic"

# Endpoints
@router.get("", response_model=dict)
async def get_customers(
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên, email, SĐT"),
    tier: Optional[str] = Query(None, description="Lọc theo hạng: basic, silver, gold, platinum"),
    sort: Optional[str] = Query("created_at", description="Sắp xếp: created_at, name, total_tickets"),
    order: Optional[str] = Query("desc", description="Thứ tự: asc, desc"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all customers with search, filter and pagination"""
    customers = CUSTOMERS.copy()
    
    # Search
    if search:
        search_lower = search.lower()
        customers = [c for c in customers if 
            search_lower in c["name"].lower() or 
            search_lower in c["email"].lower() or
            search_lower in c["phone"].lower() or
            (c.get("company") and search_lower in c["company"].lower())
        ]
    
    # Filter by tier
    if tier:
        customers = [c for c in customers if c.get("tier") == tier]
    
    # Sort
    reverse = order == "desc"
    if sort == "name":
        customers.sort(key=lambda x: x["name"], reverse=reverse)
    elif sort == "total_tickets":
        customers.sort(key=lambda x: x["total_tickets"], reverse=reverse)
    else:
        customers.sort(key=lambda x: x["created_at"], reverse=reverse)
    
    total = len(customers)
    customers = customers[offset:offset + limit]
    
    return {"customers": customers, "total": total, "limit": limit, "offset": offset}

@router.get("/{customer_id}")
async def get_customer(customer_id: int):
    """Get customer by ID with ticket history"""
    customer = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tìm thấy")
    
    # Get tickets
    tickets = TICKETS_HISTORY.get(customer_id, [])
    
    return {**customer, "tickets": tickets}

@router.post("", response_model=dict)
async def create_customer(data: CustomerCreate):
    """Create new customer"""
    # Check email exists
    if any(c["email"] == data.email for c in CUSTOMERS):
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    
    new_id = max([c["id"] for c in CUSTOMERS]) + 1
    customer = {
        "id": new_id,
        **data.model_dump(),
        "created_at": datetime.now().isoformat(),
        "total_tickets": 0,
        "total_spent": 0.0,
        "tier": "basic"
    }
    CUSTOMERS.append(customer)
    TICKETS_HISTORY[new_id] = []
    
    return customer

@router.put("/{customer_id}")
async def update_customer(customer_id: int, data: CustomerUpdate):
    """Update customer info"""
    customer = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tìm thấy")
    
    # Check email if changing
    if data.email and data.email != customer["email"]:
        if any(c["email"] == data.email for c in CUSTOMERS if c["id"] != customer_id):
            raise HTTPException(status_code=400, detail="Email đã tồn tại")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            customer[key] = value
    
    return customer

@router.delete("/{customer_id}")
async def delete_customer(customer_id: int):
    """Delete customer"""
    global CUSTOMERS
    customer = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tìm thấy")
    
    CUSTOMERS = [c for c in CUSTOMERS if c["id"] != customer_id]
    if customer_id in TICKETS_HISTORY:
        del TICKETS_HISTORY[customer_id]
    
    return {"message": "Xóa khách hàng thành công", "id": customer_id}

@router.get("/{customer_id}/tickets")
async def get_customer_tickets(customer_id: int):
    """Get all tickets for a customer"""
    customer = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tìm thấy")
    
    tickets = TICKETS_HISTORY.get(customer_id, [])
    return {"tickets": tickets, "total": len(tickets)}

@router.get("/{customer_id}/stats")
async def get_customer_stats(customer_id: int):
    """Get customer statistics"""
    customer = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Khách hàng không tìm thấy")
    
    tickets = TICKETS_HISTORY.get(customer_id, [])
    completed = [t for t in tickets if t["status"] == "completed"]
    
    return {
        "customer_id": customer_id,
        "total_tickets": len(tickets),
        "completed_tickets": len(completed),
        "pending_tickets": len(tickets) - len(completed),
        "total_spent": customer["total_spent"],
        "avg_ticket_value": sum(t["amount"] for t in completed) / len(completed) if completed else 0,
        "tier": customer["tier"],
        "member_since": customer["created_at"]
    }
