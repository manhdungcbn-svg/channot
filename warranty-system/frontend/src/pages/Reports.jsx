import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

export default function Reports() {
  const [toast, setToast] = useState("")

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const stats = [
    { label: "Tổng doanh thu", value: "156.8M", change: "+18%", icon: "finance", tone: "green" },
    { label: "Tổng chi phí", value: "45.2M", change: "+5%", icon: "finance", tone: "amber" },
    { label: "Lợi nhuận", value: "111.6M", change: "+24%", icon: "chart", tone: "violet" },
    { label: "Tổng phiếu", value: "2,847", change: "+12%", icon: "ticket", tone: "blue" },
  ]

  const reportTypes = [
    { icon: "chart", title: "Báo cáo tổng quan", desc: "Thống kê tổng thể hệ thống", color: "blue" },
    { icon: "ticket", title: "Báo cáo phiếu BH", desc: "Chi tiết phiếu bảo hành", color: "green" },
    { icon: "box", title: "Báo cáo sản phẩm", desc: "Sản phẩm và serial", color: "violet" },
    { icon: "users", title: "Báo cáo khách hàng", desc: "Tiers và hành vi", color: "amber" },
    { icon: "finance", title: "Báo cáo tài chính", desc: "Thu chi và lợi nhuận", color: "green" },
    { icon: "chart", title: "Báo cáo SLA", desc: "Thời gian xử lý", color: "blue" },
  ]

  return (
    <Layout eyebrow="Dữ liệu vận hành" title="Báo cáo & phân tích" description="Nắm bắt hiệu suất, thời gian xử lý và mức độ hài lòng.">
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

      {/* Report Types */}
      <div className="section-head">
        <h2>Loại báo cáo</h2>
      </div>

      <div className="report-grid">
        {reportTypes.map(r => (
          <button key={r.title} className="report-card" onClick={() => notify(`Đang tải ${r.title}`)}>
            <span className={`report-icon ${r.color}`}><Icon name={r.icon} size={22} /></span>
            <div>
              <strong>{r.title}</strong>
              <p>{r.desc}</p>
            </div>
            <Icon name="arrow" size={16} />
          </button>
        ))}
      </div>

      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
