/**
 * POS Frontend - API Utils
 * Updated: Thêm registrations confirmExport, revert, getLogs
 * Phase B: Thêm customersV2Api.updateDiscount
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/pos';

/**
 * POS-1 (POS-ERRHANDLING-v1) — PHÂN LOẠI 401 THEO `code`, KHÔNG THEO URL.
 *
 * Danh sách dưới đây là các mã 401 có nghĩa "PHIÊN ĐĂNG NHẬP ĐÃ CHẾT" —
 * CHỈ chúng mới được phép xoá token và đá về /login.
 *
 * Cố ý dùng DANH SÁCH CHO PHÉP, không dùng danh sách cấm: 401 lạ hoặc 401
 * không kèm code thì KHÔNG đăng xuất. Nhầm về phía "để yên" chỉ khiến nhân
 * viên bấm lại một lần; nhầm về phía "đăng xuất" đẻ ra vòng lặp
 * đăng nhập -> 401 -> đăng xuất không lối thoát.
 *
 * Đối chiếu server (đã rà HẾT 10 chỗ trả 401 trong server/, 23.08.2026):
 *
 *   middleware/auth.js — phiên nhân viên chết thật, CÓ trong danh sách:
 *     NO_TOKEN · USER_NOT_FOUND · USER_INACTIVE · TOKEN_EXPIRED · INVALID_TOKEN
 *
 *   middleware/auth.js — xác thực MÁY-GỌI-MÁY, cố ý ĐỂ NGOÀI danh sách:
 *     SERVICE_AUTH_NOT_CONFIGURED · INVALID_SERVICE_KEY
 *     Đây là lỗi CẤU HÌNH SERVER, không phải phiên nhân viên. Trình duyệt
 *     không gửi X-Service-Key nên thực tế không tới được, nhưng đăng xuất vì
 *     server thiếu cấu hình chính là công thức của vòng lặp vô tận.
 *
 *   routes/auth.js — 3 chỗ trong POST /auth/login, trả 401 KHÔNG KÈM CODE:
 *     sai tài khoản / sai mật khẩu / tài khoản bị vô hiệu hoá.
 *     PHẢI ĐỂ YÊN. Trước bản vá này, gõ sai mật khẩu bị window.location.href
 *     tải lại cả trang, xoá sạch state lỗi của màn Login — nhân viên không
 *     bao giờ đọc được lý do, chỉ thấy form trắng trở lại.
 *
 * ⚠ Ghi chú đã biết (CHƯA vá, nằm ngoài phạm vi đợt này): server KHÔNG có mã
 * AUTH_NOT_CONFIGURED. Nếu thiếu biến JWT_SECRET, jwt.verify ném
 * JsonWebTokenError và middleware trả INVALID_TOKEN — lỗi cấu hình đội lốt
 * token hỏng, nên vẫn bị đăng xuất. Không thành vòng lặp (đăng nhập lại sẽ
 * gặp lỗi 500 từ jwt.sign) nhưng thông báo gây hiểu nhầm.
 */
const SESSION_DEAD_CODES = [
  'NO_TOKEN',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'USER_NOT_FOUND',
  'USER_INACTIVE'
];

/** Chuỗi rỗng / undefined KHÔNG được coi là khớp (checklist B5). */
function isSessionDead(status, code) {
  return status === 401 && !!code && SESSION_DEAD_CODES.includes(code);
}

/**
 * Đọc body ĐÚNG MỘT LẦN, chịu được body rỗng và body không phải JSON.
 *
 * `response.json()` trần ném SyntaxError khi gặp trang lỗi HTML của proxy
 * (Render / Cloudflare trả 502 dạng HTML). Lúc đó mã 401 thật bị che mất và
 * không còn gì để phân loại. Đọc text rồi tự parse thì luôn giữ được
 * response.status. Đọc text một lần nên không cần res.clone() (checklist B2).
 */
async function readBody(response) {
  let text;
  try {
    text = await response.text();
  } catch {
    return {};
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `HTTP ${response.status} (phản hồi không phải JSON)` };
  }
}

/** Dựng Error mang theo status + code để nơi gọi phân nhánh được nếu cần. */
function buildApiError(response, data) {
  const err = new Error(
    (data && (data.error || data.message)) || `HTTP ${response.status}`
  );
  err.status = response.status;
  err.code = data && data.code;
  return err;
}

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = localStorage.getItem('pos_token');
    // POS-1 — cờ chặn cho request SONG SONG (checklist B3). Màn Bán hàng bắn
    // nhiều lời gọi cùng lúc; hết phiên là tất cả cùng trả 401. Không có cờ
    // thì có bao nhiêu request là bấy nhiêu lần gán window.location.href.
    this.sessionExpiredHandled = false;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('pos_token', token);
      // Đăng nhập lại thành công -> mở cờ cho phiên mới.
      this.sessionExpiredHandled = false;
    } else {
      // Nhánh xoá token cố ý KHÔNG mở lại cờ.
      localStorage.removeItem('pos_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('pos_token');
  }

  /**
   * POS-1 — chỗ DUY NHẤT xử lý phiên đã chết. Chỉ chạy một lần mỗi phiên.
   * Không đá đi khi đang ở sẵn /login: tránh tải lại trang thừa và tránh
   * xoá mất thông báo lỗi mà màn Login vừa hiện.
   */
  handleSessionExpired() {
    if (this.sessionExpiredHandled) return;
    this.sessionExpiredHandled = true;
    this.setToken(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Chỗ DUY NHẤT quyết định một phản hồi lỗi phải làm gì.
   *
   * LUÔN NÉM lỗi (checklist A2): gán window.location.href KHÔNG dừng ngay mã
   * JavaScript đang chạy — điều hướng chỉ được xếp hàng. Không ném thì chuỗi
   * .then() phía sau vẫn chạy tiếp với object {error:...} và ném TypeError ở
   * chỗ .map(), tức là trắng màn hình đúng vào lúc đang đá về login.
   */
  raiseForStatus(response, data) {
    if (isSessionDead(response.status, data && data.code)) {
      this.handleSessionExpired();
    }
    throw buildApiError(response, data);
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

      const data = await readBody(response);

      if (!response.ok) {
        this.raiseForStatus(response, data);
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

    // POS-1 — upload đi qua CÙNG bộ phân loại với request().
    const data = await readBody(response);
    if (!response.ok) {
      this.raiseForStatus(response, data);
    }
    return data;
  }

  async download(endpoint, filename) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    // POS-1 — download đi qua CÙNG bộ phân loại. Trước đây hết phiên khi bấm
    // "Xuất CSV" chỉ hiện "Không có token xác thực" rồi kẹt tại chỗ.
    if (!response.ok) {
      const data = await readBody(response);
      this.raiseForStatus(response, data);
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
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/orders/${id}`),
  payDebt: (id, data) => api.post(`/orders/${id}/pay-debt`, data)
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
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, new_password) => api.put(`/users/${id}/password`, { new_password }),
  permissions: () => api.get('/users/permissions'),
  updatePermissions: (role, permissions) => api.put(`/permissions/${role}`, { permissions })
};

export default api;
