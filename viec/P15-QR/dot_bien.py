#!/usr/bin/env python3
"""P15-QR — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/P15-QR/dot_bien.py              # đối chứng + mọi đột biến
    python3 viec/P15-QR/dot_bien.py <tên> ...    # đối chứng + từng tên

Khuôn viec/KH-API-1/dot_bien.py: chép THẬT server/ ra thư mục tạm (node_modules nối symlink, chỉ đọc) + chép cong_cu/thu_P15QR.js vào
<tạm>/cong_cu/ (bài tự lấy gốc kho = thư mục cha của nó; ca D4 chạy <tạm>/server/index.js), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần
ghi sẵn — không khớp là HỎNG, K3), chạy bài trên bản sao. BẮT = thoát ≠ 0 VÀ có dòng tổng "N đạt · M hỏng" (bài sập không phải BẮT) VÀ có
dòng ✗ khớp mẫu. ĐỐI CHỨNG (bản sao không đột biến) phải XANH — không thì mọi kết quả vô nghĩa, dừng. Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_P15QR.js'

HP, CU, KI, IX = 'server/utils/helpers.js', 'server/routes/customers.js', 'server/routes/kh/index.js', 'server/index.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu dòng ✗ phải thấy)
DOT_BIEN = [
  # ── A: sinh mã ──
  ('BV-A-qr-sdt', [(HP, "function generateQRCode() {\n", "function generateQRCode(phone) {\n  return `QR-${phone}`;\n", 1)], r"✗ A1 POST /customers"),
  ('VS-A-math-random', [(HP, "crypto.randomBytes(12)", "Array.from({ length: 12 }, () => Math.floor(Math.random() * 256))", 1)], r"✗ A7 POST /:"),
  ('VS-A-ngan-8', [(HP, "crypto.randomBytes(12)", "crypto.randomBytes(8)", 1)], r"✗ A4 2000 lần"),
  ('BV-A5-khong-kiem-trung', [(HP, "if (!(await queryOne('SELECT 1 FROM pos_customers WHERE qr_code = ?', [ma]))) return ma;", "return ma;", 1)],
   r"✗ A5 trùng 2 lần"),
  ('VS-A5-thu-6-lan', [(HP, "const QR_THU_TOI_DA = 5;", "const QR_THU_TOI_DA = 6;", 1)], r"✗ A5 luôn trùng"),
  # ── A2 / A3: người nhận ──
  ('VS-A2-con-qr-sdt', [(CU, "const childQR = childPhone ? await sinhQrKhongTrung(queryOne) : null;", "const childQR = childPhone ? 'QR-' + childPhone : null;", 1)],
   r"✗ A2 POST / kèm người nhận"),
  ('VS-A3-children-qr-sdt', [(CU, "const qrCode = childPhone ? await sinhQrKhongTrung(queryOne) : null;", "const qrCode = childPhone ? 'QR-' + childPhone : null;", 1)],
   r"✗ A3 POST /:id/children"),
  # ── A7: mỗi chỗ gọi đi qua vòng sinh lại ──
  ('VS-A7-post-goi-generate', [(CU, "const qrCode = await sinhQrKhongTrung(queryOne);", "const qrCode = require('../utils/helpers').generateQRCode();", 1)],
   r"✗ A7 POST /:"),
  ('VS-A7-con-goi-generate', [(CU, "const childQR = childPhone ? await sinhQrKhongTrung(queryOne) : null;",
                               "const childQR = childPhone ? require('../utils/helpers').generateQRCode() : null;", 1)], r"✗ A7 người nhận trong POST /"),
  ('VS-A7-children-goi-generate', [(CU, "const qrCode = childPhone ? await sinhQrKhongTrung(queryOne) : null;",
                                    "const qrCode = childPhone ? require('../utils/helpers').generateQRCode() : null;", 1)], r"✗ A7 POST /:id/children"),
  ('VS-A7-toi-goi-generate', [(KI, "[await sinhQrKhongTrung(queryOne), getNow()", "[require('../../utils/helpers').generateQRCode(), getNow()", 1)],
   r"✗ A7 /kh/toi"),
  # ── B: mã cũ bị từ chối, /toi đổi mã ──
  ('BV-B1-nhan-qr-cu', [(CU, "const customer = code.startsWith(QR_TIEN_TO)", "const customer = true", 1)], r"✗ B1 /qr/QR-<sđt>"),
  ('BV-B2-toi-khong-doi', [(KI, "if (!String(qr || '').startsWith(QR_TIEN_TO)) {", "if (false) {", 1)],
   r"✗ B2 /toi"),
  ('VS-F2-toi-luon-sinh-moi', [(KI, "if (!String(qr || '').startsWith(QR_TIEN_TO)) {", "if (true) {", 1)],
   r"✗ F2 khách đã có mã mới"),
  # ── D: qr chỉ ở /toi, theo token ──
  ('BV-D1-toi-khong-qr', [(KI, "khach: { ...hoSo(req.khach), qr }", "khach: hoSo(req.khach)", 1)], r"✗ D1 cặp A/B"),
  ('VS-D1-qr-theo-tham-so', [(KI, "SELECT qr_code FROM pos_customers WHERE id = ?', [req.khach.id]", "SELECT qr_code FROM pos_customers WHERE id = ?', [req.query.id || req.khach.id]", 1)], r"✗ D1 cặp A/B"),
  ('VS-D2-qr-vao-hoSo', [(KI, "ngay_tao: kh.created_at });", "ngay_tao: kh.created_at, qr: kh.qr_code || null });", 1)], r"✗ D2 qr"),
  # ── E: quyền + mã lỗi ──
  ('BV-E1-bo-authenticate', [(CU, "router.get('/qr/:code', authenticate, async", "router.get('/qr/:code', async", 1)], r"✗ E1 không token"),
  ('BV-E1-bo-code', [(CU, "error: 'Không tìm thấy khách hàng', code: 'QR_KHONG_CO' }", "error: 'Không tìm thấy khách hàng' }", 1)], r"✗ E1 token quầy \+ mã TQD- bịa"),
  # ── D4: bộ ghi nhật ký index.js ──
  ('BV-D4-log-ghi-ma', [(IX, r"${req.path.replace(/(\/customers\/qr\/).*/i, '$1***')}", "${req.path}", 1)], r"✗ D4 nhật ký index.js"),
  ('VS-D4-log-phan-biet-hoa', [(IX, r"/(\/customers\/qr\/).*/i, '$1***'", r"/(\/customers\/qr\/).*/, '$1***'", 1)], r"✗ D4 nhật ký index.js"),
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
  tam = tempfile.mkdtemp(prefix='p15qr_db_')
  try:
    shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server'))
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
  with ThreadPoolExecutor(max_workers=6) as ex:
    kq = list(ex.map(chay1, la))
  hong = 0
  for ten, dat, chi in kq:
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(kq) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(kq)})')
  sys.exit(1 if hong else 0)
