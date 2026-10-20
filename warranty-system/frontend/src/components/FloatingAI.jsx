import { useState, useRef, useEffect } from 'react'
import { Icon } from './Layout'

const QUICK_PROMPTS = [
  "Tra cứu bảo hành",
  "Tạo phiếu mới",
  "Tình trạng phiếu",
  "Số dư ví",
  "Hỗ trợ kỹ thuật",
]

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: 'Xin chào! 👋 Tôi là Warrio AI, trợ lý thông minh của hệ thống bảo hành. Tôi có thể giúp bạn tra cứu, tạo phiếu, hoặc trả lời mọi câu hỏi. Bạn cần hỗ trợ gì?',
  }
]

const FAKE_RESPONSES = [
  'Đã nhận yêu cầu! Tôi đang xử lý thông tin cho bạn...',
  'Để tra cứu bảo hành, vui lòng cung cấp số serial sản phẩm nhé!',
  'Tôi có thể giúp bạn tạo phiếu bảo hành mới. Bạn chỉ cần cung cấp: tên sản phẩm, số serial, mô tả lỗi.',
  'Phiếu #WR-2498 đang trong quá trình xử lý. Kỹ thuật viên Hoàng Nam sẽ cập nhật trong 24h tới.',
  'Số dư ví hiện tại của bạn là 5.750.000đ. Bạn có thể nạp thêm hoặc sử dụng để thanh toán phiếu BH.',
]

export default function FloatingAI() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const dragRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const messagesRef = useRef(null)

  // Set initial position to bottom-right after mount
  useEffect(() => {
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleMouseDown = (e) => {
    if (e.target.closest('.ai-toggle-btn')) return
    if (e.target.closest('.ai-panel')) return
    
    setIsDragging(true)
    setHasMoved(false)
    // Switch to absolute positioning when dragging
    const rect = dragRef.current.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      
      const newX = e.clientX - offsetRef.current.x
      const newY = e.clientY - offsetRef.current.y
      
      const maxX = window.innerWidth - 70
      const maxY = window.innerHeight - 70
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
      setHasMoved(true)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.userSelect = ''
        setTimeout(() => setHasMoved(false), 50)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleTouchStart = (e) => {
    if (e.target.closest('.ai-toggle-btn')) return
    if (e.target.closest('.ai-panel')) return
    
    const touch = e.touches[0]
    setIsDragging(true)
    setHasMoved(false)
    const rect = dragRef.current.getBoundingClientRect()
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging) return
      e.preventDefault()
      const touch = e.touches[0]
      const newX = touch.clientX - offsetRef.current.x
      const newY = touch.clientY - offsetRef.current.y
      
      const maxX = window.innerWidth - 70
      const maxY = window.innerHeight - 70
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
      setHasMoved(true)
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false)
        setTimeout(() => setHasMoved(false), 50)
      }
    }

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging])

  const handleSend = (text) => {
    const messageText = text || input.trim()
    if (!messageText) return

    setMessages(prev => [...prev, { role: 'user', text: messageText }])
    setInput("")
    setThinking(true)

    setTimeout(() => {
      const response = FAKE_RESPONSES[Math.floor(Math.random() * FAKE_RESPONSES.length)]
      setMessages(prev => [...prev, { role: 'assistant', text: response }])
      setThinking(false)
    }, 1200)
  }

  const handleClick = (e) => {
    if (hasMoved) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setOpen(!open)
  }

  return (
    <>
      {/* Floating Button */}
      <div
        ref={dragRef}
        className={`floating-ai ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          right: 'auto',
          bottom: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <button 
          className={`ai-toggle-btn ${open ? 'open' : ''}`} 
          onClick={handleClick}
          aria-label="AI Assistant"
        >
          {open ? <Icon name="close" size={22} /> : (
            <div className="robot-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                {/* Antenna */}
                <circle cx="16" cy="4" r="2" fill="currentColor" opacity="0.8" />
                <line x1="16" y1="6" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                {/* Head */}
                <rect x="6" y="9" width="20" height="16" rx="6" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.8" />
                {/* Eyes */}
                <circle cx="12" cy="16" r="2" fill="currentColor" />
                <circle cx="20" cy="16" r="2" fill="currentColor" />
                <circle cx="12.5" cy="15.5" r="0.6" fill="white" />
                <circle cx="20.5" cy="15.5" r="0.6" fill="white" />
                {/* Mouth */}
                <rect x="13" y="20" width="6" height="1.5" rx="0.75" fill="currentColor" />
                {/* Side ears */}
                <rect x="3" y="14" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.6" />
                <rect x="26" y="14" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.6" />
                {/* Body indicator */}
                <circle cx="16" cy="29" r="1.5" fill="currentColor" opacity="0.4" />
              </svg>
              <span className="ai-pulse" />
            </div>
          )}
        </button>

        {/* Chat Panel */}
        {open && (
          <div className="ai-panel" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <div className="ai-panel-header">
              <div className="ai-panel-title">
                <div className="ai-avatar-small">
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="9" width="20" height="16" rx="6" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="16" r="2" fill="currentColor" />
                    <circle cx="20" cy="16" r="2" fill="currentColor" />
                    <rect x="13" y="20" width="6" height="1.5" rx="0.75" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <strong>Warrio AI</strong>
                  <small><span className="online-dot" /> Trực tuyến</small>
                </div>
              </div>
              <button className="ai-minimize" onClick={() => setOpen(false)}>
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="ai-panel-messages" ref={messagesRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`ai-msg ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="ai-msg-avatar">
                      <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                        <circle cx="20" cy="16" r="1.5" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                  <div className="ai-msg-bubble">
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="ai-msg assistant">
                  <div className="ai-msg-avatar">
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                      <circle cx="20" cy="16" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="ai-msg-bubble thinking">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            <div className="ai-quick-prompts">
              {QUICK_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => handleSend(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <form className="ai-panel-input" onSubmit={e => { e.preventDefault(); handleSend() }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Hỏi Warrio AI bất cứ điều gì..."
              />
              <button type="submit" disabled={!input.trim()} className={input.trim() ? 'active' : ''}>
                <Icon name="arrow" size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
