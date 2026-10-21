# BÁO CÁO TIẾN ĐỘ — BẢO HÀNH PRO

**Ngày lập báo cáo:** 2026-10-04
**Trạng thái:** `BLOCKED` — chờ duyệt diff cuối cùng
**Phạm vi:** 4 nhóm công việc theo chỉ thị (Supabase/frontend, `.gitignore`, gỡ tracking, rà soát bảo mật)

> Quy ước: mọi số liệu trong báo cáo này lấy từ lệnh chạy thực tế tại thời điểm kiểm tra, không chép lại từ tài liệu cũ.

---

## 1. Trạng thái tổng quan

| Nhóm | Nội dung | Trạng thái |
|---|---|---|
| 1 | Sửa lỗi Supabase + frontend (lazy-init) | **Đã hoàn thành trước đó** — xác minh lại bằng test thực tế |
| 2 | Cập nhật `.gitignore` | **Đã sửa trong phiên này** — 26/26 rule kiểm tra đúng |
| 3 | Gỡ tracking file nhạy cảm | **ĐÃ THỰC THI** — 4/4 path đã gỡ, file trên đĩa nguyên vẹn |
| 4 | Rà soát bảo mật + test + báo cáo | **Đã chạy** — 2 rủi ro P0, đã có kế hoạch rotate |

---

## 2. File đã sửa trong phiên này

### 2.1 `warranty-system/.gitignore` (sửa, chưa commit)

**Vấn đề phát hiện:** rule cũ dùng đối tượng chính xác `.env` và `.env.local`, nên các biến thể
`.env.production`, `.env.development.local`… **không bị ignore** — nguy cơ secret lọt vào Git.

**Thay đổi:**

| Trước | Sau |
|---|---|
| `.env` | `.env*` |
| `.env.local` | `!.env.example` (loại trừ) |
| — | `!.env.*.example` (loại trừ) |
| `*.db-bak` (rule cũ không đúng với tên file thực tế) | giữ nguyên nhóm rule DB |

Kèm sửa: thêm newline cuối file (file cũ thiếu, gây `\ No newline at end of file` trong diff).

### 2.2 `.gitignore` (mới, ở gốc repo)

Lý do: `warranty-frontend.log` và `temp/` nằm **ngoài** `warranty-system/`, nên `.gitignore` trong
thư mục con không áp dụng được.

Bỏ qua: `*.log`, `temp/`, `.pytest_cache/`, `__pycache__/`, `*.pyc`.
Không đụng tới mã nguồn/tài liệu của `warranty-system/`.

### 2.3 Nhóm 1 — không sửa code, chỉ xác minh

`frontend/src/services/supabase.js` và `Login.jsx` **đã có lazy-init đúng** từ trước:

- `createClient()` chỉ được gọi khi có đủ `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; thiếu thì trả `null`.
- App vẫn mount được vì không có throw lúc import module.
- Google Login: guard `if (!supabase)` + nút `disabled` + nhãn "Đăng nhập Google (chưa cấu hình)".
- Đăng nhập email/mật khẩu không đi qua Supabase nên không bị ảnh hưởng.

Grep toàn bộ `frontend/src` xác nhận: **chỉ `Login.jsx`** dùng client, không có chỗ nào khác
nhận giá trị `null` mà chưa guard. Grep secret backend trong `frontend/` → **không có kết quả**.

---

## 3. Test đã chạy (kèm kết quả thực tế)

Chạy lại sau khi gỡ tracking — tất cả vẫn xanh:

| Lệnh | Kết quả |
|---|---|
| `python -m pytest tests` (từ `warranty-system/backend/`) | **67/67 pass**, 0 fail, 0 skip — 61,14s |
| `node --test src/services/supabaseClientInit.test.js` (từ `frontend/`) | **8/8 pass**, 0 fail, 0 skip |
| `npm --prefix . run build` (từ `frontend/`) | **exit 0** — built in 33,21s, bundle 460,87 kB (gzip 130,38 kB) |
| `git diff --check` | Sạch — không lỗi whitespace, không conflict marker |
| `git diff --cached --name-only` | Đúng 4 path đã duyệt, không có file ngoài danh sách |

⚠️ Lưu ý cách chạy: phải chạy `pytest` **từ thư mục `warranty-system/backend/`**. Chạy từ gốc repo
sẽ báo `RuntimeError: Directory ... is not importable` (7 lỗi collection) — đây là lỗi đường dẫn
chứ không phải lỗi mã nguồn.

⚠️ Có 1 cảnh báo build (không phải lỗi): `api.js` vừa được import tĩnh vừa động → Vite không tách
chunk. Không ảnh hưởng hành vi.

---

## 4. Nhóm 3 — gỡ tracking (ĐÃ THỰC THI)

Đã chạy đủ 4 bước kiểm tra bắt buộc. **Chưa chạy `git rm --cached` theo đúng yêu cầu chờ duyệt.**

### 4.1 Xác minh bằng `git ls-files`

| Đường dẫn | Đang được Git track | Tình trạng trên đĩa |
|---|---|---|
| `warranty-system/backend/.env` | ✅ CÓ | Có, **đã sửa 3 dòng chưa commit** |
| `warranty-system/backend/warranty.db-wal` | ✅ CÓ | Có, binary đã thay đổi |
| `warranty-system/backend/warranty.db-shm` | ✅ CÓ | Có, chưa đổi |
| `warranty-system/backend/warranty.db.bak` | ✅ CÓ | Có, chưa đổi |
| `warranty-system/backend/warranty.db.bak.20261003_093733` | ❌ Không | Có, đã đúng bị ignore |

### 4.2 Xác minh `.gitignore` đã phù hợp (26/26 đúng)

Dùng `git check-ignore --no-index` (bỏ qua trạng thái track) trên 26 đường dẫn:

- **9/9 phải ignore** → đúng: `.env`, `.env.local`, `.env.production`, `.env.development.local`,
  `warranty.db`, `.db-wal`, `.db-shm`, `.db.bak`, `.db.bak.20261003_093733`
- **9/9 phải giữ** (đúng) → `.env.example`, `.env.production.example`, `config.py`, `conftest.py`,
  `docs/Work.md`, `docs/SECURITY_AUDIT.md`, `supabase.js`, `Login.jsx`, `supabaseClientInit.test.js`
- **4/4 file `.gitignore` root** → đúng; **4/4 file phải giữ** → đúng, không lo nhầm mã nguồn

### 4.3 Tác động khi gỡ tracking — **ĐÃ THỰC THI**

| Hành động | Tác động |
|---|---|
| `git rm --cached warranty-system/backend/.env` | File **vẫn còn trên đĩa** (294 bytes). 3 dòng sửa chưa commit **đã được sao lưu** vào `.env.local` trước đó. |
| `git rm --cached .../warranty.db-wal` | File còn (4.136.512 bytes). |
| `git rm --cached .../warranty.db-shm` | File vẫn còn. Nội dung SQLite không bị ảnh hưởng. |
| `git rm --cached .../warranty.db.bak` | File backup vẫn còn. **Bản backup cũ vẫn nằm trong Git history.** |

Không reset index, không rewrite history, không xóa dữ liệu vật lý.

**Xác minh sau khi gỡ:** `git ls-files` trả về rỗng cho cả 4 path; `git diff --cached --name-only`
liệt kê **đúng 4 file đã duyệt, không có file nào ngoài danh sách**; hash `.env` khớp với bản sao
lưu.

### 4.4 Bước sao lưu `.env` — ĐÃ HOÀN TẤT

`backend/.env.local` chưa tồn tại trước đó → dùng tên này (không cần tên dự phòng).
Sao chép xong xác minh bằng **SHA256 khớp byte-for-byte** (`54D4E9DC…D120`, 294 bytes, 5 dòng) và
`.env.local` đã bị `.gitignore` bắt (rule `.env*` dòng 20). Không in giá trị secret nào ra màn hình.

⚠️ **Lưu ý vận hành:** `app/core/config.py` đặt `env_file = ".env"` — **không** đọc `.env.local`.
Nên `.env.local` là **bản sao lưu dự phòng**, không phải file config thay thế. Ứng dụng vẫn chạy
bình thường vì `.env` được giữ nguyên trên đĩa.

---

## 5. Rủi ro bảo mật còn tồn tại

### 🔴 P0-1 — Secret đã nằm trong Git history

Quét chỉ đọc (`git log --all -S`), **không in giá trị**:

| Chìa khóa | Kết quả |
|---|---|
| `SECRET_KEY` | Có trong lịch sử, trong file `.env` |
| `GEMINI_API_KEY` | Có trong lịch sử, trong file `.env` |
| `SUPABASE_SERVICE_ROLE` | Không phát hiện |
| `VITE_SUPABASE_ANON_KEY` | Không phát hiện |

Tổng số commit trong history: **1**. Vì vậy bất kỳ thao tác xoá/sàng lọc lịch sử nào cũng tương
đương viết lại toàn bộ — **không thực hiện theo chỉ thị**.

**Hành động cần làm (P0, cần bạn duyệt) — kế hoạch rotate:**

**A. `SECRET_KEY`** — sinh giá trị mới, ưu tiên qua hệ thống quản lý secret:
1. Sinh key: `python -c "import secrets; print(secrets.token_urlsafe(64))"` (chạy trong venv, không commit).
2. Cấp giá trị mới qua biến môi trường / secret store, **không ghi trực tiếp vào file `.env` trên production**.
3. Cập nhật `.env` local (đã được bảo vệ) để chạy dev.
4. Triển khai: **mọi JWT đã cấp sẽ vô hiệu → toàn bộ user phải đăng nhập lại.** Cần thông báo trước.
5. Chạy lại `pytest tests` sau khi đổi — hiện **không cần sửa test** vì `tests/conftest.py` dùng
   `os.environ.setdefault("SECRET_KEY", "test_secret_for_pytest_only")`, tức test có secret riêng.
6. Nơi dùng: `app/core/config.py` (10), `app/core/security.py` (2), `app/services/ai_service.py` (1).

**B. `GEMINI_API_KEY`**:
1. Tạo key mới trong Google AI Studio (hoặc tương đương), thu hồi key cũ.
2. Cấp qua secret store, đặt vào biến môi trường.
3. **Hiện `AI_MODE=mock`** → key chưa được dùng, nên có thể thu hồi ngay mà không ảnh hưởng chức năng.
4. Khi chuyển `AI_MODE=gemini` sau này, phải dùng key mới.

Không thực hiện rotate trên production khi chưa có kế hoạch triển khai và xác nhận của bạn.

### 🟠 P0-2 — Remote có khả năng CAO là private (đã có bằng chứng)

`gh` CLI không được cài. Đã thử 3 cách, **không kết luận chỉ từ lỗi 404**:

| Bằng chứng | Kết quả | Suy ra |
|---|---|---|
| `git ls-remote origin` | ✅ Thành công, 4 refs | Repo tồn tại, tên đúng, credential hợp lệ |
| GitHub API `/repos/<owner>/<repo>` | 404 | Không trả JSON metadata cho request **không xác thực** |
| HTTP HEAD trang web repo | 404 | Trang không công khai |
| API `/users/<owner>/repos` | 200, trả về **3 repo** | Endpoint hoạt động; các repo này đều `private=False` |

Kết luận: 3 repo public của user đều hiện được qua API, còn repo này không → **repo này private**.
Danh sách refs cho thấy có cả `main`, `code-mới`, `manhdung`.

Tuy nhiên cần bạn xác nhận trực tiếp trên GitHub UI, vì API không xác thực không phải cách đáng
tin tuyệt đối để kết luận visibility. Nếu repo thực sự private thì mức độ nguy hiểm P0-1 giảm từ
"lộ công khai" xuống "lộ cho người có access", nhưng **vẫn phải rotate**.

### 🟡 P1 — `DATABASE_URL` là Supabase REST endpoint, không có mật khẩu DB

Phân tích cấu trúc (không in giá trị): scheme `https`, host `*.supabase.co`, path `/rest/v1/`,
**không có `@`**, không có query string → là endpoint REST kèm anon key, **không phải chuỗi
`user:password@host`**. Không có credential DB thật bị lộ. Nhưng endpoint này vẫn nằm trong `.env`
bị track → cần gỡ tracking.

### 🟡 P1 — File nhạy cảm khác vẫn còn trong index

`.env`, `.db-wal`, `.db-shm`, `.db.bak` đã **được gỡ tracking** trong phiên này. Tuy nhiên bản
backup cũ vẫn tồn tại trong history → cân nhắc xoá file backup khỏi đĩa (giữ ngoài repo) sau khi
xác nhận.

### 🔵 Khu vực `ECC/` — cần bạn quyết định

Đã kiểm tra trước khi đề xuất đưa vào Git:

| Tiêu chí | Kết quả |
|---|---|
| Có `.git` riêng | ✅ Có — là repo độc lập bị lồi vào thư mục gốc |
| Quy mô | **16.099 file / 237,4 MB** |
| Thư mục con | 86 mục |
| Nội dung | Công cụ/dự án khác (có `node_modules`, `typesript.js` 8,9 MB) |
| Secret | Chỉ thấy `.env.example` (không phải `.env` thật) |
| Số file đang untracked | 1 dòng (`ECC/`) — chưa file nào vào index repo chính |

**Khuyến nghị: KHÔNG đưa `ECC/` vào Git.** Nó là repo riêng, nặng 237 MB, không liên quan dự án
bảo hành. Nên thêm `ECC/` vào `.gitignore` gốc. Không xoá thư mục khỏi đĩa.

---

## 6. Danh sách file đề xuất đưa vào commit

### 6.1 Commit bảo mật (Nhóm 2 + 3)

```
.gitignore                                          (mới)
warranty-system/.gitignore                           (sửa)
```

### 6.2 Commit frontend (Nhóm 1)

```
warranty-system/frontend/src/services/supabaseClientInit.js        (mới)
warranty-system/frontend/src/services/supabaseClientInit.test.js   (mới)
warranty-system/frontend/src/services/supabase.js                  (sửa)
warranty-system/frontend/src/pages/Login.jsx                        (sửa)
```

## 7. Danh sách file BẮT BUỘC loại khỏi commit

| File | Lý do | Trạng thái |
|---|---|---|
| `warranty-system/backend/.env` | Chứa `SECRET_KEY` + `GEMINI_API_KEY` thật | ✅ **Đã gỡ tracking** — file còn trên đĩa |
| `warranty-system/backend/warranty.db-wal` | Dữ liệu SQLite nhị phân | ✅ **Đã gỡ tracking** — file còn trên đĩa |
| `warranty-system/backend/warranty.db-shm` | Dữ liệu SQLite nhị phân | ✅ **Đã gỡ tracking** — file còn trên đĩa |
| `warranty-system/backend/warranty.db.bak` | Bản backup database | ✅ **Đã gỡ tracking** — file còn trên đĩa |
| `warranty-system/backend/.env.local` | Bản sao lưu secret | ✅ Đã ignore (rule `.env*`) |
| `warranty-frontend.log` | Log runtime | ✅ Đã ignore |
| `temp/*.ps1` | Script phụ trợ | ✅ Đã ignore |
| `ECC/` | Repo riêng, 237 MB, ngoài phạm vi dự án | ⚠️ **Cần quyết định của bạn** — chưa ignore |

`warranty-system/backend/.env.example` **ĐƯỢC commit** — đã kiểm tra, không chứa giá trị thật
(`SECRET_KEY=`, `GEMINI_API_KEY=`, `DATABASE_URL` trỏ SQLite mặc định).

## 8. Kế hoạch rollback

| Thay đổi | Cách hoàn tác |
|---|---|
| `.gitignore` (2 file) | `git checkout -- <file>` hoặc `git restore` (chưa commit nên hoàn tác sạch) |
| Gỡ tracking 4 file | `git reset -- <đường_dẫn>` → file quay lại index, **giữ nguyên trên đĩa** |
| Rotate `SECRET_KEY` | **Không hoàn tác được** → cần triển khai có kế hoạch: thông báo user đăng nhập lại, dựng phiên bản cũ chỉ đọc nếu cần |
| Rotate `GEMINI_API_KEY` | Tạo key mới ở provider, trỏ `AI_MODE=gemini` sang key mới |

## 9. Việc chưa hoàn thành

- [x] Nhóm 3: đã chạy `git rm --cached` cho 4 path — file vẫn còn đầy đủ trên đĩa
- [x] Sao lưu `.env` → `.env.local`, xác minh SHA256 khớp byte-for-byte
- [ ] Chưa rotate `SECRET_KEY` (cần kế hoạch triển khai + xác nhận của bạn)
- [ ] Chưa rotate/thu hồi `GEMINI_API_KEY`
- [ ] Chưa xác nhận trực tiếp trên GitHub UI rằng repo là private
- [ ] Chưa quyết định xử lý thư mục `ECC/` (khuyến nghị: thêm vào `.gitignore` gốc)
- [ ] Chưa commit bất kỳ thay đổi nào — staged hiện chỉ có 4 file gỡ tracking

## 10. Trạng thái cuối

# `BLOCKED`

Lý do: đã hoàn thành Nhóm 1–3 và có kế hoạch rotate cho Nhóm 4, nhưng còn 2 việc P0 cần bạn
quyết (rotate secret, xác nhận remote) và 1 quyết định về `ECC/`. Chưa có diff cuối cùng để duyệt.
