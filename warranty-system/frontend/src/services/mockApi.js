/**
 * Mock API Service - Seed Data cho Demo
 * Sử dụng thay thế api.js khi backend không chạy
 */

// ============================================================================
// SEED DATA - Dữ liệu mẫu
// ============================================================================

export const SEED_DATA = {
  // User hiện tại
  currentUser: {
    id: 1,
    email: 'admin@warranty.vn',
    name: 'Administrator',
    role: 'admin',
    avatar: 'AD'
  },

  // Dashboard stats
  stats: {
    totalTickets: 156,
    pendingTickets: 46,
    completedTickets: 98,
    warrantyRate: 62,
    // So với tháng trước
    trends: {
      total: 12,      // +12%
      pending: -5,    // -5%
      completed: 18,  // +18%
      rate: 3        // +3%
    }
  },

  // Recent tickets
  recentTickets: [
    {
      id: 'WR-2026-0001',
      code: 'WR-2026-0001',
      serial: 'TND-AC10-001',
      product: 'Router Tenda AC10',
      customer: 'Nguyễn Văn Minh',
      status: 'received',
      statusText: 'Tiếp nhận',
      createdAt: '2026-10-17T08:30:00Z',
      warranty: 'Còn bảo hành',
      warrantyValid: true
    },
    {
      id: 'WR-2026-0002',
      code: 'WR-2026-0002',
      serial: 'CAM-HI3519-002',
      product: 'Camera Hikvision 5MP',
      customer: 'Trần Thị Lan',
      status: 'checking',
      statusText: 'Đang kiểm tra',
      createdAt: '2026-10-17T09:15:00Z',
      warranty: 'Còn bảo hành',
      warrantyValid: true
    },
    {
      id: 'WR-2026-0003',
      code: 'WR-2026-0003',
      serial: 'DELL-XPS-002',
      product: 'Laptop Dell XPS 15',
      customer: 'Lê Hoàng Nam',
      status: 'repairing',
      statusText: 'Đang sửa chữa',
      createdAt: '2026-10-16T14:20:00Z',
      warranty: 'Còn bảo hành',
      warrantyValid: true
    },
    {
      id: 'WR-2026-0004',
      code: 'WR-2026-0004',
      serial: 'SAM-55U-003',
      product: 'Smart TV Samsung 55"',
      customer: 'Phạm Thu Hà',
      status: 'completed',
      statusText: 'Hoàn thành',
      createdAt: '2026-10-15T10:00:00Z',
      warranty: 'Hết bảo hành',
      warrantyValid: false
    },
    {
      id: 'WR-2026-0005',
      code: 'WR-2026-0005',
      serial: 'LG-WM8-004',
      product: 'Máy giặt LG 8kg',
      customer: 'Hoàng Đức Anh',
      status: 'received',
      statusText: 'Tiếp nhận',
      createdAt: '2026-10-17T11:45:00Z',
      warranty: 'Còn bảo hành',
      warrantyValid: true
    }
  ],

  // Recent activities
  activities: [
    {
      id: 1,
      type: 'ticket_created',
      icon: '📋',
      title: 'Tạo phiếu mới',
      description: 'WR-2026-0005 - Máy giặt LG 8kg',
      time: '5 phút trước',
      user: 'Administrator'
    },
    {
      id: 2,
      type: 'ticket_updated',
      icon: '🔧',
      title: 'Cập nhật trạng thái',
      description: 'WR-2026-0003 - Đang sửa chữa',
      time: '15 phút trước',
      user: 'Kỹ thuật viên A'
    },
    {
      id: 3,
      type: 'ticket_completed',
      icon: '✅',
      title: 'Hoàn thành',
      description: 'WR-2026-0004 - Smart TV Samsung',
      time: '1 giờ trước',
      user: 'Kỹ thuật viên B'
    },
    {
      id: 4,
      type: 'product_added',
      icon: '📦',
      title: 'Thêm sản phẩm mới',
      description: 'Router Tenda AC10',
      time: '2 giờ trước',
      user: 'Administrator'
    },
    {
      id: 5,
      type: 'customer_added',
      icon: '👤',
      title: 'Thêm khách hàng',
      description: 'Nguyễn Văn Minh',
      time: '3 giờ trước',
      user: 'Staff'
    }
  ],

  // Products list
  products: [
    {
      id: 1,
      serial: 'TND-AC10-001',
      name: 'Router Tenda AC10',
      category: 'Network',
      purchaseDate: '2025-03-15',
      warrantyExpiry: '2027-03-15',
      warrantyMonths: 24,
      status: 'active',
      warrantyStatus: 'valid'
    },
    {
      id: 2,
      serial: 'CAM-HI3519-002',
      name: 'Camera Hikvision 5MP',
      category: 'Security',
      purchaseDate: '2025-06-20',
      warrantyExpiry: '2027-06-20',
      warrantyMonths: 24,
      status: 'active',
      warrantyStatus: 'valid'
    },
    {
      id: 3,
      serial: 'DELL-XPS-002',
      name: 'Laptop Dell XPS 15',
      category: 'Computer',
      purchaseDate: '2024-12-01',
      warrantyExpiry: '2026-12-01',
      warrantyMonths: 24,
      status: 'active',
      warrantyStatus: 'valid'
    },
    {
      id: 4,
      serial: 'SAM-55U-003',
      name: 'Smart TV Samsung 55"',
      category: 'Electronics',
      purchaseDate: '2023-08-10',
      warrantyExpiry: '2025-08-10',
      warrantyMonths: 24,
      status: 'active',
      warrantyStatus: 'expired'
    },
    {
      id: 5,
      serial: 'LG-WM8-004',
      name: 'Máy giặt LG 8kg',
      category: 'Appliance',
      purchaseDate: '2025-09-01',
      warrantyExpiry: '2027-09-01',
      warrantyMonths: 24,
      status: 'active',
      warrantyStatus: 'valid'
    },
    {
      id: 6,
      serial: 'APL-IP15-005',
      name: 'iPhone 15 Pro',
      category: 'Mobile',
      purchaseDate: '2026-01-15',
      warrantyExpiry: '2027-01-15',
      warrantyMonths: 12,
      status: 'active',
      warrantyStatus: 'valid'
    }
  ],

  // Customers list
  customers: [
    {
      id: 1,
      name: 'Nguyễn Văn Minh',
      email: 'minh.nguyen@email.com',
      phone: '0901234567',
      company: 'Công ty ABC',
      totalTickets: 3,
      registeredProducts: 2
    },
    {
      id: 2,
      name: 'Trần Thị Lan',
      email: 'lan.tran@email.com',
      phone: '0912345678',
      company: 'Công ty XYZ',
      totalTickets: 2,
      registeredProducts: 1
    },
    {
      id: 3,
      name: 'Lê Hoàng Nam',
      email: 'nam.le@email.com',
      phone: '0923456789',
      company: '',
      totalTickets: 1,
      registeredProducts: 1
    },
    {
      id: 4,
      name: 'Phạm Thu Hà',
      email: 'ha.pham@email.com',
      phone: '0934567890',
      company: 'Tập đoàn DEF',
      totalTickets: 4,
      registeredProducts: 3
    },
    {
      id: 5,
      name: 'Hoàng Đức Anh',
      email: 'anh.hoang@email.com',
      phone: '0945678901',
      company: '',
      totalTickets: 2,
      registeredProducts: 2
    }
  ],

  // Tickets all
  tickets: [
    {
      id: 'WR-2026-0001',
      code: 'WR-2026-0001',
      serial: 'TND-AC10-001',
      product: 'Router Tenda AC10',
      customer: 'Nguyễn Văn Minh',
      status: 'received',
      statusText: 'Tiếp nhận',
      issue: 'Router không kết nối được internet',
      createdAt: '2026-10-17T08:30:00Z',
      warranty: 'Còn bảo hành'
    },
    {
      id: 'WR-2026-0002',
      code: 'WR-2026-0002',
      serial: 'CAM-HI3519-002',
      product: 'Camera Hikvision 5MP',
      customer: 'Trần Thị Lan',
      status: 'checking',
      statusText: 'Đang kiểm tra',
      issue: 'Hình ảnh bị nhiễu vào ban đêm',
      createdAt: '2026-10-17T09:15:00Z',
      warranty: 'Còn bảo hành'
    },
    {
      id: 'WR-2026-0003',
      code: 'WR-2026-0003',
      serial: 'DELL-XPS-002',
      product: 'Laptop Dell XPS 15',
      customer: 'Lê Hoàng Nam',
      status: 'repairing',
      statusText: 'Đang sửa chữa',
      issue: 'Màn hình bị chớp, có vết sọc dọc',
      createdAt: '2026-10-16T14:20:00Z',
      warranty: 'Còn bảo hành'
    },
    {
      id: 'WR-2026-0004',
      code: 'WR-2026-0004',
      serial: 'SAM-55U-003',
      product: 'Smart TV Samsung 55"',
      customer: 'Phạm Thu Hà',
      status: 'completed',
      statusText: 'Hoàn thành',
      issue: 'Tivi không bật được, đèn power nhấp nháy',
      createdAt: '2026-10-15T10:00:00Z',
      warranty: 'Hết bảo hành'
    },
    {
      id: 'WR-2026-0005',
      code: 'WR-2026-0005',
      serial: 'LG-WM8-004',
      product: 'Máy giặt LG 8kg',
      customer: 'Hoàng Đức Anh',
      status: 'received',
      statusText: 'Tiếp nhận',
      issue: 'Máy kêu to khi vắt, rung mạnh',
      createdAt: '2026-10-17T11:45:00Z',
      warranty: 'Còn bảo hành'
    }
  ],

  // Quick stats for various pages
  quickStats: {
    totalProducts: 6,
    activeProducts: 5,
    expiredProducts: 1,
    totalCustomers: 5,
    newCustomersThisMonth: 2
  },

  // Wallet
  wallet: {
    balance: 2500000,
    currency: 'VND',
    transactions: [
      { id: 1, type: 'topup', amount: 3000000, description: 'Nạp tiền', date: '2026-10-15' },
      { id: 2, type: 'payment', amount: -500000, description: 'Thanh toán phí sửa chữa', date: '2026-10-16' },
      { id: 3, type: 'refund', amount: 200000, description: 'Hoàn tiền BH', date: '2026-10-17' }
    ]
  },

  // Chart data
  charts: {
    monthly: [
      { month: 'T1', tickets: 12, completed: 10 },
      { month: 'T2', tickets: 19, completed: 15 },
      { month: 'T3', tickets: 15, completed: 14 },
      { month: 'T4', tickets: 22, completed: 18 },
      { month: 'T5', tickets: 28, completed: 24 },
      { month: 'T6', tickets: 35, completed: 30 }
    ],
    byCategory: [
      { category: 'Network', count: 25 },
      { category: 'Electronics', count: 18 },
      { category: 'Appliance', count: 15 },
      { category: 'Computer', count: 12 },
      { category: 'Security', count: 10 }
    ]
  }
}

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

// Simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Format response như backend thật
const successResponse = (data) => ({
  success: true,
  data
})

const errorResponse = (message) => ({
  success: false,
  error: message
})

// Mock API calls
export const mockApi = {
  // Dashboard
  async getDashboard() {
    await delay(200)
    return successResponse({
      stats: SEED_DATA.stats,
      recentTickets: SEED_DATA.recentTickets,
      activities: SEED_DATA.activities
    })
  },

  // Tickets
  async getTickets(filters = {}) {
    await delay(300)
    let tickets = [...SEED_DATA.tickets]
    
    if (filters.status && filters.status !== 'all') {
      tickets = tickets.filter(t => t.status === filters.status)
    }
    
    return successResponse({ tickets, total: tickets.length })
  },

  async getTicketByCode(code) {
    await delay(200)
    const ticket = SEED_DATA.tickets.find(t => t.code === code)
    if (ticket) {
      return successResponse(ticket)
    }
    return errorResponse('Ticket not found')
  },

  async createTicket(data) {
    await delay(500)
    const newTicket = {
      id: `WR-2026-${String(SEED_DATA.tickets.length + 1).padStart(4, '0')}`,
      code: `WR-2026-${String(SEED_DATA.tickets.length + 1).padStart(4, '0')}`,
      ...data,
      status: 'received',
      statusText: 'Tiếp nhận',
      createdAt: new Date().toISOString()
    }
    return successResponse(newTicket)
  },

  // Products
  async getProducts() {
    await delay(300)
    return successResponse({ products: SEED_DATA.products, total: SEED_DATA.products.length })
  },

  async getProductBySerial(serial) {
    await delay(200)
    const product = SEED_DATA.products.find(p => p.serial === serial)
    if (product) {
      return successResponse(product)
    }
    return errorResponse('Product not found')
  },

  // Customers
  async getCustomers() {
    await delay(300)
    return successResponse({ customers: SEED_DATA.customers, total: SEED_DATA.customers.length })
  },

  // Lookup (public)
  async lookupSerial(serial) {
    await delay(400)
    const product = SEED_DATA.products.find(p => p.serial.toUpperCase() === serial.toUpperCase())
    if (product) {
      return successResponse({
        serial: product.serial,
        name: product.name,
        category: product.category,
        purchaseDate: product.purchaseDate,
        warrantyExpiry: product.warrantyExpiry,
        warrantyStatus: product.warrantyStatus
      })
    }
    return errorResponse('Serial not found')
  },

  // AI Chat (mock responses)
  async chat(message) {
    await delay(800)
    
    const lowerMsg = message.toLowerCase()
    
    // Intent detection
    if (lowerMsg.includes('xin chào') || lowerMsg.includes('chào') || lowerMsg.includes('hello')) {
      return successResponse({
        response: `Xin chào! 👋 Tôi là trợ lý AI của BảoHành Pro.

Tôi có thể giúp bạn:
• 🔍 Tra cứu serial sản phẩm
• 📋 Tạo yêu cầu bảo hành
• 📦 Kiểm tra điều kiện bảo hành
• ❓ Trả lời câu hỏi thường gặp

Bạn cần hỗ trợ gì hôm nay?`,
        intent: 'greeting',
        confidence: 0.95,
        suggestions: [
          { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
          { id: 2, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
          { id: 3, text: 'Kiểm tra điều kiện BH', icon: '📦', action: 'check_warranty' },
          { id: 4, text: 'Câu hỏi thường gặp', icon: '❓', action: 'show_faq' }
        ]
      })
    }
    
    // Serial lookup
    if (lowerMsg.includes('tra cứu') || lowerMsg.includes('serial') || lowerMsg.includes('tra cu')) {
      const serialMatch = message.match(/\b[A-Z]{2,5}[-_]?[A-Z0-9]{3,15}\b/i)
      
      if (serialMatch) {
        const serial = serialMatch[0].toUpperCase()
        const product = SEED_DATA.products.find(p => p.serial === serial)
        
        if (product) {
          const isValid = product.warrantyStatus === 'valid'
          return successResponse({
            response: `🔍 Đã tìm thấy sản phẩm!

**${product.name}** (${product.serial})
📂 Danh mục: ${product.category}
📅 Ngày mua: ${product.purchaseDate}
⏰ Hết hạn: ${product.warrantyExpiry}

${isValid ? '✅ **CÒN BẢO HÀNH**' : '❌ **ĐÃ HẾT HẠN BẢO HÀNH**'}

Bạn cần hỗ trợ thêm gì không?`,
            intent: 'serial_lookup',
            confidence: 0.92,
            data: { product, serial },
            suggestions: isValid ? [
              { id: 1, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
              { id: 2, text: 'Tra cứu sản phẩm khác', icon: '🔍', action: 'lookup_serial' }
            ] : [
              { id: 1, text: 'Báo giá sửa chữa', icon: '💰', action: 'quote_repair' },
              { id: 2, text: 'Liên hệ hotline', icon: '📞', action: 'contact' }
            ]
          })
        }
      }
      
      return successResponse({
        response: `🔍 Để tra cứu thông tin sản phẩm, vui lòng nhập **số serial**.

Serial thường nằm ở:
• Nhãn phía dưới sản phẩm
• Hộp đựng sản phẩm
• Hoá đơn mua hàng

**Ví dụ:** \`TND-AC10-001\``,
        intent: 'serial_lookup',
        confidence: 0.85,
        suggestions: [
          { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
          { id: 2, text: 'Đăng ký sản phẩm mới', icon: '➕', action: 'register_product' }
        ]
      })
    }
    
    // Warranty check
    if (lowerMsg.includes('bảo hành') || lowerMsg.includes('bao hanh') || lowerMsg.includes('warranty')) {
      return successResponse({
        response: `📦 Để kiểm tra bảo hành, tôi cần serial sản phẩm.

Vui lòng nhập serial (thường in trên nhãn sản phẩm hoặc hộp đựng).

**Ví dụ:** \`TND-AC10-001\``,
        intent: 'warranty_check',
        confidence: 0.90,
        suggestions: [
          { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
          { id: 2, text: 'Hướng dẫn tìm serial', icon: '📖', action: 'how_to_find_serial' }
        ]
      })
    }
    
    // FAQ
    if (lowerMsg.includes('faq') || lowerMsg.includes('câu hỏi') || lowerMsg.includes('thường gặp')) {
      return successResponse({
        response: `❓ **Câu hỏi thường gặp**

📌 **Làm sao để bảo hành?**
Đăng ký online hoặc mang sản phẩm đến trung tâm bảo hành gần nhất.

📌 **Bảo hành bao lâu?**
Thông thường 12-24 tháng tùy sản phẩm.

📌 **Cần mang theo gì?**
• Sản phẩm
• Hóa đơn mua hàng (nếu có)
• Phiếu bảo hành (nếu có)

📌 **Sản phẩm không bảo hành khi nào?**
• Hỏng do rơi vỡ, va đập
• Tự ý sửa chữa
• Thiên tai, cháy nổ

Bạn muốn hỏi về vấn đề gì cụ thể?`,
        intent: 'faq_general',
        confidence: 0.88,
        suggestions: [
          { id: 1, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
          { id: 2, text: 'Kiểm tra điều kiện BH', icon: '📦', action: 'check_warranty' }
        ]
      })
    }
    
    // Create ticket
    if (lowerMsg.includes('tạo') || lowerMsg.includes('tao') || lowerMsg.includes('yêu cầu')) {
      return successResponse({
        response: `📝 Tôi sẽ hỗ trợ bạn tạo yêu cầu bảo hành!

Để bắt đầu, tôi cần biết:
**1.** Serial sản phẩm (nếu chưa có)
**2.** Mô tả lỗi/sự cố

Bạn có thể nhập serial trước để tôi kiểm tra thông tin sản phẩm?`,
        intent: 'create_ticket',
        confidence: 0.87,
        suggestions: [
          { id: 1, text: 'Nhập serial sản phẩm', icon: '🔍', action: 'enter_serial' },
          { id: 2, text: 'Xem hướng dẫn', icon: '📖', action: 'how_to_create' }
        ]
      })
    }
    
    // Thanks
    if (lowerMsg.includes('cảm ơn') || lowerMsg.includes('thank')) {
      return successResponse({
        response: `Cảm ơn bạn! 😊

Rất vui được hỗ trợ bạn. Nếu có câu hỏi nào khác, đừng ngần ngại hỏi nhé!`,
        intent: 'thanks',
        confidence: 0.95,
        suggestions: [
          { id: 1, text: 'Tiếp tục trò chuyện', icon: '💬', action: 'continue' },
          { id: 2, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' }
        ]
      })
    }
    
    // Default - unknown
    return successResponse({
      response: `🤔 Tôi chưa hiểu rõ ý của bạn.

Tôi có thể hỗ trợ bạn về:
• 🔍 Tra cứu serial sản phẩm
• 📋 Tạo yêu cầu bảo hành
• 📦 Kiểm tra điều kiện bảo hành
• ❓ Trả lời câu hỏi thường gặp

Bạn có thể diễn đạt lại hoặc chọn một trong các mục trên?`,
      intent: 'unknown',
      confidence: 0.50,
      suggestions: [
        { id: 1, text: 'Tra cứu serial', icon: '🔍', action: 'lookup_serial' },
        { id: 2, text: 'Tạo yêu cầu BH', icon: '📋', action: 'create_ticket' },
        { id: 3, text: 'Câu hỏi thường gặp', icon: '❓', action: 'show_faq' }
      ]
    })
  },

  // Auth
  async login(email, password) {
    await delay(500)
    
    if (email === 'admin@test.com' && password === 'admin123') {
      return successResponse({
        user: SEED_DATA.currentUser,
        token: 'mock-jwt-token-' + Date.now()
      })
    }
    
    return errorResponse('Email hoặc mật khẩu không đúng')
  },

  // Wallet
  async getWallet() {
    await delay(200)
    return successResponse(SEED_DATA.wallet)
  },

  // Reports
  async getReports() {
    await delay(300)
    return successResponse(SEED_DATA.charts)
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default mockApi
