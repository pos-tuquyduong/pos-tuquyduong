#!/usr/bin/env python3
"""TU-CHAY-8 — đột biến cho các chỗ vá của việc: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/TU-CHAY-8/dot_bien.py [tên...]

Khuôn viec/TU-CHAY-7/dot_bien.py:
- BẢN SAO CHÉP THẬT (không symlink, trừ node_modules chỉ đọc — K5 HOC-2b): tu_chay/*, cong_cu/, server/, KHUON_LOI.md, CLAUDE.md,
  kiem_tra_truoc_khi_giao.js, keep-alive.yml, package.json vào thư mục tạm; tự kiểm realpath đích trong thư mục tạm, ngoài kho.
  thu_cong / thu_cong_cu / thu_nguoi_gac / thu_gia_lap chạy TỪ bản sao (đọc __dirname); thu_TOCDO1 chạy ở kho thật với --kiem <bản sao>.
- thu_cong_phan: chạy điều phối thu_cong.js của bản sao rồi đưa đầu ra vào kiemPhanThuCong CẮT từ bộ kiểm của bản sao (A1 — đột biến
  chia lượt chỉ lộ ra ở phép đếm phần của bộ kiểm, không ở chính thu_cong.js).
- ĐỐI CHỨNG mỗi bài (bản chưa đột biến phải xanh) trước khi chạy đột biến. thu_TOCDO1 đỏ SẴN ở D6 (5 chú thích số dòng cứng trên main,
  ngưỡng 4 — Phát hiện của việc này): đối chứng của nó chỉ tha đúng dòng "✗ D6 kho thật", mọi dòng ✗ khác vẫn là đỏ.
- Bắt = thoát ≠ 0 VÀ có dòng khớp `bat` VÀ không dòng "sập"/"ném" VÀ có dòng tổng của bài (bài sập / không in tổng ≠ bắt).
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHEP = ['KHUON_LOI.md', 'CLAUDE.md', 'kiem_tra_truoc_khi_giao.js', '.github/workflows/keep-alive.yml', 'package.json']
CAY = ['cong_cu', 'server']   # + mọi FILE trực tiếp trong tu_chay/
THU_CONG_PHAN = r"""
const { spawnSync } = require('child_process'), fs = require('fs'), p = require('path'), b = process.argv[1];
const r = spawnSync(process.execPath, [p.join(b, 'tu_chay/thu_cong.js')], { encoding: 'utf8', timeout: 400000 });
const kt = fs.readFileSync(p.join(b, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
const a = kt.search(/^const NGUONG_THU_CONG_DON_VI = /m), f = kt.indexOf('function kiemPhanThuCong(', a);
const loi = a < 0 || f < 0 ? 'không cắt được kiemPhanThuCong'
  : new Function('dong', kt.slice(a, kt.indexOf('\n}\n', f) + 3) + '\nreturn kiemPhanThuCong;')([])(String(r.stdout) + String(r.stderr));
if (loi) console.log('  ✗ thu_cong.js thiếu phép: ' + loi);
console.log(`thu_cong_phan: ${loi ? 0 : 1} đạt · ${loi ? 1 : 0} hỏng (thu_cong thoát ${r.status})`);
process.exit(loi ? 1 : 0);
"""
KIEM_CHU = r"""
const fs = require('fs'), p = require('path'), b = process.argv[1];
const tk = fs.readFileSync(p.join(b, 'tu_chay/THIET_KE.md'), 'utf8');
const m = (/### TU-CHAY-8 \(17\.10\.2026, tu-chay 1\.8\.0\)[^]*?(?=\n## )/.exec(tk) || [''])[0];
const ca = ['A1', 'A2', 'A3', 'A4', 'A5', 'A7'].map((x) => [`THIET_KE mục TU-CHAY-8 có **${x}**`, m.includes(`- **${x}**`)]);
ca.push(['THIET_KE A3 ghi lỗ còn hở', /\*\*A3\*\*[^]*Lỗ còn hở/.test(m)]);
for (const [t, d] of ca) if (!d) console.log('  ✗ ' + t);
const h = ca.filter(([, d]) => !d).length;
console.log(`kiem_chu: ${ca.length - h} đạt · ${h} hỏng`);
process.exit(h ? 1 : 0);
"""
BAI = {  # tên bài → (lệnh theo bản sao, regex dòng tổng, giây tối đa)
  'thu_cong': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_cong.js')], r'^thu_cong: \d+ phép · \d+ chỗ hỏng', 400),
  'thu_cong_phan': (lambda b: ['node', '-e', THU_CONG_PHAN, b], r'^thu_cong_phan: \d+ đạt · \d+ hỏng', 450),
  'thu_cong_cu': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_cong_cu.js')], r'^thu_cong_cu: \d+ phép · \d+ chỗ hỏng', 120),
  'thu_nguoi_gac': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_nguoi_gac.js')], r'^thu_nguoi_gac: \d+/\d+ ca người gác', 180),
  'thu_gia_lap': (lambda b: ['node', os.path.join(b, 'cong_cu', 'thu_gia_lap.js')], r'^\s*\d+ đạt · \d+ hỏng', 300),
  'thu_TOCDO1': (lambda b: ['node', 'cong_cu/thu_TOCDO1.js', '--kiem', os.path.join(b, 'kiem_tra_truoc_khi_giao.js')], r'^thu_TOCDO1: \d+ đạt · \d+ hỏng', 120),
  'kiem_chu': (lambda b: ['node', '-e', KIEM_CHU, b], r'^kiem_chu: \d+ đạt · \d+ hỏng', 30),
}
DO_SAN = {'thu_TOCDO1': r'✗ D6 kho thật'}   # đỏ sẵn trên main, không do việc này (xem đầu file)
KIEM = 'kiem_tra_truoc_khi_giao.js'
TC = 'tu_chay/thu_cong.js'
NG = 'tu_chay/nguoi_gac.js'
SK = 'tu_chay/skill_lam_viec.md'
GOI = "kiemPhanThuCong(chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, true))"
CA_NHAP = lambda f, ma: r'✗ ca Bash "' + f + r'": mong CHAN:' + ma + ', ra CHO'
A7_CHO = r'✗ ca Bash "git checkout viec/X": mong CHO, ra CHAN:GIT-CHECKOUT'
A7_CHAN = r'✗ ca Bash "{}": mong CHAN:GIT-CHECKOUT, ra CHO'

# (tên, file, [(chuỗi gốc, chuỗi thay, số lần khớp)], [bài], regex dòng phải thấy)
DOT_BIEN = [
  # ── A4 kiem_tra chayBaiThat: thoát 0 mà không in dòng tổng → FAIL ──
  ('BV-TUCHAY8-DONG-TONG', KIEM, [("const xanh = r.status === 0 && !r.error && tong;", "const xanh = r.status === 0 && !r.error;", 1)],
   ['thu_TOCDO1', 'thu_gia_lap'], r'✗ C4a |✗ C3i '),
  ('VS-TUCHAY8-DONG-TONG-BO-GIA-LAP', KIEM, [("|Giả lập: \\d+ kịch bản · \\d+ bất biến/.test(tho);", "/.test(tho);", 1)],
   ['thu_TOCDO1'], r'✗ C4b \(A4 K5\) bài thoát 0 in dòng tổng dạng giả lập'),
  ('VS-TUCHAY8-DONG-TONG-KHONG-NEO-SO', KIEM, [("const tong = /\\d+ đạt · \\d+ hỏng|", "const tong = /đạt · hỏng|", 1)],
   ['thu_TOCDO1'], r'✗ C4c .*"đạt · hỏng" không số'),   # vòng 1 SỐNG (chưa ca "đạt · hỏng" không số) → thêm ca C4c
  # ── A1 kiem_tra: kiemPhanThuCong + bánh cóc Q6 ──
  ('BV-TUCHAY8-KIEM-PHAN', KIEM, [(GOI, "(chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, true), null)", 1)], ['thu_TOCDO1'], r'✗ P2 '),
  ('VS-TUCHAY8-KIEM-PHAN-CHI-DEM-SO-PHAN', KIEM, [("  if (tong !== T) return", "  if (false) return", 1)], ['thu_TOCDO1'], r'✗ P4 '),
  ('VS-TUCHAY8-KIEM-PHAN-DEM-DONG', KIEM, [("if (so !== Array.from({ length: n }, (_, i) => i + 1).join())", "if (ph.length !== n)", 1)],
   ['thu_TOCDO1'], r'✗ P3 '),
  ('BV-TUCHAY8-BANH-COC', KIEM, [("  if (T < NGUONG_THU_CONG_DON_VI) return", "  if (false) return", 1)], ['thu_TOCDO1'], r'✗ P7 '),
  ('VS-TUCHAY8-BANH-COC-LECH-MOT', KIEM, [("  if (T < NGUONG_THU_CONG_DON_VI) return", "  if (T < NGUONG_THU_CONG_DON_VI - 1) return", 1)],
   ['thu_TOCDO1'], r'✗ P7 '),
  # ── A1 thu_cong.js: chia lượt + điều phối ──
  ('BV-TUCHAY8-PHAN-KHONG-CHIA', TC, [("const toi = soDonVi++ % PHAN.n === PHAN.i - 1;", "const toi = (soDonVi++, true);", 1)],
   ['thu_cong_phan'], r'✗ thu_cong\.js thiếu phép: Σ đơn vị'),
  ('VS-TUCHAY8-PHAN-LECH-MOT', TC, [("const toi = soDonVi++ % PHAN.n === PHAN.i - 1;", "const toi = soDonVi++ % PHAN.n === PHAN.i;", 1)],
   ['thu_cong_phan'], r'✗ thu_cong\.js thiếu phép: Σ đơn vị'),
  ('BV-TUCHAY8-CA-KHONG-LA-DON-VI', TC, [("  if (!donVi(ten)) return;\n", '', 1)], ['thu_cong_phan'], r'✗ thu_cong\.js thiếu phép: \d+ đơn vị < NGUONG'),
  ('VS-TUCHAY8-DIEU-PHOI-BO-PHAN', TC, [("Array.from({ length: SO_PHAN }, (_, k)", "Array.from({ length: SO_PHAN - 1 }, (_, k)", 1)],
   ['thu_cong_phan'], r'✗ thu_cong\.js thiếu phép: phần đã chạy 1,2, cần 1\.\.3'),
  ('BV-TUCHAY8-DB-THEO-PHAN', TC, [("      if (CUA[ten] === false) continue;", "      if (false) continue;", 1)], ['thu_cong'], r'✗ đột biến A\d+: thiếu ca'),
  ('VS-TUCHAY8-HAN-PHAN-NOI', TC, [("{ timeout: 120000, killSignal: 'SIGKILL' }", "{ timeout: 150000, killSignal: 'SIGKILL' }", 1)],
   ['thu_TOCDO1'], r'✗ P10 '),
  # ── A3 nguoi_gac.js: soi file script được chạy ──
  ('BV-TUCHAY8-SOI-TEP-NODE', NG, [("    return dauTien(tep, (t) => xetTep(t, nc, cwd, l, t !== script));", "    return null;", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'node \S+/nhap/s\.js', 'B-BIMAT-CHU')),
  ('VS-TUCHAY8-SOI-BO-PYTHON', NG, [("    return script ? xetTep(script, nc, cwd, l) : null;", "    return null;", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'python3 \S+/nhap/s\.py', 'B-BIMAT-CHU')),
  ('VS-TUCHAY8-SOI-BO-BASH', NG, [(r"cong_cu\/.+\.sh$/.test(rel)) return xetTep(a[0], nc, cwd, l);", r"cong_cu\/.+\.sh$/.test(rel)) return null;", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'bash cong_cu/bm\.sh', 'B-BIMAT-CHU')),
  ('VS-TUCHAY8-SOI-BO-NAP-KEM', NG, [("const tep = [...kem.filter(", "const tep = [...[].filter(", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'node -r \S+/nhap/s\.js -e 1', 'B-BIMAT-CHU')),
  ('VS-TUCHAY8-TEP-TO-VAN-DOC', NG, [("if (s.size > TEP_TOI_DA) return", "if (s.size > TEP_TOI_DA * 2) return", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'node \S+/nhap/to\.js', 'B-PHANTICH')),
  ('BV-TUCHAY8-SOI-FILE-BI-MAT', NG, [("  if (luat('B-BIMAT-FILE')) {\n    const w = nd.split", "  if (false) {\n    const w = nd.split", 1)],
   ['thu_nguoi_gac'], r'✗ ca Bash "node \S+/nhap/envf\.js": mong CHAN:B-BIMAT-FILE, ra CHAN:B-MANOI'),
  # ── A3 soát vòng 1: miễn theo lịch sử HEAD, đứng một mình, soi mọi nơi, cờ node ──
  ('BV-TUCHAY8-MIEN-LICH-SU', NG, [("  if (trongLichSu(abs, nc)) return null;\n", '', 1)], ['thu_nguoi_gac'],
   r'✗ ca Bash "node cong_cu/thu_bm\.js": mong CHO, ra CHAN:B-BIMAT-CHU'),
  ('VS-TUCHAY8-MIEN-MOI-BLOB', NG, [("  const r = gitGac(nc.goc, 'rev-list', '--objects', 'HEAD');\n  return r.status === 0 && r.stdout.split('\\n').some((d) => d.startsWith(h.stdout.trim()));",
    "  return gitGac(nc.goc, 'cat-file', '-e', h.stdout.trim()).status === 0;", 1)], ['thu_nguoi_gac'], CA_NHAP(r'node cong_cu/chi_muc\.js', 'B-BIMAT-CHU')),
  ('VS-TUCHAY8-MIEN-KHI-GIT-LOI', NG, [("  return r.status === 0 && r.stdout.split", "  return r.status !== 0 || r.stdout.split", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'node \S+/nhap/s\.js', 'B-BIMAT-CHU')),
  ('BV-TUCHAY8-MOT-MINH', NG, [("  if (luat('B-PHANTICH') && !motMinh(l, nc)) {", "  if (false) {", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'cp \S+/nhap/s\.js \S+/nhap/vo_hai\.js && node \S+/nhap/vo_hai\.js', 'B-PHANTICH')),
  ('VS-TUCHAY8-MOT-MINH-TRUOC-BAT-KY', NG, [("  if (j === 1 && !(ds[0].duocCd && ds[0].tu && ds[0].tu[0].val === 'cd' && ds[0].sau === '&&')) return false;\n", '', 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'cp \S+/nhap/s\.js \S+/nhap/vo_hai\.js && node \S+/nhap/vo_hai\.js', 'B-PHANTICH')),
  ('VS-TUCHAY8-MOT-MINH-SAU-TU-DO', NG, [("&& LOC.has(m.tu[0].val) &&", "&&", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'node \S+/nhap/vo_hai\.js \| cp \S+/nhap/s\.js \S+/nhap/vo_hai\.js', 'B-PHANTICH')),
  ('VS-TUCHAY8-MOT-MINH-SAU-GHI-FILE', NG, [("\n    && m.cc.every((t) => /^\\/dev\\/(null|stdout|stderr)$/.test(t.val)));", ");", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'node \S+/nhap/vo_hai\.js \| grep x > \S+/nhap/vo_hai\.js', 'B-PHANTICH')),
  ('VS-TUCHAY8-MOT-MINH-CHO-CON', NG, [("if (j < 0 || j > 1 || l.con.length) return false;", "if (j < 0 || j > 1) return false;", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'node \S+/nhap/vo_hai\.js \$\(cp \S+/nhap/s\.js \S+/nhap/vo_hai\.js\)', 'B-PHANTICH')),
  ('VS-TUCHAY8-CHI-SOI-KHO-NHAP', NG, [("  if (!s) return kem ?", "  if (ngoaiKho(relKho(abs, nc)) && !trongNhap(abs, nc)) return null;\n  if (!s) return kem ?", 1)],
   ['thu_nguoi_gac'], CA_NHAP(r'node \S+/home/\.claude/plans/p\.js', 'B-BIMAT-CHU')),
  ('BV-TUCHAY8-MOT-TEP', NG, [("if (luat('B-PHANTICH') && tep.length > 1)", "if (false)", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'node -r \S+/nhap/vo_hai\.js \S+/nhap/vo_hai\.js', 'B-PHANTICH')),
  ('BV-TUCHAY8-NODE-TEST', NG, [("if (luat('B-PHANTICH') && a.some((w) => w.val === '--test'))", "if (false)", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'cd \S+/nhap && node --test', 'B-PHANTICH')),
  ('VS-TUCHAY8-KEM-DATA-KHONG-SOI', NG, [("  if (!s) return kem ? xetNoiDung(t.val, nc, t.tho) : null;", "  if (!s) return null;", 1)], ['thu_nguoi_gac'],
   r'✗ ca Bash "node --import \'data:text/javascript,console\.log\(process\.env\)\' -e 1": mong CHAN:B-BIMAT-CHU, ra CHO'),
  ('VS-TUCHAY8-BO-CO-GIA-TRI-FILE', NG, [("    if (ten === 'node' && /^--[^=]+=./.test(v)) { kem.push(", "    if (false) { kem.push(", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r'node --env-file=\.env -e 1', 'B-BIMAT-FILE')),
  ('VS-TUCHAY8-NAP-THIEU-LOADER', NG, [("'--loader', '--experimental-loader', '--test-reporter'];", "'--loader', '--test-reporter'];", 1)],
   ['thu_nguoi_gac'], r'✗ ca Bash "node --experimental-loader \'data:text/javascript,console\.log\(process\.env\)\' -e 1": mong CHAN:B-BIMAT-CHU, ra CHO'),
  ('BV-TUCHAY8-NODE-PE', NG, [("    if (ten === 'node' && /^-[a-z]{2,}$/.test(v) && /[ep]/.test(v)) {", "    if (false) {", 1)], ['thu_nguoi_gac'],
   CA_NHAP(r"node -pe 'process\.env'", 'B-BIMAT-CHU')),
  # ── A7 nguoi_gac.js: git checkout viec/<MÃ> khi HEAD tách rời đúng commit ──
  ('BV-TUCHAY8-A7', NG, [("      if (r.length === 1 && luat('GIT-CHECKOUT-TACH') && veNhanhViec(r[0], nc, cwd)) return null;\n", '', 1)],
   ['thu_nguoi_gac'], A7_CHO),
  ('VS-TUCHAY8-A7-KHONG-SO-SHA', NG, [("  return !!h && h === sha('refs/heads/' + w.val);", "  return !!h;", 1)], ['thu_nguoi_gac'],
   A7_CHAN.format('git checkout viec/X')),   # chỉ kho KHAC (tách rời, khác commit) ra CHO
  ('VS-TUCHAY8-A7-CA-KHI-DUNG-TREN-NHANH', NG, [("if (!m || nc.nhanh !== null || ", "if (!m || ", 1)], ['thu_nguoi_gac'],
   A7_CHAN.format('git checkout viec/X')),
  ('VS-TUCHAY8-A7-KHONG-DOI-PHIEU', NG, [(" || !fs.existsSync(path.join(nc.goc, 'viec', m[1], 'phieu.md'))) return false;", ") return false;", 1)],
   ['thu_nguoi_gac'], A7_CHAN.format('git checkout viec/X')),
  ('VS-TUCHAY8-A7-NHIEU-DOI-SO', NG, [("if (r.length === 1 && luat('GIT-CHECKOUT-TACH')", "if (r.length >= 1 && luat('GIT-CHECKOUT-TACH')", 1)],
   ['thu_nguoi_gac'], A7_CHAN.format('git checkout viec/X --')),
  ('VS-TUCHAY8-A7-NGOAI-KHO', NG, [("  if (!laCon(d, nc.goc) || KHUNG.test(relKho(d, nc)) || khoLong(d, nc)) return false;\n", '', 1)],
   ['thu_nguoi_gac'], A7_CHAN.format(r'cd \S+/nhap && git checkout viec/X')),
  # ── A2 / A3 / A7 skill (chữ) ──
  ('BV-TUCHAY8-SKILL-B11-CONG-CHAY', SK, [("dòng `✓ CỔNG CHẠY ĐẠT` hoặc NGUYÊN từng dòng `✗`", "kết quả cổng", 1)], ['thu_cong_cu'], r'✗ TU-CHAY-8 A2 skill 11\.4'),
  ('BV-TUCHAY8-SKILL-B4-TU-THU', SK, [("mà bài tự thử chính nó qua tiến trình con", "", 1)], ['thu_cong_cu'], r'✗ TU-CHAY-8 A2 skill bước 4'),
  ('BV-TUCHAY8-SKILL-EDIT', SK, [("thì dùng công cụ Edit/Write, không dùng lệnh bash;", "thì cẩn thận;", 1)], ['thu_cong_cu'], r'✗ TU-CHAY-8 A3 skill luật cứng'),
  ('BV-TUCHAY8-SKILL-B1-TACH-ROI', SK, [("này) rồi đi tiếp, không dừng;", "này);", 1)], ['thu_cong_cu'], r'✗ TU-CHAY-8 A7 skill bước 1\.1'),
  # ── A5 PHIEN_BAN + THIET_KE (chữ) ──
  ('BV-TUCHAY8-PHIENBAN', 'tu_chay/PHIEN_BAN', [("tu-chay 1.8.0", "tu-chay 1.8", 1)], ['thu_cong_cu', 'thu_nguoi_gac'], r'✗ .*PHIEN_BAN dạng tu-chay x\.y\.z'),
  ('BV-TUCHAY8-THIETKE-TIEU-DE', 'tu_chay/THIET_KE.md', [("### TU-CHAY-8 (17.10.2026, tu-chay 1.8.0)", "### TU-CHAY-8 (17.10.2026)", 1)],
   ['thu_cong_cu', 'kiem_chu'], r'✗ TU-CHAY-8 A5 PHIEN_BAN|✗ THIET_KE mục TU-CHAY-8'),
  ('BV-TUCHAY8-THIETKE-A3', 'tu_chay/THIET_KE.md', [("- **A3** người gác đọc file script", "- người gác đọc file script", 1)], ['kiem_chu'],
   r'✗ THIET_KE mục TU-CHAY-8 có \*\*A3\*\*'),
]


def ban_sao():  # chép THẬT vào thư mục tạm, kiểm realpath
  tam = os.path.realpath(tempfile.mkdtemp(prefix='tuchay8_db_'))
  if not tam.startswith(os.path.realpath(tempfile.gettempdir())) or tam.startswith(GOC + os.sep):
    sys.exit(f'bản sao {tam} không nằm trong thư mục tạm / nằm trong kho — DỪNG (K5 HOC-2b)')
  os.mkdir(os.path.join(tam, 'tu_chay'))
  for f in os.listdir(os.path.join(GOC, 'tu_chay')):
    p = os.path.join(GOC, 'tu_chay', f)
    if os.path.isfile(p):
      shutil.copyfile(p, os.path.join(tam, 'tu_chay', f), follow_symlinks=True)
      shutil.copymode(p, os.path.join(tam, 'tu_chay', f))
  for f in CHEP:
    os.makedirs(os.path.dirname(os.path.join(tam, f)), exist_ok=True)
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tam, f))
  for d in CAY:
    shutil.copytree(os.path.join(GOC, d), os.path.join(tam, d), symlinks=False, ignore=shutil.ignore_patterns('node_modules'))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))   # chỉ đọc (require)
  return tam


def chay_bai(ten, b):
  lenh, tong, han = BAI[ten]
  try:
    os.makedirs(os.path.join(b, 'tmp'), exist_ok=True)
    os.putenv('TMPDIR', os.path.join(b, 'tmp'))
    r = subprocess.run(lenh(b), cwd=GOC, capture_output=True, text=True, timeout=han)
    ma, ra = r.returncode, r.stdout + r.stderr
  except subprocess.TimeoutExpired as e:
    ma, ra = None, str(e.stdout or '') + str(e.stderr or '') + '\nquá giờ'
  ra = re.sub(r'\x1b\[[0-9;]*m', '', ra)
  co_tong = any(re.search(tong, l) for l in ra.splitlines())
  return ma, ra, co_tong


def hong_that(ten, ra):  # dòng ✗ trừ dòng đỏ sẵn đã biết của bài
  san = DO_SAN.get(ten)
  return [l.strip() for l in ra.splitlines() if l.strip().startswith('✗') and not (san and re.search(san, l))]


def doi_chung(ten):
  tam = ban_sao()
  try:
    ma, ra, co_tong = chay_bai(ten, tam)
    hong = hong_that(ten, ra)
    cuoi = (hong or ra.strip().splitlines() or ['(không in gì)'])[-1][:160]
    return (ma == 0 or (ten in DO_SAN and ma == 1)) and co_tong and not hong, cuoi
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def chay1(db):
  ten, f, cap, bais, bat = db
  tam = ban_sao()
  try:
    p = os.path.join(tam, f)
    s = open(p, encoding='utf-8').read()
    for cu, moi, n in cap:
      if s.count(cu) != n:
        return ten, False, f'chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được ({f})'
      s = s.replace(cu, moi)
    open(p, 'w', encoding='utf-8').write(s)
    chi = []
    for b in bais:
      ma, ra, co_tong = chay_bai(b, tam)
      dong = ra.splitlines()
      trung = [l.strip() for l in dong if re.search(bat, l)]
      # NGOẠI LỆ TẠM với KHUON_LOI K3 "luật sập rõ — không dò chuỗi": các bài thu_* chưa có mã thoát sập riêng (quy ước mã thoát 2 dời
      # sang TU-CHAY-9) nên còn dò dòng sập: "<bài> sập: " / "khối ném: " / thu_gia_lap "✗ bài thử sập". Bỏ khi TU-CHAY-9 xong.
      nem = [l.strip() for l in dong if re.search(r'\bsập: |\bném: |✗ bài thử sập\b', l)]
      if nem: return ten, False, f'{b}: bài thử SẬP/NÉM (không phải đột biến bị bắt): ' + nem[0][:140]
      if not co_tong: return ten, False, f'{b}: bài không in dòng tổng (thoát {ma}) ≠ bắt: ' + (dong or ['(không in gì)'])[-1][:120]
      if ma == 0 or not trung:
        return ten, False, f'{b}: thoát {ma}, KHÔNG thấy /{bat}/ · ' + (dong or ['(không in gì)'])[-1][:120]
      chi.append(f'{b}: {trung[0][:110]}')
    return ten, True, ' | '.join(chi)
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  la = [t for t in sys.argv[1:] if t not in {d[0] for d in DOT_BIEN}]
  if la:   # tên lạ / gõ sai → thoát 2, không chạy gì (LUOI-3 KHOÁ 1: chọn 0 đột biến không được báo “0 KHÔNG bị bắt”)
    print('tên đột biến lạ: ' + ', '.join(la))
    sys.exit(2)
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  can = sorted({b for d in chon for b in d[3]})
  hong_dc = False
  for b in can:
    xanh, chi = doi_chung(b)
    print(('  ✓ ' if xanh else '  ✗ ') + f'đối chứng {b} (bản sao chưa đột biến phải xanh): {chi}')
    hong_dc |= not xanh
  if hong_dc:
    print('\n  DỪNG — có bài đỏ trên bản chưa đột biến, không chạy đột biến (K3)')
    sys.exit(1)
  hong = 0
  for db in chon:
    ten, dat, chi = chay1(db)
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(chon) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(chon)})')
  sys.exit(1 if hong else 0)
