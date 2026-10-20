import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Icon } from '../components/Layout'

const FEATURES = [
  {
    icon: 'shield',
    title: 'Tra cứu thông minh',
    desc: 'Tìm kiếm nhanh chóng với AI, hỗ trợ tìm kiếm bằng số serial, tên khách hàng hoặc mã phiếu.'
  },
  {
    icon: 'chart',
    title: 'Phân tích chi tiết',
    desc: 'Báo cáo trực quan, theo dõi hiệu suất xử lý và xu hướng bảo hành theo thời gian thực.'
  },
  {
    icon: 'clock',
    title: 'Xử lý nhanh chóng',
    desc: 'Quy trình tự động hóa từ tiếp nhận đến hoàn thành, giảm 40% thời gian xử lý trung bình.'
  },
  {
    icon: 'users',
    title: 'Quản lý khách hàng',
    desc: 'Lịch sử bảo hành đầy đủ, thông tin khách hàng và thiết bị được lưu trữ an toàn.'
  },
  {
    icon: 'box',
    title: 'Quản lý kho',
    desc: 'Theo dõi linh kiện thay thế, số lượng tồn kho và tự động thông báo khi cần nhập thêm.'
  },
  {
    icon: 'spark',
    title: 'AI Warrio Assistant',
    desc: 'Trợ lý AI 24/7, trả lời câu hỏi và hỗ trợ khách hàng mọi lúc mọi nơi.'
  }
]

const STATS = [
  { value: '10,000+', label: 'Phiếu bảo hành' },
  { value: '2,500+', label: 'Khách hàng' },
  { value: '98%', label: 'Tỷ lệ hài lòng' },
  { value: '24/7', label: 'Hỗ trợ AI' }
]

export default function Landing() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      notify('Vui lòng nhập đầy đủ thông tin!')
      return
    }
    setLoading(true)
    
    try {
      await login(email, password)
      notify('Đăng nhập thành công!')
      navigate('/dashboard')
    } catch (err) {
      notify(err.message || 'Email hoặc mật khẩu không đúng!')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (role) => {
    const accounts = {
      admin: { email: 'admin@test.com', password: 'admin123' },
      staff: { email: 'staff@test.com', password: 'staff123' },
      tech: { email: 'tech@test.com', password: 'tech123' }
    }
    const acc = accounts[role]
    setEmail(acc.email)
    setPassword(acc.password)
    setLoading(true)
    
    try {
      await login(acc.email, acc.password)
      notify('Đăng nhập thành công!')
      navigate('/dashboard')
    } catch (err) {
      notify(err.message || 'Đăng nhập thất bại!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page">
      {/* Left Panel - Branding & Features */}
      <div className="landing-left">
        {/* Header */}
        <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
          <div className="landing-brand">
            <div className="brand-icon">
              <Icon name="shield" size={22} />
            </div>
            <div>
              <strong>BảoHành Pro</strong>
              <small>Hệ thống quản lý</small>
            </div>
          </div>
          <nav className="landing-nav">
            <a href="#features">Tính năng</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#about">Giới thiệu</a>
            <Link to="/lookup" className="landing-nav-cta">Tra cứu BH</Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="landing-hero">
          <div className="hero-badge">
            <Icon name="spark" size={14} />
            <span>Hệ thống quản lý bảo hành thông minh</span>
          </div>
          <h1>Quản lý bảo hành
            <span className="gradient-text"> thông minh hơn</span>
          </h1>
          <p className="hero-desc">
            BảoHành Pro giúp doanh nghiệp của bạn xử lý bảo hành nhanh chóng, 
            tra cứu dễ dàng với AI và theo dõi hiệu suất vận hành real-time.
          </p>
          <div className="hero-actions">
            <a href="#login" className="btn-primary-landing">
              Bắt đầu ngay
              <Icon name="arrow" size={16} />
            </a>
            <Link to="/lookup" className="btn-secondary-landing">
              <Icon name="search" size={16} />
              Tra cứu bảo hành
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="landing-stats">
          {STATS.map(stat => (
            <div key={stat.label} className="stat-item">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        {/* Features Grid */}
        <section id="features" className="landing-features">
          <div className="section-label">Tính năng nổi bật</div>
          <h2>Mọi thứ bạn cần trong một nền tảng</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">
                  <Icon name={f.icon} size={20} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="landing-cta">
          <div className="cta-content">
            <h2>Sẵn sàng nâng cấp?</h2>
            <p>Tham gia cùng hàng nghìn doanh nghiệp đã tin dùng Warrio</p>
            <a href="#login" className="btn-primary-landing large">
              Dùng thử miễn phí
              <Icon name="arrow" size={16} />
            </a>
          </div>
          <div className="cta-glow" />
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-brand">
            <div className="brand-icon sm">
              <Icon name="shield" size={18} />
            </div>
            <span>BảoHành Pro © 2024</span>
          </div>
          <div className="footer-links">
            <a href="#">Điều khoản</a>
            <a href="#">Bảo mật</a>
            <a href="#">Liên hệ</a>
          </div>
        </footer>
      </div>

      {/* Right Panel - Login Form */}
      <div id="login" className="landing-right">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <Icon name="shield" size={32} />
            </div>
            <h2>Chào mừng trở lại!</h2>
            <p>Đăng nhập để quản lý hệ thống bảo hành</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Icon name="mail" size={18} />
                <input
                  type="email"
                  placeholder="email@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <Icon name="lock" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  <Icon name={showPass ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="forgot-link">Quên mật khẩu?</a>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  Đăng nhập
                  <Icon name="arrow" size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Login */}
          <div className="quick-login">
            <span>Đăng nhập nhanh:</span>
            <div className="quick-btns">
              <button onClick={() => handleQuickLogin('admin')} className="quick-btn admin">
                <Icon name="shield" size={14} />
                Admin
              </button>
              <button onClick={() => handleQuickLogin('staff')} className="quick-btn staff">
                <Icon name="users" size={14} />
                Staff
              </button>
              <button onClick={() => handleQuickLogin('tech')} className="quick-btn customer">
                <Icon name="user" size={14} />
                Kỹ thuật
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="register-prompt">
            <p>Chưa có tài khoản? <a href="#">Đăng ký ngay</a></p>
          </div>

          {/* Features List */}
          <div className="login-features">
            <div className="login-feature">
              <Icon name="check" size={14} />
              <span>Bảo mật 256-bit encryption</span>
            </div>
            <div className="login-feature">
              <Icon name="check" size={14} />
              <span>Đăng nhập không cần mật khẩu</span>
            </div>
            <div className="login-feature">
              <Icon name="check" size={14} />
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
        </div>

        {/* Floating shapes */}
        <div className="floating-shape shape-1" />
        <div className="floating-shape shape-2" />
        <div className="floating-shape shape-3" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-landing">
          <Icon name={toast.includes('thành công') ? 'check' : 'bell'} size={16} />
          {toast}
        </div>
      )}
    </div>
  )
}
