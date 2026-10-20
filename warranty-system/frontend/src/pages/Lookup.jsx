import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

export default function Lookup() {
  const [query, setQuery] = useState("")
  const [searched, setSearched] = useState(false)
  const [toast, setToast] = useState("")

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearched(true)
    notify("Đã tìm thấy sản phẩm")
  }

  return (
    <Layout eyebrow="Kiểm tra tức thì" title="Tra cứu bảo hành" description="Nhập số sê-ri để kiểm tra quyền lợi bảo hành.">
      <div className="lookup-hero">
        <div className="lookup-icon">
          <Icon name="shield" size={32} />
          <div className="pulse-ring" />
          <div className="pulse-ring delay" />
        </div>
        <h2>Kiểm tra quyền lợi bảo hành</h2>
        <p>Nhập số sê-ri sản phẩm để truy xuất thông tin trong vài giây.</p>
        
        <form onSubmit={handleSearch} className="lookup-form">
          <Icon name="search" size={20} />
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Nhập số sê-ri, ví dụ MBA-M3-8249" 
          />
          <button type="submit" className="btn-primary">
            <Icon name="arrow" size={17} /> Tra cứu
          </button>
        </form>

        {searched && (
          <div className="lookup-result">
            <span className="notif-icon green"><Icon name="check" size={20} /></span>
            <div>
              <span className="eyebrow">Bảo hành còn hiệu lực</span>
              <h3>MacBook Air M3 · Màn hình 13.6"</h3>
              <p>Số sê-ri: {query} · Còn 287 ngày bảo hành chính hãng</p>
            </div>
            <span className="badge green"><i />Đang hoạt động</span>
          </div>
        )}

        <small className="lookup-note">Thông tin được mã hóa và bảo mật theo tiêu chuẩn doanh nghiệp.</small>
      </div>
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
