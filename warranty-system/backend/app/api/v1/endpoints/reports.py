"""
Reports Endpoints - Báo cáo & Analytics
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/reports", tags=["Reports"])

# Mock data
MONTHLY_DATA = {
    "2026-01": {"tickets": 98, "revenue": 32000000, "claims": 28},
    "2026-02": {"tickets": 105, "revenue": 35000000, "claims": 31},
    "2026-03": {"tickets": 112, "revenue": 38000000, "claims": 33},
    "2026-04": {"tickets": 120, "revenue": 41000000, "claims": 35},
    "2026-05": {"tickets": 135, "revenue": 45000000, "claims": 38},
    "2026-06": {"tickets": 142, "revenue": 47000000, "claims": 40},
    "2026-07": {"tickets": 138, "revenue": 46000000, "claims": 39},
    "2026-08": {"tickets": 148, "revenue": 48000000, "claims": 42},
    "2026-09": {"tickets": 155, "revenue": 51000000, "claims": 44},
    "2026-10": {"tickets": 162, "revenue": 54000000, "claims": 46},
}

TOP_PRODUCTS = [
    {"id": 1, "name": "Router Tenda AC10", "category": "Network", "tickets": 45, "fail_rate": 8.5, "cost": 13500000},
    {"id": 2, "name": "Laptop Dell XPS 15", "category": "Computer", "tickets": 38, "fail_rate": 5.2, "cost": 19000000},
    {"id": 3, "name": "Smart TV Samsung 55\"", "category": "TV", "tickets": 32, "fail_rate": 4.1, "cost": 16000000},
    {"id": 4, "name": "Tai nghe Sony WH-1000XM4", "category": "Audio", "tickets": 28, "fail_rate": 6.8, "cost": 14000000},
    {"id": 5, "name": "Bàn phím Logitech K380", "category": "Accessories", "tickets": 22, "fail_rate": 3.2, "cost": 4400000},
    {"id": 6, "name": "Chuột Logitech MX Master 3", "category": "Accessories", "tickets": 18, "fail_rate": 2.8, "cost": 5400000},
    {"id": 7, "name": "Monitor LG 27\" 4K", "category": "Display", "tickets": 15, "fail_rate": 3.5, "cost": 10500000},
    {"id": 8, "name": "Webcam Logitech C920", "category": "Accessories", "tickets": 12, "fail_rate": 2.1, "cost": 3600000},
]

CATEGORY_STATS = [
    {"category": "Network", "tickets": 85, "cost": 25000000, "avg_cost": 294000, "percentage": 25},
    {"category": "Computer", "tickets": 62, "cost": 18000000, "avg_cost": 290000, "percentage": 18},
    {"category": "TV", "tickets": 45, "cost": 15000000, "avg_cost": 333000, "percentage": 13},
    {"category": "Audio", "tickets": 38, "cost": 12000000, "avg_cost": 315000, "percentage": 11},
    {"category": "Accessories", "tickets": 52, "cost": 13500000, "avg_cost": 260000, "percentage": 15},
    {"category": "Display", "tickets": 25, "cost": 8000000, "avg_cost": 320000, "percentage": 7},
    {"category": "Other", "tasks": 28, "cost": 8500000, "avg_cost": 303000, "percentage": 8},
]

ISSUE_TYPES = [
    {"type": "Hardware Failure", "count": 125, "percentage": 35},
    {"type": "Software Issue", "count": 85, "percentage": 24},
    {"type": "Network Problem", "count": 65, "percentage": 18},
    {"type": "Display Issue", "count": 45, "percentage": 13},
    {"type": "Other", "count": 35, "percentage": 10},
]

SLA_DATA = [
    {"month": "2026-07", "on_time": 94.2, "late": 5.8},
    {"month": "2026-08", "on_time": 95.1, "late": 4.9},
    {"month": "2026-09", "on_time": 93.8, "late": 6.2},
    {"month": "2026-10", "on_time": 96.5, "late": 3.5},
]

# Response Models
class DashboardReport(BaseModel):
    total_tickets: int
    tickets_this_month: int
    tickets_growth: float
    avg_resolution_time: float
    sla_compliance: float
    revenue_this_month: float

@router.get("/dashboard")
async def get_dashboard_report():
    """Main dashboard analytics"""
    current_month = MONTHLY_DATA.get("2026-10", {})
    prev_month = MONTHLY_DATA.get("2026-09", {})
    
    tickets_growth = ((current_month.get("tickets", 0) - prev_month.get("tickets", 0)) / prev_month.get("tickets", 1)) * 100 if prev_month.get("tickets") else 0
    
    return {
        "total_tickets": sum(m["tickets"] for m in MONTHLY_DATA.values()),
        "tickets_this_month": current_month.get("tickets", 0),
        "tickets_growth": round(tickets_growth, 1),
        "avg_resolution_time": 3.2,
        "sla_compliance": 96.5,
        "revenue_this_month": current_month.get("revenue", 0),
        "total_revenue": sum(m["revenue"] for m in MONTHLY_DATA.values()),
        "total_claims_cost": sum(p["cost"] for p in TOP_PRODUCTS),
        "top_products": TOP_PRODUCTS[:5],
        "category_breakdown": CATEGORY_STATS,
        "monthly_trend": [
            {"month": k, "tickets": v["tickets"], "revenue": v["revenue"], "claims": v["claims"]}
            for k, v in MONTHLY_DATA.items()
        ]
    }

@router.get("/products")
async def get_product_report(
    category: Optional[str] = Query(None, description="Lọc theo danh mục"),
    sort: Optional[str] = Query("tickets", description="Sắp xếp: tickets, fail_rate, cost")
):
    """Product failure analysis"""
    products = TOP_PRODUCTS.copy()
    
    if category:
        products = [p for p in products if p.get("category") == category]
    
    if sort == "tickets":
        products.sort(key=lambda x: x["tickets"], reverse=True)
    elif sort == "fail_rate":
        products.sort(key=lambda x: x["fail_rate"], reverse=True)
    elif sort == "cost":
        products.sort(key=lambda x: x["cost"], reverse=True)
    
    return {
        "total_products": len(TOP_PRODUCTS),
        "products": products,
        "category_stats": CATEGORY_STATS,
        "issue_types": ISSUE_TYPES
    }

@router.get("/financial")
async def get_financial_report(
    year: Optional[int] = Query(2026, description="Năm báo cáo")
):
    """Financial summary"""
    total_revenue = sum(m["revenue"] for m in MONTHLY_DATA.values())
    total_claims_cost = sum(p["cost"] for p in TOP_PRODUCTS)
    
    return {
        "year": year,
        "total_revenue": total_revenue,
        "total_claims_cost": total_claims_cost,
        "net_profit": total_revenue - total_claims_cost,
        "profit_margin": round((total_revenue - total_claims_cost) / total_revenue * 100, 1) if total_revenue else 0,
        "monthly_breakdown": [
            {"month": k, "revenue": v["revenue"], "cost": v["revenue"] * 0.35, "profit": v["revenue"] * 0.65}
            for k, v in MONTHLY_DATA.items()
        ],
        "revenue_by_category": [
            {"category": c["category"], "revenue": c["cost"] * 2.5}
            for c in CATEGORY_STATS
        ]
    }

@router.get("/sla")
async def get_sla_report():
    """SLA performance report"""
    return {
        "overall_compliance": 96.5,
        "avg_resolution_time_days": 3.2,
        "first_response_time_hours": 2.5,
        "monthly_data": SLA_DATA,
        "by_priority": [
            {"priority": "Urgent", "avg_hours": 4, "on_time_rate": 98.5},
            {"priority": "High", "avg_hours": 12, "on_time_rate": 96.2},
            {"priority": "Normal", "avg_hours": 48, "on_time_rate": 95.8},
            {"priority": "Low", "avg_hours": 96, "on_time_rate": 94.1},
        ]
    }

@router.get("/export")
async def export_report(
    report_type: str = Query("dashboard", description="Loại báo cáo: dashboard, products, financial"),
    format: str = Query("json", description="Định dạng: json, csv")
):
    """Export report data"""
    if report_type == "dashboard":
        data = await get_dashboard_report()
    elif report_type == "products":
        data = await get_product_report()
    elif report_type == "financial":
        data = await get_financial_report()
    else:
        data = {"error": "Invalid report type"}
    
    return {
        "report_type": report_type,
        "format": format,
        "generated_at": datetime.now().isoformat(),
        "data": data
    }
