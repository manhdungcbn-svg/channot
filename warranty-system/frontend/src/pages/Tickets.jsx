import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Layout, { Icon } from '../components/Layout'

const tickets = [
  { id: "#WR-2498", customer: "Nguyễn Minh Anh", product: "MacBook Air M3", serial: "MBA-M3-8249", status: "Đang xử lý", tone: "amber", date: "Hôm nay, 09:42", tech: "Hoàng Nam" },
  { id: "#WR-2497", customer: "Trần Quốc Huy", product: "Sony WH-1000XM5", serial: "SNY-XM5-1028", status: "Chờ linh kiện", tone: "violet", date: "Hôm nay, 08:15", tech: "Minh Tuấn" },
  { id: "#WR-2496", customer: "Lê Thanh Hà", product: "Samsung Odyssey G7", serial: "SS-G7-9211", status: "Hoàn thành", tone: "green", date: "Hôm qua, 16:30", tech: "Hoàng Nam" },
  { id: "#WR-2495", customer: "Phạm Gia Bảo", product: "Logitech MX Master 3S", serial: "LG-MX3-4402", status: "Mới tiếp nhận", tone: "blue", date: "Hôm qua, 14:05", tech: "Chưa phân" },
  { id: "#WR-2494", customer: "Võ Thị Mai", product: "iPhone 15 Pro", serial: "IP15P-7721", status: "Đang xử lý", tone: "amber", date: "Hôm qua, 11:20", tech: "Minh Tuấn" },
  { id: "#WR-2493", customer: "Đặng Minh Đức", product: "Dell XPS 15", serial: "DXPS-5510", status: "Hoàn thành", tone: "green", date: "2 ngày trước", tech: "Hoàng Nam" },
]

const stats = [
  { label: "Tổng phiếu", value: "248", change: "+12,5%", icon: "ticket", tone: "blue" },
  { label: "Đang xử lý", value: "37", change: "8 quá hạn", icon: "clock", tone: "amber" },
  { label: "Hoàn thành", value: "196", change: "+18,2%", icon: "check", tone: "green" },
  { label: "Tỷ lệ thành công", value: "94%", change: "+3,1%", icon: "chart", tone: "violet" },
]

export default function Tickets() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("Tất cả")
  const [toast, setToast] = useState("")
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const filtered = tickets.filter(t => {
    const matchSearch = `${t.id} ${t.customer} ${t.product} ${t.serial}`.toLowerCase().includes(query.toLowerCase())
    const matchFilter = filter === "Tất cả" || t.status === filter
    return matchSearch && matchFilter
  })

  const filters = ["Tất cả", "Mới tiếp nhận", "Đang xử lý", "Chờ linh kiện", "Hoàn thành"]

  return (
    <Layout 
      eyebrow="Trung tâm xử lý" 
      title="Phiếu bảo hành" 
      description="Ưu tiên, phân công và theo dõi tiến độ từng yêu cầu."
      headerAction={
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={17} /> Tạo phiếu mới
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm mã phiếu, khách hàng, sản phẩm..." />
        </div>
        <div className="toolbar-filters">
          {filters.map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng & sản phẩm</th>
                <th>Kỹ thuật viên</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{ cursor: 'pointer' }}>
                  <td><strong>{t.id}</strong><span>{t.serial}</span></td>
                  <td><strong>{t.customer}</strong><span>{t.product}</span></td>
                  <td><span>{t.tech}</span></td>
                  <td><span className={`badge ${t.tone}`}><i />{t.status}</span></td>
                  <td><span className="date">{t.date}</span></td>
                  <td><Icon name="chevron" size={16} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="empty">Không tìm thấy phiếu nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-layer">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <form className="modal" onSubmit={e => { e.preventDefault(); setShowModal(false); notify("Tạo phiếu thành công!") }}>
            <div className="modal-head">
              <div><span className="eyebrow">Tạo phiếu mới</span><h2>Phiếu bảo hành</h2></div>
              <button type="button" className="icon-btn" onClick={() => setShowModal(false)}><Icon name="close" size={20} /></button>
            </div>
            <div className="modal-body">
              <label className="field"><span>Sản phẩm</span><input required placeholder="Nhập tên sản phẩm" /></label>
              <label className="field"><span>Số serial</span><input required placeholder="Số serial sản phẩm" /></label>
              <label className="field"><span>Khách hàng</span><input required placeholder="Tên khách hàng" /></label>
              <label className="field"><span>Ngày mua</span><input type="date" required /></label>
              <label className="field full"><span>Mô tả lỗi</span><textarea required placeholder="Mô tả tình trạng sản phẩm..." rows={3} /></label>
              <label className="field full"><span>Ghi chú</span><textarea placeholder="Ghi chú thêm (nếu có)..." rows={2} /></label>
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
