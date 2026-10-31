import api from './api'

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  updateProfile: (payload) => api.put('/auth/profile', payload).then(r => r.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then(r => r.data),
  requestResetCode: (email) => api.post('/auth/request-reset-code', { email }).then(r => r.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then(r => r.data),
  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

export const ticketService = {
  list: (params = {}) => api.get('/tickets', { params }).then(r => r.data),
  get: (id) => api.get(`/tickets/${id}`).then(r => r.data),
  create: (payload) => api.post('/tickets', payload).then(r => r.data),
  assign: (id, technician_id) => api.post(`/tickets/${id}/assign`, { technician_id }).then(r => r.data),
  status: (id, payload) => api.post(`/tickets/${id}/status`, payload).then(r => r.data),
  summarize: (id) => api.post(`/tickets/${id}/summarize`).then(r => r.data),
  pay: (id) => api.post(`/tickets/${id}/pay`).then(r => r.data),
  stats: () => api.get('/tickets/stats/summary').then(r => r.data),
}

export const productService = {
  list: (q = '') => api.get('/products', { params: { q } }).then(r => r.data),
  listByCustomer: (customerId) => api.get(`/products/customer/${customerId}`).then(r => r.data),
  bySerial: (serial) => api.get(`/products/serial/${serial}`).then(r => r.data),
  lookupPublic: (serial) => api.post('/shop/warranty/lookup', { serial }).then(r => r.data),
  create: (payload) => api.post('/products', payload).then(r => r.data),
}

export const customerService = {
  list: (q = '') => api.get('/customers', { params: { q } }).then(r => r.data),
  technicians: () => api.get('/customers/technicians').then(r => r.data),
  create: (payload) => api.post('/customers', payload).then(r => r.data),
}

export const walletService = {
  me: () => api.get('/wallet').then(r => r.data),
  topup: (amount) => api.post('/wallet/topup', { amount }).then(r => r.data),
  transactions: () => api.get('/wallet/transactions').then(r => r.data),
}

export const aiService = {
  classify: (issue_description) => api.post('/ai/classify', { issue_description }).then(r => r.data),
  progressMessage: (payload) => api.post('/ai/progress-message', payload).then(r => r.data),
  warrantyHistory: (serial) => api.get(`/ai/warranty-history/${encodeURIComponent(serial)}`).then(r => r.data),
  errorCatalog: () => api.get('/ai/error-catalog').then(r => r.data),
  chat: (message, ctx = {}) => api.post('/ai/chat', { message, ...ctx }).then(r => r.data),
  shopChat: (payload) => api.post('/ai/shop-chat', payload).then(r => r.data),
}

export const financeService = {
  summary: () => api.get('/finance/summary').then(r => r.data),
  transactions: (type) => api.get('/finance/transactions', { params: { type } }).then(r => r.data),
  transfer: (payload) => api.post('/finance/transfer', payload).then(r => r.data),
  credit: (payload) => api.post('/finance/credit', payload).then(r => r.data),
}
