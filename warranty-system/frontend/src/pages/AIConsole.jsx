import { useState } from 'react'
import Layout from '../components/Layout'
import { aiService } from '../services/services'

const EXAMPLES = [
  'Màn hình bị sọc ngang, đôi khi tắt đột ngột và khởi động lại.',
  'Pin xuống rất nhanh, chỉ dùng được 2 tiếng. Máy nóng bất thường.',
  'Camera chụp ảnh bị mờ, không lấy nét được, đặc biệt trong điều kiện thiếu sáng.',
  'Bàn phím liệt một vài phím, phím Space không nhạy.',
  'Loa phát ra tiếng rè khi nghe nhạc ở âm lượng trên 50%.',
]

const CATEGORY_COLORS = {
  'Hỏng phần cứng màn hình': { bg: '#FEE2E2', color: '#991B1B' },
  'Lỗi pin / Nguồn điện': { bg: '#FEF3C7', color: '#92400E' },
  'Lỗi module camera': { bg: '#DBEAFE', color: '#1E40AF' },
  'Lỗi bàn phím / Input': { bg: '#EDE9FE', color: '#5B21B6' },
  'Lỗi âm thanh': { bg: '#D1FAE5', color: '#065F46' },
  'Lỗi phần mềm': { bg: '#F1F5F9', color: '#475569' },
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 mt-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full cursor-blink"
          style={{ background: '#64748B', animationDelay: `${i * 0.2}s`, animation: 'blink 1s infinite' }} />
      ))}
    </div>
  )
}

export default function AIConsole() {
  const [mode, setMode] = useState('classify') // classify | progress
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleClassify() {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const r = await aiService.classify(input)
      setResult(r)
    } catch {
      setResult({ classification: 'Không phân loại được', confidence: 0, tags: [] })
    } finally {
      setLoading(false)
    }
  }

  async function handleProgress() {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const r = await aiService.progressMessage({ description: input })
      setResult({ message: r.message || r.progress_message || r })
    } catch {
      setResult({ message: 'Không tạo được tin nhắn tiến độ.' })
    } finally {
      setLoading(false)
    }
  }

  const handleExample = (text) => { setInput(text); setResult(null) }

  return (
    <Layout pageId="ai">
      <div className="app-page space-y-6">
        <div>
          <h1 className="app-page-title">Trợ lý bảo hành</h1>
          <p className="app-page-subtitle">Phân loại sự cố và soạn nội dung cập nhật tiến độ</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
          {[
            { id: 'classify', label: 'Phân loại lỗi' },
            { id: 'progress', label: 'Tin nhắn tiến độ' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setMode(tab.id); setResult(null); setInput('') }}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: mode === tab.id ? '#EEF2FF' : 'transparent',
                color: mode === tab.id ? '#4338CA' : '#73768A',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Examples */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: '#94A3B8' }}>Ví dụ nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => handleExample(ex)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
                style={{ borderColor: '#E4EBF7', color: '#64748B', background: '#FFFFFF' }}>
                {ex.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="app-panel p-5">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={4}
            className="w-full rounded-xl border text-sm p-3 resize-none"
            style={{ borderColor: '#E7E9F1', background: '#F8F9FC', color: '#191B2A' }}
            placeholder={mode === 'classify' ? 'Nhập mô tả triệu chứng khách hàng...' : 'Nhập mô tả tình trạng phiếu...'}
          />
          <div className="flex justify-end mt-3">
            <button onClick={mode === 'classify' ? handleClassify : handleProgress}
              disabled={loading || !input.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: loading || !input.trim() ? '#A5A7B4' : '#4F46E5', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Đang phân tích...' : mode === 'classify' ? 'Phân loại bằng AI' : 'Sinh tin nhắn'}
            </button>
          </div>
        </div>

        {/* Result */}
        {loading && (
          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>AI đang phân tích...</div>
            <TypingDots />
          </div>
        )}

        {result && !loading && mode === 'classify' && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EEF4FF', color: '#2563EB' }}>
                🤖
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1929' }}>Kết quả phân loại</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>Độ chính xác: {result.confidence || 0}%</div>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: CATEGORY_COLORS[result.classification]?.bg || '#F1F5F9' }}>
              <div className="text-sm font-semibold" style={{ color: CATEGORY_COLORS[result.classification]?.color || '#475569' }}>
                {result.classification || 'Không xác định'}
              </div>
            </div>
            {result.tags && result.tags.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: '#94A3B8' }}>Gợi ý kiểm tra:</div>
                <div className="flex flex-wrap gap-2">
                  {(result.tags).map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: '#EEF4FF', color: '#1A3A6B' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result && !loading && mode === 'progress' && (
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: '#0F1929' }}>Tin nhắn tiến độ gợi ý:</div>
            <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E4EBF7' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                {result.message || JSON.stringify(result)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
