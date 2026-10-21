import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { walletService } from '../services/services'
import { StatusBadge, PageHeader, EmptyState } from '../components'

function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') }

function maskCard(n) { return String(n || '').replace(/\d(?=\d{4})/g, '•') }

function OverviewTab({ summary }) {
  const { balance, total_credit, total_debit } = summary || {}

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Tổng thu', value: total_credit, variant: 'success' },
          { label: 'Tổng chi', value: total_debit, variant: 'error' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(75,106,153,0.3)' }}>
            <p className="text-xs mb-1" style={{ color: '#4B6A99' }}>{s.label}</p>
            <p className="text-xl font-bold mono" style={{ fontFamily: 'DM Sans, sans-serif', color: s.variant === 'success' ? '#34D399' : '#F87171' }}>
              {fmt(s.value)}đ
            </p>
          </div>
        ))}
      </div>

      <EmptyState
        icon="📊"
        title="Chi tiết theo danh mục"
        description="Tính năng đang được phát triển"
      />
    </div>
  )
}

function HistoryTab({ txns }) {
  const [filter, setFilter] = useState('all')
  const filtered = (txns || []).filter(t => filter === 'all' || t.type === filter)

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon="📭"
        title="Chưa có giao dịch"
        description="Danh sách giao dịch sẽ xuất hiện khi có hoạt động"
      />
    )
  }

  return (
    <div>
      <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {[['all', 'Tất cả'], ['TOPUP', 'Thu'], ['PAYMENT', 'Chi']].map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: filter === f ? '#1E3A7B' : 'transparent', color: filter === f ? '#FFFFFF' : '#4B6A99' }}>
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(75,106,153,0.3)' }}>
        {filtered.map((txn, i) => (
          <div key={txn.id || i} className="px-5 py-4 flex items-center gap-4 transition-all hover:bg-white/5"
            style={{ borderTop: i > 0 ? '1px solid rgba(75,106,153,0.2)' : 'none' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: txn.type === 'TOPUP' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={txn.type === 'TOPUP' ? '#34D399' : '#F87171'} strokeWidth="2.5">
                {txn.type === 'TOPUP'
                  ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#E2E8F0' }}>
                {txn.type === 'TOPUP' ? 'Nạp tiền' : `Thanh toán ${txn.reference || ''}`}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs" style={{ color: '#4B6A99' }}>
                  {new Date(txn.created_at).toLocaleDateString('vi-VN')}
                </span>
                <StatusBadge
                  variant={txn.type === 'TOPUP' ? 'success' : 'error'}
                  label={txn.type === 'TOPUP' ? 'Nạp tiền' : 'Thanh toán'}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold mono" style={{ color: txn.type === 'TOPUP' ? '#34D399' : '#F87171' }}>
                {txn.type === 'TOPUP' ? '+' : '-'}{fmt(txn.amount)}đ
              </p>
              <p className="text-xs mono" style={{ color: '#4B6A99' }}>
                Sdư: {fmt(txn.balance_after)}đ
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Payment() {
  const [tab, setTab] = useState('overview')
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    walletService.transactions()
      .then(setTxns)
      .catch(() => setTxns([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Calculate summary from transactions
  const summary = txns.reduce((acc, t) => {
    if (t.type === 'TOPUP') {
      acc.total_credit = (acc.total_credit || 0) + Number(t.amount)
    } else {
      acc.total_debit = (acc.total_debit || 0) + Number(t.amount)
    }
    return acc
  }, { total_credit: 0, total_debit: 0 })

  // Mock balance - in real app would come from walletService.me()
  const balance = 0

  return (
    <Layout pageId="wallet">
      <div className="min-h-full" style={{ background: 'var(--bank-bg, #0a0e1a)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs mb-1" style={{ color: '#4B6A99' }}>Tài khoản dịch vụ bảo hành</p>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#FFFFFF' }}>Thanh toán & Tài chính</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37, 99, 235, 0.25)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Balance cards */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            <div className="flex-shrink-0 rounded-2xl p-5 relative overflow-hidden"
              style={{
                width: 280, minHeight: 160,
                background: 'linear-gradient(135deg, #1A3A6B 0%, #2563EB 100%)',
                boxShadow: '0 8px 32px rgba(26,58,107,0.35)',
              }}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: 'rgba(147,197,253,0.7)' }}>Số dư khả dụng</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#FFFFFF' }}>
                      {loading ? '...' : fmt(balance)}<span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>đ</span>
                    </p>
                  </div>
                  <div className="flex" style={{ marginTop: 2 }}>
                    <div className="w-7 h-7 rounded-full opacity-70" style={{ background: '#EF4444', marginRight: -8 }} />
                    <div className="w-7 h-7 rounded-full opacity-70" style={{ background: '#F59E0B' }} />
                  </div>
                </div>
                <div>
                  <p className="mono text-xs" style={{ color: 'rgba(147,197,253,0.5)', letterSpacing: '0.15em' }}>
                    {maskCard('5432 1009 8856 7742')}
                  </p>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Chủ TK</p>
                      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>BAOHANH PRO</p>
                    </div>
                    <p className="mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>09/27</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0" style={{ borderBottom: '1px solid rgba(75,106,153,0.3)' }}>
            {[['overview', 'Tổng quan'], ['history', 'Giao dịch']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-5 py-3 text-sm font-medium transition-all relative"
                style={{ color: tab === t ? '#60A5FA' : '#4B6A99' }}>
                {l}
                {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#2563EB' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 py-6">
          {loading && <div className="text-center py-12" style={{ color: '#4B6A99' }}>Đang tải...</div>}
          {!loading && tab === 'overview' && <OverviewTab summary={summary} />}
          {!loading && tab === 'history' && <HistoryTab txns={txns} />}
        </div>
      </div>
    </Layout>
  )
}
