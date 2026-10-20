"""
RMA - Return Merchandise Authorization
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/rma", tags=["RMA"])

# RMA statuses
RMA_STATUSES = {
    "pending": "Chờ duyệt",
    "approved": "Đã duyệt",
    "rejected": "Từ chối",
    "shipping": "Đang vận chuyển",
    "received": "Đã nhận hàng",
    "inspecting": "Đang kiểm tra",
    "processing": "Đang xử lý",
    "completed": "Hoàn thành",
    "cancelled": "Đã hủy",
}

# Mock RMA data
RMAS = [
    {
        "id": "RMA-2026-0001",
        "ticket_id": 101,
        "customer_id": 1,
        "customer_name": "Nguyễn Văn An",
        "product_name": "Router Tenda AC10",
        "serial_number": "TDA-AC10-001",
        "reason": "Sản phẩm lỗi không sửa được",
        "status": "completed",
        "created_at": "2026-09-15T10:00:00Z",
        "updated_at": "2026-09-20T15:30:00Z",
        "tracking_number": "VNPOST123456789",
        "refund_amount": 350000,
        "notes": "Hoàn tiền đầy đủ",
    },
    {
        "id": "RMA-2026-0002",
        "ticket_id": 102,
        "customer_id": 2,
        "customer_name": "Trần Thị Bình",
        "product_name": "Laptop Dell XPS 15",
        "serial_number": "DELL-XPS-002",
        "reason": "Lỗi màn hình nghiêm trọng",
        "status": "shipping",
        "created_at": "2026-10-10T14:00:00Z",
        "updated_at": "2026-10-12T09:00:00Z",
        "tracking_number": "GHTK123456789",
        "refund_amount": 0,
        "notes": "Đang chờ khách gửi hàng",
    },
    {
        "id": "RMA-2026-0003",
        "ticket_id": 103,
        "customer_id": 1,
        "customer_name": "Nguyễn Văn An",
        "product_name": "Tai nghe Sony WH-1000XM4",
        "serial_number": "SONY-WH4-004",
        "reason": "Yêu cầu đổi sang màu khác",
        "status": "pending",
        "created_at": "2026-10-15T11:30:00Z",
        "updated_at": "2026-10-15T11:30:00Z",
        "tracking_number": None,
        "refund_amount": 0,
        "notes": "",
    },
]

# Schemas
class RMACreate(BaseModel):
    ticket_id: int = Field(..., description="ID phiếu bảo hành")
    reason: str = Field(..., min_length=10, max_length=500, description="Lý do đổi/trả")
    notes: Optional[str] = Field(None, max_length=255, description="Ghi chú thêm")

class RMAUpdate(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    refund_amount: Optional[float] = None
    notes: Optional[str] = None

class RMAStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

@router.get("")
async def get_rmas(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    customer_id: Optional[int] = Query(None, description="Lọc theo khách hàng"),
    search: Optional[str] = Query(None, description="Tìm kiếm"),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all RMA requests"""
    rmas = RMAS.copy()
    
    # Filter by status
    if status:
        rmas = [r for r in rmas if r["status"] == status]
    
    # Filter by customer
    if customer_id:
        rmas = [r for r in rmas if r["customer_id"] == customer_id]
    
    # Search
    if search:
        search_lower = search.lower()
        rmas = [r for r in rmas if 
            search_lower in r["id"].lower() or
            search_lower in r["product_name"].lower() or
            search_lower in r["customer_name"].lower() or
            (r.get("tracking_number") and search_lower in r["tracking_number"].lower())
        ]
    
    return {
        "rmas": rmas[:limit],
        "total": len(rmas),
        "statuses": RMA_STATUSES
    }

@router.get("/{rma_id}")
async def get_rma(rma_id: str):
    """Get RMA by ID"""
    rma = next((r for r in RMAS if r["id"] == rma_id), None)
    if not rma:
        raise HTTPException(status_code=404, detail="RMA không tìm thấy")
    return rma

@router.post("")
async def create_rma(data: RMACreate):
    """Create new RMA request"""
    # Generate RMA ID
    new_id = f"RMA-2026-{len(RMAS) + 1:04d}"
    
    rma = {
        "id": new_id,
        "ticket_id": data.ticket_id,
        "customer_id": 1,  # Mock - would come from auth
        "customer_name": "Khách hàng",  # Mock
        "product_name": "Sản phẩm",  # Mock - would come from ticket
        "serial_number": "SERIAL",  # Mock
        "reason": data.reason,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "tracking_number": None,
        "refund_amount": 0,
        "notes": data.notes or "",
    }
    
    RMAS.insert(0, rma)
    
    return {
        "success": True,
        "message": "Tạo yêu cầu RMA thành công",
        "rma": rma
    }

@router.put("/{rma_id}")
async def update_rma(rma_id: str, data: RMAUpdate):
    """Update RMA"""
    rma = next((r for r in RMAS if r["id"] == rma_id), None)
    if not rma:
        raise HTTPException(status_code=404, detail="RMA không tìm thấy")
    
    if data.status:
        if data.status not in RMA_STATUSES:
            raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
        rma["status"] = data.status
    
    if data.tracking_number:
        rma["tracking_number"] = data.tracking_number
    
    if data.refund_amount is not None:
        rma["refund_amount"] = data.refund_amount
    
    if data.notes:
        rma["notes"] = data.notes
    
    rma["updated_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "Cập nhật RMA thành công",
        "rma": rma
    }

@router.post("/{rma_id}/approve")
async def approve_rma(rma_id: str, notes: Optional[str] = None):
    """Approve RMA request"""
    rma = next((r for r in RMAS if r["id"] == rma_id), None)
    if not rma:
        raise HTTPException(status_code=404, detail="RMA không tìm thấy")
    
    if rma["status"] != "pending":
        raise HTTPException(status_code=400, detail="Chỉ có thể duyệt RMA đang chờ")
    
    rma["status"] = "approved"
    rma["updated_at"] = datetime.now().isoformat()
    if notes:
        rma["notes"] = notes
    
    # Generate shipping label
    rma["tracking_number"] = f"GHTK{rma['id'].replace('-', '')}"
    
    return {
        "success": True,
        "message": "Duyệt RMA thành công",
        "rma": rma
    }

@router.post("/{rma_id}/reject")
async def reject_rma(rma_id: str, reason: str):
    """Reject RMA request"""
    rma = next((r for r in RMAS if r["id"] == rma_id), None)
    if not rma:
        raise HTTPException(status_code=404, detail="RMA không tìm thấy")
    
    if rma["status"] != "pending":
        raise HTTPException(status_code=400, detail="Chỉ có thể từ chối RMA đang chờ")
    
    rma["status"] = "rejected"
    rma["updated_at"] = datetime.now().isoformat()
    rma["notes"] = f"Từ chối: {reason}"
    
    return {
        "success": True,
        "message": "Từ chối RMA thành công",
        "rma": rma
    }

@router.post("/{rma_id}/cancel")
async def cancel_rma(rma_id: str):
    """Cancel RMA request"""
    rma = next((r for r in RMAS if r["id"] == rma_id), None)
    if not rma:
        raise HTTPException(status_code=404, detail="RMA không tìm thấy")
    
    if rma["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Không thể hủy RMA đã hoàn thành hoặc đã hủy")
    
    rma["status"] = "cancelled"
    rma["updated_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "Hủy RMA thành công",
        "rma": rma
    }

@router.get("/{rma_id}/label")
async def get_shipping_label(rma_id: str):
    """Generate shipping label for RMA"""
    rma = next((r for r in RMAS if r["id"] == rma_id), None)
    if not rma:
        raise HTTPException(status_code=404, detail="RMA không tìm thấy")
    
    return {
        "rma_id": rma_id,
        "tracking_number": rma["tracking_number"],
        "label_url": f"/api/v1/rma/{rma_id}/label/download",
        "carrier": "GHTK",
        "from": {
            "name": rma["customer_name"],
            "address": "Địa chỉ khách hàng",
            "phone": "SĐT khách hàng"
        },
        "to": {
            "name": "Trung tâm bảo hành BảoHành Pro",
            "address": "123 Đường ABC, Quận XYZ, TP.HCM",
            "phone": "1900-xxxx"
        },
        "instructions": "Gửi kèm phiếu bảo hành và sản phẩm trong hộp nguyên vẹn"
    }

@router.get("/stats/summary")
async def get_rma_stats():
    """Get RMA statistics"""
    total = len(RMAS)
    by_status = {}
    for rma in RMAS:
        status = rma["status"]
        by_status[status] = by_status.get(status, 0) + 1
    
    return {
        "total": total,
        "by_status": by_status,
        "avg_processing_days": 5.2,
        "total_refund": sum(r["refund_amount"] for r in RMAS),
        "status_labels": RMA_STATUSES
    }
