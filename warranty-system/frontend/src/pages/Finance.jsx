import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

const transactions = [
  { id: "TXN-4521", date: "17/10/2026", desc: "Phí dịch vụ bảo hành", category: "Thu", amount: "+500.000đ", balance: "45.850.000đ" },
  { id: "TXN-4520", date: "16/10/2026", desc: "Linh kiện thay thế", category: "Chi", amount: "-150.000đ", balance: "45.350.000đ" },
  { id: "TXN-4519", date: "16/10/2026", desc: "Phí dịch vụ bảo hành", category: "Thu", amount: "+350.000đ", balance: "45.500.000đ" },
  { id: "TXN-4518", date: "15/10/2026", desc: "Vật tư phụ", category: "Chi", amount: "-50.000đ", balance: "45.150.000đ" },
  { id: "TXN-4517", date: "15/10/2026", desc: "Phí dịch vụ bảo hành", category: "Thu", amount: "+800.000đ", balance: "45.200.000đ" },
]

export default function Finance() {
  const [toast, setToast] = useState("")

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const stats = [
    { label: "Tổng thu", value: "156.8M", change: "+18%", icon: "arrow", tone: "green" },
    { label: "Tổng chi", value: "45.2M", change: "+5%", icon: "arrow", tone: "amber" },
    { label: "Lợi nhuận", value: "111.6M", change: "+24%", icon: "chart", tone: "violet" },
    { label: "Số giao dịch", value: "847", change: "+32", icon: "finance", tone: "blue" },
  ]

  return (
    <Layout eyebrow="Sổ tài chính" title="Tài chính" description="Theo dõi thu chi, lợi nhuận và báo cáo tài chính.">
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
          <input placeholder="Tìm mã GD, mô tả..." />
        </div>
        <button className="btn-primary" onClick={() => notify("Đã xuất báo cáo")}>
          <Icon name="chart" size={17} /> Xuất Excel
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Ngày</th>
                <th>Mô tả</th>
                <th>Danh mục</th>
                <th>Số tiền</th>
                <th>Số dư</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} onClick={() => notify(`Xem chi tiết ${t.id}`)}>
                  <td><strong>{t.id}</strong></td>
                  <td><span>{t.date}</span></td>
                  <td><strong>{t.desc}</strong></td>
                  <td><span className={`badge ${t.category === 'Thu' ? 'green' : 'amber'}`}>{t.category}</span></td>
                  <td><span className={`amount ${t.category === 'Thu' ? 'topup' : 'payment'}`}>{t.amount}</span></td>
                  <td><span>{t.balance}</span></td>
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
