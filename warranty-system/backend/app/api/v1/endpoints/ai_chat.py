"""
AI Chat Endpoint - REST API cho chatbot
Standalone version - không cần authentication
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.services.ai_chat_service import AIChatService, IntentClassifier, Intent, PIIAnonymizer

router = APIRouter(prefix="/ai", tags=["AI Chat"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatRequest(BaseModel):
    """Request model cho chat endpoint"""
    message: str = Field(..., min_length=1, max_length=1000)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Response model cho chat endpoint"""
    response: str
    intent: str
    confidence: float
    suggestions: List[Dict[str, Any]]
    slots: Dict[str, str] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class IntentTestRequest(BaseModel):
    """Request model cho test intent classification"""
    message: str = Field(..., min_length=1, max_length=500)


class IntentTestResponse(BaseModel):
    """Response model cho test intent"""
    message: str
    intent: str
    confidence: float
    slots: Dict[str, str]
    anonymized: str


# ============================================================================
# ERROR CLASSIFICATION MODELS
# ============================================================================

class ErrorClassifyRequest(BaseModel):
    """Request model cho phân loại lỗi"""
    description: str = Field(..., min_length=1, max_length=500, description="Mô tả lỗi từ khách hàng")
    serial: Optional[str] = Field(None, description="Số serial sản phẩm (tùy chọn)")


class ErrorClassification(BaseModel):
    """Kết quả phân loại lỗi"""
    error_code: str
    error_type: str
    description: str
    priority: str
    warranty_eligible: bool
    suggestions: List[str]
    warning_message: Optional[str] = None


class ErrorClassifyResponse(BaseModel):
    """Response model cho phân loại lỗi"""
    original_description: str
    classification: ErrorClassification
    required_info: List[str]
    next_steps: List[str]


# ============================================================================
# WARRANTY HISTORY MODELS
# ============================================================================

class WarrantyHistoryRequest(BaseModel):
    """Request model cho lịch sử bảo hành"""
    serial: Optional[str] = Field(None, description="Số serial sản phẩm")
    phone: Optional[str] = Field(None, description="Số điện thoại đã đăng ký")


class WarrantyHistoryItem(BaseModel):
    """Một lần bảo hành"""
    ticket_code: str
    date: str
    error_description: str
    resolution: str
    duration_days: int
    cost: str
    status: str


class WarrantyHistoryResponse(BaseModel):
    """Response model cho lịch sử bảo hành"""
    product_info: Dict[str, Any]
    total_claims: int
    success_rate: float
    recent_claim: Optional[WarrantyHistoryItem]
    history: List[WarrantyHistoryItem]


# ============================================================================
# NOTIFICATION MESSAGE MODELS
# ============================================================================

class NotifyRequest(BaseModel):
    """Request model cho sinh tin nhắn cập nhật"""
    notify_type: str = Field(..., description="Loại thông báo: received, diagnosis, approval, repairing, ready, delivered, delay")
    ticket_code: str = Field(..., description="Mã phiếu bảo hành")
    customer_name: Optional[str] = Field(None, description="Tên khách hàng")
    product_name: Optional[str] = Field(None, description="Tên sản phẩm")
    serial: Optional[str] = Field(None, description="Số serial")
    technician_name: Optional[str] = Field(None, description="Tên kỹ thuật viên")
    repair_details: Optional[str] = Field(None, description="Chi tiết sửa chữa")
    quote_items: Optional[List[Dict[str, Any]]] = Field(None, description="Danh sách báo giá")
    total_cost: Optional[float] = Field(None, description="Tổng chi phí")
    delay_reason: Optional[str] = Field(None, description="Lý do trì hoãn/hủy")


class NotifyResponse(BaseModel):
    """Response model cho sinh tin nhắn cập nhật"""
    notify_type: str
    message: str
    preview: Dict[str, Any]


# ============================================================================
# SERVICE INSTANCE
# ============================================================================

chat_service = AIChatService()


# ============================================================================
# HELPER FUNCTION
# ============================================================================

def success_envelope(data: Any) -> Dict[str, Any]:
    """Simple success envelope"""
    return {"success": True, "data": data}


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint chính - xử lý tin nhắn và trả về response
    """
    try:
        context = request.context or {}
        
        result = await chat_service.process_message(
            message=request.message,
            context=context
        )
        
        return success_envelope(result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/test-intent")
async def test_intent(request: IntentTestRequest):
    """
    Test intent classification - không cần authentication
    """
    anonymized = PIIAnonymizer.anonymize(request.message)
    intent_match = IntentClassifier.classify(request.message)
    
    return IntentTestResponse(
        message=request.message,
        intent=intent_match.intent.value,
        confidence=intent_match.confidence,
        slots=intent_match.slots,
        anonymized=anonymized
    )


@router.get("/suggestions/{intent}")
async def get_suggestions(intent: str):
    """
    Lấy suggestions cho một intent cụ thể
    """
    try:
        intent_enum = Intent(intent)
        suggestions = chat_service.get_suggestions(intent)
        
        return success_envelope({
            'intent': intent,
            'suggestions': suggestions
        })
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid intent: {intent}")


@router.get("/intents")
async def list_intents():
    """
    Danh sách tất cả intents được hỗ trợ
    """
    intents = []
    for intent in Intent:
        if intent == Intent.UNKNOWN:
            continue
        config = IntentClassifier.INTENTS.get(intent, {})
        intents.append({
            'name': intent.value,
            'keywords': config.get('keywords', [])[:5] if isinstance(config, dict) else [],
            'description': _get_intent_description(intent)
        })
    
    return success_envelope({
        'intents': intents,
        'total': len(intents)
    })


def _get_intent_description(intent: Intent) -> str:
    """Get description for intent"""
    descriptions = {
        Intent.GREETING: "Chào hỏi, lời chào",
        Intent.FAREWELL: "Kết thúc cuộc trò chuyện",
        Intent.THANKS: "Cảm ơn",
        Intent.WARRANTY_CHECK: "Kiểm tra bảo hành",
        Intent.SERIAL_LOOKUP: "Tra cứu serial sản phẩm",
        Intent.TICKET_STATUS: "Kiểm tra trạng thái phiếu BH",
        Intent.CREATE_TICKET: "Tạo yêu cầu bảo hành",
        Intent.PRODUCT_INFO: "Xem thông tin sản phẩm",
        Intent.PHONE_LOOKUP: "Tra cứu bằng SĐT",
        Intent.FAQ_GUIDE: "Hướng dẫn sử dụng dịch vụ",
        Intent.FAQ_PROCESS: "Quy trình bảo hành",
        Intent.FAQ_LOCATION: "Địa chỉ trung tâm BH",
        Intent.FAQ_COST: "Chi phí bảo hành",
        Intent.FAQ_WARRANTY_PERIOD: "Thời gian bảo hành",
        Intent.FAQ_NO_TICKET: "Không có mã phiếu",
        Intent.CONTACT: "Liên hệ hỗ trợ",
        Intent.FEEDBACK: "Gửi phản hồi",
        Intent.COMPLAINT: "Khiếu nại",
        Intent.FAQ: "Câu hỏi thường gặp",
        # Phân loại lỗi
        Intent.ERROR_SCREEN: "Phân loại lỗi màn hình",
        Intent.ERROR_OVERHEAT: "Phân loại lỗi quá nhiệt",
        Intent.ERROR_KEYBOARD: "Phân loại lỗi bàn phím",
        Intent.ERROR_AUDIO: "Phân loại lỗi loa/âm thanh",
        Intent.ERROR_WATER: "Phân loại lỗi vào nước",
        Intent.ERROR_STORAGE: "Phân loại lỗi ổ cứng",
        Intent.ERROR_BATTERY: "Phân loại lỗi pin/sạc",
        # Lịch sử BH
        Intent.WARRANTY_HISTORY: "Xem lịch sử bảo hành",
        # Sinh tin nhắn cập nhật
        Intent.NOTIFY_RECEIVED: "Sinh tin nhắn tiếp nhận",
        Intent.NOTIFY_DIAGNOSIS: "Sinh tin nhắn đang kiểm tra",
        Intent.NOTIFY_APPROVAL: "Sinh tin nhắn cần phê duyệt",
        Intent.NOTIFY_REPAIRING: "Sinh tin nhắn đang sửa chữa",
        Intent.NOTIFY_READY: "Sinh tin nhắn đã sẵn sàng",
        Intent.NOTIFY_DELIVERED: "Sinh tin nhắn đã giao hàng",
        Intent.NOTIFY_DELAY: "Sinh tin nhắn trì hoãn/hủy",
    }
    return descriptions.get(intent, "")


class AnonymizeRequest(BaseModel):
    """Request model cho anonymize endpoint"""
    message: str = Field(..., min_length=1, max_length=1000)


@router.post("/anonymize")
async def anonymize_text(request: AnonymizeRequest):
    """
    Test PII anonymization - ẩn email, phone, CCCD
    """
    original = request.message
    anonymized = PIIAnonymizer.anonymize(request.message)
    
    return success_envelope({
        'original': original,
        'anonymized': anonymized,
        'pii_types': ['email', 'phone', 'cccd']
    })


# ============================================================================
# NEW FEATURE ENDPOINTS
# ============================================================================

@router.post("/classify-error", response_model=NotifyResponse)
async def classify_error(request: ErrorClassifyRequest):
    """
    🔧 AI phân loại lỗi từ mô tả khách hàng
    
    Nhận diện loại lỗi và đưa ra gợi ý xử lý
    """
    classifier = IntentClassifier()
    intent_match = classifier.classify(request.description)
    
    # Bảng phân loại lỗi
    error_mapping = {
        'error_screen': {
            'error_code': 'screen_black',
            'error_type': 'Màn hình đen/Lỗi nguồn',
            'priority': 'HIGH',
            'warranty_eligible': True,
            'suggestions': ['Kiểm tra adapter nguồn', 'Thử cắm sạc khác', 'Kiểm tra đèn LED'],
            'warning': 'Nếu máy không lên gì: kiểm tra nguồn điện trước khi gửi BH'
        },
        'error_overheat': {
            'error_code': 'overheat',
            'error_type': 'Quá nhiệt/Tắt đột ngột',
            'priority': 'HIGH',
            'warranty_eligible': True,
            'suggestions': ['Không sử dụng máy trên bề mặt mềm', 'Vệ sinh quạt tản nhiệt', 'Kiểm tra keo tản nhiệt'],
            'warning': '⚠️ Không nên sử dụng tiếp để tránh hư mainboard'
        },
        'error_keyboard': {
            'error_code': 'keyboard',
            'error_type': 'Lỗi bàn phím',
            'priority': 'MEDIUM',
            'warranty_eligible': True,
            'suggestions': ['Thử bàn phím ảo (On-screen keyboard)', 'Kiểm tra phím cụ thể nào', 'Làm sạch bụi dưới phím'],
            'warning': None
        },
        'error_audio': {
            'error_code': 'audio',
            'error_type': 'Loa/Âm thanh',
            'priority': 'LOW',
            'warranty_eligible': True,
            'suggestions': ['Cắm tai nghe thử loa ngoài', 'Kiểm tra Volume mixer', 'Update audio driver'],
            'warning': None
        },
        'error_water': {
            'error_code': 'water',
            'error_type': 'Vào nước ⚠️ KHẨN CẤP',
            'priority': 'CRITICAL',
            'warranty_eligible': False,
            'suggestions': ['RÚT ĐIỆN và không sạc pin ngay', 'KHÔNG BẬT MÁY', 'Liên hệ hotline 1900-1234'],
            'warning': '⚠️ Vào nước KHÔNG được bảo hành miễn phí. Hỗ trợ sửa chữa tính phí.'
        },
        'error_storage': {
            'error_code': 'storage',
            'error_type': 'Ổ cứng/Lưu trữ',
            'priority': 'CRITICAL',
            'warranty_eligible': True,
            'suggestions': ['Sao lưu dữ liệu ngay', 'Không tắt máy đột ngột', 'Kiểm tra ổ có nhận không'],
            'warning': '⚠️ Nguy hiểm - có thể mất dữ liệu!'
        },
        'error_battery': {
            'error_code': 'battery',
            'error_type': 'Pin/Sạc',
            'priority': 'MEDIUM',
            'warranty_eligible': True,
            'suggestions': ['Kiểm tra Battery Health % (Settings > Battery)', 'Thử sạc khác nếu có', 'Xem % pin sau khi sạc đầy'],
            'warning': None
        }
    }
    
    error_info = error_mapping.get(intent_match.intent.value, {
        'error_code': 'unknown',
        'error_type': 'Không xác định được',
        'priority': 'LOW',
        'warranty_eligible': False,
        'suggestions': ['Liên hệ hotline 1900-1234 để được hỗ trợ'],
        'warning': None
    })
    
    classification = ErrorClassification(
        error_code=error_info['error_code'],
        error_type=error_info['error_type'],
        description=request.description,
        priority=error_info['priority'],
        warranty_eligible=error_info['warranty_eligible'],
        suggestions=error_info['suggestions'],
        warning_message=error_info.get('warning')
    )
    
    required_info = []
    if not request.serial:
        required_info.append('Số serial sản phẩm')
    required_info.extend(['Mô tả chi tiết lỗi', 'Thời điểm xảy ra lỗi'])
    
    next_steps = [
        'Cung cấp số serial để tạo yêu cầu BH',
        'Mô tả chi tiết tình trạng lỗi',
        'Liên hệ hotline nếu cần hỗ trợ ngay'
    ]
    
    return ErrorClassifyResponse(
        original_description=request.description,
        classification=classification,
        required_info=required_info,
        next_steps=next_steps
    )


@router.post("/warranty-history", response_model=NotifyResponse)
async def get_warranty_history(request: WarrantyHistoryRequest):
    """
    📜 AI tóm tắt lịch sử bảo hành sản phẩm
    
    Trả về tóm tắt các lần bảo hành, sửa chữa của sản phẩm
    """
    # TODO: Kết nối database để lấy dữ liệu thực tế
    # Hiện tại trả về response mẫu
    
    if not request.serial and not request.phone:
        raise HTTPException(
            status_code=400, 
            detail="Cần cung cấp serial hoặc số điện thoại để tra cứu"
        )
    
    # Mock data - sẽ thay bằng truy vấn database thực tế
    mock_product_info = {
        'serial': request.serial or 'TND-AC10-001',
        'product_name': 'TechNova Pro 15',
        'model': 'TN-PRO15-I7-512',
        'purchase_date': '15/08/2024',
        'warranty_end': '15/08/2027',
        'status': 'Đang hoạt động'
    }
    
    mock_history = [
        WarrantyHistoryItem(
            ticket_code='WR-2026-0012',
            date='15/03/2026',
            error_description='Bàn phím không hoạt động một số phím',
            resolution='Thay bàn phím mới',
            duration_days=3,
            cost='Miễn phí (BH)',
            status='Hoàn tất'
        ),
        WarrantyHistoryItem(
            ticket_code='WR-2026-0038',
            date='20/09/2026',
            error_description='Pin chai, sạc không nhận',
            resolution='Thay pin + sạc',
            duration_days=2,
            cost='Miễn phí (BH)',
            status='Hoàn tất'
        )
    ]
    
    return WarrantyHistoryResponse(
        product_info=mock_product_info,
        total_claims=len(mock_history),
        success_rate=100.0,
        recent_claim=mock_history[1] if mock_history else None,
        history=mock_history
    )


@router.post("/generate-notification", response_model=NotifyResponse)
async def generate_notification(request: NotifyRequest):
    """
    📱 AI sinh tin nhắn cập nhật tiến độ tự động
    
    Tạo tin nhắn thông báo cho khách hàng dựa trên trạng thái phiếu
    """
    # Templates cho từng loại thông báo
    templates = {
        'received': """📬 **Xác nhận tiếp nhận yêu cầu**

Mã phiếu: **{ticket_code}**
Sản phẩm: {product_name}
Ngày tiếp nhận: {date}

📋 **Các bước tiếp theo:**
1️⃣ Kỹ thuật viên sẽ kiểm tra trong 24h
2️⃣ Bạn sẽ nhận thông báo khi có kết quả
3️⃣ Thời gian sửa chữa dự kiến: 3-5 ngày

📞 Hotline: 1900-1234 nếu cần hỗ trợ""",

        'diagnosis': """🔍 **Cập nhật: Đang kiểm tra**

Mã phiếu: **{ticket_code}**
Trạng thái: Kỹ thuật viên đang kiểm tra

📝 **Tiến độ:**
- ✅ Đã tiếp nhận
- 🔄 Đang kiểm tra ← **Bạn đang ở đây**
- ⏳ Chờ phê duyệt
- 🔧 Sửa chữa
- ✅ Hoàn tất

💬 Kỹ thuật viên: {technician_name}
📞 Thắc mắc? Gọi 1900-1234""",

        'approval': """⚠️ **Cần bạn xác nhận**

Mã phiếu: **{ticket_code}**
Trạng thái: Chờ phê duyệt

📋 **Báo giá sửa chữa:**
{items}
- **Tổng cộng: {total_cost}**

⏰ **Hạn xác nhận:** {date}

Vui lòng trả lời:
- **ĐỒNG Ý** - Để tiến hành sửa
- **TỪ CHỐI** - Để hủy yêu cầu""",

        'repairing': """🔧 **Cập nhật: Đang sửa chữa**

Mã phiếu: **{ticket_code}**
Trạng thái: Kỹ thuật đang xử lý

📝 **Tiến độ:**
- ✅ Đã tiếp nhận
- ✅ Đã kiểm tra
- ✅ Đã phê duyệt
- 🔄 Đang sửa chữa ← **Bạn đang ở đây**
- ⏳ Hoàn tất

🛠️ Nội dung: {repair_details}
⏱️ Dự kiến xong: {date}""",

        'ready': """✅ **Sản phẩm đã sẵn sàng!**

Mã phiếu: **{ticket_code}**
Trạng thái: ✅ Hoàn tất

📋 **Thông tin sửa chữa:**
{repair_details}

🏪 **Nhận hàng:**
- Trung tâm BH: 123 Nguyễn Huệ, Q1
- Giờ mở cửa: 8:00 - 18:00 (T2-T6)

📞 Hotline: 1900-1234""",

        'delivered': """🚚 **Đã giao hàng thành công!**

Mã phiếu: **{ticket_code}**
Trạng thái: ✅ Đã giao

📦 **Sản phẩm:**
- {product_name} ({serial})
- {repair_details}
- Bảo hành sửa chữa: **3 tháng**

💳 **Thanh toán:**
- Tổng: {total_cost}
- Đã thanh toán: ✅

⭐ **Đánh giá dịch vụ:**
http://bit.ly/danh-gia-bh-{ticket_code_suffix}

Cảm ơn bạn đã tin tưởng BảoHành Pro!""",

        'delay': """⚠️ **Thông báo thay đổi**

Mã phiếu: **{ticket_code}*

❌ **Trạng thái:** {delay_reason}

📝 **Lý do:** {delay_detail}

💰 **Hoàn tiền:** Không phí (chưa phát sinh)

📞 Nếu cần hỗ trợ: 1900-1234

Cảm ơn bạn đã sử dụng dịch vụ!"""
    }
    
    template = templates.get(request.notify_type)
    if not template:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid notify_type. Must be one of: {', '.join(templates.keys())}"
        )
    
    # Format items for approval
    items_text = ""
    if request.quote_items:
        for item in request.quote_items:
            items_text += f"- {item.get('name', 'Item')}: {item.get('price', 0):,.0f}đ\n"
    
    # Build message
    message = template.format(
        ticket_code=request.ticket_code,
        product_name=request.product_name or 'TechNova Pro 15',
        serial=request.serial or 'TND-XXXX-XXX',
        technician_name=request.technician_name or '[Tên kỹ thuật viên]',
        repair_details=request.repair_details or '[Chi tiết sửa chữa]',
        items=items_text or '- [Chi tiết báo giá]',
        total_cost=f"{request.total_cost:,.0f}đ" if request.total_cost else '[Tổng chi phí]',
        date='[Ngày hiện tại]',
        delay_reason='Trì hoãn' if 'delay' in request.notify_type else 'Hủy yêu cầu',
        delay_detail=request.delay_reason or '[Lý do]',
        ticket_code_suffix=request.ticket_code.replace('WR-', '').replace('-', '')
    )
    
    return NotifyResponse(
        notify_type=request.notify_type,
        message=message,
        preview={
            'ticket_code': request.ticket_code,
            'customer_name': request.customer_name,
            'status': request.notify_type
        }
    )
