import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

export default function TicketDetail() {
  const [toast, setToast] = useState("")
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const ticket = {
    id: "#WR-2498",
    product: "MacBook Air M3",
    serial: "MBA-M3-8249",
    customer: "Nguyễn Minh Anh",
    phone: "0901234567",
    status: "Đang xử lý",
    tone: "amber",
    tech: "Hoàng Nam",
    date: "17/10/2026",
    issue: "Màn hình bị hiện tượng flickering, thỉnh thoảng xuất hiện các vạch màu ngang.",
    repair: "Đang kiểm tra và chờ linh kiện thay thế.",
    cost: "1,500,000đ",
  }

  const history = [
    { time: "17/10 09:42", action: "Tạo phiếu mới", user: "Minh Nguyễn", status: "blue" },
    { time: "17/10 10:15", action: "Phân công kỹ thuật", user: "Hoàng Nam", status: "amber" },
    { time: "17/10 11:30", action: "Bắt đầu kiểm tra", user: "Hoàng Nam", status: "violet" },
  ]

  return (
    <Layout eyebrow="Chi tiết phiếu" title={ticket.id} description={`${ticket.product} · ${ticket.customer}`}>
      <div className="detail-grid">
        {/* Info Card */}
        <div className="card">
          <div className="detail-section">
            <h3>Thông tin phiếu</h3>
            <div className="detail-row">
              <span>Trạng thái</span>
              <span className={`badge ${ticket.tone}`}><i />{ticket.status}</span>
            </div>
            <div className="detail-row">
              <span>Ngày tạo</span>
              <strong>{ticket.date}</strong>
            </div>
            <div className="detail-row">
              <span>Kỹ thuật viên</span>
              <strong>{ticket.tech}</strong>
            </div>
            <div className="detail-row">
              <span>Chi phí dự kiến</span>
              <strong style={{color: 'var(--cyan)'}}>{ticket.cost}</strong>
            </div>
          </div>
        </div>

        {/* Product Card */}
        <div className="card">
          <div className="detail-section">
            <h3>Thông tin sản phẩm</h3>
            <div className="detail-row">
              <span>Tên sản phẩm</span>
              <strong>{ticket.product}</strong>
            </div>
            <div className="detail-row">
              <span>Số serial</span>
              <strong>{ticket.serial}</strong>
            </div>
          </div>
          <div className="detail-section">
            <h3>Khách hàng</h3>
            <div className="detail-row">
              <span>Tên</span>
              <strong>{ticket.customer}</strong>
            </div>
            <div className="detail-row">
              <span>Điện thoại</span>
              <strong>{ticket.phone}</strong>
            </div>
          </div>
        </div>

        {/* Issue Card */}
        <div className="card">
          <div className="detail-section">
            <h3>Mô tả lỗi</h3>
            <p className="issue-text">{ticket.issue}</p>
          </div>
          <div className="detail-section">
            <h3>Ghi chú sửa chữa</h3>
            <p className="issue-text">{ticket.repair}</p>
          </div>
        </div>

        {/* History Card */}
        <div className="card">
          <div className="detail-section">
            <h3>Lịch sử xử lý</h3>
            <div className="history-list">
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <span className={`history-dot ${h.status}`} />
                  <div>
                    <strong>{h.action}</strong>
                    <small>{h.user} · {h.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <button className="btn-ghost" onClick={() => notify("Đã in phiếu")}>
          <Icon name="chart" size={17} /> In phiếu
        </button>
        <button className="btn-primary" onClick={() => notify("Đã cập nhật trạng thái")}>
          <Icon name="check" size={17} /> Cập nhật
        </button>
      </div>

      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
