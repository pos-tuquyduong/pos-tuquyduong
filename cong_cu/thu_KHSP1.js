#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-SP-1 — thông tin ngắn của món: bước 005 · cửa ghi PUT /api/pos/products/thong-tin · /api/kh/menu trả thêm · hằng số giao diện
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có 5 cột, chưa có cửa ghi, menu chưa có trường mới). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHSP1.js
 *
 *  Khuôn thu_KHAPI3.js: database.js thật + libsql thật trên file kho TẠM; chỉ thay ketNoiKho (P8), SX tắt. Quyền: chủ (owner) ghi được,
 *  nhân viên bị gỡ quyền manage_settings → 403. So HTTP status + `code`, không dò lời báo (E12). Ranh giới 160 / 161 / 200 / 201 thử cả
 *  hai phía (K3). Hằng số giao diện đọc từ NGUỒN client/src/utils/thongTinMon.js, so bằng máy chủ.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khsp1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khsp1_nv_' + Date.now();
const KHOA_KH = 'thu_khsp1_kh_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = KHOA_KH;
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_khsp1';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

const COT_MOI = ['nhu_cau', 'the_chat', 'mo_ta', 'cong_dung', 'thanh_phan'];
const KHOA_MENU_CU = ['con_hang', 'gia', 'gia_hang', 'ma', 'nhom', 'ten', 'ton_cu', 'ton_luc'];
const KHOA_MENU_MOI = [...KHOA_MENU_CU, ...COT_MOI, 'anh'].sort();

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  await db.initDatabase();
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/products', require(R('products.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('thu_ngan_khsp1', 'x', 'Thu ngân', 'staff', 1)");
  const nv = await db.queryOne("SELECT id FROM pos_users WHERE username = 'thu_ngan_khsp1'");
  const tkNv = jwt.sign({ userId: nv.id }, KHOA_NV, { expiresIn: '1h' });
  await db.run("DELETE FROM pos_permissions WHERE role = 'staff' AND permission = 'manage_settings'");
  await db.run("INSERT INTO pos_permissions (role, permission, allowed) VALUES ('staff', 'manage_settings', 0)");

  // Hai món có hàng giá; món thứ ba CHƯA có hàng pos_products (chưa đặt giá).
  for (const [i, loai] of [[801, 'juice'], [802, 'tea']]) {
    await db.run(`INSERT INTO pos_products (code, name, category, price, is_active, sx_product_type, sx_product_id) VALUES (?, ?, ?, 25000, 1, ?, ?)`,
      [`KHSP1_${i}`, `Món thử ${i}`, loai, loai, i]);
  }
  const goi = async (method, url, body, o = {}) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (o.tk) headers.Authorization = 'Bearer ' + o.tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ghi = (than, tk = tkChu) => goi('PUT', '/pos/products/thong-tin', { sx_product_type: 'juice', sx_product_id: 801, ...than }, { tk });
  const monTrongMenu = async (ma = 'juice_801') => ((await goi('GET', '/kh/menu')).j.data || []).find((m) => m.ma === ma);
  const hang = (loai, id) => db.queryOne('SELECT * FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?', [loai, id]);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const nguonSX = (f) => fs.readFileSync(path.join(GOC, f), 'utf8');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Bước 005 — 5 cột trong pos_products, chạy lại không đổi');
  await chay('A', async () => {
    const cot = async () => (await db.query('PRAGMA table_info(pos_products)')).map((c) => c.name);
    const co = await cot();
    k('A1 pos_products có đủ 5 cột mới', COT_MOI.every((c) => co.includes(c)), co.join(','));
    const truoc = (await db.query('SELECT so FROM pos_nang_cap ORDER BY so')).map((r) => r.so);
    k('A2 pos_nang_cap ghi bước 5', truoc.includes(5), JSON.stringify(truoc));
    const { chayNangCap } = require(path.join(GOC, 'server', 'nang_cap', 'chay.js'));
    imLang();
    const lai = await chayNangCap({ beginTransaction: db.beginTransaction, query: db.query });
    noiLai();
    const sau = (await db.query('SELECT so FROM pos_nang_cap ORDER BY so')).map((r) => r.so);
    k('A3 chạy lại: không lỗi, không bước mới, không thêm cột', lai.hong === null && bang(truoc, sau) && bang(co, await cot()), JSON.stringify(lai));
  });

  muc('[B] Cửa ghi PUT /api/pos/products/thong-tin');
  await chay('B', async () => {
    const day = { nhu_cau: ['ngu_ngon', 'am_bung'], the_chat: ['binh_hoa', 'dac_bam'], mo_ta: 'Nước ép dịu', cong_dung: 'Dễ ngủ', thanh_phan: 'Táo, gừng' };
    const gia0 = (await hang('juice', 801)).price;
    const r = await ghi(day);
    k('B1 chủ ghi đủ 5 trường → 200', la(r, 200), moTa(r));
    const h = await hang('juice', 801);
    k('B1 lưu đúng: mảng mã ở dạng JSON, chữ nguyên văn', !!h && bang(JSON.parse(h.nhu_cau), day.nhu_cau) && bang(JSON.parse(h.the_chat), day.the_chat)
      && h.mo_ta === 'Nước ép dịu' && h.cong_dung === 'Dễ ngủ' && h.thanh_phan === 'Táo, gừng', JSON.stringify(h));
    k('B1 K5 ghi thông tin KHÔNG đổi giá', !!h && h.price === gia0);
    const quay = await goi('GET', '/pos/products', undefined, { tk: tkChu });
    const mq = (quay.j || []).find((m) => m.sx_product_id === 801);
    k('B1 quầy (GET /pos/products) thấy thông tin, giá + sellable như cũ', !!mq && bang(mq.nhu_cau, day.nhu_cau) && mq.mo_ta === 'Nước ép dịu' && mq.price === gia0 && mq.sellable === true, JSON.stringify(mq));

    const ghiDo = async (ten, than, status, code) => {
      const x = await ghi(than);
      k(`${ten} → ${status} ${code}`, la(x, status, code) && typeof x.j.error === 'string' && x.j.error.length > 0, moTa(x));
      return x;
    };
    await ghiDo('B2 nhu_cau mã lạ', { nhu_cau: ['ngu_ngon', 'khong_co'] }, 400, 'MA_KHONG_HOP_LE');
    await ghiDo('B2 the_chat mã lạ', { the_chat: ['binh_hoa', 'kim_cuong'] }, 400, 'MA_KHONG_HOP_LE');
    await ghiDo('B2 nhu_cau trùng mã', { nhu_cau: ['ngu_ngon', 'ngu_ngon'] }, 400, 'MA_KHONG_HOP_LE');
    await ghiDo('B2 the_chat trùng mã', { the_chat: ['khi_hu', 'khi_hu'] }, 400, 'MA_KHONG_HOP_LE');
    await ghiDo('B2 mã của danh sách kia (the_chat dán vào nhu_cau)', { nhu_cau: ['binh_hoa'] }, 400, 'MA_KHONG_HOP_LE');
    await ghiDo('B2 nhu_cau không phải mảng', { nhu_cau: 'ngu_ngon' }, 400, 'MA_KHONG_HOP_LE');
    const sauLoi = await hang('juice', 801);
    k('B2 các lần bị từ chối KHÔNG ghi gì (dữ liệu B1 còn nguyên)', bang(JSON.parse(sauLoi.nhu_cau), day.nhu_cau) && sauLoi.mo_ta === 'Nước ép dịu');

    const dai = (n, ky = 'a') => ky.repeat(n);
    for (const [cot, gh] of [['mo_ta', 160], ['cong_dung', 160], ['thanh_phan', 200]]) {
      const tren = await ghiDo(`B3 ${cot} ${gh + 1} ký tự`, { [cot]: dai(gh + 1) }, 400, 'QUA_DAI');
      void tren;
      const duoi = await ghi({ [cot]: dai(gh) });
      k(`B3 ${cot} đúng ${gh} ký tự → 200 và lưu đủ`, la(duoi, 200) && [...(await hang('juice', 801))[cot]].length === gh, moTa(duoi));
    }
    const emoji160 = await ghi({ mo_ta: dai(160, '🍵') });
    k('B3 mo_ta 160 chữ ngoài BMP (đếm 1 ký tự thật) → 200', la(emoji160, 200), moTa(emoji160));
    await ghiDo('B3 mo_ta 161 chữ ngoài BMP', { mo_ta: dai(161, '🍵') }, 400, 'QUA_DAI');

    const x1 = await ghi({ nhu_cau: [], the_chat: '', mo_ta: '', cong_dung: null, thanh_phan: '   ' });
    const h1 = await hang('juice', 801);
    k('B4 rỗng / [] / null / toàn dấu cách = xoá (cột về NULL)', la(x1, 200) && h1.nhu_cau === null && h1.the_chat === null && h1.mo_ta === null && h1.cong_dung === null && h1.thanh_phan === null, JSON.stringify(h1));

    await ghi({ mo_ta: 'Giữ lại', nhu_cau: ['dep_da'] });
    await ghi({ cong_dung: 'Chỉ sửa một trường' });
    const h2 = await hang('juice', 801);
    k('B5 trường vắng khoá giữ nguyên (chỉ gửi cong_dung thì mo_ta, nhu_cau còn)', h2.mo_ta === 'Giữ lại' && bang(JSON.parse(h2.nhu_cau), ['dep_da']) && h2.cong_dung === 'Chỉ sửa một trường');

    const nvR = await ghi({ mo_ta: 'Nhân viên không được' }, tkNv);
    const khong = await ghi({ mo_ta: 'Không đăng nhập' }, null);
    k('B6 nhân viên không có manage_settings → 403, không ghi', la(nvR, 403) && (await hang('juice', 801)).mo_ta === 'Giữ lại', moTa(nvR));
    k('B6 không đăng nhập → 401', la(khong, 401), moTa(khong));

    const thieu = await goi('PUT', '/pos/products/thong-tin', { mo_ta: 'x' }, { tk: tkChu });
    const rong = await ghi({});
    k('B7 thiếu sx_product_type / sx_product_id → 400', la(thieu, 400, 'YEU_CAU_KHONG_HOP_LE'), moTa(thieu));
    k('B7 không trường thông tin nào → 400', la(rong, 400, 'YEU_CAU_KHONG_HOP_LE'), moTa(rong));

    const moi = await goi('PUT', '/pos/products/thong-tin', { sx_product_type: 'tea', sx_product_id: 899, mo_ta: 'Món chưa có giá', nhu_cau: ['tinh_tao'] }, { tk: tkChu });
    const hm = await hang('tea', 899);
    k('B8 món CHƯA có giá vẫn nhập được: tạo hàng, price 0, giữ thông tin', la(moi, 200) && !!hm && hm.price === 0 && hm.mo_ta === 'Món chưa có giá' && bang(JSON.parse(hm.nhu_cau), ['tinh_tao']), JSON.stringify(hm));
    const trong = ((await goi('GET', '/kh/menu')).j.data || []).some((m) => m.ma === 'tea_899');
    k('B8 món giá 0 vẫn KHÔNG vào menu khách (chưa bán được)', !trong);

    // K5: giá + bật/tắt đặc biệt vẫn sửa được như cũ, và không xoá thông tin món đã nhập.
    await ghi({ mo_ta: 'Còn nguyên sau khi đổi giá', nhu_cau: ['bo_khi'] });
    const doiGia = await goi('PUT', '/pos/products/price', { sx_product_type: 'juice', sx_product_id: 801, price: 31000 }, { tk: tkChu });
    const doiLo = await goi('PUT', '/pos/products/batch/prices', { products: [{ sx_product_type: 'juice', sx_product_id: 801, price: 32000, is_special_group: true }] }, { tk: tkChu });
    const h9 = await hang('juice', 801);
    k('B9 K5 đổi giá (PUT /price, batch/prices) vẫn chạy và KHÔNG xoá thông tin món', la(doiGia, 200) && la(doiLo, 200) && h9.price === 32000 && h9.is_special_group === 1
      && h9.mo_ta === 'Còn nguyên sau khi đổi giá' && bang(JSON.parse(h9.nhu_cau), ['bo_khi']), JSON.stringify(h9));
  });

  muc('[C] /api/kh/menu — trường mới, món chưa nhập, trường cũ không đổi');
  await chay('C', async () => {
    await ghi({ nhu_cau: ['giai_nhiet', 'ngu_ngon'], the_chat: ['am_hu'], mo_ta: 'Mô tả M', cong_dung: 'Công dụng C', thanh_phan: 'Thành phần T' });
    const m = await monTrongMenu('juice_801');
    k('C1 món đã nhập: đủ nhu_cau[] the_chat[] mo_ta cong_dung thanh_phan, anh null', !!m && bang(m.nhu_cau, ['giai_nhiet', 'ngu_ngon']) && bang(m.the_chat, ['am_hu'])
      && m.mo_ta === 'Mô tả M' && m.cong_dung === 'Công dụng C' && m.thanh_phan === 'Thành phần T' && m.anh === null, JSON.stringify(m));
    const trang = await monTrongMenu('tea_802');
    k('C2 món chưa nhập: [] / [] / null / null / null / anh null', !!trang && bang(trang.nhu_cau, []) && bang(trang.the_chat, []) && trang.mo_ta === null
      && trang.cong_dung === null && trang.thanh_phan === null && trang.anh === null, JSON.stringify(trang));
    k('C3 mỗi món ĐÚNG bộ khoá: 8 cũ + 5 mới + anh, không trường nào khác', !!m && !!trang && bang(Object.keys(m).sort(), KHOA_MENU_MOI) && bang(Object.keys(trang).sort(), KHOA_MENU_MOI), Object.keys(m || {}).join(','));
    const con = { ma: m.ma, ten: m.ten, nhom: m.nhom, gia: m.gia };
    k('C4 trường cũ không đổi (ma, ten, nhom, gia = 25000)', con.ma === 'juice_801' && con.gia === 25000 && typeof con.ten === 'string' && con.nhom === 'juice', JSON.stringify(con));
  });

  muc('[D] Hằng số giao diện = máy chủ (đọc NGUỒN client/src/utils/thongTinMon.js)');
  await chay('D', async () => {
    const may = require(path.join(GOC, 'server', 'utils', 'thongTinMon.js'));
    const nguon = nguonSX('client/src/utils/thongTinMon.js');
    const lay = (ten) => {
      const kh = nguon.match(new RegExp(`${ten}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
      return kh ? [...kh[1].matchAll(/ma:\s*'([a-z_]+)'/g)].map((x) => x[1]) : null;
    };
    k('D1 NHU_CAU của giao diện = máy chủ (cùng mã, cùng thứ tự)', bang(lay('NHU_CAU'), may.NHU_CAU), JSON.stringify(lay('NHU_CAU')));
    k('D2 THE_CHAT của giao diện = máy chủ (cùng mã, cùng thứ tự)', bang(lay('THE_CHAT'), may.THE_CHAT), JSON.stringify(lay('THE_CHAT')));
    const gh = (nguon.match(/GIOI_HAN\s*=\s*\{([^}]*)\}/) || [])[1] || '';
    const doc = (ten) => Number((gh.match(new RegExp(`${ten}:\\s*(\\d+)`)) || [])[1]);
    k('D3 giới hạn ký tự của giao diện = máy chủ (160 / 160 / 200)', doc('mo_ta') === may.GIOI_HAN.mo_ta && doc('cong_dung') === may.GIOI_HAN.cong_dung
      && doc('thanh_phan') === may.GIOI_HAN.thanh_phan, gh.trim());
  });

  muc('[E] Hợp đồng v4 khớp menu thật (thu_HOPDONG_KH.js chỉ kiểm chiều "trường trong hợp đồng có thật")');
  await chay('E', async () => {
    const hd = nguonSX('HOP_DONG_API_KH.md');
    const khoi = JSON.parse(hd.match(/<!-- HOP_DONG_MAY_DOC -->\s*```json\n([\s\S]*?)```/)[1]);
    const cua = khoi.cua.find((c) => c.pt === 'GET' && c.duong === '/menu');
    const truong = [...new Set(cua.tra.map((t) => t.replace(/^data\[\]\./, '').split('[]')[0].split('.')[0]))].sort();
    const m = await monTrongMenu('juice_801');
    k('E1 mọi trường mà /menu trả ra đều có trong hợp đồng, và ngược lại (cùng bộ khoá)', !!cua && !!m && bang(truong, Object.keys(m).sort()), `${truong.join(',')} ≠ ${Object.keys(m || {}).sort().join(',')}`);
    const dau = Number((hd.match(/^PHIEN_BAN:\s*(\d+)/m) || [])[1]);
    k('E2 PHIEN_BAN đầu file = phien_ban trong khối máy đọc, và ≥ 4', dau === khoi.phien_ban && dau >= 4, `${dau} / ${khoi.phien_ban}`);
    k('E3 nhật ký có dòng v4 nhắc KH-SP-1', /^- v4 · .*KH-SP-1/m.test(hd));
  });

  sv.close();
  ket();
}

function ket() {
  console.log(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
