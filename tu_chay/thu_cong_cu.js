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
const GIT_THAT = String(spawnSync('bash', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout).trim();
viet(TAM, 'bin/git', ['#!/usr/bin/env bash', '[ -n "$KEO_NHAT_KY" ] && echo "git|$*" >> "$KEO_NHAT_KY"',
  `exec "${GIT_THAT}" "$@"`, ''].join('\n'));
fs.chmodSync(path.join(TAM, 'bin/git'), 0o755);

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
  git(NGUON, 'push', '-q', 'origin', 'viec/TU-CHAY-9');

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

  // F3 — file đã theo dõi đang bị sửa. Dùng file GIỐNG NHAU ở hai nhánh: git sẽ cho checkout mang theo sửa đổi,
  // nên chỉ phép chặn của xem_thu.sh mới giữ được "không đổi gì" (sửa server/a.js thì chính git đã từ chối).
  viet(QUAY, 'client/package.json', 'sua tay\n');
  r = chay('TU-CHAY-9');
  chac('F3 xem_thu: file theo dõi bị sửa → từ chối trước khi fetch, không đổi gì, nêu tên file', r.status !== 0 && head() === h0
    && nhanh() === 'main' && !fs.existsSync(path.join(QUAY, '.git/FETCH_HEAD'))
    && doc(path.join(QUAY, 'client/package.json')) === 'sua tay\n' && ra(r).includes('client/package.json'), ra(r).slice(0, 300));
  git(QUAY, 'checkout', '-q', '--', 'client/package.json');

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

  // F3b — client/dist/ bị sửa: trả về bản commit, báo, chạy tiếp. Nhánh mới có dist KHÁC → không trả trước
  // thì git từ chối fast-forward (build sau đó ghi đè dist nên không che được lỗi này).
  viet(NGUON, 'client/src/app.js', 'v3\n'); viet(NGUON, 'client/dist/app.js', 'v3\n'); const C5 = commit('src + dist v3');
  git(NGUON, 'push', '-q', 'origin', 'viec/TU-CHAY-9');
  viet(QUAY, 'client/dist/app.js', 'dist sua tay\n');
  r = chay('TU-CHAY-9');
  chac('F3b xem_thu: client/dist/ bị sửa → trả về bản commit, báo, vẫn sang bản mới', r.status === 0 && head() === C5
    && doc(path.join(QUAY, 'client/dist/app.js')) === 'v3\n' && ra(r).includes('client/dist'), ra(r).slice(0, 300));

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


// ═══ C · hook mở phiên kéo nhánh việc (TU-CHAY-3) — kho tạm + remote bare ═════
function baiKeoNhanh() {
  const SH = path.join(__dirname, 'cai_thu_vien.sh');
  const BARE = path.join(TAM, 'keo.git');
  git(TAM, 'init', '-q', '--bare', BARE);
  const CQ = path.join(TAM, 'keo_cq'); // bản của chủ quán: đẩy commit mới lên origin
  fs.mkdirSync(CQ);
  git(CQ, 'init', '-q', '-b', 'viec/K');
  viet(CQ, 'package-lock.json', '{"v":1}\n'); viet(CQ, 'a.txt', '1\n');
  git(CQ, 'add', 'package-lock.json', 'a.txt'); git(CQ, 'commit', '-q', '-m', 'goc');
  git(CQ, 'branch', 'khac'); git(CQ, 'branch', 'main');
  git(CQ, 'remote', 'add', 'origin', BARE);
  git(CQ, 'push', '-q', 'origin', 'viec/K', 'khac', 'main');
  const M = path.join(TAM, 'keo_may'); // bản của máy mây
  git(TAM, 'clone', '-q', '-b', 'viec/K', BARE, M);
  const dayMoi = (nd) => { viet(CQ, 'package-lock.json', nd); git(CQ, 'commit', '-q', '-am', 'moi ' + nd.trim()); git(CQ, 'push', '-q', 'origin', 'viec/K'); };
  const head = () => git(M, 'rev-parse', 'HEAD');
  const chay = (them) => { fs.writeFileSync(NK_NPM, ''); return spawnSync('bash', [SH], { cwd: path.join(TAM, 'home'),
    env: moiTruong({ CLAUDE_PROJECT_DIR: M, KEO_NHAT_KY: NK_NPM, ...them }), encoding: 'utf8', timeout: 60000 }); };
  const nk = () => dongNpm();
  const coFetch = () => nk().some((d) => /^git\|fetch/.test(d));
  const MAY = { CLAUDE_CODE_REMOTE: 'true' };

  dayMoi('{"v":2}\n');
  let h0 = head();
  let r = chay({});
  chac('C1 kéo nhánh: không có CLAUDE_CODE_REMOTE → không kéo, không gọi git', r.status === 0 && head() === h0 && !nk().length, nk().join(' ; '));
  r = chay({ CLAUDE_CODE_REMOTE: 'false' });
  chac('C1 kéo nhánh: CLAUDE_CODE_REMOTE=false → không kéo', r.status === 0 && head() === h0 && !coFetch());

  for (const [ten, dat] of [['main', () => git(M, 'checkout', '-q', 'main')], ['khac', () => git(M, 'checkout', '-q', 'khac')],
    ['HEAD tách rời', () => git(M, 'checkout', '-q', '--detach', h0)]]) {
    dat();
    const hx = head();
    r = chay(MAY);
    chac(`C2 kéo nhánh: đứng ở ${ten} → không fetch, HEAD giữ nguyên, thoát 0`, r.status === 0 && head() === hx && !coFetch(), nk().join(' ; '));
  }
  git(M, 'checkout', '-q', 'viec/K');

  // C7 + C3: kéo được → in trước → sau; lệnh git có ghi chỉ fetch + merge --ff-only; npm ci chạy SAU khi kéo (lockfile mới)
  const truoc = git(M, 'rev-parse', '--short', 'HEAD');
  r = chay(MAY);
  const sau = git(M, 'rev-parse', '--short', 'HEAD');
  chac('C7 kéo nhánh: origin đi trước → HEAD = origin, in "trước → sau"', r.status === 0 && head() === git(BARE, 'rev-parse', 'viec/K')
    && r.stdout.includes(`${truoc} → ${sau}`), r.stdout + r.stderr);
  const dong = nk();
  const lenhGit = dong.filter((d) => d.startsWith('git|')).map((d) => d.slice(4));
  const ghi = lenhGit.filter((l) => !/^(symbolic-ref|diff|rev-parse|merge-base)( |$)/.test(l));
  chac('C3 kéo nhánh: lệnh git có ghi CHỈ là fetch origin <nhánh> và merge --ff-only', ghi.length === 2 && /^fetch( -q)? origin viec\/K$/.test(ghi[0])
    && /^merge .*--ff-only/.test(ghi[1]), lenhGit.join(' ; '));
  const iMerge = dong.findIndex((d) => /^git\|merge /.test(d));
  const iCi = dong.findIndex((d) => d === M + '|ci');
  chac('C3 kéo nhánh: kéo TRƯỚC npm ci (lockfile vừa đổi → npm ci chạy sau merge)', iMerge >= 0 && iCi > iMerge, dong.join(' ; '));

  // Không có gì mới → không in lỗi, không đổi
  h0 = head();
  r = chay(MAY);
  chac('C kéo nhánh: không có gì mới → HEAD giữ nguyên, không ✗', r.status === 0 && head() === h0 && !/✗/.test(r.stdout), r.stdout);

  // C4: file đã theo dõi đang sửa dở → không kéo, cây giữ nguyên
  dayMoi('{"v":3}\n');
  viet(M, 'a.txt', 'sua do\n');
  h0 = head();
  r = chay(MAY);
  chac('C4 kéo nhánh: file theo dõi đang sửa → không kéo, file giữ nguyên, có cảnh báo', r.status === 0 && head() === h0
    && doc(path.join(M, 'a.txt')) === 'sua do\n' && /sửa dở/.test(r.stdout), r.stdout);
  git(M, 'checkout', '-q', '--', 'a.txt');
  viet(M, 'chua_theo_doi.txt', 'x');
  r = chay(MAY);
  chac('C4 kéo nhánh: file CHƯA theo dõi không cản kéo', r.status === 0 && head() === git(BARE, 'rev-parse', 'viec/K'), r.stdout);

  // C5b: máy đi TRƯỚC origin (commit chưa push) → không kéo, KHÔNG báo DỪNG oan
  viet(M, 'b.txt', 'm\n'); git(M, 'add', 'b.txt'); git(M, 'commit', '-q', '-m', 'may');
  h0 = head();
  r = chay(MAY);
  chac('C5b kéo nhánh: máy đi trước origin → không kéo, không có chữ DỪNG', r.status === 0 && head() === h0 && !/DỪNG/.test(r.stdout), r.stdout);
  // C5: hai bên lệch → DỪNG, báo chủ quán; không merge thường, không reset
  dayMoi('{"v":4}\n');
  r = chay(MAY);
  chac('C5 kéo nhánh: lệch nhau → "máy DỪNG, báo chủ quán", HEAD giữ nguyên', r.status === 0 && head() === h0
    && r.stdout.includes('máy DỪNG, báo chủ quán'), r.stdout);
  chac('C5 kéo nhánh: lệch nhau → không gọi merge', !nk().some((d) => /^git\|merge /.test(d)), nk().join(' ; '));

  // C6: mất mạng / fetch hỏng → cảnh báo, thoát 0, npm ci vẫn chạy
  git(M, 'remote', 'set-url', 'origin', path.join(TAM, 'khong_co.git'));
  fs.rmSync(path.join(M, 'node_modules'), { recursive: true, force: true });
  r = chay(MAY);
  chac('C6 kéo nhánh: fetch hỏng → thoát 0, cảnh báo, npm ci vẫn chạy', r.status === 0 && /không kéo được/.test(r.stdout)
    && nk().includes(M + '|ci'), r.stdout + ' · ' + nk().join(' ; '));
}

// ═══ F3 · ngân sách dòng KHUON_LOI.md ═════════════════════════════════════
// Hàm thuần: trả '' nếu đạt, câu lỗi nếu vượt hoặc cấu hình thiếu khoá.
function kiemKhuonLoi(chuoi, toiDa) {
  if (!Number.isInteger(toiDa) || toiDa <= 0) return 'cau_hinh.json thiếu khoá khuon_loi_toi_da (số nguyên dương)';
  const n = String(chuoi).replace(/\n$/, '').split('\n').length;
  return n > toiDa ? `KHUON_LOI.md ${n} dòng > ${toiDa} — gộp hoặc xoá mục, không nới số` : '';
}
function baiKhuonLoi() {
  let ch = {};
  try { ch = JSON.parse(doc(path.join(__dirname, 'cau_hinh.json'))); } catch {}
  const that = doc(path.join(__dirname, '..', 'KHUON_LOI.md')) || '';
  chac('F3 KHUON_LOI.md thật trong ngân sách khuon_loi_toi_da', that.length > 0 && kiemKhuonLoi(that, ch.khuon_loi_toi_da) === '',
    kiemKhuonLoi(that, ch.khuon_loi_toi_da));
  chac('F3 file giả 121 dòng với ngân sách 120 → ĐỎ', kiemKhuonLoi('x\n'.repeat(121), 120) !== '');
  chac('F3 đúng 120 dòng → đạt (không đỏ oan)', kiemKhuonLoi('x\n'.repeat(120), 120) === '');
  chac('F3 cấu hình thiếu khoá → ĐỎ', kiemKhuonLoi('x\n', undefined) !== '');
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
  // TU-CHAY-3 F1: bước 11 rút kinh nghiệm, sau bước 10, đủ ba ngăn
  const b10 = than.indexOf('\n10. '), b11 = than.indexOf('\n11. ');
  const buoc11 = b11 >= 0 ? than.slice(b11) : '';
  chac('F1 skill: có bước 11 sau bước 10, đủ ba ngăn khoá / nguyên tắc / bỏ, ghi ## bài học, không tự làm đề xuất ngoài phạm vi',
    b10 >= 0 && b11 > b10 && ['khoá', 'nguyên tắc', 'bỏ', '## bài học', 'khuon_loi.md', 'đỏ'].every((x) => buoc11.includes(x)), buoc11.slice(0, 200));
  // F2: báo cáo 7 mục ở mọi chỗ (K4)
  const cl = doc(path.join(__dirname, '..', 'CLAUDE.md')) || '';
  chac('F2 CLAUDE.md §7: "bắt buộc đủ 7 mục", có dòng BÀI HỌC:', /bắt buộc đủ 7 mục/.test(cl) && /^BÀI HỌC:/m.test(cl));
  const con6 = ['skill_lam_viec.md', 'THIET_KE.md', 'MAU_PHIEU.md', 'lenh_ra_soat.md', '../CLAUDE.md']
    .filter((f) => /6 mục/.test(doc(path.join(__dirname, f)) || ''));
  chac('F2 không còn "6 mục" trong skill, THIET_KE, MAU_PHIEU, lenh_ra_soat, CLAUDE.md', !con6.length, con6.join(', '));
  chac('F2 skill: báo cáo 7 mục, có BÀI HỌC', /báo cáo 7 mục/.test(than) && than.includes('bài học'));
  // E2–E4: /ra-soat soát CẢ NHÁNH từ mốc PHIEU (máy mây không có ref main), nộp bằng SubagentHandback, có BÀI HỌC
  const rs = doc(path.join(__dirname, 'lenh_ra_soat.md')) || '';
  chac('E2 lenh_ra_soat: diff cả nhánh từ commit PHIEU đầu tiên (regex có neo), không còn câu dặn cũ "git diff của các thay đổi chưa commit"',
    rs.includes('--grep="^PHIEU: ') && rs.includes('([^A-Za-z0-9._-]|$)') && /git diff [^\n]*\^ HEAD/.test(rs)
    && /git diff --name-only/.test(rs) && !rs.includes('`git diff` của các thay đổi chưa commit'));
  chac('E3 lenh_ra_soat: dặn nộp báo cáo bằng SubagentHandback; mẫu có BÀI HỌC:', rs.includes('SubagentHandback') && /^BÀI HỌC:/m.test(rs));
  chac('E4 lenh_ra_soat: đủ 6 mục soát (K3, K4, K5, K1, Đường tiền, P1) và câu cấm ĐẠT khi chưa đọc code',
    ['**K3', '**K4', '**K5', '**K1', '**Đường tiền', '**P1'].every((x) => rs.includes(x))
    && rs.includes('Không được kết luận ĐẠT nếu còn mục nào chưa đọc được code thật'));
  chac('E1 lenh_ra_soat: có frontmatter description', /^---\ndescription: \S/.test(rs));
  // G1–G3: mẫu phiếu
  chac('G1 MAU_PHIEU: dòng mẫu "Chờ duyệt kế hoạch" + ghi chú bỏ khi làm thẳng', mp.includes('**Chờ duyệt kế hoạch:**') && /làm thẳng/.test(mp));
  chac('G2 MAU_PHIEU: mục tuỳ chọn ## Bài thử đỏ dạng "không — <lý do>"', mp.includes('## Bài thử đỏ') && mp.includes('không — <lý do>'));
  chac('G3 MAU_PHIEU: nhắc .github/ máy không sửa, cổng do cai_dat.sh cài', mp.includes('.github/') && mp.includes('cai_dat.sh'));
  // H2 / B7: THIET_KE B15
  const tk = doc(path.join(__dirname, 'THIET_KE.md')) || '';
  const b15 = tk.indexOf('## B15') >= 0 ? tk.slice(tk.indexOf('## B15')) : '';
  chac('H2/B7 THIET_KE B15: pull_request_target, hai job, sudo, lỗ còn hở (chưa được cổng soát, admin), settings.json cũ sau kéo',
    ['pull_request_target', 'cong-chay', 'sudo', 'chưa được cổng soát', 'admin', 'settings.json', 'SubagentHandback', 'bước 11']
      .every((x) => b15.includes(x)), b15.slice(0, 120));
  // HOC-1: mục tuỳ chọn ## Bài thử cũ sửa (MAU_PHIEU, skill), Phát hiện 5 (THIET_KE B15)
  chac('HOC-1 MAU_PHIEU: mục tuỳ chọn ## Bài thử cũ sửa, dạng "- <đường dẫn thu_*.js> — <lý do>", bài thử mới không được miễn, không thay A12',
    mp.includes('## Bài thử cũ sửa') && mp.includes('- <đường dẫn thu_*.js> — <lý do>') && mp.includes('mới') && mp.includes('## Bài thử đỏ')
    && mp.includes('BẢN GỐC'));
  chac('HOC-1 skill: bài thử cũ xanh trên gốc thì báo chủ quán thêm ## Bài thử cũ sửa vào phiếu', than.includes('## bài thử cũ sửa'));
  chac('HOC-1 E THIET_KE B15: .claude/ chỉ đổi qua nguồn tu_chay/ + cai_dat.sh, sửa tay .claude/hooks bị A8',
    ['Phát hiện 5', '.claude/hooks/', 'A8'].every((x) => b15.includes(x)), b15.slice(0, 120));
  // HOC-2 E3: luật mới của bộ khung (cổng A16–A18) phải nằm trong skill, /ra-soat, mẫu phiếu, THIET_KE
  chac('HOC-2 E3a skill: đổi code chạy thật → đột biến VS- (vá sai) + BV- (bỏ vá) trong dot_bien.py, bảng "chỗ vá → đột biến", dòng SỐ CA',
    ['vs-', 'bv-', 'dot_bien.py', 'chỗ vá → đột biến', 'số ca '].every((x) => than.includes(x)));
  chac('HOC-2 E3a skill: mọi tên đột biến ghi vào trang_thai.md', /tên đột biến[^\n]*trang_thai\.md/.test(than));
  chac('HOC-2 E3b skill: trước khi báo xong ĐẾM từng mục nghiệm thu có bằng chứng, không lấy mẫu',
    /đếm[^\n]*mục nghiệm thu/.test(than) && than.includes('không lấy mẫu'));
  chac('HOC-2 E3c skill: thấy thông báo đổi model giữa phiên → ghi giờ + bước vào trang_thai.md', /đổi model[^\n]*giờ/.test(than));
  chac('HOC-2 E3 lenh_ra_soat: đối chiếu ĐỦ từng mục nghiệm thu bằng đếm, liệt kê mục thiếu',
    rs.includes('từng mục nghiệm thu') && /đếm/.test(rs) && rs.includes('mục thiếu'));
  chac('HOC-2 E3 MAU_PHIEU: dòng đếm "SỐ CA <bài thử>: <N>" và đột biến VS- khi đổi server/ hoặc client/src/',
    mp.includes('SỐ CA <') && mp.includes('VS-') && mp.includes('client/src/'));
  let ch = {};
  try { ch = JSON.parse(doc(path.join(__dirname, 'cau_hinh.json'))); } catch {}
  const b2 = tk.indexOf('## B2.') >= 0 ? tk.slice(tk.indexOf('## B2.'), tk.indexOf('## B3.')) : '';
  const khoaB2 = [...b2.matchAll(/^ {2}"(\w+)":/gm)].map((x) => x[1]).sort();
  chac('HOC-2 E3 THIET_KE B2: ví dụ cau_hinh.json có ĐÚNG các khoá của cấu hình thật', JSON.stringify(khoaB2) === JSON.stringify(Object.keys(ch).sort()),
    khoaB2.join(',') + ' ≠ ' + Object.keys(ch).sort().join(','));
  chac('HOC-2 E3 THIET_KE: luật A16, A17, A18; bảng khoá (khoá chỉ-tài-liệu); lý do ban_mau_pos/thu/ không là bài thử cổng; không còn vuot_ngan_sach_canh_bao',
    ['[A16]', '[A17]', '[A18]', 'chỉ-tài-liệu', 'ban_mau_pos/thu/'].every((x) => tk.includes(x)) && !tk.includes('vuot_ngan_sach_canh_bao'));
}

// ═══ HOC-1 C · T2 của kiem_tra_truoc_khi_giao.js bỏ thư mục con ═══════════════
// Chạy KHỐI MÃ THẬT của T2 (cắt từ file luật, giữa "// T2 —" và "// T3 —") trên kho tạm, không đụng kho thật.
function baiT2() {
  const kt = doc(path.join(__dirname, '..', 'kiem_tra_truoc_khi_giao.js')) || '';
  const a = kt.indexOf('\n// T2 —'), b = kt.indexOf('\n// T3 —');
  chac('C cắt được khối T2 thật trong kiem_tra_truoc_khi_giao.js', a >= 0 && b > a);
  if (a < 0 || b <= a) return;
  const t2 = new Function('fs', 'path', 'GOC', 'pass', 'canhBao', kt.slice(a, b));
  const chay = (goc) => { const ra = []; t2(fs, path, goc, (t, g) => ra.push('PASS ' + t + ' ' + (g || '')), (t, g) => ra.push('CANH ' + t + ' ' + (g || ''))); return ra.join('\n'); };
  const kho = (ten, them) => {
    const g = path.join(TAM, ten);
    for (const d of ['tu_chay', '.claude/tu_chay']) { viet(g, d + '/a.js', 'a\n'); viet(g, d + '/PHIEN_BAN', 'v\n'); }
    viet(g, 'tu_chay/cai_dat.js', 'cai\n');
    viet(g, 'tu_chay/con/b.md', 'thư mục con\n');
    if (them) them(g);
    return g;
  };
  const c1 = chay(kho('t2_c1'));
  chac('C1 tu_chay/ có thư mục con, file khớp bản cài → T2 PASS, không cảnh báo', /^PASS /.test(c1) && !/CANH/.test(c1), c1);
  const c2 = chay(kho('t2_c2', (g) => viet(g, '.claude/tu_chay/a.js', 'khác\n')));
  chac('C2 một file lệch bản cài → vẫn CẢNH BÁO "lệch: a.js"', /^CANH /.test(c2) && /lệch: a\.js /.test(c2), c2);
  const c3 = chay(kho('t2_c3', (g) => viet(g, '.claude/tu_chay/thua.txt', 'x\n')));
  chac('C3 .claude/tu_chay/ có FILE thừa → vẫn CẢNH BÁO "thừa: thua.txt"', /^CANH /.test(c3) && /thừa: thua\.txt /.test(c3), c3);
  const c3b = chay(kho('t2_c3b', (g) => viet(g, '.claude/tu_chay/con2/x.md', 'x\n')));
  chac('C3 THƯ MỤC con trong .claude/tu_chay/ không tính là thừa → T2 PASS', /^PASS /.test(c3b) && !/CANH/.test(c3b), c3b);
  // Vòng soát 1: symlink tới FILE vẫn là file (trình cài lọc bằng statSync, đi theo symlink) — T2 phải so như file thường
  const c4 = chay(kho('t2_c4', (g) => { fs.symlinkSync('a.js', path.join(g, 'tu_chay/lien.js')); viet(g, '.claude/tu_chay/lien.js', 'khác\n'); }));
  chac('C2 symlink trong tu_chay/ lệch bản cài → vẫn CẢNH BÁO "lệch: lien.js"', /^CANH /.test(c4) && /lệch: lien\.js /.test(c4), c4);
  const c5 = chay(kho('t2_c5', (g) => fs.symlinkSync('a.js', path.join(g, '.claude/tu_chay/thua.js'))));
  chac('C3 symlink thừa trong .claude/tu_chay/ → vẫn CẢNH BÁO "thừa: thua.js"', /^CANH /.test(c5) && /thừa: thua\.js /.test(c5), c5);
  let c6 = '';
  try { c6 = chay(kho('t2_c6', (g) => fs.symlinkSync('khong_co.js', path.join(g, '.claude/tu_chay/treo.js')))); } catch (e) { c6 = 'SẬP ' + e.message; }
  chac('C3 symlink treo trong .claude/tu_chay/ → CẢNH BÁO "thừa: treo.js", không sập bộ kiểm', /^CANH /.test(c6) && /thừa: treo\.js /.test(c6), c6);
}

for (const bai of [baiXemThu, baiThuVien, baiKeoNhanh, baiKhuonLoi, baiTaiLieu, baiT2]) {
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
