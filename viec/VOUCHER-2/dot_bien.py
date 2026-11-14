#!/usr/bin/env python3
"""VOUCHER-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/VOUCHER-2/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/VOUCHER-2/dot_bien.py --liet-ke      (chỉ in danh sách)
    python3 viec/VOUCHER-2/dot_bien.py --help

Khuôn viec/VI-ME-1/dot_bien.py: chép server/ + client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài của đột biến (mặc định thu_VOUCHER2.js) với `--may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O, U, T = 'server/routes/orders.js', 'server/utils/uuDai.js', 'server/utils/tienDaTra.js'
V, D, H = 'server/utils/voucherCode.js', 'server/utils/donApp.js', 'server/routes/hoaDon.js'
L, R = 'server/routes/loyalty.js', 'server/routes/rewards.js'
S, DC, ST = 'server/routes/signup-codes.js', 'server/routes/discount-codes.js', 'server/routes/settings.js'
CH, TJ = 'client/src/utils/hoaDon.js', 'client/src/pages/BanHang/tinh.js'
CV, KJ = 'client/src/pages/BanHang/ChipVoucher.jsx', 'client/src/pages/Customers.jsx'
BM, MV, N26 = 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/CaiDat/MauVoucher.jsx', 'server/nang_cap/026_voucher.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── orders.js kiemVoucherDon: từng vế kiểm voucher ──
  # Q17 (14.11): phép chính chủ / P20b dời từ kiemVoucherDon sang voucherCode.xetVoucherConDung — neo theo chỗ mới
  ('BV-V2-CHINH-CHU', [(V, 'if (Number(v.chinh_chu) && v.chu !== phone) return', 'if (false) return', 1)], r'✗ C4a ', 'V2'),
  ('VS-V2-CHINH-CHU-MOI-MA', [(V, 'if (Number(v.chinh_chu) && v.chu !== phone) return', 'if (v.chu !== phone) return', 1)], r'✗ C4c ', 'V2'),
  ('VS-V2-N-NOI', [(O, 'ds.length >= toiDa ?', 'ds.length > toiDa ?', 1)], r'✗ C2 ', 'V2'),
  ('BV-V2-SHIP-CAN-GIAO', [(O, 'ship && !coGiao ?', 'false ?', 1)], r'✗ E2 ', 'V2'),
  ('VS-V2-SHIP-GO-TAY', [(O, 'coGiao: !!baoPhiGiao && finalShippingFee > 0', 'coGiao: finalShippingFee > 0', 1)], r'✗ E2b ', 'V2'),
  ('BV-V2-FLASH-PHAN-TRAM', [(O, '!ship && phanTram && flashApplied ?', 'false ?', 1)], r'✗ D1 ', 'V2'),
  ('VS-V2-PHAN-TRAM-HAI', [(O, 'soPhanTram >= 1 ?', 'soPhanTram >= 2 ?', 1)], r'✗ C8 ', 'V2'),
  ('VS-V2-SHIP-LA-PHAN-TRAM', [(O, 'if (!ship && phanTram) soPhanTram++;', 'if (phanTram) soPhanTram++;', 1)], r'✗ E6 ', 'V2'),
  ('BV-V2-NHOM-MON', [(O, 'if (v && v.ap_dung && v.ap_dung !== "tat_ca") {', 'if (false) {', 1)], r'✗ C9 ', 'V2'),
  ('VS-V2-TOI-THIEU-SUBTOTAL', [(O, 'Number(v.min_order) > tienMonThuong ?', 'Number(v.min_order) > orderItems.reduce((s, it) => s + it.total_price, 0) ?', 1)], r'✗ F6b ', 'V2'),
  ('BV-V2-TINH-THU-MEM', [(O, 'if (kv.loi.length && !phien?.tinhThu)', 'if (kv.loi.length)', 1)], r'✗ C7 ', 'V2'),
  # ── orders.js taoDon: luật 10.11, tổng, ghi đơn, tiêu ──
  ('BV-V2-KHONG-GIAM-THE', [(O, 'khong_giam: khongGiam(it),', 'khong_giam: false,', 1)], r'✗ F1 ', 'V2'),
  ('VS-V2-MA-TOI-THIEU-SUBTOTAL', [(O, 'codeRecord.min_order > 0 && tienMonThuong < codeRecord.min_order', 'codeRecord.min_order > 0 && subtotal < codeRecord.min_order', 1)], r'✗ F6 ', 'V2'),
  ('BV-V2-MA-KHONG-MON-THUONG', [(O, 'if (codeValid && tienMonThuong <= 0) {', 'if (false) {', 1)], r'✗ F3 ', 'V2'),
  ('BV-V2-NAP-VOUCHER', [(O, ' || (Array.isArray(vouchers) && vouchers.length)) {', ') {', 1)], r'✗ F4 ', 'V2'),
  ('BV-V2-TONG-BO-VOUCHER', [(O, '- giamVoucher + phiKhachTra,', '+ phiKhachTra,', 1)], r'✗ C1 ', 'V2'),
  ('VS-V2-SHIP-COT-GOC', [(O, "maGhiDon?.code || null, phiKhachTra,", "maGhiDon?.code || null, finalShippingFee,", 1)], r'✗ E1 ', 'V2'),
  ('VS-V2-CHUYEN-PHI-GOC', [(O, 'bp: { ...baoPhiGiao, phi: phiKhachTra }', 'bp: baoPhiGiao', 1)], r'✗ E4 ', 'V2'),
  ('BV-V2-CO-MON-THUONG', [(O, 'giam_ship, giam_mon_thuong,\n', 'giam_ship,\n', 1), (O, '?, ?, ?, ?, ?, 1, \'completed\'', '?, ?, ?, ?, ?, \'completed\'', 1)], r'✗ F7 ', 'V2'),
  ('BV-V2-TIEU-VI', [(O, "WHERE id = ? AND status = 'available'`, [orderId, now, uuDai.giam_voucher[i], v.grant_id]", "WHERE id = ?`, [orderId, now, uuDai.giam_voucher[i], v.grant_id]", 1)], r'✗ G4b ', 'V2'),
  ('BV-V2-TIEU-LUOT', [(O, 'WHERE id = ? AND is_active = 1 AND (COALESCE(usage_limit, 0) <= 0 OR used_count < usage_limit)`', 'WHERE id = ? AND is_active = 1`', 1)], r'✗ G4c ', 'V2'),
  ('BV-V2-K5-O-MA', [(O, 'const giamOMa = vOMa && !vOMa.ship ? uuDai.giam_voucher[dsVoucher.indexOf(vOMa)] : 0;', 'const giamOMa = 0;', 1)], r'✗ H3 ', 'V2'),
  ('BV-V2-O-MA-MEM', [(O, '      kv.loi = kv.loi.filter((x) => x !== l);\n', '', 1)], r'✗ H3c ', 'V2'),
  # ── uuDai.js tinhVoucher ──
  ('VS-V2-PHAN-TRAM-TRUOC', [(U, "for (const loai of ['fixed', 'percent'])", "for (const loai of ['percent', 'fixed'])", 1)], r'✗ C1 ', 'V2'),
  ('VS-V2-SHIP-KHONG-KEP', [(U, '    g = Math.min(g, phi);\n', '', 1)], r'✗ E1 ', 'V2'),
  ('VS-V2-MA-TREN-THE', [(U, 's + (d.khong_giam ? 0 : d.unit_price * d.quantity)', 's + d.unit_price * d.quantity', 1)], r'✗ F1 ', 'V2'),
  # ── tienDaTra.js ──
  ('BV-V2-TRA-VOUCHER', [(T, 'WHERE UPPER(code) IN (SELECT UPPER(code) FROM pos_voucher_grants WHERE used_order_id = ?) AND UPPER(code) <> UPPER(?)`',
                          'WHERE 0 AND UPPER(code) IN (SELECT UPPER(code) FROM pos_voucher_grants WHERE used_order_id = ?) AND UPPER(code) <> UPPER(?)`', 1)], r'✗ G1 ', 'V2'),
  ('VS-V2-TRA-HAI-LAN', [(T, ' AND UPPER(code) <> UPPER(?)`, [order.id, order.discount_code || \'\']', '`, [order.id]', 1)], r'✗ G5 ', 'V2'),
  ('BV-V2-THOAT-SOM', [(T, 'async function traLuotMa(tx, order) {\n', 'async function traLuotMa(tx, order) {\n  if (!order.discount_code) return;\n', 1)], r'✗ G1b ', 'V2'),
  ('BV-V2-DA-TRA-CHIA-DEU', [(T, 'Number(order.giam_mon_thuong) === 1 && Number(d.product_id) < 0', 'false', 1)], r'✗ F7 ', 'V2'),
  # ── voucherCode.js / loyalty.js / rewards.js ──
  ('VS-V2-HAN-TU-MAU', [(V, 'addDaysToDateString(now, Number(mau.han_ngay))', 'addDaysToDateString(now, 30)', 1)], r'✗ B1 ', 'V2'),
  ('VS-V2-CHUP-LUAT', [(V, "Number(mau.don_toi_thieu) || 0, Number(mau.tran) || 0, now.slice(0, 10)", "0, Number(mau.tran) || 0, now.slice(0, 10)", 1)], r'✗ B1 ', 'V2'),
  ('BV-V2-PHAT-NGUON', [(L, "phone, 'doi_diem',", "phone, 'tay',", 1)], r'✗ B2 ', 'V2'),
  ('BV-V2-MAU-QUYEN', [(R, "router.post('/mau', authenticate, checkPermission('manage_promotions'),", "router.post('/mau', authenticate,", 1)], r'✗ A1 ', 'V2'),
  ('VS-V2-MO-TA-TRAN', [(V, "laPhanTram(m.kieu) && Number(m.tran) > 0 ?", "Number(m.tran) > 0 ?", 1)], r'✗ A2 moTa', 'V2'),
  # ── hoaDon.js / donApp.js ──
  ('BV-V2-HOA-DON-VOUCHER', [(H, '...(vouchers.length ? { vouchers } : {}),', '', 1)], r'✗ I2 ', 'V2'),
  ('VS-V2-HOA-DON-PHI-GOC', [(H, 'const phiGiao = so(o.shipping_fee);', 'const phiGiao = so(o.shipping_fee) + giamShip;', 1)], r'✗ I2 ', 'V2'),
  ('BV-V2-APP-VOUCHER', [(D, '...(vouchers.length ? { vouchers } : {}),', '', 1)], r'✗ H2 ', 'V2'),
  ('VS-V2-APP-BAM-CU', [(D, "...(Array.isArray(b.vouchers) && b.vouchers.length ? [b.vouchers] : [])", "b.vouchers ?? null", 1)], r'✗ K1 ', 'KHTHE1'),
  ('BV-V2-APP-SAI-DANG', [(D, "  if (b.vouchers != null && !(Array.isArray(b.vouchers)", "  if (false && !(Array.isArray(b.vouchers)", 1)], r'✗ H5 ', 'V2'),
  # ── Q2 (13.11): mã bill → voucher theo mẫu cho khách đăng ký lần đầu — signup-codes.js / orders.js / discount-codes.js / settings.js ──
  ('BV-V2-KHACH-CU', [(S, 'if (loiKhach) return res.status', 'if (false) return res.status', 1)], r'✗ Q2b ', 'V2'),
  ('VS-V2-KHACH-CU-SO-NHAM', [(S, "REPLACE(created_at, ' ', 'T') >= REPLACE(?, ' ', 'T')", "REPLACE(created_at, ' ', 'T') > REPLACE(?, ' ', 'T')", 1)], r'✗ Q2a2 ', 'V2'),
  ('VS-V2-KHACH-CU-CHUOI-THO', [(S, "REPLACE(created_at, ' ', 'T') >= REPLACE(?, ' ', 'T')", "created_at >= ?", 1)], r'✗ Q2a3 ', 'V2'),
  # ── signup-codes.js kiemKhachLanDau Q18 (Q21 14.11): hồ sơ ≤ 30 phút trước bill của chính SĐT, chưa có đơn trước ──
  ('BV-V2-Q18-MOC', [(S, 'if (!Number(kh.sau_bill) && !(Number(kh.trong_moc) && await laDonDauCuaKhach(phone, dong))) {', 'if (!Number(kh.sau_bill)) {', 1)], r'✗ Q18a ', 'V2'),
  ('VS-V2-Q18-KHONG-TRAN', [(S, '!(Number(kh.trong_moc) && await laDonDauCuaKhach', '!(await laDonDauCuaKhach', 1)], r'✗ Q18c ', 'V2'),
  ('VS-V2-Q18-MOC-NGAT', [(S, "REPLACE(created_at, ' ', 'T') >= ? AS trong_moc", "REPLACE(created_at, ' ', 'T') > ? AS trong_moc", 1)], r'✗ Q18b ', 'V2'),
  ('VS-V2-Q18-MOC-PHUT', [(S, 'ms - PHUT_HO_SO_TRUOC_BILL * 60000', 'ms - (PHUT_HO_SO_TRUOC_BILL + 1) * 60000', 1)], r'✗ Q18c ', 'V2'),
  ('BV-V2-Q18-DON-TRUOC', [(S, 'customer_phone = ? AND id < ? LIMIT 1', 'customer_phone = ? AND 0 AND id < ? LIMIT 1', 1)], r'✗ Q18d ', 'V2'),
  ('VS-V2-Q18-DON-KHAC', [(S, 'customer_phone = ? AND id < ? LIMIT 1', 'customer_phone = ? AND id <> ? LIMIT 1', 1)], r'✗ Q18f ', 'V2'),
  ('BV-V2-Q18-BILL-SDT', [(S, "  if (!dong.order_customer_phone || normalizePhone(dong.order_customer_phone) !== phone) return false;\n", '', 1)], r'✗ Q18e ', 'V2'),
  ('BV-V2-MAU-TAT',[(S, "WHERE id = ? AND bat = 1'", "WHERE id = ?'", 1)], r'✗ Q2h ', 'V2'),
  ('BV-V2-RESET-GRANT', [(S, "WHERE g.nguon = 'khach_moi' AND g.nguon_id = ? ORDER BY g.id DESC LIMIT 1`", "WHERE 0 AND g.nguon_id = ? ORDER BY g.id DESC LIMIT 1`", 1)], r'✗ Q2e ', 'V2'),
  ('BV-V2-P20B-VOUCHER', [(V, "  if (loiGoc) return ['MA_DON_GOC_KHONG_HOP_LE', loiGoc.error];\n", '', 1)], r'✗ Q2i ', 'V2'),
  ('VS-V2-P20B-O-MA-MEM', [(O, '      if (l.code === "MA_DON_GOC_KHONG_HOP_LE") return res.status(400)', '      if (false) return res.status(400)', 1)], r'✗ Q2i ', 'V2'),
  ('BV-V2-VALIDATE-P20B', [(DC, 'const maBill = await maBillCuaVoucher(discountCode.code);',
                            "const maBill = await queryOne('SELECT order_id FROM pos_signup_codes WHERE UPPER(code) = UPPER(?) AND claimed_at IS NOT NULL', [discountCode.code]);", 1)], r'✗ Q2i ', 'V2'),
  ('BV-V2-DOI-TEN-VOUCHER', [(DC, "\n        || await queryOne(\"SELECT id FROM pos_voucher_grants WHERE nguon = 'khach_moi' AND UPPER(code) = UPPER(?)\", [existing.code])", '', 1)], r'✗ Q2n ', 'V2'),
  ('BV-V2-CAI-MAU-KM', [(ST, "if ('signup_mau_voucher_id' in settings &&", "if (false &&", 1)], r'✗ Q2l ', 'V2'),
  ('BV-V2-THEM-KHACH-MA', [(KJ, "await api.post('/signup-codes/claim', { code: maBill, phone: formData.phone })", "({})", 1)], r'✗ Q2k ', 'V2'),
  # ── Q14 (13.11): Bán hàng + tờ bill quầy / hoá đơn App ──
  ('VS-V2-HD-GOP-VOUCHER', [(CH, "const giamMa = (tien.giam_ma || 0) - vc.reduce((s, v) => s + v.so_tien, 0);", "const giamMa = tien.giam_ma || 0;", 1)], r'✗ Q14d bill', 'V2'),
  ('VS-V2-HD-PHI-KHACH-TRA', [(CH, "dinhDangTien((tien.phi_giao || 0) + giamShip)", "dinhDangTien(tien.phi_giao || 0)", 1)], r'✗ Q14d bill', 'V2'),
  ('BV-V2-HD-BO-DONG', [(CH, "  if (hien('giam_ma')) vc.forEach", "  if (false) vc.forEach", 1)], r'✗ Q14e ', 'V2'),
  ('BV-V2-TINH-GUI-VOUCHER', [(TJ, "    ...(vouchers.length ? { vouchers } : {}),   // VOUCHER-2", "    // VOUCHER-2", 1)], r'✗ Q14a ', 'V2'),
  ('BV-V2-BO-LOI', [(TJ, "return { chon: chon.filter((m) => !(m in loi)), loi };", "return { chon, loi };", 1)], r'✗ Q14b ', 'V2'),
  ('VS-V2-CHIP-KHONG-MO', [(CV, "disabled={!dangChon && chon.length >= toiDa}", "disabled={false}", 1)], r'✗ Q14c ', 'V2'),
  # ── vòng sửa 1 (14.11), lỗi soát (1): phá MÀN THẬT như người soát đã phá (chip không hiện, ô mã không gọi máy chủ, phiên thu bỏ voucher, màn mẫu) ──
  ('BV-V2-CHIP-AN', [(BM, '{!laNap && <ChipVoucher vi={viVoucher}', '{false && <ChipVoucher vi={viVoucher}', 1)], r'✗ Q14c Bán hàng', 'V2'),
  ('BV-V2-VI-VOUCHER', [(BM, 'setViVoucher(r.data || [])', 'setViVoucher([])', 1)], r'✗ Q14c Bán hàng', 'V2'),
  ('BV-V2-PHIEN-BO-VOUCHER', [(BM, 'vouchers: laNap ? [] : vcChon });', 'vouchers: [] });', 1)], r'✗ Q14c thu tiền', 'V2'),
  ('VS-V2-LOI-KHONG-DO', [(BM, 'setVcLoi((l) => ({ ...l, ...b.loi }));', '', 1)], r'✗ Q14c voucher máy chủ từ chối', 'V2'),
  ('BV-V2-MAU-KHONG-LUU', [(MV, ": await api.post('/rewards/mau', thanGui(form));", ': {};', 1)], r'✗ A4 màn Mẫu voucher \(thật\): Thêm mẫu', 'V2'),
  ('VS-V2-MAU-XEM-TU-DUNG', [(MV, "setXem((await api.post('/rewards/mau/mo-ta', thanGui(form))).mo_ta);", 'setXem(form.ten);', 1)], r'✗ A4 màn Mẫu voucher \(thật\): Thêm mẫu', 'V2'),
  ('BV-V2-MAU-TOI-DA', [(MV, "await api.put('/settings', { settings: { voucher_toi_da: toiDa } });", '', 1)], r'✗ A4 màn Mẫu voucher \(thật\): "Tối đa', 'V2'),
  ('BV-V2-CHON-MAU-KM', [(MV, "await api.put('/settings', { settings: { signup_mau_voucher_id: v } });", '', 1)], r'✗ Q2m ', 'V2'),
  # ── vòng sửa 1, lỗi soát (4): loại voucher trả App theo mẫu; Q2j bước 026 (gốc thật e3ef76a) ──
  ('VS-V2-SCOPE-CUNG', [(S, "scope: laShip(mau.kieu) ? 'ship' : (mau.ap_dung || 'tat_ca') !== 'tat_ca' ? 'item' : 'order',", "scope: 'order',", 1)], r'✗ Q2o ', 'V2'),
  ('VS-V2-026-GIAM-MON', [(N26, "cfg.signup_scope === 'item' || ", '', 1)], r'✗ Q2j ', 'V2'),
  # ── Q16 (13.11): phiên chờ chuyển khoản giữ voucher ──
  ('BV-V2-GIU-TRONG-TX', [(O, 'const dangGiu = await voucherDangGiu(tx, dsVoucher.map((v) => v.code), phien?.id);', 'const dangGiu = [];', 1)], r'✗ Q16d đua — phiên chen', 'V2'),
  ('BV-V2-GIU-PHIEN-TX', [('server/utils/giuCho.js', '    if (CACH_GIU_VOUCHER.includes(cach)) {', '    if (false) {', 1)], r'✗ Q16d đua ngược', 'V2'),
  ('VS-V2-GIU-CA-CHINH-NO', [(O, 'boPhienId: phien?.id || null });', 'boPhienId: null });', 1)], r'✗ Q16a CHÍNH', 'V2'),
  ('VS-V2-HAN-HOM-NAY', [(O, 'homNay: phien?.taoLuc ? String(phien.taoLuc).slice(0, 10) : getToday(),', 'homNay: getToday(),', 1)], r'✗ Q16c voucher HẾT HẠN', 'V2'),
  ('VS-V2-GIU-KHONG-NHA-HUY', [(V, "WHERE trang_thai = 'cho' AND het_han > ?", "WHERE trang_thai IN ('cho', 'huy') AND het_han > ?", 1)], r'✗ Q16b ', 'V2'),
  ('VS-V2-GIU-KHONG-NHA-HAN', [(V, "WHERE trang_thai = 'cho' AND het_han > ?", "WHERE trang_thai = 'cho' AND ? IS NOT NULL", 1)], r'✗ Q16b ', 'V2'),
  ('BV-V2-GIU-O-MA', [(V, "(Array.isArray(t.vouchers) ? t.vouchers : []), t.discount_code]", "(Array.isArray(t.vouchers) ? t.vouchers : [])]", 1)], r'✗ Q16e ', 'V2'),
  ('BV-V2-GIU-O-MA-MEM', [(O, 'if (l.code === "VOUCHER_DANG_GIU" && !phien?.tinhThu) return', 'if (false) return', 1)], r'✗ Q16a phiên ck_tay', 'V2'),
  ('BV-V2-XET-GIU', [(V, "if ((await voucherDangGiu(require('../database'), [v.code], boPhienId)).length) {", 'if (false) {', 1)], r'✗ Q16a phiên ck_tay', 'V2'),
  # ── Q17 (13.11): MỘT phép "còn dùng được" cho ví + lúc bán ──
  ('BV-V2-VI-RIENG', [('server/utils/diemKhach.js', 'const loi = await xetVoucherConDung(v, { phone });',
                       "const loi = (v.used_count || 0) > 0 ? ['VOUCHER_DA_DUNG'] : (v.expires_at && v.expires_at < getNow().slice(0, 10)) ? ['VOUCHER_HET_HAN'] : null;", 1)],
   r'✗ Q17a ', 'V2'),
  ('VS-V2-XET-HAN-GRANT', [(V, "if ((v.valid_from && ngay < v.valid_from) || (v.valid_to && ngay > v.valid_to))", "if (v.expires_at && ngay > v.expires_at)", 1)], r'✗ Q17a ', 'V2'),
  # ── Q19 (13.11): Đối soát ngày — tiền voucher đã giảm + giảm phí giao ──
  ('BV-V2-DS-VOUCHER', [('server/utils/doiSoat.js', 'voucher: { da_giam: so(vc[0].vc), giam_phi_giao: so(vc[0].ship) },', '', 1)], r'✗ Q19 máy chủ', 'V2'),
  ('VS-V2-DS-TINH-SHIP', [('server/utils/doiSoat.js', "WHERE o.status = 'completed' AND COALESCE(d.giam_ship, 0) = 0 AND", "WHERE o.status = 'completed' AND", 1)], r'✗ Q19 máy chủ', 'V2'),
  ('BV-V2-DS-MAN', [('client/src/components/DoiSoat.jsx', '{t?.voucher && (', '{false && (', 1)], r'✗ Q19 màn', 'V2'),
  # ── Q15 (14.11): phép E9 bộ kiểm nhận phatVoucher(tx, …) — phát TRƯỚC câu chặn phải đỏ (chạy bộ kiểm trên bản chép CẢ kho) ──
  ('VS-V2-E9-PHAT-TRUOC', [(S, "      phat = await phatVoucher(tx, mau, phone, 'khach_moi', { nguon_id: signupRow.id, ghi_chu: `Ưu đãi khách mới — mã bill ${signupRow.code}` });\n      await tx.commit();",
                            "      await tx.commit();", 1),
                           (S, "      if (!chiem || chiem.changes !== 1) {\n        await tx.rollback();",
                            "      phat = await phatVoucher(tx, mau, phone, 'khach_moi', { nguon_id: signupRow.id });\n      if (!chiem || chiem.changes !== 1) {\n        await tx.rollback();", 1)],
   r'✗ /claim: chiếm mã bằng UPDATE', 'KIEM'),
]

BAI = {'V2': 'thu_VOUCHER2.js', 'KHTHE1': 'thu_KHTHE1.js', 'P26c': 'thu_P26c.js', 'UUDAI1': 'thu_UUDAI1.js', 'KIEM': 'kiem_tra_truoc_khi_giao.js'}
E9_XANH = '✓ /claim: chiếm mã bằng UPDATE'   # đối chứng bài KIEM: bản chép không đột biến phải có phép E9 XANH (cả bộ không xanh được ngoài git)


def ban_sao(thay, ca_kho=False):
  """Chép server/ + client/src/ (bài KIEM: CẢ kho trừ .git / node_modules) ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_voucher2_')
  if ca_kho:
    shutil.copytree(GOC, tmp, dirs_exist_ok=True, ignore=shutil.ignore_patterns('node_modules', '.git'))
  else:
    shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
    shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
    shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))   # Đối soát (doiSoat.js) nạp bat_bien.js tương đối
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


def lenh(tmp, bai):
  if bai == 'KIEM':
    return ['node', os.path.join(tmp, BAI[bai])]
  return ['node', os.path.join(GOC, 'cong_cu', BAI[bai]), '--may-chu', os.path.join(tmp, 'server')]


def chay_bai(tmp, bai):
  r = subprocess.run(lenh(tmp, bai), cwd=tmp if bai == 'KIEM' else GOC, capture_output=True, text=True, timeout=900 if bai == 'KIEM' else 400)
  return r, re.sub(r'\x1b\[\d+m', '', (r.stdout or '') + (r.stderr or ''))


TONG = r'\d+ đạt · \d+ hỏng|PASS \d+\s+·\s+FAIL \d+'


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay, bai == 'KIEM')
  try:
    if loi:
      return ten, 'HỎNG', loi
    r, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(TONG, ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 400 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai):
  tmp, _ = ban_sao([], bai == 'KIEM')
  try:
    r, ra = chay_bai(tmp, bai)
    if bai == 'KIEM':
      return E9_XANH in ra and re.search(TONG, ra) is not None, (E9_XANH if E9_XANH in ra else 'phép E9 không xanh: ' + ra[-200:])
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for d in DOT_BIEN: print(f'{d[0]:32} → {BAI[d[3]]} · mẫu {d[2]}')
    sys.exit(0)
  ten = [a for a in sys.argv[1:] if not a.startswith('--')]
  lam = [d for d in DOT_BIEN if not ten or d[0] in ten]
  if ten and len(lam) != len(set(ten)):
    print('✗ tên lạ: ' + ', '.join(sorted(set(ten) - {d[0] for d in lam}))); sys.exit(2)
  for bai in sorted({d[3] for d in lam}):
    ok, tom = doi_chung(bai)
    print(f'ĐỐI CHỨNG {BAI[bai]} (bản sao chưa đột biến): {"xanh" if ok else "ĐỎ"} — {tom}')
    if not ok:
      print('✗ đối chứng đỏ — kết quả đột biến vô nghĩa'); sys.exit(2)
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), lam))
  for t, tt, ly in kq: print(f'  {tt:5} {t:32} {ly}')
  bat = sum(1 for _, tt, _ in kq if tt == 'BẮT')
  print(f'\nĐỘT BIẾN VOUCHER-2: {bat}/{len(kq)} bị bắt')
  sys.exit(0 if bat == len(kq) else 1)
