#!/usr/bin/env node
// cai_dat.js — trình cài người gác (TU-CHAY-1). Chủ quán chạy qua: bash tu_chay/cai_dat.sh
//
// Agent KHÔNG được sửa .claude/ (luật deny + người gác G1), nên bước cài là của
// chủ quán, trong Shell Replit. Trình cài:
//   1. từ chối nếu đang chạy trong Claude Code (CLAUDECODE / CLAUDE_CODE_CHILD_SESSION)
//   2. kiểm nguồn + tính MỌI thay đổi trong bộ nhớ, kiểm hết điều kiện TRƯỚC khi ghi
//   3. settings.json: bỏ mọi luật ask, bỏ disableAutoMode (cả cấp gốc lẫn permissions.),
//      giữ defaultMode "default", bỏ deny push chung (TU-CHAY-2a), thêm deny, thêm hook PreToolUse "*"
//      (thay bản cũ, không nhân đôi)
//   4. lưu bản gốc .claude/settings.json.truoc_TUCHAY (chỉ lần đầu), ghi file tạm rồi đổi tên
//   5. chép tu_chay/ (trừ cai_dat.*) vào .claude/tu_chay/, cài .git/hooks/pre-push
//   5b. TU-CHAY-2: chép tu_chay/skill_lam_viec.md thành .claude/skills/lam-viec/SKILL.md; thêm hook SessionStart
//       gọi bản ĐÃ CÀI .claude/tu_chay/cai_thu_vien.sh (chỉ làm việc khi CLAUDE_CODE_REMOTE=true — máy mây)
//   5c. TU-CHAY-3: BAN_CAI — chép thêm tu_chay/lenh_ra_soat.md → .claude/commands/ra-soat.md và
//       tu_chay/cong_github.yml → .github/workflows/cong.yml (cổng PR; máy không sửa được .github/, chủ quán cài).
//       Ghép hook (ghepHook): gỡ ĐÚNG hook bộ khung khỏi từng mục, giữ hook khác của chủ quán kể cả khi chung mục.
//   6. chạy lần hai không đổi gì; in đã đổi gì + lệnh git add từng file, git commit
// Lùi: cp .claude/settings.json.truoc_TUCHAY .claude/settings.json
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Chỉ dùng Edit(...): luật Write(...) Claude Code không bao giờ xét (docs/en/permissions).
// Edit(...) song song với file_cam của cau_hinh.json (TU-CHAY-3: thêm .github/**).
const DENY_MOI = ['Edit(./.claude/**)', 'Edit(./.env)', 'Edit(./.env.*)', 'Edit(./.replit)', 'Edit(./TIEN_DO_*.json)',
  'Edit(./.github/**)', 'Bash(git merge *)', 'Bash(git reset *)', 'Bash(git commit -n *)', 'Bash(git -c *)',
  // "*" đứng được ở mọi chỗ trong mẫu (docs/en/permissions): chặn cả --no-verify viết tắt (--no-verif, --no-v…)
  'Bash(git *--no-v*)',
  // TU-CHAY-2a: máy mây phải push được nhánh việc → bỏ deny push CHUNG (DENY_BO), thay bằng deny HẸP.
  // Lưới thô: người gác (GIT-PUSH) mới là lớp chính xác; đây bắt main, ép đè (-f, --force*, --follow-tags),
  // xoá (-d, --delete, --dry-run), gương, mọi nhánh, tag, prune, refspec có : hoặc +.
  // Nguồn: code.claude.com/docs/en/permissions — "*" đứng mọi chỗ; `Bash(git * main)` khớp `git push origin main`;
  // Claude Code tách lệnh ghép theo && ; | nên mỗi đoạn xét riêng; deny thắng allow.
  'Bash(git push *main*)', 'Bash(git push *-f*)', 'Bash(git push *-d*)', 'Bash(git push *--mirror*)', 'Bash(git push *--all*)',
  'Bash(git push *--tags*)', 'Bash(git push *--prune*)', 'Bash(git push *:*)', 'Bash(git push *+*)'];
const DENY_BO = ['Bash(git push *)', 'Bash(git push:*)'];
// TU-CHAY-2 mục E — docs/en/cloud-environments "Install dependencies with a SessionStart hook": matcher startup|resume,
// "$CLAUDE_PROJECT_DIR"; hook SessionStart không chặn được phiên (docs/en/hooks). 600 s = mặc định của tài liệu, ghi rõ.
const LENH_THU_VIEN = 'bash "$CLAUDE_PROJECT_DIR/.claude/tu_chay/cai_thu_vien.sh"';
const MUC_THU_VIEN = { matcher: 'startup|resume', hooks: [{ type: 'command', command: LENH_THU_VIEN, timeout: 600 }] };
// Gỡ hook bộ khung (lệnh chứa `dau`) khỏi từng mục, bỏ mục chỉ khi hết hook; đã có đúng `muc` thì giữ chỗ, không thì thêm cuối.
function ghepHook(ds, muc, dau) {
  ds = Array.isArray(ds) ? ds : [];
  const i = ds.findIndex((m) => JSON.stringify(m) === JSON.stringify(muc));
  const sach = ds.map((m, j) => (j === i || !m || !Array.isArray(m.hooks) ? m
    : { ...m, hooks: m.hooks.filter((h) => !JSON.stringify(h).includes(dau)) })).filter((m) => !m || !Array.isArray(m.hooks) || m.hooks.length);
  return i >= 0 ? sach : sach.concat([muc]);
}
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
// BAN_CAI: [nguồn trong tu_chay/, đích] — chép nguyên byte; MỘT bảng trong cau_hinh.json cho trình cài, cổng, bộ kiểm T4
// MUC_GAC: mục hook PreToolUse của người gác — MỘT định nghĩa trong cau_hinh.json (cổng so cấu trúc với nó)
let BAN_CAI = [], MUC_GAC = null;
try { ({ ban_cai: BAN_CAI, muc_gac: MUC_GAC } = JSON.parse(fs.readFileSync(path.join(NGUON, 'cau_hinh.json'), 'utf8'))); } catch (e) {
  dung('tu_chay/cau_hinh.json hỏng: ' + e.message);
}
if (!MUC_GAC || MUC_GAC.matcher !== '*' || !Array.isArray(MUC_GAC.hooks) || MUC_GAC.hooks.length !== 1
  || !String(MUC_GAC.hooks[0].command).includes('.claude/tu_chay/nguoi_gac.js') || !/\|\| exit 2$/.test(MUC_GAC.hooks[0].command)) {
  dung('tu_chay/cau_hinh.json: muc_gac phải là mục hook người gác (matcher "*", lệnh … nguoi_gac.js || exit 2)');
}
if (!Array.isArray(BAN_CAI) || !BAN_CAI.every((c) => Array.isArray(c) && c.length === 2 && !/(^|\/)\.\.(\/|$)/.test(c.join('/')))) {
  dung('tu_chay/cau_hinh.json: ban_cai phải là danh sách [nguồn, đích]');
}
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
quyen.deny = (Array.isArray(quyen.deny) ? quyen.deny : []).filter((d) => !DENY_BO.includes(d));
for (const d of DENY_MOI) if (!quyen.deny.includes(d)) quyen.deny.push(d);
s.hooks = s.hooks && typeof s.hooks === 'object' ? s.hooks : {};
s.hooks.PreToolUse = ghepHook(s.hooks.PreToolUse, MUC_GAC, '.claude/tu_chay/nguoi_gac.js');
s.hooks.SessionStart = ghepHook(s.hooks.SessionStart, MUC_THU_VIEN, '.claude/tu_chay/cai_thu_vien.sh');
const setMoi = JSON.stringify(s, null, 2) + '\n';
{ // kiểm JSON mới TRƯỚC khi ghi
  const k = JSON.parse(setMoi);
  const dungHook = k.hooks.PreToolUse.filter((m) => JSON.stringify(m) === JSON.stringify(MUC_GAC)).length === 1
    && JSON.stringify(k.hooks.PreToolUse).split('.claude/tu_chay/nguoi_gac.js').length === 2
    && JSON.stringify(k.hooks.SessionStart).split('.claude/tu_chay/cai_thu_vien.sh').length === 2
    && k.hooks.SessionStart.filter((m) => JSON.stringify(m) === JSON.stringify(MUC_THU_VIEN)).length === 1;
  if (!dungHook || !DENY_MOI.every((d) => k.permissions.deny.includes(d)) || DENY_BO.some((d) => k.permissions.deny.includes(d))
    || k.permissions.ask !== undefined
    || k.disableAutoMode !== undefined || k.permissions.disableAutoMode !== undefined) dung('settings.json mới không qua phép kiểm cấu trúc');
}
const setDoi = setMoi !== setGoc.toString('utf8');

// Bản cài nguồn phẳng (skill /lam-viec, /ra-soat, cổng GitHub)
const banDoi = BAN_CAI.filter(([n, d]) => {
  const nd = doc(path.join(NGUON, n));
  if (nd === null) dung('thiếu tu_chay/' + n);
  const co = doc(path.join(GOC, d));
  return !co || Buffer.compare(co, nd) !== 0;
});

const P_PUSH = path.join(GIT, 'hooks', 'pre-push');
const pushCo = doc(P_PUSH);
if (pushCo !== null && pushCo.toString('utf8') !== PRE_PUSH) {
  dung('đã có .git/hooks/pre-push KHÁC nội dung — không đè. Xem file đó, ghép tay đoạn chặn CLAUDECODE rồi chạy lại.');
}
const pushDoi = pushCo === null || (fs.statSync(P_PUSH).mode & 0o111) === 0;

if (!setDoi && !fileDoi.length && !pushDoi && !banDoi.length) {
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
  doi.push('.claude/settings.json: bỏ ask + disableAutoMode, giữ defaultMode "default", bỏ deny push chung, thêm deny hẹp, hook PreToolUse "*", '
    + 'hook SessionStart cài thư viện (máy mây)');
}
if (fileDoi.length) {
  fs.mkdirSync(DICH, { recursive: true });
  for (const f of fileDoi) fs.copyFileSync(path.join(NGUON, f), path.join(DICH, f));
  doi.push('.claude/tu_chay/: chép ' + fileDoi.join(', '));
}
for (const [n, d] of banDoi) {
  fs.mkdirSync(path.dirname(path.join(GOC, d)), { recursive: true });
  fs.copyFileSync(path.join(NGUON, n), path.join(GOC, d));
  doi.push(`${d}: chép từ tu_chay/${n}`);
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
for (const [, d] of BAN_CAI) console.log('  git add ' + d);
console.log('  git commit -m "TU-CHAY: chu quan cai nguoi gac vao .claude"');
console.log('\nKHÔNG mở claude trong Shell Replit. Máy chạy trên claude.ai/code, phiên MỚI, đúng nhánh việc, chế độ Auto.');
console.log('Lùi settings: cp .claude/settings.json.truoc_TUCHAY .claude/settings.json');
