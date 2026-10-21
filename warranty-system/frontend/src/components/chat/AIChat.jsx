import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const ANIMATION_CONFIG = {
  messageSlideIn: {
    duration: 0.2,
    ease: 'easeOut'
  },
  typingDotDuration: 300,
  scrollThreshold: 48, // px from bottom to stop auto-scroll
  streamingWordDelay: 20 // ms per word for streaming effect
}

const INITIAL_SUGGESTIONS = [
  { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
  { id: 2, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
  { id: 3, text: 'Kiểm tra điều kiện BH', icon: '📦', action: 'check_warranty' },
  { id: 4, text: 'Câu hỏi thường gặp', icon: '❓', action: 'show_faq' }
]

const TYPING_INDICATOR_DOTS = ['●', '○', '○']

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: `
    flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950
    rounded-xl overflow-hidden border border-slate-700/50
  `,
  header: `
    flex items-center justify-between px-4 py-3 
    bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50
  `,
  headerTitle: `
    flex items-center gap-2 text-slate-100 font-medium
  `,
  headerBadge: `
    px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400
  `,
  messagesArea: `
    flex-1 overflow-y-auto px-4 py-4 space-y-4
    scroll-smooth
  `,
  messageGroup: `
    flex gap-3 max-w-[85%]
  `,
  userMessage: `
    flex flex-col items-end ml-auto
  `,
  botMessage: `
    flex flex-col items-start mr-auto
  `,
  bubble: `
    px-4 py-3 rounded-2xl max-w-full
  `,
  userBubble: `
    bg-gradient-to-r from-cyan-600 to-cyan-500
    text-white rounded-br-md
  `,
  botBubble: `
    bg-slate-800/80 backdrop-blur-sm
    border border-slate-700/50 rounded-bl-md
  `,
  suggestionsArea: `
    px-4 py-3 border-t border-slate-700/30 bg-slate-900/50
  `,
  suggestionsTitle: `
    text-xs text-slate-500 mb-2 font-medium
  `,
  suggestionsGrid: `
    flex flex-wrap gap-2
  `,
  suggestionChip: `
    px-3 py-2 text-sm rounded-lg
    bg-slate-800/60 border border-slate-700/50
    text-slate-300 hover:bg-slate-700/70 hover:border-cyan-500/50
    transition-all duration-200 cursor-pointer
    flex items-center gap-2
  `,
  inputArea: `
    px-4 py-3 border-t border-slate-700/50 bg-slate-800/50
  `,
  inputWrapper: `
    flex items-center gap-3 bg-slate-900/80 rounded-xl
    border border-slate-700/50 focus-within:border-cyan-500/50
    transition-colors duration-200
  `,
  input: `
    flex-1 px-4 py-3 bg-transparent text-slate-100
    placeholder-slate-500 outline-none resize-none
    max-h-32
  `,
  sendButton: `
    p-2 rounded-lg bg-cyan-600 text-white
    hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200 flex items-center justify-center
  `,
  typingIndicator: `
    flex items-center gap-1 px-3 py-2
  `,
  typingDot: `
    w-2 h-2 rounded-full bg-slate-500
  `
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Typing Indicator Component
 * Animated dots showing AI is processing
 */
function TypingIndicator({ isVisible }) {
  const [dotIndex, setDotIndex] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    
    const interval = setInterval(() => {
      setDotIndex(prev => (prev + 1) % 3)
    }, ANIMATION_CONFIG.typingDotDuration)

    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={styles.botMessage}
        >
          <div className={`${styles.bubble} ${styles.botBubble}`}>
            <div className={styles.typingIndicator}>
              {TYPING_INDICATOR_DOTS.map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.typingDot}
                  animate={{
                    opacity: dotIndex === i ? 1 : 0.3,
                    scale: dotIndex === i ? 1.2 : 1
                  }}
                  transition={{ duration: 0.15 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Message Bubble Component
 * Individual chat message with animation
 */
function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: ANIMATION_CONFIG.messageSlideIn.duration,
        ease: ANIMATION_CONFIG.messageSlideIn.ease
      }}
      className={isUser ? styles.userMessage : styles.botMessage}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm mb-1">
          🤖
        </div>
      )}
      
      {/* Bubble */}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        {/* Streaming cursor */}
        {isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-cyan-400 ml-1"
          />
        )}
        
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {formatMessageContent(message.content)}
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-slate-500 mt-2 text-right">
          {message.timestamp ? formatTime(message.timestamp) : 'Bây giờ'}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Suggestion Chips Component
 * Clickable quick action buttons
 */
function SuggestionChips({ suggestions, onSelect, disabled = false }) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.suggestionsArea}
    >
      <div className={styles.suggestionsTitle}>
        💡 Gợi ý cho bạn
      </div>
      <div className={styles.suggestionsGrid}>
        {suggestions.map((suggestion) => (
          <motion.button
            key={suggestion.id || suggestion.action}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className={styles.suggestionChip}
          >
            <span>{suggestion.icon || '💬'}</span>
            <span>{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Jump to Latest Button
 * Appears when user scrolls up during streaming
 */
function JumpToLatestButton({ onClick, isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={onClick}
          className="
            absolute bottom-24 left-1/2 -translate-x-1/2
            px-4 py-2 rounded-full
            bg-slate-800 border border-cyan-500/50
            text-cyan-400 text-sm font-medium
            shadow-lg shadow-cyan-500/20
            flex items-center gap-2
            hover:bg-slate-700 transition-colors
          "
        >
          <span>↓</span>
          <span>Cuộn xuống mới nhất</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatMessageContent(content) {
  // Simple markdown-like formatting
  return content
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Bullet points
    .replace(/^• /gm, '• ')
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ============================================================================
// MAIN CHAT COMPONENT
// ============================================================================

/**
 * AIChat - Main Chat Component
 * Features:
 * - Real-time streaming responses
 * - Typing indicator
 * - Quick suggestions
 * - Smooth scroll behavior
 * - Reduced motion support
 */
export default function AIChat() {
  // State
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      content: 'Xin chào! 👋 Tôi là trợ lý AI của BảoHành Pro.\n\nTôi có thể giúp bạn:\n• Tra cứu thông tin sản phẩm\n• Kiểm tra điều kiện bảo hành\n• Tạo yêu cầu bảo hành\n• Trả lời câu hỏi thường gặp\n\nBạn cần hỗ trợ gì?',
      timestamp: new Date(),
      suggestions: INITIAL_SUGGESTIONS
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [error, setError] = useState(null)
  
  // Refs
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : behavior
    })
  }, [prefersReducedMotion])

  // Check if user is near bottom
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    return scrollHeight - scrollTop - clientHeight < ANIMATION_CONFIG.scrollThreshold
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom()
    setShowJumpButton(!nearBottom && isStreaming)
  }, [isNearBottom, isStreaming])

  // Send message
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isTyping) return
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
      suggestions: null
    }
    
    // Add user message
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    setError(null)
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 100)
    
    try {
      // Call API
      const response = await api.post('/ai/chat', {
        message: messageText,
        context: {
          session_id: `session-${Date.now()}`
        }
      })
      
      const botResponse = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: response.data.response || 'Xin lỗi, tôi không thể trả lời lúc này.',
        timestamp: new Date(),
        suggestions: response.data.suggestions || INITIAL_SUGGESTIONS,
        intent: response.data.intent
      }
      
      setMessages(prev => [...prev, botResponse])
    } catch (err) {
      console.error('Chat error:', err)
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content: '❌ Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
        timestamp: new Date(),
        suggestions: INITIAL_SUGGESTIONS
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setTimeout(scrollToBottom, 100)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    // Map suggestion to appropriate message
    const messageMap = {
      'lookup_serial': 'Tra cứu serial',
      'create_ticket': 'Tôi muốn tạo yêu cầu bảo hành',
      'check_warranty': 'Kiểm tra điều kiện bảo hành',
      'show_faq': 'Câu hỏi thường gặp'
    }
    
    const message = messageMap[suggestion.action] || suggestion.text
    sendMessage(message)
  }

  // Handle input key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  // Effects
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className="text-xl">🤖</span>
          <span>AI Assistant</span>
        </div>
        <div className={styles.headerBadge}>
          <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block mr-1 animate-pulse" />
          Online
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={styles.messagesArea}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === messages[messages.length - 1].id}
          />
        ))}
        
        <TypingIndicator isVisible={isTyping && !isStreaming} />
        
        {error && (
          <div className="text-red-400 text-sm text-center py-2">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Jump to Latest Button */}
      <JumpToLatestButton 
        onClick={() => scrollToBottom('instant')}
        isVisible={showJumpButton}
      />

      {/* Suggestions */}
      {messages.length > 0 && !isTyping && (
        <SuggestionChips
          suggestions={messages[messages.length - 1].suggestions}
          onSelect={handleSuggestionClick}
          disabled={isTyping}
        />
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className={styles.input}
            rows={1}
            disabled={isTyping}
            aria-label="Nhập tin nhắn"
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className={styles.sendButton}
            aria-label="Gửi tin nhắn"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </button>
        </div>
        
        {/* Model info */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Model: Gemini 2.0</span>
          <span>Powered by BảoHành Pro AI</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  TypingIndicator, 
  MessageBubble, 
  SuggestionChips,
  JumpToLatestButton 
}
