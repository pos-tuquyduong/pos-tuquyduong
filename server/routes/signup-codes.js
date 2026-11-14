/**
 * POS System - Signup Codes Routes (Bước 4 của "Ưu đãi khách mới")
 *
 * POST /claim: cửa nhận mã — khách nhập mã in trên bill lúc tạo tài khoản App KH.
 * Kiểm hạn theo cài đặt hạn mã nhandiem_han_gio (rolling từ lúc in — KH-API-2, đúng số giờ bill in) + chặn SĐT đã từng claim →
 * phát ra 1 voucher THẬT (phatVoucher) theo mẫu voucher chủ quán chọn trong Cài đặt → Voucher.
 *
 * ĐỔI THIẾT KẾ (VOUCHER-2, chủ quán Q2 11.11 + Q9 12.11 — thay luật 09.08 "mã voucher = mã in bill"): mã in bill KHÔNG còn gõ
 * thẳng ở ô mã. Chỉ SĐT có tài khoản tạo SAU lúc in bill (đăng ký lần đầu) — hoặc trong 30 phút TRƯỚC bill của chính SĐT, chưa có đơn trước
 * (Q18, kiemKhachLanDau) — mới nhận được; nhận → phatVoucher sinh MỘT voucher RIÊNG
 * theo mẫu chủ quán chọn (signup_mau_voucher_id) vào ví tài khoản (grant nguon 'khach_moi', nguon_id = dòng mã bill).
 * Voucher khách mới đã claim TRƯỚC VOUCHER-2 (mã = mã bill, không grant) vẫn dùng ở ô mã như cũ.
 *
 * ĐÃ VÁ (09.08.2026, chuẩn bị cho App KH): dùng lại đúng cơ chế `authenticateServiceOrUser`
 * đã có sẵn từ POS-1 (worker đồng bộ) — nhận header `X-Service-Key` khớp biến môi trường
 * `POS_SERVICE_API_KEY` thì coi là "service principal" (App KH backend sau này), không có
 * header đó thì rơi về xác thực JWT nhân viên bình thường (không đổi hành vi cũ ở quầy).
 */

const express = require('express');
const { query, queryOne, run, beginTransaction } = require('../database');
const { normalizePhone, getNow } = require('../utils/helpers');
const { authenticate, checkPermission, authenticateServiceOrUser } = require('../middleware/auth');
const { loiMayChu } = require('./kh/loi');
const { tienTinhDiem, truDiemHoan } = require('../utils/diemThat'); // DIEM-THAT-1: điểm gốc mã bill theo tiền khách trả thật; NAP-1: trừ phần đã trả vào tài khoản
const { docDuLieuNhanDiem, tinhDiemNhanMa } = require('../utils/nhanDiem'); // HD-1: cùng hàm với hoá đơn
const { phatVoucher, moTaVoucher, laPhanTram, laShip } = require('../utils/voucherCode'); // VOUCHER-2 (Q2): mã bill → voucher theo mẫu

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
//  POS-P20-v1 — mã in bill chỉ dùng được khi bill ĐÃ THANH TOÁN
//
//  Bill "mang ra bàn chưa thu" vẫn in mã. Trước đây khách dùng được mã (đổi
//  voucher qua /claim, nhận điểm qua /nhan-diem) khi chưa trả tiền; /claim còn
//  không đọc đơn — đơn đã huỷ vẫn claim được. Một hàm dùng chung cho CẢ HAI
//  đường (C15), gọi trước mọi lệnh ghi. Không đổi việc in mã lên bill.
//
//  POS-P20-v2 — DANH SÁCH TRẮNG (chủ quán duyệt 25.09.2026): chỉ đơn ở đúng
//  trạng thái dưới đây mới dùng được mã. Danh sách đen `status === 'cancelled'`
//  của v1 để lọt đơn 'refunded' (refunds.js duyệt hoàn tiền giữ nguyên
//  payment_status = 'paid'). Trạng thái mới sau này mặc định KHÔNG dùng được.
//
//  Trả { don } nếu dùng được, hoặc { loi: { status, code, error } }.
// ═══════════════════════════════════════════════════════════════════════════
const TRANG_THAI_DUNG_MA = { status: 'completed', payment_status: 'paid' };

async function kiemDonCuaMa(dong) {
  if (!dong.order_id) {
    return { loi: { status: 400, code: 'MA_KHONG_GAN_DON', error: 'Mã này không gắn với đơn nào.' } };
  }
  const don = await queryOne(
    'SELECT id, code, total, status, payment_status, flash_discount, cash_amount, transfer_amount, shipping_fee, balance_amount, parent_balance_amount, tien_hang_diem FROM pos_orders WHERE id = ?',
    [dong.order_id],
  );
  if (!don) {
    return { loi: { status: 404, code: 'KHONG_THAY_DON', error: 'Không tìm thấy đơn của mã này.' } };
  }
  if (don.status === TRANG_THAI_DUNG_MA.status && don.payment_status === TRANG_THAI_DUNG_MA.payment_status) {
    return { don };
  }
  // Ngoài danh sách trắng: chỉ còn việc chọn lời báo cho đúng.
  if (don.status === 'cancelled') {
    return { loi: { status: 400, code: 'DON_DA_HUY', error: 'Đơn của mã này đã bị huỷ, mã không dùng được.' } };
  }
  if (don.status === 'refunded') {
    return { loi: { status: 400, code: 'DON_DA_HOAN', error: 'Đơn của mã này đã được hoàn tiền, mã không dùng được.' } };
  }
  if (don.status !== TRANG_THAI_DUNG_MA.status) {
    return { loi: { status: 400, code: 'DON_KHONG_HOP_LE', error: 'Đơn của mã này không ở trạng thái dùng được mã.' } };
  }
  return { loi: { status: 400, code: 'BILL_CHUA_THANH_TOAN', error: 'Mã dùng được sau khi bill được thanh toán.' } };
}

// P20c — câu chiếm mã được 0 dòng có HAI lý do: mã vừa bị người khác chiếm, hoặc SĐT vừa nhận qua một
// mã KHÁC (phép chặn SĐT nằm ngay trong câu UPDATE). Đọc lại dòng SAU rollback để báo đúng lý do.
// `cotLuc` chỉ nhận hằng viết trong code ('claimed_at' / 'diem_nhan_luc'), không lấy từ request.
// P24 (D): `dongDon` (chỉ /nhan-diem truyền) → đơn vừa rời 'completed' thì báo đúng lý do của kiemDonCuaMa (DON_DA_HUY / DON_DA_HOAN).
async function baoChiemHong(res, id, cotLuc, daDung, dongDon) {
  const d = await queryOne(`SELECT ${cotLuc} AS luc FROM pos_signup_codes WHERE id = ?`, [id]);
  if (!d) return res.status(404).json({ success: false, error: 'Mã không tồn tại', code: 'MA_KHONG_TON_TAI' });
  if (d.luc) return res.status(daDung.status).json({ success: false, error: daDung.error, code: daDung.code });
  const kqDon = dongDon ? await kiemDonCuaMa(dongDon) : {};
  if (kqDon.loi) return res.status(kqDon.loi.status).json({ success: false, error: kqDon.loi.error, code: kqDon.loi.code });
  return res.status(400).json({ success: false, error: 'Số điện thoại này đã nhận ưu đãi này từ một mã bill khác.', code: 'SDT_DA_NHAN' });
}

// KH-API-1 (Q11): bill đã ghi SĐT khách lúc bán (order_customer_phone) → chỉ SĐT đó nhận được mã — /claim và /nhan-diem, mọi đường
// gọi (App, X-Service-Key, quầy). Bill không ghi SĐT (NULL, '' dữ liệu cũ): ai cầm giấy cũng nhận như trước.
function billSdtKhac(dong, phone) {
  return !!dong.order_customer_phone && normalizePhone(dong.order_customer_phone) !== phone;
}
const LOI_BILL_SDT_KHAC = { success: false, error: 'Mã này thuộc bill của số điện thoại khác.', code: 'BILL_SDT_KHAC' };

async function getSignupConfig() {
  const rows = await query(
    "SELECT key, value FROM pos_settings WHERE key LIKE 'signup_%'"
  );
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return {
    enabled: cfg.signup_enabled === '1' || cfg.signup_enabled === 'true',
    // VOUCHER-2 (Q2): voucher phát theo MẪU chủ quán chọn ở Cài đặt → Voucher (bước 026 tạo sẵn mẫu y ưu đãi giảm cả đơn đang chạy).
    mauId: Number(cfg.signup_mau_voucher_id) || 0,
  };
}

// VOUCHER-2 (Q2, Q9 chủ quán 12.11): chỉ khách "đăng ký LẦN ĐẦU" — hồ sơ khách (pos_customers) của SĐT tạo SAU lúc in bill (cùng giây vẫn được).
// Q18 (Q21 chủ quán 14.11): hồ sơ tạo TRƯỚC bill vẫn là khách mới khi đủ CẢ BA — (1) bill là đơn của chính SĐT đó; (2) SĐT chưa có đơn nào
// trước đơn in bill; (3) hồ sơ tạo trong vòng PHUT_HO_SO_TRUOC_BILL phút trước lúc in (tính cả đúng mốc). Quầy tạo hồ sơ (Thêm khách / ghi địa
// chỉ) TRƯỚC khi lưu đơn, nên khách mới thật luôn có hồ sơ sớm hơn bill vài phút.
// So chuỗi giờ VN sau khi đổi dấu cách → 'T' (dữ liệu cũ ghi 'YYYY-MM-DD HH:mm:ss'). → lỗi { status, code, error } | null.
const PHUT_HO_SO_TRUOC_BILL = 30;
function mocHoSoTruocBill(issuedAt) {
  const ms = new Date(String(issuedAt).replace(' ', 'T') + 'Z').getTime();
  return Number.isFinite(ms) ? new Date(ms - PHUT_HO_SO_TRUOC_BILL * 60000).toISOString().slice(0, 19) : '9999-12-31T23:59:59';
}
async function laDonDauCuaKhach(phone, dong) {
  if (!dong.order_customer_phone || normalizePhone(dong.order_customer_phone) !== phone) return false;
  return !(await queryOne("SELECT id FROM pos_orders WHERE customer_phone = ? AND id < ? AND status != 'cancelled' LIMIT 1", [phone, dong.order_id]));   // Q23: đơn đã huỷ không tính
}
async function kiemKhachLanDau(phone, dong) {
  const issuedAt = dong.issued_at;
  const kh = await queryOne(
    "SELECT REPLACE(created_at, ' ', 'T') >= REPLACE(?, ' ', 'T') AS sau_bill, REPLACE(created_at, ' ', 'T') >= ? AS trong_moc FROM pos_customers WHERE phone = ?",
    [issuedAt, mocHoSoTruocBill(issuedAt), phone]);
  if (!kh) return { status: 400, code: 'CAN_TAO_TAI_KHOAN', error: 'Tạo tài khoản trước rồi nhập mã.' };
  if (!Number(kh.sau_bill) && !(Number(kh.trong_moc) && await laDonDauCuaKhach(phone, dong))) {
    return { status: 400, code: 'KHACH_DA_CO_TAI_KHOAN', error: 'Số điện thoại này đã có tài khoản — ưu đãi chỉ dành cho khách đăng ký lần đầu.' };
  }
  return null;
}

// VOUCHER-2 P20b: mã voucher → dòng mã bill đã sinh ra nó ({ order_id }) | null. Voucher mới: grant nguon 'khach_moi' + nguon_id; voucher cũ
// (trước VOUCHER-2): cùng chữ với mã bill đã claim. MỘT hàm cho POST /orders (ô mã + danh sách voucher) và /discount-codes/validate.
async function maBillCuaVoucher(code) {
  return (await queryOne(
    "SELECT s.order_id FROM pos_voucher_grants g JOIN pos_signup_codes s ON s.id = g.nguon_id WHERE g.nguon = 'khach_moi' AND UPPER(g.code) = UPPER(?) LIMIT 1",
    [code])) || queryOne('SELECT order_id FROM pos_signup_codes WHERE UPPER(code) = UPPER(?) AND claimed_at IS NOT NULL', [code]);
}

// ═══════════════════════════════════════════════════════════════════════════
//  POS-NHANDIEM-v1 — ma tren bill dung de NHAN DIEM TICH LUY cua don vua mua
//
//  Doc lap hoan toan voi duong /claim (doi voucher): hai viec khac nhau, bat
//  tat rieng, danh dau bang 2 cot khac nhau. Mot ma co the dung ca hai neu
//  chu quan bat ca hai.
// ═══════════════════════════════════════════════════════════════════════════

async function docCauHinhNhanDiem() {
  const rows = await query(
    "SELECT key, value FROM pos_settings WHERE key LIKE 'nhandiem_%'",
  );
  const c = {};
  for (const r of rows) c[r.key] = r.value;
  const heSo = Number(c.nhandiem_he_so);
  const hanGio = Number(c.nhandiem_han_gio);
  return {
    bat: c.nhandiem_enabled === '1' || c.nhandiem_enabled === 'true',
    heSo: Number.isFinite(heSo) && heSo >= 1 ? heSo : 2,
    hanGio: Number.isFinite(hanGio) && hanGio > 0 ? hanGio : 24,
    chiLanDau: c.nhandiem_chi_lan_dau !== '0',
  };
}

// KH-API-1 (E6, E7): thân /nhan-diem và /claim là HÀM CÓ TÊN đặt NGAY dưới dòng gắn route — /api/kh gọi CÙNG hàm với SĐT lấy từ
// token khách. Đừng dời hàm đi chỗ khác: phép E9 / E14 của bộ kiểm cắt khối từ dòng gắn route tới route kế tiếp. Mọi lỗi 4xx có
// `code` (G); có req.khach (gọi từ App) thì lỗi máy chủ qua loiMayChu như mọi route /api/kh; route cũ trả lời báo như trước.

// POST /api/pos/signup-codes/nhan-diem
// Body: { code, phone }
router.post('/nhan-diem', authenticateServiceOrUser, nhanDiemMaBill);
async function nhanDiemMaBill(req, res) {
  try {
    const maGoc = String(req.body.code || '').trim().toUpperCase();
    const phone = normalizePhone(req.body.phone);

    if (!maGoc) return res.status(400).json({ success: false, error: 'Thiếu mã trên bill', code: 'THIEU_MA' });
    if (!phone) return res.status(400).json({ success: false, error: 'Số điện thoại không hợp lệ', code: 'SDT_KHONG_HOP_LE' });

    const ch = await docCauHinhNhanDiem();
    if (!ch.bat) {
      return res.status(400).json({
        success: false,
        error: 'Chương trình nhân điểm đang tắt.',
        code: 'NHANDIEM_DANG_TAT',
      });
    }

    const dong = await queryOne(
      'SELECT * FROM pos_signup_codes WHERE UPPER(code) = ?',
      [maGoc],
    );
    if (!dong) return res.status(404).json({ success: false, error: 'Mã không tồn tại', code: 'MA_KHONG_TON_TAI' });

    if (dong.diem_nhan_luc) {
      return res.status(400).json({
        success: false,
        error: 'Mã này đã được dùng để nhận điểm rồi.',
        code: 'MA_DA_NHAN_DIEM',
      });
    }

    // Hạn tính bằng GIỜ kể từ lúc in bill — so bằng mili-giây, không phụ thuộc chuỗi.
    const lucIn = new Date(String(dong.issued_at).replace(' ', 'T') + 'Z').getTime();
    const bayGio = new Date(getNow().replace(' ', 'T') + 'Z').getTime();
    const daQua = (bayGio - lucIn) / (1000 * 60 * 60);
    if (!Number.isFinite(daQua) || daQua > ch.hanGio) {
      return res.status(400).json({
        success: false,
        error: `Mã đã hết hạn (quá ${ch.hanGio} giờ kể từ lúc in bill).`,
        code: 'MA_HET_HAN',
      });
    }

    if (ch.chiLanDau) {
      const daNhan = await queryOne(
        'SELECT id FROM pos_signup_codes WHERE diem_nhan_phone = ? LIMIT 1',
        [phone],
      );
      if (daNhan) {
        return res.status(400).json({
          success: false,
          error: 'Số điện thoại này đã từng nhận điểm nhân từ mã bill.',
          code: 'SDT_DA_NHAN',
        });
      }
    }

    // POS-P20-v1: gắn đơn · chưa huỷ · ĐÃ THANH TOÁN — cùng một hàm với /claim.
    const kqDon = await kiemDonCuaMa(dong);
    if (kqDon.loi) {
      return res.status(kqDon.loi.status).json({ success: false, error: kqDon.loi.error, code: kqDon.loi.code });
    }
    if (billSdtKhac(dong, phone)) return res.status(400).json(LOI_BILL_SDT_KHAC);
    const don = kqDon.don;
    // HD-1: phép tính điểm nằm ở utils/nhanDiem.js — hoá đơn in cùng một hàm (P22-23: Flash 0 điểm; DIEM-THAT-1: tiền trả thật).
    // Chặn TRƯỚC câu chiếm mã: mã không bị tiêu. Đơn đã cộng điểm lúc bán (khách có cho SĐT) thì chỉ cộng BÙ phần còn thiếu.
    const { loy, daCong } = await docDuLieuNhanDiem(don.id);
    const kqDiem = tinhDiemNhanMa({ don, tienDiem: tienTinhDiem(don), ch, loy, daCong });
    if (kqDiem.loi) return res.status(kqDiem.loi.status).json({ success: false, error: kqDiem.loi.error, code: kqDiem.loi.code });
    const { diemGoc, diemCong } = kqDiem;

    const now = getNow();

    // Han diem PHAI theo dung luat cua diem ban hang (orders.js ~787): che do
    // 'quarter' thi diem het han dau quy tuong ung nam sau. De NULL thi diem tu
    // ma bill song vinh vien trong khi diem ban hang het han — cung mot bang,
    // hai luat khac nhau.
    let hanDiem = null;
    if (loy.loyalty_expiry_mode === 'quarter') {
      const y = parseInt(now.slice(0, 4), 10);
      const m = parseInt(now.slice(5, 7), 10);
      const qStart = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10;
      const mm = qStart < 10 ? '0' + qStart : '' + qStart;
      hanDiem = (y + 1) + '-' + mm + '-01T00:00:00';
    }

    let diemTru = 0;
    const tx = await beginTransaction();
    try {
      // CHIEM MA TRUOC, cong diem sau. `AND diem_nhan_luc IS NULL` la cho then
      // chot: hai nguoi nhap cung mot ma cung luc thi ca hai deu thay ma chua
      // dung (phep kiem o tren nam NGOAI giao dich), nhung chi MOT nguoi UPDATE
      // duoc — nguoi kia thay changes = 0 va bi chan. Khong co no thi ca hai
      // cung duoc cong diem.
      // P20c: chiLanDau — SĐT chưa nhận qua mã KHÁC cũng chốt NGAY trong câu này (phép kiểm SĐT ở trên nằm
      // ngoài giao dịch). Nối SAU chuỗi cũ: chuỗi `… AND diem_nhan_luc IS NULL` đang bị phép kiểm + đột biến neo.
      const chiem = await tx.run(
        `UPDATE pos_signup_codes SET diem_nhan_luc = ?, diem_nhan_phone = ?
          WHERE id = ? AND diem_nhan_luc IS NULL` +
          ' AND (? = 0 OR NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE diem_nhan_phone = ? AND id <> ?))' +
          // P24 (D): đơn còn 'completed' NGAY trong câu chiếm — phép kiểm đơn ở trên nằm ngoài giao dịch; huỷ chen giữa thì không ghi earn.
          " AND EXISTS (SELECT 1 FROM pos_orders WHERE id = ? AND status = 'completed')",
        [now, phone, dong.id, ch.chiLanDau ? 1 : 0, phone, dong.id, don.id],
      );
      if (!chiem || chiem.changes === 0) {
        await tx.rollback();
        return baoChiemHong(res, dong.id, 'diem_nhan_luc',
          { status: 400, code: 'MA_DA_NHAN_DIEM', error: 'Mã này vừa được dùng để nhận điểm.' }, dong);
      }
      await tx.run(
        `INSERT INTO pos_point_transactions
           (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at)
         VALUES (?, 'earn', ?, ?, ?, ?, ?, ?)`,
        [phone, diemCong, don.id, hanDiem,
         `Nhân ${ch.heSo} điểm từ mã bill ${maGoc} (đơn ${don.code})`,
         (req.user && req.user.username) || 'service', now],
      );
      // NAP-1 (chủ quán 07.11): đơn đã được đền / kết thúc gói (tiền trả vào tài khoản) → trừ ngay phần điểm tương ứng, CÙNG giao dịch, đúng
      // hàm của duyệt hoàn / đền bù. Báo khách số điểm cộng RÒNG (không đổi tên trường).
      diemTru = await truDiemHoan(tx, don, (req.user && req.user.username) || 'service', now, `Nhận điểm mã bill ${maGoc}`);
      // Đơn đã trả lại vào tài khoản TRỌN → ròng 0: huỷ cả giao dịch (mã và quyền nhận lần đầu không bị tiêu), cùng mã lỗi "không cộng thêm".
      if (diemCong - diemTru <= 0) {
        await tx.rollback();
        return res.status(400).json({ success: false, error: 'Tiền đơn này đã được trả lại vào tài khoản, mã không cộng thêm điểm nào.', code: 'KHONG_THEM_DIEM' });
      }
      await tx.commit();
    } catch (e) {
      try { await tx.rollback(); } catch {}
      throw e;
    }

    res.json({
      success: true,
      diem_cong: diemCong - diemTru,
      diem_goc: diemGoc,
      he_so: ch.heSo,
      het_han: hanDiem,
      da_cong_truoc_do: !!daCong,
      don: don.code,
      message: `Đã cộng ${diemCong - diemTru} điểm cho ${phone} từ đơn ${don.code}.`,
    });
  } catch (err) {
    if (req.khach) return loiMayChu(res, err, 'kh nhan-diem');
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/pos/signup-codes/claim
// Body: { code, phone }
router.post('/claim', authenticateServiceOrUser, nhanMaUuDai);
async function nhanMaUuDai(req, res) {
  try {
    const rawCode = String(req.body.code || '').trim().toUpperCase();
    const phone = normalizePhone(req.body.phone);

    if (!rawCode) {
      return res.status(400).json({ success: false, error: 'Thiếu mã ưu đãi', code: 'THIEU_MA' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Số điện thoại không hợp lệ', code: 'SDT_KHONG_HOP_LE' });
    }

    const config = await getSignupConfig();
    if (!config.enabled) {
      return res.status(400).json({ success: false, error: 'Chương trình ưu đãi khách mới hiện đang tắt', code: 'UU_DAI_DANG_TAT' });
    }

    const now = getNow();

    const signupRow = await queryOne(
      'SELECT * FROM pos_signup_codes WHERE UPPER(code) = ?',
      [rawCode]
    );
    if (!signupRow) {
      return res.status(404).json({ success: false, error: 'Mã không tồn tại', code: 'MA_KHONG_TON_TAI' });
    }
    if (signupRow.claimed_at) {
      return res.status(409).json({ success: false, error: 'Mã này đã được sử dụng', code: 'MA_DA_DUNG' });
    }

    // Hạn rolling từ lúc in — KH-API-2 (chủ quán chốt 29.10, Q1 a): số giờ = cài đặt hạn mã, ĐÚNG số bill in (orders.js), cùng
    // docCauHinhNhanDiem với /nhan-diem. So sánh bằng mili-giây, không phụ thuộc múi giờ chuỗi.
    const { hanGio } = await docCauHinhNhanDiem();
    const issuedMs = new Date(signupRow.issued_at.replace(' ', 'T') + 'Z').getTime();
    const nowMs = new Date(now.replace(' ', 'T') + 'Z').getTime();
    const hoursPassed = (nowMs - issuedMs) / (1000 * 60 * 60);
    if (!Number.isFinite(hoursPassed) || hoursPassed > hanGio) {
      return res.status(400).json({ success: false, error: `Mã đã hết hạn (quá ${hanGio} giờ kể từ lúc in)`, code: 'MA_HET_HAN' });
    }

    // Chặn theo SĐT (không theo mã) — 1 SĐT chỉ claim được đúng 1 lần trong đời, bất kể mã nào.
    // Phép này chỉ để báo sớm; câu chiếm mã trong giao dịch mới là chốt (P20c).
    const claimedBefore = await queryOne(
      'SELECT id FROM pos_signup_codes WHERE claimed_phone = ? LIMIT 1',
      [phone]
    );
    if (claimedBefore) {
      return res.status(400).json({ success: false, error: 'Số điện thoại này đã từng nhận ưu đãi khách mới', code: 'SDT_DA_NHAN' });
    }

    // POS-P20-v1: gắn đơn · chưa huỷ · ĐÃ THANH TOÁN — cùng một hàm với /nhan-diem.
    // Đặt sau các phép kiểm hạn / SĐT (thứ tự lời báo giống /nhan-diem), TRƯỚC khi phát voucher.
    const kqDon = await kiemDonCuaMa(signupRow);
    if (kqDon.loi) {
      return res.status(kqDon.loi.status).json({ success: false, error: kqDon.loi.error, code: kqDon.loi.code });
    }
    if (billSdtKhac(signupRow, phone)) return res.status(400).json(LOI_BILL_SDT_KHAC);

    // VOUCHER-2 (Q2, Q9 chủ quán 11–12.11): chỉ khách đăng ký LẦN ĐẦU (kiemKhachLanDau — luật Q9 + Q18); voucher theo MẪU ở Cài đặt → Voucher.
    // Báo TRƯỚC khi chiếm mã — mã bill chưa bị chiếm, khách tạo tài khoản rồi nhập lại được.
    const loiKhach = await kiemKhachLanDau(phone, signupRow);
    if (loiKhach) return res.status(loiKhach.status).json({ success: false, error: loiKhach.error, code: loiKhach.code });
    const mau = config.mauId ? await queryOne('SELECT * FROM pos_mau_voucher WHERE id = ? AND bat = 1', [config.mauId]) : null;
    if (!mau) {
      return res.status(400).json({ success: false, error: 'Quán chưa chọn mẫu voucher cho ưu đãi khách mới — báo quầy giúp mình.', code: 'UU_DAI_CHUA_CO_MAU' });
    }

    // Giao dịch NGUYÊN TỬ — chiếm mã + phát voucher (phatVoucher: MỘT mã RIÊNG vào ví tài khoản, hạn tính từ lúc phát; mã in bill không còn là mã
    // giảm), lỗi bất kỳ bước nào → huỷ sạch (đúng khuôn loyalty.js /redeem, không để mã "claimed" mồ côi không có voucher).
    let phat = null;
    const tx = await beginTransaction();
    try {
      // POS-P20-v2: CHIẾM MÃ bằng `AND claimed_at IS NULL` + đọc changes — cùng
      // khuôn /nhan-diem. Phép kiểm claimed_at ở trên nằm NGOÀI giao dịch; hai
      // người claim cùng lúc đều qua được nó, chỉ lệnh UPDATE này phân xử.
      // P20c: SĐT chưa claim qua mã KHÁC cũng chốt ở đây (cùng điều kiện với phép kiểm SĐT ở trên). Nối SAU
      // chuỗi cũ: chuỗi `… AND claimed_at IS NULL` đang bị phép kiểm + đột biến neo.
      const chiem = await tx.run(
        'UPDATE pos_signup_codes SET claimed_at = ?, claimed_phone = ? WHERE id = ? AND claimed_at IS NULL' +
          ' AND NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE claimed_phone = ? AND id <> ?)',
        [now, phone, signupRow.id, phone, signupRow.id]
      );
      if (!chiem || chiem.changes !== 1) {
        await tx.rollback();
        return baoChiemHong(res, signupRow.id, 'claimed_at',
          { status: 409, code: 'MA_DA_DUNG', error: 'Mã này vừa được sử dụng.' });
      }
      phat = await phatVoucher(tx, mau, phone, 'khach_moi', { nguon_id: signupRow.id, ghi_chu: `Ưu đãi khách mới — mã bill ${signupRow.code}` });
      await tx.commit();
    } catch (txErr) {
      await tx.rollback();
      throw txErr;
    }

    res.json({
      success: true,
      data: {
        voucher_code: phat.code,   // VOUCHER-2: mã MỚI trong ví tài khoản (không còn là mã in bill)
        discount_type: laPhanTram(mau.kieu) ? 'percent' : 'fixed',
        discount_value: Number(mau.gia_tri),
        // Loại theo MẪU thật (vòng sửa 1, lỗi soát (4) — từng viết cứng 'order'): ship → 'ship'; nhóm / món chọn → 'item'; tất cả → 'order'.
        scope: laShip(mau.kieu) ? 'ship' : (mau.ap_dung || 'tat_ca') !== 'tat_ca' ? 'item' : 'order',
        kieu: mau.kieu,
        ap_dung: laShip(mau.kieu) ? 'tat_ca' : mau.ap_dung || 'tat_ca',
        valid_to: phat.het_han,
        mo_ta: moTaVoucher({ ...mau, het_han: phat.het_han }),
      },
    });
  } catch (err) {
    if (req.khach) return loiMayChu(res, err, 'kh nhan-ma-bill');
    console.error('Signup code claim error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/pos/signup-codes — danh sách mã cho owner xem trong app (Cài đặt).
// Query: ?claimed=true để chỉ lấy các mã đã claim (dùng cho màn quản lý SĐT).
router.get('/', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    let sql = 'SELECT * FROM pos_signup_codes';
    const params = [];
    if (req.query.claimed === 'true') {
      sql += ' WHERE claimed_phone IS NOT NULL';
    }
    sql += ' ORDER BY COALESCE(claimed_at, issued_at) DESC LIMIT 500';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List signup codes error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pos/signup-codes/:id/reset — HOÀN TÁC 1 lần claim (dọn dữ liệu test).
// Làm 2 việc NGUYÊN TỬ trong 1 transaction: (1) gỡ claimed_at/claimed_phone khỏi
// pos_signup_codes để SĐT claim lại được, (2) XOÁ voucher đã phát ra lúc claim (chỉ khi voucher
// CHƯA dùng — P20c) — nếu không làm bước 2, voucher cũ vẫn còn dùng được dù đã "hoàn tác",
// vì bước thanh toán không hề biết tới bảng này.
router.post('/:id/reset', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const signupRow = await queryOne('SELECT * FROM pos_signup_codes WHERE id = ?', [req.params.id]);
    if (!signupRow) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy mã' });
    }
    if (!signupRow.claimed_at) {
      return res.status(400).json({ success: false, error: 'Mã này chưa được claim, không cần hoàn tác' });
    }

    // An toàn: không hoàn tác nếu voucher đã THẬT SỰ được dùng trong 1 đơn hàng (used_count > 0)
    // — tránh xoá mất dấu vết 1 giao dịch thật đã xảy ra chỉ vì bấm nhầm nút hoàn tác.
    // VOUCHER-2 (Q2): voucher của lần nhận này = grant nguon 'khach_moi' + nguon_id (mới nhất); dữ liệu cũ: mã cùng chữ mã bill.
    const voucherRow = (await queryOne(`SELECT d.id, d.used_count, g.id AS grant_id FROM pos_voucher_grants g JOIN pos_discount_codes d
        ON UPPER(d.code) = UPPER(g.code) WHERE g.nguon = 'khach_moi' AND g.nguon_id = ? ORDER BY g.id DESC LIMIT 1`, [signupRow.id]))
      || await queryOne('SELECT id, used_count FROM pos_discount_codes WHERE UPPER(code) = UPPER(?)', [signupRow.code]);
    if (voucherRow && voucherRow.used_count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Voucher này đã được dùng trong ít nhất 1 đơn hàng thật — không thể hoàn tác tự động, liên hệ kỹ thuật nếu chắc chắn cần xử lý.',
      });
    }

    const tx = await beginTransaction();
    try {
      // P20c: gỡ ĐÚNG lần claim đã đọc ở trên (cùng claimed_at VÀ claimed_phone — getNow() chỉ tới giây, một mình
      // claimed_at không phân biệt được hai lần claim trong cùng giây; `IS ?` để dòng claimed_phone NULL vẫn khớp). Hai lần
      // hoàn tác chồng nhau, hoặc hoàn tác rồi khách claim lại xen giữa → lần sau thấy 0 dòng và dừng, không gỡ claim / xoá
      // voucher của lần claim mới. CÙNG SĐT claim lại trong CÙNG giây thì câu này không phân biệt được — câu xoá voucher theo id
      // bên dưới chặn (MA-GIAM-1).
      const go = await tx.run(
        'UPDATE pos_signup_codes SET claimed_at = NULL, claimed_phone = NULL WHERE id = ? AND claimed_at = ? AND claimed_phone IS ?',
        [signupRow.id, signupRow.claimed_at, signupRow.claimed_phone]
      );
      if (go.changes === 0) {
        await tx.rollback();
        return res.status(409).json({ success: false, error: 'Mã này vừa được hoàn tác hoặc claim lại — tải lại danh sách rồi thử lại.' });
      }
      // XOÁ HẲN (không chỉ vô hiệu hoá) — vì mã voucher = đúng mã in-bill (thiết kế "1 mã
      // xuyên suốt"), nếu chỉ tắt is_active thì dòng cũ vẫn tồn tại, sẽ bị lớp chống-trùng-mã
      // (chặn claim nếu mã đã có trong pos_discount_codes) chặn nhầm khi claim lại lần 2.
      // P20c: chỉ xoá voucher CHƯA dùng — phép kiểm ở trên nằm NGOÀI giao dịch, voucher có thể vừa được dùng ở
      // POST /orders. COALESCE: NULL tính như 0 — như phép kiểm `used_count > 0` ở trên (NULL qua phép đó). Có voucher mà không
      // xoá được → dừng. Không có voucher CÙNG MÃ (xoá tay; claim trước 09.08 phát voucher mã khác — không đụng tới)
      // → bỏ bước xoá, hoàn tác như cũ. MA-GIAM-1: xoá theo ID voucher đọc ở trên, không theo mã — voucher cùng chữ của lần claim
      // khác (cùng giây) hoặc chen vào giữa chừng không bị xoá nhầm.
      const xoa = voucherRow
        ? await tx.run('DELETE FROM pos_discount_codes WHERE id = ? AND COALESCE(used_count, 0) = 0', [voucherRow.id])
        : { changes: 0 };
      // VOUCHER-2: xoá dòng ví của voucher — chỉ khi còn 'available' (vừa dùng ở đơn khác → dừng).
      const xoaVi = voucherRow?.grant_id
        ? await tx.run("DELETE FROM pos_voucher_grants WHERE id = ? AND status = 'available'", [voucherRow.grant_id]) : { changes: 1 };
      if (voucherRow && (xoa.changes === 0 || xoaVi.changes === 0)) {
        await tx.rollback();
        return res.status(400).json({ success: false, error: 'Voucher này vừa được dùng trong 1 đơn hàng — không hoàn tác.' });
      }
      await tx.commit();
    } catch (txErr) {
      await tx.rollback();
      throw txErr;
    }

    const ai = signupRow.claimed_phone ? `SĐT ${signupRow.claimed_phone}` : 'mã này';
    res.json({ success: true, message: `Đã hoàn tác — ${ai} có thể claim lại${voucherRow ? ', voucher cũ đã xoá' : ''}` });
  } catch (err) {
    console.error('Reset signup code error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.kiemDonCuaMa = kiemDonCuaMa; // P20b: POST /orders dùng CÙNG phép kiểm đơn gốc (khuôn wallets.js)
module.exports.maBillCuaVoucher = maBillCuaVoucher; // VOUCHER-2 P20b: voucher → mã bill sinh ra nó (orders.js, discount-codes.js)
module.exports.nhanMaUuDai = nhanMaUuDai;     // KH-API-1: /api/kh/nhan-ma-bill
module.exports.nhanDiemMaBill = nhanDiemMaBill; // KH-API-1: /api/kh/nhan-diem
module.exports.docCauHinhNhanDiem = docCauHinhNhanDiem; // P22-23: bill in hệ số CÙNG hàm với /nhan-diem
