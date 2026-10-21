import { useState, useMemo, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Layout, { Icon, navItems } from '../components/Layout'

const tickets = [
  { id: "#WR-2498", customer: "Nguyễn Minh Anh", product: "MacBook Air M3", serial: "MBA-M3-8249", status: "Đang xử lý", tone: "amber", date: "Hôm nay, 09:42" },
  { id: "#WR-2497", customer: "Trần Quốc Huy", product: "Sony WH-1000XM5", serial: "SNY-XM5-1028", status: "Chờ linh kiện", tone: "violet", date: "Hôm nay, 08:15" },
  { id: "#WR-2496", customer: "Lê Thanh Hà", product: "Samsung Odyssey G7", serial: "SS-G7-9211", status: "Hoàn thành", tone: "green", date: "Hôm qua, 16:30" },
  { id: "#WR-2495", customer: "Phạm Gia Bảo", product: "Logitech MX Master 3S", serial: "LG-MX3-4402", status: "Mới tiếp nhận", tone: "blue", date: "Hôm qua, 14:05" },
]

const activity = [
  { icon: "check", title: "Hoàn tất phiếu #WR-2496", desc: "Kỹ thuật viên Hoàng Nam", time: "12 phút trước", tone: "green" },
  { icon: "ticket", title: "Phiếu mới #WR-2498", desc: "Nguyễn Minh Anh · MacBook Air M3", time: "34 phút trước", tone: "blue" },
  { icon: "box", title: "Đã nhận linh kiện", desc: "Màn hình Samsung Odyssey G7", time: "1 giờ trước", tone: "violet" },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function formatDate() {
  const options = { weekday: 'long', day: 'numeric', month: 'long' }
  return new Date().toLocaleDateString('vi-VN', options)
}

export default function Dashboard() {
  const [query, setQuery] = useState("")
  const [toast, setToast] = useState("")
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const notify = (message) => {
    setToast(message)
    setTimeout(() => setToast(""), 2800)
  }

  const filteredTickets = useMemo(
    () => tickets.filter((ticket) => `${ticket.id} ${ticket.customer} ${ticket.product} ${ticket.serial}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  )

  return (
    <Layout 
      eyebrow={formatDate()} 
      title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'bạn'}`}
      description="Đây là tình hình trung tâm bảo hành của bạn hôm nay."
      headerAction={
        <button className="btn-primary" onClick={() => navigate('/tickets')}>
          <Icon name="plus" size={17} /> Tạo phiếu mới
        </button>
      }
    >
      {/* Stats */}
      <div className="stats-row">
        <StatCard label="Tổng phiếu tháng này" value="248" change="+12,5%" icon="ticket" tone="blue" data={[28, 42, 36, 55, 48, 72, 65]} />
        <StatCard label="Đang xử lý" value="37" change="8 phiếu quá hạn" icon="clock" tone="amber" data={[62, 53, 68, 46, 51, 40, 44]} />
        <StatCard label="Đã hoàn thành" value="196" change="+18,2%" icon="check" tone="green" data={[20, 32, 38, 46, 54, 62, 78]} />
        <StatCard label="Khách hàng mới" value="84" change="+9,4%" icon="users" tone="violet" data={[28, 24, 38, 35, 48, 43, 57]} />
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Tickets Table */}
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Phiếu gần đây</h2>
              <p>Cập nhật theo thời gian thực</p>
            </div>
            <a href="/tickets" className="link-btn">Xem tất cả <Icon name="arrow" size={15} /></a>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Mã phiếu</th><th>Khách hàng & sản phẩm</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong>{ticket.id}</strong><span>{ticket.serial}</span></td>
                    <td><strong>{ticket.customer}</strong><span>{ticket.product}</span></td>
                    <td><span className={`badge ${ticket.tone}`}><i />{ticket.status}</span></td>
                    <td><span className="date">{ticket.date}</span></td>
                    <td><Icon name="chevron" size={16} /></td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && <tr><td colSpan={5} className="empty">Không tìm thấy kết quả phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Hoạt động mới</h2>
              <p>Trong 24 giờ qua</p>
            </div>
            <button className="link-btn">•••</button>
          </div>
          <div className="activity-list">
            {activity.map((item, i) => (
              <div key={item.title} className="activity-item">
                <span className={`notif-icon ${item.tone}`}><Icon name={item.icon} size={17} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                  <small>{item.time}</small>
                </div>
                {i < activity.length - 1 && <i className="line" />}
              </div>
            ))}
          </div>
          <button className="full-btn" onClick={() => notify("Đã tải toàn bộ hoạt động")}>Xem toàn bộ hoạt động</button>
        </div>
      </div>

      {/* Insight Banner */}
      <div className="insight">
        <div className="insight-art"><Icon name="spark" size={28} /></div>
        <div className="insight-text">
          <span className="eyebrow">Phân tích thông minh BảoHành Pro</span>
          <h3>Hiệu suất xử lý đang tốt hơn 18% so với tháng trước</h3>
          <p>Thời gian xử lý trung bình đã giảm còn 2,4 ngày. Tiếp tục ưu tiên nhóm phiếu "Chờ linh kiện" để giữ vững cam kết thời gian xử lý.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/reports')}>Xem phân tích <Icon name="arrow" size={15} /></button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <span><Icon name="check" size={16} /></span>
          {toast}
        </div>
      )}
    </Layout>
  )
}

function StatCard({ label, value, change, icon, tone, data }) {
  const pts = data.map((n, i) => `${i * 23},${80 - n}`).join(" ")
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}><Icon name={icon} size={18} /></span>
        <span className={`change ${tone}`}>{change}</span>
      </div>
      <p>{label}</p>
      <strong className="stat-value">{value}</strong>
      <svg className="sparkline" viewBox="0 0 138 70" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,70 ${pts} 138,70`} fill={`url(#grad-${tone})`} />
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
      </svg>
    </article>
  )
}
