#!/usr/bin/env node
/**
 * GIAO-3 D1/D2 — ĐO tab Đối soát trên kho giả lập có ĐỘ TRỄ mỗi câu (như Render ↔ Turso), dữ liệu cỡ quầy chạy 30 ngày.
 *   node viec/GIAO-3/do_doisoat.js [--tre 40] [--goc <file doiSoat.js bản gốc>] [--ra <file JSON>]
 * --goc: nạp bản doiSoat.js khác (bản chụp trước khi vá — `git show <sha>:server/utils/doiSoat.js > …`), đường require đổi về server/ thật.
 * --ra: ghi kết quả (trễ 0, đồng hồ cố định) của ba kiểu ra JSON để so bản cũ / bản mới (D2 đối chứng giống hệt).
 * In: số câu, thời gian mỗi kiểu, và (bản cũ chạy tuần tự) số câu từng bất biến.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..', '..');
const thamSo = (ten, md) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : md; };
const TRE = Number(thamSo('--tre', 40));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'do_doisoat_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = { id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO } };
const DateGoc = Date;
const gio = DateGoc.UTC(2026, 10, 17, 9, 0, 0);   // 16:00 giờ VN 17.11.2026
global.Date = class extends DateGoc { constructor(...a) { if (a.length === 0) super(gio); else super(...a); } static now() { return DateGoc.now(); } };
const viet = (s) => process.stdout.write(s + '\n');
const logGoc = console.log;
console.log = console.warn = console.error = () => {};
const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function main() {
  const db = require(path.join(GOC, 'server', 'database.js'));
  await db.initDatabase();
  const { addDaysToDateString } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  // ── Dữ liệu 30 ngày: 60 đơn / ngày (tiền mặt, CK, ví), 2 món, nhật ký thu, dòng ví, dòng điểm; nạp tay; vài đơn lệch thật ──
  const tx = await db.beginTransaction();
  let id = 0;
  for (let n = 0; n < 30; n++) {
    const ngay = addDaysToDateString('2026-11-17', -n);
    for (let i = 0; i < 60; i++) {
      id++;
      const luc = `${ngay}T${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`;
      const sdt = '09' + String(10000000 + (i % 40)).slice(0, 8);
      const cach = ['cash', 'transfer', 'balance'][i % 3];
      const tong = 30000 + (i % 5) * 10000;
      const lech = n === 0 && i < 3;   // đơn lệch thật: tiền trả không khớp tổng
      await tx.run(`INSERT INTO pos_orders (code, customer_phone, customer_name, subtotal, total, payment_method, cash_amount, transfer_amount, balance_amount,
        status, payment_status, created_at, created_by) VALUES (?, ?, 'Khách', ?, ?, ?, ?, ?, ?, ?, 'paid', ?, 'chu')`,
      [`HD${id}`, sdt, tong, tong, cach, cach === 'cash' ? tong - (lech ? 5000 : 0) : 0, cach === 'transfer' ? tong : 0, cach === 'balance' ? tong : 0,
        i % 29 === 0 ? 'cancelled' : 'completed', luc]);
      for (let m = 0; m < 2; m++) {
        await tx.run('INSERT INTO pos_order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, 1, ?, ?)',
          [id, 1 + m, 'Món ' + m, tong / 2, tong / 2]);
      }
      await tx.run('INSERT INTO pos_order_log (order_id, loai, chi_tiet, luc) VALUES (?, ?, ?, ?)', [id, 'thu', JSON.stringify({ cach, so_tien: 0 }), luc]).catch(() => {});
      if (cach === 'balance') {
        await tx.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, order_id, created_at) VALUES (?, 'purchase', ?, ?, ?)`, [sdt, -tong, id, luc]);
      }
      await tx.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, created_at) VALUES (?, 'earn', ?, ?, ?)`, [sdt, tong / 10000, id, luc]).catch(() => {});
    }
    await tx.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, payment_method, created_at) VALUES (?, 'topup', 500000, 'cash', ?)`,
      ['0910000001', `${ngay}T09:00:00`]);
  }
  await tx.commit();

  // ── Độ trễ + đếm câu (chiDoc gọi db.query) ──
  const qGoc = db.query;
  const dem = { cau: 0, tre: TRE };
  db.query = async (sql, p) => { dem.cau++; if (dem.tre) await ngu(dem.tre); return qGoc(sql, p); };

  const fileGoc = thamSo('--goc', null);
  let ds;
  if (fileGoc) {
    const S = path.join(GOC, 'server');
    const chu = fs.readFileSync(fileGoc, 'utf8').replace(/require\('\.\.\/\.\.\//g, `require('${GOC}/`).replace(/require\('\.\.\//g, `require('${S}/`)
      .replace(/require\('\.\//g, `require('${S}/utils/`);
    const tam = path.join(THU_MUC, 'doiSoat_goc.js');
    fs.writeFileSync(tam, chu);
    ds = require(tam);
  } else ds = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));

  // Đếm câu TỪNG bất biến (chỉ đúng khi bản chạy tuần tự): bọc bộ bất biến truyền vào.
  const bb = ds.BAT_BIEN, theoBB = {};
  const boDem = Object.fromEntries(Object.entries(bb).map(([ten, f]) => [ten, async (q, ctx) => { const c0 = dem.cau; try { return await f(q, ctx); } finally { theoBB[ten] = dem.cau - c0; } }]));
  const raJson = {};
  viet(`ĐO ĐỐI SOÁT · trễ ${TRE} ms / câu · ${id} đơn / 30 ngày · bản ${fileGoc ? 'GỐC ' + path.basename(fileGoc) : 'HIỆN TẠI'}`);
  for (const kieu of ['ngay', 'tuan', 'thang']) {
    dem.cau = 0;
    const t0 = DateGoc.now();
    const kq = await ds.chayDoiSoat({ kieu, ngay: '2026-11-17' }, boDem);
    viet(`  ${kieu.padEnd(5)} ${String(DateGoc.now() - t0).padStart(6)} ms · ${dem.cau} câu · đỏ ${kq.so_luong.do} · cần xem ${kq.so_luong.can_xem} · cũ ${kq.so_luong.cu}`);
    if (kieu === 'ngay') viet('        câu theo bất biến: ' + Object.entries(theoBB).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}=${n}`).join(' '));
  }
  if (thamSo('--ra', null)) {
    dem.tre = 0;
    for (const kieu of ['ngay', 'tuan', 'thang']) raJson[kieu] = await ds.chayDoiSoat({ kieu, ngay: '2026-11-17' });
    fs.writeFileSync(thamSo('--ra'), JSON.stringify(raJson, null, 1));
    viet('  đã ghi ' + thamSo('--ra'));
  }
}
main().then(() => { fs.rmSync(THU_MUC, { recursive: true, force: true }); process.exit(0); },
  (e) => { console.log = logGoc; viet('SẬP: ' + (e.stack || e)); fs.rmSync(THU_MUC, { recursive: true, force: true }); process.exit(2); });
