import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

const rmas = [
  { id: "RMA-001", product: "MacBook Air M3", serial: "MBA-M3-8249", customer: "Nguyễn Minh Anh", status: "Pending", reason: "Lỗi màn hình", date: "17/10/2026", tone: "amber" },
  { id: "RMA-002", product: "Sony WH-1000XM5", serial: "SNY-XM5-1028", customer: "Trần Quốc Huy", status: "Approved", reason: "Không sạc được", date: "16/10/2026", tone: "blue" },
  { id: "RMA-003", product: "Samsung Odyssey G7", serial: "SS-G7-9211", customer: "Lê Thanh Hà", status: "Completed", reason: "Hỏng cổng HDMI", date: "15/10/2026", tone: "green" },
  { id: "RMA-004", product: "Dell XPS 15", serial: "DXPS-5510", customer: "Đặng Minh Đức", status: "Rejected", reason: "Hết bảo hành", date: "14/10/2026", tone: "red" },
]

export default function RMA() {
  const [toast, setToast] = useState("")
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  return (
    <Layout eyebrow="Đổi/Trả hàng" title="Quản lý RMA" description="Xử lý yêu cầu đổi/trả sản phẩm.">
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Mã RMA</th><th>Sản phẩm</th><th>Khách hàng</th><th>Lý do</th><th>Ngày</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {rmas.map(r => (
                <tr key={r.id} onClick={() => notify(`Xem chi tiết ${r.id}`)}>
                  <td><strong>{r.id}</strong><span>{r.serial}</span></td>
                  <td><strong>{r.product}</strong></td>
                  <td><span>{r.customer}</span></td>
                  <td><span>{r.reason}</span></td>
                  <td><span className="date">{r.date}</span></td>
                  <td><span className={`badge ${r.tone}`}><i />{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
