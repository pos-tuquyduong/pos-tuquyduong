#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BH-2 — màn Bán hàng mới đợt 2: giá máy chủ tính · thu tiền (QR payOS, PIN, giữ tiền) · màn kết thúc HD-1 · menu 6 mục
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (tinh.js chưa có hàm đợt 2, chưa có QuanLy/menu.js). Xanh ngay từ đầu = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_BH2.js [--goc <thư mục>]     (in "n đạt · 0 hỏng")
 *  --goc: chạy trên bản sao cây kho (đột biến, viec/BH-2/dot_bien.py). Phần máy chủ luôn dùng server/ của --goc.
 *
 *  [1] Hàm thuần (tinh.js, QuanLy/menu.js — ES module, nạp bằng import()).
 *  [2] Ca THẬT: thân yêu cầu do CHÍNH hàm của màn dựng (thanTinhThu, thanPhien) được gửi vào máy chủ thật (database.js + libsql trên
 *      kho TẠM, payOS giả trên 127.0.0.1 như thu_P3.js) — hàm dựng sai thân thì máy chủ từ chối, ca đỏ. Không gọi SX.
 *  [3] Cấu trúc nguồn: chỉ những chỗ máy không thể thử bằng hàm thuần.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const SRC = path.join(GOC, 'client', 'src');
const BH = path.join(SRC, 'pages', 'BanHang');
const DOC = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');
const CO = (...p) => fs.existsSync(path.join(GOC, ...p));

const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_bh2_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngau = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_bh2_nv_' + ngau();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_bh2_kh_' + ngau();
const KHOA = { id: 'id_' + ngau(), api: 'api_' + ngau(), ck: 'ck_' + ngau() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.bh2.local/tra-ve';

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log(`\n${t}`);
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const nap = async (p) => { try { return await import(pathToFileURL(p).href); } catch (e) { return { loiNap: e.message }; } };

async function main() {
  const T = await nap(path.join(BH, 'tinh.js'));
  const M = await nap(path.join(SRC, 'pages', 'QuanLy', 'menu.js'));
  const f = (X, ten) => (typeof X[ten] === 'function' ? X[ten] : () => { throw new Error('thiếu hàm ' + ten); });
  const t = (ten) => f(T, ten);
  const thu = (ten, fn) => { try { k(ten, !!fn()); } catch (e) { k(ten, false, e.message); } };
  k('H · nạp được BanHang/tinh.js', !T.loiNap, T.loiNap || '');

  // ═══ [1] A · giá do máy chủ tính ════════════════════════════════════════════
  muc('A · giá máy chủ tính: khoá tính / thân tinh-thu / nút thu');
  const mon = (id, sl, note) => ({ key: id * 10 + sl, product_id: id, sx_product_type: 'juice', sx_product_id: id + 100, quantity: sl, unit_price: 30000, note });
  const gio = [mon(1, 2, 'Ít đá'), mon(2, 1)];
  const khach = { phone: '0912345678', name: 'Chị Hoa', balance: 50000 };
  const ktT = (g, kh, ma) => t('khoaTinh')(g, kh, ma);
  thu('A1 cùng giỏ + khách + mã → cùng khoá', () => ktT(gio, khach, 'ABC') === ktT([...gio], { ...khach }, 'ABC'));
  thu('A2 gõ / đổi ghi chú KHÔNG đổi khoá (không gọi lại máy chủ)', () => ktT(gio, khach, '') === ktT([{ ...gio[0], note: 'Nhiều đá' }, gio[1]], khach, ''));
  thu('A3 tách một món thành hai dòng khác ghi chú, tổng số lượng giữ nguyên → khoá giữ nguyên', () =>
    ktT(gio, khach, '') === ktT([mon(1, 1, 'a'), mon(1, 1, 'b'), gio[1]], khach, ''));
  thu('A4 đổi số lượng → khoá đổi', () => ktT(gio, khach, '') !== ktT([mon(1, 3), gio[1]], khach, ''));
  thu('A5 thêm / bớt món → khoá đổi', () => ktT(gio, khach, '') !== ktT([gio[0]], khach, ''));
  thu('A6 đổi khách (hoặc bỏ khách) → khoá đổi', () => ktT(gio, khach, '') !== ktT(gio, null, '') && ktT(gio, khach, '') !== ktT(gio, { ...khach, phone: '0900000001' }, ''));
  thu('A7 đổi mã → khoá đổi; mã chỉ khác hoa thường / khoảng trắng → khoá giữ nguyên', () =>
    ktT(gio, khach, 'ABC') !== ktT(gio, khach, 'ABD') && ktT(gio, khach, 'ABC') === ktT(gio, khach, ' abc '));
  thu('A8 số dư khách đổi (không dính tính tiền) → khoá giữ nguyên', () => ktT(gio, khach, '') === ktT(gio, { ...khach, balance: 1 }, ''));
  const tt = () => t('thanTinhThu')(gio, khach, ' abc ');
  thu('A9 thân tinh-thu: SĐT, tên, mã (cắt + HOA), món chỉ gồm khoá máy chủ nhận', () => {
    const b = tt();
    return b.customer_phone === '0912345678' && b.customer_name === 'Chị Hoa' && b.discount_code === 'ABC' && b.items.length === 2 &&
      bang(Object.keys(b.items[0]).sort(), ['from_package', 'note', 'product_id', 'quantity', 'sx_product_id', 'sx_product_type']) && b.items[0].from_package === false;
  });
  thu('A10 khách lẻ + không mã → customer_phone null, discount_code null, KHÔNG trường tiền nào', () => {
    const b = t('thanTinhThu')(gio, null, '');
    return b.customer_phone === null && b.discount_code === null && !('unit_price' in b.items[0]) && !('total' in b) && !('payment_method' in b);
  });
  const mayChu = { khoa: (() => { try { return ktT(gio, khach, ''); } catch { return 'chua-co-ham'; } })(), total: 86400 };
  const sang = (o) => t('nutThuSang')({ coSo: true, dangGui: false, cach: 'tien_mat', phaiTra: 86400, dua: 100000, ...o });
  thu('A11 đủ điều kiện → nút sáng', () => sang({}) === true);
  thu('A12 CHƯA có số máy chủ → nút thu tắt (mọi cách trả)', () =>
    sang({ coSo: false }) === false && sang({ coSo: false, cach: 'chuyen_khoan' }) === false && sang({ coSo: false, cach: 'tai_khoan', phaiTra: 0 }) === false);
  thu('A13 coSoMayChu: số máy chủ của giỏ CŨ (khoá khác) không tính', () =>
    t('coSoMayChu')(mayChu, mayChu.khoa) === true && t('coSoMayChu')(mayChu, 'khoa-khac') === false && t('coSoMayChu')(null, mayChu.khoa) === false &&
    t('coSoMayChu')({ khoa: mayChu.khoa }, mayChu.khoa) === false);
  thu('A14 đang gửi → nút tắt (chống bấm đôi)', () => sang({ dangGui: true }) === false);
  thu('A15 món giá 0 / âm / thiếu / chữ → "Chưa có giá", không chạm được; giá > 0 → có giá', () =>
    t('coGia')({ price: 0 }) === false && t('coGia')({ price: -1 }) === false && t('coGia')({}) === false && t('coGia')({ price: '30000' }) === false &&
    t('coGia')({ price: 30000 }) === true);

  // ═══ B · tiền mặt ══════════════════════════════════════════════════════════
  muc('B · tiền mặt: nút "Đã nhận tiền" chỉ sáng khi đủ');
  thu('B1 đưa thiếu 1 đồng → tắt; đúng / thừa → sáng', () => sang({ dua: 86399 }) === false && sang({ dua: 86400 }) === true && sang({ dua: 500000 }) === true);
  thu('B2 chưa chọn tờ (0) → tắt', () => sang({ dua: 0 }) === false);
  thu('B3 phải trả 0đ (giảm hết) → tiền mặt 0 vẫn thu được (như màn cũ)', () => sang({ phaiTra: 0, dua: 0 }) === true);

  // ═══ C · QR payOS ══════════════════════════════════════════════════════════
  muc('C · QR payOS: đếm ngược theo het_han máy chủ, trạng thái phiên');
  const bay = Date.parse('2026-10-29T10:05:00+07:00');
  thu('C1 conLaiGiay: hạn 10:10:00 giờ VN, bây giờ 10:05:00 → 300 giây', () => t('conLaiGiay')('2026-10-29T10:10:00', bay) === 300);
  thu('C2 conLaiGiay: quá hạn / đúng hạn → 0 (không âm); hạn lạ / rỗng → 0', () =>
    t('conLaiGiay')('2026-10-29T10:05:00', bay) === 0 && t('conLaiGiay')('2026-10-29T09:00:00', bay) === 0 && t('conLaiGiay')('', bay) === 0 && t('conLaiGiay')('xyz', bay) === 0);
  thu('C3 conLaiGiay làm tròn LÊN: còn 0,4 giây → 1 (chưa hiện hết hạn)', () => t('conLaiGiay')('2026-10-29T10:05:00', bay - 400) === 1);
  thu('C4 dinhDangDemNguoc: 300 → "05:00", 59 → "00:59", 600 → "10:00", 0 → "00:00"', () =>
    t('dinhDangDemNguoc')(300) === '05:00' && t('dinhDangDemNguoc')(59) === '00:59' && t('dinhDangDemNguoc')(600) === '10:00' && t('dinhDangDemNguoc')(0) === '00:00');
  thu('C5 hanhDongPhien: cho → doi · da_thu → xong · het_han / huy / loi → nha', () =>
    t('hanhDongPhien')('cho') === 'doi' && t('hanhDongPhien')('da_thu') === 'xong' &&
    ['het_han', 'huy', 'loi'].every((x) => t('hanhDongPhien')(x) === 'nha'));
  thu('C6 hanhDongPhien: trạng thái lạ / thiếu → doi (không tự nhả, không tự xong)', () => t('hanhDongPhien')('xyz') === 'doi' && t('hanhDongPhien')(undefined) === 'doi');
  thu('C7 chuyển khoản: nút sáng khi có số máy chủ và còn phải trả; phải trả 0 → tắt', () =>
    sang({ cach: 'chuyen_khoan', dua: 0 }) === true && sang({ cach: 'chuyen_khoan', dua: 0, phaiTra: 0 }) === false);

  // ═══ D · tài khoản + PIN ═══════════════════════════════════════════════════
  muc('D · tài khoản khách / mẹ + PIN');
  const chia = (o) => t('chiaTra')({ tong: 86400, khach: { balance: 50000, parent_balance: 20000 }, dungTK: true, dungMe: false, ...o });
  thu('D1 dùng tài khoản: trừ min(số dư, tổng); phần còn lại = phải trả', () => bang(chia({}), { soDuDung: 50000, soDuMeDung: 0, phaiTra: 36400 }));
  thu('D2 bỏ tài khoản → không trừ, phải trả = tổng', () => bang(chia({ dungTK: false }), { soDuDung: 0, soDuMeDung: 0, phaiTra: 86400 }));
  thu('D3 tài khoản mẹ là dòng riêng: chỉ trừ khi bật, và chỉ phần còn lại sau tài khoản khách', () =>
    bang(chia({ dungMe: true }), { soDuDung: 50000, soDuMeDung: 20000, phaiTra: 16400 }) && bang(chia({ dungTK: false, dungMe: true }), { soDuDung: 0, soDuMeDung: 20000, phaiTra: 66400 }));
  thu('D4 số dư lớn hơn tổng → trừ đúng tổng, phải trả 0', () => bang(chia({ khach: { balance: 999999 } }), { soDuDung: 86400, soDuMeDung: 0, phaiTra: 0 }));
  thu('D5 khách lẻ / không có số dư → không trừ', () => bang(chia({ khach: null }), { soDuDung: 0, soDuMeDung: 0, phaiTra: 86400 }) && bang(chia({ khach: { balance: 0 } }), { soDuDung: 0, soDuMeDung: 0, phaiTra: 86400 }));
  thu('D6 số dư âm / chữ → coi 0, không làm phải trả vượt tổng', () => chia({ khach: { balance: -5000 } }).phaiTra === 86400 && chia({ khach: { balance: 'abc' } }).phaiTra === 86400);
  const ck = (tong, phaiTra) => t('cachTraKhaDung')({ tong, phaiTra });
  thu('D7 còn phải trả > 0 → tiền mặt VÀ chuyển khoản (sửa lỗi "không còn nút nào" khi tài khoản không đủ)', () => bang(ck(86400, 36400), ['tien_mat', 'chuyen_khoan']));
  thu('D8 tài khoản trả đủ (phải trả 0, tổng > 0) → chỉ "tai_khoan"', () => bang(ck(86400, 0), ['tai_khoan']));
  thu('D9 đơn 0đ (tổng 0) → "tai_khoan" (máy chủ từ chối tiền mặt khi còn lại 0: CACH_KHONG_KHOP)', () => bang(ck(0, 0), ['tai_khoan']));
  thu('D10 phải trả 1đ → vẫn tiền mặt / chuyển khoản (ngay trên ngưỡng)', () => bang(ck(86400, 1), ['tien_mat', 'chuyen_khoan']));
  thu('D11 tài khoản đủ → nút thu sáng khi có số máy chủ', () => sang({ cach: 'tai_khoan', phaiTra: 0, dua: 0 }) === true);
  const lp = (c) => t('xuLyLoiPin')(c);
  thu('D12 PIN sai → nhập lại · khoá → về giỏ · chưa có PIN → đặt PIN · lỗi khác → loi', () =>
    lp('PIN_SAI') === 'nhap_lai' && lp('PIN_DANG_KHOA') === 've_gio' && lp('CHUA_CO_PIN') === 'dat_pin' && lp('SO_DU_KHONG_DU') === 'loi' && lp(undefined) === 'loi');
  thu('D13 datPinHopLe: đúng 4 số + gõ lại giống → null; sai → mã lỗi', () =>
    t('datPinHopLe')('1357', '1357') === null && t('datPinHopLe')('135', '135') === 'PIN_KHONG_HOP_LE' && t('datPinHopLe')('13a7', '13a7') === 'PIN_KHONG_HOP_LE' &&
    t('datPinHopLe')('1357', '1358') === 'PIN_KHONG_KHOP' && t('datPinHopLe')('13579', '13579') === 'PIN_KHONG_HOP_LE');
  thu('D14 nhapPhim: thêm chữ số tới tối đa 4, ⌫ xoá một, phím lạ bỏ qua', () =>
    t('nhapPhim')('', '1') === '1' && t('nhapPhim')('135', '7') === '1357' && t('nhapPhim')('1357', '9') === '1357' && t('nhapPhim')('135', '⌫') === '13' && t('nhapPhim')('', '⌫') === '' && t('nhapPhim')('1', 'x') === '1');
  const ph = (o) => t('thanPhien')({ gio, khach, ma: '', cach: 'payos', dungTK: false, dungMe: false, ...o });
  thu('D15 thân /phien: cách, don (khách + món + mã), cờ trừ tài khoản, PIN chỉ gửi khi trừ', () => {
    const a = ph({ cach: 'tien_mat', dungTK: true, pin: '1357' });
    const b = ph({});
    return a.cach === 'tien_mat' && a.tru_tai_khoan === true && a.pin === '1357' && a.don.customer_phone === '0912345678' && a.don.items.length === 2 &&
      b.tru_tai_khoan === false && !('pin' in b) && !('pin_me' in b);
  });
  thu('D16 thân /phien: tài khoản mẹ → parent_phone + tru_tai_khoan_me + pin_me; mặc định không có', () => {
    const a = ph({ khach: { ...khach, parent_phone: '0900000000' }, dungTK: true, dungMe: true, pin: '1357', pinMe: '2468' });
    return a.tru_tai_khoan_me === true && a.pin_me === '2468' && a.don.parent_phone === '0900000000' && !('parent_phone' in ph({ khach: { ...khach, parent_phone: '0900000000' } }).don);
  });
  thu('D17 thân /phien KHÔNG mang trường tiền nào của màn (tiền do máy chủ quyết)', () => {
    const a = ph({ cach: 'tien_mat', dungTK: true, pin: '1357' });
    const bo = ['unit_price', 'total', 'subtotal', 'cash_amount', 'transfer_amount', 'balance_amount', 'cash_received', 'change_amount', 'payment_method', 'discount', 'discount_value'];
    return bo.every((x) => !(x in a) && !(x in a.don)) && a.don.items.every((i) => !('unit_price' in i));
  });

  // ═══ F · menu ══════════════════════════════════════════════════════════════
  muc('F · menu 6 mục theo quyền');
  const quyen = (...ds) => (p) => ds.includes(p);
  const tatCa = quyen('view_reports', 'manage_users', 'approve_refund', 'view_customer_balance');
  const ten = (ds) => (ds || []).map((x) => x.ten);
  const menu = (q) => (M.dungMenu ? M.dungMenu(q) : { mayTinh: [], dienThoai: [] });
  thu('F1 máy tính (đủ quyền): Bán hàng · Hôm nay · Đơn hàng · Khách hàng · Kho · Quản lý', () => bang(ten(menu(tatCa).mayTinh), ['Bán hàng', 'Hôm nay', 'Đơn hàng', 'Khách hàng', 'Kho', 'Quản lý']));
  thu('F2 điện thoại (đủ quyền): Bán hàng · Hôm nay · Đơn · Khách · Thêm', () => bang(ten(menu(tatCa).dienThoai), ['Bán hàng', 'Hôm nay', 'Đơn', 'Khách', 'Thêm']));
  thu('F3 nhân viên không có view_reports → mất "Hôm nay" (quyền như mục Báo cáo cũ), còn lại giữ', () =>
    bang(ten(menu(quyen()).mayTinh), ['Bán hàng', 'Đơn hàng', 'Khách hàng', 'Kho', 'Quản lý']) && bang(ten(menu(quyen()).dienThoai), ['Bán hàng', 'Đơn', 'Khách', 'Thêm']));
  thu('F4 không còn "Đăng ký mới", "Số dư", "Hoàn tiền", "Mã chiết khấu", "Cài đặt" ở menu chính', () => {
    const m = menu(tatCa); const tat = [...ten(m.mayTinh), ...ten(m.dienThoai)].join('|');
    return !/Đăng ký|Số dư|Hoàn tiền|Mã chiết khấu|Cài đặt/.test(tat);
  });
  thu('F5 đường dẫn: Bán hàng "/", Đơn hàng "/orders", Khách hàng "/customers", Kho "/kho", Quản lý "/quan-ly", Hôm nay "/hom-nay"', () => {
    const d = Object.fromEntries(menu(tatCa).mayTinh.map((x) => [x.ten, x.to]));
    return d['Bán hàng'] === '/' && d['Đơn hàng'] === '/orders' && d['Khách hàng'] === '/customers' && d.Kho === '/kho' && d['Quản lý'] === '/quan-ly' && d['Hôm nay'] === '/hom-nay';
  });
  const luoi = (q) => (M.luoiQuanLy ? M.luoiQuanLy(q) : []);
  const lien = (q) => luoi(q).map((o) => `${o.ten}:${o.loi.map((l) => l.to).join('+')}`);
  thu('F6 lưới Quản lý (đủ quyền): 6 ô đúng tên, đúng đường dẫn', () => bang(lien(tatCa), [
    'Sản phẩm & công thức:/kho', 'Nguyên liệu:/kho', 'Khuyến mãi & thành viên:/discount-codes+/settings', 'Con người:/settings', 'Báo cáo:/reports', 'Cài đặt:/settings+/invoice-settings']));
  thu('F7 lưới Quản lý (không quyền): chỉ còn ô Kho — lối cần quyền bị ẩn, ô không còn lối nào thì ẩn', () => bang(lien(quyen()), ['Sản phẩm & công thức:/kho', 'Nguyên liệu:/kho']));
  thu('F8 lối sang Hoàn tiền (approve_refund) và Số dư (view_customer_balance) theo quyền cũ', () => {
    const g = M.loiThem ? M.loiThem : () => [];
    return bang(g('orders', tatCa).map((x) => x.to), ['/refunds']) && bang(g('orders', quyen()), []) &&
      bang(g('customers', tatCa).map((x) => x.to), ['/balance']) && bang(g('customers', quyen('view_reports')), []);
  });

  // ═══ [2] Ca THẬT trên máy chủ ═══════════════════════════════════════════════
  muc('[2] máy chủ thật: thân do hàm của màn dựng được máy chủ nhận');
  await caThat({ T, thu, f, k, muc, bang });

  // ═══ [3] Cấu trúc nguồn ═══════════════════════════════════════════════════
  muc('[3] cấu trúc nguồn');
  const F = {};
  if (fs.existsSync(BH)) for (const n of fs.readdirSync(BH)) if (/\.(jsx?)$/.test(n)) F[n] = fs.readFileSync(path.join(BH, n), 'utf8');
  const QL = path.join(SRC, 'pages', 'QuanLy');
  const FQL = {};
  if (fs.existsSync(QL)) for (const n of fs.readdirSync(QL)) if (/\.(jsx?)$/.test(n)) FQL[n] = fs.readFileSync(path.join(QL, n), 'utf8');
  const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const moi = (n) => sach(F[n] || '');
  const tatJsx = { ...F, ...FQL };
  k('S1 BanHang/ + QuanLy/ không `fetch(` trần', Object.values(tatJsx).every((s) => !/\bfetch\s*\(/.test(sach(s))));
  k('S2 màn gọi tinh-thu (api) từ BanHangMoi', /tinhThu\s*\(/.test(moi('BanHangMoi.jsx')));
  k('S3 màn mới KHÔNG còn gọi ordersApi.create (mọi cách thu đi MỘT đường phiên)', Object.values(F).every((s) => !/ordersApi\.create/.test(sach(s))));
  k('S4 màn gọi đủ 4 đường phiên: tạo · hỏi · chốt · huỷ', ['taoPhien', 'hoiPhien', 'chotPhien', 'huyPhien'].every((x) => Object.values(F).some((s) => sach(s).includes(x))));
  const qr = moi('ManQr.jsx');
  k('S5 ManQr: vẽ QR bằng veQr.js (qrSvg / veQr), đếm ngược theo het_han, hỏi lại phiên bằng hoiPhien', /veQr|qrSvg/.test(qr) && /het_han/.test(qr) && /hoiPhien/.test(qr));
  k('S6 KHÔNG có nút "đã nhận chuyển khoản" cho nhân viên (chỉ Xác nhận tay)', Object.values(F).every((s) => !/Đã nhận chuyển khoản|Đã nhận CK|da_nhan_ck/i.test(s)));
  k('S7 Xác nhận tay: chỉ hiện với quyền xac_nhan_ck_tay, bắt buộc lý do, gọi xacNhanTay', /xac_nhan_ck_tay/.test(qr) && /xacNhanTay/.test(qr) && /ly_?do|lyDo/.test(qr));
  const pin = moi('ManPin.jsx');
  k('S8 ManPin: xoay về khách, nhập 4 số, đặt PIN tại quầy gõ 2 lần (datPin)', /datPin/.test(pin) && /xoay/i.test(DOC('client', 'src', 'pages', 'BanHang', 'ManPin.jsx') || ''));
  const kt = moi('ManKetThuc.jsx');
  k('S9 ManKetThuc: vẽ HD-1 (dungHoaDon / danhSachTo + HoaDonTo) từ hoaDonApi, có ba tab Tờ khách · Tờ lưu · Tem ly',
    /hoaDonApi|hoa-don/.test(kt) && /HoaDonTo/.test(kt) && /danhSachTo|dungHoaDon/.test(kt) && ['Tờ khách', 'Tờ lưu', 'Tem ly'].every((x) => kt.includes(x)));
  k('S10 ManKetThuc: nút "In hoá đơn (n tờ) + N tem", chọn 1 / 2 tờ, ô "Trả lại khách"', /In hoá đơn \(/.test(kt) && /\+ \$\{?[^}]*\}? tem|tem/.test(kt) && /Trả lại khách/.test(kt) && /soTo/.test(kt));
  k('S11 màn kết thúc không in khi chưa thanh toán: chỉ dựng từ đơn đã có id (xong)', /don\.order\.id|order\.id/.test(kt) || /xong/.test(moi('BanHangMoi.jsx')));
  const lay = moi('BanHangMoi.jsx');
  k('S12 lưới khoá tới khi In (bh-khoa khi xong && !daIn); chống bấm đôi dangGuiRef', /xong && !daIn \? ' bh-khoa'/.test(lay) && /dangGuiRef\.current/.test(lay));
  k('S13 không công nợ / ghi nợ trong màn mới', Object.values(F).every((s) => !/Ghi nợ|Chưa thu|mang ra bàn/i.test(s)));
  const layout = DOC('client', 'src', 'components', 'Layout.jsx'), app = DOC('client', 'src', 'App.jsx');
  k('S14 Layout.jsx dùng dungMenu (menu một chỗ), không còn nhãn "Đăng ký mới"', /dungMenu/.test(layout) && !/Đăng ký mới/.test(layout));
  k('S15 App.jsx: có route quan-ly + hom-nay; đường cũ registrations / balance / refunds / settings / discount-codes / invoice-settings VẪN mở được',
    /path="quan-ly"/.test(app) && /path="hom-nay"/.test(app) && ['registrations', 'balance', 'refunds', 'settings', 'discount-codes', 'invoice-settings'].every((x) => app.includes(`path="${x}"`)));
  k('S16 App.jsx: route trang chủ vẫn TrangChu (công tắc từng máy, mặc định TẮT)', /<Route index element=\{<TrangChu\s*\/>\}\s*\/>/.test(app));
  k('S17 api.js: có thanhToanApi + hoaDonApi + ordersApi.tinhThu', (() => { const a = DOC('client', 'src', 'utils', 'api.js'); return /thanhToanApi/.test(a) && /hoaDonApi/.test(a) && /tinhThu/.test(a); })());
  k('S18 kiem_tra_truoc_khi_giao.js chạy thu_BH2.js', /cong_cu\/thu_BH2\.js/.test(DOC('kiem_tra_truoc_khi_giao.js')));
  if (CO('.git')) {
    let doi = '';
    try {
      doi = execFileSync('git', ['status', '--porcelain', '--', 'server', 'client/src/pages/Sales.jsx', 'client/src/pages/Settings.jsx', 'client/src/pages/InvoiceSettings.jsx', 'client/src/pages/Kho', 'client/src/utils/hoaDon.js', 'client/src/utils/veQr.js', 'client/src/components/InvoicePrint.jsx', 'client/src/components/InvoicePreview.jsx'], { cwd: GOC, encoding: 'utf8' });
      doi += execFileSync('git', ['diff', '--name-only', 'cbbb809', 'HEAD', '--', 'server', 'client/src/pages/Sales.jsx', 'client/src/pages/Settings.jsx', 'client/src/pages/InvoiceSettings.jsx', 'client/src/pages/Kho', 'client/src/utils/hoaDon.js', 'client/src/utils/veQr.js', 'client/src/components/InvoicePrint.jsx', 'client/src/components/InvoicePreview.jsx'], { cwd: GOC, encoding: 'utf8' });
    } catch (e) { doi = 'git lỗi: ' + e.message; }
    k('G1 máy chủ + Sales.jsx + file Cấm không đổi so với phiếu (K5)', doi.trim() === '', doi.trim().split('\n').slice(0, 4).join(' | '));
  }

  console.log(`\nBH-2: ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

/** [2] Ca thật. thu/k/… truyền vào để dùng chung bộ đếm. */
async function caThat({ T, thu, k, bang }) {
  let express, jwt, db, getNow;
  try {
    imLang();
    express = require(path.join(GOC, 'node_modules', 'express'));
    jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
    db = require(path.join(GOC, 'server', 'database.js'));
    ({ getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js')));
    await db.initDatabase();
  } catch (e) { noiLai(); k('R0 dựng được kho thử + máy chủ', false, e.message); return; }
  const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
  const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;
  const R = (n) => path.join(GOC, 'server', 'routes', n);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/hoa-don', require(R('hoaDon.js')));
  app.use('/api/pos/thanh-toan', require(R('thanh-toan.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  await db.run("INSERT OR IGNORE INTO pos_users (username, password, display_name, role, is_active) VALUES ('bh2_nv', 'x', 'nv', 'staff', 1)");
  await db.run("INSERT OR IGNORE INTO pos_users (username, password, display_name, role, is_active) VALUES ('bh2_ql', 'x', 'ql', 'manager', 1)");
  const tk = async (ten) => jwt.sign({ userId: (await db.queryOne('SELECT id FROM pos_users WHERE username = ?', [ten])).id }, KHOA_NV, { expiresIn: '1h' });
  const tkChu = jwt.sign({ userId: (await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id }, KHOA_NV, { expiresIn: '1h' });
  const tkNv = await tk('bh2_nv'), tkQl = await tk('bh2_ql');
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0']]) {
    await db.run("INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [a, b]);
  }
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const gio = (sl = 1, note) => [{ key: 1, product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl, unit_price: 25000, note }];

  const goi = async (method, url, body, token = tkNv) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* không JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const la = (r, s, c) => r.status === s && (c === undefined || r.j.code === c);
  const mo = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  let soSdt = 0;
  const khachMoi = async (napVi = 0, pin = '1357') => {
    const sdt = '09' + String(50000000 + (++soSdt)).padStart(8, '0');
    await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()]);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin });
    return { phone: sdt, name: 'Khách ' + sdt, balance: napVi };
  };
  const tp = (kh, o = {}) => T.thanPhien({ gio: gio(o.sl || 1), khach: kh, ma: '', cach: 'tien_mat', dungTK: false, dungMe: false, ...o });
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const co = typeof T.thanTinhThu === 'function' && typeof T.thanPhien === 'function';
  if (!co) { k('R0 tinh.js có thanTinhThu + thanPhien để gọi máy chủ', false, 'thiếu hàm'); return; }

  await chay('R1', async () => {
    const r = await goi('POST', '/pos/orders/tinh-thu', T.thanTinhThu(gio(2), null, ''));
    k('R1 tinh-thu nhận thân của màn: khách lẻ 2 ly = 50.000, có cach + ma_loi null', la(r, 200) && r.j.total === 50000 && 'cach' in r.j && r.j.ma_loi === null, mo(r) + ' ' + JSON.stringify(r.j).slice(0, 100));
    const r2 = await goi('POST', '/pos/orders/tinh-thu', T.thanTinhThu(gio(1), null, ' khongcoma '));
    k('R2 mã gõ sai → vẫn 200, ma_loi + ma_loi_code (màn hiện "Mã không áp: …"), giá không giảm', la(r2, 200) && r2.j.total === 25000 && !!r2.j.ma_loi && !!r2.j.ma_loi_code, mo(r2) + ' ' + JSON.stringify(r2.j).slice(0, 120));
  });

  await chay('R4', async () => {
    const r = await goi('POST', '/pos/thanh-toan/phien', tp(null, { sl: 2 }));
    const p = r.j.phien || {};
    k('R4 tiền mặt: /phien nhận thân của màn → 200, còn lại 50.000', la(r, 200) && p.cach === 'tien_mat' && p.con_lai === 50000, mo(r));
    const c = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, { cash_received: 100000 });
    const o = c.j.order || {};
    k('R4 /chot khách đưa 100.000 → đơn có id, trả lại 50.000', la(c, 200) && o.id > 0 && o.total === 50000, mo(c));
    const c2 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, { cash_received: 100000 });
    k('R4 chốt lần hai (bấm đôi) → 409 PHIEN_DA_CHOT, không đơn thứ hai', la(c2, 409, 'PHIEN_DA_CHOT'), mo(c2));
    const h = await goi('GET', `/pos/hoa-don/${o.id}`);
    const hd = h.j.hoa_don || {};
    k('R5 GET /hoa-don/:id của đơn vừa chốt → có đủ phần màn kết thúc vẽ (mon, tien, thanh_toan, tra_lai, khach_dua)',
      la(h, 200) && hd.mon?.length === 1 && hd.tien?.tong === 50000 && hd.tra_lai === 50000 && hd.khach_dua === 100000 && Array.isArray(hd.thanh_toan), mo(h));
  });

  await chay('R6', async () => {
    const r = await goi('POST', '/pos/thanh-toan/phien', tp(null, { cach: 'payos', sl: 1 }));
    const p = r.j.phien || {};
    k('R6 payOS: /phien → 200, có qr + noi_dung + het_han (màn vẽ QR, đếm ngược)', la(r, 200) && !!p.qr && !!p.noi_dung && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(p.het_han || ''), mo(r));
    k('R6 conLaiGiay(het_han máy chủ) ≈ 600 giây (±10) ngay sau khi tạo', Math.abs(T.conLaiGiay(p.het_han, Date.now()) - 600) <= 10, String(T.conLaiGiay(p.het_han, Date.now())));
    const g = await goi('GET', `/pos/thanh-toan/phien/${p.id}`);
    k('R7 hỏi phiên đang chờ → trang_thai "cho" → màn tiếp tục đợi', la(g, 200) && T.hanhDongPhien(g.j.phien?.trang_thai) === 'doi', mo(g));
    const h = await goi('POST', `/pos/thanh-toan/phien/${p.id}/huy`, {});
    const g2 = await goi('GET', `/pos/thanh-toan/phien/${p.id}`);
    k('R8 Huỷ QR → 200; hỏi lại → màn nhả (quay về giỏ)', la(h, 200) && T.hanhDongPhien(g2.j.phien?.trang_thai) === 'nha', mo(h) + ' / ' + g2.j.phien?.trang_thai);
    const h2 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/huy`, {});
    k('R8 huỷ lần hai → 409 PHIEN_DA_CHOT (màn coi như đã nhả)', la(h2, 409, 'PHIEN_DA_CHOT'), mo(h2));
    await db.run("UPDATE pos_phien_thanh_toan SET het_han = strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 seconds') WHERE id = ?", [getNow(), p.id]);
    const r2 = await goi('POST', '/pos/thanh-toan/phien', tp(null, { cach: 'payos' }));
    const p2 = r2.j.phien || {};
    await db.run("UPDATE pos_phien_thanh_toan SET het_han = strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 seconds') WHERE id = ?", [getNow(), p2.id]);
    const g3 = await goi('GET', `/pos/thanh-toan/phien/${p2.id}`);
    k('R9 QR quá hạn → máy chủ báo "het_han" → màn nhả', la(g3, 200) && g3.j.phien?.trang_thai === 'het_han' && T.hanhDongPhien('het_han') === 'nha' && T.conLaiGiay(g3.j.phien.het_han, Date.now()) === 0, mo(g3));
    const q1 = await goi('POST', `/pos/thanh-toan/phien/${p2.id}/xac-nhan-tay`, { ly_do: 'Khách đã CK' }, tkNv);
    const r3 = await goi('POST', '/pos/thanh-toan/phien', tp(null, { cach: 'payos' }));
    const p3 = r3.j.phien || {};
    const q2 = await goi('POST', `/pos/thanh-toan/phien/${p3.id}/xac-nhan-tay`, { ly_do: '' }, tkQl);
    const q3 = await goi('POST', `/pos/thanh-toan/phien/${p3.id}/xac-nhan-tay`, { ly_do: 'Khách CK, đã thấy tiền về tài khoản' }, tkQl);
    k('R10 xác nhận tay: nhân viên → 403 · quản lý thiếu lý do → 400 CAN_LY_DO · đủ lý do → 200 có đơn', q1.status === 403 && la(q2, 400, 'CAN_LY_DO') && la(q3, 200) && q3.j.order?.id > 0, `${mo(q1)} / ${mo(q2)} / ${mo(q3)}`);
  });

  await chay('R11', async () => {
    const a = await khachMoi(30000);
    const r = await goi('POST', '/pos/thanh-toan/phien', tp(a, { sl: 2, cach: 'tien_mat', dungTK: true, pin: '1357' }));
    const p = r.j.phien || {};
    k('R11 trừ tài khoản một phần: /phien kèm PIN → giữ 30.000, còn 20.000; số dư CHƯA trừ', la(r, 200) && p.giu_vi === 30000 && p.con_lai === 20000 && await soDu(a.phone) === 30000, mo(r));
    const m = T.chiaTra({ tong: 50000, khach: a, dungTK: true, dungMe: false });
    k('R11 chiaTra của màn khớp phần máy chủ giữ (30.000 / còn 20.000)', m.soDuDung === p.giu_vi && m.phaiTra === p.con_lai);
    const c = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, { cash_received: 20000 });
    k('R11 /chot → đơn ghi, số dư trừ đúng 30.000 trong cùng giao dịch', la(c, 200) && await soDu(a.phone) === 0, mo(c));
    const b = await khachMoi(100000);
    const r2 = await goi('POST', '/pos/thanh-toan/phien', tp(b, { cach: 'tai_khoan', dungTK: true, pin: '1357' }));
    const p2 = r2.j.phien || {};
    k('R12 tài khoản trả đủ: cachTraKhaDung → chỉ tai_khoan; /phien → 200, còn lại 0', la(r2, 200) && p2.con_lai === 0 && bang(T.cachTraKhaDung({ tong: 25000, phaiTra: 0 }), ['tai_khoan']), mo(r2));
    const c2 = await goi('POST', `/pos/thanh-toan/phien/${p2.id}/chot`, {});
    k('R12 /chot → 200, số dư còn 75.000', la(c2, 200) && await soDu(b.phone) === 75000, mo(c2));
    const r3 = await goi('POST', '/pos/thanh-toan/phien', tp(b, { cach: 'tai_khoan', dungTK: false }));
    k('R12b K5: đơn không trừ tài khoản không cần PIN', r3.status !== 400 || r3.j.code === 'CACH_KHONG_KHOP' || r3.j.code === 'SO_DU_KHONG_DU', mo(r3));
  });

  await chay('R13', async () => {
    const a = await khachMoi(50000);
    const sai = [];
    for (let i = 0; i < 6; i++) sai.push(await goi('POST', '/pos/thanh-toan/phien', tp(a, { cach: 'tien_mat', dungTK: true, pin: '0000' })));
    k('R13 PIN sai: 5 lần đầu → 400 PIN_SAI (màn: nhập lại)', sai.slice(0, 5).every((x) => la(x, 400, 'PIN_SAI') && T.xuLyLoiPin(x.j.code) === 'nhap_lai'), sai.map(mo).join(' | '));
    k('R13 lần thứ 6 → 423 PIN_DANG_KHOA (màn: báo khoá 15 phút, về giỏ)', la(sai[5], 423, 'PIN_DANG_KHOA') && T.xuLyLoiPin(sai[5].j.code) === 've_gio', mo(sai[5]));
    const dung = await goi('POST', '/pos/thanh-toan/phien', tp(a, { cach: 'tien_mat', dungTK: true, pin: '1357' }));
    k('R13 đang khoá: PIN đúng cũng bị 423 (khoá thật, không chỉ lời báo)', la(dung, 423, 'PIN_DANG_KHOA'), mo(dung));
    const b = await khachMoi(50000, null);
    const chua = await goi('POST', '/pos/thanh-toan/phien', tp(b, { cach: 'tien_mat', dungTK: true, pin: '1357' }));
    k('R14 khách chưa có PIN → 400 CHUA_CO_PIN (màn: đặt PIN tại quầy)', la(chua, 400, 'CHUA_CO_PIN') && T.xuLyLoiPin(chua.j.code) === 'dat_pin', mo(chua));
    const loiDat = await goi('POST', '/pos/thanh-toan/pin', { phone: b.phone, pin: '2468', pin_lai: '2469' });
    const dat = await goi('POST', '/pos/thanh-toan/pin', { phone: b.phone, pin: '2468', pin_lai: '2468' });
    const lai = await goi('POST', '/pos/thanh-toan/phien', tp(b, { sl: 3, cach: 'tien_mat', dungTK: true, pin: '2468' }));
    k('R14 đặt PIN gõ lệch → 400 PIN_KHONG_KHOP; gõ đúng → 200; gửi lại /phien với PIN mới → 200', la(loiDat, 400, 'PIN_KHONG_KHOP') && la(dat, 200) && la(lai, 200), `${mo(loiDat)} / ${mo(dat)} / ${mo(lai)}`);
  });
  svGia.close(); sv.close();
}

main().catch((e) => { console.error('thu_BH2 sập:', e); process.exit(2); });
