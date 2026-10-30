/**
 * DataTable — bảng dữ liệu chuẩn của BảoHành Pro.
 *
 * Chuẩn hoá 3 thứ:
 *   1. Sticky header — theo khi cuộn dọc, tiêu đề cột luôn nhìn thấy.
 *   2. Responsive — cuộn ngang trên màn hình hẹp thay vì vỡ layout;
 *      bảng có `minWidth` để không bó chữ.
 *   3. Token màu — dùng biến CSS nên tự đổi theo light/dark mode.
 *
 * Props:
 *   columns: [{ key, header, className, cellClassName, render(row, index) }]
 *   rows: mảng dữ liệu
 *   loading: hiển thị skeleton
 *   empty: { icon, title, description, action } — hiển thị khi không có dữ liệu
 *   onRowClick(row): bấm vào hàng
 *   minWidth: px tối thiểu (mặc định 720)
 *   maxHeight: giới hạn chiều cao + sticky (ví dụ '60vh')
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  empty = null,
  onRowClick = null,
  minWidth = 720,
  maxHeight = null,
  skeletonRows = 5,
  className = '',
}) {
  const showEmpty = !loading && rows.length === 0

  return (
    <div className={className}>
      {/* Vùng cuộn: ngang (mobile) + dọc (sticky header) */}
      <div
        className="overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap ${col.className || ''}`}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div
                        className="h-4 rounded animate-pulse"
                        style={{ background: 'var(--bg-hover)', width: `${50 + ((i * 13 + col.key.length * 7) % 40)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {!loading && rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className="transition-colors"
                style={{
                  borderTop: '1px solid var(--border-light)',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 align-middle ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trạng thái rỗng */}
      {showEmpty && empty && (
        <div className="py-14 px-4 text-center">
          {empty.icon && <div className="text-4xl mb-3">{empty.icon}</div>}
          {empty.title && (
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {empty.title}
            </p>
          )}
          {empty.description && (
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {empty.description}
            </p>
          )}
          {empty.action}
        </div>
      )}
    </div>
  )
}
