import { useState, useRef, useEffect } from 'react'
import Layout, { Icon } from '../components/Layout'
import api from '../services/api'

const initialMessages = [
  { role: 'user', text: 'Xin chào, tôi muốn tra cứu bảo hành cho sản phẩm MacBook Air M3' },
  { role: 'assistant', text: 'Xin chào! Tôi đã tìm thấy thông tin bảo hành cho MacBook Air M3 (Serial: MBA-M3-8249).\n\n✅ Trạng thái: Còn bảo hành\n📅 Ngày hết hạn: 15/03/2027\n⏱️ Còn lại: 148 ngày\n\nBạn cần hỗ trợ gì thêm không?' },
  { role: 'user', text: 'Sản phẩm bị lỗi màn hình, tôi muốn tạo phiếu bảo hành' },
  { role: 'assistant', text: 'Đã hiểu! Để tạo phiếu bảo hành cho lỗi màn hình, tôi cần một số thông tin:\n\n1. Mô tả chi tiết tình trạng lỗi\n2. Ngày mua sản phẩm\n3. Hóa đơn mua hàng (nếu có)\n\nTôi sẽ hỗ trợ bạn tạo phiếu ngay sau khi có thông tin.' },
]

export default function Chatbot() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [toast, setToast] = useState("")
  const messagesEndRef = useRef(null)

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    const userMessage = input.trim()
    setInput("")
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setLoading(true)
    
    try {
      const res = await api.post('/ai/chat', { message: userMessage })
      const response = res.data?.data?.response || res.data?.response || 'Xin lỗi, tôi chưa có phản hồi.'
      setMessages(prev => [...prev, { role: 'assistant', text: response }])
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout eyebrow="AI Assistant" title="AI Chatbot" description="Trợ lý AI thông minh hỗ trợ tra cứu và tạo phiếu.">
      <div className="chat-container">
        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chat-avatar assistant">
                  <Icon name="chat" size={16} />
                </div>
              )}
              <div className="chat-bubble">
                <p style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
              </div>
              {msg.role === 'user' && (
                <div className="chat-avatar user">MN</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <div className="chat-avatar assistant">
                <Icon name="chat" size={16} />
              </div>
              <div className="chat-bubble">
                <p>Đang trả lời...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input" onSubmit={handleSend}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            <Icon name="arrow" size={18} />
          </button>
        </form>
      </div>

      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
