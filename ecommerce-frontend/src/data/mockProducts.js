import { createProductImage } from './createProductImage';

/**
 * Dữ liệu mock sản phẩm — dùng làm fallback khi backend chưa sẵn sàng.
 * Shape nội bộ dùng camelCase, khớp với `normalizeProduct()` trong `src/api/shop.js`.
 */

/**
 * @typedef {object} ShopProduct
 * @property {number|string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} brand
 * @property {string} category
 * @property {string} categorySlug
 * @property {number} price
 * @property {number|null} originalPrice
 * @property {number} discountPercent
 * @property {number} rating
 * @property {number} reviewCount
 * @property {number} sold
 * @property {string} image
 * @property {string[]} attributes
 * @property {number} warrantyMonths
 * @property {string} warranty
 * @property {number} stock
 * @property {'available'|'low_stock'|'out_of_stock'} status
 * @property {{label: string, tone: string}|null} badge
 * @property {number|null} installmentMonthly
 * @property {number} installmentMonths
 * @property {string} description
 * @property {Record<string,string>} specs
 */

/**
 * @typedef {object} ShopCategory
 * @property {string} slug
 * @property {string} name
 * @property {string} icon
 * @property {number} count
 * @property {string|null} image_url
 */

/** Trả góp 12 kỳ — làm tròn xuống. */
const installment = (price) => Math.floor(price / 12);

/** @type {ShopProduct[]} */
export const mockProducts = [
  {
    id: 12,
    slug: 'tivi-qled-4k-55-inch',
    name: 'Tivi QLED 4K 55 inch Smart TV chính hành',
    brand: 'Samsung',
    category: 'Tivi & Âm thanh',
    categorySlug: 'tivi',
    price: 12990000,
    originalPrice: 15490000,
    rating: 4.7,
    reviewCount: 128,
    sold: 2340,
    image: createProductImage('Tivi QLED 4K', { from: '#EEF2FF', to: '#FFFFFF' }),
    attributes: ['4K QLED', 'Dolby Vision', 'Smart TV'],
    warrantyMonths: 24,
    warranty: 'Bảo hành 24 tháng',
    stock: 12,
    status: 'available',
    badge: { label: 'Giảm 16%', tone: 'flash' },
    description:
      'Tivi QLED 4K 55 inch với bảng điện tử Quantum Dot cho màu sắc chuẩn điện ảnh, hỗ trợ Dolby Vision và âm thanh 2.1 chân thực. Hệ điều hành Tizen thân thiện, điều khiển bằng giọng nói tiếng Việt.',
    specs: {
      'Kích thước': '55 inch',
      'Độ phân giải': '3840 x 2160',
      'Tần số quét': '120Hz',
      'Công suất': '130W',
      'Cổng kết nối': 'HDMI x4, USB x2, LAN, Wifi',
      'Hệ điều hành': 'Tizen',
    },
  },
  {
    id: 3,
    slug: 'may-loc-nuoc-ro-15l-h',
    name: 'Máy lọc nước RO công suất 15L/h không vôi',
    brand: 'Kangaroo',
    category: 'Máy lọc nước',
    categorySlug: 'loc-nuoc',
    price: 8490000,
    originalPrice: 9990000,
    rating: 4.6,
    reviewCount: 94,
    sold: 1870,
    image: createProductImage('Máy lọc nước RO', { from: '#F0FDF4', to: '#FFFFFF', accent: '#10B981' }),
    attributes: ['RO', '3 lõi lọc', 'Lọc 2.5L'],
    warrantyMonths: 36,
    warranty: 'Bảo hành 36 tháng',
    stock: 24,
    status: 'available',
    badge: { label: 'Bán chạy', tone: 'danger' },
    description:
      'Máy lọc nước RO 3 lõi công suất 15L/h, loại bỏ 99% clo, đường và kim loại nặng, giữ nguyên khoáng chất có lợi. Bình chứa 15L tiện lợi, cảnh báo thay lõi thông minh.',
    specs: {
      'Công suất': '15L/h',
      'Lõi lọc': 'PP - Carbon - RO',
      'Bình chứa': '15L',
      'Nguồn điện': '220V / 50Hz',
      'Kích thước': '420 x 320 x 450 mm',
      'Bảo hành': '36 tháng',
    },
  },
  {
    id: 7,
    slug: 'quat-thong-minh-3d-gio',
    name: 'Quạt thông minh 3D gió thoải điều khiển qua app',
    brand: 'Sunco',
    category: 'Quạt & làm mát',
    categorySlug: 'quat',
    price: 3290000,
    originalPrice: 4290000,
    rating: 4.4,
    reviewCount: 61,
    sold: 5620,
    image: createProductImage('Quạt thông minh', { from: '#FFF7ED', to: '#FFFFFF', accent: '#F97316' }),
    attributes: ['3D gió', 'Điều khiển app', '30W'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 60,
    status: 'available',
    badge: { label: 'Hot', tone: 'warning' },
    description:
      'Quạt cây 3D gió tỏa trên diện rộng 12m, cảm biến nhiệt độ và độ ẩm giúp tự điều chỉnh tốc độ. Hẹn giờ, điều khiển qua app và hỗ trợ Amazon Alexa.',
    specs: {
      'Công suất': '30W',
      'Đường kính quạt': '320 mm',
      'Tốc độ': '8 mức',
      'Tính năng': '3D gió, cảm biến nhiệt độ',
      'Điều khiển': 'App / Alexa',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 18,
    slug: 'tu-lanh-inverter-2-cua-356l',
    name: 'Tủ lạnh inverter 2 cửa 356L cấp đông nhanh',
    brand: 'LG',
    category: 'Tủ lạnh',
    categorySlug: 'tu-lanh',
    price: 18590000,
    originalPrice: 21500000,
    rating: 4.8,
    reviewCount: 76,
    sold: 940,
    image: createProductImage('Tủ lạnh inverter', { from: '#DBEAFE', to: '#FFFFFF', accent: '#3B82F6' }),
    attributes: ['Inverter', '356L', 'Bảo hành 10 năm'],
    warrantyMonths: 24,
    warranty: 'Bảo hành máy nén 10 năm',
    stock: 8,
    status: 'low_stock',
    badge: { label: 'Mới', tone: 'info' },
    description:
      'Tủ lạnh inverter 2 cửa dung tích 356L, tiết kiệm điện 30% so với máy nén thông thường. Cấp đông nhanh 8 phút, ngăn chuyển đông mềm giữ thực phẩm tươi.',
    specs: {
      'Dung tích': '356L',
      'Cấp đông': '8 phút',
      'Công suất': '0.19kWh/ngày',
      'Tủ lạnh': '2 cửa',
      'Tiện ích': 'Ngăn chuyển đông mềm',
      'Bảo hành': '24 tháng, máy nén 10 năm',
    },
  },
  {
    id: 21,
    slug: 'loa-bluetooth-di-dong-40w',
    name: 'Loa Bluetooth di động 40W chống nước IPX7',
    brand: 'JBL',
    category: 'Tivi & Âm thanh',
    categorySlug: 'tivi',
    price: 2190000,
    originalPrice: 2990000,
    rating: 4.5,
    reviewCount: 210,
    sold: 3120,
    image: createProductImage('Loa Bluetooth', { from: '#F5F3FF', to: '#FFFFFF', accent: '#7C3AED' }),
    attributes: ['40W', 'IPX7', '24h pin'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 45,
    status: 'available',
    badge: { label: 'Free ship', tone: 'success' },
    description:
      'Loa Bluetooth di động công suất 40W, chống nước IPX7 nên an tâm khi đi biển. Pin 24 giờ, ghép nối nhanh và âm bass sâu ấn tượng so với thể loại.',
    specs: {
      'Công suất': '40W',
      'Chống nước': 'IPX7',
      'Pin': '24 giờ',
      'Kết nối': 'Bluetooth 5.3',
      'Kích thước': '220 x 90 x 90 mm',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 15,
    slug: 'may-lanh-inverter-2-chieu-12000-btu',
    name: 'Máy lạnh inverter 2 chiều 12000 BTU phòng 20m2',
    brand: 'Daikin',
    category: 'Máy lạnh',
    categorySlug: 'may-lanh',
    price: 16990000,
    originalPrice: 19500000,
    rating: 4.7,
    reviewCount: 88,
    sold: 1180,
    image: createProductImage('Máy lạnh inverter', { from: '#ECFEFF', to: '#FFFFFF', accent: '#0891B2' }),
    attributes: ['2 chiều', '12000 BTU', 'Inverter'],
    warrantyMonths: 24,
    warranty: 'Bảo hành 24 tháng',
    stock: 15,
    status: 'available',
    badge: { label: 'Trả góp 0%', tone: 'brand' },
    description:
      'Máy lạnh inverter 2 chiều 12000 BTU làm mát phòng 20m2 nhanh chóng, vận hành êm ở 19dB. Công nghệ lọc khí 3 lớp khử mùi, chống ẩm và làm sạch không khí.',
    specs: {
      'Công suất': '12000 BTU',
      'Loại': '2 chiều',
      'Phòng tối đa': '20 m2',
      'Độ ồn': '19 dB',
      'Điện năng tiêu thụ': '1.150W',
      'Bảo hành': '24 tháng',
    },
  },
  {
    id: 9,
    slug: 'robot-hut-bui-lau-san-tu-dong',
    name: 'Robot hút bụi lau sàn tự động, điều khiển qua app',
    brand: 'Xiaomi',
    category: 'Điện gia dụng',
    categorySlug: 'gia-dung',
    price: 6990000,
    originalPrice: 8990000,
    rating: 4.3,
    reviewCount: 142,
    sold: 760,
    image: createProductImage('Robot hút bụi', { from: '#F8FAFC', to: '#FFFFFF', accent: '#475569' }),
    attributes: ['Lidar', 'Lau sàn', '6000Pa'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 18,
    status: 'available',
    badge: null,
    description:
      'Robot hút bụi lau sàn 2 trong 1 với cảm biến Lidar, lực hút 6000Pa và bản đồ 3D. Lưu trữ bản đồ nhiều tầng, tự xả thùng rác tại dock.',
    specs: {
      'Lực hút': '6000Pa',
      'Dung tích pin': '2600mAh',
      'Cảm biến': 'Lidar + ToF',
      'Chế độ': 'Hút, lau, hút & lau',
      'Ứng dụng': 'Mi Home',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 26,
    slug: 'noi-chien-khong-dau-5-5l',
    name: 'Nồi chiên không dầu 5.5L nồi điện đa năng',
    brand: 'Midea',
    category: 'Điện gia dụng',
    categorySlug: 'gia-dung',
    price: 1590000,
    originalPrice: 2290000,
    rating: 4.6,
    reviewCount: 320,
    sold: 8940,
    image: createProductImage('Nồi chiên không dầu', { from: '#FFF1F2', to: '#FFFFFF', accent: '#E11D48' }),
    attributes: ['5.5L', '1600W', '12 chế độ'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 90,
    status: 'available',
    badge: { label: 'Bán chạy', tone: 'danger' },
    description:
      'Nồi chiên không dầu 5.5L giảm tới 85% lượng dầu, 12 chế độ nấu sẵn cho món gà, cá, nướng và làm bánh. Màn hình cảm ứng dễ dùng, vệ sinh bằng máy rửa bát.',
    specs: {
      'Dung tích': '5.5L',
      'Công suất': '1600W',
      'Chế độ': '12 chế độ',
      'Vật liệu': 'Inox 304',
      'Điều khiển': 'Cảm ứng',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 31,
    slug: 'bep-dien-tu-am-gam-30cm',
    name: 'Bếp điện từ âm gắn âm 30cm 3 vùng nấu',
    brand: 'Midea',
    category: 'Bếp điện',
    categorySlug: 'bep-dien',
    price: 5290000,
    originalPrice: 6490000,
    rating: 4.4,
    reviewCount: 57,
    sold: 520,
    image: createProductImage('Bếp điện từ âm', { from: '#FEF2F2', to: '#FFFFFF', accent: '#DC2626' }),
    attributes: ['3 vùng nấu', 'Cảm ứng', 'Kính Vitro'],
    warrantyMonths: 24,
    warranty: 'Bảo hành 24 tháng',
    stock: 11,
    status: 'low_stock',
    badge: { label: 'Mới', tone: 'info' },
    description:
      'Bếp điện từ âm gắn âm 30cm với 3 vùng nấu, mặt kính Vitro chịu nhiệt cao và bộ nhận diện nồi thông minh. Có hẹn giờ và khóa trẻ em an toàn.',
    specs: {
      'Kích thước': '730 x 430 mm',
      'Vùng nấu': '3 vùng',
      'Mặt kính': 'Vitroceramic',
      'Tổng công suất': '6600W',
      'Tính năng': 'Hẹn giờ, khóa trẻ em',
      'Bảo hành': '24 tháng',
    },
  },
  {
    id: 34,
    slug: 'may-giat-inverter-10kg',
    name: 'Máy giặt inverter 10kg cửa trên bảo hành 10 năm',
    brand: 'Panasonic',
    category: 'Máy giặt',
    categorySlug: 'may-giat',
    price: 12490000,
    originalPrice: 14990000,
    rating: 4.7,
    reviewCount: 63,
    sold: 410,
    image: createProductImage('Máy giặt inverter', { from: '#EFF6FF', to: '#FFFFFF', accent: '#2563EB' }),
    attributes: ['10kg', 'Inverter', 'Motor Direct Drive'],
    warrantyMonths: 24,
    warranty: 'Bảo hành 24 tháng',
    stock: 9,
    status: 'low_stock',
    badge: { label: 'Bán chạy', tone: 'danger' },
    description:
      'Máy giặt inverter 10kg cửa trên với động cơ Direct Drive bền bỉ, tiết kiệm nước và điện. Có 15 chương trình giặt tự động cảm biến lượng đồ.',
    specs: {
      'Tải trọng': '10kg',
      'Tốc độ vòng quay': '1200 vòng/phút',
      'Động cơ': 'Direct Drive Inverter',
      'Số chương trình': '15',
      'Tiêu thụ nước': '165L/chu kỳ',
      'Bảo hành': '24 tháng, motor 10 năm',
    },
  },
  {
    id: 38,
    slug: 'den-thong-minh-choi-sang',
    name: 'Đèn thông minh điều khiển qua app, hỗ trợ Alexa',
    brand: 'Sunco',
    category: 'Phụ kiện & thiết bị thông minh',
    categorySlug: 'phu-kien',
    price: 449000,
    originalPrice: 690000,
    rating: 4.2,
    reviewCount: 156,
    sold: 6200,
    image: createProductImage('Đèn thông minh', { from: '#FEFCE8', to: '#FFFFFF', accent: '#CA8A04' }),
    attributes: ['16 triệu màu', 'Alexa', 'Hẹn giờ'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 140,
    status: 'available',
    badge: { label: 'Free ship', tone: 'success' },
    description:
      'Đèn thông minh RGB 16 triệu màu, điều khiển qua app hoặc giọng nói Alexa. Hẹn giờ tự động, nhớ lần sử dụng cuối và hỗ trợ nhóm nhiều bóng đèn.',
    specs: {
      'Công suất': '9W',
      'Màu sắc': '16 triệu màu RGB',
      'Kết nối': 'Wifi 2.4GHz',
      'Điều khiển': 'App / Alexa / Google',
      'Đầu vào': '220V',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 41,
    slug: 'loa-soundbar-300w-2-1',
    name: 'Loa soundbar 300W 2.1 kênh, đồng bộ không dây',
    brand: 'LG',
    category: 'Tivi & Âm thanh',
    categorySlug: 'tivi',
    price: 3990000,
    originalPrice: 4990000,
    rating: 4.5,
    reviewCount: 47,
    sold: 640,
    image: createProductImage('Loa soundbar', { from: '#F5F3FF', to: '#FFFFFF', accent: '#6D28D9' }),
    attributes: ['300W', '2.1 kênh', 'Dolby Atmos'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 21,
    status: 'available',
    badge: { label: 'Trả góp 0%', tone: 'brand' },
    description:
      'Loa soundbar 300W 2.1 kênh với subwoofer không dây 150W, hỗ trợ Dolby Atmos cho âm thanh vòm sống động. Kết nối HDMI eARC, Bluetooth và USB.',
    specs: {
      'Công suất': '300W',
      'Kênh': '2.1',
      'Cổng kết nối': 'HDMI eARC, Optical, Bluetooth, USB',
      'Tính năng': 'Dolby Atmos',
      'Kích thước': '950 x 70 x 120 mm',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 45,
    slug: 'may-loc-khong-khi-cho-phong-50m2',
    name: 'Máy lọc không khí cho phòng 50m2, cảm biến bụi PM2.5',
    brand: 'Xiaomi',
    category: 'Máy lọc nước & không khí',
    categorySlug: 'loc-nuoc',
    price: 5990000,
    originalPrice: 7490000,
    rating: 4.6,
    reviewCount: 85,
    sold: 890,
    image: createProductImage('Máy lọc không khí', { from: '#F0FDFA', to: '#FFFFFF', accent: '#0D9488' }),
    attributes: ['50m2', 'HEPA H13', 'Cảm biến PM2.5'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 19,
    status: 'available',
    badge: null,
    description:
      'Máy lọc không khí CADR 500m3/h phủ 50m2, lọc chuẩn HEPA H13 kết hợp than hoạt tính. Màn hình hiển thị chất lượng không khí theo thời gian thực, điều khiển qua app.',
    specs: {
      'CADR': '500 m3/h',
      'Diện tích': '50 m2',
      'Bộ lọc': 'HEPA H13 + than hoạt tính',
      'Cảm biến': 'PM2.5, VOC',
      'Chế độ': '3 mức, tự động',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 49,
    slug: 'quat-dung-stand-dieu-khien-app',
    name: 'Quạt đứng stand 60W điều khiển qua app, pin sạc',
    brand: 'Sunco',
    category: 'Quạt & làm mát',
    categorySlug: 'quat',
    price: 1890000,
    originalPrice: 2490000,
    rating: 4.4,
    reviewCount: 112,
    sold: 2100,
    image: createProductImage('Quạt đứng stand', { from: '#FFF7ED', to: '#FFFFFF', accent: '#EA580C' }),
    attributes: ['60W', 'Pin sạc', '3D gió'],
    warrantyMonths: 12,
    warranty: 'Bảo hành 12 tháng',
    stock: 36,
    status: 'available',
    badge: { label: 'Hot', tone: 'warning' },
    description:
      'Quạt đứng stand 60W với cửa gió 3D, mức gió 100 và chế độ im lặng 20dB cho lúc ngủ. Pin sạc dùng được 12 giờ, kèm remote và điều khiển qua app.',
    specs: {
      'Công suất': '60W',
      'Cánh quạt': '300mm',
      'Mức gió': '100 + chế độ im lặng',
      'Pin': 'Sạc, dùng 12 giờ',
      'Điều khiển': 'Remote / App',
      'Bảo hành': '12 tháng',
    },
  },
  {
    id: 52,
    slug: 'tu-lanh-side-by-side-601l',
    name: 'Tủ lạnh side by side 601L cấp đông siêu tốc',
    brand: 'Samsung',
    category: 'Tủ lạnh',
    categorySlug: 'tu-lanh',
    price: 27990000,
    originalPrice: 32990000,
    rating: 4.9,
    reviewCount: 38,
    sold: 320,
    image: createProductImage('Tủ lạnh side by side', { from: '#E0F2FE', to: '#FFFFFF', accent: '#0369A1' }),
    attributes: ['601L', 'Side by side', 'Cấp đông siêu tốc'],
    warrantyMonths: 24,
    warranty: 'Bảo hành 24 tháng',
    stock: 5,
    status: 'low_stock',
    badge: { label: 'Giảm 15%', tone: 'flash' },
    description:
      'Tủ lạnh side by side 601L với cấp đông siêu tốc 8 phút, ngăn rau quả giữ ẩm 90%. Bộ lọc than hoạt tính khử mùi, kết nối Wi-Fi điều khiển từ xa.',
    specs: {
      'Dung tích': '601L',
      'Loại': 'Side by side',
      'Cấp đông': 'Siêu tốc 8 phút',
      'Tính năng': 'Lọc than hoạt tính, Wi-Fi',
      'Nhiệt độ': '-18°C đến 8°C',
      'Bảo hành': '24 tháng',
    },
  },
  {
    id: 55,
    slug: 'binh-nong-lanh-50l',
    name: 'Bình nóng lạnh 50L tiết kiệm điện, an toàn chống giật điện',
    brand: 'Midea',
    category: 'Phụ kiện & thiết bị thông minh',
    categorySlug: 'phu-kien',
    price: 3490000,
    originalPrice: 4290000,
    rating: 4.3,
    reviewCount: 71,
    sold: 1450,
    image: createProductImage('Bình nóng lạnh', { from: '#EFF6FF', to: '#FFFFFF', accent: '#1D4ED8' }),
    attributes: ['50L', 'Inverter', 'Chống giật điện'],
    warrantyMonths: 24,
    warranty: 'Bảo hành 24 tháng',
    stock: 27,
    status: 'available',
    badge: { label: 'Mới', tone: 'info' },
    description:
      'Bình nóng lạnh 50L công nghệ inverter tiết kiệm 30% điện, giữ nóng 48 giờ sau khi cắt. Có chống giật điện kép và cảnh báo khi vỏ bình quá nóng.',
    specs: {
      'Dung tích': '50L',
      'Công suất': '2000W',
      'Công nghệ': 'Inverter tiết kiệm điện',
      'Thời gian giữ nóng': '48 giờ',
      'An toàn': 'Chống giật điện, cảm biến nhiệt',
      'Bảo hành': '24 tháng',
    },
  },
];

/**
 * Danh mục mock — dùng fallback khi endpoint `/shop/categories` lỗi.
 * @type {ShopCategory[]}
 */
export const mockCategories = [
  { slug: 'tivi', name: 'Tivi & Âm thanh', icon: 'tv', count: 3, image_url: null },
  { slug: 'loc-nuoc', name: 'Lọc nước & sạch', icon: 'water', count: 2, image_url: null },
  { slug: 'quat', name: 'Quạt & làm mát', icon: 'fan', count: 2, image_url: null },
  { slug: 'tu-lanh', name: 'Tủ lạnh', icon: 'fridge', count: 2, image_url: null },
  { slug: 'may-lanh', name: 'Máy lạnh', icon: 'ac', count: 1, image_url: null },
  { slug: 'gia-dung', name: 'Điện gia dụng', icon: 'home', count: 2, image_url: null },
  { slug: 'bep-dien', name: 'Bếp điện', icon: 'kitchen', count: 1, image_url: null },
  { slug: 'may-giat', name: 'Máy giặt', icon: 'washer', count: 1, image_url: null },
  { slug: 'phu-kien', name: 'Phụ kiện thông minh', icon: 'plug', count: 2, image_url: null },
];

/**
 * Bảng serial tra cứu bảo hành dùng cho fallback local.
 * @type {Record<string, object>}
 */
export const mockWarrantyRecords = {
  'TND-AC10-001': {
    found: true,
    serial: 'TND-AC10-001',
    product_name: 'Tivi QLED 4K 55 inch Smart TV chính hành',
    category: 'Tivi & Âm thanh',
    within_warranty: 'YES',
    warranty_end_date: '2028-08-15',
    warranty_months: 24,
    message: 'Sản phẩm còn bảo hành đến 15/08/2028.',
  },
  'TND-AC10-002': {
    found: true,
    serial: 'TND-AC10-002',
    product_name: 'Máy lọc nước RO công suất 15L/h không vôi',
    category: 'Máy lọc nước',
    within_warranty: 'YES',
    warranty_end_date: '2027-05-20',
    warranty_months: 36,
    message: 'Sản phẩm còn bảo hành đến 20/05/2027.',
  },
  'TND-AC10-003': {
    found: true,
    serial: 'TND-AC10-003',
    product_name: 'Quạt thông minh 3D gió thoải điều khiển qua app',
    category: 'Quạt & làm mát',
    within_warranty: 'NO',
    warranty_end_date: '2025-11-02',
    warranty_months: 12,
    message: 'Sản phẩm đã hết bảo hành ngày 02/11/2025.',
  },
};

export default mockProducts;
