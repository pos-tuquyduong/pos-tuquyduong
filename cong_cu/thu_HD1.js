#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ HD-1 — hoá đơn bố cục mới: cửa dữ liệu · hàm thuần dựng dòng · QR · chữ tuỳ chỉnh · tem
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có routes/hoaDon.js, utils/hoaDon.js, veQr.js). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_HD1.js [--goc <thư mục gốc kho>]
 *  --goc: chạy trên bản sao cây kho (đột biến, viec/HD-1/dot_bien.py). Mặc định: cây chứa file này.
 *
 *  [A] máy chủ thật trên kho thử (khuôn thu_DIEMTHAT1.js): đơn tạo bằng POST /orders, rồi đọc GET /hoa-don/:id.
 *  [G] hàm thuần client/src/utils/hoaDon.js (gọi thẳng file). [C] QR: veQr.js vẽ → giải mã bằng jsqr. [F] tem. [H] K5.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_hd1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
process.env.JWT_SECRET = 'thu_hd1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tien = (s) => Number(String(s).replace(/[^\d−-]/g, '').replace('−', '-'));   // "−7.200đ" → -7200

// ── Dữ liệu mẫu cho phần hàm thuần: đúng hình dạng GET /hoa-don/:id ──
const HD_QUEN = {
  quan: { ten: 'TỨ QUÝ ĐƯỜNG', dia_chi: 'LK4 Trương Định', sdt: '024 2245 5565' },
  don: { id: 9, code: 'ORD-20261027-012', so_bill: '012', gio: '2026-10-27T09:30:00', nhan_vien: 'Thu', trang_thai: 'completed', thanh_toan_trang_thai: 'paid' },
  khach: { ten: 'Chị Hoa', sdt_che: '0912 ••• 123', la_khach_le: false, hang: 'Vàng', phan_tram: 10 },
  mon: [
    { so_luong: 1, ten: 'Trà dưỡng nhan', ghi_chu: 'Ít đường', gia_goc: 48000, gia_hang: 43200, thanh_tien_goc: 48000, thanh_tien: 43200 },
    { so_luong: 1, ten: 'Nước ép cam', ghi_chu: '', gia_goc: 24000, gia_hang: 21600, thanh_tien_goc: 24000, thanh_tien: 21600 },
  ],
  tien: { gia_goc: 72000, giam_hang: 7200, giam_flash: 0, giam_ma: 0, ma_giam: null, phi_giao: 23000, tong: 87800 },
  thanh_toan: [{ loai: 'tai_khoan', so_tien: 50000 }, { loai: 'tien_mat', so_tien: 37800 }],
  khach_dua: 50000, tra_lai: 12200,
  diem: { truoc: 320, doi_qua: 0, cong: 1, hien_co: 321 },
  ma_nhan_diem: null, so_lan_in: 0,
};
const HD_LE = {
  ...HD_QUEN,
  khach: { ten: 'Khách lẻ', sdt_che: '', la_khach_le: true, hang: null, phan_tram: null },
  mon: [{ so_luong: 2, ten: 'Trà gừng', ghi_chu: '', gia_goc: 36000, gia_hang: null, thanh_tien_goc: 72000, thanh_tien: 72000 }],
  tien: { gia_goc: 72000, giam_hang: 0, giam_flash: 0, giam_ma: 0, ma_giam: null, phi_giao: 23000, tong: 95000 },
  thanh_toan: [{ loai: 'tien_mat', so_tien: 95000 }], khach_dua: 100000, tra_lai: 5000,
  diem: null, ma_nhan_diem: { ma: 'TQD-ABCDEFGHJKMN', diem: 7, uu_dai: true, han_gio: 24 },
};
const CD = { invoice_kh_url: 'https://app.example.vn/?ma={ma}' };

async function nap(duong) {
  try { return await import(pathToFileURL(path.join(GOC, 'client', 'src', 'utils', duong)).href); } catch (e) { return { loi: e.message }; }
}

// ═══ [G] hàm thuần ═══
async function phanG() {
  muc('[G] hàm thuần client/src/utils/hoaDon.js (dựng dòng, chữ tự điền, đếm, QR, 2 tờ, in lại)');
  const P = await nap('hoaDon.js');
  if (P.loi) { k('G0 nạp được client/src/utils/hoaDon.js', false, P.loi); return null; }
  const { dungHoaDon, danhSachTo, dienChu, demChu, gioiHanChu, duongQr, chuGiaGoc, docChu, soToTuCaiDat, chuTem, KHONG_AN, CHU_MAC_DINH, NHOM_CHU, GIOI_HAN_CHU } = P;
  const khoa = (ds) => ds.map((d) => d.khoa);
  const dong = (ds, kh) => ds.find((d) => d.khoa === kh);

  const q = dungHoaDon(HD_QUEN, {}, { lien: 'khach' });
  k('G1 khách quen có hạng: dòng tiền = giá gốc → giảm hạng → phí giao → tổng, đúng thứ tự', bang(khoa(q.tien), ['gia_goc', 'giam_hang', 'phi_giao', 'tong']), khoa(q.tien));
  k('G2 số tiền hiển thị lấy từ dữ liệu máy chủ: 72.000đ · −7.200đ · +23.000đ · 87.800đ',
    bang(q.tien.map((d) => d.tien), ['72.000đ', '−7.200đ', '+23.000đ', '87.800đ']), q.tien.map((d) => d.tien));
  k('G3 chữ giảm hạng tự điền hạng + phần trăm: "Giảm hạng Vàng 10%"', dong(q.tien, 'giam_hang').ten === 'Giảm hạng Vàng 10%', dong(q.tien, 'giam_hang').ten);
  k('G4 tổng đậm', dong(q.tien, 'tong').dam === true);
  const chuoi = tien(dong(q.tien, 'gia_goc').tien) + tien(dong(q.tien, 'giam_hang').tien) + tien(dong(q.tien, 'phi_giao').tien);
  k('G5 giá gốc − giảm + phí giao = tổng hoá đơn (trên giấy)', chuoi === tien(dong(q.tien, 'tong').tien), chuoi);
  k('G6 THANH TOÁN: tiêu đề → từ tài khoản → tiền mặt → khách đưa / trả lại',
    bang(khoa(q.thanh_toan), ['tieu_de_tt', 'tu_tk', 'tm', 'dua_tra']), khoa(q.thanh_toan));
  k('G7 tổng các dòng thanh toán = tổng hoá đơn', tien(dong(q.thanh_toan, 'tu_tk').tien) + tien(dong(q.thanh_toan, 'tm').tien) === 87800);
  k('G8 "Khách đưa / Trả lại" = 50.000đ / 12.200đ', dong(q.thanh_toan, 'dua_tra').tien === '50.000đ / 12.200đ', dong(q.thanh_toan, 'dua_tra').tien);
  k('G9 ĐIỂM THƯỞNG khách quen: trước 320 · cộng +1 · hiện có 321 (đậm); không dòng đổi quà',
    bang(q.diem.map((d) => [d.khoa, d.tien]), [['tieu_de_diem', ''], ['diem_truoc', '320'], ['diem_cong', '+1'], ['diem_co', '321']]) && dong(q.diem, 'diem_co').dam, JSON.stringify(q.diem));
  const doi = dungHoaDon({ ...HD_QUEN, diem: { truoc: 320, doi_qua: 100, cong: 1, hien_co: 221 } }, {});
  k('G10 có đổi quà: thêm dòng "Đổi quà −100" giữa trước và cộng', bang(doi.diem.map((d) => [d.khoa, d.tien]), [['tieu_de_diem', ''], ['diem_truoc', '320'], ['diem_doi', '−100'], ['diem_cong', '+1'], ['diem_co', '221']]), JSON.stringify(doi.diem));
  k('G11 món có hạng: giá gốc gạch ngang + giá hạng (và dạng chữ cho máy in thô)', q.mon[0].tien === '43.200đ' && q.mon[0].tien_goc === '48.000đ' && q.mon[0].chu_giam === 'Giá gốc 48.000 → 43.200' && q.mon[0].ghi_chu === 'Ít đường', JSON.stringify(q.mon[0]));
  const le = dungHoaDon(HD_LE, CD, { lien: 'khach' });
  k('G12 khách lẻ không hạng: không dòng giảm hạng, không mục điểm, món không gạch giá', !khoa(le.tien).includes('giam_hang') && le.diem.length === 0 && le.mon[0].tien_goc === '' && le.mon[0].chu_giam === '');
  k('G13 khách lẻ có mã N=7: ô "MÃ NHẬN ĐIỂM · +7 điểm (nhập trong 24 giờ)" + mã', le.ma_diem?.chu === 'MÃ NHẬN ĐIỂM · +7 điểm (nhập trong 24 giờ)' && le.ma_diem.ma === 'TQD-ABCDEFGHJKMN', JSON.stringify(le.ma_diem));
  k('G14 QR của khách lẻ có mã: mã điền sẵn vào đường dẫn', le.dau.qr === 'https://app.example.vn/?ma=TQD-ABCDEFGHJKMN', le.dau.qr);
  k('G15 QR của khách quen (không mã): bỏ phần ?ma=…', dungHoaDon(HD_QUEN, CD).dau.qr === 'https://app.example.vn/', dungHoaDon(HD_QUEN, CD).dau.qr);
  k('G16 Ô địa chỉ App KH trống → KHÔNG QR (không in QR chết)', dungHoaDon(HD_LE, {}).dau.qr === '' && dungHoaDon(HD_LE, { invoice_kh_url: '   ' }).dau.qr === '');
  const n0 = (o) => dungHoaDon({ ...HD_LE, ma_nhan_diem: { ma: 'TQD-X', diem: 0, uu_dai: false, han_gio: 24, ...o } }, CD);
  k('G17 N = 0 và không ưu đãi khách mới → KHÔNG in ô mã, không hứa điểm', n0({}).ma_diem === null);
  k('G18 N = 0 nhưng ưu đãi khách mới đang bật → chỉ còn ô ưu đãi, KHÔNG có chữ "điểm" của N',
    n0({ uu_dai: true }).ma_diem?.chu === 'MÃ ƯU ĐÃI KHÁCH MỚI (nhập trong 24 giờ)' && !/\+\d+ điểm/.test(n0({ uu_dai: true }).ma_diem.chu), JSON.stringify(n0({ uu_dai: true }).ma_diem));
  k('G19b ô mã nhận điểm bị TẮT (invoice_an_ma_diem) và N > 0 → không in ô nào (ưu đãi khách mới không chen vào)', dungHoaDon(HD_LE, { invoice_an_ma_diem: 'true' }).ma_diem === null);
  k('G19 N = 1 (sát ngưỡng) vẫn hứa điểm', n0({ diem: 1 }).ma_diem?.chu.includes('+1 điểm'));
  k('G20 hết phí giao → không dòng phí giao (K5: đơn mang đi)', !khoa(dungHoaDon({ ...HD_LE, tien: { ...HD_LE.tien, phi_giao: 0, tong: 72000 } }, {}).tien).includes('phi_giao'));
  const tk2 = dungHoaDon({ ...HD_QUEN, thanh_toan: [{ loai: 'tai_khoan', so_tien: 20000 }, { loai: 'tai_khoan_me', so_tien: 30000 }, { loai: 'chuyen_khoan', so_tien: 37800 }], khach_dua: 0, tra_lai: 0 }, {});
  k('G21 tài khoản + tài khoản mẹ + chuyển khoản: ba dòng riêng, không "Khách đưa"', bang(khoa(tk2.thanh_toan), ['tieu_de_tt', 'tu_tk', 'tu_tk_me', 'ck']), khoa(tk2.thanh_toan));
  const het = dungHoaDon({ ...HD_QUEN, thanh_toan: [{ loai: 'tai_khoan', so_tien: 87800 }], khach_dua: 0 }, {});
  k('G22 trừ hết bằng tài khoản: chỉ dòng từ tài khoản (K5), mục THANH TOÁN vẫn có', bang(khoa(het.thanh_toan), ['tieu_de_tt', 'tu_tk']));
  const no = dungHoaDon({ ...HD_QUEN, thanh_toan: [{ loai: 'ghi_no', so_tien: 87800 }], khach_dua: 0 }, {});
  k('G23 đơn nợ cũ: dòng "Ghi nợ" (K5 dữ liệu cũ)', dong(no.thanh_toan, 'ghi_no')?.tien === '87.800đ');
  const flash = dungHoaDon({ ...HD_LE, tien: { ...HD_LE.tien, giam_flash: 5000, giam_ma: 3000, tong: 87000 } }, {});
  k('G24 giảm Flash + mã / quà: dòng riêng, trước phí giao', bang(khoa(flash.tien), ['gia_goc', 'giam_flash', 'giam_ma', 'phi_giao', 'tong']), khoa(flash.tien));

  // 2 tờ
  const to = danhSachTo(HD_QUEN, {});
  k('G25 mặc định 2 tờ: GIAO KHÁCH rồi LƯU QUẦY', to.length === 2 && to[0].nhan === 'GIAO KHÁCH' && to[1]?.nhan === 'LƯU QUẦY' && to[0].lien === 'khach' && to[1]?.lien === 'luu', JSON.stringify(to.map((t) => t.nhan)));
  const bo = (t) => ({ ...t, lien: '', nhan: '', chan: [] });
  k('G26 hai tờ GIỐNG HỆT, chỉ khác nhãn + chân (cảm ơn / chính sách chỉ ở tờ khách)', bang(bo(to[0]), bo(to[1])) && to[0].chan.some((c) => c.khoa === 'cam_on') && to[0].chan.some((c) => c.khoa === 'chinh_sach') && !to[1]?.chan.some((c) => c.khoa === 'cam_on' || c.khoa === 'chinh_sach'), JSON.stringify([to[0].chan, to[1]?.chan]));
  k('G27 lời cảm ơn tự điền tên khách: "Cảm ơn Chị Hoa!"; khách lẻ: "Cảm ơn quý khách!"', to[0].chan[0].chu === 'Cảm ơn Chị Hoa!' && danhSachTo(HD_LE, {})[0].chan[0].chu === 'Cảm ơn quý khách!', to[0].chan[0].chu);
  k('G28 số tờ: cài 1 → 1 tờ; cài 2 → 2; thiếu → 2; rác ("3", "x") → 2; tham số soTo ghi đè',
    danhSachTo(HD_QUEN, { invoice_so_to: '1' }).length === 1 && danhSachTo(HD_QUEN, { invoice_so_to: '2' }).length === 2 && soToTuCaiDat({}) === 2
    && soToTuCaiDat({ invoice_so_to: '3' }) === 2 && soToTuCaiDat({ invoice_so_to: 'x' }) === 2 && danhSachTo(HD_QUEN, { invoice_so_to: '2' }, { soTo: 1 }).length === 1);
  // in lại
  k('G29 lần đầu: không dòng IN LẠI', to.every((t) => t.in_lai === null));
  k('G30 in lại (đã in 1 lần) → "IN LẠI · LẦN 2" trên MỌI tờ', danhSachTo({ ...HD_QUEN, so_lan_in: 1 }, {}, { inLai: true }).every((t) => t.in_lai === 'IN LẠI · LẦN 2'));
  k('G31 đã in 2 lần → in lại là "LẦN 3"; chưa có log (0) mà in lại → vẫn "LẦN 2" (không bao giờ LẦN 1)',
    dungHoaDon({ ...HD_QUEN, so_lan_in: 2 }, {}, { inLai: true }).in_lai === 'IN LẠI · LẦN 3' && dungHoaDon({ ...HD_QUEN, so_lan_in: 0 }, {}, { inLai: true }).in_lai === 'IN LẠI · LẦN 2');
  k('G32 in lại: điểm chỉ là phần của đơn (cùng dữ liệu, không số dư lúc in)', bang(dungHoaDon(HD_QUEN, {}, { inLai: true }).diem, q.diem));

  // chữ tuỳ chỉnh (E)
  k('G33 KHÔNG ẩn được 7 mục bắt buộc: cài đặt ghi ẩn vẫn hiện', KHONG_AN.every((kh) => docChu({ [`invoice_an_${kh}`]: 'true' }).an[kh] === false));
  k('G34 danh sách mục không ẩn được = tên quán, số bill, tổng, thanh toán (7 khoá)', bang([...KHONG_AN].sort(), ['ck', 'so_bill', 'ten_quan', 'tieu_de_tt', 'tm', 'tong', 'tu_tk'].sort()), KHONG_AN.join());
  const anPhi = dungHoaDon(HD_LE, { invoice_an_phi_giao: 'true' });
  k('G35 ẩn được dòng phí giao (bật / tắt từng dòng)', !khoa(anPhi.tien).includes('phi_giao'));
  k('G36 ẩn tên quán bằng cài đặt: tên quán VẪN in; ẩn cả bốn mục thanh toán + tổng: vẫn in',
    dungHoaDon(HD_QUEN, { invoice_an_ten_quan: 'true' }).dau.ten_quan === 'TỨ QUÝ ĐƯỜNG'
    && khoa(dungHoaDon(HD_QUEN, { invoice_an_tong: 'true', invoice_an_tieu_de_tt: 'true', invoice_an_tm: 'true', invoice_an_tu_tk: 'true' }).thanh_toan).includes('tu_tk'));
  k('G36b xoá trắng chữ của 7 mục bắt buộc → vẫn in, dùng chữ mặc định (không ẩn được bằng cách xoá chữ)',
    KHONG_AN.every((kh) => docChu({ [`invoice_chu_${kh}`]: '  ' }).chu[kh] === CHU_MAC_DINH[kh]) && dungHoaDon(HD_QUEN, { invoice_chu_tm: '', invoice_chu_tong: '' }).tien.at(-1).ten === 'TỔNG HÓA ĐƠN'
    && dong(dungHoaDon(HD_QUEN, { invoice_chu_tm: '' }).thanh_toan, 'tm')?.ten === 'Tiền mặt');
  k('G37 chữ rỗng = ẩn dòng (cảm ơn)', danhSachTo(HD_QUEN, { invoice_chu_cam_on: '  ' })[0].chan.every((c) => c.khoa !== 'cam_on'));
  const sua = dungHoaDon(HD_QUEN, { invoice_chu_tong: 'PHẢI TRẢ', invoice_chu_gia_goc: 'Tiền hàng' });
  k('G38 sửa CHỮ không đổi SỐ: tổng vẫn 87.800đ', dong(sua.tien, 'tong').ten === 'PHẢI TRẢ' && dong(sua.tien, 'tong').tien === '87.800đ' && dong(sua.tien, 'gia_goc').tien === '72.000đ');
  k('G39 chữ tự điền {ten_khach} {hang} {phan_tram} {diem}: đủ bốn, thiếu → rỗng, khoá lạ giữ nguyên',
    dienChu('{ten_khach}|{hang}|{phan_tram}|{diem}|{xyz}', { ten_khach: 'A', hang: 'Vàng', phan_tram: 10, diem: 3 }) === 'A|Vàng|10|3|{xyz}' && dienChu('Cảm ơn {ten_khach}!', {}) === 'Cảm ơn!');
  const dai = (n) => 'a'.repeat(n);
  k('G40 đếm ký tự: 42 → không quá; 43 → quá (đỏ); 0 → không quá', demChu(dai(42)).qua === false && demChu(dai(43)).qua === true && demChu('').qua === false && GIOI_HAN_CHU === 42, JSON.stringify([demChu(dai(42)), demChu(dai(43))]));
  k('G41 chữ cũ của chủ quán không mất khi chưa có khoá mới (invoice_thank_you / store_name / store_address + store_phone)',
    docChu({ invoice_thank_you: 'Xin cảm ơn!' }).chu.cam_on === 'Xin cảm ơn!' && docChu({ store_name: 'QUÁN A' }).chu.ten_quan === 'QUÁN A'
    && docChu({ store_address: '12 Phố', store_phone: '0123' }).chu.dia_chi === '12 Phố · 0123' && docChu({ invoice_thank_you: 'cũ', invoice_chu_cam_on: 'mới' }).chu.cam_on === 'mới');
  k('G42 khoá mới đè khoá cũ kể cả khi rỗng (chủ quán cố ý xoá)', docChu({ invoice_thank_you: 'cũ', invoice_chu_cam_on: '' }).chu.cam_on === '');
  k('G43 5 nhóm chữ của hoá đơn (+ nhóm Tem) phủ MỌI khoá chữ, không khoá lạ', bang(NHOM_CHU.slice(0, 5).map((n) => n[0]), ['Đầu hoá đơn', 'Tiền hàng', 'Thanh toán', 'Điểm thưởng', 'Chân hoá đơn'])
    && bang(NHOM_CHU.flatMap((n) => n[1].map((x) => x[0])).sort(), Object.keys(CHU_MAC_DINH).sort()));
  k('G44 mọi chữ mặc định (sau khi điền mẫu) nằm trong giới hạn dòng: 42, tem 40; chữ cạnh QR không giới hạn (cột hẹp, xuống dòng)',
    Object.entries(CHU_MAC_DINH).filter(([kh, v]) => demChu(v, gioiHanChu(kh)).qua).length === 0 && gioiHanChu('chu_qr') === Infinity && gioiHanChu('tem_dau') === 40 && gioiHanChu('cam_on') === 42,
    Object.entries(CHU_MAC_DINH).filter(([kh, v]) => demChu(v, gioiHanChu(kh)).qua).map(([kh]) => kh).join());
  // QR đường dẫn
  const m = 'https://app.example.vn/?ma={ma}';
  k('G45 duongQr: có mã → thay; không mã → bỏ ?ma; mẫu có tham số khác giữ nguyên dấu ? &',
    duongQr(m, 'TQD-A') === 'https://app.example.vn/?ma=TQD-A' && duongQr(m, '') === 'https://app.example.vn/'
    && duongQr('https://a.vn/dk?x=1&ma={ma}', null) === 'https://a.vn/dk?x=1' && duongQr('https://a.vn/dk?ma={ma}&x=1', null) === 'https://a.vn/dk?x=1'
    && duongQr('https://a.vn/dk?x=1&ma={ma}', 'B') === 'https://a.vn/dk?x=1&ma=B' && duongQr('https://a.vn/dk/{ma}', 'B') === 'https://a.vn/dk/B',
  [duongQr(m, 'TQD-A'), duongQr(m, ''), duongQr('https://a.vn/dk?x=1&ma={ma}', null), duongQr('https://a.vn/dk?ma={ma}&x=1', null)].join(' | '));
  k('G46 duongQr: trống / không phải http(s) / có khoảng trắng → "" ', ['', '  ', 'app.example.vn', 'javascript:alert(1)', 'ftp://x.vn', 'https://a b.vn'].every((x) => duongQr(x, 'M') === ''));
  k('G47 duongQr: mã có ký tự lạ được mã hoá (không vỡ đường dẫn)', duongQr(m, 'A&B') === 'https://app.example.vn/?ma=A%26B');
  k('G48 chuGiaGoc: "Giá gốc 96.000 → 86.400"', chuGiaGoc(96000, 86400) === 'Giá gốc 96.000 → 86.400');
  // huỷ + đầu vào rác
  const huy = dungHoaDon({ ...HD_QUEN, don: { ...HD_QUEN.don, trang_thai: 'cancelled' } }, {});
  k('G49 đơn huỷ: có dòng "ĐƠN ĐÃ HUỶ", vẫn đủ phần còn lại (K5)', huy.canh_bao === 'ĐƠN ĐÃ HUỶ' && huy.tien.length === 4 && dungHoaDon(HD_QUEN, {}).canh_bao === null);
  k('G50 đơn hoàn tiền: "ĐƠN ĐÃ HOÀN TIỀN"', dungHoaDon({ ...HD_QUEN, don: { ...HD_QUEN.don, trang_thai: 'refunded' } }, {}).canh_bao === 'ĐƠN ĐÃ HOÀN TIỀN');
  let nem = null;
  try { dungHoaDon(null, null); dungHoaDon({}, undefined); danhSachTo(undefined, undefined, undefined); dienChu(undefined); duongQr(undefined); docChu(null); } catch (e) { nem = e.message; }
  k('G51 đầu vào rỗng / rác không ném', nem === null, nem);
  const tong0 = dungHoaDon({ ...HD_QUEN, tien: { ...HD_QUEN.tien, tong: 0 }, thanh_toan: [], khach_dua: 0 }, {});
  k('G52 đơn 0đ (quà tặng): tổng 0đ, mục thanh toán chỉ còn tiêu đề', dong(tong0.tien, 'tong').tien === '0đ' && bang(khoa(tong0.thanh_toan), ['tieu_de_tt']));
  k('G53 số lẻ / chuỗi từ máy chủ vẫn ra số nguyên đồng', dungHoaDon({ ...HD_QUEN, tien: { ...HD_QUEN.tien, tong: '87800.4' } }, {}).tien.at(-1).tien === '87.800đ');
  k('G54 chân hoá đơn: ghi chú thêm (rỗng mặc định) hiện ở CẢ hai tờ khi có chữ', danhSachTo(HD_QUEN, { invoice_chu_ghi_chu: 'Wifi: abc' }).every((t) => t.chan.some((c) => c.khoa === 'ghi_chu' && c.chu === 'Wifi: abc')));
  k('G55 địa chỉ · SĐT lấy cài đặt cũ khi chưa có khoá mới', dungHoaDon(HD_QUEN, { store_address: 'LK4', store_phone: '024' }).dau.dia_chi === 'LK4 · 024' && dungHoaDon(HD_QUEN, {}).dau.dia_chi === '');
  k('G56 đầu hoá đơn: số bill, giờ, nhân viên, khách', q.dau.so_bill === '012' && q.dau.chu_so_bill === 'SỐ BILL' && q.dau.gio === '09:30 27/10/2026' && q.dau.nhan_vien === 'Thu' && q.dau.khach === 'Chị Hoa', JSON.stringify(q.dau));
  // chữ tem
  k('G57 chuTem: rỗng mặc định; có chữ thì tự điền và cắt ≤ 40 (39 ký tự + …)', chuTem({}, 'tem_dau', 'A') === '' && chuTem({ invoice_chu_tem_dau: 'Chào {ten_khach}' }, 'tem_dau', 'An') === 'Chào An'
    && chuTem({ invoice_chu_tem_chan: 'x'.repeat(41) }, 'tem_chan', '') === 'x'.repeat(39) + '…' && chuTem({ invoice_chu_tem_chan: 'x'.repeat(40) }, 'tem_chan', '') === 'x'.repeat(40));
  k('G58 chuTem: bật / tắt từng dòng (invoice_an_tem_dau)', chuTem({ invoice_chu_tem_dau: 'Chào', invoice_an_tem_dau: 'true' }, 'tem_dau', '') === '');
  return P;
}

// ═══ [C] QR giải mã được ═══
async function phanC() {
  muc('[C] QR: veQr.js vẽ → jsqr giải mã ra đúng đường dẫn');
  const V = await nap('veQr.js');
  if (V.loi) { k('C0 nạp được client/src/utils/veQr.js (+ thư viện qrcode-generator 1.4.4)', false, V.loi); return; }
  let jsQR;
  try { jsQR = require(path.join(GOC, 'client', 'node_modules', 'jsqr')); } catch (e) { k('C0b nạp được jsqr', false, e.message); return; }
  jsQR = jsQR.default || jsQR;
  const giaiMa = (text) => {
    const { n, hang } = V.veQr(text);
    const heSo = 6, le = 4, W = (n + 2 * le) * heSo;
    const px = new Uint8ClampedArray(W * W * 4).fill(255);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (hang[r][c]) {
      for (let y = 0; y < heSo; y++) for (let x = 0; x < heSo; x++) {
        const o = (((r + le) * heSo + y) * W + (c + le) * heSo + x) * 4; px[o] = px[o + 1] = px[o + 2] = 0;
      }
    }
    return jsQR(px, W, W)?.data;
  };
  for (const text of ['https://app.example.vn/', 'https://app.example.vn/?ma=TQD-ABCDEFGHJKMN', 'https://app-khach-hang.onrender.com/dang-ky?x=1&ma=TQD-ZZZZZZZZZZZZ',
    'https://a.vn/' + 'x'.repeat(120)]) {
    let ra; try { ra = giaiMa(text); } catch (e) { ra = 'LỖI ' + e.message; }
    k(`C1 giải mã ra đúng đường dẫn (${text.length} ký tự)`, ra === text, `ra "${ra}"`);
  }
  k('C2 qrSvg: chuỗi SVG có <svg và các ô đen; rỗng → ""', typeof V.qrSvg === 'function' && /^<svg[^>]*viewBox/.test(V.qrSvg('https://a.vn/')) && /<path|<rect/.test(V.qrSvg('https://a.vn/')) && V.qrSvg('') === '');
  k('C3 veQr(rỗng) không ném, trả ma trận rỗng', (() => { try { const r = V.veQr(''); return r.n === 0; } catch { return false; } })());
}

// ═══ [F] tem ═══
async function phanF() {
  muc('[F] tem ly: chữ đầu / cuối tuỳ chỉnh, số bill to');
  const I = await nap('inPhieu.js');
  if (I.loi) { k('F0 nạp được inPhieu.js', false, I.loi); return; }
  const don = { code: 'ORD-20261027-012', created_at: '2026-10-27T09:30:00', customer_name: 'An', customer_phone: '', items: [{ product_id: 1, product_code: 'A', product_name: 'Trà gừng', quantity: 2, note: 'Ít đá' }] };
  const tem = (st) => I.dungBoIn(don, st, { loai: ['tem'] })[0].trang;
  k('F1 mặc định (không chữ tuỳ chỉnh): tem không có dòng đầu / cuối — giữ nguyên tem P16', tem({}).every((t) => !t.dau && !t.chan) && tem({}).length === 2);
  const t = tem({ invoice_chu_tem_dau: 'Tứ Quý Đường', invoice_chu_tem_chan: 'Cảm ơn {ten_khach}!' });
  k('F2 chữ đầu / chân tem tự điền tên khách, có ở MỌI tem', t.every((x) => x.dau === 'Tứ Quý Đường' && x.chan === 'Cảm ơn An!'), JSON.stringify(t[0]));
  k('F3 chữ tem quá 40 ký tự bị cắt (39 + …), đúng 40 giữ nguyên', tem({ invoice_chu_tem_dau: 'a'.repeat(41) })[0].dau === 'a'.repeat(39) + '…' && tem({ invoice_chu_tem_dau: 'a'.repeat(40) })[0].dau === 'a'.repeat(40));
  k('F4 tắt dòng tem (invoice_an_tem_chan) → không in chân', tem({ invoice_chu_tem_chan: 'x', invoice_an_tem_chan: 'true' }).every((x) => !x.chan));
  k('F5 số bill trên tem + "1/2" + tên món + ghi chú + giờ vẫn đủ', t[0].ma === '012' && t[0].stt === '1/2' && t[0].ten === 'Trà gừng' && t[0].ghiChu === 'Ít đá' && t[0].gio === '09:30');
  const donLe = { ...don, customer_name: 'Khách lẻ' };
  k('F7 khách lẻ: {ten_khach} trên tem = "quý khách" (không in "Khách lẻ")', I.dungBoIn(donLe, { invoice_chu_tem_chan: 'Chào {ten_khach}' }, { loai: ['tem'] })[0].trang[0].chan === 'Chào quý khách');
  k('F6 bộ in vẫn: bill 1 trang mặc định (số tờ 2 do hoá đơn nhân, ca P16 giữ nguyên)', I.dungBoIn(don, {}, {}).find((j) => j.loai === 'bill').trang.length === 1);
}

// ═══ [A] cửa dữ liệu trên máy chủ thật + [H] K5 ═══
async function phanA(P) {
  muc('[A] GET /api/pos/hoa-don/:id trên kho thử (đơn thật qua POST /orders)');
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }), outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };
  const app = express();
  app.use(express.json());
  let hoaDonRoute = null, loiNap = '';
  for (const r of ['orders', 'wallets', 'signup-codes', 'settings']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  try { hoaDonRoute = require(path.join(MAY_CHU, 'routes', 'hoaDon.js')); app.use('/api/pos/hoa-don', hoaDonRoute); } catch (e) { loiNap = e.message; }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body, khongThe = false) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', ...(khongThe ? {} : { Authorization: 'Bearer ' + the }) } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false'],
    ['nhandiem_enabled', 1], ['nhandiem_he_so', 2], ['signup_enabled', 'false']]) await datCaiDat(key, v);
  for (const [key, v] of [['store_name', 'TỨ QUÝ ĐƯỜNG'], ['store_address', 'LK4 Trương Định'], ['store_phone', '024 2245 5565']]) await datCaiDat(key, v);
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  const GIA = [25000, 20000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl });
  let soSdt = 0;
  const sdtMoi = () => '0937' + String(400000 + (++soSdt));
  const ban = (body) => goi('POST', '/orders', { customer_name: 'Khách HD-1', items: [mon(0)], ...body });
  const nap = async (sdt, soTien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: soTien, customer_name: 'Khách HD-1', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const hd = async (id) => { const r = await goi('GET', '/hoa-don/' + id); return { ...r, h: r.hoa_don }; };
  const tong = (ds) => ds.reduce((s, x) => s + x.so_tien, 0);
  const trongFlash = async (f) => {
    const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`], ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`],
      ['flash_percent', 20], ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    try { return await f(); } finally { await datCaiDat('flash_enabled', 'false'); }
  };

  if (!hoaDonRoute) { k('A0 nạp được server/routes/hoaDon.js', false, loiNap); }
  k('A1 chưa đăng nhập → 401', (await goi('GET', '/hoa-don/1', null, true)).status === 401, moTa(await goi('GET', '/hoa-don/1', null, true)));
  const khong = await goi('GET', '/hoa-don/99999');
  k('A2 đơn không có → 404 KHONG_THAY_DON', khong.status === 404 && khong.code === 'KHONG_THAY_DON', moTa(khong));
  k('A2b id rác ("abc", "1e3", "-1") → 404, không ném', (await Promise.all(['abc', '1e3', '-1'].map((x) => goi('GET', '/hoa-don/' + x)))).every((r) => r.status === 404));

  // khách lẻ, tiền mặt, có mã nhận điểm
  const r1 = await ban({ payment_method: 'cash', cash_amount: 25000, cash_received: 30000, change_amount: 5000 });
  const a1 = await hd(r1.order?.id);
  k('A3 đơn khách lẻ tiền mặt: số bill = số đơn, mã đơn đúng, tổng 25.000', a1.status === 200 && a1.h?.don.code === r1.order.code && a1.h.don.so_bill === r1.order.code.split('-').pop() && a1.h.tien.tong === 25000 && a1.h.don.id === r1.order.id, moTa(a1));
  k('A4 thanh toán: chỉ tiền mặt 25.000 · khách đưa 30.000 · trả lại 5.000', bang(a1.h?.thanh_toan, [{ loai: 'tien_mat', so_tien: 25000 }]) && a1.h.khach_dua === 30000 && a1.h.tra_lai === 5000, JSON.stringify(a1.h?.thanh_toan));
  k('A5 khách lẻ: la_khach_le, không mục điểm; quán = tên · địa chỉ · SĐT của Cài đặt', a1.h?.khach.la_khach_le === true && a1.h.diem === null && a1.h.quan.ten === 'TỨ QUÝ ĐƯỜNG' && a1.h.quan.dia_chi === 'LK4 Trương Định' && a1.h.quan.sdt === '024 2245 5565', JSON.stringify([a1.h?.khach, a1.h?.diem, a1.h?.quan]));
  k('A6 đơn trả đủ: giá gốc = giảm + tổng chuỗi cân', a1.h && a1.h.tien.gia_goc - a1.h.tien.giam_hang - a1.h.tien.giam_flash - a1.h.tien.giam_ma + a1.h.tien.phi_giao === a1.h.tien.tong);
  k('A7 món: số lượng, tên, giá gốc, thành tiền; không giá hạng', bang(a1.h?.mon.map((m) => [m.so_luong, m.gia_goc, m.gia_hang, m.thanh_tien]), [[1, 25000, null, 25000]]), JSON.stringify(a1.h?.mon));
  // N = số /nhan-diem cộng thật
  const ma1 = a1.h?.ma_nhan_diem;
  k('A8 khách lẻ có mã in trên bill: mã = signup_code của đơn, N = 50 (25 điểm gốc × hệ số 2)', ma1?.ma === r1.order.signup_code && ma1.diem === 50, JSON.stringify(ma1));
  const nhan = await goi('POST', '/signup-codes/nhan-diem', { code: r1.order.signup_code, phone: sdtMoi() });
  k('A9 N trên hoá đơn = số điểm /nhan-diem cộng THẬT', nhan.status === 200 && nhan.diem_cong === ma1?.diem, `${moTa(nhan)} · cộng ${nhan.diem_cong} · hoá đơn ${ma1?.diem}`);
  const a1b = await hd(r1.order.id);
  k('A10 in lại sau khi mã đã dùng: KHÔNG còn hứa điểm (N = 0)', a1b.h?.ma_nhan_diem?.diem === 0, JSON.stringify(a1b.h?.ma_nhan_diem));
  // hệ số đổi → N đổi theo (cùng hàm)
  await datCaiDat('nhandiem_he_so', 3);
  const r1c = await ban({ payment_method: 'cash', cash_amount: 25000 });
  k('A11 hệ số 3 → N = 75 (đổi cấu hình, hoá đơn đi theo)', (await hd(r1c.order.id)).h?.ma_nhan_diem?.diem === 75);
  await datCaiDat('nhandiem_he_so', 2);
  // N = 0 các lý do
  const rFlash = await trongFlash(() => ban({ payment_method: 'cash', cash_amount: 20000 }));
  const aF = await hd(rFlash.order?.id);
  k('A12 đơn Flash: có mã nhưng N = 0 (không hứa điểm); giảm Flash tách dòng', aF.status === 200 && aF.h.ma_nhan_diem?.ma === rFlash.order.signup_code && aF.h.ma_nhan_diem.diem === 0 && aF.h.tien.giam_flash > 0, `${moTa(aF)} · ${JSON.stringify(aF.h?.ma_nhan_diem)} · ${aF.h?.tien.giam_flash}`);
  const nhanF = await goi('POST', '/signup-codes/nhan-diem', { code: rFlash.order.signup_code, phone: sdtMoi() });
  k('A13 /nhan-diem cũng từ chối đơn Flash (N = 0 là đúng thật)', nhanF.status === 400 && nhanF.code === 'DON_FLASH_KHONG_DIEM', moTa(nhanF));
  const s0 = sdtMoi(); await nap(s0, 50000);
  const r0 = await ban({ customer_phone: s0, payment_method: 'balance', balance_amount: 25000 });
  k('A14 đơn 0 điểm do trừ hết bằng tài khoản (khách có SĐT): không ô mã (mã gắn SĐT)', (await hd(r0.order?.id)).h?.ma_nhan_diem === null);
  await datCaiDat('nhandiem_enabled', 0);
  const rTat = await ban({ payment_method: 'cash', cash_amount: 25000 });
  const aTat = await hd(rTat.order.id);
  k('A15 chương trình nhận điểm TẮT: có mã, N = 0, ưu đãi khách mới tắt → client không in ô', aTat.h?.ma_nhan_diem?.diem === 0 && aTat.h.ma_nhan_diem.uu_dai === false, JSON.stringify(aTat.h?.ma_nhan_diem));
  await datCaiDat('signup_enabled', 'true');
  k('A16 ưu đãi khách mới bật: cờ uu_dai = true (N vẫn 0)', (await hd(rTat.order.id)).h?.ma_nhan_diem?.uu_dai === true && (await hd(rTat.order.id)).h.ma_nhan_diem.diem === 0);
  await datCaiDat('nhandiem_enabled', 1); await datCaiDat('signup_enabled', 'false');
  await datCaiDat('loyalty_enabled', 'false');
  k('A17 tích điểm TẮT: N = 0', (await hd((await ban({ payment_method: 'cash', cash_amount: 25000 })).order.id)).h?.ma_nhan_diem?.diem === 0);
  await datCaiDat('loyalty_enabled', 'true');
  const rShip = await ban({ payment_method: 'cash', cash_amount: 48000, shipping_fee: 23000 });
  const aShip = await hd(rShip.order?.id);
  k('A18 phí giao: không tính điểm (N = (25.000 ÷ 1.000) × 2 = 50) và hiện thành dòng riêng', aShip.h?.tien.phi_giao === 23000 && aShip.h.tien.tong === 48000 && aShip.h.ma_nhan_diem?.diem === 50, JSON.stringify([aShip.h?.tien, aShip.h?.ma_nhan_diem]));

  const nhanS = await goi('POST', '/signup-codes/nhan-diem', { code: rShip.order?.signup_code, phone: sdtMoi() });
  k('A18b đơn có phí giao: N trên hoá đơn = số /nhan-diem cộng THẬT (đường trả thật, không tính phí giao)', nhanS.status === 200 && nhanS.diem_cong === aShip.h?.ma_nhan_diem?.diem, `${moTa(nhanS)} · ${nhanS.diem_cong} vs ${aShip.h?.ma_nhan_diem?.diem}`);
  const rHet = await ban({ payment_method: 'cash', cash_amount: 25000 });
  await db.run("UPDATE pos_signup_codes SET issued_at = '2020-01-01T00:00:00' WHERE order_id = ?", [rHet.order.id]);
  const aHet = await hd(rHet.order.id);
  k('A18c mã quá hạn (in từ lâu): N = 0 và không còn ưu đãi — /nhan-diem cũng từ chối MA_HET_HAN', aHet.h?.ma_nhan_diem?.diem === 0 && aHet.h.ma_nhan_diem.uu_dai === false
    && (await goi('POST', '/signup-codes/nhan-diem', { code: rHet.order.signup_code, phone: sdtMoi() })).code === 'MA_HET_HAN', JSON.stringify(aHet.h?.ma_nhan_diem));

  // làm tròn xuống: 25.000 ÷ 10.000 = 2,5 → 2 điểm gốc × 2 = 4 (làm tròn lên sẽ ra 6)
  await datCaiDat('loyalty_earn_per_amount', 10000);
  const rLe = await ban({ payment_method: 'cash', cash_amount: 25000 });
  const aLe = await hd(rLe.order.id);
  const nhanLe = await goi('POST', '/signup-codes/nhan-diem', { code: rLe.order.signup_code, phone: sdtMoi() });
  await datCaiDat('loyalty_earn_per_amount', 1000);
  k('A18d điểm gốc làm tròn XUỐNG như /nhan-diem: N = 4 và đúng số được cộng thật', aLe.h?.ma_nhan_diem?.diem === 4 && nhanLe.diem_cong === 4, `${aLe.h?.ma_nhan_diem?.diem} vs ${nhanLe.diem_cong}`);

  // khách quen có hạng: mua thẻ, tài khoản, điểm
  const hang = await mot('SELECT id, card_price, name FROM pos_membership_tiers WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_membership_tiers SET discount_percent = 10 WHERE id = ?', [hang.id]);
  const sq = sdtMoi(); await nap(sq, Number(hang.card_price) + 200000);
  const mua = await ban({ customer_phone: sq, items: [], membership_buy: { tier_id: hang.id }, payment_method: 'balance', balance_amount: Number(hang.card_price) });
  const rq = await ban({ customer_phone: sq, items: [mon(0), mon(1)], payment_method: 'cash', balance_amount: 20000, cash_amount: 25500, shipping_fee: 5000 });
  const aq = await hd(rq.order?.id);
  const H = aq.h;
  k('A19 khách quen có hạng: hạng + % lấy từ máy chủ, giảm hạng = 10 % của 45.000', mua.status === 200 && rq.status === 200 && H?.khach.hang === hang.name && H.khach.phan_tram === 10 && H.tien.giam_hang === 4500 && H.khach.la_khach_le === false, `${moTa(mua)} ${moTa(rq)} ${JSON.stringify(H?.khach)} ${H?.tien.giam_hang}`);
  k('A20 món có giá hạng: giá gốc + giá hạng (gạch ngang ở giao diện)', H?.mon[0].gia_goc === 25000 && H.mon[0].gia_hang === 22500 && H.mon[1].gia_hang === 18000 && H.mon[0].thanh_tien === 22500 && H.mon[0].thanh_tien_goc === 25000, JSON.stringify(H?.mon));
  k('A21 chuỗi: giá gốc 45.000 − hạng 4.500 + phí 5.000 = tổng 45.500', H?.tien.gia_goc === 45000 && H.tien.phi_giao === 5000 && H.tien.tong === 45500 && H.tien.gia_goc - H.tien.giam_hang - H.tien.giam_flash - H.tien.giam_ma + H.tien.phi_giao === H.tien.tong, JSON.stringify(H?.tien));
  k('A22 thanh toán: tài khoản 20.000 + tiền mặt = tổng hoá đơn', H && tong(H.thanh_toan) === H.tien.tong && H.thanh_toan[0].loai === 'tai_khoan' && H.thanh_toan[0].so_tien === 20000, JSON.stringify(H?.thanh_toan));
  await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at) VALUES (?, 'adjust', -7, ?, NULL, 'Hoàn điểm: thử', 'thu', ?)", [sq, rq.order.id, rq.order.created_at]);   // dòng điều chỉnh của đơn KHÔNG phải điểm cộng
  const earn = Number((await mot("SELECT COALESCE(SUM(points),0) AS n FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [rq.order.id])).n);
  k('A23 điểm: cộng đơn này = dòng earn của sổ điểm; hiện có = trước + cộng; khách quen không ô mã', H?.diem?.cong === earn && H.diem.hien_co === H.diem.truoc + H.diem.cong && H.diem.doi_qua === 0 && H.ma_nhan_diem === null, JSON.stringify(H?.diem));
  const truocIn = H.diem;
  await ban({ customer_phone: sq, items: [mon(0, 3)], payment_method: 'cash', cash_amount: 67500 });
  const aq2 = await hd(rq.order.id);
  k('A24 in lại sau khi khách mua thêm: phần điểm CỦA ĐƠN không đổi (không lấy số dư lúc in)', bang(aq2.h?.diem, truocIn), JSON.stringify([truocIn, aq2.h?.diem]));
  // đổi quà: voucher đổi bằng điểm trước đơn → "Đổi quà −N" và điểm trước đơn tính cả phần đã đổi
  const tx = await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at) VALUES (?, 'redeem', -100, NULL, NULL, 'Đổi quà: thử', 'thu', '2020-01-01T00:00:00')", [sq]);
  await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status, point_tx_id, granted_at) VALUES ('HD1DOIQUA', ?, 'used', ?, '2020-01-01T00:00:00')", [sq, Number(tx.lastInsertRowid)]);
  await db.run("UPDATE pos_orders SET discount_code = 'HD1DOIQUA' WHERE id = ?", [rq.order.id]);
  const aDoi = await hd(rq.order.id);
  k('A23b có đổi quà (voucher đổi điểm dùng ở đơn này): đổi quà = 100, điểm trước đơn = số dư trước + 100, hiện có = trước − đổi + cộng',
    aDoi.h?.diem?.doi_qua === 100 && aDoi.h.diem.truoc === truocIn.truoc && aDoi.h.diem.hien_co === aDoi.h.diem.truoc - 100 + aDoi.h.diem.cong, JSON.stringify([truocIn, aDoi.h?.diem]));
  await db.run("UPDATE pos_orders SET discount_code = NULL WHERE id = ?", [rq.order.id]);
  await db.run('DELETE FROM pos_voucher_grants WHERE code = ?', ['HD1DOIQUA']);
  await db.run('DELETE FROM pos_point_transactions WHERE id = ?', [Number(tx.lastInsertRowid)]);
  // tài khoản mẹ + chuyển khoản
  const me = sdtMoi(); await nap(me, 30000);
  const rMe = await ban({ customer_phone: sdtMoi(), parent_phone: me, payment_method: 'transfer', parent_balance_amount: 10000, transfer_amount: 15000 });
  const aMe = await hd(rMe.order?.id);
  k('A25 tài khoản mẹ + chuyển khoản: hai dòng riêng, tổng = tổng hoá đơn', rMe.status === 200 && bang(aMe.h?.thanh_toan, [{ loai: 'tai_khoan_me', so_tien: 10000 }, { loai: 'chuyen_khoan', so_tien: 15000 }]) && aMe.h.khach_dua === 0, `${moTa(rMe)} ${JSON.stringify(aMe.h?.thanh_toan)}`);
  const sFull = sdtMoi(); await nap(sFull, 25000);
  const rFull = await ban({ customer_phone: sFull, payment_method: 'balance', balance_amount: 25000 });
  k('A26 (K5) trừ hết bằng tài khoản: một dòng tài khoản, không tiền mặt', bang((await hd(rFull.order?.id)).h?.thanh_toan, [{ loai: 'tai_khoan', so_tien: 25000 }]));
  const rNo = await ban({ customer_phone: sdtMoi(), payment_method: 'debt', debt_amount: 25000 });
  const aNo = await hd(rNo.order?.id);
  k('A27 (K5) đơn nợ: một dòng ghi nợ, vẫn 200', aNo.status === 200 && bang(aNo.h?.thanh_toan, [{ loai: 'ghi_no', so_tien: 25000 }]), moTa(aNo));
  // đơn huỷ / cũ / dữ liệu lệch
  await db.run("UPDATE pos_orders SET status = 'cancelled' WHERE id = ?", [r1c.order.id]);
  const aH = await hd(r1c.order.id);
  k('A28 (K5) đơn đã huỷ vẫn đọc được, trạng thái "cancelled", mã không hứa điểm', aH.status === 200 && aH.h.don.trang_thai === 'cancelled' && aH.h.ma_nhan_diem?.diem === 0, `${moTa(aH)} ${JSON.stringify(aH.h?.ma_nhan_diem)}`);
  const cu = await db.run(`INSERT INTO pos_orders (code, customer_name, subtotal, discount, total, payment_method, status, created_by, created_at)
    VALUES ('ORD-20260101-001', 'Khách lẻ', 40000, 0, 40000, 'cash', 'completed', 'thu', '2026-01-01T09:00:00')`);
  await db.run("INSERT INTO pos_order_items (order_id, product_id, product_code, product_name, quantity, unit_price, total_price, tier_unit_price) VALUES (?, 1, 'X', 'Món cũ', 2, 20000, 40000, 20000)", [Number(cu.lastInsertRowid)]);
  const aCu = await hd(Number(cu.lastInsertRowid));
  k('A29 (K5) đơn cũ trước HD-1 (cột mới NULL, không cột tiền mặt; giá hạng = giá gốc không tính là giảm): 200, tổng các dòng thanh toán = 40.000', aCu.status === 200 && tong(aCu.h.thanh_toan) === 40000 && aCu.h.tien.tong === 40000 && aCu.h.mon[0].gia_hang === null && aCu.h.mon[0].thanh_tien === 40000 && aCu.h.ma_nhan_diem === null && aCu.h.so_lan_in === 0, `${moTa(aCu)} ${JSON.stringify(aCu.h?.thanh_toan)}`);
  const cuCk = await db.run(`INSERT INTO pos_orders (code, customer_name, subtotal, total, payment_method, status, created_by, created_at)
    VALUES ('ORD-20260101-002', 'Khách lẻ', 40000, 40000, 'transfer', 'completed', 'thu', '2026-01-01T09:05:00')`);
  k('A30 (K5) đơn cũ chuyển khoản thiếu cột transfer_amount → dồn vào chuyển khoản', bang((await hd(Number(cuCk.lastInsertRowid))).h?.thanh_toan, [{ loai: 'chuyen_khoan', so_tien: 40000 }]));
  // số lần in
  await goi('POST', '/settings/invoice/log', { order_id: rq.order.id, order_code: rq.order.code, invoice_number: 'HD-TEST-0', paper_size: '80mm' });   // log của đơn KHÁC không được tính
  const lan0 = (await hd(r1.order.id)).h?.so_lan_in;
  await goi('POST', '/settings/invoice/log', { order_id: r1.order.id, order_code: r1.order.code, invoice_number: 'HD-TEST-1', paper_size: '80mm' });
  await goi('POST', '/settings/invoice/log', { order_id: r1.order.id, order_code: r1.order.code, invoice_number: 'HD-TEST-1', paper_size: '80mm' });
  k('A31 số lần đã in = số dòng nhật ký in của đơn (0 → 2)', lan0 === 0 && (await hd(r1.order.id)).h?.so_lan_in === 2, `${lan0} → ${(await hd(r1.order.id)).h?.so_lan_in}`);
  // đúng hình dạng cho hàm thuần
  if (P) {
    const dong = P.dungHoaDon(H, { invoice_kh_url: 'https://app.example.vn/?ma={ma}' });
    k('A32 dữ liệu máy chủ thật đi qua dungHoaDon: dòng tổng = 45.500đ, thanh toán cân, QR không mã', dong.tien.at(-1).tien === '45.500đ' && dong.dau.qr === 'https://app.example.vn/' && dong.dau.so_bill === H.don.so_bill, JSON.stringify(dong.tien));
    const dongLe = P.dungHoaDon(a1.h, { invoice_kh_url: 'https://app.example.vn/?ma={ma}' });
    k('A33 khách lẻ thật: QR mang đúng mã nhận điểm của đơn; chữ N = 50', dongLe.dau.qr === `https://app.example.vn/?ma=${r1.order.signup_code}` && dongLe.ma_diem?.chu.includes('+50 điểm'), `${dongLe.dau.qr} · ${dongLe.ma_diem?.chu}`);
  }

  // cài đặt: máy chủ từ chối khoá ẩn mục bắt buộc
  muc('[E] PUT /settings: máy chủ từ chối khoá ẩn mục bắt buộc, số tờ chỉ 1 / 2');
  const KHONG_AN_MC = hoaDonRoute?.KHONG_AN_DUOC;
  if (P) k('E1 danh sách mục không ẩn được: client = máy chủ', bang([...(KHONG_AN_MC || [])].sort(), [...P.KHONG_AN].sort()), JSON.stringify(KHONG_AN_MC));
  let anhEm = true; const chiTiet = [];
  for (const kh of ['ten_quan', 'so_bill', 'tong', 'tieu_de_tt', 'tu_tk', 'ck', 'tm']) {
    const r = await goi('PUT', '/settings', { settings: { [`invoice_an_${kh}`]: 'true', invoice_chu_ghi_chu: 'KHONG_DUOC_GHI_' + kh } });
    const ghi = await mot("SELECT value FROM pos_settings WHERE key = 'invoice_chu_ghi_chu'");
    if (!(r.status === 400 && r.code === 'KHOA_KHONG_AN_DUOC' && !String(ghi?.value || '').startsWith('KHONG_DUOC_GHI_'))) { anhEm = false; chiTiet.push(`${kh}: ${moTa(r)} ghi=${ghi?.value}`); }
  }
  k('E2 ẩn từng mục bắt buộc → 400 KHOA_KHONG_AN_DUOC và KHÔNG ghi gì (kể cả khoá khác cùng yêu cầu)', anhEm, chiTiet.join(' | '));
  const rAn1 = await goi('PUT', '/settings', { settings: { invoice_an_tong: '1' } });
  const rAnB = await goi('PUT', '/settings', { settings: { invoice_an_tm: true } });
  k('E2b ghi ẩn bằng "1" hoặc true (JSON) cũng bị từ chối', rAn1.code === 'KHOA_KHONG_AN_DUOC' && rAnB.code === 'KHOA_KHONG_AN_DUOC', `${moTa(rAn1)} ${moTa(rAnB)}`);
  const rOk = await goi('PUT', '/settings', { settings: { invoice_an_phi_giao: 'true', invoice_chu_tong: 'PHẢI TRẢ', invoice_an_tong: 'false' } });
  k('E3 (K5) ẩn mục không bắt buộc + sửa chữ + "invoice_an_tong: false" → 200, đã ghi', rOk.status === 200 && (await mot("SELECT value FROM pos_settings WHERE key = 'invoice_chu_tong'"))?.value === 'PHẢI TRẢ', moTa(rOk));
  const rSo = await goi('PUT', '/settings', { settings: { invoice_so_to: '3' } });
  const rSo1 = await goi('PUT', '/settings', { settings: { invoice_so_to: '1' } });
  const rSo2 = await goi('PUT', '/settings', { settings: { invoice_so_to: '2' } });
  k('E4 số tờ: 3 → 400 SO_TO_KHONG_HOP_LE; 1 và 2 → 200', rSo.status === 400 && rSo.code === 'SO_TO_KHONG_HOP_LE' && rSo1.status === 200 && rSo2.status === 200, `${moTa(rSo)} ${moTa(rSo1)} ${moTa(rSo2)}`);
  k('E5 (K5) PUT cài đặt cũ (khoá store_name…) không đổi hành vi', (await goi('PUT', '/settings', { settings: { store_name: 'TÚ QUÝ ĐƯỜNG' } })).status === 200);

  // khoá seed khớp hằng số của client
  if (P) {
    const nguon = fs.readFileSync(path.join(MAY_CHU, 'database.js'), 'utf8');
    const seed = Object.fromEntries([...nguon.matchAll(/\['invoice_chu_(\w+)', '((?:[^'\\]|\\.)*)'\]/g)].map((x) => [x[1], x[2]]));
    const lech = Object.keys(P.CHU_MAC_DINH).filter((kh) => !['ten_quan', 'dia_chi'].includes(kh) && seed[kh] !== P.CHU_MAC_DINH[kh]);
    k('E6 khoá seed invoice_chu_* ở database.js khớp CHU_MAC_DINH của client (trừ ten_quan, dia_chi theo store_*)', lech.length === 0 && !('ten_quan' in seed) && /\['invoice_so_to', '2'\]/.test(nguon) && /\['invoice_kh_url', ''\]/.test(nguon), 'lệch: ' + lech.join());
  }

  const src = (f) => fs.readFileSync(path.join(GOC, f), 'utf8');
  k('A35 index.js gắn /api/pos/hoa-don vào routes/hoaDon', /app\.use\('\/api\/pos\/hoa-don',\s*require\('\.\/routes\/hoaDon'\)\)/.test(src('server/index.js')));
  k('H1 InvoicePrint (Sales · Orders · ManKetThuc dùng chung) vẽ bill từ cửa hoá đơn, giữ bố cục cũ làm dự phòng khi cửa lỗi',
    /api\.get\(`\/hoa-don\/\$\{order\.id\}`\)/.test(src('client/src/components/InvoicePrint.jsx')) && /danhSachTo\(hd, settings/.test(src('client/src/components/InvoicePrint.jsx')) && /<InvoicePreview\b/.test(src('client/src/components/InvoicePrint.jsx')));

  // một cửa: hoá đơn KHÔNG ghi gì
  const truoc = JSON.stringify(await db.query('SELECT id, total, status, payment_status FROM pos_orders ORDER BY id'));
  await Promise.all([r1.order.id, rq.order.id, rFlash.order.id, r1c.order.id].map((i) => goi('GET', '/hoa-don/' + i)));
  const sau = JSON.stringify(await db.query('SELECT id, total, status, payment_status FROM pos_orders ORDER BY id'));
  k('A34 chỉ ĐỌC: gọi hoá đơn nhiều lần (song song) không đổi đơn nào', truoc === sau);
  // lỗi máy chủ không lộ chữ nội bộ
  await db.run('ALTER TABLE pos_invoice_logs RENAME TO pos_invoice_logs_tam');
  const aLoi = await goi('GET', '/hoa-don/' + r1.order.id);
  await db.run('ALTER TABLE pos_invoice_logs_tam RENAME TO pos_invoice_logs');
  k('A36 kho hỏng giữa chừng → 500 chỉ { error, code: LOI_MAY_CHU }, không lộ tên bảng / lỗi nội bộ', aLoi.status === 500 && aLoi.code === 'LOI_MAY_CHU' && !/pos_invoice_logs|no such table|SQL/i.test(JSON.stringify(aLoi)), moTa(aLoi));
  sv.close();
}

async function main() {
  console.log('\nTHỬ HD-1 — hoá đơn bố cục mới');
  const P = await phanG();
  await phanC();
  await phanF();
  try { await phanA(P && !P.loi ? P : null); } catch (e) { noiLai(); k('A99 phần A chạy hết, không sập', false, e.message); }
  console.log(`\n${dat} đạt · ${hong} hỏng\n`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error(`\n✖ Bài thử sập: ${e.stack || e.message}\n`); process.exit(2); });
