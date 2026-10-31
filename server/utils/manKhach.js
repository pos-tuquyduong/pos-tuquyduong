/**
 * MANKHACH-1 — màn khách (máy tính bảng quay về phía khách) ghép với máy quầy. Chỉ HIỂN THỊ: không ghi tiền / đơn / phiên.
 * - Quầy xin mã ghép 6 số (có hạn); màn khách nhập mã → máy chủ cấp khoá riêng, kho chỉ giữ BĂM của khoá.
 * - "Quầy X đang hiện gì": quầy báo id phiên QR; trạng thái luôn suy từ HÀNG PHIÊN thật (chờ → thu · vừa thu → cảm ơn · còn lại → rảnh),
 *   nên huỷ / hết hạn / chốt không cần quầy báo thêm. Danh sách món do máy chủ tự dựng lại từ giỏ đã lưu của phiên (không tin màn hình).
 * - Số tiền, mã QR lấy NGUYÊN từ phiên; màn khách không tính gì.
 */
const crypto = require('crypto');
const { query, queryOne, run } = require('../database');
const { getNow } = require('./helpers');
const { gomRes } = require('./giuCho');
const { readFlashState } = require('./flashState');
const { layMenuQuay } = require('../routes/products');
const { taoDon } = require('../routes/orders');

const SO_CHU_SO_MA = 6;
const HAN_MA_PHUT = 10;              // mã ghép sống bao lâu; quầy mở lại màn là được mã mới
const CAM_ON_GIAY = 8;               // "Cảm ơn" hiện bao lâu sau khi chốt
const TOI_DA_SAI = 5;                // số lần nhập sai mã / cửa sổ / IP
const CUA_SO_SAI_PHUT = 10;
const BO_NHO_MENU_GIAY = 20;         // menu hỏi SX có tốn kém → nhiều màn cùng đọc một bản
const TOI_DA_TRANG = 12;
const GIAY_TOI_THIEU = 3;
const GIAY_TOI_DA = 120;
const TIEU_DE_TOI_DA = 80;
const NOI_DUNG_TOI_DA = 500;
const TEN_MAY_TOI_DA = 40;
const DIA_CHI_TOI_DA = 300;
const LOAI_TRANG = ['menu', 'flash', 'qr_app', 'chu', 'anh'];
const TRANG_MAC_DINH = [{ loai: 'menu', giay: 15 }, { loai: 'flash', giay: 10 }, { loai: 'qr_app', giay: 10 }];

const loi = (status, code, error) => ({ loi: { status, code, error } });
const bam = (khoa) => crypto.createHash('sha256').update(String(khoa)).digest('hex');
const epoch = (gio) => Date.parse(gio + 'Z') / 1000;                       // giờ VN không hậu tố → số giây (chỉ để TRỪ nhau)
const cong = (giay) => new Date(Date.parse(getNow() + 'Z') + giay * 1000).toISOString().slice(0, 19);

// ── Mã ghép ──────────────────────────────────────────────────────────────────
async function capMaMoi(quayId) {
  const dangDung = new Set((await query('SELECT ma FROM pos_man_khach_quay WHERE ma_het_han > ? AND id != ?', [getNow(), quayId])).map((r) => r.ma));
  let ma;
  do { ma = String(crypto.randomInt(0, 10 ** SO_CHU_SO_MA)).padStart(SO_CHU_SO_MA, '0'); } while (dangDung.has(ma));
  await run('UPDATE pos_man_khach_quay SET ma = ?, ma_het_han = ? WHERE id = ?', [ma, cong(HAN_MA_PHUT * 60), quayId]);
}

async function bangQuay(quayId) {
  const q = await queryOne('SELECT id, ma, ma_het_han FROM pos_man_khach_quay WHERE id = ?', [quayId]);
  const may = await query('SELECT id, ten, tao_luc FROM pos_man_khach_may WHERE quay_id = ? AND thu_hoi_luc IS NULL ORDER BY id', [quayId]);
  return { success: true, quay_id: q.id, ma: q.ma, ma_het_han: q.ma_het_han, may };
}

/** Quầy mở màn: quay_id lạ / không gửi → tạo quầy mới. Còn hạn → giữ mã; hết hạn → cấp mã mới. */
async function moQuay(quayId) {
  let q = typeof quayId === 'string' && quayId ? await queryOne('SELECT id, ma_het_han FROM pos_man_khach_quay WHERE id = ?', [quayId]) : null;
  if (!q) {
    const id = crypto.randomBytes(8).toString('hex');
    await run("INSERT INTO pos_man_khach_quay (id, ma, ma_het_han, tao_luc) VALUES (?, '', '', ?)", [id, getNow()]);
    q = { id, ma_het_han: '' };
  }
  if (q.ma_het_han <= getNow()) await capMaMoi(q.id);
  return bangQuay(q.id);
}

async function doiMa(quayId) {
  if (!await queryOne('SELECT id FROM pos_man_khach_quay WHERE id = ?', [quayId])) return loi(404, 'KHONG_THAY_QUAY', 'Không tìm thấy máy quầy này — mở lại màn Bán hàng');
  await capMaMoi(quayId);
  return bangQuay(quayId);
}

// ── Ghép máy (công khai, chống dò mã theo IP) ────────────────────────────────
const lanSai = new Map();   // ip → { n, tu } (tu = mốc bắt đầu cửa sổ, ms)
function dangBiChan(ip) {
  const e = lanSai.get(ip);
  if (!e) return false;
  if (Date.now() - e.tu > CUA_SO_SAI_PHUT * 60000) { lanSai.delete(ip); return false; }
  return e.n >= TOI_DA_SAI;
}
function ghiSai(ip) {
  if (lanSai.size > 1000) lanSai.clear();   // chặn phình bộ nhớ khi bị quét từ nhiều IP
  const e = lanSai.get(ip);
  lanSai.set(ip, e ? { n: e.n + 1, tu: e.tu } : { n: 1, tu: Date.now() });
}

async function ghep(ma, ten, ip) {
  if (dangBiChan(ip)) return loi(429, 'QUA_NHIEU_LAN', 'Nhập sai quá nhiều lần — đợi vài phút rồi thử lại');
  const q = typeof ma === 'string' && /^\d+$/.test(ma) ? await queryOne('SELECT id FROM pos_man_khach_quay WHERE ma = ? AND ma_het_han > ?', [ma, getNow()]) : null;
  if (!q) { ghiSai(ip); return loi(400, 'MA_GHEP_SAI', 'Mã ghép không đúng hoặc đã hết hạn — xem mã mới ở góc màn Bán hàng'); }
  lanSai.delete(ip);
  const khoa = crypto.randomBytes(24).toString('hex');
  const tenGon = (typeof ten === 'string' ? ten.trim() : '').slice(0, TEN_MAY_TOI_DA) || 'Màn khách';
  await run('INSERT INTO pos_man_khach_may (quay_id, ten, khoa_bam, tao_luc) VALUES (?, ?, ?, ?)', [q.id, tenGon, bam(khoa), getNow()]);
  return { khoa, ten: tenGon };
}

/** Khoá màn khách → máy đã ghép, hoặc lý do từ chối. */
async function xacThucKhoa(khoa) {
  const may = typeof khoa === 'string' && khoa ? await queryOne('SELECT id, quay_id, thu_hoi_luc FROM pos_man_khach_may WHERE khoa_bam = ?', [bam(khoa)]) : null;
  if (!may) return loi(401, 'KHOA_KHONG_HOP_LE', 'Màn khách chưa được ghép');
  if (may.thu_hoi_luc) return loi(401, 'KHOA_THU_HOI', 'Màn khách đã bị thu hồi — ghép lại bằng mã mới');
  return { may };
}

const danhSachMay = () => query('SELECT id, quay_id, ten, tao_luc FROM pos_man_khach_may WHERE thu_hoi_luc IS NULL ORDER BY id');
async function thuHoiMay(id, nguoi) {
  const r = await run('UPDATE pos_man_khach_may SET thu_hoi_luc = ?, thu_hoi_boi = ? WHERE id = ? AND thu_hoi_luc IS NULL', [getNow(), nguoi, id]);
  if (!r.changes && !await queryOne('SELECT id FROM pos_man_khach_may WHERE id = ?', [id])) return loi(404, 'KHONG_THAY_MAY', 'Không tìm thấy màn khách này');
  return { ok: true };
}

// ── Menu (dùng chung layMenuQuay, có bộ nhớ ngắn) ────────────────────────────
let boNhoMenu = { luc: 0, ds: [] };
async function layMenu() {
  if (Date.now() - boNhoMenu.luc < BO_NHO_MENU_GIAY * 1000) return boNhoMenu.ds;
  const ds = (await layMenuQuay()).filter((p) => p.sellable)
    .map((p) => ({ key: p.unique_id, ten: p.name, gia: p.price, nhom: p.category || '', het: !p.khong_quan_kho && p.stock_quantity === 0 }));
  boNhoMenu = { luc: Date.now(), ds };
  return ds;
}

// ── Bản hiển thị của phiên (dựng một lần khi quầy báo) ───────────────────────
/** Dựng lại giỏ bằng ĐÚNG đường tính của máy chủ; lệch tổng với phiên (Giờ vàng đổi…) → bỏ danh sách, chỉ giữ tổng. */
async function dungHien(phien, nguoi) {
  const than = JSON.parse(phien.than);
  const hien = { mon: null, tam_tinh: null, giam: [], ten_khach_goc: String(than.customer_name || '').trim() || null };
  try {
    const r = gomRes();
    const tinh = await taoDon({ body: { ...than }, user: { username: nguoi } }, r, { chiTinh: true, tinhThu: true });
    if (r.body !== undefined || Math.round(tinh.total) !== phien.tong) return hien;
    const ct = tinh.chiTiet;
    const sp = new Map((await query('SELECT id, name, sx_product_type, sx_product_id FROM pos_products')).map((p) => [p.id, p]));
    const menu = new Map((await layMenu()).map((m) => [m.key, m.ten]));
    hien.mon = ct.items.map((it) => {
      const p = sp.get(it.product_id);
      return { ten: menu.get(`${p?.sx_product_type}_${p?.sx_product_id}`) || p?.name || 'Món', so_luong: it.quantity, thanh_tien: Math.round(it.unit_price * it.quantity) };
    });
    hien.tam_tinh = Math.round(ct.subtotal);
    for (const [ten, tien] of [['Giờ vàng', ct.flash_discount], [ct.customer_tier ? `Hạng ${ct.customer_tier}` : 'Hạng thành viên', ct.tier_discount],
      [ct.discount_code ? `Mã ${ct.discount_code}` : 'Ưu đãi', ct.discount_amount]]) if (tien > 0) hien.giam.push({ ten, tien: Math.round(tien) });
  } catch (e) { console.error('Màn khách: không dựng được danh sách món:', e.message); }
  return hien;
}

async function baoPhien(quayId, phienId, nguoi) {
  if (!await queryOne('SELECT id FROM pos_man_khach_quay WHERE id = ?', [quayId])) return loi(404, 'KHONG_THAY_QUAY', 'Không tìm thấy máy quầy này — mở lại màn Bán hàng');
  const phien = await queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [phienId]);
  if (!phien) return loi(404, 'KHONG_THAY_PHIEN', 'Không tìm thấy phiên thanh toán');
  await run('UPDATE pos_man_khach_quay SET phien_id = ?, hien = ? WHERE id = ?', [phien.id, JSON.stringify(await dungHien(phien, nguoi)), quayId]);
  return { ok: true };
}

// ── Trạng thái cho màn khách ─────────────────────────────────────────────────
async function trangThai(quayId) {
  const bay = getNow();
  const goc = { success: true, che_do: 'ranh', gio_vn: bay };
  const q = await queryOne('SELECT phien_id, hien FROM pos_man_khach_quay WHERE id = ?', [quayId]);
  const p = q?.phien_id ? await queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [q.phien_id]) : null;
  if (!p) return goc;
  if (p.trang_thai === 'cho' && p.het_han > bay && p.qr) {
    const h = JSON.parse(q.hien || '{}');
    const hienTen = (await queryOne("SELECT value FROM pos_settings WHERE key = 'man_khach_hien_ten'"))?.value === '1';
    return { ...goc, che_do: 'thu', thu: { phien_id: p.id, qr: p.qr, noi_dung: p.noi_dung, tong: p.tong, con_lai: p.con_lai, tru_tai_khoan: p.giu_vi + p.giu_vi_me,
      con_giay: Math.max(0, Math.round(epoch(p.het_han) - epoch(bay))), mon: h.mon, tam_tinh: h.tam_tinh, giam: h.giam || [], ten_khach: hienTen ? h.ten_khach_goc : null } };
  }
  if (p.trang_thai === 'da_thu' && p.luc_chot && epoch(bay) - epoch(p.luc_chot) <= CAM_ON_GIAY) return { ...goc, che_do: 'cam_on', cam_on: { so_tien: p.con_lai } };
  return goc;
}

// ── Nội dung lúc rảnh + cài đặt ──────────────────────────────────────────────
const docJson = (s) => { try { return JSON.parse(s); } catch { return undefined; } };
const laDiaChiWeb = (s) => /^https?:\/\/\S+$/i.test(s) && s.length <= DIA_CHI_TOI_DA;

/** Kiểm các khoá man_khach_* của PUT /settings: trả lời báo lỗi (tiếng Việt) hoặc null. Sai một khoá → settings.js không ghi khoá nào. */
function kiemCaiDat(settings) {
  if ('man_khach_hien_ten' in settings && !['0', '1'].includes(String(settings.man_khach_hien_ten))) return 'Cài đặt hiện tên khách trên màn khách chỉ nhận 0 hoặc 1';
  if ('man_khach_dia_chi_app' in settings) {
    const d = String(settings.man_khach_dia_chi_app ?? '').trim();
    if (d && !laDiaChiWeb(d)) return 'Địa chỉ App phải bắt đầu bằng http:// hoặc https://';
  }
  if ('man_khach_trang' in settings) {
    const ds = docJson(String(settings.man_khach_trang ?? ''));
    if (!Array.isArray(ds) || ds.length > TOI_DA_TRANG) return `Danh sách trang màn khách phải là danh sách tối đa ${TOI_DA_TRANG} trang`;
    for (const t of ds) {
      if (!t || typeof t !== 'object' || !LOAI_TRANG.includes(t.loai)) return 'Có trang màn khách thuộc loại không biết';
      if (typeof t.bat !== 'boolean') return 'Mỗi trang màn khách phải có bật / tắt';
      if (!Number.isInteger(t.giay) || t.giay < GIAY_TOI_THIEU || t.giay > GIAY_TOI_DA) return `Số giây mỗi trang từ ${GIAY_TOI_THIEU} đến ${GIAY_TOI_DA}`;
      if (t.loai === 'anh' && t.bat) return 'Trang ảnh chưa dùng được (chờ chỗ lưu ảnh) — để tắt';
      if (t.tieu_de != null && (typeof t.tieu_de !== 'string' || t.tieu_de.length > TIEU_DE_TOI_DA)) return `Tiêu đề tối đa ${TIEU_DE_TOI_DA} ký tự`;
      if (t.noi_dung != null && (typeof t.noi_dung !== 'string' || t.noi_dung.length > NOI_DUNG_TOI_DA)) return `Nội dung tối đa ${NOI_DUNG_TOI_DA} ký tự`;
    }
  }
  return null;
}

async function noiDung() {
  const cai = Object.fromEntries((await query("SELECT key, value FROM pos_settings WHERE key IN ('man_khach_trang', 'man_khach_dia_chi_app')")).map((r) => [r.key, r.value]));
  const ds = Array.isArray(docJson(cai.man_khach_trang)) ? docJson(cai.man_khach_trang) : TRANG_MAC_DINH.map((t) => ({ ...t, bat: true }));
  const trang = ds.filter((t) => t.bat).map((t) => ({ loai: t.loai, giay: t.giay, tieu_de: t.tieu_de || '', noi_dung: t.noi_dung || '' }));
  const menu = await layMenu();
  const f = await readFlashState(query, getNow);
  const dangChay = !!(f.is_flash_now && f.percent > 0 && f.product_keys.length);
  const ten = new Map(menu.map((m) => [m.key, m.ten]));
  return { success: true, trang, menu: menu.map(({ key, ...m }) => m), dia_chi_app: (cai.man_khach_dia_chi_app || '').trim(),
    flash: dangChay ? { dang_chay: true, phan_tram: f.percent, den: f.end, mon: f.product_keys.map((k) => ten.get(k)).filter(Boolean) } : { dang_chay: false } };
}

module.exports = { moQuay, doiMa, ghep, xacThucKhoa, danhSachMay, thuHoiMay, baoPhien, trangThai, noiDung, kiemCaiDat };
