#!/usr/bin/env python3
"""NAP-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/NAP-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/NAP-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/HANG-1/dot_bien.py: chép server/, cong_cu/gia_lap/ (bất biến I4 · I8 · I15), client/src/, cong_cu/thu_NAP1.js ra thư mục tạm (BẢN
CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG
bản sao. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_NAP1.js'
VK = 'server/utils/viKhach.js'
WA = 'server/routes/wallets.js'
OR = 'server/routes/orders.js'
GC = 'server/utils/giuCho.js'
DT = 'server/utils/diemThat.js'
DS = 'server/utils/doiSoat.js'
RP = 'server/routes/reports.js'
GN = 'server/routes/goi-nap.js'
N14 = 'server/nang_cap/014_nap.js'
BK = 'server/routes/backup.js'
BB = 'cong_cu/gia_lap/bat_bien.js'
TI = 'client/src/pages/BanHang/tinh.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── M: bước nâng cấp 014 + sao lưu ──
  ('BV-014-cot-vi', [(N14, "for (const bang of ['pos_wallets', 'pos_balance_transactions'])", "for (const bang of ['pos_balance_transactions'])", 1)], r'✗ M1 '),
  ('BV-khoi-phuc-goi-nap', [(BK, "  'pos_goi_nap'];   // NAP-1 (chủ quán 06.11)", "  ];   // NAP-1 (chủ quán 06.11)", 1)], r'✗ M4 '),
  ('BV-sao-luu-goi-nap', [(BK, "  { name: 'pos_goi_nap', label: 'Gói nạp tiền', key: 'id' },", '', 1)], r'✗ M3 '),
  # ── A: cài đặt gói nạp (goi-nap.js) ──
  ('BV-goi-khach-tra-duong', [(GN, '!soNguyen(g.khach_tra) || g.khach_tra <= 0', '!soNguyen(g.khach_tra)', 1)], r'✗ A2 '),
  ('VS-goi-so-chuoi', [(GN, "const soNguyen = (x) => typeof x === 'number' && Number.isInteger(x);", 'const soNguyen = (x) => Number.isInteger(Number(x));', 1)], r'✗ A2 '),
  ('BV-goi-vao-tk-it-hon', [(GN, '!soNguyen(g.vao_tk) || g.vao_tk < g.khach_tra', '!soNguyen(g.vao_tk)', 1)], r'✗ A3 '),
  ('VS-goi-nguong-bang', [(GN, 'g.vao_tk < g.khach_tra', 'g.vao_tk <= g.khach_tra', 1)], r'✗ A4 '),
  ('BV-goi-quyen-them', [(GN, "router.post('/', authenticate, chiChuQuan,", "router.post('/', authenticate,", 1)], r'✗ A5 '),
  ('BV-goi-quyen-sua', [(GN, "router.put('/:id', authenticate, chiChuQuan,", "router.put('/:id', authenticate,", 1)], r'✗ A5 '),
  # vòng sửa 4 (chủ quán 06.11 câu 2): chỉ chủ quán + PIN chủ quán; quản lý / nhân viên vẫn bán
  ('VS-goi-quyen-quan-ly', [(GN, "const chiChuQuan = (req, res, next) => (req.user.role === 'owner' ? next()", "const chiChuQuan = (req, res, next) => (['owner', 'manager'].includes(req.user.role) ? next()", 1)], r'✗ A5 '),
  ('BV-goi-pin-them', [(GN, "    if (!(await quaPin(req, res))) return;\n    const now = getNow();", "    const now = getNow();", 1)], r'✗ A8 '),
  ('BV-goi-pin-sua', [(GN, "    if (!(await quaPin(req, res))) return;\n    const bat =", "    const bat =", 1)], r'✗ A8 '),
  ('VS-goi-pin-chi-khi-gui', [(GN, "  const pin = await kiemPinChuQuan(req.body?.pin);\n  if (!pin.loi) return true;", "  const pin = req.body?.pin ? await kiemPinChuQuan(req.body.pin) : {};\n  if (!pin.loi) return true;", 1)], r'✗ A8 '),
  ('K5-quay-chi-chu-quan', [(GN, "router.get('/', authenticate, async", "router.get('/', authenticate, chiChuQuan, async", 1)], r'✗ A9 '),
  ('BV-quay-thay-goi-tat', [(GN, 'FROM pos_goi_nap WHERE is_active = 1 ORDER BY', 'FROM pos_goi_nap ORDER BY', 1)], r'✗ A6 '),
  ('VS-sua-khong-kiem', [(GN, "    const sai = kiemGoi(g);\n    if (sai) return loi(res, sai);\n    if (!(await quaPin(req, res))) return;\n    const bat =", "    if (!(await quaPin(req, res))) return;\n    const bat =", 1)], r'✗ A6b '),
  ('BV-ban-goi-tat', [(OR, 'SELECT * FROM pos_goi_nap WHERE id = ? AND is_active = 1', 'SELECT * FROM pos_goi_nap WHERE id = ?', 1)], r'✗ A7 '),
  # ── B: bán gói ở quầy (orders.js, giuCho.js) ──
  ('VS-nap-vao-bang-tra', [(OR, 'soTien: goiNap.vao_tk, thuong: goiNap.vao_tk - goiNap.khach_tra,', 'soTien: goiNap.khach_tra, thuong: 0,', 1)], r'✗ B1 '),
  ('VS-nap-thuong-tien-nap', [(OR, 'soTien: goiNap.vao_tk, thuong: goiNap.vao_tk - goiNap.khach_tra,', 'soTien: goiNap.vao_tk, thuong: 0,', 1)], r'✗ B1 '),
  ('VS-nap-gia-may-khach', [(OR, '      subtotal += goiNap.khach_tra;', '      subtotal += Number(req.body.total) || goiNap.khach_tra;', 1)], r'✗ B3 '),
  ('VS-nap-sdt-tho', [(OR, '    if (goi_nap_id != null) {\n      if (!normalizePhone(customer_phone)) {', '    if (goi_nap_id != null) {\n      if (!customer_phone) {', 1)], r'✗ B4 '),
  ('BV-nap-chan-gop', [(OR, '      if ((Array.isArray(items) && items.length) || package_buy || membership_buy || customer_package_id) {', '      if (false) {', 1)], r'✗ B5 '),
  ('VS-nap-chan-gop-chi-mon', [(OR, '      if ((Array.isArray(items) && items.length) || package_buy || membership_buy || customer_package_id) {', '      if (Array.isArray(items) && items.length) {', 1)], r'✗ B5 '),
  ('BV-nap-chan-vi', [(OR, '      if (Number(balance_amount) > 0 || Number(parent_balance_amount) > 0 || payment_method === "balance" || Number(debt_amount) > 0\n        || discount_code',
                       '      if (Number(debt_amount) > 0\n        || discount_code', 1)], r'✗ B6 '),
  ('VS-nap-chan-vi-me', [(OR, ' || Number(parent_balance_amount) > 0 || payment_method === "balance" || Number(debt_amount) > 0\n        || discount_code', ' || payment_method === "balance" || Number(debt_amount) > 0\n        || discount_code', 1)], r'✗ B6 '),
  ('BV-nap-chan-vi-phien', [(GC, "  if (don.goi_nap_id != null && (b.tru_tai_khoan || b.tru_tai_khoan_me || cach === 'tai_khoan')) {", '  if (false) {', 1)], r'✗ B7 '),
  ('VS-nap-chan-phien-chi-khach', [(GC, "(b.tru_tai_khoan || b.tru_tai_khoan_me || cach === 'tai_khoan')", "(b.tru_tai_khoan || cach === 'tai_khoan')", 1)], r'✗ B7 '),
  ('BV-nap-chan-ma', [(OR, '        || discount_code || Number(shipping_fee) > 0) {', '        || Number(shipping_fee) > 0) {', 1)], r'✗ B8 '),
  ('BV-nap-chan-no', [(OR, ' || payment_method === "balance" || Number(debt_amount) > 0\n', ' || payment_method === "balance"\n', 1)], r'✗ B9 '),
  ('BV-nap-chan-phi-giao', [(OR, '        || discount_code || Number(shipping_fee) > 0) {', '        || discount_code) {', 1)], r'✗ B9 '),
  ('VS-nap-ghi-ngoai-giao-dich', [(OR, '      // NAP-1: thu đủ → cộng ví NGAY trong giao dịch này', '      if (goiNap) await tx.commit();\n      // NAP-1: thu đủ → cộng ví NGAY trong giao dịch này', 1)], r'✗ B11 |✗ B1 '),
  ('BV-nap-giam-hang', [(OR, 'it.is_package_item || it.is_membership_item || it.is_nap_item', 'it.is_package_item || it.is_membership_item', 1)], r'✗ B13 '),
  ('BV-nap-tinh-thu', [(OR, '"package_buy", "membership_buy", "goi_nap_id"];', '"package_buy", "membership_buy"];', 1)], r'✗ B14 '),
  ('BV-nap-phien-truong', [(GC, "'package_buy', 'membership_buy', 'goi_nap_id'];", "'package_buy', 'membership_buy'];", 1)], r'✗ B2 '),
  # ── C: ví hai ngăn (viKhach.js, wallets.js) ──
  ('VS-tru-thuong-truoc', [(VK, '  return Math.round((soTru * thuong) / soDu);\n}', '  return Math.min(thuong, soTru);\n}', 1)], r'✗ C0 |✗ C1 '),
  ('VS-tru-lam-tron-xuong', [(VK, '  return Math.round((soTru * thuong) / soDu);\n}', '  return Math.floor((soTru * thuong) / soDu);\n}', 1)], r'✗ C0 '),
  ('BV-tru-het-so-du', [(VK, '  if (soTru >= soDu) return thuong;\n', '', 1)], r'✗ C0 |✗ C2 '),
  ('BV-ghi-vi-chia-tru', [(WA, "    : soTien < 0 ? -thuongKhiTru(truoc, Number((await tx.queryOne('SELECT thuong FROM pos_wallets WHERE phone = ?', [phone]))?.thuong || 0), -soTien)\n", '', 1)], r'✗ C1 '),
  ('BV-ghi-vi-chia-hoan', [(WA, ": orderId && (loai === 'refund' || loai === 'compensation') ? await thuongKhiHoan(tx, phone, orderId, soTien) : 0;", ': 0;', 1)], r'✗ C5 '),
  ('VS-hoan-chi-refund', [(WA, "orderId && (loai === 'refund' || loai === 'compensation')", "orderId && loai === 'refund'", 1)], r'✗ C7 '),
  ('BV-hoan-tran', [(VK, '  return Math.min(con, Math.round((soTien * thuongTru) / viTru));', '  return Math.round((soTien * thuongTru) / viTru);', 1)], r'✗ C0b '),
  ('VS-hoan-tra-het-thuong', [(VK, '  return Math.min(con, Math.round((soTien * thuongTru) / viTru));', '  return con;', 1)], r'✗ C0b |✗ C7 '),
  ('BV-hoan-tra-not', [(VK, '  if (Number(r?.vi_hoan || 0) + soTien >= viTru) return Math.min(con, soTien);\n', '', 1)], r'✗ C0b |✗ C7c '),
  ('VS-tra-not-nguong-noi-1', [(VK, '  if (Number(r?.vi_hoan || 0) + soTien >= viTru) return Math.min(con, soTien);', '  if (Number(r?.vi_hoan || 0) + soTien >= viTru - 1) return Math.min(con, soTien);', 1)], r'✗ C0b '),
  ('BV-tra-not-tran', [(VK, '  if (Number(r?.vi_hoan || 0) + soTien >= viTru) return Math.min(con, soTien);', '  if (Number(r?.vi_hoan || 0) + soTien >= viTru) return con;', 1)], r'✗ C0c '),
  ('BV-yeu-cau-hoan-nap', [('server/routes/refunds.js', "      if (await laDonNap(tx, order.id)) return { huy: true, status: 400, body: LOI_NAP_KHONG_HOAN };", '', 1)], r'✗ D3 '),
  ('VS-hoan-tra-not-tinh-ca-hoan-goi', [(VK, "AND COALESCE(payment_method, '') <> 'hoan_goi' THEN amount END), 0) AS vi_hoan", "THEN amount END), 0) AS vi_hoan", 1),
                                        (WA, "for (const [soTien, cachTra, cot] of [[tuVi, 'cash', 'total_spent'], [tienMat, 'hoan_goi', null]])", "for (const [soTien, cachTra, cot] of [[tienMat, 'hoan_goi', null], [tuVi, 'cash', 'total_spent']])", 1)], r'✗ C13 '),
  ('VS-hoan-moi-vi', [(VK, 'FROM pos_balance_transactions WHERE customer_phone = ? AND order_id = ?`, [phone, orderId]);', 'FROM pos_balance_transactions WHERE order_id = ? AND ? IS NOT NULL`, [orderId, phone]);', 1)], r'✗ C7b |✗ C3 |✗ C9 '),
  ('BV-ghi-vi-cot-thuong', [(WA, 'UPDATE pos_wallets SET balance = balance + ?, thuong = thuong + ?, total_topup', 'UPDATE pos_wallets SET balance = balance + ?, thuong = thuong + 0 * ?, total_topup', 1)], r'✗ C1 '),
  ('BV-reconcile-thuong', [(WA, 'UPDATE pos_wallets SET balance = ?, thuong = ?, updated_at = ? WHERE phone = ?', 'UPDATE pos_wallets SET balance = ?, thuong = thuong + 0 * ?, updated_at = ? WHERE phone = ?', 1)], r'✗ C11 '),
  # ── D: tiền nạp không hoàn (orders.js) ──
  ('BV-nap-khong-huy', [(OR, '        if (await laDonNap(tx, order.id)) {   // NAP-1 (D): tiền nạp không hoàn', '        if (false) {   // NAP-1 (D): tiền nạp không hoàn', 1)], r'✗ D1 '),
  ('BV-nap-khong-xoa', [(OR, '      if (await laDonNap(tx, order.id)) {   // NAP-1 (D): đơn nạp không xoá', '      if (false) {   // NAP-1 (D): đơn nạp không xoá', 1)], r'✗ D2 '),
  # ── E: điểm (orders.js, diemThat.js, bat_bien.js I8) ──
  # soát bảo mật lần 1 (chủ quán 06.11 (a)): duyệt hoàn trừ điểm phần tài khoản
  ('BV-hoan-tru-diem', [('server/routes/refunds.js', '      await truDiemHoan(tx, don, con + me, req.user.username, now);\n', '', 1)], r'✗ E7 '),
  ('VS-hoan-tru-diem-bo-me', [('server/routes/refunds.js', 'await truDiemHoan(tx, don, con + me,', 'await truDiemHoan(tx, don, con,', 1)], r'✗ E7 '),
  ('VS-hoan-tru-diem-lam-tron', [(DT, 'Math.min(diem, Math.ceil((diem * tienHoan) / tienDiem))', 'Math.min(diem, Math.round((diem * tienHoan) / tienDiem))', 1)], r'✗ E7 |✗ E8 '),
  ('VS-hoan-tru-diem-khong-tran', [(DT, 'Math.min(diem, Math.ceil((diem * tienHoan) / tienDiem))', 'Math.ceil((diem * tienHoan) / tienDiem)', 1)], r'✗ E8 '),
  ('VS-hoan-tru-diem-ca-luat-cu', [('server/routes/refunds.js', "AND type = 'earn' AND created_at >= ? GROUP BY", "AND type = 'earn' AND ? IS NOT NULL GROUP BY", 1)], r'✗ E7 '),
  ('BV-I8-hoan', [(BB, '      const dung = dungBan - truHoan;', '      const dung = dungBan;', 1)], r'✗ E7 '),
  ('BV-nap-diem', [(OR, '    if (goiNap) diemTao = null;', '', 1)], r'✗ E1 '),
  ('BV-nap-ma-bill', [(OR, 'if (!alreadyClaimed && !goiNap) {', 'if (!alreadyClaimed) {', 1)], r'✗ E5 '),
  ('BV-diem-vi', [(DT, '\n    + (Number(dong.balance_amount) || 0) + (Number(dong.parent_balance_amount) || 0);', ';', 1)], r'✗ E2 '),
  ('VS-diem-vi-me', [(DT, ' + (Number(dong.parent_balance_amount) || 0);', ';', 1)], r'✗ E3 '),
  ('VS-diem-bo-tran', [(DT, 'Math.min(tra, Number(dong.total) || 0)', 'tra', 1)], r'✗ E6 '),
  ('BV-I8-nap', [(BB, "(r.status === 'cancelled' && !huyCu) || so(r.nap) ? 0", "r.status === 'cancelled' && !huyCu ? 0", 1)], r'✗ B15 '),
  ('VS-I8-luat-cu', [(BB, 'Math.min(so(r.cash_amount) + so(r.transfer_amount) + vi, so(r.total))', 'Math.min(so(r.cash_amount) + so(r.transfer_amount), so(r.total) - vi)', 1)], r'✗ C9 |✗ B15 '),
  # ── C (đối soát): bất biến I4 ngăn thưởng, I15 dải thẻ ──
  ('BV-I4-thuong', [(BB, '      if (Math.abs(so(r.thuong) - so(r.thuong_so)) > 0.5 || so(r.thuong) < 0 || so(r.thuong) > so(r.balance) + 0.5) {', '      if (false) {', 1)], r'✗ C11 '),
  ('VS-I4-thuong-vuot', [(BB, ' || so(r.thuong) < 0 || so(r.thuong) > so(r.balance) + 0.5) {', ') {', 1)], r'✗ C12 '),
  ('BV-I15-dai-nap', [(BB, 'AND oi.product_id <= -1000000 AND oi.product_id > ${NAP_TU})', 'AND oi.product_id <= -1000000)', 1)], r'✗ B15 '),
  # ── F: sổ sách (doiSoat.js, reports.js, orders.js danh sách) ──
  ('VS-ket-dem-doi', [(DS, "WHERE type = 'topup' AND order_id IS NULL AND COALESCE(payment_method, 'cash') = ?", "WHERE type = 'topup' AND COALESCE(payment_method, 'cash') = ?", 1)], r'✗ F1 '),
  ('BV-doanh-thu-daily', [(RP, "(customer_package_id IS NULL OR total > 0) AND NOT ${sqlDonNap('pos_orders')}", '(customer_package_id IS NULL OR total > 0)', 1)], r'✗ F2 '),
  ('BV-doanh-thu-sales-ky', [(RP, "      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND NOT ${sqlDonNap('pos_orders')}\n      GROUP BY period", '      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?\n      GROUP BY period', 1)], r'✗ F2 '),
  ('BV-doanh-thu-sales-tong', [(RP, "      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND NOT ${sqlDonNap('pos_orders')}\n    `, [from, to]);", '      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?\n    `, [from, to]);', 1)], r'✗ F2 '),
  ('BV-doanh-thu-staff', [(RP, "      WHERE NOT ${sqlDonNap('pos_orders')}\n    `;", '      WHERE 1=1\n    `;', 1)], r'✗ F2 '),
  ('BV-doanh-thu-ds-don', [(OR, '      WHERE NOT ${sqlDonNap("pos_orders")}', '      WHERE 1=1', 1)], r'✗ F2 '),
  ('VS-so-sach-trong-do-nap', [(DS, 'trong_do_nap: so(napDon[0].n) + so(napTay[0].n)', 'trong_do_nap: so(napTay[0].n)', 1)], r'✗ F5 '),
  ('VS-thuong-da-dung-khong-hoan', [(DS, "AND type IN ('purchase', 'refund', 'compensation') AND DATE(created_at) BETWEEN ? AND ?", "AND type IN ('purchase') AND DATE(created_at) BETWEEN ? AND ?", 1)], r'✗ F3b '),
  ('BV-doanh-thu-that', [(DS, 'doanh_thu_that: tongBan - daDung', 'doanh_thu_that: tongBan', 1)], r'✗ F3 '),
  ('VS-giu-ho-khong-tach', [(DS, 'giu_ho: { tong, tien_nap: tong - th, thuong_nap: th }', 'giu_ho: { tong, tien_nap: tong, thuong_nap: 0 }', 1)], r'✗ F4 '),
  ('BV-products-nap', [(RP, "WHERE o.status = 'completed' AND oi.product_id > ${ID_NAP_TU}", "WHERE o.status = 'completed'", 1)], r'✗ F7 '),
  ('BV-so-sach-quyen', [(RP, "router.get('/so-sach', authenticate, checkPermission('view_reports'),", "router.get('/so-sach', authenticate,", 1)], r'✗ F6 '),
  # ── G: màn Bán hàng mới (client/src/pages/BanHang/tinh.js) ──
  ('BV-man-than-nap', [(TI, "  if (nap) return { customer_phone: khach?.phone || null, customer_name: khach?.name || 'Khách lẻ', items: [], goi_nap_id: nap.goi_nap_id };\n", '', 1)], r'✗ G1 '),
  ('BV-man-nap-can-khach', [(TI, "  if (!khach?.phone) return 'Chọn khách trước khi nạp tiền';\n", '', 1)], r'✗ G3 '),
  ('BV-man-nap-don-rieng', [(TI, "  if (gio.some((m) => !m.goi_nap_id)) return", "  if (false) return", 1)], r'✗ G3 '),
  ('BV-man-nap-gia-hang', [(TI, 'giamFlash > 0 || m.goi_nap_id ? m.unit_price', 'giamFlash > 0 ? m.unit_price', 1)], r'✗ G4 '),
  # luồng hợp lệ (K5) — đột biến chặn oan phải bị BẮT
  ('K5-chan-moi-don-khong-sdt', [(OR, '    if (goi_nap_id != null) {\n      if (!normalizePhone(customer_phone)) {', '    if (true) {\n      if (!normalizePhone(customer_phone)) {', 1)], r'✗ K6 '),
  ('K5-nap-tay-co-thuong', [(WA, "      : orderId && (loai === 'refund'", "      : loai === 'topup' ? Math.round(soTien / 20) : orderId && (loai === 'refund'", 1)], r'✗ C8 |✗ K2 '),
]


def ban_sao(thay):
  """Chép phần cần của kho ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_nap1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  shutil.copyfile(os.path.join(GOC, BAI), os.path.join(tmp, BAI))
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


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(tmp, BAI)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'SẬP:' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
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
    ma, ra = chay_bai(tmp)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-160:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
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
