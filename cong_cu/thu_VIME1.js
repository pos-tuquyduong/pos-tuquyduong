#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ VI-ME-1 — chỉ trừ / giữ tài khoản mẹ khi khách đang mua đúng là con được liên kết với mẹ đó (pos_customers.parent_phone)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ: hôm nay POST /orders và phiên thanh toán trừ / giữ ví SĐT mẹ màn gửi mà không đối chiếu. (K3)
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_VIME1.js
 *
 *  Khuôn thu_P3.js: database.js + libsql thật trên kho TẠM; chỉ thay ketNoiKho (P8) và tắt SX. Express riêng mount ĐÚNG đường như
 *  index.js. Phiên dùng cách tai_khoan / ck_tay (không gọi cổng QR). So HTTP status + `code`; ca A1 so thêm đúng câu nghiệm thu.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu'); // --may-chu <server>: chạy trên bản sao server/ (đột biến, viec/VI-ME-1/dot_bien.py)
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_vime1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU,'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
const KHOA_NV = 'thu_vime1_nv_' + crypto.randomBytes(12).toString('hex');
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_vime1_kh_' + crypto.randomBytes(12).toString('hex');

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const CAU = 'Tài khoản này không phải tài khoản mẹ của khách';

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU,'database.js'));
  const { getNow } = require(path.join(MAY_CHU,'utils', 'helpers.js'));
  await db.initDatabase();
  const R = (f) => path.join(MAY_CHU,'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/thanh-toan', require(R('thanh-toan.js')));
  app.use('/api/pos/v2/customers', require(R('customers-v2.js')));
  const mk = require(path.join(MAY_CHU,'utils', 'manKhach.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tk = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0'],
    ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const mon = { product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 };

  const goi = async (method, url, body) => {
    const headers = { Authorization: 'Bearer ' + tk };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      let j = {}; try { j = JSON.parse(await r.text()); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const tuChoi = (r) => r.status === 403 && r.j.code === 'KHONG_PHAI_TK_ME';
  const dem = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  // Ảnh chụp mọi chỗ ghi: đơn · dòng ví · dòng điểm · phiên · số dư từng SĐT.
  const chup = async (...sdt) => [await dem('SELECT COUNT(*) AS n FROM pos_orders'), await dem('SELECT COUNT(*) AS n FROM pos_balance_transactions'),
    await dem('SELECT COUNT(*) AS n FROM pos_point_transactions'), await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan'),
    ...await Promise.all(sdt.map(soDu))].join('/');
  let soSdt = 0;
  const sdtMoi = () => '09' + String(52000000 + (++soSdt)).padStart(8, '0');
  const PIN = '1357';
  const khach = async ({ vi = 0, me = null, pin = PIN } = {}) => {
    const sdt = sdtMoi();
    await db.run('INSERT INTO pos_customers (phone, name, parent_phone, created_at) VALUES (?, ?, ?, ?)', [sdt, 'Khách ' + sdt, me, getNow()]);
    if (vi) await goi('POST', '/wallets/topup', { phone: sdt, amount: vi });
    if (pin) await goi('POST', '/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin });
    return sdt;
  };
  const ban = (con, me, them = {}) => goi('POST', '/orders', { customer_phone: con, customer_name: 'K', items: [mon], payment_method: 'cash',
    ...(me !== undefined ? { parent_phone: me } : {}), parent_balance_amount: 25000, ...them });
  const phien = (con, me, them = {}) => goi('POST', '/thanh-toan/phien', { don: { items: [mon], customer_phone: con, customer_name: 'K', parent_phone: me },
    cach: 'tai_khoan', tru_tai_khoan_me: true, pin_me: PIN, ...them });
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  const M = await khach({ vi: 500000 }), X = await khach({ vi: 500000 });
  const A = await khach({ me: M }), B = await khach();

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] POST /orders: sai mẹ / không khách / khách không mẹ → 403 KHONG_PHAI_TK_ME, không ghi gì');
  await chay('A', async () => {
    const t = await chup(X, M);
    const a1 = await ban(A, X);
    k('A1 khách A (mẹ M) gửi SĐT mẹ = X (người lạ có số dư) → 403 KHONG_PHAI_TK_ME, đúng câu báo', tuChoi(a1) && a1.j.error === CAU, moTa(a1));
    k('A1 không thêm đơn, dòng ví, dòng điểm; ví X và M không đổi', await chup(X, M) === t, `${t} → ${await chup(X, M)}`);
    const a2 = await ban(B, M);
    k('A2 khách B không có mẹ gửi SĐT mẹ = M → 403', tuChoi(a2), moTa(a2));
    const a3 = await ban('', M), a3b = await ban(sdtMoi(), M);
    k('A3 đơn không khách gửi SĐT mẹ → 403; SĐT không có trong pos_customers → 403', tuChoi(a3) && tuChoi(a3b), `${moTa(a3)} / ${moTa(a3b)}`);
    const a4 = await ban(A, undefined);
    k('A4 có parent_balance_amount > 0 mà không SĐT mẹ → 403', tuChoi(a4), moTa(a4));
    k('A2–A4 không ghi gì (đơn, ví, điểm, phiên, số dư X, M)', await chup(X, M) === t, `${t} → ${await chup(X, M)}`);
    const m0 = await soDu(M);
    const a5 = await ban(A, '+84' + M.slice(1)), a5b = await ban(A, ` ${M.slice(0, 4)} ${M.slice(4)} `);
    k('A5 SĐT mẹ đúng nhưng viết +84… / có dấu cách → 200, ví M giảm 2 × 25.000 (chuẩn hoá hai vế)', a5.status === 200 && a5b.status === 200
      && await soDu(M) === m0 - 50000, `${moTa(a5)} / ${moTa(a5b)} · M ${await soDu(M)}`);
    // Dữ liệu cũ: hồ sơ con ghi parent_phone dạng thô (+84… / có dấu cách), màn gửi SĐT mẹ dạng chuẩn → vẫn qua (vế chuẩn hoá phía CSDL).
    const M6 = await khach({ vi: 50000 }), A6 = await khach({ me: '+84' + M6.slice(1) }), A6b = await khach({ me: ` ${M6.slice(0, 4)} ${M6.slice(4)} ` });
    const a5c = await ban(A6, M6), a5d = await ban(A6b, M6);
    k('A5c hồ sơ con ghi SĐT mẹ dạng +84… / có dấu cách (dữ liệu cũ), màn gửi dạng chuẩn → 200, ví mẹ giảm 2 × 25.000', a5c.status === 200
      && a5d.status === 200 && await soDu(M6) === 0, `${moTa(a5c)} / ${moTa(a5d)} · M6 ${await soDu(M6)}`);
  });

  muc('[B] phiên giữ chỗ / chốt phiên / tinh-thu / số dư mẹ báo màn / màn khách');
  await chay('B', async () => {
    const t = await chup(X);
    const b1 = await phien(A, X);
    const x = await goi('GET', `/wallets/${X}`);
    k('B1 tạo phiên tai_khoan, trừ tài khoản mẹ = X → 403; không thêm phiên; X khả dụng vẫn 500.000 (không giữ)', tuChoi(b1)
      && await chup(X) === t && x.j.kha_dung === 500000, `${moTa(b1)} · ${t} → ${await chup(X)} · khả dụng ${x.j.kha_dung}`);
    const b5 = await phien(A, X, { pin_me: '9999' });
    const sai = await db.queryOne('SELECT pin_sai FROM pos_customers WHERE phone = ?', [X]);
    k('B5 như B1 kèm PIN mẹ SAI → vẫn 403 KHONG_PHAI_TK_ME (kiểm mẹ trước PIN), đếm PIN sai của X không tăng', tuChoi(b5) && !Number(sai.pin_sai),
      `${moTa(b5)} · pin_sai ${sai.pin_sai}`);

    // B2: phiên đúng mẹ đã giữ → đổi quan hệ trong CSDL → chốt (tai_khoan; ck_tay xác nhận tay) → 403, ví mẹ không đổi, phiên 'loi'.
    const M2 = await khach({ vi: 10000 }), A2 = await khach({ me: M2 });
    const M3 = await khach({ vi: 25000 }), A3 = await khach({ me: M3 });
    const p2 = await phien(A3, M3);
    const p3 = await goi('POST', '/thanh-toan/phien', { don: { items: [mon], customer_phone: A2, parent_phone: M2 }, cach: 'ck_tay', tru_tai_khoan_me: true, pin_me: PIN });
    k('B2 dựng: phiên tai_khoan A3/M3 giữ 25.000; phiên ck_tay A2/M2 giữ 10.000 còn 15.000', p2.status === 200 && p2.j.phien.giu_vi_me === 25000
      && p3.status === 200 && p3.j.phien.giu_vi_me === 10000 && p3.j.phien.con_lai === 15000, `${moTa(p2)} · ${moTa(p3)}`);
    await db.run('UPDATE pos_customers SET parent_phone = NULL WHERE phone IN (?, ?)', [A2, A3]);
    const t2 = await chup(M2, M3);
    const c1 = await goi('POST', `/thanh-toan/phien/${p2.j.phien?.id}/chot`, {});
    const c2 = await goi('POST', `/thanh-toan/phien/${p3.j.phien?.id}/xac-nhan-tay`, { ly_do: 'Khách chuyển khoản vào tài khoản quán' });
    const tt = await db.query('SELECT trang_thai FROM pos_phien_thanh_toan WHERE id IN (?, ?) ORDER BY id', [p2.j.phien?.id, p3.j.phien?.id]);
    k('B2 bỏ quan hệ mẹ sau khi giữ → chốt tai_khoan 403 và xác nhận tay 403', tuChoi(c1) && tuChoi(c2), `${moTa(c1)} / ${moTa(c2)}`);
    k('B2 không đơn, ví M2 M3 không đổi; hai phiên chuyển "loi" (thôi giữ)', await chup(M2, M3) === t2 && tt.map((r) => r.trang_thai).join() === 'loi,loi',
      `${t2} → ${await chup(M2, M3)} · ${tt.map((r) => r.trang_thai).join()}`);

    const r0 = await goi('POST', '/orders/tinh-thu', { items: [mon], customer_phone: A });
    const r1 = await goi('POST', '/orders/tinh-thu', { items: [mon], customer_phone: A, parent_phone: X, parent_balance_amount: 25000 });
    k('B3 tinh-thu kèm parent_phone = X → 200, số như không gửi (danh sách trắng lọc trường mẹ)', r0.status === 200 && r1.status === 200 && r1.j.total === r0.j.total,
      `${moTa(r1)} · ${r0.j.total} / ${r1.j.total}`);

    const h = await goi('GET', `/v2/customers/${A}`);
    k('B6 hồ sơ A báo màn: parent_phone = M, parent_balance = số dư ví M', h.status === 200 && h.j.parent_phone === M && h.j.parent_balance === await soDu(M),
      `${moTa(h)} · ${h.j.parent_phone} · ${h.j.parent_balance}`);

    const M7 = await khach({ vi: 25000 }), A7 = await khach({ me: M7 });
    const p7 = await phien(A7, M7);
    imLang();
    const q = await mk.moQuay();
    await mk.baoPhien(q.quay_id, p7.j.phien?.id, 'thu');
    noiLai();
    const hien = JSON.parse((await db.queryOne('SELECT hien FROM pos_man_khach_quay WHERE id = ?', [q.quay_id]))?.hien || '{}');
    k('B7 màn khách của phiên đúng mẹ dựng đủ món (1 món 25.000)', p7.status === 200 && Array.isArray(hien.mon) && hien.mon.length === 1
      && hien.mon[0].thanh_tien === 25000, `${moTa(p7)} · ${JSON.stringify(hien)}`);
  });

  muc('[C] đúng mẹ → như cũ');
  const vC = {};
  await chay('C', async () => {
    const m0 = await soDu(M);
    const c1 = await ban(A, M);
    vC.don = c1.j.order;
    const ghi = await db.queryOne('SELECT parent_phone, parent_balance_amount FROM pos_orders WHERE id = ?', [c1.j.order?.id]).catch(() => null);
    k('C1 A đúng mẹ M qua POST /orders → 200, ví M −25.000, đơn ghi parent_phone = M, 25.000', c1.status === 200 && await soDu(M) === m0 - 25000
      && ghi?.parent_phone === M && Number(ghi.parent_balance_amount) === 25000, `${moTa(c1)} · M ${await soDu(M)} · ${JSON.stringify(ghi)}`);
    const M4 = await khach({ vi: 25000 }), A4 = await khach({ me: M4 });
    const p = await phien(A4, M4);
    const ch = await goi('POST', `/thanh-toan/phien/${p.j.phien?.id}/chot`, {});
    k('C2 A4 đúng mẹ qua phiên tai_khoan → giữ 25.000, chốt 200, ví M4 = 0', p.status === 200 && p.j.phien.giu_vi_me === 25000 && ch.status === 200
      && await soDu(M4) === 0, `${moTa(p)} / ${moTa(ch)} · M4 ${await soDu(M4)}`);
    const M5 = await khach({ vi: 30000 }), A5 = await khach({ me: M5 });
    const [q1, q2] = await Promise.all([phien(A5, M5), phien(A5, M5)]);
    const giu = await dem("SELECT COALESCE(SUM(giu_vi_me), 0) AS n FROM pos_phien_thanh_toan WHERE phone_me = ? AND trang_thai = 'cho'", [M5]);
    k('C3 hai quầy cùng giữ ví M5 (30.000) cho đơn 25.000 → một 200, một 400 SO_DU_KHONG_DU; tổng giữ 25.000', [q1.status, q2.status].sort().join() === '200,400'
      && [q1, q2].some((r) => r.j.code === 'SO_DU_KHONG_DU') && giu === 25000, `${moTa(q1)} / ${moTa(q2)} · giữ ${giu}`);
  });

  muc('[D] đơn cũ đã có mẹ trả: huỷ đọc từ đơn đã ghi');
  await chay('D', async () => {
    const m0 = await soDu(M);
    await db.run('UPDATE pos_customers SET parent_phone = NULL WHERE phone = ?', [A]);
    const d = await goi('PUT', `/orders/${vC.don?.id}/cancel`, { reason: 'thử VI-ME-1' });
    k('D1 bỏ quan hệ mẹ của A rồi huỷ đơn C1 → 200, ví M được hoàn 25.000', d.status === 200 && await soDu(M) === m0 + 25000, `${moTa(d)} · M ${await soDu(M)}`);
  });

  muc('[tĩnh] một hàm, một chỗ gọi; App KH không có lối tiền mẹ; bộ kiểm chạy bài này');
  {
    const bo = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const doc = (...p) => bo(fs.readFileSync(path.join(MAY_CHU, ...p), 'utf8'));
    const od = doc('routes', 'orders.js');
    const goiMe = od.split('kiemTraMe(').length - 1, iGoi = od.indexOf('await kiemTraMe('), iTinh = od.indexOf('if (phien?.chiTinh)');
    k('B4 orders.js gọi kiemTraMe đúng 1 lần, trước nhánh chỉ tính (if (phien?.chiTinh))', goiMe === 1 && iGoi > 0 && iGoi < iTinh, `${goiMe} · ${iGoi} < ${iTinh}`);
    k('B4 giuCho.js không tự đọc pos_customers (một hàm đối chiếu)', !doc('utils', 'giuCho.js').includes('pos_customers'));
    const app = doc('utils', 'donApp.js'), kh = doc('routes', 'kh', 'index.js');
    k('E1 App KH: donApp.js không có tru_tai_khoan_me / parent_phone; kh/index.js không có "parent"', !/tru_tai_khoan_me|parent_phone/.test(app) && !kh.includes('parent'));
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_VIME1.js'", /^chayBaiThat\('cong_cu\/thu_VIME1\.js'\);/m.test(kt));
  }

  sv.close();
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
