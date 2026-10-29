/**
 * hoaDon.js — dựng nội dung hoá đơn bố cục mới từ dữ liệu của GET /api/pos/hoa-don/:id (HD-1).
 *
 * HÀM THUẦN: đầu vào là dữ liệu hoá đơn (máy chủ tính, ở đây KHÔNG tính tiền) + cài đặt, đầu ra là danh sách dòng cần vẽ.
 * Không chạm DOM, mạng, đồng hồ. Phần vẽ nằm ở components/InvoicePreview.jsx (HoaDonTo). Bài thử: cong_cu/thu_HD1.js.
 * Chữ: mỗi chữ một khoá `invoice_chu_<khoá>`, ẩn = `invoice_an_<khoá>`; thiếu khoá → chữ cũ (store_*, invoice_thank_you…) → mặc định ở đây.
 */

export const GIOI_HAN_CHU = 42;   // giấy 58 mm
export const GIOI_HAN_TEM = 40;   // khớp TEM_TOI_DA_KY_TU của inPhieu.js
export const SO_TO_MAC_DINH = 2;
export const KHOA_DIA_CHI_KH = 'invoice_kh_url';
export const KHOA_SO_TO = 'invoice_so_to';
// Máy chủ (routes/hoaDon.js KHONG_AN_DUOC) giữ bản sao của danh sách này — bài thử so hai bên.
export const KHONG_AN = [
  'ten_quan', 'so_bill', 'lien_khach', 'lien_luu', 'in_lai', 'da_huy', 'da_hoan',
  'gia_goc', 'giam_hang', 'giam_flash', 'giam_ma', 'phi_giao', 'tong',
  'tieu_de_tt', 'tu_tk', 'tu_tk_me', 'ck', 'tm', 'ghi_no', 'dua_tra',
  'tem_in_lai',
];

export const CHU_MAC_DINH = {
  ten_quan: 'TỨ QUÝ ĐƯỜNG', dia_chi: '', so_bill: 'SỐ BILL', lien_khach: 'GIAO KHÁCH', lien_luu: 'LƯU QUẦY',
  chu_qr: 'Quét để đăng ký tài khoản — mã điểm điền sẵn',
  gia_goc: 'Giá gốc', giam_hang: 'Giảm hạng {hang} {phan_tram}%', giam_flash: 'Giảm Flash sale', giam_ma: 'Giảm mã / quà',
  phi_giao: 'Phí giao Ahamove', tong: 'TỔNG HÓA ĐƠN',
  tieu_de_tt: 'THANH TOÁN', tu_tk: 'Từ tài khoản', tu_tk_me: 'Từ tài khoản mẹ', ck: 'Chuyển khoản (payOS)', tm: 'Tiền mặt',
  ghi_no: 'Ghi nợ', dua_tra: 'Khách đưa / Trả lại',
  tieu_de_diem: 'ĐIỂM THƯỞNG', diem_truoc: 'Điểm trước đơn', diem_doi: 'Đổi quà', diem_cong: 'Cộng đơn này', diem_co: 'Điểm hiện có',
  ma_diem: 'MÃ NHẬN ĐIỂM · +{diem} điểm (nhập trong {gio} giờ)', ma_uu_dai: 'MÃ ƯU ĐÃI KHÁCH MỚI (nhập trong {gio} giờ)',
  cam_on: 'Cảm ơn {ten_khach}!', chinh_sach: 'Ly có vấn đề? Báo quầy trong ngày để đổi.', ghi_chu: '',
  da_huy: 'ĐƠN ĐÃ HUỶ', da_hoan: 'ĐƠN ĐÃ HOÀN TIỀN', in_lai: 'IN LẠI · LẦN {lan}', nhan_khach: 'Khách', nhan_nv: 'NV',
  tem_dau: '', tem_chan: '', tem_in_lai: 'IN LẠI',
};

// Nhóm hiển thị ở màn Cài đặt: [tên nhóm, [[khoá, nhãn]…]]
export const NHOM_CHU = [
  ['Đầu hoá đơn', [['ten_quan', 'Tên quán'], ['dia_chi', 'Địa chỉ · SĐT'], ['so_bill', 'Chữ trên số bill'], ['lien_khach', 'Nhãn tờ khách'], ['lien_luu', 'Nhãn tờ lưu'], ['chu_qr', 'Chữ cạnh QR'], ['da_huy', 'Chữ khi đơn huỷ'], ['da_hoan', 'Chữ khi đơn hoàn tiền'], ['in_lai', 'Dòng IN LẠI'], ['nhan_khach', 'Nhãn dòng khách'], ['nhan_nv', 'Nhãn nhân viên']]],
  ['Tiền hàng', [['gia_goc', 'Dòng giá gốc'], ['giam_hang', 'Dòng giảm hạng'], ['giam_flash', 'Dòng giảm Flash'], ['giam_ma', 'Dòng giảm mã / quà'], ['phi_giao', 'Dòng phí giao'], ['tong', 'Dòng tổng']]],
  ['Thanh toán', [['tieu_de_tt', 'Tiêu đề mục'], ['tu_tk', 'Trả từ tài khoản'], ['tu_tk_me', 'Trả từ tài khoản mẹ'], ['ck', 'Chuyển khoản'], ['tm', 'Tiền mặt'], ['ghi_no', 'Ghi nợ'], ['dua_tra', 'Khách đưa / trả lại']]],
  ['Điểm thưởng', [['tieu_de_diem', 'Tiêu đề mục'], ['diem_truoc', 'Điểm trước đơn'], ['diem_doi', 'Đổi quà'], ['diem_cong', 'Điểm cộng'], ['diem_co', 'Điểm hiện có'], ['ma_diem', 'Ô mã nhận điểm (khách lẻ)'], ['ma_uu_dai', 'Ô mã ưu đãi (khi không có điểm)']]],
  ['Chân hoá đơn', [['cam_on', 'Lời cảm ơn'], ['chinh_sach', 'Chính sách'], ['ghi_chu', 'Ghi chú thêm']]],
  ['Tem ly', [['tem_dau', 'Dòng đầu tem'], ['tem_chan', 'Dòng cuối tem'], ['tem_in_lai', 'Nhãn IN LẠI trên tem']]],
];

// Khoá cũ của cài đặt hoá đơn (trước HD-1) — chữ chủ quán đã sửa không được mất khi chưa có khoá mới
const KHOA_CU = { ten_quan: 'store_name', cam_on: 'invoice_thank_you', chinh_sach: 'invoice_policy', ghi_chu: 'invoice_note' };

const co = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);
const laBat = (v) => v === true || v === 'true' || v === '1' || v === 1;

/** Chữ + cờ ẩn của từng dòng. Mục không ẩn được (KHONG_AN) luôn hiện, dù cài đặt ghi ẩn. */
export function docChu(settings) {
  const s = settings || {};
  const chu = {};
  const an = {};
  for (const k of Object.keys(CHU_MAC_DINH)) {
    let v = CHU_MAC_DINH[k];
    if (co(s, `invoice_chu_${k}`)) v = String(s[`invoice_chu_${k}`] ?? '');
    else if (k === 'dia_chi') v = [s.store_address, s.store_phone].map((x) => String(x || '').trim()).filter(Boolean).join(' · ');
    else if (KHOA_CU[k] && co(s, KHOA_CU[k]) && (k !== 'ten_quan' || String(s[KHOA_CU[k]]).trim())) v = String(s[KHOA_CU[k]] ?? '');
    if (KHONG_AN.includes(k) && !String(v).trim()) v = CHU_MAC_DINH[k];   // xoá trắng chữ của mục bắt buộc = không ẩn được, dùng chữ mặc định
    chu[k] = v;
    an[k] = !KHONG_AN.includes(k) && laBat(s[`invoice_an_${k}`]);
  }
  return { chu, an };
}

/**
 * Chữ mặc định khi bấm Reset: mọi chữ về CHU_MAC_DINH, trừ tên quán + địa chỉ/SĐT — hai thứ này mặc định theo quán (store_*),
 * nên Reset không được xoá địa chỉ hay đè tên quán bằng hằng số.
 */
export function chuMacDinhCuaQuan(caiDat) {
  const s = caiDat || {};
  const { chu } = docChu({ store_name: s.store_name, store_address: s.store_address, store_phone: s.store_phone });
  return { ...CHU_MAC_DINH, ten_quan: chu.ten_quan, dia_chi: chu.dia_chi };
}

/**
 * Khoá chữ phải GHI khi lưu sau Reset: tất cả, trừ tên quán + địa chỉ/SĐT nếu chưa từng bị ghi đè (chúng vẫn theo store_* — ghim bản sao
 * tĩnh sẽ làm đổi tên/địa chỉ quán ở Cài đặt không còn đổi bill).
 */
export function khoaChuGhiKhiReset(caiDat) {
  return Object.keys(CHU_MAC_DINH).filter((k) => !['ten_quan', 'dia_chi'].includes(k) || co(caiDat, `invoice_chu_${k}`));
}

/**
 * Cài đặt "như thể đã lưu" từ trạng thái đang sửa ở màn Cài đặt (c = { chu, an, soTo, khUrl }): xem trước bill VÀ tem/phiếu dùng chung,
 * để mọi chữ sửa (kể cả dòng đầu/cuối/IN LẠI của tem) hiện ngay.
 */
export function caiDatTuChuDangSua(caiDat, c) {
  const chuAn = Object.keys(CHU_MAC_DINH).flatMap((k) => [[`invoice_chu_${k}`, c.chu[k]], [`invoice_an_${k}`, c.an[k]]]);
  return { ...caiDat, ...Object.fromEntries(chuAn), [KHOA_SO_TO]: c.soTo, [KHOA_DIA_CHI_KH]: c.khUrl };
}

/**
 * Đủ điều kiện in — nút In VÀ "Tự mở in sau thanh toán" dùng CHUNG vị từ này: bảng nhóm món đã sẵn, và dữ liệu hoá đơn đã về
 * (hoặc cửa hoá đơn lỗi → bố cục cũ). In sớm hơn sẽ ra bố cục cũ một tờ, không QR, không IN LẠI.
 */
export const sanSangIn = ({ sanSang, coId, hd, hdLoi }) => !!sanSang && (!coId || !!hd || !!hdLoi);

/** Số tờ mỗi lần in: 1 hoặc 2 (mặc định 2). */
export function soToTuCaiDat(settings) {
  const n = Number(settings?.[KHOA_SO_TO]);
  return n === 1 ? 1 : n === 2 ? 2 : SO_TO_MAC_DINH;
}

/** Điền {ten_khach} {hang} {phan_tram} {diem} {gio} {ma} {lan}; trường thiếu → rỗng. */
export function dienChu(text, mau = {}) {
  const khongCoPhanTram = mau.phan_tram === undefined || mau.phan_tram === null || mau.phan_tram === '';   // nhãn "Giảm hạng Vàng 10%" → "Giảm hạng Vàng"
  return String(khongCoPhanTram ? String(text ?? '').replace(/ *\{phan_tram\} *%?/g, ' ') : text ?? '').replace(/\{(ten_khach|hang|phan_tram|diem|gio|ma|lan)\}/g, (_, k) => (mau[k] === undefined || mau[k] === null ? '' : String(mau[k])))
    .replace(/[ \t]{2,}/g, ' ').replace(/ +([%,.!])/g, '$1').trim();
}

// Chữ cạnh QR nằm trong cột hẹp dưới QR và tự xuống dòng → không có giới hạn một dòng.
export const gioiHanChu = (khoa) => (khoa === 'chu_qr' ? Infinity : String(khoa).startsWith('tem_') ? GIOI_HAN_TEM : GIOI_HAN_CHU);
const MAU_DEM = { ten_khach: 'Chị Hoa', hang: 'Vàng', phan_tram: 10, diem: 7, gio: 24, lan: 2 };

/** Đếm ký tự của dòng sau khi điền chữ tự điền mẫu: quá giới hạn → báo đỏ (giấy 58 mm = 42). */
export function demChu(text, gioiHan = GIOI_HAN_CHU) {
  const dai = dienChu(text, MAU_DEM).length;
  return { dai, gioiHan, qua: dai > gioiHan };
}

export const cat = (s, n = GIOI_HAN_TEM) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

export function dinhDangTien(n) {
  const x = Math.round(Number(n) || 0);
  return (x < 0 ? '−' : '') + String(Math.abs(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}
const soDiem = (n) => String(Math.round(Number(n) || 0));
const co_dau = (n) => (n > 0 ? '+' : '') + soDiem(n);

/** Dạng chữ cho máy in lệnh thô không có gạch ngang: "Giá gốc 96.000 → 86.400". */
export function chuGiaGoc(goc, hang) {
  const so = (n) => dinhDangTien(n).replace(/đ$/, '');
  return `Giá gốc ${so(goc)} → ${so(hang)}`;
}

/**
 * Đường dẫn đăng ký App KH để in thành QR. Mẫu có `{ma}`: có mã → thay mã; không mã → bỏ cả phần `ma={ma}` khỏi đường dẫn.
 * Mẫu trống / không phải http(s) → '' (KHÔNG in QR chết).
 */
export function duongQr(mau, ma) {
  const m = String(mau ?? '').trim();
  if (!/^https?:\/\/\S+$/i.test(m)) return '';
  if (ma) return m.replace(/\{ma\}/g, encodeURIComponent(String(ma)));
  return m
    .replace(/([?&])ma=\{ma\}(&?)/, (_, sep, amp) => (amp ? sep : ''))
    .replace(/\{ma\}/g, '');
}

const gioHienThi = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/.exec(String(s || ''));
  return m ? `${m[4].padStart(2, '0')}:${m[5]} ${m[3]}/${m[2]}/${m[1]}` : '';
};

/**
 * Một tờ hoá đơn. `lien`: 'khach' | 'luu'. `inLai`: true → thêm dòng "IN LẠI · LẦN n" (n = số lần đã in + 1, tối thiểu 2).
 * Trả { lien, nhan, dau, mon, tien[], thanh_toan[], diem[], ma_diem, chan[], in_lai, canh_bao }.
 * Mỗi dòng tiền / thanh toán / điểm: { khoa, ten, tien, dam }.
 */
export function dungHoaDon(hd, settings, { lien = 'khach', inLai = false } = {}) {
  const { chu, an } = docChu(settings);
  const khach = hd?.khach || {};
  const lan = Math.max(2, (Number(hd?.so_lan_in) || 0) + 1);
  const mau = {
    ten_khach: khach.la_khach_le === false && khach.ten ? khach.ten : 'quý khách',
    hang: khach.hang || '', phan_tram: khach.phan_tram ?? '', diem: hd?.ma_nhan_diem?.diem ?? '', gio: hd?.ma_nhan_diem?.han_gio ?? 24, lan,
  };
  const hien = (k) => !an[k] && String(chu[k] ?? '').trim().length > 0;
  const d = (k) => dienChu(chu[k], mau);
  const dong = (khoa, tien, dam = false) => ({ khoa, ten: d(khoa), tien, dam });
  const tien = hd?.tien || {};

  const dongTien = [];
  if (hien('gia_goc')) dongTien.push(dong('gia_goc', dinhDangTien(tien.gia_goc)));
  if (tien.giam_hang > 0 && hien('giam_hang')) dongTien.push(dong('giam_hang', '−' + dinhDangTien(tien.giam_hang)));
  if (tien.giam_flash > 0 && hien('giam_flash')) dongTien.push(dong('giam_flash', '−' + dinhDangTien(tien.giam_flash)));
  if (tien.giam_ma > 0 && hien('giam_ma')) dongTien.push(dong('giam_ma', '−' + dinhDangTien(tien.giam_ma)));
  if (tien.phi_giao > 0 && hien('phi_giao')) dongTien.push(dong('phi_giao', '+' + dinhDangTien(tien.phi_giao)));
  dongTien.push(dong('tong', dinhDangTien(tien.tong), true));

  const tt = [];
  const loai = { tai_khoan: 'tu_tk', tai_khoan_me: 'tu_tk_me', chuyen_khoan: 'ck', tien_mat: 'tm', ghi_no: 'ghi_no' };
  for (const t of hd?.thanh_toan || []) {
    const k = loai[t.loai];
    if (k && hien(k)) tt.push(dong(k, dinhDangTien(t.so_tien)));
  }
  if (hd?.khach_dua > 0 && hien('dua_tra')) tt.push(dong('dua_tra', `${dinhDangTien(hd.khach_dua)} / ${dinhDangTien(hd.tra_lai)}`));
  if (tt.length) tt.unshift(dong('tieu_de_tt', ''));   // không dòng nào (đơn 0đ lấy hết từ gói) → không in tiêu đề trơ trọi

  const dg = [];
  const diem = hd?.diem;
  if (diem && hien('tieu_de_diem')) {
    dg.push(dong('tieu_de_diem', ''));
    if (hien('diem_truoc')) dg.push(dong('diem_truoc', soDiem(diem.truoc)));
    if (diem.doi_qua > 0 && hien('diem_doi')) dg.push(dong('diem_doi', '−' + soDiem(diem.doi_qua)));
    if (diem.cong !== 0 && hien('diem_cong')) dg.push(dong('diem_cong', co_dau(diem.cong)));
    if (hien('diem_co')) dg.push({ ...dong('diem_co', soDiem(diem.hien_co)), dam: true });
  }

  // Ô mã: N > 0 → hứa điểm; N = 0 → chỉ còn ưu đãi khách mới (nếu bật); không có gì → không in ô
  const m = hd?.ma_nhan_diem;
  let maDiem = null;
  if (m?.ma) {
    if (m.diem > 0 && hien('ma_diem')) maDiem = { chu: d('ma_diem'), ma: m.ma };
    else if (!(m.diem > 0) && m.uu_dai && hien('ma_uu_dai')) maDiem = { chu: dienChu(chu.ma_uu_dai, { ...mau, gio: m.han_gio_uu_dai ?? 24 }), ma: m.ma };
  }

  const laKhach = lien === 'khach';
  const chan = [];
  if (laKhach && hien('cam_on')) chan.push({ khoa: 'cam_on', chu: d('cam_on') });
  if (laKhach && hien('chinh_sach')) chan.push({ khoa: 'chinh_sach', chu: d('chinh_sach') });
  if (hien('ghi_chu')) chan.push({ khoa: 'ghi_chu', chu: d('ghi_chu') });

  const trangThai = hd?.don?.trang_thai;
  const canhBao = trangThai === 'cancelled' && hien('da_huy') ? d('da_huy') : trangThai === 'refunded' && hien('da_hoan') ? d('da_hoan') : null;
  // QR mang mã chỉ khi mã còn dùng được (hứa điểm hoặc còn ưu đãi); mã đã dùng / hết hạn / đơn huỷ → QR trần, không `?ma=` chết
  const maDung = m?.ma && (m.diem > 0 || m.uu_dai) ? m.ma : null;

  return {
    lien,
    nhan: hien(laKhach ? 'lien_khach' : 'lien_luu') ? d(laKhach ? 'lien_khach' : 'lien_luu') : '',
    dau: {
      ten_quan: d('ten_quan'), dia_chi: hien('dia_chi') ? d('dia_chi') : '', chu_so_bill: d('so_bill'), so_bill: hd?.don?.so_bill ?? '',
      nhan_khach: hien('nhan_khach') ? d('nhan_khach') : '', nhan_nv: hien('nhan_nv') ? d('nhan_nv') : '',
      qr: duongQr(settings?.[KHOA_DIA_CHI_KH], maDung), chu_qr: hien('chu_qr') ? d('chu_qr') : '',
      gio: gioHienThi(hd?.don?.gio), nhan_vien: hd?.don?.nhan_vien || '', khach: khach.la_khach_le === false ? khach.ten : (khach.ten || 'Khách lẻ'),
    },
    mon: (hd?.mon || []).map((x) => ({
      sl: x.so_luong, ten: x.ten, ghi_chu: x.ghi_chu || '', gia_goc: x.gia_goc, gia_hang: x.gia_hang ?? null,
      tien: dinhDangTien(x.thanh_tien), tien_goc: x.gia_hang != null ? dinhDangTien(x.thanh_tien_goc) : '',
      chu_giam: x.gia_hang != null ? chuGiaGoc(x.thanh_tien_goc, x.thanh_tien) : '',
    })),
    tien: dongTien, thanh_toan: tt, diem: dg, ma_diem: maDiem, chan,
    in_lai: inLai ? d('in_lai') : null,
    canh_bao: canhBao,
  };
}

/** Các tờ của một lần in: [khách, lưu] (hoặc chỉ khách khi soTo = 1). `soTo` thiếu → theo cài đặt. */
export function danhSachTo(hd, settings, { inLai = false, soTo } = {}) {
  const n = soTo === 1 || soTo === 2 ? soTo : soToTuCaiDat(settings);
  return ['khach', 'luu'].slice(0, n).map((lien) => dungHoaDon(hd, settings, { lien, inLai }));
}

/** Chữ tem (cắt GIOI_HAN_TEM): rỗng / ẩn → ''. Điền {ten_khach} từ tên khách của đơn. */
export function chuTem(settings, khoa, tenKhach) {
  const { chu, an } = docChu(settings);
  if (an[khoa]) return '';
  return cat(dienChu(chu[khoa], { ten_khach: tenKhach || 'quý khách' }));
}

// Hoá đơn mẫu cho nút Xem trước ở Cài đặt (số giả, đúng hình dạng GET /hoa-don/:id)
export const HOA_DON_MAU_QUEN = {
  quan: { ten: '', dia_chi: '', sdt: '' },
  don: { id: 0, code: 'ORD-20260101-012', so_bill: '012', gio: '2026-01-01T09:30:00', nhan_vien: 'Thu ngân', trang_thai: 'completed', thanh_toan_trang_thai: 'paid' },
  khach: { ten: 'Chị Hoa', sdt_che: '0912 ••• 123', la_khach_le: false, hang: 'Vàng', phan_tram: 10 },
  mon: [
    { so_luong: 1, ten: 'Trà dưỡng nhan', ghi_chu: 'Ít đường', gia_goc: 48000, gia_hang: 43200, thanh_tien_goc: 48000, thanh_tien: 43200 },
    { so_luong: 1, ten: 'Nước ép cam', ghi_chu: '', gia_goc: 24000, gia_hang: 21600, thanh_tien_goc: 24000, thanh_tien: 21600 },
  ],
  tien: { gia_goc: 72000, giam_hang: 7200, giam_flash: 0, giam_ma: 0, ma_giam: null, phi_giao: 23000, tong: 87800 },
  thanh_toan: [{ loai: 'tai_khoan', so_tien: 50000 }, { loai: 'tien_mat', so_tien: 37800 }],
  khach_dua: 50000, tra_lai: 12200,
  diem: { truoc: 320, doi_qua: 100, cong: 1, hien_co: 221 },   // có đổi quà: để dòng "Đổi quà" xem được
  ma_nhan_diem: null, so_lan_in: 0,
};
export const HOA_DON_MAU_LE = {
  ...HOA_DON_MAU_QUEN,
  khach: { ten: 'Khách lẻ', sdt_che: '', la_khach_le: true, hang: null, phan_tram: null },
  mon: [{ so_luong: 2, ten: 'Trà gừng', ghi_chu: '', gia_goc: 36000, gia_hang: null, thanh_tien_goc: 72000, thanh_tien: 72000 }],
  tien: { gia_goc: 72000, giam_hang: 0, giam_flash: 0, giam_ma: 0, ma_giam: null, phi_giao: 23000, tong: 95000 },
  thanh_toan: [{ loai: 'tien_mat', so_tien: 95000 }], khach_dua: 100000, tra_lai: 5000,
  diem: null, ma_nhan_diem: { ma: 'TQD-XXXXXXXXXXXX', diem: 7, uu_dai: true, han_gio: 24 },
};
// Đơn Flash (có thêm mã giảm) của khách lẻ: có mã nhưng N = 0 (không hứa điểm), còn ưu đãi khách mới
const HOA_DON_MAU_FLASH = {
  ...HOA_DON_MAU_LE,
  tien: { gia_goc: 72000, giam_hang: 0, giam_flash: 7000, giam_ma: 3000, ma_giam: 'GIAM3K', phi_giao: 23000, tong: 85000 },
  thanh_toan: [{ loai: 'tien_mat', so_tien: 85000 }], khach_dua: 100000, tra_lai: 15000,
  ma_nhan_diem: { ma: 'TQD-XXXXXXXXXXXX', diem: 0, uu_dai: true, han_gio: 24 },
};
// Khách quen trả bằng tài khoản + tài khoản mẹ + chuyển khoản + ghi nợ (không tiền mặt)
const HOA_DON_MAU_ME = {
  ...HOA_DON_MAU_QUEN,
  thanh_toan: [{ loai: 'tai_khoan', so_tien: 20000 }, { loai: 'tai_khoan_me', so_tien: 30000 }, { loai: 'chuyen_khoan', so_tien: 10000 }, { loai: 'ghi_no', so_tien: 27800 }],
  khach_dua: 0, tra_lai: 0,
};
const donTrangThai = (trang_thai) => ({
  ...HOA_DON_MAU_QUEN,
  don: { ...HOA_DON_MAU_QUEN.don, trang_thai },
  diem: { truoc: 320, doi_qua: 0, cong: 0, hien_co: 320 },   // điểm đã cộng bị trừ lại: cộng ròng 0
});

/** Các mẫu của ô Xem trước ở Cài đặt hoá đơn: { khoa, nhan, hd, inLai }. */
export const MAU_XEM_TRUOC = [
  { khoa: 'quen', nhan: 'Khách quen có hạng', hd: HOA_DON_MAU_QUEN, inLai: false },
  { khoa: 'le', nhan: 'Khách lẻ có mã', hd: HOA_DON_MAU_LE, inLai: false },
  { khoa: 'flash', nhan: 'Đơn Flash', hd: HOA_DON_MAU_FLASH, inLai: false },
  { khoa: 'me', nhan: 'Trả bằng tài khoản mẹ', hd: HOA_DON_MAU_ME, inLai: false },
  { khoa: 'huy', nhan: 'Đơn huỷ', hd: donTrangThai('cancelled'), inLai: false },
  { khoa: 'hoan', nhan: 'Đơn hoàn tiền', hd: donTrangThai('refunded'), inLai: false },
  { khoa: 'in_lai', nhan: 'In lại', hd: { ...HOA_DON_MAU_QUEN, so_lan_in: 1 }, inLai: true },
];
