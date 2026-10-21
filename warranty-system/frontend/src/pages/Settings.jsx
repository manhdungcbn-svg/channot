import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { ProfileTab, AvatarUpload, PasswordChangeTab } from '../components/settings'

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const TABS = [
  { id: 'profile', label: 'Hồ sơ', icon: <UserIcon /> },
  { id: 'avatar', label: 'Ảnh đại diện', icon: <CameraIcon /> },
  { id: 'password', label: 'Đổi mật khẩu', icon: <LockIcon /> },
]

export default function Settings() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const [localUser, setLocalUser] = useState(user)

  function handleUserUpdate(updated) {
    setLocalUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  return (
    <Layout pageId="settings">
      <div className="app-page max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#0F1929' }}>
            Cài đặt tài khoản
          </h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Quản lý thông tin cá nhân và bảo mật</p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? '#1A3A6B' : 'transparent',
                color: tab === t.id ? '#FFFFFF' : '#64748B',
              }}>
              <span style={{ opacity: tab === t.id ? 1 : 0.6 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4EBF7' }}>
          {tab === 'profile' && <ProfileTab user={localUser} onUserUpdate={handleUserUpdate} />}
          {tab === 'avatar' && <AvatarUpload user={localUser} onUserUpdate={handleUserUpdate} />}
          {tab === 'password' && <PasswordChangeTab user={localUser} />}
        </div>
      </div>
    </Layout>
  )
}