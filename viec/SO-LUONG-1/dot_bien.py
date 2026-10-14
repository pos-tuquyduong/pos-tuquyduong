#!/usr/bin/env python3
"""SO-LUONG-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/SO-LUONG-1/dot_bien.py [tên...]

Khuôn viec/GOI-2/dot_bien.py: chép server/ ra thư mục tạm, thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG,
không bao giờ đếm là đạt, K3), chạy bài thử trên bản sao. Đạt = đầu ra có dòng khớp mẫu `bat` (đúng ca phải bắt) VÀ thoát ≠ 0.
ĐỐI CHỨNG trước (khuôn TOC-DO-1): bản sao CHƯA đột biến phải 0 hỏng với cả hai bài — bài đang sập thì mọi đột biến "bị bắt" oan.
Không đụng server/ thật, data/, Turso. Bản sao là bản CHÉP THẬT; chỉ node_modules nối symlink và chỉ ĐỌC (công cụ kiểm realpath, K5).

Q1 (chủ quán chốt 14.10 = b): hai đột biến GOI-1 `BV-GOI1-SL-AM`, `VS-GOI1-SL-AM-CHI-0` LẠC vì dòng neo gom về một phép — dựng lại ở đây
(`…-THU-GOI1`), bắt bằng chính cong_cu/thu_GOI1.js A2j.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O = 'routes/orders.js'
HAM = "const soNguyenDuong = (x) => Number.isInteger(Number(x)) && Number(x) >= 1;"
MON = "      if (!soNguyenDuong(sl)) {"
MA = 'code: item.from_package ? "GOI_SL_KHONG_HOP_LE" : "SL_KHONG_HOP_LE"'
GOI_SL = "    if (package_buy && !soNguyenDuong(pkgQty)) {"
GOI_SO = "const pkgQty = Number(package_buy?.pkg_qty ?? 1);"
GOI_TT = "    if (package_buy && !(package_buy.package_id && customer_phone)) {"

# (tên, chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
#   chạy: 'p26c' = node cong_cu/thu_P26c.js --may-chu <bản sao server> · 'thu' = node cong_cu/thu_GOI1.js --may-chu <bản sao server>
DOT_BIEN = [
  # ── hàm kiểm chung ──
  ('VS-SOLUONG1-BO-NGUYEN', 'p26c', [(O, HAM, "const soNguyenDuong = (x) => Number(x) >= 1;", 1)], r'✗ S1d'),
  # ── phép món (orders.js, vòng món) ──
  ('BV-SOLUONG1-MON', 'p26c', [(O, MON, "      if (false) {", 1)], r'✗ S1c'),
  ('VS-SOLUONG1-MON-CHI-TU-GOI', 'p26c', [(O, MON, "      if (item.from_package && !soNguyenDuong(sl)) {", 1)], r'✗ S1c'),
  ('VS-SOLUONG1-MON-MOT-MA', 'p26c', [(O, MA, 'code: "SL_KHONG_HOP_LE"', 1)], r'✗ S3'),
  # K5: kiểm trên giá trị THÔ → chuỗi "2" bị chặn oan
  ('VS-SOLUONG1-MON-SO-THO', 'p26c', [(O, MON, "      if (!Number.isInteger(item.quantity)) {", 1)], r'✗ S1h'),
  # GOI-1 dựng lại (Q1 = b): bỏ phép / chỉ chặn 0 cho món lấy từ gói → thu_GOI1 A2j bắt
  ('BV-SOLUONG1-MON-THU-GOI1', 'thu', [(O, MON, "      if (false) {", 1)], r'✗ A2j'),
  ('VS-SOLUONG1-MON-CHI-0-THU-GOI1', 'thu', [(O, MON, "      if (item.from_package && sl === 0) {", 1)], r'✗ A2j'),
  # ── phép số gói (đầu route) ──
  ('BV-SOLUONG1-GOI', 'p26c', [(O, GOI_SL, "    if (false) {", 1)], r'✗ S2b'),
  ('VS-SOLUONG1-GOI-HOAC-1', 'p26c', [(O, GOI_SO, "const pkgQty = Number(package_buy?.pkg_qty || 1);", 1)], r'✗ S2a'),
  ('VS-SOLUONG1-GOI-LAM-TRON', 'p26c', [(O, GOI_SO, "const pkgQty = Math.round(Number(package_buy?.pkg_qty ?? 1));", 1)], r'✗ S2d'),
  # K5: thiếu pkg_qty phải vẫn là 1 gói; 2 gói phải vẫn mua được
  ('VS-SOLUONG1-GOI-THIEU-0', 'p26c', [(O, GOI_SO, "const pkgQty = Number(package_buy?.pkg_qty ?? 0);", 1)], r'✗ S2e'),
  ('VS-SOLUONG1-GOI-CHI-1', 'p26c', [(O, GOI_SL, "    if (package_buy && pkgQty !== 1) {", 1)], r'✗ S2f'),
  # ── phép mua gói đủ mã gói + SĐT (hai phát hiện, chủ quán chốt vá 14.10) ──
  ('BV-SOLUONG1-GOI-THIEU', 'p26c', [(O, GOI_TT, "    if (false) {", 1)], r'✗ S2g'),
  ('VS-SOLUONG1-GOI-THIEU-CHI-MA', 'p26c', [(O, GOI_TT, "    if (package_buy && !package_buy.package_id) {", 1)], r'✗ S2h'),
  # K5: siết quá tay — đòi thêm `total_qty` (trường máy chủ không dùng, P26c A6) → mua gói đủ thông tin bị chặn oan. (Mẫu đầu đòi `items.length`
  # làm helper mua gói của bài sập ở [A1] trước khi tới S2e → "ném", không tính là bắt.)
  ('VS-SOLUONG1-GOI-THIEU-SIET', 'p26c', [(O, GOI_TT, "    if (package_buy && !(package_buy.package_id && customer_phone && package_buy.total_qty)) {", 1)], r'✗ S2e'),
]

BAI = { 'p26c': 'cong_cu/thu_P26c.js', 'thu': 'cong_cu/thu_GOI1.js' }


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


def chay_bai(cach, thu):  # → (mã thoát, đầu ra đã bỏ mã màu)
  r = subprocess.run(['node', BAI[cach], '--may-chu', thu], cwd=GOC, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def chay1(db):
  ten, cach, cap, bat = db
  tam = tempfile.mkdtemp(prefix='soluong1_db_')
  try:
    thu = ban_sao(tam)
    loi = ap(thu, cap)
    if loi: return ten, False, loi
    ma, ra = chay_bai(cach, thu)
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    return ten, ma != 0 and bool(trung), (trung[0][:160] if trung else f'thoát {ma}, KHÔNG thấy /{bat}/ · ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def doi_chung(cach):  # bản sao CHƯA đột biến phải xanh — nếu không, mọi kết quả dưới đều vô nghĩa
  tam = tempfile.mkdtemp(prefix='soluong1_dc_')
  try:
    ma, ra = chay_bai(cach, ban_sao(tam))
    tong = [l.strip() for l in ra.splitlines() if 'đạt · ' in l]
    return ma == 0, f'{BAI[cach]}: ' + (tong[-1] if tong else (ra.strip().splitlines() or [f'thoát {ma}, không in gì'])[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  for cach in sorted({d[1] for d in chon}):
    xanh, chi = doi_chung(cach)
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
