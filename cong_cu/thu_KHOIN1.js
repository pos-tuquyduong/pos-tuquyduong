#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-IN-1 — (A) cài đặt in phiếu kho: khoá lưu / đọc, giá trị lạ → 400 · (B) màn xem phiếu đủ 3 khổ, khổ mặc định đứng đầu, số bản
 *                 (C) ô "Khổ mặc định" của hoá đơn ghi đúng khoá lệnh in đọc; máy chủ mặc định 80mm · (D) K5 phần KHÔNG được đổi
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có khoá in_phieu_*, chưa có hàm docInPhieuKho, ô khổ ghi nhầm khoá, seed còn 'a5').
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHOIN1.js
 *  Hàm thuần: GỌI THẲNG client/src/utils/inPhieu.js. Giao diện (.jsx) không chạy được trong node → đọc NGUỒN, bắt theo hành vi.
 *  Máy chủ: database.js thật + routes/settings.js thật + libsql thật trên file kho TẠM.
 *  Bản đột biến: --goc <thư mục gốc kho> (viec/KHO-IN-1/dot_bien.py chép kho ra thư mục tạm rồi thay chuỗi).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khoin1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khoin1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_khoin1';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

const doc = (f) => { try { return fs.readFileSync(path.join(GOC, f), 'utf8'); } catch { return ''; } };
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nap = (f) => import(pathToFileURL(path.join(GOC, f)).href);
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

async function main() {
  const inPhieu = await nap('client/src/utils/inPhieu.js');
  const LOAI = ['PX', 'DH', 'PN', 'PS'];

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B0] Hàm thuần: khổ + số bản của từng loại phiếu kho (utils/inPhieu.js)');
  const goi = (ten, ...a) => { try { return inPhieu[ten](...a); } catch { return 'LỖI: chưa có hàm'; } };
  k('B0 KHO_PHIEU_KHO = 80mm · a5 · a4', bang(inPhieu.KHO_PHIEU_KHO, ['80mm', 'a5', 'a4']), JSON.stringify(inPhieu.KHO_PHIEU_KHO));
  k('B0 có đủ 4 loại phiếu kho PX · DH · PN · PS', !!inPhieu.LOAI_PHIEU_KHO && bang(Object.keys(inPhieu.LOAI_PHIEU_KHO), LOAI), JSON.stringify(inPhieu.LOAI_PHIEU_KHO));
  k('B0 tên khoá: in_phieu_<loai>_kho / _ban', goi('khoaInPhieu', 'PX', 'kho') === 'in_phieu_px_kho' && goi('khoaInPhieu', 'PS', 'ban') === 'in_phieu_ps_ban',
    `${goi('khoaInPhieu', 'PX', 'kho')} ${goi('khoaInPhieu', 'PS', 'ban')}`);
  {
    const mac = goi('docInPhieuKho', {}, 'PX');
    k("B0 chưa có cài đặt → 80mm, 1 bản (hành vi cũ của phiếu kho: nút 'In 80 mm' đứng đầu)", mac?.kho === '80mm' && mac?.ban === 1, JSON.stringify(mac));
    k('B0 settings undefined / null → mặc định, không sập', goi('docInPhieuKho', undefined, 'DH')?.kho === '80mm' && goi('docInPhieuKho', null, 'DH')?.ban === 1);
    const s = { in_phieu_px_kho: 'a5', in_phieu_dh_kho: 'a4', in_phieu_pn_kho: '80mm', in_phieu_dh_ban: '2', in_phieu_ps_ban: '3' };
    k('B0 mỗi loại đọc đúng khoá của nó (PX=a5, DH=a4, PN=80mm, PS=mặc định)',
      goi('docInPhieuKho', s, 'PX')?.kho === 'a5' && goi('docInPhieuKho', s, 'DH')?.kho === 'a4' && goi('docInPhieuKho', s, 'PN')?.kho === '80mm' && goi('docInPhieuKho', s, 'PS')?.kho === '80mm');
    k('B0 số bản đọc đúng theo loại (DH=2, PS=3, PX=1)', goi('docInPhieuKho', s, 'DH')?.ban === 2 && goi('docInPhieuKho', s, 'PS')?.ban === 3 && goi('docInPhieuKho', s, 'PX')?.ban === 1);
    k('B0 khổ lạ / hoa-thường lạ / 58mm / 40x30 → rơi về 80mm', ['a3', 'A4', '58mm', '40x30', '', 5].every((v) => goi('docInPhieuKho', { in_phieu_px_kho: v }, 'PX')?.kho === '80mm'));
    k('B0 số bản: ngay dưới 1 (0, -1) → 1; ngay trên 3 (4, 99) → 1 (giá trị hỏng về mặc định); 1 và 3 giữ', goi('docInPhieuKho', { in_phieu_px_ban: '0' }, 'PX')?.ban === 1
      && goi('docInPhieuKho', { in_phieu_px_ban: '-1' }, 'PX')?.ban === 1 && goi('docInPhieuKho', { in_phieu_px_ban: '4' }, 'PX')?.ban === 1 && goi('docInPhieuKho', { in_phieu_px_ban: '99' }, 'PX')?.ban === 1
      && goi('docInPhieuKho', { in_phieu_px_ban: '1' }, 'PX')?.ban === 1 && goi('docInPhieuKho', { in_phieu_px_ban: '3' }, 'PX')?.ban === 3);
    k('B0 số bản chữ / rỗng / thập phân → 1', ['abc', '', '2.5', null].every((v) => goi('docInPhieuKho', { in_phieu_px_ban: v }, 'PX')?.ban === 1));
    k('B0 loại lạ → mặc định, không sập', goi('docInPhieuKho', s, 'ZZ')?.kho === '80mm');
  }
  {
    const t = goi('thuTuNutIn', 'a5');
    k('B0 thứ tự nút: khổ mặc định đứng đầu, đủ 3 khổ, không trùng', Array.isArray(t) && t[0] === 'a5' && t.length === 3 && new Set(t).size === 3 && ['80mm', 'a5', 'a4'].every((x) => t.includes(x)), JSON.stringify(t));
    k('B0 mặc định a4 → a4 đứng đầu; 80mm → 80mm đứng đầu (giữ thứ tự còn lại)', goi('thuTuNutIn', 'a4')?.[0] === 'a4' && bang(goi('thuTuNutIn', '80mm'), ['80mm', 'a5', 'a4']));
    k('B0 khổ lạ truyền vào → vẫn ra đủ 3 nút, 80mm đứng đầu', bang(goi('thuTuNutIn', 'xyz'), ['80mm', 'a5', 'a4']));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Máy chủ: PUT /settings kiểm khoá in_phieu_* — sai một khoá thì không ghi khoá nào');
  {
    imLang();
    const express = require(path.join(GOC, 'node_modules', 'express'));
    const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
    const db = require(path.join(GOC, 'server', 'database.js'));
    await db.initDatabase();
    const app = express();
    app.use(express.json());
    app.use('/api/pos/settings', require(path.join(GOC, 'server', 'routes', 'settings.js')));
    const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
    const goc = `http://127.0.0.1:${sv.address().port}/api/pos/settings`;
    const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
    const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
    await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('ql_thu', 'x', 'QL', 'manager', 1)");
    const ql = await db.queryOne("SELECT id FROM pos_users WHERE username = 'ql_thu'");
    const tkQl = jwt.sign({ userId: ql.id }, KHOA_NV, { expiresIn: '1h' });
    await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('nv_thu', 'x', 'NV', 'staff', 1)");
    const nv = await db.queryOne("SELECT id FROM pos_users WHERE username = 'nv_thu'");
    const tkNv = jwt.sign({ userId: nv.id }, KHOA_NV, { expiresIn: '1h' });
    // Quản lý chỉ sửa được cài đặt khi chủ quán đã cấp quyền manage_settings (tab Phân quyền) — chưa cấp thì 403 như mọi cài đặt khác
    const quanLyChuaCap = await fetch(goc, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tkQl }, body: JSON.stringify({ settings: { in_phieu_dh_kho: 'a5' } }) });
    await db.run("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('manager', 'manage_settings', 1)");
    const dapSettings = async (settings, token = tkChu) => {
      const r = await fetch(goc, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ settings }) });
      let j = {}; try { j = JSON.parse(await r.text()); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    };
    const docKhoa = async (khoa) => (await db.queryOne('SELECT value FROM pos_settings WHERE key = ?', [khoa]))?.value;
    const layTatCa = async () => { const r = await fetch(goc, { headers: { Authorization: 'Bearer ' + tkChu } }); return (await r.json()).data || {}; };

    const hop = await dapSettings({ in_phieu_px_kho: 'a5', in_phieu_px_ban: '2', in_phieu_dh_kho: 'a4', in_phieu_pn_kho: '80mm', in_phieu_ps_kho: 'a5', in_phieu_ps_ban: '3' });
    const doc1 = await layTatCa();
    // lỗi
    const sai = {};
    sai.kho = await dapSettings({ in_phieu_px_kho: '80mm', in_phieu_dh_kho: 'a3' });
    sai.kho58 = await dapSettings({ in_phieu_pn_kho: '58mm' });
    sai.rong = await dapSettings({ in_phieu_pn_kho: '' });
    sai.ban0 = await dapSettings({ in_phieu_pn_ban: '0' });
    sai.ban4 = await dapSettings({ in_phieu_pn_ban: '4' });
    sai.banChu = await dapSettings({ in_phieu_pn_ban: 'hai' });
    sai.loai = await dapSettings({ in_phieu_zz_kho: 'a5' });
    sai.truong = await dapSettings({ in_phieu_px_kich: '2' });   // giá trị hợp lệ của một số bản — chỉ TÊN khoá sai
    sai.loaiBan = await dapSettings({ in_phieu_zz_ban: '2' });
    const sau = await layTatCa();
    // ngay trên / dưới ngưỡng
    const ban1 = await dapSettings({ in_phieu_pn_ban: '1' });
    const ban3 = await dapSettings({ in_phieu_pn_ban: '3' });
    // phân quyền
    const qlGhi = await dapSettings({ in_phieu_dh_kho: 'a5' }, tkQl);
    const nvGhi = await dapSettings({ in_phieu_dh_kho: 'a4' }, tkNv);
    const dhSau = await docKhoa('in_phieu_dh_kho');
    // các khoá cài đặt khác vẫn ghi được (K5)
    const khac = await dapSettings({ invoice_copies: '1', in_phieu_px_kho: 'a4' });
    sv.close();
    noiLai();

    k('A hợp lệ → 200', hop.status === 200 && hop.j.success === true, `HTTP ${hop.status} ${JSON.stringify(hop.j)}`);
    k('A lưu rồi đọc lại ĐÚNG (PX=a5/2, DH=a4, PN=80mm, PS=a5/3) — dùng chung mọi máy qua GET /settings',
      doc1.in_phieu_px_kho === 'a5' && doc1.in_phieu_px_ban === '2' && doc1.in_phieu_dh_kho === 'a4' && doc1.in_phieu_pn_kho === '80mm' && doc1.in_phieu_ps_kho === 'a5' && doc1.in_phieu_ps_ban === '3',
      JSON.stringify(Object.fromEntries(Object.entries(doc1).filter(([x]) => x.startsWith('in_phieu_')))));
    k('A đọc lại qua hàm của màn hình ra đúng khổ + số bản (khép vòng lưu → đọc)', goi('docInPhieuKho', doc1, 'PX')?.kho === 'a5' && goi('docInPhieuKho', doc1, 'PX')?.ban === 2 && goi('docInPhieuKho', doc1, 'PS')?.ban === 3);
    k("A khổ lạ 'a3' → 400 CAI_DAT_KHONG_HOP_LE", sai.kho.status === 400 && sai.kho.j.code === 'CAI_DAT_KHONG_HOP_LE', `${sai.kho.status} ${JSON.stringify(sai.kho.j)}`);
    k("A khổ nhiệt '58mm' KHÔNG hợp lệ cho phiếu kho (chỉ 80mm · a5 · a4) → 400", sai.kho58.status === 400 && sai.kho58.j.code === 'CAI_DAT_KHONG_HOP_LE', `${sai.kho58.status}`);
    k('A khổ rỗng → 400', sai.rong.status === 400, `${sai.rong.status}`);
    k('A số bản: ngay dưới (0) → 400, ngay trên (4) → 400, chữ → 400', sai.ban0.status === 400 && sai.ban4.status === 400 && sai.banChu.status === 400, `${sai.ban0.status}/${sai.ban4.status}/${sai.banChu.status}`);
    k('A số bản: ranh giới 1 và 3 → 200', ban1.status === 200 && ban3.status === 200, `${ban1.status}/${ban3.status}`);
    k('A loại lạ (zz_kho = a5, zz_ban = 2) và trường lạ (px_kich = 2; giá trị hợp lệ, chỉ tên khoá sai) → 400 (khoá tiền tố in_phieu_ chỉ nhận đúng dạng)', sai.loai.status === 400 && sai.truong.status === 400 && sai.loaiBan.status === 400, `${sai.loai.status}/${sai.truong.status}/${sai.loaiBan.status}`);
    k("A sai một khoá thì KHÔNG ghi khoá nào: yêu cầu {px='80mm', dh='a3'} để px vẫn là 'a5' (giá trị trước đó)", sau.in_phieu_px_kho === 'a5' && sau.in_phieu_dh_kho === 'a4' && sau.in_phieu_pn_kho === '80mm' && !('in_phieu_zz_kho' in sau) && !('in_phieu_px_kich' in sau),
      `px=${sau.in_phieu_px_kho} dh=${sau.in_phieu_dh_kho} pn=${sau.in_phieu_pn_kho}`);
    k('A quản lý được cấp manage_settings thì ghi được khoá in phiếu; chưa cấp thì 403 (K5: chủ quán / quản lý cấu hình được)', qlGhi.status === 200 && quanLyChuaCap.status === 403, `HTTP ${qlGhi.status} ${JSON.stringify(qlGhi.j)} / chưa cấp ${quanLyChuaCap.status}`);
    k('A nhân viên thường KHÔNG ghi được (403) và giá trị không đổi', nvGhi.status === 403 && dhSau === 'a5', `HTTP ${nvGhi.status}, dh=${dhSau}`);
    k('A khoá cài đặt khác (invoice_copies) vẫn ghi cùng yêu cầu được (K5)', khac.status === 200, `HTTP ${khac.status} ${JSON.stringify(khac.j)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Màn xem phiếu (XemPhieu.jsx) — đủ 3 khổ, khổ mặc định đứng đầu (đọc nguồn, bắt theo hành vi)');
  const xemTho = doc('client/src/pages/Kho/XemPhieu.jsx');
  const xem = boChuThich(xemTho);
  const kieuIn = (() => { const m = /const KHO_IN = \{([\s\S]*?)\};\n/.exec(xem); return m ? m[1] : ''; })();
  const khoaKieu = [...kieuIn.matchAll(/(?:'([^']+)'|"([^"]+)"|\b([A-Za-z0-9_]+))\s*:\s*['"`]@page/g)].map((x) => x[1] || x[2] || x[3]);
  k('B KHO_IN có đủ 3 khổ 80mm · a5 · a4 (đúng tên khổ của KHO_PHIEU_KHO)', bang(khoaKieu, inPhieu.KHO_PHIEU_KHO || []), JSON.stringify(khoaKieu));
  k('B @page: 80mm auto · A5 · A4', /size:\s*80mm auto/.test(kieuIn) && /size:\s*A5\b/.test(kieuIn) && /size:\s*A4\b/.test(kieuIn));
  k('B khổ A5 có lề (margin) riêng, không để lề mặc định cắt chữ', /size:\s*A5;\s*margin:\s*\d+mm/.test(kieuIn) && /size:\s*A4;\s*margin:\s*\d+mm/.test(kieuIn));
  {
    // cài đặt tải từ máy chủ → vào state → chính state đó đưa cho docInPhieuKho (không đưa {} hay hằng)
    const tai = /api\.get\('\/settings'\)\.then\(\(\w+\) => (set\w+)\(/.exec(xem);
    const bien = tai && new RegExp('const \\[(\\w+), ' + tai[1] + '\\] = useState\\(').exec(xem);
    k('B màn đọc cài đặt từ máy chủ rồi chọn khổ qua docInPhieuKho (một hàm chung; đối số là state vừa nạp từ GET /settings)', !!bien && new RegExp('docInPhieuKho\\(' + bien[1] + ',').test(xem), String(tai && tai[1]));
  }
  k('B nút in dựng từ thuTuNutIn(khổ mặc định) — khổ mặc định đứng đầu, không viết cứng 3 nút', /thuTuNutIn\(/.test(xem) && !/inRa\('(a4|a5|80mm|k80)'\)/.test(xem));
  k('B mọi nút in gọi cùng một hàm inRa (cùng đường ghi đếm lần in rồi mới in)', /inRa\(\s*\w+\s*\)/.test(xem) && /api\.post\(`\/kho\/phieu\/\$\{id\}\/in`\)/.test(xem));
  k('B nút khổ mặc định được tô nổi (btn-primary), các nút khác btn-outline', /btn-primary|btn-outline/.test(xem) && /i === 0 \? 'btn-primary' : 'btn-outline'|=== macDinh \? 'btn-primary' : 'btn-outline'|khoMacDinh \? 'btn-primary' : 'btn-outline'/.test(xem));
  k('B số bản: khối in được dựng đúng `ban` lần khi in (không in 1 tờ rồi nhắc người dùng bấm lại)', /Array\.from\(\{\s*length:\s*kho\s*\?\s*\w+\.ban\s*:\s*1\s*\}/.test(xem));
  k('B tờ in thêm vẫn mang chữ "IN LẠI · LẦN n" (luật 4) ở MỌI bản', /IN LẠI · LẦN \{p\.so_lan_in\}/.test(xem));
  k('B lệnh in vẫn: ghi đếm lần in (POST /in) TRƯỚC khi mở hộp in; máy in lỗi không đụng sổ (luật 2, 5)', /if \(await ghi\(\(\) => api\.post\(`\/kho\/phieu\/\$\{id\}\/in`\)\)\) setKho\(/.test(xem));
  const css = doc('client/src/pages/Kho/inPhieuKho.css');
  k('B CSS in: có kiểu cho khổ a5 và a4 (cỡ chữ)', /\.kho-in-a5\s*\{[^}]*font-size/.test(css) && /\.kho-in-a4\s*\{[^}]*font-size/.test(css));
  k('B CSS in: ngắt trang giữa các bản (.kho-ban { break-after: page })', /\.kho-ban\s*\{[^}]*break-after:\s*page/.test(css));
  k('B CSS in: các bản sau bản đầu HIỆN khi in (display: block trong @media print)', /@media print\s*\{[\s\S]*\.kho-ban:not\(:first-child\)\s*\{\s*display:\s*block/.test(css));
  k('B CSS màn hình: chỉ bản đầu hiện (các bản sau display: none ngoài @media print)', /^\.kho-ban:not\(:first-child\)\s*\{\s*display:\s*none/m.test(css));
  k('B CSS in: dòng bảng không tràn (xuống dòng khi dài, không cắt chữ): overflow-wrap hoặc word-break trong khối .kho-in', /\.kho-in[^{]*\{[^}]*(overflow-wrap|word-break)/.test(css) || /(overflow-wrap|word-break)/.test(css));
  k('B nút khổ A5/A4/80mm có nhãn tiếng Việt rõ (mm / A5 / A4)', /In 80 mm|80 mm/.test(xem) && /A5/.test(xem) && /A4/.test(xem));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B2] Khối "Cài đặt in phiếu" (pages/CaiDat/InPhieu.jsx) gắn vào Cài đặt');
  const cd = boChuThich(doc('client/src/pages/CaiDat/InPhieu.jsx'));
  const st = boChuThich(doc('client/src/pages/Settings.jsx'));
  k('B2 có pages/CaiDat/InPhieu.jsx', cd.length > 0);
  k('B2 khối liệt kê đủ 4 loại phiếu từ LOAI_PHIEU_KHO (không viết cứng tên loại)', /LOAI_PHIEU_KHO/.test(cd) && /KHO_PHIEU_KHO/.test(cd) && /SO_BAN_TOI_DA/.test(cd));
  k('B2 lưu qua PUT /settings: khoá _kho nhận khổ, khoá _ban nhận số bản (đúng khoá màn xem phiếu đọc)', /api\.put\('\/settings'/.test(cd)
    && /settings\[khoaInPhieu\(\w+, 'kho'\)\] = \w+\[\w+\]\.kho\b/.test(cd) && /settings\[khoaInPhieu\(\w+, 'ban'\)\] = String\(\w+\[\w+\]\.ban\)/.test(cd));
  k('B2 đọc lại từ GET /settings qua docInPhieuKho (cùng hàm với màn xem phiếu)', /api\.get\('\/settings'\)\.then\(\(\w+\) => \{[\s\S]{0,200}docInPhieuKho\(\w+\.data/.test(cd));
  k('B2 không cho Lưu khi chưa tải được cài đặt (hàm luu thoát sớm khi tải lỗi / chưa có dữ liệu)', /const luu = async \(\) => \{\s*if \(taiLoi \|\| !\w+\) return;/.test(cd));
  k('B2 Settings.jsx import và vẽ khối, có tab riêng quyền manage_settings', /from '\.\/CaiDat\/InPhieu'/.test(st) && /<InPhieu\b/.test(st) && /inPhieu:\s*'manage_settings'/.test(st) && /\['inPhieu',\s*'manage_settings'\]/.test(st));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Ô "Khổ mặc định" của hoá đơn (InvoiceSettings.jsx) ghi đúng khoá lệnh in đọc');
  const is = boChuThich(doc('client/src/pages/InvoiceSettings.jsx'));
  k('C ô "Khổ mặc định" đọc từ khổ bill của bộ in (một nguồn với lệnh in), không đọc config.default_size', /Khổ mặc định:[\s\S]{0,300}value=\{khoHoaDon\(boIn\.bill\.kho\)\}/.test(is) && !/value=\{khoHoaDon\(config\.default_size\)\}/.test(is));
  k('C đổi ô → sửa boIn.bill.kho (không chỉ config.default_size)', /Khổ mặc định:[\s\S]{0,500}setBoIn\(/.test(is) && /Khổ mặc định:[\s\S]{0,500}bill:\s*\{\s*\.\.\.\w+\.bill,\s*kho:/.test(is));
  k('C lưu: gửi invoice_default_size = khổ bill (khoá mà docBoIn đọc khi chưa có bộ in lưu) cùng yêu cầu', /invoice_default_size:\s*khoHoaDon\(boIn\.bill\.kho\)|invoice_default_size:\s*boIn\.bill\.kho/.test(is));
  k('C chỉ gửi invoice_default_size khi đã nạp bộ in (không ghi đè bằng mặc định khi tải hỏng)', /boIn\s*\?\s*\{[^}]*invoice_default_size/.test(is));
  const srv = doc('server/routes/settings.js');
  const dbs = doc('server/database.js');
  k("C seed máy chủ: invoice_default_size = '80mm' (không còn 'a5')", /\['invoice_default_size',\s*'80mm'\]/.test(dbs) && !/\['invoice_default_size',\s*'a5'\]/.test(dbs));
  k("C đường đọc máy chủ: log in hoá đơn không còn mặc định paper_size 'a5'", !/paper_size\s*=\s*'a5'/.test(srv) && /paper_size\s*=\s*'80mm'/.test(srv));
  k("C giá trị cũ trong dữ liệu: 'a5' / 'a4' / rỗng vẫn đọc ra 80mm (không sửa dữ liệu)", ['a5', 'a4', ''].every((v) => inPhieu.docBoIn({ invoice_default_size: v }).bill.kho === '80mm'));
  k("C khổ nhiệt đã chọn: invoice_default_size='58mm' → bill 58mm; bộ in lưu bill.kho='58mm' thắng khoá cũ", inPhieu.docBoIn({ invoice_default_size: '58mm' }).bill.kho === '58mm'
    && inPhieu.docBoIn({ invoice_default_size: '80mm', [inPhieu.KHOA_BO_IN]: JSON.stringify({ bill: { kho: '58mm' } }) }).bill.kho === '58mm');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] K5 — phần KHÔNG được đổi');
  const ip = doc('client/src/components/InvoicePrint.jsx');
  const ipv = doc('client/src/components/InvoicePreview.jsx');
  const inpPhieu = doc('client/src/components/InPhieu.jsx');
  k("D1 hoá đơn khách vẫn chỉ khổ nhiệt: KHO_BILL = 58mm · 80mm (KHÔNG thêm A4 / A5 cho hoá đơn khách)", bang(inPhieu.KHO_BILL, ['58mm', '80mm']));
  k('D1 khổ tem / phiếu pha chế sau thanh toán không đổi: KHO_TEM ["40x30"], KHO_PHIEU ["80mm","58mm"]', bang(inPhieu.KHO_TEM, ['40x30']) && bang(inPhieu.KHO_PHIEU, ['80mm', '58mm']));
  k('D1 bộ in sau thanh toán mặc định không đổi: bill 80mm/1, tem 40x30/1, phiếu pha chế 80mm/1', (() => { const m = inPhieu.docBoIn({}); return m.bill.kho === '80mm' && m.bill.ban === 1 && m.tem.kho === '40x30' && m.pha_che.kho === '80mm' && m.pha_che.ban === 1 && m.tu_mo === false; })());
  k("D2 hoá đơn 2 tờ HD-1 vẫn vẽ bằng HoaDonTo, tờ in lại giữ size={paperSize}", /export function HoaDonTo/.test(ipv) && /<HoaDonTo\b/.test(ip) && /size=\{paperSize\}/.test(ip));
  k('D3 InPhieu.jsx (tem, phiếu pha chế) giữ KHO_GIAY a5 · a4 và taiLieuIn như cũ', /KHO_GIAY\s*=\s*\{[^}]*'40x30'[^}]*a5[^}]*a4/.test(inpPhieu) && /export function taiLieuIn/.test(inpPhieu) && /export function inQuaIframe/.test(inpPhieu));
  k('D4 nội dung phiếu kho không đổi: vẫn các khối A · Tổng cần lấy, B · Định lượng, C · Kết quả, chữ ký "Người lập"/"Người lấy hàng"', /A · Tổng cần lấy/.test(xemTho) && /B · Định lượng từng công thức/.test(xemTho) && /C · Kết quả/.test(xemTho)
    && /Người lấy hàng: ________ · Người pha: ________/.test(xemTho) && /Người lập: ________ · Người nhận \/ duyệt: ________/.test(xemTho));
  k('D4 màn xem phiếu vẫn là nơi DUY NHẤT gọi `/in` (đếm lần in) — khối cài đặt mới KHÔNG gọi', !/\/in`|\/in'/.test(cd) && /\/in`/.test(xem));
  k("D5 mặc định XemPhieu khi chưa có cài đặt giữ 80mm đầu tiên: nút đầu là 'In 80 mm' như cũ (quầy đang dùng)", bang(goi('thuTuNutIn', goi('docInPhieuKho', {}, 'PX')?.kho), ['80mm', 'a5', 'a4']));

  console.log(`\nSỐ CA: ${dat + hong}`);
  console.log(`${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.log(`  ${C.do}✗ bài thử sập — ${e.stack || e.message}${C.het}`); console.log(`${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
