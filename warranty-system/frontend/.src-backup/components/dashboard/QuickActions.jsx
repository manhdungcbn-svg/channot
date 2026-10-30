import { useNavigate } from 'react-router-dom'

// Lưới thao tác nhanh; hỗ trợ mở biểu mẫu hoặc chuyển trang.

const BoxIcon = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    {children}
  </svg>
)

const ACTIONS = [
  {
    label: 'Tạo phiếu bảo hành',
    desc: 'Tiếp nhận yêu cầu mới',
    icon: <BoxIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></BoxIcon>,
    color: '#2563EB', bg: '#DBEAFE', kind: 'create',
  },
  {
    label: 'Tạo sản phẩm',
    desc: 'Đăng ký sản phẩm mới',
    icon: <BoxIcon><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/></BoxIcon>,
    color: '#059669', bg: '#D1FAE5', kind: 'navigate', href: '/products',
  },
  {
    label: 'Thêm khách hàng',
    desc: 'Đăng ký hồ sơ khách hàng',
    icon: <BoxIcon><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></BoxIcon>,
    color: '#7C3AED', bg: '#EDE9FE', kind: 'navigate', href: '/customers',
  },
  {
    label: 'Tra cứu bảo hành',
    desc: 'Kiểm tra quyền bảo hành',
    icon: <BoxIcon><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></BoxIcon>,
    color: '#F59E0B', bg: '#FEF3C7', kind: 'navigate', href: '/lookup',
  },
  {
    label: 'Trợ lý bảo hành',
    desc: 'Phân loại sự cố',
    icon: <BoxIcon><path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></BoxIcon>,
    color: '#DC2626', bg: '#FEE2E2', kind: 'navigate', href: '/ai',
  },
]

const CUSTOMER_ACTIONS = [
  {
    label: 'Sản phẩm của tôi',
    desc: 'Xem thiết bị đã đăng ký',
    icon: <BoxIcon><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></BoxIcon>,
    color: '#2563EB', bg: '#DBEAFE', kind: 'navigate', href: '/my-products',
  },
  {
    label: 'Phiếu của tôi',
    desc: 'Theo dõi tiến độ xử lý',
    icon: <BoxIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></BoxIcon>,
    color: '#7C3AED', bg: '#EDE9FE', kind: 'navigate', href: '/my-tickets',
  },
  ACTIONS[3], // Tra cứu
  ACTIONS[4], // Trợ lý
]

export default function QuickActions({ role, onCreateTicket }) {
  const navigate = useNavigate()
  const isCustomer = role === 'customer'
  const filtered = isCustomer ? CUSTOMER_ACTIONS : ACTIONS

  function handleClick(action) {
    if (action.kind === 'create' && onCreateTicket) return onCreateTicket()
    if (action.kind === 'navigate') return navigate(action.href)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {filtered.map((action, i) => (
        <button key={i}
          onClick={() => handleClick(action)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all hover:scale-[1.02]"
          style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: action.bg, color: action.color }}>
            {action.icon}
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: '#0F1929' }}>{action.label}</div>
            <div className="text-xs hidden sm:block" style={{ color: '#94A3B8' }}>{action.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
}