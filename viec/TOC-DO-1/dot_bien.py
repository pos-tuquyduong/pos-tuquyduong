#!/usr/bin/env python3
"""TOC-DO-1 — đột biến cho chỗ vá trong kiem_tra_truoc_khi_giao.js: VS- (vá sai cách) và BV- (bỏ vá).
Chạy ở GỐC kho:  python3 viec/TOC-DO-1/dot_bien.py [tên...]

Khuôn viec/GOI-1/dot_bien.py: chép bộ kiểm ra thư mục tạm, thay chuỗi (phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3),
chạy cong_cu/thu_TOCDO1.js --kiem <bản sao>. Đạt = thoát ≠ 0 VÀ đầu ra có dòng khớp `bat` (đúng ca phải bắt) VÀ không ca nào ném.
ĐỐI CHỨNG trước (K3, sự cố lần 1 của việc này): bản sao CHƯA đột biến phải 0 hỏng — bài thử đang sập thì mọi đột biến "bị bắt" oan.
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
KIEM = 'kiem_tra_truoc_khi_giao.js'
GOI = "const lyDoThuCong = lyDoChayThuCong();"
STATUS = "g('status', '--porcelain', '--untracked-files=all', '--', ...KHUNG)"

# (tên, [(chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
DOT_BIEN = [
  ('BV-TOCDO1-LUON-CHAY', [(GOI, "const lyDoThuCong = 'bỏ vá';", 1)], r'✗ T1 '),
  ('VS-TOCDO1-LUON-BO-QUA', [(GOI, "const lyDoThuCong = null;", 1)], r'✗ T3a'),
  ('VS-TOCDO1-QUEN-VUNG-CHO', [(STATUS, "g('diff', '--name-only', '--', ...KHUNG)", 1)], r'✗ T4 '),
  ('VS-TOCDO1-QUEN-CAY-LAM-VIEC', [(STATUS, "g('diff', '--cached', '--name-only', '--', ...KHUNG)", 1)], r'✗ T5 '),
  ('VS-TOCDO1-THEO-CAU-HINH', [("'--porcelain', '--untracked-files=all',", "'--porcelain',", 1)], r'✗ T6 '),
  ('VS-TOCDO1-QUEN-GITHUB', [("const KHUNG = ['tu_chay', '.claude', '.github'];", "const KHUNG = ['tu_chay', '.claude'];", 1)], r'✗ T3c'),
  ('VS-TOCDO1-BO-DAYDU', [("  if (DAY_DU) return '--day-du';\n", "", 1)], r'✗ T7 '),
  ('VS-TOCDO1-KHONG-ORIGIN-BO-QUA', [("if (mb.status !== 0) return 'không xác định được gốc chung với origin/main';",
                                     "if (mb.status !== 0) return null;", 1)], r'✗ T8 '),
  ('VS-TOCDO1-SO-THANG-ORIGIN', [("g('diff', '--name-only', mb.stdout.trim(), 'HEAD',", "g('diff', '--name-only', 'origin/main', 'HEAD',", 1)], r'✗ T10'),
]


def chay_bai(p):  # chạy bài thử trên bản sao p → (mã thoát, đầu ra đã bỏ mã màu)
  r = subprocess.run(['node', 'cong_cu/thu_TOCDO1.js', '--kiem', p], cwd=GOC, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def chay1(db):
  ten, cap, bat = db
  tam = tempfile.mkdtemp(prefix='tocdo1_db_')
  try:
    p = os.path.join(tam, KIEM)
    shutil.copyfile(os.path.join(GOC, KIEM), p)
    s = open(p, encoding='utf-8').read()
    for cu, moi, n in cap:
      if s.count(cu) != n:
        return ten, False, f'chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
      s = s.replace(cu, moi)
    open(p, 'w', encoding='utf-8').write(s)
    ma, ra = chay_bai(p)
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    nem = [l.strip() for l in ra.splitlines() if 'ném' in l]
    if nem: return ten, False, 'bài thử NÉM (không phải đột biến bị bắt): ' + nem[0][:140]
    return ten, ma != 0 and bool(trung), (trung[0][:160] if trung else f'thoát {ma}, KHÔNG thấy /{bat}/ · ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def doi_chung():  # bản sao CHƯA đột biến phải xanh — nếu không, mọi kết quả dưới đều vô nghĩa
  tam = tempfile.mkdtemp(prefix='tocdo1_dc_')
  try:
    p = os.path.join(tam, KIEM)
    shutil.copyfile(os.path.join(GOC, KIEM), p)
    ma, ra = chay_bai(p)
    tong = [l for l in ra.splitlines() if l.startswith('thu_TOCDO1:')]
    return ma == 0, (tong[0] if tong else ra.strip().splitlines()[-1] if ra.strip() else f'thoát {ma}, không in gì')
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  xanh, chi = doi_chung()
  print(('  ✓ ' if xanh else '  ✗ ') + f'đối chứng (bản sao chưa đột biến phải xanh): {chi}')
  if not xanh:
    print('\n  DỪNG — bài thử đỏ trên bản chưa đột biến, không chạy đột biến (K3)')
    sys.exit(1)
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  hong = 0
  for db in chon:
    ten, dat, chi = chay1(db)
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(chon) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(chon)})')
  sys.exit(1 if hong else 0)
