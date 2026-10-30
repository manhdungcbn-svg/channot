import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { walletService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import QRCode from 'qrcode'

const BANK_ACCOUNT = '3300722488'
const BANK_BIN = '970418'
const BANK_CODE = 'BIDV'
const BANK_ACCOUNT_HOLDER = 'VU MANH DUNG'

function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') }

function emvField(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function crc16(payload) {
  let crc = 0xffff

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
    crc &= 0xffff
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function buildVietQrPayload(amount, transferCode) {
  const accountInfo = [
    emvField('00', 'A000000727'),
    emvField('01', `${emvField('00', BANK_BIN)}${emvField('01', BANK_ACCOUNT)}`),
    emvField('02', 'QRIBFTTA'),
  ].join('')
  const payload = [
    emvField('00', '01'),
    emvField('01', '12'),
    emvField('38', accountInfo),
    emvField('53', '704'),
    emvField('54', String(amount)),
    emvField('58', 'VN'),
    emvField('62', emvField('08', transferCode)),
    '6304',
  ].join('')

  return `${payload}${crc16(payload)}`
}

function BidvLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#E3001B"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">BIDV</text>
    </svg>
  )
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all"
      style={{ color: copied ? 'var(--success-text)' : 'var(--info)', background: copied ? 'var(--success-bg)' : 'var(--brand-50)' }}>
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Đã sao chép
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Sao chép
        </>
      )}
    </button>
  )
}

function RadarPulse() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-16 h-16">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(37, 99, 235, 0.15)',
              animation: `radarPulse 2s ease-out ${i * 0.6}s infinite`,
            }} />
        ))}
        <div className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(37, 99, 235, 0.25)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
      </div>
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Đang chờ hệ thống ngân hàng xác nhận giao dịch tự động...
      </p>
    </div>
  )
}

function QRModal({ amount, onClose, onConfirm }) {
  // Generate transfer code ONCE when modal opens — stays stable during session
  const [transferCode] = useState(() =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  )
  const canvasRef = useRef(null)

  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
  const [isWaiting, setIsWaiting] = useState(false)
  const [qrError, setQrError] = useState('')
  const qrContent = buildVietQrPayload(amount, transferCode)

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Generate QR — only once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    QRCode.toCanvas(canvas, qrContent, {
      width: 200, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(() => setQrError('')).catch(error => {
      console.error('Không thể tạo mã VietQR:', error)
      setQrError('Không thể tạo mã QR. Vui lòng tải lại và thử lại.')
    })
  }, [qrContent])

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function handleConfirm() {
    setIsWaiting(true)
    setTimeout(onConfirm, 3000)
  }

  const isExpired = timeLeft <= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-2xl w-full max-w-sm max-h-[calc(100vh-2rem)] shadow-2xl overflow-y-auto"
        style={{ background: 'var(--bg-card)', animation: 'contentFadeUp 0.35s ease-out both' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between"
          style={{ background: 'var(--brand-gradient)' }}>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Nạp tiền qua QR
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Quét mã bằng ứng dụng ngân hàng</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {isExpired ? (
          /* QR Expired state */
          <div className="px-5 py-8 text-center">
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Mã QR đã hết hạn</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Vui lòng tạo mã QR mới để tiếp tục nạp tiền.</p>
            <button onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--brand-700)' }}>
              Đóng
            </button>
          </div>
        ) : isWaiting ? (
          /* Waiting state */
          <div className="px-5 pb-6">
            <RadarPulse />
            <div className="px-4 pb-4 space-y-2">
              <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{BANK_ACCOUNT}</span>
                    <CopyButton value={BANK_ACCOUNT} />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Nội dung CK</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold" style={{ color: 'var(--info)' }}>{transferCode}</span>
                    <CopyButton value={transferCode} />
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--warning-text)' }}>
                  Số tiền: <strong>{fmt(amount)}đ</strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Normal QR state */
          <>
            {/* Amount + Countdown */}
            <div className="mx-5 mb-3 p-3 rounded-xl text-center"
              style={{ background: 'var(--brand-50)', border: '1px solid var(--info-bg)' }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-xs" style={{ color: 'var(--info)' }}>Số tiền nạp</p>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand-600)' }} />
                <p className="text-xs font-medium" style={{ color: timeLeft < 120 ? 'var(--danger)' : 'var(--info)' }}>
                  Còn {formatTime(timeLeft)}
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--brand-700)' }}>
                {fmt(amount)}đ
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center px-5 pb-3">
              <div className="p-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 0 20px rgba(0,0,0,0.06)' }}>
                {qrError ? (
                  <p className="w-[200px] h-[200px] flex items-center justify-center text-center text-sm"
                    role="alert" style={{ color: 'var(--danger-text)' }}>
                    {qrError}
                  </p>
                ) : (
                  <canvas ref={canvasRef} className="block rounded-lg" role="img"
                    aria-label={`Mã VietQR nạp ${fmt(amount)} đồng với nội dung ${transferCode}`} />
                )}
              </div>
            </div>

            {/* Bank info */}
            <div className="px-5 pb-4 space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <BidvLogo />
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{BANK_CODE}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Ngân hàng TMCP Đầu tư và Phát triển VN</div>
                </div>
              </div>
              <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{BANK_ACCOUNT}</span>
                    <CopyButton value={BANK_ACCOUNT} />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Tên tài khoản</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{BANK_ACCOUNT_HOLDER}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl text-center" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-bg)' }}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--warning-text)' }}>Nội dung CK:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--brand-700)' }}>{transferCode}</span>
                  <CopyButton value={transferCode} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--warning-text)' }}>
                  ⚠ Nhập đúng nội dung chuyển khoản để đối soát giao dịch
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-2">
              <button onClick={handleConfirm}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'var(--success)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Đã chuyển khoản xong — Xác nhận
              </button>
              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                Hủy
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes radarPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function Wallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [pendingAmount, setPendingAmount] = useState(0)

  function load() {
    setLoading(true)
    Promise.all([
      walletService.me().catch(() => null),
      walletService.transactions().catch(() => []),
    ]).then(([w, t]) => { setWallet(w); setTxns(t) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleTopup(e) {
    e.preventDefault()
    const amt = Number(topupAmount)
    if (!amt || amt <= 0) return
    setPendingAmount(amt)
    setShowQR(true)
  }

  async function handleQRConfirmed() {
    setShowQR(false)
    setTopupLoading(true)
    setError('')
    try {
      await walletService.topup(pendingAmount)
      setTopupAmount('')
      setPendingAmount(0)
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Nạp tiền thất bại.')
    } finally {
      setTopupLoading(false)
    }
  }

  const balance = wallet?.balance || 0

  const QUICK_AMOUNTS = [
    { label: '10.000đ', value: 10000 },
    { label: '20.000đ', value: 20000 },
    { label: '50.000đ', value: 50000 },
    { label: '100.000đ', value: 100000 },
    { label: '200.000đ', value: 200000 },
    { label: '500.000đ', value: 500000 },
  ]

  return (
    <Layout pageId="wallet">
      <div className="app-page space-y-6">
        {/* Page header */}
        <div>
          <h1 className="app-page-title">Ví điện tử</h1>
          <p className="app-page-subtitle">Theo dõi số dư và các giao dịch trong tài khoản</p>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{
          background: 'var(--brand-dark)',
          boxShadow: '0 14px 32px rgba(79,70,229,0.2)',
        }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(20%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
          <div className="relative z-10">
            <p className="text-xs mb-1" style={{ color: 'rgba(147,197,253,0.8)' }}>Số dư khả dụng</p>
            <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--brand-fg)' }}>
              {loading ? '...' : fmt(balance)}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: 'var(--text-light)' }}>VNĐ</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Chủ ví</p>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{user?.full_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Topup form */}
        <div className="app-panel p-4 sm:p-5">
          <h3 className="app-panel-heading mb-4">
            Nạp tiền vào ví
          </h3>

          {/* Quick amount chips */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {QUICK_AMOUNTS.map(q => (
              <button key={q.value} type="button"
                onClick={() => setTopupAmount(q.value.toString())}
                className="py-2.5 rounded-xl text-sm font-semibold transition-all border"
                style={{
                  background: topupAmount === q.value.toString() ? 'var(--brand-50)' : 'var(--bg-subtle)',
                  borderColor: topupAmount === q.value.toString() ? 'var(--brand-200)' : 'var(--border)',
                  color: topupAmount === q.value.toString() ? 'var(--brand-700)' : 'var(--text-muted)',
                }}>
                {q.label}
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <form onSubmit={handleTopup} className="space-y-3">
            <div className="relative">
              <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-base font-semibold pr-16"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                placeholder="Nhập số tiền nạp (VND)"
                min="1000" step="1000" required />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: 'var(--text-light)' }}>VNĐ</span>
            </div>
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>{error}</div>
            )}
            <button type="submit" disabled={topupLoading || !topupAmount || Number(topupAmount) < 1000}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: topupLoading || !topupAmount ? 'var(--border-strong)' : 'var(--brand-600)',
                cursor: topupLoading || !topupAmount ? 'not-allowed' : 'pointer',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z"/>
              </svg>
              {topupLoading ? 'Đang xử lý...' : 'Nạp tiền qua QR'}
            </button>
          </form>

          {/* Bank info */}
          <div className="mt-4 flex items-center gap-2 text-xs p-3 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <BidvLogo />
            <div>
                <span style={{ color: 'var(--text-muted)' }}>Số tài khoản: </span>
                <span className="font-semibold mono" style={{ color: 'var(--text-primary)' }}>{BANK_ACCOUNT}</span>
                <span style={{ color: 'var(--text-light)' }}> — {BANK_CODE} — {BANK_ACCOUNT_HOLDER}</span>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="app-panel overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
            <h3 className="app-panel-heading">
              Lịch sử giao dịch
            </h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              {txns.length} giao dịch
            </span>
          </div>
          {txns.length === 0 && !loading && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-light)' }}>
              <div className="text-3xl mb-2">📭</div>
              Chưa có giao dịch nào.
            </div>
          )}
          {txns.map((txn, i) => (
            <div key={txn.id || i} className="px-5 py-4 flex items-center gap-4 border-b last:border-0"
              style={{ borderColor: 'var(--border-light)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: txn.type === 'TOPUP' ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={txn.type === 'TOPUP' ? 'var(--success)' : 'var(--danger)'} strokeWidth="2.5">
                  {txn.type === 'TOPUP'
                    ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                    : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                  {txn.type === 'TOPUP' ? 'Nạp tiền' : `Thanh toán ${txn.reference || ''}`}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>
                  {new Date(txn.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: txn.type === 'TOPUP' ? 'var(--success-text)' : 'var(--danger)' }}>
                  {txn.type === 'TOPUP' ? '+' : '-'}{fmt(txn.amount)}đ
                </p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>Sau: {fmt(txn.balance_after)}đ</p>
              </div>
            </div>
          ))}
          {loading && <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-light)' }}>Đang tải...</div>}
        </div>
      </div>

      {showQR && (
        <QRModal amount={pendingAmount} onClose={() => setShowQR(false)} onConfirm={handleQRConfirmed} />
      )}
    </Layout>
  )
}
