import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

const customers = [
  { id: "C-001", name: "Nguyễn Minh Anh", email: "minhanh@email.com", phone: "0901234567", tier: "Platinum", products: 5, tickets: 12, join: "12/03/2024", tone: "violet" },
  { id: "C-002", name: "Trần Quốc Huy", email: "quochuy@email.com", phone: "0912345678", tier: "Gold", products: 3, tickets: 8, join: "05/06/2024", tone: "amber" },
  { id: "C-003", name: "Lê Thanh Hà", email: "thanhhale@email.com", phone: "0923456789", tier: "Silver", products: 2, tickets: 5, join: "18/08/2024", tone: "gray" },
  { id: "C-004", name: "Phạm Gia Bảo", email: "giabao@email.com", phone: "0934567890", tier: "Gold", products: 4, tickets: 10, join: "22/01/2024", tone: "amber" },
  { id: "C-005", name: "Võ Thị Mai", email: "thimai@email.com", phone: "0945678901", tier: "Basic", products: 1, tickets: 2, join: "30/09/2024", tone: "gray" },
  { id: "C-006", name: "Đặng Minh Đức", email: "minhduc@email.com", phone: "0956789012", tier: "Platinum", products: 6, tickets: 15, join: "10/02/2024", tone: "violet" },
]

const tiers = { Platinum: "violet", Gold: "amber", Silver: "gray", Basic: "gray" }

const stats = [
  { label: "Tổng khách hàng", value: "847", change: "+34", icon: "users", tone: "blue" },
  { label: "Platinum", value: "156", change: "18%", icon: "spark", tone: "violet" },
  { label: "Gold", value: "312", change: "37%", icon: "chart", tone: "amber" },
  { label: "Khách hàng mới", value: "89", change: "+12", icon: "spark", tone: "green" },
]

export default function Customers() {
  const [query, setQuery] = useState("")
  const [toast, setToast] = useState("")
  const [showModal, setShowModal] = useState(false)

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const filtered = customers.filter(c =>
    `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Layout eyebrow="Hệ thống khách hàng" title="Quản lý khách hàng" description="Theo dõi thông tin, tier và lịch sử giao dịch.">
      {/* Stats */}
      <div className="stats-row">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-top">
              <span className={`stat-icon ${s.tone}`}><Icon name={s.icon} size={18} /></span>
              <span className={`change ${s.tone}`}>{s.change}</span>
            </div>
            <p>{s.label}</p>
            <strong className="stat-value">{s.value}</strong>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Icon name="search" size={17} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, email, số điện thoại..." />
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={17} /> Thêm khách hàng
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Thông tin</th>
                <th>Liên hệ</th>
                <th>Hạng</th>
                <th>Sản phẩm</th>
                <th>Phiếu BH</th>
                <th>Ngày tham gia</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => notify(`Đang mở ${c.name}`)}>
                  <td><strong>{c.id}</strong></td>
                  <td><strong>{c.name}</strong></td>
                  <td><span>{c.email}</span><span>{c.phone}</span></td>
                  <td><span className={`badge ${tiers[c.tier]}`}>{c.tier}</span></td>
                  <td><span>{c.products}</span></td>
                  <td><span>{c.tickets}</span></td>
                  <td><span>{c.join}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty">Không tìm thấy khách hàng nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-layer">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <form className="modal" onSubmit={e => { e.preventDefault(); setShowModal(false); notify("Thêm khách hàng thành công!") }}>
            <div className="modal-head">
              <div><span className="eyebrow">Thêm mới</span><h2>Thông tin khách hàng</h2></div>
              <button type="button" className="icon-btn" onClick={() => setShowModal(false)}><Icon name="close" size={20} /></button>
            </div>
            <div className="modal-body">
              <label className="field"><span>Họ và tên</span><input required placeholder="VD: Nguyễn Văn A" /></label>
              <label className="field"><span>Email</span><input type="email" required placeholder="VD: email@example.com" /></label>
              <label className="field"><span>Điện thoại</span><input required placeholder="VD: 0901234567" /></label>
              <label className="field"><span>Hạng khách hàng</span>
                <select style={{background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'11px 14px', color:'var(--text)', fontSize:'12px'}}>
                  <option>Basic</option><option>Silver</option><option>Gold</option><option>Platinum</option>
                </select>
              </label>
              <label className="field full"><span>Địa chỉ</span><input placeholder="Địa chỉ khách hàng" /></label>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
              <button type="submit" className="btn-primary">Lưu <Icon name="arrow" size={15} /></button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
