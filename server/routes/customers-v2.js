/**
 * POS System - Customers V2 Routes
 * API tra cứu khách (merge SX + POS wallets + registrations)
 * Phase B: Thêm API cập nhật chiết khấu + ghi chú
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

// Helper: Lấy khách từ SX
async function fetchSXCustomers() {
  try {
    if (!SX_API_KEY) return [];
    const response = await fetchUrl(`${SX_API_URL}/api/pos/customers/export`, {
      headers: { "X-API-Key": SX_API_KEY },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error("SX API error:", err.message);
    return [];
  }
}

// Helper: Lấy map thông tin bổ sung từ pos_customers (CK + notes)
function getCustomerExtrasMap() {
  const extras = query("SELECT phone, discount_type, discount_value, notes FROM pos_customers");
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
    const registrations = query("SELECT * FROM pos_registrations");
    const wallets = query("SELECT * FROM pos_wallets");
    const extrasMap = getCustomerExtrasMap();

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    // Tìm trong SX
    const sxResults = sxCustomers
      .filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q))
      .map((c) => {
        const phone = normalizePhone(c.phone);
        const extras = extrasMap[phone];
        return {
          ...c,
          balance: walletMap[phone]?.balance || 0,
          source: "sx",
          discount_type: extras?.discount_type || null,
          discount_value: extras?.discount_value || 0,
          notes: extras?.notes || c.notes || null,
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
        return {
          name: r.name,
          phone: r.phone,
          balance: walletMap[r.phone]?.balance || 0,
          source: "pos",
          is_pending: r.status === "pending",
          discount_type: extras?.discount_type || null,
          discount_value: extras?.discount_value || 0,
          notes: extras?.notes || r.notes || null,
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
    const wallets = query("SELECT * FROM pos_wallets");
    const registrations = query(
      "SELECT * FROM pos_registrations WHERE status = 'pending'",
    );
    const extrasMap = getCustomerExtrasMap();

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
        notes: extras?.notes || c.notes || null,
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
        notes: extras?.notes || r.notes || null,
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
 * PUT /api/pos/v2/customers/:phone/discount
 * Cập nhật chiết khấu + ghi chú cho khách
 */
router.put("/:phone/discount", authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const { discount_type, discount_value, notes } = req.body;
    
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
    const existing = queryOne("SELECT id FROM pos_customers WHERE phone = ?", [phone]);
    
    if (existing) {
      // Update
      run(`
        UPDATE pos_customers 
        SET discount_type = ?, discount_value = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE phone = ?
      `, [discount_type || null, value, notes || null, phone]);
    } else {
      // Insert mới (khách từ SX hoặc chưa có trong pos_customers)
      run(`
        INSERT INTO pos_customers (phone, name, discount_type, discount_value, notes, created_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [phone, 'Khách hàng', discount_type || null, value, notes || null]);
    }

    res.json({ 
      success: true, 
      phone,
      discount_type: discount_type || null,
      discount_value: value,
      notes: notes || null
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
    const wallet = queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [
      phone,
    ]);
    const registration = queryOne(
      "SELECT * FROM pos_registrations WHERE phone = ?",
      [phone],
    );
    const posCustomer = queryOne(
      "SELECT discount_type, discount_value, notes FROM pos_customers WHERE phone = ?",
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
    // Ưu tiên notes từ pos_customers
    if (posCustomer?.notes) {
      customer.notes = posCustomer.notes;
    }

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
    const wallet = queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [
      phone,
    ]);
    const registration = queryOne(
      "SELECT * FROM pos_registrations WHERE phone = ?",
      [phone],
    );
    const posCustomer = queryOne(
      "SELECT discount_type, discount_value, notes FROM pos_customers WHERE phone = ?",
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
    if (posCustomer?.notes) {
      customer.notes = posCustomer.notes;
    }

    const transactions = query(
      "SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 20",
      [phone],
    );
    const orders = query(
      "SELECT * FROM pos_orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 20",
      [phone],
    );

    res.json({ customer, transactions, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
