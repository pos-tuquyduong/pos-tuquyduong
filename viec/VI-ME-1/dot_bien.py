#!/usr/bin/env python3
"""VI-ME-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/VI-ME-1/dot_bien.py [tên...]           (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/VI-ME-1/dot_bien.py --liet-ke           (chỉ in danh sách)
    python3 viec/VI-ME-1/dot_bien.py --goc <sha> [bài]   (bài HIỆN TẠI trên server/ + client/src/ của commit sha;
                                                          bài = VIME1 (mặc định) | P26b | P26c | GOI1 | DIEMTHAT1 | HD1 | NAP1)
    python3 viec/VI-ME-1/dot_bien.py --help

Khuôn viec/UUDAI-1/dot_bien.py: chép server/ + client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi
(mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_VIME1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O, V = 'server/routes/orders.js', 'server/utils/viMe.js'
GOI = '      const sai = await kiemTraMe(phone, parent_phone);\n      if (sai) return res.status(sai.status).json(sai.body);\n'
DK = '    if (parent_phone || Number(parent_balance_amount) > 0) {\n'
SO = 'return kh && normalizePhone(kh.parent_phone) === me ? null : LOI_KHONG_PHAI_ME;'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── orders.js taoDon: một lời gọi kiemTraMe ──
  ('BV-1-bo-goi', [(O, GOI, '', 1)], r'✗ A1 '),
  ('VS-1-chi-khi-co-tien', [(O, DK, '    if (Number(parent_balance_amount) > 0) {\n', 1)], r'✗ B1 '),
  ('VS-4-bo-qua-chi-tinh', [(O, DK, '    if (!phien?.chiTinh && (parent_phone || Number(parent_balance_amount) > 0)) {\n', 1)], r'✗ B1 '),
  ('VS-7-chi-khi-co-sdt-me', [(O, DK, '    if (parent_phone) {\n', 1)], r'✗ A4 '),
  # ── viMe.js kiemTraMe ──
  ('VS-2-khong-chuan-hoa', [(V, SO, 'return kh && kh.parent_phone === sdtMe ? null : LOI_KHONG_PHAI_ME;', 1)], r'✗ A5 '),
  ('VS-3-chi-kiem-co-me', [(V, SO, 'return kh && kh.parent_phone ? null : LOI_KHONG_PHAI_ME;', 1)], r'✗ A1 '),
  ('VS-8-khong-chuan-hoa-csdl', [(V, SO, 'return kh && kh.parent_phone === me ? null : LOI_KHONG_PHAI_ME;', 1)], r'✗ A5c '),
  ('VS-5-khong-can-khach', [(V, SO, 'return !kh || normalizePhone(kh.parent_phone) === me ? null : LOI_KHONG_PHAI_ME;', 1)], r'✗ A3 '),
  ('VS-6-trong-me-cho-qua', [(V, '  const kh = phone && me && await', '  if (!me) return null;\n  const kh = phone && await', 1)], r'✗ A4 '),
]

BAI = {'VIME1': 'thu_VIME1.js', 'P26b': 'thu_P26b.js', 'P26c': 'thu_P26c.js', 'GOI1': 'thu_GOI1.js',
       'DIEMTHAT1': 'thu_DIEMTHAT1.js', 'HD1': 'thu_HD1.js', 'NAP1': 'thu_NAP1.js'}


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_vime1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def lenh(tmp, bai='VIME1'):
  f = os.path.join(GOC, 'cong_cu', BAI[bai])
  if bai == 'HD1':   # thu_HD1.js nhận --goc <gốc kho> (đọc <gốc>/server)
    return ['node', f, '--goc', tmp]
  return ['node', f, '--may-chu', os.path.join(tmp, 'server')]


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha, bai):
  """Bài HIỆN TẠI với server/ + client/src/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_vime1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'client/src', 'cong_cu/gia_lap'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))   # HD1 C0: qrcode-generator
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(re.sub(r'\x1b\[\d+m', '', l) for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l.lower()))
    print(f'GỐC {sha} · {BAI[bai]}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    i = sys.argv.index('--goc')
    chay_goc(sys.argv[i + 1], sys.argv[i + 2] if len(sys.argv) > i + 2 else 'VIME1'); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, dong = doi_chung()
  print(f'ĐỐI CHỨNG (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
