"""
Products API Endpoints - Sử dụng seed data từ database module
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database import PRODUCTS, CUSTOMERS, check_warranty_status, success_response

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("")
async def get_products(
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None
):
    """Get list of products"""
    products = [p.copy() for p in PRODUCTS]
    
    # Add warranty info
    for p in products:
        warranty_info = check_warranty_status(p)
        p["warranty_valid"] = warranty_info["valid"]
        p["days_remaining"] = warranty_info["days_remaining"]
    
    if search:
        search_lower = search.lower()
        products = [p for p in products if 
                   search_lower in p["name"].lower() or 
                   search_lower in p["serial_number"].lower() or
                   search_lower in p.get("brand", "").lower()]
    
    if category:
        products = [p for p in products if p["category"] == category]
    
    return success_response({
        "products": products[:limit],
        "total": len(products)
    })

@router.get("/stats")
async def get_stats():
    """Get product statistics"""
    now_date = datetime.now()
    
    total = len(PRODUCTS)
    valid = sum(1 for p in PRODUCTS if check_warranty_status(p)["valid"])
    expired = total - valid
    
    categories = {}
    for p in PRODUCTS:
        cat = p["category"]
        categories[cat] = categories.get(cat, 0) + 1
    
    return success_response({
        "total": total,
        "active": valid,
        "expired": expired,
        "by_category": categories
    })

@router.get("/{product_id}")
async def get_product(product_id: int):
    """Get product by ID"""
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add warranty info
    warranty_info = check_warranty_status(product)
    product = product.copy()
    product["warranty_valid"] = warranty_info["valid"]
    product["days_remaining"] = warranty_info["days_remaining"]
    product["warranty_status"] = warranty_info["status"]
    
    # Get customer info
    customer = next((c for c in CUSTOMERS if c["id"] == product.get("customer_id")), None)
    if customer:
        product["customer"] = customer
    
    return success_response(product)

@router.get("/serial/{serial_number}")
async def get_product_by_serial(serial_number: str):
    """Get product by serial number"""
    product = next((p for p in PRODUCTS if p["serial_number"].upper() == serial_number.upper()), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add warranty info
    warranty_info = check_warranty_status(product)
    product = product.copy()
    product["warranty_valid"] = warranty_info["valid"]
    product["days_remaining"] = warranty_info["days_remaining"]
    product["warranty_status"] = warranty_info["status"]
    
    return success_response(product)

@router.get("/warranty/check")
async def check_warranty(serial_number: str = Query(...)):
    """Check warranty status by serial"""
    product = next((p for p in PRODUCTS if p["serial_number"].upper() == serial_number.upper()), None)
    if not product:
        return success_response({
            "valid": False,
            "message": "Không tìm thấy sản phẩm với serial này"
        })
    
    warranty_info = check_warranty_status(product)
    
    return success_response({
        "valid": warranty_info["valid"],
        "status": warranty_info["status"],
        "days_remaining": warranty_info["days_remaining"],
        "product_name": product["name"],
        "serial_number": product["serial_number"],
        "purchase_date": product["purchase_date"],
        "warranty_expiry": product["warranty_expiry"],
        "warranty_months": product["warranty_months"],
        "message": "Bảo hành còn hiệu lực" if warranty_info["valid"] else "Bảo hành đã hết hạn"
    })

@router.post("")
async def create_product(data: dict):
    """Create new product"""
    from app.database import get_next_id
    
    product = {
        "id": get_next_id(PRODUCTS),
        "name": data.get("name", "Unknown"),
        "serial_number": data.get("serial_number", ""),
        "category": data.get("category", "General"),
        "brand": data.get("brand", ""),
        "model": data.get("model", ""),
        "warranty_months": data.get("warranty_months", 12),
        "price": data.get("price", 0),
        "description": data.get("description", ""),
        "purchase_date": data.get("purchase_date", ""),
        "status": "active",
        "customer_id": data.get("customer_id")
    }
    
    PRODUCTS.append(product)
    return success_response(product)

from datetime import datetime
