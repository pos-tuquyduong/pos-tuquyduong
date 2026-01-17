/**
 * POS Frontend - API Utils
 * Updated: Thêm registrations confirmExport, revert, getLogs
 * Phase B: Thêm customersV2Api.updateDiscount
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/pos';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = localStorage.getItem('pos_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('pos_token', token);
    } else {
      localStorage.removeItem('pos_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('pos_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          window.location.href = '/login';
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async upload(endpoint, formData) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  }

  async download(endpoint, filename) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout', {}),
  me: () => api.get('/auth/me'),
  changePassword: (current_password, new_password) => 
    api.put('/auth/password', { current_password, new_password })
};

// ============ API MỚI ============

// Wallets API
export const walletsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/wallets${query ? '?' + query : ''}`);
  },
  get: (phone) => api.get(`/wallets/${phone}`),
  topup: (data) => api.post('/wallets/topup', data),
  deduct: (data) => api.post('/wallets/deduct', data),
  adjust: (data) => api.post('/wallets/adjust', data),
  transactions: (phone, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/wallets/${phone}/transactions${query ? '?' + query : ''}`);
  }
};

// Registrations API - ĐÃ CẬP NHẬT
export const registrationsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/registrations${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/registrations/${id}`),
  create: (data) => api.post('/registrations', data),
  update: (id, data) => api.put(`/registrations/${id}`, data),
  delete: (id) => api.delete(`/registrations/${id}`),
  stats: () => api.get('/registrations/stats/summary'),

  // Export 2 bước
  exportCsv: () => api.download('/registrations/export/csv', `dang-ky-moi_${new Date().toISOString().slice(0,10)}.csv`),
  confirmExport: () => api.post('/registrations/confirm-export', {}),

  // Hoàn tác
  revert: (id) => api.post(`/registrations/revert/${id}`, {}),
  revertLast: () => api.post('/registrations/revert-last', {}),

  // Logs
  getLogs: () => api.get('/registrations/export-logs')
};

// Customers V2 API - Phase B: Thêm updateDiscount
export const customersV2Api = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/v2/customers${query ? '?' + query : ''}`);
  },
  get: (phone) => api.get(`/v2/customers/${phone}`),
  getFull: (phone) => api.get(`/v2/customers/${phone}/full`),
  search: (query) => api.get(`/v2/customers/search/${encodeURIComponent(query)}`),
  // Phase B: Cập nhật chiết khấu mặc định cho khách
  updateDiscount: (phone, data) => api.put(`/v2/customers/${phone}/discount`, data)
};

// ============ API CŨ (giữ lại để tương thích) ============

// Customers API (cũ)
export const customersApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/customers${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/customers/${id}`),
  getByPhone: (phone) => api.get(`/customers/phone/${phone}`),
  getByQR: (code) => api.get(`/customers/qr/${code}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  stats: () => api.get('/customers/stats'),
  children: (id) => api.get(`/customers/${id}/children`),
  addChild: (id, data) => api.post(`/customers/${id}/children`, data)
};

// Balance API (cũ)
export const balanceApi = {
  get: (customerId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/customers/${customerId}/balance${query ? '?' + query : ''}`);
  },
  topup: (customerId, data) => api.post(`/customers/${customerId}/balance/topup`, data),
  adjust: (customerId, data) => api.post(`/customers/${customerId}/balance/adjust`, data)
};

// Products API
export const productsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updatePrice: (id, price) => api.put(`/products/${id}/price`, { price }),
  toggle: (id) => api.put(`/products/${id}/toggle`, {}),
  updatePricesBatch: (products) => api.put('/products/batch/prices', { products })
};

// Orders API
export const ordersApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/orders${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason })
};

// Refunds API
export const refundsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/refunds${query ? '?' + query : ''}`);
  },
  pending: () => api.get('/refunds/pending'),
  approve: (id) => api.post(`/refunds/${id}/approve`, {}),
  reject: (id, reason) => api.post(`/refunds/${id}/reject`, { reason })
};

// Stock API
export const stockApi = {
  summary: () => api.get('/stock'),
  detail: () => api.get('/stock/detail'),
  check: (product_type, product_id, quantity) => 
    api.get(`/stock/check?product_type=${product_type}&product_id=${product_id || ''}&quantity=${quantity}`)
};

// Sync API (cũ)
export const syncApi = {
  status: () => api.get('/sync/status'),
  exportPreview: () => api.get('/sync/export/preview'),
  export: () => api.download('/sync/export', `khach-moi_${new Date().toISOString().slice(0,10)}.csv`),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload('/sync/import', formData);
  },
  logs: (limit = 20) => api.get(`/sync/logs?limit=${limit}`)
};

// Reports API
export const reportsApi = {
  daily: (date) => api.get(`/reports/daily${date ? '?date=' + date : ''}`),
  sales: (from, to, group_by = 'day') => 
    api.get(`/reports/sales?from=${from}&to=${to}&group_by=${group_by}`),
  products: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/reports/products${query ? '?' + query : ''}`);
  },
  balance: () => api.get('/reports/balance'),
  staff: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/reports/staff${query ? '?' + query : ''}`);
  },
  // Phase B: Báo cáo chiết khấu + shipping
  discounts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/reports/discounts${query ? '?' + query : ''}`);
  }
};

// Discount Codes API - Phase B
export const discountCodesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/discount-codes${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/discount-codes/${id}`),
  create: (data) => api.post('/discount-codes', data),
  update: (id, data) => api.put(`/discount-codes/${id}`, data),
  delete: (id) => api.delete(`/discount-codes/${id}`),
  validate: (code, orderSubtotal) => api.post('/discount-codes/validate', { code, order_subtotal: orderSubtotal })
};

// Users API
export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, new_password) => api.put(`/users/${id}/password`, { new_password }),
  permissions: () => api.get('/users/permissions'),
  updatePermissions: (role, permissions) => api.put(`/permissions/${role}`, { permissions })
};

export default api;
