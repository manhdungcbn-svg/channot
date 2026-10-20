# User Story: Tích hợp VNPay cho Ví điện tử

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Thông tin API](#2-thông-tin-api-vnpay)
3. [User Story: Nạp tiền qua QR](#3-user-story-nạp-tiền-qua-qr)
4. [User Story: Webhook xác nhận thanh toán](#4-user-story-webhook-xác-nhận-thanh-toán)
5. [Bảng API Endpoints](#5-bảng-api-endpoints)
6. [Luồng xử lý](#6-luồng-xử-lý)
7. [Test Cases](#7-test-cases)

---

## 1. Tổng quan

### Mục tiêu
Tích hợp VNPay vào hệ thống ví điện tử để cho phép người dùng nạp tiền qua QR Code thanh toán ngân hàng.

### Phạm vi
- Tạo QR Code thanh toán VNPay
- Xác nhận thanh toán qua webhook
- Cộng tiền vào ví khi thanh toán thành công
- Hiển thị QR trên frontend
- Xử lý lỗi và timeout

### Người dùng mục tiêu
- Khách hàng có tài khoản trong hệ thống bảo hành
- Người dùng muốn nạp tiền vào ví để thanh toán dịch vụ

### Dependencies
- Backend FastAPI đã có sẵn wallet module
- Frontend React đã có trang Wallet.jsx
- Cần cài thư viện `pycryptodome` cho mã hóa

---

## 2. Thông tin API VNPay

### Production Credentials
```
Client ID:       4bb8dc72-dab4-4461-b948-68be413480fd
API Key:         aeab660f-2d60-4f69-b871-de9641db9b9a
Checksum Key:    8e16554fbad0fcac2323104032c385b393cdcc7a27278daee9530b7acfbcebee
```

### Environment
- [x] Sandbox: https://sandbox.vnpayment.vn/apis
- [ ] Production: https://classic.vnpayment.vn/apis

### API Base URLs
```
VNPay API:       https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPay Return:    https://sandbox.vnpayment.vn/merchant_webapi/return
```

---

## 3. User Story: Nạp tiền qua QR

### 💰 US-W001: Tạo yêu cầu nạp tiền VNPay

**Như một** khách hàng  
**Tôi muốn** nạp tiền vào ví bằng cách quét mã QR VNPay  
**Để** thanh toán qua ngân hàng một cách nhanh chóng và an toàn

#### Mô tả chi tiết:

**Luồng chính (Happy Path):**
1. User mở trang Ví điện tử
2. User bấm nút "Nạp tiền"
3. User chọn số tiền hoặc nhập số tiền tùy ý
4. User bấm "Tạo QR"
5. Hệ thống gọi API tạo QR VNPay
6. Màn hình hiển thị QR Code và đếm ngược thời gian (15 phút)
7. User mở app ngân hàng quét QR
8. User xác nhận thanh toán trên app ngân hàng
9. VNPay gọi webhook báo thanh toán thành công
10. Hệ thống cộng tiền vào ví
11. User nhận thông báo thành công

**Luồng phụ (Timeout):**
- Nếu user không thanh toán trong 15 phút → QR hết hạn
- User có thể tạo QR mới

**Luồng phụ (Thanh toán thất bại):**
- Nếu thanh toán bị từ chối → Không cộng tiền
- User nhận thông báo lỗi

---

### 📋 US-W002: Theo dõi trạng thái thanh toán

**Như một** khách hàng  
**Tôi muốn** biết trạng thái thanh toán đang chờ xử lý  
**Để** yên tâm chờ đợi hoặc tạo QR mới nếu cần

#### Mô tả:
- Sau khi tạo QR, hiển thị trạng thái "Đang chờ thanh toán"
- Có nút "Hủy" để hủy giao dịch đang chờ
- Auto-refresh trạng thái mỗi 5 giây (polling)
- Khi nhận webhook → Cập nhật trạng thái real-time

---

### 📊 US-W003: Xem lịch sử giao dịch nạp tiền

**Như một** khách hàng  
**Tôi muốn** xem lịch sử các lần nạp tiền qua VNPay  
**Để** đối soát và kiểm tra

#### Thông tin hiển thị:
- Mã giao dịch VNPay (vnp_TransactionNo)
- Số tiền nạp
- Ngày giờ thanh toán
- Trạng thái (Thành công/Thất bại/Hết hạn)
- Phương thức thanh toán

---

## 4. User Story: Webhook xác nhận thanh toán

### 🔔 US-W004: VNPay gọi webhook xác nhận

**Như một** hệ thống VNPay  
**Tôi muốn** gọi webhook của hệ thống khi có thanh toán  
**Để** thông báo trạng thái giao dịch cho hệ thống

#### Request Format:
```
POST /api/v1/wallet/vnpay/webhook
Content-Type: application/x-www-form-urlencoded

vnp_Amount=50000000
vnp_BankCode=NCB
vnp_BankTranNo=20261020123456
vnp_CardType=ATM
vnp_OrderInfo=Nạp+tiền+ví+admin@warranty.vn
vnp_PayDate=20261020123456
vnp_ResponseCode=00
vnp_TmnCode=4bb8dc72-dab4-4461-b948-68be413480fd
vnp_TransactionNo=12345678
vnp_TransactionStatus=00
vnp_TxnRef=TOPUP-20261020123456-abc123
vnp_VnpayDate=20261020123456
vnp_SecureHash=xxxxxxx
```

#### Response Format:
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

#### Mã phản hồi:
| RspCode | Ý nghĩa |
|---------|----------|
| 00 | Thành công - Đã xác nhận |
| 01 | Mã đơn hàng không tồn tại |
| 02 | Sai checksum |
| 03 | Lỗi dữ liệu |
| 04 | Mã giao dịch đã được xử lý trước đó |
| 99 | Lỗi khác |

---

## 5. Bảng API Endpoints

### Backend API (FastAPI)

| Method | Endpoint | Mô tả | Request Body | Response |
|--------|----------|--------|--------------|----------|
| POST | `/api/v1/wallet/vnpay/create` | Tạo QR thanh toán | `{amount, email}` | `{qr_url, txn_ref, expires_at}` |
| GET | `/api/v1/wallet/vnpay/status/{txn_ref}` | Kiểm tra trạng thái | - | `{status, amount, paid_at}` |
| POST | `/api/v1/wallet/vnpay/webhook` | Nhận webhook VNPay | Form data | `{RspCode, Message}` |
| POST | `/api/v1/wallet/vnpay/cancel/{txn_ref}` | Hủy giao dịch | - | `{success}` |
| GET | `/api/v1/wallet/vnpay/history` | Lịch sử giao dịch VNPay | - | `{transactions: [...]}` |

### Frontend API Calls

| Function | API Called | Mô tả |
|----------|------------|--------|
| `createVNPayQR(amount)` | POST `/vnpay/create` | Tạo QR |
| `checkPaymentStatus(txnRef)` | GET `/vnpay/status/{txnRef}` | Kiểm tra trạng thái (polling) |
| `cancelPayment(txnRef)` | POST `/vnpay/cancel/{txnRef}` | Hủy giao dịch |
| `getVNPayHistory()` | GET `/vnpay/history` | Lấy lịch sử |

---

## 6. Luồng xử lý

### Luồng tạo QR và thanh toán

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   VNPay     │────▶│   Bank App  │
│  User bấm  │     │  Tạo QR     │     │   Server    │     │  Quét QR    │
│  Nạp tiền  │     │  PaymentURL │     │             │     │  Thanh toán │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │◀────│   Backend   │◀────│   VNPay     │◀────│   Bank App  │
│  Hiển thị  │     │  Cộng tiền  │     │  Webhook    │     │  Xác nhận   │
│  Thành công│     │  vào ví     │     │  Gọi về     │     │  Thanh toán │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Chi tiết từng bước

#### Bước 1-3: User tạo yêu cầu nạp tiền
```
Frontend                      Backend
   │                              │
   │──POST /vnpay/create──────────▶│
   │  {amount: 500000, email}      │
   │                              │ Generate txn_ref: TOPUP-{timestamp}-{random}
   │                              │ Create payment URL with VNPay params
   │                              │ Save pending transaction to DB
   │                              │
   │◀─201 Created─────────────────│
   │  {txn_ref, payment_url,      │
   │   expires_at}                │
```

#### Bước 4-6: User quét QR và thanh toán
```
VNPay                         Backend
   │                              │
   │──GET /return?───────────────▶│ (Optional: VNPay redirect user back)
   │                              │
   │                              │
```

#### Bước 7-9: VNPay gọi webhook
```
VNPay                         Backend
   │                              │
   │──POST /webhook──────────────▶│
   │  vnp_ResponseCode=00         │
   │  vnp_TransactionStatus=00    │
   │                              │ 1. Verify checksum
   │                              │ 2. Find pending transaction
   │                              │ 3. Update status = completed
   │                              │ 4. Add balance to wallet
   │                              │ 5. Create transaction record
   │                              │
   │◀─200 {RspCode: "00"}─────────│
```

---

## 7. Test Cases

### TC-001: Tạo QR thành công
```
Input:  amount=500000, email=admin@warranty.vn
Output: 
  - Status: 201 Created
  - Body: {
      txn_ref: "TOPUP-20261020-abc123",
      payment_url: "https://sandbox.vnpayment.vn/...?...",
      expires_at: "2026-10-20T15:30:00"
    }
```

### TC-002: Tạo QR với số tiền không hợp lệ
```
Input:  amount=0, email=admin@warranty.vn
Output:
  - Status: 400 Bad Request
  - Body: {detail: "Số tiền phải lớn hơn 0"}
```

### TC-003: Tạo QR với số tiền quá nhỏ
```
Input:  amount=1000, email=admin@warranty.vn
Output:
  - Status: 400 Bad Request
  - Body: {detail: "Số tiền tối thiểu là 10,000 VND"}
```

### TC-004: Tạo QR với số tiền quá lớn
```
Input:  amount=100000000, email=admin@warranty.vn
Output:
  - Status: 400 Bad Request
  - Body: {detail: "Số tiền tối đa là 50,000,000 VND mỗi lần"}
```

### TC-005: Webhook với mã thành công
```
Input:  vnp_ResponseCode=00, vnp_TransactionStatus=00
Output:
  - Status: 200 OK
  - Body: {RspCode: "00", Message: "Confirm Success"}
  - Side effect: Balance added to wallet
```

### TC-006: Webhook với mã lỗi
```
Input:  vnp_ResponseCode=24, vnp_TransactionStatus=24
Output:
  - Status: 200 OK
  - Body: {RspCode: "00", Message: "Confirm Success"}
  - Side effect: Transaction marked as failed, no balance added
```

### TC-007: Webhook với checksum sai
```
Input:  Invalid vnp_SecureHash
Output:
  - Status: 200 OK
  - Body: {RspCode: "02", Message: "Invalid checksum"}
  - Side effect: No changes to database
```

### TC-008: Kiểm tra trạng thái giao dịch đang chờ
```
Input:  txn_ref = pending transaction
Output:
  - Status: 200 OK
  - Body: {
      status: "pending",
      amount: 500000,
      created_at: "2026-10-20T15:00:00",
      expires_at: "2026-10-20T15:15:00"
    }
```

### TC-009: Kiểm tra trạng thái giao dịch đã hoàn tất
```
Input:  txn_ref = completed transaction
Output:
  - Status: 200 OK
  - Body: {
      status: "completed",
      amount: 500000,
      paid_at: "2026-10-20T15:05:00",
      vnp_TransactionNo: "12345678"
    }
```

### TC-010: Kiểm tra trạng thái giao dịch đã hết hạn
```
Input:  txn_ref = expired transaction
Output:
  - Status: 200 OK
  - Body: {
      status: "expired",
      amount: 500000,
      created_at: "2026-10-20T15:00:00",
      expired_at: "2026-10-20T15:15:00"
    }
```

---

## 8. Error Handling

### Bảng mã lỗi

| Error Code | HTTP Status | Mô tả | Xử lý |
|------------|-------------|--------|--------|
| `INVALID_AMOUNT` | 400 | Số tiền không hợp lệ | Yêu cầu nhập lại |
| `MIN_AMOUNT` | 400 | Số tiền nhỏ hơn tối thiểu | Thông báo min = 10,000 |
| `MAX_AMOUNT` | 400 | Số tiền vượt tối đa | Thông báo max = 50,000,000 |
| `INVALID_EMAIL` | 400 | Email không tồn tại | Yêu cầu đăng nhập lại |
| `TXN_NOT_FOUND` | 404 | Không tìm thấy giao dịch | Thông báo lỗi |
| `TXN_EXPIRED` | 400 | Giao dịch đã hết hạn | Gợi ý tạo mới |
| `TXN_ALREADY_PAID` | 400 | Đã thanh toán rồi | Hiển thị thông tin |
| `WEBHOOK_INVALID` | 200 | Webhook không hợp lệ | Log và trả lỗi |
| `CHECKSUM_FAILED` | 200 | Checksum không đúng | Log và bỏ qua |
| `VNPAY_ERROR` | 502 | Lỗi từ VNPay | Retry hoặc thông báo |

---

## 9. Security

### Checksum Verification
```
Input: vnp_SecureHash = HMAC_SHA512(vnp_SecureHash, ChecksumKey)

Backend verify:
1. Extract all vnp_* params (except vnp_SecureHash)
2. Sort by key alphabetically
3. Build query string: key1=value1&key2=value2&...
4. Calculate HMAC_SHA512 with ChecksumKey
5. Compare with vnp_SecureHash
```

### Rate Limiting
- Tạo QR: 10 requests/phút/user
- Kiểm tra trạng thái: 60 requests/phút/user
- Webhook: Không giới hạn (VNPay IP whitelist)

### Data Validation
- Amount: Integer, 10000-50000000
- Email: Valid email format
- TxnRef: UUID format

---

## 10. Configuration

### Environment Variables
```
VNPAY_CLIENT_ID=4bb8dc72-dab4-4461-b948-68be413480fd
VNPAY_API_KEY=aeab660f-2d60-4f69-b871-de9641db9b9a
VNPAY_CHECKSUM_KEY=8e16554fbad0fcac2323104032c385b393cdcc7a27278daee9530b7acfbcebee
VNPAY_BASE_URL=https://sandbox.vnpayment.vn/apis
VNPAY_RETURN_URL=http://localhost:5173/wallet?payment=success
VNPAY_WEBHOOK_URL=http://localhost:8000/api/v1/wallet/vnpay/webhook
VNPAY_TMN_CODE=4bb8dc72-dab4-4461-b948-68be413480fd
```

### Limits
```
MIN_AMOUNT=10000      # 10,000 VND
MAX_AMOUNT=50000000   # 50,000,000 VND
QR_EXPIRE_MINUTES=15  # 15 phút
POLL_INTERVAL=5000    # 5 giây
```

---

## 11. Acceptance Criteria

### AC-001: Tạo QR thành công
- [ ] User có thể nhập số tiền (10,000 - 50,000,000 VND)
- [ ] QR Code hiển thị đúng với thông tin thanh toán
- [ ] QR có thời hạn 15 phút
- [ ] Có hiển thị đếm ngược thời gian

### AC-002: Thanh toán thành công
- [ ] Khi user thanh toán, webhook được gọi
- [ ] Số dư ví được cộng đúng số tiền
- [ ] Transaction history được ghi nhận

### AC-003: Xử lý lỗi
- [ ] Thanh toán thất bại không cộng tiền
- [ ] QR hết hạn không cho phép thanh toán
- [ ] Checksum không hợp lệ bị từ chối

### AC-004: UI/UX
- [ ] Modal hiển thị QR rõ ràng, dễ quét
- [ ] Có nút hủy giao dịch
- [ ] Thông báo thành công/rất bại rõ ràng

---

## 12. File Structure

```
warranty-system/
├── backend/
│   └── app/
│       ├── api/
│       │   └── v1/
│       │       └── endpoints/
│       │           └── vnpay.py          # API endpoints
│       └── services/
│           └── vnpay_service.py           # VNPay business logic
│       └── models/
│           └── vnpay_transaction.py      # Database model
│       └── config.py                     # Configuration
│       └── main.py                       # Add router
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── VNPayQRModal.jsx          # QR Modal component
│       ├── pages/
│       │   └── Wallet.jsx                # Update existing
│       └── api/
│           └── vnpay.js                   # API client
│
├── docs/
│   └── user-stories/
│       └── VNPAY-WALLET-USER-STORIES.md  # This file
│
└── .env.example                          # Environment template
```

---

## 13. Implementation Priority

| Priority | Task | Estimated Time |
|----------|------|----------------|
| P0 | Backend: Tạo endpoint tạo QR | 2h |
| P0 | Backend: Xử lý webhook | 2h |
| P0 | Frontend: Hiển thị QR Modal | 2h |
| P1 | Backend: Kiểm tra trạng thái | 1h |
| P1 | Frontend: Polling trạng thái | 1h |
| P2 | Backend: Hủy giao dịch | 1h |
| P2 | Frontend: Lịch sử VNPay | 1h |

---

*Document Version: 1.0*  
*Last Updated: 20/10/2026*  
*Author: AI Development Team*
