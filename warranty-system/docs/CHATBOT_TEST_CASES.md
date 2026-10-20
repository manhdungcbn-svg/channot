# BỘ CÂU HỎI TEST - AI CHATBOT BẢO HÀNH PRO

> **Phiên bản:** v1.0
> **Ngày tạo:** 2026-10-17
> **Mục đích:** Test intent classification và response generation

---

## 1. TEST INTENT CLASSIFICATION

### 1.1 Greetings (Chào hỏi)

| # | Input | Expected Intent | Test Case |
|---|-------|----------------|-----------|
| TC001 | "Xin chào" | `greeting` | Greeting cơ bản |
| TC002 | "Chào bạn" | `greeting` | Greeting thân mật |
| TC003 | "Hello" | `greeting` | Tiếng Anh |
| TC004 | "Hi there" | `greeting` | Tiếng Anh informal |
| TC005 | "Good morning" | `greeting` | Greeting theo thời gian |
| TC006 | "alo" | `greeting` | Viết tắt |
| TC007 | "Hey bot" | `greeting` | Với từ gọi |

### 1.2 Serial Lookup (Tra cứu serial)

| # | Input | Expected Intent | Serial Found |
|---|-------|----------------|--------------|
| TC101 | "Tra cứu serial TND-AC10-001" | `serial_lookup` | ✅ |
| TC102 | "Serial CAM-HI3519-002" | `serial_lookup` | ✅ |
| TC103 | "Tìm sản phẩm SW-DLK-003" | `serial_lookup` | ✅ |
| TC104 | "Lookup serial ABC123" | `serial_lookup` | ❌ |
| TC105 | "Search TND-AC10-001" | `serial_lookup` | ✅ |
| TC106 | "mã serial này TND-AC10-001" | `serial_lookup` | ✅ |
| TC107 | "Serial không tồn tại XXX999" | `serial_lookup` | ❌ |

### 1.3 Warranty Check (Kiểm tra bảo hành)

| # | Input | Expected Intent | Expected Response |
|---|-------|----------------|------------------|
| TC201 | "Sản phẩm này còn bảo hành không?" | `warranty_check` | Hỏi serial |
| TC202 | "Check warranty TND-AC10-001" | `warranty_check` | Kiểm tra + info |
| TC203 | "Bảo hành của tôi" | `warranty_check` | Hỏi serial |
| TC204 | "Còn hạn bảo hành không?" | `warranty_check` | Hỏi serial |
| TC205 | "Hết hạn chưa?" | `warranty_check` | Hỏi serial |
| TC206 | "Bao hanh con khong?" | `warranty_check` | Hỏi serial |

### 1.4 Create Ticket (Tạo phiếu bảo hành)

| # | Input | Expected Intent |
|---|-------|----------------|
| TC301 | "Tạo yêu cầu bảo hành" | `create_ticket` |
| TC302 | "Tôi muốn tạo phiếu" | `create_ticket` |
| TC303 | "Mới mua đã hỏng" | `create_ticket` |
| TC304 | "Create warranty request" | `create_ticket` |
| TC305 | "Làm sao để bảo hành?" | `create_ticket` |
| TC306 | "Tao phieu bao hanh" | `create_ticket` |

### 1.5 FAQ (Câu hỏi thường gặp)

| # | Input | Expected Intent |
|---|-------|----------------|
| TC401 | "Câu hỏi thường gặp" | `faq_general` |
| TC402 | "Hỏi về bảo hành" | `faq_general` |
| TC403 | "Làm sao để bảo hành?" | `create_ticket` hoặc `faq_general` |
| TC404 | "Chính sách bảo hành?" | `faq_general` |
| TC405 | "FAQ" | `faq_general` |
| TC406 | "Help me" | `faq_general` |

### 1.6 Shipping (Vận chuyển)

| # | Input | Expected Intent |
|---|-------|----------------|
| TC501 | "Vận chuyển như thế nào?" | `faq_shipping` |
| TC502 | "Giao hàng bao lâu?" | `faq_shipping` |
| TC503 | "Shipping policy" | `faq_shipping` |
| TC504 | "Nhận hàng ở đâu?" | `faq_shipping` |

### 1.7 Repair (Sửa chữa)

| # | Input | Expected Intent |
|---|-------|----------------|
| TC601 | "Sửa chữa như thế nào?" | `faq_repair` |
| TC602 | "Thay linh kiện có phí không?" | `faq_repair` |
| TC603 | "Repair cost" | `faq_repair` |
| TC604 | "Chi phí sửa" | `faq_repair` |

### 1.8 Escalation (Chuyển tiếp)

| # | Input | Expected Intent |
|---|-------|----------------|
| TC701 | "Tôi muốn khiếu nại" | `escalate` |
| TC702 | "Complaint" | `escalate` |
| TC703 | "Nói chuyện với quản lý" | `escalate` |
| TC704 | "Vấn đề nghiêm trọng" | `escalate` |

### 1.9 Thanks & Farewell

| # | Input | Expected Intent |
|---|-------|----------------|
| TC801 | "Cảm ơn" | `thanks` |
| TC802 | "Thank you" | `thanks` |
| TC803 | "Tạm biệt" | `farewell` |
| TC804 | "Bye" | `farewell` |

---

## 2. TEST SERIAL NUMBER PARSING

### 2.1 Valid Serials (Mock Data)

| Serial | Product Name | Warranty Status | Expected |
|--------|--------------|----------------|----------|
| `TND-AC10-001` | Router Tenda AC10 | ✅ Còn hạn (150 ngày) | Product info + warranty |
| `CAM-HI3519-002` | Camera Hikvision | ✅ Còn hạn (550 ngày) | Product info + warranty |
| `SW-DLK-003` | Switch D-Link | ❌ Hết hạn | Product info + expired warning |

### 2.2 Serial Format Patterns

| Pattern | Example | Valid |
|---------|---------|-------|
| `[PREFIX]-[CODE]-[NUM]` | TND-AC10-001 | ✅ |
| `[PREFIX][CODE][NUM]` | TNDFG123456 | ✅ |
| `[CODE]-[NUM]` | HI3519-002 | ✅ |
| `XXX999` | Not in system | ❌ |

### 2.3 Test Scenarios

```
Scenario 1: Valid serial in message
Input: "Tra cứu serial TND-AC10-001"
Expected: Bot finds product, shows info, asks for action

Scenario 2: Serial at start of message
Input: "TND-AC10-001 còn bảo hành không?"
Expected: Bot parses serial first, then intent

Scenario 3: Serial at end of message
Input: "Check warranty for TND-AC10-001"
Expected: Bot parses serial, checks warranty

Scenario 4: Multiple serials
Input: "So sánh TND-AC10-001 và CAM-HI3519-002"
Expected: Bot parses first serial, asks for clarification
```

---

## 3. TEST RESPONSE QUALITY

### 3.1 Response Format Checklist

```
□ Response có emoji phù hợp
□ Response có định dạng markdown (bold, list)
□ Response có suggestions phù hợp với context
□ Response không quá dài (>500 chars nên có tóm tắt)
□ Response không chứa PII (nếu test với PII input)
```

### 3.2 Test Response Templates

**Greeting Response:**
```
Expected Elements:
- Emoji 👋
- Tự giới thiệu là AI assistant
- Liệt kê 4 chức năng chính
- Có suggestions
```

**Serial Not Found Response:**
```
Expected Elements:
- Emoji ❌
- Thông báo không tìm thấy
- Gợi ý kiểm tra lại serial
- Mẹo tìm serial
- Suggestions: retry/register
```

**Warranty Check Response:**
```
Expected Elements:
- Product name
- Serial number
- Expiry date
- Days remaining
- Status (CÒN/HẾT HẠN)
- Next action suggestions
```

---

## 4. TEST PII ANONYMIZATION

### 4.1 PII Patterns to Test

| PII Type | Example Input | Expected Output |
|----------|--------------|----------------|
| Email | "Email tôi là test@gmail.com" | "... là [REDACTED_EMAIL]" |
| Phone VN | "SĐT 0901234567" | "SĐT [REDACTED_PHONE]" |
| Phone +84 | "+84901234567" | "[REDACTED_PHONE]" |
| CCCD 9 số | "CCCD 123456789" | "CCCD [REDACTED_ID]" |
| CCCD 12 số | "Số 123456789012" | "[REDACTED_ID]" hoặc giữ nguyên |

### 4.2 PII Test Scenarios

```
Scenario 1: Email in message
Input: "Tôi muốn bảo hành, email là minh.nguyen@email.com"
Expected: Email được thay bằng [REDACTED_EMAIL]
Note: Bot vẫn hiểu intent, không bị ảnh hưởng

Scenario 2: Phone in message
Input: "Liên hệ theo số 0901234567"
Expected: Phone được thay bằng [REDACTED_PHONE]

Scenario 3: Mix PII
Input: "Tên Nguyễn Văn A, email a@test.com, SĐT 0901234567"
Expected: Email và Phone được redact, tên giữ nguyên
```

---

## 5. INTEGRATION TEST SCENARIOS

### 5.1 Full Conversation Flow

```
Flow 1: Warranty Check Journey
═══════════════════════════════════════════════════════════════

Step 1: Greeting
User: "Xin chào"
Expected: Bot greets, shows main menu

Step 2: Select Lookup
User: clicks "Tra cứu serial"
Bot: Asks for serial number

Step 3: Enter Serial
User: "TND-AC10-001"
Expected: Bot shows product info, warranty status

Step 4: Check Warranty
User: "Còn bảo hành không?"
Bot: Shows warranty details, days remaining

Step 5: Create Ticket
User: clicks "Tạo yêu cầu BH"
Bot: Starts ticket creation flow

Step 6: End
User: "Cảm ơn"
Bot: Thanks, offers to help more
═══════════════════════════════════════════════════════════════
```

### 5.2 Error Flow

```
Flow 2: Invalid Serial Journey
═══════════════════════════════════════════════════════════════

Step 1: Lookup Serial
User: "Tra cứu serial ABC999"
Expected: Bot says not found

Step 2: Offer Alternatives
Bot: Suggests "Thử lại" or "Đăng ký mới"

Step 3: Try Again
User: "Thử lại"
Bot: Asks for serial again

Step 4: Success
User: "TND-AC10-001"
Expected: Bot shows product
═══════════════════════════════════════════════════════════════
```

### 5.3 Escalation Flow

```
Flow 3: Customer Complaint
═══════════════════════════════════════════════════════════════

Step 1: Customer expresses frustration
User: "Sản phẩm hỏng nhiều lần, tôi muốn khiếu nại"
Expected: Bot recognizes escalate intent

Step 2: Acknowledge
Bot: Shows empathy, explains escalation process

Step 3: Provide Contact Options
Bot: Shows hotline, email, working hours

Step 4: Confirm
Bot: Confirms customer wants to be transferred
═══════════════════════════════════════════════════════════════
```

---

## 6. PERFORMANCE TEST

### 6.1 Response Time Targets

| Action | Target | Acceptable |
|--------|--------|------------|
| Intent Classification | < 50ms | < 100ms |
| Serial Lookup | < 200ms | < 500ms |
| Full Response Generation | < 500ms | < 1000ms |
| UI Animation | 60fps | 30fps min |

### 6.2 Load Test Scenarios

```
Scenario 1: Single User
- Send 100 messages
- Measure average response time
- Check for errors

Scenario 2: Concurrent Users
- Simulate 10 concurrent users
- Each sends 10 messages
- Check response time degradation

Scenario 3: Long Conversation
- 50 messages in one session
- Check memory usage
- Check scroll performance
```

---

## 7. ACCESSIBILITY TEST

### 7.1 Keyboard Navigation

| Action | Key | Expected |
|--------|-----|----------|
| Focus input | Tab | Input focused |
| Send message | Enter | Message sent |
| Newline | Shift+Enter | New line in input |
| Navigate suggestions | Tab / Arrow | Move between suggestions |
| Select suggestion | Enter / Space | Activate suggestion |

### 7.2 Screen Reader

| Element | ARIA | Expected |
|---------|------|----------|
| Chat container | role="log" | Messages announced |
| Input | aria-label | Describes purpose |
| Send button | aria-label | "Gửi tin nhắn" |
| Suggestions | role="group" | Grouped announcements |

### 7.3 Reduced Motion

| Setting | Expected |
|---------|----------|
| prefers-reduced-motion: reduce | No sliding animations |
| prefers-reduced-motion: reduce | Instant transitions |
| prefers-reduced-motion: reduce | Typing dots still visible but no bounce |

---

## 8. QUICK TEST SCRIPT

Copy và paste các câu sau để test nhanh:

```
=== GREETING ===
"Xin chào"

=== SERIAL LOOKUP ===
"Tra cứu serial TND-AC10-001"
"Serial: CAM-HI3519-002"
"Check SW-DLK-003"

=== WARRANTY ===
"Còn bảo hành không?"
"Kiểm tra BH TND-AC10-001"

=== CREATE TICKET ===
"Tôi muốn tạo yêu cầu bảo hành"
"Làm sao để bảo hành?"

=== FAQ ===
"Câu hỏi thường gặp"
"Chính sách bảo hành?"
"Vận chuyển như thế nào?"

=== REPAIR ===
"Chi phí sửa chữa?"
"Thay linh kiện"

=== ESCALATION ===
"Tôi muốn khiếu nại"
"Nói chuyện với quản lý"

=== THANKS/FAREWELL ===
"Cảm ơn"
"Tạm biệt"

=== PII TEST ===
"Email tôi là test@gmail.com"
"SĐT 0901234567"
```

---

## 9. EXPECTED TEST RESULTS SHEET

| Test ID | Input | Expected | Actual | Pass/Fail | Notes |
|---------|-------|----------|--------|------------|-------|
| TC001 | "Xin chào" | greeting | | | |
| TC002 | "Chào bạn" | greeting | | | |
| TC101 | "Tra cứu TND-AC10-001" | serial_lookup | | | |
| TC102 | "CAM-HI3519-002" | serial_lookup | | | |
| TC103 | "SW-DLK-003" | serial_lookup | | | |
| TC201 | "Còn bảo hành không?" | warranty_check | | | |
| TC301 | "Tạo yêu cầu BH" | create_ticket | | | |
| TC401 | "FAQ" | faq_general | | | |
| TC701 | "Khiếu nại" | escalate | | | |
| TC801 | "Cảm ơn" | thanks | | | |
| TC802 | "Tạm biệt" | farewell | | | |

---

## 10. BUG REPORT TEMPLATE

```markdown
## Bug Report: [Short Description]

**Test Case ID:** TC___
**Date:** YYYY-MM-DD
**Tester:** [Name]

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior


### Actual Behavior


### Screenshot/Recording


### Severity
- [ ] Critical - Bot crashes or hangs
- [ ] High - Intent misclassified
- [ ] Medium - Response format issues
- [ ] Low - Minor UI issues

### Priority
- [ ] P0 - Must fix
- [ ] P1 - Should fix
- [ ] P2 - Nice to fix
```

---

**Document Version:** v1.0
**Last Updated:** 2026-10-17
