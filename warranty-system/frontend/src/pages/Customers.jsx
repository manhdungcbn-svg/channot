import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { customerService, ticketService } from '../services/services'
import { useAuth } from '../context/AuthContext'
import CreateTicketModal from '../components/CreateTicket/CreateTicketModal'

function Avatar({ name, size = 11 }) {
  const hue = (name?.charCodeAt(0) || 0) * 37 % 360
  return (
    <div className={`w-${size} h-${size} rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ width: size * 4, height: size * 4, background: `hsl(${hue}, 55%, 42%)`, fontSize: size * 1.6 }}>
      {name?.charAt(0) || '?'}
    </div>
  )
}

function AddCustomerModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '' })
     const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, val) { setForm(f => ({ ...f, [field]: val })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.phone.trim()) { setError('Vui lòng nhập họ tên và số điện thoại.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, role: 'customer', password: 'Warranty@123' }
      await customerService.create(payload)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Tạo khách hàng thất bại.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'contentFadeUp 0.3s ease-out both' }}>
        <div className="px-6 pt-5 pb-4 flex items-center justify-between"
             style={{ background: 'linear-gradient(135deg, var(--brand-900), var(--brand-600))' }}>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Thêm khách hàng mới</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Đăng ký nhanh thông tin khách hàng</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>
              Họ và tên <span style={{color:'var(--danger)'}}>*</span>
            </label>
            <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
                 style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Nguyễn Văn A" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>
                SĐT <span style={{color:'var(--danger)'}}>*</span>
              </label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm"
                   style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="0912 345 678" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm"
                   style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>Địa chỉ</label>
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
                 style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Số nhà, đường, phường/xã, Quận, TP" />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            💡 Mật khẩu mặc định: <code style={{ color: 'var(--info)' }}>Warranty@123</code> — Khách hàng nên đổi sau khi đăng nhập.
          </p>
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-card)', color: 'var(--text-light)', border: '1px solid var(--text-secondary)' }}>
              Hủy
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                 style={{ background: saving ? 'var(--text-light)' : 'var(--brand-600)', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Đang lưu...' : 'Lưu khách hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CustomerDetailModal({ customer, tickets, onClose }) {
  const customerTickets = tickets.filter(t => t.customer_id === customer.id)
  const grouped = {
    RECEIVED: [], INSPECTION: [], REPAIRING: [], COMPLETED: [], REJECTED: [],
  }
  customerTickets.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t) })

  const statusLabels = {
    RECEIVED: 'Tiếp nhận', INSPECTION: 'Kiểm tra', REPAIRING: 'Sửa chữa',
    COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối',
  }
  const statusColors = {
    RECEIVED: 'var(--warning)', INSPECTION: 'var(--info)', REPAIRING: 'var(--accent-violet)',
    COMPLETED: 'var(--success)', REJECTED: 'var(--danger)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'contentFadeUp 0.3s ease-out both' }}>
        <div className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, var(--brand-900), var(--brand-600))' }}>
          <div className="flex items-center gap-3">
            <Avatar name={customer.full_name} size={10} />
            <div>
              <h2 className="text-base font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{customer.full_name}</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Lịch sử bảo hành</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Contact info */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {customer.phone || '—'}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {customer.email || '—'}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {customer.address || '—'}
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{customerTickets.length}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng phiếu</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                {customerTickets.filter(t => t.status === 'COMPLETED').length}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hoàn tất</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>
                {customerTickets.filter(t => ['RECEIVED', 'INSPECTION', 'REPAIRING'].includes(t.status)).length}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang xử lý</div>
            </div>
          </div>

          {/* Tickets by status */}
          {Object.entries(grouped).map(([status, list]) => {
            if (list.length === 0) return null
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[status] }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-light)' }}>
                    {statusLabels[status]} ({list.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {list.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
                      onClick={() => window.location.href = `/tickets/${t.id}`}>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--info)' }}>{t.ticket_code}</p>
                        <p className="text-xs mt-0.5 truncate max-w-48" style={{ color: 'var(--text-muted)' }}>
                          {t.product?.name || t.issue_description?.slice(0, 40)}
                        </p>
                      </div>
                      <p className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(t.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {customerTickets.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Khách hàng chưa có phiếu bảo hành nào.</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 flex gap-3 border-t" style={{ borderColor: 'var(--bg-card)' }}>
          <button onClick={() => window.location.href = `/tickets?customer_id=${customer.id}`}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--brand-600)' }}>
            Xem phiếu bảo hành
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-light)', border: '1px solid var(--text-secondary)' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [tickets, setTickets] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [sortBy, setSortBy] = useState('newest') // newest, tickets_high, tickets_low
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const canCreate = ['admin', 'staff'].includes(user?.role)

  function load() {
    setLoading(true)
    Promise.all([
      customerService.list().catch(() => []),
      ticketService.list().catch(() => []),
    ]).then(([cs, ts]) => {
      setCustomers(cs)
      setTickets(ts)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const enriched = customers.map(c => ({
    ...c,
    ticketCount: tickets.filter(t => t.customer_id === c.id).length,
    activeCount: tickets.filter(t => t.customer_id === c.id && ['RECEIVED', 'INSPECTION', 'REPAIRING'].includes(t.status)).length,
    newestTicket: tickets.filter(t => t.customer_id === c.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0],
  }))

  const filtered = enriched
    .filter(c => !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      if (sortBy === 'tickets_high') return b.ticketCount - a.ticketCount
      if (sortBy === 'tickets_low') return a.ticketCount - b.ticketCount
      return 0
    })

  const statusTabs = [
    { label: 'Tất cả', value: 'all' },
    { label: '≥3 phiếu', value: '3plus' },
    { label: 'Đang xử lý', value: 'active' },
    { label: 'Chưa có phiếu', value: 'none' },
  ]
  const [tab, setTab] = useState('all')
  const tabFiltered = filtered.filter(c => {
    if (tab === '3plus') return c.ticketCount >= 3
    if (tab === 'active') return c.activeCount > 0
    if (tab === 'none') return c.ticketCount === 0
    return true
  })

  return (
    <Layout pageId="customers">
      <div className="app-page space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-page-title">Khách hàng</h1>
            <p className="app-page-subtitle">Hồ sơ liên hệ và lịch sử tiếp nhận bảo hành</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--brand-600)', boxShadow: '0 7px 18px rgba(79,70,229,0.2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Thêm khách hàng
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="app-panel p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Tìm kiếm khách hàng..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              <option value="newest">Mới nhất</option>
              <option value="tickets_high">Nhiều phiếu nhất</option>
              <option value="tickets_low">Ít phiếu nhất</option>
            </select>
          </div>
          <div className="flex gap-1 p-1 rounded-xl inline-flex" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {statusTabs.map(t => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: tab === t.value ? 'var(--brand-50)' : 'transparent',
                  color: tab === t.value ? 'var(--brand-700)' : 'var(--text-muted)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="app-panel text-center py-12" style={{ color: 'var(--text-muted)' }}>Đang tải danh sách khách hàng...</div>
          ) : tabFiltered.length === 0 ? (
            <div className="app-panel text-center py-12" style={{ color: 'var(--text-muted)' }}>Không tìm thấy khách hàng nào.</div>
          ) : tabFiltered.map(customer => (
            <div key={customer.id}
              className="app-panel p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-4">
                <Avatar name={customer.full_name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
                      {customer.full_name}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {customer.activeCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--brand-50)', color: 'var(--accent-violet)' }}>
                          {customer.activeCount} đang xử lý
                        </span>
                      )}
                      {customer.ticketCount >= 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                          VIP
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{customer.phone || '—'}</span>
                    <span className="text-xs" style={{ color: 'var(--text-light)' }}>{customer.email || '—'}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold" style={{ color: 'var(--brand-700)', fontFamily: 'DM Sans, sans-serif' }}>
                    {customer.ticketCount}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>phiếu BH</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setDetailCustomer(customer)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'var(--brand-50)', color: 'var(--info)' }}
                    title="Xem chi tiết & lịch sử">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => window.location.href = `/tickets?customer_id=${customer.id}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                    title="Xem phiếu BH">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onCreated={load} />}
      {detailCustomer && <CustomerDetailModal customer={detailCustomer} tickets={tickets} onClose={() => setDetailCustomer(null)} />}
      {showCreate && selectedCustomer && (
        <CreateTicketModal
          isOpen={showCreate}
          onClose={() => { setShowCreate(false); setSelectedCustomer(null) }}
          onCreated={() => { setShowCreate(false); setSelectedCustomer(null); load() }}
          prefillCustomer={selectedCustomer}
        />
      )}
    </Layout>
  )
}
