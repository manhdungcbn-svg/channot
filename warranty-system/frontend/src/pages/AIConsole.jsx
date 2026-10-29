import { useState } from 'react'
import Layout from '../components/Layout'
import { aiService } from '../services/services'

const EXAMPLES = [
  'Màn hình bị sọc ngang, đôi khi tắt đột ngột và khởi động lại.',
  'Pin xuống rất nhanh, chỉ dùng được 2 tiếng. Máy nóng bất thường.',
  'Camera chụp ảnh bị mờ, không lấy nét được, đặc biệt trong điều kiện thiếu sáng.',
  'Bàn phím liệt một vài phím, phím Space không nhạy.',
  'Loa phát ra tiếng rè khi nghe nhạc ở âm lượng trên 50%.',
  'Máy bị dính nước vào, không bật được nữa.',
]

const PRIORITY_COLORS = {
  CRITICAL: { bg: '#FEE2E2', color: '#991B1B' },
  HIGH: { bg: '#FFEDD5', color: '#9A3412' },
  MEDIUM: { bg: '#FEF3C7', color: '#92400E' },
  LOW: { bg: '#F1F5F9', color: '#475569' },
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
  const [mode, setMode] = useState('classify') // classify | progress | history
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // State riêng cho tab tin nhắn tiến độ
  const [ticketCode, setTicketCode] = useState('WR-2026-0045')
  const [status, setStatus] = useState('INSPECTION')

  async function handleClassify() {
    if (!input.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const r = await aiService.classify(input)
      setResult(r)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Không phân loại được. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function handleProgress() {
    if (!ticketCode.trim() || !status) return
    setLoading(true); setResult(null); setError('')
    try {
      const r = await aiService.progressMessage({
        ticket_code: ticketCode.trim(),
        status,
        product_name: 'TechNova Pro 15',
      })
      setResult({ message: r.message })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Không tạo được tin nhắn tiến độ.')
    } finally {
      setLoading(false)
    }
  }

  async function handleHistory() {
    if (!input.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const r = await aiService.warrantyHistory(input.trim())
      setResult(r)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Không tìm thấy sản phẩm với serial này.')
    } finally {
      setLoading(false)
    }
  }

  const handleExample = (text) => { setInput(text); setResult(null); setError('') }

  const PLACEHOLDER = {
    classify: 'Nhập mô tả triệu chứng khách hàng...',
    progress: 'Chọn mã phiếu và trạng thái để sinh tin nhắn',
    history: 'Nhập số serial sản phẩm (ví dụ: TND-AC10-001)...',
  }

  const STATUS_OPTIONS = [
    { id: 'RECEIVED', label: 'Tiếp nhận' },
    { id: 'INSPECTION', label: 'Đang kiểm tra' },
    { id: 'APPROVAL', label: 'Chờ phê duyệt' },
    { id: 'REPAIRING', label: 'Đang sửa chữa' },
    { id: 'COMPLETED', label: 'Hoàn tất' },
    { id: 'REJECTED', label: 'Từ chối' },
    { id: 'DELIVERED', label: 'Đã giao' },
  ]

  return (
    <Layout pageId="ai">
      <div className="app-page space-y-6">
        <div>
          <h1 className="app-page-title">Trợ lý bảo hành</h1>
          <p className="app-page-subtitle">Phân loại sự cố, tóm tắt lịch sử bảo hành và soạn nội dung cập nhật tiến độ</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
          {[
            { id: 'classify', label: 'Phân loại lỗi' },
            { id: 'history', label: 'Lịch sử bảo hành' },
            { id: 'progress', label: 'Tin nhắn tiến độ' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setMode(tab.id); setResult(null); setError(''); setInput('') }}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: mode === tab.id ? '#EEF2FF' : 'transparent',
                color: mode === tab.id ? '#4338CA' : '#73768A',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Examples — chỉ cho tab classify */}
        {mode === 'classify' && (
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
        )}

        {/* Input */}
        <div className="app-panel p-5">
          {mode === 'progress' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>Mã phiếu</label>
                <input
                  type="text"
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  placeholder="WR-2026-0045"
                  className="w-full rounded-xl border text-sm p-3 mt-1.5"
                  style={{ borderColor: '#E7E9F1', background: '#F8F9FC', color: '#191B2A' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>Trạng thái</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full rounded-xl border text-sm p-3 mt-1.5"
                  style={{ borderColor: '#E7E9F1', background: '#F8F9FC', color: '#191B2A' }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setError('') }}
              rows={4}
              className="w-full rounded-xl border text-sm p-3 resize-none"
              style={{ borderColor: '#E7E9F1', background: '#F8F9FC', color: '#191B2A' }}
              placeholder={PLACEHOLDER[mode]}
            />
          )}
          <div className="flex justify-end mt-3">
            <button
              onClick={mode === 'classify' ? handleClassify : mode === 'history' ? handleHistory : handleProgress}
              disabled={loading || (mode === 'progress' ? !ticketCode.trim() : !input.trim())}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: loading ? '#A5A7B4' : '#4F46E5', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Đang xử lý...' : mode === 'classify' ? 'Phân loại bằng AI' : mode === 'history' ? 'Tóm tắt lịch sử' : 'Sinh tin nhắn'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>AI đang phân tích...</div>
            <TypingDots />
          </div>
        )}

        {/* Result — classify */}
        {result && !loading && mode === 'classify' && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EEF4FF', color: '#2563EB' }}>
                🤖
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1929' }}>Kết quả phân loại</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>
                  Độ chính xác: {Math.round((result.confidence || 0) * 100)}%
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl space-y-2" style={{ background: PRIORITY_COLORS[result.priority]?.bg || '#F1F5F9' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{ background: '#FFFFFF', color: PRIORITY_COLORS[result.priority]?.color || '#475569' }}>
                  {result.priority}
                </span>
                <div className="text-sm font-semibold" style={{ color: PRIORITY_COLORS[result.priority]?.color || '#475569' }}>
                  {result.label || result.classification}
                </div>
              </div>
              {result.note && (
                <div className="text-xs" style={{ color: '#475569' }}>{result.note}</div>
              )}
              <div className="text-xs" style={{ color: '#64748B' }}>
                💰 {result.warranty_eligible
                  ? 'Được hỗ trợ bảo hành miễn phí nếu còn thời hạn'
                  : 'Không áp dụng bảo hành miễn phí — sẽ báo giá trước khi sửa'}
              </div>
            </div>
            {result.tags && result.tags.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: '#94A3B8' }}>Gợi ý kiểm tra:</div>
                <div className="space-y-1.5">
                  {result.tags.map((tag, i) => (
                    <div key={i} className="text-xs flex gap-1.5" style={{ color: '#475569' }}>
                      <span style={{ color: '#4F46E5' }}>▸</span>{tag}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result — history */}
        {result && !loading && mode === 'history' && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1929' }}>{result.product_name}</div>
                <div className="text-xs font-mono" style={{ color: '#64748B' }}>{result.serial}</div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                style={result.warranty_status === 'YES'
                  ? { background: '#D1FAE5', color: '#065F46' }
                  : { background: '#FEE2E2', color: '#991B1B' }}>
                {result.warranty_status === 'YES' ? '✓ Còn bảo hành' : '✕ Hết bảo hành'}
              </span>
            </div>
            <div className="text-xs" style={{ color: '#64748B' }}>
              Số lần bảo hành: <strong>{result.ticket_count}</strong> · {result.warranty_end_date}
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E4EBF7' }}>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ color: '#374151' }}>
                {result.summary}
              </pre>
            </div>
          </div>
        )}

        {/* Result — progress */}
        {result && !loading && mode === 'progress' && (
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: '#0F1929' }}>Tin nhắn tiến độ gợi ý:</div>
            <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E4EBF7' }}>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: '#374151' }}>
                {result.message}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
