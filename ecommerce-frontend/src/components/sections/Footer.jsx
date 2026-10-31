import { Link } from 'react-router-dom';
import {
  ArrowUp,
  Cart,
  CreditCard,
  Facebook,
  Headset,
  Mail,
  MapPin,
  Phone,
  Refresh,
  Shield,
  Truck,
  Youtube,
  Zalo,
} from '../icons';

const LINK_COLUMNS = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tivi & âm thanh', to: '/search?category=tivi' },
      { label: 'Máy lọc nước', to: '/search?category=may-loc-nuoc' },
      { label: 'Tủ lạnh & máy lạnh', to: '/search?category=lam-lanh' },
      { label: 'Điện gia dụng', to: '/search?category=thiet-bi-gia-dung' },
      { label: 'Phụ kiện', to: '/search?category=phu-kien' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Tra cứu bảo hành', to: '/warranty' },
      { label: 'Chính sách đổi trả', to: '/policy/return' },
      { label: 'Chính sách bảo mật', to: '/policy/privacy' },
      { label: 'Điều khoản sử dụng', to: '/policy/terms' },
      { label: 'Câu hỏi thường gặp', to: '/faq' },
      { label: 'Tính năng đang được cập nhật', to: '/coming-soon' },
    ],
  },
  {
    title: 'Về chúng tôi',
    links: [
      { label: 'Giới thiệu công ty', to: '/about' },
      { label: 'Tuyển dụng', to: '/careers' },
      { label: 'Báo chí', to: '/press' },
      { label: 'Đại lý & bán buôn', to: '/wholesale' },
    ],
  },
  {
    title: 'Thanh toán',
    links: [
      { label: 'Ví MoMo', to: '/payment/momo' },
      { label: 'ZaloPay', to: '/payment/zalopay' },
      { label: 'Visa / Mastercard', to: '/payment/card' },
      { label: 'Trả góp 0%', to: '/payment/installment' },
    ],
  },
];

const GUARANTEES = [
  { icon: <Shield className="h-5 w-5" />, title: 'Bảo hành chính hãng', desc: 'Đến 10 năm tùy sản phẩm' },
  { icon: <Truck className="h-5 w-5" />, title: 'Giao hàng 2H nội thành', desc: 'Miễn phí từ 500.000 ₫' },
  { icon: <Refresh className="h-5 w-5" />, title: 'Đổi trả 30 ngày', desc: 'Không cần lý do' },
  { icon: <CreditCard className="h-5 w-5" />, title: 'Thanh toán an toàn', desc: 'Trả góp 0%' },
];

const CONTACT = [
  { icon: <Phone className="h-4 w-4" />, label: '0827461460' },
  { icon: <Mail className="h-4 w-4" />, label: 'manhdungcbn@gmail.com' },
  { icon: <MapPin className="h-4 w-4" />, label: 'Nam Tuấn, Cao Bằng' },
];

/**
 * Footer 5 cột (brand + 4 cột link) + hàng bảo quyền.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line-200 bg-surface-card">
      {/* Bảo đảm */}
      <div className="border-b border-line-100 bg-surface-subtle">
        <div className="container-page grid grid-cols-2 gap-4 py-8 lg:grid-cols-4 lg:gap-8">
          {GUARANTEES.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="container-page grid grid-cols-2 gap-8 py-12 lg:grid-cols-12 lg:gap-6">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-4">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Về trang chủ">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-cta text-white">
              <Cart className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-ink-900">
              Điện<span className="text-brand-600">Tử</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-ink-500 text-pretty">
            Chuyên thiết bị điện tử gia dụng chính hãng, giá tốt, bảo hành uy tín và đổi trả linh hoạt
            trên toàn quốc.
          </p>

          <ul className="mt-5 flex flex-col gap-2">
            {CONTACT.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm text-ink-500">
                <span className="text-ink-300">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-2">
            {[
              { icon: <Facebook className="h-4 w-4" />, label: 'Facebook' },
              { icon: <Zalo className="h-4 w-4" />, label: 'Zalo' },
              { icon: <Youtube className="h-4 w-4" />, label: 'YouTube' },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={`Điều hướng tới ${social.label}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-200 text-ink-500 transition-colors duration-150 hover:border-brand-accent hover:text-brand-600"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* 4 cột link */}
        {LINK_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-ink-900">{column.title}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-500 transition-colors duration-150 hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bảo quyền */}
      <div className="border-t border-line-100">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Công ty CP Điện Tử Việt Nam. MST: 0312345678 · ĐKDN: 0301234567 · Giấy phép
            KD: 0312345678
          </p>
          <div className="flex items-center gap-4">
            <Link to="/policy/privacy" className="hover:text-brand-600">
              Bảo mật
            </Link>
            <Link to="/policy/terms" className="hover:text-brand-600">
              Điều khoản
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-200 px-3 font-semibold text-ink-700 transition-colors duration-150 hover:bg-surface-hover"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Lên đầu trang
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;