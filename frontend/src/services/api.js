import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const baseURL = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_grocery_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  googleLogin: (data) => api.post('/auth/google', data),
  sendGoogleCode: (email) => api.post('/auth/google/send-code', { email }),
  verifyGoogleCode: (data) => api.post('/auth/google/verify-code', data),
  getProfile: () => api.get('/auth/profile'),
  updateSettings: (data) => api.put('/auth/settings', data)
};

export const productAPI = {
  getProducts: () => api.get('/products'),
  getLowStock: () => api.get('/products/low'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  seedCatalog: () => api.post('/products/seed-catalog')
};

export const purchaseAPI = {
  getPurchases: () => api.get('/purchases'),
  addPurchase: (data) => api.post('/purchases', data)
};

export const saleAPI = {
  getSales: () => api.get('/sales'),
  addSale: (data) => api.post('/sales', data)
};

export const expenseAPI = {
  getExpenses: () => api.get('/expenses'),
  addExpense: (data) => api.post('/expenses', data)
};

export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getReports: (period = 'daily', date = '') => api.get(`/reports/analytics?period=${period}&date=${date}`)
};

export const voiceAPI = {
  parseCommand: (command) => api.post('/voice/parse', { command }),
  executeAction: (action, payload) => api.post('/voice/execute', { action, payload })
};

export const orderAPI = {
  parseVoiceOrder: (command) => api.post('/orders/voice-parse', { command }),
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`)
};

export const paymentAPI = {
  createOrder: (data) => api.post('/create-order', data),
  verifyPayment: (data) => api.post('/verify-payment', data),
  getRazorpayConfig: () => api.get('/payment/razorpay/config'),
  createRazorpayOrder: (data) => api.post('/create-order', data),
  verifyRazorpayPayment: (data) => api.post('/verify-payment', data),
  testRazorpayConnection: (data) => api.post('/payment/razorpay/test-connection', data)
};

export const intelligenceAPI = {
  getSummary: () => api.get('/intelligence/summary'),
  getReorderRecommendations: () => api.get('/intelligence/reorder-recommendations'),
  getExpiryAlerts: () => api.get('/intelligence/expiry-alerts'),
  getDeadStock: () => api.get('/intelligence/dead-stock'),
  getProfitAnalysis: () => api.get('/intelligence/profit-analysis'),
  simulateWhatIf: (scenario) => api.post('/intelligence/what-if', scenario)
};

export default api;
