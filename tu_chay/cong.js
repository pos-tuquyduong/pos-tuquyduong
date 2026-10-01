#!/usr/bin/env node
// cong.js — CỔNG PR vào main (TU-CHAY-3, THIET_KE B15). Chỉ node + git, không thư viện ngoài.
//
//   node tu_chay/cong.js tinh <thư mục kho PR> <base SHA> <head SHA> <nhánh>   # KHÔNG chạy code PR
//   node tu_chay/cong.js chay <thư mục kho PR> <base SHA> <head SHA> <nhánh>   # npm ci, bài thử trên gốc, npm test
// Thoát 0 = ĐẠT; 1 = ĐỎ kèm lý do. Trên GitHub cổng chạy từ checkout của main (thư mục `goc`), nên
// cau_hinh.json và nguoi_gac.js đọc ở __dirname là bản BASE — PR không nới được luật cho chính nó.
// tinh: đọc mọi thứ của PR bằng git (cat-file / diff / log), không đọc file trên đĩa của PR.
// chay: đọc hết dữ liệu trước, rồi mới chạy code PR làm tiến trình con, môi trường bỏ GITHUB_* / ACTIONS_* / CLAUDE*.
// Bài thử: node tu_chay/thu_cong.js — tắt từng kiểm (tham số tat, CHỈ bài thử dùng) thì bài phải đỏ.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const gac = require(path.join(__dirname, 'nguoi_gac.js'));
const CH = JSON.parse(fs.readFileSync(path.join(__dirname, 'cau_hinh.json'), 'utf8'));
const CAI_LAI = 'chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc';
if (!Array.isArray(CH.ban_cai) || !CH.muc_gac || !Array.isArray(CH.thu_muc_bai_thu)) {
  throw new Error('tu_chay/cau_hinh.json (bản main) thiếu ban_cai / muc_gac / thu_muc_bai_thu');
}

const envCon = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(GITHUB_|ACTIONS_|CLAUDE)/i.test(k)));
const chayLenh = (lenh, a, o = {}) => spawnSync(lenh, a, { encoding: 'utf8', maxBuffer: 1 << 28, env: envCon(), ...o });
function git(cwd, ...a) {
  const r = chayLenh('git', a, { cwd });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${String(r.stderr).trim()}`);
  return r.stdout;
}
const blob = (cwd, sha, p) => {
  const r = spawnSync('git', ['cat-file', 'blob', `${sha}:${p}`], { cwd, maxBuffer: 1 << 28, env: envCon() });
  return r.status === 0 ? r.stdout : null;
};
const duoi = (s, n = 20) => String(s).trim().split('\n').slice(-n).join('\n');
// Bài thử (chủ quán chốt Q1): file thu_*.js trong thu_muc_bai_thu hoặc tu_chay/
const laBaiThu = (p) => /^thu_[^/]*\.js$/.test(path.posix.basename(p))
  && (path.posix.dirname(p) === 'tu_chay' || CH.thu_muc_bai_thu.some((d) => p.startsWith(d)));
const CHO_HOSO = (ma) => [`viec/${ma}/ke_hoach.md`, `viec/${ma}/trang_thai.md`]; // = G3-HOSO của người gác
const laCode = (p) => !/\.md$/.test(p) && !p.startsWith('viec/') && !p.startsWith('.claude/') && p !== '.github/workflows/cong.yml';
function giaiNen(cwd, sha, dich, ...duong) { // git archive <sha> [đường dẫn…] | tar -x -C dich
  const a = spawnSync('git', ['archive', '--format=tar', sha, ...duong], { cwd, maxBuffer: 1 << 30, env: envCon() });
  fs.mkdirSync(dich, { recursive: true });
  return a.status === 0 && spawnSync('tar', ['-x', '-C', dich], { input: a.stdout }).status === 0;
}
function cacFile(goc, rel) { // mọi file dưới goc/rel, đường dẫn posix tương đối với goc
  const ra = [];
  (function di(d) {
    let ds = [];
    try { ds = fs.readdirSync(path.join(goc, d), { withFileTypes: true }); } catch { return; }
    for (const x of ds) if (x.isDirectory()) di(d + '/' + x.name); else ra.push(d + '/' + x.name);
  })(rel);
  return ra;
}
function mucMien(phieu) { // "## Bài thử đỏ" rồi dòng "không — <lý do>" (A5)
  const dong = phieu.normalize('NFC').split('\n');
  const i = dong.findIndex((d) => /^##\s+Bài thử đỏ\s*$/.test(d.trim()));
  const sau = i < 0 ? undefined : dong.slice(i + 1).find((d) => d.trim());
  const m = sau && /^\s*[-*]?\s*không\s*—\s*([^<\s].*)$/.exec(sau); // "<lý do>" của mẫu phiếu không tính
  return m ? m[1].trim() : null;
}

function cong({ cheDo, thuMuc, base, head, nhanh, tat = new Set() }) {
  const lyDo = [], ghi = [];
  const bat = (ma) => !tat.has(ma);
  const doLy = (ma, s) => { if (bat(ma)) lyDo.push(`[${ma}] ${s}`); };
  const kq = () => ({ ok: lyDo.length === 0, lyDo, ghi });
  if (!['tinh', 'chay'].includes(cheDo)) throw new Error('chế độ phải là tinh hoặc chay');

  // A14 — nhánh, phiếu, Phạm vi (đọc từ head bằng git, không từ đĩa)
  const m = /^viec\/([A-Za-z0-9._-]+)$/.exec(nhanh || '');
  if (!m) { doLy('A14', `nhánh "${nhanh}" không có dạng viec/<MÃ>`); if (bat('A14')) return kq(); }
  const ma = m ? m[1] : '';
  const P_PHIEU = `viec/${ma}/phieu.md`;
  const bPhieu = blob(thuMuc, head, P_PHIEU);
  const phieu = bPhieu === null ? '' : bPhieu.toString('utf8');
  const phamVi = bPhieu === null ? null : gac.phamViTuChu(phieu);
  if (!phamVi) {
    doLy('A14', bPhieu === null ? `không có ${P_PHIEU} ở head` : `${P_PHIEU} thiếu mục "## Phạm vi"`);
    if (bat('A14')) return kq();
  }
  head = git(thuMuc, 'rev-parse', '--verify', head + '^{commit}').trim();
  const moc = git(thuMuc, 'merge-base', base, head).trim();
  const tach = git(thuMuc, 'diff', '--name-status', '-z', '--no-renames', moc, head).split('\0').filter(Boolean);
  const doi = [];
  for (let i = 0; i + 1 < tach.length; i += 2) doi.push({ st: tach[i], p: tach[i + 1] });
  const baoVe = [P_PHIEU, `viec/${ma}/bien_ban_soat.json`];
  const baiThu = doi.filter((f) => f.st !== 'D' && laBaiThu(f.p)).map((f) => f.p);
  const coCode = doi.some((f) => laCode(f.p));
  const mien = mucMien(phieu);
  if (mien && coCode) ghi.push('miễn bài thử đỏ (phiếu ## Bài thử đỏ): ' + mien);

  if (cheDo === 'tinh') {
    // A7/A4 — phiếu, biên bản soát chỉ đổi ở commit "PHIEU: <MÃ>", và commit đó chỉ đụng viec/<MÃ>/
    const dau = 'PHIEU: ' + ma;
    for (const d of git(thuMuc, 'log', '--format=%H%x09%s', `${moc}..${head}`, '--', ...baoVe).split('\n').filter(Boolean)) {
      const [sha, ...tt] = d.split('\t');
      const td = tt.join('\t');
      if (!td.startsWith(dau) || !/^([^A-Za-z0-9._-]|$)/.test(td.slice(dau.length))) {
        doLy('A7', `${baoVe.join(' / ')} đổi ở commit ${sha.slice(0, 7)} "${td}" — chỉ commit "PHIEU: ${ma}" của chủ quán được sửa phiếu`);
        continue;
      }
      const la = git(thuMuc, 'diff-tree', '--no-commit-id', '-r', '-z', '--name-only', '-m', sha).split('\0')
        .filter((p) => p && !p.startsWith(`viec/${ma}/`));
      if (la.length) doLy('A7', `commit ${sha.slice(0, 7)} "${td}" đổi cả file ngoài viec/${ma}/: ${la.join(', ')}`);
    }
    // A8 tĩnh — không chạy code PR: bản cài phải đúng byte nguồn của chính head; người gác + deny .claude/ còn nguyên
    if (blob(thuMuc, moc, 'tu_chay/cai_dat.js') !== null) {
      // chỉ FILE trực tiếp trong tu_chay/ (trình cài cũng chỉ chép file, bỏ thư mục con)
      const tep = git(thuMuc, 'ls-tree', '-z', `${head}:tu_chay`).split('\0').map((d) => /^\d+ blob \S+\t(.+)$/.exec(d))
        .filter(Boolean).map((m) => m[1]).filter((f) => !/^cai_dat\./.test(f));
      // Chuẩn là cấu hình của main (CH). PR (cau_hinh.json của head) chỉ được THÊM bản cài vào .claude/, và chỉ đổi
      // timeout của muc_gac — lệnh, matcher người gác giữ nguyên (vòng soát 3: PR bộ khung đổi cấu hình rồi cài → ĐẠT).
      let chH = {};
      try { chH = JSON.parse(blob(thuMuc, head, 'tu_chay/cau_hinh.json')); } catch {}
      const banCai = [...CH.ban_cai, ...(Array.isArray(chH.ban_cai) ? chH.ban_cai : []).filter((c) => Array.isArray(c) && c.length === 2
        && /^\.claude\/(?!settings\.json$)/.test(c[1]) && !CH.ban_cai.some((b) => b[1] === c[1]))];
      const g0 = CH.muc_gac.hooks[0], gH = chH.muc_gac;
      const mucDuoc = [CH.muc_gac];
      if (gH && gH.matcher === '*' && Array.isArray(gH.hooks) && gH.hooks.length === 1 && Object.keys(gH.hooks[0]).length === 3
        && gH.hooks[0].type === g0.type && gH.hooks[0].command === g0.command && Number.isInteger(gH.hooks[0].timeout)
        && gH.hooks[0].timeout > 0) mucDuoc.push(gH);
      const cap = [...banCai.map(([n, d]) => [`tu_chay/${n}`, d]), ...tep.map((f) => [`tu_chay/${f}`, `.claude/tu_chay/${f}`])];
      const lech = cap.filter(([n, d]) => { const a = blob(thuMuc, head, n), b = blob(thuMuc, head, d); return !a || !b || Buffer.compare(a, b) !== 0; })
        .map(([, d]) => d);
      const quan = new Set([...cap.map(([, d]) => d), '.claude/settings.json']);
      for (const { p } of doi) if (p.startsWith('.claude/') && !quan.has(p)) lech.push(`${p} (không do trình cài quản)`);
      let s = null;
      try { s = JSON.parse(blob(thuMuc, head, '.claude/settings.json')); } catch {}
      const pre = s && s.hooks && Array.isArray(s.hooks.PreToolUse) ? s.hooks.PreToolUse : [];
      if (!pre.some((m) => mucDuoc.some((g) => JSON.stringify(m) === JSON.stringify(g)))) lech.push('.claude/settings.json: mất hook người gác (không có mục PreToolUse đúng muc_gac)');
      const deny = s && s.permissions && Array.isArray(s.permissions.deny) ? s.permissions.deny : [];
      for (const d of ['Edit(./.claude/**)', 'Edit(./.github/**)']) if (!deny.includes(d)) lech.push(`.claude/settings.json: thiếu deny ${d}`);
      for (const f of ['tu_chay/cai_dat.js', 'tu_chay/cai_dat.sh']) {
        if (blob(thuMuc, moc, f) !== null && blob(thuMuc, head, f) === null) lech.push(`PR xoá trình cài ${f}`);
      }
      if (lech.length) doLy('A8', `bản cài lệch nguồn: ${lech.slice(0, 6).join(', ')}${lech.length > 6 ? ', …' : ''} — ${CAI_LAI}`);
    }
    for (const { p } of doi) {
      if (p.startsWith('.claude/') || baoVe.includes(p) || CHO_HOSO(ma).includes(p)) continue; // .claude/: A8 ở trên + chế độ chay
      if (p.startsWith('.github/')) {
        if (p !== '.github/workflows/cong.yml') doLy('A9', `file \`${p}\` trong .github/ — chỉ .github/workflows/cong.yml (do cai_dat.sh cài) được đổi`);
        continue;
      }
      if (gac.khop(CH.file_cam, p, true)) { doLy('A10', `file cấm \`${p}\` (file_cam của cau_hinh.json bản main) — không PR nào được đổi`); continue; }
      const r = gac.xetPhamVi(p, phamVi || [], CH);
      if (r) {
        doLy('A6', r.ma === 'G-LUAT' ? `file luật \`${p}\` phải ghi ĐÚNG TÊN trong Phạm vi (glob chung không mở được file luật)`
          : `file \`${p}\` không có trong Phạm vi của phiếu`);
      }
    }
    if (coCode && !baiThu.length && !mien) doLy('A12', 'đổi code mà không có bài thử mới (thu_*.js), phiếu không có mục "## Bài thử đỏ" ghi "không — <lý do>"');
    return kq();
  }

  // chay — cây phải đứng đúng head (đã đọc xong mọi dữ liệu ở trên)
  const dung = git(thuMuc, 'rev-parse', 'HEAD').trim();
  if (dung !== head) { doLy('A14', `thư mục PR đang đứng ở ${dung.slice(0, 7)}, không phải head ${head.slice(0, 7)}`); if (bat('A14')) return kq(); }
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'cong_'));
  try {
    // A3/A8 — .claude/** và cong.yml phải đúng kết quả cai_dat.js (.claude/ của gốc + tu_chay/ của PR); PR xoá trình cài → ĐỎ
    for (const f of ['tu_chay/cai_dat.js', 'tu_chay/cai_dat.sh']) { // song song với A8 tĩnh
      if (blob(thuMuc, moc, f) !== null && blob(thuMuc, head, f) === null) doLy('A8', `PR xoá trình cài ${f} — ${CAI_LAI}`);
    }
    if (blob(thuMuc, head, 'tu_chay/cai_dat.js') !== null) {
      const cai = path.join(tam, 'cai');
      giaiNen(thuMuc, moc, cai, '.claude'); // gốc chưa có .claude/ thì bỏ qua
      giaiNen(thuMuc, head, cai, 'tu_chay');
      git(cai, 'init', '-q');
      const r = chayLenh(process.execPath, [path.join(cai, 'tu_chay', 'cai_dat.js')], { cwd: cai, timeout: 120000 });
      if (r.status !== 0) doLy('A8', `cai_dat.js của PR chạy hỏng: ${duoi(r.stdout + r.stderr, 5)}`);
      else {
        const coHead = git(thuMuc, 'ls-tree', '-r', '-z', '--name-only', head, '--', '.claude', '.github/workflows/cong.yml').split('\0');
        const coCai = [...cacFile(cai, '.claude'), ...cacFile(cai, '.github')].filter((p) => !/\.truoc_TUCHAY$/.test(p));
        const lech = [...new Set([...coHead.filter(Boolean), ...coCai])].sort().filter((p) => {
          const a = blob(thuMuc, head, p);
          let b = null;
          try { b = fs.readFileSync(path.join(cai, p)); } catch {}
          return !a || !b || Buffer.compare(a, b) !== 0;
        });
        if (lech.length) doLy('A8', `bản cài lệch kết quả cai_dat.js: ${lech.slice(0, 8).join(', ')}${lech.length > 8 ? ', …' : ''} — ${CAI_LAI}`);
      }
    }
    // npm ci TRƯỚC khi chạy bài thử trên gốc (soát 4.7)
    for (const d of ['.', 'client']) {
      if (!fs.existsSync(path.join(thuMuc, d, 'package-lock.json'))) continue;
      const r = chayLenh('npm', ['ci'], { cwd: path.join(thuMuc, d), timeout: 600000 });
      if (r.status !== 0) doLy('A13', `npm ci ở ${d} hỏng:\n${duoi(r.stdout + r.stderr)}`);
    }
    // A11 — bài thử mới / sửa phải ĐỎ trên code gốc (git archive mốc + bài thử của head + node_modules vừa cài)
    let doHopLe = 0;
    baiThu.forEach((p, i) => {
      const goc = path.join(tam, 'goc' + i);
      giaiNen(thuMuc, moc, goc);
      fs.mkdirSync(path.dirname(path.join(goc, p)), { recursive: true });
      fs.writeFileSync(path.join(goc, p), blob(thuMuc, head, p));
      for (const d of ['.', 'client']) {
        const nm = path.join(thuMuc, d, 'node_modules');
        if (fs.existsSync(nm) && fs.existsSync(path.join(goc, d)) && !fs.existsSync(path.join(goc, d, 'node_modules'))) {
          fs.symlinkSync(nm, path.join(goc, d, 'node_modules'));
        }
      }
      const r = chayLenh(process.execPath, [p], { cwd: goc, timeout: 300000 });
      const thieu = /Cannot find module '([^'./][^']*)'/.exec(String(r.stdout) + String(r.stderr));
      if (r.status === 0) doLy('A11', `bài thử \`${p}\` XANH trên code gốc — bài thử vô giá trị (K3), phải đỏ trước khi vá`);
      else if (r.status === null) doLy('A11', `bài thử \`${p}\` quá giờ trên code gốc — không tính là đỏ`);
      else if (thieu) doLy('A11', `bài thử \`${p}\` không chạy được trên code gốc (thiếu thư viện '${thieu[1]}') — không tính là đỏ`);
      else doHopLe++;
    });
    if (coCode && !mien && !doHopLe) doLy('A12', 'đổi code mà không có bài thử nào ĐỎ hợp lệ trên code gốc');
    // A13 — lệnh kiểm của cấu hình bản main, chạy trên code PR
    for (const l of [...CH.lenh_bai_thu, ...CH.lenh_kiem_day_du]) {
      const r = chayLenh('bash', ['-c', l], { cwd: thuMuc, timeout: 900000 });
      if (r.status !== 0) doLy('A13', `\`${l}\` đỏ:\n${duoi(r.stdout + r.stderr)}`);
    }
    // A11 — bài thử mới / sửa phải XANH trên code PR (vòng soát 1: file thu_*.js luôn đỏ không được làm cổng xanh).
    // Chạy SAU A13: bài thử ghi ra cây làm việc không làm đổi kết quả npm test.
    for (const p of baiThu) {
      const h = chayLenh(process.execPath, [p], { cwd: thuMuc, timeout: 300000 });
      if (h.status !== 0) doLy('A11', `bài thử \`${p}\` ĐỎ trên code PR (thoát ${h.status}) — bài thử phải xanh sau khi vá:\n${duoi(h.stdout + h.stderr, 5)}`);
    }
  } finally {
    fs.rmSync(tam, { recursive: true, force: true });
  }
  return kq();
}

module.exports = { cong };
if (require.main === module) {
  const [cheDo, thuMuc, base, head, nhanh] = process.argv.slice(2);
  let k;
  try {
    if (!thuMuc || !base || !head) throw new Error('cách dùng: node tu_chay/cong.js tinh|chay <thư mục> <base> <head> <nhánh>');
    k = cong({ cheDo, thuMuc: path.resolve(thuMuc), base, head, nhanh });
  } catch (e) {
    k = { ok: false, lyDo: ['[CONG] cổng gặp lỗi bất ngờ — ĐỎ: ' + e.message], ghi: [] };
  }
  const ten = cheDo === 'chay' ? 'CHẠY' : 'TĨNH';
  for (const g of k.ghi) console.log('· ' + g);
  for (const l of k.lyDo) console.log('✗ ' + l);
  console.log(k.ok ? `✓ CỔNG ${ten} ĐẠT` : `✗ CỔNG ĐỎ (${ten}) — ${k.lyDo.length} lý do`);
  process.exit(k.ok ? 0 : 1);
}
