/**
 * KH-API-2 (F) — giờ hoạt động của quán (chủ quán chốt 28.10). MỘT file quyết "quán đang mở?" — /api/kh/gio-hoat-dong đọc, KH-MUA-1 chặn
 * đơn App theo `nhan_don` (NGOAI_GIO_HOAT_DONG). Quầy KHÔNG bị chặn.
 * Hàm thuần: không đọc DB, không đọc đồng hồ — người gọi truyền `bayGio` (getNow, giờ VN `YYYY-MM-DDTHH:mm:ss`). Ngày tính bằng Date.UTC
 * trên chuỗi giờ VN → kết quả không phụ thuộc TZ máy chủ (Render chạy UTC).
 * Cài đặt ở pos_settings (seed ở database.js):
 *   gio_hd_lich             JSON { "2": { mo, dong } | { nghi: true }, …, "8": … } — thứ 2–7 = Thứ Hai–Thứ Bảy, 8 = Chủ nhật; '' = chưa cài
 *                           (mở cả ngày). dong < mo = qua nửa đêm (mở 18:00, đóng 02:00 → 01:00 hôm sau còn mở theo lịch hôm trước).
 *   gio_hd_ngay_nghi        JSON [{ ngay: 'YYYY-MM-DD', ly_do }] — nghỉ cả ngày (bỏ ca BẮT ĐẦU ngày đó)
 *   gio_hd_thong_bao        câu ngoài giờ, `{gio_mo_lai}` tự điền giờ mở lại
 *   gio_hd_ngung_truoc_phut App ngừng nhận đơn trước giờ đóng N phút (mặc định 0)
 */
const THU = [2, 3, 4, 5, 6, 7, 8];
const KHOA = ['gio_hd_lich', 'gio_hd_ngay_nghi', 'gio_hd_thong_bao', 'gio_hd_ngung_truoc_phut'];
const NGUNG_TOI_DA = 600;
const SO_NGAY_DO = 400;   // tìm giờ mở lại tối đa ngần này ngày (nghỉ dài hơn → mo_lai_luc null)
const CHUA_CO_LICH = '(chưa có lịch)';   // điền vào {gio_mo_lai} khi không tìm được giờ mở lại
const GIO_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const ms = (ngay) => Date.UTC(+ngay.slice(0, 4), +ngay.slice(5, 7) - 1, +ngay.slice(8, 10));
const congNgay = (ngay, n) => new Date(ms(ngay) + n * 86400000).toISOString().slice(0, 10);
const laNgay = (s) => typeof s === 'string' && /^\d{4}-\d\d-\d\d$/.test(s) && congNgay(s, 0) === s;
/** Thứ của ngày: 2–7 = Thứ Hai–Thứ Bảy, 8 = Chủ nhật. */
const thuCua = (ngay) => { const d = new Date(ms(ngay)).getUTCDay(); return d === 0 ? 8 : d + 1; };
const truPhut = (gio, phut) => new Date(Date.parse(gio + 'Z') - phut * 60000).toISOString().slice(0, 19);
const docJson = (s, macDinh) => { try { return JSON.parse(s); } catch { return macDinh; } };

/** Lỗi của một ô lịch / null. */
function loiNgayLich(d) {
  if (d && d.nghi === true && Object.keys(d).length === 1) return null;
  if (!d || !GIO_HHMM.test(d.mo) || !GIO_HHMM.test(d.dong)) return 'giờ mở / đóng phải dạng HH:mm (00:00–23:59) hoặc nghỉ cả ngày';
  return d.mo === d.dong ? 'giờ mở và giờ đóng không được trùng' : null;
}

/** Kiểm các khoá gio_hd_* trong thân PUT /settings → lời báo lỗi đầu tiên, hoặc null. Khoá khác bỏ qua. */
function kiemCaiDat(settings) {
  for (const [key, v] of Object.entries(settings)) {
    if (!key.startsWith('gio_hd_')) continue;
    const s = String(v);
    if (!KHOA.includes(key)) return `Không có cài đặt ${key}`;
    if (key === 'gio_hd_lich' && s !== '') {
      const lich = docJson(s, null);
      if (!lich || typeof lich !== 'object' || Array.isArray(lich)) return 'Lịch tuần hỏng';
      if (Object.keys(lich).sort().join() !== THU.join()) return 'Lịch tuần phải đủ 7 ngày (thứ 2 → Chủ nhật)';
      for (const t of THU) { const l = loiNgayLich(lich[t]); if (l) return `Lịch ${t === 8 ? 'Chủ nhật' : 'thứ ' + t}: ${l}`; }
    }
    if (key === 'gio_hd_ngay_nghi') {
      const ds = docJson(s, null);
      if (!Array.isArray(ds) || !ds.every((d) => d && laNgay(d.ngay) && typeof d.ly_do === 'string' && d.ly_do.length <= 200)) {
        return 'Ngày nghỉ phải là danh sách { ngay: YYYY-MM-DD có thật, ly_do ≤ 200 ký tự }';
      }
    }
    if (key === 'gio_hd_thong_bao' && s.length > 300) return 'Câu thông báo tối đa 300 ký tự';
    if (key === 'gio_hd_ngung_truoc_phut' && !(/^\d+$/.test(s) && Number(s) <= NGUNG_TOI_DA)) return `Số phút ngừng nhận đơn phải từ 0 đến ${NGUNG_TOI_DA}`;
  }
  return null;
}

/** Map khoá → giá trị (pos_settings) → cài đặt đã đọc. Dữ liệu hỏng (nhập tay) coi như chưa cài — quán không bị "đóng" oan. */
function docCaiDat(m) {
  const lich = m.gio_hd_lich ? docJson(m.gio_hd_lich, null) : null;
  const ngayNghi = docJson(m.gio_hd_ngay_nghi || '[]', []);
  const ngung = Number(m.gio_hd_ngung_truoc_phut);
  return {
    lich: lich && typeof lich === 'object' && THU.every((t) => !loiNgayLich(lich[t])) ? lich : null,
    ngayNghi: Array.isArray(ngayNghi) ? ngayNghi.filter((d) => d && laNgay(d.ngay)) : [],
    thongBao: typeof m.gio_hd_thong_bao === 'string' ? m.gio_hd_thong_bao : '',
    ngungTruocPhut: Number.isInteger(ngung) && ngung > 0 ? ngung : 0,
  };
}

/** Ca mở BẮT ĐẦU trong ngày `ngay` → { mo, dong } giờ đầy đủ; nghỉ → null. Chưa cài lịch → cả ngày. */
function caCuaNgay(ngay, cd) {
  if (cd.ngayNghi.some((d) => d.ngay === ngay)) return null;
  if (!cd.lich) return { mo: `${ngay}T00:00:00`, dong: `${congNgay(ngay, 1)}T00:00:00` };
  const d = cd.lich[thuCua(ngay)];
  return d.nghi ? null : khungGio(ngay, d.mo, d.dong);
}

/** Khung HH:mm bắt đầu ngày `ngay` → giờ đầy đủ; dong ≤ mo = qua nửa đêm (đóng hôm sau). */
function khungGio(ngay, mo, dong) {
  return { mo: `${ngay}T${mo}:00`, dong: `${dong > mo ? ngay : congNgay(ngay, 1)}T${dong}:00` };
}

/** Khung HH:mm lặp hằng ngày (giờ vàng): khung qua nửa đêm mà bây giờ còn trước giờ kết thúc → khung bắt đầu từ hôm qua. */
function khungHangNgay(bayGio, mo, dong) {
  const ngay = bayGio.slice(0, 10);
  return khungGio(mo > dong && bayGio.slice(11, 16) < dong ? congNgay(ngay, -1) : ngay, mo, dong);
}

/** Giờ đóng THẬT của ca: ca bắt đầu trong ngày đóng mở lúc / trước khi ca này đóng và đóng muộn hơn (nối liền: chưa cài lịch, lịch 00:00 nối
 *  tiếp; chồng nhau) thì nối — MỘT hàm cho `nhan_don` và `hom_nay.dong`, "ngừng trước N phút" không cắt oan giữa hai ca liền. */
function dongThat(ca, cd) {
  let dong = ca.dong;
  for (let i = 0; i <= SO_NGAY_DO; i++) {
    const tiep = caCuaNgay(dong.slice(0, 10), cd);
    if (!tiep || tiep.mo > dong || tiep.dong <= dong) break;
    dong = tiep.dong;
  }
  return dong;
}

/** Quán có đang mở lúc `bayGio` không. `nhan_don` = mở VÀ còn trước (giờ đóng thật − N phút). hom_nay = ca đang mở, không thì ca của hôm nay,
 *  `dong` là giờ đóng thật. */
function dangMo(bayGio, cd) {
  const ngay = bayGio.slice(0, 10);
  const trong = (ca) => ca && ca.mo <= bayGio && bayGio < ca.dong;
  const homQua = caCuaNgay(congNgay(ngay, -1), cd), homNay = caCuaNgay(ngay, cd);
  const ca = trong(homQua) ? homQua : trong(homNay) ? homNay : null;
  let moLai = null;
  if (!ca) {
    for (let i = 0; i <= SO_NGAY_DO && !moLai; i++) {
      const c = caCuaNgay(congNgay(ngay, i), cd);
      if (c && c.mo > bayGio) moLai = c.mo;
    }
  }
  const goc = ca || homNay, dong = goc && dongThat(goc, cd);   // MỘT giờ đóng thật cho nhan_don và hom_nay
  return {
    dang_mo: !!ca,
    nhan_don: !!ca && bayGio < truPhut(dong, cd.ngungTruocPhut),
    hom_nay: cd.lich && goc ? { mo: goc.mo, dong } : null,
    mo_lai_luc: moLai,
    thong_bao: ca ? '' : cd.thongBao.replace(/\{gio_mo_lai\}/g, moLai ? inGioMoLai(moLai, ngay) : CHUA_CO_LICH),
  };
}

/** 'HH:mm' nếu mở lại cùng ngày, không thì 'HH:mm DD/MM'. */
const inGioMoLai = (gio, ngay) => gio.slice(11, 16) + (gio.slice(0, 10) === ngay ? '' : ` ${gio.slice(8, 10)}/${gio.slice(5, 7)}`);

/** Thân câu trả lời GET /api/kh/gio-hoat-dong. */
function traGioHoatDong(bayGio, cd) {
  return {
    bay_gio: bayGio,
    ...dangMo(bayGio, cd),
    lich_tuan: THU.map((thu) => {
      const d = cd.lich && cd.lich[thu];
      return { thu, mo: d && !d.nghi ? d.mo : null, dong: d && !d.nghi ? d.dong : null, nghi: !!(d && d.nghi) };
    }),
    ngay_nghi: cd.ngayNghi.filter((d) => d.ngay >= bayGio.slice(0, 10)).sort((a, b) => (a.ngay < b.ngay ? -1 : 1))
      .map((d) => ({ ngay: d.ngay, ly_do: d.ly_do || '' })),
  };
}

module.exports = { thuCua, kiemCaiDat, docCaiDat, khungHangNgay, dangMo, traGioHoatDong };
