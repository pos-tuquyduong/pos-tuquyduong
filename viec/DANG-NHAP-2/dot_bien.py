#!/usr/bin/env python3
"""DANG-NHAP-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/DANG-NHAP-2/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/DANG-NHAP-2/dot_bien.py --liet-ke
    python3 viec/DANG-NHAP-2/dot_bien.py --help

Khuôn viec/HUY-1/dot_bien.py: chép server/ + cong_cu/ + hai file client + bộ kiểm ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy cong_cu/thu_DANGNHAP2.js TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AU, GH = 'server/routes/auth.js', 'server/utils/gioiHanDangNhap.js'
LG, AP, KT = 'client/src/pages/Login.jsx', 'client/src/utils/api.js', 'kiem_tra_truoc_khi_giao.js'
BAI = 'thu_DANGNHAP2.js'
LUOT = 'const luot = giuLuot(req.ip, username);'
SO_BAM = 'await bcrypt.compare(String(password), user ? String(user.password) : BAM_GIA)'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── route: giữ lượt, câu chung, băm giả ──
  ('BV-GIU-LUOT', [(AU, LUOT, 'const luot = { chan: false };', 1)], r'✗ A1b '),
  ('VS-GIU-SAU-SO', [(AU, LUOT, 'const luot = { chan: false };', 1),
                     (AU, 'if (!user || !validPassword) {', "if (!user || !validPassword) {\n      const l2 = giuLuot(req.ip, username);\n      if (l2.chan) return res.status(429).json({ error: 'Gõ sai quá nhiều lần — thử lại sau ' + l2.phut + ' phút', code: 'QUA_NHIEU_LAN' });", 1)], r'✗ D2 '),
  ('BV-BAM-GIA', [(AU, SO_BAM, '(user ? await bcrypt.compare(String(password), String(user.password)) : false)', 1)], r'✗ E5 '),
  ('VS-CAU-KHOA-RIENG', [(AU, 'if (!user || !validPassword) {', 'if (!user || (!validPassword && user.is_active)) {', 1)], r'✗ E3 '),
  ('VS-KHOA-DUNG-CHUNG', [(AU, "'Tài khoản đã bị vô hiệu hóa'", "'Tên đăng nhập hoặc mật khẩu không đúng'", 1)], r'✗ E6 '),
  ('VS-IP-GIA', [(AU, LUOT, "const luot = giuLuot(String(req.headers['x-forwarded-for']).split(',')[0].trim(), username);", 1)], r'✗ A8 '),
  ('VS-MA-PHIEN-CHET', [(AU, "code: 'QUA_NHIEU_LAN'", "code: 'TOKEN_EXPIRED'", 1)], r'✗ (A1b|G5) '),
  ('BV-XOA-DEM-DUNG', [(AU, 'dangNhapDung(req.ip, username);', 'void dangNhapDung;', 1)], r'✗ A5b '),
  # ── hàm đếm ──
  ('VS-5-THANH-6', [(GH, 'const SAI_TOI_DA_CAP = 5;', 'const SAI_TOI_DA_CAP = 6;', 1)], r'✗ A1b '),
  ('VS-5-THANH-4', [(GH, 'const SAI_TOI_DA_CAP = 5;', 'const SAI_TOI_DA_CAP = 4;', 1)], r'✗ A7 '),
  ('VS-20-THANH-21', [(GH, 'const SAI_TOI_DA_IP = 20;', 'const SAI_TOI_DA_IP = 21;', 1)], r'✗ C2 '),
  ('BV-DEM-IP', [(GH, '  tang(theoIp, ip, now);\n', '', 1)], r'✗ C2 '),
  ('VS-KHOA-THEO-TEN', [(GH, 'const khoaCap = (ip, ten) => `${ip}|${ten}`;', 'const khoaCap = (ip, ten) => `${ten}`;', 1)], r'✗ B2 '),
  ('BV-HOAN-IP', [(GH, '  if (i && --i.dem <= 0) theoIp.delete(ip);', '  void i;', 1)], r'✗ C5 '),
  ('VS-LAM-TRON-XUONG', [(GH, 'Math.ceil(Math.max(', 'Math.floor(Math.max(', 1)], r'✗ A3 '),
  ('VS-TEN-TRIM', [(GH, '.trim().toLowerCase()', '.toLowerCase()', 1)], r'✗ A6 '),
  ('VS-TEN-HOA-THUONG', [(GH, '.trim().toLowerCase()', '.trim()', 1)], r'✗ A6 '),
  ('BV-DON-QUA-HAN', [(GH, '  don(cap, now);\n  don(theoIp, now);\n', '', 1)], r'✗ (A4|F2) '),
  ('BV-TRAN-MUC', [(GH, '  if (map.size >= TRAN_MUC) map.delete(map.keys().next().value);\n', '', 1)], r'✗ F1 '),
  # ── giao diện + nối bộ kiểm ──
  ('VS-XOA-O-GO', [(LG, 'setError(err.message || ', "setPassword(''); setError(err.message || ", 1)], r'✗ G2 '),
  ('VS-429-PHIEN-CHET', [(AP, "  'USER_INACTIVE'\n];", "  'USER_INACTIVE',\n  'QUA_NHIEU_LAN'\n];", 1)], r'✗ G3 '),
  ('VS-429-DA-VE-LOGIN', [(AP, 'return status === 401 && !!code &&', 'return (status === 401 || status === 429) && !!code &&', 1)], r'✗ G4 '),
  ('BV-NOI-BO-KIEM', [(KT, "chayBaiThat('cong_cu/thu_DANGNHAP2.js');", '', 1)], r'✗ I1 '),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/ + file client + bộ kiểm ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_dangnhap2_')
  for d in ('server', 'cong_cu'):
    shutil.copytree(os.path.join(GOC, d), os.path.join(tmp, d), ignore=shutil.ignore_patterns('node_modules'))
  for tep in (LG, AP, KT):
    os.makedirs(os.path.dirname(os.path.join(tmp, tep)), exist_ok=True)
    shutil.copy(os.path.join(GOC, tep), os.path.join(tmp, tep))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n} — {goc[:50]!r}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', BAI)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:120]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    ma, ra = chay_bai(tmp)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, dong = doi_chung()
  print(f'ĐỐI CHỨNG {BAI} (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
