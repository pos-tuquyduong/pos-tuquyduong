#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P24 — huỷ / xoá đơn trừ lại điểm đã cộng (cho phép âm) · I8 đơn huỷ = 0 · nhận điểm mã bill chen huỷ
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_P24.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/P24/dot_bien.py). bat_bien.js nạp từ <may-chu>/../cong_cu/gia_lap.
 *
 *  Khuôn thu_P2223.js: database.js thật + libsql thật trên kho TẠM, SX giả. Công tắc co.mocTruocTx (chạy TRỌN một lệnh khác
 *  trước khi giao dịch kế tiếp mở — chồng nhau TẤT ĐỊNH), co.nemGhi (câu ghi khớp mẫu ném lỗi), co.truocCommit (đọc trong giao dịch).
 *  Cài đặt điểm: bật, 1.000đ = 1 điểm, không hết hạn, hệ số mã bill 2 (ca nào đổi thì tự trả lại).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p24_'));
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
process.env.JWT_SECRET = 'thu_p24_' + Date.now();

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

  const co = { mocTruocTx: null, nemGhi: null, truocCommit: null };
  const loiGiaGhi = (sql) => {
    if (co.nemGhi && co.nemGhi.test(String(sql))) { const e = new Error('SQLITE_IOERR: lỗi ghi (giả)'); e.code = 'SQLITE_IOERR'; throw e; }
  };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    const tx = await txGoc(...a);
    const lenh = (f) => async (...b) => { loiGiaGhi(b[0]); return f(...b); };
    const boc = { ...tx, query: lenh(tx.query), queryOne: lenh(tx.queryOne), run: lenh(tx.run) };
    boc.commit = async (...b) => { const f = co.truocCommit; co.truocCommit = null; if (f) await f(tx); return tx.commit(...b); };
    return boc;
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'signup-codes', 'loyalty', 'refunds', 'damages']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const batBien = require(path.join(MAY_CHU, '..', 'cong_cu', 'gia_lap', 'bat_bien.js'));
  const I8 = (ctx = {}) => batBien.BAT_BIEN.I8((sql, a = []) => db.query(sql, a), ctx);
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
  const moTa = (r) => `HTTP ${r?.status}${r?.code ? ' · ' + r.code : ''}${r?.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'],
    ['flash_enabled', 'false'], ['nhandiem_enabled', 1], ['nhandiem_he_so', 2]]) await datCaiDat(key, v);

  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 3');
  const GIA = [25000, 20000, 50000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1, tuGoi = false) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });
  let soSdt = 0;
  const sdtMoi = () => '0938' + String(400000 + (++soSdt));
  const ban = async (body) => {
    const r = await goi('POST', '/orders', { customer_name: 'Khách P24', ...body });
    if (r.status !== 200) throw new Error('không tạo được đơn: ' + moTa(r));
    return r.order;
  };
  const tienMat = (sdt, i = 0) => ban({ ...(sdt ? { customer_phone: sdt } : {}), items: [mon(i)], payment_method: 'cash', cash_amount: GIA[i] });
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách P24', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const vi = (sdt) => so('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0)', [sdt]);
  const huy = (id) => goi('PUT', `/orders/${id}/cancel`, { reason: 'thử P24' });
  const xoa = (id) => goi('DELETE', `/orders/${id}`);
  const nhan = (don, sdt) => goi('POST', '/signup-codes/nhan-diem', { code: don.signup_code, phone: sdt });
  const diemDon = (id) => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [id]);
  const soDong = (id, loai) => so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ? AND type = ?', [id, loai]);
  const dongTru = (id) => db.query("SELECT customer_phone, points, expires_at, reason FROM pos_point_transactions WHERE order_id = ? AND type = 'adjust' ORDER BY id", [id]);
  const dongEarn = (id) => db.query("SELECT id, customer_phone, points, expires_at FROM pos_point_transactions WHERE order_id = ? AND type = 'earn' ORDER BY id", [id]);
  const soDu = async (sdt) => (await goi('GET', `/loyalty/points/${sdt}`)).points;
  const boQuaI8 = new Set();   // đơn bài cố ý chèn dòng điểm tay (F2) — I8 phải lệch ở đó, ca H1 tự thử riêng

  console.log('\nTHỬ P24 — huỷ / xoá đơn trừ lại điểm');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] huỷ đơn có điểm → THÊM dòng trừ đúng bằng tổng earn, đúng SĐT, cùng giao dịch; dòng cũ giữ nguyên');
  {
    const s1 = sdtMoi();
    const d1 = await tienMat(s1);
    const earn1 = JSON.stringify(await dongEarn(d1.id));
    const h1 = await huy(d1.id);
    const t1 = await dongTru(d1.id);
    k('A1 tiền mặt 25.000 có SĐT (earn lúc tạo) → huỷ 200; đúng 1 dòng adjust −25 cho đúng SĐT, lý do có mã đơn; earn giữ nguyên',
      h1.status === 200 && t1.length === 1 && t1[0].points === -25 && t1[0].customer_phone === s1 && String(t1[0].reason).includes(d1.code)
      && JSON.stringify(await dongEarn(d1.id)) === earn1 && await diemDon(d1.id) === 0, `${moTa(h1)} · ${JSON.stringify(t1)}`);

    const s2 = sdtMoi();
    const d2 = await ban({ customer_phone: s2, items: [mon(2)], payment_method: 'debt', debt_amount: 50000 });
    const t2a = await goi('POST', `/orders/${d2.id}/pay-debt`, { payment_method: 'cash', amount: 50000 });
    const h2 = await huy(d2.id);
    const t2 = await dongTru(d2.id);
    k('A2 ghi nợ 50.000 → thu đủ (earn lúc thu 50) → huỷ → 1 dòng adjust −50 cho SĐT đơn', t2a.status === 200 && h2.status === 200
      && t2.length === 1 && t2[0].points === -50 && t2[0].customer_phone === s2 && await diemDon(d2.id) === 0, `${moTa(t2a)} / ${moTa(h2)} · ${JSON.stringify(t2)}`);

    const d3 = await tienMat(null);
    const s3 = sdtMoi();
    const n3 = await nhan(d3, s3);
    const h3 = await huy(d3.id);
    const t3 = await dongTru(d3.id);
    k('A3 khách lẻ nhận điểm bằng mã bill (50 = 25 × 2) → huỷ → 1 dòng adjust −50 cho SĐT NGƯỜI NHẬN', n3.status === 200 && h3.status === 200
      && t3.length === 1 && t3[0].points === -50 && t3[0].customer_phone === s3 && await diemDon(d3.id) === 0, `${moTa(n3)} / ${moTa(h3)} · ${JSON.stringify(t3)}`);

    const s4 = sdtMoi(); await nap(s4, 10000);   // DIEM-THAT-1: ví 10.000 + tiền mặt 15.000 → 15 điểm (phần ví không sinh điểm)
    const d4 = await ban({ customer_phone: s4, items: [mon(0)], payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 });
    co.nemGhi = /'adjust'/;
    const h4 = await huy(d4.id);
    co.nemGhi = null;
    const tt4 = await so("SELECT COUNT(*) FROM pos_orders WHERE id = ? AND status = 'completed'", [d4.id]);
    k('A4 câu ghi dòng trừ lỗi → huỷ 500, rollback trọn: đơn vẫn completed, ví vẫn 0, 0 dòng trừ, earn còn 15', h4.status === 500 && tt4 === 1
      && await vi(s4) === 0 && await soDong(d4.id, 'adjust') === 0 && await diemDon(d4.id) === 15, `${moTa(h4)} · completed ${tt4} · ví ${await vi(s4)}`);
    let trongTx = null;
    co.truocCommit = async (tx) => { trongTx = Number((await tx.queryOne("SELECT COUNT(*) AS n FROM pos_point_transactions WHERE order_id = ? AND type = 'adjust'", [d4.id])).n); };
    const h4b = await huy(d4.id);
    co.truocCommit = null;
    k('A4b dòng trừ nằm TRONG giao dịch huỷ: đọc ngay trước commit thấy 1; ví hoàn 10.000', h4b.status === 200 && trongTx === 1
      && await vi(s4) === 10000 && await diemDon(d4.id) === 0, `${moTa(h4b)} · trong giao dịch ${trongTx} · ví ${await vi(s4)}`);

    const s5 = sdtMoi();
    const d5 = await tienMat(s5);
    const n5 = await nhan(d5, s5);
    const h5 = await huy(d5.id);
    const t5 = await dongTru(d5.id);
    k('A5 đơn có HAI dòng earn cùng SĐT, cùng hạn (25 lúc bán + 25 bù mã bill) → MỘT dòng adjust −50', n5.status === 200 && h5.status === 200
      && await soDong(d5.id, 'earn') === 2 && t5.length === 1 && t5[0].points === -50, `${moTa(n5)} / ${moTa(h5)} · ${JSON.stringify(t5)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] khách đã tiêu điểm → số dư âm, hiện đúng số âm; đổi quà bị chặn');
  {
    const qua = async (diem) => Number((await db.run(`INSERT INTO pos_reward_catalog (name, points_cost, discount_type, discount_value, valid_days, is_active)
      VALUES (?, ?, 'fixed', 5000, 30, 1)`, [`Quà P24 ${diem}`, diem])).lastInsertRowid);
    const q20 = await qua(20), q1 = await qua(1);
    const s = sdtMoi();
    const d = await tienMat(s);
    const doi = await goi('POST', '/loyalty/redeem', { phone: s, reward_id: q20 });
    const truoc = await soDu(s);
    const h = await huy(d.id);
    const sau = await soDu(s);
    k('B1 earn 25 → đổi quà 20 (còn 5) → huỷ → số dư −20 (GET /loyalty/points, cùng hàm layDiemKhach của App KH)', doi.status === 200
      && truoc === 5 && h.status === 200 && sau === -20, `${moTa(doi)} · ${truoc} → ${moTa(h)} · ${sau}`);
    const soRedeem = await so("SELECT COUNT(*) FROM pos_point_transactions WHERE customer_phone = ? AND type = 'redeem'", [s]);
    const lai = await goi('POST', '/loyalty/redeem', { phone: s, reward_id: q1 });
    k('B2 số dư −20 (luật sẵn có loyalty.js: số dư < giá) → đổi quà 1 điểm → 400, không thêm dòng redeem', lai.status === 400 && soRedeem === 1
      && await so("SELECT COUNT(*) FROM pos_point_transactions WHERE customer_phone = ? AND type = 'redeem'", [s]) === 1, moTa(lai));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] đơn không có điểm → huỷ không ghi dòng điểm nào (K5: huỷ vẫn 200)');
  {
    const c1 = await tienMat(null);
    const h1 = await huy(c1.id);
    k('C1 khách lẻ chưa nhận mã → huỷ 200, 0 dòng điểm', h1.status === 200 && await diemDon(c1.id) === 0
      && await so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ?', [c1.id]) === 0, moTa(h1));
    const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
      ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
      ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    let c2;
    try { c2 = await ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'cash', cash_amount: 20000 }); } finally { await datCaiDat('flash_enabled', 'false'); }
    const h2 = await huy(c2.id);
    k('C2 đơn Flash có SĐT → huỷ 200, 0 dòng điểm', Number(c2.flash_discount) > 0 && h2.status === 200
      && await so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ?', [c2.id]) === 0, moTa(h2));
    const c3 = await ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const c3b = await ban({ customer_phone: sdtMoi(), items: [mon(2)], payment_method: 'debt', debt_amount: 50000 });
    const t3b = await goi('POST', `/orders/${c3b.id}/pay-debt`, { payment_method: 'cash', amount: 20000 });
    const h3 = await huy(c3.id), h3b = await huy(c3b.id);
    k('C3 đơn ghi nợ chưa thu / đã thu một phần → huỷ 200, 0 dòng điểm', h3.status === 200 && t3b.status === 200 && h3b.status === 200
      && await so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id IN (?, ?)', [c3.id, c3b.id]) === 0, `${moTa(h3)} / ${moTa(h3b)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] mã nhận điểm chưa dùng của đơn đã huỷ → không nhận được');
  {
    const d1 = await tienMat(null);
    await huy(d1.id);
    const n1 = await nhan(d1, sdtMoi());
    k('D1 huỷ rồi /nhan-diem → 400 DON_DA_HUY, 0 dòng điểm', n1.status === 400 && n1.code === 'DON_DA_HUY' && await diemDon(d1.id) === 0
      && await so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ?', [d1.id]) === 0, moTa(n1));
    const d2 = await tienMat(null);
    let h2;
    co.mocTruocTx = async () => { h2 = await huy(d2.id); };
    const n2 = await nhan(d2, sdtMoi());
    k('D2 huỷ chen ĐÚNG lúc nhận điểm (qua phép kiểm ngoài giao dịch, huỷ xong mới ghi) → huỷ 200, nhận 400 DON_DA_HUY, 0 earn, mã chưa bị tiêu',
      h2?.status === 200 && n2.status === 400 && n2.code === 'DON_DA_HUY' && await soDong(d2.id, 'earn') === 0 && await diemDon(d2.id) === 0
      && (await mot('SELECT diem_nhan_luc FROM pos_signup_codes WHERE code = ?', [d2.signup_code]))?.diem_nhan_luc === null,
    `${moTa(h2)} / ${moTa(n2)} · earn ${await soDong(d2.id, 'earn')} · điểm ${await diemDon(d2.id)}`);
    const d3 = await tienMat(null);
    const n3 = await nhan(d3, sdtMoi());
    k('D3 (K5) nhận điểm mã bill trên đơn còn hiệu lực → 200, 50 điểm', n3.status === 200 && await diemDon(d3.id) === 50, moTa(n3));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] hạn điểm: dòng trừ cùng expires_at với earn');
  {
    await datCaiDat('loyalty_expiry_mode', 'quarter');
    const s1 = sdtMoi();
    const d1 = await tienMat(s1);
    await datCaiDat('loyalty_expiry_mode', 'none');
    const e1 = (await dongEarn(d1.id))[0];
    const h1 = await huy(d1.id);
    const t1 = await dongTru(d1.id);
    k('E1 earn có hạn quý → dòng trừ cùng hạn', h1.status === 200 && !!e1?.expires_at && t1.length === 1 && t1[0].expires_at === e1.expires_at,
      `${moTa(h1)} · ${JSON.stringify(e1)} · ${JSON.stringify(t1)}`);

    const s2 = sdtMoi();
    const d2 = await tienMat(s2);
    await db.run("UPDATE pos_point_transactions SET expires_at = '2020-01-01T00:00:00' WHERE order_id = ?", [d2.id]);
    const truoc = await soDu(s2);
    const h2 = await huy(d2.id);
    const t2 = await dongTru(d2.id);
    k('E2 earn ĐÃ hết hạn lúc huỷ → dòng trừ −25 cùng hạn đã qua; số dư không đổi (0 → 0)', h2.status === 200 && truoc === 0 && await soDu(s2) === 0
      && t2.length === 1 && t2[0].points === -25 && t2[0].expires_at === '2020-01-01T00:00:00', `${moTa(h2)} · ${truoc} → ${await soDu(s2)} · ${JSON.stringify(t2)}`);

    const s3 = sdtMoi();
    const d3 = await tienMat(s3);
    await datCaiDat('loyalty_expiry_mode', 'quarter');
    const n3 = await nhan(d3, s3);
    await datCaiDat('loyalty_expiry_mode', 'none');
    const h3 = await huy(d3.id);
    const t3 = await dongTru(d3.id);
    const e3 = await dongEarn(d3.id);
    k('E3 hai earn cùng SĐT, KHÁC hạn (lúc bán không hạn + bù mã bill có hạn quý) → hai dòng trừ, mỗi dòng đúng hạn và số của earn tương ứng',
      n3.status === 200 && h3.status === 200 && t3.length === 2 && e3.length === 2 && await diemDon(d3.id) === 0
      && e3.every((e) => t3.some((t) => t.expires_at === e.expires_at && t.points === -e.points)), `${moTa(n3)} / ${moTa(h3)} · ${JSON.stringify(t3)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] huỷ hai lần / hai người bấm cùng lúc → chỉ MỘT dòng trừ');
  {
    const d1 = await tienMat(sdtMoi());
    let r2;
    co.mocTruocTx = async () => { r2 = await huy(d1.id); };
    const r1 = await huy(d1.id);
    k('F1 hai lệnh huỷ chồng nhau → 200 + 400 DON_KHONG_HUY_DUOC; đúng 1 dòng adjust, điểm đơn 0', r2?.status === 200 && r1.status === 400
      && r1.code === 'DON_KHONG_HUY_DUOC' && await soDong(d1.id, 'adjust') === 1 && await diemDon(d1.id) === 0,
    `${moTa(r2)} / ${moTa(r1)} · adjust ${await soDong(d1.id, 'adjust')}`);
    const r3 = await huy(d1.id);
    k('F1b huỷ lần nữa → 400, vẫn 1 dòng adjust', r3.status === 400 && await soDong(d1.id, 'adjust') === 1, moTa(r3));

    const s2 = sdtMoi();
    const d2 = await tienMat(s2);
    await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at)
      VALUES (?, 'adjust', -5, ?, 'chèn tay P24', ?)`, [s2, d2.id, d2.created_at]);
    boQuaI8.add(d2.code);
    const h2 = await huy(d2.id);
    k('F2 đơn đã có dòng adjust (chèn tay) → huỷ 200 nhưng KHÔNG thêm dòng trừ thứ hai (chặn trong câu ghi)', h2.status === 200
      && await soDong(d2.id, 'adjust') === 1 && await diemDon(d2.id) === 20, `${moTa(h2)} · adjust ${await soDong(d2.id, 'adjust')} · ${await diemDon(d2.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] DELETE /:id: đơn completed có điểm → trừ như huỷ; huỷ rồi xoá → không trừ lần hai');
  {
    const s1 = sdtMoi(); await nap(s1, 10000);   // DIEM-THAT-1: ví 10.000 + tiền mặt 15.000 → 15 điểm
    const d1 = await ban({ customer_phone: s1, items: [mon(0)], payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 });
    const x1 = await xoa(d1.id);
    const t1 = await dongTru(d1.id);
    k('G1 xoá đơn completed có earn 15 → 200, ví hoàn 10.000 (K5), 1 dòng adjust −15 cho SĐT đơn (còn lại dù đơn đã xoá)', x1.status === 200
      && await vi(s1) === 10000 && t1.length === 1 && t1[0].points === -15 && t1[0].customer_phone === s1 && await diemDon(d1.id) === 0,
    `${moTa(x1)} · ví ${await vi(s1)} · ${JSON.stringify(t1)}`);
    const d2 = await tienMat(sdtMoi());
    const h2 = await huy(d2.id);
    const x2 = await xoa(d2.id);
    k('G2 huỷ rồi xoá → 200 + 200, đúng 1 dòng adjust, điểm đơn 0', h2.status === 200 && x2.status === 200
      && await soDong(d2.id, 'adjust') === 1 && await diemDon(d2.id) === 0, `${moTa(h2)} / ${moTa(x2)} · adjust ${await soDong(d2.id, 'adjust')}`);
    const d3 = await tienMat(null);
    const x3 = await xoa(d3.id);
    k('G3 (K5) xoá đơn khách lẻ không điểm → 200, 0 dòng điểm', x3.status === 200
      && await so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ?', [d3.id]) === 0, moTa(x3));
    const d4 = await tienMat(sdtMoi());
    co.nemGhi = /'adjust'/;
    const x4 = await xoa(d4.id);
    co.nemGhi = null;
    k('G4 câu ghi dòng trừ lỗi khi xoá → 500, đơn còn nguyên, earn còn 25', x4.status === 500
      && await so('SELECT COUNT(*) FROM pos_orders WHERE id = ?', [d4.id]) === 1 && await diemDon(d4.id) === 25, moTa(x4));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] bất biến I8: đơn đã huỷ → tổng điểm 0; đơn huỷ trước mốc P24 giữ như cũ (chỉ Đối soát thật)');
  {
    const lech = (await I8()).filter((d) => !boQuaI8.has((/^đơn (\S+): /.exec(d) || [])[1]));
    k('H1 I8 trên mọi đơn của bài (trừ đơn F2 chèn tay) → 0 lệch (dòng adjust gắn đơn không phải "loại lạ")', lech.length === 0, JSON.stringify(lech.slice(0, 4)));
    const s = sdtMoi();
    const d = await tienMat(s);
    await db.run("UPDATE pos_orders SET status = 'cancelled', cancelled_at = ? WHERE id = ?", [d.created_at, d.id]);   // huỷ kiểu CŨ: không trừ
    const coDon = async (ctx) => (await I8(ctx)).includes(`đơn ${d.code}: 25 điểm, đúng luật là 0`);
    k('H1b đơn đã huỷ còn 25 điểm (không dòng trừ) → I8 lệch "đơn X: 25 điểm, đúng luật là 0"', await coDon({}), JSON.stringify((await I8()).slice(0, 3)));
    const moc = String(batBien.HUY_TRU_DIEM_TU || '');
    const truocMoc = /^\d{4}-\d{2}-\d{2}$/.test(moc) ? new Date(Date.parse(moc + 'T00:00:00Z') - 1000).toISOString().slice(0, 19) : '';
    const luc = async (t, ctx) => { await db.run('UPDATE pos_orders SET cancelled_at = ? WHERE id = ?', [t, d.id]); return coDon(ctx); };
    const a = truocMoc && await luc(truocMoc, { thuc: true });
    const b = truocMoc && await luc(moc + 'T00:00:00', { thuc: true });
    const c = truocMoc && await luc(truocMoc, {});
    k(`H2 Đối soát thật: đơn huỷ 1 giây trước mốc ${moc || '(chưa có HUY_TRU_DIEM_TU)'} còn điểm → KHÔNG lệch; huỷ đúng mốc → lệch; giả lập trước mốc → lệch`,
      !!truocMoc && a === false && b === true && c === true, `trước mốc ${a} · đúng mốc ${b} · giả lập ${c}`);
    await db.run('DELETE FROM pos_point_transactions WHERE order_id = ?', [d.id]);
    const la = await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at)
      VALUES (?, 'adjust', -3, NULL, 'adjust không gắn đơn', ?)`, [s, d.created_at]);
    const coLa = (await I8()).some((x) => /^loại dòng điểm lạ "adjust"/.test(x));
    await db.run('DELETE FROM pos_point_transactions WHERE id = ?', [Number(la.lastInsertRowid)]);
    k('H3 dòng adjust KHÔNG gắn đơn → I8 báo loại dòng điểm lạ; gắn đơn huỷ (H1) thì không', coLa, JSON.stringify((await I8()).slice(0, 3)));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[I] K5: huỷ đơn hoàn ví / gói / thẻ / giao từ gói như cũ; hoàn tiền (refunds / báo hỏng) GIỮ điểm (việc sau)');
  {
    const s1 = sdtMoi(); await nap(s1, 300000);
    const goi1 = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
      VALUES ('GOI_P24', 'Gói P24', 100000, 'ly', 3, 1)`)).lastInsertRowid);
    const mua = await ban({ customer_phone: s1, items: [], package_buy: { package_id: goi1, pkg_qty: 1 }, payment_method: 'balance', balance_amount: 100000 });
    const cp = await so('SELECT id FROM pos_customer_packages WHERE order_id = ?', [mua.id]);
    const lay = await ban({ customer_phone: s1, items: [mon(0, 1, true)], customer_package_id: cp, payment_method: 'cash', cash_amount: 0 });
    const daGiao = await so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [cp]);
    const hLay = await huy(lay.id);
    k('I1a huỷ đơn giao từ gói → 200, gói trả lại 1 ly (delivered 1 → 0)', daGiao === 1 && hLay.status === 200
      && await so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [cp]) === 0, `${moTa(hLay)} · ${daGiao}`);
    const viTruoc = await vi(s1);
    const hMua = await huy(mua.id);
    k('I1b huỷ đơn mua gói trả ví → 200, ví +100.000, gói xoá, điểm đơn 0', hMua.status === 200 && await vi(s1) === viTruoc + 100000
      && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE id = ?', [cp]) === 0 && await diemDon(mua.id) === 0, `${moTa(hMua)} · ví ${viTruoc} → ${await vi(s1)}`);
    const hang = await mot('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY id LIMIT 1');
    const s2 = sdtMoi(); await nap(s2, Number(hang.card_price));
    const the1 = await ban({ customer_phone: s2, items: [], membership_buy: { tier_id: hang.id }, payment_method: 'balance', balance_amount: Number(hang.card_price) });
    const hThe = await huy(the1.id);
    k('I1c huỷ đơn mua thẻ → 200, dòng mua thẻ xoá, ví hoàn đủ, điểm đơn 0', hThe.status === 200 && await vi(s2) === Number(hang.card_price)
      && await so('SELECT COUNT(*) FROM pos_membership_purchases WHERE order_id = ?', [the1.id]) === 0 && await diemDon(the1.id) === 0, moTa(hThe));

    const s3 = sdtMoi(); await nap(s3, 10000);   // DIEM-THAT-1: ví 10.000 + tiền mặt 15.000 → 15 điểm
    const d3 = await ban({ customer_phone: s3, items: [mon(0)], payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 });
    const yc = await goi('POST', '/refunds', { order_id: d3.id, reason: 'thử P24' });
    const dy = await goi('POST', `/refunds/${yc.refund_id}/approve`, {});
    k('I2 duyệt hoàn tiền (refunds.js) đơn có 15 điểm → 200, ví hoàn, điểm GIỮ 15, 0 dòng trừ (việc sau)', dy.status === 200 && await vi(s3) >= 10000
      && await diemDon(d3.id) === 15 && await soDong(d3.id, 'adjust') === 0, `${moTa(yc)} / ${moTa(dy)}`);
    const s4 = sdtMoi();
    const d4 = await tienMat(s4, 1);
    const bh = await goi('POST', '/damages', { order_id: d4.id, product_code: sp[1].code, quantity: 1, reason: 'damaged', reason_note: 'thử P24',
      action: 'refund', refund_amount: 10000, return_to_stock: false });
    k('I3 hoàn MỘT PHẦN (báo hỏng hoàn 10.000) đơn có 20 điểm → 200, điểm GIỮ 20, 0 dòng trừ (việc sau)', bh.status === 200
      && await diemDon(d4.id) === 20 && await soDong(d4.id, 'adjust') === 0, moTa(bh));
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
