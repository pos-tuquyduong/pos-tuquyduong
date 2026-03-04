/**
 * POS System - Customers V2 Routes
 * API tra cứu khách (merge SX + POS wallets + registrations)
 * Phase B: Thêm API cập nhật chiết khấu + ghi chú
 * 
 * TURSO MIGRATION: Tất cả database calls dùng await
 */

const express = require("express");
const { query, queryOne, run } = require("../database");
const { authenticate, checkPermission } = require("../middleware/auth");
const { normalizePhone } = require("../utils/helpers");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const router = express.Router();

const SX_API_URL = process.env.SX_API_URL || "http://localhost:3000";
const SX_API_KEY = process.env.SX_API_KEY || "";

// Helper: fetch tương thích Node < 18
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === "https:" ? https : http;

    const req = lib.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// Helper: Lấy khách từ SX + lazy cache vào pos_customers
let lastCacheTime = 0;
const CACHE_INTERVAL = 5 * 60 * 1000; // Cache mỗi 5 phút

async function fetchSXCustomers() {
  try {
    if (!SX_API_KEY) return await getLocalCachedCustomers();
    const response = await fetchUrl(`${SX_API_URL}/api/pos/customers/export`, {
      headers: { "X-API-Key": SX_API_KEY },
    });
    if (!response.ok) return await getLocalCachedCustomers();
    const customers = await response.json();

    // Lazy cache: lưu vào pos_customers (throttled, không block response)
    if (customers.length > 0 && Date.now() - lastCacheTime > CACHE_INTERVAL) {
      lastCacheTime = Date.now();
      cacheCustomersToLocal(customers).catch(err =>
        console.error("Cache customers error:", err.message)
      );
    }

    return customers;
  } catch (err) {
    console.error("SX API error:", err.message);
    console.warn("⚠️ SX unavailable - dùng cache local");
    return await getLocalCachedCustomers();
  }
}

// Cache SX customers vào pos_customers (silent background)
async function cacheCustomersToLocal(sxCustomers) {
  let cached = 0;
  for (const c of sxCustomers) {
    const phone = normalizePhone(c.phone);
    if (!phone) continue;
    const parentPhone = c.parent_phone ? normalizePhone(c.parent_phone) : null;
    try {
      await run(`
        INSERT INTO pos_customers (phone, name, parent_phone, relationship, sx_status, updated_at)
        VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT(phone) DO UPDATE SET
          name = excluded.name,
          parent_phone = excluded.parent_phone,
          relationship = excluded.relationship,
          sx_status = 'active',
          updated_at = CURRENT_TIMESTAMP
      `, [phone, c.name, parentPhone, c.relationship]);
      cached++;
    } catch (e) { /* skip individual errors */ }
  }
  console.log(`📋 Cached ${cached}/${sxCustomers.length} customers to local`);
}

// Fallback: đọc từ pos_customers khi SX sập
async function getLocalCachedCustomers() {
  const customers = await query(
    "SELECT * FROM pos_customers WHERE sx_status = 'active' OR sx_status IS NULL"
  );
  if (customers.length > 0) {
    console.log(`📋 Fallback: loaded ${customers.length} customers from local cache`);
  }
  return customers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    notes: c.notes,
    parent_phone: c.parent_phone,
    parent_name: null,
    relationship: c.relationship,
    status: 'active',
    subscriptions: [],
  }));
}

// Helper: Lấy map thông tin bổ sung từ pos_customers (CK + lý do) - ASYNC
async function getCustomerExtrasMap() {
  const extras = await query("SELECT phone, discount_type, discount_value, discount_note, address, customer_type FROM pos_customers");
  const map = {};
  extras.forEach((d) => (map[d.phone] = d));
  return map;
}

// ══════════════════════════════════════════════════════
// ROUTES CỤ THỂ - ĐẶT TRƯỚC /:phone
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/v2/customers/search/:query
 */
router.get("/search/:query", authenticate, async (req, res) => {
  try {
    const q = req.params.query?.trim().toLowerCase();
    if (!q || q.length < 1) {
      return res.status(400).json({ error: "Từ khóa quá ngắn" });
    }

    const sxCustomers = await fetchSXCustomers();
    const registrations = await query("SELECT * FROM pos_registrations");
    const wallets = await query("SELECT * FROM pos_wallets");
    const extrasMap = await getCustomerExtrasMap();

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    // Tạo map tên để lookup parent_name
    const customerNameMap = {};
    sxCustomers.forEach((c) => {
      customerNameMap[normalizePhone(c.phone)] = c.name;
    });
    registrations.forEach((r) => {
      if (!customerNameMap[r.phone]) {
        customerNameMap[r.phone] = r.name;
      }
    });

    // Tìm trong SX
    const sxResults = sxCustomers
      .filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q))
      .map((c) => {
        const phone = normalizePhone(c.phone);
        const extras = extrasMap[phone];
        // Lấy parent_balance nếu có parent_phone (từ SX)
        const parentPhone = c.parent_phone ? normalizePhone(c.parent_phone) : null;
        const parentBalance = parentPhone ? (walletMap[parentPhone]?.balance || 0) : 0;
        return {
          ...c,
          balance: walletMap[phone]?.balance || 0,
          parent_balance: parentBalance, // Thêm số dư mẹ
          source: "sx",
          discount_type: extras?.discount_type || null,
          discount_value: extras?.discount_value || 0,
          discount_note: extras?.discount_note || null,
          address: extras?.address || null,
          customer_type: extras?.customer_type || null,
        };
      });

    // Tìm trong registrations
    const sxPhones = new Set(sxCustomers.map((c) => normalizePhone(c.phone)));
    const regResults = registrations
      .filter(
        (r) =>
          !sxPhones.has(r.phone) &&
          (r.name?.toLowerCase().includes(q) || r.phone?.includes(q)),
      )
      .map((r) => {
        const extras = extrasMap[r.phone];
        // Lấy parent_balance nếu có parent_phone (từ registrations)
        const parentPhone = r.parent_phone ? normalizePhone(r.parent_phone) : null;
        const parentBalance = parentPhone ? (walletMap[parentPhone]?.balance || 0) : 0;
        return {
          name: r.name,
          phone: r.phone,
          balance: walletMap[r.phone]?.balance || 0,
          parent_phone: parentPhone, // Thêm SĐT mẹ
          parent_name: parentPhone ? customerNameMap[parentPhone] || null : null, // Lookup tên mẹ
          parent_balance: parentBalance, // Thêm số dư mẹ
          source: "pos",
          is_pending: r.status === "pending",
          discount_type: extras?.discount_type || null,
          discount_value: extras?.discount_value || 0,
          notes: r.notes,
          discount_note: extras?.discount_note || null,
          address: extras?.address || null,
          customer_type: extras?.customer_type || null,
        };
      });

    res.json({ results: [...sxResults, ...regResults].slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CHUNG
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/v2/customers
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const sxCustomers = await fetchSXCustomers();
    const wallets = await query("SELECT * FROM pos_wallets");
    const registrations = await query(
      "SELECT * FROM pos_registrations WHERE status = 'pending'",
    );
    const extrasMap = await getCustomerExtrasMap();

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    const regMap = {};
    registrations.forEach((r) => (regMap[r.phone] = r));

    // Merge SX + wallets
    const result = sxCustomers.map((c) => {
      const phone = normalizePhone(c.phone);
      const wallet = walletMap[phone];
      const extras = extrasMap[phone];
      delete regMap[phone];
      return {
        ...c,
        phone,
        balance: wallet?.balance || 0,
        source: "sx",
        is_synced: true,
        discount_type: extras?.discount_type || null,
        discount_value: extras?.discount_value || 0,
        discount_note: extras?.discount_note || null,
        address: extras?.address || null,
          customer_type: extras?.customer_type || null,
      };
    });

    // Thêm pending
    Object.values(regMap).forEach((r) => {
      const extras = extrasMap[r.phone];
      result.push({
        name: r.name,
        phone: r.phone,
        balance: walletMap[r.phone]?.balance || 0,
        source: "pos",
        is_synced: false,
        is_pending: true,
        registration_id: r.id,
        requested_product: r.requested_product,
        discount_type: extras?.discount_type || null,
        discount_value: extras?.discount_value || 0,
        notes: r.notes,
        discount_note: extras?.discount_note || null,
        address: extras?.address || null,
          customer_type: extras?.customer_type || null,
      });
    });

    res.json({ customers: result, total: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CÓ PARAMETER - ĐẶT SAU CÙNG
// ══════════════════════════════════════════════════════

/**
 * PUT /api/pos/v2/customers/:phone/address
 * Cập nhật địa chỉ khách hàng
 */
router.put("/:phone/address", authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const { address } = req.body;

    // Kiểm tra khách có tồn tại trong pos_customers không
    const existing = await queryOne("SELECT id FROM pos_customers WHERE phone = ?", [phone]);
    
    if (existing) {
      await run(`
        UPDATE pos_customers 
        SET address = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE phone = ?
      `, [address || null, phone]);
    } else {
      // Insert mới (khách từ SX chưa có record trong pos_customers)
      await run(`
        INSERT INTO pos_customers (phone, name, address, created_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [phone, 'Khách hàng', address || null]);
    }

    res.json({ success: true, phone, address: address || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/v2/customers/:phone/discount
 * Cập nhật chiết khấu + ghi chú cho khách
 */
router.put("/:phone/discount", authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const { discount_type, discount_value, discount_note } = req.body;
    
    // Validate discount
    if (discount_type && !['percent', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: "Loại chiết khấu không hợp lệ (percent/fixed)" });
    }
    
    const value = parseFloat(discount_value) || 0;
    if (discount_type === 'percent' && (value < 0 || value > 100)) {
      return res.status(400).json({ error: "Phần trăm phải từ 0-100" });
    }
    if (discount_type === 'fixed' && value < 0) {
      return res.status(400).json({ error: "Số tiền không được âm" });
    }

    // Kiểm tra khách có tồn tại trong pos_customers không
    const existing = await queryOne("SELECT id FROM pos_customers WHERE phone = ?", [phone]);
    
    if (existing) {
      // Update
      await run(`
        UPDATE pos_customers 
        SET discount_type = ?, discount_value = ?, discount_note = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE phone = ?
      `, [discount_type || null, value, discount_note || null, phone]);
    } else {
      // Insert mới (khách từ SX hoặc chưa có trong pos_customers)
      await run(`
        INSERT INTO pos_customers (phone, name, discount_type, discount_value, discount_note, created_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [phone, 'Khách hàng', discount_type || null, value, discount_note || null]);
    }

    res.json({ 
      success: true, 
      phone,
      discount_type: discount_type || null,
      discount_value: value,
      discount_note: discount_note || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/v2/customers/:phone
 */
router.get("/:phone", authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const sxCustomers = await fetchSXCustomers();
    const sxCustomer = sxCustomers.find(
      (c) => normalizePhone(c.phone) === phone,
    );
    const wallet = await queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [
      phone,
    ]);
    const registration = await queryOne(
      "SELECT * FROM pos_registrations WHERE phone = ?",
      [phone],
    );
    const posCustomer = await queryOne(
      "SELECT discount_type, discount_value, discount_note, address, customer_type FROM pos_customers WHERE phone = ?",
      [phone]
    );

    if (!sxCustomer && !wallet && !registration) {
      return res.status(404).json({ error: "Không tìm thấy khách hàng" });
    }

    let customer = {};
    if (sxCustomer) {
      customer = { ...sxCustomer, source: "sx", is_synced: true };
    } else if (registration) {
      customer = {
        name: registration.name,
        phone: registration.phone,
        notes: registration.notes,
        source: "pos",
        is_synced: false,
        is_pending: registration.status === "pending",
        registration_id: registration.id,
      };
    } else {
      customer = { phone, source: "pos", is_retail: true };
    }

    customer.balance = wallet?.balance || 0;
    customer.total_topup = wallet?.total_topup || 0;
    customer.total_spent = wallet?.total_spent || 0;
    customer.discount_type = posCustomer?.discount_type || null;
    customer.discount_value = posCustomer?.discount_value || 0;
    customer.discount_note = posCustomer?.discount_note || null;
    customer.address = posCustomer?.address || null;
    customer.customer_type = posCustomer?.customer_type || null;

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/v2/customers/:phone/full
 */
router.get("/:phone/full", authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const sxCustomers = await fetchSXCustomers();
    const sxCustomer = sxCustomers.find(
      (c) => normalizePhone(c.phone) === phone,
    );
    const wallet = await queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [
      phone,
    ]);
    const registration = await queryOne(
      "SELECT * FROM pos_registrations WHERE phone = ?",
      [phone],
    );
    const posCustomer = await queryOne(
      "SELECT discount_type, discount_value, discount_note, address, customer_type FROM pos_customers WHERE phone = ?",
      [phone]
    );

    let customer = {};
    if (sxCustomer) {
      customer = { ...sxCustomer, source: "sx" };
    } else if (registration) {
      customer = {
        name: registration.name,
        phone,
        source: "pos",
        is_pending: registration.status === "pending",
      };
    } else if (wallet) {
      customer = { phone, source: "pos", is_retail: true };
    } else {
      return res.status(404).json({ error: "Không tìm thấy" });
    }

    customer.balance = wallet?.balance || 0;
    customer.discount_type = posCustomer?.discount_type || null;
    customer.discount_value = posCustomer?.discount_value || 0;
    customer.discount_note = posCustomer?.discount_note || null;
    customer.address = posCustomer?.address || null;
    customer.customer_type = posCustomer?.customer_type || null;

    const transactions = await query(
      "SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 20",
      [phone],
    );
    const orders = await query(
      "SELECT * FROM pos_orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 20",
      [phone],
    );

    res.json({ customer, transactions, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
