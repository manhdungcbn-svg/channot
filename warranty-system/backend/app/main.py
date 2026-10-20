"""
BảoHành Pro - Main Application Entry Point
FastAPI backend for warranty management system
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import API endpoints
from app.api.v1.endpoints import ai_chat, auth, tickets, products, wallet, customers, reports, rma, notifications, rbac, dashboard, seed, vnpay

# Import database to initialize seed data
from app import database

app = FastAPI(
    title="BảoHành Pro API",
    description="Hệ thống Quản lý Bảo hành Tích hợp AI",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_chat.router, prefix="/api/v1", tags=["AI Chat"])
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(tickets.router, prefix="/api/v1", tags=["Tickets"])
app.include_router(products.router, prefix="/api/v1", tags=["Products"])
app.include_router(wallet.router, prefix="/api/v1", tags=["Wallet"])
app.include_router(customers.router, prefix="/api/v1", tags=["Customers"])
app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
app.include_router(rma.router, prefix="/api/v1", tags=["RMA"])
app.include_router(notifications.router, prefix="/api/v1", tags=["Notifications"])
app.include_router(rbac.router, prefix="/api/v1", tags=["RBAC"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(seed.router, prefix="/api/v1", tags=["Seed Data"])
app.include_router(vnpay.router, prefix="/api/v1", tags=["VNPay"])

# Root endpoint
@app.get("/")
def root():
    return {
        "app": "BảoHành Pro API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs"
    }

# Health check
@app.get("/health")
def health():
    return {"status": "ok"}

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
