#!/usr/bin/env python3
"""UUDAI-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/UUDAI-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/UUDAI-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/UUDAI-1/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ + client/src/ của commit sha)
    python3 viec/UUDAI-1/dot_bien.py --help

Khuôn viec/DIEM-THAT-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy
`node cong_cu/thu_UUDAI1.js --may-chu <bản sao>/server` (bài đọc Settings.jsx / Sales.jsx ở <bản sao>/client/src/pages);
đột biến ghi bài 'gl' chạy `node cong_cu/gia_lap/chay.js --may-chu <bản sao>/server` (KB33 + bất biến I13).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2) hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
U, O, ST, DB = 'server/utils/uuDai.js', 'server/routes/orders.js', 'server/routes/settings.js', 'server/database.js'
SA, SE = 'client/src/pages/Sales.jsx', 'client/src/pages/Settings.jsx'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A–C: hàm tinhUuDai (server/utils/uuDai.js) ──
  ('VS-MA-TREN-GOC', [(U, '(coHang ? giamHang : 0)', '0', 1)], r'✗ B1 '),
  ('VS-BANG-CHON-MA', [(U, "chiMa > giamHang ? 'ma'", "chiMa >= giamHang ? 'ma'", 1)], r'✗ C3a '),
  ('VS-MOT-MON-GIA-GOC', [(U, 'coHang && giaHangDong[ma.mot_mon] != null ? giaHangDong[ma.mot_mon] : dong[ma.mot_mon].unit_price',
                           'dong[ma.mot_mon].unit_price', 1)], r'✗ B5 '),
  ('VS-CHON-MA-GIU-GIA-HANG', [(U, 'gia_hang: giam_hang > 0 ? giaHangDong : dong.map(() => null)', 'gia_hang: giaHangDong', 1)], r'✗ C1b '),
  ('VS-LUON-CA-HAI', [(U, "else if (dungChung) cach = 'ca_hai';", "else if (true) cach = 'ca_hai';", 1)], r'✗ C1a '),
  ('VS-MA-KHONG-LAM-TRON', [(U, 'g = Math.round(conLai * ma.gia_tri / 100);', 'g = conLai * ma.gia_tri / 100;', 1)], r'✗ A6 '),
  # ── orders.js: cài đặt theo loại, quà luôn dùng chung ──
  ('BV-CAI-DAT-DOC', [(O, 'dungChung = !!qua || (await queryOne("SELECT value FROM pos_settings WHERE key = ?", [khoa]))?.value !== "0";',
                       'dungChung = true;', 1)], r'✗ C1a '),
  ('VS-QUA-THEO-CAI-DAT', [(O, 'dungChung = !!qua || ', 'dungChung = ', 1)], r'✗ D1a '),
  ('VS-LOAI-MOT-MON-THEO-KIEU', [(O, 'const khoa = itemScopeTargetItem ? "uudai_chung_hang_item"', 'const khoa = false ? "uudai_chung_hang_item"', 1)],
   r'✗ C8 '),
  # ── orders.js: chọn hạng → mã không tiêu, không ghi ──
  ('VS-CHON-HANG-VAN-TIEU-MA', [(O, '      discountCodeId = null;\n      finalDiscountCode = null;', '      finalDiscountCode = null;', 1)], r'✗ C2b '),
  # vòng soát 2: giả lập KB33 + bất biến I13 (lượt mã = số đơn áp mã) chạy qua nhánh chọn hạng — bài 'gl' = cong_cu/gia_lap/chay.js
  ('VS-CHON-HANG-VAN-TIEU-MA-GL', [(O, '      discountCodeId = null;\n      finalDiscountCode = null;', '      finalDiscountCode = null;', 1)], r'✗ KB33 → ', 'gl'),
  ('VS-CHON-HANG-VAN-GHI-MA', [(O, '      finalDiscountCode = null;\n      finalDiscountType = null;', '      finalDiscountType = null;', 1)], r'✗ C2a '),
  ('VS-CHON-HANG-GIU-GIA-MA-BILL', [(O, '      finalDiscountValue = 0;\n      itemScopeTargetItem = null;', '      finalDiscountValue = 0;', 1)], r'✗ C7b '),
  # ── orders.js: tinh-thu ──
  ('VS-TINHTHU-GOI-SX', [(O, 'phien?.tinhThu ? { sufficient: true } : ', '', 1)], r'✗ F3 '),
  ('BV-TINHTHU-CHI-TINH', [(O, 'res, { chiTinh: true, tinhThu: true });', 'res, { tinhThu: true });', 1)], r'✗ F1 '),
  ('VS-TINHTHU-NHAN-TIEN', [(O, '"package_buy", "membership_buy"];', '"package_buy", "membership_buy", "payment_method", "balance_amount"];', 1)],
   r'✗ F1b '),
  # vòng soát 3: gỡ từng trường gói / thẻ khỏi danh sách trắng tinh-thu
  ('BV-TINHTHU-LAY-GOI', [(O, '"shipping_fee", "customer_package_id", "package_buy"', '"shipping_fee", "package_buy"', 1)], r'✗ K4a '),
  ('BV-TINHTHU-MUA-GOI', [(O, '"customer_package_id", "package_buy", "membership_buy"', '"customer_package_id", "membership_buy"', 1)], r'✗ K4b '),
  ('BV-TINHTHU-MUA-THE', [(O, '"package_buy", "membership_buy"];', '"package_buy"];', 1)], r'✗ K4c '),
  ('VS-SALES-KHOA-GIO-THEO-DOI-TUONG', [(SA, '}, [khoaGio, customer?.phone,', '}, [cart, customer?.phone,', 1)], r'✗ S10 '),
  ('VS-MA-LOI-IM', [(O, '        maLoi = { error: "Mã không tồn tại hoặc đã tắt", code: "MA_KHONG_TON_TAI" };\n', '', 1)], r'✗ F6 '),
  # ── settings.js / database.js ──
  ('BV-CAI-DAT-KIEM', [(ST, '    if (khoaSai) {', '    if (false) {', 1)], r'✗ E3 '),
  ('VS-CAI-DAT-NHAN-TRUE', [(ST, "!['0', '1'].includes(String(value))", "!['0', '1', 'true'].includes(String(value))", 1)], r'✗ E3 chủ gửi "true"'),
  ('BV-SEED', [(DB, "    await run(`INSERT OR IGNORE INTO pos_settings (key, value) VALUES (?, '1')`, [khoa]);\n", '', 1)], r'✗ E1 '),
  # ── giao diện ──
  ('BV-SETTINGS-QUA', [(SE, 'Quà đổi điểm: luôn dùng chung', 'Quà đổi điểm', 1)], r'✗ E5 '),
  ('BV-SALES-TONG', [(SA, 'const total = tinhThu ? tinhThu.total : ', 'const total = ', 1)], r'✗ S3 '),
  ('VS-SALES-THU-KHI-CHUA-TINH', [(SA, 'if (discountCodeValid?.valid && !tinhThu) {', 'if (false) {', 1)], r'✗ S4 '),
  ('VS-SALES-GHI-DE-LOI', [(SA, 'setError(tinhThuLoi || ', 'setError(', 1)], r'✗ S6 '),
  ('VS-SALES-KHONG-HOI-LAI', [(SA, ', khoaFlash, khoaHang]);', ']);', 1)], r'✗ S7 '),
  ('VS-SALES-XOA-KHI-LAM-MOI', [(SA, ', khoaFlash, khoaHang]);', ', flashState, membershipInfo]);', 1)], r'✗ S7 '),
  ('BV-SALES-MA-LOI', [(SA, '{tinhThu?.ma_loi && (', '{false && (', 1)], r'✗ S9 '),
  ('VS-MA-LOI-KHONG-CODE', [(O, 'ma_loi_code: maLoi?.code || null,', 'ma_loi_code: null,', 1)], r'✗ F6 '),
  ('VS-SETTINGS-PKGAPI', [(SE, "await api.put('/settings', { settings: uuDaiChung });", "await pkgApi('PUT', '/api/pos/settings', { settings: uuDaiChung });", 1)], r'✗ S8 '),
  # vòng sửa 4 (chat soát thay): ca GIÁ TRỊ cho giá hạng từng món, mặc định khi thiếu khoá, giá mã 1 món trên bill
  ('BV-GIA-HANG-TUNG-MON', [(O, '    orderItems.forEach((it, i) => { if (uuDai.gia_hang[i] != null) it.tier_unit_price = uuDai.gia_hang[i]; });\n', '', 1)],
   r'✗ F8 '),
  ('VS-MAC-DINH-THIEU-KHOA', [(O, '[khoa]))?.value !== "0";', '[khoa]))?.value === "1";', 1)], r'✗ E6 '),
  ('VS-GIA-MA-MOT-MON-GOC', [(O, '(itemScopeTargetItem.tier_unit_price ?? itemScopeTargetItem.unit_price)', 'itemScopeTargetItem.unit_price', 1)],
   r'✗ B5b '),
  ('VS-SALES-HAI-THAN',[(SA, '        discount_code: don.discount_code,\n', '        discount_code: discountCodeValid?.code,\n', 1)], r'✗ S2 '),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_uudai1_')
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


def lenh(tmp, bai='ud'):
  if bai == 'gl':
    return ['node', os.path.join(GOC, 'cong_cu', 'gia_lap', 'chay.js'), '--may-chu', os.path.join(tmp, 'server')]
  return ['node', os.path.join(GOC, 'cong_cu', 'thu_UUDAI1.js'), '--may-chu', os.path.join(tmp, 'server')]


def chay(ten, thay, mau, bai='ud'):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if r.returncode == 2 or 'BÀI SẬP' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
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
    g = subprocess.run(lenh(tmp, 'gl'), cwd=GOC, capture_output=True, text=True, timeout=300)
    dong_gl = ((g.stdout or '') + (g.stderr or '')).strip().splitlines()[-1:] or ['']
    ok = r.returncode == 0 and m is not None and m.group(2) == '0' and g.returncode == 0
    return ok, (m.group(0) if m else ra[-200:]) + ' · gl: ' + dong_gl[0][:120]
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: bài HIỆN TẠI với server/ + client/src/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_uudai1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'SẬP' in l))
    print(f'GỐC {sha}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    chay_goc(sys.argv[sys.argv.index('--goc') + 1]); sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
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
