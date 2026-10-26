#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BH-1 — màn Bán hàng mới (đợt 1): phép tính thuần client/src/pages/BanHang/tinh.js + cấu trúc
 * ═══════════════════════════════════════════════════════════════════════════
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_BH1.js [--goc <thư mục>]     (in "n đạt · 0 hỏng")
 *  --goc: chạy trên bản sao cây kho (đột biến, viec/BH-1/dot_bien.py).
 *
 *  tinh.js là ES module không phụ thuộc React → nạp bằng import() trực tiếp (không dựng giả lập).
 *  Phần cấu trúc đọc file nguồn: BanHang/ không `fetch` trần, không tạo khách ở quầy, không Ghi nợ / Chưa thu, localStorage trong try;
 *  khoá payload đơn == khoá `orderData` của Sales.jsx (đơn từ màn mới "y như màn cũ").
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const BH = path.join(GOC, 'client', 'src', 'pages', 'BanHang');
const DOC = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log(`\n${t}`);
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Mọi file .js/.jsx trong BanHang/ (trừ tinh.js khi cần) → { tên: nội dung } */
function docBanHang() {
  const o = {};
  if (!fs.existsSync(BH)) return o;
  for (const f of fs.readdirSync(BH)) if (/\.(jsx?|css)$/.test(f)) o[f] = fs.readFileSync(path.join(BH, f), 'utf8');
  return o;
}

async function main() {
  let T = null;
  try { T = await import(pathToFileURL(path.join(BH, 'tinh.js')).href); } catch (e) { T = null; var loiNap = e.message; }
  k('H · nạp được BanHang/tinh.js', !!T, loiNap || '');
  const f = (ten) => (T && typeof T[ten] === 'function' ? T[ten] : () => { throw new Error('thiếu hàm ' + ten); });
  const thu = (ten, fn) => { try { k(ten, !!fn()); } catch (e) { k(ten, false, e.message); } };

  muc('F · trả lại / còn thiếu');
  thu('F1 trả lại 100.000 cho đơn 86.400 = 13.600', () => f('traLai')(86400, 100000) === 13600);
  thu('F2 đưa đúng tiền → trả lại 0, còn thiếu 0', () => f('traLai')(86400, 86400) === 0 && f('conThieu')(86400, 86400) === 0);
  thu('F3 đưa thiếu 1 đồng → còn thiếu 1, trả lại 0', () => f('conThieu')(86400, 86399) === 1 && f('traLai')(86400, 86399) === 0);
  thu('F4 chưa nhập gì (0 / NaN / undefined) → còn thiếu = phải trả', () =>
    f('conThieu')(50000, 0) === 50000 && f('conThieu')(50000, NaN) === 50000 && f('conThieu')(50000, undefined) === 50000);
  thu('F5 duDuoc: true khi đưa ≥ phải trả (kể cả đơn 0đ), false khi thiếu 1 đồng', () =>
    f('duDuoc')(50000, 50000) === true && f('duDuoc')(50000, 49999) === false && f('duDuoc')(0, 0) === true && f('duDuoc')(50000, 0) === false);

  muc('F · dãy tờ');
  const ds = (n) => f('danhSachTo')(n);
  thu('F6 phải trả 86.400 → Đúng tiền, 100.000, 200.000, 500.000 (đủ 4)', () => bang(ds(86400).map((t) => t.dua), [86400, 100000, 200000, 500000]));
  thu('F7 mỗi tờ ghi sẵn trả lại', () => bang(ds(86400).map((t) => t.traLai), [0, 13600, 113600, 413600]));
  thu('F8 chỉ tờ LỚN HƠN số phải trả: 50.000 → không có tờ 50.000', () => bang(ds(50000).map((t) => t.dua), [50000, 100000, 200000, 500000]));
  thu('F9 49.999 → có tờ 50.000 (ngay dưới ngưỡng)', () => bang(ds(49999).map((t) => t.dua), [49999, 50000, 100000, 200000]));
  thu('F10 tối đa 4 nút (Đúng tiền + 3 tờ)', () => ds(1000).length === 4);
  thu('F11 phải trả 500.000 → chỉ còn Đúng tiền', () => bang(ds(500000).map((t) => t.dua), [500000]));
  thu('F12 phải trả 0 hoặc âm → không có nút nào', () => ds(0).length === 0 && ds(-5).length === 0);
  thu('F13 nút đầu đánh dấu dungTien', () => ds(86400)[0].dungTien === true && !ds(86400)[1].dungTien);

  muc('B · tách trang theo độ rộng');
  const tt = (r, kieu) => f('tachTrang')(r, kieu);
  thu('B1 599 px tự động → hai trang', () => tt(599, 'tudong') === 'hai-trang');
  thu('B2 600 px tự động → hai cột (hẹp HƠN 600 mới tách trang)', () => tt(600, 'tudong') === 'hai-cot');
  thu('B3 601 px tự động → hai cột', () => tt(601, 'tudong') === 'hai-cot');
  thu('B4 kiểu Điện thoại ép hai trang dù rộng 1200', () => tt(1200, 'dienthoai') === 'hai-trang');
  thu('B5 kiểu Máy tính bảng ép hai cột dù rộng 320', () => tt(320, 'maytinhbang') === 'hai-cot');
  thu('B6 kiểu lạ / thiếu → coi như Tự động', () => tt(500, 'xyz') === 'hai-trang' && tt(900, undefined) === 'hai-cot');

  muc('A · công tắc theo máy (localStorage, hỏng thì tắt / Tự động)');
  const kho = () => { const m = {}; return { getItem: (a) => (a in m ? m[a] : null), setItem: (a, v) => { m[a] = String(v); }, m }; };
  const khoHong = { getItem: () => { throw new Error('bị chặn'); }, setItem: () => { throw new Error('bị chặn'); } };
  thu('A1 kho trống → TẮT + Tự động (mặc định)', () => bang(f('docCongTac')(kho()), { bat: false, kieu: 'tudong' }));
  thu('A2 ghi bật + Máy tính bảng rồi đọc lại', () => { const s = kho(); f('ghiCongTac')(s, true, 'maytinhbang'); return bang(f('docCongTac')(s), { bat: true, kieu: 'maytinhbang' }); });
  thu('A3 ghi tắt rồi đọc lại → tắt', () => { const s = kho(); f('ghiCongTac')(s, true, 'dienthoai'); f('ghiCongTac')(s, false, 'dienthoai'); return f('docCongTac')(s).bat === false; });
  thu('A4 kho ném lỗi khi đọc → tắt / Tự động, không ném', () => bang(f('docCongTac')(khoHong), { bat: false, kieu: 'tudong' }));
  thu('A5 kho ném lỗi khi ghi → không ném', () => { f('ghiCongTac')(khoHong, true, 'tudong'); return true; });
  thu('A6 không có kho (undefined) → tắt / Tự động', () => bang(f('docCongTac')(undefined), { bat: false, kieu: 'tudong' }));
  thu('A7 giá trị lạ trong kho: bật chỉ khi đúng chuỗi "1"', () => {
    const kc = T.KHOA_CONG_TAC, kk = T.KHOA_KIEU;
    const a = kho(); a.setItem(kc, 'true'); a.setItem(kk, 'tuyet-voi');
    const b = kho(); b.setItem(kc, '1');
    return bang(f('docCongTac')(a), { bat: false, kieu: 'tudong' }) && f('docCongTac')(b).bat === true;
  });

  muc('D · giá hạng hiển thị / giỏ');
  thu('D1 giaHang 96.000 hạng 10% → 86.400 và coGiam', () => { const g = f('giaHang')(96000, 10); return g.goc === 96000 && g.hang === 86400 && g.coGiam === true; });
  thu('D2 không hạng (0%) → giá = gốc, không gạch', () => { const g = f('giaHang')(96000, 0); return g.hang === 96000 && g.coGiam === false; });
  thu('D3 làm tròn: 25.000 giảm 7% = 23.250', () => f('giaHang')(25000, 7).hang === 23250);
  thu('D4 % quá lớn bị chặn ở 90: 100.000 @ 120% → 10.000', () => f('giaHang')(100000, 120).hang === 10000);
  thu('D5 % âm / NaN → coi 0', () => f('giaHang')(100000, -5).hang === 100000 && f('giaHang')(100000, NaN).hang === 100000);
  thu('D6 phanTramHang: nhóm đặc biệt lấy special_discount_percent', () =>
    f('phanTramHang')({ usable: true, discount_percent: 10, special_discount_percent: 5 }, true) === 5 &&
    f('phanTramHang')({ usable: true, discount_percent: 10, special_discount_percent: 5 }, false) === 10);
  thu('D7 phanTramHang: hạng hết hạn (usable false) / không có → 0', () =>
    f('phanTramHang')({ usable: false, discount_percent: 10 }, false) === 0 && f('phanTramHang')(null, false) === 0);

  const sp = (id, gia, dacBiet = false) => ({ sx_product_type: 'juice', sx_product_id: id, unit_price: gia, quantity: 1, is_special_group: dacBiet });
  const hang10 = { usable: true, discount_percent: 10, special_discount_percent: 5 };
  thu('D8 tinhGio khách lẻ: 2 ly 35.000 → tổng 70.000', () => {
    const g = f('tinhGio')([{ ...sp(1, 35000), quantity: 2 }], {});
    return g.tamTinh === 70000 && g.giamHang === 0 && g.tong === 70000;
  });
  thu('D9 tinhGio hạng 10%: 96.000 → giamHang 9.600, tổng 86.400', () => {
    const g = f('tinhGio')([sp(1, 96000)], { hang: hang10 });
    return g.giamHang === 9600 && g.tong === 86400;
  });
  thu('D10 tinhGio: mỗi dòng có giaHang (cho gạch ngang)', () => {
    const g = f('tinhGio')([sp(1, 96000), sp(2, 25000, true)], { hang: hang10 });
    return bang(g.dong.map((d) => d.giaHang), [86400, 23750]);
  });
  thu('D11 tinhGio Flash đang chạy trên món → hạng KHÔNG cộng (đúng Sales.jsx)', () => {
    const flash = { is_flash_now: true, percent: 20, product_keys: ['juice_1'] };
    const g = f('tinhGio')([sp(1, 100000), sp(2, 50000)], { hang: hang10, flash });
    return g.giamFlash === 20000 && g.giamHang === 0 && g.tong === 130000;
  });
  thu('D12 tinhGio Flash không đang chạy → không giảm', () => {
    const flash = { is_flash_now: false, percent: 20, product_keys: ['juice_1'] };
    return f('tinhGio')([sp(1, 100000)], { flash }).tong === 100000;
  });
  thu('D13 chiết khấu riêng của khách: 10% trên tạm tính', () => f('tinhGio')([sp(1, 100000)], { khachGiam: { loai: 'percent', gia_tri: 10 } }).tong === 90000);
  thu('D14 chiết khấu cố định lớn hơn đơn → chặn ở đơn (giảm = 30.000), tổng 0 (không âm)', () => { const g = f('tinhGio')([sp(1, 30000)], { khachGiam: { loai: 'fixed', gia_tri: 50000 } }); return g.tong === 0 && g.giamKhach === 30000; });
  thu('D15 giỏ trống → mọi số 0', () => { const g = f('tinhGio')([], {}); return g.tamTinh === 0 && g.tong === 0; });

  muc('E · thêm vào giỏ / ghi chú nhanh');
  const sanPham = (o = {}) => ({ name: 'Trà', price: 25000, stock_quantity: 5, khong_quan_kho: false, ...o });
  thu('E1 sản phẩm chưa có giá (null / 0) → báo "chưa có giá bán"', () =>
    /chưa có giá bán/.test(f('kiemTraThem')(sanPham({ price: null }), 0, 1) || '') && /chưa có giá bán/.test(f('kiemTraThem')(sanPham({ price: 0 }), 0, 1) || ''));
  thu('E2 hết hàng (tồn 0) → báo hết hàng', () => /hết hàng/.test(f('kiemTraThem')(sanPham({ stock_quantity: 0 }), 0, 1) || ''));
  thu('E3 đang có 4 + thêm 1 với tồn 5 → được (ngay dưới)', () => f('kiemTraThem')(sanPham(), 4, 1) === null);
  thu('E4 đang có 5 + thêm 1 với tồn 5 → không đủ hàng (ngay trên)', () => /Không đủ hàng/.test(f('kiemTraThem')(sanPham(), 5, 1) || ''));
  thu('E5 khong_quan_kho: bỏ qua tồn', () => f('kiemTraThem')(sanPham({ khong_quan_kho: true, stock_quantity: 0 }), 99, 3) === null);
  thu('E6 ghiChuMacDinh: nhóm tea, juice có danh sách; nhóm lạ có danh sách dự phòng', () =>
    ['tea', 'juice', 'nhom_la'].every((n) => Array.isArray(f('ghiChuMacDinh')(n)) && f('ghiChuMacDinh')(n).length > 0));
  thu('E7 ghép ghi chú: bật / tắt từng nhãn + ô tự gõ, bỏ trùng, cắt 200 ký tự', () => {
    const g = f('ghepGhiChu');
    return g(['Ít đá', 'Ít ngọt'], ' ít đá ') === 'Ít đá, Ít ngọt' && g([], '') === '' && g(['a'], 'x'.repeat(300)).length === 200;
  });

  muc('I · payload đơn (K5: y như màn cũ)');
  const gio = [{ product_id: 7, sx_product_type: 'juice', sx_product_id: 3, quantity: 2, unit_price: 35000, note: '  Ít đá ' }];
  const khach = { phone: '0912345678', name: 'Chị Hoa', balance: 50000 };
  const tinh = (ctx = {}) => f('tinhGio')(gio, ctx);
  const dung = (o) => f('dungDonHang')({ gio, tamTinh: tinh(), ...o });
  thu('I1 tiền mặt đúng tiền (khách lẻ): cash_amount = tổng, cash_received = tổng, trả lại 0', () => {
    const d = dung({ cach: 'cash', khachDua: 70000 });
    return d.payment_method === 'cash' && d.cash_amount === 70000 && d.cash_received === 70000 && d.change_amount === 0 &&
      d.transfer_amount === 0 && d.balance_amount === 0 && d.customer_phone === null && d.customer_name === 'Khách lẻ';
  });
  thu('I2 tiền mặt số khác: đưa 100.000 → cash_received 100.000, change_amount 30.000, cash_amount vẫn 70.000', () => {
    const d = dung({ cach: 'cash', khachDua: 100000 });
    return d.cash_amount === 70000 && d.cash_received === 100000 && d.change_amount === 30000;
  });
  thu('I3 chuyển khoản: transfer_amount = tổng, cash 0, cash_received 0', () => {
    const d = dung({ cach: 'transfer' });
    return d.payment_method === 'transfer' && d.transfer_amount === 70000 && d.cash_amount === 0 && d.cash_received === 0 && d.change_amount === 0;
  });
  thu('I4 khách quen trừ số dư một phần (50.000) + tiền mặt 20.000', () => {
    const d = dung({ cach: 'cash', khach, soDuDung: 50000, khachDua: 20000 });
    return d.balance_amount === 50000 && d.cash_amount === 20000 && d.cash_received === 20000 && d.change_amount === 0 &&
      d.customer_phone === '0912345678' && d.customer_name === 'Chị Hoa' && d.payment_method === 'cash';
  });
  thu('I5 số dư đủ trả hết → payment_method "balance", balance_amount = tổng, cash/transfer 0', () => {
    const d = dung({ cach: 'balance', khach: { ...khach, balance: 100000 }, soDuDung: 70000 });
    return d.payment_method === 'balance' && d.balance_amount === 70000 && d.cash_amount === 0 && d.transfer_amount === 0 && d.cash_received === 0;
  });
  thu('I6 số dư mẹ: gửi parent_phone + parent_balance_amount; mặc định không có', () => {
    const co = dung({ cach: 'cash', khach: { ...khach, parent_phone: '0900000000' }, soDuMeDung: 10000, khachDua: 10000 });
    const khong = dung({ cach: 'cash', khach: { ...khach, parent_phone: '0900000000' }, khachDua: 70000 });   // có mẹ nhưng không dùng → không gửi
    return co.parent_phone === '0900000000' && co.parent_balance_amount === 10000 && khong.parent_phone === null && khong.parent_balance_amount === 0;
  });
  thu('I7 món: from_package false, ghi chú cắt khoảng trắng, không gói / thẻ', () => {
    const d = dung({ cach: 'cash', khachDua: 70000 });
    const it = d.items[0];
    return d.items.length === 1 && it.from_package === false && it.note === 'Ít đá' && it.quantity === 2 && it.product_id === 7 &&
      d.package_buy === null && d.membership_buy === null && d.customer_package_id === null && d.shipping_fee === 0;
  });
  thu('I8 chiết khấu riêng của khách được gửi (discount_type / discount_value) như màn cũ', () => {
    const d = dung({ cach: 'cash', khach: { ...khach, discount_type: 'percent', discount_value: 10 }, tamTinh: tinh({ khachGiam: { loai: 'percent', gia_tri: 10 } }), khachDua: 63000 });
    return d.discount_type === 'percent' && d.discount_value === 10;
  });
  thu('I9 không chiết khấu → discount_type null, discount_value 0', () => { const d = dung({ cach: 'cash', khachDua: 70000 }); return d.discount_type === null && d.discount_value === 0; });

  // Tập khoá == tập khoá orderData của Sales.jsx (đọc từ nguồn, không tự gõ)
  const ban = DOC('client', 'src', 'pages', 'Sales.jsx');
  const m = ban.match(/const orderData = \{([\s\S]*?)\n      \};/);
  const khoaCu = m ? [...m[1].matchAll(/^\s{8}([a-z_]+):/gm)].map((x) => x[1]).sort() : [];
  thu('I10 tìm được khoá orderData trong Sales.jsx (≥ 20 khoá)', () => khoaCu.length >= 20, 'tìm được ' + khoaCu.length);
  thu('I11 tập khoá payload màn mới == tập khoá orderData màn cũ', () => {
    const d = dung({ cach: 'cash', khachDua: 70000 });
    const moi = Object.keys(d).sort();
    if (!bang(moi, khoaCu)) throw new Error('khác: ' + moi.filter((x) => !khoaCu.includes(x)).concat(khoaCu.filter((x) => !moi.includes(x))).join(','));
    return true;
  });

  muc('Cấu trúc nguồn');
  const F = docBanHang();
  const tenFile = Object.keys(F);
  k('S1 thư mục BanHang/ có file giao diện (.jsx)', tenFile.some((n) => n.endsWith('.jsx')));
  const jsx = Object.entries(F).filter(([n]) => /\.jsx?$/.test(n));
  const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  k('S2 BanHang/ không `fetch(` trần (chỉ qua utils/api.js)', jsx.every(([, s]) => !/\bfetch\s*\(/.test(sach(s))), jsx.filter(([, s]) => /\bfetch\s*\(/.test(sach(s))).map(([n]) => n).join(','));
  k('S3 mọi `localStorage` / `sessionStorage` nằm trong try (hoặc qua kho truyền vào tinh.js)',
    jsx.every(([, s]) => { const c = sach(s); return !/\b(localStorage|sessionStorage)\b/.test(c) || /try\s*\{[^}]*\b(localStorage|sessionStorage)\b/.test(c); }));
  k('S4 không tạo khách ở quầy (luật 6): không gọi registrations / "Thêm khách"', jsx.every(([, s]) => !/registrations|Thêm khách/i.test(sach(s))));
  k('S5 không Ghi nợ / Chưa thu / mang ra bàn (mục 1.1 DAC_TA_BAN_HANG_2410)', jsx.every(([, s]) => !/Ghi nợ|Chưa thu|mang ra bàn/i.test(s)));
  k('S6 dùng chữ "trả lại", không "thối"', jsx.every(([, s]) => !/\bthối\b/i.test(s)) && jsx.some(([, s]) => /Trả lại/.test(s)));
  k('S7 gọi QrScanModal + InvoicePrint sẵn có', jsx.some(([, s]) => /QrScanModal/.test(s)) && jsx.some(([, s]) => /InvoicePrint/.test(s)));
  const app = DOC('client', 'src', 'App.jsx');
  k('S8 App.jsx: route trang chủ trỏ TrangChu (chọn màn theo công tắc)', /<Route index element=\{<TrangChu\s*\/>\}\s*\/>/.test(app));
  k('S9 App.jsx: không còn `<Sales />` làm route trang chủ', !/<Route index element=\{<Sales\s*\/>\}/.test(app));
  k('S10 Sales.jsx không nhắc BanHang (màn cũ KHÔNG đổi)', !/BanHang/.test(ban));
  const kiem = DOC('kiem_tra_truoc_khi_giao.js');
  k('S11 kiem_tra_truoc_khi_giao.js chạy thu_BH1.js', /'cong_cu\/thu_BH1\.js'[,\]][^\n]*chayBaiThat\(bai\)/.test(kiem));
  k('S12 kết thúc: lưới món khoá (bh-khoa) khi xong && !daIn', jsx.some(([, s]) => /xong && !daIn \? ' bh-khoa'/.test(s)));
  k('S13 chống bấm đôi: dangGuiRef chặn trong thu() + nút Đã nhận tiền disabled theo dangGui', jsx.some(([, s]) => /if \(dangGuiRef\.current \|\|/.test(s)) && jsx.some(([, s]) => /disabled=\{dangGui \|\| !duDuoc/.test(s)));

  console.log(`\nBH-1: ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { console.error('thu_BH1 sập:', e); process.exit(2); });
