#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIẢ LẬP QUẦY (TU-CHAY-4) — bài phá thử của cong_cu/gia_lap/
 * ═══════════════════════════════════════════════════════════════════════════
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_gia_lap.js [--gia-lap <thư mục giả lập>]
 *
 *  E1  giả lập trên code thật → ĐẠT, đúng dòng tổng.
 *  E2  13 đột biến trên BẢN SAO server/ (không đụng bản thật), mỗi đột biến bỏ
 *      một chặn có thật → đúng bất biến tương ứng lệch. Chuỗi đột biến không
 *      khớp đúng số lần → HỎNG (không bao giờ đếm là đạt — K3).
 *  E3  A1: từ chối khi có khoá thật / tên miền production; cho qua biến vô hại.
 *  A2  data/ không đổi (kể cả khi KHÔNG có data/), thư mục tạm dọn sạch kể cả
 *      khi giả lập sập.
 *  I2  không có đột biến máy chủ tự nhiên → thử câu SQL bằng kho dữ liệu tay.
 *  E4  (đột biến vào chính giả lập) chạy tay: --gia-lap <bản sao đã phá>.
 *  C3  (HOC-2b) hàm chayBaiThat THẬT cắt từ kiem_tra_truoc_khi_giao.js: xanh mà
 *      quá 80 % hạn → CẢNH BÁO, chỉ khi lời gọi bật cờ (giả lập + bài này).
 *  banSao chép server/ THẬT (dereference) và chỉ ghi khi đích nằm trong thư mục
 *      tạm — server/ là liên kết về kho thật thì từng ghi XUYÊN (HOC-2b, 08.10).
 *
 *  Mọi giả lập con chạy với môi trường ĐÃ LỌC SẠCH, đúng như bộ kiểm gọi.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { Worker } = require('worker_threads');

const GOC = path.join(__dirname, '..');
const iGL = process.argv.indexOf('--gia-lap');
const GL = path.resolve(iGL > 0 ? process.argv[iGL + 1] : path.join(__dirname, 'gia_lap'));
const CHAY = path.join(GL, 'chay.js');
const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'thu_gl_')));
const DONG_DAT = 'Giả lập: 18 kịch bản · 10 bất biến · ĐẠT';

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
    "loai: 'compensation'", "loai: 'den_bu'", 1, 6, 'I4'],
  ['M11 huỷ đơn bỏ cổng trạng thái (huỷ được đơn đã hoàn)', 'routes/orders.js',
    "WHERE id = ? AND status = 'completed'`,\n          [reason ||", "WHERE id = ? AND 1`,\n          [reason ||", 1, 13, 'I11'],
  ['M12 xoá đơn hoàn ví bất kể trạng thái', 'routes/orders.js',
    'if (order.status === "completed") {', 'if (true) {', 1, 14, 'I11'],
  ['M13 duyệt hoàn trả phần ví mẹ vào ví con (Q9)', 'routes/refunds.js',
    'await ghiVi(tx, { phone: me.parent_phone,', 'await ghiVi(tx, { phone: refund.customer_phone,', 1, 17, 'I11'],
];

function banSao(ma, file, goc, thay, soLan) {
  const thu = path.join(TAM, 'dot_bien_' + ma.split(' ')[0]);
  fs.cpSync(path.join(GOC, 'server'), path.join(thu, 'server'), { recursive: true, dereference: true });
  fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(thu, 'node_modules'));
  const p = path.join(thu, 'server', file);
  // HOC-2b: server/ (hay file con) là liên kết về kho thật thì writeFileSync ghi XUYÊN vào code thật (đã xảy ra 08.10).
  if (!fs.realpathSync(p).startsWith(TAM + path.sep)) return { loi: `bản chép ${file} trỏ ra ngoài thư mục tạm — không ghi` };
  const nd = fs.readFileSync(p, 'utf8');
  const co = nd.split(goc).length - 1;
  if (co !== soLan) return { loi: `chuỗi gốc khớp ${co} lần, cần ${soLan} — đột biến không áp được` };
  fs.writeFileSync(p, nd.split(goc).join(thay));
  return { mayChu: path.join(thu, 'server') };
}

// C3: chạy hàm cắt ra trong worker (spawnSync chặn luồng) để bốn ca chạy cùng lúc, không cộng dồn thời gian.
const C3_WORKER = `const { workerData: w, parentPort } = require('worker_threads');
const ghi = { chac: [], canh: [] };
try {
  const fn = new Function('spawnSync', 'path', 'GOC', 'chac', 'canhBao', w.khoi + '\\nreturn chayBaiThat;')(require('child_process').spawnSync,
    require('path'), w.goc, (t, dung) => ghi.chac.push(!!dung), (t, l) => ghi.canh.push(t + ' — ' + l));
  fn(w.bai, undefined, ...w.thamSo);
} catch (e) { ghi.loi = e.message; }
parentPort.postMessage(ghi);`;
const chayC3 = (khoi, goc, bai, thamSo) => new Promise((xong) => {
  const w = new Worker(C3_WORKER, { eval: true, workerData: { khoi, goc, bai, thamSo } });
  w.on('message', xong);
  w.on('error', (e) => xong({ chac: [], canh: [], loi: e.message }));
});

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

  // ── C3 (HOC-2b): TRƯỚC các giả lập con song song — đo thời gian lúc máy rảnh ─────
  console.log('\n[C3] chayBaiThat thật (cắt từ kiem_tra_truoc_khi_giao.js): xanh mà quá 80 % hạn → CẢNH BÁO');
  let kt = '';
  try { kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8'); } catch { /* ca C3e đỏ */ }
  const a3 = kt.indexOf('function chayBaiThat(');
  const khoi = a3 < 0 ? '' : kt.slice(a3, kt.indexOf('\n}\n', a3) + 2);
  const goc3 = path.join(TAM, 'c3');
  fs.mkdirSync(goc3);
  // Hạn giả 5 s → ngưỡng 4 s; bài ngủ 4,5 s: dư ~0,5 s mỗi phía cho node khởi động (bốn worker chạy cùng lúc).
  fs.writeFileSync(path.join(goc3, 'ngu.js'), 'setTimeout(() => {}, 4500);\n');
  fs.writeFileSync(path.join(goc3, 'hong.js'), 'setTimeout(() => process.exit(1), 4500);\n');   // ĐỎ mà CHẬM: đủ điều kiện cảnh báo trừ "xanh"
  fs.writeFileSync(path.join(goc3, 'ngu70.js'), 'setTimeout(() => {}, 3500);\n');   // 70 % hạn giả: ngay DƯỚI ngưỡng (C3a ngay TRÊN, 90 %)
  const c3 = await Promise.all([['ngu.js', [5000, true]], ['ngu.js', [120000, true]], ['hong.js', [5000, true]], ['ngu.js', [5000, false]],
    ['ngu70.js', [5000, true]], ['ngu.js', [5000]]].map(([b, t]) => chayC3(khoi, goc3, b, t)));
  const mo3 = (g) => `chac ${JSON.stringify(g.chac)} · ${g.canh.length} cảnh báo${g.canh.length ? ' (' + g.canh[0] + ')' : ''}${g.loi ? ' · lỗi: ' + g.loi : ''}`;
  k('C3e cắt + dựng được hàm chayBaiThat từ kiem_tra_truoc_khi_giao.js', !!khoi && c3.every((g) => !g.loi), khoi ? c3.map(mo3).join(' | ') : 'không thấy function chayBaiThat(');
  k('C3a bài xanh 4,5 s, hạn giả 5 s (80 % = 4 s), cờ bật → xanh + đúng 1 cảnh báo', c3[0].chac.join() === 'true' && c3[0].canh.length === 1, mo3(c3[0]));
  k('C3b cùng bài, hạn thật 120 s, cờ bật → xanh, 0 cảnh báo', c3[1].chac.join() === 'true' && !c3[1].canh.length, mo3(c3[1]));
  k('C3c bài thoát 1 sau 4,5 s (quá 80 % hạn giả 5 s), cờ bật → FAIL, 0 cảnh báo', c3[2].chac.join() === 'false' && !c3[2].canh.length, mo3(c3[2]));
  k('C3d bài xanh quá 80 % hạn giả nhưng cờ TẮT (bài khác của bộ kiểm) → xanh, 0 cảnh báo', c3[3].chac.join() === 'true' && !c3[3].canh.length, mo3(c3[3]));
  // C3g + C3a kẹp tỉ lệ ngưỡng trong (70 %, 90 %); C3h khoá cờ MẶC ĐỊNH bằng hành vi (gọi 3 đối số, không truyền cờ).
  k('C3g bài xanh 3,5 s (70 % hạn giả 5 s, dưới ngưỡng 80 %), cờ bật → xanh, 0 cảnh báo', c3[4].chac.join() === 'true' && !c3[4].canh.length, mo3(c3[4]));
  k('C3h bài xanh 4,5 s, hạn giả 5 s, KHÔNG truyền cờ (mặc định) → xanh, 0 cảnh báo', c3[5].chac.join() === 'true' && !c3[5].canh.length, mo3(c3[5]));
  // C3f: lời gọi THẬT trong bộ kiểm — đúng hai lời gọi bật cờ (giả lập + bài này), mặc định cờ TẮT. Đối số đọc theo ngoặc cân
  // (lồng ngoặc, xuống dòng đều được); đối số cờ (thứ tư) chỉ được là chữ true/false viết thẳng — bật qua biến là ĐỎ.
  const doiSo = (i) => { // đối số cấp ngoài của lời gọi mở ngoặc tại i
    const ra = ['']; let sau = 0;
    for (let j = i + 1; j < kt.length; j++) {
      const c = kt[j];
      if (c === '(' || c === '[' || c === '{') sau++;
      else if ((c === ')' || c === ']' || c === '}') && sau-- === 0) return ra.map((x) => x.trim());
      else if (c === ',' && sau === 0) { ra.push(''); continue; }
      ra[ra.length - 1] += c;
    }
    return null;
  };
  const goi = [...kt.matchAll(/(function\s+)?\bchayBaiThat\s*\(/g)].filter((m) => !m[1]).map((m) => doiSo(m.index + m[0].length - 1));
  const lech = goi.filter((a) => !a || (a.length > 3 && !/^(true|false)$/.test(a[3])));
  const bat = goi.filter((a) => a && a[3] === 'true').map((a) => a[0]).sort().join(' ');
  k('C3f bộ kiểm: CHỈ giả lập + thu_gia_lap bật cờ (chữ true viết thẳng), mặc định canhGan = false',
    bat === "'cong_cu/gia_lap/chay.js' 'cong_cu/thu_gia_lap.js'" && !lech.length && /function chayBaiThat\([^)]*canhGan = false\)/.test(kt),
    `bật: ${bat || '(không)'} · ${goi.length} lời gọi · cờ không phải chữ true/false: ${lech.map((a) => (a || ['?'])[0]).join(', ') || '(không)'}`);

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
