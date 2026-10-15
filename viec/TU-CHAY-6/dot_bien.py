#!/usr/bin/env python3
"""TU-CHAY-6 — đột biến cho các chỗ vá của việc: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/TU-CHAY-6/dot_bien.py [tên...]

Khuôn viec/TOC-DO-1/dot_bien.py, thêm:
- BẢN SAO CHÉP THẬT (không symlink — K5 HOC-2b): tu_chay/* + KHUON_LOI.md + CLAUDE.md + kiem_tra_truoc_khi_giao.js vào thư mục tạm;
  tự kiểm realpath đích nằm trong thư mục tạm và ngoài kho. Bài tu_chay/thu_cong.js, thu_cong_cu.js, thu_nguoi_gac.js chạy TỪ bản sao
  (đọc __dirname); cong_cu/thu_TOCDO1.js chạy ở kho thật với --kiem <bản sao bộ kiểm>.
- ĐỐI CHỨNG mỗi bài (bản chưa đột biến phải xanh) — bài đang sập thì mọi "bị bắt" là oan (K3, TOC-DO-1 Phát hiện 3).
- Bắt = thoát ≠ 0 VÀ có dòng khớp `bat` VÀ không dòng "sập"/"ném" VÀ có dòng tổng của bài (bài sập / không in tổng ≠ bắt — SO-LUONG-1).
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHEP = ['KHUON_LOI.md', 'CLAUDE.md', 'kiem_tra_truoc_khi_giao.js']  # + mọi FILE trực tiếp trong tu_chay/
BAI = {  # tên bài → (lệnh theo bản sao, regex dòng tổng, giây tối đa)
  'thu_cong': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_cong.js')], r'^thu_cong: \d+ phép · \d+ chỗ hỏng', 600),
  'thu_cong_cu': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_cong_cu.js')], r'^thu_cong_cu: \d+ phép · \d+ chỗ hỏng', 120),
  'thu_nguoi_gac': (lambda b: ['node', os.path.join(b, 'tu_chay', 'thu_nguoi_gac.js')], r'^thu_nguoi_gac: \d+/\d+ ca người gác', 120),
  'thu_TOCDO1': (lambda b: ['node', 'cong_cu/thu_TOCDO1.js', '--kiem', os.path.join(b, 'kiem_tra_truoc_khi_giao.js')], r'^thu_TOCDO1: \d+ đạt · \d+ hỏng', 120),
}
CONG = 'tu_chay/cong.js'
KIEM = 'kiem_tra_truoc_khi_giao.js'
SKILL = 'tu_chay/skill_lam_viec.md'
NEM = "  if (r.status === null || r.error) throw new Error(`git cat-file hỏng (${String(sha).slice(0, 7)}:${p}): ${r.error ? r.error.message : r.signal || String(r.stderr).trim()}`);\n"
SKILL_B4 = ("   Trước khi xin chủ quán sửa phiếu (thiếu `## Bài thử đỏ`, `## Bài thử cũ sửa`, Phạm vi): (i) tự xét từ `bang_chung_do.txt` hai phép\n"
            "   cổng `chay` sẽ bắt — bài cũ sửa mà xanh trên gốc → cần `## Bài thử cũ sửa` (A11); không bài nào đỏ trên gốc → cần `## Bài thử đỏ`\n"
            "   (A12) — gom MỘT câu hỏi đủ cả hai (LUOI-2 hỏi 2 lần); (ii) chạy `node tu_chay/cong.js tinh . <mốc>^ HEAD viec/$0` (mốc = commit\n"
            "   `PHIEU: $0` đầu tiên, lệnh ở `/ra-soat` bước 1) để kiểm Phạm vi / A7 / A17 với file ĐÃ commit, dẫn NGUYÊN dòng ✗ liên quan vào\n"
            "   câu hỏi; `✗ [A19]` (chưa tới 11.4) và `✗ [A8]` (việc sửa `tu_chay/`, chủ quán cài sau) ở bước này là bình thường, không hỏi.\n")
K4 = ("- **Chặn (SO-LUONG-1):** cổng \"bắt buộc có X\" kiểm CÙNG biểu thức với chỗ dùng X — SĐT đã chuẩn hoá, không phải giá trị thô (`\" \"` lọt\n"
      "  qua `customer_phone` thô ở orders.js:198; chép cổng có sẵn thì chép luôn lỗ của nó).\n")
RANH = "      for (let i = r.i + 1; i < cuoi; i++) if (/^\\}?\\);\\s*$/.test(sach[i])) { cuoi = i + 1; break; }\n"

# (tên, file, [(chuỗi gốc, chuỗi thay, số lần khớp)], [bài], regex dòng phải thấy)
DOT_BIEN = [
  # ── A1 cong.js blob / try / archive ──
  ('BV-TUCHAY6-BLOB-NULL', CONG, [(NEM, '', 1)], ['thu_cong'], r'✗ TU-CHAY-6 A1 git giả tự giết ở cat-file cong_cu/thu_a\.js'),
  ('VS-TUCHAY6-BLOB-NUOT-SIGNAL', CONG, [("if (r.status === null || r.error) throw", "if (r.error) throw", 1)], ['thu_cong'],
   r'✗ TU-CHAY-6 A1 git giả tự giết ở cat-file cong_cu/thu_a\.js'),
  ('VS-TUCHAY6-BLOB-NEM-128', CONG, [("if (r.status === null || r.error) throw", "if (r.status !== 0) throw", 1)], ['thu_cong'],
   r'✗ A14 không có viec/<MÃ>/phieu\.md: KHÔNG có "\[CONG\]"'),
  ('BV-TUCHAY6-BLOB-TRONG-TRY', CONG, [("      const bCH = blob(thuMuc, head, 'tu_chay/cau_hinh.json'); // blob NGOÀI try: git hỏng phải ném ra, không bị nuốt (TU-CHAY-6 A1)\n"
                                        "      let chH = {};\n      if (bCH !== null) try { chH = JSON.parse(bCH) || {}; } catch {}",
                                        "      let chH = {};\n      try { chH = JSON.parse(blob(thuMuc, head, 'tu_chay/cau_hinh.json')); } catch {}", 1)],
   ['thu_cong'], r'✗ TU-CHAY-6 A1 git giả tự giết ở cat-file tu_chay/cau_hinh\.json'),
  ('BV-TUCHAY6-ARCHIVE-NUOT', CONG, [("      if (!giaiNen(thuMuc, moc, goc)) throw new Error(`git archive ${moc.slice(0, 7)} hỏng — không dựng được cây gốc`);\n",
                                      "      giaiNen(thuMuc, moc, goc);\n", 1)], ['thu_cong'], r'✗ TU-CHAY-6 A1b git giả tự giết ở archive'),
  # ── A2 kiem_tra E14 ──
  ('BV-TUCHAY6-A2-BO-GOI', KIEM, [("  const { getGhi, khongLoiGhi } = quetRouteGhi((f) => doc('server/routes/' + f), ten);",
                                   "  const { getGhi, khongLoiGhi } = { getGhi: [], khongLoiGhi: [] };", 1)], ['thu_TOCDO1'], r'✗ R0b '),
  ('VS-TUCHAY6-A2-QUEN-INSERT', KIEM, [("|INSERT(?:\\s+OR\\s+\\w+)?\\s+INTO|", "|", 1)], ['thu_TOCDO1'], r'✗ R2 '),
  ('VS-TUCHAY6-A2-MIEN-THEO-FILE', KIEM, [("![iGhi, iRun, iRun - 1].some((i) => i >= r.i && MIEN.test(tho[i]))", "!tho.some((d) => MIEN.test(d))", 1)],
   ['thu_TOCDO1'], r'✗ R3d '),
  ('VS-TUCHAY6-A2-QUEN-TXRUN', KIEM, [("/\\brun\\(/", "/^\\s*(?:await\\s+)?run\\(/", 2)], ['thu_TOCDO1'], r'✗ R2b '),
  ('VS-TUCHAY6-A2-NGUONG-LON-HON-BANG', KIEM, [("return n > nguong ? 'canh'", "return n >= nguong ? 'canh'", 1)], ['thu_TOCDO1'], r'✗ R11 '),
  ('VS-TUCHAY6-A2-CUNG-DONG', KIEM, [("if (iGhi < 0 || tim(/\\brun\\(/) < 0) return;", "if (iGhi < 0 || !/\\brun\\(/.test(sach[iGhi])) return;", 1)],
   ['thu_TOCDO1'], r'✗ R1b '),
  ('VS-TUCHAY6-A2-NUOT-HAM-PHU', KIEM, [(RANH, '', 1)], ['thu_TOCDO1'], r'✗ R10b '),
  # ── A3 / A4 / A6 chữ ──
  ('BV-TUCHAY6-SKILL-B4', SKILL, [(SKILL_B4, '', 1)], ['thu_cong_cu'], r'✗ TU-CHAY-6 A3 skill bước 4'),
  ('VS-TUCHAY6-SKILL-CHAY-THAY-TINH', SKILL, [("`node tu_chay/cong.js tinh . <mốc>^ HEAD viec/$0`", "`node tu_chay/cong.js chay . <mốc>^ HEAD viec/$0`", 1)],
   ['thu_cong_cu'], r'✗ TU-CHAY-6 A3 skill bước 4'),
  ('BV-TUCHAY6-RASOAT-CUOI', 'tu_chay/lenh_ra_soat.md', [("`SubagentHandback` — hành động CUỐI CÙNG và BẮT BUỘC (người gác", "`SubagentHandback` (người gác", 1)],
   ['thu_cong_cu'], r'✗ TU-CHAY-6 A3 lenh_ra_soat'),
  ('BV-TUCHAY6-KHUONLOI-K4', 'KHUON_LOI.md', [(K4, '', 1)], ['thu_cong_cu'], r'✗ TU-CHAY-6 A4 KHUON_LOI'),
  ('BV-TUCHAY6-PHIENBAN-CU', 'tu_chay/PHIEN_BAN', [("tu-chay 1.6.0", "tu-chay 1.5.0", 1)], ['thu_cong_cu', 'thu_nguoi_gac'], r'✗ .*PHIEN_BAN = tu-chay 1\.6\.0'),
  ('BV-TUCHAY6-THIETKE-B15', 'tu_chay/THIET_KE.md', [("### TU-CHAY-6 (15.10.2026, tu-chay 1.6.0)", "### TU-CHAY-6 (15.10.2026)", 1),
                                                      ("- **A1 `blob()` không trả `null` khi git không chạy được**", "- **A1 blob không trả null khi git không chạy được**", 1)],
   ['thu_cong_cu'], r'✗ TU-CHAY-6 A6 THIET_KE B15'),
]


def ban_sao():  # chép THẬT vào thư mục tạm, kiểm realpath
  tam = os.path.realpath(tempfile.mkdtemp(prefix='tuchay6_db_'))
  if not tam.startswith(os.path.realpath(tempfile.gettempdir())) or tam.startswith(GOC + os.sep):
    sys.exit(f'bản sao {tam} không nằm trong thư mục tạm / nằm trong kho — DỪNG (K5 HOC-2b)')
  os.mkdir(os.path.join(tam, 'tu_chay'))
  for f in os.listdir(os.path.join(GOC, 'tu_chay')):
    p = os.path.join(GOC, 'tu_chay', f)
    if os.path.isfile(p):
      shutil.copyfile(p, os.path.join(tam, 'tu_chay', f), follow_symlinks=True)
      shutil.copymode(p, os.path.join(tam, 'tu_chay', f))
  for f in CHEP: shutil.copyfile(os.path.join(GOC, f), os.path.join(tam, f))
  return tam


def chay_bai(ten, b):
  lenh, tong, han = BAI[ten]
  try:
    r = subprocess.run(lenh(b), cwd=GOC, capture_output=True, text=True, timeout=han)
    ma, ra = r.returncode, r.stdout + r.stderr
  except subprocess.TimeoutExpired as e:
    ma, ra = None, (e.stdout or '') + (e.stderr or '') + '\nquá giờ'
  ra = re.sub(r'\x1b\[[0-9;]*m', '', ra)
  co_tong = any(re.search(tong, l) for l in ra.splitlines())
  return ma, ra, co_tong


def doi_chung(ten):
  tam = ban_sao()
  try:
    ma, ra, co_tong = chay_bai(ten, tam)
    cuoi = (ra.strip().splitlines() or ['(không in gì)'])[-1][:140]
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
      nem = [l.strip() for l in dong if re.search(r'\b(sập|ném)\b', l)]
      if nem: return ten, False, f'{b}: bài thử SẬP/NÉM (không phải đột biến bị bắt): ' + nem[0][:140]
      if not co_tong: return ten, False, f'{b}: bài không in dòng tổng (thoát {ma}) ≠ bắt: ' + (dong or ['(không in gì)'])[-1][:120]
      if ma == 0 or not trung:
        return ten, False, f'{b}: thoát {ma}, KHÔNG thấy /{bat}/ · ' + (dong or ['(không in gì)'])[-1][:120]
      chi.append(f'{b}: {trung[0][:110]}')
    return ten, True, ' | '.join(chi)
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
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
