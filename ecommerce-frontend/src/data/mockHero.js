import { createProductImage } from './createProductImage';

/**
 * Dữ liệu mock cho Hero (4 slide) và quick-intent chips.
 * Ảnh dùng SVG data-URI nội bộ nên hoạt động khi không có mạng.
 */

/**
 * @typedef {object} HeroSlide
 * @property {string} eyebrow
 * @property {string} title
 * @property {string} highlightWord
 * @property {string} description
 * @property {{label: string, href: string}} primaryCta
 * @property {{label: string, href: string}} secondaryCta
 * @property {string} image
 * @property {{value: string, label: string, tone?: 'success'|'warning'|'info'|'flash'}} badge
 * @property {string} alt
 */

/** @type {HeroSlide[]} */
export const heroSlides = [
  {
    eyebrow: 'Flash sale cuối tuần',
    title: 'Tivi 4K QLED siêu nét, giảm tới 2 triệu',
    highlightWord: 'siêu nét',
    description:
      'Tivi 4K QLED 65 inch cho màu sắc chuẩn điện ảnh, âm thanh Dolby Atmos. Trả góp 0% cho đơn từ 3 triệu.',
    primaryCta: { label: 'Mua ngay', href: '/search?q=tivi+4k+qled' },
    secondaryCta: { label: 'Xem tất cả', href: '/products' },
    image: createProductImage('Tivi 4K QLED', { from: '#EEF2FF', to: '#FFFFFF' }),
    badge: { value: '-2.000.000 ₫', label: 'Tiết kiệm lớn nhất', tone: 'flash' },
    alt: 'Tivi 4K QLED 65 inch đặt trên kệ gỗ hiện đại',
  },
  {
    eyebrow: 'Lọc nước tại nhà',
    title: 'Máy lọc nước RO, uống trực tiếp lạnh',
    highlightWord: 'RO',
    description:
      'Bộ lọc 3 lớp loại bỏ 99% clo, đường và kim loại nặng, giữ nguyên khoáng chất cho gia đình.',
    primaryCta: { label: 'Mua ngay', href: '/search?q=máy+lọc+nước+ro' },
    secondaryCta: { label: 'Xem tất cả', href: '/products' },
    image: createProductImage('Máy lọc nước', { from: '#F0FDF4', to: '#FFFFFF', accent: '#10B981' }),
    badge: { value: 'Trả góp 0%', label: 'Trong 12 tháng', tone: 'success' },
    alt: 'Máy lọc nước RO gắn tường nhà bếp hiện đại',
  },
  {
    eyebrow: 'Mua sắm cuối năm',
    title: 'Quạt thông minh điều khiển qua điện thoại',
    highlightWord: 'thông minh',
    description:
      'Quạt cây 3D gió thoải, cảm biến nhiệt độ và hẹn giờ tự động giúp tối ưu điện năng tiêu thụ.',
    primaryCta: { label: 'Mua ngay', href: '/search?q=quạt+thông+minh' },
    secondaryCta: { label: 'Xem tất cả', href: '/products' },
    image: createProductImage('Quạt thông minh', { from: '#FFF7ED', to: '#FFFFFF', accent: '#F97316' }),
    badge: { value: 'Tặng kèm', label: 'Điều khiển hồng ngoại', tone: 'warning' },
    alt: 'Quạt cây thông minh màu trắng đặt trong phòng khách',
  },
  {
    eyebrow: 'Bền bỉ cho gia đình',
    title: 'Tủ lạnh inverter, tiết kiệm điện 30%',
    highlightWord: 'inverter',
    description:
      'Tủ lạnh 2 cửa công suất inverter, cấp đông nhanh 8 phút và bảo hành máy nén 10 năm.',
    primaryCta: { label: 'Mua ngay', href: '/search?q=tủ+lạnh+inverter' },
    secondaryCta: { label: 'Xem tất cả', href: '/products' },
    image: createProductImage('Tủ lạnh inverter', { from: '#DBEAFE', to: '#FFFFFF', accent: '#3B82F6' }),
    badge: { value: 'Bảo hành 10 năm', label: 'Máy nén', tone: 'info' },
    alt: 'Tủ lạnh inverter hai cửa màu xám bạc đặt trong bếp',
  },
];

/**
 * Quick-intent chips dẫn tới trang tìm kiếm.
 * @type {{id: string, label: string, query: string}[]}
 */
export const heroQuickChips = [
  { id: 'chip-tivi', label: 'Tivi cho phòng khách', query: 'Tivi cho phòng khách' },
  { id: 'chip-loc-nuoc', label: 'Máy lọc nước', query: 'Máy lọc nước' },
  { id: 'chip-quat', label: 'Quạt thông minh', query: 'Quạt thông minh' },
  { id: 'chip-tu-lanh', label: 'Tủ lạnh inverter', query: 'Tủ lạnh inverter' },
  { id: 'chip-loa', label: 'Loa Bluetooth', query: 'Loa Bluetooth' },
  { id: 'chip-may-lanh', label: 'Máy lạnh inverter', query: 'Máy lạnh inverter' },
];

export default heroSlides;
