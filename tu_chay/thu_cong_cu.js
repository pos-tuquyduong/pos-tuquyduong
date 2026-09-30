#!/usr/bin/env node
// thu_cong_cu.js — bài thử công cụ của tu-chay (TU-CHAY-2):
//   xem_thu.sh (F) · cai_thu_vien.sh (E) · MAU_PHIEU.md + skill_lam_viec.md (H)
//
//   node tu_chay/thu_cong_cu.js
//
// Chạy trên kho tạm + remote bare tạm; npm là bản GIẢ đặt đầu PATH (ghi nhật ký, không mạng).
// Mỗi ca TỰ đặt hoặc xoá CLAUDE_CODE_REMOTE và CLAUDECODE (máy mây có sẵn CLAUDE_CODE_REMOTE=true,
// Replit thì không) và bỏ mọi GIT_* (pre-commit đặt GIT_INDEX_FILE) — kết quả giống nhau ở cả hai nơi.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const hong = [];
let soPhep = 0;
const chac = (ten, dk, ghi = '') => { soPhep++; if (!dk) hong.push(ten + (ghi ? ' — ' + ghi : '')); };
const doc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const viet = (goc, rel, nd) => { const p = path.join(goc, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, nd); return p; };

const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'thu_cc_')));
const NK_NPM = path.join(TAM, 'npm.log');
const NK_KIEM = path.join(TAM, 'kiem.log');
viet(TAM, 'bin/npm', [
  '#!/usr/bin/env bash',
  'echo "$PWD|$*" >> "$NPM_NHAT_KY"',
  'if [ "$1" = ci ] && [ -n "$NPM_HONG" ]; then echo "npm gia: loi mang" >&2; exit 1; fi',
  'if [ "$1" = ci ]; then rm -rf node_modules; mkdir -p node_modules; fi',
  'if [ "$1" = run ] && [ "$2" = build ]; then rm -rf dist; mkdir -p dist; cp src/* dist/; fi',
  'exit 0', ''].join('\n'));
fs.chmodSync(path.join(TAM, 'bin/npm'), 0o755);

function moiTruong(them = {}) {
  const e = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (!/^GIT_/.test(k) && !/^CLAUDE/.test(k) && !/^npm_/i.test(k)) e[k] = v;
  }
  return { ...e, PATH: path.join(TAM, 'bin') + ':' + process.env.PATH, HOME: path.join(TAM, 'home'),
    GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't',
    GIT_COMMITTER_EMAIL: 't@t', NPM_NHAT_KY: NK_NPM, KIEM_NHAT_KY: NK_KIEM, ...them };
}
fs.mkdirSync(path.join(TAM, 'home'));
const git = (cwd, ...a) => {
  const r = spawnSync('git', a, { cwd, env: moiTruong(), encoding: 'utf8', timeout: 20000 });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')} (${cwd}): ${r.stderr}`);
  return r.stdout.trim();
};
const dongNpm = () => (doc(NK_NPM) || '').split('\n').filter(Boolean);

// ═══ F · xem_thu.sh ════════════════════════════════════════════════════════
const XEM = path.join(__dirname, 'xem_thu.sh');
const XEM_ND = doc(XEM) || '#!/usr/bin/env bash\necho "chưa có xem_thu.sh" >&2\nexit 1\n';
function baiXemThu() {
  const BARE = path.join(TAM, 'goc.git');
  const NGUON = path.join(TAM, 'nguon'); // phía máy mây: đẩy nhánh lên
  const QUAY = path.join(TAM, 'quay'); // phía Replit: chủ quán chạy xem_thu.sh
  git(TAM, 'init', '-q', '--bare', '-b', 'main', BARE);
  fs.mkdirSync(NGUON);
  git(NGUON, 'init', '-q', '-b', 'main');
  viet(NGUON, 'tu_chay/xem_thu.sh', XEM_ND);
  viet(NGUON, 'kiem_tra_truoc_khi_giao.js', "const fs = require('fs');\n"
    + "fs.appendFileSync(process.env.KIEM_NHAT_KY, process.argv.slice(2).join(' ') + '\\n');\n"
    + 'process.exit(0);\n');
  viet(NGUON, '.gitignore', 'node_modules/\n');
  viet(NGUON, 'package.json', '{"name":"goc"}\n'); viet(NGUON, 'package-lock.json', '{"v":1}\n');
  viet(NGUON, 'client/package.json', '{"name":"client"}\n'); viet(NGUON, 'client/package-lock.json', '{"v":1}\n');
  viet(NGUON, 'client/src/app.js', 'v1\n'); viet(NGUON, 'client/dist/app.js', 'v1\n');
  viet(NGUON, 'server/a.js', 'a1\n');
  const commit = (m) => { git(NGUON, 'add', '-A'); git(NGUON, 'commit', '-q', '-m', m); return git(NGUON, 'rev-parse', 'HEAD'); };
  commit('goc');
  git(NGUON, 'remote', 'add', 'origin', BARE);
  git(NGUON, 'push', '-q', 'origin', 'main');
  git(TAM, 'clone', '-q', BARE, QUAY);
  // Sau khi clone mới đẩy nhánh việc → origin/* ở QUAY cũ, xem_thu.sh phải tự fetch.
  git(NGUON, 'checkout', '-q', '-b', 'viec/TU-CHAY-9');
  viet(NGUON, 'server/a.js', 'a2\n'); commit('C2');
  viet(NGUON, 'server/a.js', 'a3\n'); const C3 = commit('C3');

  const chay = (ma, them = {}, tep = 'tu_chay/xem_thu.sh') => spawnSync('bash', [tep, ma],
    { cwd: QUAY, env: moiTruong(them), encoding: 'utf8', timeout: 60000 });
  const head = () => git(QUAY, 'rev-parse', 'HEAD');
  const nhanh = () => git(QUAY, 'rev-parse', '--abbrev-ref', 'HEAD');
  const ra = (r) => String(r.stdout) + String(r.stderr);

  // F6 — trong Claude Code: từ chối trước mọi thứ, không fetch
  let h0 = head();
  let r = chay('TU-CHAY-9', { CLAUDECODE: '1' });
  chac('F6 xem_thu: có CLAUDECODE → từ chối, HEAD không đổi, không fetch', r.status !== 0 && head() === h0
    && !fs.existsSync(path.join(QUAY, '.git/FETCH_HEAD')) && !dongNpm().length, ra(r).slice(0, 200));
  r = chay('TU-CHAY-9', { CLAUDE_CODE_CHILD_SESSION: '1' });
  chac('F6 xem_thu: có CLAUDE_CODE_CHILD_SESSION → từ chối', r.status !== 0 && head() === h0);

  // F3 — file đã theo dõi đang bị sửa
  viet(QUAY, 'server/a.js', 'sua tay\n');
  r = chay('TU-CHAY-9');
  chac('F3 xem_thu: file theo dõi bị sửa → từ chối, không đổi gì, nêu tên file', r.status !== 0 && head() === h0
    && doc(path.join(QUAY, 'server/a.js')) === 'sua tay\n' && ra(r).includes('server/a.js'), ra(r).slice(0, 300));
  git(QUAY, 'checkout', '-q', '--', 'server/a.js');

  // F4 — nhánh không có trên origin; mã sai dạng
  r = chay('KHONG-CO');
  chac('F4 xem_thu: nhánh không có trên origin → từ chối, HEAD không đổi', r.status !== 0 && head() === h0 && nhanh() === 'main');
  r = chay('../x');
  chac('F4 xem_thu: mã sai dạng → từ chối', r.status !== 0 && head() === h0);

  // F1 + F7 + F8 — sang nhánh việc mới nhất, build, --day-du, bấm Run; file ?? không cản, không bị đụng
  const LA = [];
  for (let i = 1; i <= 8; i++) LA.push(viet(QUAY, `ke_hoach_cu_${i}.md`, 'cu ' + i));
  fs.writeFileSync(NK_NPM, ''); fs.writeFileSync(NK_KIEM, '');
  r = chay('TU-CHAY-9');
  const npm1 = dongNpm();
  chac('F1 xem_thu TU-CHAY-9: thoát 0, HEAD = commit MỚI NHẤT trên origin, đứng ở viec/TU-CHAY-9', r.status === 0
    && head() === C3 && nhanh() === 'viec/TU-CHAY-9', ra(r).slice(-400));
  chac('F1 xem_thu: build client, chạy kiem_tra --day-du, in "bấm Run"', npm1.includes(QUAY + '/client|run build')
    && (doc(NK_KIEM) || '').includes('--day-du') && /✓.*bấm Run/.test(r.stdout), npm1.join(' ; '));
  chac('F7 xem_thu: 8 file ?? vẫn còn nguyên', LA.every((p, i) => doc(p) === 'cu ' + (i + 1)));
  chac('F8 xem_thu: lần đầu chưa có node_modules → npm ci ở gốc và client', npm1.includes(QUAY + '|ci') && npm1.includes(QUAY + '/client|ci'));
  fs.writeFileSync(NK_NPM, '');
  r = chay('TU-CHAY-9');
  chac('F8 xem_thu: chạy lại, lockfile không đổi → KHÔNG npm ci', r.status === 0 && !dongNpm().some((d) => d.endsWith('|ci')), dongNpm().join(' ; '));
  viet(NGUON, 'client/package-lock.json', '{"v":2}\n'); const C4 = commit('lock client');
  git(NGUON, 'push', '-q', 'origin', 'viec/TU-CHAY-9');
  fs.writeFileSync(NK_NPM, '');
  r = chay('TU-CHAY-9');
  chac('F8 xem_thu: client/package-lock.json đổi → npm ci ĐÚNG ở client, không ở gốc', r.status === 0 && head() === C4
    && dongNpm().includes(QUAY + '/client|ci') && !dongNpm().includes(QUAY + '|ci'), dongNpm().join(' ; '));

  // F3b — client/dist/ bị sửa: trả về bản commit, báo, chạy tiếp
  viet(QUAY, 'client/dist/app.js', 'dist sua tay\n');
  r = chay('TU-CHAY-9');
  chac('F3b xem_thu: client/dist/ bị sửa → trả về bản commit, báo, vẫn chạy', r.status === 0
    && doc(path.join(QUAY, 'client/dist/app.js')) === 'v1\n' && ra(r).includes('client/dist'), ra(r).slice(0, 300));

  // F2 — quay về main mới nhất
  git(NGUON, 'checkout', '-q', 'main');
  viet(NGUON, 'server/a.js', 'm2\n'); const M2 = commit('main moi');
  git(NGUON, 'push', '-q', 'origin', 'main');
  r = chay('main');
  chac('F2 xem_thu main: về main MỚI NHẤT', r.status === 0 && head() === M2 && nhanh() === 'main', ra(r).slice(-300));

  // F5 — nhánh ở máy lệch, không fast-forward được
  git(QUAY, 'checkout', '-q', 'viec/TU-CHAY-9');
  viet(QUAY, 'server/rieng.js', 'x\n'); git(QUAY, 'add', 'server/rieng.js'); git(QUAY, 'commit', '-q', '-m', 'rieng');
  const lech = head();
  git(QUAY, 'checkout', '-q', 'main');
  r = chay('TU-CHAY-9');
  chac('F5 xem_thu: nhánh ở máy lệch → từ chối, không đổi gì', r.status !== 0 && nhanh() === 'main' && head() === M2
    && git(QUAY, 'rev-parse', 'viec/TU-CHAY-9') === lech, ra(r).slice(0, 300));

  // F9 — dist trong nhánh không khớp src
  git(NGUON, 'checkout', '-q', '-b', 'viec/TU-CHAY-7');
  viet(NGUON, 'client/src/app.js', 'v2\n'); viet(NGUON, 'client/src/moi.js', 'moi\n'); commit('src khong kem dist');
  git(NGUON, 'push', '-q', 'origin', 'viec/TU-CHAY-7');
  r = chay('TU-CHAY-7');
  chac('F9 xem_thu: dist không khớp src → báo, KHÔNG in "bấm Run", thoát khác 0', r.status !== 0
    && ra(r).includes('dist trong nhánh không khớp src') && !/bấm Run/.test(r.stdout), ra(r).slice(-300));
  chac('F9 xem_thu: dist trả về bản commit (kể cả file sinh thêm)', git(QUAY, 'status', '--porcelain', '--', 'client/dist') === '');

  // F10 — nhánh đích có xem_thu.sh KHÁC: bản đang chạy không được tự hỏng
  const BAN = viet(TAM, 'xem_thu_ban.sh', XEM_ND);
  git(NGUON, 'checkout', '-q', 'main');
  git(NGUON, 'checkout', '-q', '-b', 'viec/TU-CHAY-8');
  viet(NGUON, 'tu_chay/xem_thu.sh', '#!/usr/bin/env bash\n' + 'echo SAI\n'.repeat(400) + 'exit 7\n'); commit('xem_thu khac');
  git(NGUON, 'push', '-q', 'origin', 'viec/TU-CHAY-8');
  r = chay('main', {}, BAN);
  chac('F10 chuẩn bị: về main bằng bản chép ngoài kho', r.status === 0 && nhanh() === 'main', ra(r).slice(-300));
  r = chay('TU-CHAY-8');
  chac('F10 xem_thu: xem_thu.sh ở nhánh đích khác → vẫn chạy trọn bản đang chạy, không in SAI', r.status === 0
    && !/SAI/.test(r.stdout) && nhanh() === 'viec/TU-CHAY-8' && /bấm Run/.test(r.stdout), ra(r).slice(-300));

  // F11 — không push, không .env/.replit, không production
  const tho = XEM_ND.split('\n').filter((d) => !/^\s*#/.test(d)).join('\n');
  chac('F11 xem_thu.sh: không có push, .env, .replit, curl, tên miền production',
    !/\bpush\b|\.env|\.replit|\bcurl\b|pos-tuquyduong\.io\.vn|turso/.test(tho));
  const refs = (g) => spawnSync('git', ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads'],
    { cwd: g, env: moiTruong(), encoding: 'utf8' }).stdout.trim();
  const tuXa = refs(BARE).split('\n');
  chac('F11 xem_thu: remote không bị đổi (mọi nhánh trên remote = bản do phía máy mây đẩy)',
    tuXa.length === 4 && tuXa.every((d) => refs(NGUON).split('\n').includes(d)), refs(BARE));
}

// ═══ E · cai_thu_vien.sh ═══════════════════════════════════════════════════
function baiThuVien() {
  const TV = path.join(TAM, 'tv');
  viet(TV, 'package-lock.json', '{"v":1}\n'); viet(TV, 'client/package-lock.json', '{"v":1}\n');
  const SH = path.join(__dirname, 'cai_thu_vien.sh');
  const chay = (them) => spawnSync('bash', [SH], { cwd: path.join(TAM, 'home'),
    env: moiTruong({ CLAUDE_PROJECT_DIR: TV, ...them }), encoding: 'utf8', timeout: 60000 });
  fs.writeFileSync(NK_NPM, '');
  let r = chay({});
  chac('E2 cai_thu_vien: không có CLAUDE_CODE_REMOTE → thoát 0, không gọi npm', r.status === 0 && !dongNpm().length);
  r = chay({ CLAUDE_CODE_REMOTE: 'false' });
  chac('E2 cai_thu_vien: CLAUDE_CODE_REMOTE=false → không gọi npm', r.status === 0 && !dongNpm().length);
  r = chay({ CLAUDE_CODE_REMOTE: 'true' });
  chac('E3 cai_thu_vien: máy mây → npm ci ở gốc RỒI ở client, thoát 0', r.status === 0
    && JSON.stringify(dongNpm()) === JSON.stringify([TV + '|ci', TV + '/client|ci']), dongNpm().join(' ; ') + ' · ' + r.stderr);
  fs.writeFileSync(NK_NPM, '');
  r = chay({ CLAUDE_CODE_REMOTE: 'true' });
  chac('E4 cai_thu_vien: đã cài, lockfile không đổi → bỏ qua', r.status === 0 && !dongNpm().length, dongNpm().join(' ; '));
  viet(TV, 'client/package-lock.json', '{"v":2}\n');
  r = chay({ CLAUDE_CODE_REMOTE: 'true' });
  chac('E4 cai_thu_vien: lockfile client đổi → chỉ npm ci ở client', r.status === 0
    && JSON.stringify(dongNpm()) === JSON.stringify([TV + '/client|ci']), dongNpm().join(' ; '));
  fs.rmSync(path.join(TV, 'node_modules'), { recursive: true, force: true });
  fs.writeFileSync(NK_NPM, '');
  r = chay({ CLAUDE_CODE_REMOTE: 'true', NPM_HONG: '1' });
  chac('E5 cai_thu_vien: npm ci hỏng → vẫn thoát 0 (không làm hỏng phiên), stdout báo rõ ✗ + chỗ hỏng',
    r.status === 0 && /✗.*npm ci/.test(r.stdout) && r.stdout.includes('loi mang'), `exit ${r.status} · ${r.stdout.slice(0, 300)}`);
  fs.writeFileSync(NK_NPM, '');
  r = chay({ CLAUDE_CODE_REMOTE: 'true' });
  chac('E5 cai_thu_vien: lần hỏng không ghi dấu → lần sau cài lại ở gốc', r.status === 0 && dongNpm().includes(TV + '|ci'), dongNpm().join(' ; '));
}

// ═══ H · mẫu phiếu + skill ═════════════════════════════════════════════════
function baiTaiLieu() {
  const mp = doc(path.join(__dirname, 'MAU_PHIEU.md')) || '';
  const MUC = ['## Mục tiêu', '## Nghiệm thu', '## Phạm vi', '## Ngân sách', '## Đổi cấu trúc DB', '## Thư viện mới', '## Cấm'];
  chac('H1 MAU_PHIEU.md: đủ 7 mục của B5', MUC.every((m) => mp.includes(m)), MUC.filter((m) => !mp.includes(m)).join(', '));
  chac('H1 MAU_PHIEU.md: dặn file luật và file mới trong tu_chay/ ghi ĐÚNG TÊN ở Phạm vi', mp.includes('ĐÚNG TÊN') && mp.includes('tu_chay/'));
  chac('H1 MAU_PHIEU.md: dặn mã việc không chứa main, -d, -f', /main/.test(mp) && mp.includes('-d') && mp.includes('-f'));
  const sk = doc(path.join(__dirname, 'skill_lam_viec.md')) || '';
  const m = sk.match(/^---\n([\s\S]*?)\n---\n/);
  const fm = m ? m[1] : '';
  chac('H2 skill: frontmatter có name: lam-viec, description, argument-hint, disable-model-invocation: true',
    /^name: lam-viec$/m.test(fm) && /^description: \S/m.test(fm) && /^argument-hint: \S/m.test(fm)
    && /^disable-model-invocation: true$/m.test(fm), fm.slice(0, 200));
  const than = sk.slice(m ? m[0].length : 0).toLowerCase();
  const MOC = ['git log --oneline -3', 'trang_thai.md', 'ke_hoach.md', 'đỏ', 'npm test', 'npm run build', '/ra-soat',
    'git push -u origin viec/', 'trang_thai.md'];
  let i = 0; const thieu = [];
  for (const moc of MOC) { const j = than.indexOf(moc, i); if (j < 0) thieu.push(moc); else i = j + moc.length; }
  chac('H3 skill: các mốc B6 (máy mây) đúng thứ tự, bước đầu là git log --oneline -3 ghi vào trang_thai.md', !thieu.length,
    'thiếu/sai thứ tự: ' + thieu.join(', '));
  chac('H3 skill: dặn in git log --oneline -3 trong câu trả lời đầu tiên', /câu trả lời đầu tiên/.test(than));
  chac('H3 skill: tối đa 3 vòng sửa; câu hỏi nghiệp vụ thì dừng', /tối đa 3/.test(than) && /## câu hỏi/.test(than) && /dừng/.test(than));
  chac('H3 skill: không ghi sổ việc, không add -A, không bỏ qua hook', !/ghi_tien_do|git add -a|--no-verify/.test(than));
}

for (const bai of [baiXemThu, baiThuVien, baiTaiLieu]) {
  try { bai(); } catch (e) { hong.push(`${bai.name} sập: ` + String(e && e.message || e).split('\n')[0]); }
}
fs.rmSync(TAM, { recursive: true, force: true });
console.log(`thu_cong_cu: ${soPhep} phép · ${hong.length} chỗ hỏng`);
if (hong.length) {
  for (const h of hong) console.log('  ✗ ' + h);
  console.log(`  ĐỎ — ${hong.length} chỗ hỏng`);
  process.exit(1);
}
console.log('  ✓ XANH — xem_thu.sh, cai_thu_vien.sh, mẫu phiếu, skill đều đạt');
process.exit(0);
