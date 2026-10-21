import { useState, useRef, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ticketService } from '../services/services'
import { StatusBadge } from '../components'

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

function TypingBotBubble({ text, onDone }) {
  const displayed = useTypingEffect(text, 18, onDone)
  return (
    <div className="flex gap-3 items-end">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1A3A6B' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md"
        style={{ background: '#1E293B', border: '1px solid #334155' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#F1F5F9', whiteSpace: 'pre-wrap' }}>
          {displayed}
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

const QUICK_QUESTIONS = [
  { q: '📋 Tình trạng phiếu BH?', a: 'Bạn có thể xem tình trạng các phiếu bảo hành tại mục "Phiếu bảo hành" trên thanh menu bên trái. Mỗi phiếu sẽ hiển thị trạng thái: Tiếp nhận → Kiểm tra → Sửa chữa → Hoàn tất.' },
  { q: '📝 Tạo phiếu BH mới?', a: 'Để tạo phiếu mới: (1) Vào mục "Phiếu bảo hành", (2) Nhấn "Tạo phiếu mới", (3) Nhập serial sản phẩm và mô tả lỗi. Hệ thống sẽ tự động phân loại lỗi và kiểm tra bảo hành.' },
  { q: '⏰ Hết hạn BH phải làm sao?', a: 'Nếu sản phẩm hết bảo hành, bạn vẫn có thể tạo phiếu. Chi phí sửa chữa sẽ được thông báo cụ thể sau khi kỹ thuật viên kiểm tra và báo giá.' },
  { q: '💳 Thanh toán như thế nào?', a: 'Sau khi hoàn tất kiểm tra, chi phí sửa chữa (nếu có) sẽ hiển thị trên phiếu. Bạn có thể thanh toán trực tiếp qua ví điện tử hoặc chuyển khoản BIDV: 3300722488.' },
  { q: '⏱ Thời gian xử lý bao lâu?', a: 'Thông thường: Kiểm tra trong 24h, Sửa chữa 2-3 ngày làm việc. Trường hợp cần linh kiện đặc biệt có thể kéo dài 5-7 ngày. Bạn sẽ nhận thông báo khi có cập nhật.' },
  { q: '📞 Liên hệ tổng đài?', a: 'Thông tin liên hệ hỗ trợ:\n📧 manhdungdbn@gmail.com\n📞 0827461460 (Vũ Mạnh Dũ)\n\nGiờ làm việc: 8h00 - 17h00 (Thứ 2 - Thứ 6)' },
]

export default function CustomerChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Xin chào ${user?.full_name?.split(' ').slice(-1)[0] || 'bạn'}! 👋\n\nTôi là trợ lý ảo của BảoHành Pro. Tôi có thể hỗ trợ bạn:\n• Tra cứu tình trạng phiếu bảo hành\n• Hướng dẫn tạo phiếu mới\n• Giải đáp chính sách bảo hành\n• Thông tin thanh toán & thời gian xử lý\n\nBạn cần hỗ trợ gì hôm nay?`,
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userTickets, setUserTickets] = useState([])
  const bottomRef = useRef(null)

  // Load user tickets for rich responses
  useEffect(() => {
    ticketService.list().then(setUserTickets).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateResponse = useCallback((userText) => {
    const lower = userText.toLowerCase()

    // Check if user asks about their tickets
    if (lower.includes('phiếu') || lower.includes('ticket') || lower.includes('bảo hành') && lower.includes('của tôi') || lower.includes('của mình')) {
      if (userTickets.length > 0) {
        return {
          text: `Tôi tìm thấy ${userTickets.length} phiếu bảo hành của bạn. Dưới đây là phiếu gần nhất:`,
          richTickets: userTickets.slice(0, 3),
        }
      } else {
        return { text: 'Hiện tại tôi chưa tìm thấy phiếu bảo hành nào trong tài khoản của bạn. Bạn có muốn tạo phiếu mới không?' }
      }
    }

    if (lower.includes('bảo hành') || lower.includes('bh')) {
      return { text: 'Về bảo hành: Sản phẩm được bảo hành trong thời hạn ghi trên sổ bảo hành. Các trường hợp không được bảo hành: hư hỏng do rơi vỡ, vào nước, tự ý sửa chữa. Bạn có muốn tôi kiểm tra thời hạn bảo hành của sản phẩm cụ thể không?' }
    }
    if (lower.includes('thanh toán') || lower.includes('tiền') || lower.includes('phí')) {
      return { text: 'Thanh toán có thể thực hiện qua:\n• Ví điện tử trong hệ thống (nhanh nhất)\n• Chuyển khoản BIDV: 3300722488 - VU MANH DUNG\n\nBạn cần hỗ trợ thêm gì không?' }
    }
    if (lower.includes('liên hệ') || lower.includes('điện thoại') || lower.includes('email')) {
      return { text: 'Thông tin liên hệ hỗ trợ:\n📧 manhdungdbn@gmail.com\n📞 0827461460 (Vũ Mạnh Dũ)\n\nGiờ làm việc: 8h00 - 17h00 (Thứ 2 - Thứ 6)' }
    }

    // Quick question matching
    for (const item of QUICK_QUESTIONS) {
      if (lower.includes(item.q.toLowerCase().slice(0, 8))) {
        return { text: item.a }
      }
    }

    return { text: 'Cảm ơn bạn đã hỏi! Để được hỗ trợ chính xác nhất, bạn có thể:\n\n1️⃣ Xem danh sách phiếu bảo hành của mình\n2️⃣ Liên hệ: 0827461460\n3️⃣ Gửi email: manhdungdbn@gmail.com\n\nTôi có thể giúp gì thêm không?' }
  }, [userTickets])

  function sendMessage(text) {
    if (!text.trim() || sending) return
    const userText = text.trim()
    setMessages(m => [...m, { role: 'user', text: userText }])
    setInput('')
    setSending(true)

    setTimeout(() => {
      const result = generateResponse(userText)
      setMessages(m => [...m, {
        role: 'bot',
        text: result.text,
        richTickets: result.richTickets,
        id: Date.now(),
      }])
      setSending(false)
    }, 500)
  }

  return (
    <Layout pageId="chat">
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#1E293B', background: '#0F1929' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1E293B', border: '1px solid #334155' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>Trợ lý ảo BảoHành Pro</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <p className="text-xs" style={{ color: '#10B981' }}>Trực tuyến — Phản hồi tức thì</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: '#0F1929' }}>
          {messages.map((msg, i) => (
            <div key={msg.id || i}>
              {msg.role === 'bot' ? (
                <div>
                  <TypingBotBubble text={msg.text} />
                  {msg.richTickets && msg.richTickets.map(t => (
                    <div key={t.id} className="mt-2 ml-11">
                      <TicketCardRich ticket={t} />
                    </div>
                  ))}
                </div>
              ) : (
                <UserBubble text={msg.text} />
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1A3A6B' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
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

        {/* Quick actions */}
        <div className="px-4 py-3 border-t flex gap-2 overflow-x-auto" style={{ borderColor: '#1E293B', background: '#0F1929' }}>
          {QUICK_QUESTIONS.map((item, i) => (
            <button key={i}
              onClick={() => sendMessage(item.q)}
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
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#475569' }}>
            Nhấn Enter để gửi. Câu trả lời chỉ mang tính chất tham khảo.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </Layout>
  )
}
