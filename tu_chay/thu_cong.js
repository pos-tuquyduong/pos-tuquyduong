#!/usr/bin/env node
// thu_cong.js — bài thử cổng PR (TU-CHAY-3, phiếu mục A + B). Chạy: node tu_chay/thu_cong.js
//
// A: dựng kho git tạm (tu_chay/ thật + .claude/ do cai_dat.js thật sinh ra), giả lập PR bằng
//    (base SHA, head SHA, tên nhánh), gọi tu_chay/cong.js hai chế độ tinh / chay như trên GitHub.
//    Đột biến: cong({ tat }) tắt từng kiểm A6–A14 → ca chặn tương ứng phải thành ĐẠT (bài bắt được).
// B: kiemYml() soi tu_chay/cong_github.yml (B1–B4, Q3) + chạy thật bước chặn fork (A15); mỗi đột biến
//    chữ phải ra đúng mã lỗi.
// Mọi lệnh git chạy trong kho tạm, đã bỏ GIT_* (pre-commit đặt GIT_INDEX_FILE) và CLAUDE*.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const hong = [];
let soPhep = 0;
const chac = (ten, dk, ghi = '') => { soPhep++; if (!dk) hong.push(ten + (ghi ? ' — ' + String(ghi).slice(0, 400) : '')); };
const doc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const CONG = path.join(__dirname, 'cong.js');
const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'thu_cong_')));
fs.mkdirSync(path.join(TAM, 'home'));
const DAU = path.join(TAM, 'da_chay_code_pr');

function envSach(them = {}) {
  const e = {};
  for (const [k, v] of Object.entries(process.env)) if (!/^(GIT_|CLAUDE|npm_)/i.test(k)) e[k] = v;
  return { ...e, HOME: path.join(TAM, 'home'), GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t',
    GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', THU_DAU: DAU, ...them };
}
const git = (cwd, ...a) => {
  const r = spawnSync('git', a, { cwd, env: envSach(), encoding: 'utf8', timeout: 30000 });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
const viet = (goc, rel, nd) => { const p = path.join(goc, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, nd); };

// ═══ A · kho giả ═══════════════════════════════════════════════════════════
const PHIEU = ['# X — phiếu thử cổng', '', '## Mục tiêu', 'thử cổng', '', '## Phạm vi', '- viec/X/**', '- README.md',
  '- server/a.js', '- server/moi.js', '- cong_cu/thu_a.js', '- cong_cu/thu_b.js', '- cong_cu/thu_c.js', '- cong_cu/thu_d.js',
  '- cong_cu/khac.js', '- DO_TEST.md', '- DO_DAYDU.md', '- TIEN_DO_X.json', '- .env.local', '- .replit',
  '- tu_chay/MAU_PHIEU.md', '- tu_chay/cau_hinh.json', '- tu_chay/cai_dat.js', '- tu_chay/**', '- .github/workflows/keep-alive.yml', '',
  '## Ngân sách', '~1 dòng', ''].join('\n');
// Bài thử hợp lệ: ĐỎ trên gốc (chưa có server/moi.js), XANH trên PR. Ghi dấu để biết code PR đã chạy.
const THU_HOP_LE = "require('fs').appendFileSync(process.env.THU_DAU || '/dev/null', 'x');\n"
  + "process.exit(require('fs').existsSync('server/moi.js') ? 0 : 1);\n";
const KIEM_GIA = "const fs = require('fs');\nfs.appendFileSync(process.env.THU_DAU || '/dev/null', 'k');\n"
  + "process.exit(fs.existsSync(process.argv.includes('--day-du') ? 'DO_DAYDU.md' : 'DO_TEST.md') ? 1 : 0);\n";

let G = null, BASE = null;
function dungKho() {
  G = path.join(TAM, 'kho');
  fs.mkdirSync(path.join(G, 'tu_chay'), { recursive: true });
  git(G, 'init', '-q', '-b', 'main');
  for (const f of fs.readdirSync(__dirname)) {
    if (fs.statSync(path.join(__dirname, f)).isFile()) fs.copyFileSync(path.join(__dirname, f), path.join(G, 'tu_chay', f));
  }
  viet(G, '.claude/settings.json', '{\n  "permissions": { "deny": [] }\n}\n');
  const r = caiDat();
  if (r.status !== 0) throw new Error('cai_dat.js trên kho giả hỏng: ' + r.stderr + r.stdout);
  viet(G, '.github/workflows/keep-alive.yml', 'name: keep\n');
  viet(G, 'package.json', '{ "name": "kho-thu", "private": true, "scripts": { "test": "node kiem_tra_truoc_khi_giao.js" } }\n');
  viet(G, 'kiem_tra_truoc_khi_giao.js', KIEM_GIA);
  viet(G, 'README.md', 'kho thử\n');
  viet(G, 'server/a.js', 'module.exports = 1;\n');
  viet(G, 'cong_cu/thu_c.js', 'process.exit(1);\n');
  viet(G, 'cong_cu/khac.js', 'process.exit(1);\n');
  viet(G, 'ngoai/cu.md', 'ngoài phạm vi\n');
  viet(G, 'viec/X/phieu.md', PHIEU);
  git(G, 'add', '-A');
  git(G, 'commit', '-q', '-m', 'goc');
  BASE = git(G, 'rev-parse', 'HEAD');
}
function caiDat() {
  fs.rmSync(path.join(G, '.claude/settings.json.truoc_TUCHAY'), { force: true });
  const r = spawnSync(process.execPath, [path.join(G, 'tu_chay/cai_dat.js')], { cwd: G, env: envSach(), encoding: 'utf8', timeout: 60000 });
  fs.rmSync(path.join(G, '.claude/settings.json.truoc_TUCHAY'), { force: true });
  return r;
}
// Dựng một PR: các commit [tiêu đề, { file: nội dung | null (xoá) } | hàm]. Trả head SHA, cây đứng ở head.
function pr(buoc) {
  git(G, 'checkout', '-q', '-f', '--detach', BASE);
  git(G, 'clean', '-fdq');
  for (const [tieuDe, doi] of buoc) {
    if (typeof doi === 'function') doi();
    else for (const [f, nd] of Object.entries(doi)) if (nd === null) fs.rmSync(path.join(G, f)); else viet(G, f, nd);
    git(G, 'add', '-A');
    if (git(G, 'status', '--porcelain')) git(G, 'commit', '-q', '-m', tieuDe); // hàm tự commit (vd. gộp) thì thôi
  }
  return git(G, 'rev-parse', 'HEAD');
}
const datVe = (sha) => { git(G, 'checkout', '-q', '-f', '--detach', sha); git(G, 'clean', '-fdq'); };
function goi(cheDo, head, nhanh = 'viec/X') {
  const r = spawnSync(process.execPath, [CONG, cheDo, G, BASE, head, nhanh], { env: envSach(), encoding: 'utf8', timeout: 300000 });
  return { ok: r.status === 0, ra: String(r.stdout) + String(r.stderr), status: r.status };
}
const PR = {}; // tên ca → head, cho phần đột biến
// che: 'ca' = tinh rồi chay (đạt khi cả hai đạt), hoặc 'tinh' / 'chay'
function ca(ten, buoc, mong, { che = 'ca', chua = [], nhanh = 'viec/X' } = {}) {
  let head;
  try { head = pr(buoc); } catch (e) { chac(`${ten}: dựng PR`, false, e.message); return; }
  PR[ten] = head;
  const kq = [];
  for (const c of che === 'ca' ? ['tinh', 'chay'] : [che]) { datVe(head); kq.push(goi(c, head, nhanh)); }
  const ok = kq.every((k) => k.ok);
  const ra = kq.map((k) => k.ra).join('\n');
  // ĐỎ phải là cổng tự kết luận (dòng "CỔNG ĐỎ"), không phải sập vì thiếu file / lỗi cú pháp (K3)
  chac(`${ten}: phải ${mong}`, mong === 'ĐẠT' ? ok : !ok && ra.includes('CỔNG ĐỎ'), ra);
  for (const s of chua) chac(`${ten}: lý do có "${s}"`, ra.includes(s), ra);
}

function baiCong() {
  dungKho();
  const sv = { 'server/moi.js': 'module.exports = 2;\n' };
  // Cho qua
  ca('A1 đúng phạm vi + bài thử đỏ trên gốc/xanh trên PR', [['them moi', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }]], 'ĐẠT');
  ca('A2 chỉ *.md + viec/X/**', [['tai lieu', { 'README.md': 'đổi\n', 'viec/X/trang_thai.md': 'x\n' }]], 'ĐẠT');
  ca('A3 .claude/** khớp kết quả cai_dat.js (chủ quán đã chạy cai_dat.sh)', [['cai', () => {
    viet(G, 'tu_chay/MAU_PHIEU.md', fs.readFileSync(path.join(G, 'tu_chay/MAU_PHIEU.md'), 'utf8') + '\nthêm\n');
    const r = caiDat();
    if (r.status !== 0) throw new Error(r.stderr + r.stdout);
  }]], 'ĐẠT');
  ca('A4 phiếu đổi ở commit PHIEU: X', [['PHIEU: X sua muc tieu', { 'viec/X/phieu.md': PHIEU.replace('thử cổng', 'thử cổng lần 2') }]], 'ĐẠT');
  ca('A5 miễn bài thử đỏ có lý do', [['PHIEU: X mien', { 'viec/X/phieu.md': PHIEU + '\n## Bài thử đỏ\nkhông — chỉ đổi chú thích\n' }],
    ['sua', { 'server/a.js': '// chú thích\nmodule.exports = 1;\n' }]], 'ĐẠT', { chua: ['chỉ đổi chú thích'] });
  ca('K5 xoá file trong phạm vi', [['xoa', { 'README.md': null }]], 'ĐẠT');
  ca('K5 Q1: cong_cu/khac.js (không phải thu_*.js) không bị coi là bài thử', [['them', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv,
    'cong_cu/khac.js': 'process.exit(0);\n' }]], 'ĐẠT');
  ca('K5 commit gộp main (không đụng phiếu) không bị A7 chặn', [['them', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }], ['gop', () => {
    const nhanh = git(G, 'rev-parse', 'HEAD');
    git(G, 'checkout', '-q', '--detach', BASE);
    viet(G, 'README.md', 'main đổi\n'); git(G, 'add', 'README.md'); git(G, 'commit', '-q', '-m', 'main');
    const m = git(G, 'rev-parse', 'HEAD');
    git(G, 'checkout', '-q', '--detach', nhanh);
    git(G, 'merge', '-q', '--no-ff', '-m', 'Merge main', m);
  }]], 'ĐẠT');

  // Phải chặn
  ca('A6 file ngoài phạm vi', [['ngoai', { 'docs/ngoai.md': 'x\n' }]], 'ĐỎ', { che: 'tinh', chua: ['file `docs/ngoai.md` không có trong Phạm vi của phiếu'] });
  ca('A6 file luật chỉ ghi bằng glob chung', [['luat', { 'tu_chay/ghi_chu.md': 'x\n' }]], 'ĐỎ', { che: 'tinh', chua: ['ĐÚNG TÊN'] });
  ca('A6 xoá file ngoài phạm vi', [['xoa', { 'ngoai/cu.md': null }]], 'ĐỎ', { che: 'tinh', chua: ['ngoai/cu.md'] });
  ca('A7 phiếu đổi ở commit thường', [['sua phieu', { 'viec/X/phieu.md': PHIEU.replace('thử cổng', 'lén') }]], 'ĐỎ', { che: 'tinh', chua: ['PHIEU: X'] });
  ca('A7 tiêu đề PHIEU: X0 với mã X', [['PHIEU: X0 sua', { 'viec/X/phieu.md': PHIEU.replace('thử cổng', 'lén') }]], 'ĐỎ', { che: 'tinh' });
  ca('A7 commit PHIEU: X kèm file ngoài viec/X/', [['PHIEU: X sua', { 'viec/X/phieu.md': PHIEU.replace('thử cổng', 'b'), 'README.md': 'y\n' }]],
    'ĐỎ', { che: 'tinh' });
  ca('A7 biên bản soát ở commit thường', [['bien ban', { 'viec/X/bien_ban_soat.json': '{"ket_qua":"DAT"}\n' }]], 'ĐỎ', { che: 'tinh' });
  ca('A8 sửa tay .claude/ lệch kết quả cai_dat.js', [['sua claude', { '.claude/tu_chay/PHIEN_BAN': 'gia\n' }]], 'ĐỎ',
    { che: 'chay', chua: ['chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc'] });
  ca('A8 tu_chay/ đổi mà chưa chạy cai_dat.sh', [['nguon', { 'tu_chay/MAU_PHIEU.md': 'đổi\n' }]], 'ĐỎ',
    { che: 'chay', chua: ['chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc'] });
  ca('A9 keep-alive.yml đổi', [['ka', { '.github/workflows/keep-alive.yml': 'name: doi\n', 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }]], 'ĐỎ', { che: 'tinh', chua: ['keep-alive.yml'] });
  ca('A9 workflow lạ mới', [['la', { '.github/workflows/la.yml': 'name: la\n' }]], 'ĐỎ', { che: 'tinh', chua: ['la.yml'] });
  ca('A9 cong.yml lệch bản cài', [['cong', { '.github/workflows/cong.yml': '# sửa tay\n' }]], 'ĐỎ', { che: 'chay', chua: ['cong.yml'] });
  for (const f of ['TIEN_DO_X.json', '.env.local', '.replit']) ca(`A10 file cấm ${f}`, [['cam', { [f]: '{}\n', 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }]], 'ĐỎ', { che: 'tinh', chua: [f] });
  ca('A10b PR bỏ TIEN_DO_*.json khỏi file_cam của chính nó rồi sửa TIEN_DO_X.json', [['cam', () => {
    const p = path.join(G, 'tu_chay/cau_hinh.json');
    viet(G, 'tu_chay/cau_hinh.json', fs.readFileSync(p, 'utf8').replace('"TIEN_DO_*.json"', '"KHONG_CO_*.x"'));
    viet(G, 'TIEN_DO_X.json', '{}\n');
  }]], 'ĐỎ', { che: 'tinh', chua: ['TIEN_DO_X.json'] });
  ca('A11 bài thử mới XANH trên gốc', [['xanh', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv, 'cong_cu/thu_b.js': 'process.exit(0);\n' }]], 'ĐỎ',
    { che: 'chay', chua: ['cong_cu/thu_b.js', 'XANH trên code gốc'] });
  ca('A11 bài thử SỬA mà xanh trên gốc', [['sua thu', { 'cong_cu/thu_c.js': 'process.exit(0);\n' }]], 'ĐỎ', { che: 'chay', chua: ['cong_cu/thu_c.js'] });
  ca('A11 bài thử thiếu thư viện trên gốc không tính là đỏ hợp lệ', [['tv', { 'cong_cu/thu_d.js': "require('thu_vien_khong_co_xyz');\n", ...sv }]],
    'ĐỎ', { che: 'chay', chua: ['không chạy được trên code gốc'] });
  // Vòng soát 1 (ra-soat L1): bài thử mới phải XANH trên code PR — file thu_*.js luôn đỏ không được làm cổng xanh
  ca('A11 bài thử mới luôn đỏ (đỏ cả trên code PR)', [['do', { 'cong_cu/thu_a.js': 'process.exit(1);\n', 'server/a.js': 'module.exports = 4;\n' }]],
    'ĐỎ', { che: 'chay', chua: ['ĐỎ trên code PR'] });
  ca('A11 bài thử mới không phải JS', [['do', { 'cong_cu/thu_a.js': 'day khong phai js (\n', 'server/a.js': 'module.exports = 4;\n' }]],
    'ĐỎ', { che: 'chay', chua: ['ĐỎ trên code PR'] });
  // Vòng soát 1 (ra-soat L2): PR xoá trình cài + gỡ người gác + xoá cong.yml → ĐỎ ở CẢ job tĩnh (không chạy code PR)
  ca('A8 xoá cai_dat.js + settings.json gỡ người gác + xoá cong.yml', [['go', { 'tu_chay/cai_dat.js': null,
    '.claude/settings.json': '{}\n', '.github/workflows/cong.yml': null, 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }]], 'ĐỎ',
    { che: 'tinh', chua: ['chủ quán chạy bash tu_chay/cai_dat.sh trên nhánh việc'] });
  ca('A8 xoá cai_dat.js (chế độ chay)', [['go', { 'tu_chay/cai_dat.js': null, 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }]], 'ĐỎ', { che: 'chay', chua: ['cai_dat.js'] });
  ca('A8 tĩnh: sửa tay .claude/tu_chay/PHIEN_BAN', [['sua', { '.claude/tu_chay/PHIEN_BAN': 'gia\n' }]], 'ĐỎ',
    { che: 'tinh', chua: ['.claude/tu_chay/PHIEN_BAN'] });
  ca('A8 tĩnh: cong.yml lệch nguồn tu_chay/cong_github.yml', [['sua', { '.github/workflows/cong.yml': '# sửa tay\n' }]], 'ĐỎ',
    { che: 'tinh', chua: ['cong.yml'] });
  // K5 (ra-soat nghi ngờ 2): người gác cho máy ghi ke_hoach.md / trang_thai.md (G3-HOSO) dù phiếu quên viec/X/** → cổng cũng cho
  ca('K5 G3-HOSO: trang_thai.md khi phiếu không ghi viec/X/**', [['PHIEU: X bo dong viec', { 'viec/X/phieu.md': PHIEU.replace('- viec/X/**\n', '') }],
    ['ghi', { 'viec/X/trang_thai.md': 'x\n', 'viec/X/ke_hoach.md': 'y\n' }]], 'ĐẠT', { che: 'tinh' });
  ca('A12 đổi code, không bài thử, không miễn', [['code', { 'server/a.js': 'module.exports = 3;\n' }]], 'ĐỎ', { che: 'tinh', chua: ['bài thử'] });
  ca('A13 npm test đỏ', [['t', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv, 'DO_TEST.md': 'x\n' }]], 'ĐỎ', { che: 'chay', chua: ['npm test'] });
  ca('A13 --day-du đỏ', [['t', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv, 'DO_DAYDU.md': 'x\n' }]], 'ĐỎ', { che: 'chay', chua: ['--day-du'] });
  ca('A14 nhánh không dạng viec/<MÃ>', [['a', { 'README.md': 'z\n' }]], 'ĐỎ', { nhanh: 'tinh-nang/x' });
  ca('A14 không có viec/<MÃ>/phieu.md', [['a', { 'README.md': 'z\n' }]], 'ĐỎ', { nhanh: 'viec/Y' });
  ca('A14 phiếu thiếu ## Phạm vi', [['PHIEU: X bo pham vi', { 'viec/X/phieu.md': PHIEU.replace('## Phạm vi', '## Pham-vi-sai') }]], 'ĐỎ');

  // A14 chế độ chay: cây đang đứng không phải head
  {
    const head = pr([['a', { 'README.md': 'chỉ tài liệu\n' }]]); // không bài thử: đột biến A14 cô lập được
    PR['A14 HEAD ≠ head'] = head;
    datVe(BASE);
    const k = goi('chay', head);
    chac('A14 chay: thư mục không đứng ở head → ĐỎ', !k.ok && k.ra.includes('CỔNG ĐỎ'), k.ra);
  }
  // tinh KHÔNG chạy code PR; chay thì có
  {
    const head = pr([['a', { 'cong_cu/thu_a.js': THU_HOP_LE, ...sv }]]);
    fs.rmSync(DAU, { force: true });
    const t = goi('tinh', head);
    chac('tách chế độ: tinh ĐẠT mà KHÔNG chạy bài thử / npm test của PR', t.ok && !fs.existsSync(DAU), t.ra);
    datVe(head);
    const c = goi('chay', head);
    chac('tách chế độ: chay có chạy bài thử + npm test (đối chứng)', c.ok && /x/.test(doc(DAU) || '') && /k/.test(doc(DAU) || ''), c.ra);
  }
  // tinh đọc phiếu qua git show: sửa phiếu trên đĩa mà không commit → cổng không thấy
  {
    const head = pr([['ngoai', { 'docs/ngoai.md': 'x\n' }]]);
    viet(G, 'viec/X/phieu.md', PHIEU.replace('- README.md', '- README.md\n- docs/**'));
    const t = goi('tinh', head);
    chac('tinh đọc phiếu bằng git show: phiếu sửa trên đĩa (chưa commit) mở thêm phạm vi → vẫn ĐỎ', !t.ok && t.ra.includes('docs/ngoai.md'), t.ra);
  }

  // Đột biến: tắt từng kiểm → ca chặn tương ứng thành ĐẠT (nghĩa là bài thử ở trên bắt được kiểm đó)
  let mod = null;
  try { mod = require(CONG); } catch (e) { chac('nạp được tu_chay/cong.js', false, e.message); }
  const DB = [['A6', 'A6 file ngoài phạm vi', 'tinh'], ['A7', 'A7 phiếu đổi ở commit thường', 'tinh'],
    ['A8', 'A8 sửa tay .claude/ lệch kết quả cai_dat.js', 'chay'], ['A9', 'A9 keep-alive.yml đổi', 'tinh'],
    ['A10', 'A10 file cấm TIEN_DO_X.json', 'tinh'], ['A11', 'A11 bài thử mới XANH trên gốc', 'chay'],
    ['A11', 'A11 bài thử mới luôn đỏ (đỏ cả trên code PR)', 'chay'], ['A8', 'A8 tĩnh: sửa tay .claude/tu_chay/PHIEN_BAN', 'tinh'],
    ['A8', 'A8 xoá cai_dat.js (chế độ chay)', 'chay'],
    ['A12', 'A12 đổi code, không bài thử, không miễn', 'tinh'], ['A13', 'A13 npm test đỏ', 'chay'], ['A14', 'A14 HEAD ≠ head', 'chay']];
  if (mod && typeof mod.cong === 'function') {
    for (const [ma, ten, cheDo] of DB) {
      if (!PR[ten]) { chac(`đột biến ${ma}: thiếu ca "${ten}"`, false); continue; }
      if (ma === 'A14') datVe(BASE); else datVe(PR[ten]);
      const env = envSach();
      const cu = { ...process.env };
      for (const k of Object.keys(process.env)) delete process.env[k];
      Object.assign(process.env, env);
      let kq;
      try { kq = mod.cong({ cheDo, thuMuc: G, base: BASE, head: PR[ten], nhanh: 'viec/X', tat: new Set([ma]) }); } finally {
        for (const k of Object.keys(process.env)) delete process.env[k];
        Object.assign(process.env, cu);
      }
      chac(`đột biến tắt ${ma} → ca "${ten}" thành ĐẠT (bài thử bắt được kiểm ${ma})`, !!kq && kq.ok === true, kq && kq.lyDo.join(' | '));
    }
  } else chac('cong.js xuất hàm cong({ cheDo, thuMuc, base, head, nhanh, tat })', false);

  // Dùng lại hàm của người gác (K4), lấy cấu hình + người gác từ thư mục của chính cổng (= BASE trên GitHub)
  const src = doc(CONG) || '';
  chac('cong.js dùng lại xetPhamVi / khop / phamViTuChu của nguoi_gac.js, không tự viết globRe',
    /require\(path\.join\(__dirname, 'nguoi_gac\.js'\)\)/.test(src) && /xetPhamVi\(/.test(src) && /phamViTuChu\(/.test(src)
    && !/function globRe|new RegExp\(/.test(src));
  chac('cong.js đọc cau_hinh.json từ __dirname (BASE), không từ thư mục PR', /path\.join\(__dirname, 'cau_hinh\.json'\)/.test(src)
    && !/thuMuc, 'tu_chay', 'cau_hinh/.test(src));
}

// ═══ B · tu_chay/cong_github.yml ═══════════════════════════════════════════
const SHA40 = /^[0-9a-f]{40}$/;
function khoiJob(t) { // { tên: chuỗi khối }
  const i = t.search(/^jobs:\s*$/m);
  if (i < 0) return {};
  const ra = {};
  let ten = null;
  for (const d of t.slice(i).split('\n').slice(1)) {
    const m = /^ {2}([\w-]+):\s*$/.exec(d);
    if (m) { ten = m[1]; ra[ten] = ''; } else if (/^\S/.test(d)) break; else if (ten) ra[ten] += d + '\n';
  }
  return ra;
}
const cacBuoc = (job) => job.split(/^ {6}- /m).slice(1);
function chayCua(buoc) { // nội dung run: (một dòng hoặc khối |)
  const m = /^ {8}run: \|\s*\n((?: {10}.*\n?)*)/m.exec(buoc) || /^ {8}run: (.+)$/m.exec(buoc);
  return m ? m[1].replace(/^ {10}/gm, '') : null;
}
function kiemYml(t) {
  const loi = [];
  const L = (ma, ghi) => loi.push(ma + ' ' + ghi);
  const on = (/^on:\s*\n((?:\s+.*\n)*)/m.exec(t) || [])[1] || '';
  if (!/^ {2}pull_request_target:\s*$/m.test(on) || on.split('\n').filter((d) => /^ {2}\S/.test(d)).length !== 1) L('B1', 'trigger phải đúng một: pull_request_target');
  if (!/^ {4}branches: \[main\]\s*$/m.test(on)) L('B1', 'branches phải là [main]');
  if (!/^ {4}types: \[opened, synchronize, reopened\]\s*$/m.test(on)) L('B1', 'types phải là [opened, synchronize, reopened]');
  if (!/^permissions:\s*\n {2}contents: read\s*\n(?!\s)/m.test(t) || (t.match(/permissions:/g) || []).length !== 1) L('B3', 'permissions chỉ contents: read, một chỗ');
  if (/write/.test(t.replace(/^\s*#.*$/gm, ''))) L('B3', 'không quyền write');
  if (/secrets\./.test(t)) L('B3', 'không dùng secrets.');
  if (/^\s+cache:/m.test(t)) L('B3', 'không cache');
  if (/allow-unsafe-pr-checkout/.test(t)) L('B3', 'không allow-unsafe-pr-checkout');
  for (const m of t.matchAll(/uses: (\S+)/g)) {
    const [ten, sha] = m[1].split('@');
    if (!/^actions\/(checkout|setup-node)$/.test(ten) || !SHA40.test(sha || '')) L('B3', 'action phải actions/* ghim SHA 40 ký tự: ' + m[1]);
  }
  const jobs = khoiJob(t);
  if (JSON.stringify(Object.keys(jobs)) !== '["cong","cong-chay"]') L('B4', 'đúng hai job cong, cong-chay: ' + Object.keys(jobs));
  for (const [ten, job] of Object.entries(jobs)) {
    if (!/^ {4}runs-on: ubuntu-24\.04\s*$/m.test(job)) L('Q3', ten + ': runs-on ubuntu-24.04');
    if (!/^ {4}timeout-minutes: 20\s*$/m.test(job)) L('Q3', ten + ': timeout-minutes 20');
    if (/^ {4}(if|needs|continue-on-error|strategy):/m.test(job)) L('B4', ten + ': không if / needs / continue-on-error ở mức job');
    const b = cacBuoc(job);
    const cua = b[0] && chayCua(b[0]);
    if (!b[0] || !/^name: Chặn PR từ fork/.test(b[0]) || !/HEAD_REPO: \$\{\{ github\.event\.pull_request\.head\.repo\.full_name \}\}/.test(b[0])
      || !/BASE_REPO: \$\{\{ github\.repository \}\}/.test(b[0]) || !cua || !/exit 1/.test(cua)) L('A15', ten + ': bước đầu phải chặn PR từ fork');
    const co = b.filter((x) => /uses: actions\/checkout@/.test(x));
    const goc = co.find((x) => /^ {10}path: goc\s*$/m.test(x));
    const prb = co.find((x) => /^ {10}path: pr\s*$/m.test(x));
    if (co.length !== 2 || !goc || !prb) L('B2', ten + ': đúng hai checkout path goc và pr');
    if (co.some((x) => !/^ {10}persist-credentials: false\s*$/m.test(x))) L('B3', ten + ': mọi checkout persist-credentials: false');
    if (goc && /^ {10}(ref|repository):/m.test(goc)) L('B2', ten + ': checkout goc không có ref/repository (= commit cuối main)');
    if (prb && !/^ {10}ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}\s*$/m.test(prb)) L('B2', ten + ': checkout pr ref = head.sha');
    const sn = b.filter((x) => /uses: actions\/setup-node@/.test(x));
    if (sn.length !== 1 || !/^ {10}node-version: 22\s*$/m.test(sn[0]) || !/^ {10}package-manager-cache: false\s*$/m.test(sn[0])) {
      L('Q3', ten + ': một setup-node, node-version 22, package-manager-cache: false');
    }
    const cuoi = b[b.length - 1] || '';
    const cheDo = ten === 'cong' ? 'tinh' : 'chay';
    if ((chayCua(cuoi) || '').trim() !== `node goc/tu_chay/cong.js ${cheDo} pr "$BASE" "$HEAD_SHA" "$NHANH"`) L('B2', ten + ': bước cuối chạy cong.js ' + cheDo + ' lấy từ goc');
    if (!/BASE: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/.test(cuoi) || !/HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/.test(cuoi)
      || !/NHANH: \$\{\{ github\.event\.pull_request\.head\.ref \}\}/.test(cuoi)) L('B2', ten + ': env BASE / HEAD_SHA / NHANH');
    for (const x of b) if (/\$\{\{/.test(chayCua(x) || '')) L('B-CHEN', ten + ': không ${{ }} trong run:');
  }
  return loi;
}
function baiYml() {
  const t = doc(path.join(__dirname, 'cong_github.yml'));
  chac('B có tu_chay/cong_github.yml', t !== null);
  if (t === null) return;
  const loi = kiemYml(t);
  chac('B1–B4, Q3: kiemYml trên file thật không có lỗi', loi.length === 0, loi.join(' | '));
  const DB = [
    [/^ {2}pull_request_target:/m, '  pull_request:', 'B1'], ['on:\n', 'on:\n  push:\n', 'B1'], [', reopened]', ']', 'B1'],
    ['branches: [main]', 'branches: [main, dev]', 'B1'],
    ['contents: read', 'contents: write', 'B3'], ['  contents: read\n', '  contents: read\n  pull-requests: write\n', 'B3'],
    ['persist-credentials: false', 'persist-credentials: true', 'B3'], ['package-manager-cache: false', 'package-manager-cache: true', 'B3|Q3'],
    ['          node-version: 22\n', '          node-version: 22\n          cache: npm\n', 'B3'],
    ['          path: pr\n', '          path: pr\n          allow-unsafe-pr-checkout: true\n', 'B3'],
    [/actions\/checkout@[0-9a-f]{40}/, 'actions/checkout@v7', 'B3'], [/actions\/setup-node@[0-9a-f]{40}/, 'someone/setup-node@' + 'a'.repeat(40), 'B3'],
    ['BASE_REPO: ${{ github.repository }}', 'BASE_REPO: ${{ github.repository }}\n          T: ${{ secrets.X }}', 'B3'],
    ['ref: ${{ github.event.pull_request.head.sha }}', 'ref: ${{ github.event.pull_request.head.ref }}', 'B2'],
    ['node goc/tu_chay/cong.js tinh', 'node pr/tu_chay/cong.js tinh', 'B2'],
    ['          path: goc\n', '          path: goc\n          ref: main\n', 'B2'],
    ['    runs-on: ubuntu-24.04\n', '    runs-on: ubuntu-24.04\n    if: false\n', 'B4'],
    ['  cong-chay:', '  cong-khac:', 'B4'],
    [/ {6}- name: Chặn PR từ fork[\s\S]*?(?= {6}- name:)/, '', 'A15'],
    ['runs-on: ubuntu-24.04', 'runs-on: ubuntu-latest', 'Q3'], ['timeout-minutes: 20', 'timeout-minutes: 60', 'Q3'],
    ['node-version: 22', 'node-version: 20', 'Q3'],
    ['"$NHANH"', '"${{ github.event.pull_request.head.ref }}"', 'B-CHEN|B2'],
  ];
  for (const [tim, thay, ma] of DB) {
    const d = t.replace(tim, thay);
    const l = kiemYml(d);
    chac(`B6 đột biến ${String(tim).slice(0, 40)} → ${String(thay).slice(0, 30)} bị bắt (${ma})`, d !== t
      && l.some((x) => ma.split('|').includes(x.split(' ')[0])), d === t ? 'đột biến không đổi gì' : l.join(' | '));
  }
  // A15 chạy thật: bước chặn fork của từng job
  for (const [ten, job] of Object.entries(khoiJob(t))) {
    const cua = chayCua(cacBuoc(job)[0] || '') || 'exit 0';
    const r1 = spawnSync('bash', ['-c', cua], { env: { PATH: process.env.PATH, HEAD_REPO: 'ke-la/pos', BASE_REPO: 'pos-tuquyduong/pos' }, encoding: 'utf8' });
    const r2 = spawnSync('bash', ['-c', cua], { env: { PATH: process.env.PATH, HEAD_REPO: 'pos-tuquyduong/pos', BASE_REPO: 'pos-tuquyduong/pos' }, encoding: 'utf8' });
    chac(`A15 ${ten}: PR từ fork → bước đầu thoát ĐỎ; cùng kho → qua`, r1.status !== 0 && r2.status === 0, `${r1.status}/${r2.status}`);
  }
  // B5: keep-alive.yml không đổi một byte (băm lúc lập TU-CHAY-3, 01.10.2026)
  const ka = path.join(__dirname, '..', '.github', 'workflows', 'keep-alive.yml');
  let bam = '';
  try { bam = crypto.createHash('sha256').update(fs.readFileSync(ka)).digest('hex'); } catch {}
  chac('B5 keep-alive.yml không đổi byte nào', bam === 'b68d4b9453f7607bb44e5306f5af6920e7f988555a08899da28da9a380492ff5', bam);
}

for (const bai of [baiYml, baiCong]) {
  try { bai(); } catch (e) { hong.push(`${bai.name} sập: ` + String(e && e.message || e).split('\n')[0]); }
}
fs.rmSync(TAM, { recursive: true, force: true });
console.log(`thu_cong: ${soPhep} phép · ${hong.length} chỗ hỏng`);
if (hong.length) {
  for (const h of hong) console.log('  ✗ ' + h);
  console.log(`  ĐỎ — ${hong.length} chỗ hỏng`);
  process.exit(1);
}
console.log('  ✓ XANH — cổng (A), file workflow (B) đều đạt');
process.exit(0);
