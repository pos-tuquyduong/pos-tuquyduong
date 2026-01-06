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
 * Xuất kho theo FIFO (hết hạn trước xuất trước)
 */
async function outStockFIFO(productType, productId, quantity, customerInfo, orderInfo) {
  try {
    // Lấy danh sách batch theo thứ tự hết hạn
    const finishedProducts = await getFinishedProducts();
    
    const batches = finishedProducts
      .filter(fp => 
        fp.product_type === productType && 
        (productId === null ? fp.product_id === null : fp.product_id === productId) &&
        fp.quantity > 0
      )
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    let remaining = quantity;
    const results = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const outQty = Math.min(remaining, batch.quantity);
      
      const result = await outFinishedProduct(batch.id, {
        quantity: outQty,
        type: 'out_sale',
        customer_id: customerInfo?.id || null,
        customer_name: customerInfo?.name || null,
        notes: `Bán hàng - ${orderInfo?.code || ''}`,
        reference_type: 'pos_order',
        reference_id: orderInfo?.id || null
      });

      results.push({
        batch_id: batch.id,
        quantity: outQty,
        remaining: result.remaining
      });

      remaining -= outQty;
    }

    if (remaining > 0) {
      throw new Error(`Không đủ hàng. Còn thiếu ${remaining} ${productType}`);
    }

    return { success: true, results };
  } catch (err) {
    console.error('Error in outStockFIFO:', err.message);
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
