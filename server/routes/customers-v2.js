/**
 * POS System - Customers V2 Routes
 * API tra cứu khách (merge SX + POS wallets + registrations)
 */

const express = require("express");
const { query, queryOne } = require("../database");
const { authenticate } = require("../middleware/auth");
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

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    // Tìm trong SX
    const sxResults = sxCustomers
      .filter((c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q))
      .map((c) => ({
        ...c,
        balance: walletMap[normalizePhone(c.phone)]?.balance || 0,
        source: "sx",
      }));

    // Tìm trong registrations
    const sxPhones = new Set(sxCustomers.map((c) => normalizePhone(c.phone)));
    const regResults = registrations
      .filter(
        (r) =>
          !sxPhones.has(r.phone) &&
          (r.name?.toLowerCase().includes(q) || r.phone?.includes(q)),
      )
      .map((r) => ({
        name: r.name,
        phone: r.phone,
        balance: walletMap[r.phone]?.balance || 0,
        source: "pos",
        is_pending: r.status === "pending",
      }));

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

    const walletMap = {};
    wallets.forEach((w) => (walletMap[w.phone] = w));

    const regMap = {};
    registrations.forEach((r) => (regMap[r.phone] = r));

    // Merge SX + wallets
    const result = sxCustomers.map((c) => {
      const phone = normalizePhone(c.phone);
      const wallet = walletMap[phone];
      delete regMap[phone];
      return {
        ...c,
        phone,
        balance: wallet?.balance || 0,
        source: "sx",
        is_synced: true,
      };
    });

    // Thêm pending
    Object.values(regMap).forEach((r) => {
      result.push({
        name: r.name,
        phone: r.phone,
        notes: r.notes,
        balance: walletMap[r.phone]?.balance || 0,
        source: "pos",
        is_synced: false,
        is_pending: true,
        registration_id: r.id,
        requested_product: r.requested_product,
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
