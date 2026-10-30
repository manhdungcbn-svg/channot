import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { aiService, ticketService, productService } from '../services/services'
import { StatusBadge } from '../components'
import ConfirmDialog from './ConfirmDialog'
import ChatSerialModal from './ChatSerialModal'

// ============================================
// HẰNG SỐ / TIỆN ÍCH
// ============================================

const SESSION_STORAGE_KEY = 'warranty:chat:session:v1'
const HISTORY_LIMIT = 10                 // số lượt (message) gần nhất gửi kèm cho AI
const SHOP_BASE_URL = 'http://localhost:5175' // storefront e-commerce (port khác → mở tab mới)

// Sinh uuid cho session id, có fallback cho browser cũ.
function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function getOrCreateSessionId() {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY)
    if (saved) return saved
    const id = generateSessionId()
    localStorage.setItem(SESSION_STORAGE_KEY, id)
    return id
  } catch {
    return generateSessionId()
  }
}

// Streaming typing effect hook
function useTypingEffect(text, speed = 20, onDone) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    if (!text) return

    const interval = setInterval(() => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) {
        clearInterval(interval)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return displayed
}

// Render markdown bold (**text**) thành <strong> — không cần thêm thư viện.
function renderBold(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} style={{ color: '#E2E8F0', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ============================================
// BUBBLE / CARD
// ============================================

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1A3A6B' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  )
}

function TypingBotBubble({ text, onDone }) {
  const displayed = useTypingEffect(text, 12, onDone)
  return (
    <div className="flex gap-3 items-end">
      <BotAvatar />
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md"
        style={{ background: '#1E293B', border: '1px solid #334155' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#F1F5F9', whiteSpace: 'pre-wrap' }}>
          {renderBold(displayed)}
          {displayed.length < text.length && (
            <span className="inline-block w-2 h-4 ml-0.5 animate-pulse" style={{ background: '#64748B' }} />
          )}
        </p>
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md"
        style={{ background: '#2563EB' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#FFFFFF', whiteSpace: 'pre-wrap' }}>{text}</p>
      </div>
    </div>
  )
}

// Badge nguồn trả lời: Gemini (tím/xanh) hoặc Rule-based (xám) + thanh confidence
function SourceBadge({ source, confidence }) {
  const isGemini = source === 'gemini'
  const pct = Math.round((confidence ?? 0) * 100)
  return (
    <div className="flex items-center gap-2 mt-1.5 ml-11 flex-wrap">
      <span
        title={isGemini
          ? 'Câu trả lời được sinh bởi mô hình Gemini (AI).'
          : 'Câu trả lời được sinh bằng bộ luật (rule-based) nội bộ — không dùng AI.'}
        className="text-[11px] px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 cursor-help"
        style={isGemini
          ? { background: 'rgba(124,58,237,0.18)', color: '#C4B5FD' }
          : { background: 'rgba(100,116,139,0.18)', color: '#94A3B8' }}
      >
        {isGemini ? '🤖 Gemini' : '📋 Rule-based'}
      </span>
      {typeof confidence === 'number' && (
        <span className="inline-flex items-center gap-1.5" title={`Độ tin cậy: ${pct}%`}>
          <span className="inline-block w-12 h-1 rounded-full overflow-hidden" style={{ background: '#334155' }}>
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(2, pct))}%`,
                background: pct >= 75 ? '#34D399' : pct >= 45 ? '#FBBF24' : '#F87171',
              }}
            />
          </span>
          <span className="text-[11px]" style={{ color: '#64748B' }}>{pct}%</span>
        </span>
      )}
    </div>
  )
}

// Rich ticket card rendered in chat
function TicketCardRich({ ticket }) {
  const labels = {
    RECEIVED: 'Tiếp nhận', INSPECTION: 'Kiểm tra',
    REPAIRING: 'Sửa chữa', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối',
  }

  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ background: '#0F1929', border: '1px solid #334155' }}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#1E293B' }}>
        <span className="text-xs font-bold font-mono" style={{ color: '#60A5FA' }}>{ticket.ticket_code}</span>
        <StatusBadge variant={ticket.status?.toLowerCase()} label={labels[ticket.status] || ticket.status} />
      </div>
      {/* Body */}
      <div className="px-3 py-2 space-y-1">
        <p className="text-xs font-medium" style={{ color: '#F1F5F9' }}>{ticket.product?.name || '—'}</p>
        <p className="text-xs" style={{ color: '#64748B' }}>{ticket.issue_description?.slice(0, 60)}...</p>
        {ticket.ai_classification && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>
            🤖 {ticket.ai_classification}
          </span>
        )}
      </div>
    </div>
  )
}

// Card hiển thị kết quả tra cứu sản phẩm
function ProductCard({ product }) {
  const within = product.within_warranty === 'YES'
  return (
    <div className="mt-2 ml-11 rounded-xl p-3 space-y-1.5"
      style={{ background: '#0F1929', border: '1px solid #334155' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: '#F1F5F9' }}>{product.product_name}</span>
        <span className="text-xs px-2 py-0.5 rounded-md font-medium"
          style={within
            ? { background: 'rgba(16,185,129,0.15)', color: '#34D399' }
            : { background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
          {within ? '✓ Còn BH' : '✕ Hết BH'}
        </span>
      </div>
      <p className="text-xs font-mono" style={{ color: '#60A5FA' }}>{product.serial}</p>
      <p className="text-xs" style={{ color: '#94A3B8' }}>{product.warranty_reason}</p>
    </div>
  )
}

// Card hiển thị kết quả phân loại lỗi
function ClassificationCard({ data }) {
  const priorityColors = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
    HIGH: { bg: 'rgba(249,115,22,0.15)', color: '#FB923C' },
    MEDIUM: { bg: 'rgba(234,179,8,0.15)', color: '#FACC15' },
    LOW: { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
  }
  const c = priorityColors[data.priority] || priorityColors.LOW
  return (
    <div className="mt-2 ml-11 rounded-xl p-3 space-y-2"
      style={{ background: '#0F1929', border: '1px solid #334155' }}>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ background: c.bg, color: c.color }}>
          {data.priority}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#F1F5F9' }}>{data.label}</span>
        <span className="text-xs ml-auto" style={{ color: '#64748B' }}>
          {Math.round((data.confidence || 0) * 100)}%
        </span>
      </div>
      {data.suggestions?.length > 0 && (
        <ul className="space-y-1">
          {data.suggestions.map((s, i) => (
            <li key={i} className="text-xs flex gap-1.5" style={{ color: '#94A3B8' }}>
              <span style={{ color: '#64748B' }}>•</span>{s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Card hiển thị sản phẩm shop (tư vấn mua hàng — cross-sell)
function ShopProductCard({ product }) {
  const price = Number(product.price || 0)
  const formatted = price.toLocaleString('vi-VN') + ' ₫'
  return (
    <div className="mt-2 ml-11 rounded-xl p-3 space-y-1.5"
      style={{ background: '#0F1929', border: '1px solid #334155' }}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold" style={{ color: '#F1F5F9' }}>{product.name}</span>
        {product.badge?.label && (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
            {product.badge.label}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold" style={{ color: '#34D399' }}>{formatted}</p>
      <p className="text-[11px]" style={{ color: '#64748B' }}>
        {product.brand} · {product.category} · BH {product.warranty_months || '—'} tháng
      </p>
    </div>
  )
}

// ============================================
// ACTIONS
// ============================================

const ACTION_LABELS = {
  add_to_cart: '🛒 Thêm vào giỏ',
  view_product: '👁️ Xem sản phẩm',
  lookup_serial: '🔎 Tra cứu serial',
  create_ticket: '📝 Tạo phiếu bảo hành',
  navigate: '➡️ Điều hướng',
  call_hotline: '📞 Gọi hotline',
}

function ActionButtons({ actions, status, onConfirm, onCancel, onRun, busy }) {
  if (!actions?.length) return null
  return (
    <div className="mt-2 ml-11 flex flex-wrap gap-2">
      {actions.map((action, idx) => {
        const type = action.type
        const label = action.label || ACTION_LABELS[type] || type
        const state = status?.[idx]

        // Đã xác nhận rồi → không hiện nút nữa
        if (state === 'confirmed' || state === 'cancelled') return null

        // Action cần xác nhận → hiện nút "Xác nhận" + "Huỷ", CHƯA gọi API
        if (action.requires_confirmation) {
          return (
            <span key={idx} className="inline-flex items-center gap-2">
              <button
                onClick={() => onConfirm(idx, action)}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                style={{ background: busy ? '#334155' : '#059669', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                ✓ Xác nhận
              </button>
              <button
                onClick={() => onCancel(idx)}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
              >
                Huỷ
              </button>
            </span>
          )
        }

        return (
          <button
            key={idx}
            onClick={() => onRun(idx, action)}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left"
            style={{ background: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// QUICK QUESTIONS
// ============================================

const QUICK_QUESTIONS = [
  { q: '📋 Tình trạng phiếu BH của tôi?', ctx: {} },
  { q: '🔍 Kiểm tra bảo hành theo serial', ctx: {} },
  { q: '📜 Lịch sử bảo hành sản phẩm', ctx: {} },
  { q: '📝 Hướng dẫn tạo phiếu BH mới', ctx: {} },
  { q: '💰 Chi phí sửa chữa bao nhiêu?', ctx: {} },
  { q: '📍 Trung tâm bảo hành ở đâu?', ctx: {} },
  { q: '📞 Liên hệ tổng đài', ctx: {} },
  { q: '🔎 Tra cứu bằng serial', ctx: {}, special: 'serial' },
  { q: '🛒 Tư vấn mua sản phẩm mới', ctx: {}, special: 'shop' },
]

// ============================================
// ĐỊNH TUYẾN INTENT MUA HÀNG (client-side)
// Backend /ai/chat xử lý bảo hành; /ai/shop-chat xử lý tư vấn mua hàng.
// Ta tự nhận diện câu hỏi mua hàng để gọi đúng endpoint (cross-sell 2 hệ thống).
// ============================================

// Từ khoá bảo hành — nếu có thì ưu tiên chatbot bảo hành
const WARRANTY_KEYWORDS = [
  'bảo hành', 'bao hanh', 'serial', 'sê-ri', 'seri', 'phiếu', 'phieu',
  'lỗi', 'sửa', 'hỏng', 'warranty', 'ticket', 'sự cố', 'su co',
]

// Từ khoá MUA HÀNG mạnh → luôn gọi shop-chat
const STRONG_SHOP_KEYWORDS = [
  'mua', 'giỏ hàng', 'gio hang', 'thêm vào giỏ', 'them vao gio',
  'nên mua', 'nen mua', 'so sánh', 'so sanh', 'tư vấn mua', 'tu van mua',
  'mua sản phẩm', 'mua san pham', 'mua ngay', 'đặt hàng', 'dat hang',
]

// Yêu cầu tạo phiếu BH → shop-chat (endpoint này mới trả action create_ticket)
const TICKET_REQUEST_KEYWORDS = [
  'tạo phiếu', 'tao phieu', 'gửi bảo hành', 'gui bao hanh',
  'yêu cầu bảo hành', 'yeu cau bao hanh', 'gửi máy', 'gui may',
]

// Từ khoá mua hàng yếu (có thể trùng ngữ cảnh bảo hành)
const WEAK_SHOP_KEYWORDS = [
  'giá bao nhiêu', 'bao nhiêu tiền', 'sản phẩm nào', 'san pham nao',
  'trieu', 'triệu', 'gợi ý sản phẩm',
]

function detectShopIntent(text) {
  const t = String(text || '').toLowerCase()
  // 1. Yêu cầu tạo phiếu / mua hàng mạnh → shop-chat
  if (TICKET_REQUEST_KEYWORDS.some(k => t.includes(k))) return true
  if (STRONG_SHOP_KEYWORDS.some(k => t.includes(k))) return true
  // 2. Từ khoá bảo hành → chatbot bảo hành
  if (WARRANTY_KEYWORDS.some(k => t.includes(k))) return false
  // 3. Từ khoá mua yếu → shop-chat
  return WEAK_SHOP_KEYWORDS.some(k => t.includes(k))
}

// ============================================
// PAGE
// ============================================

export default function ChatPanel({ compact = false, onClose = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Xin chào ${user?.full_name?.split(' ').slice(-1)[0] || 'bạn'}! 👋\n\nTôi là trợ lý ảo của BảoHành Pro. Tôi có thể hỗ trợ bạn:\n• 🔍 Tra cứu tình trạng bảo hành theo serial\n• 📜 Xem lịch sử bảo hành sản phẩm\n• 📝 Tạo phiếu bảo hành mới\n• 📋 Kiểm tra tiến độ phiếu\n• 💡 Giải đáp chính sách bảo hành\n\nBạn cần hỗ trợ gì hôm nay?`,
      id: 'welcome',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId())

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showSerialModal, setShowSerialModal] = useState(false)
  const [serialPrefill, setSerialPrefill] = useState('')
  const [actionStatus, setActionStatus] = useState({})   // { msgId: { actionIndex: 'confirmed'|'cancelled' } }
  const [actionBusy, setActionBusy] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const prefillDoneRef = useRef(false)

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Theo dõi vị trí scroll để hiện nút "cuộn xuống"
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollDown(distance > 120)
  }, [])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Chuẩn bị lịch sử (10 lượt gần nhất) cho AI
  const buildHistory = useCallback((currentMessages) => {
    return currentMessages
      .filter(m => (m.role === 'user' || m.role === 'bot') && m.text)
      .slice(-HISTORY_LIMIT)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))
  }, [])

  // Gửi tin nhắn. mode: 'auto' (tự nhận diện) | 'warranty' | 'shop'
  const sendMessage = useCallback(async (text, mode = 'auto') => {
    const userText = (text || '').trim()
    if (!userText || sending) return

    const effectiveMode = mode === 'auto'
      ? (detectShopIntent(userText) ? 'shop' : 'warranty')
      : mode

    const userMsg = { role: 'user', text: userText, id: `u-${Date.now()}` }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)

    // Lịch sử gửi kèm = các lượt trước đó (không bao gồm chính câu hỏi vừa gửi)
    const history = buildHistory(messages)

    try {
      let r
      if (effectiveMode === 'shop') {
        r = await aiService.shopChat({
          message: userText,
          session_id: sessionId,
          history,
          context: { serial: null, ticket_code: null },
        })
      } else {
        r = await aiService.chat(userText, { session_id: sessionId, history })
      }

      // Backend có thể trả session_id mới → đồng bộ lại
      const newSessionId = r?.data?.session_id || r?.session_id
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId)
        try { localStorage.setItem(SESSION_STORAGE_KEY, newSessionId) } catch { /* ignore */ }
      }

      setMessages(m => [...m, {
        role: 'bot',
        text: r.reply,
        intent: r.intent,
        confidence: r.confidence,
        source: r.source,
        suggestions: r.suggestions || [],
        data: r.data,
        actions: r.actions || [],
        id: `b-${Date.now()}`,
      }])
      setSuggestions(r.suggestions || [])
    } catch (err) {
      const detail = err?.response?.data?.detail
        || err?.response?.data?.error?.message
        || 'Vui lòng thử lại hoặc liên hệ hotline 0827461460.'
      setMessages(m => [...m, {
        role: 'bot',
        text: `⚠️ Rất tiếc, tôi chưa xử lý được yêu cầu này.\n\n${detail}`,
        isError: true,
        retryText: userText,
        retryMode: effectiveMode,
        id: `e-${Date.now()}`,
      }])
    } finally {
      setSending(false)
    }
  }, [sending, sessionId, messages, buildHistory])

  // Pre-fill message đầu tiên từ query param ?q= (vd. từ trang Tra cứu)
  useEffect(() => {
    if (prefillDoneRef.current) return
    const q = searchParams.get('q')
    if (!q || !q.trim()) return
    prefillDoneRef.current = true
    const text = q.trim()
    // Xoá query param để F5 không gửi lại
    setSearchParams({}, { replace: true })
    sendMessage(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Xác nhận xoá cuộc trò chuyện
  const handleClearConfirm = useCallback(() => {
    setMessages([{
      role: 'bot',
      text: `🔄 Cuộc trò chuyện đã được xoá.\n\nXin chào ${user?.full_name?.split(' ').slice(-1)[0] || 'bạn'}! Tôi có thể hỗ trợ bạn tra cứu bảo hành, tạo phiếu hoặc tư vấn sản phẩm mới.`,
      id: `w-${Date.now()}`,
    }])
    setSuggestions([])
    setActionStatus({})
    setShowClearConfirm(false)
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    try { localStorage.setItem(SESSION_STORAGE_KEY, newSessionId) } catch { /* ignore */ }
    toast.success('Đã xoá cuộc trò chuyện')
  }, [user])

  // ============================================
  // XỬ LÝ ACTIONS
  // ============================================

  const setActionState = useCallback((msgId, idx, state) => {
    setActionStatus(prev => ({ ...prev, [msgId]: { ...(prev[msgId] || {}), [idx]: state } }))
  }, [])

  // Chạy action không cần xác nhận
  const runAction = useCallback(async (msgId, idx, action) => {
    const payload = action.payload || {}
    try {
      switch (action.type) {
        case 'add_to_cart': {
          toast.success(`Đã thêm vào giỏ: ${payload.name || 'sản phẩm'}`)
          setActionState(msgId, idx, 'confirmed')
          break
        }
        case 'view_product': {
          const slug = payload.slug
          if (!slug) { toast.error('Không tìm thấy sản phẩm để mở'); return }
          window.open(`${SHOP_BASE_URL}/product/${slug}`, '_blank', 'noopener,noreferrer')
          setActionState(msgId, idx, 'confirmed')
          break
        }
        case 'lookup_serial': {
          setSerialPrefill(payload.serial || '')
          setShowSerialModal(true)
          setActionState(msgId, idx, 'confirmed')
          break
        }
        case 'navigate': {
          const href = payload.href
          if (!href) { toast.error('Không có đường dẫn để điều hướng'); return }
          navigate(href)
          setActionState(msgId, idx, 'confirmed')
          break
        }
        case 'call_hotline': {
          const phone = payload.phone || '0827461460'
          toast(`Hotline bảo hành: ${phone}`, { icon: '📞' })
          setActionState(msgId, idx, 'confirmed')
          break
        }
        default:
          toast('Tính năng này đang được phát triển', { icon: '🚧' })
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Không thực hiện được thao tác.')
    }
  }, [navigate, setActionState])

  // Action cần xác nhận → chỉ gọi API khi user bấm "Xác nhận"
  const confirmAction = useCallback(async (msgId, idx, action) => {
    setActionBusy(true)
    const payload = action.payload || {}
    try {
      if (action.type === 'create_ticket') {
        const serial = payload.serial
        if (!serial) { toast.error('Thiếu mã serial sản phẩm'); return }
        const product = await productService.bySerial(serial)
        const ticket = await ticketService.create({
          product_id: product.id,
          issue_description: payload.issue_description || 'Yêu cầu bảo hành từ trợ lý ảo',
        })
        toast.success(`Đã tạo phiếu bảo hành: ${ticket.ticket_code}`)
        setActionState(msgId, idx, 'confirmed')
      } else {
        await runAction(msgId, idx, action)
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Không thực hiện được thao tác.')
      setActionState(msgId, idx, 'cancelled')
    } finally {
      setActionBusy(false)
    }
  }, [runAction, setActionState])

  const cancelAction = useCallback((msgId, idx) => {
    setActionState(msgId, idx, 'cancelled')
  }, [setActionState])

  // ============================================

  const handleQuickQuestion = useCallback((item) => {
    if (item.special === 'serial') {
      setSerialPrefill('')
      setShowSerialModal(true)
      return
    }
    if (item.special === 'shop') {
      sendMessage('Tôi muốn tìm hiểu sản phẩm mới để mua, hãy tư vấn giúp tôi.', 'shop')
      return
    }
    sendMessage(item.q)
  }, [sendMessage])

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#1E293B', background: '#0F1929' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1E293B', border: '1px solid #334155' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>Trợ lý ảo BảoHành Pro</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <p className="text-xs" style={{ color: '#10B981' }}>Trực tuyến — Phản hồi tức thì</p>
            </div>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Xoá cuộc trò chuyện"
            aria-label="Xoá cuộc trò chuyện"
            className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={{ background: '#1E293B', border: '1px solid #334155', color: '#94A3B8' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>

          {/* Nút đóng panel (chỉ hiện ở dạng overlay/FAB) */}
          {compact && onClose && (
            <button
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng trợ lý ảo"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#94A3B8' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-4 relative"
          style={{ background: '#0F1929' }}
        >
          {messages.map((msg, i) => (
            <div key={msg.id || i}>
              {msg.role === 'bot' ? (
                <div>
                  <TypingBotBubble text={msg.text} />
                  {msg.source && <SourceBadge source={msg.source} confidence={msg.confidence} />}
                  {msg.data?.ticket_code && (
                    <div className="mt-2 ml-11">
                      <TicketCardRich ticket={{
                        ticket_code: msg.data.ticket_code,
                        status: msg.data.status,
                        issue_description: msg.data.issue_description,
                        product: { name: msg.data.product_name },
                      }} />
                    </div>
                  )}
                  {msg.data?.product_name && msg.data?.serial && (
                    <div className="mt-2 ml-11">
                      <ProductCard product={msg.data} />
                    </div>
                  )}
                  {msg.data?.error_code && (
                    <div className="mt-2 ml-11">
                      <ClassificationCard data={msg.data} />
                    </div>
                  )}
                  {Array.isArray(msg.data?.products) && msg.data.products.length > 0 && (
                    <div className="mt-2 space-y-2 ml-11">
                      {msg.data.products.slice(0, 4).map((p, pi) => (
                        <ShopProductCard key={p.id || p.slug || pi} product={p} />
                      ))}
                    </div>
                  )}
                  <ActionButtons
                    actions={msg.actions}
                    status={actionStatus[msg.id]}
                    busy={actionBusy}
                    onConfirm={(idx, action) => confirmAction(msg.id, idx, action)}
                    onCancel={(idx) => cancelAction(msg.id, idx)}
                    onRun={(idx, action) => runAction(msg.id, idx, action)}
                  />
                  {msg.isError && msg.retryText && (
                    <div className="mt-2 ml-11">
                      <button
                        onClick={() => sendMessage(msg.retryText, msg.retryMode || 'warranty')}
                        disabled={sending}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', cursor: sending ? 'not-allowed' : 'pointer' }}
                      >
                        ↻ Thử lại
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <UserBubble text={msg.text} />
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 items-end">
              <BotAvatar />
              <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: '#1E293B', border: '1px solid #334155' }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full"
                      style={{
                        background: '#64748B',
                        animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out`,
                      }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Nút cuộn xuống */}
        {showScrollDown && (
          <div className="flex justify-center -mt-10 relative z-10">
            <button
              onClick={scrollToBottom}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#94A3B8' }}
              title="Cuộn xuống tin nhắn mới nhất"
              aria-label="Cuộn xuống"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}

        {/* Gợi ý theo ngữ cảnh từ backend */}
        {suggestions.length > 0 && !sending && (
          <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto" style={{ borderColor: '#1E293B', background: '#0F1929' }}>
            {suggestions.map((s, i) => (
              <button key={i}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="px-4 py-3 border-t flex gap-2 overflow-x-auto" style={{ borderColor: '#1E293B', background: '#0F1929' }}>
          {QUICK_QUESTIONS.map((item, i) => (
            <button key={i}
              onClick={() => handleQuickQuestion(item)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
              {item.q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: '#1E293B', background: '#0F1929' }}>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#F1F5F9' }}
            />
            <button onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: input.trim() ? '#2563EB' : '#1E293B', cursor: input.trim() ? 'pointer' : 'not-allowed',
                border: input.trim() ? 'none' : '1px solid #334155' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#475569' }}>
            Nhấn Enter để gửi. Câu trả lời chỉ mang tính chất tham khảo.
          </p>
        </div>
      </div>

      {/* Xác nhận xoá cuộc trò chuyện */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearConfirm}
        title="Xoá cuộc trò chuyện?"
        description="Toàn bộ tin nhắn và ngữ cảnh phiên chat hiện tại sẽ bị xoá. Bạn có thể bắt đầu cuộc trò chuyện mới ngay sau đó."
        confirmText="Xoá"
        variant="danger"
      />

      {/* Modal tra cứu serial */}
      <ChatSerialModal
        isOpen={showSerialModal}
        onClose={() => setShowSerialModal(false)}
        initialSerial={serialPrefill}
      />

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
