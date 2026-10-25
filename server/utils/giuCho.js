/**
 * P3 — phiên thanh toán: GIỮ tiền tài khoản (khách / mẹ) cho một đơn đang lập, rồi CHỐT bằng ĐÚNG đường tạo đơn của quầy (taoDon).
 * - Tạo phiên: thân đơn lọc theo danh sách TRẮNG (mọi trường tiền do phiên quyết), tổng do taoDon chế độ "chỉ tính" ra; PIN của CHỦ
 *   tài khoản bị trừ (Q4); số dư + đang giữ đọc TRONG giao dịch ghi — hai quầy cùng giữ trên một ví thì quầy sau thấy phần đã giữ.
 * - Chốt (tiền mặt / tài khoản / payOS / xác nhận tay): MỘT hàm chotPhien → MỘT cổng cho → da_thu (còn hạn) trong giao dịch tạo đơn.
 * - Hết hạn = tự nhả theo đồng hồ (Render ngủ, không hẹn giờ); huỷ / hết hạn không ghi dòng tiền nào.
 */
const { queryOne, run } = require('../database');
const { getNow, normalizePhone } = require('./helpers');
const { trongGiaoDich, dangGiu } = require('../routes/wallets');
const { taoDon } = require('../routes/orders');
const { ghiNhatKy, tien } = require('./nhatKyDon');
const { kiemPin } = require('./pinKhach');
const payos = require('./payos');

const HAN_PHUT = 10;
const NOI_DUNG_TOI_DA = 9;   // payOS: nội dung CK ≤ 9 ký tự với tài khoản ngân hàng không liên kết (chủ quán chốt Q5) — dài hơn thì báo, không cắt
const CACH = ['payos', 'ck_tay', 'tien_mat', 'tai_khoan'];
const TRUONG_DON = ['customer_phone', 'customer_name', 'items', 'discount_code', 'discount_reason', 'notes', 'is_new_customer',
  'shipping_fee', 'customer_package_id', 'package_buy', 'membership_buy'];
const GIO = "strftime('%Y-%m-%dT%H:%M:%S', ?, ?)";
const loi = (status, code, error) => ({ status, body: { error, code } });
// res giả gom status + thân — gọi taoDon ngoài một yêu cầu HTTP của chính nó (webhook, tạo phiên).
const gomRes = () => ({ statusCode: 200, body: undefined, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } });

const tomPhien = (p, order = null) => ({
  id: p.id, cach: p.cach, trang_thai: p.trang_thai === 'cho' && p.het_han <= getNow() ? 'het_han' : p.trang_thai,
  tong: p.tong, giu_vi: p.giu_vi, giu_vi_me: p.giu_vi_me, con_lai: p.con_lai, het_han: p.het_han,
  noi_dung: p.noi_dung, qr: p.qr, checkout_url: p.checkout_url, order,
});

async function taoPhien(b, nguoi) {
  const { cach } = b;
  if (!CACH.includes(cach)) return loi(400, 'CACH_KHONG_HOP_LE', 'Cách trả phải là payos, ck_tay, tien_mat hoặc tai_khoan');
  if (cach === 'payos' && !payos.daCauHinh()) return loi(503, 'PAYOS_CHUA_CAU_HINH', 'Chưa cài khoá payOS — dùng QR tĩnh của quán (xác nhận tay)');
  const goc = b.don && typeof b.don === 'object' ? b.don : {};
  const don = Object.fromEntries(TRUONG_DON.filter((x) => goc[x] !== undefined).map((x) => [x, goc[x]]));
  const phone = normalizePhone(don.customer_phone), phoneMe = b.tru_tai_khoan_me ? normalizePhone(goc.parent_phone) : null;
  if ((b.tru_tai_khoan && !phone) || (b.tru_tai_khoan_me && !phoneMe)) return loi(400, 'CAN_KHACH', 'Trừ tài khoản cần chọn khách (và SĐT mẹ)');
  if (phoneMe) don.parent_phone = phoneMe;
  const r = gomRes();
  const tinh = await taoDon({ body: don, user: { username: nguoi } }, r, { chiTinh: true });
  if (r.body !== undefined) return { status: r.statusCode, body: r.body };
  const tong = Math.round(tinh.total);
  // PIN kiểm NGOÀI giao dịch (bcrypt chậm — không giữ khoá ghi).
  for (const [co, sdt, pin] of [[b.tru_tai_khoan, phone, b.pin], [b.tru_tai_khoan_me, phoneMe, b.pin_me]]) {
    if (!co) continue;
    const kq = await kiemPin(sdt, pin);
    if (kq.loi) return loi(...kq.loi);
  }
  const now = getNow();
  const kq = await trongGiaoDich(async (tx) => {
    const khaDung = async (sdt) => Math.max(0,
      Number((await tx.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0) - await dangGiu(tx, sdt));
    const giu = b.tru_tai_khoan ? Math.min(await khaDung(phone), tong) : 0;
    const giuMe = phoneMe ? Math.min(await khaDung(phoneMe), tong - giu) : 0;
    const conLai = tong - giu - giuMe;
    if (cach === 'tai_khoan' && conLai > 0) return { huy: true, ...loi(400, 'SO_DU_KHONG_DU', 'Tài khoản không đủ trả cả đơn') };
    if (cach !== 'tai_khoan' && conLai === 0) return { huy: true, ...loi(400, 'CACH_KHONG_KHOP', 'Tài khoản đã trả đủ — chọn trả đủ bằng tài khoản') };
    const ins = await tx.run(`INSERT INTO pos_phien_thanh_toan (than, tong, phone, giu_vi, phone_me, giu_vi_me, con_lai, cach, het_han, nguoi_tao, tao_luc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${GIO}, ?, ?)`, [JSON.stringify(don), tong, phone || null, giu, phoneMe, giuMe, conLai, cach, now, `+${HAN_PHUT} minutes`, nguoi, now]);
    const id = Number(ins.lastInsertRowid);
    if (cach !== 'payos') return { id };
    const noiDung = 'TQD' + id;
    if (noiDung.length > NOI_DUNG_TOI_DA) return { huy: true, ...loi(409, 'MA_PHIEN_QUA_DAI', 'Mã phiên vượt 6 chữ số — nội dung chuyển khoản quá 9 ký tự, báo chủ quán') };
    await tx.run('UPDATE pos_phien_thanh_toan SET ma_payos = ?, noi_dung = ? WHERE id = ?', [id, noiDung, id]);
    return { id };
  });
  if (kq.huy) return { status: kq.status, body: kq.body };
  let phien = await queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [kq.id]);
  if (cach === 'payos') {
    try {
      const link = await payos.taoLink({ orderCode: phien.ma_payos, amount: phien.con_lai, description: phien.noi_dung,
        expiredAt: Math.floor(Date.now() / 1000) + HAN_PHUT * 60 });
      await run('UPDATE pos_phien_thanh_toan SET qr = ?, checkout_url = ? WHERE id = ?', [link.qr, link.checkout_url, phien.id]);
      phien = { ...phien, ...link };
    } catch (e) {
      console.error('payOS tạo link lỗi:', e.message);
      await run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi' WHERE id = ? AND trang_thai = 'cho'", [phien.id]);   // nhả phần giữ
      return loi(502, 'PAYOS_LOI', 'payOS không tạo được QR — thử lại, hoặc dùng QR tĩnh của quán');
    }
  }
  return { status: 200, body: { success: true, phien: tomPhien(phien) } };
}

/** Chốt phiên qua taoDon. nguon: tien_mat · tai_khoan · payos · tay. them: { khachDua, nguoi, lyDo, suKien(tx) — ghi trong giao dịch }. */
async function chotPhien(phien, nguon, them = {}) {
  // Báo sớm theo trạng thái vừa đọc (khỏi tính lại đơn); cổng THẬT là câu ghi cho → da_thu trong giao dịch (vaoGiaoDich).
  if (phien.trang_thai !== 'cho' || phien.het_han <= getNow()) return loi(409, 'PHIEN_DA_CHOT', 'Phiên thanh toán đã chốt, đã huỷ hoặc đã hết hạn');
  const cachTra = phien.cach === 'tien_mat' ? 'cash' : phien.cach === 'tai_khoan' ? 'balance' : 'transfer';
  const khachDua = cachTra === 'cash' ? Number(them.khachDua ?? phien.con_lai) : 0;
  const body = { ...JSON.parse(phien.than), payment_method: cachTra, balance_amount: phien.giu_vi, parent_balance_amount: phien.giu_vi_me,
    cash_amount: cachTra === 'cash' ? phien.con_lai : 0, transfer_amount: cachTra === 'transfer' ? phien.con_lai : 0,
    cash_received: khachDua, change_amount: cachTra === 'cash' ? khachDua - phien.con_lai : 0 };
  const r = gomRes();
  await taoDon({ body, user: { username: them.nguoi || phien.nguoi_tao } }, r, {
    id: phien.id,
    vaoGiaoDich: async (tx, now) => {
      const cong = await tx.run(`UPDATE pos_phien_thanh_toan SET trang_thai = 'da_thu', nguon = ?, ly_do = ?, nguoi_xac_nhan = ?, luc_chot = ?
        WHERE id = ? AND trang_thai = 'cho' AND het_han > ?`, [nguon, them.lyDo || null, nguon === 'tay' ? them.nguoi : null, now, phien.id, now]);
      if (cong.changes !== 1) return false;
      if (them.suKien) await them.suKien(tx);
      return true;
    },
    sauGhiDon: async (tx, orderId) => {
      await tx.run('UPDATE pos_phien_thanh_toan SET order_id = ? WHERE id = ?', [orderId, phien.id]);
      if (nguon === 'tay') {
        await ghiNhatKy(orderId, 'xac_nhan_ck_tay', `Xác nhận tay chuyển khoản ${tien(phien.con_lai)} — ${them.lyDo}`, them.nguoi,
          { phien: phien.id, so_tien: phien.con_lai, ly_do: them.lyDo }, tx);
      }
    },
  });
  // Chốt hỏng vì ĐƠN (giá / hàng / mã đổi — 4xx của taoDon, không phải cổng hay kho bận) → phiên 'loi': thôi giữ, không chốt lại được.
  if (r.statusCode >= 400 && r.statusCode < 500 && !['PHIEN_DA_CHOT', 'KHO_BAN'].includes(r.body?.code)) {
    await run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi', ly_do = ? WHERE id = ? AND trang_thai = 'cho'",
      [String(r.body?.code || r.body?.error || '').slice(0, 200), phien.id]);
  }
  return { status: r.statusCode, body: r.body };
}

module.exports = { taoPhien, chotPhien, tomPhien, HAN_PHUT };
