import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function VNPayQRModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState(500000)
  const [qrUrl, setQrUrl] = useState('')
  const [txnRef, setTxnRef] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes in seconds
  const [status, setStatus] = useState('idle') // idle, loading, showing_qr, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const [pollInterval, setPollInterval] = useState(null)

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000]

  // Countdown timer
  useEffect(() => {
    if (status !== 'showing_qr' || !expiresAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = Math.max(0, Math.floor((expires - now) / 1000))
      setTimeLeft(diff)

      if (diff === 0) {
        clearInterval(interval)
        setStatus('expired')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [status, expiresAt])

  // Poll for payment status
  useEffect(() => {
    if (status !== 'showing_qr' || !txnRef) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/vnpay/status/${txnRef}`)
        const data = await res.json()

        if (data.status === 'completed') {
          clearInterval(interval)
          setStatus('success')
          if (onSuccess) onSuccess(data)
          setTimeout(() => {
            onClose()
            resetForm()
          }, 2000)
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setStatus('error')
          setErrorMessage('Thanh toán thất bại. Vui lòng thử lại.')
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 3000)

    setPollInterval(interval)

    return () => clearInterval(interval)
  }, [status, txnRef, onSuccess, onClose])

  const resetForm = () => {
    setAmount(500000)
    setQrUrl('')
    setTxnRef('')
    setExpiresAt(null)
    setTimeLeft(900)
    setStatus('idle')
    setErrorMessage('')
    if (pollInterval) clearInterval(pollInterval)
  }

  const handleClose = () => {
    if (pollInterval) clearInterval(pollInterval)
    onClose()
    resetForm()
  }

  const createQR = async () => {
    if (amount < 10000) {
      setErrorMessage('Số tiền tối thiểu là 10,000 VND')
      return
    }
    if (amount > 50000000) {
      setErrorMessage('Số tiền tối đa là 50,000,000 VND')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      // Create VietQR format for real bank transfer
      const BANK_ID = "970488"  // BIDV
      const ACCOUNT_NO = "3300722488"
      const ACCOUNT_NAME = "Vu Manh Dung"
      const TEMPLATE = "compact2"
      
      const vietQRData = `00020101021138570010${BANK_ID}0201${ACCOUNT_NO}5204549953030415802VN627${TEMPLATE}08${amount}0101${ACCOUNT_NAME}0211${ACCOUNT_NO}0212BaoHanh Pro Topup0308QRIBFTTA`;
      
      // Create transaction record on backend
      const res = await fetch('http://localhost:8000/api/v1/vnpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          email: 'admin@warranty.vn'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Tạo QR thất bại')
      }

      setQrUrl(vietQRData)  // VietQR format data
      setTxnRef(data.txn_ref)
      setExpiresAt(data.expires_at)
      setStatus('showing_qr')
      
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }
  
  const simulatePaymentSuccess = async (txnRef, amt) => {
    try {
      await fetch(`http://localhost:8000/api/v1/vnpay/simulate-complete/${txnRef}`, {
        method: 'POST'
      })
      setStatus('success')
      if (onSuccess) onSuccess({ amount: amt })
      setTimeout(() => {
        onClose()
        resetForm()
      }, 2000)
    } catch (err) {
      console.error('Simulate error:', err)
    }
  }

  const cancelPayment = async () => {
    if (!txnRef) return

    try {
      await fetch(`http://localhost:8000/api/v1/vnpay/cancel/${txnRef}`, {
        method: 'POST'
      })
    } catch (err) {
      console.error('Cancel error:', err)
    }

    handleClose()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ'
  }

  if (!isOpen) return null

  return (
    <div className="modal-layer">
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal vnpay-modal">
        {/* Header */}
        <div className="modal-head">
          <div>
            <span className="eyebrow">Nạp tiền</span>
            <h2>VNPay QR Code</h2>
          </div>
          <button className="icon-btn" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {status === 'idle' && (
            <>
              {/* Amount Input */}
              <div className="vnpay-amount-section">
                <label className="field full">
                  <span>Số tiền nạp (VND)</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    placeholder="Nhập số tiền"
                    style={{ fontSize: '20px', textAlign: 'center', fontWeight: 700 }}
                    min={10000}
                    max={50000000}
                  />
                </label>

                {/* Quick Amounts */}
                <div className="quick-amounts-grid">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      className={`quick-btn ${amount === amt ? 'active' : ''}`}
                      onClick={() => setAmount(amt)}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="vnpay-info-box">
                <div className="info-row">
                  <span>Phương thức</span>
                  <strong>VNPay QR</strong>
                </div>
                <div className="info-row">
                  <span>Phí</span>
                  <strong className="text-success">Miễn phí</strong>
                </div>
                <div className="info-row">
                  <span>Thời hạn QR</span>
                  <strong>15 phút</strong>
                </div>
              </div>

              {errorMessage && (
                <div className="alert-error">{errorMessage}</div>
              )}
            </>
          )}

          {status === 'loading' && (
            <div className="vnpay-loading">
              <div className="spinner"></div>
              <p>Đang tạo mã QR...</p>
            </div>
          )}

          {status === 'showing_qr' && (
            <>
              {/* Countdown Timer */}
              <div className="vnpay-timer">
                <span className={`timer-value ${timeLeft < 120 ? 'warning' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="timer-label">thời gian còn lại</span>
              </div>

              {/* QR Code Area */}
              <div className="vnpay-qr-container">
                <div className="qr-wrapper">
                  <QRCodeSVG 
                    value={qrUrl || `vnpay://pay?amount=${amount}`}
                    size={200}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    includeMargin={false}
                  />
                </div>
                <p className="qr-hint">Quét mã QR bằng App ngân hàng</p>
              </div>

              {/* Bank Transfer Details */}
              <div className="vnpay-bank-details">
                <div className="bank-detail-row">
                  <span className="label">Ngân hàng</span>
                  <span className="value">BIDV</span>
                </div>
                <div className="bank-detail-row">
                  <span className="label">Số tài khoản</span>
                  <span className="value">3300722488</span>
                </div>
                <div className="bank-detail-row">
                  <span className="label">Tên tài khoản</span>
                  <span className="value">Vũ Mạnh Dũng</span>
                </div>
                <div className="bank-detail-row">
                  <span className="label">Số tiền</span>
                  <span className="value amount">{formatCurrency(amount)}</span>
                </div>
                <div className="bank-detail-row">
                  <span className="label">Nội dung CK</span>
                  <span className="value">TOPUP {txnRef}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button 
                className="vnpay-confirm-btn"
                onClick={() => simulatePaymentSuccess(txnRef, amount)}
              >
                <i className="bi bi-check-circle"></i>
                Tôi đã chuyển khoản xong
              </button>

              <p className="vnpay-notice">
                <i className="bi bi-info-circle"></i>
                Sau khi chuyển khoản, nhấn nút trên để xác nhận
              </p>

              {errorMessage && (
                <div className="alert-error">{errorMessage}</div>
              )}
            </>
          )}

          {status === 'success' && (
            <div className="vnpay-success">
              <div className="success-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Nạp tiền thành công!</h3>
              <p className="success-amount">{formatCurrency(amount)}</p>
              <p className="success-message">Đã được cộng vào ví của bạn</p>
            </div>
          )}

          {status === 'error' && (
            <div className="vnpay-error">
              <div className="error-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h3>Thanh toán thất bại</h3>
              <p>{errorMessage || 'Vui lòng thử lại sau'}</p>
            </div>
          )}

          {status === 'expired' && (
            <div className="vnpay-expired">
              <div className="expired-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>Mã QR đã hết hạn</h3>
              <p>Vui lòng tạo mã QR mới</p>
              <button className="btn-primary" onClick={resetForm}>
                Tạo mã mới
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          {status === 'idle' && (
            <>
              <button className="btn-ghost" onClick={handleClose}>Hủy</button>
              <button className="btn-primary" onClick={createQR}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <rect x="7" y="7" width="3" height="3"/>
                  <rect x="14" y="7" width="3" height="3"/>
                  <rect x="7" y="14" width="3" height="3"/>
                </svg>
                Tạo QR Code
              </button>
            </>
          )}

          {status === 'showing_qr' && (
            <>
              <button className="btn-ghost" onClick={cancelPayment}>Hủy thanh toán</button>
              <button className="btn-primary" onClick={() => window.open(qrUrl, '_blank')}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Mở App ngân hàng
              </button>
            </>
          )}

          {(status === 'success' || status === 'error' || status === 'expired') && (
            <button className="btn-primary" onClick={handleClose}>Đóng</button>
          )}
        </div>
      </div>

      <style>{`
        .vnpay-modal {
          max-width: 480px;
          width: 100%;
        }

        .vnpay-modal .modal-body {
          display: flex;
          flex-direction: column;
          grid-template-columns: unset;
          gap: 0;
        }

        .vnpay-amount-section {
          margin-bottom: 16px;
        }

        .vnpay-modal .field {
          margin-bottom: 0;
        }

        .vnpay-modal .field input {
          background: var(--bg-3);
          border: 1px solid var(--border-bright);
          color: var(--text);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          width: 100%;
        }

        .vnpay-modal .field input:focus {
          border-color: var(--cyan);
          outline: none;
        }

        .quick-amounts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }

        .quick-amounts-grid .quick-btn {
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--border-bright);
          border-radius: 8px;
          background: var(--bg-3);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-amounts-grid .quick-btn:hover {
          border-color: var(--cyan);
          background: var(--cyan-dim);
          color: var(--cyan);
        }

        .quick-amounts-grid .quick-btn.active {
          border-color: var(--cyan);
          background: var(--cyan-dim);
          color: var(--cyan);
        }

        .vnpay-info-box {
          background: var(--bg-3);
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: 16px;
          border: 1px solid var(--border);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row span {
          color: var(--text-2);
        }

        .info-row strong {
          color: var(--text);
        }

        .text-success {
          color: var(--green);
        }

        .alert-error {
          background: var(--red-dim);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ff6b6b;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-top: 12px;
        }

        .vnpay-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }

        .vnpay-loading p {
          color: var(--text-2);
          font-size: 14px;
        }

        .vnpay-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .timer-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }

        .timer-value.warning {
          color: var(--red);
        }

        .timer-label {
          font-size: 14px;
          color: var(--text-2);
        }

        .vnpay-qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: white;
          border: 2px dashed var(--border);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .qr-wrapper {
          padding: 12px;
          background: white;
          border-radius: 8px;
          line-height: 0;
        }

        .qr-wrapper canvas,
        .qr-wrapper svg {
          display: block;
        }

        .qr-placeholder {
          padding: 10px;
          background: white;
          border-radius: 8px;
        }

        .qr-hint {
          margin-top: 12px;
          font-size: 14px;
          color: #6b7280;
        }

        .vnpay-amount-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--amber-dim);
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .vnpay-amount-display span {
          color: var(--text-2);
          font-size: 14px;
        }

        .vnpay-amount-display strong {
          font-size: 20px;
          color: var(--amber);
          font-weight: 700;
        }

        .vnpay-instructions {
          background: var(--blue-dim);
          border-radius: 8px;
          padding: 12px 16px;
        }

        .vnpay-instructions h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--cyan);
        }

        .vnpay-instructions ol {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: var(--cyan);
        }

        .vnpay-instructions li {
          margin-bottom: 4px;
        }

        .vnpay-success,
        .vnpay-error,
        .vnpay-expired {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
        }

        .success-icon,
        .error-icon,
        .expired-icon {
          margin-bottom: 16px;
        }

        .vnpay-success h3 {
          margin: 0;
          color: var(--green);
          font-size: 20px;
        }

        .success-amount {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          margin: 8px 0;
        }

        .success-message {
          color: var(--text-2);
          margin: 0;
        }

        .vnpay-error h3,
        .vnpay-expired h3 {
          margin: 0 0 8px 0;
          color: var(--text);
          font-size: 18px;
        }

        .vnpay-error p,
        .vnpay-expired p {
          margin: 0;
          color: var(--text-2);
        }

        .vnpay-expired .btn-primary {
          margin-top: 16px;
        }

        .vnpay-bank-details {
          background: var(--bg-3);
          border: 1px solid var(--border-bright);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .bank-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid var(--border);
        }

        .bank-detail-row:last-child {
          border-bottom: none;
        }

        .bank-detail-row .label {
          font-size: 13px;
          color: var(--text-2);
        }

        .bank-detail-row .value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          text-align: right;
        }

        .bank-detail-row .value.amount {
          color: var(--amber);
          font-size: 16px;
        }

        .vnpay-confirm-btn {
          width: 100%;
          padding: 14px 20px;
          background: var(--green);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .vnpay-confirm-btn:hover {
          background: #1db954;
          transform: translateY(-1px);
        }

        .vnpay-notice {
          text-align: center;
          font-size: 12px;
          color: var(--text-2);
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .vnpay-modal .btn-ghost {
          background: transparent;
          border: 1px solid var(--border-bright);
          color: var(--text-2);
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vnpay-modal .btn-ghost:hover {
          border-color: var(--text-2);
          color: var(--text);
        }

        .vnpay-modal .btn-primary {
          background: var(--cyan);
          color: var(--bg-0);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vnpay-modal .btn-primary:hover {
          filter: brightness(1.1);
        }

        .vnpay-modal .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-2);
          padding: 4px;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vnpay-modal .icon-btn:hover {
          background: var(--bg-3);
          color: var(--text);
        }
      `}</style>
    </div>
  )
}
