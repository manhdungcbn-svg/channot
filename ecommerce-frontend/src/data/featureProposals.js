/**
 * Danh sách tính năng đề xuất — hiển thị dưới dạng grid card ở trang `/coming-soon`.
 *
 * @typedef {object} FeatureProposal
 * @property {string} slug
 * @property {string} name
 * @property {string} description
 * @property {string} icon - tên icon nội bộ (map sang `components/icons`)
 * @property {'planning'|'in_progress'|'coming_soon'} status
 * @property {string} eta
 * @property {'high'|'medium'|'low'} priority
 * @property {string} route
 */

/** @type {FeatureProposal[]} */
export const featureProposals = [
  {
    slug: 'so-sanh-san-pham',
    name: 'So sánh sản phẩm side-by-side',
    description:
      'Chọn tối đa 4 sản phẩm để so sánh cạnh nhau: giá, công suất, tiết kiệm điện, thời gian bảo hành và đánh giá của người dùng.',
    icon: 'compare',
    status: 'in_progress',
    eta: '2 tuần',
    priority: 'high',
    route: '/coming-soon?feature=so-sanh-san-pham',
  },
  {
    slug: 'dat-lich-bao-hanh-tai-nha',
    name: 'Đặt lịch bảo hành tại nhà',
    description:
      'Khách hàng chọn khung giờ ưu tiên, kỹ thuật viên đến tận nơi kiểm tra và sửa chữa. Theo dõi trạng thái lịch hẹn trực tiếp trên web.',
    icon: 'calendar',
    status: 'planning',
    eta: '4 tuần',
    priority: 'high',
    route: '/coming-soon?feature=dat-lich-bao-hanh-tai-nha',
  },
  {
    slug: 'theo-doi-don-hang-realtime',
    name: 'Theo dõi đơn hàng realtime',
    description:
      'Mỗi đơn hàng có mã theo dõi, cập nhật trạng thái giao hàng theo thời gian thực kèm vị trí tài xế trên bản đồ.',
    icon: 'truck',
    status: 'planning',
    eta: '3 tuần',
    priority: 'high',
    route: '/coming-soon?feature=theo-doi-don-hang-realtime',
  },
  {
    slug: 'vi-diem-thuong',
    name: 'Ví điểm thưởng',
    description:
      'Tích điểm khi mua hàng, đổi điểm thành phiếu giảm giá, quà tặng hoặc dịch vụ mở rộng thời gian bảo hành.',
    icon: 'gift',
    status: 'planning',
    eta: '5 tuần',
    priority: 'medium',
    route: '/coming-soon?feature=vi-diem-thuong',
  },
  {
    slug: 'cai-dat-tra-gop-0-online',
    name: 'Cài đặt trả góp 0% online',
    description:
      'Chọn kỳ hạn 3/6/9/12 tháng ngay trên trang sản phẩm, xem số tiền trả hằng kỳ và đơn vị tài chính phù hợp.',
    icon: 'creditcard',
    status: 'in_progress',
    eta: '1 tuần',
    priority: 'high',
    route: '/coming-soon?feature=cai-dat-tra-gop-0-online',
  },
  {
    slug: 'danh-gia-co-anh-video',
    name: 'Đánh giá sản phẩm có ảnh/video',
    description:
      'Khách hàng đã mua hàng đánh giá kèm ảnh thực tế và video ngắn, giúp người mua mới ra quyết định chính xác hơn.',
    icon: 'star',
    status: 'planning',
    eta: '3 tuần',
    priority: 'medium',
    route: '/coming-soon?feature=danh-gia-co-anh-video',
  },
  {
    slug: 'loc-so-sanh-tiet-kiem-dien',
    name: 'Bộ lọc so sánh nâng cao (tiết kiệm điện)',
    description:
      'Lọc và xếp hạng sản phẩm theo chỉ số tiết kiệm điện, tuổi thọ linh kiện và tổng chi phí sở hữu trong 5 năm.',
    icon: 'leaf',
    status: 'planning',
    eta: '4 tuần',
    priority: 'medium',
    route: '/coming-soon?feature=loc-so-sanh-tiet-kiem-dien',
  },
  {
    slug: 'tra-gop-khong-can-the-tin-dung',
    name: 'Trả góp 0% không cần thẻ tín dụng',
    description:
      'Hỗ trợ trả góp qua ví điện tử và công ty tài chính, không yêu cầu thẻ tín dụng — phù hợp khách hàng mới.',
    icon: 'wallet',
    status: 'planning',
    eta: '6 tuần',
    priority: 'low',
    route: '/coming-soon?feature=tra-gop-khong-can-the-tin-dung',
  },
  {
    slug: 'tro-ly-tra-cuu-bao-hanh-tuc-thi',
    name: 'Trợ lý ảo tra cứu bảo hành tức thì',
    description:
      'Trợ lý ảo nhận mã serial và trả lời ngay thời hạn bảo hành, chính sách áp dụng và hướng dẫn tạo phiếu bảo hành.',
    icon: 'headset',
    status: 'in_progress',
    eta: '1 tuần',
    priority: 'high',
    route: '/coming-soon?feature=tro-ly-tra-cuu-bao-hanh-tuc-thi',
  },
  {
    slug: 'he-sinh-thai-bao-hanh-mo-rong',
    name: 'Hệ sinh thái bảo hành mở rộng',
    description:
      'Mở rộng mạng lưới bảo hành tới các thương hiệu điện tử khác, dùng chung hệ thống phiếu và tra cứu trên toàn hệ sinh thái.',
    icon: 'shield',
    status: 'planning',
    eta: '8 tuần',
    priority: 'low',
    route: '/coming-soon?feature=he-sinh-thai-bao-hanh-mo-rong',
  },
];

export const FEATURE_STATUS_LABELS = {
  planning: 'Đang lên kế hoạch',
  in_progress: 'Đang phát triển',
  coming_soon: 'Sắp ra mắt',
};

export const FEATURE_PRIORITY_LABELS = {
  high: 'Ưu tiên cao',
  medium: 'Ưu tiên trung bình',
  low: 'Ưu tiên thấp',
};

export default featureProposals;
