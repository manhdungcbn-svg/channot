# User Story: AI Chatbot cho Hệ thống Bảo Hành Sản Phẩm

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [User Story: Tra cứu Bảo Hành](#2-user-story-tra-cứu-bảo-hành)
3. [User Story: Tạo Yêu cầu Bảo Hành](#3-user-story-tạo-yêu-cầu-bảo-hành)
4. [User Story: Kiểm tra Trạng thái Phiếu](#4-user-story-kiểm-tra-trạng-thái-phiếu)
5. [User Story: Thông tin Sản phẩm](#5-user-story-thông-tin-sản-phẩm)
6. [User Story: Hướng dẫn Sử dụng](#6-user-story-hướng-dẫn-sử-dụng)
7. [User Story: Phản hồi & Liên hệ](#7-user-story-phản-hồi--liên-hệ)
8. [Bảng Intent Mapping](#8-bảng-intent-mapping)

---

## 1. Tổng quan

### Mục tiêu
Xây dựng chatbot AI thông minh hỗ trợ khách hàng tra cứu bảo hành, tạo yêu cầu sửa chữa và nhận thông tin về sản phẩm.

### Phạm vi
- Tra cứu thông tin bảo hành qua Serial/Số điện thoại
- Tạo yêu cầu bảo hành mới
- Kiểm tra trạng thái phiếu bảo hành
- Hướng dẫn sử dụng dịch vụ
- FAQ thường gặp

### Người dùng mục tiêu
- Khách hàng đã mua sản phẩm
- Kỹ thuật viên bảo hành
- Nhân viên chăm sóc khách hàng

---

## 2. User Story: Tra cứu Bảo Hành

### 🔍 US-001: Tra cứu bảo hành bằng Serial

**Như một** khách hàng  
**Tôi muốn** tra cứu thông tin bảo hành bằng số serial  
**Để** kiểm tra xem sản phẩm của tôi còn được bảo hành không

#### Bộ câu hỏi - Câu trả lời mẫu:

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Serial của tôi là TND-AC10-001, sản phẩm có còn bảo hành không?" | `warranty_check` + `serial` | "✅ Sản phẩm **TND-AC10-001** còn bảo hành đến **15/08/2027**. Sản phẩm: Máy tính xách tay TechNova Pro 15. Tình trạng: Đang sử dụng bình thường." |
| 2 | "Mình kiểm tra bảo hành máy này giúp" | `warranty_check` | "🔍 Để kiểm tra bảo hành, bạn vui lòng cung cấp **số serial** sản phẩm (thường in trên nhãn phía dưới máy hoặc hộp đựng). Ví dụ: `TND-AC10-001`" |
| 3 | "Sản phẩm của tôi hết hạn bảo hành chưa?" | `warranty_check` | "📋 Để kiểm tra ngày hết hạn bảo hành, bạn cần cung cấp **số serial** sản phẩm. Bạn có thể tìm serial trên nhãn dán phía dưới máy hoặc trong sổ hướng dẫn." |
| 4 | "Làm sao biết sản phẩm còn bảo hành?" | `warranty_check` | "💡 Để kiểm tra bảo hành, bạn cần:<br>1️⃣ Tìm **số serial** trên sản phẩm (nhãn phía dưới hoặc hộp)<br>2️⃣ Nhập serial vào đây để kiểm tra<br><br>Sau **15/08/2027** sản phẩm sẽ hết hạn bảo hành." |
| 5 | "Check warranty cho tôi" | `warranty_check` | "🔍 Vui lòng cung cấp **số serial** để tôi kiểm tra thông tin bảo hành. Serial thường có format: `TND-AC10-001`, `DELL-XPS-15-005`..." |

---

### 🔍 US-002: Tra cứu bảo hành bằng Số điện thoại

**Như một** khách hàng  
**Tôi muốn** tra cứu bảo hành bằng số điện thoại đã đăng ký  
**Để** không cần nhớ số serial

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "SĐT 0912345678 kiểm tra giúp tôi" | `phone_lookup` | "✅ Tìm thấy 2 sản phẩm đã đăng ký với SĐT 0912345678:<br>📦 **TND-AC10-001** - TechNova Pro 15 - Còn BH (đến 15/08/2027)<br>📦 **TND-LT20-003** - TechNova Air 13 - Hết BH (từ 20/05/2026)<br><br>Bạn muốn xem chi tiết sản phẩm nào?" |
| 2 | "Tôi muốn kiểm tra các sản phẩm đã mua" | `lookup_by_phone` | "🔍 Để tra cứu sản phẩm đã mua, vui lòng cung cấp **số điện thoại** đã đăng ký mua hàng." |
| 3 | "Tra serial theo số điện thoại 0901234567" | `phone_lookup` | "✅ Tìm thấy sản phẩm đăng ký với SĐT 0901234567:<br>📦 Serial: **TND-AC10-005**<br>📅 Bảo hành: Còn đến **30/12/2026**<br>🔧 Tình trạng: Hoạt động tốt" |

---

## 3. User Story: Tạo Yêu cầu Bảo Hành

### 📝 US-003: Tạo yêu cầu bảo hành mới

**Như một** khách hàng  
**Tôi muốn** tạo yêu cầu bảo hành khi sản phẩm bị lỗi  
**Để** được hỗ trợ sửa chữa hoặc thay thế

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Máy tôi bị lỗi, tôi muốn gửi bảo hành" | `create_ticket` | "📝 Để tạo yêu cầu bảo hành, bạn cần cung cấp:<br>1️⃣ **Số serial** sản phẩm<br>2️⃣ **Mô tả lỗi** gặp phải<br><br>Bạn có thể nhập serial trước để tôi hỗ trợ nhanh hơn nhé!" |
| 2 | "Tạo phiếu bảo hành cho máy TND-AC10-001, lỗi màn hình nhấp nháy" | `create_ticket` + `serial` | "✅ Đã tiếp nhận yêu cầu!<br><br>📋 **Thông tin phiếu:**<br>- Serial: TND-AC10-001<br>- Lỗi: Màn hình nhấp nháy<br>- Mã phiếu: **WR-2026-0045**<br>- Trạng thái: Đã tiếp nhận<br><br>⏰ Dự kiến kiểm tra trong 24h. Bạn sẽ nhận được thông báo khi có cập nhật." |
| 3 | "Màn hình laptop tôi bị đen, không lên hình" | `create_ticket` | "🔍 Tôi hiểu laptop bạn bị lỗi màn hình. Để tạo yêu cầu bảo hành, bạn cung cấp thêm:<br>1️⃣ **Số serial** (trên nhãn phía dưới máy)<br>2️⃣ **Tên model** laptop (nếu có)<br><br>Bạn có serial để tôi kiểm tra không?" |
| 4 | "Gửi bảo hành sản phẩm" | `create_ticket` | "📝 Để gửi bảo hành sản phẩm, bạn vui lòng cung cấp:<br>• **Số serial** sản phẩm<br>• **Mô tả lỗi** chi tiết<br><br>Tôi sẽ tạo phiếu và hướng dẫn bạn các bước tiếp theo." |
| 5 | "Tôi cần sửa chữa laptop" | `create_ticket` | "🔧 Bạn cần hỗ trợ sửa chữa laptop. Để tạo yêu cầu, vui lòng cho tôi biết:<br>1️⃣ **Số serial** laptop (ví dụ: TND-AC10-001)<br>2️⃣ **Lỗi gặp phải** là gì?<br><br>Nếu cần, bạn có thể mang máy đến trung tâm bảo hành gần nhất." |

---

## 4. User Story: Kiểm tra Trạng thái Phiếu

### 📋 US-004: Kiểm tra trạng thái yêu cầu bảo hành

**Như một** khách hàng  
**Tôi muốn** kiểm tra tiến độ xử lý phiếu bảo hành  
**Để** biết khi nào sản phẩm được sửa xong

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Phiếu WR-2026-0045 của tôi xử lý thế nào rồi?" | `ticket_status` + `ticket_code` | "📋 **Phiếu WR-2026-0045**<br><br>📦 Sản phẩm: TechNova Pro 15 (TND-AC10-001)<br>🔧 Lỗi: Màn hình nhấp nháy<br>📍 **Trạng thái: Đang kiểm tra**<br>👨‍🔧 Kỹ thuật viên: Nguyễn Văn Minh<br><br>📅 Cập nhật: 20/10/2026 14:30<br>💬 Ghi chú: Đang chờ linh kiện thay thế (dự kiến 2-3 ngày)" |
| 2 | "Kiểm tra tiến độ phiếu bảo hành" | `ticket_status` | "🔍 Để kiểm tra tiến độ, bạn cung cấp **mã phiếu** (format: WR-2026-XXXX) hoặc **số serial** sản phẩm." |
| 3 | "Tôi gửi máy bảo hành tuần trước, xong chưa?" | `ticket_status` | "📋 Tôi tìm thấy phiếu của bạn:<br><br>🔖 **WR-2026-0042**<br>📍 Trạng thái: **Đang sửa chữa**<br>📅 Ngày tiếp nhận: 14/10/2026<br><br>💬 Kỹ thuật viên đang xử lý lỗi mainboard. Dự kiến hoàn tất trong **2 ngày** nữa. Bạn sẽ được thông báo khi xong." |
| 4 | "Mã phiếu WR-2026-0030" | `ticket_status` + `ticket_code` | "✅ **WR-2026-0030** - Đã hoàn tất!<br><br>📦 TechNova Air 13<br>🔧 Sửa chữa: Thay pin mới<br>✅ Ngày hoàn tất: 18/10/2026<br>📍 Trạng thái: Đã trả khách<br><br>Bạn có thể đến lấy tại trung tâm hoặc chúng tôi sẽ giao hàng." |
| 5 | "Phiếu của tôi bị từ chối không?" | `ticket_status` | "🔍 Để kiểm tra, bạn cho tôi biết **mã phiếu** hoặc **số serial** sản phẩm nhé." |

---

## 5. User Story: Thông tin Sản phẩm

### 📦 US-005: Xem thông tin chi tiết sản phẩm

**Như một** khách hàng  
**Tôi muốn** xem thông tin chi tiết về sản phẩm đã mua  
**Để** biết thông số kỹ thuật và điều kiện bảo hành

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Cho tôi biết thông tin sản phẩm serial TND-AC10-001" | `product_info` + `serial` | "📦 **TechNova Pro 15**<br><br>🔢 Serial: TND-AC10-001<br>🏷️ Model: TN-PRO15-I7-512<br>📅 Ngày mua: 15/08/2024<br>📅 Hết BH: 15/08/2027<br>🔧 Tình trạng: Đang hoạt động<br><br>⚙️ **Thông số:**<br>- CPU: Intel Core i7-12700H<br>- RAM: 16GB DDR5<br>- SSD: 512GB NVMe<br>- Màn hình: 15.6\" 2.5K IPS" |
| 2 | "Sản phẩm của tôi thuộc loại nào?" | `product_info` | "📋 Để xem thông tin sản phẩm, bạn cung cấp **số serial** hoặc **số điện thoại** đã đăng ký nhé." |
| 3 | "TND-LT20-003 cấu hình ra sao?" | `product_info` + `serial` | "📦 **TechNova Air 13**<br><br>🔢 Serial: TND-LT20-003<br>🏷️ Model: TN-AIR13-M1-256<br><br>⚙️ **Cấu hình:**<br>- CPU: Apple M1<br>- RAM: 8GB<br>- SSD: 256GB<br>- Màn hình: 13.3\" Retina<br><br>⚠️ **Lưu ý:** Sản phẩm đã **hết bảo hành** từ 20/05/2026. Bạn có thể liên hệ trung tâm để được hỗ trợ sửa chữa tính phí." |
| 4 | "Xem thông tin mua hàng của tôi" | `product_info` | "📋 Để xem thông tin mua hàng, vui lòng cung cấp **số serial** sản phẩm hoặc **số điện thoại** đã đăng ký." |

---

## 5.1. User Story: Phân loại Lỗi từ Mô tả

### 🔧 US-005b: AI phân loại lỗi tự động

**Như một** khách hàng  
**Tôi muốn** AI tự động nhận diện và phân loại lỗi từ mô tả  
**Để** được hướng dẫn xử lý đúng cách

| STT | Mô tả lỗi của khách | Intent lọc | Câu trả lời của AI |
|-----|---------------------|-----------|-------------------|
| 1 | "Máy tôi bị đen màn hình, không lên gì cả" | `error_screen` | "🔍 **Phân loại lỗi: Màn hình/Lỗi nguồn**\n\nTôi nhận diện được mô tả của bạn:\n- **Nghi ngờ:** Lỗi mainboard hoặc màn hình\n\n📋 **Để tạo yêu cầu BH, bạn cần:**\n1️⃣ Cung cấp **số serial** sản phẩm\n2️⃣ Mô tả chi tiết hơn (có tiếng kêu bíp không? đèn LED có sáng không?)\n\n💡 **Nếu máy không lên gì:** Thử kiểm tra nguồn điện, adapter trước khi gửi BH." |
| 2 | "Laptop kêu réo rang, nóng ran và tắt đột ngột" | `error_overheat` | "🔍 **Phân loại lỗi: Quá nhiệt/Tắt đột ngột**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Quạt tản nhiệt hỏng, keo tản nhiệt khô\n- **Mức độ nghiêm trọng:** ⚠️ Cao - có thể ảnh hưởng linh kiện\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Tần suất:** Tắt sau bao lâu sử dụng?\n3️⃣ **Nhiệt độ:** Có nóng bất thường không?\n\n⚠️ **Khuyến cáo:** Không nên sử dụng tiếp để tránh hư mainboard." |
| 3 | "Bàn phím gõ không được một số phím" | `error_keyboard` | "🔍 **Phân loại lỗi: Bàn phím**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Lỗi phần cứng bàn phím\n- **Vị trí:** Một số phím cụ thể hay toàn bộ?\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Chi tiết:** Phím nào không hoạt động? (A, S, D, F...)\n\n💡 **Mẹo:** Thử dùng bàn phím ảo (On-screen keyboard) xem có phải lỗi phần mềm không trước." |
| 4 | "Loa laptop nghe rè, không rõ tiếng" | `error_audio` | "🔍 **Phân loại lỗi: Loa/Âm thanh**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Loa bị hỏng hoặc driver lỗi\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Chi tiết:** Cả 2 loa hay 1 loa? Nghe nhạc hay chỉ có micro?\n\n💡 **Thử:** Cắm tai nghe xem có bình thường không (loa trong vs tai nghe)." |
| 5 | "Máy bị dính nước vào, không bật được" | `error_water` | "🔍 **Phân loại lỗi: Vào nước ⚠️ KHẨN CẤP**\n\n**Lưu ý quan trọng:**\n- Vào nước **KHÔNG** được bảo hành miễn phí\n- Tuy nhiên, chúng tôi vẫn hỗ trợ kiểm tra và sửa chữa tính phí\n\n📋 **Ngay lập tức:**\n1️⃣ **RÚT ĐIỆN** và không sạc pin\n2️⃣ **KHÔNG BẬT MÁY** dù có hay không\n3️⃣ Liên hệ hotline **1900-1234** để được hướng dẫn\n\n💰 **Chi phí ước tính:** 500.000 - 2.000.000đ tùy mức độ hư hại" |
| 6 | "Ổ cứng laptop không nhận, máy kêu to" | `error_storage` | "🔍 **Phân loại lỗi: Ổ cứng/Lưu trữ**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Ổ cứng bị hỏng cơ hoặc bad sector\n- **Mức độ nguy hiểm:** ⚠️ Nguy hiểm - có thể mất dữ liệu!\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Thông tin thêm:** Laptop có bao nhiêu ổ cứng? (SSD/HDD?)\n\n⚠️ **Khuyến cáo:** \n- **Sao lưu dữ liệu ngay** nếu ổ còn nhận\n- Không tắt máy đột ngột\n- Mang đến trung tâm để kiểm tra" |
| 7 | "Pin chai, sạc nhanh hết" | `error_battery` | "🔍 **Phân loại lỗi: Pin/Sạc**\n\nTôi nhận diện được:\n- **Nghi ngờ:** Pin chai, sạc không nhận\n- **Nguyên nhân thường:** Sạc/quản lý năng lượng\n\n📋 **Để tạo yêu cầu BH:**\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Thông tin:** Pin sạc đầy dùng được bao lâu? (khoảng 30 phút/2h?)\n\n💡 **Thử kiểm tra nhanh:**\n- Vào Settings > Battery xem health %\n- Thử cắm sạc khác (nếu có)" |

### Bảng phân loại lỗi tự động

| Error Code | Loại lỗi | Từ khóa | Priority | Warranty Eligible |
|------------|----------|---------|----------|------------------|
| `screen_black` | Màn hình đen | đen, không lên, màn hình chết | HIGH | Có |
| `screen_flicker` | Màn hình nhấp nháy | nhấp nháy, flickering, chớp | MEDIUM | Có |
| `overheat` | Quá nhiệt | nóng, kêu to, quạt, tắt đột ngột | HIGH | Có |
| `keyboard` | Bàn phím | phím, bàn phím, gõ không được | MEDIUM | Có |
| `audio` | Loa/Micro | loa, âm thanh, tiếng rè, micro | LOW | Có |
| `water` | Vào nước | nước, đổ nước, dính nước | CRITICAL | Không |
| `storage` | Ổ cứng | ổ cứng, không nhận, bad sector | CRITICAL | Có |
| `battery` | Pin/Sạc | pin, sạc, chai, nhanh hết | MEDIUM | Có |
| `software` | Lỗi phần mềm | lỗi phần mềm, treo, lag, crash | LOW | Không |
| `port` | Cổng kết nối | USB, HDMI, sạc không vào | LOW | Có |

---

## 5.2. User Story: Tóm tắt Lịch sử Bảo hành

### 📜 US-005c: AI tóm tắt lịch sử bảo hành sản phẩm

**Như một** khách hàng  
**Tôi muốn** xem tóm tắt lịch sử bảo hành của sản phẩm  
**Để** biết tình trạng và lịch sử sửa chữa

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Lịch sử bảo hành serial TND-AC10-001" | `warranty_history` | "📜 **Lịch sử bảo hành - TND-AC10-001**\n\n📦 TechNova Pro 15 | Serial: TND-AC10-001\n📅 Ngày mua: 15/08/2024\n📅 BH đến: 15/08/2027\n\n**📋 Tổng kết:**\n- 🔧 **Số lần BH:** 2 lần\n- ✅ **Lần gần nhất:** 20/09/2026 - Thay pin\n- ⏱️ **Tỷ lệ BH thành công:** 100%\n\n**📝 Chi tiết:**\n1️⃣ **15/03/2026** - WR-2026-0012\n   - Lỗi: Bàn phím không hoạt động\n   - Xử lý: Thay bàn phím mới\n   - Thời gian: 3 ngày\n   - Chi phí: Miễn phí (BH)\n\n2️⃣ **20/09/2026** - WR-2026-0038\n   - Lỗi: Pin chai, sạc không nhận\n   - Xử lý: Thay pin + sạc\n   - Thời gian: 2 ngày\n   - Chi phí: Miễn phí (BH)\n\n**💡 Gợi ý:** Sản phẩm của bạn đã được thay pin, nên kiểm tra tình trạng pin thường xuyên." |
| 2 | "Tóm tắt tình trạng bảo hành máy này" | `warranty_history` | "📊 **Tóm tắt tình trạng BH:**\n\nĐể tôi tóm tắt, bạn cần cung cấp **số serial** hoặc **số điện thoại** đã đăng ký." |
| 3 | "Sản phẩm này đã sửa mấy lần?" | `warranty_history` | "📜 **Lịch sử sửa chữa:**\n\nBạn cung cấp **số serial** để tôi tra cứu nhé!\n\n💡 Ngoài ra, nếu bạn cung cấp **số điện thoại**, tôi sẽ liệt kê tất cả sản phẩm và lịch sử BH của bạn." |
| 4 | "Cho xem các lần bảo hành trước đây" | `warranty_history` | "📋 **Lịch sử bảo hành:**\n\n🔍 Vui lòng cung cấp **số serial** sản phẩm để xem chi tiết các lần BH trước đây." |

---

## 5.3. User Story: Sinh Tin nhắn Cập nhật Tiến độ

### 📱 US-005d: AI sinh tin nhắn cập nhật tiến độ tự động

**Như một** nhân viên bảo hành  
**Tôi muốn** AI tự động sinh tin nhắn cập nhật cho khách hàng  
**Để** tiết kiệm thời gian và đảm bảo thông tin nhất quán

| STT | Tình huống | Intent lọc | Tin nhắn được sinh |
|-----|-----------|-----------|-------------------|
| 1 | Phiếu vừa tiếp nhận | `notify_received` | "📬 **Xác nhận tiếp nhận yêu cầu**\n\nMã phiếu: **WR-2026-0045**\nSản phẩm: TechNova Pro 15\nNgày tiếp nhận: 20/10/2026\n\n📋 **Các bước tiếp theo:**\n1️⃣ Kỹ thuật viên sẽ kiểm tra trong 24h\n2️⃣ Bạn sẽ nhận thông báo khi có kết quả\n3️⃣ Thời gian sửa chữa dự kiến: 3-5 ngày\n\n📞 Hotline: 1900-1234 nếu cần hỗ trợ" |
| 2 | Đang kiểm tra/diagnosis | `notify_diagnosis` | "🔍 **Cập nhật: Đang kiểm tra**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: Kỹ thuật viên đang kiểm tra\nNgày cập nhật: 21/10/2026\n\n📝 **Tiến độ:**\n- ✅ Đã tiếp nhận\n- 🔄 Đang kiểm tra ← **Bạn đang ở đây**\n- ⏳ Chờ phê duyệt\n- 🔧 Sửa chữa\n- ✅ Hoàn tất\n\n💬 Kỹ thuật viên: Nguyễn Văn Minh\n📞 Thắc mắc? Gọi 1900-1234" |
| 3 | Cần phê duyệt báo giá | `notify_approval` | "⚠️ **Cần bạn xác nhận**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: Chờ phê duyệt\n\n📋 **Báo giá sửa chữa:**\n- Thay mainboard: 3.500.000đ\n- Phí kiểm tra: 200.000đ\n- **Tổng cộng: 3.700.000đ**\n\n⏰ **Hạn xác nhận:** 22/10/2026\n\nVui lòng trả lời:\n- **ĐỒNG Ý** - Để tiến hành sửa\n- **TỪ CHỐI** - Để hủy yêu cầu" |
| 4 | Đang sửa chữa | `notify_repairing` | "🔧 **Cập nhật: Đang sửa chữa**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: Kỹ thuật đang xử lý\nNgày cập nhật: 22/10/2026\n\n📝 **Tiến độ:**\n- ✅ Đã tiếp nhận\n- ✅ Đã kiểm tra\n- ✅ Đã phê duyệt\n- 🔄 Đang sửa chữa ← **Bạn đang ở đây**\n- ⏳ Hoàn tất\n\n🛠️ Nội dung: Thay mainboard mới\n⏱️ Dự kiến xong: 24/10/2026" |
| 5 | Đã sửa xong, chờ nhận | `notify_ready` | "✅ **Sản phẩm đã sẵn sàng!**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: ✅ Hoàn tất\nNgày hoàn tất: 24/10/2026\n\n📋 **Thông tin sửa chữa:**\n- Đã thay mainboard mới\n- Đã kiểm tra hoàn tất\n- Máy hoạt động bình thường\n\n🏪 **Nhận hàng:**\n- Trung tâm BH: 123 Nguyễn Huệ, Q1\n- Giờ mở cửa: 8:00 - 18:00 (T2-T6)\n\n📞 Hotline: 1900-1234" |
| 6 | Đã giao hàng | `notify_delivered` | "🚚 **Đã giao hàng thành công!**\n\nMã phiếu: **WR-2026-0045**\nTrạng thái: ✅ Đã giao\nNgày giao: 25/10/2026\n\n📦 **Sản phẩm:**\n- TechNova Pro 15 (TND-AC10-001)\n- Đã thay mainboard mới\n- Bảo hành sửa chữa: **3 tháng**\n\n💳 **Thanh toán:**\n- Tổng: 3.700.000đ\n- Đã thanh toán: ✅\n\n⭐ **Đánh giá dịch vụ:**\nhttp://bit.ly/danh-gia-bh-0045\n\nCảm ơn bạn đã tin tưởng BảoHành Pro!" |
| 7 | Trì hoãn/hủy | `notify_delay` | "⚠️ **Thông báo thay đổi**\n\nMã phiếu: **WR-2026-0045**\n\n❌ **Trạng thái: Hủy yêu cầu**\n\n📝 **Lý do:** Khách hàng không phê duyệt báo giá\n\n💰 **Hoàn tiền:** Không phí\n\n📞 Nếu cần hỗ trợ: 1900-1234\n\nCảm ơn bạn đã sử dụng dịch vụ!" |

---

## 6. User Story: Hướng dẫn Sử dụng

### 📖 US-006: Hướng dẫn sử dụng dịch vụ

**Như một** khách hàng  
**Tôi muốn** được hướng dẫn các bước sử dụng dịch vụ bảo hành  
**Để** biết cách gửi sản phẩm bảo hành đúng cách

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Hướng dẫn gửi bảo hành" | `faq_guide` | "📋 **5 bước gửi bảo hành:**\n\n1️⃣ **Kiểm tra BH:** Đảm bảo sản phẩm còn trong thời hạn bảo hành\n\n2️⃣ **Liên hệ:** Gọi hotline 1900-1234 hoặc gửi tin nhắn qua chatbot này\n\n3️⃣ **Chuẩn bị:** Giữ lại hóa đơn, phụ kiện đi kèm\n\n4️⃣ **Gửi máy:** Mang đến trung tâm BH gần nhất hoặc gửi qua đường bưu điện\n\n5️⃣ **Theo dõi:** Nhận mã phiếu và kiểm tra tiến độ online\n\n❓ Bạn cần hỗ trợ bước nào?" |
| 2 | "Quy trình bảo hành như thế nào?" | `faq_process` | "🔄 **Quy trình bảo hành chuẩn:**\n\n1️⃣ **Tiếp nhận** → Nhận phiếu và kiểm tra sản phẩm\n2️⃣ **Kiểm tra** → Xác định lỗi và điều kiện BH (1-2 ngày)\n3️⃣ **Sửa chữa** → Thay thế/fix lỗi (2-5 ngày tùy lỗi)\n4️⃣ **Kiểm tra lại** → Test sản phẩm sau sửa chữa\n5️⃣ **Trả khách** → Thông báo và giao sản phẩm\n\n⏱️ **Tổng thời gian:** 3-7 ngày làm việc" |
| 3 | "Thời gian bảo hành là bao lâu?" | `faq_warranty_period` | "📅 **Chính sách bảo hành:**\n\n🖥️ **Máy tính laptop:** 24 tháng (2 năm)\n📱 **Tablet/Điện thoại:** 12 tháng (1 năm)\n🎧 **Phụ kiện:** 6-12 tháng tùy loại\n\n💡 **Lưu ý:**\n- Bảo hành theo **ngày mua** trên hóa đơn\n- Không áp dụng với lỗi do **va đập, vào nước**\n- Cần giữ **hóa đơn** để được bảo hành" |
| 4 | "Trung tâm bảo hành ở đâu?" | `faq_location` | "📍 **Địa chỉ trung tâm BH:**\n\n🏢 **TP.HCM:**\n- 123 Nguyễn Huệ, Quận 1\n- 456 Lê Văn Sỹ, Quận 3\n\n🏢 **Hà Nội:**\n- 78 Trần Hưng Đạo, Hoàn Kiếm\n- 99 Cầu Giấy, Cầu Giấy\n\n🏢 **Đà Nẵng:**\n- 56 Nguyễn Văn Linh\n\n⏰ Giờ làm việc: 8:00 - 18:00 (Thứ 2 - Thứ 6)\n📞 Hotline: 1900-1234" |
| 5 | "Chi phí bảo hành thế nào?" | `faq_cost` | "💰 **Chính sách chi phí:**\n\n✅ **Miễn phí:**\n- Sửa chữa trong thời hạn BH\n- Thay thế linh kiện bị lỗi từ nhà sản xuất\n\n❌ **Tính phí:**\n- Hết thời hạn bảo hành\n- Lỗi do người dùng (va đập, vào nước)\n- Linh kiện hao mòn tự nhiên\n\n📋 Báo giá trước khi sửa chữa có phí" |
| 6 | "Tôi chưa có mã phiếu, làm sao?" | `faq_no_ticket` | "🔍 Không sao! Bạn có thể tìm phiếu bằng:\n\n1️⃣ **Số serial** sản phẩm\n2️⃣ **Số điện thoại** đã đăng ký\n3️⃣ **Email** nhận xác nhận\n\nBạn cung cấp thông tin nào có thể tra được?" |

---

## 7. User Story: Phản hồi & Liên hệ

### 💬 US-007: Liên hệ hỗ trợ

**Như một** khách hàng  
**Tôi muốn** liên hệ với bộ phận hỗ trợ  
**Để** được giải đáp thắc mắc

| STT | Câu hỏi của khách | Intent lọc | Câu trả lời của AI |
|-----|------------------|------------|-------------------|
| 1 | "Tôi cần gặp nhân viên tư vấn" | `contact` | "📞 **Kênh liên hệ:**\n\n☎️ **Hotline:** 1900-1234 (8:00-20:00)\n💬 **Zalo:** BaoHanhPro\n📧 **Email:** support@baohanhpro.vn\n💬 **Chat:** Nhắn tin ngay cho tôi!\n\n👋 Tôi có thể hỗ trợ bạn ngay, bạn cần giúp gì?" |
| 2 | "Gửi phản hồi về dịch vụ" | `feedback` | "📝 **Gửi phản hồi:**\n\nCảm ơn bạn đã phản hồi! Bạn có thể:\n\n📧 Email: feedback@baohanhpro.vn\n📱 Zalo: BaoHanhPro\n📞 Hotline: 1900-1234\n\n⭐ Đánh giá dịch vụ của chúng tôi:\nhttp://bit.ly/danh-gia-bao-hanh-pro" |
| 3 | "Khiếu nại dịch vụ" | `complaint` | "😔 Rất tiếc về trải nghiệm không tốt của bạn.\n\nĐể xử lý khiếu nại, vui lòng:\n\n1️⃣ Cung cấp **mã phiếu** BH liên quan\n2️⃣ Mô tả **vấn đề** gặp phải\n3️⃣ Liên hệ hotline **1900-1234** (nhánh 2)\n\n📧 Email khiếu nại: complaints@baohanhpro.vn\n⏰ Phản hồi trong 24h làm việc" |

---

## 8. Bảng Intent Mapping

### Bảng tổng hợp các Intent và Keywords

| Intent | Từ khóa tiếng Việt | Từ khóa tiếng Anh | Response Template |
|--------|-------------------|-------------------|-------------------|
| `greeting` | xin chào, chào, hello, hi, alo, chào buổi sáng | hi, hello, hey | Welcome message + gợi ý |
| `warranty_check` | bảo hành, bh, check bh, kiểm tra bh, hết hạn, còn bh | warranty, check warranty | Yêu cầu serial |
| `serial_lookup` | tra cứu serial, serial, số serial, tra cuu | serial lookup | Yêu cầu serial |
| `ticket_status` | trạng thái, tiến độ, xử lý thế nào, xong chưa | ticket status, progress | Yêu cầu mã phiếu |
| `create_ticket` | tạo phiếu, gửi bh, yêu cầu bh, sửa chữa | create ticket, repair request | Form tạo phiếu |
| `product_info` | thông tin sp, cấu hình, model, thông số | product info, specs | Yêu cầu serial |
| `faq_guide` | hướng dẫn, cách làm, quy trình, các bước | guide, how to, steps | Nội dung hướng dẫn |
| `faq_location` | ở đâu, địa chỉ, trung tâm, nơi nào | location, address | Danh sách địa chỉ |
| `faq_cost` | chi phí, phí, giá, bao nhiêu tiền | cost, fee, price | Thông tin chi phí |
| `contact` | liên hệ, hotline, phone, gọi | contact, call, phone | Kênh liên hệ |
| `thanks` | cảm ơn, cảm ơn bạn, thank | thanks, thank you | Phản hồi cảm ơn |
| `farewell` | tạm biệt, bye, hẹn gặp lại | goodbye, bye | Phản hồi kết thúc |
| `unknown` | (không khớp keywords nào) | - | Xin diễn đạt lại |

---

## 9. Luồng xử lý Intent

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INPUT                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INTENT CLASSIFIER                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. PII Anonymizer (ẩn email, phone, CCCD)                   │ │
│  │  2. Keyword Matching → Intent + Confidence Score            │ │
│  │  3. Slot Extraction (serial, ticket_code, phone)            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐
      │ Intent A  │   │ Intent B  │   │ Intent C  │
      │ (High)    │   │ (Medium)  │   │ (Low)     │
      └───────────┘   └───────────┘   └───────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE GENERATOR                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Lookup Data (nếu cần: serial, ticket, phone)           │ │
│  │  2. Build Context (product, warranty, history)             │ │
│  │  3. Generate Response (Gemini API / Fallback)              │ │
│  │  4. Add Suggestions (next actions)                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BOT RESPONSE                                │
│  { response, intent, confidence, suggestions, data }            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Quy tắc xử lý ngữ cảnh

### 10.1 Xử lý Serial
```
- Nếu user cung cấp serial: Kiểm tra và trả kết quả
- Nếu user chưa cung cấp: Hỏi xin serial + gợi ý cách tìm
- Nếu serial không tồn tại: Thông báo + gợi ý kiểm tra lại
```

### 10.2 Xử lý Mã phiếu
```
- Format hợp lệ (WR-YYYY-NNNN): Tra cứu và trả trạng thái
- Format không hợp lệ: Thông báo + hiển thị ví dụ
- Không có mã: Hỏi serial/phone để tìm
```

### 10.3 Xử lý Lỗi mơ hồ
```
- User mô tả lỗi nhưng chưa rõ: Gợi ý câu hỏi cụ thể
- Nhiều sản phẩm trùng tên: Liệt kê + hỏi chọn serial
- Không hiểu intent: Xin diễn đạt lại + gợi ý FAQ
```

---

## 11. Metrics & Success Criteria

| Metric | Target | Description |
|--------|--------|-------------|
| Intent Accuracy | > 85% | Tỷ lệ intent được phân loại đúng |
| Response Time | < 2s | Thời gian phản hồi trung bình |
| User Satisfaction | > 4/5 | Điểm đánh giá của người dùng |
| Fallback Rate | < 15% | Tỷ lệ cần fallback response |
| Ticket Creation | > 70% | Tỷ lệ hoàn tất tạo phiếu qua chat |

---

## 12. Trạng thái triển khai (Implementation Status)

Cập nhật: **29/10/2026**

### 12.1 Backend API

| Endpoint | Method | Mục đích | Trạng thái |
|----------|--------|----------|-----------|
| `/api/v1/ai/classify` | POST | Phân loại lỗi từ mô tả triệu chứng (US-005b) | ✅ Hoàn thành |
| `/api/v1/ai/warranty-history/{serial}` | GET | Tóm tắt lịch sử bảo hành (US-005c) | ✅ Hoàn thành |
| `/api/v1/ai/progress-message` | POST | Sinh tin nhắn cập nhật tiến độ (US-005d) | ✅ Hoàn thành |
| `/api/v1/ai/chat` | POST | Chatbot hội thoại — nhận diện intent + tra cứu DB | ✅ Hoàn thành |
| `/api/v1/ai/error-catalog` | GET | Danh mục 10 mã lỗi để frontend dựng bộ chọn | ✅ Hoàn thành |

### 12.2 Hợp đồng API (contract)

**`POST /ai/classify`** — trả về:

```json
{
  "classification": "water",
  "label": "Vào nước / Dính nước",
  "confidence": 0.56,
  "priority": "CRITICAL",
  "severity": "Nghiêm trọng",
  "warranty_eligible": false,
  "note": "Vào nước KHÔNG được bảo hành miễn phí...",
  "tags": ["RÚT ĐIỆN ngay...", "KHÔNG bật máy...", "..."],
  "suggestions": ["..."],
  "matched_keywords": ["dính nước"],
  "source": "rule"
}
```

**`POST /ai/chat`** — trả về:

```json
{
  "reply": "Câu trả lời dạng markdown",
  "intent": "warranty_check",
  "confidence": 0.81,
  "suggestions": ["Câu hỏi gợi ý tiếp theo", "..."],
  "source": "rule",
  "data": { "serial": "...", "product_name": "...", "within_warranty": "YES" }
}
```

`data` có thể chứa: thông tin sản phẩm (serial lookup), thông tin phiếu (ticket status),
kết quả phân loại lỗi (error classification), danh sách sản phẩm/phiếu.

### 12.3 Taxonomy lỗi (10 mã)

| Mã | Nhãn | Priority | Được BH miễn phí |
|----|------|----------|------------------|
| `screen_black` | Màn hình đen / Không lên nguồn | HIGH | ✅ |
| `screen_flicker` | Màn hình nhấp nháy / Sọc | MEDIUM | ✅ |
| `overheat` | Quá nhiệt / Tắt đột ngột | HIGH | ✅ |
| `keyboard` | Bàn phím / Phím không hoạt động | MEDIUM | ✅ |
| `audio` | Loa / Micro / Âm thanh | LOW | ✅ |
| `water` | Vào nước / Dính nước | CRITICAL | ❌ |
| `storage` | Ổ cứng / Lưu trữ | CRITICAL | ✅ |
| `battery` | Pin / Sạc | MEDIUM | ✅ |
| `software` | Lỗi phần mềm / Hệ điều hành | LOW | ❌ |
| `port` | Cổng kết nối | LOW | ✅ |

### 12.4 Intent đã hỗ trợ

`greeting`, `warranty_check`, `warranty_history`, `serial_lookup`, `ticket_status`,
`create_ticket`, `product_info`, `phone_lookup`, `faq_guide`, `faq_location`,
`faq_cost`, `faq_warranty_period`, `contact`, `complaint`, `feedback`, `thanks`,
`farewell`, `error_classification`, `unknown`.

### 12.5 Đặc tính kỹ thuật

- **Bỏ dấu khi so khớp**: người dùng gõ "bao hanh" (không dấu) vẫn khớp intent.
- **Ranh giới từ**: tránh false positive — "chi phí" không khớp nhầm intent `greeting` (keyword "hi").
- **Ưu tiên theo mức độ**: "dính nước không bật được" → `water` (không BH miễn phí), không phải `screen_black`.
- **Ẩn danh PII**: email / SĐT / CCCD bị thay thế trước khi xử lý.
- **Tenant isolation**: customer chỉ tra cứu được sản phẩm/phiếu của chính mình (403 nếu vi phạm).
- **Fallback**: `AI_MODE=mock` (rule-based) là mặc định. `AI_MODE=gemini` sẵn sàng tích hợp —
  hiện `classify_issue_gemini()` còn là placeholder, hệ thống tự fallback về rule.

### 12.6 Kiểm thử

- `tests/test_ai_endpoints.py` — 20 test cho 4 endpoint AI (contract, phân quyền, edge case).
- `tests/test_warranty.py` — test phân loại lỗi, intent, slot extraction, anonymize.

Kết quả: **87/87 test pass** (`pytest -q`).

---

*Document Version: 1.1*
*Last Updated: 29/10/2026*
*Author: AI Development Team*
