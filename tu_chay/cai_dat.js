#!/usr/bin/env node
// cai_dat.js — trình cài người gác (TU-CHAY-1). Chủ quán chạy qua: bash tu_chay/cai_dat.sh
//
// Agent KHÔNG được sửa .claude/ (luật deny + người gác G1), nên bước cài là của
// chủ quán, trong Shell Replit. Trình cài:
//   1. từ chối nếu đang chạy trong Claude Code (CLAUDECODE / CLAUDE_CODE_CHILD_SESSION)
//   2. kiểm nguồn + tính MỌI thay đổi trong bộ nhớ, kiểm hết điều kiện TRƯỚC khi ghi
//   3. settings.json: bỏ mọi luật ask, bỏ disableAutoMode (cả cấp gốc lẫn permissions.),
//      giữ defaultMode "default", thêm deny, thêm hook PreToolUse "*" (thay bản cũ, không nhân đôi)
//   4. lưu bản gốc .claude/settings.json.truoc_TUCHAY (chỉ lần đầu), ghi file tạm rồi đổi tên
//   5. chép tu_chay/ (trừ cai_dat.*) vào .claude/tu_chay/, cài .git/hooks/pre-push
//   6. chạy lần hai không đổi gì; in đã đổi gì + lệnh git add từng file, git commit
// Lùi: cp .claude/settings.json.truoc_TUCHAY .claude/settings.json
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const LENH_HOOK = 'node "$CLAUDE_PROJECT_DIR/.claude/tu_chay/nguoi_gac.js" || exit 2';
// Chỉ dùng Edit(...): luật Write(...) Claude Code không bao giờ xét (docs/en/permissions).
const DENY_MOI = ['Edit(./.claude/**)', 'Edit(./.env)', 'Edit(./.env.*)', 'Edit(./.replit)', 'Edit(./TIEN_DO_*.json)',
  'Bash(git push *)', 'Bash(git merge *)', 'Bash(git reset *)', 'Bash(git commit -n *)', 'Bash(git -c *)',
  // "*" đứng được ở mọi chỗ trong mẫu (docs/en/permissions): chặn cả --no-verify viết tắt (--no-verif, --no-v…)
  'Bash(git *--no-v*)'];
const PRE_PUSH = `#!/usr/bin/env bash
# pre-push — tu-chay (TU-CHAY-1). Cài bằng: bash tu_chay/cai_dat.sh
# Chặn push chạy TỪ TRONG Claude Code (có CLAUDECODE hoặc CLAUDE_CODE_CHILD_SESSION).
# Chủ quán push trong Shell Replit thì không bị chặn.
# Lưu ý: git push --no-verify bỏ qua hook này — lớp 1 (deny) và người gác vẫn chặn.
if [ -n "$CLAUDECODE" ] || [ -n "$CLAUDE_CODE_CHILD_SESSION" ]; then
  echo "✗ PUSH BỊ CHẶN: lệnh push chạy từ trong Claude Code. Chỉ chủ quán push, trong Shell Replit." >&2
  exit 1
fi
exit 0
`;

const dung = (m) => { console.error('✗ ' + m + '\n  Không ghi gì.'); process.exit(1); };
const doc = (p) => { try { return fs.readFileSync(p); } catch { return null; } };

if (process.env.CLAUDECODE || process.env.CLAUDE_CODE_CHILD_SESSION) {
  dung('đang chạy TRONG Claude Code (có CLAUDECODE / CLAUDE_CODE_CHILD_SESSION). '
    + 'Trình cài chỉ chủ quán chạy, gõ trong Shell của Replit: bash tu_chay/cai_dat.sh');
}
const NGUON = __dirname;
const GOC = path.dirname(NGUON);
const GIT = path.join(GOC, '.git');
try { if (!fs.statSync(GIT).isDirectory()) dung('.git không phải thư mục — cài ở kho chính, không phải worktree'); } catch {
  dung('không thấy .git ở ' + GOC);
}
const hp = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: GOC, encoding: 'utf8', timeout: 10000 });
if (hp.error || String(hp.stdout).trim()) dung('không kiểm được core.hooksPath, hoặc kho đặt core.hooksPath — pre-push trong .git/hooks sẽ không chạy');

// 1. Kiểm nguồn
try { JSON.parse(fs.readFileSync(path.join(NGUON, 'cau_hinh.json'), 'utf8')); } catch (e) { dung('tu_chay/cau_hinh.json hỏng: ' + e.message); }
const kt = spawnSync(process.execPath, ['--check', path.join(NGUON, 'nguoi_gac.js')], { encoding: 'utf8', timeout: 10000 });
if (kt.status !== 0) dung('tu_chay/nguoi_gac.js lỗi cú pháp hoặc không có: ' + String(kt.stderr || (kt.error && kt.error.message)).trim());

// 2. Tính mọi thay đổi trong bộ nhớ
const FILE = fs.readdirSync(NGUON).filter((f) => !/^cai_dat\./.test(f) && fs.statSync(path.join(NGUON, f)).isFile()).sort();
const DICH = path.join(GOC, '.claude', 'tu_chay');
const fileDoi = FILE.filter((f) => { const d = doc(path.join(DICH, f)); return !d || Buffer.compare(d, doc(path.join(NGUON, f))) !== 0; });

const P_SET = path.join(GOC, '.claude', 'settings.json');
const setGoc = doc(P_SET);
if (setGoc === null) dung('không đọc được .claude/settings.json');
let s;
try { s = JSON.parse(setGoc.toString('utf8')); } catch (e) { dung('.claude/settings.json không phải JSON hợp lệ: ' + e.message); }
if (!s || typeof s !== 'object' || Array.isArray(s)) dung('.claude/settings.json không phải một đối tượng JSON');
const quyen = s.permissions = s.permissions && typeof s.permissions === 'object' ? s.permissions : {};
delete quyen.ask;
delete quyen.disableAutoMode;
delete s.disableAutoMode;
quyen.defaultMode = 'default';
quyen.deny = Array.isArray(quyen.deny) ? quyen.deny : [];
for (const d of DENY_MOI) if (!quyen.deny.includes(d)) quyen.deny.push(d);
s.hooks = s.hooks && typeof s.hooks === 'object' ? s.hooks : {};
s.hooks.PreToolUse = (Array.isArray(s.hooks.PreToolUse) ? s.hooks.PreToolUse : [])
  .filter((m) => !JSON.stringify(m).includes('.claude/tu_chay/nguoi_gac.js'))
  .concat([{ matcher: '*', hooks: [{ type: 'command', command: LENH_HOOK, timeout: 30 }] }]);
const setMoi = JSON.stringify(s, null, 2) + '\n';
{ // kiểm JSON mới TRƯỚC khi ghi
  const k = JSON.parse(setMoi);
  const dungHook = k.hooks.PreToolUse.filter((m) => m.matcher === '*' && m.hooks[0].command === LENH_HOOK).length === 1;
  if (!dungHook || !DENY_MOI.every((d) => k.permissions.deny.includes(d)) || k.permissions.ask !== undefined
    || k.disableAutoMode !== undefined || k.permissions.disableAutoMode !== undefined) dung('settings.json mới không qua phép kiểm cấu trúc');
}
const setDoi = setMoi !== setGoc.toString('utf8');

const P_PUSH = path.join(GIT, 'hooks', 'pre-push');
const pushCo = doc(P_PUSH);
if (pushCo !== null && pushCo.toString('utf8') !== PRE_PUSH) {
  dung('đã có .git/hooks/pre-push KHÁC nội dung — không đè. Xem file đó, ghép tay đoạn chặn CLAUDECODE rồi chạy lại.');
}
const pushDoi = pushCo === null || (fs.statSync(P_PUSH).mode & 0o111) === 0;

if (!setDoi && !fileDoi.length && !pushDoi) {
  console.log('· không đổi gì — người gác đã cài đúng từ trước.');
  process.exit(0);
}

// 3. Ghi
const doi = [];
if (setDoi) {
  const bak = P_SET + '.truoc_TUCHAY';
  if (!fs.existsSync(bak)) { fs.writeFileSync(bak, setGoc); doi.push('lưu bản gốc .claude/settings.json.truoc_TUCHAY'); }
  const tam = P_SET + '.tam_TUCHAY';
  fs.writeFileSync(tam, setMoi);
  fs.renameSync(tam, P_SET);
  doi.push('.claude/settings.json: bỏ ask + disableAutoMode, giữ defaultMode "default", thêm deny, thêm hook PreToolUse "*"');
}
if (fileDoi.length) {
  fs.mkdirSync(DICH, { recursive: true });
  for (const f of fileDoi) fs.copyFileSync(path.join(NGUON, f), path.join(DICH, f));
  doi.push('.claude/tu_chay/: chép ' + fileDoi.join(', '));
}
if (pushDoi) {
  fs.mkdirSync(path.dirname(P_PUSH), { recursive: true });
  fs.writeFileSync(P_PUSH, PRE_PUSH);
  fs.chmodSync(P_PUSH, 0o755);
  doi.push('.git/hooks/pre-push: chặn push khi có CLAUDECODE / CLAUDE_CODE_CHILD_SESSION (không đi theo git)');
}

console.log('✓ Đã cài người gác. Đã đổi:');
for (const d of doi) console.log('  · ' + d);
console.log('\nLệnh tiếp theo — gõ trong Shell, add TỪNG file một:');
console.log('  git add .claude/settings.json');
for (const f of FILE) console.log('  git add .claude/tu_chay/' + f);
console.log('  git commit -m "TU-CHAY-1: chu quan cai nguoi gac vao .claude"');
console.log('\nRồi mở phiên MỚI: claude --permission-mode auto  → gõ /permissions để xem luật deny.');
console.log('Lùi settings: cp .claude/settings.json.truoc_TUCHAY .claude/settings.json');
