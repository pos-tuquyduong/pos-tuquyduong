#!/usr/bin/env python3
"""P26c — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/P26c/dot_bien.py [tên...]

Khuôn viec/P26b/dot_bien.py: chép server/ (hoặc client/src, cong_cu/gia_lap/) ra thư mục tạm, thay chuỗi (mỗi chuỗi phải khớp
ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy bài thử / giả lập trên bản sao. Đạt = đầu ra có
dòng khớp mẫu `bat` (đúng ca phải bắt) VÀ thoát ≠ 0. Không đụng server/ thật, client/ thật, data/, Turso. Thư mục tạm xoá khi xong.
Bản sao là bản CHÉP THẬT; chỉ node_modules / tu_chay / server nối symlink và chỉ ĐỌC (K5: công cụ chép-rồi-sửa kiểm realpath).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# (tên, chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
#   chạy: 'thu'   = node cong_cu/thu_P26c.js --may-chu <bản sao server>
#         'thub'  = node cong_cu/thu_P26b.js --may-chu <bản sao server>
#         'cli'   = node cong_cu/thu_P26c.js --client <bản sao client> (file tính từ client/)
#         'kbN'   = giả lập tới KB N trên bản sao server/
#         'thugl' = node cong_cu/thu_gia_lap.js --gia-lap <bản sao cong_cu/gia_lap> (file tính từ gia_lap/)
O, R, D, P, T, DB = 'routes/orders.js', 'routes/refunds.js', 'routes/damages.js', 'routes/packages.js', 'utils/tienDaTra.js', 'database.js'
SET, SAL = 'src/pages/Settings.jsx', 'src/pages/Sales.jsx'
DOT_BIEN = [
  # ── B3: hoàn kho SX trên đơn đã huỷ ──
  ('BV-B3-bo-chan-hoan-kho', 'thu', [(D, "&& order.status === 'cancelled') {", "&& false) {", 1)], r'✗ B3a'),
  ('VS-B3-chan-ca-don-da-hoan', 'thu', [(D, "&& order.status === 'cancelled') {", "&& order.status !== 'completed') {", 1)], r'✗ B3d'),
  # ── B4 (H3): đền tiền trên đơn chưa thu ──
  ('BV-B4-bo-chan-chua-thu', 'thu', [(D, "if (order.payment_status !== 'paid') return", "if (false) return", 1)], r'✗ B4a'),
  ('VS-B4-chan-theo-cach-tra-no', 'thu', [(D, "if (order.payment_status !== 'paid') return", "if (order.payment_method === 'debt') return", 1)], r'✗ B4c'),
  # ── B2 (Q3): hoàn tiền phải > 0 ──
  ('BV-B2-bo-chan-so-0', 'thu', [(D, "if (!(soGui > 0)) return", "if (false) return", 1)], r'✗ B2a'),
  ('VS-B2-chi-chan-so-am', 'thu', [(D, "if (!(soGui > 0)) return", "if (soGui < 0) return", 1)], r'✗ B2a'),
  ('BV-B2-bo-chan-so-0-thu-P26b', 'thub', [(D, "if (!(soGui > 0)) return", "if (false) return", 1)], r'✗ C1e'),
  # ── B1 (Q2): trần theo số đã trả ──
  ('BV-B1-tran-gia-goc', 'thu', [(D, "Math.max(...tra.map((d) => d.da_tra / Number(d.quantity)))", "Math.max(...tra.map((d) => Number(d.unit_price)))", 1),
                                 (D, "tra.reduce((t, d) => t + d.da_tra, 0)", "tra.reduce((t, d) => t + Number(d.unit_price) * Number(d.quantity), 0)", 1)], r'✗ B1a'),
  ('VS-B1-tran-theo-dong-dau', 'thub', [(D, "Math.max(...tra.map((d) => d.da_tra / Number(d.quantity)))", "(tra[0].da_tra / Number(tra[0].quantity))", 1)], r'✗ C6a'),
  ('VS-B1-chia-bo-giam-don', 'thu', [(T, "da_tra: tong > 0 ? Math.floor((gia[i] * tra) / tong) : 0", "da_tra: gia[i]", 1)], r'✗ B1c'),
  # ── Q4 / H2: giá trị gói còn lại, toàn bộ vào ví ──
  ('BV-Q4-hoan-tron', 'thu', [(T, "  if (goi.length) {\n    const dong", "  if (false) {\n    const dong", 1)], r'✗ A5c'),
  ('VS-Q4-luot-con-lai-dao', 'thu', [(T, "(d.da_tra * Number(g.delivered_qty))", "(d.da_tra * (Number(g.total_qty) - Number(g.delivered_qty)))", 1)], r'✗ A5c'),
  ('VS-H2-chi-phan-vi', 'thu', [(T, "    tong = Number(order.total || 0) - Number(order.debt_amount || 0) - Math.ceil(daDung);",
                                    "    tong = Math.min(viDaTra, Number(order.total || 0) - Number(order.debt_amount || 0) - Math.ceil(daDung));", 1)], r'✗ A5c'),
  ('VS-H2-me-khong-nhan-truoc', 'thu', [(T, "const me = order.parent_phone ? Math.min(Number(order.parent_balance_amount || 0), tong) : 0;", "const me = 0;", 1)], r'✗ A5g'),
  ('VS-H2-khong-ghi-hoan-goi', 'kb23', [(O, '[con - tuVi, "hoan_goi", null]', '[con - tuVi, "cash", null]', 1)], r'KB23 → (HTTP: xoá đơn mua gói trả tiền mặt|I11)'),
  ('VS-H2-hoan-goi-giam-total-spent', 'thu', [(O, '[con - tuVi, "hoan_goi", null]', '[con - tuVi, "hoan_goi", "total_spent"]', 1)], r'✗ A5c2'),
  ('VS-H2-mot-dong-hoan-goi', 'thu', [(O, 'const tuVi = coGoi ? Math.min(con, Number(order.balance_amount || 0)) : con;', 'const tuVi = coGoi ? 0 : con;', 1)], r'✗ A5c2'),
  ('BV-B1-den-dong-goi', 'thu', [(D, 'if (tra.some((d) => Number(d.product_id) < 0)) {', 'if (false) {', 1)], r'✗ B1e'),
  ('VS-A3-chan-ca-gia-han', 'thu', [(O, 'if (customer_package_id && package_buy && items.some((i) => i.from_package)) {', 'if (customer_package_id && package_buy) {', 1)], r'✗ A3b'),
  ('VS-D1-marker-suong', 'cli', [(SET, "        max_discount: rewardForm.discount_type === 'percent' ? (parseInt(rewardForm.max_discount) || 0) : 0,",
                                 "        max_discount: 0,", 1)], r'✗ D1a'),
  # ── H4: trừ tiền đã đền ──
  ('BV-H4-bo-tru-den', 'thu', [(T, "tong = Math.max(0, tong - Number(den.n));", "tong = Math.max(0, tong);", 1)], r'✗ B5a'),
  ('VS-H4-chi-tru-o-don-goi', 'thu', [(T, "tong = Math.max(0, tong - Number(den.n));", "tong = Math.max(0, goi.length ? tong - Number(den.n) : tong);", 1)], r'✗ B5a'),
  # ── Q4: quyền refund_package ──
  ('BV-Q4-bo-quyen', 'thu', [(O, 'if (cancelBuyPkgs.length && req.user.role !== "owner") {', 'if (false) {', 1)], r'✗ A5a'),
  ('VS-Q4-quyen-cancel_order', 'thu', [(O, "WHERE role = ? AND permission = 'refund_package'\", [req.user.role]);",
                                        "WHERE role = ? AND permission = 'cancel_order'\", [req.user.role]);", 1)], r'✗ A5a'),
  ('VS-Q4-chan-ca-don-lay-tu-goi', 'thu', [(O, 'if (cancelBuyPkgs.length && req.user.role !== "owner") {',
                                            'if ((cancelBuyPkgs.length || order.customer_package_id) && req.user.role !== "owner") {', 1)], r'✗ A5k'),
  ('BV-Q4-quyen-chi-kho-moi', 'thu', [(DB, "  for (const [role, allowed] of [['owner', 1], ['staff', 0], ['manager', 0]]) {", "  for (const [role, allowed] of []) {", 1)], r'✗ Q4b'),
  ('VS-Q4-quyen-de-quyen-da-chinh', 'thu', [(DB, "INSERT OR IGNORE INTO pos_permissions (role, permission, allowed) VALUES (?, 'refund_package', ?)",
                                             "INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES (?, 'refund_package', ?)", 1)], r'✗ Q4b'),
  # ── A1: xoá đơn giao từ gói đã huỷ ──
  ('BV-A1-xoa-bo-cong-trang-thai', 'thu', [(O, '!buyPkgIds.includes(order.customer_package_id) && order.status !== "cancelled") {',
                                            '!buyPkgIds.includes(order.customer_package_id)) {', 1)], r'✗ A1a'),
  ('VS-A1-chan-ca-don-da-hoan', 'thu', [(O, '!buyPkgIds.includes(order.customer_package_id) && order.status !== "cancelled") {',
                                         '!buyPkgIds.includes(order.customer_package_id) && order.status === "completed") {', 1)], r'✗ A1c'),
  # ── A2: trừ lượt trong giao dịch, có trần ──
  ('BV-A2-bo-tran', 'thu', [(O, "WHERE id = ? AND status = 'active' AND delivered_qty + ? <= total_qty`,", "WHERE id = ? AND status = 'active' AND ? IS NOT NULL`,", 1)], r'✗ A2a'),
  ('VS-A2-bo-kiem-changes', 'thu', [(O, "        if (tru.changes !== 1) {\n          await tx.rollback();", "        if (false) {\n          await tx.rollback();", 1)], r'✗ A2a'),
  ('BV-A2-lay-ngay-bo-tran', 'thu', [(O, "if (orderItems.reduce((s, i) => s + (i.from_package ? i.quantity : 0), 0) > soLuotGoi) {", "if (false) {", 1)], r'✗ A2d'),
  ('VS-A2-lay-ngay-so-man-hinh', 'thu', [(O, "if (orderItems.reduce((s, i) => s + (i.from_package ? i.quantity : 0), 0) > soLuotGoi) {",
                                          "if (orderItems.reduce((s, i) => s + (i.from_package ? i.quantity : 0), 0) > package_buy.total_qty) {", 1)], r'✗ A6b'),
  # ── A3: vừa mua vừa lấy ──
  ('BV-A3-bo-chan', 'thu', [(O, "    if (customer_package_id && package_buy && items.some((i) => i.from_package)) {", "    if (false) {", 1)], r'✗ A3 '),
  ('VS-A3-so-nham-ma-goi', 'thu', [(O, "    if (customer_package_id && package_buy && items.some((i) => i.from_package)) {",
                                    "    if (customer_package_id && package_buy?.package_id === customer_package_id) {", 1)], r'✗ A3 '),
  # ── A4: /deliver đã bỏ ──
  ('BV-A4-deliver-song-lai', 'thu', [(P, "// P26c (A4): BỎ PUT /customer-packages/:id/deliver",
    "router.put('/customer-packages/:id/deliver', authenticate, async (req, res) => { await run('UPDATE pos_customer_packages SET delivered_qty = "
    "delivered_qty + ? WHERE id = ?', [req.body.delivered_qty, req.params.id]); res.json({ success: true }); });\n// P26c (A4): BỎ PUT /customer-packages/:id/deliver", 1)], r'✗ A4'),
  # ── A6: số lượt theo gói đã cài ──
  ('BV-A6-so-man-hinh', 'thu', [(O, "      soLuotGoi = Number(pkg.total_qty) || 0;", "      soLuotGoi = Number(package_buy.total_qty) || 0;", 1)], r'✗ A6a'),
  ('VS-A6-chi-sua-ten-dong', 'thu', [(O, "[phone, package_buy.package_id, orderId, soLuotGoi, now, now]", "[phone, package_buy.package_id, orderId, package_buy.total_qty, now, now]", 1)], r'✗ A6a'),
  ('BV-A6-o-nhap-so-luot', 'cli', [(SAL, "<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{buyQty}</span>",
                                    "<input type=\"number\" min=\"1\" value={buyQty} onChange={e => setBuyQty(e.target.value)} />", 1)], r'✗ A6c'),
  # ── C1: thu nợ đơn đã hoàn ──
  ('BV-C1-cong-cancelled', 'thu', [(O, 'if (order.status !== "completed") {   // P26c (C1)', 'if (order.status === "cancelled") {   // P26c (C1)', 1),
                                   (O, "AND payment_status != 'paid' AND status = 'completed'`,", "AND payment_status != 'paid' AND status != 'cancelled'`,", 1)], r'✗ C1a'),
  ('VS-C1-chi-sua-cong-update', 'thu', [(O, 'if (order.status !== "completed") {   // P26c (C1)', 'if (order.status === "cancelled") {   // P26c (C1)', 1)], r'✗ C1a'),
  # ── C2: mã bill + nợ kho khi xoá ──
  ('BV-C2-bo-xoa-ma-bill', 'thu', [(O, 'await tx.run("DELETE FROM pos_signup_codes WHERE order_id = ? AND claimed_at IS NULL AND diem_nhan_luc IS NULL", [order.id]);', '', 1)], r'✗ C2a'),
  ('VS-C2-xoa-ca-ma-da-dung', 'thu', [(O, '"DELETE FROM pos_signup_codes WHERE order_id = ? AND claimed_at IS NULL AND diem_nhan_luc IS NULL"', '"DELETE FROM pos_signup_codes WHERE order_id = ?"', 1)], r'✗ C2c'),
  ('BV-C2-bo-huy-no-out', 'thu', [(O, "      for (const { van_tay: vtOut } of noOut) {", "      for (const { van_tay: vtOut } of []) {", 1)], r'✗ C2b'),
  ('VS-C2-huy-out-khong-xet-in', 'thu', [(O, 'if (order.status === "cancelled" && !(await tx.queryOne(', 'if (false && !(await tx.queryOne(', 1)], r'✗ C2f'),
  ('VS-C2-huy-ca-no-in-da-toi-sx', 'thu', [(O, "\"SELECT van_tay FROM pos_stock_pending WHERE order_id = ? AND direction = 'out' AND status IN ('pending', 'can_xem') AND van_tay IS NOT NULL\"",
                                             "\"SELECT REPLACE(van_tay, ':in:', ':out:') AS van_tay FROM pos_stock_pending WHERE order_id = ? AND status IN ('pending', 'can_xem') AND van_tay IS NOT NULL\"", 1)], r'✗ C2d'),
  ('VS-C2-khong-huy-no-in-cung-mon', 'thu', [(O, "for (const vt of [vtOut, vtIn]) {", "for (const vt of [vtOut]) {", 1)], r'✗ C2e'),
  ('VS-C2-van-gui-in', 'thu', [(O, "          if (boQuaKho.has(vanTay)) continue;   // P26c (C2): `out` chưa từng tới SX\n", "", 1)], r'✗ C2b'),
  # ── C3 / C4 / C5 ──
  ('BV-C3-bo-cot-con', 'thu', [(R, "ghiChu: 'Hoàn tiền đơn hàng (duyệt)', nguoi: req.user.username, luc: now, cot: 'total_spent', soCot: -con });",
                                "ghiChu: 'Hoàn tiền đơn hàng (duyệt)', nguoi: req.user.username, luc: now });", 1)], r'✗ C3'),
  ('VS-C3-dau-soCot', 'thu', [(R, "luc: now, cot: 'total_spent', soCot: -me });", "luc: now, cot: 'total_spent', soCot: me });", 1)], r'✗ C3'),
  ('VS-C3-dau-soCot-gia-lap', 'kb32', [(R, "luc: now, cot: 'total_spent', soCot: -con });", "luc: now, cot: 'total_spent', soCot: con });", 1)], r'KB32 → (HTTP: mã 1 lượt|I18)'),
  ('BV-C4-bo-tong-hoan', 'thu', [(R, "      tong_hoan: kq.tong_hoan", "      tong_hoan_bo: kq.tong_hoan", 1)], r'✗ C4'),
  ('BV-C5-bo-go-the', 'thu', [(O, 'await tx.run("DELETE FROM pos_membership_purchases WHERE order_id = ?", [order.id]);   // P26c (C5): như huỷ đơn', '', 1)], r'✗ C5'),
  # ── D: mã giảm giá, quà, hạng ──
  ('BV-D1-bo-gui-max', 'cli', [(SET, "        max_discount: rewardForm.discount_type === 'percent'", "        tran_bo: rewardForm.discount_type === 'percent'", 1)], r'✗ D1'),
  ('BV-D2-bo-tra-luot-huy', 'thu', [(O, '        await hoanVi(tx, order, req.user.username, now, "hủy");\n        await traLuotMa(tx, order);',
                                     '        await hoanVi(tx, order, req.user.username, now, "hủy");', 1)], r'✗ D2 mã 1 lượt dùng → huỷ'),
  ('BV-D2-bo-tra-luot-xoa', 'thu', [(O, '        await hoanVi(tx, order, req.user.username, now, "xóa");\n        await traLuotMa(tx, order);',
                                     '        await hoanVi(tx, order, req.user.username, now, "xóa");', 1)], r'✗ D2 mã 1 lượt dùng → xoá'),
  ('BV-D2-bo-tra-luot-duyet', 'thu', [(R, "      await traLuotMa(tx, don);\n", "", 1)], r'✗ D2 mã 1 lượt dùng → duyệt hoàn'),
  ('VS-D2-tra-ca-don-cu', 'thu', [(T, "WHERE UPPER(code) = UPPER(?) AND discount_type = ? AND discount_value = ?`, [order.discount_code, order.discount_type, order.discount_value]);",
                                   "WHERE UPPER(code) = UPPER(?)`, [order.discount_code]);", 1)], r'✗ D2b'),
  ('VS-D2-khong-tra-voucher', 'thu', [(T, "SET status = 'available', used_order_id = NULL, used_at = NULL WHERE used_order_id = ?", "SET used_at = NULL WHERE used_order_id = ?", 1)], r'✗ D2c'),
  ('BV-D3-luu-ma-go', 'thu', [(O, "    let finalDiscountCode = null; // P26c (D3)", "    let finalDiscountCode = discount_code; // P26c (D3)", 1)], r'✗ D3'),
  ('BV-D4-bo-voucher-used', 'thu', [(O, "\"UPDATE pos_voucher_grants SET status = 'used', used_order_id = ?, used_at = ? WHERE UPPER(code) = UPPER(?) AND status = 'available'\"",
                                     "\"UPDATE pos_voucher_grants SET used_at = ? WHERE ? IS NOT NULL AND UPPER(code) = UPPER(?) AND status = 'available'\"", 1)], r'✗ D4'),
  ('BV-D5-co-kim-cuong', 'thu', [(DB, "      ['Bạch Kim', 2000000, 8, 2],   // P26c (D5)", "      ['Bạch Kim', 2000000, 8, 2],\n      ['Kim cương', 5000000, 10, 3],   // P26c (D5)", 1)], r'✗ D5'),
  # ── CHUYỂN từ viec/P26b/dot_bien.py: 11 đột biến cũ neo vào code P26c viết lại (9 không áp được, 2 nhắm đoạn đã ra khỏi đường
  #    tiền). Cùng ý đồ, neo mới, cùng ca bắt của thu_P26b (bảng ở trang_thai.md "Đột biến cũ đổi"). ──
  ('VS-me-hoan-gap-doi-huy', 'thub', [(O, 'await ghiVi(tx, { phone: order.parent_phone, loai: "refund", soTien: me, orderId: order.id,',
                                         'await ghiVi(tx, { phone: order.parent_phone, loai: "refund", soTien: 2 * me, orderId: order.id,', 1)], r'✗ M2 '),
  ('VS-me-hoan-gap-doi-xoa', 'thub', [(O, 'await ghiVi(tx, { phone: order.parent_phone, loai: "refund", soTien: me, orderId: order.id,',
                                         'await ghiVi(tx, { phone: order.parent_phone, loai: "refund", soTien: viec === "xóa" ? 2 * me : me, orderId: order.id,', 1)], r'✗ M3 '),
  ('BV-Q9-bo-hoan-me', 'thub', [(R, '      if (me > 0) {\n        await ghiVi(tx, { phone: don.parent_phone,', '      if (false) {\n        await ghiVi(tx, { phone: don.parent_phone,', 1)], r'✗ M5 '),
  ('VS-Q9-hoan-me-vao-vi-con', 'thub', [(R, 'await ghiVi(tx, { phone: don.parent_phone,', 'await ghiVi(tx, { phone: refund.customer_phone,', 1)], r'✗ M5 '),
  ('VS-Q9-hoan-me-ngoai-tx', 'thub', [(R, 'await ghiVi(tx, { phone: don.parent_phone,',
    "await ghiVi({ queryOne: require('../database').queryOne, run: require('../database').run }, { phone: don.parent_phone,", 1)], r'✗ M5 '),
  ('VS-Q9-hoan-me-khong-qua-cong-don', 'thub', [
    (R, "    const kq = await trongGiaoDich(async (tx) => {\n      const refund = await tx.queryOne('SELECT * FROM pos_refund_requests WHERE id = ?', [req.params.id]);",
        "    await trongGiaoDich(async (t2) => { const r0 = await t2.queryOne('SELECT order_id FROM pos_refund_requests WHERE id = ?', [req.params.id]);\n"
        "      const me0 = r0 && await t2.queryOne('SELECT parent_phone, parent_balance_amount FROM pos_orders WHERE id = ?', [r0.order_id]);\n"
        "      if (me0?.parent_phone && Number(me0.parent_balance_amount) > 0) await ghiVi(t2, { phone: me0.parent_phone, loai: 'refund', "
        "soTien: Number(me0.parent_balance_amount), orderId: r0.order_id, nguoi: 'x' }); });\n"
        "    const kq = await trongGiaoDich(async (tx) => {\n      const refund = await tx.queryOne('SELECT * FROM pos_refund_requests WHERE id = ?', [req.params.id]);", 1),
    (R, '      if (me > 0) {\n        await ghiVi(tx, { phone: don.parent_phone,', '      if (false) {\n        await ghiVi(tx, { phone: don.parent_phone,', 1)], r'✗ M8 '),
  ('BV-duyet-cong-don-khong-kiem-changes', 'thub', [(R, 'if (doi.changes !== 1) return loi(400, \'Đơn không còn', 'if (false) return loi(400, \'Đơn không còn', 1)], r'✗ A2a'),
  ('BV-hong-bo-tran', 'thub', [(D, 'if (finalRefund > tranLan || finalRefund > tranTong) {', 'if (false) {', 1)], r'✗ C1a'),
  ('BV-hong-bo-tran-cong-don', 'thub', [(D, 'if (finalRefund > tranLan || finalRefund > tranTong) {', 'if (finalRefund > tranLan) {', 1)], r'✗ C6b'),
  ('VS-hong-tran-theo-man-hinh', 'thub', [(D, 'const tranLan = Math.floor(soLuong * Math.max(...tra.map((d) => d.da_tra / Number(d.quantity))));',
                                             'const tranLan = Math.floor(soLuong * Number(req.body.unit_price || Math.max(...tra.map((d) => d.da_tra / Number(d.quantity)))));', 1)], r'✗ C1b'),
  # ── CHUYỂN từ viec/TACH-GL/dot_bien.py: 4 đột biến neo vào LUOT cũ / dòng tổng "29 kịch bản · 16 bất biến" (P26c thêm KB30–32,
  #    I18–I19 vào LUOT). Cùng ý đồ, neo LUOT mới, cùng ca bắt của thu_gia_lap. ──
  ('VS-kb-hai-luot', 'thugl', [('kich_ban.js', '[[2, 15, 17, 28, 30, 31]', '[[2, 5, 15, 17, 28, 30, 31]', 1)], r'chia lượt → KB5 chạy 2 lần'),
  ('VS-luot-trung-thieu', 'thugl', [('kich_ban.js', '[[2, 15, 17, 28, 30, 31]', '[[2, 5, 15, 17, 28, 30, 31]', 1),
                                    ('kich_ban.js', '[1, 4, 5, 6, 7, 8,', '[1, 4, 5, 7, 8,', 1)], r'chia lượt → KB6 chạy 0 lần'),
  ('BV-cha-kiem-mot-lan', 'thugl', [('chay.js', "  for (const [n, c] of dem) if (c !== 1) lech.push(`chia lượt → KB${n} chạy ${c} lần`);\n", '', 1),
                                    ('kich_ban.js', '[[2, 15, 17, 28, 30, 31]', '[[2, 5, 15, 17, 28, 30, 31]', 1),
                                    ('kich_ban.js', '[1, 4, 5, 6, 7, 8,', '[1, 4, 5, 7, 8,', 1)], r'✗ T2 '),
  ('VS-luot-thieu-bat-bien', 'thugl', [('chay.js', 'const tenBB = Object.keys(BAT_BIEN);', 'const tenBB = Object.keys(BAT_BIEN).slice(0, LUOT_K === 2 ? 8 : 99);', 1)],
   r'chia lượt → số bất biến các lượt khác nhau'),
  # ── CHUYỂN từ AUDIT-1 (G3-da-biet: neo câu UPDATE thu nợ — C1 đổi) và HOC-2b (VS-q9-me-lon-hon-bang-0: neo `me?.parent_phone`;
  #    BV-q9-bo-hoan-me = BV-Q9-bo-hoan-me ở trên). kiem_neo.py trên gốc b9b3928: các neo này khớp; trên HEAD rữa vì P26c. ──
  ('BV-G3-da-biet-thu-no', 'kb10', [(O, "WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status = 'completed'`", 'WHERE id = ? AND ? IS NOT NULL`', 1)], r'KB10 → I6:'),
  ('VS-q9-me-lon-hon-bang-0', 'thub', [(T, "const me = order.parent_phone ? Math.min(Number(order.parent_balance_amount || 0), tong) : 0;",
                                          "const me = order.parent_phone ? Math.max(1, Math.min(Number(order.parent_balance_amount || 0), tong)) : 0;", 1)], r'✗ M9 '),
  # ── bất biến (thu_gia_lap, ca dữ liệu tay) ──
  ('BV-I18-bo', 'thugl', [('bat_bien.js', "    return ds.filter((r) => Math.abs(so(r.total_topup) - so(r.nap)) > 0.5 || Math.abs(so(r.total_spent) - so(r.tieu)) > 0.5)",
                            "    return ds.filter((r) => false)", 1)], r'✗ I18 tổng chi 35\.001'),
  ('VS-I18-chi-so-nap', 'thugl', [('bat_bien.js', "> 0.5 || Math.abs(so(r.total_spent) - so(r.tieu)) > 0.5)", "> 0.5)", 1)], r'✗ I18 hoàn không giảm tổng chi'),
  ('BV-I19-bo', 'thugl', [('bat_bien.js', "    return ds.filter((r) => so(r.nhan) > so(r.da_tra) + 0.5)", "    return ds.filter((r) => false)", 1)], r'✗ I19 hoàn 40\.001'),
  ('VS-I19-bo-qua-no', 'thugl', [('bat_bien.js', "SELECT o.code, o.total - COALESCE(o.debt_amount, 0) AS da_tra,", "SELECT o.code, o.total AS da_tra,", 1)], r'✗ I19 đơn còn nợ'),
  ('VS-I11-bo-moi-dong-hoan', 'thugl', [('bat_bien.js', "WHEN type = 'refund' AND COALESCE(payment_method, '') <> 'hoan_goi' THEN amount", "WHEN 0 THEN amount", 1)], r'✗ I11 hoàn 100\.001'),
  ('BV-I11-tinh-ca-hoan-goi', 'thugl', [('bat_bien.js', "WHEN type = 'refund' AND COALESCE(payment_method, '') <> 'hoan_goi' THEN amount", "WHEN type = 'refund' THEN amount", 1)], r'✗ I11 sạch'),
  ('VS-I2-tinh-ca-ma-da-dung', 'thugl', [('bat_bien.js', "WHERE o.id IS NULL AND s.claimed_at IS NULL AND s.diem_nhan_luc IS NULL`);", "WHERE o.id IS NULL`);", 1)], r'✗ mã gắn đơn có thật'),
  ('VS-I13-dem-moi-trang-thai', 'thugl', [('bat_bien.js', "FROM pos_orders o WHERE o.status = 'completed' AND UPPER(o.discount_code)", "FROM pos_orders o WHERE UPPER(o.discount_code)", 1)], r'✗ I13 sạch'),
  ('VS-I7-nhan-moi-van-tay-la', 'thugl', [('bat_bien.js', "if (!can.has(vt) && !daXong.has(vt)) lech.push", "if (false) lech.push", 1)], r'✗ I7 SX nhận vân tay lạ'),
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
  tam = tempfile.mkdtemp(prefix='p26c_db_')
  try:
    if cach == 'thugl':
      thu = os.path.join(tam, 'cong_cu', 'gia_lap')
      shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), thu)
      for x in ('server', 'tu_chay', 'node_modules'): os.symlink(os.path.join(GOC, x), os.path.join(tam, x))
    elif cach == 'cli':
      thu = os.path.join(tam, 'client')
      shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(thu, 'src'))
    else:
      thu = os.path.join(tam, 'server')
      shutil.copytree(os.path.join(GOC, 'server'), thu)
      os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
    loi = ap(thu, cap)
    if loi: return ten, False, loi
    if cach == 'thu': lenh = ['node', 'cong_cu/thu_P26c.js', '--may-chu', thu]
    elif cach == 'thub': lenh = ['node', 'cong_cu/thu_P26b.js', '--may-chu', thu]
    elif cach == 'cli': lenh = ['node', 'cong_cu/thu_P26c.js', '--client', thu]
    elif cach.startswith('kb'): lenh = ['node', 'cong_cu/gia_lap/chay.js', '--may-chu', thu, '--den-kb', cach[2:]]
    else: lenh = ['node', 'cong_cu/thu_gia_lap.js', '--gia-lap', thu]
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
