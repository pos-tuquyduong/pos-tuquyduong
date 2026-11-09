#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ QUAY-UI-1 — quầy: (A) tab Thẻ thành viên · (B) ba nút cách trả, không tự trừ tài khoản · (C) Thêm khách báo khách đã có ·
 *  (D) đơn nạp không xử lý sự cố · (E) sửa đăng ký không đổi khách App / khách có trước
 * ═══════════════════════════════════════════════════════════════════════════
 *  PHẢI ĐỎ trên code chưa vá (K3). Chạy ở gốc kho:  node cong_cu/thu_QUAYUI1.js   — bản đột biến: --goc <thư mục kho chép>.
 *  Máy chủ (D, E): database.js thật + libsql trên file kho TẠM, SX giả. Quầy (A, B, C): hàm thuần BanHang/tinh.js nạp thật +
 *  đọc nguồn .jsx (chỉ cho phần giao diện không có hàm thuần — mỗi ca nguồn có đột biến BV- bắt).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_quayui1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
process.on('exit', () => { try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ } });
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => 'http://sx.gia', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_quayui1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_quayui1_kh_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thu = async (ten, f) => { try { await f(); } catch (e) { noiLai(); k(`${ten} (bài sập giữa chừng)`, false, e.message); } };
const doc = (f) => fs.readFileSync(path.join(GOC, f), 'utf8');

async function main() {
  // ═════ QUẦY: hàm thuần ═════
  const T = await import(pathToFileURL(path.join(GOC, 'client/src/pages/BanHang/tinh.js')).href);
  const hamCo = (ten) => typeof T[ten] === 'function';
  const monThuong = { key: 1, product_id: 5, sx_product_type: 'juice', sx_product_id: 9, product_name: 'Cam', unit_price: 30000, quantity: 2, note: '' };
  const vang = { id: 7, name: 'Vàng', cach_co: 'ban', sort_order: 2, goi: [{ so_thang: 1, gia: 100000, bat: true }, { so_thang: 3, gia: 289000, bat: true }, { so_thang: 6, gia: 0, bat: true }, { so_thang: 12, gia: 900000, bat: false }] };
  const tiersSrc = doc('server/routes/tiers.js');
  const CACH_CHI_CAP = (/CACH_CO = \['ban', '([a-z_]+)'\]/.exec(tiersSrc) || [])[1];   // giá trị THẬT máy chủ lưu — không tự gõ trong fixture
  const kimCuong = { id: 8, name: 'Kim Cương', cach_co: CACH_CHI_CAP, sort_order: 3, goi: [{ so_thang: 1, gia: 5000000, bat: true }] };   // hạng chỉ cấp có gói giá cũng KHÔNG bán
  const khachA = { phone: '0901000001', name: 'A', balance: 500000, parent_balance: 0 };

  muc('[A] Tab "Thẻ thành viên" — hàm thuần');
  await thu('A', async () => {
    k('A1 có hàm dsGoiThe (liệt kê gói bán được của hạng)', hamCo('dsGoiThe'));
    if (hamCo('dsGoiThe')) {
      const ds = T.dsGoiThe([vang, kimCuong]);
      k('A1 chỉ gói đang bán (bật + giá > 0) của hạng `ban`: Vàng 1 tháng + 3 tháng; hạng chỉ cấp không bán dù có gói', JSON.stringify(ds.map((g) => [g.tier.id, g.so_thang, g.gia])) === JSON.stringify([[7, 1, 100000], [7, 3, 289000]]), JSON.stringify(ds.map((g) => [g.tier.id, g.so_thang, g.gia])));
    }
    k('A1 (điều kiện) lấy được giá trị hạng chỉ cấp từ CACH_CO của tiers.js = chi_cap', CACH_CHI_CAP === 'chi_cap', String(CACH_CHI_CAP));
    k('A1 có hàm hangChiCap (hạng chỉ cấp → hiện mờ "Chủ quán cấp")', hamCo('hangChiCap') && T.hangChiCap([vang, kimCuong]).map((t) => t.id).join() === '8');
    const dong = hamCo('dongThe') ? T.dongThe(vang, { so_thang: 3, gia: 289000 }) : null;
    k('A2 có hàm dongThe → dòng giỏ có the {tier_id, so_thang}, product_id −1000000 − id hạng, 1 thẻ', !!dong && dong.the?.tier_id === 7 && dong.the?.so_thang === 3 && dong.product_id === -1000007 && dong.quantity === 1, JSON.stringify(dong));
    const gio = dong ? [monThuong, dong] : [monThuong];
    const than = T.thanTinhThu(gio, khachA, '');
    k('A2 thanTinhThu: món vẫn ở items, KHÔNG có dòng thẻ trong items, membership_buy = { tier_id, so_thang } (không gửi giá)', !!dong && than.items.length === 1 && than.items[0].product_id === 5
      && JSON.stringify(than.membership_buy) === JSON.stringify({ tier_id: 7, so_thang: 3 }), JSON.stringify(than));
    k('A2 thanTinhThu giỏ không thẻ: không có khoá membership_buy (K5 giỏ món cũ giữ nguyên)', !('membership_buy' in T.thanTinhThu([monThuong], khachA, '')));
    const t1 = T.thanPhien({ gio, khach: khachA, ma: '', cach: 'cash', dungTK: false, dungMe: false });
    k('A2 thanPhien (phiên thu) mang cùng membership_buy', !!dong && JSON.stringify(t1.don.membership_buy) === JSON.stringify({ tier_id: 7, so_thang: 3 }), JSON.stringify(t1.don));
    if (dong) {
      const d1 = T.dongThe(vang, { so_thang: 1, gia: 100000 });
      k('A3 khoá tính giá đổi khi đổi số tháng của thẻ (cùng hạng, 1 ↔ 3 tháng)', T.khoaTinh([monThuong, dong], khachA, '') !== T.khoaTinh([monThuong, d1], khachA, ''));
      k('A3 khoá đổi khi thêm / bỏ thẻ', T.khoaTinh([monThuong], khachA, '') !== T.khoaTinh([monThuong, dong], khachA, ''));
      const g = T.tinhGio([dong], { hang: { usable: true, discount_percent: 20, special_discount_percent: 20 } });
      k('A4 hạng của khách KHÔNG giảm giá cái thẻ (như gói nạp)', g.dong[0].giaHang === 289000 && g.tong === 289000, `giaHang ${g.dong[0]?.giaHang}`);
    }
    k('A8 có hàm viTriMayChu (máy chủ đẩy dòng thẻ CUỐI items — orders.js)', hamCo('viTriMayChu'));
    if (hamCo('viTriMayChu') && dong) {
      k('A8 giỏ [thẻ, món] → dòng giỏ 0 (thẻ) ứng dòng máy chủ 1, dòng giỏ 1 (món) ứng dòng máy chủ 0', JSON.stringify(T.viTriMayChu([dong, monThuong])) === '[1,0]', JSON.stringify(T.viTriMayChu([dong, monThuong])));
      k('A8 giỏ [món, thẻ] và giỏ không thẻ giữ nguyên thứ tự', JSON.stringify(T.viTriMayChu([monThuong, dong])) === '[0,1]' && JSON.stringify(T.viTriMayChu([monThuong, { ...monThuong, key: 9 }])) === '[0,1]');
    }
    // luật chạm gói
    k('A5 có hàm kiemTraThe', hamCo('kiemTraThe'));
    if (hamCo('kiemTraThe') && dong) {
      const nap = { key: 3, goi_nap_id: 1, product_id: -2000001, product_name: 'Nạp', unit_price: 100000, quantity: 1 };
      k('A5 chưa chọn khách → báo chọn khách', /khách/i.test(T.kiemTraThe([], null, null, vang) || ''));
      k('A5 giỏ đang là gói nạp → từ chối (đơn nạp riêng)', !!T.kiemTraThe([nap], khachA, null, vang));
      k('A5 giỏ đã có một thẻ → từ chối (tối đa MỘT dòng thẻ)', !!T.kiemTraThe([dong], khachA, null, vang));
      k('A5 giỏ có món (chưa thẻ), khách đã chọn → CHO (cùng giỏ với món — K5)', T.kiemTraThe([monThuong], khachA, null, vang) === null);
      k('A5 hạng chỉ cấp → từ chối "Chủ quán cấp"', /Chủ quán cấp/.test(T.kiemTraThe([], khachA, null, kimCuong) || ''));
      k('A5 khách đang có hạng CAO HƠN còn hạn → từ chối', !!T.kiemTraThe([], khachA, { usable: true, thu_bac: 3, tier_name: 'Kim Cương' }, vang));
      k('A5 khách có hạng cùng bậc / thấp hơn → CHO (gia hạn — K5)', T.kiemTraThe([], khachA, { usable: true, thu_bac: 2, tier_name: 'Vàng' }, vang) === null
        && T.kiemTraThe([], khachA, { usable: true, thu_bac: 1, tier_name: 'X' }, vang) === null);
      k('A5 hạng cao hơn nhưng đã HẾT HẠN (usable=false) → CHO (K5 dữ liệu cũ)', T.kiemTraThe([], khachA, { usable: false, thu_bac: 3 }, vang) === null);
    }
    // nạp không nhận thẻ: kiemTraNap thấy giỏ có thẻ là "giỏ có món"
    if (dong) k('A6 chạm gói nạp khi giỏ có thẻ → từ chối (giỏ nạp và thẻ không chung)', !!T.kiemTraNap([dong], khachA));
  });

  muc('[A] Tab "Thẻ thành viên" — màn Bán hàng (đọc nguồn)');
  const bh = doc('client/src/pages/BanHang/BanHangMoi.jsx');
  k('A7 BanHangMoi có tab "Thẻ thành viên" và đã nạp /tiers qua dsGoiThe / hangChiCap', />Thẻ thành viên<\/button>/.test(bh) && /dsGoiThe\(/.test(bh) && /hangChiCap\(/.test(bh));
  k('A7 chạm gói đi qua kiemTraThe rồi mới vào giỏ (một cổng)', /kiemTraThe\(/.test(bh));

  muc('[B] Ba nút cách trả — không tự trừ tài khoản');
  await thu('B', async () => {
    k('B1 có hàm lyDoKhongTru', hamCo('lyDoKhongTru'));
    if (hamCo('lyDoKhongTru')) {
      k('B1 chưa chọn khách → mờ + lý do (chuỗi)', typeof T.lyDoKhongTru({ khach: null, laNap: false }) === 'string' && T.lyDoKhongTru({ khach: null, laNap: false }).length > 0);
      k('B1 khách không có số dư (khách và mẹ đều 0) → mờ + lý do', !!T.lyDoKhongTru({ khach: { balance: 0, parent_balance: 0 }, laNap: false }));
      k('B1 khách có số dư → bấm được (null)', T.lyDoKhongTru({ khach: { balance: 1000, parent_balance: 0 }, laNap: false }) === null);
      k('B1 chỉ tài khoản mẹ có số dư → bấm được (null)', T.lyDoKhongTru({ khach: { balance: 0, parent_balance: 5000 }, laNap: false }) === null);
      k('B1 đơn nạp → không trừ tài khoản dù khách có số dư', !!T.lyDoKhongTru({ khach: { balance: 999999, parent_balance: 0 }, laNap: true }));
    }
    k('B2 hằng CACH_TRA_MAC_DINH = tien_mat (khách có số dư vẫn KHÔNG tự trừ)', T.CACH_TRA_MAC_DINH === 'tien_mat');
    // phép chia tiền: không bấm Trừ TK thì không trừ (đường chiaTra giữ nguyên luật máy chủ)
    const c0 = T.chiaTra({ tong: 80000, khach: { balance: 500000, parent_balance: 0 }, dungTK: false, dungMe: false });
    k('B3 dungTK=false → soDuDung 0, phải trả đủ', c0.soDuDung === 0 && c0.phaiTra === 80000);
    const c1 = T.chiaTra({ tong: 80000, khach: { balance: 30000, parent_balance: 0 }, dungTK: true, dungMe: false });
    k('B3 bấm Trừ TK, số dư không đủ → trừ 30.000, còn 50.000 chọn TM / CK', c1.soDuDung === 30000 && c1.phaiTra === 50000);
  });
  k('B4 BanHangMoi: không còn `dungTK` mặc định true (useState(true)) — mặc định không trừ', !/\[dungTK, setDungTK\] = useState\(true\)/.test(bh) && !/setDungTK\(true\)/.test(bh));
  k('B4 BanHangMoi: có trạng thái cachTra khởi tạo bằng CACH_TRA_MAC_DINH', /useState\(CACH_TRA_MAC_DINH\)/.test(bh));
k('B4b chọn khách / bỏ khách / đơn mới / bỏ trừ (PIN) đều gọi MỘT hàm datLaiCach (đúng 4 chỗ) — hàm đó đặt cách trả VÀ phần còn lại VÀ ví mẹ; không chỗ nào đặt chữ cứng', (bh.match(/datLaiCach\(\)/g) || []).length === 4
    && /const datLaiCach = \(\) => \{ setCachTra\(CACH_TRA_MAC_DINH\); setCachConLai\('tien_mat'\); setDungMe\(false\); \};/.test(bh) && (bh.match(/setCachTra\(CACH_TRA_MAC_DINH\)/g) || []).length === 1 && !/setCachTra\('/.test(bh));
k('B4c đổi sang khách KHÁC → bỏ dòng thẻ khỏi giỏ (hạng khách mới chưa tra, kiemTraThe phải chạy lại)', /khach\?\.phone !== c\.phone\) setGio\(\(g\) => g\.filter\(\(m\) => !m\.the\)\)/.test(bh));
k('A9 dòng máy chủ khớp theo viTriMayChu, không theo chỉ số giỏ', /viTriMayChu\(gio\)/.test(bh));
  const tt = doc('client/src/pages/BanHang/ThuTien.jsx');
  k('B5 ThuTien có đủ ba nút: Tiền mặt · Chuyển khoản · Trừ tài khoản', />Tiền mặt<\/button>/.test(tt) && />Chuyển khoản<\/button>/.test(tt) && />Trừ tài khoản<\/button>/.test(tt));
  k('B5 ThuTien: nút Trừ tài khoản mờ kèm lý do từ lyDoKhongTru', /lyDoKhongTru\(/.test(tt));
  k('B5 ThuTien: chọn cách trả qua onCachTra (không còn nút "Bỏ" của tự trừ)', /onCachTra/.test(tt) && !/onDungTK\(false\)/.test(tt));

  // ═════ MÁY CHỦ ═════
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  imLang();
  const sxGia = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(sxGia);
  require.cache[sxGia].exports = { ...sxThat, isSxConfigured: () => false, checkStock: async () => ({ sufficient: true }),
    outStockFIFO: async () => ({ ok: true }), inStockReturn: async () => ({ ok: true }), callSxApi: async () => ({ ok: true }) };
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const app = express();
  app.use(express.json());
  app.use('/api/pos/damages', require(path.join(MAY_CHU, 'routes', 'damages.js')));
  app.use('/api/pos/registrations', require(path.join(MAY_CHU, 'routes', 'registrations.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();
  const mot = (sql, a = []) => db.queryOne(sql, a);
  const chu = await mot("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tk = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status} ${JSON.stringify(r.j).slice(0, 200)}`;

  muc('[D] Đơn nạp — báo sự cố bị chặn bằng câu + mã riêng');
  await thu('D', async () => {
    const donMoi = async (sdt, dong) => {
      const o = await db.run(`INSERT INTO pos_orders (code, customer_phone, customer_name, subtotal, total, status, payment_status, payment_method, created_at)
        VALUES (?, ?, 'Khách Thử', 100000, 100000, 'completed', 'paid', 'cash', '2026-11-08T10:00:00')`, ['DQ' + sdt.slice(-6) + dong.pid, sdt]);
      await db.run(`INSERT INTO pos_order_items (order_id, product_id, product_code, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, 'Dòng thử', 1, 100000, 100000)`, [o.lastInsertRowid, dong.pid, dong.ma]);
      return Number(o.lastInsertRowid);
    };
    const CAU = 'Đơn nạp tiền không xử lý sự cố — tiền nạp không hoàn';
    const nap = await donMoi('0938200001', { pid: -2000001, ma: 'NAP-1' });
    for (const hd of ['refund', 'none', 'return_stock']) {
      const n0 = Number((await mot('SELECT COUNT(*) AS n FROM pos_damage_logs')).n);
      const r = await goi('POST', '/pos/damages', { order_id: nap, product_code: 'NAP-1', quantity: 1, reason: 'other', action: hd, refund_amount: hd === 'refund' ? 50000 : 0 });
      k(`D1 đơn nạp, hành động ${hd} → 400, code DON_NAP_KHONG_SU_CO, đúng câu`, r.status === 400 && r.j.code === 'DON_NAP_KHONG_SU_CO' && r.j.error === CAU, moTa(r));
      k(`D1 đơn nạp, ${hd}: không ghi dòng log sự cố nào`, Number((await mot('SELECT COUNT(*) AS n FROM pos_damage_logs')).n) === n0);
    }
    const thuong = await donMoi('0938200002', { pid: 3, ma: 'SP-THU' });
    const r2 = await goi('POST', '/pos/damages', { order_id: thuong, product_code: 'SP-THU', quantity: 1, reason: 'other', action: 'none' });
    k('D2 (K5) đơn thường, chỉ ghi nhận → vẫn 200', r2.status === 200 && r2.j.success === true, moTa(r2));
    const the = await donMoi('0938200003', { pid: -1000001, ma: 'THE-Vang' });
    const r3 = await goi('POST', '/pos/damages', { order_id: the, product_code: 'THE-Vang', quantity: 1, reason: 'other', action: 'refund', refund_amount: 100000 });
    k('D3 (K5) đơn có dòng thẻ (không phải nạp) → KHÔNG dính mã đơn nạp', r3.j.code !== 'DON_NAP_KHONG_SU_CO', moTa(r3));
  });
  const ord = doc('client/src/pages/Orders.jsx');
  k('D4 Orders.jsx: nút "Xử lý sự cố" ẩn khi đơn có dòng nạp (product_id ≤ −2000000)', /-2000000/.test(ord) && /!laDonNap\(selectedOrder\)/.test(ord));

  muc('[E] Sửa đăng ký chờ: chỉ sửa khách do chính đăng ký đó tạo');
  await thu('E', async () => {
    const khachCua = (s) => mot('SELECT * FROM pos_customers WHERE phone = ?', [s]);
    const idDk = async (s) => (await mot('SELECT id FROM pos_registrations WHERE phone = ?', [s]))?.id;
    const sua = async (s, ten) => goi('PUT', '/pos/registrations/' + await idDk(s), { name: ten, notes: 'ghi ' + ten, parent_phone: '', relationship: '' });
    // E1: khách do chính đăng ký tạo → vẫn đổi (K5)
    const s1 = '0938200011';
    await goi('POST', '/pos/registrations', { phone: s1, name: 'Tên Đầu', requested_product: 'Nước ép' });
    const r1 = await sua(s1, 'Tên Sửa');
    k('E1 (K5) khách do chính đăng ký tạo → sửa đăng ký đổi cả khách', r1.status === 200 && (await khachCua(s1))?.name === 'Tên Sửa', moTa(r1));
    // E2: khách App có trước, đăng ký chờ cùng SĐT (khác người nhập) → khách giữ nguyên, đăng ký vẫn sửa
    const s2 = '0938200012';
    await db.run("INSERT INTO pos_customers (phone, name, notes, created_by, created_at) VALUES (?, 'Khách App Gốc', 'ghi gốc', 'app_kh', '2026-11-01T08:00:00')", [s2]);
    await db.run("INSERT INTO pos_registrations (phone, name, status, created_by, created_at) VALUES (?, 'Đăng Ký Chờ', 'pending', ?, '2026-11-02T08:00:00')", [s2, chu.username]);
    const r2 = await sua(s2, 'Sửa Đăng Ký');
    const kh2 = await khachCua(s2), dk2 = await mot('SELECT name FROM pos_registrations WHERE phone = ?', [s2]);
    k('E2 khách App (tạo bởi app_kh) → tên / ghi chú khách KHÔNG đổi', r2.status === 200 && kh2?.name === 'Khách App Gốc' && kh2?.notes === 'ghi gốc', `${moTa(r2)} · ${JSON.stringify(kh2)}`);
    k('E2 đăng ký vẫn sửa được', dk2?.name === 'Sửa Đăng Ký', JSON.stringify(dk2));
    // E3: khách có TRƯỚC đăng ký, cùng người nhập → vẫn giữ (điều kiện created_at >= đăng ký, như xoá)
    const s3 = '0938200013';
    await db.run("INSERT INTO pos_customers (phone, name, created_by, created_at) VALUES (?, 'Khách Có Trước', ?, '2026-10-01T08:00:00')", [s3, chu.username]);
    await db.run("INSERT INTO pos_registrations (phone, name, status, created_by, created_at) VALUES (?, 'Đăng Ký Sau', 'pending', ?, '2026-11-02T08:00:00')", [s3, chu.username]);
    const r3 = await sua(s3, 'Sửa Sau');
    k('E3 khách có TRƯỚC đăng ký (cùng người nhập) → giữ nguyên', r3.status === 200 && (await khachCua(s3))?.name === 'Khách Có Trước', `${moTa(r3)} · ${(await khachCua(s3))?.name}`);
    // E4: người nhập khác nhau, khách tạo sau đăng ký → giữ (điều kiện created_by)
    const s4 = '0938200014';
    await db.run("INSERT INTO pos_customers (phone, name, created_by, created_at) VALUES (?, 'Khách Người Khác', 'nv_khac', '2026-11-03T08:00:00')", [s4]);
    await db.run("INSERT INTO pos_registrations (phone, name, status, created_by, created_at) VALUES (?, 'Đăng Ký Của Tôi', 'pending', ?, '2026-11-02T08:00:00')", [s4, chu.username]);
    const r4 = await sua(s4, 'Sửa Người Khác');
    k('E4 khách do người khác tạo (created_by khác) → giữ nguyên', r4.status === 200 && (await khachCua(s4))?.name === 'Khách Người Khác', `${moTa(r4)} · ${(await khachCua(s4))?.name}`);
    // E5: đã xuất → vẫn 400 (K5)
    await db.run("UPDATE pos_registrations SET status = 'exported' WHERE phone = ?", [s1]);
    const r5 = await sua(s1, 'Sau Xuất');
    k('E5 (K5) đăng ký đã xuất → 400, khách không đổi', r5.status === 400 && (await khachCua(s1))?.name === 'Tên Sửa', moTa(r5));
  });

  muc('[C] Form Thêm khách — tra SĐT trước khi lưu (đọc nguồn)');
  const kh = doc('client/src/pages/Customers.jsx');
  k('C1 Customers.jsx: có tra khách theo SĐT đã chuẩn hoá (chuanSdtQuay + customersV2Api.search)', /chuanSdtQuay\(/.test(kh) && /customersV2Api\.search\(/.test(kh));
  k('C2 hiện câu "Khách đã có: <tên> — tìm khách ở màn Bán hàng" khi có khachTrung', /\{khachTrung && <div[^>]*>Khách đã có: \{khachTrung\.name\} — tìm khách ở màn Bán hàng/.test(kh));
  k('C3 nút Lưu mờ khi khách đã có (disabled gồm khachTrung)', /disabled=\{submitting \|\| !!khachTrung\}/.test(kh));
  k('C4 so SĐT bằng phone chuẩn hoá (không so chuỗi con): c.phone === ', /\.phone === sdtChuan/.test(kh));

  sv.close();
  console.log(`\nTỔNG: ${dat}/${dat + hong} ca đạt · ${dat} đạt · ${hong} hỏng`);
  console.log(hong ? `✗ CÓ ${hong} CA HỎNG` : '✓ ĐẠT');
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.log(`\n✗ BÀI SẬP: ${e.stack}`); console.log(`\nTỔNG: ${dat}/${dat + hong + 1} ca đạt · ${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
