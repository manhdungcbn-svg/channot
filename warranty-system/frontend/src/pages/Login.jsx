import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Icon } from '../components/Layout'

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800) }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      await login(email, password)
      notify("Đăng nhập thành công!")
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span><Icon name="shield" size={28} /></span>
        </div>
        <h1>Warrio</h1>
        <p>Trung tâm bảo hành</p>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#2a1a1a', color: '#ff6b6b', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" required placeholder="email@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Mật khẩu</span>
            <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center', padding: '14px'}} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="login-links">
          <a href="#">Quên mật khẩu?</a>
          <span>·</span>
          <a href="#">Liên hệ hỗ trợ</a>
        </div>
      </div>

      {toast && (
        <div className="toast">
          <span><Icon name="check" size={16} /></span>
          {toast}
        </div>
      )}
    </div>
  )
}
