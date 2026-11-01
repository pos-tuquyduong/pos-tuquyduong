/**
 * KH-SDT-1 — dọn dữ liệu thử trước khai trương (chỉ chủ quán, chạy một lần). Chủ quán chốt 01.11: liệt kê → tải danh sách → tải sao
 * lưu → gõ CHU_XAC_NHAN → dọn. MỘT hàm chọn dòng (`chonDong`) cho cả liệt kê và dọn — dọn chọn lại TRONG giao dịch và so `ma_xac_nhan`
 * (băm tiêu chí + mọi id), dữ liệu đổi giữa hai bước → 409.
 *
 * Tiêu chí (hợp hai phần):
 *  - truoc_ngay X (< hôm nay): đơn tạo trước X + dòng gắn đơn; điểm không gắn đơn, voucher, mã / lần thử App trước X.
 *    KHÔNG xoá hồ sơ khách, ví, sổ ví, gói / thẻ không gắn đơn theo ngày (hồ sơ có thể là khách thật).
 *  - sdt [..]: mọi đơn + mọi dòng của số đó (hồ sơ, ví 0, sổ ví, điểm, voucher, gói, thẻ, đăng ký, mã bill đã nhận, mã App).
 * Giữ lại (chỉ liệt kê): SĐT ví ≠ 0 (cả đơn số đó trả hộ) · đơn có phiên thanh toán (tiền ngân hàng) · đơn hôm nay (mã đơn = số lớn
 * nhất trong ngày + 1). Không bao giờ dọn: đối soát, payOS, phiên, đơn App, PIN, kho, sản phẩm, cài đặt, nhân viên.
 * Điểm âm sau dọn → từ chối (DIEM_AM). Nhật ký + bản chụp nguyên dòng: pos_sync_logs type 'don_thu' (bảng đã nằm trong sao lưu).
 */
const crypto = require('crypto');
const { beginTransaction, query } = require('../database');
const { getNow, getToday } = require('./helpers');

const CHU_XAC_NHAN = 'DON DU LIEU THU';
const VI_KHAC_0 = 'SELECT phone FROM pos_wallets WHERE balance <> 0';

// Bảng gắn đơn qua order_id (con có khoá ngoại tới pos_orders đứng trước — khoá ngoại đang bật).
const BANG_THEO_DON = ['pos_order_items', 'pos_refund_requests', 'pos_damage_logs', 'pos_promotion_usage', 'pos_invoice_logs',
  'pos_order_log', 'pos_membership_purchases', 'pos_customer_packages', 'pos_point_transactions', 'pos_balance_transactions', 'pos_signup_codes'];
// Theo ngày X: [bảng, cột SĐT, cột giờ, có order_id] — dòng gắn đơn chỉ đi theo đơn.
const BANG_THEO_NGAY = [['pos_point_transactions', 'customer_phone', 'created_at', true], ['pos_voucher_grants', 'customer_phone', 'granted_at', false],
  ['pos_kh_ma_dang_nhap', 'sdt', 'tao_luc', false], ['pos_kh_lan_thu', 'sdt', 'tao_luc', false]];
// Theo SĐT: [bảng, các cột SĐT, có order_id] — dòng gắn đơn KHÔNG dọn chỉ đi khi đơn đó dọn.
const BANG_THEO_SDT = [['pos_customers', ['phone'], false], ['pos_wallets', ['phone'], false], ['pos_registrations', ['phone'], false],
  ['pos_voucher_grants', ['customer_phone'], false], ['pos_kh_ma_dang_nhap', ['sdt'], false], ['pos_kh_lan_thu', ['sdt'], false],
  ['pos_signup_codes', ['claimed_phone', 'diem_nhan_phone'], false], ['pos_point_transactions', ['customer_phone'], true],
  ['pos_balance_transactions', ['customer_phone'], true], ['pos_customer_packages', ['customer_phone'], true],
  ['pos_membership_purchases', ['customer_phone'], true]];
const THU_TU_XOA = [...BANG_THEO_DON, 'pos_voucher_grants', 'pos_discount_codes', 'pos_kh_ma_dang_nhap', 'pos_kh_lan_thu',
  'pos_registrations', 'pos_wallets', 'pos_customers', 'pos_orders'];

const loi = (status, code, error) => ({ loi: { status, code, error } });
const trong = (ids) => `(${ids.map(Number).join(',')})`;
const dau = (ds) => ds.map(() => '?').join(', ');

function chuanSdt(v) {
  let s = String(v ?? '').replace(/[\s.\-]/g, '');
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  return /^0\d{9,10}$/.test(s) ? s : null;
}

/** Thân yêu cầu → { tieuChi: { truoc_ngay, sdt } } hoặc { loi }. Cùng một kiểm cho liệt kê và dọn. */
function docTieuChi(than, homNay) {
  const ngay = than.truoc_ngay;
  let truocNgay = null;
  if (ngay !== undefined && ngay !== null && ngay !== '') {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(ngay)) ? new Date(ngay + 'T00:00:00Z') : null;
    if (!d || isNaN(d) || d.toISOString().slice(0, 10) !== ngay || ngay >= homNay) {
      return loi(400, 'NGAY_KHONG_HOP_LE', 'Ngày phải đúng dạng và TRƯỚC hôm nay (đơn hôm nay không dọn được)');
    }
    truocNgay = ngay;
  }
  if (than.sdt !== undefined && !Array.isArray(than.sdt)) return loi(400, 'SDT_KHONG_HOP_LE', 'Danh sách SĐT không hợp lệ');
  const sdt = [];
  for (const v of than.sdt || []) {
    const s = chuanSdt(v);
    if (!s) return loi(400, 'SDT_KHONG_HOP_LE', `SĐT không hợp lệ: ${String(v).slice(0, 20)}`);
    if (!sdt.includes(s)) sdt.push(s);
  }
  if (!truocNgay && !sdt.length) return loi(400, 'TIEU_CHI_TRONG', 'Chọn ngày hoặc nhập ít nhất một SĐT thử');
  return { tieuChi: { truoc_ngay: truocNgay, sdt } };
}

/** Chọn mọi dòng sẽ dọn. `q` = kết nối thường (liệt kê) hoặc giao dịch (dọn). Không ghi gì. */
async function chonDong(q, { truoc_ngay: X, sdt: L }, homNay) {
  const vi = await q.query('SELECT phone, balance FROM pos_wallets WHERE balance <> 0');
  const baoVe = new Set(vi.map((v) => v.phone));
  const P = L.filter((s) => !baoVe.has(s));
  const ung = await q.query(`SELECT id, code, created_at, customer_phone, parent_phone, total, status FROM pos_orders
    WHERE created_at < ? AND (${X ? 'created_at < ?' : '0'}${L.length ? ` OR customer_phone IN (${dau(L)})` : ''}) ORDER BY id`,
    [homNay, ...(X ? [X] : []), ...L]);
  const coPhien = new Set((await q.query(`SELECT DISTINCT order_id FROM pos_phien_thanh_toan WHERE order_id IN ${trong(ung.map((o) => o.id))}`))
    .map((r) => Number(r.order_id)));
  const giuDon = [], don = [];
  for (const o of ung) {
    const lyDo = baoVe.has(o.customer_phone) ? `SĐT ${o.customer_phone} còn số dư ví`
      : baoVe.has(o.parent_phone) ? `Người trả hộ ${o.parent_phone} còn số dư ví`
        : coPhien.has(Number(o.id)) ? 'Có phiên thanh toán (tiền ngân hàng) — không dọn' : '';
    (lyDo ? giuDon : don).push(lyDo ? { code: o.code, created_at: o.created_at, ly_do: lyDo } : o);
  }
  const O = trong(don.map((o) => o.id));
  const ids = new Map(THU_TU_XOA.map((t) => [t, new Set()]));
  const gom = async (t, sql, args = []) => { for (const r of await q.query(`SELECT id FROM ${t} WHERE ${sql}`, args)) ids.get(t).add(Number(r.id)); };
  for (const o of don) ids.get('pos_orders').add(Number(o.id));
  for (const t of BANG_THEO_DON) await gom(t, `order_id IN ${O}`);
  if (X) {
    for (const [t, cot, gio, coDon] of BANG_THEO_NGAY) {
      await gom(t, `${gio} < ? AND (${cot} IS NULL OR ${cot} NOT IN (${VI_KHAC_0}))${coDon ? ' AND order_id IS NULL' : ''}`, [X]);
    }
  }
  if (P.length) {
    for (const [t, cots, coDon] of BANG_THEO_SDT) {
      await gom(t, `(${cots.map((c) => `${c} IN (${dau(P)})`).join(' OR ')})${coDon ? ` AND (order_id IS NULL OR order_id IN ${O})` : ''}`,
        cots.flatMap(() => P));
    }
  }
  // Mã giảm riêng của voucher / mã bill bị dọn (cùng code — loyalty.js, signup-codes.js).
  const maGiam = [...new Set([
    ...(await q.query(`SELECT code FROM pos_voucher_grants WHERE id IN ${trong([...ids.get('pos_voucher_grants')])}`)),
    ...(await q.query(`SELECT code FROM pos_signup_codes WHERE id IN ${trong([...ids.get('pos_signup_codes')])}`)),
  ].map((r) => String(r.code).toUpperCase()))];
  if (maGiam.length) await gom('pos_discount_codes', `UPPER(code) IN (${dau(maGiam)})`, maGiam);

  const diemChon = trong([...ids.get('pos_point_transactions')]);
  const diemAm = (await q.query(`SELECT customer_phone AS phone,
      SUM(CASE WHEN id IN ${diemChon} THEN 0 ELSE points END) AS con_lai FROM pos_point_transactions
    WHERE customer_phone IN (SELECT customer_phone FROM pos_point_transactions WHERE id IN ${diemChon}) GROUP BY customer_phone`))
    .filter((r) => Number(r.con_lai) < 0).map((r) => ({ phone: r.phone, con_lai: Number(r.con_lai) }));

  const tieuChi = { truoc_ngay: X, sdt: P };
  const idTheoBang = Object.fromEntries(THU_TU_XOA.map((t) => [t, [...ids.get(t)].sort((a, b) => a - b)]).filter(([, a]) => a.length));
  const viLienQuan = new Set([...L, ...ung.flatMap((o) => [o.customer_phone, o.parent_phone])]);
  return {
    tieu_chi: tieuChi,
    so_dong: Object.fromEntries(Object.entries(idTheoBang).map(([t, a]) => [t, a.length])),
    tong_dong: Object.values(idTheoBang).reduce((s, a) => s + a.length, 0),
    don: don.map(({ id, code, created_at, customer_phone, total, status }) => ({ id, code, created_at, customer_phone, total, status })),
    tong_tien: don.reduce((s, o) => s + Number(o.total || 0), 0),
    sdt: P,
    giu_lai: { vi: vi.filter((v) => viLienQuan.has(v.phone)), don: giuDon },
    diem_am: diemAm,
    ma_xac_nhan: crypto.createHash('sha256').update(JSON.stringify({ tieuChi, idTheoBang })).digest('hex'),
    idTheoBang,
  };
}

async function lietKe(than) {
  const homNay = getToday();
  const tc = docTieuChi(than, homNay);
  if (tc.loi) return tc;
  const { idTheoBang, ...kq } = await chonDong({ query }, tc.tieuChi, homNay);
  return kq;
}

/** Dọn trong MỘT giao dịch: chọn lại, so mã, chụp nguyên dòng, xoá, ghi nhật ký. Hỏng ở bất kỳ bước nào → không xoá gì. */
async function donDuLieuThu(than, nguoi) {
  const homNay = getToday();
  const tc = docTieuChi(than, homNay);
  if (tc.loi) return tc;
  if (than.go_xac_nhan !== CHU_XAC_NHAN) return loi(400, 'CHU_XAC_NHAN_SAI', `Gõ đúng "${CHU_XAC_NHAN}" để dọn`);
  const tx = await beginTransaction();
  try {
    const c = await chonDong(tx, tc.tieuChi, homNay);
    let tra = null;
    if (c.ma_xac_nhan !== than.ma_xac_nhan) tra = loi(409, 'DANH_SACH_DA_DOI', 'Dữ liệu đã đổi từ lúc liệt kê — liệt kê lại, tải lại danh sách rồi dọn');
    else if (c.diem_am.length) tra = loi(409, 'DIEM_AM', 'Có SĐT sẽ bị điểm âm — thêm số đó vào danh sách SĐT hoặc đổi ngày');
    else if (!c.tong_dong) tra = { da_don: 0, so_dong: {} };
    if (tra) { await tx.rollback(); return tra; }
    const banChup = {};
    for (const [t, a] of Object.entries(c.idTheoBang)) banChup[t] = await tx.query(`SELECT * FROM ${t} WHERE id IN ${trong(a)} ORDER BY id`);
    const goi = trong(c.idTheoBang.pos_customer_packages || []);
    const boGoi = await tx.query(`SELECT id AS order_id, customer_package_id FROM pos_orders WHERE customer_package_id IN ${goi}
      AND id NOT IN ${trong(c.idTheoBang.pos_orders || [])}`);
    if (boGoi.length) await tx.run(`UPDATE pos_orders SET customer_package_id = NULL WHERE id IN ${trong(boGoi.map((r) => r.order_id))}`);
    for (const t of THU_TU_XOA) {
      const a = c.idTheoBang[t];
      if (!a) continue;
      const r = await tx.run(`DELETE FROM ${t} WHERE id IN ${trong(a)}`);
      if (r.changes !== a.length) throw new Error(`${t}: xoá ${r.changes}/${a.length} dòng`);
    }
    const nk = await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at)
      VALUES ('don_thu', ?, ?, 'success', ?, ?)`,
      [c.tong_dong, JSON.stringify({ tieu_chi: c.tieu_chi, so_dong: c.so_dong, bo_goi: boGoi, ban_chup: banChup }), nguoi, getNow()]);
    await tx.commit();
    return { da_don: c.tong_dong, so_dong: c.so_dong, nhat_ky_id: nk.lastInsertRowid, ban_chup: banChup };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

module.exports = { CHU_XAC_NHAN, lietKe, donDuLieuThu };
