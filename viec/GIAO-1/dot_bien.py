#!/usr/bin/env python3
"""GIAO-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/GIAO-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/GIAO-1/dot_bien.py --help

Khuôn viec/SEPAY-1/dot_bien.py: chép server/, cong_cu/gia_lap/, bài thử và bộ kiểm (phép T2) ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối
symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso, Ahamove thật (bài thử dùng Ahamove giả trong tiến trình).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GH, AH, RG, OR = 'server/utils/giaoHang.js', 'server/utils/ahamove.js', 'server/routes/giao-hang.js', 'server/routes/orders.js'
GC, RF, ST = 'server/utils/giuCho.js', 'server/routes/refunds.js', 'server/routes/settings.js'
BAI = {'g1': 'cong_cu/thu_GIAO1.js'}
CHEP = list(BAI.values()) + ['kiem_tra_truoc_khi_giao.js']

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── D: phí ship do máy chủ quyết, thu đủ trước, một báo phí — một đơn ──
  ('VS-phi-man-hinh', 'g1', [(OR, 'baoPhiGiao ? baoPhiGiao.phi : Math.max(0, Number(shipping_fee) || 0)', 'Math.max(0, Number(shipping_fee) || 0)', 1)], r'✗ D1 '),
  ('VS-phi-don-thuong-0', 'g1', [(OR, 'baoPhiGiao ? baoPhiGiao.phi : Math.max(0, Number(shipping_fee) || 0)', 'baoPhiGiao ? baoPhiGiao.phi : 0', 1)], r'✗ K5a '),
  ('BV-giao-thu-du', 'g1', [(OR, '      if (debt_amount > 0) return res.status(400).json({ error: "Đơn giao phải thu đủ tiền trước khi giao", code: "GIAO_PHAI_THU_DU" });\n', '', 1)], r'✗ D8 '),
  ('BV-dung-mot-lan', 'g1', [(GH, "  if (bp.order_id != null) return", "  if (false) return", 1),
    (GH, "WHERE ma = ? AND order_id IS NULL', [orderId, bp.ma]", "WHERE ma = ?', [orderId, bp.ma]", 1)], r'✗ D4 dùng lại'),
  ('BV-han-bao-phi', 'g1', [(GH, '!boQuaHan && bp.het_han <= getNow()', 'false', 1)], r'✗ D5 '),
  ('VS-han-khi-chot', 'g1', [(OR, 'boQuaHan: !!phien && !phien.chiTinh', 'boQuaHan: false', 1)], r'✗ D9 '),
  ('BV-giuCho-giao', 'g1', [(GC, "'membership_buy', 'giao'];", "'membership_buy'];", 1)], r'✗ D9 '),
  # ── B · C: cài đặt, ô địa chỉ, km ──
  ('BV-cai-dat-giao', 'g1', [(ST, "    if (loiGiao) return res.status(400)", "    if (false) return res.status(400)", 1)], r'✗ B2 '),
  ('VS-goi-y-nhan-chu', 'g1', [(GH, '  if (aha.coGoiY()) {\n', '  if (aha.coGoiY() && ma) {\n', 1)], r'✗ C1 cách 1 bật'),
  ('VS-km-bang-la-qua', 'g1', [(GH, 'bp.km > cd.km_toi_da', 'bp.km >= cd.km_toi_da', 1)], r'✗ C2 '),
  ('VS-moi-truong-khong-trim', 'g1', [(AH, ".trim().toLowerCase() === 'production'", ".toLowerCase() === 'production'", 1)], r'✗ A5 AHAMOVE_MOI_TRUONG'),
  # ── G · I: gọi xe một lần, kiểm theo mã trước khi tạo lại, tìm lại ──
  ('BV-gianh-goi-xe', 'g1', [(GH, "  if (g.changes !== 1) return loi(409, 'DANG_GOI_XE'", "  if (false) return loi(409, 'DANG_GOI_XE'", 1)], r'✗ G(2|3) '),
  ('BV-tra-theo-ma', 'g1', [(GH, '    if (tn) {\n', '    if (false) {\n', 1)], r'✗ G4 bấm lại'),
  ('VS-chua-thu-van-goi', 'g1', [(GH, "  if (o.payment_status !== 'paid') return", "  if (false) return", 1)], r'✗ G1 '),
  ('BV-chenh', 'g1', [(GH, "phi_that = ?, chenh = ? - phi_khach,", "phi_that = ?, chenh = ? * 0,", 1)], r'✗ G5 '),
  ('BV-tim-lai-huy-cu', 'g1', [(GH, "  if (['tim_xe', 'dang_goi'].includes(c.trang_thai) && c.ma_ahamove) {", "  if (false) {", 1)], r'✗ I4 '),
  ('BV-tu-tim-mot-lan', 'g1', [(GH, '!d.nguoi_huy_la_quan && !c.tu_tim_lai', '!d.nguoi_huy_la_quan', 1)], r'✗ I2 tài xế huỷ lần nữa'),
  # ── H: tin báo về ──
  ('BV-khoa-bao', 'g1', [(RG, "typeof nhan !== 'string' || !crypto.timingSafeEqual(bam(nhan), bam(khoa))", "typeof nhan !== 'string'", 1)], r'✗ H1 '),
  ('VS-tin-than-tin', 'g1', [(GH, 'try { d = await aha.docChuyen(ma); }', 'try { d = await aha.docChuyen(ma); if (d) d.trang_thai = String(b.status); }', 1)], r'✗ H4 '),
  ('BV-chong-lap', 'g1', [(GH, "`${d.diem_giao}|${d.tai_xe.sdt || ''}`, getNow()]", "`${d.diem_giao}|${Math.random()}`, getNow()]", 1)], r'✗ H3 '),
  ('VS-chong-lap-bo-tai-xe', 'g1', [(GH, "`${d.diem_giao}|${d.tai_xe.sdt || ''}`, getNow()]", 'd.diem_giao, getNow()]', 1)], r'✗ H11 '),
  ('VS-tin-lui', 'g1', [(GH, 'HANG[moi] > HANG[c.trang_thai]', 'HANG[moi] !== HANG[c.trang_thai]', 1)], r'✗ H8 '),
  ('BV-doi-tai-xe-ve-tim', 'g1', [(GH, " || (c.trang_thai === 'doi_tai_xe' && moi === 'tim_xe')", '', 1)], r'✗ H11 '),
  ('BV-in-tem-mot-may', 'g1', [(GH, "lan_in_tem = 1 WHERE order_id = ? AND in_tem_luc IS NULL'", "lan_in_tem = 1 WHERE order_id = ?'", 1)], r'✗ H9 '),
  # ── J: huỷ theo bước, xoá, hoàn ──
  ('BV-cong-huy', 'g1', [(OR, '        if (huyGiao?.loi) {', '        if (false) {', 1)], r'✗ J1 '),
  ('VS-chan-don-thuong', 'g1', [(GH, '  if (!c) return null;\n', "  if (!c) return laQuanLy(user) ? null : { loi: { status: 403, body: { error: 'x', code: 'PERMISSION_DENIED' } } };\n", 1)], r'✗ K5b '),
  ('BV-cho-huy-1', 'g1', [(GH, 'Number(order.cash_amount) > 0 || Number(order.transfer_amount) > 0', 'false', 1)], r'✗ J4 '),
  ('BV-bo-di-kho', 'g1', [(OR, '(huyGiao?.doDaPha === "bo_di" ? [] : orderItems)', 'orderItems', 1)], r'✗ J3b '),
  ('BV-quyen-huy-chuyen', 'g1', [(GH, "  if (!laQuanLy(user)) return loi(403, 'PERMISSION_DENIED', 'Huỷ chuyến", "  if (false) return loi(403, 'PERMISSION_DENIED', 'Huỷ chuyến", 1)], r'✗ J5 đợi tài xế'),
  ('BV-xoa-don-giao', 'g1', [(OR, '      if (chanGiao) {', '      if (false) {', 1)], r'✗ J8 '),
  ('BV-hoan-don-giao', 'g1', [(RF, '      if (await donGiaoDangChay(tx, order.id)) return DON_GIAO_DANG_CHAY;\n', '', 1)], r'✗ Q5 '),
  # ── vòng sửa 1 (soát vòng 1): treo, dấu giữ quyền, huỷ khi đang giao, phí huỷ Tìm lại, xoá đơn đã gọi xe, hoàn đóng chuyến, đọc lại ──
  ('BV-treo-goi-lai', 'g1', [(GH, "(trang_thai = 'dang_goi' AND (loi_mang = 1 OR goi_luc < ?))", "(trang_thai = 'dang_goi' AND (loi_mang = 1 OR goi_luc < ? AND 0))", 1)], r'✗ G8 '),
  ('BV-co-treo', 'g1', [(GH, "treo: c.trang_thai === 'dang_goi' && (", "treo: false && (", 1)], r'✗ G8 '),
  ('BV-dau-giu-quyen', 'g1', [(GH, "const giu = \"id = ? AND trang_thai = 'dang_goi' AND goi_luc = ?\";", "const giu = \"id = ? AND trang_thai = 'dang_goi' AND (goi_luc = ? OR 1)\";", 1)], r'✗ G9 '),
  ('BV-huy-dang-giao', 'g1', [(GH, "    if (c.trang_thai === 'dang_giao') {   // huỷ khi tài xế ĐÃ lấy hàng", "    if (false) {   // huỷ khi tài xế ĐÃ lấy hàng", 1)], r'✗ I5 '),
  ('BV-phi-huy-tim-lai', 'g1', [(GH, '    if (daHuy) await ghiPhiHuyLenh(c.id, c.ma_ahamove, cu);', '    if (daHuy) {}', 1)], r'✗ I4b '),
  ('BV-xoa-da-goi-xe', 'g1', [(GH, '  if (c?.ma_ahamove) return { loi:', '  if (false) return { loi:', 1)], r'✗ J8b '),
  ('BV-hoan-dong-chuyen', 'g1', [(RF, '      await dongChuyenKhiHoan(tx, refund.order_id, now);', '', 1)], r'✗ Q5b '),
  ('BV-doc-lai-du-phong', 'g1', [(GH, '    if (doiLai >= DOC_LAI_TOI_DA) break;', '    break;', 1)], r'✗ H12 '),
  # ── vòng sửa 4 (chủ quán Q6 06.11): nhận lại chuyến cũ còn chạy, phí huỷ chỉ khi lệnh huỷ của quán thành công, Đóng thẻ giao lỗi ──
  ('BV-nhan-lai-chuyen-cu', 'g1', [(GH, "    } else if (cu) {\n      return nhanLaiChuyenCu(c, cu, now);", "    } else if (false) {\n      return nhanLaiChuyenCu(c, cu, now);", 1)], r'✗ (G8b|G8c|I6) '),
  ('VS-nhan-lai-khi-da-huy', 'g1', [(GH, "    } else if (cu?.trang_thai === 'CANCELLED') {", "    } else if (false) {", 1)], r'✗ (J5e|V3|V7) '),
  ('VS-nhan-lai-khong-ap-trang-thai', 'g1', [(GH, "  await capNhatTuAhamove({ ...(await docChuyenDon(c.order_id)) }, cu);\n", '', 1)], r'✗ (G8b|G8c|I6) '),
  ('VS-phi-huy-moi-lan-doc', 'g1', [(GH, '    if (g.changes === 1 && d.phi_huy) await tx.run(', '    if (d.phi_huy) await tx.run(', 1)], r'✗ (J5e|V2|V3|V5) '),
  ('BV-giu-goi-luc-cu', 'g1', [(GH, "[c.trang_thai, c.goi_luc, c.loi_mang, 'Không đọc được chuyến cũ", "[c.trang_thai, now, c.loi_mang, 'Không đọc được chuyến cũ", 1)], r'✗ GL '),
  ('BV-dong-the', 'g1', [(GH, "  const g = await run(\"UPDATE pos_giao_chuyen SET trang_thai = 'da_dong'", "  const g = await run(\"UPDATE pos_giao_chuyen SET trang_thai = 'giao_loi'", 1)], r'✗ DT '),
  ('VS-dong-the-nhan-vien', 'g1', [(GH, "  if (!laQuanLy(user)) return loi(403, 'PERMISSION_DENIED', 'Đóng thẻ", "  if (false) return loi(403, 'PERMISSION_DENIED', 'Đóng thẻ", 1)], r'✗ DT '),
  ('VS-dong-the-moi-the', 'g1', [(GH, "WHERE order_id = ? AND trang_thai = 'giao_loi'\",", "WHERE order_id = ?\",", 1)], r'✗ DT '),
  ('BV-khong-huy-chuyen-may-thang', 'g1', [(GH, "      if ((await docChuyenDon(c.order_id))?.ma_ahamove !== t.ma) {", "      if (true) {", 1)], r'✗ G9b '),
  ('BV-trang-thai-da-doi', 'g1', [(GH, "  return sau?.trang_thai === 'chuyen_huy' && sau.ma_ahamove === c.ma_ahamove ? { ok: true }", "  return true ? { ok: true }", 1)], r'✗ J5f '),
  # ── vòng sửa 5 (chủ quán Q8 + Q9 07.11): thẻ đã đóng chặn huỷ; phí huỷ theo lệnh quán ghi một lần, tách câu trạng thái; Tìm lại không gọi chuyến mới
  #    khi chuyến vừa bị huỷ; trạng thái màn đang thấy; thẻ treo giữ loi_mang; tin lúc đang gọi không ghi sổ; chống đua nhận lại / trả thẻ về ──
  ('BV-da-dong-chan-huy', 'g1', [(GH, "['dang_giao', 'xong', 'giao_loi', 'da_dong'].includes(c.trang_thai)", "['dang_giao', 'xong', 'giao_loi'].includes(c.trang_thai)", 1)], r'✗ V1 '),
  ('BV-phi-huy-tach-cau-trang-thai', 'g1', [(GH, "  await ghiPhiHuyLenh(c.id, c.ma_ahamove, await aha.docChuyen(c.ma_ahamove).catch(() => undefined));\n", '', 1)], r'✗ (J5 |J5f )'),
  ('BV-cho-phi-huy', 'g1', [(GH, "  : run(\"INSERT OR IGNORE INTO pos_giao_tin (ma_ahamove, trang_thai, phu, luc) VALUES (?, 'CHO_PHI_HUY'", "  : false && run(\"INSERT OR IGNORE INTO pos_giao_tin (ma_ahamove, trang_thai, phu, luc) VALUES (?, 'CHO_PHI_HUY'", 1)], r'✗ V2 '),
  ('BV-doc-lai-phi-huy', 'g1', [(GH, '  await docLaiPhiHuy().catch(', '  if (false) await docLaiPhiHuy().catch(', 1)], r'✗ V2 '),
  ('VS-phi-huy-moi-nguoi-huy', 'g1', [(GH, '    if (d.nguoi_huy_la_quan) await ghiPhiHuy(c.id, d);', '    await ghiPhiHuy(c.id, d);', 1)], r'✗ V8 '),
  ('BV-q9-huy-theo-lenh-quan', 'g1', [(GH, '    if (d.nguoi_huy_la_quan) await ghiPhiHuy(c.id, d);', '    if (false) await ghiPhiHuy(c.id, d);', 1)], r'✗ (V5|V6) '),
  ('BV-tim-lai-chuyen-da-huy', 'g1', [(GH, "      if (c.trang_thai === 'tim_xe') {\n        const v = await run(", "      if (false) {\n        const v = await run(", 1)], r'✗ (V3|V7) '),
  ('BV-huy-chuyen-the-da-huy', 'g1', [(GH, "  return sau?.trang_thai === 'chuyen_huy' && sau.ma_ahamove === c.ma_ahamove ? { ok: true }", "  return false ? { ok: true }", 1)], r'✗ V3 '),
  ('BV-tu-trang-thai', 'g1', [(GH, '  if (tu != null && tu !== c.trang_thai) return', '  if (false) return', 1)], r'✗ V4 '),
  ('BV-giu-loi-mang', 'g1', [(GH, "[c.trang_thai, c.goi_luc, c.loi_mang, 'Không đọc được chuyến cũ", "[c.trang_thai, c.goi_luc, 0, 'Không đọc được chuyến cũ", 1)], r'✗ V9 '),
  ('BV-tin-khi-dang-goi', 'g1', [(GH, "  if (c.trang_thai === 'dang_goi') return loi(409, 'DANG_GOI_XE', 'Thẻ đang gọi xe", "  if (false) return loi(409, 'DANG_GOI_XE', 'Thẻ đang gọi xe", 1)], r'✗ V10 '),
  ('VS-nhan-lai-bo-goi-luc', 'g1', [(GH, '    AND goi_luc = ? AND ma_ahamove = ?`, [getNow(), c.id, khoa, cu.ma]);', '    AND ? IS NOT NULL AND ma_ahamove = ?`, [getNow(), c.id, khoa, cu.ma]);', 1)], r'✗ V11 '),
  ('VS-nhan-lai-bo-ma', 'g1', [(GH, '    AND goi_luc = ? AND ma_ahamove = ?`, [getNow(), c.id, khoa, cu.ma]);', '    AND goi_luc = ? AND ? IS NOT NULL`, [getNow(), c.id, khoa, cu.ma]);', 1)], r'✗ V12 '),
  ('BV-nhan-lai-changes', 'g1', [(GH, "  if (n.changes !== 1) return loi(409, 'DANG_GOI_XE', 'Máy khác đã gọi lại chuyến này — xem trạng thái trên thẻ');\n  await capNhatTuAhamove", "  if (false) return loi(409, 'DANG_GOI_XE', 'Máy khác đã gọi lại chuyến này — xem trạng thái trên thẻ');\n  await capNhatTuAhamove", 1)], r'✗ V11 '),
  ('VS-tra-ve-bo-dieu-kien', 'g1', [(GH, "AND trang_thai = 'dang_goi' AND goi_luc = ?\",\n        [c.trang_thai, c.goi_luc, c.loi_mang", "AND ? IS NOT NULL\",\n        [c.trang_thai, c.goi_luc, c.loi_mang", 1)], r'✗ V13 '),
  # ── K: Đối soát ──
  ('VS-bu-du-triet-tieu', 'g1', [(GH, '? Math.max(0, Number(x.chenh || 0)) : 0)', '? Number(x.chenh || 0) : 0)', 1)], r'✗ K1 '),
  ('VS-doi-soat-moi-chuyen', 'g1', [(GH, "phi_that: tong((x) => (daChay(x) ? Number(x.phi_that || 0) : 0)),", "phi_that: tong((x) => Number(x.phi_that || 0)),", 1)], r'✗ K1 '),
  ('VS-doi-soat-theo-trang-thai', 'g1', [(GH, "const daChay = (x) => !!(x.lay_hang_luc || x.xong_luc);", "const daChay = (x) => ['dang_giao', 'xong', 'giao_loi'].includes(x.trang_thai);", 1)], r'✗ K1 '),
  # ── vòng sửa 2 (soát vòng 2): treo còn chuyến cũ, đổi tài xế cùng hạng, giao_loi có lối ra, không huỷ chuyến máy thắng đã nhận ──
  ('BV-treo-huy-chuyen-cu', 'g1', [(GH, "  if (['tim_xe', 'dang_goi'].includes(c.trang_thai) && c.ma_ahamove) {", "  if (c.trang_thai === 'tim_xe' && c.ma_ahamove) {", 1)], r'✗ G8b '),
  ('BV-doi-tai-xe-cung-hang', 'g1', [(GH, " || (c.trang_thai === 'doi_tai_xe' && moi === 'tim_xe') || doiTaiXe))", " || (c.trang_thai === 'doi_tai_xe' && moi === 'tim_xe')))", 1)], r'✗ H11b '),
  ('BV-hoan-dong-giao-loi', 'g1', [(GH, "IN ('moi', 'dang_pha', 'chuyen_huy', 'giao_loi')", "IN ('moi', 'dang_pha', 'chuyen_huy')", 1)], r'✗ Q5c '),
  ('BV-gianh-kiem-don', 'g1', [(GH, "      AND EXISTS (SELECT 1 FROM pos_orders WHERE id = pos_giao_chuyen.order_id AND status = 'completed' AND payment_status = 'paid')`,", "`,", 1)], r'✗ G10 '),
  ('VS-huy-chuyen-khi-dang-goi', 'g1', [(GH, "  if (!c || !['tim_xe', 'doi_tai_xe'].includes(c.trang_thai) || !c.ma_ahamove)", "  if (!c || !['tim_xe', 'doi_tai_xe', 'dang_goi'].includes(c.trang_thai) || !c.ma_ahamove)", 1)], r'✗ J5d '),
]


def ban_sao(thay):
  """Chép server/ + giả lập + bài thử + bộ kiểm ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_giao1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))   # doiSoat.js nạp bat_bien.js ở đây
  for f in CHEP:
    os.makedirs(os.path.dirname(os.path.join(tmp, f)) or tmp, exist_ok=True)
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tmp, f))
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


def chay_bai(tmp, bai):
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai])], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, bai, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'Bài thử sập' in ra:
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
    ok, dong = True, []
    for bai in BAI:
      ma, ra = chay_bai(tmp, bai)
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      ok = ok and ma == 0 and m is not None and m.group(2) == '0'
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]) + ''.join(' | ' + l.strip()[:140] for l in ra.splitlines() if '✗' in l))
    return ok, ' · '.join(dong)
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
