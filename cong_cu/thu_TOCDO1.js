#!/usr/bin/env node
// thu_TOCDO1.js — TOC-DO-1: bộ kiểm chỉ chạy tu_chay/thu_cong.js khi có thể cần (phiếu A2, A3).
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
const khoi = a >= 0 ? kt.slice(a, kt.indexOf('\n', kt.indexOf('bỏ qua thu_cong.js', a)) + 1)
  : (kt.split('\n').find((d) => /^\s*chayBaiThat\('tu_chay\/thu_cong\.js'\)/.test(d)) || '');
k('E0 cắt được khối gọi thu_cong.js từ bộ kiểm', !!khoi, 'không thấy function lyDoChayThuCong( lẫn dòng gọi trần');
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

fs.rmSync(TAM, { recursive: true, force: true });
console.log(`thu_TOCDO1: ${dat} đạt · ${hong.length} hỏng`);
for (const h of hong) console.log('  ✗ ' + h);
process.exit(hong.length ? 1 : 0);
