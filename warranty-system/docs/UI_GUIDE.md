# Hướng Dẫn Thiết Kế Giao Diện Dashboard - BảoHành Pro

## 1. Màu Sắc (Color System)

### Color Palette cho Dark Theme
```css
:root {
  /* Backgrounds - Dark Theme */
  --bg-primary: #0a0a0f;      /* Nền chính */
  --bg-secondary: #111118;     /* Cards */
  --bg-tertiary: #1a1a24;     /* Hover states */
  --bg-glass: rgba(17, 17, 24, 0.8); /* Glassmorphism */
  
  /* Accent Colors */
  --cyan-glow: #00d4ff;       /* Tương tác chính - Primary */
  --electric-purple: #8b5cf6; /* Highlights - Secondary */
  
  /* Status Colors */
  --success: #10b981;         /* Xanh - Thành công */
  --warning: #f59e0b;         /* Vàng - Cảnh báo */
  --error: #ef4444;           /* Đỏ - Lỗi */
  --info: #3b82f6;            /* Xanh dương - Thông tin */
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-muted: #6b6b7b;
  
  /* Borders */
  --border-default: rgba(255, 255, 255, 0.1);
  --border-active: rgba(0, 212, 255, 0.3);
}
```

## 2. Typography

```css
/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Scale */
.text-xs: 12px
.text-sm: 14px
.text-base: 16px
.text-lg: 18px
.text-xl: 20px
.text-2xl: 24px
.text-3xl: 30px
```

## 3. Layout & Grid System

```
Desktop: 4 columns, gap-6 (24px)
Tablet:  2 columns, gap-4 (16px)
Mobile:  1 column, gap-4 (16px)

Container max-width: 1400px
Padding: 24px (desktop), 16px (mobile)
```

### Card Design (Glassmorphism)
```css
.card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--border-active);
  transform: scale(1.01);
}
```

## 4. Components

### 4.1 Buttons
```css
/* Primary - Gradient Cyan → Purple */
.btn-primary {
  background: linear-gradient(135deg, var(--cyan-glow), var(--electric-purple));
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

/* Outline */
.btn-outline {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
}

.btn-outline:hover {
  border-color: var(--cyan-glow);
  color: var(--cyan-glow);
}
```

### 4.2 Input Fields
```css
.input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--cyan-glow);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}
```

### 4.3 Badge/Status
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Success */
background: rgba(16, 185, 129, 0.15);
color: #10b981;

/* Warning */
background: rgba(245, 158, 11, 0.15);
color: #f59e0b;

/* Error */
background: rgba(239, 68, 68, 0.15);
color: #ef4444;

/* Info */
background: rgba(59, 130, 246, 0.15);
color: #3b82f6;
```

### 4.4 Progress Bar
```css
.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}
```

## 5. Animations

```css
/* Hover transitions */
transition: all 0.2s ease;

/* Gradient text animation */
.gradient-text {
  background: linear-gradient(135deg, var(--cyan-glow), var(--electric-purple));
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 3s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Slide up animation */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Pulse glow */
.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px var(--cyan-glow), 0 0 10px var(--cyan-glow); }
  50% { box-shadow: 0 0 20px var(--cyan-glow), 0 0 40px var(--cyan-glow); }
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, 
    var(--bg-secondary) 0%, 
    var(--bg-tertiary) 50%, 
    var(--bg-secondary) 100%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}
```

## 6. Modal

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 24px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: scaleIn 0.3s ease;
}
```

## 7. Responsive Breakpoints

```css
/* Mobile first approach */
/* sm: 640px  - Tablet nhỏ */
/* md: 768px  - Tablet */
/* lg: 1024px - Desktop nhỏ */
/* xl: 1280px - Desktop */
/* 2xl: 1536px - Large desktop */
```

## 8. Customer Tiers (Thứ hạng khách hàng)

```css
/* Basic */
background: rgba(107, 114, 128, 0.15);
color: #6b7280;

/* Silver */
background: rgba(156, 163, 175, 0.15);
color: #9ca3af;

/* Gold */
background: rgba(245, 158, 11, 0.15);
color: #f59e0b;

/* Platinum */
background: rgba(139, 92, 246, 0.15);
color: #8b5cf6;
```

## 9. RMA Status Colors

```css
pending: 'rgba(245, 158, 11, 0.15)'    /* Vàng - Chờ duyệt */
approved: 'rgba(59, 130, 246, 0.15)'  /* Xanh dương - Đã duyệt */
rejected: 'rgba(239, 68, 68, 0.15)'  /* Đỏ - Từ chối */
shipping: 'rgba(139, 92, 246, 0.15)' /* Tím - Đang vận chuyển */
completed: 'rgba(16, 185, 129, 0.15)' /* Xanh - Hoàn thành */
```

## 10. Checklist Trước Khi Ship

- [x] Contrast ratio ≥ 4.5:1 (WCAG AA)
- [x] Consistent color palette across all pages
- [x] Loading states cho tất cả async operations
- [x] Error states cho forms
- [x] Empty states cho lists
- [x] Mobile responsive
- [x] Smooth transitions không janky
- [x] Font loading không FOIT

---

## 📋 Tính năng đã triển khai

### Backend APIs
| Endpoint | Mô tả |
|----------|--------|
| `/api/v1/customers` | CRUD khách hàng với tier system |
| `/api/v1/reports` | Báo cáo dashboard, sản phẩm, tài chính, SLA |
| `/api/v1/rma` | Quản lý yêu cầu đổi/trả hàng |
| `/api/v1/notifications` | Thông báo email, SMS, in-app |
| `/api/v1/rbac` | Phân quyền theo vai trò |
| `/api/v1/wallet` | Ví điện tử, nạp/chuyển tiền |

### Frontend Pages
| Route | Mô tả |
|-------|--------|
| `/` | Dashboard - Tổng quan |
| `/tickets` | Quản lý phiếu bảo hành |
| `/products` | Quản lý sản phẩm |
| `/customers` | Quản lý khách hàng (tier system) |
| `/rma` | Quản lý RMA |
| `/wallet` | Ví điện tử |
| `/reports` | Báo cáo & Analytics |
| `/finance` | Sổ tài chính |
| `/chatbot` | AI Chat |
| `/lookup` | Tra cứu bảo hành (Public) |
| `/notifications` | Thông báo |
| `/settings` | Cài đặt |
