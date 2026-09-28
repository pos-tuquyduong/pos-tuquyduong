#!/usr/bin/env node
// nguoi_gac.js — lớp 2 của hệ thống tự chạy (THIET_KE B3, TU-CHAY-1).
//
// Hook PreToolUse, matcher "*". Lệnh hook:
//   node "$CLAUDE_PROJECT_DIR/.claude/tu_chay/nguoi_gac.js" || exit 2
// "CHỈ CHO NHỮNG GÌ CẦN": công cụ, chương trình, lệnh git/npm lạ đều bị chặn.
//   · không phản đối → exit 0, không in gì (lớp 1 + auto mode xử tiếp)
//   · chặn → JSON permissionDecision "deny" + lý do ra stderr + exit 2
//     (exit 2 chặn kể cả khi JSON hỏng — code.claude.com/docs/en/hooks)
//   · KHÔNG BAO GIỜ trả "allow". Lỗi, thiếu cấu hình, quá giờ → chặn.
// Không gọi lệnh con nào (nhánh đọc thẳng .git/HEAD) → không có gì treo được.
// Bài thử: node tu_chay/thu_nguoi_gac.js — mọi mã trong LUAT phải làm đỏ khi tắt.
'use strict';
const fs = require('fs');
const path = require('path');

// [mã, lý do + nên làm gì thay]. Mọi chỗ ra quyết định gọi luat('<mã>').
const LUAT = [
  ['NG-JSON', 'đầu vào hook hỏng (không phải JSON, thiếu tool_name hoặc đường dẫn) — không xét được thì chặn'],
  ['NG-GOC', 'không xác định được gốc kho (CLAUDE_PROJECT_DIR) — mở claude từ gốc kho'],
  ['NG-CAUHINH', 'thiếu hoặc hỏng .claude/tu_chay/cau_hinh.json — báo chủ quán chạy lại tu_chay/cai_dat.sh'],
  ['CC-DOC', 'công cụ chỉ đọc / điều phối được cho qua'],
  ['CC-MONITOR', 'Monitor chạy lệnh: xét như Bash'],
  ['CC-LA', 'công cụ không có trong danh sách cho phép — dùng Read/Grep/Glob/Bash/Edit/Write; cần công cụ này thì ghi mục Câu hỏi'],
  ['G-NHAP', 'ghi trong thư mục nháp được cho'],
  ['G-PLANS', 'Edit/Write kế hoạch vào ~/.claude/plans được cho'],
  ['G0-NGOAI', 'đích nằm ngoài kho và ngoài nháp — file tạm thì ghi vào thư mục nháp (scratchpad)'],
  ['G1-KHUNG', '.claude/, .git/ và nhật ký người gác không ai trong Claude Code được sửa — đổi luật là việc riêng, chủ quán duyệt'],
  ['G1-CAM', 'file cấm (file_cam: .env, .replit, sổ việc) — không sửa; sổ việc do chủ quán ghi trong Shell'],
  ['G1-PHIEU', 'phiếu và biên bản soát không được sửa — cần đổi phiếu thì ghi mục Câu hỏi trong trang_thai.md'],
  ['G2-VIEC', 'không ở nhánh viec/<MÃ> thì không được sửa file trong kho — chủ quán giao việc bằng chay.sh'],
  ['G2-PHIEU', 'nhánh viec/<MÃ> chưa có phiếu, hoặc phiếu thiếu mục "## Phạm vi" — dừng, báo chủ quán'],
  ['G3-HOSO', 'ke_hoach.md / trang_thai.md của việc đang chạy được sửa'],
  ['G-LUAT', 'file luật chỉ sửa được khi mục Phạm vi ghi ĐÚNG TÊN file (glob chung không tính) — ghi mục Câu hỏi'],
  ['G4-PHAMVI', 'file khớp mục Phạm vi được sửa'],
  ['G5-NGOAIPV', 'ngoài phạm vi phiếu — ghi vào mục Câu hỏi của trang_thai.md, làm tiếp phần khác'],
  ['G-LIENKET', 'đích ghi là file thường đang có nhiều liên kết cứng (nlink > 1) — có thể là liên kết cứng tới file được bảo vệ; xoá liên kết rồi tạo file mới'],
  ['B-BIMAT-CHU', 'lệnh nhắc tới khoá / bí mật (TOKEN, SECRET, API_KEY, environ) — không đọc bí mật'],
  ['B-PHANTICH', 'người gác không hiểu cú pháp lệnh này nên chặn — viết lệnh đơn giản hơn, tách thành nhiều lệnh'],
  ['B-GAN', 'gán biến môi trường nguy hiểm trước lệnh (GIT_*, PATH, LD_*, NODE_OPTIONS, CLAUDE*…) — bỏ phần gán'],
  ['B-BIMAT-FILE', 'lệnh nhắc tới file bí mật (.env, .replit) — không đọc, không chép file bí mật'],
  ['B-TENCHU', 'tên chương trình phải viết thẳng, không qua biến, $() hay ký tự đại diện'],
  ['B-DUONGDAN', 'chương trình gọi qua đường dẫn lạ — gọi thẳng tên chương trình có trong danh sách'],
  ['B-CHUONGTRINH', 'chương trình không có trong danh sách cho phép (sh -c, eval, xargs, env, sudo… đều bị chặn) — cần thì ghi mục Câu hỏi'],
  ['B-BASHFILE', 'bash/sh chỉ chạy đúng một script trong .claude/tu_chay/ hoặc cong_cu/'],
  ['B-BASHTHEM', 'bash/sh chạy được file ghi ĐÚNG đường dẫn trong tep_bash_them của cau_hinh.json (không glob)'],
  ['B-TIMEOUT', 'timeout: xét lệnh bên trong'],
  ['B-CD', 'cd chỉ vào thư mục trong kho hoặc nháp, đường dẫn viết thẳng'],
  ['B-CD-VITRI', 'cd chỉ được đứng ĐẦU lệnh, không chuyển hướng, không gán biến, và chỉ nối tiếp bằng && (vd: cd client && npm run build)'],
  ['B-CD-KHUNG', 'không cd vào .git/ hay .claude/'],
  ['B-DICHCHU', 'đích ghi phải là đường dẫn viết thẳng (không biến, không ký tự đại diện) để người gác kiểm được'],
  ['B-GHI-CHUYENHUONG', 'đích chuyển hướng > >> được xét như sửa file'],
  ['B-DEV', 'ghi ra /dev/null, /dev/stdout, /dev/stderr được cho'],
  ['B-TEE', 'đích của tee được xét như sửa file'],
  ['B-GHI-PHU', 'đích ghi của sort -o, uniq, xxd được xét như sửa file'],
  ['B-GHI-TOUCH', 'đích của touch / chmod được xét như sửa file'],
  ['GIT-TUYCHON', 'git không được kèm -C, -c, --git-dir, --work-tree… — cd vào thư mục rồi gọi git'],
  ['GIT-LENH', 'lệnh git con không có trong danh sách (push, merge, reset, rebase, stash, config… bị cấm) — đẩy/gộp là việc của chủ quán'],
  ['GIT-OUTPUT', 'git --output / --ext-diff / grep -O bị chặn — dùng > vào nháp'],
  ['GIT-ADD', 'git add phải kèm tên file cụ thể (không -A, -u, -f, ., glob)'],
  ['GIT-COMMIT-CO', 'git commit không được kèm -n/--no-verify/--amend/-a/-i/-o'],
  ['GIT-COMMIT-NHANH', 'chỉ commit trên nhánh viec/*'],
  ['GIT-CHECKOUT', 'git checkout chỉ cho -b viec/<tên> hoặc -- <file trong phạm vi>'],
  ['GIT-CHECKOUT-FILE', 'git checkout -- <file>: mỗi file xét như sửa file'],
  ['GIT-BRANCH', 'git branch chỉ được xem (--show-current, -a, -v…)'],
  ['GIT-ARCHIVE', 'git archive: không --remote; -o phải trỏ vào nháp'],
  ['NPM-LENH', 'npm chỉ cho test, ci, run, ls — thêm thư viện phải hỏi chủ quán'],
  ['PY-PATCH', 'không chạy patch_*.py'],
  ['PY-M', 'python3 -m chạy được pip/venv/http.server và mã tuỳ ý — cần thì ghi mục Câu hỏi'],
  ['PY-SO', 'không ghi sổ việc (ghi_tien_do, dong_tien_do.py kèm tham số) — chủ quán ghi trong Shell'],
  ['NODE-CAIDAT', 'trình cài cai_dat.* chỉ chủ quán chạy trong Shell'],
  ['B-MANOI', 'mã viết thẳng trong lệnh (node -e, python3 -c, heredoc) nhắc tới file được bảo vệ'],
  ['RM-NHAP', 'chỉ được xoá trong thư mục nháp'],
  ['CP-DICH', 'đích cp / mv / ln được xét như sửa file'],
  ['LN-CUNG', 'ln phải có -s (liên kết mềm); cp không được -l/--link — liên kết cứng lách được kiểm đích ghi'],
  ['CP-DEQUY', 'chép / chuyển cả thư mục chỉ được làm vào nháp'],
  ['MV-NGUON', 'mv xoá file nguồn: nguồn được xét như sửa file'],
  ['TAR-LA', 'tar: không rõ chế độ, hoặc có tuỳ chọn chạy chương trình'],
  ['TAR-C', 'file tar tạo ra được xét như sửa file'],
  ['TAR-X', 'tar -x chỉ giải nén vào nháp'],
  ['SED-I', 'sed -i bị chặn — sửa file bằng Edit'],
  ['SED-WE', 'sed có lệnh ghi file (w), chạy lệnh (e) hoặc đọc kịch bản từ file (-f)'],
  ['AWK-GHI', 'awk ghi file / chạy lệnh (system, |, print >) hoặc đọc chương trình từ file (-f)'],
  ['FIND-CAM', 'find -delete / -exec / -ok / -fprint bị chặn'],
  ['CURL-HOST', 'curl chỉ gọi localhost / 127.0.0.1, URL viết thẳng'],
  ['CURL-CAM', 'curl -K / -O / --trace… bị chặn'],
  ['CURL-GHI', 'file curl ghi ra (-o, -c, -D) được xét như sửa file'],
  ['MKDIR-DICH', 'mkdir chỉ trong nháp, hoặc trong kho ngoài .claude/ và .git/'],
  ['FILE-C', 'file -C / --compile ghi file .mgc — không đi qua kiểm đích ghi, bị chặn'],
];
const MO_TA = Object.fromEntries(LUAT);
// Mã cơ chế — không phải luật để tắt thử, bài thử kiểm bằng tiến trình thật.
Object.assign(MO_TA, {
  'NG-LOI': 'người gác gặp lỗi bất ngờ — fail-closed, chặn',
  'NG-GIO': 'đầu vào hook không đến kịp (stdin không đóng / quá giờ) — chặn',
  'NG-TRAN': 'đầu vào hook quá 20 MB — chặn',
  'NG-NHATKY': 'không ghi được nhật ký người gác — có thể đĩa đầy, dọn thư mục nháp',
});

const CONG_CU_DOC = new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch', 'Agent', 'TodoWrite', 'ExitPlanMode',
  'AskUserQuestion', 'Skill', 'ToolSearch', 'EnterPlanMode', 'TaskCreate', 'TaskUpdate', 'TaskGet', 'TaskList', 'TaskOutput']);
const CONG_CU_SUA = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const CHO_CHAY = new Set(('git node npm python3 ls cat head tail wc grep sed awk sort uniq cut diff find echo printf date pwd '
  + 'du df mkdir cp mv rm tar ln sleep curl kill cd test true timeout tee touch chmod sha256sum md5sum stat file basename '
  + 'dirname realpath tr cmp comm nl seq xxd od which uname whoami id ps').split(' '));
const GIT_CHO = new Set(['status', 'diff', 'log', 'show', 'add', 'commit', 'checkout', 'branch', 'rev-parse', 'ls-files',
  'grep', 'blame', 'merge-base', 'cat-file', 'archive']);
const BRANCH_XEM = new Set(['--show-current', '-a', '-r', '-v', '-vv', '--list', '--all', '--remotes', '--no-color']);
const BIEN_NGUY = /^(GIT_\w*|LD_\w*|PATH|NODE_OPTIONS|BASH_ENV|ENV|IFS|HOME|CLAUDE\w*|TU_CHAY\w*|npm_config_\w*|NPM_CONFIG_\w*|PROMPT_COMMAND|PYTHON\w*|SHELLOPTS|BASHOPTS|PS4|CURL_HOME|(?:https?|ftp|all|no)_proxy)$/i;
const MAU_BI_MAT = ['.env', '.env.local', '.env.production', '.replit'];
const MANOI_CO_DINH = ['\\.claude', '\\.git/', 'settings\\.json', 'phieu\\.md', 'bien_ban_soat', 'tu_chay_nhat_ky'];
const NHAT_KY = '.tu_chay_nhat_ky.jsonl';

let TAT = new Set();
const luat = (ma) => !TAT.has(ma);
const CHO = Object.freeze({ quyet: 'CHO' });
const chan = (ma, chiTiet) => ({ quyet: 'CHAN', ma,
  ly_do: `[${ma}] người gác chặn: ${MO_TA[ma]}${chiTiet ? ' · ' + String(chiTiet).slice(0, 300) : ''}` });

// ── Đường dẫn ────────────────────────────────────────────────────────────────
const laCon = (p, cha) => !!cha && (p === cha || p.startsWith(cha + path.sep));
function thuc(p) { // realpath phần tổ tiên đang có; symlink treo → coi như ra ngoài
  const duoi = [];
  let dau = p;
  for (;;) {
    try { return path.join(fs.realpathSync(dau), ...duoi); } catch {}
    try { if (fs.lstatSync(dau).isSymbolicLink()) return path.join(path.sep, '\u0000symlink-treo'); } catch {}
    const cha = path.dirname(dau);
    if (cha === dau) return p;
    duoi.unshift(path.basename(dau));
    dau = cha;
  }
}
const laDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function globRe(g, chamDau = false) {
  let r = '';
  for (let i = 0; i < g.length;) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      if (g[i + 2] === '/') { r += '(?:.*/)?'; i += 3; } else { r += '.*'; i += 2; }
    } else if (c === '*') { r += '[^/]*'; i++; } else if (c === '?') { r += '[^/]'; i++; } else if (c === '{' && g.indexOf('}', i) > i) {
      const j = g.indexOf('}', i);
      r += '(?:' + g.slice(i + 1, j).split(',').map(thoat).join('|') + ')'; i = j + 1;
    } else if (c === '[' && g.indexOf(']', i + 1) > i) {
      const j = g.indexOf(']', i + 1);
      r += '[' + g.slice(i + 1, j).replace(/^!/, '^').replace(/\\/g, '\\\\') + ']'; i = j + 1;
    } else { r += thoat(c); i++; }
  }
  return new RegExp('^' + (chamDau && /^[*?[]/.test(g) ? '(?!\\.)' : '') + r + '$');
}
// Mẫu không có "/" (và theoTen) thì so với tên file ở mọi tầng; có "/" thì so cả đường dẫn.
const khop = (ds, rel, theoTen) => ds.some((m) => globRe(m).test(theoTen && !m.includes('/') ? path.basename(rel) : rel));
const trongNhap = (abs, nc) => laCon(abs, nc.nhap);
// Tuỳ chọn dài VIẾT TẮT: git, getopt_long (sort, sed, tar, cp…), file nhận mọi tiền tố không mơ hồ
// (git commit --no-verif = --no-verify). Từ --x là tiền tố của tên nào (không đặt độ dài tối thiểu) → coi là tên đó.
const laDai = (v, ...ten) => { const k = v.split('=')[0]; return /^--[^-]/.test(k) && ten.some((t) => t.startsWith(k)); };
const relKho = (abs, nc) => path.relative(nc.goc, abs).split(path.sep).join('/');
const ngoaiKho = (rel) => rel.startsWith('..') || path.isAbsolute(rel);
const KHUNG = /^(\.claude|\.git)(\/|$)/;

// MỘT hàm cho mọi đường ghi: Edit/Write/MultiEdit/NotebookEdit, > >> tee, cp mv ln, tar, git checkout --, touch chmod…
function ghiDuoc(p, nc, cwd, laCongCuSua) {
  const abs = thuc(path.resolve(cwd, p));
  if (luat('G-LIENKET')) { try { const st = fs.lstatSync(abs); if (st.isFile() && st.nlink > 1) return chan('G-LIENKET', relKho(abs, nc)); } catch {} }
  if (luat('G-NHAP') && trongNhap(abs, nc)) return null;
  if (laCongCuSua && luat('G-PLANS') && laCon(abs, nc.plans)) return null;
  const rel = relKho(abs, nc);
  if (luat('G0-NGOAI') && ngoaiKho(rel)) return chan('G0-NGOAI', abs);
  if (luat('G1-KHUNG') && (KHUNG.test(rel) || rel.startsWith('.tu_chay_nhat_ky'))) return chan('G1-KHUNG', rel);
  if (luat('G1-CAM') && khop(nc.cauHinh.file_cam, rel, true)) return chan('G1-CAM', rel);
  if (luat('G1-PHIEU') && /^viec\/[^/]+\/(phieu\.md|bien_ban_soat\.json)$/.test(rel)) return chan('G1-PHIEU', rel);
  if (luat('G2-VIEC') && !nc.ma) return chan('G2-VIEC', `nhánh hiện tại: ${nc.nhanh || '(không rõ / HEAD tách rời)'}`);
  if (luat('G2-PHIEU') && !nc.phamVi) return chan('G2-PHIEU', `viec/${nc.ma}/phieu.md`);
  if (luat('G3-HOSO') && (rel === `viec/${nc.ma}/ke_hoach.md` || rel === `viec/${nc.ma}/trang_thai.md`)) return null;
  const pv = nc.phamVi || [];
  if (luat('G-LUAT') && khop(nc.cauHinh.file_luat, rel, false) && !pv.includes(rel)) return chan('G-LUAT', rel);
  if (luat('G4-PHAMVI') && khop(pv, rel, false)) return null;
  return luat('G5-NGOAIPV') ? chan('G5-NGOAIPV', rel) : null;
}

// ── Bộ tách lệnh Bash: hiểu dấu nháy, gọi đệ quy cho $( ), ` `, ( ), heredoc ──
// Kết quả: danh sách mục; mục là lệnh { tu, gan, cc, con, vao } hoặc khối con { khoi: [...] }.
//   tu: từ ({ tho, val, coBien, coGlob, chu }) · gan: phần gán A=b · cc: đích ghi của chuyển hướng
//   con: các $( ) / ` ` bên trong · vao: nội dung heredoc / here-string đưa vào stdin
const loiPT = (m) => Object.assign(new Error(m), { phanTich: true });
const KET_TU = ' \t\n;&|<>()';

function tachLenh(s, home) {
  const st = { s, i: 0, cho: [], home };
  const ds = dsLenh(st, null);
  if (st.cho.length) throw loiPT('heredoc không có dòng kết thúc');
  return ds;
}
function dsLenh(st, dong) {
  const s = st.s, ds = [];
  // ong: mục kế tiếp đứng sau | (kể cả | cuối dòng) — bash chạy nó trong subshell.
  // dau: chỉ số mục đầu của danh sách && / || đang đọc — gặp & thì CẢ danh sách chạy nền.
  let l = null, ong = false, dau = 0;
  const day = (m) => { if (ong) { m.rieng = true; ong = false; } ds.push(m); };
  const ket = () => {
    const co = !!l && (l.tu.length || l.gan.length || l.cc.length || l.con.length || l.coCH);
    if (co) day(l);
    l = null;
    return co;
  };
  for (;;) {
    if (st.i >= s.length) { if (dong) throw loiPT('thiếu ' + dong); ket(); return ds; }
    const c = s[st.i];
    if (c === ' ' || c === '\t') { st.i++; continue; }
    if (c === '\\' && s[st.i + 1] === '\n') { st.i += 2; continue; }
    if (c === '\n') { st.i++; if (ket()) { ds[ds.length - 1].sau = '\n'; dau = ds.length; } docHeredoc(st); continue; }
    if (c === '#') { while (st.i < s.length && s[st.i] !== '\n') st.i++; continue; }
    if (c === dong) { st.i++; ket(); return ds; }
    if (c === ')') throw loiPT(') lạc');
    if ((c === ';' || c === '&' || c === '|') && !s.startsWith('&>', st.i)) {
      if (s.startsWith(';;', st.i)) throw loiPT(';;');
      const op = /^(&&|\|\||\|&)/.test(s.slice(st.i, st.i + 2)) ? s.slice(st.i, st.i + 2) : c;
      st.i += op.length;
      ket();
      // Mỗi phần của pipeline và cả danh sách chạy nền (&) là subshell: cd bên trong không đổi cwd bên ngoài.
      const cuoi = ds[ds.length - 1];
      if (cuoi) cuoi.sau = op;
      if (op === '|' || op === '|&') { if (cuoi) cuoi.rieng = true; ong = true; }
      if (op === '&') for (let j = dau; j < ds.length; j++) ds[j].rieng = true;
      if (op === '&' || op === ';') dau = ds.length;
      continue;
    }
    if (c === '(') { if (l) throw loiPT('( giữa lệnh'); st.i++; day({ khoi: dsLenh(st, ')') }); continue; }
    if (!l) l = { tu: [], gan: [], cc: [], con: [], vao: [] };
    const m = /^(\d*)(<<<|<<-|<<|&>>|&>|>>|>\||>&|<&|<>|>|<)/.exec(s.slice(st.i, st.i + 8));
    if (m) { st.i += m[0].length; chuyenHuong(st, l, m[2]); continue; }
    const t = docTu(st, l);
    if (!l.tu.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(t.tho)) l.gan.push(t); else l.tu.push(t);
  }
}
function chuyenHuong(st, l, op) {
  l.coCH = true;
  if (st.s[st.i] === '(') throw loiPT('<( ) / >( ) không hỗ trợ');
  while (st.s[st.i] === ' ' || st.s[st.i] === '\t') st.i++;
  const t = docTu(st, l);
  if (!t.tho) throw loiPT('thiếu đích chuyển hướng');
  if (op === '<<' || op === '<<-') { st.cho.push({ delim: t.val, nhay: /['"\\]/.test(t.tho), catTab: op === '<<-', l }); return; }
  if (op === '<<<') { l.vao.push(t.val); return; }
  if (op === '<' || op === '<&') return;
  if (op === '>&' && t.chu && /^(\d+-?|-)$/.test(t.val)) return;
  l.cc.push(t);
}
function docHeredoc(st) {
  const s = st.s;
  while (st.cho.length) {
    const h = st.cho.shift();
    let than = '', xong = false;
    while (st.i < s.length) {
      let j = s.indexOf('\n', st.i);
      if (j < 0) j = s.length;
      const dong = s.slice(st.i, j);
      st.i = Math.min(j + 1, s.length);
      if ((h.catTab ? dong.replace(/^\t+/, '') : dong) === h.delim) { xong = true; break; }
      than += dong + '\n';
    }
    if (!xong) throw loiPT('heredoc không có dòng kết thúc ' + h.delim);
    if (!h.nhay) { // heredoc không nháy: $( ) và ` ` bên trong VẪN chạy
      const con = { s: than, i: 0, cho: [], home: st.home };
      while (con.i < than.length) {
        const c = than[con.i];
        if (c === '\\') con.i += 2;
        else if ((c === '$' || c === '`') && docThay(con, h.l)) continue;
        else con.i++;
      }
    }
    h.l.vao.push(than);
  }
}
function docThay(st, l) { // $( ), ` `, $X, ${X} → true (từ không còn là chữ); '$' trơn → false
  const s = st.s;
  if (s[st.i] === '`') {
    let j = st.i + 1, trong = '';
    while (j < s.length && s[j] !== '`') { if (s[j] === '\\' && j + 1 < s.length) { trong += s[j + 1]; j += 2; } else trong += s[j++]; }
    if (j >= s.length) throw loiPT('thiếu ` đóng');
    st.i = j + 1;
    l.con.push({ khoi: tachLenh(trong, st.home) });
    return true;
  }
  const n = s[st.i + 1];
  if (n === '(') {
    if (s[st.i + 2] === '(') throw loiPT('$(( )) không hỗ trợ');
    st.i += 2;
    l.con.push({ khoi: dsLenh(st, ')') });
    return true;
  }
  if (n === "'" || n === '"') throw loiPT('$\'…\' / $"…" không hỗ trợ');
  const m = /^\$(\{[A-Za-z_][A-Za-z0-9_]*\}|[A-Za-z_][A-Za-z0-9_]*|[0-9?@#$!*-])/.exec(s.slice(st.i, st.i + 200));
  if (n === '{' && !m) throw loiPT('${…} chỉ hỗ trợ dạng ${TEN}');
  if (m) { st.i += m[0].length; return true; }
  return false;
}
function docTu(st, l) {
  const s = st.s, bd = st.i;
  let val = '', coBien = false, coGlob = false;
  while (st.i < s.length && !KET_TU.includes(s[st.i])) {
    const c = s[st.i];
    if (c === '\\') {
      if (st.i + 1 >= s.length) throw loiPT('\\ ở cuối');
      if (s[st.i + 1] !== '\n') val += s[st.i + 1];
      st.i += 2;
    } else if (c === "'") {
      const j = s.indexOf("'", st.i + 1);
      if (j < 0) throw loiPT("thiếu ' đóng");
      val += s.slice(st.i + 1, j); st.i = j + 1;
    } else if (c === '"') {
      st.i++;
      for (;;) {
        if (st.i >= s.length) throw loiPT('thiếu " đóng');
        const d = s[st.i];
        if (d === '"') { st.i++; break; }
        if (d === '\\' && '"\\$`\n'.includes(s[st.i + 1])) { if (s[st.i + 1] !== '\n') val += s[st.i + 1]; st.i += 2; continue; }
        if ((d === '$' || d === '`') && docThay(st, l)) { coBien = true; val += '\u0000'; continue; }
        val += d; st.i++;
      }
    } else if ((c === '$' || c === '`') && docThay(st, l)) {
      coBien = true; val += '\u0000';
    } else if (c === '~' && st.i === bd) {
      const n = s[st.i + 1];
      if (n === undefined || n === '/' || KET_TU.includes(n)) val += st.home || '\u0000'; else coBien = true;
      if (!st.home) coBien = true;
      st.i++;
    } else {
      if ('*?[]{}'.includes(c)) coGlob = true;
      val += c; st.i++;
    }
  }
  return { tho: s.slice(bd, st.i), val, coBien, coGlob, chu: !coBien && !coGlob };
}

// ── Xét lệnh Bash ────────────────────────────────────────────────────────────
const tuGia = (val, chu = true) => ({ tho: val, val, chu, coBien: !chu, coGlob: false });
const khongChu = (t) => (luat('B-DICHCHU') ? chan('B-DICHCHU', t.tho) : null);
function xetBash(lenh, nc) {
  if (typeof lenh !== 'string') return luat('B-PHANTICH') ? chan('B-PHANTICH', 'lệnh không phải chuỗi') : null;
  const bm = /TOKEN|SECRET|API_KEY|environ/.exec(lenh);
  if (bm && luat('B-BIMAT-CHU')) return chan('B-BIMAT-CHU', bm[0]);
  let ds;
  try { ds = tachLenh(lenh, nc.home); } catch (e) {
    if (!e.phanTich) throw e;
    return luat('B-PHANTICH') ? chan('B-PHANTICH', e.message) : null;
  }
  return xetDs(ds, nc, { d: nc.cwd });
}
function xetDs(ds, nc, cwd) {
  for (let j = 0; j < ds.length; j++) {
    const m = ds[j];
    if (!m.khoi) m.duocCd = j === 0 && !m.rieng && !m.coCH && !m.gan.length && (m.sau === undefined || m.sau === '&&');
    const k = m.khoi ? xetDs(m.khoi, nc, { d: cwd.d }) : xetMot(m, nc, m.rieng ? { d: cwd.d } : cwd);
    if (k) return k;
  }
  return null;
}
function laBiMat(t, nc) {
  if (t.coBien) return false;
  const ten = path.basename(t.val.replace(/\/+$/, ''));
  if (t.coGlob) { const re = globRe(ten, true); return MAU_BI_MAT.some((m) => re.test(m)); }
  return nc.cauHinh.file_bi_mat.some((m) => globRe(m).test(ten));
}
function dichGhi(t, nc, cwd) {
  if (!t.chu) return khongChu(t);
  if (luat('B-DEV') && /^\/dev\/(null|stdout|stderr|tty|fd\/\d+)$/.test(t.val)) return null;
  return ghiDuoc(t.val, nc, cwd.d, false);
}
const dauTien = (ds, f) => { for (const x of ds) { const k = f(x); if (k) return k; } return null; };

function xetMot(l, nc, cwd) {
  const k = dauTien(l.con, (c) => xetDs(c.khoi, nc, { d: cwd.d }));
  if (k) return k;
  for (const g of l.gan) {
    const ten = g.tho.slice(0, g.tho.indexOf('='));
    if (luat('B-GAN') && BIEN_NGUY.test(ten)) return chan('B-GAN', ten);
  }
  if (luat('B-BIMAT-FILE')) {
    const tu = [...l.gan.map((g) => ({ ...g, val: g.val.slice(g.val.indexOf('=') + 1) })), ...l.tu, ...l.cc];
    const bm = tu.find((t) => laBiMat(t, nc));
    if (bm) return chan('B-BIMAT-FILE', bm.tho);
  }
  if (luat('B-GHI-CHUYENHUONG')) { const kc = dauTien(l.cc, (t) => dichGhi(t, nc, cwd)); if (kc) return kc; }
  return l.tu.length ? xetChuong(l.tu, l, nc, cwd) : null;
}

function xetChuong(tu, l, nc, cwd) {
  const t0 = tu[0];
  if (!t0.chu) return luat('B-TENCHU') ? chan('B-TENCHU', t0.tho) : null;
  let ten = t0.val;
  if (ten.includes('/')) {
    if (luat('B-DUONGDAN') && !/^\/(usr|bin|nix\/store)\//.test(path.resolve(cwd.d, ten))) return chan('B-DUONGDAN', ten);
    ten = path.basename(ten);
  }
  const a = tu.slice(1);
  if (ten === 'timeout' && luat('B-TIMEOUT')) {
    let i = 0;
    while (i < a.length && a[i].val.startsWith('-')) {
      const v = a[i].val;
      i += ['-s', '-k'].includes(v) || (!v.includes('=') && laDai(v, '--signal', '--kill-after')) ? 2 : 1;
    }
    return i + 1 < a.length ? xetChuong(a.slice(i + 1), { ...l, duocCd: false }, nc, { d: cwd.d }) : null;
  }
  if ((ten === 'bash' || ten === 'sh') && a.length === 1 && a[0].chu) {
    const rel = relKho(thuc(path.resolve(cwd.d, a[0].val)), nc);
    if (luat('B-BASHFILE') && /^\.claude\/tu_chay\/[^/]+\.sh$|^cong_cu\/.+\.sh$/.test(rel)) return null;
    if (luat('B-BASHTHEM') && nc.cauHinh.tep_bash_them.includes(rel)) return null; // so nguyên chuỗi, không glob
  }
  if (!CHO_CHAY.has(ten) && !nc.cauHinh.chuong_trinh_them.includes(ten)) {
    return luat('B-CHUONGTRINH') ? chan('B-CHUONGTRINH', ten) : null;
  }
  const f = LUAT_CON[ten];
  return f ? f(a, nc, cwd, l) : null;
}

// Tách cờ: ngan = các chữ cờ ngắn có giá trị; dai = cờ dài có giá trị ở từ sau.
function tachCo(a, ngan = '', dai = []) {
  const co = [], vt = [];
  let het = false;
  for (let i = 0; i < a.length; i++) {
    const w = a[i], v = w.val;
    if (het || v === '-' || !v.startsWith('-')) { vt.push(w); continue; }
    if (v === '--') { het = true; continue; }
    if (v.startsWith('--')) {
      const j = v.indexOf('=');
      if (j > 0) co.push({ k: v.slice(0, j), g: tuGia(v.slice(j + 1), w.chu) });
      else if (laDai(v, ...dai)) { i++; co.push({ k: v, g: a[i] || tuGia('') }); } else co.push({ k: v });
      continue;
    }
    for (let j = 1; j < v.length; j++) {
      if (!ngan.includes(v[j])) { co.push({ k: '-' + v[j] }); continue; }
      const du = v.slice(j + 1);
      if (du) co.push({ k: '-' + v[j], g: tuGia(du, w.chu) }); else { i++; co.push({ k: '-' + v[j], g: a[i] || tuGia('') }); }
      break;
    }
  }
  return { co, vt, coCo: (...k) => co.find((c) => k.some((x) => c.k === x || (x.startsWith('--') && laDai(c.k, x)))) };
}
const chuoiVao = (l) => l.vao.join('\n');
function reManoi(nc) {
  const cam = nc.cauHinh.file_cam.map((p) => '(?:^|[^\\w])' + p.split('*').map(thoat).join('[^\\s\'"`/]*') + '(?!\\w)');
  return new RegExp([...MANOI_CO_DINH, ...cam].join('|'));
}
function chepChuyen(ten, a, nc, cwd) {
  const { vt, coCo } = tachCo(a, 'tS', ['--target-directory', '--suffix']);
  if (luat('LN-CUNG')) {
    if (ten === 'ln' && !coCo('-s', '--symbolic')) return chan('LN-CUNG', a.map((w) => w.tho).join(' '));
    const lk = ten === 'cp' && coCo('-l', '--link'); if (lk) return chan('LN-CUNG', lk.k);
  }
  const td = coCo('-t', '--target-directory');
  const khongTd = coCo('-T', '--no-target-directory');
  const deQuy = ten === 'cp' && coCo('-r', '-R', '-a', '--recursive', '--archive');
  let dich = td && td.g, nguon = vt;
  if (!td) { if (vt.length < 2) return null; dich = vt[vt.length - 1]; nguon = vt.slice(0, -1); }
  if (!dich.chu) return khongChu(dich);
  const dichAbs = path.resolve(cwd.d, dich.val);
  const vaoThuMuc = !khongTd && (!!td || dich.val.endsWith('/') || laDir(dichAbs) || nguon.length > 1);
  for (const n of nguon) {
    if (!n.chu && (vaoThuMuc || ten === 'mv')) return khongChu(n);
    const nAbs = path.resolve(cwd.d, n.val);
    if (ten !== 'ln' && luat('CP-DEQUY') && (deQuy || laDir(nAbs)) && !trongNhap(thuc(dichAbs), nc)) return chan('CP-DEQUY', n.val);
    if (ten === 'mv' && luat('MV-NGUON')) { const k = ghiDuoc(n.val, nc, cwd.d, false); if (k) return k; }
    if (luat('CP-DICH')) {
      const k = ghiDuoc(vaoThuMuc ? path.join(dich.val, path.basename(n.val)) : dich.val, nc, cwd.d, false);
      if (k) return k;
    }
  }
  return null;
}
const ghiHet = (ds, nc, cwd) => dauTien(ds, (t) => dichGhi(t, nc, cwd));
function maNoi(ten, a, l) { // lấy mã chạy thẳng + file script của node / python3
  let ma = null, script = null, i = 0;
  const coMa = ten === 'node' ? ['-e', '--eval', '-p', '--print'] : ['-c'];
  const coGt = ten === 'node' ? ['-r', '--require', '--import', '--loader'] : ['-m', '-W', '-X', '-Q'];
  for (; i < a.length; i++) {
    const v = a[i].val;
    const dai = coMa.filter((c) => c.startsWith('--'));
    if (coMa.includes(v) || (!v.includes('=') && laDai(v, ...dai))) { ma = (a[i + 1] || tuGia('')).val; break; }
    if (v.includes('=') && laDai(v, ...dai)) { ma = v.slice(v.indexOf('=') + 1); break; }
    if (ten === 'python3' && /^-c./.test(v)) { ma = v.slice(2); break; }
    if (v === '-m' && ten === 'python3') break;
    if (coGt.includes(v) || laDai(v, ...coGt.filter((c) => c.startsWith('--')))) { if (!v.includes('=')) i++; continue; }
    if (v === '-') { ma = chuoiVao(l); break; }
    if (!v.startsWith('-')) { script = a[i]; break; }
  }
  if (ma === null && !script && i >= a.length) ma = chuoiVao(l);
  return { ma, script, sau: script ? a.slice(i + 1) : [] };
}
// python3 -m: cờ ngắn 'm' (kể cả gộp -sm/-Im) trước khi gặp cờ ăn giá trị (-c -W -X -Q) hoặc positional (script)
function coCoM(a) {
  for (const w of a) {
    const v = w.val;
    if (v === '--' || !v.startsWith('-')) break;
    if (v.startsWith('--')) continue;
    for (let j = 1; j < v.length; j++) { if (v[j] === 'm') return true; if ('cWXQ'.includes(v[j])) break; }
  }
  return false;
}
// process.env KHÔNG theo sau . hoặc [ = đọc TOÀN BỘ biến môi trường (có bí mật). process.env.PORT / [..] cho qua.
const loMoiTruong = (ma) => !!ma && /process\.env(?![.\[])/.test(ma);

const LUAT_CON = {
  git(a, nc, cwd) {
    let i = 0;
    for (; i < a.length && a[i].val.startsWith('-'); i++) {
      if (['--no-pager', '-P'].includes(a[i].val)) continue;
      if (luat('GIT-TUYCHON')) return chan('GIT-TUYCHON', a[i].val);
      if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env'].includes(a[i].val)) i++;
    }
    const sub = a[i];
    if (!sub || !sub.chu || !GIT_CHO.has(sub.val)) return luat('GIT-LENH') ? chan('GIT-LENH', sub ? sub.tho : '(trống)') : null;
    const r = a.slice(i + 1);
    const lenh = sub.val;
    if (lenh !== 'archive' && luat('GIT-OUTPUT') && r.some((w) => laDai(w.val, '--output', '--ext-diff')
      || (lenh === 'grep' && (/^-O/.test(w.val) || laDai(w.val, '--open-files-in-pager'))))) return chan('GIT-OUTPUT');
    if (lenh === 'add' && luat('GIT-ADD')) {
      let het = false;
      for (const w of r) {
        const v = w.val;
        if (!het && v === '--') { het = true; continue; }
        if (!het && v.startsWith('--')) {
          if (laDai(v, '--all', '--update', '--force', '--patch', '--interactive', '--edit', '--no-ignore-removal')) return chan('GIT-ADD', v);
        } else if (!het && v.startsWith('-') && v.length > 1) {
          if (/[Aufpie]/.test(v.slice(1))) return chan('GIT-ADD', v);
        } else if (!w.chu || v === '.' || v === './' || v.startsWith(':') || thuc(path.resolve(cwd.d, v)) === nc.goc) {
          return chan('GIT-ADD', w.tho);
        }
      }
    }
    if (lenh === 'commit') {
      if (luat('GIT-COMMIT-CO')) {
        const coGt = ['--message', '--file', '--author', '--date', '--template', '--reuse-message', '--reedit-message',
          '--fixup', '--squash', '--cleanup', '--trailer'];
        for (let j = 0; j < r.length; j++) {
          const v = r[j].val;
          if (v === '--') break;
          if (v.startsWith('--')) {
            if (laDai(v, '--no-verify', '--amend', '--all', '--include', '--only')) return chan('GIT-COMMIT-CO', v);
            if (!v.includes('=') && laDai(v, ...coGt)) j++;
          } else if (v.startsWith('-') && v.length > 1) {
            for (let x = 1; x < v.length; x++) {
              if ('naio'.includes(v[x])) return chan('GIT-COMMIT-CO', v);
              if ('mFcCt'.includes(v[x])) { if (x === v.length - 1) j++; break; }
            }
          }
        }
      }
      if (luat('GIT-COMMIT-NHANH') && !/^viec\/./.test(nc.nhanh || '')) return chan('GIT-COMMIT-NHANH', nc.nhanh || '(HEAD tách rời)');
    }
    if (lenh === 'checkout') {
      if (r.length === 2 && r[0].val === '-b' && r[1].chu && /^viec\/[A-Za-z0-9._-]+$/.test(r[1].val)) return null;
      if (r.length >= 2 && r[0].val === '--') return luat('GIT-CHECKOUT-FILE') ? ghiHet(r.slice(1), nc, cwd) : null;
      return luat('GIT-CHECKOUT') ? chan('GIT-CHECKOUT', r.map((w) => w.tho).join(' ')) : null;
    }
    if (lenh === 'branch' && luat('GIT-BRANCH') && r.some((w) => !BRANCH_XEM.has(w.val))) return chan('GIT-BRANCH');
    if (lenh === 'archive' && luat('GIT-ARCHIVE')) {
      const { co } = tachCo(r, 'o', ['--output', '--prefix', '--format', '--remote', '--exec']);
      for (const c of co) {
        if (laDai(c.k, '--remote', '--exec')) return chan('GIT-ARCHIVE', c.k);
        if ((c.k === '-o' || laDai(c.k, '--output')) && !(c.g.chu && trongNhap(thuc(path.resolve(cwd.d, c.g.val)), nc))) return chan('GIT-ARCHIVE', c.g.tho);
      }
    }
    return null;
  },
  npm(a) {
    let i = 0;
    while (i < a.length && ['-s', '--silent'].includes(a[i].val)) i++;
    const sub = a[i];
    if (luat('NPM-LENH') && (!sub || !sub.chu || !['test', 'ci', 'run', 'ls'].includes(sub.val))) return chan('NPM-LENH', sub ? sub.tho : '(trống)');
    return null;
  },
  python3(a, nc, cwd, l) {
    if (luat('PY-M') && coCoM(a)) return chan('PY-M', a.map((w) => w.tho).join(' '));
    const { ma, script, sau } = maNoi('python3', a, l);
    const ten = script ? path.basename(script.val) : '';
    if (luat('PY-PATCH') && (/^patch_.*\.py$/.test(ten) || /patch_\w*\.py/.test(ma || ''))) return chan('PY-PATCH');
    const toan = [...a.map((w) => w.val), chuoiVao(l)].join('\n');
    if (luat('PY-SO') && (/ghi_tien_do/.test(toan) || (ten === 'dong_tien_do.py' && sau.length))) return chan('PY-SO');
    if (luat('B-BIMAT-CHU') && loMoiTruong(ma)) return chan('B-BIMAT-CHU', 'process.env');
    if (luat('B-MANOI') && ma && reManoi(nc).test(ma)) return chan('B-MANOI');
    return null;
  },
  node(a, nc, cwd, l) {
    if (luat('NODE-CAIDAT') && a.some((w) => /^cai_dat\.(js|sh)$/.test(path.basename(w.val)))) return chan('NODE-CAIDAT');
    const { ma } = maNoi('node', a, l);
    if (luat('B-BIMAT-CHU') && loMoiTruong(ma)) return chan('B-BIMAT-CHU', 'process.env');
    if (luat('B-MANOI') && ma && reManoi(nc).test(ma)) return chan('B-MANOI');
    return null;
  },
  ps(a) {
    if (luat('B-BIMAT-CHU') && a.some((w) => w.chu && !w.val.startsWith('-') && w.val.includes('e'))) return chan('B-BIMAT-CHU', 'ps e (đọc môi trường)');
    return null;
  },
  grep(a, nc, cwd) {
    if (!luat('B-BIMAT-CHU')) return null;
    const { co, vt } = tachCo(a, 'ABCDdefm', ['--after-context', '--before-context', '--context', '--devices',
      '--directories', '--regexp', '--file', '--max-count', '--exclude', '--exclude-dir', '--exclude-from',
      '--include', '--group-separator', '--binary-files', '--color', '--colour']);
    const deQuy = co.some((c) => c.k === '-r' || c.k === '-R' || laDai(c.k, '--recursive', '--dereference-recursive'));
    if (!deQuy) return null;
    const coEF = co.some((c) => c.k === '-e' || c.k === '-f' || laDai(c.k, '--regexp', '--file'));
    const duong = coEF ? vt : vt.slice(1); // không có -e/-f thì positional đầu là MẪU
    if (!duong.length) duong.push(tuGia('.')); // grep đệ quy không đường dẫn → GNU grep tìm cwd
    const loai = co.filter((c) => c.g && c.k !== '--exclude-dir' && laDai(c.k, '--exclude')).map((c) => c.g.val);
    for (const p of duong) {
      if (!p.chu) continue;
      const dir = thuc(path.resolve(cwd.d, p.val));
      if (!laDir(dir)) continue;
      let ten = [];
      try { ten = fs.readdirSync(dir); } catch { continue; }
      const lo = ten.filter((n) => nc.cauHinh.file_bi_mat.some((m) => globRe(m).test(n)) && !loai.some((ex) => globRe(ex).test(n)));
      if (lo.length) return chan('B-BIMAT-CHU', `grep đệ quy đọc ${lo[0]} trong ${p.val} — thêm --exclude khớp hoặc trỏ vào thư mục con`);
    }
    return null;
  },
  rm(a, nc, cwd) {
    for (const w of tachCo(a).vt) {
      if (w.coBien) return khongChu(w);
      let p = w.val;
      if (w.coGlob) { const j = p.search(/[*?[\]{}]/); p = p.slice(0, j).endsWith('/') ? p.slice(0, j) : path.dirname(p.slice(0, j) + 'x'); }
      const abs = path.resolve(cwd.d, p);
      if (luat('RM-NHAP') && !(trongNhap(abs, nc) && trongNhap(thuc(abs), nc))) return chan('RM-NHAP', w.tho);
    }
    return null;
  },
  cp: (a, nc, cwd) => chepChuyen('cp', a, nc, cwd),
  mv: (a, nc, cwd) => chepChuyen('mv', a, nc, cwd),
  ln: (a, nc, cwd) => chepChuyen('ln', a, nc, cwd),
  tee: (a, nc, cwd) => (luat('B-TEE') ? ghiHet(tachCo(a).vt, nc, cwd) : null),
  touch: (a, nc, cwd) => (luat('B-GHI-TOUCH') ? ghiHet(tachCo(a, 'dtr', ['--date', '--reference']).vt, nc, cwd) : null),
  chmod(a, nc, cwd) {
    const co = ['-R', '-v', '-c', '-f', '--recursive', '--verbose', '--changes', '--silent', '--quiet', '--preserve-root', '--no-preserve-root'];
    const laRef = (w) => laDai(w.val, '--reference');
    const vt = a.filter((w) => !co.includes(w.val) && !laDai(w.val, ...co.filter((c) => c.startsWith('--'))) && !laRef(w));
    if (!a.some(laRef)) vt.shift();
    return luat('B-GHI-TOUCH') ? ghiHet(vt, nc, cwd) : null;
  },
  sort(a, nc, cwd) {
    const o = tachCo(a, 'oktST', ['--output', '--key', '--field-separator', '--buffer-size', '--temporary-directory']).coCo('-o', '--output');
    return o && luat('B-GHI-PHU') ? ghiHet([o.g], nc, cwd) : null;
  },
  uniq: (a, nc, cwd) => (luat('B-GHI-PHU') ? ghiHet(tachCo(a, 'fsw', ['--skip-fields', '--skip-chars', '--check-chars']).vt.slice(1, 2), nc, cwd) : null),
  xxd: (a, nc, cwd) => (luat('B-GHI-PHU') ? ghiHet(tachCo(a, 'cglosn', []).vt.slice(1, 2), nc, cwd) : null),
  tar(a, nc, cwd) {
    const che = new Set(), cho = [];
    let file = null, dir = null;
    const nhan = (ch, gt) => { if (ch === 'f') file = gt; else if (ch === 'C') dir = gt; };
    const chu = (ch, w, du) => {
      if ('ctxruAd'.includes(ch)) che.add(ch);
      if (ch === 'O') che.add('O');
      if (ch === 'I' || ch === 'F') return true;
      if ('fCTXbHKNgLV'.includes(ch)) { if (du !== undefined && du !== '') nhan(ch, tuGia(du, w.chu)); else cho.push(ch); return 'dung'; }
      return false;
    };
    const DAI = { '--file': 'f', '--directory': 'C', '--create': 'c', '--extract': 'x', '--get': 'x', '--list': 't',
      '--append': 'r', '--update': 'u', '--concatenate': 'A', '--catenate': 'A', '--diff': 'd', '--compare': 'd', '--delete': 'D',
      '--to-stdout': 'O' };
    const NGUY = ['--to-command', '--use-compress-program', '--checkpoint-action', '--info-script', '--new-volume-script',
      '--rsh-command', '--rmt-command', '--index-file'];
    for (let i = 0; i < a.length; i++) {
      const w = a[i], v = w.val;
      if (cho.length && !v.startsWith('-')) { nhan(cho.shift(), w); continue; }
      if (v.startsWith('--')) {
        if (laDai(v, ...NGUY)) return luat('TAR-LA') ? chan('TAR-LA', v) : null;
        const gt = v.includes('=') ? v.slice(v.indexOf('=') + 1) : null;
        for (const ten of Object.keys(DAI).filter((t) => laDai(v, t))) { // viết tắt mơ hồ → nhận MỌI nghĩa (an toàn hơn)
          const ch = DAI[ten];
          if (ch === 'f' || ch === 'C') { if (gt !== null) nhan(ch, tuGia(gt, w.chu)); else cho.push(ch); } else che.add(ch);
        }
        continue;
      }
      if (i === 0 && !v.startsWith('-') && /^[A-Za-z]+$/.test(v) || v.startsWith('-')) {
        const bd = v.startsWith('-') ? 1 : 0;
        for (let j = bd; j < v.length; j++) {
          const kq = chu(v[j], w, v.slice(j + 1));
          if (kq === true) return luat('TAR-LA') ? chan('TAR-LA', v) : null;
          if (kq === 'dung') break;
        }
      }
    }
    const ghi = ['c', 'r', 'u', 'A', 'D'].some((c) => che.has(c));
    if (!ghi && !che.has('x') && !che.has('t') && !che.has('d')) return luat('TAR-LA') ? chan('TAR-LA', 'không rõ chế độ') : null;
    if (ghi && file && file.val !== '-' && luat('TAR-C')) { const k = ghiHet([file], nc, cwd); if (k) return k; }
    if (che.has('x') && !che.has('O') && luat('TAR-X')) {
      const d = dir || tuGia(cwd.d);
      if (!d.chu || !trongNhap(thuc(path.resolve(cwd.d, d.val)), nc)) return chan('TAR-X', d.tho);
    }
    return null;
  },
  sed(a) {
    const kich = [];
    let coE = false;
    for (let i = 0; i < a.length; i++) {
      const v = a[i].val;
      if (laDai(v, '--in-place')) return luat('SED-I') ? chan('SED-I', v) : null;
      if (v === '-f' || laDai(v, '--file')) return luat('SED-WE') ? chan('SED-WE', '-f') : null;
      if (laDai(v, '--expression')) { coE = true; kich.push(v.includes('=') ? v.slice(v.indexOf('=') + 1) : (a[++i] || tuGia('')).val); continue; }
      if (/^-[^-]/.test(v)) {
        for (let j = 1; j < v.length; j++) {
          if (v[j] === 'i' && luat('SED-I')) return chan('SED-I', v);
          if (v[j] === 'f') return luat('SED-WE') ? chan('SED-WE', '-f') : null;
          if (v[j] === 'e') { coE = true; kich.push(v.slice(j + 1) || (a[++i] || tuGia('')).val); break; }
        }
        continue;
      }
      if (!coE && !kich.length) kich.push(v);
    }
    const WE = /(^|[;\n{}])\s*(\d+|\$|\/(?:\\.|[^/])*\/)?\s*(,\s*(\d+|\$|\/(?:\\.|[^/])*\/))?\s*!?\s*[wWe](\s|$)|s(.)(?:\\.|(?!\6).)*\6(?:\\.|(?!\6).)*\6[gpiImM0-9]*[we]/;
    if (luat('SED-WE') && kich.some((k) => WE.test(k))) return chan('SED-WE');
    return null;
  },
  awk(a) {
    const { co, vt } = tachCo(a, 'vF', []);
    if (!luat('AWK-GHI')) return null;
    if (co.some((c) => c.k === '-f' || laDai(c.k, '--file'))) return chan('AWK-GHI', '-f');
    const p = vt[0] ? vt[0].val : '';
    if (/system\s*\(|(^|[^|])\|(?!\|)|\bprintf?\b[^;}\n]*>/.test(p)) return chan('AWK-GHI');
    return null;
  },
  file(a) {
    const c = a.find((w) => laDai(w.val, '--compile') || /^-[a-zA-Z]*C/.test(w.val));
    return c && luat('FILE-C') ? chan('FILE-C', c.val) : null;
  },
  find(a) {
    const cam = a.find((w) => /^-(delete|exec|execdir|ok|okdir|fls|fprint0?|fprintf)$/.test(w.val));
    return cam && luat('FIND-CAM') ? chan('FIND-CAM', cam.val) : null;
  },
  curl(a, nc, cwd) {
    const { co, vt } = tachCo(a, 'HdXuowAebcDFTKmxrCEyYzQ', ['--data', '--data-raw', '--data-binary', '--data-urlencode', '--header',
      '--request', '--user', '--output', '--write-out', '--user-agent', '--referer', '--cookie', '--cookie-jar', '--dump-header',
      '--form', '--upload-file', '--config', '--max-time', '--proxy', '--range', '--connect-timeout', '--retry', '--json', '--url',
      '--preproxy', '--socks4', '--socks4a', '--socks5', '--socks5-hostname', '--proxy1.0']);
    const cam = co.find((c) => ['-K', '-O', '-J', '-x'].includes(c.k) || laDai(c.k, '--config', '--remote-name', '--remote-name-all',
      '--remote-header-name', '--trace', '--trace-ascii', '--stderr', '--libcurl', '--etag-save', '--hsts', '--alt-svc',
      '--proxy', '--proxy1.0', '--preproxy', '--socks4', '--socks4a', '--socks5', '--socks5-hostname'));
    if (cam && luat('CURL-CAM')) return chan('CURL-CAM', cam.k);
    const ghi = co.filter((c) => (['-o', '-c', '-D'].includes(c.k) || laDai(c.k, '--output', '--cookie-jar', '--dump-header'))
      && c.g && c.g.val !== '-').map((c) => c.g);
    const k = luat('CURL-GHI') ? ghiHet(ghi, nc, cwd) : null;
    if (k) return k;
    const url = [...vt, ...co.filter((c) => laDai(c.k, '--url') && c.g).map((c) => c.g)];
    for (const u of url) {
      let host = '';
      try { host = u.chu ? new URL(/^[a-z]+:\/\//i.test(u.val) ? u.val : 'http://' + u.val).hostname : ''; } catch {}
      if (luat('CURL-HOST') && !['localhost', '127.0.0.1'].includes(host)) return chan('CURL-HOST', u.tho);
    }
    return null;
  },
  mkdir(a, nc, cwd) {
    for (const w of tachCo(a, 'm', ['--mode']).vt) {
      if (!w.chu) return khongChu(w);
      const abs = thuc(path.resolve(cwd.d, w.val));
      const rel = relKho(abs, nc);
      if (luat('MKDIR-DICH') && !trongNhap(abs, nc) && (ngoaiKho(rel) || KHUNG.test(rel))) return chan('MKDIR-DICH', w.tho);
    }
    return null;
  },
  cd(a, nc, cwd, l) {
    if (!(l && l.duocCd) && luat('B-CD-VITRI')) return chan('B-CD-VITRI', a.map((w) => w.tho).join(' '));
    const w = a[0] || tuGia(nc.home || '');
    const abs = w.chu ? thuc(path.resolve(cwd.d, w.val)) : '';
    const hopLe = a.length <= 1 && w.chu && w.val !== '-' && laDir(abs) && (laCon(abs, nc.goc) || trongNhap(abs, nc));
    if (!hopLe && luat('B-CD')) return chan('B-CD', w.tho);
    if (abs && KHUNG.test(relKho(abs, nc)) && luat('B-CD-KHUNG')) return chan('B-CD-KHUNG', w.tho);
    if (abs) cwd.d = abs;
    return null;
  },
};

// ── Ngữ cảnh: gốc kho, cấu hình, nhánh, phạm vi, nháp ───────────────────────
function docNhanh(goc) {
  try {
    let g = path.join(goc, '.git');
    if (fs.statSync(g).isFile()) {
      const m = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(g, 'utf8'));
      if (!m) return null;
      g = path.resolve(goc, m[1].trim());
    }
    const m = /^ref: refs\/heads\/(.+)$/.exec(fs.readFileSync(path.join(g, 'HEAD'), 'utf8').trim());
    return m ? m[1] : null;
  } catch { return null; }
}
function docPhamVi(goc, ma) {
  let t;
  try { t = fs.readFileSync(path.join(goc, 'viec', ma, 'phieu.md'), 'utf8').normalize('NFC'); } catch { return null; }
  const dong = t.split('\n');
  const bd = dong.findIndex((d) => /^##\s+Phạm vi\s*$/.test(d.trim()));
  if (bd < 0) return null;
  const ds = [];
  for (let j = bd + 1; j < dong.length && !/^#/.test(dong[j]); j++) {
    const m = /^\s*[-*]?\s*`?([^`\s]+)`?/.exec(dong[j]);
    if (m) ds.push(m[1].replace(/^\.\//, ''));
  }
  return ds;
}
function layNhap(sd, goc, home) {
  if (typeof sd !== 'string' || !path.isAbsolute(sd)) return null;
  let r;
  try { r = fs.realpathSync(sd); if (!fs.statSync(r).isDirectory()) return null; } catch { return null; }
  if (r === path.sep || r === home || laCon(goc, r) || laCon(r, goc)) return null;
  return r;
}
// tep_bash_them: đường dẫn tương đối ĐÃ chuẩn hoá, không rỗng, không .., không glob, là file thật trong kho (không qua symlink).
function tepBashHopLe(e, goc) {
  if (typeof e !== 'string' || !e || path.isAbsolute(e) || /[*?[\]{}]/.test(e) || path.posix.normalize(e) !== e
    || e.endsWith('/') || e.split('/').includes('..')) return false;
  try { const r = fs.realpathSync(path.join(goc, e)); return r === path.join(goc, e) && fs.statSync(r).isFile(); } catch { return false; }
}
function ngCanh(vao, env) {
  let goc = null;
  try { goc = fs.realpathSync(env.CLAUDE_PROJECT_DIR); if (!fs.existsSync(path.join(goc, '.git'))) goc = null; } catch {}
  if (!goc && luat('NG-GOC')) return { kq: chan('NG-GOC', env.CLAUDE_PROJECT_DIR || '(trống)') };
  let cauHinh = null;
  try {
    cauHinh = JSON.parse(fs.readFileSync(path.join(goc, '.claude/tu_chay/cau_hinh.json'), 'utf8'));
    if (!['file_cam', 'file_luat', 'file_bi_mat', 'chuong_trinh_them', 'tep_bash_them'].every((k) => Array.isArray(cauHinh[k]))
      || !cauHinh.tep_bash_them.every((e) => tepBashHopLe(e, goc))) cauHinh = null;
  } catch { cauHinh = null; }
  if (!cauHinh && luat('NG-CAUHINH')) return { kq: chan('NG-CAUHINH') };
  const home = typeof env.HOME === 'string' && path.isAbsolute(env.HOME) ? env.HOME : null;
  const nhanh = docNhanh(goc);
  const mm = /^viec\/([A-Za-z0-9._-]+)$/.exec(nhanh || '');
  const ma = mm ? mm[1] : null;
  return {
    goc, cauHinh, nhanh, ma, home,
    phamVi: ma ? docPhamVi(goc, ma) : null,
    nhap: layNhap(vao.scratchpad_dir, goc, home),
    plans: home ? thuc(path.join(home, '.claude', 'plans')) : null,
    cwd: typeof vao.cwd === 'string' && path.isAbsolute(vao.cwd) ? vao.cwd : goc,
  };
}

// Hàm thuần: chuỗi stdin + biến môi trường → { quyet: 'CHO' | 'CHAN', ma, ly_do }.
// Tham số `tat` CHỈ bài thử dùng (đột biến); đường chạy hook không bao giờ truyền.
function xet(chuoiVao, env = process.env, tat = new Set()) {
  TAT = tat;
  try {
    let vao = null;
    try { vao = JSON.parse(chuoiVao); } catch {}
    if (!vao || typeof vao !== 'object' || typeof vao.tool_name !== 'string') {
      if (luat('NG-JSON')) return chan('NG-JSON');
      vao = vao && typeof vao === 'object' ? vao : {};
    }
    const nc = ngCanh(vao, env);
    if (nc.kq) return nc.kq;
    const cc = vao.tool_name, ti = vao.tool_input || {};
    if (luat('CC-DOC') && CONG_CU_DOC.has(cc)) return CHO;
    if (cc === 'Bash' || (cc === 'Monitor' && luat('CC-MONITOR') && typeof ti.command === 'string')) return xetBash(ti.command, nc) || CHO;
    if (CONG_CU_SUA.has(cc)) {
      const p = ti.file_path !== undefined ? ti.file_path : ti.notebook_path;
      if (typeof p !== 'string') return luat('NG-JSON') ? chan('NG-JSON', 'thiếu đường dẫn') : CHO;
      return ghiDuoc(p, nc, nc.cwd, true) || CHO;
    }
    return luat('CC-LA') ? chan('CC-LA', cc) : CHO;
  } catch (e) {
    return chan('NG-LOI', e && e.message);
  } finally {
    TAT = new Set();
  }
}

// ── Chạy như hook ────────────────────────────────────────────────────────────
function ghiNhatKy(dong) {
  const goc = fs.realpathSync(process.env.CLAUDE_PROJECT_DIR);
  const p = path.join(goc, NHAT_KY);
  try { if (fs.statSync(p).size >= 1024 * 1024) fs.renameSync(p, path.join(goc, '.tu_chay_nhat_ky.1.jsonl')); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  fs.appendFileSync(p, JSON.stringify(dong) + '\n');
}
function chay() {
  const TRAN = 20 * 1024 * 1024;
  const gio = Math.min(5000, Number(process.env.TU_CHAY_GIO_CHO_MS) || 5000);
  const phan = [];
  let n = 0, xong = false;
  const ketThuc = (kq, chuoi = '') => {
    if (xong) return;
    xong = true;
    clearTimeout(hen);
    let v = {};
    try { v = JSON.parse(chuoi) || {}; } catch {}
    const ti = (v && v.tool_input) || {};
    try {
      ghiNhatKy({ luc: new Date().toISOString(), cong_cu: v.tool_name, agent_id: v.agent_id, quyet: kq.quyet, ma: kq.ma,
        noi_dung: String(ti.command !== undefined ? ti.command : ti.file_path || ti.notebook_path || '').slice(0, 2000),
        ly_do: kq.ly_do ? kq.ly_do.slice(0, 500) : undefined });
    } catch (e) {
      kq = { quyet: 'CHAN', ma: kq.ma || 'NG-NHATKY',
        ly_do: `[NG-NHATKY] ${MO_TA['NG-NHATKY']} (${e.code || e.message})${kq.ly_do ? ' · ' + kq.ly_do : ''}` };
    }
    if (kq.quyet === 'CHO') process.exit(0);
    fs.writeSync(1, JSON.stringify({ hookSpecificOutput: {
      hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: kq.ly_do } }));
    fs.writeSync(2, kq.ly_do + '\n');
    process.exit(2);
  };
  const hen = setTimeout(() => ketThuc(chan('NG-GIO', `${gio} ms`)), gio);
  process.stdin.on('data', (d) => {
    n += d.length;
    if (n > TRAN) { process.stdin.destroy(); ketThuc(chan('NG-TRAN')); } else phan.push(d);
  });
  process.stdin.on('end', () => { const s = Buffer.concat(phan).toString('utf8'); ketThuc(xet(s, process.env), s); });
  process.stdin.on('error', (e) => ketThuc(chan('NG-LOI', e.message)));
}

module.exports = { LUAT, xet, tachLenh };
if (require.main === module) {
  try { chay(); } catch (e) {
    fs.writeSync(2, '[NG-LOI] người gác gặp lỗi bất ngờ — chặn · ' + e.message + '\n');
    process.exit(2);
  }
}
