#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-API-1 — cổng khách /api/kh: đăng nhập mã một lần, dữ liệu của mình, nhận mã bill
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có /api/kh). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KH1.js
 *
 *  Khuôn thu_P20.js: database.js thật + libsql thật trên file kho TẠM; chỉ thay ketNoiKho (P8) và tắt SX.
 *  Express riêng mount ĐÚNG đường như index.js. Đơn tạo qua POST /orders thật. Thời gian trôi dựng bằng cách lùi
 *  cột giờ trong kho tạm (strftime trên getNow — cùng định dạng cột), không ngủ. So HTTP status + `code`, không dò lời báo (E12).
 *  Module chưa có (code gốc) → route không gắn → mỗi ca hỏng riêng, không sập cả bài.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_kh1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
const KHOA_NV = 'thu_kh1_nv_' + Date.now();
const KHOA_KH = 'thu_kh1_kh_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = KHOA_KH;
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_kh1';
process.env.GUI_MA_KHACH = 'gia';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);

// Log máy chủ gom vào nhatKy (ca G soi: không dòng nào chứa mã thô / token).
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const nhatKy = [];
let soCanhBao = 0;
const imLang = () => {
  console.log = (...a) => nhatKy.push(a.join(' '));
  console.error = (...a) => nhatKy.push(a.join(' '));
  console.warn = (...a) => { soCanhBao++; nhatKy.push(a.join(' ')); };
};
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thuNap = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; } };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();

  // Móc giữa "phép kiểm ngoài giao dịch" và "mở giao dịch" (khuôn thu_P20): chạy MỘT lần rồi tự gỡ. Gắn TRƯỚC khi nạp route.
  let mocTruocTx = null;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...thamSo) => {
    const moc = mocTruocTx; mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...thamSo);
  };

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/signup-codes', require(R('signup-codes.js')));
  app.use('/api/pos/loyalty', require(R('loyalty.js')));
  app.use('/api/pos/customers', require(R('customers.js')));
  app.use('/api/pos/products', require(R('products.js')));
  const quay = thuNap(R('kh/quay.js'));
  const khRoute = thuNap(R('kh'));
  if (quay) app.use('/api/pos/kh', quay);
  if (khRoute) app.use('/api/kh', khRoute);
  const guiMa = thuNap(path.join(GOC, 'server', 'utils', 'guiMaKhach.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('thu_ngan_kh1', 'x', 'Thu ngân', 'staff', 1)");
  const nv = await db.queryOne("SELECT id FROM pos_users WHERE username = 'thu_ngan_kh1'");
  const tkNv = jwt.sign({ userId: nv.id }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = async (key, value) => db.run(
    `INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
  for (const [a, b] of [['signup_enabled', '1'], ['signup_discount_type', 'percent'], ['signup_discount_value', '10'],
    ['nhandiem_enabled', '1'], ['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false']]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const mon = (sl = 1) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl });

  let soSdt = 0;
  const sdtMoi = () => '09' + String(20000000 + (++soSdt)).padStart(8, '0');

  // goi(method, '/kh/toi', body, { tk, dichVu, khongThan }) → { status, j, tho }. Thân lỗi của /kh/* gom lại cho ca G.
  const thanKh = [];
  const goi = async (method, url, body, o = {}) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (o.dichVu) headers['X-Service-Key'] = process.env.POS_SERVICE_API_KEY;
    else if (o.tk) headers.Authorization = 'Bearer ' + o.tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      if (url.startsWith('/kh/')) thanKh.push({ url, status: r.status, j, tho });
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const dongMa = (sdt) => db.queryOne('SELECT * FROM pos_kh_ma_dang_nhap WHERE sdt = ? ORDER BY id DESC LIMIT 1', [sdt]).catch(() => null);
  const luc = async (giay) => (await db.queryOne("SELECT strftime('%Y-%m-%dT%H:%M:%S', ?, ?) AS t", [getNow(), `${giay} seconds`])).t;
  // Chèn dòng mã giả (giờ lùi `lui` giây) để dựng giới hạn mà không ngủ.
  const chenMa = async (sdt, nguon, lui, ip = 'ip-khac', soLanThu = 0) => db.run(
    `INSERT INTO pos_kh_ma_dang_nhap (sdt, ma_bam, nguon, ip, tao_luc, het_han, so_lan_thu) VALUES (?, 'x', ?, ?, ?, ?, ?)`,
    [sdt, nguon, ip, await luc(-lui), await luc(-lui + 300), soLanThu]);
  let IP_THU = null;
  // Mọi ca khác chạy chung một IP → gỡ IP các dòng 'gui' cũ trước mỗi lần xin, để giới hạn IP chỉ thử ở mục B1-IP.
  const daCap = new Set();   // mọi mã thô đã phát (ca G soi log)
  const maGia = () => (guiMa && guiMa.layMaGiaCuoi() ? guiMa.layMaGiaCuoi().ma : null);
  const xinMa = async (sdt) => {
    if (IP_THU) await db.run("UPDATE pos_kh_ma_dang_nhap SET ip = 'ip-cu' WHERE ip = ? AND nguon = 'gui'", [IP_THU]).catch(() => {});
    const r = await goi('POST', '/kh/dang-nhap/xin-ma', { sdt });
    if (maGia()) daCap.add(maGia());
    return r;
  };
  const xacMinh = (sdt, ma, ten) => goi('POST', '/kh/dang-nhap/xac-minh', ten === undefined ? { sdt, ma } : { sdt, ma, ten });
  // Đăng nhập trọn vẹn một khách (tạo khách nếu mới) → { sdt, tk, id }.
  const dangNhap = async (ten = 'Khách thử', sdt = sdtMoi()) => {
    await xinMa(sdt);
    const r = await xacMinh(sdt, maGia(), ten);
    return { sdt, tk: r.j.token, id: r.j.token ? jwt.decode(r.j.token).id : null, r };
  };
  const capMa = async (sdt, tk = tkNv) => {
    const r = await goi('POST', '/pos/kh/cap-ma', { sdt }, { tk });
    if (r.j.ma) daCap.add(String(r.j.ma));
    return r;
  };
  const taoDon = async (body) => {
    const r = await goi('POST', '/pos/orders', body, { tk: tkChu });
    if (!r.j.success) throw new Error(`không tạo được đơn: ${r.status} ${r.j.error || ''}`);
    return { id: r.j.order.id, ma: r.j.order.signup_code, code: r.j.order.code };
  };
  const donThu = (sdt) => taoDon({ items: [mon()], payment_method: 'cash', cash_amount: 25000, ...(sdt ? { customer_phone: sdt, customer_name: 'K' } : {}) });
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1] SĐT chuẩn hoá bằng normalizePhone + isValidPhone');
  await chay('A1', async () => {
    const r = await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: '+84 912 345 601' });
    const d = await dongMa('0912345601');
    k('A1 "+84 912 345 601" → 200, dòng mã lưu 0912345601', r.status === 200 && !!d, moTa(r));
    IP_THU = d ? d.ip : null;
    for (const [nhan, sdt] of [['"abc"', 'abc'], ['"0912"', '0912'], ['số 912345678 (không phải chuỗi)', 912345678], ['thiếu', undefined]]) {
      const x = await goi('POST', '/kh/dang-nhap/xin-ma', sdt === undefined ? {} : { sdt });
      k(`A1 SĐT ${nhan} → 400 SDT_KHONG_HOP_LE`, la(x, 400, 'SDT_KHONG_HOP_LE'), moTa(x));
    }
  });

  muc('[A2] mã 6 chữ số, lưu băm, hạn đúng 5 phút, dùng MỘT lần (đua)');
  await chay('A2', async () => {
    const s = sdtMoi();
    await xinMa(s);
    const ma = maGia(), d = await dongMa(s);
    k('A2 mã gửi đi là 6 chữ số', /^\d{6}$/.test(String(ma)), String(ma));
    k('A2 lưu băm 64 ký tự hex, không chứa mã thô', !!d && /^[0-9a-f]{64}$/.test(d.ma_bam) && !d.ma_bam.includes(ma), d ? d.ma_bam : '(không có dòng)');
    const giay = d && (await db.queryOne('SELECT ROUND((julianday(het_han) - julianday(tao_luc)) * 86400) AS g FROM pos_kh_ma_dang_nhap WHERE id = ?', [d.id])).g;
    k('A2 het_han − tao_luc = ĐÚNG 300 giây', Number(giay) === 300, String(giay));
    let chen = null;
    mocTruocTx = async () => { chen = await xacMinh(s, ma, 'Người chen'); imLang(); };
    const sau = await xacMinh(s, ma, 'Người sau');
    mocTruocTx = null;
    k('A2 đua: người chen vào xác minh trọn → 200', !!chen && chen.status === 200, chen ? moTa(chen) : 'móc không chạy');
    k('A2 đua: người đến sau → 400 MA_HET_HAN (đúng MỘT token)', la(sau, 400, 'MA_HET_HAN'), moTa(sau));
  });

  muc('[A3] đúng → token 30 ngày · sai → MA_SAI · hết hạn / đã dùng → MA_HET_HAN · 5 lần thử');
  await chay('A3', async () => {
    const s = sdtMoi();
    await xinMa(s);
    const sai = await xacMinh(s, String((Number(maGia()) + 1) % 1000000).padStart(6, '0'), 'K');
    k('A3 mã sai → 400 MA_SAI', la(sai, 400, 'MA_SAI'), moTa(sai));
    const r = await xacMinh(s, maGia(), 'K');
    let tt = null; try { tt = jwt.verify(r.j.token, KHOA_KH); } catch { /* sai khoá */ }
    const kh = await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [s]);
    k('A3 mã đúng → 200, token ký bằng KH_JWT_SECRET, loai kh + id khách', r.status === 200 && !!tt && tt.loai === 'kh' && !!kh && tt.id === kh.id, moTa(r));
    k('A3 token hạn ĐÚNG 30 ngày', !!tt && tt.exp - tt.iat === 30 * 86400, tt ? String(tt.exp - tt.iat) : '');
    let khongNv = false; try { jwt.verify(r.j.token, KHOA_NV); } catch { khongNv = true; }
    k('A3 token khách KHÔNG giải được bằng khoá nhân viên', khongNv);
    const lai = await xacMinh(s, maGia(), 'K');
    k('A3 dùng lại mã đã dùng → 400 MA_HET_HAN', la(lai, 400, 'MA_HET_HAN'), moTa(lai));

    const s2 = sdtMoi(); await xinMa(s2); const d2 = await dongMa(s2);
    await db.run('UPDATE pos_kh_ma_dang_nhap SET het_han = ? WHERE id = ?', [await luc(-1), d2.id]);
    const hh = await xacMinh(s2, maGia(), 'K');
    k('A3 het_han lùi 1 giây → 400 MA_HET_HAN', la(hh, 400, 'MA_HET_HAN'), moTa(hh));
    const s3 = sdtMoi(); await xinMa(s3); const d3 = await dongMa(s3);
    await db.run('UPDATE pos_kh_ma_dang_nhap SET het_han = ? WHERE id = ?', [await luc(3), d3.id]);
    const con = await xacMinh(s3, maGia(), 'K');
    k('A3 het_han còn 3 giây → 200', la(con, 200), moTa(con));

    for (const [soSai, mong] of [[4, 200], [5, 400]]) {
      const s4 = sdtMoi(); await xinMa(s4); const ma = maGia();
      const saiMa = String((Number(ma) + 7) % 1000000).padStart(6, '0');
      for (let i = 0; i < soSai; i++) await xacMinh(s4, saiMa, 'K');
      const x = await xacMinh(s4, ma, 'K');
      k(`A3 sai ${soSai} lần rồi đúng → ${mong === 200 ? '200' : '400 MA_HET_HAN (mã đã huỷ)'}`,
        mong === 200 ? la(x, 200) : la(x, 400, 'MA_HET_HAN'), moTa(x));
    }
  });

  muc('[A4] khách cũ giữ tên · khách mới phải có tên, tạo như quầy (retail), mã không bị tiêu khi thiếu tên');
  await chay('A4', async () => {
    const s = sdtMoi();
    await db.run("INSERT INTO pos_customers (phone, name, created_at) VALUES (?, 'Tên Cũ', ?)", [s, getNow()]);
    await xinMa(s);
    const r = await xacMinh(s, maGia(), 'Tên Mới');
    const ds = await db.query('SELECT name FROM pos_customers WHERE phone = ?', [s]);
    k('A4 khách cũ + ten khác → 200, tên KHÔNG đổi, không tạo trùng', la(r, 200) && ds.length === 1 && ds[0].name === 'Tên Cũ', `${moTa(r)} · ${JSON.stringify(ds)}`);

    const m = sdtMoi(); await xinMa(m); const ma = maGia();
    const thieu = await xacMinh(m, ma);
    const d = await dongMa(m);
    k('A4 SĐT mới không ten → 400 CAN_TEN', la(thieu, 400, 'CAN_TEN'), moTa(thieu));
    k('A4 CAN_TEN không tiêu mã, không mất lượt thử', !!d && d.dung_luc === null && Number(d.so_lan_thu) === 0, d ? `${d.dung_luc} · ${d.so_lan_thu}` : '');
    const du = await xacMinh(m, ma, '  Chị Mới  ');
    const kh = await db.queryOne('SELECT * FROM pos_customers WHERE phone = ?', [m]);
    k('A4 CÙNG mã + ten → 200', la(du, 200), moTa(du));
    k('A4 khách mới: tên đã trim, created_by app_kh, qr QR-<sđt>, retail / retail_only',
      !!kh && kh.name === 'Chị Mới' && kh.created_by === 'app_kh' && kh.qr_code === 'QR-' + m && kh.customer_type === 'retail' && kh.sync_status === 'retail_only',
      kh ? `${kh.name} · ${kh.created_by} · ${kh.qr_code} · ${kh.customer_type} · ${kh.sync_status}` : '(không có khách)');
    for (const [nhan, ten, mong] of [['toàn khoảng trắng', '   ', 'CAN_TEN'], ['51 ký tự', 'a'.repeat(51), 'CAN_TEN'], ['50 ký tự', 'b'.repeat(50), 200]]) {
      const x = sdtMoi(); await xinMa(x);
      const y = await xacMinh(x, maGia(), ten);
      k(`A4 ten ${nhan} → ${mong}`, mong === 200 ? la(y, 200) : la(y, 400, mong), moTa(y));
    }
  });

  muc('[A5] xin-ma trả CÙNG câu cho SĐT có / chưa có trong hệ thống');
  await chay('A5', async () => {
    const co = sdtMoi(), chua = sdtMoi();
    await db.run("INSERT INTO pos_customers (phone, name, created_at) VALUES (?, 'Đã là khách', ?)", [co, getNow()]);
    const a = await xinMa(co), b = await xinMa(chua);
    k('A5 cùng status, cùng thân', a.status === 200 && a.status === b.status && a.tho === b.tho, `${a.status} ${a.tho} | ${b.status} ${b.tho}`);
  });

  muc('[B1] xin-ma: ≥ 60 giây · ≤ 5 lần / SĐT / giờ · ≤ 20 lần / IP / giờ — CHỈ đếm mã App xin');
  await chay('B1', async () => {
    let r59 = null;
    for (let lan = 0; lan < 3; lan++) {   // 59 giây chỉ chặn nếu yêu cầu chạy CÙNG giây với mốc t0 của dòng chèn (K3 thất thường)
      const s = sdtMoi(), t0 = getNow();
      const lui = (await db.queryOne("SELECT strftime('%Y-%m-%dT%H:%M:%S', ?, '-59 seconds') AS t", [t0])).t;
      await db.run(`INSERT INTO pos_kh_ma_dang_nhap (sdt, ma_bam, nguon, ip, tao_luc, het_han) VALUES (?, 'x', 'gui', 'ip-khac', ?, ?)`, [s, lui, t0]);
      r59 = await xinMa(s);
      if (getNow() === t0) break;
      r59 = null;
    }
    k('B1 dòng trước cách 59 giây → 429 QUA_NHIEU_LAN', !!r59 && la(r59, 429, 'QUA_NHIEU_LAN'), r59 ? moTa(r59) : 'không giữ được cùng giây sau 3 lần');
    const s60 = sdtMoi(); await chenMa(s60, 'gui', 60);
    const r60 = await xinMa(s60);
    k('B1 dòng trước cách ĐÚNG 60 giây → 200', la(r60, 200), moTa(r60));
    const thu = async (lui) => { const s = sdtMoi(); for (const g of lui) await chenMa(s, 'gui', g); return xinMa(s); };
    const b4 = await thu([120, 600, 1200, 1800]);
    k('B1 đã 4 lần trong giờ → lần 5 được (200)', la(b4, 200), moTa(b4));
    const b5 = await thu([120, 600, 1200, 1800, 2400]);
    k('B1 đã 5 lần trong giờ → 429', la(b5, 429, 'QUA_NHIEU_LAN'), moTa(b5));
    const b59p = await thu([120, 600, 1200, 1800, 59 * 60]);
    k('B1 dòng 59 phút trước VẪN tính → 429', la(b59p, 429, 'QUA_NHIEU_LAN'), moTa(b59p));
    const b61p = await thu([120, 600, 1200, 1800, 61 * 60]);
    k('B1 dòng 61 phút trước KHÔNG tính → 200', la(b61p, 200), moTa(b61p));

    const q = sdtMoi(); const c = await capMa(q);
    const sauQuay = await xinMa(q);
    k('B1 xin-ma NGAY sau cap-ma cùng SĐT → 200 (mã quầy không tính)', la(c, 200) && la(sauQuay, 200), `${moTa(c)} / ${moTa(sauQuay)}`);
    const q2 = sdtMoi(); for (const g of [100, 200, 300, 400, 500]) await chenMa(q2, 'quay', g);
    const sauQuay5 = await xinMa(q2);
    k('B1 5 mã QUẦY trong giờ → xin-ma vẫn 200', la(sauQuay5, 200), moTa(sauQuay5));

    k('B1 đọc được IP máy thử', !!IP_THU, String(IP_THU));
    await db.run("UPDATE pos_kh_ma_dang_nhap SET ip = 'ip-cu' WHERE ip = ?", [IP_THU]);
    for (let i = 0; i < 20; i++) await chenMa(sdtMoi(), 'quay', 100, IP_THU);
    const ipQuay = await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: sdtMoi() });
    k('B1 20 mã QUẦY cùng IP → xin-ma vẫn 200', la(ipQuay, 200), moTa(ipQuay));
    await db.run("UPDATE pos_kh_ma_dang_nhap SET ip = 'ip-cu' WHERE ip = ?", [IP_THU]);
    for (let i = 0; i < 19; i++) await chenMa(sdtMoi(), 'gui', 100, IP_THU);
    const ip19 = await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: sdtMoi() });
    const ip20 = await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: sdtMoi() });
    k('B1 IP đã 19 lần → 200', la(ip19, 200), moTa(ip19));
    k('B1 IP đã 20 lần → 429', la(ip20, 429, 'QUA_NHIEU_LAN'), moTa(ip20));
    await db.run("UPDATE pos_kh_ma_dang_nhap SET ip = 'ip-cu' WHERE ip = ?", [IP_THU]);

    const q3 = sdtMoi(); let du6 = 0;
    for (let i = 0; i < 6; i++) if (la(await capMa(q3), 200)) du6++;
    k('B1 cap-ma quầy 6 lần liền cùng SĐT → 6 lần 200', du6 === 6, `${du6}/6`);
  });

  muc('[B2] xác minh: ≤ 5 lần / mã (A3) · ≤ 10 lần sai / SĐT / giờ — chỉ mã App; mã quầy luôn dùng được (Q7)');
  await chay('B2', async () => {
    const thu = async (soLan) => {
      const s = sdtMoi();
      for (const [g, n] of soLan) await chenMa(s, 'gui', g, 'ip-khac', n);
      await xinMa(s);
      return { s, r: await xacMinh(s, maGia(), 'K') };
    };
    const b10 = await thu([[600, 5], [900, 5]]);
    k('B2 SĐT đã 10 lượt sai trên mã App trong giờ → mã App đúng vẫn 429', la(b10.r, 429, 'QUA_NHIEU_LAN'), moTa(b10.r));
    const b9 = await thu([[600, 5], [900, 4]]);
    k('B2 SĐT mới 9 lượt sai → 200', la(b9.r, 200), moTa(b9.r));
    const c = await capMa(b10.s);
    const q = await xacMinh(b10.s, c.j.ma, 'K');
    k('B2 cùng SĐT bị khoá lối App → mã QUẦY cấp vẫn 200', la(q, 200), moTa(q));
  });

  muc('[B3] hằng số giới hạn đặt một chỗ có tên');
  await chay('B3', async () => {
    let src = '';
    try { src = fs.readFileSync(path.join(GOC, 'server', 'utils', 'maKhach.js'), 'utf8'); } catch { /* chưa có */ }
    const m = src.match(/const GIOI_HAN = \{([^}]*)\}/);
    const khoa = m ? [...m[1].matchAll(/([A-Z_]+)\s*:/g)].map((x) => x[1]) : [];
    const thieu = khoa.filter((x) => !src.includes('GIOI_HAN.' + x));
    k('B3 maKhach.js có GIOI_HAN và MỌI khoá của nó được dùng', khoa.length >= 6 && thieu.length === 0, m ? 'không dùng: ' + thieu.join(', ') : 'không thấy const GIOI_HAN = {');
  });

  muc('[C] chế độ gửi mã GUI_MA_KHACH');
  await chay('C', async () => {
    const q = sdtMoi(); const c = await capMa(q);
    delete process.env.GUI_MA_KHACH;
    const truoc = maGia();
    const r = await xinMa(q);
    const d = await dongMa(q);
    k('C không đặt GUI_MA_KHACH → như quay: lay_ma_tai_quay true, không gửi', la(r, 200) && r.j.lay_ma_tai_quay === true && maGia() === truoc, moTa(r));
    k('C dòng mã App ở chế độ quay bị huỷ ngay khi chèn', !!d && d.nguon === 'gui' && !!d.huy_luc, d ? `${d.nguon} · ${d.huy_luc}` : '');
    const v = await xacMinh(q, c.j.ma, 'K');
    k('C mã quầy cấp TRƯỚC đó vẫn xác minh được', la(v, 200), moTa(v));
    process.env.GUI_MA_KHACH = 'xyz';
    soCanhBao = 0;
    const x = await xinMa(sdtMoi());
    k('C GUI_MA_KHACH lạ → như quay + đúng 1 dòng cảnh báo', la(x, 200) && x.j.lay_ma_tai_quay === true && soCanhBao === 1, `${moTa(x)} · ${soCanhBao} cảnh báo`);
    process.env.GUI_MA_KHACH = 'gia';
    const g = sdtMoi(); const rg = await xinMa(g); const dg = await dongMa(g);
    k('C gia → lay_ma_tai_quay false, mã gửi được, dòng không huỷ', la(rg, 200) && rg.j.lay_ma_tai_quay === false && !!maGia() && !!dg && dg.huy_luc === null, moTa(rg));
  });

  muc('[D] quầy cấp mã POST /api/pos/kh/cap-ma');
  await chay('D', async () => {
    const s = sdtMoi();
    const khong = await goi('POST', '/pos/kh/cap-ma', { sdt: s });
    k('D không token → 401', khong.status === 401, moTa(khong));
    const kh = await dangNhap();
    const tkKh = await capMa(s, kh.tk);
    k('D token khách → 401', tkKh.status === 401, moTa(tkKh));
    const c = await capMa(s);
    const d = await dongMa(s);
    k('D nhân viên staff → 200 + mã 6 chữ số + het_han_giay 300', la(c, 200) && /^\d{6}$/.test(String(c.j.ma)) && c.j.het_han_giay === 300, moTa(c));
    k('D dòng nguon quay, cap_boi = username', !!d && d.nguon === 'quay' && d.cap_boi === 'thu_ngan_kh1', d ? `${d.nguon} · ${d.cap_boi}` : '');
    const v = await xacMinh(s, c.j.ma, 'Khách quầy');
    k('D mã quầy cấp xác minh được', la(v, 200), moTa(v));
    const sai = await capMa('abc');
    k('D SĐT sai dạng → 400 SDT_KHONG_HOP_LE', la(sai, 400, 'SDT_KHONG_HOP_LE'), moTa(sai));
  });

  // Hai khách dùng chung cho E / F
  const A = await dangNhap('Khách A');
  const B = await dangNhap('Khách B');

  muc('[E1] GET / PUT /api/kh/toi');
  await chay('E1', async () => {
    const r = await goi('GET', '/kh/toi', undefined, { tk: A.tk });
    const khoa = Object.keys(r.j.khach || {}).sort();
    k('E1 GET /toi → 200, đúng 3 trường sdt · ten · ngay_tao', la(r, 200) && bang(khoa, ['ngay_tao', 'sdt', 'ten']) && r.j.khach.sdt === A.sdt, `${moTa(r)} · ${khoa}`);
    const p = await goi('PUT', '/kh/toi', { ten: ' Tên Đổi ', sdt: B.sdt, phone: B.sdt }, { tk: A.tk });
    const dA = await db.queryOne('SELECT phone, name FROM pos_customers WHERE id = ?', [A.id]);
    k('E1 PUT /toi đổi tên (trim), SĐT KHÔNG đổi dù thân có sdt / phone', la(p, 200) && !!dA && dA.name === 'Tên Đổi' && dA.phone === A.sdt, dA ? `${dA.name} · ${dA.phone}` : '');
    for (const [nhan, ten] of [['rỗng', '  '], ['51 ký tự', 'c'.repeat(51)]]) {
      const x = await goi('PUT', '/kh/toi', { ten }, { tk: A.tk });
      k(`E1 PUT ten ${nhan} → 400 TEN_KHONG_HOP_LE`, la(x, 400, 'TEN_KHONG_HOP_LE'), moTa(x));
    }
  });

  muc('[E2] GET /api/kh/diem = /loyalty/points/:phone (cùng hàm)');
  await chay('E2', async () => {
    const t = getNow();
    await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, expires_at, reason, created_by, created_at)
      VALUES (?, 'earn', 7, NULL, 'thu', 'x', ?), (?, 'earn', 5, '2000-01-01T00:00:00', 'het han', 'x', ?)`, [A.sdt, t, A.sdt, t]);
    const kh = await goi('GET', '/kh/diem', undefined, { tk: A.tk });
    const cu = await goi('GET', `/pos/loyalty/points/${A.sdt}`, undefined, { tk: tkChu });
    k('E2 số dư 7 (dòng hết hạn không tính)', la(kh, 200) && kh.j.points === 7, `${moTa(kh)} · ${kh.j.points}`);
    k('E2 so sâu với route cũ', la(kh, 200) && bang(kh.j, cu.j), `${kh.tho} | ${cu.tho}`);
  });

  muc('[E3] GET /api/kh/voucher = /loyalty/vouchers/:phone (cùng hàm)');
  await chay('E3', async () => {
    const t = getNow();
    for (const [ma, dung] of [['KH1VCON', 0], ['KH1VDUNG', 1]]) {
      await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active, created_at)
        VALUES (?, 'fixed', 5000, 1, ?, 1, ?)`, [ma, dung, t]);
      await db.run(`INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at, expires_at) VALUES (?, ?, 'available', ?, NULL)`, [ma, A.sdt, t]);
    }
    for (const tatCa of ['', '?all=1']) {
      const kh = await goi('GET', '/kh/voucher' + tatCa, undefined, { tk: A.tk });
      const cu = await goi('GET', `/pos/loyalty/vouchers/${A.sdt}${tatCa}`, undefined, { tk: tkChu });
      k(`E3 ${tatCa || '(còn dùng)'}: data so sâu với route cũ (${(cu.j.data || []).length} voucher)`,
        la(kh, 200) && (cu.j.data || []).length > 0 && bang(kh.j.data, cu.j.data) && kh.j.phone === cu.j.phone, `${kh.tho} | ${cu.tho}`);
    }
  });

  muc('[E4] GET /api/kh/don · /don/:ma — chỉ đơn của mình');
  await chay('E4', async () => {
    const a1 = await donThu(A.sdt);
    const a2 = await taoDon({ customer_phone: A.sdt, customer_name: 'A', items: [mon(2)], payment_method: 'debt', debt_amount: 50000 });
    const b1 = await donThu(B.sdt);
    const r = await goi('GET', '/kh/don', undefined, { tk: A.tk });
    const ma = (r.j.data || []).map((x) => x.ma);
    k('E4 A chỉ thấy 2 đơn của A, mới nhất trước', la(r, 200) && bang(ma, [a2.code, a1.code]), `${moTa(r)} · ${ma}`);
    const n = (r.j.data || []).find((x) => x.ma === a2.code);
    const o2 = await db.queryOne('SELECT total, debt_amount FROM pos_orders WHERE id = ?', [a2.id]);
    k('E4 da_tra bill nợ = total − debt_amount', !!n && n.da_tra === o2.total - o2.debt_amount && n.tong === o2.total, n ? JSON.stringify(n) : '');
    const ct = await goi('GET', `/kh/don/${a2.code}`, undefined, { tk: A.tk });
    const mon0 = (ct.j.don && ct.j.don.mon) || [];
    const it = await db.query('SELECT product_name, quantity, unit_price FROM pos_order_items WHERE order_id = ? ORDER BY id', [a2.id]);
    k('E4 /don/:ma có món: tên, số lượng, đơn giá khớp pos_order_items', la(ct, 200) && mon0.length === it.length && it.length > 0
      && mon0[0].ten === it[0].product_name && mon0[0].so_luong === it[0].quantity && mon0[0].don_gia === it[0].unit_price, ct.tho);
    const lo = await goi('GET', `/kh/don/${b1.code}`, undefined, { tk: A.tk });
    k('E4 A đọc đơn của B → 404 KHONG_THAY_DON', la(lo, 404, 'KHONG_THAY_DON'), moTa(lo));
    const Cn = await dangNhap('Khách nhiều đơn');
    for (let i = 0; i < 21; i++) {
      await db.run(`INSERT INTO pos_orders (code, customer_phone, total, payment_method, status, created_at) VALUES (?, ?, 1000, 'cash', 'completed', ?)`,
        [`KH1TRANG${i}`, Cn.sdt, getNow()]);
    }
    const t1 = await goi('GET', '/kh/don', undefined, { tk: Cn.tk });
    const t2 = await goi('GET', '/kh/don?trang=2', undefined, { tk: Cn.tk });
    k('E4 phân trang: trang 1 có 20 + con_nua, trang 2 có 1 đơn cũ nhất',
      (t1.j.data || []).length === 20 && t1.j.con_nua === true && (t2.j.data || []).length === 1 && t2.j.con_nua === false && t2.j.data[0].ma === 'KH1TRANG0',
      `${(t1.j.data || []).length}/${t1.j.con_nua} · ${(t2.j.data || []).length}/${t2.j.con_nua}`);
  });

  muc('[E5] GET /api/kh/menu — danh sách trắng · hồi quy GET /api/pos/products');
  await chay('E5', async () => {
    for (let i = (await db.queryOne('SELECT COUNT(*) AS n FROM pos_products WHERE is_active = 1')).n; i < 4; i++) {
      await db.run(`INSERT INTO pos_products (code, name, category, price, is_active, sx_product_type, sx_product_id) VALUES (?, ?, 'juice', 20000, 1, 'juice', ?)`,
        [`KH1SP${i}`, `Món thử ${i}`, 900 + i]);
    }
    const ds = await db.query('SELECT id FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 4');
    await db.run('UPDATE pos_products SET ton_gan_nhat = NULL WHERE id = ?', [ds[0].id]);
    await db.run('UPDATE pos_products SET price = 30000, ton_gan_nhat = 3, ton_luc = ? WHERE id = ?', [getNow(), ds[1].id]);
    await db.run('UPDATE pos_products SET price = 30000, ton_gan_nhat = 0 WHERE id = ?', [ds[2].id]);
    await db.run('UPDATE pos_products SET price = 0 WHERE id = ?', [ds[3].id]);
    const giaMoi = await db.query('SELECT * FROM pos_products WHERE is_active = 1');
    const r = await goi('GET', '/kh/menu', undefined, { tk: A.tk });
    const data = r.j.data || [];
    const KHOA = ['con_hang', 'gia', 'ma', 'nhom', 'ten', 'ton_cu', 'ton_luc'];
    k('E5 mỗi món ĐÚNG bộ khoá danh sách trắng', la(r, 200) && data.length > 0 && data.every((x) => bang(Object.keys(x).sort(), KHOA)), data[0] ? Object.keys(data[0]).join(',') : moTa(r));
    const theo = (id) => { const p = giaMoi.find((x) => x.id === id); return data.find((x) => x.ma === `${p.sx_product_type}_${p.sx_product_id}`); };
    k('E5 món giá 0 không có trong menu', !theo(ds[3].id));
    k('E5 con_hang: tồn 3 → true · tồn 0 → false · chưa rõ → null',
      !!theo(ds[1].id) && theo(ds[1].id).con_hang === true && !!theo(ds[2].id) && theo(ds[2].id).con_hang === false && !!theo(ds[0].id) && theo(ds[0].id).con_hang === null,
      JSON.stringify([theo(ds[1].id), theo(ds[2].id), theo(ds[0].id)]));
    const nvR = await goi('GET', '/pos/products', undefined, { tk: tkChu });
    const dvR = await goi('GET', '/pos/products', undefined, { dichVu: true });
    const dung = Array.isArray(nvR.j) && nvR.j.length === giaMoi.length && nvR.j.every((p) => {
      const g = giaMoi.find((x) => x.sx_product_type === p.sx_product_type && String(x.sx_product_id) === String(p.sx_product_id));
      return g && p.price === (g.price ?? null) && p.sellable === (typeof g.price === 'number' && g.price > 0) && p.unique_id === `${g.sx_product_type}_${g.sx_product_id}`;
    });
    k('E5 hồi quy GET /api/pos/products (JWT): giá, sellable, unique_id theo pos_products', dung, nvR.tho.slice(0, 200));
    k('E5 hồi quy GET /api/pos/products (X-Service-Key) = bản JWT', la(dvR, 200) && dvR.tho === nvR.tho, moTa(dvR));
  });

  muc('[E6] POST /api/kh/nhan-ma-bill — logic /claim, SĐT từ token');
  const voucherKH = {};
  await chay('E6', async () => {
    const d1 = await donThu(), d2 = await donThu();
    const r = await goi('POST', '/kh/nhan-ma-bill', { ma: d1.ma, phone: B.sdt, sdt: B.sdt, customer_phone: B.sdt }, { tk: A.tk });
    const m = await db.queryOne('SELECT claimed_phone FROM pos_signup_codes WHERE code = ?', [d1.ma]);
    k('E6 A nhận mã bill (thân có SĐT của B) → 200, claimed_phone = A', la(r, 200) && !!m && m.claimed_phone === A.sdt, `${moTa(r)} · ${m && m.claimed_phone}`);
    Object.assign(voucherKH, await db.queryOne('SELECT * FROM pos_discount_codes WHERE code = ?', [d1.ma]) || {});
    const lai = await goi('POST', '/kh/nhan-ma-bill', { ma: d1.ma }, { tk: B.tk });
    k('E6 mã đã dùng → 409 MA_DA_DUNG', la(lai, 409, 'MA_DA_DUNG'), moTa(lai));
    const sdt2 = await goi('POST', '/kh/nhan-ma-bill', { ma: d2.ma }, { tk: A.tk });
    k('E6 SĐT đã nhận qua mã khác → 400 SDT_DA_NHAN', la(sdt2, 400, 'SDT_DA_NHAN'), moTa(sdt2));
    const no = await taoDon({ items: [mon()], payment_method: 'cho_thu', debt_amount: 25000 });
    const rn = await goi('POST', '/kh/nhan-ma-bill', { ma: no.ma }, { tk: B.tk });
    k('E6 bill chưa thu → 400 BILL_CHUA_THANH_TOAN', la(rn, 400, 'BILL_CHUA_THANH_TOAN'), moTa(rn));
    const d3 = await donThu(); const X = await dangNhap('Đua 1'), Y = await dangNhap('Đua 2');
    let chen = null;
    mocTruocTx = async () => { chen = await goi('POST', '/kh/nhan-ma-bill', { ma: d3.ma }, { tk: X.tk }); imLang(); };
    const sau = await goi('POST', '/kh/nhan-ma-bill', { ma: d3.ma }, { tk: Y.tk });
    mocTruocTx = null;
    k('E6 đua hai khách cùng mã: người chen 200, người sau 409 MA_DA_DUNG', !!chen && la(chen, 200) && la(sau, 409, 'MA_DA_DUNG'), `${chen ? moTa(chen) : '-'} / ${moTa(sau)}`);
    const v = await goi('GET', '/kh/voucher', undefined, { tk: A.tk });
    const moi = (v.j.ma_khach_moi || []).map((x) => x.code);
    k('E3 /voucher liệt kê thêm mã giảm phát qua /claim cho SĐT này (ma_khach_moi)', la(v, 200) && bang(moi, [d1.ma]), `${moTa(v)} · ${moi}`);
    const vB = await goi('GET', '/kh/voucher', undefined, { tk: B.tk });
    k('E3 khách khác không thấy mã đó', la(vB, 200) && bang(vB.j.ma_khach_moi, []), vB.tho);
  });

  muc('[E7] POST /api/kh/nhan-diem — logic /nhan-diem, SĐT từ token');
  await chay('E7', async () => {
    const F = await dangNhap('Khách điểm'), G = await dangNhap('Khách khác');
    const d1 = await donThu(), d2 = await donThu();
    const r = await goi('POST', '/kh/nhan-diem', { ma: d1.ma, phone: G.sdt, sdt: G.sdt }, { tk: F.tk });
    const p = await db.queryOne('SELECT customer_phone, points FROM pos_point_transactions WHERE order_id = ?', [d1.id]);
    const doiChung = await goi('POST', '/pos/signup-codes/nhan-diem', { code: d2.ma, phone: sdtMoi() }, { dichVu: true });
    k('E7 F nhận điểm (thân có SĐT của G) → 200, điểm ghi cho F', la(r, 200) && !!p && p.customer_phone === F.sdt, `${moTa(r)} · ${p && p.customer_phone}`);
    k('H điểm cộng qua App = qua /nhan-diem cũ (cùng cấu hình)', la(doiChung, 200) && r.j.diem_cong === doiChung.j.diem_cong && p.points === doiChung.j.diem_cong,
      `${r.j.diem_cong} | ${doiChung.j.diem_cong}`);
    const lai = await goi('POST', '/kh/nhan-diem', { ma: d1.ma }, { tk: G.tk });
    k('E7 mã đã nhận điểm → 400 MA_DA_NHAN_DIEM', la(lai, 400, 'MA_DA_NHAN_DIEM'), moTa(lai));
    const no = await taoDon({ items: [mon()], payment_method: 'cho_thu', debt_amount: 25000 });
    const rn = await goi('POST', '/kh/nhan-diem', { ma: no.ma }, { tk: G.tk });
    k('E7 bill chưa thu → 400 BILL_CHUA_THANH_TOAN', la(rn, 400, 'BILL_CHUA_THANH_TOAN'), moTa(rn));
    const d3 = await donThu(); const X = await dangNhap('Đua điểm 1'), Y = await dangNhap('Đua điểm 2');
    let chen = null;
    mocTruocTx = async () => { chen = await goi('POST', '/kh/nhan-diem', { ma: d3.ma }, { tk: X.tk }); imLang(); };
    const sau = await goi('POST', '/kh/nhan-diem', { ma: d3.ma }, { tk: Y.tk });
    mocTruocTx = null;
    const nd = await db.queryOne('SELECT COUNT(*) AS n FROM pos_point_transactions WHERE order_id = ?', [d3.id]);
    k('E7 đua hai khách cùng mã: người chen 200, người sau MA_DA_NHAN_DIEM, đúng 1 dòng điểm',
      !!chen && la(chen, 200) && la(sau, 400, 'MA_DA_NHAN_DIEM') && Number(nd.n) === 1, `${chen ? moTa(chen) : '-'} / ${moTa(sau)} · ${nd.n}`);
  });

  muc('[F1] thiếu KH_JWT_SECRET hoặc trùng khoá nhân viên → 503 KH_CHUA_CAU_HINH (đóng)');
  await chay('F1', async () => {
    for (const [nhan, dat] of [['thiếu', () => { delete process.env.KH_JWT_SECRET; }], ['trùng JWT_SECRET', () => { process.env.KH_JWT_SECRET = KHOA_NV; }]]) {
      dat();
      const kq = [await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: sdtMoi() }), await goi('POST', '/kh/dang-nhap/xac-minh', { sdt: A.sdt, ma: '000000' }),
        await goi('GET', '/kh/toi', undefined, { tk: A.tk }), await capMa(sdtMoi())];
      process.env.KH_JWT_SECRET = KHOA_KH;
      k(`F1 khoá ${nhan}: xin-ma · xac-minh · /toi · cap-ma → 503 KH_CHUA_CAU_HINH`, kq.every((x) => la(x, 503, 'KH_CHUA_CAU_HINH')), kq.map(moTa).join(' / '));
    }
  });

  muc('[F2] token khách ↛ /api/pos/* · token nhân viên ↛ /api/kh/* · token không loai kh ↛');
  await chay('F2', async () => {
    const pos = [await goi('GET', '/pos/orders', undefined, { tk: A.tk }), await goi('GET', '/pos/customers', undefined, { tk: A.tk }),
      await goi('GET', `/pos/loyalty/points/${A.sdt}`, undefined, { tk: A.tk })];
    k('F2 token khách gọi /pos/orders · /pos/customers · /pos/loyalty → 401', pos.every((x) => x.status === 401), pos.map(moTa).join(' / '));
    const kh = [await goi('GET', '/kh/toi', undefined, { tk: tkChu }), await goi('GET', '/kh/diem', undefined, { tk: tkChu }), await goi('GET', '/kh/don', undefined, { tk: tkChu })];
    k('F2 token nhân viên gọi /kh/toi · /diem · /don → 401 KH_TOKEN_SAI', kh.every((x) => la(x, 401, 'KH_TOKEN_SAI')), kh.map(moTa).join(' / '));
    for (const [nhan, tt] of [['không có loai', { id: A.id }], ["loai 'nv'", { loai: 'nv', id: A.id }]]) {
      const x = await goi('GET', '/kh/toi', undefined, { tk: jwt.sign(tt, KHOA_KH, { expiresIn: '1h' }) });
      k(`F2 token ký khoá khách nhưng ${nhan} → 401`, la(x, 401, 'KH_TOKEN_SAI'), moTa(x));
    }
    const Z = await dangNhap('Sẽ xoá');
    await db.run('DELETE FROM pos_customers WHERE id = ?', [Z.id]);
    const z = await goi('GET', '/kh/toi', undefined, { tk: Z.tk });
    k('F2 token của khách đã bị xoá → 401', la(z, 401, 'KH_TOKEN_SAI'), moTa(z));
    const khong = await goi('GET', '/kh/toi');
    k('F2 không token → 401', la(khong, 401, 'KH_TOKEN_SAI'), moTa(khong));
  });

  muc('[F3] SĐT trong tham số / thân bị BỎ QUA');
  await chay('F3', async () => {
    const q = `?sdt=${B.sdt}&phone=${B.sdt}&customer_phone=${B.sdt}`;
    const toi = await goi('GET', '/kh/toi' + q, undefined, { tk: A.tk });
    const diem = await goi('GET', '/kh/diem' + q, undefined, { tk: A.tk });
    const vc = await goi('GET', '/kh/voucher' + q, undefined, { tk: A.tk });
    const don = await goi('GET', '/kh/don' + q, undefined, { tk: A.tk });
    k('F3 /toi ?sdt=B → vẫn A', la(toi, 200) && toi.j.khach.sdt === A.sdt, toi.tho);
    k('F3 /diem ?phone=B → vẫn A', la(diem, 200) && diem.j.phone === A.sdt, diem.tho);
    k('F3 /voucher ?phone=B → vẫn A', la(vc, 200) && vc.j.phone === A.sdt, vc.tho.slice(0, 120));
    const maA = (await db.query('SELECT code FROM pos_orders WHERE customer_phone = ?', [A.sdt])).map((x) => x.code).sort();
    k('F3 /don ?customer_phone=B → chỉ đơn của A', la(don, 200) && bang((don.j.data || []).map((x) => x.ma).sort(), maA), don.tho.slice(0, 120));
  });

  muc('[G] không lộ: lỗi chỉ { error, code }, không mã băm / token / lỗi nội bộ, log không có mã thô hay token');
  await chay('G', async () => {
    await db.run('ALTER TABLE pos_kh_ma_dang_nhap RENAME TO pos_kh_ma_tam');
    const r = await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: sdtMoi() });
    await db.run('ALTER TABLE pos_kh_ma_tam RENAME TO pos_kh_ma_dang_nhap');
    k('G lỗi máy chủ ở /kh → 500 LOI_MAY_CHU, không lộ lời báo của kho', la(r, 500, 'LOI_MAY_CHU') && !/no such table|pos_kh_ma/i.test(r.tho), r.tho);
    const d = await donThu();
    mocTruocTx = async () => { throw new Error('LOI_NOI_BO_KH1'); };
    const kh = await goi('POST', '/kh/nhan-ma-bill', { ma: d.ma }, { tk: B.tk });
    mocTruocTx = async () => { throw new Error('LOI_NOI_BO_KH1'); };
    const cu = await goi('POST', '/pos/signup-codes/claim', { code: d.ma, phone: sdtMoi() }, { dichVu: true });
    mocTruocTx = null;
    k('G /kh/nhan-ma-bill lỗi nội bộ → 500 không lộ lời báo', kh.status === 500 && !kh.tho.includes('LOI_NOI_BO_KH1'), kh.tho);
    k('G /claim cũ vẫn trả lời báo như trước (hành vi cũ không đổi)', cu.status === 500 && cu.j.success === false && cu.j.error === 'LOI_NOI_BO_KH1', cu.tho);
    const loi = thanKh.filter((x) => x.status >= 400);
    const la_ = loi.filter((x) => !Object.keys(x.j).every((kk) => ['error', 'code', 'success'].includes(kk)));
    k(`G mọi thân lỗi /kh (${loi.length}) chỉ có error · code · success`, loi.length > 0 && la_.length === 0, la_.slice(0, 3).map((x) => x.url + ' ' + x.tho).join(' | '));
    const bam = (await db.query('SELECT ma_bam FROM pos_kh_ma_dang_nhap')).map((x) => x.ma_bam).filter((x) => x !== 'x');
    const loBam = thanKh.filter((x) => bam.some((b) => x.tho.includes(b)));
    k('G không thân nào chứa mã băm', bam.length > 0 && loBam.length === 0, loBam.map((x) => x.url).join(', '));
    const loKhoa = thanKh.filter((x) => x.tho.includes(KHOA_KH) || x.tho.includes(KHOA_NV));
    k('G không thân nào chứa khoá ký', loKhoa.length === 0);
    const tokenCap = thanKh.map((x) => x.j.token).filter(Boolean);
    const maCap = [...daCap];
    const loLog = nhatKy.filter((l) => tokenCap.some((t) => l.includes(t)) || maCap.some((m) => new RegExp(`(^|\\D)${m}(\\D|$)`).test(l)));
    k(`G log máy chủ (${nhatKy.length} dòng) không chứa mã thô (${maCap.length}) hay token (${tokenCap.length}) đã cấp`,
      tokenCap.length > 0 && maCap.length > 0 && loLog.length === 0, loLog.slice(0, 2).join(' | '));
  });

  muc('[H] luồng hợp lệ + dịch vụ X-Service-Key cũ chạy như trước');
  await chay('H', async () => {
    const d = await donThu(), s = sdtMoi();
    const cu = await goi('POST', '/pos/signup-codes/claim', { code: d.ma, phone: s }, { dichVu: true });
    const vCu = await db.queryOne('SELECT * FROM pos_discount_codes WHERE code = ?', [d.ma]);
    const COT = ['discount_type', 'discount_value', 'min_order', 'usage_limit', 'used_count', 'valid_from', 'valid_to', 'is_active', 'discount_scope', 'applicable_group_id'];
    k('H /claim cũ qua X-Service-Key → 200', la(cu, 200), moTa(cu));
    k('H voucher phát qua App = phát qua /claim cũ (từng cột)', !!vCu && !!voucherKH.code && COT.every((c) => voucherKH[c] === vCu[c]),
      COT.filter((c) => voucherKH[c] !== (vCu || {})[c]).join(', '));
    const lai = await goi('POST', '/pos/signup-codes/claim', { code: d.ma, phone: sdtMoi() }, { dichVu: true });
    k('H /claim cũ mã đã dùng → 409 MA_DA_DUNG', la(lai, 409, 'MA_DA_DUNG'), moTa(lai));
    for (const url of [`/pos/loyalty/points/${A.sdt}`, `/pos/loyalty/vouchers/${A.sdt}`]) {
      const a = await goi('GET', url, undefined, { dichVu: true }), b = await goi('GET', url, undefined, { tk: tkChu });
      k(`H ${url.split('/').slice(0, 4).join('/')} qua X-Service-Key → 200, = bản JWT`, la(a, 200) && a.tho === b.tho, moTa(a));
    }
    const rong = await goi('POST', '/pos/signup-codes/claim', undefined, { dichVu: true });
    k('H /claim không thân JSON → lỗi do CHÍNH route trả ({ success: false })', rong.j.success === false, `${rong.status} ${rong.tho.slice(0, 80)}`);
    const rongD = await goi('POST', '/pos/signup-codes/nhan-diem', undefined, { dichVu: true });
    k('H /nhan-diem không thân JSON → lỗi do CHÍNH route trả ({ success: false })', rongD.j.success === false, `${rongD.status} ${rongD.tho.slice(0, 80)}`);
  });

  muc('[tĩnh] index.js gắn /api/kh và /api/pos/kh, trust proxy 1 (bài không nạp được index.js — nó tự listen)');
  {
    const src = fs.readFileSync(path.join(GOC, 'server', 'index.js'), 'utf8');
    const iKh = src.indexOf("app.use('/api/kh', require('./routes/kh'))"), iTinh = src.indexOf('app.use(express.static(');
    k("index.js: app.use('/api/kh', require('./routes/kh')) TRƯỚC express.static", iKh >= 0 && iKh < iTinh);
    k("index.js: app.use('/api/pos/kh', require('./routes/kh/quay'))", src.includes("app.use('/api/pos/kh', require('./routes/kh/quay'))"));
    k("index.js: app.set('trust proxy', 1) (Q5)", src.includes("app.set('trust proxy', 1)"));
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
