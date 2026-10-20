import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

const notifications = [
  { id: 1, title: "Phiếu #WR-2496 đã hoàn thành", desc: "Kỹ thuật viên Hoàng Nam đã hoàn tất sửa chữa", time: "12 phút trước", tone: "green", read: false },
  { id: 2, title: "Phiếu mới #WR-2498", desc: "Nguyễn Minh Anh tạo phiếu mới cho MacBook Air M3", time: "34 phút trước", tone: "blue", read: false },
  { id: 3, title: "Đã nhận linh kiện", desc: "Màn hình Samsung Odyssey G7 đã về kho", time: "1 giờ trước", tone: "violet", read: true },
  { id: 4, title: "Cảnh báo: Phiếu quá hạn", desc: "3 phiếu đang chờ xử lý quá 5 ngày", time: "2 giờ trước", tone: "amber", read: true },
  { id: 5, title: "Thanh toán thành công", desc: "Khách hàng đã thanh toán 500.000đ", time: "3 giờ trước", tone: "green", read: true },
]

export default function Notifications() {
  const [toast, setToast] = useState("")
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  return (
    <Layout eyebrow="Trung tâm thông báo" title="Thông báo" description="Tất cả thông báo từ hệ thống.">
      <div className="card">
        <div className="notif-list">
          {notifications.map(n => (
            <button key={n.id} className={`notif-row ${n.read ? '' : 'unread'}`} onClick={() => notify("Đã đánh dấu là đã đọc")}>
              <span className={`notif-icon-lg ${n.tone}`}><Icon name="bell" size={18} /></span>
              <div className="notif-content">
                <strong>{n.title}</strong>
                <p>{n.desc}</p>
                <small>{n.time}</small>
              </div>
              {!n.read && <i className="unread-dot" />}
            </button>
          ))}
        </div>
      </div>
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
