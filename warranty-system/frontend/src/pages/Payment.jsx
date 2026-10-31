import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { walletService } from '../services/services'
import { StatusBadge, EmptyState } from '../components'

function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') }

function maskCard(n) { return String(n || '').replace(/\d(?=\d{4})/g, '•') }

function TransactionList({ txns }) {
  if (!txns || txns.length === 0) {
    return (
      <EmptyState
        icon="📭"
        title="Chưa có giao dịch"
        description="Danh sách giao dịch sẽ xuất hiện khi có hoạt động"
      />
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {txns.map((txn, i) => (
        <div
          key={txn.id || i}
          className="px-5 py-4 flex items-center gap-4 transition-colors hover:bg-[var(--bg-hover)]"
          style={{ borderTop: i > 0 ? '1px solid var(--border-light)' : 'none' }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: txn.type === 'TOPUP' ? 'var(--success-bg)' : 'var(--danger-bg)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={txn.type === 'TOPUP' ? 'var(--success)' : 'var(--danger)'}
              strokeWidth="2.5"
            >
              {txn.type === 'TOPUP' ? (
                <>
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </>
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </>
              )}
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {txn.type === 'TOPUP' ? 'Nạp tiền vào ví' : `Thanh toán ${txn.reference || ''}`}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(txn.created_at).toLocaleDateString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
              <StatusBadge
                variant={txn.type === 'TOPUP' ? 'success' : 'error'}
                label={txn.type === 'TOPUP' ? 'Nạp tiền' : 'Thanh toán'}
              />
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className="text-base font-bold font-mono"
              style={{ color: txn.type === 'TOPUP' ? 'var(--success)' : 'var(--danger)' }}
            >
              {txn.type === 'TOPUP' ? '+' : '-'}{fmt(txn.amount)}đ
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-light)' }}>
              Số dư: {fmt(txn.balance_after)}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function OverviewTab({ summary, txns, onViewAll }) {
  const { total_credit, total_debit } = summary || {}
  const recentTransactions = txns.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* 2 Thống kê thu / chi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Tổng thu (Nạp tiền)', value: total_credit, variant: 'success', icon: '↗' },
          { label: 'Tổng chi (Thanh toán dịch vụ)', value: total_debit, variant: 'error', icon: '↘' },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 border flex items-center justify-between"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p
                className="text-2xl font-bold font-mono"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  color: s.variant === 'success' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {fmt(s.value)}đ
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold"
              style={{
                background: s.variant === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: s.variant === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
              }}
            >
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Lịch sử giao dịch gần đây */}
      <section className="space-y-3" aria-labelledby="recent-transactions-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="recent-transactions-heading" className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Lịch sử giao dịch gần đây
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {recentTransactions.length} giao dịch mới nhất trong tài khoản
            </p>
          </div>
          {txns.length > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors border hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--brand-600)', background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              Xem tất cả →
            </button>
          )}
        </div>
        <TransactionList txns={recentTransactions} />
      </section>
    </div>
  )
}

function HistoryTab({ txns }) {
  const [filter, setFilter] = useState('all')
  const filtered = (txns || []).filter((t) => filter === 'all' || t.type === filter)

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1.5 p-1 rounded-xl w-fit border"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
      >
        {[
          ['all', 'Tất cả'],
          ['TOPUP', 'Thu (Nạp tiền)'],
          ['PAYMENT', 'Chi (Thanh toán)'],
        ].map(([f, l]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === f ? 'var(--brand-600)' : 'transparent',
              color: filter === f ? 'var(--brand-fg)' : 'var(--text-muted)',
              boxShadow: filter === f ? 'var(--brand-shadow)' : 'none',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <TransactionList txns={filtered} />
    </div>
  )
}

export default function Payment() {
  const [tab, setTab] = useState('overview')
  const [txns, setTxns] = useState([])
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    setError('')
    Promise.all([walletService.me(), walletService.transactions()])
      .then(([walletData, transactions]) => {
        setWallet(walletData)
        setTxns(transactions)
      })
      .catch((err) => {
        console.error('Không thể tải dữ liệu thanh toán:', err)
        setError(err.response?.data?.detail || 'Không thể tải dữ liệu thanh toán.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const summary = txns.reduce(
    (acc, t) => {
      if (t.type === 'TOPUP') {
        acc.total_credit = (acc.total_credit || 0) + Number(t.amount)
      } else {
        acc.total_debit = (acc.total_debit || 0) + Number(t.amount)
      }
      return acc
    },
    { total_credit: 0, total_debit: 0 },
  )

  const balance = wallet?.balance || 0

  return (
    <Layout pageId="wallet">
      <div className="app-page space-y-6">
        {/* Header trang chuẩn */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="app-page-title">Thanh toán & Tài chính</h1>
            <p className="app-page-subtitle">Theo dõi tài khoản dịch vụ, số dư và lịch sử giao dịch bảo hành</p>
          </div>
          <div
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
            Cổng thanh toán: VietQR & Số dư ví
          </div>
        </div>

        {/* Thẻ thẻ số dư hiện đại — đồng bộ thẻ ví chuẩn */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden text-white"
          style={{
            background: 'var(--brand-dark)',
            boxShadow: 'var(--brand-shadow-lg)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(20%, -30%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Số dư khả dụng trong tài khoản
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono" style={{ color: '#FFFFFF' }}>
                  {loading ? '...' : fmt(balance)}
                </span>
                <span className="text-base font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  VNĐ
                </span>
              </div>
              <p className="text-xs mt-2 font-mono" style={{ color: 'rgba(255, 255, 255, 0.65)', letterSpacing: '0.1em' }}>
                {maskCard('5432 1009 8856 7742')} · BAOHANH PRO
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/wallet"
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 hover:opacity-95"
                style={{ background: '#FFFFFF', color: 'var(--brand-700)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
              >
                <span>+ Nạp tiền vào ví</span>
              </a>
            </div>
          </div>
        </div>

        {/* Tab chuyển đổi: Tổng quan / Lịch sử */}
        <div className="border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
          {[
            ['overview', 'Tổng quan thu chi'],
            ['history', 'Danh sách giao dịch chi tiết'],
          ].map(([t, l]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-3 text-sm font-semibold transition-all relative"
              style={{
                color: tab === t ? 'var(--brand-600)' : 'var(--text-muted)',
              }}
            >
              {l}
              {tab === t && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'var(--brand-600)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Nội dung tab */}
        <div>
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl p-4 text-sm font-medium border"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              Đang tải dữ liệu...
            </div>
          )}

          {!loading && tab === 'overview' && (
            <OverviewTab summary={summary} txns={txns} onViewAll={() => setTab('history')} />
          )}

          {!loading && tab === 'history' && <HistoryTab txns={txns} />}
        </div>
      </div>
    </Layout>
  )
}
