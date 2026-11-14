/**
 * Sinh mã 6 ký tự dùng chung cho mọi loại voucher/mã trong hệ thống
 * (voucher đổi điểm ở loyalty.js, mã khách-mới ở signup-codes.js...).
 * Bỏ ký tự dễ nhìn nhầm O/0, I/1/L. Không phân biệt hoa/thường
 * (toàn hệ so mã bằng UPPER). ~887 triệu tổ hợp → hiếm trùng;
 * nơi gọi vẫn nên tự kiểm tra trùng trong DB trước khi lưu (phatVoucher tự kiểm).
 */
const { getNow, addDaysToDateString } = require('./helpers');

function generateVoucherCode() {
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // đã bỏ O,0,I,1,L
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

// ═══ VOUCHER-2 — mẫu voucher (Cài đặt → Voucher), phát từ mẫu, câu khách thấy. MỘT nơi cho quầy, App, đổi điểm, việc sau (DOI-DIEM-1…). ═══
const KIEU = ['tien', 'phan_tram', 'ship_tien', 'ship_phan_tram'];
const AP_DUNG = ['tat_ca', 'nhom', 'mon'];
const vnd = (n) => `${Math.round(Number(n) || 0).toLocaleString('vi-VN')}đ`;
const laPhanTram = (kieu) => kieu === 'phan_tram' || kieu === 'ship_phan_tram';
const laShip = (kieu) => kieu === 'ship_tien' || kieu === 'ship_phan_tram';
/** Kiểu của một MÃ đã phát (dòng pos_discount_codes) — cùng tập KIEU với mẫu. */
const kieuCuaMa = (d) => (Number(d.giam_ship) ? 'ship_' : '') + (d.discount_type === 'percent' ? 'phan_tram' : 'tien');

/** Câu khách thấy, vd "Giảm 20.000đ cho đơn từ 50.000đ · HSD 30 ngày". m: mẫu; het_han ('YYYY-MM-DD') có → HSD theo ngày (voucher đã phát). */
function moTaVoucher(m) {
  const muc = laPhanTram(m.kieu) ? `${Number(m.gia_tri)}%` : vnd(m.gia_tri);
  const cho = laShip(m.kieu) ? ' phí giao' : m.ap_dung && m.ap_dung !== 'tat_ca' ? ' cho món chọn' : '';
  const tran = laPhanTram(m.kieu) && Number(m.tran) > 0 ? ` tối đa ${vnd(m.tran)}` : '';
  const toiThieu = Number(m.don_toi_thieu) > 0 ? ` cho đơn từ ${vnd(m.don_toi_thieu)}` : '';
  const han = m.het_han ? String(m.het_han).slice(0, 10).split('-').reverse().join('/') : `${Number(m.han_ngay)} ngày`;
  return `Giảm ${muc}${cho}${tran}${toiThieu} · HSD ${han}`;
}

/** Thân yêu cầu → mẫu đã chuẩn hoá | { loi }. cu: mẫu đang có (sửa — trường thiếu giữ nguyên). Số tiền là số nguyên đồng. */
function kiemMau(b, cu = {}) {
  const lay = (x) => (b[x] !== undefined ? b[x] : cu[x]);
  const so = (x, macDinh = 0) => (lay(x) == null || lay(x) === '' ? macDinh : Number(lay(x)));
  const m = {
    ten: String(lay('ten') ?? '').trim().slice(0, 100), kieu: lay('kieu'), gia_tri: so('gia_tri', NaN), tran: so('tran'),
    don_toi_thieu: so('don_toi_thieu'), ap_dung: lay('ap_dung') || 'tat_ca', han_ngay: so('han_ngay', NaN),
    chinh_chu: lay('chinh_chu') ? 1 : 0, bat: lay('bat') === undefined ? 1 : (lay('bat') ? 1 : 0),
  };
  let ids = lay('ap_dung_ids');
  if (typeof ids === 'string') { try { ids = JSON.parse(ids); } catch { ids = null; } }
  m.ap_dung_ids = m.ap_dung === 'tat_ca' ? null : ids;
  const nguyen = (n, toiThieu) => Number.isInteger(n) && n >= toiThieu;
  const sai = !m.ten ? 'Nhập tên voucher' : !KIEU.includes(m.kieu) ? 'Kiểu voucher không hợp lệ'
    : !nguyen(m.gia_tri, 1) || (laPhanTram(m.kieu) && m.gia_tri > 100) ? 'Giá trị giảm phải là số nguyên > 0 (phần trăm không quá 100)'
      : !nguyen(m.tran, 0) || !nguyen(m.don_toi_thieu, 0) ? 'Trần giảm / đơn tối thiểu phải là số nguyên ≥ 0'
        : !nguyen(m.han_ngay, 1) || m.han_ngay > 3650 ? 'Hạn dùng phải từ 1 ngày'
          : !AP_DUNG.includes(m.ap_dung) || (laShip(m.kieu) && m.ap_dung !== 'tat_ca') ? 'Phạm vi áp dụng không hợp lệ'
            : m.ap_dung !== 'tat_ca' && !(Array.isArray(m.ap_dung_ids) && m.ap_dung_ids.length && m.ap_dung_ids.every((x) => nguyen(x, 1)))
              ? 'Chọn ít nhất một nhóm / món áp dụng' : null;
  if (sai) return { loi: { error: sai, code: 'MAU_KHONG_HOP_LE' } };
  if (m.ap_dung_ids) m.ap_dung_ids = JSON.stringify(m.ap_dung_ids);
  return { mau: m };
}

/**
 * Phát MỘT voucher từ mẫu cho SĐT, trong giao dịch `tx` của nơi gọi → { code, grant_id, het_han }. Hạn = hôm nay (giờ VN) + han_ngay.
 * Luật của mẫu chụp vào mã; dùng 1 lần. nguon: doi_diem | khach_moi | gioi_thieu | tay …; them: { reward_id, point_tx_id, nguon_id, ghi_chu, nguoi }.
 */
async function phatVoucher(tx, mau, sdt, nguon, them = {}) {
  let code = null;
  for (let i = 0; i < 5 && !code; i++) {
    const thu = generateVoucherCode();
    if (!(await tx.queryOne('SELECT id FROM pos_discount_codes WHERE UPPER(code) = UPPER(?)', [thu]))) code = thu;
  }
  if (!code) throw new Error('Không sinh được mã voucher, thử lại');
  const now = getNow();
  const hetHan = addDaysToDateString(now, Number(mau.han_ngay));
  await tx.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, valid_from, valid_to,
      is_active, notes, created_by, created_at, giam_ship, ap_dung, ap_dung_ids, chinh_chu) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
  [code, laPhanTram(mau.kieu) ? 'percent' : 'fixed', Number(mau.gia_tri), Number(mau.don_toi_thieu) || 0, Number(mau.tran) || 0, now.slice(0, 10), hetHan,
    them.ghi_chu || `Voucher ${mau.ten || ''} (${sdt})`, them.nguoi || null, now, laShip(mau.kieu) ? 1 : 0, mau.ap_dung || 'tat_ca',
    mau.ap_dung_ids || null, mau.chinh_chu ? 1 : 0]);
  const g = await tx.run(`INSERT INTO pos_voucher_grants (code, customer_phone, reward_id, status, point_tx_id, granted_at, expires_at, nguon, mau_id, nguon_id)
    VALUES (?, ?, ?, 'available', ?, ?, ?, ?, ?, ?)`, [code, sdt, them.reward_id || null, them.point_tx_id || null, now, hetHan, nguon, mau.id || null,
    them.nguon_id || null]);
  return { code, grant_id: Number(g.lastInsertRowid), het_han: hetHan };
}

// ═══ Q16 (chủ quán 13.11): phiên CHỜ CHUYỂN KHOẢN (QR payOS / ck_tay) còn hạn GIỮ voucher trong thân phiên (vouchers[] + ô mã) — như phần giữ ví
// (wallets.dangGiu): huỷ / hết hạn / chốt → tự nhả, không hẹn giờ. Phiên tiền mặt / tài khoản chốt ngay nên không giữ. ═══
const CACH_GIU_VOUCHER = ['payos', 'ck_tay'];
/** Mã (IN HOA) trong `codes` đang bị phiên KHÁC giữ. db: tx (trong giao dịch ghi) hoặc database; boPhienId: phiên đang chốt — không tính chính nó. */
async function voucherDangGiu(db, codes, boPhienId = null) {
  const can = new Set(codes.map((c) => String(c).trim().toUpperCase()));
  if (!can.size) return [];
  const ds = await db.query(`SELECT than FROM pos_phien_thanh_toan WHERE trang_thai = 'cho' AND het_han > ? AND cach IN (${CACH_GIU_VOUCHER.map(() => '?').join(', ')})
    AND id <> ?`, [getNow(), ...CACH_GIU_VOUCHER, Number(boPhienId) || 0]);
  const giu = new Set();
  for (const p of ds) {
    let t = {}; try { t = JSON.parse(p.than) || {}; } catch { /* thân hỏng: không giữ gì */ }
    for (const c of [...(Array.isArray(t.vouchers) ? t.vouchers : []), t.discount_code]) {
      const m = typeof c === 'string' ? c.trim().toUpperCase() : '';
      if (can.has(m)) giu.add(m);
    }
  }
  return [...giu];
}

/**
 * Q17 (chủ quán 13.11) — MỘT phép "voucher còn dùng được" cho ví (quầy chip + App /kh/voucher) và lúc bán (kiemVoucherDon). v: dòng ví JOIN mã
 * (code, is_active, chinh_chu, trang_thai = g.status, chu = g.customer_phone, usage_limit, used_count, valid_from, valid_to). Trả null | [code, lời].
 * homNay: ngày xét hạn (phiên đang giữ chốt → ngày tạo phiên: voucher hết hạn trong lúc giữ vẫn dùng được, Q16); boPhienId: phiên đang chốt.
 */
async function xetVoucherConDung(v, { phone, homNay, boPhienId = null } = {}) {
  if (!v || !Number(v.is_active)) return ['VOUCHER_KHONG_TON_TAI', 'Không có voucher này hoặc voucher đã tắt'];
  const { maBillCuaVoucher, kiemDonCuaMa } = require('../routes/signup-codes');   // nạp muộn: signup-codes nạp file này
  const maBill = await maBillCuaVoucher(v.code);   // P20b (Q2): voucher khách mới chỉ dùng được khi đơn gốc của mã bill còn completed + paid
  const loiGoc = maBill ? (await kiemDonCuaMa(maBill)).loi : null;
  if (loiGoc) return ['MA_DON_GOC_KHONG_HOP_LE', loiGoc.error];
  if (Number(v.chinh_chu) && v.chu !== phone) return ['VOUCHER_CHINH_CHU', 'Voucher này chỉ dùng cho chủ tài khoản'];
  if (v.trang_thai !== 'available' || (Number(v.usage_limit) > 0 && Number(v.used_count) >= Number(v.usage_limit))) return ['VOUCHER_DA_DUNG', 'Voucher đã được dùng'];
  const ngay = homNay || getNow().slice(0, 10);
  if ((v.valid_from && ngay < v.valid_from) || (v.valid_to && ngay > v.valid_to)) return ['VOUCHER_HET_HAN', 'Voucher đã hết hạn'];
  if ((await voucherDangGiu(require('../database'), [v.code], boPhienId)).length) {
    return ['VOUCHER_DANG_GIU', 'Voucher đang được giữ cho một thanh toán chuyển khoản chưa xong — đợi tiền về hoặc huỷ phiên đó'];
  }
  return null;
}

/** Quà đổi điểm (pos_reward_catalog) → mẫu cho phatVoucher: chia sẻ được, không đơn tối thiểu (hành vi /redeem trước VOUCHER-2). */
const mauTuQua = (q) => ({ ten: q.name, kieu: q.discount_type === 'percent' ? 'phan_tram' : 'tien', gia_tri: q.discount_value, tran: q.max_discount || 0,
  don_toi_thieu: 0, ap_dung: 'tat_ca', han_ngay: parseInt(q.valid_days, 10) || 30, chinh_chu: 0 });

module.exports = { generateVoucherCode, moTaVoucher, kiemMau, phatVoucher, mauTuQua, kieuCuaMa, laPhanTram, laShip, KIEU, voucherDangGiu, xetVoucherConDung, CACH_GIU_VOUCHER };
