import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  scrollThreshold: 48,
  typingDuration: 1500,
  streamingDelay: 30
}

const INITIAL_SUGGESTIONS = [
  { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
  { id: 2, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
  { id: 3, text: 'Kiểm tra điều kiện BH', icon: '📦', action: 'check_warranty' },
  { id: 4, text: 'Câu hỏi thường gặp', icon: '❓', action: 'show_faq' }
]

// ============================================================================
// RESPONSE TEMPLATES
// ============================================================================

const RESPONSES = {
  greeting: {
    text: `Xin chào! 👋 

Tôi là **trợ lý AI** của BảoHành Pro.

Tôi có thể giúp bạn:

🔍 **Tra cứu serial** - Kiểm tra thông tin sản phẩm

📋 **Tạo yêu cầu BH** - Hỗ trợ tạo phiếu bảo hành

📦 **Kiểm tra bảo hành** - Xem điều kiện và trạng thái

❓ **FAQ** - Trả lời câu hỏi thường gặp

Bạn cần hỗ trợ gì hôm nay?`,
    suggestions: INITIAL_SUGGESTIONS
  },

  lookup_serial: {
    text: `🔍 Để tra cứu thông tin sản phẩm, vui lòng nhập **số serial**.

Serial thường nằm ở:
• Nhãn phía dưới sản phẩm
• Hộp đựng sản phẩm  
• Hoá đơn mua hàng

**Nhập serial của bạn:**`,
    suggestions: [
      { id: 1, text: 'Hướng dẫn tìm serial', icon: '📖', action: 'how_to_find' },
      { id: 2, text: 'Đăng ký sản phẩm mới', icon: '➕', action: 'register' }
    ]
  },

  product_found: (data) => `✅ **Tìm thấy sản phẩm!**

📦 **Thông tin sản phẩm:**
• **Tên:** ${data.name}
• **Serial:** ${data.serial}
• **Danh mục:** ${data.category}
• **Giá:** ${data.price}
• **Ngày mua:** ${data.purchaseDate}

📅 **Bảo hành:**
• **Thời hạn:** ${data.warrantyMonths} tháng
• **Ngày hết hạn:** ${data.expiryDate}
• **Trạng thái:** ${data.warrantyStatus === 'within' ? '✅ CÒN HẠN' : '❌ ĐÃ HẾT HẠN'}

Bạn có muốn thực hiện thao tác gì?`,
    suggestions: [
      { id: 1, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
      { id: 2, text: 'Xem chi tiết', icon: '👁️', action: 'view_details' },
      { id: 3, text: 'Tra cứu sản phẩm khác', icon: '🔍', action: 'lookup_serial' }
    ]
  },

  product_not_found: {
    text: `❌ **Không tìm thấy sản phẩm**

Serial bạn nhập không tồn tại trong hệ thống.

**Vui lòng kiểm tra lại:**
• Serial có đúng định dạng (VD: TND-AC10-001)
• Không có khoảng trắng thừa
• Phân biệt chữ hoa/thường

Nếu serial đúng, sản phẩm có thể chưa được đăng ký. Bạn có muốn đăng ký sản phẩm mới?`,
    suggestions: [
      { id: 1, text: 'Thử lại', icon: '🔄', action: 'lookup_serial' },
      { id: 2, text: 'Đăng ký sản phẩm mới', icon: '➕', action: 'register' }
    ]
  },

  warranty_check: {
    text: `📦 **Kiểm tra điều kiện bảo hành**

Để kiểm tra, tôi cần biết serial sản phẩm.

Vui lòng nhập serial để tôi kiểm tra:
• Ngày hết hạn bảo hành
• Trạng thái hiện tại
• Điều kiện áp dụng

**Ví dụ:** \`TND-AC10-001\``,
    suggestions: [
      { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
      { id: 2, text: 'Hướng dẫn tìm serial', icon: '📖', action: 'how_to_find' }
    ]
  },

  create_ticket: {
    text: `📝 **Tạo yêu cầu bảo hành**

Để tạo yêu cầu, tôi cần:

**1.** Serial sản phẩm (nếu chưa có)

**2.** Mô tả lỗi/sự cố - Bạn gặp vấn đề gì với sản phẩm?

**3.** Mức độ nghiêm trọng:
• 🔴 Nghiêm trọng - Không sử dụng được
• 🟡 Trung bình - Hoạt động nhưng có vấn đề
• 🟢 Nhẹ - Lỗi nhỏ, không ảnh hưởng nhiều

Bạn có thể nhập serial trước để tôi kiểm tra thông tin sản phẩm?`,
    suggestions: [
      { id: 1, text: 'Nhập serial', icon: '🔍', action: 'enter_serial' },
      { id: 2, text: 'Xem hướng dẫn', icon: '📖', action: 'how_to_create' }
    ]
  },

  ticket_created: (data) => `✅ **Yêu cầu bảo hành đã được tạo!**

📋 **Thông tin phiếu:**
• **Mã phiếu:** ${data.ticketCode}
• **Trạng thái:** Đã tiếp nhận
• **Ngày tạo:** ${data.createdAt}
• **Kỹ thuật viên:** ${data.technician}

⏰ **Thời gian xử lý dự kiến:** 24-48 giờ

📱 **Theo dõi:**
Bạn sẽ nhận được thông báo khi có cập nhật. Có thể tra cứu trạng thái bất cứ lúc nào.`,
    suggestions: [
      { id: 1, text: 'Xem chi tiết phiếu', icon: '👁️', action: 'view_ticket' },
      { id: 1, text: 'Tra cứu sản phẩm khác', icon: '🔍', action: 'lookup_serial' }
    ]
  },

  faq: {
    text: `❓ **Câu hỏi thường gặp**

📌 **Làm sao để bảo hành?**
Đăng ký online hoặc mang sản phẩm đến trung tâm bảo hành gần nhất.

📌 **Bảo hành bao lâu?**
Thông thường 12-24 tháng tùy sản phẩm.

📌 **Cần mang theo gì?**
• Sản phẩm
• Hóa đơn mua hàng (nếu có)
• Phiếu bảo hành (nếu có)

📌 **Sản phẩm không bảo hành khi nào?**
• Hỏng do rơi vỡ, va đập
• Tự ý sửa chữa
• Thiên tai, cháy nổ
• Sử dụng sai hướng dẫn

Bạn muốn hỏi về vấn đề gì cụ thể?`,
    suggestions: [
      { id: 1, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
      { id: 2, text: 'Kiểm tra điều kiện BH', icon: '📦', action: 'check_warranty' },
      { id: 3, text: 'Liên hệ hotline', icon: '📞', action: 'contact' }
    ]
  },

  shipping: {
    text: `📦 **Thông tin vận chuyển & giao hàng**

🚚 **Thời gian giao hàng:**
• Nội thành: 1-2 ngày làm việc
• Ngoại thành: 3-5 ngày làm việc
• Miễn phí giao hàng cho đơn từ 500K

📋 **Quy trình:**
1. Đăng ký bảo hành online
2. Nhận mã vận đơn
3. Gửi sản phẩm về trung tâm bảo hành
4. Theo dõi trạng thái online

Bạn có câu hỏi nào khác không?`,
    suggestions: [
      { id: 1, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
      { id: 2, text: 'Câu hỏi khác', icon: '❓', action: 'show_faq' }
    ]
  },

  repair: {
    text: `🔧 **Dịch vụ sửa chữa & thay thế**

⏱️ **Thời gian xử lý:**
• Kiểm tra: 1-2 ngày
• Sửa chữa thông thường: 3-5 ngày
• Sửa phức tạp: 7-14 ngày

💰 **Chi phí:**
• Trong bảo hành: **Miễn phí**
• Hết bảo hành: Báo giá trước khi sửa

🛠️ **Quy trình:**
1. Tiếp nhận và kiểm tra
2. Báo giá (nếu có phí)
3. Tiến hành sửa chữa
4. Test và bàn giao

Bạn cần hỗ trợ thêm gì?`,
    suggestions: [
      { id: 1, text: 'Kiểm tra điều kiện BH', icon: '📦', action: 'check_warranty' },
      { id: 2, text: 'Liên hệ hotline', icon: '📞', action: 'contact' }
    ]
  },

  escalate: {
    text: `⚠️ **Tôi hiểu bạn cần hỗ trợ đặc biệt**

Để đảm bảo vấn đề của bạn được xử lý tốt nhất, tôi sẽ chuyển bạn đến **đội ngũ hỗ trợ chuyên nghiệp**.

📞 **Hotline:** 1900-xxxx
⏰ **Giờ làm việc:** 8:00 - 17:00 (Thứ 2 - Thứ 6)
💬 **Chat trực tiếp:** Từ 8:00 - 22:00 (7/7)

Vui lòng cung cấp:
• Mã phiếu (nếu có)
• Mô tả chi tiết vấn đề
• Số điện thoại liên hệ

Chúng tôi sẽ phản hồi trong **24 giờ làm việc**.`,
    suggestions: [
      { id: 1, text: 'Gọi hotline', icon: '📞', action: 'call_hotline' },
      { id: 2, text: 'Tiếp tục trò chuyện', icon: '💬', action: 'continue' }
    ]
  },

  thanks: {
    text: `Cảm ơn bạn! 😊

Rất vui được hỗ trợ bạn. Nếu có câu hỏi nào khác, đừng ngần ngại hỏi nhé!`,
    suggestions: [
      { id: 1, text: 'Tiếp tục trò chuyện', icon: '💬', action: 'continue' },
      { id: 2, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' }
    ]
  },

  farewell: {
    text: `Tạm biệt! 👋 

Cảm ơn bạn đã sử dụng dịch vụ của BảoHành Pro.

Nếu cần hỗ trợ thêm, đừng ngần ngại quay lại nhé!

Chúc bạn một ngày tốt lành! 🌟`,
    suggestions: [
      { id: 1, text: 'Bắt đầu cuộc trò chuyện mới', icon: '💬', action: 'restart' }
    ]
  },

  unknown: {
    text: `🤔 Tôi chưa hiểu rõ ý của bạn.

Tôi có thể hỗ trợ bạn về:
• 🔍 Tra cứu serial sản phẩm
• 📋 Tạo yêu cầu bảo hành
• 📦 Kiểm tra điều kiện bảo hành
• ❓ Trả lời câu hỏi thường gặp

Bạn có thể diễn đạt lại hoặc chọn một trong các mục trên?`,
    suggestions: INITIAL_SUGGESTIONS
  }
}

// ============================================================================
// INTENT CLASSIFIER
// ============================================================================

function classifyIntent(text) {
  const lower = text.toLowerCase()
  
  // Serial patterns
  const serialPattern = /\b[A-Z]{2,5}[-_]?[A-Z0-9]{3,15}\b/i
  const hasSerial = serialPattern.test(text)
  
  // Intent patterns
  const patterns = {
    greeting: ['xin chào', 'chào', 'hello', 'hi', 'hey', 'alo', 'good morning'],
    farewell: ['tạm biệt', 'bye', 'goodbye', 'hẹn gặp lại'],
    thanks: ['cảm ơn', 'cam on', 'thank', 'thanks'],
    lookup_serial: ['tra cứu', 'tra cu', 'lookup', 'tìm kiếm', 'search', 'serial', 'số serial', 'mã serial'],
    warranty_check: ['bảo hành', 'bh', 'hết hạn', 'còn bảo hành', 'bao hanh', 'warranty', 'covered'],
    create_ticket: ['tạo', 'tao', 'tạo phiếu', 'yêu cầu', 'create', 'request', 'mới', 'moi'],
    faq: ['câu hỏi', 'faq', 'hỏi', 'question', 'help', 'trợ giúp', 'hướng dẫn'],
    shipping: ['vận chuyển', 'van chuyen', 'shipping', 'giao hàng', 'delivery', 'nhận hàng'],
    repair: ['sửa', 'sua', 'repair', 'thay', 'thay thế', 'replace', 'linh kiện', 'phí'],
    escalate: ['khiếu nại', 'complaint', 'tố cáo', 'phản ánh', 'nghiêm trọng', 'manager']
  }
  
  // Find matching intent
  for (const [intent, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { intent, hasSerial }
    }
  }
  
  return { intent: 'unknown', hasSerial }
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PRODUCTS = {
  'TND-AC10-001': {
    name: 'Router WiFi Tenda AC10',
    serial: 'TND-AC10-001',
    category: 'Router',
    price: '1,200,000 VND',
    purchaseDate: '15/03/2024',
    warrantyMonths: 12,
    expiryDate: '15/03/2025',
    warrantyStatus: 'within',
    daysRemaining: 150
  },
  'CAM-HI3519-002': {
    name: 'Camera IP Hikvision DS-2CD1043G2',
    serial: 'CAM-HI3519-002',
    category: 'Camera',
    price: '2,500,000 VND',
    purchaseDate: '20/05/2024',
    warrantyMonths: 24,
    expiryDate: '20/05/2026',
    warrantyStatus: 'within',
    daysRemaining: 550
  },
  'SW-DLK-003': {
    name: 'Switch D-Link DGS-1210-48',
    serial: 'SW-DLK-003',
    category: 'Switch',
    price: '8,900,000 VND',
    purchaseDate: '10/01/2023',
    warrantyMonths: 12,
    expiryDate: '10/01/2024',
    warrantyStatus: 'expired',
    daysRemaining: 0
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

/** Typing Indicator */
function TypingIndicator({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm flex-shrink-0">
            🤖
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-slate-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Message Bubble */
function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-br-md' 
            : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-bl-md'
        }`}>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-cyan-400 ml-1"
              />
            )}
          </div>
        </div>
        <span className="text-xs text-slate-500 px-1">
          {message.timestamp}
        </span>
      </div>
    </motion.div>
  )
}

/** Suggestion Chips */
function SuggestionChips({ suggestions, onSelect, disabled }) {
  if (!suggestions?.length) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 border-t border-slate-700/30 bg-slate-900/50"
    >
      <div className="text-xs text-slate-500 mb-2 font-medium">💡 Gợi ý cho bạn</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(suggestion => (
          <motion.button
            key={suggestion.id || suggestion.action}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="px-3 py-2 text-sm rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/70 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>{suggestion.icon}</span>
            <span>{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

/** Jump to Latest Button */
function JumpToLatestButton({ visible, onClick }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={onClick}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-800 border border-cyan-500/50 text-cyan-400 text-sm font-medium shadow-lg shadow-cyan-500/20 flex items-center gap-2 hover:bg-slate-700 transition-colors"
        >
          <span>↓</span>
          <span>Cuộn xuống mới nhất</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      content: RESPONSES.greeting.text,
      suggestions: RESPONSES.greeting.suggestions,
      timestamp: 'Bây giờ'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [context, setContext] = useState({}) // Store context like selected serial
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  
  // Check reduced motion
  const prefersReducedMotion = useMemo(() => 
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  , [])
  
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : behavior
    })
  }, [prefersReducedMotion])
  
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    return scrollHeight - scrollTop - clientHeight < CONFIG.scrollThreshold
  }, [])
  
  const handleScroll = useCallback(() => {
    setShowJumpButton(!isNearBottom() && isTyping)
  }, [isNearBottom, isTyping])
  
  // Generate response based on intent
  const generateResponse = useCallback((userMessage) => {
    const { intent, hasSerial } = classifyIntent(userMessage)
    
    // Check for serial in message
    const serialPattern = /\b[A-Z]{2,5}[-_]?[A-Z0-9]{3,15}\b/i
    const match = userMessage.match(serialPattern)
    const extractedSerial = match ? match[0].toUpperCase() : null
    
    // If serial found, update context
    if (extractedSerial) {
      setContext(prev => ({ ...prev, serial: extractedSerial }))
      
      // Check if product exists
      if (MOCK_PRODUCTS[extractedSerial]) {
        const product = MOCK_PRODUCTS[extractedSerial]
        const response = typeof RESPONSES.product_found === 'function' 
          ? RESPONSES.product_found(product) 
          : RESPONSES.product_found.text
        
        return {
          content: response,
          suggestions: RESPONSES.product_found.suggestions,
          data: { intent, product }
        }
      } else {
        return {
          content: RESPONSES.product_not_found.text,
          suggestions: RESPONSES.product_not_found.suggestions,
          data: { intent, notFound: true }
        }
      }
    }
    
    // Generate response based on intent
    switch (intent) {
      case 'greeting':
        return { content: RESPONSES.greeting.text, suggestions: RESPONSES.greeting.suggestions, data: { intent } }
      case 'farewell':
        return { content: RESPONSES.farewell.text, suggestions: RESPONSES.farewell.suggestions, data: { intent } }
      case 'thanks':
        return { content: RESPONSES.thanks.text, suggestions: RESPONSES.thanks.suggestions, data: { intent } }
      case 'lookup_serial':
        return { content: RESPONSES.lookup_serial.text, suggestions: RESPONSES.lookup_serial.suggestions, data: { intent } }
      case 'warranty_check':
        return { content: RESPONSES.warranty_check.text, suggestions: RESPONSES.warranty_check.suggestions, data: { intent } }
      case 'create_ticket':
        return { content: RESPONSES.create_ticket.text, suggestions: RESPONSES.create_ticket.suggestions, data: { intent } }
      case 'faq':
        return { content: RESPONSES.faq.text, suggestions: RESPONSES.faq.suggestions, data: { intent } }
      case 'shipping':
        return { content: RESPONSES.shipping.text, suggestions: RESPONSES.shipping.suggestions, data: { intent } }
      case 'repair':
        return { content: RESPONSES.repair.text, suggestions: RESPONSES.repair.suggestions, data: { intent } }
      case 'escalate':
        return { content: RESPONSES.escalate.text, suggestions: RESPONSES.escalate.suggestions, data: { intent } }
      default:
        return { content: RESPONSES.unknown.text, suggestions: RESPONSES.unknown.suggestions, data: { intent } }
    }
  }, [])
  
  // Send message
  const sendMessage = useCallback((messageText) => {
    if (!messageText.trim() || isTyping) return
    
    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
    
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)
    
    // Scroll after adding message
    setTimeout(scrollToBottom, 100)
    
    // Simulate typing delay
    setTimeout(() => {
      const response = generateResponse(messageText)
      
      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: response.content,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
      
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
      
      // Handle special actions
      if (response.data?.intent === 'create_ticket' && context.serial) {
        // Could trigger ticket creation modal here
      }
      
      setTimeout(scrollToBottom, 100)
    }, CONFIG.typingDuration)
  }, [isTyping, scrollToBottom, generateResponse, context])
  
  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    const messageMap = {
      'lookup_serial': 'Tra cứu serial',
      'create_ticket': 'Tôi muốn tạo yêu cầu bảo hành',
      'check_warranty': 'Kiểm tra điều kiện bảo hành',
      'show_faq': 'Câu hỏi thường gặp',
      'continue': 'Tiếp tục',
      'restart': 'Bắt đầu lại'
    }
    
    const message = messageMap[suggestion.action] || suggestion.text
    sendMessage(message)
  }, [sendMessage])
  
  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }, [inputValue, sendMessage])
  
  // Effects
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl overflow-hidden border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-100 font-medium">
          <span className="text-xl">🤖</span>
          <span>AI Assistant</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Online
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      >
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        <TypingIndicator visible={isTyping} />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Jump to Latest */}
      <JumpToLatestButton 
        visible={showJumpButton} 
        onClick={() => scrollToBottom('instant')} 
      />

      {/* Suggestions */}
      {messages.length > 0 && !isTyping && messages[messages.length - 1].suggestions && (
        <SuggestionChips 
          suggestions={messages[messages.length - 1].suggestions} 
          onSelect={handleSuggestionClick}
          disabled={isTyping}
        />
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3 bg-slate-900/80 rounded-xl border border-slate-700/50 focus-within:border-cyan-500/50 transition-colors">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 outline-none resize-none max-h-32 text-sm"
            rows={1}
            disabled={isTyping}
            aria-label="Nhập tin nhắn"
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="p-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Gửi tin nhắn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Model: Gemini 2.0 Flash</span>
          <span>Powered by BảoHành Pro AI</span>
        </div>
      </div>
    </div>
  )
}
