import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { ticketService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import CreateTicketModal from '../components/CreateTicket/CreateTicketModal'
import { getStatusConfig } from '../config/statusConfig'
import { getDisplayName } from '../utils/displayName'
import DataTable from '../components/DataTable'
import {
  StatCard, StatusProgressBar, QuickActions, AIWidget, ActivityLog,
} from '../components/dashboard'

function StatusPill({ status }) {
  const cfg = getStatusConfig(status)
  if (!cfg) return null
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function RecentTicketsTable({ tickets, onNavigate }) {
  if (tickets.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Chưa có phiếu bảo hành nào</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-light)' }}>Tạo phiếu đầu tiên để bắt đầu theo dõi</p>
        <button onClick={() => onNavigate('/tickets')}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--brand-700)' }}>
          + Tạo phiếu bảo hành
        </button>
      </div>
    )
  }

  const columns = [
    {
      key: 'ticket_code',
      header: 'Mã phiếu',
      cellClassName: 'font-semibold mono text-xs',
      render: (t) => <span style={{ color: 'var(--brand-700)' }}>{t.ticket_code}</span>,
    },
    {
      key: 'product',
      header: 'Sản phẩm',
      render: (t) => (
        <span className="truncate block max-w-40" style={{ color: 'var(--text-secondary)' }}>
          {t.product?.name || t.product_name || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (t) => <StatusPill status={t.status} />,
    },
    {
      key: 'within_warranty',
      header: 'Bảo hành',
      render: (t) => (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: t.within_warranty === 'YES' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: t.within_warranty === 'YES' ? 'var(--success-text)' : 'var(--danger-text)',
          }}>
          {t.within_warranty === 'YES' ? 'Còn BH' : 'Hết BH'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={tickets}
      onRowClick={(t) => onNavigate(`/tickets/${t.id}`)}
      minWidth={560}
    />
  )
}

function StatCardsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl mb-3" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-8 rounded mb-1" style={{ background: 'var(--bg-hover)', width: '60%' }} />
          <div className="h-4 rounded" style={{ background: 'var(--bg-hover)', width: '80%' }} />
        </div>
      ))}
    </>
  )
}

function StatusProgressSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-3 rounded mb-2" style={{ background: 'var(--bg-hover)', width: '60%' }} />
          <div className="h-2 rounded-full" style={{ background: 'var(--bg-hover)' }} />
        </div>
      ))}
    </div>
  )
}

function RecentTicketsSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse flex gap-4 items-center">
          <div className="w-20 h-4 rounded" style={{ background: 'var(--bg-hover)' }} />
          <div className="w-32 h-4 rounded" style={{ background: 'var(--bg-hover)' }} />
          <div className="w-16 h-4 rounded" style={{ background: 'var(--bg-hover)' }} />
        </div>
      ))}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  function load() {
    setLoading(true)
    ticketService.list()
      .then(setTickets)
      .catch(err => {
        const detail = err.response?.data?.detail || 'Không tải được dữ liệu dashboard.'
        toast.error(detail)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const inProgress = tickets.filter(t => ['RECEIVED', 'INSPECTION', 'REPAIRING'].includes(t.status)).length
  const completed = tickets.filter(t => t.status === 'COMPLETED').length
  const rejected = tickets.filter(t => t.status === 'REJECTED').length
  const hasData = tickets.length > 0

  const statCards = [
    {
      label: 'Tổng phiếu bảo hành',
      value: tickets.length, unit: 'phiếu',
      color: 'var(--brand-700)', bg: 'var(--brand-50)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
    },
    {
      label: 'Đang xử lý', value: inProgress, unit: 'phiếu',
      color: 'var(--accent-violet)', bg: 'var(--brand-50)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Hoàn tất tháng này', value: completed, unit: 'phiếu',
      color: 'var(--success-text)', bg: 'var(--success-bg)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
    {
      label: 'Tỷ lệ từ chối',
      value: tickets.length > 0 ? Math.round(rejected / tickets.length * 100) : 0,
      unit: '%',
      color: 'var(--danger)', bg: 'var(--danger-bg)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
  ]

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  return (
    <Layout pageId="dashboard">
      <div className="app-page space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="app-page-title">
              {getGreeting()},{' '}
              <span style={{ color: 'var(--brand-600)' }}>
                {getDisplayName(user?.full_name)}
              </span>
            </h1>
            <p className="app-page-subtitle">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Tổng quan hoạt động bảo hành và tiến độ xử lý phiếu.</p>
          </div>
          {['admin', 'staff'].includes(user?.role) && hasData && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--brand-600)', boxShadow: '0 7px 18px rgba(79,70,229,0.22)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tạo phiếu bảo hành
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="app-panel p-4 sm:p-5">
          <h3 className="app-panel-heading mb-4">
            Thao tác nhanh
          </h3>
          <QuickActions role={user?.role} onCreateTicket={() => setShowCreate(true)} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {loading
            ? <StatCardsSkeleton />
            : statCards.map((card, i) => <StatCard key={i} {...card} />)
          }
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 space-y-5">
            <div className="app-panel p-4 sm:p-5">
              <h3 className="app-panel-heading mb-4 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Phân bổ trạng thái phiếu
              </h3>
              {loading ? <StatusProgressSkeleton /> : <StatusProgressBar tickets={tickets} />}
            </div>

            <div className="app-panel overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <h3 className="app-panel-heading">Phiếu bảo hành gần đây</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>Các yêu cầu mới nhất trong hệ thống</p>
                </div>
                {hasData && (
                  <button onClick={() => navigate('/tickets')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}>
                    Xem tất cả →
                  </button>
                )}
              </div>

              {loading
                ? <RecentTicketsSkeleton />
                : <RecentTicketsTable tickets={recentTickets} onNavigate={navigate} />
              }
            </div>
          </div>

          <div className="xl:col-span-5 space-y-5">
            <AIWidget tickets={tickets} />
            <ActivityLog tickets={tickets} />
          </div>
        </div>
      </div>

      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load() }}
      />
    </Layout>
  )
}