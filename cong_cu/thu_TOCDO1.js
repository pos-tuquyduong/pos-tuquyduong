#!/usr/bin/env node
// thu_TOCDO1.js — TOC-DO-1: bộ kiểm chỉ chạy tu_chay/thu_cong.js khi có thể cần (phiếu A2, A3).
// TU-CHAY-6 A2 (mục R): phép tĩnh route ghi — cắt khối hai hàm xetBanhCoc + quetRouteGhi của bộ kiểm, chạy trên routes GIẢ (hàm docFile).
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
const GOI = "chayBaiThat('tu_chay/thu_cong.js')";
k('E1 toàn bộ kiểm đúng MỘT lời gọi thu_cong.js và nó nằm trong khối cắt', kt.split(GOI).length === 2 && khoi.includes(GOI),
  `${kt.split(GOI).length - 1} lời gọi trong file · trong khối: ${khoi.includes(GOI)}`);
const BO = 'bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github';
// Chạy khối với GOC = kho tạm; spawnSync bọc môi trường sạch. Trả { goi: số lần gọi chayBaiThat, dong }.
function chay(goc, dayDu, env) {
  const kq = { goi: 0, dong: [] };
  const sp = (c, ds, o) => spawnSync(c, ds, { ...o, env });
  new Function('spawnSync', 'GOC', 'DAY_DU', 'chayBaiThat', 'dong', khoi)(sp, goc, dayDu, () => kq.goi++, kq.dong);
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
try { new Function('spawnSync', 'GOC', 'DAY_DU', 'chayBaiThat', 'dong', fs.readFileSync(${JSON.stringify(path.join(TAM, 'khoi.js'))}, 'utf8'))(
  require('child_process').spawnSync, process.cwd(), false, () => goi.push(1), dong); } catch (e) { dong.push('ném: ' + e.message); }
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

fs.rmSync(TAM, { recursive: true, force: true });
console.log(`thu_TOCDO1: ${dat} đạt · ${hong.length} hỏng`);
for (const h of hong) console.log('  ✗ ' + h);
process.exit(hong.length ? 1 : 0);
