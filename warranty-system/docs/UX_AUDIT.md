# AUDIT UX/UI theo rule ECC — Warranty System Frontend

**Ngày tạo:** 2026-10-03 08:20
**Phạm vi:** `warranty-system/frontend/src/` — 12 pages + 17 components + 2 contexts + 1 service
**Stack thực tế (từ `frontend/package.json`):** React 18 + Vite 5 + Tailwind 3.4 + Framer Motion 11 + Supabase JS 2.117 + react-router-dom 6 + axios 1.6 — **KHÔNG có Zod** (rule TS ECC yêu cầu Zod)
**Quyết định thay thế Zod:** dùng validation tay (whitelist + length) hoặc PropTypes — KHÔNG cài lib mới vì AGENTS.md dự án cấm tự ý dùng thư viện ngoài `requirements.txt`/`package.json`.

## 1. Mapping rule ECC → file frontend

| Rule ECC (`common-*` + `typescript-*`) | Trạng thái áp dụng | File liên quan | Ghi chú |
|---|---|---|---|
| **Immutability** (spread, không mutate) | ❌ Nhiều vi phạm | `Dashboard.jsx`, `Tickets.jsx`, `Login.jsx` | Mutate trực tiếp `tickets.push(...)`, `Object.assign(ticket, ...)` |
| **File 200-400 dòng, max 800** | ❌ 5 file vượt | `Login.jsx` (~525), `Dashboard.jsx` (~558+), `TicketDetail.jsx` (cần đo), `Tickets.jsx` (cần đo), `Settings.jsx` (cần đo) | Phải tách file phụ |
| **Function <50 dòng** | ⚠️ Cần đo từng hàm | nhiều page | Một số `renderSection`, `buildStatusTimeline` có thể vượt |
| **Error handling** (try/catch + user-friendly) | ⚠️ Một phần | tất cả page gọi API | Đa số có try/catch nhưng error message thô (`err.message`) |
| **Input validation (schema)** | ⚠️ Yếu | `Login.jsx` (RegisterModal), `CreateTicket*` | Validation bằng if/if riêng lẻ, không có schema |
| **API Response envelope** `{success, data?, error?, meta?}` | ❌ Backend không theo envelope | `backend/app/api/v1/endpoints/*` | Trả trực tiếp data/raise HTTPException — rule TS chỉ áp dụng frontend, cần bọc lại ở axios interceptor |
| **Repository pattern** (`Repository<T>` interface) | ❌ Không có | `frontend/src/services/` | Hiện là `api.post(...)` rải rác |
| **Custom hooks** (`useDebounce` mẫu) | ❌ Không có hook debounce | `Tickets.jsx`, `Products.jsx` (search) | Có `useState` thường, debounce bằng setTimeout thủ công |
| **Console.log cấm** | ⚠️ Một số | nhiều file dev | Cần kiểm tra `git grep` toàn bộ |
| **No mutation (immutable patterns)** | ❌ Mutate trực tiếp | `Dashboard.jsx:STATUS_LABELS = {...}` tốt, nhưng `tickets.push()` xấu | |
| **File organization (feature/domain, not by type)** | ✅ Tốt | hiện tách `pages/`, `components/`, `context/`, `services/` | |

## 2. Vi phạm cụ thể (đếm từ file đã đọc)

### 2.1. `src/pages/Login.jsx` (~525 dòng) — **2 function trong 1 file**
- Function `RegisterModal` (~120 dòng, line 60-172) và `Login` (~350 dòng, line 175-518) nằm cùng file. Rule TS: file 200-400 dòng.
- Inline SVG: hàng chục `<svg>` lặp lại (EyeIcon 2 lần, button close nhiều lần, spinner nhiều lần) → tách `components/icons/`.
- Style inline (`style={{ ... }}`) hàng trăm chỗ — đã có CSS variables ở `index.css` nhưng vẫn hard-code color hex (`#1A3A6B`, `#0F1929`, `#FEE2E2`...) thay vì dùng `var(--color-primary)`.
- `setEmail('')`, `setPassword('')` sau lỗi (line 244-245) → **mutation** trải nghiệm xấu: xóa luôn email vừa nhập.
- RegisterModal không có cancel confirm; validation rời rạc (line 75-78).
- `DEVELOPER` object hard-code ở source (rule common-coding-style: "No hardcoded values").

### 2.2. `src/pages/Dashboard.jsx` (≥ 558 dòng) — **vượt rule**
- Khai báo lại `STATUS_LABELS`, `STATUS_COLORS` trùng với `frontend/src/config/statusConfig.js` (đã có `STATUSES` export). **Single source of truth bị phá**.
- 3 inner component `StatCard`, `StatusProgressBar`, … trộn trong 1 file → tách.
- Inline style tương tự Login.

### 2.3. `src/components/StatusBadge.jsx` (~165 dòng) — **OK về size, có vấn đề khác**
- Icon dictionary 11 icon inline (line 8-79) → có thể tách `components/icons/index.jsx`.
- `iconSize` map (line 110-117) trả cùng icon `clock` cho cả 3 size → **bug UI**, không rõ tác dụng.
- `getIcon()` có nhánh `type === 'priority'`/`type === 'status'`, các type khác (`warranty`, `payment`, `issue`) luôn trả null → không hiện icon.

### 2.4. `src/index.css` (~450 dòng) — **OK nhưng thừa**
- Có định nghĩa `.status-received`, `.status-inspection`, `.status-repairing`, `.status-completed`, `.status-rejected` (line 376-401) **trùng** với `.badge-success`/`.badge-info`/… → **DRY vi phạm**.
- Custom CSS button (`.btn-primary`, `.btn-secondary`…) **trùng** Tailwind utilities có sẵn (`bg-[var(--color-primary)]`).

## 3. Vi phạm hệ thống (chưa đọc nhưng nghi ngờ)

| File | Nghi vấn | Xác minh cần |
|---|---|---|
| `Tickets.jsx`, `TicketDetail.jsx`, `Settings.jsx` | file size | `wc -l` |
| `services/api.js`, `services/services.js` | thiếu axios interceptor trả `ApiResponse<T>` envelope | đọc |
| `context/AuthContext.jsx` | `localStorage.setItem('token')` mutation trực tiếp; không có refresh token | đọc |
| Tất cả page | `console.log/error` trong catch block | `rg "console\."` |
| `components/CreateTicket*` (6 file cho 1 form) | tách file quá nhỏ, mỗi file < 30 dòng → ngược rule (file 200-400) | đọc |

## 4. Tóm tắt ưu tiên

| # | Vấn đề | File | Mức độ | Sửa được trong 1 commit? |
|---|---|---|---|---|
| 1 | Status config duplicate | Dashboard.jsx ↔ statusConfig.js | Trung bình | ✅ |
| 2 | Login.jsx vượt 500 dòng (2 function) | Login.jsx | Trung bình | ✅ |
| 3 | Icon inline tràn lan (Login, StatusBadge) | Login.jsx, StatusBadge.jsx | Thấp | ✅ |
| 4 | CSS duplicate `.status-*` ↔ `.badge-*` | index.css | Thấp | ✅ |
| 5 | Thiếu custom hooks (debounce search) | Tickets/Products | Thấp | ⚠️ cần test |
| 6 | `console.log` còn sót | toàn bộ | Thấp | ⚠️ cần rg |
| 7 | Inline `style={{ color: '#1A3A6B' }}` thay vì CSS var | nhiều | Thấp | ⚠️ refactor lớn |
| 8 | `setEmail('')`, `setPassword('')` xóa dữ liệu khi lỗi | Login.jsx:244 | UX | ✅ |
| 9 | `DEVELOPER` hard-code | Login.jsx:60 | Thấp | ⚠️ cần env/config |
| 10 | RegisterModal không xác nhận trước khi đóng | Login.jsx | Thấp | ✅ |

## 5. Đề xuất roadmap (cần duyệt trước khi làm)

**Phase A — Surgical cleanup (low risk, 1 commit):**
1. Xóa `STATUS_LABELS`/`STATUS_COLORS` ở `Dashboard.jsx`, dùng `import { STATUSES } from '../config/statusConfig'`.
2. Tách `Login.jsx` → `Login.jsx` + `components/RegisterModal.jsx`.
3. Tách icon ra `components/icons/index.jsx` (`EyeIcon`, `SpinnerIcon`, `CloseIcon`).
4. Bỏ `setEmail('')`, `setPassword('')` khi lỗi (UX).
5. Thêm confirm trước khi đóng `RegisterModal` nếu form dirty.
6. Bỏ `.status-*` CSS duplicate (giữ `.badge-*`).

**Phase B — Hooks & validation (medium risk, 1 commit):**
7. Tạo `hooks/useDebounce.js` theo rule TS ECC.
8. Áp dụng vào search ở `Tickets.jsx` + `Products.jsx`.
9. Validate `RegisterModal` bằng object `validators` (thay vì if/if).

**Phase C — API envelope (cross-stack, 2 commits):**
10. Backend: wrap response thành `{success, data, error?, meta?}` (ảnh hưởng ~30 endpoint).
11. Frontend: axios interceptor unwrap + typed `ApiResponse<T>`.

**Phase D — Inline style → CSS vars (large, multi-commit):**
12. Thay `style={{ color: '#1A3A6B' }}` → `className="text-primary"` (cần mở rộng `tailwind.config.js`).

## 6. Trạng thái

| Hạng mục | Trạng thái |
|---|---|
| Audit Phase 1 (đọc 10 file) | ✅ Xong — 23 vi phạm |
| Phase A (surgical cleanup) | ✅ Xong 2026-10-03 09:10 |
| Phase B (useDebounce + validation) | ✅ Xong 2026-10-03 09:35 |
| **Phase A+** (LookupModal dedup) | ✅ Xong 2026-10-03 09:50 |
| **Phase D** (tách Dashboard) | ✅ Xong 2026-10-03 09:50 |
| **Phase C** (API envelope lỗi) | ✅ Xong 2026-10-03 10:20 |
| **Phase tồn đọng** (AuthContext safeJSON + tách Settings) | ✅ Xong 2026-10-03 10:50 |
| **Phase tồn đọng 2** (logout dùng useNavigate) | ✅ Xong 2026-10-03 11:00 |
| `pytest backend/tests` | ✅ 60/60 pass |
| `npm --prefix frontend run build` | ✅ pass (exit 0) |

### Phase A — kết quả cụ thể

| # | Hành động | File đã sửa | Kết quả |
|---|---|---|---|
| 1 | Dedup STATUS_COLORS/LABELS, dùng `getStatusConfig()` | `Tickets.jsx`, `TicketDetail.jsx` | Xóa 2× STATUS_LABELS + 2× STATUS_COLORS (60 dòng trùng) |
| 2 | Tách `RegisterModal` ra file riêng | `Login.jsx` 521 → ~360 dòng; `components/RegisterModal.jsx` ~245 dòng | OK |
| 3 | Tạo `components/icons.jsx` | `Login.jsx` (EyeIcon, SpinnerIcon, MailIcon, LockIcon, SearchIcon) | Tái sử dụng cho RegisterModal và sau này |
| 4 | Bỏ `setEmail('')`/`setPassword('')` khi login lỗi | `Login.jsx` | UX fix: giữ input khi lỗi mạng |
| 5 | Dùng `useNavigate()` thay `window.location.href` | `Tickets.jsx` | SPA đúng |
| 6 | Catch hiển thị `alert(detail)` thay `() => {}` | `Tickets.jsx`, `TicketDetail.jsx` | Không silent fail |
| 7 | Bỏ `.status-*` CSS trùng `.badge-*` | `index.css` | -25 dòng |
| 8 | Tách `StatusFlowSteps` component | `TicketDetail.jsx` | Fix lỗi hook-in-loop |
| 9 | Confirm trước khi đóng `RegisterModal` nếu form dirty | `RegisterModal.jsx` | Tránh mất dữ liệu |
| 10 | Aria-label cho icon button | `Login.jsx`, `RegisterModal.jsx` | Accessibility |

**Tổng:** 5 file sửa, 3 file mới (RegisterModal.jsx, icons.jsx), 1 file xóa (.status-* CSS), 1 hook sinh ra rồi xóa (đổi sang util fn).

### Phase B — kết quả cụ thể

| # | Hành động | File | Ghi chú |
|---|---|---|---|
| 1 | Tạo `hooks/useDebounce.js` (300ms, đúng spec TS ECC) | `hooks/useDebounce.js` 🆕 | Pattern chuẩn từ `typescript-patterns.md` |
| 2 | Áp dụng `useDebounce` + `useMemo` ở search | `Tickets.jsx`, `Products.jsx` | Giảm re-render khi gõ |
| 3 | Tạo `validators/registerValidators.js` (5 field: email, full_name, phone, password, confirm_password) | `validators/registerValidators.js` 🆕 | Thay thế Zod, không thêm lib |
| 4 | Refactor `RegisterModal` dùng `validateRegister(form)` | `RegisterModal.jsx` | Validation tập trung, dễ test |

**Tổng Phase B:** 2 file mới, 3 file sửa.

**Lưu ý:**
- `useDebounce` 300ms áp dụng cho 2 local-filter search (Tickets, Products). `Step1Customer` không thay đổi vì user nhấn Enter mới search (pattern rõ ràng).
- Validator thêm 3 rule mới so với code cũ: regex email, regex phone, full_name ≥ 2 ký tự. Cần test thủ công form đăng ký.

### Phase A+ — kết quả

| # | Hành động | File | Ghi chú |
|---|---|---|---|
| 1 | Xóa `STATUS_LABELS`/`STATUS_COLORS` inline | `LookupModal.jsx` | Dùng `getStatusConfig()` + `StatusPill` |
| 2 | `ProgressTracker` dùng `Object.keys(STATUSES)` thay hardcode | `LookupModal.jsx` | Tự động theo config |

### Phase D — kết quả

| # | Hành động | File | Ghi chú |
|---|---|---|---|
| 1 | Tách `StatCard` | `components/dashboard/StatCard.jsx` 🆕 | ~25 dòng |
| 2 | Tách `StatusProgressBar` | `components/dashboard/StatusProgressBar.jsx` 🆕 | ~50 dòng |
| 3 | Tách `QuickActions` (dùng `useNavigate`) | `components/dashboard/QuickActions.jsx` 🆕 | ~100 dòng |
| 4 | Tách `AIWidget` | `components/dashboard/AIWidget.jsx` 🆕 | ~110 dòng |
| 5 | Tách `ActivityLog` (dùng `getStatusConfig`) | `components/dashboard/ActivityLog.jsx` 🆕 | ~95 dòng |
| 6 | Tạo `components/dashboard/index.js` | 🆕 | Re-export |
| 7 | Refactor `Dashboard.jsx` | 595 → ~330 dòng | OK < 400 rule |
| 8 | `Dashboard` xài `useNavigate` thay `window.location.href` | `Dashboard.jsx` | SPA đúng |
| 9 | `Dashboard` hiển thị lỗi qua `alert` thay `catch(()=>{})` | `Dashboard.jsx` | Không silent fail |
| 10 | Sửa bug `load()` ở onCreated (gọi hàm không tồn tại) | `Dashboard.jsx` | Trước: gọi ngoài scope |

**Tổng Phase D:** 5 file mới, 1 file sửa (Dashboard 595→330 dòng, 3 component skeleton tách nhỏ).

### Phase C — kết quả

| # | Hành động | File | Ghi chú |
|---|---|---|---|
| 1 | Tạo `app/core/response.py` (`error_envelope` + `success_envelope`) | 🆕 backend | Helper envelope |
| 2 | Thêm `http_exception_handler` wrap mọi HTTPException | `backend/app/main.py` | Lỗi giờ trả `{success:false, error:{message, code}}` |
| 3 | Thêm `unhandled_exception_handler` 500 an toàn | `backend/app/main.py` | Tránh trả HTML stack trace |
| 4 | Axios interceptor unwrap lỗi: gán `err.response.data.detail = error.message` | `frontend/src/services/api.js` | **Tương thích ngược** — 10+ call site KHÔNG cần sửa |
| 5 | Update `conftest.py` ép `DATABASE_URL=sqlite` cho test | `backend/tests/conftest.py` | Trước đây fail vì `.env` trỏ Supabase |
| 6 | Update test `test_login_lockout_message_contains_remaining_seconds` check `error.message` thay `detail` | `backend/tests/test_login_lockout.py` | 1 test |

**Tổng Phase C:** 2 file mới, 4 file sửa. **60/60 test pass.**

### Lưu ý Phase C

- **Chỉ wrap response lỗi** (HTTPException + Exception), KHÔNG wrap response 200.
- Lý do: response 200 đang được 30+ call site frontend dùng `r.data` trực tiếp; nếu wrap thành `{success, data}` thì phải đổi tất cả thành `r.data.data` → nguy cơ regression cao.
- Nếu sau này muốn wrap cả 200: dùng `success_envelope()` có sẵn trong `core/response.py`, đồng thời sửa 10+ call site, chạy lại toàn bộ test.
- Frontend interceptor: nếu backend chưa wrap (cũ), interceptor không làm gì → tương thích ngược 100%.

### Tổng kết 4 phase

| Phase | File mới | File sửa | File xóa | Dòng thay đổi |
|---|---|---|---|---|
| A | 2 | 5 | 0 | ~250 |
| B | 2 | 3 | 0 | ~120 |
| A+ | 0 | 1 | 0 | ~30 |
| D | 6 | 1 | 0 | ~700 (tách) |
| C | 2 | 4 | 0 | ~80 |
| **Tổng** | **12** | **14** | **0** | ~1180 |

### Tồn đọng (ban đầu)

1. `AuthContext.jsx`: vẫn dùng `JSON.parse` không try/catch, `window.location.href` thay `useNavigate` (cần refactor Provider).
2. `Settings.jsx`: 430 dòng → vẫn vượt nhẹ rule 400.
3. Phase wrap response 200 (nếu muốn thống nhất hoàn toàn).
4. Repository pattern refactor cho `services/services.js`.

### Tồn đọng (sau Phase tồn đọng)

**Đã xử lý 1+2:**

| # | Hành động | File | Ghi chú |
|---|---|---|---|
| 1 | Tạo helper `safeJSON(raw, fallback)` | `context/AuthContext.jsx` | Init state dùng safe parse |
| 2 | Tách `ProfileTab` | `components/settings/ProfileTab.jsx` 🆕 | ~120 dòng |
| 3 | Tách `AvatarUpload` | `components/settings/AvatarUpload.jsx` 🆕 | ~95 dòng |
| 4 | Tách `PasswordChangeTab` + 2 sub-form (ResetCodeForm, VerifyCodeForm, SuccessView) | `components/settings/PasswordChangeTab.jsx` 🆕 | ~180 dòng |
| 5 | Tạo `components/settings/index.js` | 🆕 | Re-export |
| 6 | Refactor `Settings.jsx` | 430 → ~95 dòng | Tab navigation + page header |

**Tổng Phase tồn đọng:** 4 file mới, 2 file sửa.

**Còn lại:**
- Phase wrap response 200 (bỏ qua — rủi ro cao không cần thiết).
- Repository pattern refactor (bỏ qua — `services.js` chỉ 60 dòng, mỗi service đã là object rõ ràng, refactor là over-engineering).
- `window.location.href` ở `Products.jsx`/`Customers.jsx` (~5 chỗ): dùng `useNavigate` thay thế — chưa sửa vì nằm ngoài scope cleanup.
- `api.js:42` (401 redirect): giữ `window.location.href` (đúng — React state đã mất).

### Phase A — không làm (ghi nhận)

- `AuthContext.jsx`: vẫn dùng `JSON.parse` không try/catch, `window.location.href` thay `useNavigate` (là ở `AuthProvider`, không có access `useNavigate` → cần refactor; để Phase sau).
- `LookupModal.jsx`: vẫn còn STATUS_LABELS inline → có thể Phase A+ nếu bạn duyệt.
- `Dashboard.jsx`: vẫn 558+ dòng, 3 component lồng → để Phase D.
- `Settings.jsx`: 430 dòng → để Phase D.

### Build verify

```
npm --prefix frontend run build
✓ 250 modules transformed.
dist/index.html                   0.58 kB
dist/assets/index-CE_uUZaC.css   26.60 kB
dist/assets/index-DtzsiEpM.js   685.85 kB
✓ built in 23.57s
```

### Cảnh báo tồn đọng

1. Warning `api.js` bị dynamic-import bởi RegisterModal/Login nhưng static-import bởi các file khác → không ảnh hưởng, có sẵn từ trước.
2. `LookupModal.jsx` vẫn còn inline `STATUS_LABELS` — chưa sửa.
3. `AuthContext.jsx` có `JSON.parse` không try/catch.

## 7. Câu hỏi cần bạn quyết

1. **Tiếp Phase A+ (LookupModal)** — dedup STATUS ở file cuối cùng?
2. **Phase B** (useDebounce + validation)? 
3. **Phase D** (tách Dashboard, Settings xuống < 400 dòng)?