import { useState, useEffect } from 'react'
import Layout, { Icon } from '../components/Layout'
import VNPayQRModal from '../components/VNPayQRModal'

const mockTransactions = [
  { id: "TXN-4521", type: "topup", amount: "+500.000đ", date: "Hôm nay, 10:30", desc: "Nạp tiền ví", balance: "5.750.000đ" },
  { id: "TXN-4520", type: "payment", amount: "-350.000đ", date: "Hôm nay, 14:20", desc: "Thanh toán WR-2026-0892", balance: "5.250.000đ" },
  { id: "TXN-4519", type: "topup", amount: "+1.000.000đ", date: "Hôm qua, 09:15", desc: "Nạp tiền ví", balance: "5.600.000đ" },
  { id: "TXN-4518", type: "payment", amount: "-250.000đ", date: "Hôm qua, 16:45", desc: "Thanh toán WR-2026-0891", balance: "4.600.000đ" },
  { id: "TXN-4517", type: "topup", amount: "+2.000.000đ", date: "2 ngày trước", desc: "Nạp tiền ví", balance: "4.850.000đ" },
]

export default function Wallet() {
  const [toast, setToast] = useState("")
  const [showVNPayModal, setShowVNPayModal] = useState(false)
  const [balance, setBalance] = useState("5.750.000đ")
  const [todayChange, setTodayChange] = useState("+500.000đ")
  const [vnpayToast, setVnpayToast] = useState(null)

  // Check for VNPay return from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const vnpayStatus = params.get('vnpay')
    const txnRef = params.get('txn_ref')

    if (vnpayStatus === 'success') {
      setVnpayToast({ type: 'success', message: 'Nạp tiền thành công qua VNPay!' })
      // Clean URL
      window.history.replaceState({}, '', '/wallet')
    } else if (vnpayStatus === 'failed') {
      setVnpayToast({ type: 'error', message: 'Thanh toán VNPay thất bại' })
      window.history.replaceState({}, '', '/wallet')
    } else if (vnpayStatus === 'error') {
      setVnpayToast({ type: 'error', message: 'Có lỗi xảy ra với giao dịch' })
      window.history.replaceState({}, '', '/wallet')
    }

    // Auto-hide toast after 5 seconds
    if (vnpayToast) {
      const timer = setTimeout(() => setVnpayToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [vnpayToast])

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2800)
  }

  const handleVNPaySuccess = (data) => {
    setBalance((prev) => {
      const current = parseInt(prev.replace(/\./g, ''))
      const added = data.amount || 500000
      const newBalance = current + added
      return newBalance.toLocaleString('vi-VN') + 'đ'
    })
    setTodayChange(`+${(data.amount || 500000).toLocaleString('vi-VN')}đ`)
  }

  return (
    <Layout eyebrow="Ví điện tử" title="Ví tài khoản" description="Quản lý số dư, nạp tiền và giao dịch.">
      {/* VNPay Return Toast */}
      {vnpayToast && (
        <div className={`vnpay-toast ${vnpayToast.type}`}>
          {vnpayToast.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <span>{vnpayToast.message}</span>
        </div>
      )}

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-header">
          <span className="eyebrow">Số dư khả dụng</span>
          <span className="balance-change">↑ {todayChange} hôm nay</span>
        </div>
        <div className="balance-amount">{balance}</div>
        <div className="balance-actions">
          <button className="btn-primary" onClick={() => setShowVNPayModal(true)}>
            <Icon name="plus" size={17} /> Nạp tiền
          </button>
          <button className="btn-ghost" onClick={() => notify("Đã mở lịch sử giao dịch")}>
            <Icon name="chart" size={17} /> Lịch sử
          </button>
        </div>
      </div>

      {/* Quick Amounts */}
      <div className="quick-amounts">
        {[100000, 200000, 500000, 1000000, 2000000, 5000000].map(amount => (
          <button key={amount} className="quick-btn" onClick={() => notify(`Đã chọn ${amount.toLocaleString('vi-VN')}đ`)}>
            {amount >= 1000000 ? `${amount/1000000}M` : `${amount/1000}K`}
          </button>
        ))}
      </div>

      {/* VNPay Info Banner */}
      <div className="vnpay-banner">
        <div className="banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <rect x="7" y="7" width="3" height="3"/>
            <rect x="14" y="7" width="3" height="3"/>
            <rect x="7" y="14" width="3" height="3"/>
          </svg>
        </div>
        <div className="banner-content">
          <strong>Nạp tiền qua VNPay QR</strong>
          <span>Thanh toán an toàn với mã QR ngân hàng</span>
        </div>
        <button className="btn-sm" onClick={() => setShowVNPayModal(true)}>
          Nạp ngay
        </button>
      </div>

      {/* Transactions */}
      <div className="section-head">
        <h2>Lịch sử giao dịch</h2>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Mô tả</th>
                <th>Ngày</th>
                <th>Số tiền</th>
                <th>Số dư</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map(t => (
                <tr key={t.id} onClick={() => notify(`Xem chi tiết ${t.id}`)}>
                  <td><strong>{t.id}</strong></td>
                  <td><strong>{t.desc}</strong></td>
                  <td><span className="date">{t.date}</span></td>
                  <td><span className={`amount ${t.type}`}>{t.amount}</span></td>
                  <td><span>{t.balance}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VNPay QR Modal */}
      <VNPayQRModal
        isOpen={showVNPayModal}
        onClose={() => setShowVNPayModal(false)}
        onSuccess={handleVNPaySuccess}
      />

      {toast && (
        <div className="toast">
          <span><Icon name="check" size={16} /></span>{toast}
        </div>
      )}

      <style>{`
        .vnpay-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          z-index: 1000;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease;
        }

        .vnpay-toast.success {
          background: #10b981;
          color: white;
        }

        .vnpay-toast.error {
          background: #ef4444;
          color: white;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .vnpay-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          margin: 20px 0;
        }

        .banner-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          color: white;
        }

        .banner-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          color: white;
        }

        .banner-content strong {
          font-size: 15px;
          margin-bottom: 2px;
        }

        .banner-content span {
          font-size: 13px;
          opacity: 0.85;
        }

        .btn-sm {
          padding: 8px 16px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-sm:hover {
          transform: scale(1.05);
        }
      `}</style>
    </Layout>
  )
}
