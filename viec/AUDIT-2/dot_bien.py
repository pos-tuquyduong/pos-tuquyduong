#!/usr/bin/env python3
"""AUDIT-2 — đột biến MỚI của A3 (bundle D2–D5, logic loyalty / gói, thăm dò) và B3 (bỏ khoá ca chồng nhau). Chạy ở GỐC kho:

    python3 viec/AUDIT-2/dot_bien.py [nhóm|tên|tiền tố* …] [-j N] [--json <file NGOÀI kho>]

  nhóm: D2K (công cụ tự chứng minh) · A3B (bundle) · A3L (logic loyalty/gói) · A3P (thăm dò code quầy) · B3 (bỏ khoá).
Dùng lại NGUYÊN khung `viec/AUDIT-1/dot_bien.py` (bản sao, kiểm sạch, chấm BẮT/SỐNG/HỎNG/LẠC/TREO, dọn thư mục tạm) — chỉ thay
bảng đột biến, thêm cách chạy kb19–kb29, lọc thêm `viec/AUDIT-2/` khỏi ảnh git status, tự gắn SIGINT/SIGTERM.
A3P ngược nghĩa: thêm một ca vào BẢN SAO kich_ban.js khẳng định hành vi ĐÚNG; BẮT = máy chủ thật làm SAI (code quầy sai).
"""
import atexit, importlib.util, os, shutil, signal, sys
sys.dont_write_bytecode = True   # importlib nạp khung AUDIT-1: không đẻ __pycache__ trong kho (soát vòng 1)

DAY = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('khung_audit1', os.path.join(DAY, '..', 'AUDIT-1', 'dot_bien.py'))
K = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(K)   # khung tạo K.GOC_TAM lúc nạp — main() / don() của khung tự xoá
atexit.register(shutil.rmtree, K.GOC_TAM, True)   # nạp bảng dưới đây hỏng (vd thiếu client/dist) vẫn xoá — soát vòng 3
GOC = K.GOC

for _k in range(19, 30):
  K.LENH[f'kb{_k}'] = ('sv', [[K.N('cong_cu/gia_lap/chay.js', '--den-kb', str(_k))]], 300)
_anh_cu = K.anh_kho
K.anh_kho = lambda: '\n'.join(l for l in _anh_cu().split('\n') if not l[3:].startswith('viec/AUDIT-2/'))

BUNDLE = 'client/dist/assets/' + next(f for f in sorted(os.listdir(os.path.join(GOC, 'client/dist/assets'))) if f.endswith('.js'))
O, LY, SC, RF, PK, KB = ('server/routes/orders.js', 'server/routes/loyalty.js', 'server/routes/signup-codes.js',
                         'server/routes/refunds.js', 'server/routes/packages.js', 'cong_cu/gia_lap/kich_ban.js')
# (tên, nhóm, cách chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp[, chỉ thay lần thứ k])], mẫu phải thấy)
K.DOT_BIEN = [
  # ── D2K: khung dùng lại vẫn không nói dối khi chạy qua bảng AUDIT-2 ──
  ('D2K-sai-chuoi', 'D2K', 'kb10', [(O, 'CHUOI_KHONG_CO_TRONG_FILE_AUDIT2', 'x', 1)], r'KB10 → '),
  ('D2K-da-biet', 'D2K', 'kb10', [(O, 'if (kqThu.changes !== 1) {', 'if (false) {', 1),
                                   (O, "WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'`",
                                    'WHERE id = ? AND ? IS NOT NULL`', 1)], r'KB10 → (HTTP: hai lệnh thu|I6)'),
  ('D2K-vo-hai', 'D2K', 'kb10', [(O, '// 1. Tạo đơn hàng', '// 1. Tao don hang (AUDIT-2 vo hai)', 1)], r'KB10 → '),

  # ── A3B: bundle D2–D5 (kiem_tra_truoc_khi_giao.js:266, 273, 281, 310) ──
  ('A3B-D2-bundle-dev', 'A3B', 'kiem', [(BUNDLE, 'sessionExpiredHandled', '"Download the React DevTools";sessionExpiredHandled', 4, 0)],
   r'✗ Bundle KHÔNG phải bản dev của React'),
  ('A3B-D3-index-tro-sai', 'A3B', 'kiem', [('client/dist/index.html', os.path.basename(BUNDLE), 'index-KHONGCO.js', 1)],
   r'✗ index.html trỏ tới bundle CÓ THẬT'),
  ('A3B-D4-bo-dau-vet', 'A3B', 'kiem', [(BUNDLE, 'sessionExpiredHandled', 'sEH_bo', 4)], r'✗ Bundle có dấu vết POS-ERRHANDLING-v1'),
  ('A3B-D5-src-chua-build', 'A3B', 'kiemdd', [('client/src/pages/DiscountCodes.jsx', 'placeholder="Tìm mã..."', 'placeholder="Tìm mã giảm..."', 1)],
   r'✗ dist đã commit KHỚP với src hiện tại'),

  # ── A3L: logic loyalty / gói (sai PHÉP TÍNH / PHÉP CHẶN, không bỏ câu ghi) — chạy như C2F (giả lập + thu_P26a/b, rồi P20/P21) ──
  ('A3L-redeem-thieu-1-diem', 'A3L', 'c2full', [(LY, 'if (balance < cost) {', 'if (balance < cost - 1) {', 1)], r'✗ '),
  ('A3L-redeem-bo-chan-diem', 'A3L', 'c2full', [(LY, 'if (balance < cost) {', 'if (false) {', 1)], r'✗ '),
  ('A3L-redeem-bo-han-diem', 'A3L', 'c2full', [(LY, 'AND (expires_at IS NULL OR expires_at > ?)', 'AND (1 OR expires_at > ?)', 1)], r'✗ '),
  ('A3L-redeem-tru-them-1', 'A3L', 'c2full', [(LY, '[phone, -cost,', '[phone, -cost - 1,', 1)], r'✗ '),
  ('A3L-redeem-ma-dung-2-lan', 'A3L', 'c2full', [(LY, 'VALUES (?, ?, ?, 0, ?, 1, 0, ?, ?, 1, ?, ?, ?)',
                                                   'VALUES (?, ?, ?, 0, ?, 2, 0, ?, ?, 1, ?, ?, ?)', 1)], r'✗ '),
  ('A3L-earn-lam-tron-len', 'A3L', 'c2full', [(O, 'loyaltyEarnPoints = Math.floor(total / per);', 'loyaltyEarnPoints = Math.ceil(total / per);', 1)], r'✗ '),
  ('A3L-earn-flash-van-cong', 'A3L', 'c2full', [(O, 'if (phone && total > 0 && !flashApplied) {', 'if (phone && total > 0) {', 1)], r'✗ '),
  ('A3L-nhandiem-cong-doi', 'A3L', 'c2full', [(SC, '? Math.round(diemGoc * (ch.heSo - 1))', '? Math.round(diemGoc * ch.heSo)', 1)], r'✗ '),
  ('A3L-nhandiem-he-so-mac-dinh', 'A3L', 'c2full', [(SC, 'heSo >= 1 ? heSo : 2,', 'heSo >= 1 ? heSo : 3,', 1)], r'✗ '),
  ('A3L-goi-bo-kiem-chu', 'A3L', 'c2full', [(O, 'if (!sdtDon || sdtDon !== sdtGoi) {', 'if (!sdtDon) {', 1)], r'✗ '),
  ('A3L-goi-bo-kiem-trang-thai', 'A3L', 'c2full', [(O, 'if (goiKH.status !== "active") {', 'if (false) {', 1)], r'✗ '),
  ('A3L-goi-bo-kiem-con-lai', 'A3L', 'c2full', [(O, 'if (conLai <= 0) {', 'if (false) {', 1)], r'✗ '),
  ('A3L-goi-giao-them-1', 'A3L', 'c2full', [(O, '[deliveredQty, deliveredQty, now, customer_package_id]',
                                              '[deliveredQty + 1, deliveredQty, now, customer_package_id]', 1)], r'✗ '),
  ('A3L-goi-lay-ngay-them-1', 'A3L', 'c2full', [(O, '[firstDeliveryQty, firstDeliveryQty, now, newCpId]',
                                                  '[firstDeliveryQty + 1, firstDeliveryQty, now, newCpId]', 1)], r'✗ '),
  ('A3L-goi-huy-lay-khong-tra-luot', 'A3L', 'c2full', [(O, 'SET delivered_qty = MAX(0, delivered_qty - ?),',
                                                         'SET delivered_qty = MAX(0, delivered_qty - 0 * ?),', 2, 0)], r'✗ '),
  ('A3L-goi-xoa-lay-khong-tra-luot', 'A3L', 'c2full', [(O, 'SET delivered_qty = MAX(0, delivered_qty - ?),',
                                                         'SET delivered_qty = MAX(0, delivered_qty - 0 * ?),', 2, 1)], r'✗ '),
  ('A3L-goi-huy-dem-ca-mon-tra-tien', 'A3L', 'c2full', [(O, '.filter(i => i.product_id > 0 && (i.unit_price === 0 || i.unit_price === null))',
                                                          '.filter(i => i.product_id > 0)', 2, 0)], r'✗ '),
  ('A3L-deliver-bo-chan-am', 'A3L', 'c2full', [(PK, 'if (!delivered_qty || delivered_qty <= 0)', 'if (!delivered_qty)', 1)], r'✗ '),

  # ── A3P: thăm dò code quầy (ngược nghĩa — BẮT = máy chủ làm sai). orders.js:222–228 chỉ chặn gói HẾT lượt (conLai <= 0),
  #    không so số ly xin lấy với số lượt còn: gói 3 lượt xin 4 ly. Ca thêm vào BẢN SAO KB21, huỷ đơn lấy nếu lỡ tạo. ──
  ('A3P-goi-lay-vuot-luot', 'A3P', 'kb21', [(KB, '    const g1 = await goiCua(m1);\n',
    "    const g1 = await goiCua(m1);\n    { const lv = await lay(g1, 4); c.mong('AUDIT-2 thăm dò: gói 3 lượt xin lấy 4 ly → phải 400', lv.status === 400, "
    "c.ma(lv)); if (lv.status === 200) await huy(lv.order.id); }\n", 1)], r'KB21 → HTTP: AUDIT-2 thăm dò'),

  # ── B3: bỏ khoá của ca chồng nhau CHƯA có đột biến giả lập ở viec/*/dot_bien.py (bảng b3_bang.md dẫn các ca đã có) ──
  ('BK-KB10-thu-bo-changes', 'B3', 'kb10', [(O, 'if (kqThu.changes !== 1) {', 'if (false) {', 1)], r'KB10 → (HTTP: hai lệnh thu|I6|I9)'),
  ('BK-KB11-claim-bo-chiem', 'B3', 'kb11', [(SC, "WHERE id = ? AND claimed_at IS NULL'", "WHERE id = ?'", 1)], r'KB11 → (HTTP: hai người /claim|I1|I8)'),
  ('BK-KB11-nhandiem-bo-chiem', 'B3', 'kb11', [(SC, 'WHERE id = ? AND diem_nhan_luc IS NULL`', 'WHERE id = ?`', 1)],
   r'KB11 → (HTTP: hai người /nhan-diem|I8)'),
  ('BK-KB16-duyet-bo-cong-don', 'B3', 'kb16', [(RF, "WHERE id = ? AND status = 'completed'`, [refund.order_id]);",
                                                "WHERE id = ?`, [refund.order_id]);", 1)], r'KB16 → (HTTP: duyệt chồng lên huỷ|I11|I3)'),
  ('BK-KB20-bo-kiem-lai-ma', 'B3', 'kb20', [(O, 'freshCode.used_count >= freshCode.usage_limit', 'false', 1)],
   r'KB20 → (HTTP: tạo mã 200; hai đơn|I13)'),
  ('BK-KB21-huy-goi-bo-changes', 'B3', 'kb21', [(O, 'if (doi.changes !== 1) {', 'if (false) {', 1)],
   r'KB21 → (HTTP: hai nhân viên huỷ|I11|I14)'),
]

if __name__ == '__main__':
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, K.don)
  print('AUDIT-2 dot_bien (khung viec/AUDIT-1/dot_bien.py; ảnh git status lọc viec/AUDIT-1/ + viec/AUDIT-2/)', flush=True)
  sys.exit(K.main())
