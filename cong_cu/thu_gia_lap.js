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
 *  --chi-du-lieu-tay  CHỈ chạy I2 + LUOI-1 (vài giây) — dùng cho đột biến "nới phép" của bat_bien.js (viec/LUOI-1/dot_bien.py).
 *  LUOI-1  I7 mở rộng, I8 vế đổi điểm, I12–I17 trên kho dữ liệu tay: bộ SẠCH → 0 lệch (K5); mỗi ca lệch ĐÚNG MỘT
 *      phép, cả hai phía (bắt đột biến "nới phép" của bat_bien.js), khớp câu kết luận.
 *  E4  (đột biến vào chính giả lập) chạy tay: --gia-lap <bản sao đã phá>.
 *  T1–T5 (TACH-GL) giả lập chia lượt: các lượt chạy CÙNG LÚC, mỗi KB đúng một lần, cha bị SIGTERM / một lượt sập / cha
 *      bị SIGKILL → không sót tiến trình con, không sót gia_lap_*; dòng cuối luôn là dòng kết luận (cuoi() đọc dòng cuối).
 *      T6: SIGTERM mọi lượt ngay lúc kho vừa tạo → không sót kho (con cài xử lý tín hiệu TRƯỚC khi tạo kho).
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
const SO_KB = 29;
const DONG_DAT = `Giả lập: ${SO_KB} kịch bản · 16 bất biến · ĐẠT`;

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
// TACH-GL: chạy giả lập ĐỦ, theo dõi dòng `lượt k/L pid P` của cha. viec: null (chạy hết) · 'SIGTERM cha' · 'SIGTERM con' ·
// 'SIGKILL cha' — làm khi mọi lượt đã mở kho (đủ L thư mục gia_lap_* có kho.db: con đã cài xử lý tín hiệu). cungLuc = lúc đó
// đủ L pid còn sống — lượt chạy tuần tự thì lượt trước đã xoá kho → không bao giờ đủ L (không dùng ngưỡng giờ). TMPDIR riêng.
const song = (pid) => {
  try { process.kill(pid, 0); } catch { return false; }
  try { return !/^\d+ \(.*\) Z/.test(fs.readFileSync(`/proc/${pid}/stat`, 'utf8')); } catch { return true; }   // xác chết (zombie) = đã chết
};
const chayTheoDoi = (ten, viec) => new Promise((xong) => {
  const tmp = path.join(TAM, ten);
  fs.mkdirSync(tmp);
  const c = spawn(process.execPath, [CHAY], { cwd: GOC, env: { ...SACH, TMPDIR: tmp } });
  const pid = [];
  let ra = '', L = 0, daXet = false, cungLuc = false;
  const doc = (d) => { ra += d; for (const m of ra.matchAll(/lượt \d+\/(\d+) pid (\d+)/g)) if (!pid.includes(+m[2])) { pid.push(+m[2]); L = +m[1]; } };
  c.stdout.on('data', doc);
  c.stderr.on('data', doc);
  const gl = () => fs.readdirSync(tmp).filter((f) => f.startsWith('gia_lap_'));
  const nhin = setInterval(() => {
    if (daXet || viec === 'SIGTERM sớm' || !L || pid.length < L || gl().filter((f) => fs.existsSync(path.join(tmp, f, 'kho.db'))).length < L) return;
    daXet = true;
    cungLuc = pid.every(song);
    if (viec === 'SIGTERM cha') c.kill('SIGTERM');
    if (viec === 'SIGTERM con') process.kill(pid[0], 'SIGTERM');
    if (viec === 'SIGKILL cha') c.kill('SIGKILL');
  }, 100);
  // T6: SIGTERM MỌI con ngay khi thư mục kho đầu tiên xuất hiện (con vừa tạo kho) — khe giữa "tạo kho" và "cài xử lý tín hiệu".
  const som = viec === 'SIGTERM sớm' && setInterval(() => {
    if (daXet || !L || pid.length < L || !gl().length) return;
    daXet = true;
    pid.forEach((p) => { try { process.kill(p, 'SIGTERM'); } catch { /* đã chết */ } });
  }, 5);
  const hen = setTimeout(() => c.kill('SIGKILL'), 110000);
  c.on('close', async (status, tin) => {
    clearInterval(nhin); clearInterval(som); clearTimeout(hen);
    const het = Date.now() + (viec === 'SIGKILL cha' ? 15000 : 0);   // con mồ côi tự thoát khi mất kênh với cha
    let sot = gl(), conSong = pid.filter(song);
    while ((sot.length || conSong.length) && Date.now() < het) { await new Promise((ok) => setTimeout(ok, 200)); sot = gl(); conSong = pid.filter(song); }
    xong({ status, tin, ra: ra.replace(/\x1b\[[0-9;]*m/g, ''), L, pid, daXet, cungLuc, sot, conSong });
  });
});
const moTaT = (r) => `thoát ${r.status ?? r.tin} · ${r.L} lượt · pid ${r.pid.join(',') || '(không có)'} · đã làm ${r.daXet} · cùng lúc ${r.cungLuc} · `
  + `con còn sống ${r.conSong.join(',') || 0} · sót ${r.sot.join(',') || 0} · ${cuoi(r)}`;
const SAP = /^Giả lập: SẬP — /;
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
  if (process.argv.includes('--chi-du-lieu-tay')) return duLieuTay();
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
  // Ngưỡng đúng chữ `han * 0.8` (chủ quán chốt 80 %): C3a/C3g chỉ kẹp tỉ lệ trong (70 %, 90 %) — soát chat 08.10 cài 0,75 / 0,85 vẫn SỐNG.
  const nguong80 = (khoi.match(/\bhan \* 0\.8(?![\d.])/g) || []).length;
  k('C3f bộ kiểm: CHỈ giả lập + thu_gia_lap bật cờ (chữ true viết thẳng), mặc định canhGan = false, ngưỡng đúng han * 0.8',
    bat === "'cong_cu/gia_lap/chay.js' 'cong_cu/thu_gia_lap.js'" && !lech.length && /function chayBaiThat\([^)]*canhGan = false\)/.test(kt)
      && nguong80 === 1,
    `bật: ${bat || '(không)'} · ${goi.length} lời gọi · cờ không phải chữ true/false: ${lech.map((a) => (a || ['?'])[0]).join(', ') || '(không)'} · chữ han * 0.8: ${nguong80} lần`);

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
  const [e1, sap, rongKb, t3, t4, t5, t6, ...dotBien] = await Promise.all([
    chayTheoDoi('e1', null), chayGL(['--may-chu', rong]), chayGL(['--den-kb', '0']),
    chayTheoDoi('t3', 'SIGTERM cha'), chayTheoDoi('t4', 'SIGTERM con'), chayTheoDoi('t5', 'SIGKILL cha'), chayTheoDoi('t6', 'SIGTERM sớm'),
    ...saos.map((s, i) => (s.loi ? null : chayGL(['--may-chu', s.mayChu, '--den-kb', String(DOT_BIEN[i][5])]))),
  ]);
  console.log('\n[E1] giả lập trên code thật');
  k(`thoát 0, dòng tổng đúng "${DONG_DAT}"`, e1.status === 0 && cuoi(e1) === DONG_DAT,
    moTa(e1) + (e1.status ? '\n' + e1.ra.split('\n').filter((l) => / → /.test(l)).slice(0, 8).join('\n') : ''));
  const tongs = e1.ra.split('\n').filter((l) => /Giả lập: \d+ kịch bản/.test(l));
  k('đúng MỘT dòng "Giả lập: … kịch bản" (bánh cóc của bộ kiểm lấy dòng khớp ĐẦU TIÊN)', tongs.length === 1, tongs.join(' | ') || '(không có)');
  console.log('\n[T] giả lập chia lượt (TACH-GL)');
  k('T1 các lượt chạy CÙNG LÚC: khi mọi lượt đã mở kho, đủ L ≥ 2 pid còn sống', e1.daXet && e1.cungLuc && e1.L >= 2, moTaT(e1));
  const daChay = [...e1.ra.matchAll(/^Lượt \d+: KB ([\d,]+)/gm)].flatMap((m) => m[1].split(',').map(Number)).sort((a, b) => a - b);
  k(`T2 mỗi KB 1…${SO_KB} chạy đúng một lần (gộp dòng "Lượt k: KB …")`, daChay.join() === Array.from({ length: SO_KB }, (_, i) => i + 1).join(),
    daChay.join(',') || '(không có dòng Lượt)');
  for (const [ten, r] of [['T3 cha bị SIGTERM', t3], ['T4 một lượt bị SIGTERM (sập)', t4]]) {
    // Mọi lượt bị DỪNG (đóng ≠ 0) — không được chạy hết rồi mới thoát: cha in `lượt k đóng: <mã | tín hiệu>` khi mỗi con đóng.
    const dong = [...r.ra.matchAll(/lượt \d+ đóng: (\S+)/g)].map((m) => m[1]);
    k(`${ten} → cha thoát 2, dòng cuối là dòng SẬP, mọi lượt bị dừng (đóng ≠ 0), mọi con đã chết, không sót gia_lap_*`, r.daXet
      && r.status === 2 && SAP.test(cuoi(r)) && dong.length === r.L && !dong.includes('0') && !r.conSong.length && !r.sot.length,
    `${moTaT(r)} · đóng: ${dong.join(',') || '(không có)'}`);
  }
  k('T0 --den-kb 0 (lượt rỗng: khởi động + dựng dữ liệu, đo khởi động) → thoát 0, "Giả lập: 0 kịch bản · 16 bất biến · ĐẠT"',
    rongKb.status === 0 && cuoi(rongKb) === 'Giả lập: 0 kịch bản · 16 bất biến · ĐẠT', moTa(rongKb));
  k('T5 cha bị SIGKILL (như hẹn 110 s) → mọi con tự thoát trong 15 s, không sót gia_lap_*', t5.daXet && !t5.conSong.length && !t5.sot.length, moTaT(t5));
  k('T6 SIGTERM mọi lượt ngay khi kho đầu tiên vừa tạo → cha thoát 2, dòng cuối là dòng SẬP, mọi con đã chết, không sót gia_lap_*',
    t6.daXet && t6.status === 2 && SAP.test(cuoi(t6)) && !t6.conSong.length && !t6.sot.length, moTaT(t6));
  console.log('\n[A2] kho tạm, data/');
  k('máy chủ hỏng (--may-chu thư mục rỗng) → giả lập sập, thoát 2, dòng cuối là dòng SẬP', sap.status === 2 && SAP.test(cuoi(sap)), moTa(sap));
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

  return duLieuTay();
}

async function duLieuTay() {
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

  // ── LUOI-1: bất biến mới / mở rộng trên kho dữ liệu tay. [tên, bất biến, khung, SQL lệch thêm (null = bộ sạch), mẫu kết luận, ctx] ──
  console.log('\n[LUOI-1] I7 mở rộng · I8 đổi điểm · I12–I17 trên kho dữ liệu tay');
  const KHUNG = {
    I7: ['CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, code TEXT, status TEXT)', 'CREATE TABLE pos_products (id INTEGER PRIMARY KEY, sx_product_type TEXT)',
      'CREATE TABLE pos_order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER)',
      'CREATE TABLE pos_stock_pending (id INTEGER PRIMARY KEY, order_code TEXT, van_tay TEXT, status TEXT)',
      "INSERT INTO pos_orders VALUES (1, 'D1', 'completed')", "INSERT INTO pos_products VALUES (5, 'tra')", 'INSERT INTO pos_order_items VALUES (1, 1, 5)'],
    I8: ["CREATE TABLE pos_settings (key TEXT, value TEXT)", "INSERT INTO pos_settings VALUES ('loyalty_enabled', 'true'), ('loyalty_earn_per_amount', '10000')",
      'CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, code TEXT, total REAL, customer_phone TEXT, flash_discount REAL)',
      'CREATE TABLE pos_signup_codes (id INTEGER PRIMARY KEY, order_id INTEGER, diem_nhan_luc TEXT)',
      'CREATE TABLE pos_point_transactions (id INTEGER PRIMARY KEY, customer_phone TEXT, type TEXT, points INTEGER, order_id INTEGER)',
      'CREATE TABLE pos_voucher_grants (id INTEGER PRIMARY KEY, code TEXT, customer_phone TEXT, reward_id INTEGER, point_tx_id INTEGER)',
      'CREATE TABLE pos_reward_catalog (id INTEGER PRIMARY KEY, points_cost INTEGER, discount_type TEXT, discount_value REAL, max_discount REAL)',
      "INSERT INTO pos_point_transactions VALUES (1, 'S', 'redeem', -3, NULL)", "INSERT INTO pos_reward_catalog VALUES (1, 3, 'fixed', 5000, 2000)",
      "INSERT INTO pos_voucher_grants VALUES (1, 'MA1', 'S', 1, 1)"],
    I13: ['CREATE TABLE pos_discount_codes (code TEXT, usage_limit INTEGER, used_count INTEGER, discount_type TEXT, discount_value REAL)',
      'CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, discount_code TEXT, discount_type TEXT, discount_value REAL, discount_amount REAL)',
      "INSERT INTO pos_discount_codes VALUES ('A', 1, 1, 'percent', 10), ('B', 5, 2, 'fixed', 5000), ('C', 0, 2, 'fixed', 3000)",
      "INSERT INTO pos_orders VALUES (7, 'C', 'fixed', 3000, 3000), (8, 'C', 'fixed', 3000, 3000)",
      "INSERT INTO pos_orders VALUES (1, 'a', 'percent', 10, 2500), (2, 'A', NULL, 0, 0), (3, 'B', 'fixed', 5000, 5000), (4, 'A', 'percent', 5, 1250), (6, 'A', 'fixed', 10, 10)"],
    I14: ['CREATE TABLE pos_customer_packages (id INTEGER PRIMARY KEY, status TEXT, total_qty INTEGER, delivered_qty INTEGER, order_id INTEGER)',
      'CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, code TEXT, status TEXT, customer_package_id INTEGER)',
      'CREATE TABLE pos_order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, unit_price REAL, quantity INTEGER)',
      "INSERT INTO pos_customer_packages VALUES (1, 'active', 5, 3, 10), (2, 'active', 10, 1, NULL), (3, 'cancelled', 3, 2, 13), (7, 'active', 3, 0, 17)",
      "INSERT INTO pos_orders VALUES (10, 'MUA', 'completed', 1), (11, 'LAY', 'completed', 1), (12, 'LAYHUY', 'cancelled', 1), (13, 'MUAHUY', 'cancelled', 3), (16, 'LE', 'completed', NULL), (17, 'MUA0', 'completed', NULL)",
      'INSERT INTO pos_order_items VALUES (1, 10, -1, 300000, 1), (2, 10, 5, 0, 1), (3, 11, 5, 0, 2), (4, 12, 5, 0, 1), (5, 11, 6, 25000, 1), (6, 11, -1000001, 0, 1), (7, 16, 5, 25000, 1), (8, 17, -1, 300000, 1)'],
    I15: ['CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, code TEXT, status TEXT, customer_phone TEXT)',
      'CREATE TABLE pos_order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER)',
      'CREATE TABLE pos_membership_purchases (id INTEGER PRIMARY KEY, order_id INTEGER)',
      "INSERT INTO pos_orders VALUES (1, 'THE', 'completed', 'S'), (2, 'THEHUY', 'cancelled', 'S'), (3, 'THEKHONGSDT', 'completed', NULL), (4, 'THUONG', 'completed', 'S'), (5, 'THESDTRONG', 'completed', '')",
      'INSERT INTO pos_order_items VALUES (1, 1, -1000001), (2, 2, -1000001), (3, 3, -1000001), (4, 4, 5), (5, 5, -1000001)', 'INSERT INTO pos_membership_purchases VALUES (1, 1)'],
    I16: ['CREATE TABLE pos_orders (id INTEGER PRIMARY KEY, code TEXT, cash_amount REAL, transfer_amount REAL)',
      'CREATE TABLE pos_order_log (id INTEGER PRIMARY KEY, order_id INTEGER, loai TEXT, chi_tiet TEXT)',
      "INSERT INTO pos_orders VALUES (1, 'D1', 25000, 0), (2, 'D2', 0, 20000)",
      `INSERT INTO pos_order_log VALUES (1, 1, 'doi', '{"sang":"transfer","so_tien":25000}'), (2, 1, 'thu', NULL), (3, 1, 'doi', '{"sang":"cash","so_tien":25000}'),
        (4, 2, 'doi', '{"sang":"transfer","so_tien":20000}')`],
    I17: ['CREATE TABLE pos_refund_requests (id INTEGER PRIMARY KEY, order_id INTEGER, customer_phone TEXT, refund_amount REAL, status TEXT, balance_transaction_id INTEGER)',
      'CREATE TABLE pos_balance_transactions (id INTEGER PRIMARY KEY, type TEXT, order_id INTEGER, customer_phone TEXT, amount REAL)',
      "INSERT INTO pos_refund_requests VALUES (1, 7, 'S', 30000, 'approved', 9), (2, 8, 'S', 5000, 'pending', NULL)",
      "INSERT INTO pos_balance_transactions VALUES (9, 'refund', 7, 'S', 30000)"],
  };
  KHUNG.I12 = KHUNG.I8.slice(2).concat(['CREATE TABLE pos_discount_codes (code TEXT, discount_type TEXT, discount_value REAL, usage_limit INTEGER, max_discount REAL)',
    "INSERT INTO pos_discount_codes VALUES ('MA1', 'fixed', 5000, 1, 2000)"]);
  const VT = 'POS:1:out:0';
  const sx = (nhan, hong, bat = [5]) => ({ nhanKho: nhan.map((v) => ({ van_tay: v })), sxGia: { hong: hong.map(([v, kb]) => ({ van_tay: v, kb })), kbBat: new Set(bat) } });
  const no = (v, tt = 'pending') => `INSERT INTO pos_stock_pending (order_code, van_tay, status) VALUES ('D1', ${v ? `'${v}'` : 'NULL'}, '${tt}')`;
  const QUAY = (tang = [], giao = []) => ({ soQuay: { tangMa: new Map(tang), giaoGoi: new Map(giao) } });
  const CA = [
    ['I7 sạch: SX nhận đúng 1', 'I7', 'I7', [], null, sx([VT], [])],
    ['I7 sạch: SX lỗi → đúng 1 dòng nợ chờ đẩy', 'I7', 'I7', [no(VT)], null, sx([], [[VT, 5]])],
    ['I7 sạch: nợ đã đẩy xong + SX nhận 1', 'I7', 'I7', [no(VT, 'resolved')], null, sx([VT], [[VT, 5]])],
    ['I7 sạch: đơn đã xoá — lỗi out + in, mỗi cái 1 dòng nợ', 'I7', 'I7', [no('POS:9:out:0'), no('POS:9:in:0')], null,
      { ...sx([VT], [['POS:9:out:0', 5], ['POS:9:in:0', 6]], [5, 6]) }],
    ['I7 SX nhận 2 lần (phía trên)', 'I7', 'I7', [], /SX nhận 2 lần/, sx([VT, VT], [])],
    ['I7 SX nhận 0, không nợ (phía dưới)', 'I7', 'I7', [], /SX nhận 0 lần$/, sx([], [])],
    ['I7 SX nhận 1 VÀ còn nợ chờ đẩy', 'I7', 'I7', [no(VT)], /nợ kho chưa xong 1 dòng/, sx([VT], [[VT, 5]])],
    ['I7 nợ đã xong nhưng SX nhận 0 (đơn đã xoá)', 'I7', 'I7', [no('POS:9:in:0', 'resolved')], /nợ kho POS:9:in:0 đã xong 1 dòng, SX nhận 0 lần/,
      sx([VT], [['POS:9:in:0', 5]])],
    ['I7 SX lỗi (đơn đã xoá) mà không có dòng nợ', 'I7', 'I7', [], /sổ nợ kho có 0 dòng/, sx([VT], [['POS:9:in:0', 5]])],
    ['I7 SX lỗi một lần mà 2 dòng nợ cùng vân tay', 'I7', 'I7', [no('POS:9:in:0'), no('POS:9:in:0')], /sổ nợ kho có 2 dòng/, sx([VT], [['POS:9:in:0', 5]])],
    ['I7 dòng nợ không có lần SX lỗi', 'I7', 'I7', [no('POS:9:in:0')], /không có lần SX lỗi tương ứng/, sx([VT], [])],
    ['I7 dòng nợ không vân tay', 'I7', 'I7', [no(null)], /nợ kho KHÔNG vân tay/, sx([VT], [])],
    ['I7 dòng nợ không vân tay, SX giả cũng ghi lỗi không vân tay', 'I7', 'I7', [no(null)], /nợ kho KHÔNG vân tay/, sx([VT], [[null, 5]])],
    ['I7 SX lỗi ở kịch bản không bật công tắc', 'I7', 'I7', [no('POS:9:in:0')], /không bật công tắc lỗi/, sx([VT], [['POS:9:in:0', 5]], [])],
    ['I8 sạch: dòng đổi điểm −3 ↔ một quà giá 3', 'I8', 'I8', [], null, {}],
    ['I8 đổi trừ 2 điểm (ít hơn giá)', 'I8', 'I8', ['UPDATE pos_point_transactions SET points = -2'], /-2 điểm, 1 quà trỏ tới, quà giá 3/, {}],
    ['I8 đổi trừ 4 điểm (nhiều hơn giá)', 'I8', 'I8', ['UPDATE pos_point_transactions SET points = -4'], /-4 điểm, 1 quà trỏ tới, quà giá 3/, {}],
    ['I8 dòng đổi không quà nào trỏ tới', 'I8', 'I8', ['UPDATE pos_voucher_grants SET point_tx_id = 99'], /0 quà trỏ tới/, {}],
    ['I8 dòng đổi 0 điểm không quà nào trỏ tới (chỉ vế số quà)', 'I8', 'I8', ['UPDATE pos_point_transactions SET points = 0', 'UPDATE pos_voucher_grants SET point_tx_id = 99'], /0 điểm, 0 quà trỏ tới/, {}],
    ['I8 hai quà trỏ một dòng đổi', 'I8', 'I8', ["INSERT INTO pos_voucher_grants VALUES (2, 'MA2', 'S', 1, 1)"], /2 quà trỏ tới/, {}],
    ['I8 loại dòng điểm lạ', 'I8', 'I8', ["INSERT INTO pos_point_transactions VALUES (2, 'S', 'tang', 5, NULL)"], /loại dòng điểm lạ "tang"/, {}],
    ['I8 dòng điểm không có loại (NULL)', 'I8', 'I8', ["INSERT INTO pos_point_transactions VALUES (2, 'S', NULL, 5, NULL)"], /loại dòng điểm lạ "null"/, {}],
    ['I12 sạch: quà ↔ dòng redeem cùng SĐT, mã đúng trị giá, dùng 1 lần', 'I12', 'I12', [], null, {}],
    ['I12 quà trỏ dòng không phải redeem', 'I12', 'I12', ["UPDATE pos_point_transactions SET type = 'earn'"], /dòng điểm earn/, {}],
    ['I12 dòng redeem của SĐT khác', 'I12', 'I12', ["UPDATE pos_point_transactions SET customer_phone = 'KHAC'"], /mã MA1/, {}],
    ['I12 dòng redeem −2 (ít hơn giá)', 'I12', 'I12', ['UPDATE pos_point_transactions SET points = -2'], /dòng điểm redeem -2 \(giá 3\)/, {}],
    ['I12 dòng redeem −4 (nhiều hơn giá)', 'I12', 'I12', ['UPDATE pos_point_transactions SET points = -4'], /dòng điểm redeem -4 \(giá 3\)/, {}],
    ['I12 mã trùng hai dòng (chỉ vế số mã)', 'I12', 'I12', ["INSERT INTO pos_discount_codes VALUES ('MA1', 'fixed', 5000, 1, 2000)"], /, 2 mã fixed 5000/, {}],
    ['I12 mã mất trần giảm (0 thay vì 2.000)', 'I12', 'I12', ['UPDATE pos_discount_codes SET max_discount = 0'], /trần 0 \(quà 2000\)/, {}],
    ['I12 mã trần 1.999 (thấp hơn quà 1)', 'I12', 'I12', ['UPDATE pos_discount_codes SET max_discount = 1999'], /trần 1999 \(quà 2000\)/, {}],
    ['I12 mã trần 2.001 (cao hơn quà 1 — khách được giảm thêm)', 'I12', 'I12', ['UPDATE pos_discount_codes SET max_discount = 2001'], /trần 2001 \(quà 2000\)/, {}],
    ['I12 mã trị giá 4.999', 'I12', 'I12', ['UPDATE pos_discount_codes SET discount_value = 4999'], /fixed 4999 \(quà fixed 5000\)/, {}],
    ['I12 mã trị giá 5.001', 'I12', 'I12', ['UPDATE pos_discount_codes SET discount_value = 5001'], /fixed 5001 \(quà fixed 5000\)/, {}],
    ['I12 mã loại % thay cố định', 'I12', 'I12', ["UPDATE pos_discount_codes SET discount_type = 'percent'"], /percent 5000/, {}],
    ['I12 mã dùng tối đa 2', 'I12', 'I12', ['UPDATE pos_discount_codes SET usage_limit = 2'], /dùng tối đa 2/, {}],
    ['I12 mã dùng tối đa 0 (không giới hạn)', 'I12', 'I12', ['UPDATE pos_discount_codes SET usage_limit = 0'], /dùng tối đa 0/, {}],
    ['I13 sạch: đơn đã áp + lượt tay; đơn gõ mã không áp (trống / cùng loại khác trị giá / khác loại cùng trị giá) không tính; mã không giới hạn dùng 2 lần', 'I13', 'I13', [], null, QUAY([['B', 1]])],
    ['I13 dùng 0, có 1 đơn đã áp (phía dưới)', 'I13', 'I13', ["UPDATE pos_discount_codes SET used_count = 0 WHERE code = 'A'"], /mã A: đã dùng 0\/1, đơn đã áp 1/, QUAY([['B', 1]])],
    ['I13 dùng 3, 1 đơn + 1 tay (phía trên)', 'I13', 'I13', ["UPDATE pos_discount_codes SET used_count = 3 WHERE code = 'B'"], /mã B: đã dùng 3\/5, đơn đã áp 1 \+ quầy tăng tay 1/, QUAY([['B', 1]])],
    ['I13 vượt giới hạn dù khớp số đơn', 'I13', 'I13', ["UPDATE pos_discount_codes SET used_count = 2 WHERE code = 'A'", "INSERT INTO pos_orders VALUES (5, 'A', 'percent', 10, 2500)"], /mã A: đã dùng 2\/1, đơn đã áp 2/, QUAY([['B', 1]])],
    ['I14 sạch: mua lấy ngay, lấy (+ thẻ 0đ), lấy đã huỷ, gói tay + /deliver, gói huỷ, đơn lẻ, mua không lấy ngay', 'I14', 'I14', [], null, QUAY([], [[2, 1]])],
    ['I14 đã giao 4 > đơn 3 (phía trên)', 'I14', 'I14', ['UPDATE pos_customer_packages SET delivered_qty = 4 WHERE id = 1'], /gói #1: đã giao 4, đơn lấy từ gói 3/, QUAY([], [[2, 1]])],
    ['I14 đã giao 2 < đơn 3 (phía dưới)', 'I14', 'I14', ['UPDATE pos_customer_packages SET delivered_qty = 2 WHERE id = 1'], /gói #1: đã giao 2, đơn lấy từ gói 3/, QUAY([], [[2, 1]])],
    ['I14 /deliver không ghi sổ quầy', 'I14', 'I14', [], /gói #2: đã giao 1, đơn lấy từ gói 0 \+ quầy giao tay 0/, QUAY()],
    ['I14 đã giao vượt tổng', 'I14', 'I14', ["INSERT INTO pos_customer_packages VALUES (4, 'cancelled', 2, 3, NULL)"], /gói #4: đã giao 3 > tổng 2/, QUAY([], [[2, 1]])],
    ['I14 gói của đơn mua đã huỷ còn dùng được', 'I14', 'I14', ["INSERT INTO pos_customer_packages VALUES (5, 'active', 3, 0, 13)"], /gói #5 \(active\) của đơn mua #13 đã huỷ/, QUAY([], [[2, 1]])],
    ['I14 gói của đơn mua đã xoá còn dùng được', 'I14', 'I14', ["INSERT INTO pos_customer_packages VALUES (5, 'active', 3, 0, 99)"], /của đơn mua #99 đã xoá/, QUAY([], [[2, 1]])],
    ['I14 đơn trỏ gói không còn', 'I14', 'I14', ["INSERT INTO pos_orders VALUES (14, 'MOCOI', 'cancelled', 77)"], /đơn MOCOI trỏ gói #77 không còn/, QUAY([], [[2, 1]])],
    ['I14 đơn mua gói lấy ngay không trỏ gói của nó', 'I14', 'I14', ["INSERT INTO pos_customer_packages VALUES (6, 'active', 3, 0, 15)",
      "INSERT INTO pos_orders VALUES (15, 'MUA2', 'completed', NULL)", 'INSERT INTO pos_order_items VALUES (9, 15, 5, 0, 1)'], /đơn mua gói MUA2 lấy ngay/, QUAY([], [[2, 1]])],
    ['I15 sạch: đơn thẻ có 1 dòng mua; đơn thẻ đã huỷ / không SĐT / đơn thường không có', 'I15', 'I15', [], null, {}],
    ['I15 đơn thẻ 0 dòng mua (phía dưới)', 'I15', 'I15', ['DELETE FROM pos_membership_purchases'], /đơn mua thẻ THE: 0 dòng/, {}],
    ['I15 đơn thẻ 2 dòng mua (phía trên)', 'I15', 'I15', ['INSERT INTO pos_membership_purchases VALUES (2, 1)'], /đơn mua thẻ THE: 2 dòng/, {}],
    ['I15 dòng mua thẻ của đơn đã huỷ', 'I15', 'I15', ['INSERT INTO pos_membership_purchases VALUES (2, 2)'], /dòng mua thẻ #2 của đơn #2 đã huỷ/, {}],
    ['I15 dòng mua thẻ của đơn không còn', 'I15', 'I15', ['INSERT INTO pos_membership_purchases VALUES (2, 99)'], /dòng mua thẻ #2 của đơn #99 không còn/, {}],
    ['I16 sạch: dòng đổi CUỐI khớp tiền trên đơn (đổi sang tiền mặt; đổi sang chuyển khoản)', 'I16', 'I16', [], null, {}],
    ['I16 đổi sang chuyển khoản mà tiền mặt chưa về 0', 'I16', 'I16', ['UPDATE pos_orders SET cash_amount = 1, transfer_amount = 19999 WHERE id = 2'], /đơn D2: nhật ký đổi sang transfer 20000, đơn ghi tiền mặt 1 · CK 19999/, {}],
    ['I16 đơn vẫn chuyển khoản sau khi đổi sang tiền mặt', 'I16', 'I16', ['UPDATE pos_orders SET cash_amount = 0, transfer_amount = 25000 WHERE id = 1'], /đổi sang cash 25000, đơn ghi tiền mặt 0/, {}],
    ['I16 số tiền đổi 24.999', 'I16', 'I16', [`UPDATE pos_order_log SET chi_tiet = '{"sang":"cash","so_tien":24999}' WHERE id = 3`], /đổi sang cash 24999/, {}],
    ['I16 số tiền đổi 25.001', 'I16', 'I16', [`UPDATE pos_order_log SET chi_tiet = '{"sang":"cash","so_tien":25001}' WHERE id = 3`], /đổi sang cash 25001/, {}],
    ['I16 đổi sang tiền mặt mà CK chưa về 0', 'I16', 'I16', ['UPDATE pos_orders SET cash_amount = 24999, transfer_amount = 1 WHERE id = 1'], /tiền mặt 24999 · CK 1/, {}],
    ['I17 sạch: duyệt gắn đúng dòng refund; yêu cầu chờ không cần', 'I17', 'I17', [], null, {}],
    ['I17 duyệt không gắn dòng sổ', 'I17', 'I17', ['UPDATE pos_refund_requests SET balance_transaction_id = NULL WHERE id = 1'], /gắn dòng sổ \(không có\)/, {}],
    ['I17 gắn dòng không phải refund', 'I17', 'I17', ["UPDATE pos_balance_transactions SET type = 'topup'"], /gắn dòng sổ #9 topup/, {}],
    ['I17 gắn dòng của đơn khác', 'I17', 'I17', ['UPDATE pos_balance_transactions SET order_id = 8'], /yêu cầu hoàn #1/, {}],
    ['I17 gắn dòng của SĐT khác', 'I17', 'I17', ["UPDATE pos_balance_transactions SET customer_phone = 'KHAC'"], /yêu cầu hoàn #1/, {}],
    ['I17 dòng sổ 29.999 (ít hơn)', 'I17', 'I17', ['UPDATE pos_balance_transactions SET amount = 29999'], /refund 29999, hoàn 30000/, {}],
    ['I17 dòng sổ 30.001 (nhiều hơn)', 'I17', 'I17', ['UPDATE pos_balance_transactions SET amount = 30001'], /refund 30001, hoàn 30000/, {}],
  ];
  for (const [i, [tenCa, bb, khung, them, mau, ctx]] of CA.entries()) {
    let ten = tenCa;
    const kt = createClient({ url: 'file:' + path.join(TAM, `luoi1_${i}.db`) });
    let ra;
    try {
      for (const sql of [...KHUNG[khung], ...them]) await kt.execute(sql);
      ra = await BAT_BIEN[bb]((sql, a = []) => kt.execute({ sql, args: a }).then((r) => r.rows), ctx);
    } catch (e) { ra = null; ten += ` — SẬP: ${e.message}`; }
    kt.close();
    k(ten, !!ra && (mau ? ra.length === 1 && mau.test(ra[0]) : ra.length === 0), JSON.stringify(ra));
  }
  return ket();
}

main().catch((e) => { k('bài thử sập', false, e.stack || e.message); ket(); });
