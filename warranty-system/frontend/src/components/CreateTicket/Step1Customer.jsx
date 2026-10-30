// ============================================
// CREATE TICKET MODAL - FULL WORKFLOW
// Step 1: Customer Selection
// ============================================

import { useState, useEffect } from 'react'
import { customerService } from '../../services/services'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function CustomerSearchCard({ customer, onSelect, selected }) {
  return (
    <button
      onClick={() => onSelect(customer)}
      className="w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md"
      style={{
        borderColor: selected ? 'var(--brand-600)' : 'var(--border)',
        backgroundColor: selected ? 'var(--brand-50)' : 'var(--bg-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: selected ? 'var(--brand-600)' : 'var(--brand-700)' }}
        >
          {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {customer.full_name}
            </span>
            {selected && (
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--success)' }}
              >
                <CheckIcon />
              </span>
            )}
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span className="ml-2">{customer.email}</span>}
          </div>
          {customer.ticket_count !== undefined && (
            <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
              {customer.ticket_count} phiếu bảo hành
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function CreateCustomerForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('Vui lòng nhập họ tên và số điện thoại')
      return
    }
    setSaving(true)
    try {
      const created = await customerService.create(form)
      onCreated(created)
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể tạo khách hàng')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        <PlusIcon />
        Tạo khách hàng mới
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          type="text"
          value={form.full_name}
          onChange={e => update('full_name', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Số điện thoại <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            placeholder="0912 345 678"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Địa chỉ
        </label>
        <input
          type="text"
          value={form.address}
          onChange={e => update('address', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          placeholder="Số nhà, đường, phường/xã"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ 
          backgroundColor: 'var(--danger-bg)', 
          color: 'var(--danger)',
          border: '1px solid var(--danger-bg)'
        }}>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ backgroundColor: saving ? 'var(--text-light)' : 'var(--brand-600)' }}
        >
          {saving ? 'Đang lưu...' : 'Tạo khách hàng'}
        </button>
      </div>
    </div>
  )
}

export default function Step1Customer({ data, onUpdate, prefillCustomer }) {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [customers, setCustomers] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(prefillCustomer || data.customer || null)

  useEffect(() => {
    if (prefillCustomer) {
      setSelectedCustomer(prefillCustomer)
      onUpdate({ customer: prefillCustomer })
    } else {
      loadCustomers()
    }
  }, [prefillCustomer])

  const loadCustomers = async () => {
    setSearching(true)
    try {
      const list = await customerService.list()
      setCustomers(list || [])
    } catch {
      setCustomers([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = async () => {
    if (!search.trim()) {
      loadCustomers()
      return
    }
    setSearching(true)
    try {
      const list = await customerService.list(search)
      setCustomers(list || [])
    } catch {
      setCustomers([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    onUpdate({ customer })
  }

  const handleCreatedCustomer = (customer) => {
    setCustomers(prev => [customer, ...prev])
    setSelectedCustomer(customer)
    onUpdate({ customer })
    setShowCreate(false)
  }

  // Filter customers by search
  const filteredCustomers = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Tìm khách hàng
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
              placeholder="Tìm theo tên, SĐT, email..."
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--text-light)" strokeWidth="4"/>
                  <path className="opacity-75" fill="var(--text-light)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </span>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ backgroundColor: 'var(--brand-600)' }}
          >
            Tìm
          </button>
        </div>
      </div>

      {/* Create new customer */}
      {showCreate ? (
        <div 
          className="p-4 rounded-xl border"
          style={{ borderColor: 'var(--info-bg)', backgroundColor: 'var(--info-bg)' }}
        >
          <CreateCustomerForm 
            onCreated={handleCreatedCustomer}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <PlusIcon />
          Tạo khách hàng mới
        </button>
      )}

      {/* Customer list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👤</div>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              {search ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng nào'}
            </p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <CustomerSearchCard
              key={customer.id}
              customer={customer}
              selected={selectedCustomer?.id === customer.id}
              onSelect={handleSelectCustomer}
            />
          ))
        )}
      </div>

      {/* Selected customer summary */}
      {selectedCustomer && (
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-text)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--success-text)' }}><CheckIcon /></span>
            <span className="text-sm font-medium" style={{ color: 'var(--success-text)' }}>
              Đã chọn: {selectedCustomer.full_name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
