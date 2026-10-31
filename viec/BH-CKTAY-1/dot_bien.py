#!/usr/bin/env python3
"""BH-CKTAY-1 — đột biến cho MỖI chỗ vá ở Sales.jsx: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/BH-CKTAY-1/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/BH-CKTAY-1/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/BH-CKTAY-1/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)
    python3 viec/BH-CKTAY-1/dot_bien.py --bai-cu <sha> <bài...> (bản bài của commit sha chạy trên code HIỆN TẠI)

Khuôn viec/KHACH-CK-1/dot_bien.py: chép server/, client/src/, cong_cu/, kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG), chạy bài trên bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SA = 'client/src/pages/Sales.jsx'
BAI = 'thu_BHCKTAY1.js'
CHEP = ['server', 'client/src', 'cong_cu', 'kiem_tra_truoc_khi_giao.js']

NHANH = "    discountAmount = discountCodeValid.discount_amount || 0;\n  }\n"
TYPE = "discount_type: discountCodeValid?.valid ? discountCodeValid.discount_type : null,"
VALUE = "discount_value: discountCodeValid?.valid ? discountCodeValid.discount_value : 0,"
STATE = "  const [discountCode, setDiscountCode] = useState('');"
PHI = "              {/* Phí vận chuyển */}"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── ô nhập giảm tay ──
  ('BV-O-NHAP', [(SA, PHI, "              <input onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)} />\n" + PHI, 1)], r'✗ A1 ', BAI),
  # ── nhánh tính giảm tay ──
  ('BV-NHANH-GIAM-TAY', [(SA, NHANH, "    discountAmount = discountCodeValid.discount_amount || 0;\n  } else if (discount > 0) {\n    discountAmount = discount;\n  }\n", 1)], r'✗ A3 ', BAI),
  ('BV-NHANH-PHAN-TRAM', [(SA, NHANH, "    discountAmount = discountCodeValid.discount_amount || 0;\n  } else if (discountType === 'percent' && discountValue > 0) {\n    discountAmount = subtotal * discountValue / 100;\n  }\n", 1)], r'✗ A3 ', BAI),
  ('BV-STATE', [(SA, STATE, "  const [discountType, setDiscountType] = useState('percent');\n" + STATE, 1)], r'✗ A2 ', BAI),
  # ── thân đơn ──
  ('BV-THAN-LOAI', [(SA, TYPE, "discount_type: discountCodeValid?.valid ? discountCodeValid.discount_type : (discountValue > 0 ? discountType : null),", 1)], r'✗ B2 ', BAI),
  ('BV-THAN-MUC', [(SA, VALUE, "discount_value: discountCodeValid?.valid ? discountCodeValid.discount_value : discountValue,", 1)], r'✗ B2 ', BAI),
  ('VS-THAN-LOAI-UNDEFINED', [(SA, TYPE, "discount_type: discountCodeValid?.valid ? discountCodeValid.discount_type : undefined,", 1)], r'✗ B2 ', BAI),
  ('VS-THAN-GIAM-LA-SO-MAN', [(SA, "        discount: 0,\n", "        discount: discountAmount,\n", 1)], r'✗ B2 ', BAI),
  ('VS-THAN-MUC-HANG-SO', [(SA, VALUE, "discount_value: discountCodeValid?.valid ? discountCodeValid.discount_value : 10,", 1)], r'✗ B2 ', BAI),
  ('VS-THAN-MA-BI-CHAN', [(SA, VALUE, "discount_value: discountCodeValid?.valid ? 0 : 0,", 1)], r'✗ B3 ', BAI),
  ('VS-THAN-LOAI-MA-BI-CHAN', [(SA, TYPE, "discount_type: discountCodeValid?.valid ? null : null,", 1)], r'✗ B3 ', BAI),
  # ── số trên màn lấy từ máy chủ / mã ──
  ('VS-MAN-BO-MA', [(SA, NHANH, "    discountAmount = 0;\n  }\n", 1)], r'✗ A4 ', BAI),
  # ── bài cũ khoá ô này ──
  ('BV-F3A-THAN', [(SA, VALUE, "discount_value: discountCodeValid?.valid ? discountCodeValid.discount_value : discountValue,", 1)], r'✗ F3a ', 'thu_KHACHCK1.js'),
]


def lam_cay(tmp):
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))


def chep(nguon_sha, tmp, phan):
  """Đổ `phan` vào tmp: nguon_sha None = cây làm việc hiện tại (copytree), có sha = git archive commit đó."""
  if nguon_sha is None:
    for p in phan:
      a, b = os.path.join(GOC, p), os.path.join(tmp, p)
      os.makedirs(os.path.dirname(b), exist_ok=True)
      (shutil.copytree(a, b, ignore=shutil.ignore_patterns('node_modules')) if os.path.isdir(a) else shutil.copyfile(a, b))
  else:
    tar = subprocess.run(['git', 'archive', nguon_sha, *phan], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_bhcktay1_')
  chep(None, tmp, CHEP)
  lam_cay(tmp)
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp, bai):
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', bai)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, (r.stdout or '') + (r.stderr or '')


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if ma == 2 or 'BÀI SẬP' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai_ds):
  tmp, _ = ban_sao([])
  try:
    kq = []
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      dong = [l.strip() for l in ra.splitlines() if re.search(r'\d+ đạt · \d+ hỏng', l)]
      kq.append((bai, ma, dong[-1] if dong else ra.strip()[-160:]))
    return all(m == 0 for _, m, _ in kq), kq
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bang_chung(sha, bai_ds, bai_cu):
  """bai_cu False: bài hiện tại trên code của sha. True: bài của sha trên code hiện tại."""
  tmp = tempfile.mkdtemp(prefix='dotbien_bhcktay1_goc_')
  try:
    ma_nguon = [p for p in CHEP if p != 'cong_cu']
    chep(None if bai_cu else sha, tmp, ma_nguon)
    chep(sha if bai_cu else None, tmp, ['cong_cu'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} ({"bản bài " + sha + " trên code HIỆN TẠI" if bai_cu else "bài HIỆN TẠI trên code " + sha}):')
      print('\n'.join('  ' + l.strip() for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng', l) or 'SẬP' in l))
      if ma == 2: print('\n'.join('  ' + l.strip() for l in ra.strip().splitlines()[-4:]))   # bài sập: in lý do
      print(f'  thoát {ma}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  for co in ('--goc', '--bai-cu'):
    if co in sys.argv:
      i = sys.argv.index(co)
      bang_chung(sys.argv[i + 1], sys.argv[i + 2:], co == '--bai-cu'); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, kq_dc = doi_chung(sorted({d[3] for d in ds}))
  for bai, ma, dong in kq_dc: print(f'ĐỐI CHỨNG {bai}: thoát {ma} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
