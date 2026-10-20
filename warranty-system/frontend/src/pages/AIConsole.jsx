import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

export default function AIConsole() {
  const [toast, setToast] = useState("")

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const stats = [
    { label: "Model", value: "Gemini 2.0 Flash", icon: "chat", tone: "blue" },
    { label: "Status", value: "🟢 Online", icon: "check", tone: "green" },
    { label: "Requests Today", value: "1,234", icon: "chart", tone: "violet" },
    { label: "Success Rate", value: "99.2%", icon: "chart", tone: "green" },
  ]

  const classifications = [
    { type: "HARDWARE", percent: 45, color: "blue" },
    { type: "SOFTWARE", percent: 30, color: "violet" },
    { type: "POWER", percent: 15, color: "amber" },
    { type: "NETWORK", percent: 8, color: "green" },
    { type: "OTHER", percent: 2, color: "gray" },
  ]

  return (
    <Layout eyebrow="AI Services" title="AI Console" description="Quản lý và giám sát dịch vụ AI.">
      {/* Status Cards */}
      <div className="stats-row">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-top">
              <span className={`stat-icon ${s.tone}`}><Icon name={s.icon} size={18} /></span>
            </div>
            <p>{s.label}</p>
            <strong className="stat-value">{s.value}</strong>
          </div>
        ))}
      </div>

      {/* Classification Stats */}
      <div className="section-head">
        <h2>Phân loại lỗi AI</h2>
      </div>

      <div className="card">
        <div className="ai-stats">
          {classifications.map(c => (
            <div key={c.type} className="ai-stat-row">
              <span className="ai-label">{c.type}</span>
              <div className="ai-bar">
                <div className={`ai-fill ${c.color}`} style={{width: `${c.percent}%`}} />
              </div>
              <span className="ai-percent">{c.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="action-row">
        <button className="btn-primary" onClick={() => notify("Đã kiểm tra kết nối AI")}>
          <Icon name="check" size={17} /> Kiểm tra kết nối
        </button>
        <button className="btn-ghost" onClick={() => notify("Đã mở cài đặt AI")}>
          <Icon name="settings" size={17} /> Cài đặt AI
        </button>
      </div>

      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
