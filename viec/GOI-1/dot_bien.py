#!/usr/bin/env python3
"""GOI-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/GOI-1/dot_bien.py [tên...]

Khuôn viec/P26c/dot_bien.py: chép server/ (hoặc client/src) ra thư mục tạm, thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn —
không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy cong_cu/thu_GOI1.js trên bản sao. Đạt = đầu ra có dòng khớp mẫu `bat`
(đúng ca phải bắt) VÀ thoát ≠ 0. Không đụng server/ thật, client/ thật, data/, Turso. Thư mục tạm xoá khi xong.
Bản sao là bản CHÉP THẬT; chỉ node_modules nối symlink và chỉ ĐỌC (K5: công cụ chép-rồi-sửa kiểm realpath).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# (tên, chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
#   chạy: 'thu' = node cong_cu/thu_GOI1.js --may-chu <bản sao server> · 'cli' = --client <bản sao client> (file tính từ client/)
O, P, G = 'routes/orders.js', 'routes/packages.js', 'utils/goiKhach.js'
SET, REP, CUS = 'src/pages/Settings.jsx', 'src/pages/Reports.jsx', 'src/pages/Customers.jsx'
DOT_BIEN = [
  # ── A1: tổng tự tính (máy chủ) ──
  ('BV-GOI1-TONG', 'thu', [(P, "    if (loai.tong) total_qty = loai.tong;\n    if (!luotHopLe", "    if (!luotHopLe", 1)], r'✗ A1a'),
  ('VS-GOI1-TONG-GUI', 'thu', [(P, "    if (loai.tong) total_qty = loai.tong;\n    if (!luotHopLe",
                                "    if (loai.tong && total_qty === undefined) total_qty = loai.tong;\n    if (!luotHopLe", 1)], r'✗ A1a'),
  ('BV-GOI1-TONG-PUT', 'thu', [(P, "      if (loai.tong) total_qty = loai.tong;\n", "", 1)], r'✗ A1b'),
  ('BV-GOI1-SL', 'thu', [(P, "  const sai = ds.find((i) => !luotHopLe(i.qty));", "  const sai = null;", 1)], r'✗ A1d'),
  ('VS-GOI1-SL-CHI-AM', 'thu', [(P, "  const sai = ds.find((i) => !luotHopLe(i.qty));", "  const sai = ds.find((i) => Number(i.qty) < 0);", 1)], r'✗ A1d loại tích mà SL 0'),
  # ── A3: giá 0 ──
  ('BV-GOI1-GIA', 'thu', [(P, "    if (!(Number(price) > 0)) return res.status(400).json(GIA_SAI);\n", "", 1)], r'✗ A3a thêm gói giá 0'),
  ('VS-GOI1-GIA-AM', 'thu', [(P, "    if (!(Number(price) > 0)) return res.status(400).json(GIA_SAI);", "    if (Number(price) < 0) return res.status(400).json(GIA_SAI);", 1)],
   r'✗ A3a thêm gói giá 0'),
  ('BV-GOI1-GIA-PUT', 'thu', [(P, "    if (price !== undefined && !(Number(price) > 0)) return res.status(400).json(GIA_SAI);\n", "", 1)], r'✗ A3b'),
  # ── A2: chặn theo loại ──
  ('BV-GOI1-LOAI', 'thu', [(O, "if (customer_package_id && monTuGoi.length && dsGoi.length) {", "if (false) {", 1)], r'✗ A2a'),
  ('VS-GOI1-LOAI-SO-SAI', 'thu', [(G, "if (xin[khoaLoai(g)] > con) {", "if (xin[khoaLoai(g)] > con + 1) {", 1)], r'✗ A2a'),
  # Kiểm theo loại TRƯỚC giao dịch (phương án B đã loại ở ke_hoach.md mục 2): quầy 2 ghi xong giữa lúc đọc và lúc ghi → vượt.
  ('VS-GOI1-LOAI-TRUOC-TX', 'thu', [(O, "if (customer_package_id && monTuGoi.length && dsGoi.length) {", "if (false) {", 1),
                                    (O, "    const tx = await beginTransaction();\n    let orderId;",
                                     "    { const m = orderItems.filter((i) => i.from_package); const v = customer_package_id && m.length && dsGoi.length\n"
                                     "      ? vuotTheoLoai(dsGoi, await daLayTheoLoai({ query }, customer_package_id), m) : null; if (v) return res.status(400).json(v); }\n"
                                     "    const tx = await beginTransaction();\n    let orderId;", 1)], r'✗ A2d2'),
  ('BV-GOI1-SL-AM', 'thu', [(O, "if (item.from_package && !(Number.isInteger(Number(item.quantity)) && Number(item.quantity) >= 1)) {", "if (false) {", 1)], r'✗ A2j'),
  ('VS-GOI1-SL-AM-CHI-0', 'thu', [(O, "if (item.from_package && !(Number.isInteger(Number(item.quantity)) && Number(item.quantity) >= 1)) {",
                                   "if (item.from_package && Number(item.quantity) === 0) {", 1)], r'✗ A2j'),
  ('BV-GOI1-MUA-LOAI', 'thu', [(O, "      if (vuotMua) return res.status(400).json(vuotMua);\n", "", 1)], r'✗ A2e'),
  ('VS-GOI1-MUA-NHAN-GOI', 'thu', [(O, "const vuotMua = vuotTheoLoai(dsGoi, [],",
                                    "const vuotMua = vuotTheoLoai(dsGoi.map((g) => ({ ...g, qty: g.qty * (package_buy.pkg_qty || 1) })), [],", 1)], r'✗ A2g'),
  ('VS-GOI1-DEM-HUY', 'thu', [(G, "AND o.status != 'cancelled' AND oi.product_id > 0", "AND oi.product_id > 0", 1)], r'✗ A2c'),
  ('VS-GOI1-DEM-NULL', 'thu', [(G, "\n  AND (oi.unit_price = 0 OR oi.unit_price IS NULL)`", "\n  AND oi.unit_price = 0`", 1)], r'✗ A2h'),
  ('BV-GOI1-DEM', 'thu', [(P, "pkg.delivered_items = await daLayTheoLoai({ query }, pkg.id);",
                           "pkg.delivered_items = await query(`SELECT oi.product_code, SUM(oi.quantity) as delivered_qty FROM pos_order_items oi "
                           "JOIN pos_orders o ON o.id = oi.order_id WHERE o.customer_package_id = ? AND oi.product_id > 0 AND oi.unit_price = 0 "
                           "GROUP BY oi.product_code`, [pkg.id]);", 1)], r'✗ A2c'),
  # ── A4: tên khách, lần lấy gần nhất, lịch sử giao ──
  ('BV-GOI1-TEN', 'thu', [(P, "COALESCE(c.name, ob.customer_name) as customer_name", "NULL as customer_name", 1)], r'✗ A4a'),
  ('VS-GOI1-TEN-DON', 'thu', [(P, "COALESCE(c.name, ob.customer_name) as customer_name", "ob.customer_name as customer_name", 1)], r'✗ A4a'),
  ('VS-GOI1-LAN-LAY-HUY', 'thu', [(P, "WHERE ${dieuKienLayTuGoi('cp.id')}) as last_delivery_at", "WHERE o.customer_package_id = cp.id) as last_delivery_at", 1)], r'✗ A4a'),
  ('BV-GOI1-LS', 'thu', [(P, "       WHERE ${dieuKienLayTuGoi()}\n       GROUP BY o.id", "       WHERE o.customer_package_id = ? AND oi.product_id > 0\n       GROUP BY o.id", 1)],
   r'✗ A4f'),
  # ── A5: dừng gói ──
  ('VS-GOI1-DUNG-QUYEN', 'thu', [(P, "checkPermission('refund_package'), async", "checkPermission('manage_users'), async", 1)], r'✗ A5a2'),
  ('BV-GOI1-LYDO', 'thu', [(P, "    if (!lyDo) return res.status(400)", "    if (false) return res.status(400)", 1)], r'✗ A5b '),
  ('VS-GOI1-LYDO-KHONG-TRIM', 'thu', [(P, "String(req.body.reason || '').trim()", "String(req.body.reason || '')", 1)], r'✗ A5b2'),
  ('VS-GOI1-DUNG-DUA', 'thu', [(P, "WHERE id = ? AND status = 'active'\",\n      [ghi, now, id]", "WHERE id = ?\",\n      [ghi, now, id]", 1)], r'✗ A5d '),
  ('BV-GOI1-DUNG-CHANGES', 'thu', [(P, "    if (doi.changes !== 1) return", "    if (false) return", 1)], r'✗ A5e'),
  # ── màn hình: Cài đặt → Gói SP ──
  ('VS-GOI1-O-TONG', 'cli', [(SET, "readOnly={pkgForm.package_items.length > 0}", "readOnly={false}", 1)], r'✗ A1e'),
  ('BV-GOI1-TU-TINH', 'cli', [(SET, "package_items: items, total_qty: items.length ? items.reduce((s, i) => s + (i.qty || 0), 0) : pkgForm.total_qty",
                               "package_items: items", 1)], r'✗ A1e'),
  ('BV-GOI1-SL-MAN', 'cli', [(SET, "    if (pkgForm.package_items.some(i => !(Number.isInteger(i.qty) && i.qty >= 1))) {", "    if (false) {", 1)], r'✗ A1e'),
  ('VS-GOI1-LOC-AM-THAM', 'cli', [(SET, "        total_qty: parseInt(pkgForm.total_qty) || 0,\n      };",
                                   "        total_qty: parseInt(pkgForm.total_qty) || 0,\n        package_items: pkgForm.package_items.filter(i => i.qty > 0),\n      };", 1)], r'✗ A1e'),
  ('BV-GOI1-GIA-MAN', 'cli', [(SET, "    if (!(parseFloat(pkgForm.price) > 0)) {", "    if (false) {", 1)], r'✗ A3c'),
  ('BV-GOI1-LINK', 'cli', [(SET, "<Link to={`/reports?tab=packages&goi=${pkg.id}`}", "<Link to={`/reports`}", 1)], r'✗ A4c '),
  # ── màn hình: Báo cáo → Gói SP, Khách hàng ──
  ('BV-GOI1-URL', 'cli', [(REP, "useState(searchParams.get('tab') === 'packages' ? 'packages' : 'daily')", "useState('daily')", 1)], r'✗ A4b '),
  ('VS-GOI1-LOC-GOI', 'cli', [(REP, "Number(p.package_id) === goiLoc", "Number(p.id) === goiLoc", 1)], r'✗ A4b '),
  ('BV-GOI1-TIM-TEN', 'cli', [(REP, "(p.customer_name || '').toLowerCase().includes(s) || ", "", 1)], r'✗ A4b '),
  ('BV-GOI1-DANG-GIAO', 'cli', [(REP, "useState(goiLoc ? 'active' : 'all')", "useState('all')", 1)], r'✗ A4c2'),
  ('BV-GOI1-DO', 'cli', [(REP, "const vuot = pct > 100;", "const vuot = false;", 1)], r'✗ A4b2'),
  ('VS-GOI1-SAP-CHUA-LAY', 'cli', [(REP, "String(p.last_delivery_at || p.created_at)", "String(p.last_delivery_at || '')", 1)], r'✗ A4b2'),
  ('VS-GOI1-KH-CHU-THICH', 'cli', [(CUS, "    setSearchParams({}, { replace: true });\n", "    // setSearchParams({}, { replace: true });\n", 1)], r'✗ A4d'),
  ('VS-GOI1-O-TONG-CHU-THICH', 'cli', [(SET, "readOnly={pkgForm.package_items.length > 0}", "{/* readOnly={pkgForm.package_items.length > 0} */}", 1)], r'✗ A1e'),
  ('BV-GOI1-KH-MOT-LAN', 'cli', [(CUS, "    setSearchParams({}, { replace: true });\n", "", 1)], r'✗ A4d'),
  ('BV-GOI1-KH-URL', 'cli', [(CUS, "if (kh) openDetailModal(kh);", "if (kh) setSelectedCustomer(kh);", 1)], r'✗ A4d'),
  ('VS-GOI1-NUT-QUYEN', 'cli', [(REP, "hasPermission('refund_package') && pkg.status === 'active' &&", "pkg.status === 'active' &&", 1)], r'✗ A5h'),
  ('BV-GOI1-NUT-LYDO', 'cli', [(REP, "if (!lyDo || !lyDo.trim()) return;", "if (lyDo === null) return;", 1)], r'✗ A5h'),
]


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


def chay1(db):
  ten, cach, cap, bat = db
  tam = tempfile.mkdtemp(prefix='goi1_db_')
  try:
    if cach == 'cli':
      thu = os.path.join(tam, 'client')
      shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(thu, 'src'))
    else:
      thu = os.path.join(tam, 'server')
      shutil.copytree(os.path.join(GOC, 'server'), thu)
      os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
    loi = ap(thu, cap)
    if loi: return ten, False, loi
    lenh = ['node', 'cong_cu/thu_GOI1.js', '--client' if cach == 'cli' else '--may-chu', thu]
    r = subprocess.run(lenh, cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    return ten, r.returncode != 0 and bool(trung), (trung[0][:160] if trung else f'thoát {r.returncode}, KHÔNG thấy /{bat}/ · ' + ra.strip().splitlines()[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  with ThreadPoolExecutor(max_workers=6) as ex:
    kq = list(ex.map(chay1, chon))
  hong = 0
  for ten, dat, chi in kq:
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(kq) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(kq)})')
  sys.exit(1 if hong else 0)
