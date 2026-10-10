#!/usr/bin/env python3
"""LUOI-1 — đột biến của chính việc này (C3) + bằng chứng KB10 trên gốc. Chạy ở GỐC kho, KHÔNG chạy lệnh khác song song:

    python3 viec/LUOI-1/dot_bien.py [tên|tiền tố* …] [-j N]

Mỗi đột biến: chép THẬT (không nối) server/, cong_cu/, tu_chay/cau_hinh.json vào thư mục tạm — của HEAD (mặc định) hoặc
của gốc 9521cec (cách chạy 'goc…', qua git archive) — thay chuỗi (chuỗi gốc phải khớp ĐÚNG số lần ghi sẵn, không thì HỎNG,
không bao giờ đếm BẮT — K3), kiểm đích ghi nằm trong thư mục tạm (realpath — K5/HOC-2b), rồi chạy lệnh trên bản sao.
  BẮT  = thoát ≠ 0 VÀ MỌI mẫu đều khớp một dòng ra     LẠC = thoát ≠ 0 nhưng thiếu mẫu     SỐNG = thoát 0
Mỗi đột biến ghi kết quả MONG ĐỢI (thường BẮT); lệch mong đợi → thoát 1. Trước khi chấm, mỗi cách chạy chạy KHÔNG đột biến
một lần → phải thoát 0, đỏ thì dừng (thoát 4). Thư mục tạm dọn trong finally.
"""
import os, re, shutil, subprocess, sys, tempfile, time
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NEN = '9521cec'   # gốc của việc này (PHIEU: LUOI-1)
CH, KB, BB, TG = 'cong_cu/gia_lap/chay.js', 'cong_cu/gia_lap/kich_ban.js', 'cong_cu/gia_lap/bat_bien.js', 'cong_cu/thu_gia_lap.js'

# KB10 của gốc và của HEAD (đoạn từ đầu KB10 tới đầu KB11) — để dựng "KB10 siết trên gốc".
def _kb10(src):
  a = src.index("  { ten: 'hai người cùng bấm thu một bill'")
  return src[a:src.index("  { ten: 'hai người cùng nhập một mã'")]
KB10_GOC = _kb10(subprocess.run(['git', 'show', f'{NEN}:{KB}'], cwd=GOC, capture_output=True, text=True, check=True).stdout)
KB10_MOI = _kb10(open(os.path.join(GOC, KB), encoding='utf-8').read())
# Gốc không có A1: "trễ không bật lại" trên gốc = tắt trễ sau mỗi kịch bản (như A1) mà KHÔNG bật lại trước kịch bản sau.
GOC_CHAY = "    try { await kb.chay(ctx); } catch (e) { ctx.http.push('SẬP giữa kịch bản: ' + e.message); }\n"
GOC_TRE_TAT = GOC_CHAY + '    treMs = 0;\n'
TRE_BAT = '    treMs = TRE_MS;   // A1: trễ bật lại TRƯỚC mỗi kịch bản\n'
TRE_KB10 = [r'KB10 → HTTP: hai lệnh thu chồng nhau', r'KB10 → HTTP: trễ kho đang bật']

# (tên, cách chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], [mẫu — PHẢI khớp hết], kết quả mong đợi)
DOT_BIEN = [
  # ── Bằng chứng KB10 (chủ quán dặn 09.10): trên GỐC, đột biến "trễ không bật lại" — KB10 cũ chỉ đỏ ở ca chồng (ca trễ vẫn
  #    xanh = LẠC với hai mẫu), KB10 siết đỏ CẢ hai ca (BẮT).
  ('GOC-KB10-cu-tre-khong-bat-lai', 'goc10', [(CH, GOC_CHAY, GOC_TRE_TAT, 1)], TRE_KB10, 'LẠC'),
  ('GOC-KB10-siet-tre-khong-bat-lai', 'goc10', [(CH, GOC_CHAY, GOC_TRE_TAT, 1), (KB, KB10_GOC, KB10_MOI, 1)], TRE_KB10, 'BẮT'),
  # ── chay.js (A1, công tắc SX lỗi B4) ──
  ('BV-A1-tre-khong-bat-lai', 'kb10', [(CH, TRE_BAT, '', 1)], TRE_KB10, 'BẮT'),
  ('VS-A1-tre-chi-bat-kb-dau', 'kb10', [(CH, TRE_BAT, '    if (i === 0) treMs = TRE_MS;\n', 1)], TRE_KB10, 'BẮT'),
  ('BV-B4-sx-khong-tu-tat', 'kb25', [(CH, '    sxGia.loi = false;   // B4: SX giả hết lỗi trước mỗi kịch bản\n', '', 1)],
   [r'KB25 → HTTP: hai người cùng bấm đẩy', r'KB25 → I7: SX lỗi ở kịch bản 25 không bật công tắc'], 'BẮT'),
  ('VS-B4-sx-mac-dinh-bat', 'kb1', [(CH, 'const sxGia = { loi: false,', 'const sxGia = { loi: true,', 1)],
   [r'KB1 → I7: SX lỗi ở kịch bản 0 không bật công tắc'], 'BẮT'),
  ('VS-B4-bat-khong-ghi-kb', 'kb24', [(CH, 'sxGia.loi = true; sxGia.kbBat.add(sxGia.kb);', 'sxGia.loi = true;', 1)],
   [r'KB24 → I7: SX lỗi ở kịch bản 24 không bật công tắc'], 'BẮT'),
  ('BV-B4-kb-khong-gan', 'kb25', [(CH, '    sxGia.kb = i + 1;\n', '', 1)], [r'KB25 → HTTP: chay.js: công tắc SX tự tắt'], 'BẮT'),
  # Máy chủ (soát vòng 2): đổi sang chuyển khoản mà giữ nguyên tiền mặt → đơn ghi gấp đôi. Q10 = (a), chủ quán chốt 09.10: khi đó
  # KHÔNG có kịch bản đổi tiền mặt → CK (SỐNG). TACH-GL chia giả lập 4 lượt rồi thêm KB28 (tiền mặt → CK) → mong đợi BẮT.
  ('VS-SRV-doi-ck-giu-tien-mat', 'kb28', [('server/routes/don-mo-rong.js', "[sang === 'cash' ? soTien : 0,", "[sang === 'cash' ? soTien : tm,", 1)],
   [r'KB28 → I16: đơn .*: nhật ký đổi sang transfer'], 'BẮT'),
  # Máy chủ (soát vòng 3 lỗi 3, chat soát thay 10.10): bỏ khoá chống hai người cùng bấm đẩy sổ nợ → SX nhận gấp đôi.
  ('VS-SRV-bo-khoa-dangChay', 'kb25', [('server/utils/doSoNo.js', "  if (dangChay) return { boQua: 'dang chay' };\n", '', 1)],
   [r'KB25 → HTTP: hai người cùng bấm đẩy', r'KB25 → I7: vân tay .* SX nhận 2 lần'], 'BẮT'),
  ('VS-B4-loi-van-nhan', 'kb24', [(CH, "return r.status(503).json({ error: 'SX giả đang lỗi' }); }", '}', 1)],
   [r'KB24 → HTTP: bán \+ huỷ lúc SX lỗi', r'KB24 → I7:'], 'BẮT'),
  # ── bat_bien.js — "nới phép" cả hai phía / bỏ một vế; bắt bằng ca dữ liệu tay của thu_gia_lap (--chi-du-lieu-tay) ──
  ('VS-I7-tong-chi-tren', 'tay', [(BB, '(chuaXong.get(vt) || 0) !== 1) {', '(chuaXong.get(vt) || 0) > 1) {', 1)], [r'✗ I7 SX nhận 0'], 'BẮT'),
  ('VS-I7-tong-chi-duoi', 'tay', [(BB, '(chuaXong.get(vt) || 0) !== 1) {', '(chuaXong.get(vt) || 0) < 1) {', 1)], [r'✗ I7 SX nhận 2'], 'BẮT'),
  ('BV-I7-b-no-da-xong', 'tay', [(BB, 'of daXong) if (dem.get(vt) !== 1)', 'of daXong) if (false)', 1)], [r'✗ I7 nợ đã xong'], 'BẮT'),
  ('BV-I7-c-loi-phai-co-no', 'tay', [(BB, 'for (const vt of loi) if (soNo.get(vt) !== 1)', 'for (const vt of loi) if (false)', 1)],
   [r'✗ I7 SX lỗi \(đơn đã xoá\) mà không'], 'BẮT'),
  ('VS-I7-c-no-chi-duoi', 'tay', [(BB, 'for (const vt of loi) if (soNo.get(vt) !== 1)', 'for (const vt of loi) if ((soNo.get(vt) || 0) < 1)', 1)],
   [r'✗ I7 SX lỗi một lần mà 2'], 'BẮT'),
  ('BV-I7-d-no-phai-co-loi', 'tay', [(BB, 'else if (!loi.has(r.van_tay))', 'else if (false)', 1)], [r'✗ I7 dòng nợ không có lần'], 'BẮT'),
  ('BV-I7-no-khong-van-tay', 'tay', [(BB, '      if (!r.van_tay) lech.push(`nợ kho KHÔNG vân tay', '      if (false) lech.push(`nợ kho KHÔNG vân tay', 1)],
   [r'✗ I7 dòng nợ không vân tay, SX giả cũng ghi'], 'BẮT'),
  ('BV-I7-e-kb-bat', 'tay', [(BB, 'if (!ctx.sxGia.kbBat.has(h.kb))', 'if (false)', 1)], [r'✗ I7 SX lỗi ở kịch bản không bật'], 'BẮT'),
  ('VS-I8-diem-chi-tren', 'tay', [(BB, 'so(r.points) !== -so(r.gia)', 'so(r.points) < -so(r.gia)', 1)], [r'✗ I8 đổi trừ 2'], 'BẮT'),
  ('VS-I8-diem-chi-duoi', 'tay', [(BB, 'so(r.points) !== -so(r.gia)', 'so(r.points) > -so(r.gia)', 1)], [r'✗ I8 đổi trừ 4'], 'BẮT'),
  ('VS-I8-qua-chi-duoi', 'tay', [(BB, 'if (so(r.so_qua) !== 1 ||', 'if (so(r.so_qua) < 1 ||', 1)], [r'✗ I8 hai quà'], 'BẮT'),
  ('VS-I8-qua-chi-tren', 'tay', [(BB, 'if (so(r.so_qua) !== 1 ||', 'if (so(r.so_qua) > 1 ||', 1)], [r'✗ I8 dòng đổi 0 điểm không quà'], 'BẮT'),
  ('BV-I8-loai-null', 'tay', [(BB, "COALESCE(type, '') NOT IN", 'type NOT IN', 1)], [r'✗ I8 dòng điểm không có loại'], 'BẮT'),
  ('BV-I8-loai-la', 'tay', [(BB, "NOT IN ('earn', 'redeem')", "NOT IN ('earn', 'redeem', 'tang')", 1)], [r'✗ I8 loại dòng điểm lạ'], 'BẮT'),
  ('BV-I12-loai-dong', 'tay', [(BB, "r.type !== 'redeem' || ", '', 1)], [r'✗ I12 quà trỏ dòng không phải'], 'BẮT'),
  ('BV-I12-sdt', 'tay', [(BB, 'r.sdt_tx !== r.sdt || ', '', 1)], [r'✗ I12 dòng redeem của SĐT'], 'BẮT'),
  ('VS-I12-diem-chi-tren', 'tay', [(BB, 'so(r.points) !== -so(r.points_cost)', 'so(r.points) < -so(r.points_cost)', 1)], [r'✗ I12 dòng redeem −2'], 'BẮT'),
  ('VS-I12-diem-chi-duoi', 'tay', [(BB, 'so(r.points) !== -so(r.points_cost)', 'so(r.points) > -so(r.points_cost)', 1)], [r'✗ I12 dòng redeem −4'], 'BẮT'),
  ('BV-I12-loai-ma', 'tay', [(BB, 'r.discount_type !== r.loai_qua || ', '', 1)], [r'✗ I12 mã loại %'], 'BẮT'),
  ('VS-I12-tri-gia-chi-tren', 'tay', [(BB, 'so(r.discount_value) !== so(r.tri_gia_qua)', 'so(r.discount_value) > so(r.tri_gia_qua)', 1)], [r'✗ I12 mã trị giá 4.999'], 'BẮT'),
  ('VS-I12-tri-gia-chi-duoi', 'tay', [(BB, 'so(r.discount_value) !== so(r.tri_gia_qua)', 'so(r.discount_value) < so(r.tri_gia_qua)', 1)], [r'✗ I12 mã trị giá 5.001'], 'BẮT'),
  ('BV-I12-tran', 'tay', [(BB, ' || so(r.tran) !== so(r.tran_qua)', '', 1)], [r'✗ I12 mã mất trần'], 'BẮT'),
  ('VS-I12-tran-chi-duoi', 'tay', [(BB, 'so(r.tran) !== so(r.tran_qua)', 'so(r.tran) < so(r.tran_qua)', 1)], [r'✗ I12 mã trần 2.001'], 'BẮT'),
  ('VS-I12-tran-chi-tren', 'tay', [(BB, 'so(r.tran) !== so(r.tran_qua)', 'so(r.tran) > so(r.tran_qua)', 1)], [r'✗ I12 mã trần 1.999'], 'BẮT'),
  ('VS-I12-tran-lech-1000', 'tay', [(BB, 'so(r.tran) !== so(r.tran_qua)', 'Math.abs(so(r.tran) - so(r.tran_qua)) > 1000', 1)],
   [r'✗ I12 mã trần 1.999', r'✗ I12 mã trần 2.001'], 'BẮT'),
  ('BV-I12-so-ma', 'tay', [(BB, ' || so(r.so_ma) !== 1', '', 1)], [r'✗ I12 mã trùng hai dòng'], 'BẮT'),
  ('VS-I12-dung-chi-duoi', 'tay', [(BB, 'so(r.usage_limit) !== 1)', 'so(r.usage_limit) < 1)', 1)], [r'✗ I12 mã dùng tối đa 2'], 'BẮT'),
  ('VS-I12-dung-chi-tren', 'tay', [(BB, 'so(r.usage_limit) !== 1)', 'so(r.usage_limit) > 1)', 1)], [r'✗ I12 mã dùng tối đa 0'], 'BẮT'),
  ('VS-I13-dung-chi-tren', 'tay', [(BB, 'so(r.used_count) !== so(r.so_don) + tay', 'so(r.used_count) > so(r.so_don) + tay', 1)], [r'✗ I13 dùng 0'], 'BẮT'),
  ('VS-I13-dung-chi-duoi', 'tay', [(BB, 'so(r.used_count) !== so(r.so_don) + tay', 'so(r.used_count) < so(r.so_don) + tay', 1)], [r'✗ I13 dùng 3'], 'BẮT'),
  ('VS-I13-gioi-han-cong-1', 'tay', [(BB, 'so(r.used_count) > so(r.usage_limit))', 'so(r.used_count) > so(r.usage_limit) + 1)', 1)], [r'✗ I13 vượt giới hạn'], 'BẮT'),
  ('BV-I13-bo-gioi-han-0', 'tay', [(BB, '(so(r.usage_limit) > 0 && so(r.used_count) > so(r.usage_limit))', '(so(r.used_count) > so(r.usage_limit))', 1)], [r'✗ I13 sạch'], 'BẮT'),
  ('BV-I13-so-tay', 'tay', [(BB, 'so(r.used_count) !== so(r.so_don) + tay', 'so(r.used_count) !== so(r.so_don)', 1)], [r'✗ I13 sạch'], 'BẮT'),
  ('BV-I13-bo-loai', 'tay', [(BB, ' AND o.discount_type = d.discount_type\n', '\n', 1)], [r'✗ I13 sạch'], 'BẮT'),
  ('BV-I13-bo-tri-gia', 'tay', [(BB, '\n          AND o.discount_value = d.discount_value)', ')', 1)], [r'✗ I13 sạch'], 'BẮT'),
  ('VS-I14-vuot-tong-cong-1', 'tay', [(BB, 'if (so(g.delivered_qty) > so(g.total_qty))', 'if (so(g.delivered_qty) > so(g.total_qty) + 1)', 1)], [r'✗ I14 đã giao vượt tổng'], 'BẮT'),
  ('VS-I14-giao-chi-tren', 'tay', [(BB, 'so(g.delivered_qty) !== so(g.da_lay) + tay', 'so(g.delivered_qty) > so(g.da_lay) + tay', 1)], [r'✗ I14 đã giao 2'], 'BẮT'),
  ('VS-I14-giao-chi-duoi', 'tay', [(BB, 'so(g.delivered_qty) !== so(g.da_lay) + tay', 'so(g.delivered_qty) < so(g.da_lay) + tay', 1)], [r'✗ I14 đã giao 4'], 'BẮT'),
  ('BV-I14-so-tay', 'tay', [(BB, 'so(g.delivered_qty) !== so(g.da_lay) + tay', 'so(g.delivered_qty) !== so(g.da_lay)', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-tinh-ca-don-huy', 'tay', [(BB, "AND x.status <> 'cancelled' AND oi.product_id", 'AND oi.product_id', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-tinh-ca-mon-co-gia', 'tay', [(BB, 'AND COALESCE(oi.unit_price, 0) = 0) AS da_lay', ') AS da_lay', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-goi-don-huy', 'tay', [(BB, "(g.co_don == null || g.tt_don === 'cancelled')", '(g.co_don == null)', 1)], [r'✗ I14 gói của đơn mua đã huỷ'], 'BẮT'),
  ('BV-I14-goi-don-xoa', 'tay', [(BB, "(g.co_don == null || g.tt_don === 'cancelled')", "(g.tt_don === 'cancelled')", 1)], [r'✗ I14 gói của đơn mua đã xoá'], 'BẮT'),
  ('BV-I14-tro-goi', 'tay', [(BB, 'WHERE o.customer_package_id IS NOT NULL AND cp.id IS NULL', 'WHERE 0', 1)], [r'✗ I14 đơn trỏ gói không còn'], 'BẮT'),
  ('BV-I14-bo-product-id', 'tay', [(BB, "AND oi.product_id > 0 AND COALESCE(oi.unit_price, 0) = 0) AS da_lay", 'AND COALESCE(oi.unit_price, 0) = 0) AS da_lay', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-tro-bo-not-null', 'tay', [(BB, 'WHERE o.customer_package_id IS NOT NULL AND cp.id IS NULL', 'WHERE cp.id IS NULL', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-mua-bo-co-goi', 'tay', [(BB, 'FROM pos_orders o WHERE EXISTS (SELECT 1 FROM pos_customer_packages cp WHERE cp.order_id = o.id)\n        AND EXISTS', 'FROM pos_orders o WHERE 1\n        AND EXISTS', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-mua-bo-lay-ngay', 'tay', [(BB, '\n        AND EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id > 0 AND COALESCE(oi.unit_price, 0) = 0)`);', '`);', 1)], [r'✗ I14 sạch'], 'BẮT'),
  ('BV-I14-mua-lay-ngay', 'tay', [(BB, 'mua.filter((r) => so(r.customer_package_id) !== so(r.goi_dau))', 'mua.filter(() => false)', 1)], [r'✗ I14 đơn mua gói lấy ngay'], 'BẮT'),
  ('VS-I15-the-chi-tren', 'tay', [(BB, 'thieu.filter((r) => so(r.n) !== 1)', 'thieu.filter((r) => so(r.n) > 1)', 1)], [r'✗ I15 đơn thẻ 0'], 'BẮT'),
  ('VS-I15-the-chi-duoi', 'tay', [(BB, 'thieu.filter((r) => so(r.n) !== 1)', 'thieu.filter((r) => so(r.n) < 1)', 1)], [r'✗ I15 đơn thẻ 2'], 'BẮT'),
  ('BV-I15-tinh-ca-don-huy', 'tay', [(BB, "WHERE o.status <> 'cancelled' AND COALESCE(o.customer_phone, '') <> ''", "WHERE COALESCE(o.customer_phone, '') <> ''", 1)], [r'✗ I15 sạch'], 'BẮT'),
  ('BV-I15-bo-sdt', 'tay', [(BB, "AND COALESCE(o.customer_phone, '') <> ''\n", '\n', 1)], [r'✗ I15 sạch'], 'BẮT'),
  ('BV-I15-bo-mon-the', 'tay', [(BB, "\n        AND EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id <= -1000000)`);", '`);', 1)], [r'✗ I15 sạch'], 'BẮT'),
  ('BV-I15-sdt-rong', 'tay', [(BB, "COALESCE(o.customer_phone, '') <> ''", 'o.customer_phone IS NOT NULL', 1)], [r'✗ I15 sạch'], 'BẮT'),
  ('BV-I15-mua-don-huy', 'tay', [(BB, "WHERE o.id IS NULL OR o.status = 'cancelled'", 'WHERE o.id IS NULL', 1)], [r'✗ I15 dòng mua thẻ của đơn đã huỷ'], 'BẮT'),
  ('BV-I15-mua-don-xoa', 'tay', [(BB, "WHERE o.id IS NULL OR o.status = 'cancelled'", "WHERE o.status = 'cancelled'", 1)], [r'✗ I15 dòng mua thẻ của đơn không còn'], 'BẮT'),
  ('VS-I16-tien-chi-tren', 'tay', [(BB, 'so(ct.so_tien) === so(r.cash_amount) + so(r.transfer_amount)', 'so(ct.so_tien) <= so(r.cash_amount) + so(r.transfer_amount)', 1)], [r'✗ I16 số tiền đổi 24.999'], 'BẮT'),
  ('VS-I16-tien-chi-duoi', 'tay', [(BB, 'so(ct.so_tien) === so(r.cash_amount) + so(r.transfer_amount)', 'so(ct.so_tien) >= so(r.cash_amount) + so(r.transfer_amount)', 1)], [r'✗ I16 số tiền đổi 25.001'], 'BẮT'),
  ('VS-I16-luon-cot-ck', 'tay', [(BB, "so(ct.sang === 'cash' ? r.transfer_amount : r.cash_amount) === 0", 'so(r.transfer_amount) === 0', 1)],
   [r'✗ I16 sạch'], 'BẮT'),
  ('BV-I16-nhanh-ck', 'tay', [(BB, "so(ct.sang === 'cash' ? r.transfer_amount : r.cash_amount) === 0", "(ct.sang === 'cash' ? so(r.transfer_amount) : 0) === 0", 1)],
   [r'✗ I16 đổi sang chuyển khoản mà tiền mặt'], 'BẮT'),
  ('VS-I16-luon-cot-tm', 'tay', [(BB, "so(ct.sang === 'cash' ? r.transfer_amount : r.cash_amount) === 0", 'so(r.cash_amount) === 0', 1)],
   [r'✗ I16 sạch'], 'BẮT'),
  ('BV-I16-cot-kia', 'tay', [(BB, "\n        && so(ct.sang === 'cash' ? r.transfer_amount : r.cash_amount) === 0", '', 1)],
   [r'✗ I16 đổi sang tiền mặt mà CK', r'✗ I16 đơn vẫn chuyển khoản'], 'BẮT'),
  ('BV-I16-dong-cuoi', 'tay', [(BB, " AND l.id = (SELECT MAX(x.id) FROM pos_order_log x WHERE x.order_id = l.order_id AND x.loai = 'doi')", '', 1)], [r'✗ I16 sạch'], 'BẮT'),
  ('BV-I17-bo-approved', 'tay', [(BB, "\n      WHERE r.status = 'approved'`);", '`);', 1)], [r'✗ I17 sạch'], 'BẮT'),
  ('BV-I17-loai-dong', 'tay', [(BB, "r.type !== 'refund' || ", '', 1)], [r'✗ I17 gắn dòng không phải refund'], 'BẮT'),
  ('BV-I17-don', 'tay', [(BB, 'so(r.t_don) !== so(r.order_id) || ', '', 1)], [r'✗ I17 gắn dòng của đơn khác'], 'BẮT'),
  ('BV-I17-sdt', 'tay', [(BB, 'r.t_sdt !== r.customer_phone\n      || ', '', 1)], [r'✗ I17 gắn dòng của SĐT khác'], 'BẮT'),
  ('VS-I17-tien-lech-1', 'tay', [(BB, 'Math.abs(so(r.amount) - so(r.refund_amount)) > 0.5)', 'Math.abs(so(r.amount) - so(r.refund_amount)) > 1.5)', 1)], [r'✗ I17 dòng sổ 29.999', r'✗ I17 dòng sổ 30.001'], 'BẮT'),
]

N = lambda *a: ['node', *a]
LENH = {'tay': ('dau', N(TG, '--chi-du-lieu-tay'), 120), 'goc10': ('nen', N(CH, '--den-kb', '10'), 300)}
for _k in (1, 10, 24, 25, 28): LENH[f'kb{_k}'] = ('dau', N(CH, '--den-kb', str(_k)), 300)
LENH['gl'] = ('dau', N(CH), 300)


def dung_ban_sao(goc, tam):
  k = os.path.join(tam, 'kho')
  os.makedirs(k)
  if goc == 'nen':
    arch = subprocess.run(['git', 'archive', NEN, 'server', 'cong_cu', 'tu_chay/cau_hinh.json'], cwd=GOC, capture_output=True, check=True).stdout
    subprocess.run(['tar', '-x', '-C', k], input=arch, check=True)
  else:
    for x in ('server', 'cong_cu', 'tu_chay/cau_hinh.json'):
      n, d = os.path.join(GOC, x), os.path.join(k, x)
      os.makedirs(os.path.dirname(d), exist_ok=True)
      if os.path.isdir(n): shutil.copytree(n, d, symlinks=False)
      else: shutil.copy2(n, d)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))   # chỉ đọc
  return k


def ap(k, doi, tam):
  for f, cu, moi, n in doi:
    p = os.path.join(k, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tam) + os.sep): return f'{f}: đích ghi ra ngoài thư mục tạm — không ghi'
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n: return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return ''


def moi_truong(tam):
  t = os.path.join(tam, 'tmp')
  os.makedirs(t, exist_ok=True)
  e = {x: os.environ[x] for x in ('PATH', 'HOME', 'LANG', 'LC_ALL') if x in os.environ}
  e['TMPDIR'] = t
  return e


def cham(db):
  ten, cach, doi, mau, mong = db
  goc, argv, gio = LENH[cach]
  tam = tempfile.mkdtemp(prefix='luoi1_')
  t0 = time.time()
  try:
    k = dung_ban_sao(goc, tam)
    loi = ap(k, doi, tam)
    if loi: return dict(ten=ten, kq='HỎNG', mong=mong, giay=0, chi=loi)
    try:
      r = subprocess.run(argv, cwd=k, env=moi_truong(tam), capture_output=True, text=True, timeout=gio)
    except subprocess.TimeoutExpired:
      return dict(ten=ten, kq='TREO', mong=mong, giay=round(time.time() - t0), chi=f'quá {gio} s')
    ra = (r.stdout + r.stderr).splitlines()
    if r.returncode == 0: kq, chi = 'SỐNG', 'thoát 0'
    else:
      thay = [next((l.strip() for l in ra if re.search(m, l)), None) for m in mau]
      kq = 'BẮT' if all(thay) else 'LẠC'
      chi = ' | '.join(t[:160] for t in thay if t) or (ra[-1].strip()[:200] if ra else '(không in gì)')
      if kq == 'LẠC': chi += ' · thiếu mẫu: ' + ', '.join(m for m, t in zip(mau, thay) if not t)
    return dict(ten=ten, kq=kq, mong=mong, giay=round(time.time() - t0), chi=chi)
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def main():
  a = sys.argv[1:]
  j = 4
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  ds = [d for d in DOT_BIEN if not a or any(t == d[0] or (t.endswith('*') and d[0].startswith(t[:-1])) for t in a)]
  if len({d[0] for d in DOT_BIEN}) != len(DOT_BIEN): print('tên đột biến trùng'); return 2
  if not ds: print('không có đột biến nào khớp', a); return 2
  t0 = time.time()
  cach = sorted({d[1] for d in ds})
  print(f'LUOI-1 dot_bien: {len(ds)} đột biến · -j {j} · kiểm sạch {len(cach)} cách chạy ({", ".join(cach)})', flush=True)
  with ThreadPoolExecutor(max_workers=j) as ex:
    sach = list(ex.map(lambda c: cham((f'sạch:{c}', c, [], [], 'SỐNG')), cach))
  hong = [r for r in sach if r['kq'] != 'SỐNG']
  for r in hong: print(f"  ✗ KIỂM SẠCH {r['ten']}: {r['kq']} · {r['chi']}")
  if hong: print('  DỪNG — bản sao không đột biến đã đỏ'); return 4
  with ThreadPoolExecutor(max_workers=j) as ex:
    kq = []
    for r in ex.map(cham, ds):
      kq.append(r)
      dau = '✓' if r['kq'] == r['mong'] else '✗'
      print(f"{dau} {r['kq']:4} (mong {r['mong']})  {r['ten']}  ({r['giay']} s) · {r['chi']}", flush=True)
  sai = [r for r in kq if r['kq'] != r['mong']]
  dem = {x: sum(r['kq'] == x for r in kq) for x in ('BẮT', 'LẠC', 'SỐNG', 'HỎNG', 'TREO')}
  print(f"\n  tổng {len(kq)} · " + ' · '.join(f'{x} {v}' for x, v in dem.items()) + f" · đúng mong đợi {len(kq) - len(sai)}/{len(kq)} · {round(time.time() - t0)} s")
  return 1 if sai else 0


if __name__ == '__main__':
  sys.exit(main())
