#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIẢ LẬP QUẦY (TU-CHAY-4) — bài phá thử của cong_cu/gia_lap/
 * ═══════════════════════════════════════════════════════════════════════════
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_gia_lap.js [--gia-lap <thư mục giả lập>]
 *
 *  E1  giả lập trên code thật → ĐẠT, đúng dòng tổng.
 *  E2  10 đột biến trên BẢN SAO server/ (không đụng bản thật), mỗi đột biến bỏ
 *      một chặn có thật → đúng bất biến tương ứng lệch. Chuỗi đột biến không
 *      khớp đúng số lần → HỎNG (không bao giờ đếm là đạt — K3).
 *  E3  A1: từ chối khi có khoá thật / tên miền production; cho qua biến vô hại.
 *  A2  data/ không đổi (kể cả khi KHÔNG có data/), thư mục tạm dọn sạch kể cả
 *      khi giả lập sập.
 *  I2  không có đột biến máy chủ tự nhiên → thử câu SQL bằng kho dữ liệu tay.
 *  E4  (đột biến vào chính giả lập) chạy tay: --gia-lap <bản sao đã phá>.
 *
 *  Mọi giả lập con chạy với môi trường ĐÃ LỌC SẠCH, đúng như bộ kiểm gọi.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const GOC = path.join(__dirname, '..');
const iGL = process.argv.indexOf('--gia-lap');
const GL = path.resolve(iGL > 0 ? process.argv[iGL + 1] : path.join(__dirname, 'gia_lap'));
const CHAY = path.join(GL, 'chay.js');
const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'thu_gl_')));
const DONG_DAT = 'Giả lập: 11 kịch bản · 9 bất biến · ĐẠT';

let dat = 0;
const hong = [];
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong.push(ten); console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const ket = () => {
  try { fs.rmSync(TAM, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`\n  ${dat} đạt · ${hong.length} hỏng\n`);
  process.exit(hong.length ? 1 : 0);
};

// Môi trường sạch (Q1 b, chủ quán chốt 02.10.2026). TMPDIR riêng để đếm được thư mục tạm của giả lập.
const SACH = Object.fromEntries(Object.entries(process.env).filter(([t]) => /^(PATH|HOME|LANG|LC_ALL|SYSTEMROOT)$/.test(t)));
SACH.TMPDIR = TAM;
const chayGL = (args = [], them = {}) => new Promise((xong) => {
  const c = spawn(process.execPath, [CHAY, ...args], { cwd: GOC, env: { ...SACH, ...them } });
  let ra = '';
  c.stdout.on('data', (d) => { ra += d; });
  c.stderr.on('data', (d) => { ra += d; });
  const hen = setTimeout(() => c.kill('SIGKILL'), 110000);
  c.on('close', (status) => { clearTimeout(hen); xong({ status, ra: ra.replace(/\x1b\[[0-9;]*m/g, '') }); });
});
const cuoi = (r) => r.ra.trim().split('\n').pop();
const moTa = (r) => `thoát ${r.status} · ${cuoi(r)}`;

// Đột biến: [mã, file trong server/, chuỗi gốc, chuỗi thay, số lần phải khớp, kịch bản, bất biến phải lệch]
const DOT_BIEN = [
  ['M1 pay-debt bỏ chặn thu hai lần', 'routes/orders.js',
    "WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'`", 'WHERE id = ? AND ? IS NOT NULL`', 1, 10, 'I6'],
  ['M2 mã bill bỏ điều kiện đã thanh toán', 'routes/signup-codes.js',
    ' && don.payment_status === TRANG_THAI_DUNG_MA.payment_status', '', 1, 7, 'I1'],
  ['M3 đối soát ví cộng debt_payment (lỗi P21)', 'routes/wallets.js',
    "const LOAI_TINH_VAO_VI = ['topup',", "const LOAI_TINH_VAO_VI = ['debt_payment', 'topup',", 1, 8, 'I4'],
  ['M4 vân tay hoàn kho trùng chiều bán', 'routes/orders.js', ':in:${sttMon}', ':out:${sttMon}', 2, 5, 'I7'],
  ['M5 nhận điểm bỏ chiếm mã', 'routes/signup-codes.js',
    'WHERE id = ? AND diem_nhan_luc IS NULL', 'WHERE id = ?', 1, 11, 'I8'],
  ['M6 pay-debt bỏ nhật ký thu', 'routes/orders.js',
    'await nhatKyDon.ghiNhatKy(Number(id), "thu",', 'false && nhatKyDon.ghiNhatKy(Number(id), "thu",', 1, 3, 'I9'],
  ['M7 đổi cách trả bỏ nhật ký', 'routes/don-mo-rong.js',
    "await ghiNhatKy(id, 'doi',", "false && ghiNhatKy(id, 'doi',", 1, 2, 'I9'],
  ['M8 pay-debt đảo paid/partial', 'routes/orders.js',
    'remainingDebt <= 0 ? "paid" : "partial"', 'remainingDebt <= 0 ? "partial" : "paid"', 1, 3, 'I3'],
  ['M9 loại dòng thu nợ lạ', 'routes/orders.js',
    "'debt_payment', ?, 0, 0", "'tra_no', ?, 0, 0", 1, 4, 'I5'],
  ['M10 báo hỏng hoàn ví ghi loại dòng ngoài danh sách trắng', 'routes/damages.js',
    "VALUES (?, 'compensation',", "VALUES (?, 'den_bu',", 1, 6, 'I4'],
];

function banSao(ma, file, goc, thay, soLan) {
  const thu = path.join(TAM, 'dot_bien_' + ma.split(' ')[0]);
  fs.cpSync(path.join(GOC, 'server'), path.join(thu, 'server'), { recursive: true });
  fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(thu, 'node_modules'));
  const p = path.join(thu, 'server', file);
  const nd = fs.readFileSync(p, 'utf8');
  const co = nd.split(goc).length - 1;
  if (co !== soLan) return { loi: `chuỗi gốc khớp ${co} lần, cần ${soLan} — đột biến không áp được` };
  fs.writeFileSync(p, nd.split(goc).join(thay));
  return { mayChu: path.join(thu, 'server') };
}

async function main() {
  console.log('\nTHỬ GIẢ LẬP QUẦY (TU-CHAY-4)');
  if (!fs.existsSync(CHAY)) {
    k(`E1 có giả lập ${path.relative(GOC, CHAY)}`, false, 'không thấy giả lập — chưa viết hoặc sai đường dẫn');
    return ket();
  }
  const DATA = path.join(GOC, 'data');
  const chup = () => (fs.existsSync(DATA)
    ? fs.readdirSync(DATA).sort().map((f) => `${f}:${fs.statSync(path.join(DATA, f)).mtimeMs}`).join('|') || '(data/ rỗng)'
    : '(không có data/)');
  const dataTruoc = chup();
  const rong = path.join(TAM, 'may_chu_rong');
  fs.mkdirSync(rong);

  // ── E3 / A1 ─────────────────────────────────────────────────────────────
  const TU_CHOI = [['TURSO_DATABASE_URL', 'libsql://gia-tri-1'], ['TURSO_AUTH_TOKEN', 'gia-tri-2'], ['DATABASE_URL', 'gia-tri-3'],
    ['SX_API_URL', 'gia-tri-4'], ['SX_API_URL_THU', 'gia-tri-5'], ['SX_API_KEY', 'gia-tri-6'], ['JWT_SECRET', 'gia-tri-7'],
    ['POS_SERVICE_API_KEY', 'gia-tri-8'], ['BIEN_VO_HAI_A', 'https://KHO.TURSO.IO/x'], ['BIEN_VO_HAI_B', 'https://pos-tuquyduong.io.vn/api']];
  const CHO_QUA = [['NODE_ENV', 'development'], ['GHI_CHU', 'turso cuc bo khong ten mien'], ['npm_package_name', 'pos-system-turso']];
  const hong1 = path.join(TAM, 'hong.json'); fs.writeFileSync(hong1, '{');
  const hong2 = path.join(TAM, 'rong.json'); fs.writeFileSync(hong2, '{"ten_mien_production": []}');
  const [tuChoi, choQua, chHong, chRong] = await Promise.all([
    Promise.all(TU_CHOI.map(([t, g]) => chayGL([], { [t]: g }))),
    Promise.all(CHO_QUA.map(([t, g]) => chayGL(['--chi-kiem-an-toan'], { [t]: g }))),
    chayGL(['--cau-hinh', hong1]), chayGL(['--cau-hinh', hong2]),
  ]);
  console.log('\n[E3] A1 — từ chối khi thấy máy thật, nêu tên biến, không in giá trị');
  TU_CHOI.forEach(([t, g], i) => k(`${t} → thoát 3, kết luận TỪ CHỐI nêu ${t}, không lộ giá trị`,
    tuChoi[i].status === 3 && /TỪ CHỐI/.test(cuoi(tuChoi[i])) && cuoi(tuChoi[i]).includes(t) && !tuChoi[i].ra.includes(g), moTa(tuChoi[i])));
  k('cau_hinh.json hỏng → thoát 3', chHong.status === 3 && /TỪ CHỐI/.test(cuoi(chHong)), moTa(chHong));
  k('ten_mien_production rỗng → thoát 3', chRong.status === 3 && /TỪ CHỐI/.test(cuoi(chRong)), moTa(chRong));
  console.log('\n[E3] K5 — biến vô hại phải KHÔNG bị chặn');
  CHO_QUA.forEach(([t], i) => k(`${t} → qua phép an toàn`, choQua[i].status === 0 && /an toàn: qua/.test(cuoi(choQua[i])), moTa(choQua[i])));

  // ── E1 + A2 + E2 chạy song song (mỗi lần một tiến trình, kho tạm, cổng riêng) ──
  const saos = DOT_BIEN.map(([ma, file, goc, thay, soLan]) => banSao(ma, file, goc, thay, soLan));
  const [e1, sap, ...dotBien] = await Promise.all([
    chayGL(), chayGL(['--may-chu', rong]),
    ...saos.map((s, i) => (s.loi ? null : chayGL(['--may-chu', s.mayChu, '--den-kb', String(DOT_BIEN[i][5])]))),
  ]);
  console.log('\n[E1] giả lập trên code thật');
  k(`thoát 0, dòng tổng đúng "${DONG_DAT}"`, e1.status === 0 && cuoi(e1) === DONG_DAT,
    moTa(e1) + (e1.status ? '\n' + e1.ra.split('\n').filter((l) => / → /.test(l)).slice(0, 8).join('\n') : ''));
  console.log('\n[A2] kho tạm, data/');
  k('máy chủ hỏng (--may-chu thư mục rỗng) → giả lập sập, thoát 2', sap.status === 2, moTa(sap));
  k(`data/ không đổi (${dataTruoc.slice(0, 40)})`, chup() === dataTruoc, chup().slice(0, 80));
  const sot = fs.readdirSync(TAM).filter((f) => f.startsWith('gia_lap_'));
  k('mọi thư mục gia_lap_* đã xoá, kể cả lần sập', sot.length === 0, sot.join(', '));
  console.log('\n[E2] đột biến trên bản sao server/ — đúng bất biến phải lệch');
  DOT_BIEN.forEach(([ma, file, , , , kb, bb], i) => {
    if (saos[i].loi) return k(`${ma} (${file})`, false, saos[i].loi);
    const r = dotBien[i];
    k(`${ma} → KB${kb} → ${bb}`, r.status === 1 && new RegExp(`KB${kb} → ${bb}:`).test(r.ra),
      moTa(r) + ' · ' + (r.ra.split('\n').filter((l) => / → I\d/.test(l)).join(' | ') || 'không có dòng lệch bất biến'));
  });

  // ── I2: kho dữ liệu tay (không có chặn máy chủ nào để bỏ) ───────────────
  console.log('\n[I2] câu SQL mã bill mồ côi trên kho dữ liệu tay');
  const { createClient } = require(require.resolve('@libsql/client', { paths: [GOC] }));
  const kho = createClient({ url: 'file:' + path.join(TAM, 'i2.db') });
  const q = async (sql, a = []) => (await kho.execute({ sql, args: a })).rows;
  await q('CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, code TEXT)');
  await q('CREATE TABLE pos_signup_codes (id INTEGER PRIMARY KEY, code TEXT, order_id INTEGER)');
  await q("INSERT INTO pos_orders (id, code) VALUES (1, 'D1')");
  await q("INSERT INTO pos_signup_codes (code, order_id) VALUES ('MA1', 1)");
  const { BAT_BIEN } = require(path.join(GL, 'bat_bien.js'));
  const sach = await BAT_BIEN.I2(q, {});
  k('mã gắn đơn có thật → I2 ra 0 dòng', sach.length === 0, JSON.stringify(sach));
  await q("INSERT INTO pos_signup_codes (code, order_id) VALUES ('MA2', NULL), ('MA3', 99)");
  const moCoi = await BAT_BIEN.I2(q, {});
  k('mã order_id NULL + mã trỏ đơn không có → I2 ra đúng 2 dòng', moCoi.length === 2, JSON.stringify(moCoi));
  kho.close();
  return ket();
}

main().catch((e) => { k('bài thử sập', false, e.stack || e.message); ket(); });
