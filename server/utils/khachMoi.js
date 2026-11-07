/**
 * KHACH-APP-1 (C) — MỘT hàm tạo khách cho MỌI đường ghi pos_customers của POS: quầy (POST /customers + người nhận, POST /:id/children),
 * "Thêm khách" (POST /registrations), ghi địa chỉ / ghi chú cho SĐT chưa là khách (customers-v2.js), App (maKhach.js xacMinhMa) và bước
 * chép lần cuối (nang_cap/020, 021). Ngoài: sync.js POST /import (nhập file SX — để việc sau).
 * - SĐT: normalizePhone + isValidPhone (cùng cặp chuanSdt của App). Tên trim, không rỗng.
 * - Mặc định (chủ quán Q2 07.11): customer_type 'retail' → sync_status 'retail_only'; loại khác → 'new' (sync.js xuất sang SX như cũ).
 *   Bước chép SX truyền rõ sync_status / sx_status.
 * - QR: sinhQrKhongTrung. Trùng SĐT chặn TRONG câu ghi (ON CONFLICT(phone) DO NOTHING + changes) — không kiểm-rồi-ghi; trùng qr_code
 *   KHÔNG bị nuốt (ném lỗi thật).
 * `db` = module database hoặc giao dịch `tx` (App tạo khách trong giao dịch chiếm mã). → { khach } | { trung: true, khach } | { loi }
 */
const csdl = require('../database');
const { normalizePhone, isValidPhone, getNow, sinhQrKhongTrung } = require('./helpers');

const LOAI_MAC_DINH = 'retail';

async function taoKhach(k, db = csdl) {
  const phone = typeof k.phone === 'string' ? normalizePhone(k.phone) : null;
  if (!phone || !isValidPhone(phone)) return { loi: 'SDT_KHONG_HOP_LE' };
  const name = typeof k.name === 'string' ? k.name.trim() : '';
  if (!name) return { loi: 'TEN_TRONG' };
  const loai = k.customer_type || LOAI_MAC_DINH;
  const kq = await db.run(`INSERT INTO pos_customers (phone, name, notes, parent_phone, relationship, xung_ho, address, qr_code,
      customer_type, sync_status, sx_status, requested_product, requested_cycles, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(phone) DO NOTHING`, [
    phone, name, k.notes || null, k.parent_phone ? normalizePhone(k.parent_phone) : null, k.relationship || null,
    k.xung_ho || null, k.address || null, await sinhQrKhongTrung(db.queryOne),
    loai, k.sync_status || (loai === 'retail' ? 'retail_only' : 'new'), k.sx_status || null,
    k.requested_product || null, k.requested_cycles || null, k.created_by || null, getNow()]);
  const khach = await db.queryOne('SELECT * FROM pos_customers WHERE phone = ?', [phone]);
  return kq.changes === 1 ? { khach } : { trung: true, khach };
}

module.exports = { taoKhach };
