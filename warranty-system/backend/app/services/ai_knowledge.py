"""AI Knowledge Base — taxonomy lỗi, intent, FAQ, template tin nhắn.

Tách riêng khỏi `ai_service.py` để:
- Nội dung nghiệp vụ (từ khóa, mẫu câu trả lời) nằm ở một chỗ, dễ bảo trì.
- `ai_service.py` chỉ giữ logic xử lý (khớp intent, tính confidence, gọi DB).

Nguồn: docs/user-stories/AI-CHATBOT-USER-STORIES.md
"""

# === 5.1 Phân loại lỗi tự động ===
# error_code -> metadata
# priority: HIGH | MEDIUM | LOW | CRITICAL
# warranty_eligible: lỗi có được bảo hành miễn phí hay không
ERROR_CATALOG = {
    "screen_black": {
        "label": "Màn hình đen / Không lên nguồn",
        "keywords": ["đen màn hình", "màn hình đen", "không lên", "không lên nguồn", "không bật",
                     "màn hình chết", "không có hình", "tắt đột ngột", "mất màn hình"],
        "priority": "HIGH",
        "warranty_eligible": True,
        "severity": "Cao",
        "suggestions": [
            "Kiểm tra đèn LED nguồn và tiếng kêu bíp khi khởi động",
            "Thử cắm sạc/củ nguồn khác để loại trừ nguồn ngoài",
            "Tháo sạc pin rồi khởi động lại để loại trừ pin chết",
        ],
        "note": "Nghi vấn lỗi mainboard hoặc màn hình.",
    },
    "screen_flicker": {
        "label": "Màn hình nhấp nháy / Sọc",
        "keywords": ["nhấp nháy", "sọc", "chớp", "flicker", "màn hình giật", "đứng hình"],
        "priority": "MEDIUM",
        "warranty_eligible": True,
        "severity": "Trung bình",
        "suggestions": [
            "Kiểm tra cáp màn hình (VGA/DisplayPort) có chặt không",
            "Giảm tần suất làm mới màn hình trong cài đặt hiển thị",
            "Thử cắm ra màn hình ngoài để xác định lỗi nằm ở màn hình hay mainboard",
        ],
        "note": "Thường do cáp, driver hoặc panel hỏng.",
    },
    "overheat": {
        "label": "Quá nhiệt / Tắt đột ngột",
        "keywords": ["nóng", "quá nhiệt", "kêu to", "quạt", "tắt đột ngột", "nóng ran", "overheat", "tắt máy"],
        "priority": "HIGH",
        "warranty_eligible": True,
        "severity": "Cao",
        "suggestions": [
            "Kiểm tra quạt tản nhiệt còn quay không, có bị bụi bám không",
            "Vệ sinh khe tản nhiệt và thay keo tản nhiệt nếu cũ",
            "Không tiếp tục sử dụng nếu máy tắt đột ngột — có thể hư mainboard",
        ],
        "note": "Có nguy cơ lan sang mainboard nếu tiếp tục sử dụng.",
    },
    "keyboard": {
        "label": "Bàn phím / Phím không hoạt động",
        "keywords": ["bàn phím", "phím", "gõ không", "không gõ", "phím bị", "liệt phím", "space"],
        "priority": "MEDIUM",
        "warranty_eligible": True,
        "severity": "Trung bình",
        "suggestions": [
            "Thử bàn phím ảo (On-screen keyboard) để loại trừ lỗi phần mềm",
            "Ghi lại chính xác phím nào bị liệt (A, S, D, F...)",
            "Vệ sinh khe phím, loại bỏ bụi/kẹo dán",
        ],
        "note": "Có thể do bàn phím hỏng hoặc chân tiếp xúc mainboard.",
    },
    "audio": {
        "label": "Loa / Micro / Âm thanh",
        "keywords": ["loa", "âm thanh", "tiếng rè", "micro", "không nghe", "re", "mất tiếng", "sóng âm"],
        "priority": "LOW",
        "warranty_eligible": True,
        "severity": "Thấp",
        "suggestions": [
            "Cắm tai nghe để xác định lỗi ở loa hay ở driver",
            "Kiểm tra cài đặt âm thanh / cập nhật driver âm thanh",
            "Thử cấp hình loa mặc định khác trong Sound settings",
        ],
        "note": "Thường là driver hoặc loa bị mất kết nối.",
    },
    "water": {
        "label": "Vào nước / Dính nước",
        "keywords": ["vào nước", "dính nước", "đổ nước", "nước vào", "ngâm nước", "vãi nước", "ướt"],
        "priority": "CRITICAL",
        "warranty_eligible": False,
        "severity": "Nghiêm trọng",
        "suggestions": [
            "RÚT ĐIỆN ngay và KHÔNG sạc pin",
            "KHÔNG bật máy dù có hay không",
            "Gửi máy đến trung tâm để sấy/kiểm tra, sẽ có báo giá trước khi sửa",
        ],
        "note": "Vào nước KHÔNG được bảo hành miễn phí — vẫn hỗ trợ sửa chữa tính phí.",
    },
    "storage": {
        "label": "Ổ cứng / Lưu trữ",
        "keywords": ["ổ cứng", "hdd", "ssd", "không nhận", "bad sector", "dữ liệu", "ổ đĩa", "hỏng ổ"],
        "priority": "CRITICAL",
        "warranty_eligible": True,
        "severity": "Nguy hiểm",
        "suggestions": [
            "Sao lưu dữ liệu ngay nếu ổ còn nhận",
            "Không tắt máy đột ngột khi ổ đang chạy",
            "Mang máy đến trung tâm để kiểm tra ổ cứng",
        ],
        "note": "Có nguy cơ mất dữ liệu — cần xử lý sớm.",
    },
    "battery": {
        "label": "Pin / Sạc",
        "keywords": ["pin", "sạc", "chai", "nhanh hết", "không sạc vào", "cục sạc", "dung lượng", "không nhận sạc"],
        "priority": "MEDIUM",
        "warranty_eligible": True,
        "severity": "Trung bình",
        "suggestions": [
            "Kiểm tra Battery health trong Settings để xem % tuổi thọ",
            "Thử cắm sạc khác và cổng sạc khác",
            "Với máy dùng pin rời, thay pin mới và kiểm tra lại",
        ],
        "note": "Pin chai là lỗi hao mòn tự nhiên — vẫn được hỗ trợ theo chính sách.",
    },
    "software": {
        "label": "Lỗi phần mềm / Hệ điều hành",
        "keywords": ["lỗi phần mềm", "treo", "lag", "crash", "firmware", "update", "cập nhật",
                     "boot loop", "reset", "không vào được", "màn hình xanh"],
        "priority": "LOW",
        "warranty_eligible": False,
        "severity": "Thấp",
        "suggestions": [
            "Khởi động vào Safe Mode để xác định lỗi do phần mềm hay phần cứng",
            "Khôi phục cài đặt gốc hoặc cập nhật firmware",
            "Chụp lại mã lỗi hiển thị trên màn hình để kỹ thuật viên đối chiếu",
        ],
        "note": "Lỗi phần mềm không được bảo hành nhưng vẫn có thể hỗ trợ kiểm tra.",
    },
    "port": {
        "label": "Cổng kết nối",
        "keywords": ["usb", "hdmi", "cổng", "sạc không vào", "không nhận", "cắm không", "cổng sạc"],
        "priority": "LOW",
        "warranty_eligible": True,
        "severity": "Thấp",
        "suggestions": [
            "Thử cáp và cổng khác để loại trừ lỗi phụ kiện",
            "Kiểm tra có bị dính bụi/kẹo trong cổng không",
            "Ghi rõ tên cổng (USB-C, USB-A, HDMI) và hiện tượng",
        ],
        "note": "Thường do cáp hoặc chân tiếp xúc cổng.",
    },
}

# Nhãn tiếng Việt dùng cho hiển thị + nhóm màu ở frontend
ERROR_LABELS = {code: meta["label"] for code, meta in ERROR_CATALOG.items()}


# === Bảng Intent Mapping (mục 8 tài liệu user story) ===
# intent -> (keywords, response_template_key)
INTENT_KEYWORDS = {
    "greeting": [
        "xin chào", "chào", "hello", "hi", "alo", "chào buổi sáng", "chào buổi chiều",
    ],
    "warranty_check": [
        "bảo hành", "bh", "check bh", "kiểm tra bh", "hết hạn", "còn bh", "thời hạn bh",
    ],
    "warranty_history": [
        "lịch sử bảo hành", "lịch sử sửa chữa", "đã sửa mấy lần", "các lần bảo hành",
        "tóm tắt bảo hành", "quá trình bảo hành", "sửa chữa trước",
    ],
    "serial_lookup": [
        "tra cứu serial", "serial", "số serial", "tra cuu", "mã serial",
    ],
    "ticket_status": [
        "trạng thái", "tiến độ", "xử lý thế nào", "xong chưa", "phiếu", "ticket", "mã phiếu",
    ],
    "create_ticket": [
        "tạo phiếu", "gửi bh", "yêu cầu bh", "sửa chữa", "bảo hành sản phẩm", "gửi máy",
    ],
    "product_info": [
        "thông tin sp", "cấu hình", "model", "thông số", "sản phẩm của tôi",
    ],
    "phone_lookup": [
        "số điện thoại", "sđt", "điện thoại", "tra cứu sdt", "các sản phẩm đã mua",
    ],
    "faq_guide": [
        "hướng dẫn", "cách làm", "quy trình", "các bước", "gửi bảo hành thế nào",
    ],
    "faq_location": [
        "ở đâu", "địa chỉ", "trung tâm", "nơi nào", "cửa hàng",
    ],
    "faq_cost": [
        "chi phí", "phí", "giá", "bao nhiêu tiền", "báo giá",
    ],
    "faq_warranty_period": [
        "bảo hành bao lâu", "thời gian bảo hành", "số tháng bảo hành", "chính sách bảo hành",
    ],
    # === Intent storefront (shop) ===
    "product_recommendation": [
        "mua", "nên chọn", "nên mua", "tư vấn", "gợi ý", "đề xuất", "bao nhiêu",
        "phù hợp", "dưới", "trên", "tầm giá", "có nên", "chọn loại", "sản phẩm nào",
    ],
    "product_compare": [
        "so sánh", "khác nhau", "nên mua cái nào", "nên chọn cái nào", "đối chiếu",
    ],
    "shop_policies": [
        "chính sách", "đổi trả", "giao hàng", "bảo hành bao lâu", "vận chuyển",
        "thanh toán", "trả góp", "miễn phí vận chuyển",
    ],
    "add_to_cart": [
        "thêm vào giỏ", "mua ngay", "mua hàng", "đặt hàng", "cho tôi mua", "mua cái này",
    ],
    "contact": [
        "liên hệ", "hotline", "phone", "gọi", "zalo", "email",
    ],
    "complaint": [
        "khiếu nại", "phàn nàn", "khiếu nại dịch vụ",
    ],
    "feedback": [
        "góp ý", "phản hồi", "đánh giá",
    ],
    "thanks": ["cảm ơn", "cám ơn", "thank"],
    "farewell": ["tạm biệt", "bye", "hẹn gặp lại", "kết thúc"],
}


# === FAQ answers (mục 5.6 + 6 tài liệu user story) ===
FAQ_ANSWERS = {
    "faq_guide": (
        "📋 **5 bước gửi bảo hành:**\n\n"
        "1️⃣ **Kiểm tra BH:** Đảm bảu sản phẩm còn trong thời hạn bảo hành\n\n"
        "2️⃣ **Liên hệ:** Gọi hotline 0827461460 hoặc nhắn tin qua chatbot này\n\n"
        "3️⃣ **Chuẩn bị:** Giữ hóa đơn và phụ kiện đi kèm\n\n"
        "4️⃣ **Gửi máy:** Mang đến trung tâm bảo hành hoặc gửi qua đường bưu điện\n\n"
        "5️⃣ **Theo dõi:** Nhận mã phiếu và kiểm tra tiến độ trực tuyến\n\n"
        "❓ Bạn cần hỗ trợ bước nào?"
    ),
    "faq_process": (
        "🔄 **Quy trình bảo hành chuẩn:**\n\n"
        "1️⃣ **Tiếp nhận** → Nhận phiếu và kiểm tra sản phẩm\n"
        "2️⃣ **Kiểm tra** → Xác định lỗi và điều kiện BH (1-2 ngày)\n"
        "3️⃣ **Sửa chữa** → Thay thế/fix lỗi (2-5 ngày tùy lỗi)\n"
        "4️⃣ **Kiểm tra lại** → Test sản phẩm sau sửa chữa\n"
        "5️⃣ **Trả khách** → Thông báo và giao sản phẩm\n\n"
        "⏱️ **Tổng thời gian:** 3-7 ngày làm việc"
    ),
    "faq_warranty_period": (
        "📅 **Chính sách bảo hành:**\n\n"
        "🖥️ **Máy tính / laptop:** 24 tháng (2 năm)\n"
        "📱 **Tablet / Điện thoại:** 12 tháng (1 năm)\n"
        "🎧 **Phụ kiện:** 6-12 tháng tùy loại\n\n"
        "💡 **Lưu ý:**\n"
        "- Bảo hành tính từ **ngày mua** trên hóa đơn\n"
        "- Không áp dụng với lỗi do **va đập, vào nước**\n"
        "- Cần giữ **hóa đơn** để được bảo hành"
    ),
    "faq_location": (
        "📍 **Địa chỉ trung tâm bảo hành:**\n\n"
        "🏢 **TP.HCM:**\n"
        "- 123 Nguyễn Huệ, Quận 1\n"
        "- 456 Lê Văn Sỹ, Quận 3\n\n"
        "🏢 **Hà Nội:**\n"
        "- 78 Trần Hưng Đạo, Hoàn Kiến\n"
        "- 99 Cầu Giấy, Cầu Giấy\n\n"
        "🏢 **Đà Nẵng:**\n"
        "- 56 Nguyễn Văn Linh\n\n"
        "⏰ Giờ làm việc: 8:00 - 18:00 (Thứ 2 - Thứ 6)"
    ),
    "faq_cost": (
        "💰 **Chính sách chi phí:**\n\n"
        "✅ **Miễn phí:**\n"
        "- Sửa chữa trong thời hạn bảo hành\n"
        "- Thay linh kiện lỗi từ nhà sản xuất\n\n"
        "❌ **Tính phí:**\n"
        "- Hết thời hạn bảo hành\n"
        "- Lỗi do người dùng (va đập, vào nước)\n"
        "- Linh kiện hao mòn tự nhiên\n\n"
        "📋 **Báo giá trước khi sửa chữa có phí** — bạn sẽ nhận thông báo để phê duyệt."
    ),
    "faq_no_ticket": (
        "🔍 Không sao! Bạn có thể tìm phiếu bằng:\n\n"
        "1️⃣ **Số serial** sản phẩm\n"
        "2️⃣ **Số điện thoại** đã đăng ký\n"
        "3️⃣ **Mã phiếu** có dạng `WR-2026-0001`\n\n"
        "Bạn cung cấp thông tin nào có thể tra được?"
    ),
    "contact": (
        "📞 **Kênh liên hệ:**\n\n"
        "☎️ **Hotline:** 0827461460 (8:00-17:00)\n"
        "💬 **Zalo:** BảoHành Pro\n"
        "📧 **Email:** manhdungdbn@gmail.com\n"
        "💬 **Chat:** Nhắn tin ngay cho tôi!\n\n"
        "👋 Tôi có thể hỗ trợ bạn ngay — bạn cần giúp gì?"
    ),
    "complaint": (
        "😔 Rất tiếc về trải nghiệm chưa tốt của bạn.\n\n"
        "Để xử lý khiếu nại, vui lòng:\n\n"
        "1️⃣ Cung cấp **mã phiếu** BH liên quan\n"
        "2️⃣ Mô tả **vấn đề** gặp phải\n"
        "3️⃣ Liên hệ hotline **0827461460**\n\n"
        "📧 Email khiếu nại: manhdungdbn@gmail.com\n"
        "⏰ Phản hồi trong 24h làm việc"
    ),
    "feedback": (
        "📝 **Gửi phản hồi:**\n\n"
        "Cảm ơn bạn đã phản hồi! Bạn có thể:\n\n"
        "📧 Email: manhdungdbn@gmail.com\n"
        "📱 Zalo: BảoHành Pro\n"
        "📞 Hotline: 0827461460\n\n"
        "⭐ Đánh giá dịch vụ: https://bit.ly/danh-gia-bao-hanh-pro"
    ),
}


# === 5.3 Sinh tin nhắn cập nhật tiến độ (7 trạng thái) ===
# status -> (title, body_template)
# {code} = mã phiếu, {product} = tên sản phẩm, {note} = ghi chú kỹ thuật viên
PROGRESS_TEMPLATES = {
    "RECEIVED": (
        "📬 **Xác nhận tiếp nhận yêu cầu**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n"
        "Ngày tiếp nhận: {date}\n\n"
        "📋 **Các bước tiếp theo:**\n"
        "1️⃣ Kỹ thuật viên sẽ kiểm tra trong 24h\n"
        "2️⃣ Bạn sẽ nhận thông báo khi có kết quả\n"
        "3️⃣ Thời gian sửa chữa dự kiến: 3-5 ngày\n\n"
        "📞 Hotline: 0827461460 nếu cần hỗ trợ"
    ),
    "INSPECTION": (
        "🔍 **Cập nhật: Đang kiểm tra**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n"
        "Trạng thái: Kỹ thuật viên đang kiểm tra\n"
        "Ngày cập nhật: {date}\n\n"
        "📝 **Tiến độ:**\n"
        "- ✅ Đã tiếp nhận\n"
        "- 🔄 Đang kiểm tra ← **Bạn đang ở đây**\n"
        "- ⏳ Chờ phê duyệt\n"
        "- 🔧 Sửa chữa\n"
        "- ✅ Hoàn tất\n\n"
        "{note}"
    ),
    "REPAIRING": (
        "🔧 **Cập nhật: Đang sửa chữa**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n"
        "Trạng thái: Kỹ thuật đang xử lý\n"
        "Ngày cập nhật: {date}\n\n"
        "📝 **Tiến độ:**\n"
        "- ✅ Đã tiếp nhận\n"
        "- ✅ Đã kiểm tra\n"
        "- ✅ Đã phê duyệt\n"
        "- 🔄 Đang sửa chữa ← **Bạn đang ở đây**\n"
        "- ⏳ Hoàn tất\n\n"
        "🛠️ Nội dung: {note}\n"
        "⏱️ Dự kiến xong: {eta}"
    ),
    "COMPLETED": (
        "✅ **Sản phẩm đã sẵn sàng!**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n"
        "Trạng thái: ✅ Hoàn tất\n"
        "Ngày hoàn tất: {date}\n\n"
        "📋 **Thông tin sửa chữa:**\n"
        "- {note}\n"
        "- Đã kiểm tra hoàn tất\n"
        "- Sản phẩm hoạt động bình thường\n\n"
        "🏪 **Nhận hàng:** Trung tâm bảo hành — 123 Nguyễn Huệ, Q1\n"
        "⏰ Giờ mở cửa: 8:00 - 18:00 (T2-T6)\n\n"
        "📞 Hotline: 0827461460"
    ),
    "REJECTED": (
        "⚠️ **Thông báo thay đổi**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n\n"
        "❌ **Trạng thái: Hủy yêu cầu**\n\n"
        "📝 **Lý do:** {note}\n\n"
        "💰 **Phí kiểm tra:** {cost}\n\n"
        "📞 Nếu cần hỗ trợ: 0827461460\n\n"
        "Cảm ơn bạn đã sử dụng dịch vụ!"
    ),
    "APPROVAL": (
        "⚠️ **Cần bạn xác nhận**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n"
        "Trạng thái: Chờ phê duyệt\n\n"
        "📋 **Báo giá sửa chữa:**\n"
        "- {note}\n"
        "- **Tổng cộng: {cost}**\n\n"
        "⏰ Vui lòng phản hồi trên phiếu để chúng tôi tiếp tục xử lý.\n\n"
        "📞 Thắc mắc? Gọi 0827461460"
    ),
    "DELIVERED": (
        "🚚 **Đã giao hàng thành công!**\n\n"
        "Mã phiếu: **{code}**\n"
        "Sản phẩm: {product}\n"
        "Trạng thái: ✅ Đã giao\n"
        "Ngày giao: {date}\n\n"
        "📦 **Sản phẩm:**\n"
        "- {product}\n"
        "- {note}\n\n"
        "⭐ **Đánh giá dịch vụ:** https://bit.ly/danh-gia-bh-{code}\n\n"
        "Cảm ơn bạn đã tin tưởng BảoHành Pro!"
    ),
}

# Trạng thái chưa có template riêng → dùng template gần nhất
PROGRESS_FALLBACK = (
    "📋 **Cập nhật trạng thái phiếu {code}**\n\n"
    "Sản phẩm: {product}\n"
    "Trạng thái: {status}\n"
    "Ngày cập nhật: {date}\n\n"
    "{note}"
)

# Nhãn trạng thái hiển thị
STATUS_LABELS = {
    "RECEIVED": "Tiếp nhận",
    "INSPECTION": "Đang kiểm tra",
    "APPROVAL": "Chờ phê duyệt",
    "REPAIRING": "Đang sửa chữa",
    "COMPLETED": "Hoàn tất",
    "REJECTED": "Từ chối",
    "DELIVERED": "Đã giao",
}

# Gợi ý câu hỏi tiếp theo theo intent
INTENT_SUGGESTIONS = {
    "greeting": ["Tra cứu bảo hành theo serial", "Tạo phiếu bảo hành mới", "Hướng dẫn quy trình bảo hành"],
    "warranty_check": ["Xem lịch sử bảo hành", "Tạo phiếu bảo hành mới", "Chi phí sửa chữa bao nhiêu"],
    "warranty_history": ["Tạo phiếu bảo hành mới", "Tra cứu tình trạng phiếu", "Liên hệ tổng đài"],
    "serial_lookup": ["Kiểm tra thời hạn bảo hành", "Xem lịch sử sửa chữa", "Tạo phiếu bảo hành"],
    "ticket_status": ["Xem lịch sử bảo hành", "Liên hệ tổng đài", "Tạo phiếu bảo hành mới"],
    "create_ticket": ["Cách gửi bảo hành", "Thời gian xử lý bao lâu", "Chi phí sửa chữa bao nhiêu"],
    "product_info": ["Kiểm tra thời hạn bảo hành", "Xem lịch sử sửa chữa", "Tạo phiếu bảo hành"],
    "phone_lookup": ["Kiểm tra thời hạn bảo hành", "Xem lịch sử sửa chữa", "Tạo phiếu bảo hành"],
    "faq_guide": ["Quy trình bảo hành", "Chi phí sửa chữa bao nhiêu", "Trung tâm bảo hành ở đâu"],
    "faq_location": ["Liên hệ tổng đài", "Giờ làm việc", "Thời gian xử lý bao lâu"],
    "faq_cost": ["Tạo phiếu bảo hành mới", "Quy trình bảo hành", "Tra cứu bảo hành theo serial"],
    "faq_warranty_period": ["Tra cứu bảo hành theo serial", "Chi phí sửa chữa bao nhiêu", "Trung tâm bảo hành ở đâu"],
    "contact": ["Tạo phiếu bảo hành mới", "Kiểm tra thời hạn bảo hành", "Xem lịch sử sửa chữa"],
    "product_recommendation": ["Tivi 4K dưới 15 triệu", "So sánh 3 tivi", "Quạt làm mát tốt nhất", "Máy lọc nước RO cho gia đình"],
    "product_compare": ["Tivi nào đáng mua hơn?", "Khác nhau giữa 2 mẫu loa"],
    "shop_policies": ["Chính sách đổi trả", "Giao hàng mất bao lâu?"],
    "add_to_cart": ["Xem giỏ hàng", "Sản phẩm nào đang giảm giá?"],
    "complaint": ["Liên hệ tổng đài", "Tra cứu trạng thái phiếu"],
    "feedback": ["Liên hệ tổng đài"],
    "thanks": ["Tra cứu bảo hành theo serial", "Tạo phiếu bảo hành mới"],
    "farewell": ["Tra cứu bảo hành theo serial", "Liên hệ tổng đài"],
    "error_classification": ["Tạo phiếu bảo hành mới", "Cách gửi bảo hành", "Chi phí sửa chữa bao nhiêu"],
    "unknown": ["Tra cứu bảo hành theo serial", "Tạo phiếu bảo hành mới", "Hướng dẫn quy trình bảo hành"],
}
