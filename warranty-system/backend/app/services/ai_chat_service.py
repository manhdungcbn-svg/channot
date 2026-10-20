"""
AI Chat Service - Gemini API Integration
Tích hợp Gemini AI cho chatbot hệ thống bảo hành
"""

import os
import re
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Gemini API Configuration (Google Cloud API Key)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"

# Intent Classification (giữ lại cho keyword-based fallback)
class Intent(Enum):
    # Giao tiếp cơ bản
    GREETING = "greeting"
    FAREWELL = "farewell"
    THANKS = "thanks"
    
    # Tra cứu
    WARRANTY_CHECK = "warranty_check"
    SERIAL_LOOKUP = "serial_lookup"
    TICKET_STATUS = "ticket_status"
    PRODUCT_INFO = "product_info"
    PHONE_LOOKUP = "phone_lookup"
    
    # Thao tác
    CREATE_TICKET = "create_ticket"
    
    # FAQ / Hướng dẫn
    FAQ_GUIDE = "faq_guide"
    FAQ_PROCESS = "faq_process"
    FAQ_LOCATION = "faq_location"
    FAQ_COST = "faq_cost"
    FAQ_WARRANTY_PERIOD = "faq_warranty_period"
    FAQ_NO_TICKET = "faq_no_ticket"
    
    # Liên hệ & Phản hồi
    CONTACT = "contact"
    FEEDBACK = "feedback"
    COMPLAINT = "complaint"
    
    # FAQ chung
    FAQ = "faq"
    
    # Phân loại lỗi tự động
    ERROR_SCREEN = "error_screen"
    ERROR_OVERHEAT = "error_overheat"
    ERROR_KEYBOARD = "error_keyboard"
    ERROR_AUDIO = "error_audio"
    ERROR_WATER = "error_water"
    ERROR_STORAGE = "error_storage"
    ERROR_BATTERY = "error_battery"
    
    # Lịch sử bảo hành
    WARRANTY_HISTORY = "warranty_history"
    
    # Sinh tin nhắn cập nhật
    NOTIFY_RECEIVED = "notify_received"
    NOTIFY_DIAGNOSIS = "notify_diagnosis"
    NOTIFY_APPROVAL = "notify_approval"
    NOTIFY_REPAIRING = "notify_repairing"
    NOTIFY_READY = "notify_ready"
    NOTIFY_DELIVERED = "notify_delivered"
    NOTIFY_DELAY = "notify_delay"
    
    UNKNOWN = "unknown"


@dataclass
class IntentMatch:
    intent: Intent
    confidence: float
    slots: Dict[str, str]


class PIIAnonymizer:
    """Anonymizer cho PII data"""
    
    PATTERNS = {
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'phone': r'\b(0\d{9,10}|\+84\d{9,10})\b',
    }
    
    @classmethod
    def anonymize(cls, text: str) -> str:
        result = text
        result = re.sub(cls.PATTERNS['email'], '[REDACTED_EMAIL]', result)
        result = re.sub(cls.PATTERNS['phone'], '[REDACTED_PHONE]', result)
        return result


class IntentClassifier:
    """Intent classifier dựa trên keyword matching"""
    
    INTENTS = {
        Intent.GREETING: {
            'keywords': ['xin chào', 'chào', 'hello', 'hi', 'hey', 'alo', 'chào buổi', 'chào bạn', 'hey bạn'],
            'slots': []
        },
        Intent.FAREWELL: {
            'keywords': ['tạm biệt', 'bye', 'goodbye', 'hẹn gặp lại', 'kết thúc', 'thôi'],
            'slots': []
        },
        Intent.THANKS: {
            'keywords': ['cảm ơn', 'cam on', 'thank', 'thanks', 'cám ơn', 'thank you'],
            'slots': []
        },
        Intent.WARRANTY_CHECK: {
            'keywords': ['bảo hành', 'bh', 'check bh', 'kiểm tra bh', 'hết hạn', 'còn bảo hành', 'warranty', 'thời hạn bh'],
            'slots': []
        },
        Intent.SERIAL_LOOKUP: {
            'keywords': ['tra cứu', 'serial', 'số serial', 'tra cuu', 'check serial', 'tìm serial'],
            'slots': []
        },
        Intent.TICKET_STATUS: {
            'keywords': ['phiếu', 'ticket', 'trạng thái', 'status', 'tiến độ', 'xử lý thế nào', 'xong chưa', 'mã phiếu'],
            'slots': []
        },
        Intent.CREATE_TICKET: {
            'keywords': ['tạo', 'tao', 'yêu cầu', 'tạo phiếu', 'gửi bh', 'sửa chữa', 'bảo hành', 'lỗi'],
            'slots': []
        },
        Intent.PRODUCT_INFO: {
            'keywords': ['sản phẩm', 'san pham', 'product', 'model', 'cấu hình', 'thông số', 'máy'],
            'slots': []
        },
        Intent.PHONE_LOOKUP: {
            'keywords': ['sđt', 'sdt', 'điện thoại', 'phone', 'dien thoai', 'số điện thoại'],
            'slots': []
        },
        # FAQ intents
        Intent.FAQ_GUIDE: {
            'keywords': ['hướng dẫn', 'cách làm', 'các bước', 'guide', 'how to', 'làm sao', 'bắt đầu'],
            'slots': []
        },
        Intent.FAQ_PROCESS: {
            'keywords': ['quy trình', 'process', 'thủ tục', 'các bước', 'luồng'],
            'slots': []
        },
        Intent.FAQ_LOCATION: {
            'keywords': ['ở đâu', 'địa chỉ', 'trung tâm', 'nơi nào', 'location', 'address', 'chi nhánh'],
            'slots': []
        },
        Intent.FAQ_COST: {
            'keywords': ['chi phí', 'phí', 'giá', 'bao nhiêu tiền', 'cost', 'fee', 'price', 'miễn phí'],
            'slots': []
        },
        Intent.FAQ_WARRANTY_PERIOD: {
            'keywords': ['thời gian bh', 'bao lâu', 'mấy tháng', 'bao nhiêu tháng', 'duration'],
            'slots': []
        },
        Intent.FAQ_NO_TICKET: {
            'keywords': ['không có mã', 'quên mã', 'mất mã', 'không tìm thấy phiếu'],
            'slots': []
        },
        # Liên hệ
        Intent.CONTACT: {
            'keywords': ['liên hệ', 'hotline', 'gọi', 'contact', 'phone', 'tư vấn'],
            'slots': []
        },
        Intent.FEEDBACK: {
            'keywords': ['phản hồi', 'feedback', 'đóng góp', 'ý kiến', 'đánh giá'],
            'slots': []
        },
        Intent.COMPLAINT: {
            'keywords': ['khiếu nại', 'complaint', 'không hài lòng', 'phàn nàn', 'báo cáo'],
            'slots': []
        },
        Intent.FAQ: {
            'keywords': ['câu hỏi', 'faq', 'hỏi', 'help', 'thắc mắc', 'giải đáp'],
            'slots': []
        },
        
        # Phân loại lỗi tự động
        Intent.ERROR_SCREEN: {
            'keywords': ['đen màn hình', 'màn hình đen', 'không lên', 'màn hình chết', 'black screen', 'lên nguồn', 'đen', 'chết'],
            'slots': []
        },
        Intent.ERROR_OVERHEAT: {
            'keywords': ['nóng', 'kêu to', 'quạt', 'tắt đột ngột', 'overheat', 'nhiệt', 'nóng ran', 're rang', 'rèo rang'],
            'slots': []
        },
        Intent.ERROR_KEYBOARD: {
            'keywords': ['bàn phím', 'phím', 'ban phim', 'keyboard', 'gõ không được', 'phím không', 'key not working'],
            'slots': []
        },
        Intent.ERROR_AUDIO: {
            'keywords': ['loa', 'âm thanh', 'tiếng rè', 'micro', 'audio', 'speaker', 'không nghe'],
            'slots': []
        },
        Intent.ERROR_WATER: {
            'keywords': ['nước', 'dính nước', 'đổ nước', 'water', 'vào nước', 'ngập'],
            'slots': []
        },
        Intent.ERROR_STORAGE: {
            'keywords': ['ổ cứng', 'o cung', 'hard disk', 'ssd', 'nhận', 'bad sector', 'không nhận'],
            'slots': []
        },
        Intent.ERROR_BATTERY: {
            'keywords': ['pin', 'sạc', 'battery', 'charger', 'chai', 'nhanh hết', 'sạc không'],
            'slots': []
        },
        
        # Lịch sử bảo hành
        Intent.WARRANTY_HISTORY: {
            'keywords': ['lịch sử', 'lich su', 'history', 'đã sửa', 'da sua', 'sửa chữa', 'bao nhiêu lần', 'các lần'],
            'slots': []
        },
        
        # Sinh tin nhắn cập nhật tiến độ
        Intent.NOTIFY_RECEIVED: {
            'keywords': ['tiếp nhận', 'tiep nhan', 'nhận phiếu', 'đã nhận'],
            'slots': []
        },
        Intent.NOTIFY_DIAGNOSIS: {
            'keywords': ['kiểm tra', 'kiem tra', 'diagnosis', 'đang xem', 'đang kiểm tra'],
            'slots': []
        },
        Intent.NOTIFY_APPROVAL: {
            'keywords': ['phê duyệt', 'phe duyet', 'approval', 'báo giá', 'xác nhận giá'],
            'slots': []
        },
        Intent.NOTIFY_REPAIRING: {
            'keywords': ['sửa chữa', 'sua chua', 'repairing', 'đang sửa', 'đang fix'],
            'slots': []
        },
        Intent.NOTIFY_READY: {
            'keywords': ['sẵn sàng', 'san sang', 'ready', 'xong', 'hoàn tất', 'đã xong'],
            'slots': []
        },
        Intent.NOTIFY_DELIVERED: {
            'keywords': ['giao hàng', 'giao', 'delivered', 'đã giao', 'nhận máy'],
            'slots': []
        },
        Intent.NOTIFY_DELAY: {
            'keywords': ['trì hoãn', 'tri hoan', 'delay', 'hủy', 'huy', 'cancel'],
            'slots': []
        },
    }
    
    SERIAL_PATTERN = r'\b[A-Z]{2,5}[-_]?[A-Z0-9]{3,15}\b'
    TICKET_CODE_PATTERN = r'\bWR-\d{4}-\d{4,}\b'
    PHONE_PATTERN = r'\b(0\d{9,10}|\+84\d{9,10})\b'
    
    @classmethod
    def extract_slots(cls, text: str) -> Dict[str, str]:
        slots = {}
        
        # Extract serial
        serial_match = re.search(cls.SERIAL_PATTERN, text.upper())
        if serial_match:
            slots['serial'] = serial_match.group().upper()
        
        # Extract ticket code
        ticket_match = re.search(cls.TICKET_CODE_PATTERN, text.upper())
        if ticket_match:
            slots['ticket_code'] = ticket_match.group()
        
        # Extract phone number
        phone_match = re.search(cls.PHONE_PATTERN, text)
        if phone_match:
            slots['phone'] = phone_match.group()
        
        return slots
    
    @classmethod
    def classify(cls, text: str) -> IntentMatch:
        text_lower = text.lower()
        best_match = Intent.UNKNOWN
        best_score = 0
        matched_keywords = []
        
        for intent, config in cls.INTENTS.items():
            keywords = config['keywords']
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                for kw in keywords:
                    if kw in text_lower:
                        matched_keywords.append(kw)
            if score > best_score:
                best_score = score
                best_match = intent
        
        # Tăng confidence nếu có nhiều keywords khớp
        confidence = min(best_score / 2.0, 1.0)
        
        # Nếu có slots được extract, tăng confidence
        slots = cls.extract_slots(text)
        if slots:
            confidence = max(confidence, 0.6)
        
        return IntentMatch(
            intent=best_match,
            confidence=confidence,
            slots=slots
        )


class GeminiService:
    """Service để gọi Gemini API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = GEMINI_API_URL
    
    async def generate_response(self, user_message: str, context: Optional[Dict] = None) -> Dict:
        """Gọi Gemini API để tạo response"""
        import httpx

        # Build prompt cho Gemini
        prompt = self._build_prompt(user_message, context)

        url = f"{self.base_url}?key={self.api_key}"

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
                "topP": 0.9,
                "topK": 40
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

                    return {
                        "success": True,
                        "response": text,
                        "model": "gemini-3.5-flash-lite"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API Error: {response.status_code}",
                        "response": self._get_fallback_response(user_message)
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": self._get_fallback_response(user_message)
            }
    
    def _build_prompt(self, user_message: str, context: Optional[Dict] = None) -> str:
        """Build prompt cho Gemini với context về hệ thống bảo hành"""
        
        system_prompt = """Bạn là trợ lý AI của hệ thống BảoHành Pro - một hệ thống quản lý bảo hành sản phẩm.

NHIỆM VỤ:
- Trả lời câu hỏi về bảo hành sản phẩm
- Hướng dẫn tra cứu serial, kiểm tra bảo hành
- Hỗ trợ tạo phiếu bảo hành
- Trả lời FAQ về dịch vụ

PHONG CÁCH:
- Thân thiện, chuyên nghiệp
- Dùng tiếng Việt có dấu
- Có emoji phù hợp
- Ngắn gọn, dễ hiểu

NẾU CẦN THÔNG TIN:
- Hỏi serial sản phẩm để tra cứu
- Hỏi mã phiếu để kiểm tra trạng thái
- Hướng dẫn cụ thể, có ví dụ

Trả lời câu hỏi của khách hàng:"""
        
        # Thêm context nếu có
        if context:
            if context.get('product'):
                system_prompt += f"\n\nThông tin sản phẩm đã tra cứu: {json.dumps(context['product'], ensure_ascii=False)}"
            if context.get('warranty_status'):
                system_prompt += f"\n\nTình trạng bảo hành: {context['warranty_status']}"
        
        system_prompt += f"\n\nKhách hàng hỏi: {user_message}"
        
        return system_prompt
    
    def _get_fallback_response(self, message: str) -> str:
        """Fallback response khi API lỗi"""
        classifier = IntentClassifier()
        intent = classifier.classify(message)
        
        fallbacks = {
            Intent.GREETING: "Xin chào! 👋 Tôi là trợ lý AI của BảoHành Pro. Tôi có thể giúp bạn tra cứu bảo hành, tạo phiếu BH, và trả lời các câu hỏi thường gặp. Bạn cần hỗ trợ gì?",
            Intent.WARRANTY_CHECK: "🔍 Để kiểm tra bảo hành, bạn vui lòng cung cấp **số serial** sản phẩm (thường in trên nhãn sản phẩm hoặc hộp đựng).",
            Intent.SERIAL_LOOKUP: "🔍 Vui lòng nhập **số serial** để tra cứu thông tin sản phẩm. Serial thường có format như: TND-AC10-001, DELL-XPS-15-005...",
            Intent.CREATE_TICKET: "📝 Tôi sẽ hỗ trợ bạn tạo yêu cầu bảo hành. Bạn cần cung cấp: 1) Serial sản phẩm, 2) Mô tả lỗi/sự cố.",
        }
        
        return fallbacks.get(intent.intent, "Xin lỗi, tôi đang gặp sự cố kết nối. Bạn có thể diễn đạt lại câu hỏi hoặc liên hệ hotline 1900-xxxx để được hỗ trợ trực tiếp. 🙏")


class AIChatService:
    """Main service class cho AI Chat"""
    
    def __init__(self):
        self.gemini_service = GeminiService(GEMINI_API_KEY) if GEMINI_API_KEY else None
        self.classifier = IntentClassifier()
    
    async def process_message(self, message: str, context: Optional[Dict] = None) -> Dict:
        """Process user message"""
        
        # Anonymize PII (đơn giản)
        import re
        anonymized = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', message)
        anonymized = re.sub(r'\b(0\d{9,10}|\+84\d{9,10})\b', '[PHONE]', anonymized)
        
        # Classify intent
        intent_match = self.classifier.classify(message)
        
        # Gọi Gemini nếu có API key
        if self.gemini_service and GEMINI_API_KEY:
            result = await self.gemini_service.generate_response(message, context)
            
            return {
                "success": True,
                "response": result.get("response", ""),
                "intent": intent_match.intent.value,
                "confidence": intent_match.confidence,
                "slots": intent_match.slots,
                "model": result.get("model", "fallback"),
                "suggestions": self._get_suggestions(intent_match.intent)
            }
        else:
            # Fallback - không có Gemini
            return {
                "success": True,
                "response": self._get_intent_response(intent_match),
                "intent": intent_match.intent.value,
                "confidence": intent_match.confidence,
                "slots": intent_match.slots,
                "model": "keyword-based",
                "suggestions": self._get_suggestions(intent_match.intent)
            }
    
    def _get_intent_response(self, intent_match: IntentMatch) -> str:
        """Get response dựa trên intent (fallback)"""
        responses = {
            Intent.GREETING: "Xin chào! 👋 Tôi là trợ lý AI của BảoHành Pro.\n\nTôi có thể giúp bạn:\n• Tra cứu thông tin sản phẩm\n• Kiểm tra điều kiện bảo hành\n• Tạo yêu cầu bảo hành\n• Trả lời câu hỏi thường gặp\n\nBạn cần hỗ trợ gì?",
            
            Intent.FAREWELL: "Tạm biệt! 👋 Cảm ơn đã sử dụng BảoHành Pro. Hẹn gặp lại!",
            
            Intent.THANKS: "Cảm ơn bạn! 😊 Rất vui được hỗ trợ. Nếu cần gì thêm, cứ hỏi nhé!",
            
            Intent.WARRANTY_CHECK: "🔍 Để kiểm tra bảo hành, vui lòng nhập **số serial** sản phẩm (thường in trên nhãn phía dưới máy hoặc hộp đựng).",
            
            Intent.SERIAL_LOOKUP: "🔍 Vui lòng nhập **số serial** để tra cứu thông tin sản phẩm. Serial thường có format: `TND-AC10-001`, `DELL-XPS-15-005`...",
            
            Intent.TICKET_STATUS: "📋 Để kiểm tra trạng thái phiếu, vui lòng nhập **mã phiếu** (format: WR-2026-XXXX) hoặc **số serial** sản phẩm.",
            
            Intent.CREATE_TICKET: "📝 Để tạo yêu cầu bảo hành, bạn cần cung cấp:\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Mô tả lỗi** gặp phải\n\nBạn có serial để tôi kiểm tra không?",
            
            Intent.PRODUCT_INFO: "📦 Để xem thông tin sản phẩm, vui lòng nhập **số serial**.",
            
            Intent.PHONE_LOOKUP: "🔍 Để tra cứu sản phẩm, vui lòng cung cấp **số điện thoại** đã đăng ký mua hàng.",
            
            # FAQ Responses
            Intent.FAQ_GUIDE: "📋 **5 bước gửi bảo hành:**\n\n1️⃣ **Kiểm tra BH:** Đảm bảo sản phẩm còn trong thời hạn bảo hành\n\n2️⃣ **Liên hệ:** Gọi hotline 1900-1234 hoặc gửi tin nhắn qua chatbot\n\n3️⃣ **Chuẩn bị:** Giữ lại hóa đơn, phụ kiện đi kèm\n\n4️⃣ **Gửi máy:** Mang đến trung tâm BH gần nhất\n\n5️⃣ **Theo dõi:** Nhận mã phiếu và kiểm tra tiến độ online\n\n❓ Bạn cần hỗ trợ bước nào?",
            
            Intent.FAQ_PROCESS: "🔄 **Quy trình bảo hành chuẩn:**\n\n1️⃣ **Tiếp nhận** → Nhận phiếu và kiểm tra sản phẩm\n2️⃣ **Kiểm tra** → Xác định lỗi và điều kiện BH (1-2 ngày)\n3️⃣ **Sửa chữa** → Thay thế/fix lỗi (2-5 ngày tùy lỗi)\n4️⃣ **Kiểm tra lại** → Test sản phẩm sau sửa chữa\n5️⃣ **Trả khách** → Thông báo và giao sản phẩm\n\n⏱️ **Tổng thời gian:** 3-7 ngày làm việc",
            
            Intent.FAQ_LOCATION: "📍 **Địa chỉ trung tâm BH:**\n\n🏢 **TP.HCM:**\n- 123 Nguyễn Huệ, Quận 1\n- 456 Lê Văn Sỹ, Quận 3\n\n🏢 **Hà Nội:**\n- 78 Trần Hưng Đạo, Hoàn Kiếm\n- 99 Cầu Giấy, Cầu Giấy\n\n🏢 **Đà Nẵng:**\n- 56 Nguyễn Văn Linh\n\n⏰ Giờ làm việc: 8:00 - 18:00 (Thứ 2 - Thứ 6)\n📞 Hotline: 1900-1234",
            
            Intent.FAQ_COST: "💰 **Chính sách chi phí:**\n\n✅ **Miễn phí:**\n- Sửa chữa trong thời hạn BH\n- Thay thế linh kiện bị lỗi từ nhà sản xuất\n\n❌ **Tính phí:**\n- Hết thời hạn bảo hành\n- Lỗi do người dùng (va đập, vào nước)\n\n📋 Báo giá trước khi sửa chữa có phí",
            
            Intent.FAQ_WARRANTY_PERIOD: "📅 **Chính sách bảo hành:**\n\n🖥️ **Máy tính laptop:** 24 tháng (2 năm)\n📱 **Tablet/Điện thoại:** 12 tháng (1 năm)\n🎧 **Phụ kiện:** 6-12 tháng tùy loại\n\n💡 **Lưu ý:**\n- Bảo hành theo **ngày mua** trên hóa đơn\n- Không áp dụng với lỗi do **va đập, vào nước**\n- Cần giữ **hóa đơn** để được bảo hành",
            
            Intent.FAQ_NO_TICKET: "🔍 Không sao! Bạn có thể tìm phiếu bằng:\n\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Số điện thoại** đã đăng ký\n3️⃣ **Email** nhận xác nhận\n\nBạn cung cấp thông tin nào có thể tra được?",
            
            Intent.CONTACT: "📞 **Kênh liên hệ:**\n\n☎️ **Hotline:** 1900-1234 (8:00-20:00)\n💬 **Zalo:** BaoHanhPro\n📧 **Email:** support@baohanhpro.vn\n\n👋 Tôi có thể hỗ trợ bạn ngay, bạn cần giúp gì?",
            
            Intent.FEEDBACK: "📝 **Gửi phản hồi:**\n\nCảm ơn bạn đã phản hồi! Bạn có thể:\n\n📧 Email: feedback@baohanhpro.vn\n📱 Zalo: BaoHanhPro\n📞 Hotline: 1900-1234\n\n⭐ Đánh giá dịch vụ của chúng tôi:\nhttp://bit.ly/danh-gia-bao-hanh-pro",
            
            Intent.COMPLAINT: "😔 Rất tiếc về trải nghiệm không tốt của bạn.\n\nĐể xử lý khiếu nại, vui lòng:\n\n1️⃣ Cung cấp **mã phiếu** BH liên quan\n2️⃣ Mô tả **vấn đề** gặp phải\n3️⃣ Liên hệ hotline **1900-1234** (nhánh 2)\n\n📧 Email khiếu nại: complaints@baohanhpro.vn\n\n⏰ Phản hồi trong 24h làm việc",
            
            Intent.FAQ: "❓ Tôi có thể hỗ trợ bạn về:\n\n• 🔍 Tra cứu bảo hành\n• 📋 Tạo yêu cầu BH\n• 📖 Hướng dẫn sử dụng\n• 💰 Chi phí bảo hành\n• 📍 Địa chỉ trung tâm\n\nBạn muốn hỏi về gì?",
            
            # ========== PHÂN LOẠI LỖI TỰ ĐỘNG ==========
            Intent.ERROR_SCREEN: "🔍 **Phân loại lỗi: Màn hình/Lỗi nguồn**\n\nTôi nhận diện được mô tả của bạn:\n- **Nghi ngờ:** Lỗi mainboard hoặc màn hình\n\n📋 **Để tạo yêu cầu BH, bạn cần:**\n1️⃣ Cung cấp **số serial** sản phẩm\n2️⃣ Mô tả chi tiết hơn (có tiếng kêu bíp không? đèn LED có sáng không?)\n\n💡 **Nếu máy không lên gì:** Thử kiểm tra nguồn điện, adapter trước khi gửi BH.",
            
            Intent.ERROR_OVERHEAT: "🔍 **Phân loại lỗi: Quá nhiệt/Tắt đột ngột**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Quạt tản nhiệt hỏng, keo tản nhiệt khô\n- **Mức độ nghiêm trọng:** ⚠️ Cao - có thể ảnh hưởng linh kiện\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Tần suất:** Tắt sau bao lâu sử dụng?\n3️⃣ **Nhiệt độ:** Có nóng bất thường không?\n\n⚠️ **Khuyến cáo:** Không nên sử dụng tiếp để tránh hư mainboard.",
            
            Intent.ERROR_KEYBOARD: "🔍 **Phân loại lỗi: Bàn phím**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Lỗi phần cứng bàn phím\n- **Vị trí:** Một số phím cụ thể hay toàn bộ?\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Chi tiết:** Phím nào không hoạt động?\n\n💡 **Mẹo:** Thử dùng bàn phím ảo (On-screen keyboard) xem có phải lỗi phần mềm không trước.",
            
            Intent.ERROR_AUDIO: "🔍 **Phân loại lỗi: Loa/Âm thanh**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Loa bị hỏng hoặc driver lỗi\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Chi tiết:** Cả 2 loa hay 1 loa?\n\n💡 **Thử:** Cắm tai nghe xem có bình thường không.",
            
            Intent.ERROR_WATER: "🔍 **Phân loại lỗi: Vào nước ⚠️ KHẨN CẤP**\n\n**Lưu ý quan trọng:**\n- Vào nước **KHÔNG** được bảo hành miễn phí\n- Tuy nhiên, chúng tôi vẫn hỗ trợ kiểm tra và sửa chữa tính phí\n\n📋 **Ngay lập tức:**\n1️⃣ **RÚT ĐIỆN** và không sạc pin\n2️⃣ **KHÔNG BẬT MÁY** dù có hay không\n3️⃣ Liên hệ hotline **1900-1234** để được hướng dẫn\n\n💰 **Chi phí ước tính:** 500.000 - 2.000.000đ tùy mức độ hư hại",
            
            Intent.ERROR_STORAGE: "🔍 **Phân loại lỗi: Ổ cứng/Lưu trữ**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Ổ cứng bị hỏng cơ hoặc bad sector\n- **Mức độ nguy hiểm:** ⚠️ Nguy hiểm - có thể mất dữ liệu!\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Thông tin thêm:** Laptop có bao nhiêu ổ cứng?\n\n⚠️ **Khuyến cáo:** \n- **Sao lưu dữ liệu ngay** nếu ổ còn nhận\n- Không tắt máy đột ngột",
            
            Intent.ERROR_BATTERY: "🔍 **Phân loại lỗi: Pin/Sạc**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Pin chai, sạc không nhận\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Thông tin:** Pin sạc đầy dùng được bao lâu?\n\n💡 **Thử kiểm tra nhanh:**\n- Vào Settings > Battery xem health %\n- Thử cắm sạc khác (nếu có)",
            
            # ========== LỊCH SỬ BẢO HÀNH ==========
            Intent.WARRANTY_HISTORY: "📜 **Lịch sử bảo hành sản phẩm**\n\nĐể xem lịch sử bảo hành, bạn cần cung cấp **số serial** sản phẩm.\n\n📋 Tôi sẽ hiển thị:\n- Các lần bảo hành trước đây\n- Lỗi đã sửa chữa\n- Linh kiện đã thay thế\n- Chi phí (nếu có)\n\n🔍 Bạn có serial để tra cứu không?",
            
            # ========== SINH TIN NHẮN CẬP NHẬT TIẾN ĐỘ ==========
            Intent.NOTIFY_RECEIVED: "📬 **Xác nhận tiếp nhận yêu cầu**\n\nMã phiếu: **WR-2026-0045**\nSản phẩm: TechNova Pro 15\nNgày tiếp nhận: [DATE]\n\n📋 **Các bước tiếp theo:**\n1️⃣ Kỹ thuật viên sẽ kiểm tra trong 24h\n2️⃣ Bạn sẽ nhận thông báo khi có kết quả\n3️⃣ Thời gian sửa chữa dự kiến: 3-5 ngày\n\n📞 Hotline: 1900-1234 nếu cần hỗ trợ",
            
            Intent.NOTIFY_DIAGNOSIS: "🔍 **Cập nhật: Đang kiểm tra**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: Kỹ thuật viên đang kiểm tra\n\n📝 **Tiến độ:**\n- ✅ Đã tiếp nhận\n- 🔄 Đang kiểm tra ← **Bạn đang ở đây**\n- ⏳ Chờ phê duyệt\n- 🔧 Sửa chữa\n- ✅ Hoàn tất\n\n💬 Kỹ thuật viên: [NAME]\n📞 Thắc mắc? Gọi 1900-1234",
            
            Intent.NOTIFY_APPROVAL: "⚠️ **Cần bạn xác nhận**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: Chờ phê duyệt\n\n📋 **Báo giá sửa chữa:**\n- [ITEM]: [PRICE]\n- Phí kiểm tra: 200.000đ\n- **Tổng cộng: [TOTAL]**\n\n⏰ **Hạn xác nhận:** [DATE]\n\nVui lòng trả lời:\n- **ĐỒNG Ý** - Để tiến hành sửa\n- **TỪ CHỐI** - Để hủy yêu cầu",
            
            Intent.NOTIFY_REPAIRING: "🔧 **Cập nhật: Đang sửa chữa**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: Kỹ thuật đang xử lý\n\n📝 **Tiến độ:**\n- ✅ Đã tiếp nhận\n- ✅ Đã kiểm tra\n- ✅ Đã phê duyệt\n- 🔄 Đang sửa chữa ← **Bạn đang ở đây**\n- ⏳ Hoàn tất\n\n🛠️ Nội dung: [REPAIR_DETAILS]\n⏱️ Dự kiến xong: [DATE]",
            
            Intent.NOTIFY_READY: "✅ **Sản phẩm đã sẵn sàng!**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: ✅ Hoàn tất\n\n📋 **Thông tin sửa chữa:**\n- [REPAIR_SUMMARY]\n\n🏪 **Nhận hàng:**\n- Trung tâm BH: 123 Nguyễn Huệ, Q1\n- Giờ mở cửa: 8:00 - 18:00 (T2-T6)\n\n📞 Hotline: 1900-1234",
            
            Intent.NOTIFY_DELIVERED: "🚚 **Đã giao hàng thành công!**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: ✅ Đã giao\n\n📦 **Sản phẩm:**\n- [PRODUCT_NAME] ([SERIAL])\n- [REPAIR_SUMMARY]\n- Bảo hành sửa chữa: **3 tháng**\n\n💳 **Thanh toán:**\n- Tổng: [TOTAL]\n- Đã thanh toán: ✅\n\n⭐ **Đánh giá dịch vụ:**\nhttp://bit.ly/danh-gia-bh-0045\n\nCảm ơn bạn đã tin tưởng BảoHành Pro!",
            
            Intent.NOTIFY_DELAY: "⚠️ **Thông báo thay đổi**\n\nMã phiếu: **WR-2026-0045**\n\n❌ **Trạng thái:** [CANCELLED/DELAYED]\n\n📝 **Lý do:** [REASON]\n\n💰 **Hoàn tiền:** [REFUND_STATUS]\n\n📞 Nếu cần hỗ trợ: 1900-1234\n\nCảm ơn bạn đã sử dụng dịch vụ!",
        }
        return responses.get(intent_match.intent, "Xin lỗi, tôi chưa hiểu ý bạn. Bạn có thể hỏi về: tra cứu bảo hành, tạo phiếu BH, hoặc FAQ. 🤔")
    
    def _get_suggestions(self, intent: Intent) -> List[Dict]:
        """Get suggestions cho intent"""
        suggestions_map = {
            Intent.GREETING: [
                {"id": 1, "text": "Tra cứu serial", "icon": "🔍", "action": "lookup_serial"},
                {"id": 2, "text": "Tạo yêu cầu BH", "icon": "📋", "action": "create_ticket"},
                {"id": 3, "text": "Câu hỏi thường gặp", "icon": "❓", "action": "faq"}
            ],
            Intent.WARRANTY_CHECK: [
                {"id": 1, "text": "Nhập serial", "icon": "🔍", "action": "enter_serial"},
                {"id": 2, "text": "Hướng dẫn tìm serial", "icon": "📖", "action": "help"}
            ],
            Intent.SERIAL_LOOKUP: [
                {"id": 1, "text": "Nhập serial", "icon": "🔢", "action": "enter_serial"},
                {"id": 2, "text": "Tra bằng SĐT", "icon": "📱", "action": "lookup_phone"}
            ],
            Intent.TICKET_STATUS: [
                {"id": 1, "text": "Nhập mã phiếu", "icon": "📋", "action": "enter_ticket"},
                {"id": 2, "text": "Tra bằng serial", "icon": "🔢", "action": "lookup_ticket_serial"}
            ],
            Intent.CREATE_TICKET: [
                {"id": 1, "text": "Nhập serial", "icon": "🔢", "action": "enter_serial"},
                {"id": 2, "text": "Mô tả lỗi", "icon": "🔧", "action": "describe_issue"}
            ],
            Intent.PHONE_LOOKUP: [
                {"id": 1, "text": "Nhập SĐT", "icon": "📱", "action": "enter_phone"}
            ],
            Intent.FAQ_GUIDE: [
                {"id": 1, "text": "Cách gửi BH", "icon": "📦", "action": "guide_sending"},
                {"id": 2, "text": "Liên hệ hotline", "icon": "☎️", "action": "contact"}
            ],
            Intent.FAQ_PROCESS: [
                {"id": 1, "text": "Thời gian xử lý", "icon": "⏱️", "action": "process_time"},
                {"id": 2, "text": "Theo dõi tiến độ", "icon": "📊", "action": "track_progress"}
            ],
            Intent.FAQ_LOCATION: [
                {"id": 1, "text": "TP.HCM", "icon": "🏢", "action": "location_hcm"},
                {"id": 2, "text": "Hà Nội", "icon": "🏢", "action": "location_hn"}
            ],
            Intent.FAQ_COST: [
                {"id": 1, "text": "Miễn phí BH", "icon": "✅", "action": "free_warranty"},
                {"id": 2, "text": "Phí sửa chữa", "icon": "💰", "action": "repair_fee"}
            ],
            Intent.CONTACT: [
                {"id": 1, "text": "Hotline 1900-1234", "icon": "☎️", "action": "call_hotline"},
                {"id": 2, "text": "Zalo", "icon": "💬", "action": "zalo"}
            ],
            Intent.UNKNOWN: [
                {"id": 1, "text": "Tra cứu serial", "icon": "🔍", "action": "lookup_serial"},
                {"id": 2, "text": "Tạo yêu cầu BH", "icon": "📋", "action": "create_ticket"},
                {"id": 3, "text": "FAQ", "icon": "❓", "action": "faq"}
            ]
        }
        return suggestions_map.get(intent, suggestions_map[Intent.UNKNOWN])


# Global instance
ai_chat_service = AIChatService()
