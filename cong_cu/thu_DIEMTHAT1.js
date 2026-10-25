#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ DIEM-THAT-1 — điểm chỉ tính trên tiền khách trả thật (tiền mặt + chuyển khoản − phí giao)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_DIEMTHAT1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/DIEM-THAT-1/dot_bien.py). bat_bien.js nạp từ <may-chu>/../cong_cu/gia_lap.
 *
 *  Khuôn thu_P2223.js: database.js thật + libsql thật trên kho TẠM, SX giả. co.mocTruocTx chạy TRỌN một lệnh khác trước khi giao
 *  dịch kế tiếp mở (hai lần thu chồng nhau TẤT ĐỊNH). Cài đặt điểm: bật, 1.000đ = 1 điểm, không hết hạn, hệ số nhân điểm 2.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_diemthat1_'));
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
process.env.JWT_SECRET = 'thu_diemthat1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };

  const co = { mocTruocTx: null };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'signup-codes']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const { BAT_BIEN, DIEM_KHI_THU_TU, DIEM_THAT_TU } = require(path.join(MAY_CHU, '..', 'cong_cu', 'gia_lap', 'bat_bien.js'));
  let tienTinhDiem = null;
  try { ({ tienTinhDiem } = require(path.join(MAY_CHU, 'utils', 'diemThat.js'))); } catch { /* gốc chưa có — A1 đỏ */ }
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'],
    ['flash_enabled', 'false'], ['nhandiem_enabled', 1], ['nhandiem_he_so', 2]]) await datCaiDat(key, v);

  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  const GIA = [25000, 20000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: 1 });
  let soSdt = 0;
  const sdtMoi = () => '0939' + String(300000 + (++soSdt));
  const ban = (body) => goi('POST', '/orders', { customer_name: 'Khách DIEM-THAT-1', items: [mon(0)], ...body });
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách DIEM-THAT-1', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const coVi = async (tien) => { const s = sdtMoi(); await nap(s, tien); return s; };
  const soEarn = (id) => so("SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [id]);
  const diemDon = (id) => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [id]);
  const thu = (id, soTien, cach = 'cash') => goi('POST', `/orders/${id}/pay-debt`, { payment_method: cach, amount: soTien });
  const nhan = (r, sdt) => goi('POST', '/signup-codes/nhan-diem', { code: r.order?.signup_code, phone: sdt });
  const daNhan = (r) => mot('SELECT diem_nhan_luc FROM pos_signup_codes WHERE code = ?', [r.order?.signup_code]);
  // Flash 20 % trên món 0 (25.000 → 20.000), chỉ bật quanh lệnh `f` — khuôn thu_P2223.
  const trongFlash = async (f) => {
    const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
      ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
      ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    try { return await f(); } finally { await datCaiDat('flash_enabled', 'false'); }
  };
  // Ca "đơn … → N điểm": tạo 200, đúng N điểm (0 → không dòng earn).
  const caDiem = async (ten, r, n, tt = 'paid') => {
    const d = r.order ? await diemDon(r.order.id) : NaN, e = r.order ? await soEarn(r.order.id) : NaN;
    k(ten, r.status === 200 && r.order.payment_status === tt && d === n && e === (n > 0 ? 1 : 0), `${moTa(r)} · ${d} điểm · ${e} earn`);
  };

  console.log('\nTHỬ DIEM-THAT-1 — điểm chỉ tính trên tiền khách trả thật');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] MỘT hàm tienTinhDiem, không chép công thức');
  {
    const f = typeof tienTinhDiem === 'function' ? tienTinhDiem : () => NaN;
    const ca = [[{ cash_amount: 25000 }, 25000], [{ cash_amount: 10000.4 }, 10000], [{ cash_amount: 10000, transfer_amount: 5000, shipping_fee: 3000 }, 12000],
      [{ cash_amount: 3000, shipping_fee: 5000 }, 0], [{ cash_amount: '15000', transfer_amount: null }, 15000], [{}, 0]];
    const sai = ca.filter(([d, n]) => f(d) !== n).map(([d, n]) => `${JSON.stringify(d)} → ${f(d)} (đúng ${n})`);
    k('A1 tienTinhDiem (server/utils/diemThat.js): 25.000 · 10.000,4 → 10.000 · 10.000 + 5.000 − 3.000 = 12.000 · phí > tiền → 0 · chuỗi · thiếu trường → 0',
      typeof tienTinhDiem === 'function' && sai.length === 0, typeof tienTinhDiem === 'function' ? sai.join(' | ') : 'không có hàm');

    const doc = (p) => { try { return fs.readFileSync(path.join(MAY_CHU, p), 'utf8'); } catch { return ''; } };
    const od = doc('routes/orders.js'), sc = doc('routes/signup-codes.js');
    const conMau = [[od, 'tinhDiemDon(total,'], [od, 'tinhDiemDon(Number(order.total)'], [sc, 'Number(don.total || 0) / moiBaoNhieu']]
      .filter(([s, m]) => s.includes(m)).map(([, m]) => m);
    const dinhNghia = /(function\s+tienTinhDiem\b|\btienTinhDiem\s*=\s*(\(|function|async))/;
    const chep = /-\s*\(\s*Number\(\s*[\w.]*shipping_fee/;
    const tep = [];
    const quet = (thu) => { for (const t of fs.readdirSync(thu, { withFileTypes: true })) {
      const p = path.join(thu, t.name);
      if (t.isDirectory() && t.name !== 'node_modules') quet(p); else if (t.name.endsWith('.js')) tep.push(p);
    } };
    quet(MAY_CHU);
    const coDN = tep.filter((p) => dinhNghia.test(fs.readFileSync(p, 'utf8'))).map((p) => path.relative(MAY_CHU, p));
    const coChep = tep.filter((p) => chep.test(fs.readFileSync(p, 'utf8'))).map((p) => path.relative(MAY_CHU, p));
    const goiDu = (od.match(/tinhDiemDon\(tienTinhDiem\(/g) || []).length === 2 && /tienTinhDiem\(don\)/.test(sc);
    k('A2 công thức cũ (total) BIẾN MẤT ở 3 chỗ cộng điểm; đúng 1 định nghĩa tienTinhDiem + 1 công thức (utils/diemThat.js); 3 chỗ gọi nó',
      conMau.length === 0 && coDN.join() === path.join('utils', 'diemThat.js') && coChep.join() === path.join('utils', 'diemThat.js') && goiDu,
      `còn mẫu cũ: ${JSON.stringify(conMau)} · định nghĩa ở ${JSON.stringify(coDN)} · công thức ở ${JSON.stringify(coChep)} · gọi đủ ${goiDu}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] POST / thu đủ lúc tạo: điểm = floor(tiền thật / per)');
  const donB2 = {};
  {
    await caDiem('B1 trả trọn bằng ví 25.000 → 200 paid, 0 điểm', await ban({ customer_phone: await coVi(25000), payment_method: 'balance', balance_amount: 25000 }), 0);
    const r2 = await ban({ customer_phone: await coVi(10000), payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 });
    Object.assign(donB2, r2.order || {});
    await caDiem('B2 ví 10.000 + tiền mặt 15.000 → 15 điểm (chỉ phần tiền mặt)', r2, 15);
    await caDiem('B3 tiền mặt 30.000 có phí giao 5.000 → 25 điểm (trừ phí trước khi chia)',
      await ban({ customer_phone: sdtMoi(), payment_method: 'cash', cash_amount: 30000, shipping_fee: 5000 }), 25);
    const me = await coVi(10000);
    await caDiem('B4 ví mẹ 10.000 + chuyển khoản 15.000 → 15 điểm',
      await ban({ customer_phone: sdtMoi(), parent_phone: me, payment_method: 'transfer', transfer_amount: 15000, parent_balance_amount: 10000 }), 15);
    await caDiem('B5 phí giao 5.000 > tiền mặt 3.000 (còn lại ví 27.000) → 0 điểm',
      await ban({ customer_phone: await coVi(27000), payment_method: 'cash', balance_amount: 27000, cash_amount: 3000, shipping_fee: 5000 }), 0);
    await caDiem('B6 phí giao âm −5.000 (máy chủ coi 0) + tiền mặt 25.000 → 25 điểm (không 30)',
      await ban({ customer_phone: sdtMoi(), payment_method: 'cash', cash_amount: 25000, shipping_fee: -5000 }), 25);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] pay-debt thu đủ: điểm trên mọi tiền mặt + chuyển khoản đã thu (kể cả lúc tạo) − phí giao');
  {
    const c1 = await ban({ customer_phone: sdtMoi(), payment_method: 'cash', cash_amount: 10000, debt_amount: 15000 });
    const t1 = c1.order ? await thu(c1.order.id, 15000) : {};
    k('C1 tiền mặt 10.000 lúc tạo + nợ 15.000 → thu đủ 15.000 → 25 điểm', c1.status === 200 && t1.status === 200
      && await diemDon(c1.order.id) === 25, `${moTa(c1)} / ${moTa(t1)} · ${c1.order && await diemDon(c1.order.id)}`);

    const c2 = await ban({ customer_phone: await coVi(10000), payment_method: 'debt', balance_amount: 10000, debt_amount: 15000 });
    const t2 = c2.order ? await thu(c2.order.id, 15000) : {};
    k('C2 ví 10.000 + nợ 15.000 → thu đủ 15.000 → 15 điểm (không tính phần ví)', c2.order?.payment_status === 'partial' && t2.status === 200
      && await diemDon(c2.order.id) === 15, `${moTa(c2)} / ${moTa(t2)} · ${c2.order && await diemDon(c2.order.id)}`);

    const c3 = await ban({ customer_phone: sdtMoi(), payment_method: 'debt', debt_amount: 30000, shipping_fee: 5000 });
    const t3 = c3.order ? await thu(c3.order.id, 30000) : {};
    k('C3 nợ trọn 30.000 có phí giao 5.000 → thu đủ → 25 điểm', c3.status === 200 && t3.status === 200
      && await diemDon(c3.order.id) === 25, `${moTa(c3)} / ${moTa(t3)} · ${c3.order && await diemDon(c3.order.id)}`);

    const c4 = await ban({ customer_phone: await coVi(10000), payment_method: 'debt', balance_amount: 10000, debt_amount: 15000 });
    const t4a = c4.order ? await thu(c4.order.id, 5000, 'transfer') : {};
    const giua = c4.order ? await soEarn(c4.order.id) : NaN;
    const t4b = c4.order ? await thu(c4.order.id, 10000) : {};
    k('C4 ví 10.000 + nợ 15.000 → thu chuyển khoản 5.000 (0 điểm) rồi tiền mặt 10.000 → 15 điểm', t4a.status === 200 && giua === 0
      && t4b.status === 200 && t4b.data?.payment_status === 'paid' && await diemDon(c4.order.id) === 15,
    `${moTa(t4a)} · ${giua} / ${moTa(t4b)} · ${c4.order && await diemDon(c4.order.id)}`);

    const c5 = await ban({ customer_phone: await coVi(10000), payment_method: 'debt', balance_amount: 10000, debt_amount: 15000 });
    let r2;
    co.mocTruocTx = async () => { r2 = await thu(c5.order.id, 15000); };
    const r1 = c5.order ? await thu(c5.order.id, 15000) : {};
    co.mocTruocTx = null;
    const ma = [r1.status, r2?.status].sort().join(',');
    k('C5 hai người cùng bấm thu đủ 15.000 → một 200, một 409 DA_THU_ROI; đúng 1 earn 15 điểm', ma === '200,409'
      && [r1.code, r2?.code].includes('DA_THU_ROI') && await soEarn(c5.order.id) === 1 && await diemDon(c5.order.id) === 15,
    `${moTa(r1)} / ${r2 && moTa(r2)} · ${c5.order && await diemDon(c5.order.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] mã nhận điểm (/nhan-diem): điểm gốc theo tiền thật, rồi nhân hệ số 2');
  {
    const d1 = await ban({ payment_method: 'cash', cash_amount: 30000, shipping_fee: 5000 });
    const n1 = await nhan(d1, sdtMoi());
    k('D1 khách lẻ tiền mặt 30.000 có phí giao 5.000 → /nhan-diem 200, 25 × 2 = 50 điểm', n1.status === 200
      && await diemDon(d1.order.id) === 50, `${moTa(d1)} / ${moTa(n1)} · ${d1.order && await diemDon(d1.order.id)}`);

    const s2 = await coVi(10000);
    const d2 = await ban({ customer_phone: s2, payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 });
    const n2 = await nhan(d2, s2);
    k('D2 đơn có SĐT ví 10.000 + tiền mặt 15.000 (15 điểm lúc bán) → /nhan-diem bù đủ 15 × 2 = 30', n2.status === 200
      && await diemDon(d2.order.id) === 30, `${moTa(n2)} · ${d2.order && await diemDon(d2.order.id)}`);

    const s3 = await coVi(25000);
    const d3 = await ban({ customer_phone: s3, payment_method: 'balance', balance_amount: 25000 });
    const n3 = await nhan(d3, s3);
    k('D3 đơn trả trọn bằng ví → /nhan-diem 400 DON_KHONG_DU_DIEM, 0 điểm, mã CHƯA bị tiêu', n3.status === 400 && n3.code === 'DON_KHONG_DU_DIEM'
      && await diemDon(d3.order.id) === 0 && (await daNhan(d3))?.diem_nhan_luc === null, `${moTa(n3)} · ${d3.order && await diemDon(d3.order.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] không đổi: Flash 0 · chưa thu đủ 0 · huỷ trừ đúng số đã cộng');
  {
    const e1 = await trongFlash(() => ban({ customer_phone: sdtMoi(), payment_method: 'cash', cash_amount: 20000 }));
    k('E1 đơn Flash tiền mặt 20.000 → 200, 0 điểm', e1.status === 200 && Number(e1.order.flash_discount) > 0 && await diemDon(e1.order.id) === 0,
      `${moTa(e1)} · ${e1.order && await diemDon(e1.order.id)}`);
    await caDiem('E2 đơn ghi nợ 25.000 chưa thu → pending, 0 điểm', await ban({ customer_phone: sdtMoi(), payment_method: 'debt', debt_amount: 25000 }), 0, 'pending');
    const x3 = donB2.id ? await goi('PUT', `/orders/${donB2.id}/cancel`, { reason: 'thử DIEM-THAT-1' }) : {};
    const tru = donB2.id ? await mot("SELECT COUNT(*) AS n, SUM(points) AS p FROM pos_point_transactions WHERE order_id = ? AND type = 'adjust'", [donB2.id]) : {};
    k('E3 huỷ đơn B2 (15 điểm) → 200, đúng 1 dòng trừ −15, điểm đơn 0', x3.status === 200 && Number(tru.n) === 1 && Number(tru.p) === -15
      && await diemDon(donB2.id) === 0, `${moTa(x3)} · ${JSON.stringify(tru)}`);
    const s4 = sdtMoi();
    const e4 = await trongFlash(() => ban({ customer_phone: s4, payment_method: 'cash', cash_amount: 20000 }));
    const n4 = await nhan(e4, s4);
    k('E4 đơn Flash → /nhan-diem vẫn 400 DON_FLASH_KHONG_DIEM', n4.status === 400 && n4.code === 'DON_FLASH_KHONG_DIEM', moTa(n4));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] K5: tiền mặt / chuyển khoản, không ví, không phí giao → điểm như cũ');
  {
    await caDiem('G1 tiền mặt 25.000 → 25 điểm', await ban({ customer_phone: sdtMoi(), payment_method: 'cash', cash_amount: 25000 }), 25);
    await caDiem('G2 chuyển khoản 20.000 → 20 điểm', await ban({ customer_phone: sdtMoi(), items: [mon(1)], payment_method: 'transfer', transfer_amount: 20000 }), 20);
    const g3 = await ban({ customer_phone: sdtMoi(), payment_method: 'debt', debt_amount: 25000 });
    const t3 = g3.order ? await thu(g3.order.id, 25000) : {};
    k('G3 nợ trọn 25.000 → thu đủ tiền mặt → 25 điểm', t3.status === 200 && await diemDon(g3.order.id) === 25, `${moTa(t3)} · ${g3.order && await diemDon(g3.order.id)}`);
    const g4 = await ban({ payment_method: 'cash', cash_amount: 25000 });
    const n4 = await nhan(g4, sdtMoi());
    k('G4 khách lẻ tiền mặt 25.000 → /nhan-diem 200, 25 × 2 = 50', n4.status === 200 && await diemDon(g4.order.id) === 50, `${moTa(n4)} · ${g4.order && await diemDon(g4.order.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] bất biến I8 theo tiền thật; đơn trước mốc DIEM_THAT_TU ở Đối soát thật được nhận luật cũ');
  {
    const lech = await BAT_BIEN.I8((sql, a = []) => db.query(sql, a), {});
    k('F1 I8 trên mọi đơn của bài → 0 lệch', lech.length === 0, JSON.stringify(lech.slice(0, 4)));

    const moc = String(DIEM_THAT_TU || '');
    const coMoc = /^\d{4}-\d{2}-\d{2}$/.test(moc);
    const truoc = (m) => new Date(Date.parse(m + 'T00:00:00Z') - 1000).toISOString().slice(0, 19);
    const lechDon = async (don, luc, ctx) => {
      await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [luc, don.id]);
      return (await BAT_BIEN.I8((sql, a = []) => db.query(sql, a), ctx)).some((d) => d.startsWith(`đơn ${don.code}: `));
    };
    const ghiEarn = (don, sdt, diem) => db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at) VALUES (?, 'earn', ?, ?, 'luật cũ', ?)",
      [sdt, diem, don.id, don.created_at]);

    // Đơn ví trọn 25.000 có earn 25 = total/per (luật cũ). Luật mới: 0.
    const sv1 = await coVi(25000);
    const f2 = (await ban({ customer_phone: sv1, payment_method: 'balance', balance_amount: 25000 })).order;
    await ghiEarn(f2, sv1, 25);
    const a = coMoc && await lechDon(f2, moc + 'T00:00:00', { thuc: true });
    const b = coMoc && await lechDon(f2, truoc(moc), { thuc: true });
    const c = coMoc && await lechDon(f2, truoc(moc), {});
    k(`F2 đơn ví trọn có 25 điểm theo total, tạo ĐÚNG mốc ${moc || '(chưa có DIEM_THAT_TU)'}, Đối soát thật → LỆCH`, coMoc && a === true, `lệch ${a}`);
    k('F3 cùng đơn tạo 1 giây TRƯỚC mốc, Đối soát thật → KHÔNG lệch (luật cũ)', coMoc && b === false, `lệch ${b}`);
    k('F4 cùng đơn trước mốc, giả lập (không ctx.thuc) → LỆCH', coMoc && c === true, `lệch ${c}`);

    // Đơn tiền mặt 30.000 có phí giao 5.000: luật mới 25, luật cũ 30.
    const s5 = sdtMoi();
    const f5 = (await ban({ customer_phone: s5, payment_method: 'cash', cash_amount: 30000, shipping_fee: 5000 })).order;
    const dung5 = coMoc && !(await lechDon(f5, moc + 'T00:00:00', { thuc: true })) && !(await lechDon(f5, f5.created_at, {}));
    await db.run("UPDATE pos_point_transactions SET points = 30 WHERE order_id = ? AND type = 'earn'", [f5.id]);
    const sai5 = coMoc && await lechDon(f5, moc + 'T00:00:00', { thuc: true }) && await lechDon(f5, f5.created_at, {});
    k('F5 đơn có phí giao: 25 điểm (luật mới) sau mốc → KHÔNG lệch; 30 điểm (theo total) sau mốc → LỆCH', dung5 === true && sai5 === true,
      `đúng luật mới không lệch ${dung5} · theo total lệch ${sai5}`);

    // Đơn ghi nợ (chưa thu) có earn 25 theo total — dữ liệu trước DIEM_KHI_THU_TU (khuôn F2 của thu_P2223).
    const s6 = sdtMoi();
    const f6 = (await ban({ customer_phone: s6, payment_method: 'debt', debt_amount: 25000 })).order;
    await ghiEarn(f6, s6, 25);
    const mocCu = String(DIEM_KHI_THU_TU || '');
    const d6 = /^\d{4}-\d{2}-\d{2}$/.test(mocCu) && await lechDon(f6, truoc(mocCu), { thuc: true });
    k(`F6 đơn ghi nợ có 25 điểm theo total, tạo trước ${mocCu}, Đối soát thật → KHÔNG lệch`, d6 === false, `lệch ${d6}`);
  }

  sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
