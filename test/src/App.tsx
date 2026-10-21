import { useMemo, useState } from "react"

type IconName = "grid" | "box" | "ticket" | "shield" | "chart" | "bell" | "settings" | "search" | "plus" | "arrow" | "clock" | "check" | "users" | "spark" | "chevron" | "menu" | "close"

const paths: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  box: (
    <>
      <path d="m21 8-9 5-9-5" />
      <path d="m3 8 9-5 9 5v8l-9 5-9-5Z" />
      <path d="M12 13v8" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 4h16v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6Z" />
      <path d="M13 8h3M13 12h3M13 16h2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
      <path d="M2 19h22" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z" />
      <path d="m5 13 .7 2.3L8 16l-2.3.7L5 19l-.7-2.3L2 16l2.3-.7Z" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
}

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const navItems: { label: string icon: IconName }[] = [
  { label: "Tổng quan", icon: "grid" },
  { label: "Sản phẩm", icon: "box" },
  { label: "Phiếu bảo hành", icon: "ticket" },
  { label: "Tra cứu bảo hành", icon: "shield" },
  { label: "Báo cáo", icon: "chart" },
]

const tickets = [
  {
    id: "#WR-2498",
    customer: "Nguyễn Minh Anh",
    product: "MacBook Air M3",
    serial: "MBA-M3-8249",
    status: "Đang xử lý",
    tone: "amber",
    date: "Hôm nay, 09:42",
  },
  {
    id: "#WR-2497",
    customer: "Trần Quốc Huy",
    product: "Sony WH-1000XM5",
    serial: "SNY-XM5-1028",
    status: "Chờ linh kiện",
    tone: "violet",
    date: "Hôm nay, 08:15",
  },
  {
    id: "#WR-2496",
    customer: "Lê Thanh Hà",
    product: "Samsung Odyssey G7",
    serial: "SS-G7-9211",
    status: "Hoàn thành",
    tone: "green",
    date: "Hôm qua, 16:30",
  },
  {
    id: "#WR-2495",
    customer: "Phạm Gia Bảo",
    product: "Logitech MX Master 3S",
    serial: "LG-MX3-4402",
    status: "Mới tiếp nhận",
    tone: "blue",
    date: "Hôm qua, 14:05",
  },
]

const activity = [
  {
    icon: "check" as IconName,
    title: "Hoàn tất phiếu #WR-2496",
    desc: "Kỹ thuật viên Hoàng Nam",
    time: "12 phút trước",
    tone: "green",
  },
  {
    icon: "ticket" as IconName,
    title: "Phiếu mới #WR-2498",
    desc: "Nguyễn Minh Anh · MacBook Air M3",
    time: "34 phút trước",
    tone: "blue",
  },
  {
    icon: "box" as IconName,
    title: "Đã nhận linh kiện",
    desc: "Màn hình Samsung Odyssey G7",
    time: "1 giờ trước",
    tone: "violet",
  },
]

const pageCopy: Record<string, {
  eyebrow: string
  title: string
  description: string
}> = {
  "Tổng quan": {
    eyebrow: "Thứ hai, 26 tháng 5",
    title: "Chào buổi sáng, Minh",
    description: "Đây là tình hình trung tâm bảo hành của bạn hôm nay.",
  },
  "Sản phẩm": {
    eyebrow: "Kho dữ liệu sản phẩm",
    title: "Quản lý sản phẩm",
    description:
      "Theo dõi số sê-ri, thời hạn và trạng thái bảo hành trên một màn hình.",
  },
  "Phiếu bảo hành": {
    eyebrow: "Trung tâm xử lý",
    title: "Phiếu bảo hành",
    description: "Ưu tiên, phân công và theo dõi tiến độ từng yêu cầu.",
  },
  "Tra cứu bảo hành": {
    eyebrow: "Kiểm tra tức thì",
    title: "Tra cứu bảo hành",
    description: "Nhập số sê-ri để xem thông tin và quyền lợi bảo hành.",
  },
  "Báo cáo": {
    eyebrow: "Dữ liệu vận hành",
    title: "Báo cáo & phân tích",
    description: "Nắm bắt hiệu suất, thời gian xử lý và mức độ hài lòng.",
  },
}

export default function App() {
  const [active, setActive] = useState("Tổng quan")
  const [query, setQuery] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState("")

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        `${ticket.id} ${ticket.customer} ${ticket.product} ${ticket.serial}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  )

  const navigate = (label: string) => {
    setActive(label)
    setMobileOpen(false)
    setQuery("")
  }

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2800)
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="backdrop"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button className="brand" onClick={() => navigate("Tổng quan")}>
            <span className="brand-mark">
              <Icon name="shield" size={21} />
            </span>
            <span className="brand-copy">
              <strong>Warrio</strong>
              <small>Trung tâm bảo hành</small>
            </span>
          </button>
          <div className="menu-wrap">
            <button
              className={`menu-trigger ${mobileOpen ? "active" : ""}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
            >
              <Icon name="menu" size={18} />
              Menu
              <Icon name="chevron" size={14} />
            </button>
            {mobileOpen && (
              <nav className="menu-popover" aria-label="Điều hướng chính">
                <div className="menu-popover-title">
                  <span>Danh mục quản lý</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Đóng menu"
                  >
                    <Icon name="close" size={17} />
                  </button>
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    className={`nav-item ${
                      active === item.label ? "active" : ""
                    }`}
                    onClick={() => navigate(item.label)}
                  >
                    <span className="nav-icon">
                      <Icon name={item.icon} />
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>
                        {item.label === "Tổng quan" && "Tình hình vận hành"}
                        {item.label === "Sản phẩm" && "Thiết bị và số sê-ri"}
                        {item.label === "Phiếu bảo hành" &&
                          "Tiếp nhận và xử lý"}
                        {item.label === "Tra cứu bảo hành" &&
                          "Kiểm tra thời hạn"}
                        {item.label === "Báo cáo" && "Số liệu và hiệu suất"}
                      </small>
                    </span>
                    {item.label === "Phiếu bảo hành" && <b>8</b>}
                    <Icon name="chevron" size={15} />
                  </button>
                ))}
                <button
                  className="nav-item menu-settings"
                  onClick={() => notify("Đã mở cài đặt")}
                >
                  <span className="nav-icon">
                    <Icon name="settings" />
                  </span>
                  <span>
                    <strong>Cài đặt hệ thống</strong>
                    <small>Tài khoản và cấu hình</small>
                  </span>
                  <Icon name="chevron" size={15} />
                </button>
              </nav>
            )}
          </div>
          <label className="global-search">
            <Icon name="search" size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm phiếu, khách hàng, số sê-ri..."
            />
          </label>
          <div className="topbar-actions">
            <button
              className="icon-button notification-button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Thông báo"
            >
              <Icon name="bell" />
              <i />
            </button>
            <button
              className="primary-button"
              onClick={() => setShowModal(true)}
            >
              <Icon name="plus" size={18} /> Tạo phiếu mới
            </button>
            <div className="profile">
              <div className="avatar">MN</div>
              <div>
                <strong>Minh Nguyễn</strong>
                <span>Quản trị viên</span>
              </div>
            </div>
          </div>
          {notificationsOpen && (
            <div className="notification-popover">
              <div>
                <strong>Thông báo</strong>
                <button onClick={() => setNotificationsOpen(false)}>
                  <Icon name="close" size={17} />
                </button>
              </div>
              {activity.slice(0, 2).map((item) => (
                <button
                  key={item.title}
                  onClick={() => notify("Đã đánh dấu là đã đọc")}
                >
                  <span className={`activity-icon ${item.tone}`}>
                    <Icon name={item.icon} size={17} />
                  </span>
                  <span>
                    <b>{item.title}</b>
                    <small>{item.time}</small>
                  </span>
                </button>
              ))}
              <button
                className="view-all"
                onClick={() => notify("Đã mở trung tâm thông báo")}
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </header>

        <div className="page">
          <section className="page-heading">
            <div>
              <span className="eyebrow">{pageCopy[active].eyebrow}</span>
              <h1>{pageCopy[active].title}</h1>
              <p>{pageCopy[active].description}</p>
            </div>
            <button
              className="mobile-create"
              onClick={() => setShowModal(true)}
            >
              <Icon name="plus" />
            </button>
          </section>

          {active === "Tra cứu bảo hành" ? (
            <Lookup query={query} setQuery={setQuery} notify={notify} />
          ) : (
            <>
              <section className="stats-grid">
                <StatCard
                  label="Tổng phiếu tháng này"
                  value="248"
                  change="+12,5%"
                  icon="ticket"
                  tone="blue"
                  data={[28, 42, 36, 55, 48, 72, 65]}
                />
                <StatCard
                  label="Đang xử lý"
                  value="37"
                  change="8 phiếu quá hạn"
                  icon="clock"
                  tone="amber"
                  data={[62, 53, 68, 46, 51, 40, 44]}
                />
                <StatCard
                  label="Đã hoàn thành"
                  value="196"
                  change="+18,2%"
                  icon="check"
                  tone="green"
                  data={[20, 32, 38, 46, 54, 62, 78]}
                />
                <StatCard
                  label="Khách hàng mới"
                  value="84"
                  change="+9,4%"
                  icon="users"
                  tone="violet"
                  data={[28, 24, 38, 35, 48, 43, 57]}
                />
              </section>

              <section className="content-grid">
                <div className="card tickets-card">
                  <div className="card-header">
                    <div>
                      <h2>Phiếu gần đây</h2>
                      <p>Cập nhật theo thời gian thực</p>
                    </div>
                    <button onClick={() => navigate("Phiếu bảo hành")}>
                      Xem tất cả <Icon name="arrow" size={17} />
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Mã phiếu</th>
                          <th>Khách hàng & sản phẩm</th>
                          <th>Trạng thái</th>
                          <th>Cập nhật</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            onClick={() => notify(`Đang mở ${ticket.id}`)}
                          >
                            <td>
                              <strong>{ticket.id}</strong>
                              <span>{ticket.serial}</span>
                            </td>
                            <td>
                              <strong>{ticket.customer}</strong>
                              <span>{ticket.product}</span>
                            </td>
                            <td>
                              <span className={`status ${ticket.tone}`}>
                                <i />
                                {ticket.status}
                              </span>
                            </td>
                            <td>
                              <span className="date">{ticket.date}</span>
                            </td>
                            <td>
                              <Icon name="chevron" size={17} />
                            </td>
                          </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                          <tr>
                            <td colSpan={5} className="empty">
                              Không tìm thấy kết quả phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card activity-card">
                  <div className="card-header">
                    <div>
                      <h2>Hoạt động mới</h2>
                      <p>Trong 24 giờ qua</p>
                    </div>
                    <button className="more">•••</button>
                  </div>
                  <div className="activity-list">
                    {activity.map((item, index) => (
                      <div className="activity-item" key={item.title}>
                        <span className={`activity-icon ${item.tone}`}>
                          <Icon name={item.icon} size={18} />
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.desc}</p>
                          <small>{item.time}</small>
                        </div>
                        {index < activity.length - 1 && (
                          <i className="activity-line" />
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="full-button"
                    onClick={() => notify("Đã tải toàn bộ hoạt động")}
                  >
                    Xem toàn bộ hoạt động
                  </button>
                </div>
              </section>

              <section className="insight-banner">
                <div className="insight-art">
                  <span>
                    <Icon name="spark" size={26} />
                  </span>
                </div>
                <div>
                  <span className="eyebrow">Phân tích thông minh Warrio</span>
                  <h3>Hiệu suất xử lý đang tốt hơn 18% so với tháng trước</h3>
                  <p>
                    Thời gian xử lý trung bình đã giảm còn 2,4 ngày. Tiếp tục ưu
                    tiên nhóm phiếu “Chờ linh kiện” để giữ vững cam kết thời
                    gian xử lý.
                  </p>
                </div>
                <button onClick={() => notify("Đã mở báo cáo phân tích")}>
                  Xem phân tích <Icon name="arrow" size={17} />
                </button>
              </section>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Tạo phiếu bảo hành mới"
        >
          <button
            className="modal-backdrop"
            onClick={() => setShowModal(false)}
            aria-label="Đóng"
          />
          <form
            className="modal"
            onSubmit={(event) => {
              event.preventDefault()
              setShowModal(false)
              notify("Tạo phiếu bảo hành thành công")
            }}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Phiếu bảo hành</span>
                <h2>Tạo yêu cầu mới</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <label>
              Khách hàng
              <input required placeholder="Nhập tên khách hàng" />
            </label>
            <label>
              Số sê-ri sản phẩm
              <input required placeholder="Ví dụ: MBA-M3-8249" />
            </label>
            <label>
              Mô tả sự cố
              <textarea
                required
                placeholder="Mô tả tình trạng sản phẩm..."
                rows={4}
              />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="primary-button" type="submit">
                Tạo phiếu <Icon name="arrow" size={17} />
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span>
            <Icon name="check" size={16} />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  icon,
  tone,
  data,
}: {
  label: string
  value: string
  change: string
  icon: IconName
  tone: string
  data: number[]
}) {
  const points = data
    .map((number, index) => `${index * 23},${80 - number}`)
    .join(" ")
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}>
          <Icon name={icon} />
        </span>
        <span className={`change ${tone}`}>{change}</span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <svg
        className={`sparkline ${tone}`}
        viewBox="0 0 138 70"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`fill-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,70 ${points} 138,70`} fill={`url(#fill-${tone})`} />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </article>
  )
}

function Lookup({
  query,
  setQuery,
  notify,
}: {
  query: string
  setQuery: (value: string) => void
  notify: (message: string) => void
}) {
  const [searched, setSearched] = useState(false)
  return (
    <section className="lookup-card">
      <div className="lookup-visual">
        <div>
          <Icon name="shield" size={34} />
        </div>
        <span className="ring one" />
        <span className="ring two" />
      </div>
      <span className="eyebrow">Tra cứu nhanh & chính xác</span>
      <h2>Kiểm tra quyền lợi bảo hành</h2>
      <p>Nhập số sê-ri sản phẩm để truy xuất thông tin trong vài giây.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSearched(true)
          notify("Đã tìm thấy sản phẩm")
        }}
      >
        <Icon name="search" />
        <input
          required
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nhập số sê-ri, ví dụ MBA-M3-8249"
        />
        <button className="primary-button">
          Tra cứu <Icon name="arrow" size={17} />
        </button>
      </form>
      {searched && (
        <div className="lookup-result">
          <span className="activity-icon green">
            <Icon name="check" />
          </span>
          <div>
            <span className="eyebrow">Bảo hành còn hiệu lực</span>
            <h3>MacBook Air M3 · màn hình 13,6″</h3>
            <p>Số sê-ri: {query} · Còn 287 ngày bảo hành chính hãng</p>
          </div>
          <span className="status green">
            <i />
            Đang hoạt động
          </span>
        </div>
      )}
      <small>
        Thông tin được mã hóa và bảo mật theo tiêu chuẩn doanh nghiệp.
      </small>
    </section>
  )
}
