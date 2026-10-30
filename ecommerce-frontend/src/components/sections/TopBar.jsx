import { Fire, Truck } from '../icons';

/**
 * Thanh khuyến mãi chạy ngay trên header (marquee).
 * Nội dung được lặp 2 lần để tạo hiệu ứng cuộn liên tục.
 */
const PROMOTIONS = [
  { icon: <Fire className="h-4 w-4" />, text: 'Flash sale cuối tuần — giảm tới 50% tất cả mặt hẩm' },
  { icon: <Truck className="h-4 w-4" />, text: 'Miễn phí vận chuyển cho đơn hàng từ 500.000 ₫' },
  { icon: <Fire className="h-4 w-4" />, text: 'Trả góp 0% tháng đầu tiên cho thẻ tín dụng' },
  { icon: <Truck className="h-4 w-4" />, text: 'Đổi trả 30 ngày không cần lý do' },
];

/**
 * @param {object} props
 * @param {string} [props.className]
 */
export function TopBar({ className }) {
  const items = [...PROMOTIONS, ...PROMOTIONS];

  return (
    <div className={`overflow-hidden bg-flash-500 text-white ${className ?? ''}`}>
      <div className="marquee-track" aria-hidden="false">
        {items.map((item, index) => (
          <span
            key={index}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-6 py-2 text-xs font-medium"
          >
            {item.icon}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TopBar;