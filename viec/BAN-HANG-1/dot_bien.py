#!/usr/bin/env python3
"""BAN-HANG-1 — đột biến cho MỖI chỗ vá máy chủ: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/BAN-HANG-1/dot_bien.py [tên...]

Khuôn viec/SO-LUONG-1/dot_bien.py: chép server/ ra thư mục tạm (bản CHÉP THẬT, chỉ node_modules nối symlink và chỉ ĐỌC — kiểm realpath, K5),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy cong_cu/thu_P26c.js --may-chu
<bản sao>. Đạt = đầu ra có dòng khớp mẫu `bat` (đúng ca phải bắt) VÀ thoát ≠ 0; bài SẬP (ném trước khi tới ca) KHÔNG tính là bắt.
ĐỐI CHỨNG trước: bản sao CHƯA đột biến phải 0 hỏng — bài đang sập thì mọi đột biến "bị bắt" oan. Không đụng server/ thật, data/, Turso.

Chỗ vá A1 (client/src/pages/Sales.jsx handleClearCustomer) KHÔNG có đột biến: bài chạy thật không chạy React — ghi CHƯA KIỂM.
`VS-BANHANG1-THE-SDT-THO` dựng lại `VS-SOLUONG1-THE-SDT-THO` (viec/SO-LUONG-1/dot_bien.py:23 neo nguyên dòng cổng cũ — sau A2 "không áp được",
chủ quán chốt 15.10 không sửa file cũ).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O = 'routes/orders.js'
A = 'routes/auth.js'
THE_CONG = "    if (membership_buy && !(membership_buy.tier_id && normalizePhone(customer_phone))) {"
HAN_DN = "{ expiresIn: process.env.JWT_EXPIRES_IN || '30d' }"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
DOT_BIEN = [
  # ── A2: cổng thẻ đầu route (orders.js) ──
  ('BV-BANHANG1-THE-CONG', [(O, THE_CONG, "    if (false) {", 1)], r'✗ T1a'),
  ('VS-BANHANG1-THE-CONG-CU', [(O, THE_CONG, "    if (membership_buy && membership_buy.tier_id && !normalizePhone(customer_phone)) {", 1)], r'✗ T1a'),
  # kiểm SĐT THÔ: " " truthy lọt cổng, khối ghi thẻ (:1068) đòi `phone` chuẩn hoá → thu tiền thẻ mà không ghi thẻ
  ('VS-BANHANG1-THE-SDT-THO', [(O, THE_CONG, "    if (membership_buy && !(membership_buy.tier_id && customer_phone)) {", 1)], r'✗ S4c'),
  # K5 siết quá tay: đòi có món → mua thẻ riêng (items: [], kich_ban KB22/KB32) bị chặn oan. `items.length` nằm TRONG !(…); `items` mặc định [] (:150)
  ('VS-BANHANG1-THE-SIET-DOI-MON', [(O, THE_CONG, "    if (membership_buy && !(membership_buy.tier_id && normalizePhone(customer_phone) && items.length)) {", 1)], r'✗ T2a'),
  # K5: màn hình gửi `membership_buy: null` khi không thẻ (Sales.jsx:751) → `null.tier_id` ném TypeError → 5xx, T2b đỏ
  ('VS-BANHANG1-THE-NULL-CHAN', [(O, THE_CONG, "    if (('membership_buy' in req.body) && !(membership_buy.tier_id && normalizePhone(customer_phone))) {", 1)], r'✗ T2b'),
  # ── A3: hạn đăng nhập mặc định (auth.js) ──
  ('BV-BANHANG1-HAN-DN-8H', [(A, HAN_DN, "{ expiresIn: process.env.JWT_EXPIRES_IN || '8h' }", 1)], r'✗ T3a'),
  ('VS-BANHANG1-HAN-DN-BO-BIEN', [(A, HAN_DN, "{ expiresIn: '30d' }", 1)], r'✗ T3b'),
]

BAI = 'cong_cu/thu_P26c.js'


def ap(thu_muc, cap):
  for f, cu, moi, n in cap:
    p = os.path.join(thu_muc, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tempfile.gettempdir())):
      return f'{f}: đích {os.path.realpath(p)} không nằm trong thư mục tạm — KHÔNG sửa (K5)'
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n:
      return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return ''


def ban_sao(tam):  # chép server/ thật ra thư mục tạm, node_modules chỉ nối symlink
  thu = os.path.join(tam, 'server')
  shutil.copytree(os.path.join(GOC, 'server'), thu)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
  return thu


def chay_bai(thu):  # → (mã thoát, đầu ra đã bỏ mã màu)
  r = subprocess.run(['node', BAI, '--may-chu', thu], cwd=GOC, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def chay1(db):
  ten, cap, bat = db
  tam = tempfile.mkdtemp(prefix='banhang1_db_')
  try:
    thu = ban_sao(tam)
    loi = ap(thu, cap)
    if loi: return ten, False, loi
    ma, ra = chay_bai(thu)
    sap = [l.strip() for l in ra.splitlines() if 'Bài thử sập' in l]
    if sap: return ten, False, 'bài thử SẬP (không phải đột biến bị bắt): ' + sap[0][:140]
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    return ten, ma != 0 and bool(trung), (trung[0][:160] if trung else f'thoát {ma}, KHÔNG thấy /{bat}/ · ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def doi_chung():  # bản sao CHƯA đột biến phải xanh — nếu không, mọi kết quả dưới đều vô nghĩa
  tam = tempfile.mkdtemp(prefix='banhang1_dc_')
  try:
    ma, ra = chay_bai(ban_sao(tam))
    tong = [l.strip() for l in ra.splitlines() if 'đạt · ' in l]
    return ma == 0, f'{BAI}: ' + (tong[-1] if tong else (ra.strip().splitlines() or [f'thoát {ma}, không in gì'])[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  xanh, chi = doi_chung()
  print(('  ✓ ' if xanh else '  ✗ ') + f'đối chứng (bản sao chưa đột biến phải xanh): {chi}')
  if not xanh:
    print('\n  DỪNG — bài thử đỏ trên bản chưa đột biến, không chạy đột biến (K3)')
    sys.exit(1)
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(chay1, chon))
  hong = 0
  for ten, dat, chi in kq:
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(kq) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(kq)})')
  sys.exit(1 if hong else 0)
