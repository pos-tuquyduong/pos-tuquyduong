#!/usr/bin/env python3
"""TU-CHAY-7 — đột biến cho các chỗ vá của việc: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/TU-CHAY-7/dot_bien.py [tên...]

Khuôn viec/TU-CHAY-6/dot_bien.py:
- BẢN SAO CHÉP THẬT (không symlink, trừ node_modules chỉ đọc — K5 HOC-2b): tu_chay/*, cong_cu/, server/, KHUON_LOI.md, CLAUDE.md,
  kiem_tra_truoc_khi_giao.js, keep-alive.yml, package.json vào thư mục tạm; tự kiểm realpath đích trong thư mục tạm, ngoài kho.
  thu_cong / thu_cong_cu / thu_nguoi_gac / thu_gia_lap chạy TỪ bản sao (đọc __dirname); thu_TOCDO1 chạy ở kho thật với --kiem <bản sao>.
- ĐỐI CHỨNG mỗi bài (bản chưa đột biến phải xanh) trước khi chạy đột biến.
- Bắt = thoát ≠ 0 VÀ có dòng khớp `bat` VÀ không dòng "sập"/"ném" VÀ có dòng tổng của bài (bài sập / không in tổng ≠ bắt).
- Chữ (KHUON_LOI.md A4, THIET_KE.md A5): bài `kiem_chu` (node -e, đọc bản sao) — không bài thử nào của kho canh ≤ 100 dòng / câu mới.
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHEP = ['KHUON_LOI.md', 'CLAUDE.md', 'kiem_tra_truoc_khi_giao.js', '.github/workflows/keep-alive.yml', 'package.json']
CAY = ['cong_cu', 'server']   # + mọi FILE trực tiếp trong tu_chay/
KIEM_CHU = r"""
const fs = require('fs'), p = require('path'), b = process.argv[1];
const kl = fs.readFileSync(p.join(b, 'KHUON_LOI.md'), 'utf8'), tk = fs.readFileSync(p.join(b, 'tu_chay/THIET_KE.md'), 'utf8');
const kc = kl.replace(/\s+/g, ' ');   // câu dài bị gói xuống dòng (khổ 126) — so chữ trên bản gộp khoảng trắng
const ca = [['KHUON_LOI ≤ 100 dòng', kl.replace(/\n$/, '').split('\n').length <= 100],
  ['KHUON_LOI K3 ngưỡng hằng số tất định so bằng', kc.includes('Ngưỡng về hằng số TẤT ĐỊNH thì so bằng, không so một chiều')],
  ['KHUON_LOI K4 một vị từ', kc.includes('MỘT vị từ cho cả "có gì để làm" và "làm"')],
  ['KHUON_LOI K3 bộ đột biến từng tên + đối chứng + luật sập, không dò chuỗi', /chạy được TỪNG TÊN, có ĐỐI CHỨNG[^]*luật sập rõ[^]*không dò chuỗi/.test(kc)],
  ['THIET_KE có mục TU-CHAY-7 A1–A3', /### TU-CHAY-7 \(16\.10\.2026, tu-chay 1\.7\.0\)[^]*\*\*A1\*\*[^]*\*\*A2\*\*[^]*\*\*A3 phép tĩnh E15\*\*/.test(tk)]];
for (const [t, d] of ca) if (!d) console.log('  ✗ ' + t);
const h = ca.filter(([, d]) => !d).length;
console.log(`kiem_chu: ${ca.length - h} đạt · ${h} hỏng`);
process.exit(h ? 1 : 0);
"""
BAI = {  # tên bài → (lệnh theo bản sao, regex dòng tổng, giây tối đa)
  'thu_cong': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_cong.js')], r'^thu_cong: \d+ phép · \d+ chỗ hỏng', 600),
  'thu_cong_cu': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_cong_cu.js')], r'^thu_cong_cu: \d+ phép · \d+ chỗ hỏng', 120),
  'thu_nguoi_gac': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_nguoi_gac.js')], r'^thu_nguoi_gac: \d+/\d+ ca người gác', 120),
  'thu_gia_lap': (lambda b: ['node', os.path.join(b, 'cong_cu', 'thu_gia_lap.js')], r'^\s*\d+ đạt · \d+ hỏng', 300),
  'thu_TOCDO1': (lambda b: ['node', 'cong_cu/thu_TOCDO1.js', '--kiem', os.path.join(b, 'kiem_tra_truoc_khi_giao.js')], r'^thu_TOCDO1: \d+ đạt · \d+ hỏng', 120),
  'kiem_chu': (lambda b: ['node', '-e', KIEM_CHU, b], r'^kiem_chu: \d+ đạt · \d+ hỏng', 30),
}
KIEM = 'kiem_tra_truoc_khi_giao.js'
TC = 'tu_chay/thu_cong.js'
GL = 'cong_cu/thu_gia_lap.js'
KL = 'KHUON_LOI.md'
GOI = "chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, true)"
MOC = "    canhBao(`chú thích trỏ số dòng cứng ≤ ${NGUONG_DONG_CUNG}`"
DON_PID = ("for (const d of fs.readdirSync(os.tmpdir())) {\n  const pid = +(/^thu_cong_(\\d+)_/.exec(d) || [])[1];\n  if (!pid) continue;\n"
           "  try { process.kill(pid, 0); } catch (e) { if (e.code === 'ESRCH') try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch {} }\n}\n")
A2C = r'✗ TU-CHAY-7 A2 con het'

# (tên, file, [(chuỗi gốc, chuỗi thay, số lần khớp)], [bài], regex dòng phải thấy)
DOT_BIEN = [
  # ── A1 kiem_tra: lời gọi thu_cong bật cờ cảnh báo gần hạn ──
  ('BV-TUCHAY7-CANH-THUCONG', KIEM, [(GOI, "chayBaiThat('tu_chay/thu_cong.js')", 1)], ['thu_TOCDO1'], r'✗ C1 '),
  ('VS-TUCHAY7-CANH-FALSE', KIEM, [(GOI, "chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, false)", 1)], ['thu_TOCDO1'], r'✗ C1 '),
  ('VS-TUCHAY7-HAN-NOI', KIEM, [(GOI, "chayBaiThat('tu_chay/thu_cong.js', undefined, 150000, true)", 1)], ['thu_TOCDO1'], r'✗ C2 '),
  # ── A2 thu_cong.js (Q2a): exit + pid ──
  ('BV-TUCHAY7-DON-EXIT-THUCONG', TC, [("process.on('exit', () => { try { fs.rmSync(TAM, { recursive: true, force: true }); } catch {} });\n", '', 1)], ['thu_cong'], A2C),
  ('BV-TUCHAY7-DON-PID-CHET', TC, [(DON_PID, '', 1)], ['thu_cong'], A2C),
  ('VS-TUCHAY7-DON-CA-PID-SONG', TC, [("try { process.kill(pid, 0); } catch (e) { if (e.code === 'ESRCH') try {", "{ try {", 1)], ['thu_cong'], A2C),
  ('VS-TUCHAY7-DON-TAM-KHONG-PID', TC, [("`thu_cong_${process.pid}_`", "'thu_cong_'", 1)], ['thu_cong'], A2C),
  # ── A2 thu_gia_lap.js: exit + SIGINT/SIGTERM ──
  ('BV-TUCHAY7-DON-GL-TINHIEU', GL, [("for (const t of ['SIGINT', 'SIGTERM']) {\n  process.on(t, () => {", "for (const t of []) {\n  process.on(t, () => {", 1)],
   ['thu_gia_lap'], r'✗ DON SIGTERM giữa bài'),
  ('VS-TUCHAY7-DON-GL-CHI-SIGINT', GL, [("for (const t of ['SIGINT', 'SIGTERM']) {", "for (const t of ['SIGINT']) {", 1)], ['thu_gia_lap'], r'✗ DON SIGTERM giữa bài'),
  # dừng giả lập con khi bị ngắt (soát vòng 2 lỗi 6): không dừng → handler chờ đủ 10 s (đo bản vá: đóng sau 2,3–2,4 s) → ca "< 9 s" ĐỎ tất định
  ('BV-TUCHAY7-DON-GL-KHONG-DUNG-CON', GL, [("    for (const c of CON) c.kill('SIGTERM');\n    setInterval(", "    setInterval(", 1)], ['thu_gia_lap'],
   r'✗ DON SIGTERM giữa bài'),
  ('VS-TUCHAY7-DON-GL-DUNG-MOT-CON', GL, [("    for (const c of CON) c.kill('SIGTERM');\n    setInterval(", "    for (const c of [...CON].slice(0, 1)) c.kill('SIGTERM');\n    setInterval(", 1)],
   ['thu_gia_lap'], r'✗ DON SIGTERM giữa bài'),
  ('VS-TUCHAY7-DON-GL-QUEN-EXIT', GL, [("process.on('exit', () => { try { fs.rmSync(TAM, { recursive: true, force: true, maxRetries: 5 }); } catch { /* bỏ qua */ } });\n", '', 1)],
   ['thu_gia_lap'], r'✗ DON chạy hết'),
  # ── A3 kiem_tra E15: chú thích số dòng cứng ──
  ('BV-TUCHAY7-DONG-CUNG-BO-CANH', KIEM, [(MOC, "    pass(`chú thích trỏ số dòng cứng ≤ ${NGUONG_DONG_CUNG}`", 1)], ['thu_TOCDO1'], r'✗ D2 '),
  ('VS-TUCHAY7-DONG-CUNG-GACH', KIEM, [("const SO = /\\(:\\d+\\)|:\\d+[–-]\\d+/;", "const SO = /\\(:\\d+\\)|:\\d+-\\d+/;", 1)], ['thu_TOCDO1'], r'✗ D3 '),
  ('VS-TUCHAY7-DONG-CUNG-NGUONG', KIEM, [("if (ds.length > NGUONG_DONG_CUNG) {", "if (ds.length >= NGUONG_DONG_CUNG) {", 1)], ['thu_TOCDO1'], r'✗ D1 '),
  ('VS-TUCHAY7-DONG-CUNG-LAN', KIEM, [("if (m && SO.test(m[1] ?? m[2])) ra.push(`${f}:${i + 1}`);",
                                       "for (const x of (m && (m[1] ?? m[2]).match(/\\(:\\d+\\)|:\\d+[–-]\\d+/g)) || []) ra.push(`${f}:${i + 1}` + x);", 1)],
   ['thu_TOCDO1'], r'✗ D7 '),
  ('VS-TUCHAY7-DONG-CUNG-FAIL', KIEM, [(MOC, "    fail(`chú thích trỏ số dòng cứng ≤ ${NGUONG_DONG_CUNG}`", 1)], ['thu_TOCDO1'], r'✗ D9 '),
  ('VS-TUCHAY7-DONG-CUNG-VUNG', KIEM, [("|cong_cu\\/thu_[^/]+\\.js|", "|cong_cu\\/.+\\.js|", 1)], ['thu_TOCDO1'], r'✗ D8 '),
  ('VS-TUCHAY7-DONG-CUNG-CA-DONG', KIEM, [("const m = /\\/[/*](.*)$|^\\s*\\*(.*)$/.exec(d);", "const m = /(.*)/.exec(d);", 1)], ['thu_TOCDO1'], r'✗ D4 '),
  # ── A4 KHUON_LOI.md (chữ) ──
  ('BV-TUCHAY7-KHUONLOI-SO-BANG', KL, [("hằng số TẤT ĐỊNH thì so bằng, không so một chiều. ", '', 1)], ['kiem_chu'], r'✗ KHUON_LOI K3 ngưỡng'),
  ('BV-TUCHAY7-KHUONLOI-VI-TU', KL, [('MỘT vị từ cho cả "có gì để làm" và "làm"', 'một hàm', 1)],
   ['kiem_chu'], r'✗ KHUON_LOI K4 một vị từ'),
  ('BV-TUCHAY7-KHUONLOI-TUNG-TEN', KL, [("chạy được TỪNG TÊN, có ĐỐI CHỨNG", "có ĐỐI CHỨNG", 1)], ['kiem_chu'], r'✗ KHUON_LOI K3 bộ đột biến'),
  ('BV-TUCHAY7-KHUONLOI-101-DONG', KL, [("## K2 · ", "\n## K2 · ", 1)], ['kiem_chu'], r'✗ KHUON_LOI ≤ 100 dòng'),
  # ── A5 PHIEN_BAN + THIET_KE (chữ) ──
  ('BV-TUCHAY7-PHIENBAN-CU', 'tu_chay/PHIEN_BAN', [("tu-chay 1.7.0", "tu-chay 1.6.0", 1)], ['thu_cong_cu', 'thu_nguoi_gac'], r'✗ .*PHIEN_BAN = tu-chay 1\.7\.0'),
  ('BV-TUCHAY7-THIETKE', 'tu_chay/THIET_KE.md', [("### TU-CHAY-7 (16.10.2026, tu-chay 1.7.0)", "### TU-CHAY-7", 1)], ['kiem_chu'], r'✗ THIET_KE có mục TU-CHAY-7'),
]


def ban_sao():  # chép THẬT vào thư mục tạm, kiểm realpath
  tam = os.path.realpath(tempfile.mkdtemp(prefix='tuchay7_db_'))
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
    # TMPDIR trong bản sao: đột biến gỡ phần dọn (VS-…-QUEN-EXIT) làm sót thư mục tạm — sót trong bản sao thì rmtree xoá cùng (lần chạy 1
    # sót /tmp/thu_gl_p24O0w vì bài dùng /tmp chung). putenv: tiến trình con (env mặc định) thừa hưởng.
    os.makedirs(os.path.join(b, 'tmp'), exist_ok=True)
    os.putenv('TMPDIR', os.path.join(b, 'tmp'))
    r = subprocess.run(lenh(b), cwd=GOC, capture_output=True, text=True, timeout=han)
    ma, ra = r.returncode, r.stdout + r.stderr
  except subprocess.TimeoutExpired as e:
    ma, ra = None, str(e.stdout or '') + str(e.stderr or '') + '\nquá giờ'
  ra = re.sub(r'\x1b\[[0-9;]*m', '', ra)
  co_tong = any(re.search(tong, l) for l in ra.splitlines())
  return ma, ra, co_tong


def doi_chung(ten):
  tam = ban_sao()
  try:
    ma, ra, co_tong = chay_bai(ten, tam)
    hong = [l.strip() for l in ra.splitlines() if l.strip().startswith('✗')]
    cuoi = (hong or ra.strip().splitlines() or ['(không in gì)'])[-1][:160]
    return ma == 0 and co_tong, cuoi
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
      # NGOẠI LỆ TẠM với KHUON_LOI K3 "luật sập rõ — không dò chuỗi": các bài thu_* chưa có mã thoát sập riêng (TU-CHAY-8 đặt quy ước
      # mã thoát 2) nên còn dò dòng sập: "<bài> sập: " / "khối ném: " / thu_gia_lap "✗ bài thử sập". Bỏ khi TU-CHAY-8 xong.
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
