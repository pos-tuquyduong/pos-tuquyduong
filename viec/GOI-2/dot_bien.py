#!/usr/bin/env python3
"""GOI-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/GOI-2/dot_bien.py [tên...]

Khuôn viec/GOI-1/dot_bien.py: chép server/ (hoặc client/src) ra thư mục tạm, thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn —
không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy bài thử trên bản sao. Đạt = đầu ra có dòng khớp mẫu `bat` (đúng ca phải bắt)
VÀ thoát ≠ 0. Không đụng server/ thật, client/ thật, data/, Turso. Thư mục tạm xoá khi xong.
Bản sao là bản CHÉP THẬT; chỉ node_modules nối symlink và chỉ ĐỌC (K5: công cụ chép-rồi-sửa kiểm realpath).

Q-F (chủ quán chốt 14.10): 4 đột biến P26c neo vào thân ghi ví của `hoanVi` (orders.js) LẠC vì thân đó dời sang `ghiHoan` (wallets.js) —
dựng lại đúng 4 lỗi cũ ở đây (mục "P26c dựng lại"), bắt bằng chính bài thu_P26c.js / thu_P26b.js.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# (tên, chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
#   chạy: 'thu'  = node cong_cu/thu_GOI1.js --may-chu <bản sao server> · 'cli' = --client <bản sao client> (file tính từ client/)
#         'p26c' = node cong_cu/thu_P26c.js --may-chu <bản sao server> · 'thub' = node cong_cu/thu_P26b.js --may-chu <bản sao server>
O, P, W, G, T = 'routes/orders.js', 'routes/packages.js', 'routes/wallets.js', 'utils/goiKhach.js', 'utils/tienDaTra.js'
REP, CUS, ORD, SET = 'src/pages/Reports.jsx', 'src/pages/Customers.jsx', 'src/pages/Orders.jsx', 'src/pages/Settings.jsx'
GOM = "    res.json({ success: true, data: gomTheoKhach(ds).filter(locKhach) });"
CONG = "        WHERE id = ? AND status = 'active' AND delivered_qty < total_qty`, [ghi, now, id]);"
DOT_BIEN = [
  # ── A1 (Q1, Q2): gom theo khách, còn lại, lâu chưa lấy, lọc ──
  ('BV-GOI2-GOM', 'thu', [(P, GOM, "    res.json({ success: true, data: ds });", 1)], r'✗ B1a'),
  ('VS-GOI2-CON-LAI-GOM-KET-THUC', 'thu', [(G, "    if (g.status !== 'active') continue;", "    if (g.status === 'completed') continue;", 1)], r'✗ B1b'),
  ('VS-GOI2-LAU-GE', 'thu', [(G, "kh.ngay_chua_lay > NGAY_LAU_CHUA_LAY;", "kh.ngay_chua_lay >= NGAY_LAU_CHUA_LAY;", 1)], r'✗ B1c '),
  ('BV-GOI2-LAU', 'thu', [(G, "    kh.lau = kh.ngay_chua_lay !== null && kh.ngay_chua_lay > NGAY_LAU_CHUA_LAY;", "    kh.lau = false;", 1)], r'✗ B1c '),
  # GOI-1 VS-GOI1-SAP-CHUA-LAY (lạc): mốc chỉ theo ngày mua, bỏ lần lấy
  ('VS-GOI2-MOC-CHI-NGAY-MUA', 'thu', [(G, "    const moc = g.last_delivery_at || g.created_at;", "    const moc = g.created_at;", 1)], r'✗ B1c2'),
  ('VS-GOI2-LOC-XONG-CHI-KHACH-HET', 'thu', [(G, "  xong: (kh) => kh.so_dang_dung < kh.so_goi,", "  xong: (kh) => kh.so_dang_dung === 0,", 1)], r'✗ B1d3'),
  ('BV-GOI2-LOC', 'thu', [(P, GOM, "    res.json({ success: true, data: gomTheoKhach(ds) });", 1)], r'✗ B1d '),
  # GOI-1 VS-GOI1-LOC-GOI (lạc): lọc theo gói nay ở máy chủ
  ('BV-GOI2-LOC-GOI', 'thu', [(P, "    if (goi) { dk.push('cp.package_id = ?'); params.push(goi); }", "", 1)], r'✗ B1f'),
  ('BV-GOI2-LOC-PHONE', 'thu', [(P, "    if (phone) { dk.push('cp.customer_phone = ?'); params.push(phone); }", "", 1)], r'✗ B1f'),
  ('BV-GOI2-ORDER-CODE', 'thu', [(P, "COALESCE(c.name, ob.customer_name) as customer_name, ob.code as order_code,", "COALESCE(c.name, ob.customer_name) as customer_name,", 1)], r'✗ B1h'),
  # ── A2 (Q3): nắn gói đủ ──
  ('BV-GOI2-NAN', 'thu', [(P, "    await run(\"UPDATE pos_customer_packages SET status = 'completed', updated_at = ? WHERE status = 'active' AND delivered_qty >= total_qty\",\n      [new Date().toISOString()]);\n", "", 1)], r'✗ B2a'),
  ('VS-GOI2-NAN-GT', 'thu', [(P, "WHERE status = 'active' AND delivered_qty >= total_qty\",", "WHERE status = 'active' AND delivered_qty > total_qty\",", 1)], r'✗ B2a'),
  ('BV-GOI2-CONG-DU', 'thu', [(P, CONG, "        WHERE id = ? AND status = 'active'`, [ghi, now, id]);", 1)], r'✗ B2b'),
  # ── A3 (Q4a, Q-A, Q-B): tính hoàn, ghi ví, một lần ──
  ('BV-GOI2-HOAN', 'thu', [(P, "    const hoan = req.body.hoan === true;", "    const hoan = false;", 1)], r'✗ B3a2'),
  ('VS-GOI2-HOAN-GIA-NIEM-YET', 'thu', [(T, "  const goc = Math.floor(((dong.da_tra / Number(dong.quantity)) * con) / Number(cp.total_qty));",
                                         "  const goc = Math.floor((Number(dong.unit_price) * con) / Number(cp.total_qty));", 1)], r'✗ B3c'),
  ('VS-GOI2-HOAN-KHONG-CHIA-SO-GOI', 'thu', [(T, "(dong.da_tra / Number(dong.quantity))", "dong.da_tra", 1)], r'✗ B3d'),
  ('BV-GOI2-ME', 'thu', [(T, "  const me = don.parent_phone ? Math.max(0, Math.min(Number(don.parent_balance_amount || 0) - Number(so.me), tong)) : 0;",
                          "  const me = 0;", 1)], r'✗ B3e'),
  ('VS-GOI2-ME-KHONG-TRU-DA-HOAN', 'thu', [(T, "Number(don.parent_balance_amount || 0) - Number(so.me)", "Number(don.parent_balance_amount || 0)", 1)], r'✗ B3l'),
  ('VS-GOI2-VI-KHONG-TRU-DA-HOAN', 'thu', [(T, "Number(don.balance_amount || 0) - Number(so.vi)", "Number(don.balance_amount || 0)", 1)], r'✗ B3l'),
  ('VS-GOI2-VI-TRUOC-ME', 'thu', [(T, "  const vi = Math.max(0, Math.min(Number(don.balance_amount || 0) - Number(so.vi), tong - me));",
                                   "  const vi = Math.max(0, Math.min(Number(don.balance_amount || 0) - Number(so.vi), tong));", 1)], r'✗ B3e2'),
  ('BV-GOI2-NO', 'thu', [(T, "  if (Number(don.debt_amount || 0) > 0) return { loi: 'DON_CON_NO'", "  if (false) return { loi: 'DON_CON_NO'", 1)], r'✗ B3n'),
  ('BV-GOI2-DON-MUA', 'thu', [(T, "  const dong = don && don.status === 'completed' ? (await tienDaTraTheoDong(tx, don))",
                               "  const dong = don ? (await tienDaTraTheoDong(tx, don))", 1)], r'✗ B3o'),
  ('BV-GOI2-409', 'thu', [(P, "        if (req.body.so_tien !== undefined && Number(req.body.so_tien) !== tien.tong) {", "        if (false) {", 1)], r'✗ B3h'),
  ('VS-GOI2-TIN-SO-TIEN-CLIENT', 'thu', [(P, "        if (req.body.so_tien !== undefined && Number(req.body.so_tien) !== tien.tong) {", "        if (false) {", 1),
                                         (P, "{ me: tien.me, tuVi: tien.vi, tienMat: tien.tien_mat }",
                                          "{ me: tien.me, tuVi: tien.vi, tienMat: Number(req.body.so_tien ?? tien.tong) - tien.me - tien.vi }", 1)], r'✗ B3h'),
  ('VS-GOI2-DU-KIEN-KHONG-QUYEN', 'thu', [(P, "router.get('/customer-packages/:id/hoan-du-kien', authenticate, checkPermission('refund_package'),",
                                           "router.get('/customer-packages/:id/hoan-du-kien', authenticate,", 1)], r'✗ B3g'),
  # GOI-1 VS-GOI1-DUNG-QUYEN (lạc): route kết thúc dùng nhầm quyền sửa gói mẫu
  ('VS-GOI2-KET-THUC-QUYEN', 'thu', [(P, "router.put('/customer-packages/:id/cancel', authenticate, checkPermission('refund_package'),",
                                      "router.put('/customer-packages/:id/cancel', authenticate, checkPermission('manage_users'),", 1)], r'✗ A5a2'),
  # GOI-1 VS-GOI1-DUNG-DUA (lạc): bỏ cổng status = 'active' → kết thúc lần hai / hai người cùng bấm đều ghi
  ('BV-GOI2-CONG', 'thu', [(P, CONG, "        WHERE id = ? AND delivered_qty < total_qty`, [ghi, now, id]);", 1)], r'✗ (A5d |B3i)'),
  ('BV-GOI2-CONG-CHANGES', 'thu', [(P, "      if (doi.changes !== 1) return { huy: true, status: 400, body: { success: false, code: 'GOI_KHONG_DUNG_DUOC'",
                                    "      if (false) return { huy: true, status: 400, body: { success: false, code: 'GOI_KHONG_DUNG_DUOC'", 1)], r'✗ (A5d |B3i)'),
  ('VS-GOI2-TIEN-MAT-GIAM-TOTAL-SPENT', 'thu', [(W, "[tienMat, 'hoan_goi', null]", "[tienMat, 'hoan_goi', 'total_spent']", 1)], r'✗ B3a2'),
  ('VS-GOI2-NOTES-KHONG-SO', 'thu', [(P, "'hoàn ' + tien.tong + 'đ'", "'hoàn'", 1)], r'✗ B3a2'),
  ('VS-GOI2-GHI-CHU-KHONG-MA-GOI', 'thu', [(P, "          ghiChu: `Hoàn kết thúc gói KH #${cp.id} (đơn ${tien.don.code})`,", "          ghiChu: `Hoàn kết thúc gói`,", 1)], r'✗ B3k'),
  # ── A4: chặn hoàn hai lần — huỷ VÀ xoá (K4) ──
  ('BV-GOI2-CHAN-HUY', 'thu', [(O, "        if (cancelBuyPkgs.length && await goiDaKetThuc(tx, order.id)) {", "        if (false) {", 1)], r'✗ B4a'),
  ('VS-GOI2-CHAN-QUEN-XOA', 'thu', [(O, "        if (await goiDaKetThuc(tx, order.id)) {   // GOI-2 (A4)", "        if (false) {   // GOI-2 (A4)", 1)], r'✗ B4b'),
  ('VS-GOI2-CHAN-MOI-GOI', 'thu', [(G, "WHERE order_id = ? AND status = 'cancelled' LIMIT 1", "WHERE order_id = ? LIMIT 1", 1)], r'✗ B7a'),
  # Chặn xoá cả đơn ĐÃ HUỶ (gói cancelled do chính lệnh huỷ) — K5
  ('VS-GOI2-CHAN-XOA-MOI-TRANG-THAI', 'thu', [(O, """      if (order.status === "completed") {
        if (await goiDaKetThuc(tx, order.id)) {   // GOI-2 (A4): như huỷ — gói đã kết thúc thì không xoá đơn mua
          await tx.rollback();
          return res.status(400).json(LOI_GOI_DA_KET_THUC);
        }
""", """      if (await goiDaKetThuc(tx, order.id)) { await tx.rollback(); return res.status(400).json(LOI_GOI_DA_KET_THUC); }
      if (order.status === "completed") {
""", 1)], r'✗ B7c'),
  # ── Q-C: huỷ / xoá đơn lấy không trả túi về gói đã kết thúc ──
  ('BV-GOI2-TRA-TUI-HUY', 'thu', [(O, "                   updated_at = ?\n               WHERE id = ? AND status != 'cancelled'`,", "                   updated_at = ?\n               WHERE id = ?`,", 1)], r'✗ B7g '),
  ('BV-GOI2-TRA-TUI-XOA', 'thu', [(O, "                 updated_at = ?\n             WHERE id = ? AND status != 'cancelled'`,", "                 updated_at = ?\n             WHERE id = ?`,", 1)], r'✗ B7g2'),
  ('VS-GOI2-TRA-TUI-CHI-ACTIVE', 'thu', [(O, "                   updated_at = ?\n               WHERE id = ? AND status != 'cancelled'`,", "                   updated_at = ?\n               WHERE id = ? AND status = 'active'`,", 1)], r'✗ B7h'),
  # ── P26c dựng lại (Q-F): 4 lỗi cũ của thân ghi hoàn, nay ở wallets.js ghiHoan ──
  ('VS-H2-khong-ghi-hoan-goi', 'p26c', [(W, "[tienMat, 'hoan_goi', null]", "[tienMat, 'cash', null]", 1)], r'✗ A5c2'),
  ('VS-H2-hoan-goi-giam-total-spent', 'p26c', [(W, "[tienMat, 'hoan_goi', null]", "[tienMat, 'hoan_goi', 'total_spent']", 1)], r'✗ A5c2'),
  ('VS-me-hoan-gap-doi-huy', 'thub', [(W, "soTien: me, orderId: order.id, ghiChu: ghiChuMe", "soTien: 2 * me, orderId: order.id, ghiChu: ghiChuMe", 1)], r'✗ M2 '),
  ('VS-me-hoan-gap-doi-xoa', 'thub', [(W, "soTien: me, orderId: order.id, ghiChu: ghiChuMe",
                                       "soTien: ghiChuMe.includes('xóa') ? 2 * me : me, orderId: order.id, ghiChu: ghiChuMe", 1)], r'✗ M3 '),
  # ── màn hình: Báo cáo → Gói SP ──
  ('BV-GOI2-URL-PHONE', 'cli', [(REP, "      if (sdtLoc) qs.set('phone', sdtLoc);\n", "", 1)], r'✗ B1g'),
  ('BV-GOI2-LOC-THEM-TAT-CA', 'cli', [(REP, "[{ k: 'dang_dung', l: 'Đang dùng' }, ", "[{ k: 'all', l: 'Tất cả' }, { k: 'dang_dung', l: 'Đang dùng' }, ", 1)], r'✗ B1g'),
  # GOI-1 BV-GOI1-DANG-GIAO (lạc): mặc định không phải Đang dùng
  ('VS-GOI2-LOC-MAC-DINH', 'cli', [(REP, "useState('dang_dung')", "useState('xong')", 1)], r'✗ (A4c2|B1g)'),
  # GOI-1 BV-GOI1-TIM-TEN (lạc)
  ('BV-GOI2-TIM-TEN', 'cli', [(REP, "(p.customer_phone || '').includes(s) || (p.customer_name || '').toLowerCase().includes(s)", "(p.customer_phone || '').includes(s)", 1)], r'✗ (A4b |B1g)'),
  ('VS-GOI2-TRANG-THAI-CU', 'cli', [(REP, "const TRANG_THAI = { active: '🔄 Đang dùng', completed: '✅ Đã xong', cancelled: '⛔ Đã kết thúc' };",
                                     "const TRANG_THAI = { active: '🔄 Đang giao', completed: '✅ Xong', cancelled: '⛔ Đã dừng' };", 1)], r'✗ B2c'),
  ('VS-GOI2-NUT-KHONG-QUYEN', 'cli', [(REP, "hasPermission('refund_package') && pkg.status === 'active' && pkg.delivered_qty", "pkg.status === 'active' && pkg.delivered_qty", 1)], r'✗ A5h'),
  ('VS-GOI2-NUT-GOI-DU', 'cli', [(REP, "pkg.status === 'active' && pkg.delivered_qty < pkg.total_qty && ketThuc?.cp !== pkg.id &&", "pkg.status === 'active' && ketThuc?.cp !== pkg.id &&", 1)], r'✗ A5h'),
  ('VS-GOI2-HOP-KHONG-BAT-CHON', 'cli', [(REP, "    if (kt.hoan === null) return setKetThuc({ ...kt, loi: 'Chọn một trong hai cách xử lý' });\n", "", 1)], r'✗ B5c'),
  # GOI-1 BV-GOI1-NUT-LYDO (lạc)
  ('VS-GOI2-HOP-KHONG-LY-DO', 'cli', [(REP, "    if (!kt.lyDo.trim()) return setKetThuc({ ...kt, loi: 'Phải nhập lý do' });\n", "", 1)], r'✗ B5c'),
  ('BV-GOI2-SO-TIEN-KHONG-GUI', 'cli', [(REP, "so_tien: kt.hoan ? kt.duKien?.tong : undefined", "so_tien: undefined", 1)], r'✗ B5c'),
  ('BV-GOI2-LOI-KHONG-HIEN', 'cli', [(REP, "{ketThuc.loi && <div style={{ color: '#dc2626', marginTop: 4, fontWeight: 600 }}>{ketThuc.loi}</div>}", "", 1)], r'✗ B5c'),
  ('BV-GOI2-LINK-DON-MUA', 'cli', [(REP, "<Link to={`/orders?code=${encodeURIComponent(pkg.order_code || '')}&ngay=${ngay(pkg.created_at)}`} onClick={e => e.stopPropagation()}>{fmtDate(pkg.created_at)}</Link>",
                                   "{fmtDate(pkg.created_at)}", 1)], r'✗ B6d'),
  # ── màn hình: Cài đặt, Khách hàng, Đơn hàng ──
  # GOI-1 BV-GOI1-LINK (giữ neo "🔒 N KH"); tên gói không còn là Link
  ('BV-GOI2-LINK-TEN-GOI', 'cli', [(SET, "<Link style={{ color: 'inherit' }} to={`/reports?tab=packages&goi=${pkg.id}`}>{pkg.name}</Link>", "{pkg.name}", 1)], r'✗ B6a'),
  ('BV-GOI2-KH-DONG-GOI', 'cli', [(CUS, "{goiDangDung?.so_dang_dung > 0 && (", "{false && (", 1)], r'✗ B6c'),
  ('VS-GOI2-KH-HIEN-CA-0-GOI', 'cli', [(CUS, "{goiDangDung?.so_dang_dung > 0 && (", "{goiDangDung && (", 1)], r'✗ B6c'),
  ('BV-GOI2-ORDERS-KHONG-DOC-CODE', 'cli', [(ORD, "useState(searchParams.get('code') || '')", "useState('')", 1)], r'✗ B6e'),
  ('VS-GOI2-ORDERS-KHONG-DOC-NGAY', 'cli', [(ORD, "  const ngayMo = searchParams.get('ngay') || today;", "  const ngayMo = today;", 1)], r'✗ B6e'),
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


BAI = { 'thu': ('cong_cu/thu_GOI1.js', '--may-chu'), 'cli': ('cong_cu/thu_GOI1.js', '--client'),
        'p26c': ('cong_cu/thu_P26c.js', '--may-chu'), 'thub': ('cong_cu/thu_P26b.js', '--may-chu') }


def chay1(db):
  ten, cach, cap, bat = db
  tam = tempfile.mkdtemp(prefix='goi2_db_')
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
    bai, co = BAI[cach]
    r = subprocess.run(['node', bai, co, thu], cwd=GOC, capture_output=True, text=True, timeout=300)
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
