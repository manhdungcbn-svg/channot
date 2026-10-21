# Hướng dẫn giao diện Trung tâm bảo hành Warrio

## 1. Tổng quan

Giao diện được thiết kế lại cho hệ thống quản lý bảo hành với các mục tiêu:

- Tập trung thông tin vận hành quan trọng trên một màn hình.
- Phân cấp thị giác rõ ràng, dễ quét dữ liệu.
- Hoạt động tốt trên máy tính, máy tính bảng và điện thoại.
- Có trạng thái tương tác thật để thuận tiện trình diễn và tiếp tục phát triển.
- Sử dụng phong cách trung tâm điều hành nền tối, phù hợp việc theo dõi liên tục.

## 2. Chạy dự án

Development server của Figma Make đã được khởi động sẵn. Nếu chạy dự án bên ngoài Figma Make:

```bash
pnpm install
pnpm dev
```

Tạo bản production:

```bash
pnpm build
```

## 3. Cấu trúc chính

- `src/App.tsx`: toàn bộ component, dữ liệu demo và logic tương tác.
- `src/index.css`: design tokens, style component và responsive breakpoint.
- `src/main.tsx`: entrypoint React.

## 4. Tương tác hiện có

- Nhấn logo Warrio ở góc trên bên trái để trở về trang Tổng quan.
- Nhấn nút **Menu** để mở danh mục Sản phẩm, Phiếu bảo hành, Tra cứu và Báo cáo.
- Tìm phiếu, khách hàng, sản phẩm hoặc số sê-ri.
- Mở bảng thông báo.
- Tạo phiếu bảo hành bằng modal.
- Tra cứu bảo hành và xem kết quả mẫu.
- Toast phản hồi khi thao tác.

## 5. Hệ thống thiết kế

### Màu chủ đạo

Các biến màu nằm ở đầu `src/index.css`:

```css
--navy: #0b1220;
--coral: #08a9e6;
--ink: #eef6ff;
--muted: #8190a6;
--line: #202d40;
--surface: #101927;
```

Nền xanh đen tạo cảm giác của một trung tâm điều hành chuyên nghiệp. Xanh lam sáng dùng cho thao tác chính, trạng thái đang chọn và dữ liệu cần chú ý.

### Typography

Giao diện sử dụng **Manrope** từ Google Fonts và có fallback `sans-serif`.

### Responsive

- Trên `1100px`: bảng điều khiển hiển thị bốn cột thống kê.
- Từ `960px`: thu gọn khu vực tài khoản để ưu tiên nội dung.
- Từ `700px`: danh mục mở toàn chiều rộng, tối ưu cho cảm ứng.
- Từ `480px`: số liệu chuyển thành một cột để dễ đọc.

## 6. Thay dữ liệu demo bằng API

Hiện dữ liệu `tickets` và `activity` nằm trong `src/App.tsx`. Khi nối backend:

1. Thay các hằng dữ liệu bằng state.
2. Gọi API trong `useEffect`.
3. Giữ nguyên shape dữ liệu đang dùng hoặc thêm adapter.
4. Bổ sung trạng thái loading, empty và error.

Ví dụ shape của phiếu:

```ts
{
  id: '#WR-2498',
  customer: 'Nguyễn Minh Anh',
  product: 'MacBook Air M3',
  serial: 'MBA-M3-8249',
  status: 'Đang xử lý',
  tone: 'amber',
  date: 'Hôm nay, 09:42'
}
```

## 7. Mở rộng đề xuất

- Tách `Menu`, `StatCard`, `TicketTable`, `Modal` thành component riêng khi nối API.
- Bổ sung React Router nếu mỗi menu cần URL độc lập.
- Tích hợp biểu đồ thật cho trang báo cáo.
- Thêm phân quyền cho quản trị viên, nhân viên và kỹ thuật viên.
- Kết nối thông báo thời gian thực và phân tích thông minh với hệ thống máy chủ.
