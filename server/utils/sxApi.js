/**
 * POS System - SX API Client
 * Gọi API từ hệ thống Sản xuất
 */

const SX_API_URL = process.env.SX_API_URL || '';
const SX_API_KEY = process.env.SX_API_KEY || '';

/**
 * Kiểm tra đã cấu hình SX chưa
 */
function isSxConfigured() {
  return SX_API_URL && SX_API_URL.trim() !== '';
}

// Thời gian chờ tối đa khi gọi SX (ms). Quá hạn thì hủy request để không treo.
const SX_TIMEOUT_MS = parseInt(process.env.SX_TIMEOUT_MS || '8000', 10);

/**
 * Gọi API SX
 * Có timeout: nếu SX không phản hồi trong SX_TIMEOUT_MS thì tự hủy và ném lỗi,
 * để nơi gọi có thể fallback thay vì treo vô thời hạn.
 */
async function callSxApi(endpoint, options = {}) {
  if (!isSxConfigured()) {
    throw new Error('SX API chưa được cấu hình');
  }
  
  const url = `${SX_API_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SX_API_KEY
    }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SX_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      signal: controller.signal
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }
    
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`SX không phản hồi sau ${SX_TIMEOUT_MS}ms (timeout)`);
      console.error(`SX API Error [${endpoint}]:`, timeoutErr.message);
      throw timeoutErr;
    }
    console.error(`SX API Error [${endpoint}]:`, err.message);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lấy danh sách tồn kho thành phẩm
 */
async function getFinishedProducts() {
  return callSxApi('/api/finished-products');
}

/**
 * Kiểm tra tồn kho đủ không
 */
async function checkStock(productType, productId, quantity) {
  const params = new URLSearchParams({
    product_type: productType,
    product_id: productId || '',
    quantity: quantity
  });
  return callSxApi(`/api/finished-products/check-stock?${params}`);
}

/**
 * Xuất kho thành phẩm (khi bán hàng)
 */
async function outFinishedProduct(finishedProductId, data) {
  return callSxApi(`/api/finished-products/${finishedProductId}/out`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Lấy danh sách công thức (menu nước ép)
 */
async function getRecipes() {
  return callSxApi('/api/recipes');
}

/**
 * Lấy danh sách sản phẩm trà
 */
async function getTeaProducts() {
  return callSxApi('/api/tea-products');
}

/**
 * Lấy tồn kho tổng hợp theo sản phẩm
 */
async function getStockSummary() {
  // Nếu chưa cấu hình SX, throw error để fallback
  if (!isSxConfigured()) {
    throw new Error('SX API chưa được cấu hình');
  }
  
  const finishedProducts = await getFinishedProducts();
  
  // Nhóm theo product_type và product_name
  const summary = {};
  
  finishedProducts.forEach(fp => {
    const key = `${fp.product_type}_${fp.product_id || 'null'}`;
    if (!summary[key]) {
      summary[key] = {
        product_type: fp.product_type,
        product_id: fp.product_id,
        product_name: fp.product_name,
        total_quantity: 0,
        batches: []
      };
    }
    summary[key].total_quantity += fp.quantity;
    summary[key].batches.push({
      id: fp.id,
      quantity: fp.quantity,
      expiry_date: fp.expiry_date,
      expiry_status: fp.expiry_status
    });
  });

  return Object.values(summary);
}

/**
 * Xuất kho - GỌI THẲNG API SX (SX đã có toDbProductType convert)
 */
/**
 * POS-VANTAY-v1: them tham so vanTay (tuy chon).
 * SX (SX-VANTAY-v1) ghi lai van tay; gap lai thi tra 200 kem da_lam_roi:true
 * va KHONG tru lan nua. Nho vay gui lai bao nhieu lan cung vo hai — do la dieu
 * kien de bat duoc viec tu do hang doi va doi chieu dinh ky.
 * Khong truyen vanTay thi SX chay y nhu cu (tuong thich nguoc).
 */
async function outStockFIFO(productType, productId, quantity, orderCode, vanTay) {
  try {
    const result = await callSxApi('/api/pos/stock/out', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        van_tay: vanTay || undefined,
        notes: `POS: ${orderCode}`
      })
    });
    if (result && result.da_lam_roi) {
      console.log(`↩️  Stock out DA LAM ROI: ${vanTay} (luc ${result.lam_luc}) — khong tru lai`);
      return result;
    }
    console.log(`✅ Stock out: ${productType} #${productId} x${quantity} - ${orderCode}`);
    return result;
  } catch (err) {
    console.error('❌ Stock out error:', err.message);
    throw err;
  }
}

/**
 * Hoàn kho - Khi hủy đơn hoặc xóa đơn
 */
/** POS-VANTAY-v1: xem chu thich o outStockFIFO. */
async function inStockReturn(productType, productId, quantity, orderCode, vanTay) {
  try {
    const result = await callSxApi('/api/pos/stock/in', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        van_tay: vanTay || undefined,
        notes: `POS hoàn kho: ${orderCode}`
      })
    });
    if (result && result.da_lam_roi) {
      console.log(`↩️  Stock return DA LAM ROI: ${vanTay} (luc ${result.lam_luc}) — khong cong lai`);
      return result;
    }
    console.log(`✅ Stock return: ${productType} #${productId} x${quantity} - ${orderCode}`);
    return result;
  } catch (err) {
    console.error('❌ Stock return error:', err.message);
    // POS-TONCU-v1: PHAI nem loi. Truoc day `return null` lam khoi ghi so no
    // chieu "in" trong orders.js KHONG BAO GIO CHAY (no nam trong catch, cho
    // nhan loi ma loi khong bao gio toi). Hau qua: huy don luc SX mat ket noi
    // thi kho KHONG duoc cong lai VA khong co dau vet nao.
    // Nem loi KHONG lam hong viec huy don: noi goi da boc san try/catch,
    // huy don van xong, chi khac la viec hoan kho duoc GHI VAO SO NO de doi sau.
    throw err;
  }
}

module.exports = {
  isSxConfigured,
  callSxApi,
  getFinishedProducts,
  checkStock,
  outFinishedProduct,
  getRecipes,
  getTeaProducts,
  getStockSummary,
  outStockFIFO,
  inStockReturn
};
