#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ SAOLUU-2 — khôi phục sao lưu an toàn: không mất cột · không mất dòng âm thầm · tất cả hoặc không · đủ bảng
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_SAOLUU2.js [--may-chu <thư mục server>]
 *  Khuôn thu_KHO1.js: database.js thật + libsql thật trên kho TẠM, route backup thật. Ba kho tạm, mỗi kho một bản nạp riêng của server/:
 *  NGUON (có dữ liệu mẫu — nguồn vòng tròn F), DICH (trống — đích vòng tròn F), THU (các ca A–E + đua).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_saoluu2_'));
const XLSX = require(path.join(GOC, 'node_modules', 'xlsx'));
const express = require(path.join(GOC, 'node_modules', 'express'));
const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
process.env.JWT_SECRET = 'thu_saoluu2_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const doc = (duong) => { try { return fs.readFileSync(duong, 'utf8'); } catch { return ''; } };
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

/** Dựng một máy chủ trên kho tạm riêng: xoá bộ nhớ nạp của server/ → database.js, auth, backup.js nạp lại, nối vào kho này. */
async function dungMay(ten) {
  const file = path.join(THU_MUC, ten + '.db');
  for (const m of Object.keys(require.cache)) if (m.startsWith(MAY_CHU + path.sep)) delete require.cache[m];
  const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
  require.cache[duongKN] = { id: duongKN, filename: duongKN, loaded: true,
    exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + file } }), diaChiSX: () => '', FILE_THU: file } };
  imLang();
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const app = express();
  app.use(express.json());
  app.use('/api/pos/backup', require(path.join(MAY_CHU, 'routes', 'backup.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  noiLai();
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos/backup`;
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nv = (await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', 'nv', 'staff', 1)",
    ['nv_' + ten])).lastInsertRowid;
  const the = { chu: jwt.sign({ userId: chu.id }, process.env.JWT_SECRET), nv: jwt.sign({ userId: Number(nv) }, process.env.JWT_SECRET) };
  const goi = async (method, url, body, ai = 'chu') => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers: { Authorization: 'Bearer ' + the[ai] }, body });
      const kieu = r.headers.get('content-type') || '';
      if (!kieu.includes('json')) return { status: r.status, tep: Buffer.from(await r.arrayBuffer()) };
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const gui = (tep, duong = '/restore', ai = 'chu') => { const f = new FormData(); f.append('file', new Blob([tep]), 'sl.xlsx'); return goi('POST', duong, f, ai); };
  const bam = async () => {   // băm MỌI bảng của kho (trừ sqlite_*) — "không đổi gì"
    const h = crypto.createHash('sha1');
    for (const { name } of await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")) {
      h.update(name + JSON.stringify(await db.query(`SELECT * FROM ${name} ORDER BY rowid`)));
    }
    return h.digest('hex');
  };
  return { db, sv, goi, gui, bam };
}

/** File Excel từ danh sách [nhãn trang, dòng[]] — đúng cách export-all dựng trang (json_to_sheet). */
const tepTu = (trang) => {
  const wb = XLSX.utils.book_new();
  for (const [ten, dong] of trang) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dong), ten);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
const docTep = (tep) => XLSX.read(tep, { type: 'buffer' });
const nhatKy = (n, them = {}) => Array.from({ length: n }, (_, i) => ({ id: 9000 + i, type: 'sl2', file_name: `f${i}`, record_count: i, ...them }));

/** D — phép chốt "đủ bảng": mọi CREATE TABLE IF NOT EXISTS của database.js + server/nang_cap/** phải có trong BACKUP_TABLES.
 *  Bỏ qua: tên mở đầu _sao_luu_ (bản lưu của bước nâng cấp, chay.js themCot / 004 — không phải dữ liệu quán). */
function bangThieu(nguon, backupSrc) {
  const tao = new Set();
  for (const s of nguon) for (const m of s.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)) if (!m[1].startsWith('_sao_luu_')) tao.add(m[1]);
  const i = backupSrc.indexOf('BACKUP_TABLES');
  const ds = i < 0 ? '' : backupSrc.slice(i, backupSrc.indexOf('];', i));
  return { tao: [...tao], thieu: [...tao].filter((t) => !new RegExp(`name:\\s*'${t}'`).test(ds)) };
}

async function main() {
  console.log('\nTHỬ SAOLUU-2 — khôi phục sao lưu an toàn');
  const backupSrc = doc(path.join(MAY_CHU, 'routes', 'backup.js'));
  const thuMucNC = path.join(MAY_CHU, 'nang_cap');
  const nguonBang = [doc(path.join(MAY_CHU, 'database.js')),
    ...fs.readdirSync(thuMucNC).filter((f) => f.endsWith('.js')).map((f) => doc(path.join(thuMucNC, f)))];

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] đủ bảng');
  const thuc = bangThieu(nguonBang, backupSrc);
  k(`D2c mọi bảng database.js + nang_cap/ đều trong BACKUP_TABLES (${thuc.tao.length} bảng; bỏ qua _sao_luu_*)`,
    thuc.tao.length > 30 && thuc.tao.includes('kho_lo') && thuc.tao.includes('pos_nang_cap') && !thuc.thieu.length, 'thiếu: ' + thuc.thieu.join(', '));
  k('D2a phép chốt BẮT được bảng bị bỏ khỏi BACKUP_TABLES (bản sao backup.js không có kho_lo)',
    JSON.stringify(bangThieu(nguonBang, backupSrc.replace(/\{ name: 'kho_lo'[^}]*\},?/, '')).thieu) === '["kho_lo"]');
  k('D2b phép chốt BẮT được bảng mới ở một bước nâng cấp quên thêm vào sao lưu (file nháp 999 trong bộ nhớ, không ghi vào kho)',
    JSON.stringify(bangThieu([...nguonBang, '`CREATE TABLE IF NOT EXISTS bang_moi_thu (id INTEGER)`'], backupSrc).thieu) === '["bang_moi_thu"]');
  const bo = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const bk = bo(backupSrc);
  const khongKP = bk.slice(bk.indexOf('BANG_KHONG_KHOI_PHUC'), bk.indexOf('];', bk.indexOf('BANG_KHONG_KHOI_PHUC')));
  k("D1 pos_don_app (KH-MUA-1) có trong BACKUP_TABLES VÀ BANG_KHONG_KHOI_PHUC", /name:\s*'pos_don_app'/.test(bk) && khongKP.includes("'pos_don_app'"));

  const NGUON = await dungMay('nguon');
  const DICH = await dungMay('dich');
  const THU = await dungMay('thu');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] không mất cột');
  {
    const a1 = await THU.gui(tepTu([['Khách hàng', [
      { phone: '0911000001', name: 'Đầu trống', notes: null, xung_ho: null, address: null },
      { phone: '0911000002', name: 'Đủ cột', notes: 'ghi chú', xung_ho: 'chi', address: 'Hà Nội' }]]]));
    const d2 = await THU.db.queryOne("SELECT notes, xung_ho, address FROM pos_customers WHERE phone = '0911000002'");
    k('A1 dòng đầu trống notes / xung_ho / address → dòng 2 vẫn đủ cả ba cột', a1.status === 200 && d2?.notes === 'ghi chú' && d2?.xung_ho === 'chi'
      && d2?.address === 'Hà Nội', `${moTa(a1)} · ${JSON.stringify(d2)}`);
    const a2 = await THU.gui(tepTu([['Nhật ký đồng bộ', [{ id: 1, type: 'a2', details: null, error_message: null, created_by: null },
      { id: 2, type: 'a2', details: 'chi tiết', error_message: 'lỗi', created_by: 'chu' }]]]));
    const n2 = await THU.db.queryOne('SELECT details, error_message, created_by FROM pos_sync_logs WHERE id = 2');
    k('A2 bảng khác (Nhật ký đồng bộ): dòng đầu trống ba cột → dòng 2 đủ', a2.status === 200 && n2?.details === 'chi tiết'
      && n2?.error_message === 'lỗi' && n2?.created_by === 'chu', `${moTa(a2)} · ${JSON.stringify(n2)}`);
    const a3 = await THU.gui(tepTu([['Nhật ký đồng bộ', nhatKy(2, { cot_la: 'x' })]]));
    const r3 = (a3.results || []).find((r) => r.sheet === 'Nhật ký đồng bộ');
    k('A3 cột lạ trong file → 200, đủ 2 dòng, cot_bo_qua = ["cot_la"]', a3.status === 200 && (await THU.db.query("SELECT id FROM pos_sync_logs WHERE type = 'sl2'")).length === 2
      && JSON.stringify(r3?.cot_bo_qua) === '["cot_la"]', `${moTa(a3)} · ${JSON.stringify(r3)}`);
    const a4 = await THU.gui(tepTu([['Khách hàng', [{ phone: '0911000003', name: 'Rỗng', notes: '' }]]]));
    const d4 = await THU.db.queryOne("SELECT notes FROM pos_customers WHERE phone = '0911000003'");
    k("A4 ô chữ rỗng '' khôi phục ra '' (không thành null)", a4.status === 200 && d4?.notes === '', `${moTa(a4)} · ${JSON.stringify(d4)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] không mất dòng âm thầm — tất cả hoặc không');
  {
    await THU.gui(tepTu([['Nhật ký đồng bộ', nhatKy(3)]]));
    const truoc = await THU.bam();
    const nl = (id, he) => ({ id, ten: 'NL' + id, ten_chuan: 'nl' + id, don_vi_luu: 'kg', he_so_doi: he, tao_luc: '2026-10-31T08:00:00' });
    const b1 = await THU.gui(tepTu([['Nhật ký đồng bộ', nhatKy(2, { type: 'b1' })], ['Kho - Nguyên liệu', [nl(1, 1), nl(2, 0.5), nl(3, 0)]]]));
    k('B1 kho trống, trang 2 dòng Excel 4 vi phạm CHECK → 400 KHOI_PHUC_DONG_HONG, bảng + dòng + lý do; MỌI bảng không đổi (cả trang 1)',
      b1.status === 400 && b1.code === 'KHOI_PHUC_DONG_HONG' && b1.bang === 'kho_nguyen_lieu' && b1.dong === 4 && /CHECK/.test(b1.ly_do || '')
      && (await THU.bam()) === truoc, `${moTa(b1)} · bang ${b1.bang} dong ${b1.dong} ly_do ${b1.ly_do}`);
    const b2 = await THU.gui(tepTu([['Nhật ký đồng bộ', [...nhatKy(2), { id: 9000, type: 'trung' }]]]));
    k('B2 trùng khoá chính ở dòng Excel 4 → 400, lý do trùng khoá; không đổi gì', b2.status === 400 && b2.code === 'KHOI_PHUC_DONG_HONG'
      && b2.dong === 4 && /UNIQUE|trùng/.test(b2.ly_do || '') && (await THU.bam()) === truoc, `${moTa(b2)} · ${b2.ly_do}`);
    const b4 = await THU.gui(tepTu([['Nhật ký đồng bộ', [{ id: 1, type: 'ok' }, { id: 2, type: null, file_name: 'thiếu type' }]]]));
    k('B4 thiếu giá trị bắt buộc (NOT NULL) ở dòng Excel 3 → 400, không đổi gì', b4.status === 400 && b4.dong === 3 && /NOT NULL/.test(b4.ly_do || '')
      && (await THU.bam()) === truoc, moTa(b4));
    // libsql BẬT khoá ngoại (PRAGMA foreign_keys = 1): pos_product_group_members.group_id → pos_product_groups. File đặt trang CON trước trang CHA.
    const b5 = await THU.gui(tepTu([['Thành viên nhóm SP', [{ id: 1, group_id: 77, sx_product_type: 'juice', sx_product_id: 1 }]],
      ['Nhóm sản phẩm', [{ id: 77, code: 'G77', name: 'Nhóm 77' }]]]));
    k('B5 trang con đứng TRƯỚC trang cha trong file (khoá ngoại bật) → 200, đủ cả nhóm lẫn thành viên (chèn cha trước, xoá con trước)',
      b5.status === 200 && (await THU.db.query('SELECT id FROM pos_product_group_members WHERE group_id = 77')).length === 1
      && (await THU.db.query('SELECT id FROM pos_product_groups')).length === 1, moTa(b5));
    // Dòng trống GIỮA trang (người sửa file xoá một dòng): sheet_to_json bỏ dòng trống → số dòng báo phải là dòng Excel THẬT (5), không phải thứ tự (4).
    const wbTrong = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbTrong, XLSX.utils.aoa_to_sheet([['id', 'type'], [9100, 'a'], [9101, 'b'], [], [9102, null]]), 'Nhật ký đồng bộ');
    const b6 = await THU.gui(XLSX.write(wbTrong, { type: 'buffer', bookType: 'xlsx' }));
    k('B6 dòng trống giữa trang → lỗi NOT NULL báo đúng dòng Excel 5 (không phải 4); không đổi gì', b6.status === 400 && b6.dong === 5
      && (await THU.bam()) === truoc, `${moTa(b6)} · dong ${b6.dong}`);
    // Lỗi HẠ TẦNG (không phải dữ liệu của dòng — mạng, Turso hết giờ…): giả bằng trigger đọc bảng không có → SQLITE_ERROR khi chèn.
    await THU.db.run('CREATE TRIGGER thu_loi_ha_tang BEFORE INSERT ON pos_sync_logs BEGIN SELECT * FROM bang_khong_co_thu; END');
    const truocB7 = await THU.bam();
    const b7 = await THU.gui(tepTu([['Nhật ký đồng bộ', nhatKy(2, { type: 'b7' })]]));
    const sauB7 = await THU.bam();
    await THU.db.run('DROP TRIGGER thu_loi_ha_tang');
    k('B7 lỗi không phải dữ liệu (SQLITE_ERROR) → 500 LOI_MAY_CHU, KHÔNG báo "dòng N hỏng"; không đổi gì', b7.status === 500 && b7.code === 'LOI_MAY_CHU'
      && b7.dong === undefined && sauB7 === truocB7, moTa(b7));
    const kp = doc(path.join(MAY_CHU, 'utils', 'khoiPhuc.js'));
    k('B3 server/utils/khoiPhuc.js có và không còn console.error (lỗi chèn không bị nuốt)', kp.length > 0 && !/console\.error/.test(bo(kp)));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] xem trước khớp khôi phục');
  {
    const tepA3 = tepTu([['Nhật ký đồng bộ', nhatKy(2, { cot_la: 'x' })]]);
    const x1 = await THU.gui(tepA3, '/preview-restore');
    const p1 = (x1.preview || [])[0];
    k('C1 xem trước file có cột lạ → cot_bo_qua = ["cot_la"], fileRows 2 (như khôi phục báo)', x1.status === 200
      && JSON.stringify(p1?.cot_bo_qua) === '["cot_la"]' && p1?.fileRows === 2, JSON.stringify(p1));
    await THU.db.run("INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, tao_luc) VALUES ('Có sẵn', 'co san', 'kg', 'x')");
    const tepKho = tepTu([['Kho - Nguyên liệu', [{ id: 50, ten: 'Từ file', ten_chuan: 'tu file', don_vi_luu: 'kg', tao_luc: 'x' }]],
      ['Nâng cấp dữ liệu', [{ so: 999, ten: 'gia', luc: 'x' }]]]);
    const x2 = await THU.gui(tepKho, '/preview-restore');
    const tim = (ds, ten) => (ds || []).find((p) => p.sheet === ten);
    k('C2 xem trước trang kho khi kho CÓ dữ liệu → skipped KHO_CO_DU_LIEU (như khôi phục)',
      tim(x2.preview, 'Kho - Nguyên liệu')?.status === 'skipped' && tim(x2.preview, 'Kho - Nguyên liệu')?.code === 'KHO_CO_DU_LIEU', JSON.stringify(x2.preview));
    k('C4 xem trước trang Nâng cấp dữ liệu → skipped NANG_CAP_KHONG_KHOI_PHUC', tim(x2.preview, 'Nâng cấp dữ liệu')?.code === 'NANG_CAP_KHONG_KHOI_PHUC');
    const x3 = await THU.gui(tepTu([['Số dư', [{ phone: '0900', balance: 1 }]]]), '/preview-restore');
    k('C3 (giữ) xem trước trang tiền có dòng → 400 KHOI_PHUC_TRANG_TIEN_BI_CHAN', x3.status === 400 && x3.code === 'KHOI_PHUC_TRANG_TIEN_BI_CHAN', moTa(x3));

    // E — luật cũ giữ nguyên
    const truocKho = await THU.bam();
    const e2 = await THU.gui(tepKho);
    const rKho = tim(e2.results, 'Kho - Nguyên liệu'), rNC = tim(e2.results, 'Nâng cấp dữ liệu');
    k('E2 khôi phục khi kho CÓ dữ liệu → bỏ bảng kho (KHO_CO_DU_LIEU); E3 pos_nang_cap không khôi phục; không đổi gì',
      e2.status === 200 && rKho?.code === 'KHO_CO_DU_LIEU' && rNC?.code === 'NANG_CAP_KHONG_KHOI_PHUC' && (await THU.bam()) === truocKho, moTa(e2));

    // C5 / D3 — bảng có trong danh sách mà CSDL chưa có (KH-MUA-1 chưa nâng cấp, bước nâng cấp hỏng): bỏ qua, không xoá gì, phần khác vẫn khôi phục
    await THU.db.run('ALTER TABLE pos_sync_logs RENAME TO pos_sync_logs_tam');
    const tepThieu = tepTu([['Cài đặt', [{ key: 'thu_c5', value: '1' }]], ['Nhật ký đồng bộ', nhatKy(1)]]);
    const x5 = await THU.gui(tepThieu, '/preview-restore');
    const r5 = await THU.gui(tepThieu);
    await THU.db.run('ALTER TABLE pos_sync_logs_tam RENAME TO pos_sync_logs');
    k('C5 xem trước bảng chưa có trong CSDL → skipped BANG_CHUA_CO', tim(x5.preview, 'Nhật ký đồng bộ')?.code === 'BANG_CHUA_CO', JSON.stringify(x5.preview));
    k('D3 khôi phục bảng chưa có trong CSDL → 200, skipped BANG_CHUA_CO; trang Cài đặt vẫn khôi phục', r5.status === 200
      && tim(r5.results, 'Nhật ký đồng bộ')?.code === 'BANG_CHUA_CO' && !!(await THU.db.queryOne("SELECT 1 AS x FROM pos_settings WHERE key = 'thu_c5'")), moTa(r5));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] giữ luật cũ');
  {
    const truoc = await THU.bam();
    const e1 = await THU.gui(tepTu([['Nhật ký đồng bộ', nhatKy(1, { type: 'e1' })], ['Đơn hàng', [{ id: 1 }]]]));
    k('E1 trang tiền có dòng → 400 KHOI_PHUC_TRANG_TIEN_BI_CHAN trước mọi ghi', e1.status === 400 && e1.code === 'KHOI_PHUC_TRANG_TIEN_BI_CHAN'
      && (await THU.bam()) === truoc, moTa(e1));
    const tep = tepTu([['Nhật ký đồng bộ', nhatKy(1)]]);
    const e4a = await THU.gui(tep, '/restore', 'nv'), e4b = await THU.gui(tep, '/preview-restore', 'nv');
    k('E4 nhân viên không phải owner → 403 cả khôi phục lẫn xem trước', e4a.status === 403 && e4b.status === 403 && (await THU.bam()) === truoc);
    const e5 = await THU.gui(tepTu([['Khách hàng', [{ phone: '0911000009', name: 'File cũ' }]]]));
    k('E5 (K5) file cũ thiếu cột mới (không có xung_ho / address) → 200, khách vào đủ', e5.status === 200
      && !!(await THU.db.queryOne("SELECT 1 AS x FROM pos_customers WHERE phone = '0911000009' AND xung_ho IS NULL")), moTa(e5));
    const e7 = await THU.gui(tepTu([['Nhật ký đồng bộ', nhatKy(2)], ['Trang lạ', [{ a: 1 }]], ['Khuyến mãi', []]]));
    const r7 = (e7.results || []).find((r) => r.sheet === 'Nhật ký đồng bộ');
    k("E7 kết quả giữ hình dạng màn Cài đặt đọc: success, status 'restored', rows 2, total 2; trang lạ + trang trống → skipped",
      e7.success === true && r7?.status === 'restored' && r7?.rows === 2 && r7?.total === 2
      && (e7.results || []).filter((r) => r.status === 'skipped').length === 2, JSON.stringify(e7.results));
    // Nâng cấp hỏng = thiếu một bảng kho: đếm kho lỗi → bỏ bảng kho với lý do ĐÚNG; phần còn lại vẫn khôi phục (KHO-1 J6/J7, nay ở khoiPhuc.js).
    await THU.db.run('ALTER TABLE kho_phieu RENAME TO kho_phieu_tam');
    const e8 = await THU.gui(tepTu([['Cài đặt', [{ key: 'thu_e8', value: '1' }]], ['Kho - Nhà cung cấp', [{ id: 1, ten: 'NCC' }]]]));
    await THU.db.run('ALTER TABLE kho_phieu_tam RENAME TO kho_phieu');
    const r8 = (e8.results || []).find((r) => r.sheet === 'Kho - Nhà cung cấp');
    k('E8 thiếu bảng kho (nâng cấp hỏng) → 200, bảng kho skipped KHO_KHONG_DEM_DUOC (không báo "kho có dữ liệu"); Cài đặt vẫn khôi phục',
      e8.status === 200 && r8?.code === 'KHO_KHONG_DEM_DUOC' && !!(await THU.db.queryOne("SELECT 1 AS x FROM pos_settings WHERE key = 'thu_e8'")),
      `${moTa(e8)} · ${JSON.stringify(r8)}`);
    const e6 = await THU.goi('GET', '/export-all');
    const ten = e6.tep ? docTep(e6.tep).SheetNames : [];
    const mot = await THU.goi('GET', '/export/pos_sync_logs');
    k('E6 xuất như cũ: export-all có đủ trang của bảng đang có + _Metadata; export/:table 200 trả file', e6.status === 200 && ten.includes('Khách hàng')
      && ten.includes('Kho - Dòng phiếu') && ten[ten.length - 1] === '_Metadata' && mot.status === 200 && !!mot.tep, ten.join(' | '));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[R] hai owner cùng bấm khôi phục một file');
  {
    const tep = tepTu([['Nhật ký đồng bộ', nhatKy(40, { type: 'dua' })]]);
    const [x, y] = await Promise.all([THU.gui(tep), THU.gui(tep)]);
    const ds = await THU.db.query('SELECT id, type FROM pos_sync_logs ORDER BY id');
    k('R1 mỗi lượt 200 hoặc 409 KHO_BAN; kết quả cuối đúng 40 dòng của file (không nhân đôi, không lẫn)',
      [x, y].every((r) => r.status === 200 || (r.status === 409 && r.code === 'KHO_BAN')) && ds.length === 40 && ds.every((d) => d.type === 'dua'),
      `${moTa(x)} | ${moTa(y)} · ${ds.length} dòng`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] vòng tròn: sao lưu → khôi phục vào CSDL trống → sao lưu lại → giống từng ô');
  {
    const n = NGUON.db;
    await n.run("INSERT INTO pos_customers (phone, name) VALUES ('0922000001', 'Trống hết')");
    await n.run("INSERT INTO pos_customers (phone, name, notes, xung_ho, address, email) VALUES ('0922000002', 'Đủ', 'n', 'anh', 'HCM', 'a@b')");
    await n.run("INSERT INTO pos_customers (phone, name, notes) VALUES ('0922000003', 'Rỗng', '')");
    await n.run("INSERT INTO pos_settings (key, value) VALUES ('thu_f', NULL), ('thu_f2', 'x')");
    await n.run("INSERT INTO pos_sync_logs (type, details) VALUES ('f', NULL), ('f', 'có')");
    await n.run("INSERT INTO kho_nhom_nguyen_lieu (ten) VALUES ('Nhóm F')");
    await n.run("INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, he_so_doi, ghi_chu, tao_luc) VALUES ('A', 'a', 'kg', 1, NULL, 'x'), ('B', 'b', 'g', 0.001, 'gc', 'x')");
    const x1 = await NGUON.goi('GET', '/export-all');
    const wb1 = docTep(x1.tep);
    const TIEN = new Set(['Số dư', 'Đơn hàng', 'Chi tiết đơn', 'Giao dịch số dư', 'Yêu cầu hoàn tiền', 'Giao dịch điểm thưởng', 'Gói của khách',
      'Lịch sử mua thẻ', 'Voucher đã phát', 'Hàng hỏng', 'Mã chiết khấu', 'Mã ưu đãi khách mới', 'Nhật ký đơn', 'Lịch sử dùng khuyến mãi',
      'Phiên thanh toán', 'Báo tiền về payOS', 'Nhật ký PIN khách', 'Đơn từ App KH', 'Nâng cấp dữ liệu']);
    const wbBo = XLSX.utils.book_new();
    for (const s of wb1.SheetNames) if (!TIEN.has(s)) XLSX.utils.book_append_sheet(wbBo, wb1.Sheets[s], s);
    const kp = await DICH.gui(XLSX.write(wbBo, { type: 'buffer', bookType: 'xlsx' }));
    const x2 = await DICH.goi('GET', '/export-all');
    const wb2 = x2.tep ? docTep(x2.tep) : { Sheets: {} };
    const daKP = (kp.results || []).filter((r) => r.status === 'restored').map((r) => r.sheet);
    const lech = daKP.filter((s) => JSON.stringify(XLSX.utils.sheet_to_json(wb1.Sheets[s], { header: 1, defval: '∅' }))
      !== JSON.stringify(XLSX.utils.sheet_to_json(wb2.Sheets[s] || {}, { header: 1, defval: '∅' })));
    k(`F1 ${daKP.length} trang khôi phục — hai file giống từng ô (kể cả ô trống / ô chữ rỗng / kho)`, kp.status === 200 && daKP.length >= 8
      && daKP.includes('Khách hàng') && daKP.includes('Kho - Nguyên liệu') && !lech.length, `${moTa(kp)} · lệch: ${lech.join(', ')}`);
  }

  for (const m of [NGUON, DICH, THU]) m.sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.stack || e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
