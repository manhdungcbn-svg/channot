import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

/**
 * Trang "đang được cập nhật" — dùng cho các tính năng chưa hoàn thiện.
 * Giữ đúng ngôn ngữ thị giác của admin app (dark hero + .app-page + .app-panel).
 */
export default function ComingSoon({ title = 'Tính năng đang được cập nhật', description = '', eta = 'Đang cập nhật', icon = '🚧' }) {
  const navigate = useNavigate()
  const [showDetail, setShowDetail] = useState(false)

  return (
    <Layout pageId="coming-soon">
      <div className="app-page">
        <div className="app-panel overflow-hidden">
          {/* Hero */}
          <div
            className="px-6 py-12 text-center"
            style={{ background: 'linear-gradient(135deg, #0F1929 0%, var(--brand-700) 60%, var(--brand-600) 100%)' }}
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
              style={{ background: 'rgba(255,255,255,0.12)', fontSize: '38px' }}
            >
              {icon}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {title}
            </h1>
            <p className="text-sm max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {description || 'Chúng tôi đang hoàn thiện tính năng này. Bạn sẽ được thông báo ngay khi sẵn sàng.'}
            </p>

            {/* Trạng thái ETA */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--info-text)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
              {eta}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-full max-w-lg p-4 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Trong lúc chờ, bạn có thể dùng:
              </p>
              <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <li>• Trợ lý ảo để tra cứu bảo hành nhanh</li>
                <li>• Tra cứu phiếu bảo hành công khai bằng mã sê-ri</li>
                <li>• Theo dõi tiến độ phiếu của bạn tại mục “Phiếu của tôi”</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'var(--brand-600)' }}
              >
                Quay lại trang chủ
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Hỏi trợ lý ảo
              </button>
              <button
                onClick={() => setShowDetail(v => !v)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              >
                {showDetail ? 'Ẩn chi tiết' : 'Chi tiết cập nhật'}
              </button>
            </div>

            {showDetail && (
              <div className="w-full max-w-lg p-4 rounded-xl text-left" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--brand-800)' }}>Tiến độ cập nhật</p>
                <ul className="space-y-1.5 text-xs" style={{ color: 'var(--brand-700)' }}>
                  <li>✓ Hoàn thiện giao diện &amp; luồng nghiệp vụ</li>
                  <li>✓ Tích hợp API backend</li>
                  <li>⏳ Kiểm thử &amp; tinh chỉnh trải nghiệm</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
