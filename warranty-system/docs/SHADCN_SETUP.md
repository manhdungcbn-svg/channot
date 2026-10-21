# 🚀 HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG SHADCN DASHBOARD
## BảoHành Pro

---

## 📋 TỔNG QUAN

**Shadcn Dashboard** là template dashboard hiện đại với:
- ⚛️ React 19 + Vite
- 🎨 shadcn/ui components (Radix UI)
- 💨 Tailwind CSS v4
- 📊 Charts với Recharts
- 🌙 Dark/Light mode có sẵn
- 📱 Responsive design

---

## 🎯 2 PHƯƠNG ÁN

### Phương án A: Clone toàn bộ template (Nhanh nhất)
Dùng nguyên template, sau đó tích hợp API của BảoHành Pro vào.

### Phương án B: Cài đặt shadcn/ui vào project hiện tại
Thêm shadcn/ui vào project React/Vite có sẵn của bạn.

---

## 🅰️ PHƯƠNG ÁN A: CLONE TOÀN BỘ TEMPLATE

### Bước 1: Clone repository
```bash
# Clone về thư mục mới
git clone https://github.com/shadcndashboard/shadcndashboard.git

# Di chuyển vào thư mục React
cd shadcndashboard/ReactJS/main
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Chạy development server
```bash
npm run dev
```
**Mở trình duyệt:** http://localhost:5173

### Bước 4: Build cho production
```bash
npm run build
```

---

## 🅱️ PHƯƠNG ÁN B: CÀI SHADCN/UI VÀO PROJECT HIỆN TẠI

### Yêu cầu
- Node.js 20+
- Project React + Vite + TypeScript có sẵn

### Bước 1: Cài đặt shadcn/ui
```bash
# Di chuyển vào project frontend
cd warranty-system/frontend

# Chạy lệnh init shadcn
npx shadcn@latest init -t vite
```

### Bước 2: Cấu hình (Follow prompts)
```
√ Would you like to use TypeScript? ... Yes
√ Would you like to use Tailwind CSS? ... Yes
√ Would you like to use css variables for colors? ... Yes
√ Which style would you like to use? ... New York
√ Which base color? ... Slate
√ Would you like to customize the default import alias? ... @/
√ What prefix would you like to use for components? ... No prefix
```

### Bước 3: Thêm các components cần thiết
```bash
# Core components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add scroll-area

# Charts
npx shadcn@latest add chart

# Icons
npx shadcn@latest add lucide-react
```

### Bước 4: Cập nhật `src/index.css`
```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... các màu khác ... */
}

/* Thêm styles cho shadcn components */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Bước 5: Sử dụng components
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Ví dụ sử dụng
function Example() {
  return (
    <div className="container mx-auto p-6">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description here</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="email@example.com" />
            </div>
            <Button className="w-full">Submit</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎨 CẤU HÌNH THEME (Dark Mode)

### Tạo ThemeProvider
```tsx
// src/providers/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

const ThemeProviderContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: "system",
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeProviderContext)
```

### Sử dụng trong main.tsx
```tsx
import { ThemeProvider } from "@/providers/theme-provider"

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
```

---

## 📊 MẪU DASHBOARD COMPONENTS

### 1. Stat Card với shadcn
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={trend.value >= 0 ? "text-green-500" : "text-red-500"}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sử dụng
<StatCard
  title="Tổng phiếu"
  value="1,250"
  icon={FileText}
  trend={{ value: 12.5, label: "so với tháng trước" }}
/>
```

### 2. Data Table
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const tickets = [
  { id: 1, product: "Router Tenda", status: "completed", date: "2026-10-15" },
  { id: 2, product: "Laptop Dell", status: "repairing", date: "2026-10-16" },
]

const statusColors = {
  completed: "bg-green-500/10 text-green-500",
  repairing: "bg-yellow-500/10 text-yellow-500",
  received: "bg-blue-500/10 text-blue-500",
}

export function TicketsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách phiếu bảo hành</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">#{ticket.id}</TableCell>
                <TableCell>{ticket.product}</TableCell>
                <TableCell>
                  <Badge className={statusColors[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### 3. Chart Component
```tsx
import { BarChart } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

const chartData = [
  { month: "Jan", tickets: 120 },
  { month: "Feb", tickets: 135 },
  { month: "Mar", tickets: 142 },
]

const chartConfig = {
  tickets: {
    label: "Phiếu BH",
    color: "#8b5cf6",
  },
} satisfies ChartConfig

export function ChartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phiếu bảo hành theo tháng</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <XAxis dataKey="month" />
            <Bar dataKey="tickets" fill="#8b5cf6" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 🔗 CẤU TRÚC THƯ MỤC ĐỀ XUẤT

```
warranty-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── AppLayout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── TicketsChart.tsx
│   │   │   │   └── RecentTickets.tsx
│   │   │   └── shared/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tickets.tsx
│   │   │   ├── Products.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── providers/
│   │   │   └── theme-provider.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   ├── components.json
│   └── package.json
```

---

## 📦 SCRIPTS CÓ SẴN

| Command | Mô tả |
|---------|--------|
| `npm run dev` | Start dev server (http://localhost:5173) |
| `npm run build` | Build production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check ESLint |

---

## 🌟 CÁC COMPONENTS SHADCN PHỔ BIẾN

```bash
# Install tất cả components cần thiết
npx shadcn@latest add \
  button \
  card \
  input \
  label \
  badge \
  dialog \
  dropdown-menu \
  table \
  select \
  tabs \
  avatar \
  separator \
  scroll-area \
  sheet \
  toast \
  tooltip \
  popover \
  calendar \
  chart \
  skeleton
```

---

## 🎨 MÀU SẮC MẶC ĐỊNH (Tailwind)

### Light Mode
```css
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--card: 0 0% 100%
--card-foreground: 222.2 84% 4.9%
--primary: 262.1 83.3% 57.8%  /* Violet */
--primary-foreground: 210 40% 98%
--secondary: 210 40% 96.1%
--muted: 210 40% 96.1%
--accent: 210 40% 96.1%
```

### Dark Mode
```css
--background: 222.2 84% 4.9%
--foreground: 210 40% 98%
--card: 222.2 84% 4.9%
--card-foreground: 210 40% 98%
--primary: 263.4 70% 50.4%
--primary-foreground: 222.2 47.4% 11.2%
```

---

## ✅ CHECKLIST SAU KHI CÀI ĐẶT

- [ ] npm install thành công
- [ ] npm run dev chạy được
- [ ] Dark mode toggle hoạt động
- [ ] Components render đúng
- [ ] CSS variables được apply
- [ ] Responsive trên mobile

---

## 🔗 LINK HỮU ÍCH

| Resource | Link |
|----------|------|
| GitHub | https://github.com/shadcndashboard/shadcndashboard |
| Docs | https://shadcndashboard.dev/docs |
| Demo | https://shadcndashboard.dev/ |
| shadcn/ui | https://ui.shadcn.com/ |

---

## 💡 BƯỚC TIẾP THEO

1. **Clone template** về xem demo trực tiếp
2. **Tích hợp API** của BảoHành Pro vào
3. **Customize colors** theo brand của bạn
4. **Build components** mới dựa trên shadcn

---

*Cần hỗ trợ thêm? Hãy yêu cầu tôi implement cụ thể!*
