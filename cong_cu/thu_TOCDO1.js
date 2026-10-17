#!/usr/bin/env node
// thu_TOCDO1.js — TOC-DO-1: bộ kiểm chỉ chạy tu_chay/thu_cong.js khi có thể cần (phiếu A2, A3).
// TU-CHAY-6 A2 (mục R): phép tĩnh route ghi — cắt khối hai hàm xetBanhCoc + quetRouteGhi của bộ kiểm, chạy trên routes GIẢ (hàm docFile).
// TU-CHAY-7 A1 (mục C): lời gọi thu_cong.js bật cảnh báo gần hạn; A3 (mục D): chú thích số dòng cứng — cắt vùng thật, chạy trên file giả.
// TU-CHAY-8 A1 (mục P): khối thật tự đếm dòng từng phần của thu_cong.js (kiemPhanThuCong + bánh cóc NGUONG_THU_CONG_DON_VI) trên đầu
// ra giả; A4 (mục C): chayBaiThat THẬT — bài thoát 0 mà không in dòng tổng → FAIL "bài không in dòng tổng".
// Cắt khối THẬT từ kiem_tra_truoc_khi_giao.js — từ `function lyDoChayThuCong(` tới hết dòng "bỏ qua thu_cong.js"; bản gốc chưa có hàm
// → khối = dòng gọi trần (luôn chạy → T1, T2, T10 đỏ) — rồi chạy trên kho git tạm, mỗi ca phá ĐÚNG một điều kiện.
// Chạy: node cong_cu/thu_TOCDO1.js [--kiem <bản sao bộ kiểm>]   (--kiem: cho viec/TOC-DO-1/dot_bien.py)
// Mọi lệnh git bỏ GIT_* (hook pre-commit đặt GIT_INDEX_FILE của kho thật) — trừ T11: hook pre-commit THẬT của kho tạm chạy khối.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const GOC = path.join(__dirname, '..');
const iK = process.argv.indexOf('--kiem');
const KIEM = iK > 0 ? path.resolve(process.argv[iK + 1]) : path.join(GOC, 'kiem_tra_truoc_khi_giao.js');
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_tocdo1_'));
let dat = 0;
const hong = [];
const k = (ten, dk, ghi = '') => { if (dk) dat++; else hong.push(ten + (ghi ? ' — ' + String(ghi).slice(0, 300) : '')); };

// ── Khối thật ──────────────────────────────────────────────────────────────
const kt = fs.readFileSync(KIEM, 'utf8');
const a = kt.search(/^function lyDoChayThuCong\(/m); // neo ĐẦU DÒNG: chú thích trong bộ kiểm cũng nhắc tên hàm (đỏ oan lần 1)
const b = a < 0 ? -1 : kt.indexOf('bỏ qua thu_cong.js', a);
const khoi = a >= 0 ? (b < 0 ? '' : kt.slice(a, kt.indexOf('\n', b) + 1))
  : (kt.split('\n').find((d) => /^\s*chayBaiThat\('tu_chay\/thu_cong\.js'\)/.test(d)) || '');
k('E0a thấy đầu khối (function lyDoChayThuCong( ở đầu dòng) hoặc dòng gọi trần (bản gốc)', a >= 0 || !!khoi,
  'không thấy function lyDoChayThuCong( ở đầu dòng, cũng không thấy dòng gọi trần');
k('E0b có đầu khối thì phải có neo cuối "bỏ qua thu_cong.js" sau nó', a < 0 || b >= 0, 'có hàm nhưng thiếu dòng else "bỏ qua thu_cong.js"');
// E1 (soát vòng 1, E13): lời gọi trần sót NGOÀI khối thì bộ kiểm luôn chạy mà các ca dưới vẫn xanh — toàn file đúng 1 lời gọi, nằm trong khối
const GOI = "chayBaiThat('tu_chay/thu_cong.js'";   // tiền tố: TU-CHAY-7 A1 thêm đối số
k('E1 toàn bộ kiểm đúng MỘT lời gọi thu_cong.js và nó nằm trong khối cắt', kt.split(GOI).length === 2 && khoi.includes(GOI),
  `${kt.split(GOI).length - 1} lời gọi trong file · trong khối: ${khoi.includes(GOI)}`);
const BO = 'bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github';
// Chạy khối với GOC = kho tạm; spawnSync bọc môi trường sạch. Trả { goi: số lần gọi chayBaiThat, dong, chac: [[tên, đúng, ghi]] }.
function chay(goc, dayDu, env, goi = () => {}) {
  const kq = { goi: 0, dong: [], chac: [] };
  const sp = (c, ds, o) => spawnSync(c, ds, { ...o, env });
  new Function('spawnSync', 'GOC', 'DAY_DU', 'chayBaiThat', 'dong', 'chac', khoi)(sp, goc, dayDu, (...a) => { kq.goi++; return goi(...a); },
    kq.dong, (t, d, g) => kq.chac.push([t, !!d, g]));
  return kq;
}

// ── Kho git tạm: remote trần origin có main + bản clone đứng ở nhánh viec/X ────
const MT = Object.fromEntries(Object.entries(process.env).filter(([x]) => !/^GIT_/.test(x)));
Object.assign(MT, { HOME: path.join(TAM, 'home'), GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t',
  GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' });
fs.mkdirSync(MT.HOME);
const git = (cwd, ...ds) => {
  const r = spawnSync('git', ds, { cwd, env: MT, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${ds.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
const viet = (d, f, nd) => { const p = path.join(d, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, nd); };
const FILE_GOC = { 'README.md': 'kho thử\n', 'server/a.js': '1\n', 'tu_chay/a.js': '1\n', '.claude/settings.json': '{}\n',
  '.github/workflows/x.yml': 'name: x\n', 'viec/X/phieu.md': 'phiếu\n' };
let n = 0;
function kho() {
  const d = path.join(TAM, 'k' + ++n), goc = path.join(d, 'origin.git'), c = path.join(d, 'kho');
  fs.mkdirSync(c, { recursive: true });
  git(d, 'init', '-q', '--bare', '-b', 'main', goc);
  git(c, 'init', '-q', '-b', 'main');
  for (const [f, nd] of Object.entries(FILE_GOC)) viet(c, f, nd);
  git(c, 'add', '-A'); git(c, 'commit', '-q', '-m', 'goc');
  git(c, 'remote', 'add', 'origin', goc); git(c, 'push', '-q', 'origin', 'main'); git(c, 'checkout', '-q', '-b', 'viec/X');
  return c;
}
const commit = (c, doi) => { for (const [f, nd] of Object.entries(doi)) viet(c, f, nd); git(c, 'add', '-A'); git(c, 'commit', '-q', '-m', 'doi'); };
function ca(ten, c, mong, dayDu = false) { // mong: 'chay' | 'bo'
  let r;
  try { r = chay(c, dayDu, MT); } catch (e) { k(ten, false, 'khối ném: ' + e.message); return; }
  const chi = `gọi ${r.goi} lần · dòng: ${r.dong.map((d) => d.trim()).join(' | ') || '(không)'}`;
  if (mong === 'chay') k(`${ten} → phải CHẠY thu_cong.js`, r.goi === 1, chi);
  else k(`${ten} → phải BỎ QUA, in dòng "${BO}"`, r.goi === 0 && r.dong.some((d) => d.includes(BO)), chi);
}

let c = kho();
ca('T1 clone sạch, HEAD = origin/main', c, 'bo');
c = kho(); commit(c, { 'server/a.js': '2\n', 'viec/X/phieu.md': 'p\n', 'TIEN_DO_X.json': '{}\n', 'tu_chay_ghi.md': 'x\n' });
ca('T2 commit sổ / phiếu / code quầy / tên gần giống tu_chay_ghi.md', c, 'bo');
for (const [t, f] of [['a', 'tu_chay/a.js'], ['b', '.claude/settings.json'], ['c', '.github/workflows/x.yml']]) {
  c = kho(); commit(c, { [f]: 'đổi\n' }); ca(`T3${t} commit đổi ${f}`, c, 'chay');
}
c = kho(); viet(c, 'tu_chay/a.js', 'đổi\n'); git(c, 'add', 'tu_chay/a.js'); ca('T4 chỉ vùng chờ (đã add, chưa commit)', c, 'chay');
c = kho(); viet(c, 'tu_chay/a.js', 'đổi\n'); ca('T5 chỉ cây làm việc (sửa, chưa add)', c, 'chay');
c = kho(); git(c, 'config', 'status.showUntrackedFiles', 'no'); viet(c, 'tu_chay/moi.js', 'x\n');
ca('T6 file mới chưa theo dõi + status.showUntrackedFiles=no', c, 'chay');
c = kho(); ca('T7 không đổi gì + --day-du', c, 'chay', true);
c = kho(); git(c, 'remote', 'remove', 'origin'); ca('T8 không có origin/main', c, 'chay');
const rong = path.join(TAM, 'rong'); fs.mkdirSync(rong); ca('T9 thư mục không phải kho git', rong, 'chay');
c = kho();
{ // origin/main đi trước, đổi tu_chay/ — nhánh chưa gộp: không phải đổi của nhánh
  const m = path.join(path.dirname(c), 'main2');
  git(path.dirname(c), 'clone', '-q', path.join(path.dirname(c), 'origin.git'), m);
  commit(m, { 'tu_chay/a.js': 'main mới\n' }); git(m, 'push', '-q', 'origin', 'main'); git(c, 'fetch', '-q', 'origin');
}
ca('T10 origin/main đi trước có đổi tu_chay/, nhánh chưa gộp', c, 'bo');

// ── T11: hook pre-commit THẬT chạy khối (môi trường do git đặt: GIT_INDEX_FILE), ghi kết quả ra file ──
const HOOK = path.join(TAM, 'hook.js'), KQ = path.join(TAM, 'kq.txt');
fs.writeFileSync(path.join(TAM, 'khoi.js'), khoi);
fs.writeFileSync(HOOK, `const fs = require('fs'); const goi = []; const dong = [];
try { new Function('spawnSync', 'GOC', 'DAY_DU', 'chayBaiThat', 'dong', 'chac', fs.readFileSync(${JSON.stringify(path.join(TAM, 'khoi.js'))}, 'utf8'))(
  require('child_process').spawnSync, process.cwd(), false, () => goi.push(1), dong, () => {}); } catch (e) { dong.push('ném: ' + e.message); }
fs.writeFileSync(${JSON.stringify(KQ)}, goi.length + '\\n' + dong.join('\\n')); process.exit(1);\n`);
function hook(ten, lenh) {
  c = kho(); viet(c, 'tu_chay/a.js', 'đổi\n');
  fs.writeFileSync(path.join(c, '.git/hooks/pre-commit'), `#!${process.execPath}\nrequire(${JSON.stringify(HOOK)});\n`, { mode: 0o755 });
  fs.rmSync(KQ, { force: true });
  spawnSync('git', ['commit', '-q', '-m', 'x', ...lenh], { cwd: c, env: MT, encoding: 'utf8' });
  const ra = fs.existsSync(KQ) ? fs.readFileSync(KQ, 'utf8') : '';
  k(`${ten} → hook phải CHẠY thu_cong.js`, ra.startsWith('1\n'), ra ? ra.replace(/\n/g, ' | ') : 'hook không ghi kết quả');
}
hook('T11a hook pre-commit thật: git commit tu_chay/a.js (index tạm)', ['tu_chay/a.js']);
hook('T11b hook pre-commit thật: git commit -a', ['-a']);

// ── A2 (TU-CHAY-6): khối hai hàm liền nhau `function xetBanhCoc(` … `function quetRouteGhi(` … tới `\n}\n` thứ hai ──
{
  const a2 = kt.search(/^function xetBanhCoc\(/m);
  let b2 = -1;
  if (a2 >= 0) { const m1 = kt.indexOf('\n}\n', a2); b2 = m1 < 0 ? -1 : kt.indexOf('\n}\n', m1 + 3); }
  const khoi2 = a2 >= 0 && b2 >= 0 ? kt.slice(a2, b2 + 3) : '';
  k('R0 thấy function xetBanhCoc( rồi function quetRouteGhi( ở đầu dòng', /^function quetRouteGhi\(/m.test(khoi2), 'không có hai hàm liền nhau trong bộ kiểm');
  // R0b (khuôn E1): bộ kiểm GỌI mỗi hàm đúng một lần ngoài dòng function — đột biến bỏ dòng gọi bắt ở đây, không ở ca cắt hàm
  const goiQuet = kt.split('quetRouteGhi(').length - 1, goiCoc = kt.split('xetBanhCoc(').length - 1;
  k('R0b bộ kiểm gọi quetRouteGhi( và xetBanhCoc( mỗi hàm đúng MỘT lần ngoài dòng function', goiQuet === 2 && goiCoc === 2,
    `quetRouteGhi( ${goiQuet} lần · xetBanhCoc( ${goiCoc} lần (kể cả dòng function)`);
  const nguong = +((/^const NGUONG_ROUTE_GHI_KHONG_LOIGHI = (\d+);/m.exec(kt) || [])[1]);
  k('R0c có hằng NGUONG_ROUTE_GHI_KHONG_LOIGHI = <số> ở đầu dòng', Number.isInteger(nguong), 'không thấy hằng');
  let F = null;
  try { F = khoi2 ? new Function(khoi2 + '\nreturn { xetBanhCoc, quetRouteGhi };')() : null; } catch (e) { k('R0 khối A2 nạp được', false, e.message); }
  if (F) {
    const quet = (files) => F.quetRouteGhi((f) => files[f], Object.keys(files).sort());
    const R = (m, than) => `router.${m}('/x', authenticate, async (req, res) => {\n  try {\n${than}\n  } catch (err) { res.status(500).json({ error: err.message }); }\n});\n`;
    const UPD = "    await run('UPDATE pos_a SET b = ? WHERE id = ?', [1, 2]);";
    let r;
    r = quet({ 'a.js': R('get', UPD) });
    k('R1 GET + run(UPDATE → (a) a.js:3', r.getGhi.join() === 'a.js:3', r.getGhi.join());
    r = quet({ 'a.js': R('get', "    await run(\n      'UPDATE pos_a SET b = 1'\n    );") });
    k('R1b lệnh nhiều dòng (run( dòng 3, UPDATE dòng 4) → (a) a.js:4', r.getGhi.join() === 'a.js:4', r.getGhi.join());
    r = quet({ 'a.js': R('get', "    await run('INSERT INTO pos_log (x) VALUES (?)', [1]);") });
    k('R2 GET + INSERT INTO → (a) có', r.getGhi.length === 1, r.getGhi.join());
    r = quet({ 'a.js': R('get', "    await tx.run('DELETE FROM pos_a WHERE id = ?', [1]);") });
    k('R2b GET + tx.run( + DELETE FROM → (a) có', r.getGhi.length === 1, r.getGhi.join());
    r = quet({ 'a.js': R('get', '    // GET-ghi: đệm tồn kho\n' + UPD) });
    k('R3 // GET-ghi: <lý do> ngay trên dòng run( → miễn', r.getGhi.length === 0, r.getGhi.join());
    r = quet({ 'a.js': R('get', UPD + ' // GET-ghi: cùng dòng') });
    k('R3a // GET-ghi: cùng dòng từ khoá → miễn', r.getGhi.length === 0, r.getGhi.join());
    r = quet({ 'a.js': R('get', "    // GET-ghi: lệnh nhiều dòng\n    await run(\n      'UPDATE pos_a SET b = 1'\n    );") });
    k('R3b // GET-ghi: trên dòng run( của lệnh nhiều dòng → miễn', r.getGhi.length === 0, r.getGhi.join());
    r = quet({ 'a.js': R('get', '    // GET-ghi:\n' + UPD) });
    k('R3c // GET-ghi: lý do RỖNG → vẫn báo', r.getGhi.length === 1, r.getGhi.join());
    r = quet({ 'a.js': R('get', '    // GET-ghi: của route khác\n    await query("SELECT 1");') + R('get', UPD) });
    k('R3d chữ GET-ghi ở route KHÁC cùng file → route này vẫn báo (miễn theo dòng, không theo file)', r.getGhi.length === 1, r.getGhi.join());
    r = quet({ 'a.js': R('get', "    await run('SELECT updated_at FROM pos_a WHERE deleted_from IS NULL');") });
    k('R4 GET chỉ SELECT (updated_at, deleted_from) → không báo', r.getGhi.length === 0 && r.khongLoiGhi.length === 0, r.getGhi.join() + r.khongLoiGhi.join());
    r = quet({ 'a.js': R('get', "    // UPDATE pos_a trong chú thích\n    /* INSERT INTO pos_b\n       nhiều dòng */\n    await run('SELECT 1');") });
    k('R5 UPDATE / INSERT chỉ trong chú thích // và /* */ → không báo', r.getGhi.length === 0 && r.khongLoiGhi.length === 0, r.getGhi.join());
    r = quet({ 'a.js': '/* khối chú thích\n   ba dòng\n */\n' + R('get', UPD) });
    k('R6 khối chú thích nhiều dòng TRƯỚC route → số dòng vẫn đúng (a.js:6)', r.getGhi.join() === 'a.js:6', r.getGhi.join());
    r = quet({ 'a.js': R('post', UPD) });
    k('R7 POST + run(UPDATE không loiGhi → (b) "a.js:1 POST", (a) rỗng', r.khongLoiGhi.join() === 'a.js:1 POST' && r.getGhi.length === 0, r.khongLoiGhi.join());
    r = quet({ 'a.js': R('post', UPD).replace('res.status(500).json({ error: err.message })', 'loiGhi(res, err)') });
    k('R8 POST + loiGhi( trong catch → (b) rỗng', r.khongLoiGhi.length === 0, r.khongLoiGhi.join());
    r = quet({ 'a.js': R('post', "    await query('SELECT 1');") });
    k('R9 POST chỉ SELECT → không phải route ghi', r.khongLoiGhi.length === 0, r.khongLoiGhi.join());
    r = quet({ 'a.js': R('get', UPD) });
    k('R10 GET có ghi thiếu loiGhi → vào CẢ (a) lẫn (b)', r.getGhi.length === 1 && r.khongLoiGhi.length === 1, r.getGhi.join() + ' | ' + r.khongLoiGhi.join());
    r = quet({ 'a.js': R('put', "    await query('SELECT 1');") + "async function phu() {\n  await run('UPDATE pos_a SET b = 1');\n}\n" + R('delete', UPD) });
    k('R10b hàm phụ CÓ lệnh ghi đứng giữa hai route (wallets.js ghiVi) không thuộc route trước → chỉ "a.js:9 DELETE"', r.khongLoiGhi.join() === 'a.js:9 DELETE', r.khongLoiGhi.join());
    r = quet({ 'a.js': 'router.put(\n  "/:id/cancel",\n  authenticate,\n  async (req, res) => {\n    try {\n' + UPD + '\n    } catch (err) { loiGhi(res, err); }\n  },\n);\n' + R('delete', UPD) });
    k('R10c route đóng bằng "},\\n);" (orders.js:1357) không nuốt route sau → chỉ "a.js:10 DELETE"', r.khongLoiGhi.join() === 'a.js:10 DELETE', r.khongLoiGhi.join());
    k('R11 bánh cóc: n = ngưỡng → dung', F.xetBanhCoc(5, 5) === 'dung', String(F.xetBanhCoc(5, 5)));
    k('R11a n = ngưỡng + 1 → canh', F.xetBanhCoc(6, 5) === 'canh', String(F.xetBanhCoc(6, 5)));
    k('R11b n = ngưỡng − 1 → ha', F.xetBanhCoc(4, 5) === 'ha', String(F.xetBanhCoc(4, 5)));
    // K5 — server/routes/ THẬT: không ném, đúng dạng, (a) ⊆ 3 file đã biết (việc quầy thêm GET-ghi làm tập nhỏ đi vẫn xanh), (b) ≤ ngưỡng
    try {
      const d = path.join(GOC, 'server', 'routes');
      const ten = fs.readdirSync(d).filter((x) => x.endsWith('.js')).sort();
      const that = F.quetRouteGhi((f) => fs.readFileSync(path.join(d, f), 'utf8'), ten);
      const dang = [...that.getGhi, ...that.khongLoiGhi].every((x) => /^[\w-]+\.js:\d+/.test(x));
      k('K5 server/routes thật: đúng dạng file.js:dòng · (a) ⊆ {packages, products, sync}.js · (b) ≤ NGUONG', dang
        && that.getGhi.every((x) => /^(packages|products|sync)\.js:/.test(x)) && that.khongLoiGhi.length <= nguong,
        `(a) ${that.getGhi.join(', ')} · (b) ${that.khongLoiGhi.length} / ngưỡng ${nguong}`);
    } catch (e) { k('K5 server/routes thật: khối không ném', false, e.message); }
  }
}

// ── C (TU-CHAY-7 A1): khối THẬT gọi thu_cong.js → hàm chayBaiThat THẬT chạy bài giả ngủ 4,25 s với hạn giả 5 s (85 %), cờ + hạn lấy
// từ lời gọi thật. Bài ngủ cố định nên không rơi dưới 80 % khi máy bận; dưới ngưỡng / bài đỏ / cờ tắt: C3g, C3c, C3d của thu_gia_lap.js.
{
  const a3 = kt.search(/^function chayBaiThat\(/m);
  const khoiC = a3 < 0 ? '' : kt.slice(a3, kt.indexOf('\n}\n', a3) + 3);
  // TU-CHAY-8: bài giả in đủ dòng của 3 phần (T = ngưỡng thật) + dòng tổng như điều phối thật — không thì C3 / A4 đỏ thay cho C1
  const NG = +((/^const NGUONG_THU_CONG_DON_VI = (\d+);/m.exec(kt) || [])[1]) || 3;
  const phan = (i, n, a, T) => `thu_cong phần ${i}/${n}: ${a}/${T} đơn vị · 5 phép · 0 chỗ hỏng`;
  const DU = [phan(1, 3, NG - 2, NG), phan(2, 3, 1, NG), phan(3, 3, 1, NG)];
  fs.writeFileSync(path.join(TAM, 'ngu85.js'), `console.log(${JSON.stringify([...DU, 'thu_cong: 15 phép · 0 chỗ hỏng'].join('\n'))});\n`
    + 'setTimeout(() => {}, 4250);\n');
  const canh = [], xanh = [], goi = [];
  let that = null;
  try {
    that = new Function('spawnSync', 'path', 'GOC', 'chac', 'canhBao', khoiC + '\nreturn chayBaiThat;')(spawnSync, path, TAM,
      (t, d, g) => xanh.push(d ? true : 'false: ' + g), (t, g) => canh.push(`${t} — ${g}`));
  } catch (e) { k('C0 dựng được hàm chayBaiThat thật', false, e.message); }
  if (that) {
    const vo = (bai, env, han, co) => { goi.push({ bai, han, co }); return that('ngu85.js', MT, 5000, co); };
    let r = { chac: [] };
    try { r = chay(kho(), true, MT, vo); } catch (e) { goi.push({ bai: 'khối ném: ' + e.message }); }
    const g = goi[0] || {};
    k('C1 --day-du: lời gọi thật thu_cong.js + bài xanh 85 % hạn → đúng 1 cảnh báo gần hạn có số giây',
      goi.length === 1 && g.bai === 'tu_chay/thu_cong.js' && xanh.join() === 'true' && canh.length === 1
        && /chạy \d+\.\d s > 80 % hạn 5 s/.test(canh[0]), `gọi ${JSON.stringify(goi)} · xanh ${xanh.join()} · cảnh báo: ${canh.join(' | ') || '(không)'}`);
    k('C2 lời gọi thật không nới hạn (bỏ trống hoặc 120000)', goi.length === 1 && [undefined, 120000].includes(g.han), JSON.stringify(goi));
    k('C3 (TU-CHAY-8 A1) đầu ra thật của lời gọi đi vào phép "thu_cong.js đủ phép" của khối → ĐẠT với đủ 3 phần',
      JSON.stringify(r.chac.map((c) => c[1])) === '[true]' && /^thu_cong\.js đủ phép/.test((r.chac[0] || [])[0]), JSON.stringify(r.chac));
    // A4 — chayBaiThat THẬT: thoát 0 mà không in dòng tổng → FAIL đúng lý do; mỗi dạng tổng đang có trong kho → xanh
    const thu1 = (ten, nd) => { fs.writeFileSync(path.join(TAM, ten), nd); xanh.length = 0; canh.length = 0; that(ten, MT, 20000); return xanh.join(); };
    const IM = 'false: bài không in dòng tổng';
    let v = thu1('im.js', 'process.exit(0);\n');
    k('C4a (A4) bài thoát 0 KHÔNG in gì → FAIL "bài không in dòng tổng"', v === IM, v);
    for (const [ten, dong] of [['đạt · hỏng', '  12 đạt · 0 hỏng'], ['đạt · hỏng kèm mã màu', '\x1b[1m3 đạt · 0 hỏng\x1b[0m'],
      ['phép · chỗ hỏng', 'thu_cong_cu: 40 phép · 0 chỗ hỏng'], ['người gác', 'thu_nguoi_gac: 5/5 ca người gác đúng mã · 2 phép khác'],
      ['giả lập (Q2)', 'Giả lập: 32 kịch bản · 18 bất biến']]) {
      v = thu1('tong.js', `console.log(${JSON.stringify(dong)});\n`);
      k(`C4b (A4 K5) bài thoát 0 in dòng tổng dạng ${ten} → xanh`, v === 'true', v);
    }
    for (const [ten, dong] of [['"3 đạt, 0 hỏng" (thiếu ·)', '3 đạt, 0 hỏng'], ['"Giả lập: 32 kịch bản" (thiếu bất biến)', 'Giả lập: 32 kịch bản'],
      ['"phép · chỗ hỏng" không số', 'thu: phép · chỗ hỏng']]) {
      v = thu1('gan.js', `console.log(${JSON.stringify(dong)});\n`);
      k(`C4c (A4) dòng gần giống ${ten} không tính là dòng tổng → FAIL`, v === IM, v);
    }
    v = thu1('do.js', "console.log('1 đạt · 1 hỏng'); console.log('  ✗ ca x'); process.exit(1);\n");
    k('C4d (A4 K5) bài thoát 1 có dòng tổng → FAIL lý do cũ (dòng ✗), không phải "dòng tổng"', /^false: ✗ ca x$/.test(v), v);
  }
}

// ── P (TU-CHAY-8 A1, Q3, Q6): khối THẬT, --day-du, chayBaiThat giả trả đầu ra dựng sẵn → phép "thu_cong.js đủ phép" của khối: đủ phần
// 1..n, cùng n, cùng T, Σ đơn vị = T, T ≥ NGUONG_THU_CONG_DON_VI (ngay dưới đỏ, ngay trên xanh + nhắc NÂNG). Mỗi ca phá ĐÚNG một vế.
{
  const NG = +((/^const NGUONG_THU_CONG_DON_VI = (\d+);/m.exec(kt) || [])[1]);
  k('P0 bộ kiểm có hằng NGUONG_THU_CONG_DON_VI = <số ≥ 3> ở đầu dòng', NG >= 3, `ngưỡng ${NG}`);
  const N = NG >= 3 ? NG : 3;
  const ph = (i, n, a, T) => `thu_cong phần ${i}/${n}: ${a}/${T} đơn vị · 7 phép · 0 chỗ hỏng`;
  const TONG = 'thu_cong: 21 phép · 0 chỗ hỏng';
  const pP = (ten, dong, mong, them = '') => {
    let r = { chac: [], dong: [] };
    try { r = chay(TAM, true, MT, () => dong.join('\n') + '\n'); } catch (e) { r.chac.push(['khối ném', false, e.message]); }
    const c = r.chac.filter((x) => /^thu_cong\.js đủ phép/.test(x[0]));
    const nang = r.dong.some((d) => d.includes(`NÂNG NGUONG_THU_CONG_DON_VI lên ${N + 1}`));
    const dung = c.length === 1 && c[0][1] === (mong === 'ĐẠT') && (mong === 'ĐẠT' || String(c[0][2]).startsWith('thu_cong.js thiếu phép: '))
      && String(c[0][2]).includes(them) && nang === (ten.startsWith('P8'));
    k(`${ten} → ${mong}`, dung, `chac ${JSON.stringify(r.chac)} · dòng NÂNG: ${nang}`);
  };
  const ba = (a1, a2, a3, T1 = N, T2 = N, T3 = N) => [ph(1, 3, a1, T1), ph(2, 3, a2, T2), ph(3, 3, a3, T3), TONG];
  pP('P1 đủ 3 phần, Σ đơn vị = T = ngưỡng', ba(N - 2, 1, 1), 'ĐẠT');
  pP('P2 (ca đỏ của phiếu) điều phối bỏ phần 3 khỏi lời gọi', [ph(1, 3, N - 2, N), ph(2, 3, 2, N), TONG], 'ĐỎ', 'cần 1..3');
  pP('P3 trùng phần (1, 2, 2), Σ đơn vị vẫn = T', [ph(1, 3, N - 2, N), ph(2, 3, 1, N), ph(2, 3, 1, N), TONG], 'ĐỎ', 'cần 1..3');
  pP('P4 đủ phần nhưng Σ đơn vị = T − 1 (một đơn vị không chạy ở phần nào)', ba(N - 3, 1, 1), 'ĐỎ', `≠ ${N}`);
  pP('P4b Σ đơn vị = T + 1 (một đơn vị chạy hai lần)', ba(N - 1, 1, 1), 'ĐỎ', `≠ ${N}`);
  pP('P5 các phần lệch T', ba(N - 2, 1, 1, N, N, N + 1), 'ĐỎ', 'lệch');
  pP('P5b các phần lệch n', [ph(1, 3, N - 2, N), ph(2, 3, 1, N), ph(3, 4, 1, N), TONG], 'ĐỎ', 'lệch');
  pP('P6 không có dòng phần (bản chạy liền cũ / bài sập trước khi in)', ['thu_cong: 337 phép · 0 chỗ hỏng'], 'ĐỎ', 'không thấy dòng');
  pP('P7 (Q6) đủ phần, T = ngưỡng − 1 (bớt ca)', ba(N - 3, 1, 1, N - 1, N - 1, N - 1), 'ĐỎ', 'NGUONG_THU_CONG_DON_VI');
  pP('P8 (Q6) đủ phần, T = ngưỡng + 1 (thêm ca) → ĐẠT, nhắc NÂNG ngưỡng', ba(N - 1, 1, 1, N + 1, N + 1, N + 1), 'ĐẠT');
  pP('P9 (K5) n = 1 (--phan 1/1), T = ngưỡng', [ph(1, 1, N, N), TONG], 'ĐẠT');
  // A1 "mỗi phần hạn 120 s như cũ": điều phối sinh từng con `--phan i/n` với timeout 120000 (đọc mã nguồn thu_cong.js thật)
  const tc = (() => { try { return fs.readFileSync(path.join(path.dirname(KIEM), 'tu_chay', 'thu_cong.js'), 'utf8'); } catch { return ''; } })();
  k('P10 thu_cong.js: điều phối sinh con `--phan` với timeout: 120000 (mỗi phần hạn 120 s, không nới)',
    /spawn\(process\.execPath, \[__filename, '--phan', [^\n]*\{[^\n}]*timeout: 120000\b/.test(tc), 'không thấy dòng spawn … --phan … timeout: 120000');
}

// ── D (TU-CHAY-7 A3): chú thích số dòng cứng — cắt vùng THẬT từ `const NGUONG_DONG_CUNG =` tới hết khối gọi, chạy với doc / liet giả ──
{
  const a4 = kt.search(/^const NGUONG_DONG_CUNG = \d+;/m);
  const b4 = a4 < 0 ? -1 : kt.indexOf('\n{\n', a4);
  const vung = b4 < 0 ? '' : kt.slice(a4, kt.indexOf('\n}\n', b4) + 3);
  const N = +((/^const NGUONG_DONG_CUNG = (\d+);/m.exec(kt) || [])[1]);
  k('D0 có vùng A3 (const NGUONG_DONG_CUNG = <số> ở đầu dòng, khối gọi sau nó) và ngưỡng ≥ 2', !!vung && N >= 2, `ngưỡng ${N}`);
  // ghép chuỗi: chính bài này không thêm dòng khớp vào kho thật (phép quét cả cong_cu/thu_*.js)
  const DC = '(' + ':1234)', P12 = '(' + ':12)', DAI = ':12' + '–34', NGAN = ':12' + '-34', DAI2 = ':5' + '–9';
  const goc = (n) => Array.from({ length: n }, (_, i) => `x(${i}); // xem a.js` + DC).join('\n') + '\n';
  const chayD = (files) => {
    const kq = { canh: [], pass: [], fail: [] };
    const liet = (d, duoi) => Object.keys(files).filter((f) => f.startsWith(d + '/') && duoi.some((x) => f.endsWith(x)));
    try {
      new Function('doc', 'liet', 'canhBao', 'pass', 'fail', 'chac', vung)((f) => files[f] ?? '', liet, (t, g) => kq.canh.push(`${t} — ${g}`),
        (t, g) => kq.pass.push(`${t} — ${g}`), (t, g) => kq.fail.push(`${t} — ${g}`), (t, d, g) => (d ? kq.pass : kq.fail).push(`${t} — ${g}`));
    } catch (e) { kq.fail.push('vùng ném: ' + e.message); }
    kq.ds = kq.canh.join(' ');
    return kq;
  };
  const moTaD = (r) => `cảnh báo: ${r.canh.join(' | ') || '(không)'} · fail: ${r.fail.join(' | ') || '(không)'} · pass: ${r.pass.join(' | ')}`;
  const tatCa = [];
  if (vung && N >= 2) {
    let r = chayD({ 'server/goc.js': goc(N) });
    tatCa.push(r);
    k('D1 đúng ngưỡng → 0 cảnh báo', r.canh.length === 0 && r.fail.length === 0, moTaD(r));
    r = chayD({ 'server/goc.js': goc(N), 'server/moi.js': 'a();\nb(); // trỏ orders.js' + DC + '\n' });
    tatCa.push(r);
    k('D2 thêm 1 chú thích (:1234) → 1 cảnh báo nêu server/moi.js:2', r.canh.length === 1 && r.ds.includes('server/moi.js:2'), moTaD(r));
    r = chayD({ 'server/goc.js': goc(N - 1) });
    tatCa.push(r);
    k('D5 bớt 1 → 0 cảnh báo, nhắc HẠ NGUONG_DONG_CUNG', r.canh.length === 0 && r.pass.some((p) => p.includes(`HẠ NGUONG_DONG_CUNG xuống ${N - 1}`)), moTaD(r));
    const nen = { 'server/goc.js': goc(N + 1) };   // luôn vượt → cảnh báo liệt kê mọi dòng được đếm
    r = chayD({ ...nen, 'server/d3.js': `// a.js${DAI}\n// b.js${NGAN}\n// lúc 10 giờ\n` });
    tatCa.push(r);
    k('D3 dạng :12–34 (gạch dài) và :12-34 đều đếm', r.ds.includes('server/d3.js:1') && r.ds.includes('server/d3.js:2') && !r.ds.includes('server/d3.js:3'), moTaD(r));
    r = chayD({ ...nen, 'server/d4.js': `const s = 'x${P12}';\n/` + `* xem ${P12} *` + `/\n * dòng giữa khối ${P12}\n{/` + `* jsx ${P12} *` + `/}\n` });
    tatCa.push(r);
    k('D4 chữ trong chuỗi mã không đếm; /* */, dòng " * ", {/* */} đếm', !r.ds.includes('server/d4.js:1') && ['2', '3', '4'].every((d) => r.ds.includes('server/d4.js:' + d)), moTaD(r));
    r = chayD({ 'server/goc.js': goc(N - 1), 'server/d7.js': '// a.js' + DC + ' và b.js' + DAI2 + '\n' });
    tatCa.push(r);
    k('D7 hai lần khớp trên MỘT dòng → đếm 1 dòng (đúng ngưỡng, 0 cảnh báo)', r.canh.length === 0, moTaD(r));
    const VUNG = { 'server/a/b.js': 1, 'client/src/x.jsx': 1, 'client/src/y.js': 1, 'cong_cu/thu_x.js': 1, 'tu_chay/x.js': 1,
      'cong_cu/khac.js': 0, 'cong_cu/gia_lap/thu_y.js': 0, 'tu_chay/con/z.js': 0, 'client/x.js': 0 };
    r = chayD({ ...nen, ...Object.fromEntries(Object.keys(VUNG).map((f) => [f, '// a.js' + DC + '\n'])) });
    tatCa.push(r);
    const lech = Object.entries(VUNG).filter(([f, co]) => r.ds.includes(f + ':1') !== !!co).map(([f]) => f);
    k('D8 quét đúng bốn vùng: server/**, client/src/**/*.{js,jsx}, cong_cu/thu_*.js, tu_chay/*.js — không cong_cu khác, không thư mục con tu_chay/',
      !lech.length, `lệch: ${lech.join(', ')} · ${moTaD(r)}`);
    k('D9 không FAIL ở mọi ca (chỉ cảnh báo / nhắc hạ)', tatCa.every((x) => x.fail.length === 0), tatCa.map((x) => x.fail.join(' | ')).join(' ; '));
    // D6 — kho THẬT: đếm ≤ ngưỡng (≤: việc khác dọn chú thích thì chỉ nhắc hạ, không đỏ bài này)
    const di = (d, duoi) => { const ra = []; (function w(x) {
      let ds = []; try { ds = fs.readdirSync(path.join(GOC, x), { withFileTypes: true }); } catch { return; }
      for (const e of ds) { if (['node_modules', 'dist', '.git'].includes(e.name)) continue; const p = path.join(x, e.name);
        if (e.isDirectory()) w(p); else if (duoi.some((y) => e.name.endsWith(y))) ra.push(p); }
    })(d); return ra; };
    const files = {};
    for (const d of ['server', 'client/src', 'cong_cu', 'tu_chay']) for (const f of di(d, ['.js', '.jsx'])) files[f] = fs.readFileSync(path.join(GOC, f), 'utf8');
    r = chayD(files);
    k('D6 kho thật: chú thích số dòng cứng ≤ NGUONG_DONG_CUNG (0 cảnh báo, 0 fail)', r.canh.length === 0 && r.fail.length === 0, moTaD(r));
  }
}

fs.rmSync(TAM, { recursive: true, force: true });
console.log(`thu_TOCDO1: ${dat} đạt · ${hong.length} hỏng`);
for (const h of hong) console.log('  ✗ ' + h);
process.exit(hong.length ? 1 : 0);
