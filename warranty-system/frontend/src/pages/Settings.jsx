import { useState } from 'react'
import Layout, { Icon } from '../components/Layout'

export default function Settings() {
  const [toast, setToast] = useState("")
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  return (
    <Layout eyebrow="Cấu hình hệ thống" title="Cài đặt" description="Quản lý tài khoản, quyền và cấu hình.">
      <div className="settings-grid">
        <div className="card settings-card">
          <h3>Thông tin tài khoản</h3>
          <div className="setting-item">
            <span>Tên</span>
            <input defaultValue="Minh Nguyễn" />
          </div>
          <div className="setting-item">
            <span>Email</span>
            <input defaultValue="minhnguyen@warrio.vn" type="email" />
          </div>
          <div className="setting-item">
            <span>Số điện thoại</span>
            <input defaultValue="0901234567" />
          </div>
          <button className="btn-primary" onClick={() => notify("Lưu thay đổi")}>Lưu thay đổi</button>
        </div>

        <div className="card settings-card">
          <h3>Bảo mật</h3>
          <div className="setting-item">
            <span>Mật khẩu hiện tại</span>
            <input type="password" placeholder="••••••••" />
          </div>
          <div className="setting-item">
            <span>Mật khẩu mới</span>
            <input type="password" placeholder="••••••••" />
          </div>
          <button className="btn-ghost" onClick={() => notify("Đổi mật khẩu thành công")}>Đổi mật khẩu</button>
        </div>

        <div className="card settings-card">
          <h3>Thông báo</h3>
          <label className="toggle-item">
            <span>Email thông báo</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="toggle-item">
            <span>SMS thông báo</span>
            <input type="checkbox" />
          </label>
          <label className="toggle-item">
            <span>Thông báo hệ thống</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </div>
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </Layout>
  )
}
