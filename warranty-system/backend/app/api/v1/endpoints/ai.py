from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.product import Product
from app.models.user import User
from app.models.warranty import WarrantyTicket
from app.schemas.schemas import UserOut
from app.services import ai_service, warranty_service
from app.services.ai_knowledge import ERROR_CATALOG

router = APIRouter(prefix="/ai", tags=["AI"])


# === Schemas ===
class ClassifyRequest(BaseModel):
    issue_description: str = Field(min_length=1)


class ClassifyResponse(BaseModel):
    """Contract khớp với frontend AIConsole:
    classification, confidence, tags + thông tin mở rộng.
    """

    classification: str          # error_code, ví dụ "screen_black"
    label: str                   # nhãn tiếng Việt để hiển thị
    confidence: float            # 0..1 (frontend nhân 100)
    priority: str                # CRITICAL | HIGH | MEDIUM | LOW
    severity: str
    warranty_eligible: bool
    note: str
    tags: List[str]              # gợi ý kiểm tra
    suggestions: List[str]
    matched_keywords: List[str]
    source: str                  # rule | gemini


class ProgressRequest(BaseModel):
    ticket_code: str = Field(min_length=1)
    status: str = Field(min_length=1)
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    action_note: Optional[str] = None
    repair_cost: Optional[str] = None


class ProgressResponse(BaseModel):
    message: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    # Ngữ cảnh tuỳ chọn (serial/ticket_code) để bot tra cứu chính xác hơn
    serial: Optional[str] = None
    ticket_code: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    intent: str
    confidence: float
    suggestions: List[str]
    source: str = "rule"
    # Dữ liệu tra cứu được (nếu có) — frontend render card rich
    data: Optional[dict] = None


class HistoryResponse(BaseModel):
    serial: str
    product_name: str
    warranty_status: str
    warranty_end_date: Optional[str] = None
    summary: str
    ticket_count: int
    source: str = "rule"


# === 1. Phân loại lỗi ===
@router.post("/classify", response_model=ClassifyResponse)
def classify(
    payload: ClassifyRequest,
    _: Annotated[User, Depends(get_current_user)],
):
    """Phân loại lỗi từ mô tả triệu chứng của khách hàng."""
    detail = ai_service.classify_issue_detail(payload.issue_description)
    return ClassifyResponse(
        classification=detail["error_code"],
        label=detail["label"],
        confidence=detail["confidence"],
        priority=detail["priority"],
        severity=detail["severity"],
        warranty_eligible=detail["warranty_eligible"],
        note=detail["note"],
        tags=detail["suggestions"],
        suggestions=detail["suggestions"],
        matched_keywords=detail["matched_keywords"],
        source="rule",
    )


@router.get("/error-catalog")
def error_catalog(
    _: Annotated[User, Depends(get_current_user)],
):
    """Danh mục lỗi để frontend dựng bộ chọn/filter."""
    return [
        {
            "code": code,
            "label": meta["label"],
            "priority": meta["priority"],
            "severity": meta["severity"],
            "warranty_eligible": meta["warranty_eligible"],
            "suggestions": meta["suggestions"],
        }
        for code, meta in ERROR_CATALOG.items()
    ]


# === 2. Tóm tắt lịch sử bảo hành ===
@router.get("/warranty-history/{serial}", response_model=HistoryResponse)
def warranty_history(
    serial: str,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Tóm tắt lịch sử bảo hành của một sản phẩm theo serial."""
    product = db.query(Product).filter(Product.serial_number == serial).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm với serial này")
    if current.role == "customer" and product.customer_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem sản phẩm này")

    tickets = (
        db.query(WarrantyTicket)
        .filter(WarrantyTicket.product_id == product.id)
        .order_by(WarrantyTicket.id.desc())
        .all()
    )

    history_lines = []
    for t in tickets:
        history_lines.append(
            f"{t.ticket_code} — {t.status} — {t.issue_description[:60]}"
        )

    check = warranty_service.check_warranty(product)
    summary = ai_service.summarize_history(
        product_name=product.name,
        serial=product.serial_number,
        history=history_lines,
    )

    return HistoryResponse(
        serial=product.serial_number,
        product_name=product.name,
        warranty_status="YES" if check.within else "NO",
        warranty_end_date=check.reason,
        summary=summary,
        ticket_count=len(tickets),
    )


# === 3. Sinh tin nhắn cập nhật tiến độ ===
@router.post("/progress-message", response_model=ProgressResponse)
def progress(
    payload: ProgressRequest,
    _: Annotated[User, Depends(get_current_user)],
):
    """Sinh tin nhắn cập nhật tiến độ tự động cho khách hàng."""
    msg = ai_service.generate_progress_message(
        customer_name=payload.customer_name,
        ticket_code=payload.ticket_code,
        status=payload.status,
        product_name=payload.product_name or "",
        note=payload.action_note or "",
        cost=payload.repair_cost or "",
    )
    return ProgressResponse(message=msg)


# === 4. Chatbot hội thoại ===
@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Chatbot AI: nhận diện intent → tra cứu dữ liệu → sinh câu trả lời."""
    intent, confidence = ai_service.classify_intent(payload.message)
    slots = ai_service.extract_slots(payload.message)

    # Nếu câu mô tả triệu chứng lỗi → dùng độ tin cậy của bộ phân loại lỗi
    if intent == "unknown" and ai_service.looks_like_symptom(payload.message):
        _detail = ai_service.classify_issue_detail(payload.message)
        confidence = _detail["confidence"]

    # Slot do client gửi kèm được ưu tiên (người dùng đã chọn trong UI)
    if payload.serial:
        slots["serial"] = payload.serial
    if payload.ticket_code:
        slots["ticket_code"] = payload.ticket_code

    data = None
    reply = None

    # --- Tra cứu serial: bảo hành + lịch sử ---
    if slots.get("serial") and intent in (
        "warranty_check", "serial_lookup", "product_info", "warranty_history",
    ):
        product = db.query(Product).filter(
            Product.serial_number == slots["serial"]
        ).first()
        if product and not (
            current.role == "customer" and product.customer_id != current.id
        ):
            check = warranty_service.check_warranty(product)
            tickets = (
                db.query(WarrantyTicket)
                .filter(WarrantyTicket.product_id == product.id)
                .order_by(WarrantyTicket.id.desc())
                .all()
            )
            if intent == "warranty_history":
                history_lines = [
                    f"{t.ticket_code} — {t.status} — {t.issue_description[:60]}"
                    for t in tickets
                ]
                reply = ai_service.summarize_history(
                    product.name, product.serial_number, history_lines
                )
            else:
                icon = "✅" if check.within else "⚠️"
                reply = (
                    f"{icon} **Sản phẩm {product.name}**\n\n"
                    f"🔢 Serial: `{product.serial_number}`\n"
                    f"🏷️ Danh mục: {product.category}\n"
                    f"📅 Tình trạng bảo hành: {check.reason}\n"
                    f"📆 Ngày sản xuất: {product.manufacture_date.isoformat()}"
                )
            data = {
                "serial": product.serial_number,
                "product_name": product.name,
                "category": product.category,
                "within_warranty": "YES" if check.within else "NO",
                "warranty_reason": check.reason,
                "ticket_count": len(tickets),
            }
        else:
            reply = (
                f"🔍 Không tìm thấy sản phẩm với serial **{slots['serial']}**.\n\n"
                "💡 Vui lòng kiểm tra lại serial trên nhãn dán sản phẩm, "
                "hoặc liên hệ hotline 0827461460 để được hỗ trợ tra cứu."
            )

    # --- Tra cứu mã phiếu ---
    if reply is None and slots.get("ticket_code") and intent in ("ticket_status", "unknown"):
        ticket = db.query(WarrantyTicket).filter(
            WarrantyTicket.ticket_code == slots["ticket_code"]
        ).first()
        if ticket and not (
            current.role == "customer" and ticket.customer_id != current.id
        ):
            product_name = ticket.product.name if ticket.product else "sản phẩm"
            reply = (
                f"📋 **Phiếu {ticket.ticket_code}**\n\n"
                f"📦 Sản phẩm: {product_name}\n"
                f"🔧 Lỗi: {ticket.issue_description[:100]}\n"
                f"📍 **Trạng thái: {ai_service.STATUS_LABELS.get(ticket.status, ticket.status)}**\n"
                f"📅 Cập nhật: {ticket.updated_at.strftime('%d/%m/%Y') if ticket.updated_at else '-'}"
            )
            data = {
                "ticket_code": ticket.ticket_code,
                "status": ticket.status,
                "issue_description": ticket.issue_description,
                "product_name": product_name,
            }
        else:
            reply = (
                f"🔍 Không tìm thấy phiếu **{slots['ticket_code']}** "
                "trong hệ thống.\n\n"
                "💡 Mã phiếu có dạng `WR-2026-0001`. "
                "Bạn cũng có thể tra cứu bằng số serial sản phẩm."
            )

    # --- Tra cứu theo điện thoại ---
    elif reply is None and slots.get("phone") and intent == "phone_lookup":
        products = db.query(Product).filter(
            Product.customer_id == current.id
        ).all()
        reply = (
            f"🔍 Tìm thấy **{len(products)}** sản phẩm đã đăng ký với số điện thoại "
            f"bạn cung cấp:\n\n"
            + (
                "\n".join(
                    f"📦 `{p.serial_number}` - {p.name} - "
                    f"{'Còn BH' if warranty_service.check_warranty(p).within else 'Hết BH'}"
                    for p in products[:10]
                )
                if products
                else "_Chưa có sản phẩm nào khớp._"
            )
        )
        data = {
            "products": [
                {
                    "serial": p.serial_number,
                    "name": p.name,
                    "within_warranty": "YES" if warranty_service.check_warranty(p).within else "NO",
                }
                for p in products[:10]
            ]
        }

    # --- Danh sách phiếu của khách ---
    elif reply is None and intent == "ticket_status" and not slots.get("ticket_code"):
        tickets = (
            db.query(WarrantyTicket)
            .filter(WarrantyTicket.customer_id == current.id)
            .order_by(WarrantyTicket.id.desc())
            .limit(5)
            .all()
        )
        if tickets:
            reply = f"📋 Bạn có **{len(tickets)}** phiếu bảo hành gần đây:\n\n" + "\n".join(
                f"- `{t.ticket_code}` — {ai_service.STATUS_LABELS.get(t.status, t.status)}"
                for t in tickets
            )
            data = {
                "tickets": [
                    {
                        "id": t.id,
                        "ticket_code": t.ticket_code,
                        "status": t.status,
                        "issue_description": t.issue_description,
                        "product_name": t.product.name if t.product else None,
                    }
                    for t in tickets
                ]
            }
        else:
            reply = (
                "📋 Hiện tại tôi chưa tìm thấy phiếu bảo hành nào trong tài khoản của bạn.\n\n"
                "📝 Bạn có thể tạo phiếu mới tại menu **Phiếu bảo hành → Tạo phiếu**."
            )

    # --- Phân loại lỗi từ mô tả triệu chứng ---
    if reply is None and (intent == "unknown" or ai_service.looks_like_symptom(payload.message)):
        detail = ai_service.classify_issue_detail(payload.message)
        if detail["error_code"] != "other":
            reply = (
                f"🔍 **Phân loại lỗi: {detail['label']}**\n\n"
                f"📋 **Mô tả:** {detail['note']}\n"
                f"⚠️ **Mức độ:** {detail['severity']} ({detail['priority']})\n"
                f"💰 **Bảo hành:** "
                + ("Được hỗ trợ miễn phí nếu còn thời hạn" if detail["warranty_eligible"]
                   else "Không áp dụng bảo hành miễn phí — sẽ có báo giá trước khi sửa")
                + "\n\n"
                "📝 **Gợi ý kiểm tra:**\n"
                + "\n".join(f"{i+1}️⃣ {s}" for i, s in enumerate(detail["suggestions"]))
                + "\n\n"
                "📝 **Để tạo yêu cầu BH, bạn cần:** số serial + mô tả chi tiết lỗi."
            )
            intent = "error_classification"
            data = detail
        elif reply is None:
            reply = ai_service.build_intent_response(intent, slots)
    elif reply is None:
        reply = ai_service.build_intent_response(intent, slots)

    return ChatResponse(
        reply=reply,
        intent=intent,
        confidence=confidence,
        suggestions=ai_service.suggestions_for(intent),
        data=data,
    )
