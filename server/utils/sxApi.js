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

/**
 * Gọi API SX
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

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }
    
    return data;
  } catch (err) {
    console.error(`SX API Error [${endpoint}]:`, err.message);
    throw err;
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
async function outStockFIFO(productType, productId, quantity, orderCode) {
  try {
    const result = await callSxApi('/api/pos/stock/out', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        notes: `POS: ${orderCode}`
      })
    });
    console.log(`✅ Stock out: ${productType} #${productId} x${quantity} - ${orderCode}`);
    return result;
  } catch (err) {
    console.error('❌ Stock out error:', err.message);
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
  outStockFIFO
};
