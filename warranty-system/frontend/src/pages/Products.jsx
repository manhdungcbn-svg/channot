import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout, { Icon } from '../components/Layout'

const products = [
  { id: "P-001", name: "MacBook Air M3 13\"", serial: "MBA-M3-8249", category: "Laptop", price: "32.990.000đ", warranty: "12 tháng", status: "Còn bảo hành", tone: "green", customer: "Nguyễn Minh Anh" },
  { id: "P-002", name: "Sony WH-1000XM5", serial: "SNY-XM5-1028", category: "Tai nghe", price: "8.990.000đ", warranty: "12 tháng", status: "Còn bảo hành", tone: "green", customer: "Trần Quốc Huy" },
  { id: "P-003", name: "Samsung Odyssey G7", serial: "SS-G7-9211", category: "Màn hình", price: "24.990.000đ", warranty: "24 tháng", status: "Còn bảo hành", tone: "green", customer: "Lê Thanh Hà" },
  { id: "P-004", name: "Logitech MX Master 3S", serial: "LG-MX3-4402", category: "Chuột", price: "2.990.000đ", warranty: "12 tháng", status: "Hết bảo hành", tone: "red", customer: "Phạm Gia Bảo" },
  { id: "P-005", name: "iPhone 15 Pro", serial: "IP15P-7721", category: "Điện thoại", price: "34.990.000đ", warranty: "12 tháng", status: "Còn bảo hành", tone: "green", customer: "Võ Thị Mai" },
  { id: "P-006", name: "Dell XPS 15", serial: "DXPS-5510", category: "Laptop", price: "52.990.000đ", warranty: "24 tháng", status: "Còn bảo hành", tone: "green", customer: "Đặng Minh Đức" },
]

const stats = [
  { label: "Tổng sản phẩm", value: "1,234", change: "+42", icon: "box", tone: "blue" },
  { label: "Còn bảo hành", value: "987", change: "80%", icon: "check", tone: "green" },
  { label: "Hết bảo hành", value: "247", change: "20%", icon: "clock", tone: "amber" },
  { label: "Đăng ký tháng này", value: "156", change: "+23", icon: "spark", tone: "violet" },
]

export default function Products() {
  const [query, setQuery] = useState("")
  const [toast, setToast] = useState("")
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const filtered = products.filter(p =>
    `${p.name} ${p.serial} ${p.customer} ${p.category}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Layout 
      eyebrow="Kho dữ liệu sản phẩm" 
      title="Quản lý sản phẩm" 
      description="Theo dõi số sê-ri, thời hạn và trạng thái bảo hành."
      headerAction={
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={17} /> Thêm sản phẩm
        </button>
      }
    >
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, serial, khách hàng..." />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Khách hàng</th>
                <th>Giá</th>
                <th>Bảo hành</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }}>
                  <td><strong>{p.id}</strong><span>{p.serial}</span></td>
                  <td><strong>{p.name}</strong></td>
                  <td><span>{p.category}</span></td>
                  <td><span>{p.customer}</span></td>
                  <td><span>{p.price}</span></td>
                  <td><span>{p.warranty}</span></td>
                  <td><span className={`badge ${p.tone}`}><i />{p.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty">Không tìm thấy sản phẩm nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-layer">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <form className="modal" onSubmit={e => { e.preventDefault(); setShowModal(false); notify("Thêm sản phẩm thành công!") }}>
            <div className="modal-head">
              <div><span className="eyebrow">Thêm mới</span><h2>Thông tin sản phẩm</h2></div>
              <button type="button" className="icon-btn" onClick={() => setShowModal(false)}><Icon name="close" size={20} /></button>
            </div>
            <div className="modal-body">
              <label className="field"><span>Tên sản phẩm</span><input required placeholder="VD: MacBook Air M3" /></label>
              <label className="field"><span>Số serial</span><input required placeholder="VD: MBA-M3-8249" /></label>
              <label className="field"><span>Danh mục</span><input required placeholder="VD: Laptop" /></label>
              <label className="field"><span>Giá (VND)</span><input type="number" required placeholder="VD: 32990000" /></label>
              <label className="field full"><span>Khách hàng</span><input required placeholder="Tên khách hàng" /></label>
              <label className="field full"><span>Mô tả</span><textarea placeholder="Mô tả sản phẩm..." rows={3} /></label>
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
