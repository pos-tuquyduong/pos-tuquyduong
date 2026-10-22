#!/usr/bin/env python3
"""KH-UI-1 — đột biến cho khối KH_HOST trong server/index.js: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-UI-1/dot_bien.py              # đối chứng + mọi đột biến
    python3 viec/KH-UI-1/dot_bien.py <tên> ...    # đối chứng + từng tên

Khuôn viec/KH-API-1/dot_bien.py: chép THẬT server/, app_kh/, client/dist/ ra thư mục tạm (node_modules nối symlink, chỉ đọc) + chép
cong_cu/thu_KHUI1.js vào <tạm>/cong_cu/ (bài tự lấy gốc kho = thư mục cha của nó), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi
sẵn — không khớp là HỎNG, K3), chạy bài trên bản sao. BẮT = thoát ≠ 0 VÀ có dòng tổng "N đạt · M hỏng" (bài sập không phải BẮT) VÀ có
dòng ✗ khớp mẫu. ĐỐI CHỨNG (bản sao không đột biến) phải XANH — không thì mọi kết quả vô nghĩa, dừng.
Không đụng server/ thật, data/, Turso (bản sao có data/ riêng vì bài đặt REPL_ID → kho thử trong thư mục tạm).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_KHUI1.js'
IX = 'server/index.js'
DOC_HOST = "String(req.headers.host || '').split(':')[0].toLowerCase()"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu dòng ✗ phải thấy)
DOT_BIEN = [
  # ── G: chọn thư mục tĩnh theo Host ──
  ('BV-G-bo-file-tinh', [(IX, "app.use((req, res, next) => (laYeuCauAppKh(req) ? phucVuAppKh(req, res, next) : next()));", "app.use((req, res, next) => next());", 1)],
   r"✗ H2e .* ở Host App KH"),
  ('BV-G-bo-index-cho-duong-la', [(IX, "laYeuCauAppKh(req) ? res.sendFile(path.join(__dirname, '../app_kh/dist/index.html')) : next()", "next()", 1)],
   r"✗ H2b "),
  ('BV-G-bo-kiem-api', [(IX, "host === hostKh && !req.path.startsWith('/api/');", "host === hostKh;", 1)], r"✗ H2d /api/ lạ"),
  ('VS-G-moi-host-deu-app-kh', [(IX, "return !!hostKh && host === hostKh &&", "return !!hostKh &&", 1)], r"✗ H2 Host khác"),
  # ── G: so khớp Host đúng nghĩa ──
  ('VS-G-host-chua-chuoi', [(IX, "host === hostKh", "host.includes(hostKh)", 1)], r"✗ H2c Host có tiền tố"),
  ('VS-G-host-khong-bo-cong', [(IX, DOC_HOST, "String(req.headers.host || '').toLowerCase()", 1)], r"✗ H2c Host viết hoa"),
  ('VS-G-host-phan-biet-hoa', [(IX, DOC_HOST, "String(req.headers.host || '').split(':')[0]", 1)], r"✗ H2c Host viết hoa"),
  ('VS-G-tin-forwarded-host', [(IX, DOC_HOST, "req.hostname", 1)], r"✗ H2c X-Forwarded-Host"),
  ('VS-G-kh-host-khong-chu-thuong', [(IX, "(process.env.KH_HOST || '').trim().toLowerCase()", "(process.env.KH_HOST || '').trim()", 1)], r"✗ H2 Host đúng"),
  ('VS-G-kh-host-khong-trim', [(IX, "(process.env.KH_HOST || '').trim().toLowerCase()", "(process.env.KH_HOST || '').toLowerCase()", 1)], r"✗ H2 Host đúng"),
  # ── G: KH_HOST chưa đặt = hành vi cũ ──
  ('VS-G-host-rong-khop-rong', [(IX, "return !!hostKh && host === hostKh", "return host === hostKh", 1)], r"✗ H1 Host rỗng"),
]

TONG = re.compile(r'\d+ đạt · \d+ hỏng')


def ap(goc_tam, cap):
  for f, cu, moi, n in cap:
    p = os.path.join(goc_tam, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tempfile.gettempdir())):
      return f'{f}: đích {os.path.realpath(p)} không nằm trong thư mục tạm — KHÔNG sửa (K5)'
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n:
      return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return ''


def chay1(db):
  ten, cap, bat = db
  tam = tempfile.mkdtemp(prefix='khui1_db_')
  try:
    shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server'))
    shutil.copytree(os.path.join(GOC, 'app_kh'), os.path.join(tam, 'app_kh'))
    shutil.copytree(os.path.join(GOC, 'client', 'dist'), os.path.join(tam, 'client', 'dist'))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
    os.makedirs(os.path.join(tam, 'cong_cu'))
    shutil.copy(os.path.join(GOC, BAI), os.path.join(tam, BAI))
    loi = ap(tam, cap)
    if loi: return ten, False, loi
    r = subprocess.run(['node', BAI], cwd=tam, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)
    tong = TONG.search(ra)
    if cap == []:
      return ten, r.returncode == 0 and bool(tong) and ' 0 hỏng' in tong.group(0), tong.group(0) if tong else 'không in dòng tổng'
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    if not tong: return ten, False, f'bài SẬP (không in dòng tổng, thoát {r.returncode}) — sập không phải BẮT'
    return ten, r.returncode != 0 and bool(trung), (trung[0][:160] if trung else f'thoát {r.returncode}, KHÔNG thấy /{bat}/ · {tong.group(0)}')
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  ten_dk = 'ĐỐI-CHỨNG (không đột biến)'
  _, xanh, chi = chay1((ten_dk, [], None))
  print(('  ✓ ' if xanh else '  ✗ ') + f'{ten_dk}: {chi}')
  if not xanh:
    print('\n  Đối chứng KHÔNG xanh — kết quả đột biến vô nghĩa, dừng.')
    sys.exit(2)
  la = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  thieu = [t for t in sys.argv[1:] if t not in {d[0] for d in DOT_BIEN}]
  if thieu:
    print('  ✗ không có đột biến tên: ' + ', '.join(thieu))
    sys.exit(2)
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(chay1, la))
  hong = 0
  for ten, dat, chi in kq:
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(kq) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(kq)})')
  sys.exit(1 if hong else 0)
