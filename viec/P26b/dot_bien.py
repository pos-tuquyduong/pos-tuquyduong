#!/usr/bin/env python3
"""P26b — F3: đột biến cho MỖI chỗ vá, cả "bỏ vá" lẫn "VÁ SAI". Chạy ở GỐC kho:  python3 viec/P26b/dot_bien.py [tên...]

Mỗi đột biến: chép server/ (hoặc cong_cu/gia_lap/) ra thư mục tạm, thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi
sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), rồi chạy bài thử / giả lập trên bản sao. Đạt = đầu ra có
dòng lệch khớp mẫu `bat` (đúng ca phải bắt), không phải chỉ mã thoát ≠ 0.
Không đụng server/ thật, data/, Turso. Thư mục tạm xoá khi xong.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# (tên, chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
#   chạy: 'thu'  = node cong_cu/thu_P26b.js --may-chu <bản sao>
#         'kbN'  = giả lập tới KB N trên bản sao server/
#         'glN'  = giả lập tới KB N, bản sao cong_cu/gia_lap/ (đột biến vào bất biến)
#         'thugl'= node cong_cu/thu_gia_lap.js --gia-lap <bản sao gia_lap>
O, R, W, D, P = 'routes/orders.js', 'routes/refunds.js', 'routes/wallets.js', 'routes/damages.js', 'routes/packages.js'
DOT_BIEN = [
  # ── huỷ đơn ──
  ('huy-bo-cong', 'thu', [(O, "WHERE id = ? AND status = 'completed'`,\n          [reason ||", "WHERE id = ? AND 1`,\n          [reason ||", 1)], r'✗ A1a'),
  ('huy-khong-kiem-changes', 'thu', [(O, 'if (doi.changes !== 1) {', 'if (false) {', 1)], r'✗ A1a'),
  ('huy-kiem-ngoai-tx', 'kb15', [
    (O, '      const tx = await beginTransaction();\n      let order;\n',
        '      const cu = await queryOne("SELECT status FROM pos_orders WHERE id = ?", [req.params.id]);\n      const tx = await beginTransaction();\n      let order;\n', 1),
    (O, "WHERE id = ? AND status = 'completed'`,\n          [reason ||", "WHERE id = ? AND 1`,\n          [reason ||", 1),
    (O, 'if (doi.changes !== 1) {', "if (cu?.status !== 'completed') {", 1)], r'KB15 → (HTTP: hai lệnh huỷ|I11)'),
  ('huy-bo-tu-choi-yeu-cau', 'thu', [(O, "SET status = 'rejected', rejection_reason = 'Đơn đã huỷ', processed_by = ?", "SET processed_by = ?", 1)], r'✗ A4a'),
  ('huy-tu-choi-ngoai-tx', 'thu', [(O, "        await tx.run(\n          `UPDATE pos_refund_requests SET status = 'rejected'",
                                       "        await run(\n          `UPDATE pos_refund_requests SET status = 'rejected'", 1)], r'✗ A4b'),
  # ── xoá đơn ──
  ('xoa-hoan-bat-ke-trang-thai', 'thu', [(O, 'if (order.status === "completed") {', 'if (order.status !== "cancelled") {', 1)], r'✗ A3a'),
  ('xoa-doc-don-ngoai-tx', 'kb14', [
    (O, '    const tx = await beginTransaction();\n    let order, orderItems;\n',
        '    const cu = await queryOne("SELECT status FROM pos_orders WHERE id = ?", [req.params.id]);\n    const tx = await beginTransaction();\n    let order, orderItems;\n', 1),
    (O, 'if (order.status === "completed") {', 'if (cu?.status === "completed") {', 1)], r'KB14 → (HTTP: xoá chồng|I11)'),
  # ── tạo đơn ──
  ('tao-don-chi-kiem-ngoai-tx', 'kb17', [(O, 'soCot: tru.soTien, khongAm: true', 'soCot: tru.soTien, khongAm: false', 1)], r'KB17 → HTTP: hai đơn ví'),
  # ── ví mẹ (soát vòng 3): mỗi CHỖ GỌI ghiVi là một chỗ vá riêng ──
  ('me-tao-don-khong-tru', 'thu', [(O, 'soTien: actualParentBalanceAmount, ghiChu: `Trừ cho KH', 'soTien: 0, ghiChu: `Trừ cho KH', 1)], r'✗ M1 '),
  ('me-huy-hoan-gap-doi', 'thu', [(O, 'soTien: order.parent_balance_amount, orderId: order.id,\n            ghiChu: `Hoàn tiền mẹ hủy',
                                       'soTien: 2 * order.parent_balance_amount, orderId: order.id,\n            ghiChu: `Hoàn tiền mẹ hủy', 1)], r'✗ M2 '),
  ('me-xoa-hoan-gap-doi', 'thu', [(O, 'soTien: order.parent_balance_amount, orderId: order.id,\n            ghiChu: `Hoàn tiền mẹ xóa',
                                       'soTien: 2 * order.parent_balance_amount, orderId: order.id,\n            ghiChu: `Hoàn tiền mẹ xóa', 1)], r'✗ M3 '),
  ('me-bo-khongAm', 'kb17', [(O, 'soCot: tru.soTien, khongAm: true });', 'soCot: tru.soTien, khongAm: !!tru.khach });', 1)], r'KB17 → HTTP: hai đơn trừ ví mẹ'),
  # ── Q9 = (a): duyệt hoàn trả phần ví mẹ (cùng giao dịch, sau cổng đơn) ──
  ('Q9-bo-hoan-me', 'thu', [(R, 'if (me?.parent_phone && Number(me.parent_balance_amount) > 0) {', 'if (false) {', 1)], r'✗ M5 '),
  ('Q9-hoan-me-vao-vi-con', 'thu', [(R, 'await ghiVi(tx, { phone: me.parent_phone,', 'await ghiVi(tx, { phone: refund.customer_phone,', 1)], r'✗ M5 '),
  ('Q9-hoan-me-ngoai-tx', 'thu', [(R, 'await ghiVi(tx, { phone: me.parent_phone,',
    "await ghiVi({ queryOne: require('../database').queryOne, run: require('../database').run }, { phone: me.parent_phone,", 1)], r'✗ M5 '),
  ('Q9-hoan-me-khong-qua-cong-don', 'thu', [
    (R, "    const kq = await trongGiaoDich(async (tx) => {\n      const refund = await tx.queryOne('SELECT * FROM pos_refund_requests WHERE id = ?', [req.params.id]);",
        "    await trongGiaoDich(async (t2) => { const r0 = await t2.queryOne('SELECT order_id FROM pos_refund_requests WHERE id = ?', [req.params.id]);\n"
        "      const me0 = r0 && await t2.queryOne('SELECT parent_phone, parent_balance_amount FROM pos_orders WHERE id = ?', [r0.order_id]);\n"
        "      if (me0?.parent_phone && Number(me0.parent_balance_amount) > 0) await ghiVi(t2, { phone: me0.parent_phone, loai: 'refund', "
        "soTien: Number(me0.parent_balance_amount), orderId: r0.order_id, nguoi: 'x' }); });\n"
        "    const kq = await trongGiaoDich(async (tx) => {\n      const refund = await tx.queryOne('SELECT * FROM pos_refund_requests WHERE id = ?', [req.params.id]);", 1),
    (R, 'if (me?.parent_phone && Number(me.parent_balance_amount) > 0) {', 'if (false) {', 1)], r'✗ M8 '),
  # ── yêu cầu hoàn ──
  ('yc-bo-kiem-trung', 'kb15', [(R, 'if (existing) return loi(400', 'if (false) return loi(400', 1)], r'KB15 → HTTP: hai lệnh tạo yêu cầu'),
  ('yc-kiem-trung-ngoai-tx', 'kb15', [
    (R, "    const kq = await trongGiaoDich(async (tx) => {\n      const order = await tx.queryOne('SELECT * FROM pos_orders WHERE id = ?', [order_id]);",
        "    const cu = await query('SELECT id FROM pos_refund_requests WHERE order_id = ? AND status = ?', [order_id, 'pending']);\n"
        "    const kq = await trongGiaoDich(async (tx) => {\n      const order = await tx.queryOne('SELECT * FROM pos_orders WHERE id = ?', [order_id]);", 1),
    (R, 'if (existing) return loi(400', 'if (cu.length) return loi(400', 1)], r'KB15 → HTTP: hai lệnh tạo yêu cầu'),
  # Cổng đơn (completed → refunded) che cổng yêu cầu ở ca duyệt hai lần; cổng yêu cầu có tác dụng RIÊNG ở yêu cầu đã từ chối.
  ('duyet-bo-chiem-yeu-cau', 'kb16', [(R, "WHERE id = ? AND status = 'pending'`, [req.user.username, now, refund.id]);", "WHERE id = ?`, [req.user.username, now, refund.id]);", 1)],
    r'KB16 → HTTP: duyệt chồng lên từ chối'),
  ('duyet-khong-kiem-changes', 'thu', [(R, 'if (chiem.changes !== 1) return', 'if (false) return', 1)], r'✗ A2d'),
  ('duyet-bo-cong-don', 'thu', [(R, "WHERE id = ? AND status = 'completed'`, [refund.order_id]);", "WHERE id = ?`, [refund.order_id]);", 1)], r'✗ A2a'),
  ('duyet-cong-don-khong-kiem-changes', 'thu', [(R, 'if (don.changes !== 1) return', 'if (false) return', 1)], r'✗ A2a'),
  ('tu-choi-bo-dieu-kien', 'kb16', [(R, "WHERE id = ? AND status = 'pending'`, [req.user.username, getNow(), reason, refund.id]);",
                                        "WHERE id = ?`, [req.user.username, getNow(), reason, refund.id]);", 1)], r'KB16 → HTTP: từ chối chồng'),
  ('tu-choi-khong-kiem-changes', 'kb16', [(R, 'return doi.changes === 1 ? doi :', 'return true ? doi :', 1)], r'KB16 → HTTP: từ chối chồng'),
  ('Q8-bo-chan-goi', 'thu', [(R, 'if (await coGoi(tx, ', 'if (false && await coGoi(tx, ', 2)], r'✗ Q8a'),
  ('Q8-chi-chan-luc-tao', 'thu', [(R, 'if (await coGoi(tx, refund.order_id))', 'if (false)', 1)], r'✗ Q8b'),
  # ── ví ──
  ('nap-ghi-tuyet-doi-tu-so-ngoai-tx', 'kb17', [
    (W, "    const kq = await trongGiaoDich((tx) => ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'topup',",
        "    const cu = await queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [normalizedPhone]);\n"
        "    const kq = await trongGiaoDich(async (tx) => { const r = await ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'topup',", 1),
    (W, "      cot: 'total_topup', soCot: topupAmount }));",
        "      cot: 'total_topup', soCot: topupAmount }); await tx.run('UPDATE pos_wallets SET balance = ? WHERE phone = ?', "
        "[Number(cu?.balance || 0) + topupAmount, normalizedPhone]); return r; });", 1)], r'KB17 → (HTTP: nạp 100\.000|I4)'),
  ('nap-so-truoc-doc-ngoai-tx', 'kb17', [
    (W, "    const kq = await trongGiaoDich((tx) => ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'topup',",
        "    const cu = await queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [normalizedPhone]);\n"
        "    const kq = await trongGiaoDich(async (tx) => { const r = await ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'topup',", 1),
    (W, "      cot: 'total_topup', soCot: topupAmount }));",
        "      cot: 'total_topup', soCot: topupAmount }); const t = Number(cu?.balance || 0); await tx.run('UPDATE pos_balance_transactions "
        "SET balance_before = ?, balance_after = ? WHERE id = ?', [t, t + topupAmount, r.id]); return r; });", 1)], r'KB17 → HTTP: chuỗi sổ'),
  ('ghiVi-bo-khongAm', 'kb17', [(W, 'if (khongAm && sau < 0) return', 'if (false) return', 1)], r'KB17 → HTTP: (trừ tay hết|hai đơn ví)'),
  ('tru-tay-chi-kiem-ngoai-tx', 'kb17', [
    (W, "    const kq = await trongGiaoDich(async (tx) => {\n      const r = await ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'purchase', soTien: -deductAmount,",
        "    const w0 = await queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [normalizedPhone]);\n"
        "    if (!w0 || w0.balance < deductAmount) return res.status(400).json({ error: 'Số dư không đủ', code: 'SO_DU_KHONG_DU' });\n"
        "    const kq = await trongGiaoDich(async (tx) => {\n      const r = await ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'purchase', soTien: -deductAmount,", 1),
    (W, 'soCot: deductAmount, khongAm: true', 'soCot: deductAmount, khongAm: false', 1)], r'KB17 → HTTP: trừ tay hết'),
  ('dieu-chinh-bo-khongAm', 'kb17', [(W, 'soCot: Math.abs(adjustAmount), khongAm: true', 'soCot: Math.abs(adjustAmount), khongAm: false', 1)], r'KB17 → HTTP: điều chỉnh âm'),
  ('doi-soat-bo-tx', 'kb17', [
    (W, '  return trongGiaoDich(async (tx) => {\n    const row = await tx.queryOne(', '  return (async (tx) => {\n    const row = await tx.queryOne(', 1),
    (W, '    return { phone, balance_before: before, balance_after: ledgerSum, ledger_sum: ledgerSum };\n  });\n}',
        '    return { phone, balance_before: before, balance_after: ledgerSum, ledger_sum: ledgerSum };\n  })({ queryOne, run: require(\'../database\').run });\n}', 1)],
    r'KB17 → HTTP: đối soát chồng'),
  ('doi-soat-doc-tong-ngoai-tx', 'kb17', [
    (W, '  return trongGiaoDich(async (tx) => {\n    const row = await tx.queryOne(',
        '  const row0 = await queryOne(`SELECT COALESCE(SUM(amount), 0) AS ledger_sum FROM pos_balance_transactions WHERE customer_phone = ? AND ${DK_LOAI_VI}`, '
        '[phone, ...LOAI_TINH_VAO_VI]);\n  return trongGiaoDich(async (tx) => {\n    const row = row0 || await tx.queryOne(', 1)], r'KB17 → (HTTP: đối soát chồng|I4)'),
  # ── báo hỏng ──
  ('hong-bo-tran', 'thu', [(D, 'if (finalRefund > damage_value || Number(da.tien) + finalRefund > Number(dong.tien)) {', 'if (false) {', 1)], r'✗ C1a'),
  ('hong-tran-theo-man-hinh', 'thu', [(D, 'const gia = Number(dong.gia);', 'const gia = Number(req.body.unit_price || dong.gia);', 1)], r'✗ C1b'),
  ('hong-lay-dong-dau', 'thu', [(D, "FROM pos_order_items WHERE order_id = ? AND product_code = ?`, [order_id, product_code]);",
                                    "FROM (SELECT * FROM pos_order_items WHERE order_id = ? AND product_code = ? ORDER BY id LIMIT 1)`, [order_id, product_code]);", 1)], r'✗ C6a'),
  ('hong-bo-tran-cong-don', 'thu', [(D, ' || Number(da.tien) + finalRefund > Number(dong.tien)) {', ') {', 1)], r'✗ C6b'),
  ('hong-bo-cong-don-so-luong', 'thu', [(D, 'const conLai = Number(dong.sl) - Number(da.sl);', 'const conLai = Number(dong.sl);', 1)], r'✗ C2a'),
  ('hong-cong-don-ngoai-tx', 'kb18', [
    (D, "    const kq = await trongGiaoDich(async (tx) => {\n      const order = await tx.queryOne(`SELECT * FROM pos_orders WHERE id = ?`, [order_id]);",
        "    const da0 = await queryOne(`SELECT COALESCE(SUM(quantity), 0) AS sl, COALESCE(SUM(refund_amount), 0) AS tien FROM pos_damage_logs "
        "WHERE order_id = ? AND product_code = ?`, [order_id, product_code]);\n"
        "    const kq = await trongGiaoDich(async (tx) => {\n      const order = await tx.queryOne(`SELECT * FROM pos_orders WHERE id = ?`, [order_id]);", 1),
    (D, 'const da = await tx.queryOne(`SELECT', 'const da = da0 || await tx.queryOne(`SELECT', 1)], r'KB18 → HTTP: báo hỏng chồng'),
  ('hong-bo-chan-don-huy', 'thu', [(D, "if (order.status !== 'completed') return loi(400, 'Đơn đã huỷ", "if (false) return loi(400, 'Đơn đã huỷ", 1)], r'✗ C3a'),
  ('hong-quen-refunded', 'thu', [(D, "if (order.status !== 'completed') return loi(400, 'Đơn đã huỷ", "if (order.status === 'cancelled') return loi(400, 'Đơn đã huỷ", 1)], r'✗ C3c'),
  ('hong-log-ngoai-tx', 'thu', [(D, 'const log = await tx.run(`', 'const log = await run(`', 1)], r'✗ C4b'),
  ('hong-bo-order-id-so', 'thu', [(D, 'orderId: order.id, ghiChu: `Đền bù', 'ghiChu: `Đền bù', 1)], r'✗ C4a'),
  # ── kho bận ở câu ĐẦU trong giao dịch (Turso: BEGIN lười) — catch không được đọc biến gán trong try (soát vòng 1) ──
  ('huy-catch-doc-order-code', 'thu', [(O, "Hủy đơn ${order?.code || '#' + req.params.id} - Rolled back", "Hủy đơn ${order.code} - Rolled back", 1)], r'✗ K1b huỷ đơn:'),
  ('xoa-catch-doc-order-code', 'thu', [(O, "Xóa đơn ${order?.code || '#' + req.params.id} - Rolled back", "Xóa đơn ${order.code} - Rolled back", 1)], r'✗ K1b xoá đơn:'),
  # ── /packages/buy ──
  ('packages-buy-dung-lai', 'thu', [(P, "// P26b (D): BỎ POST /buy",
    "router.post('/buy', authenticate, async (req, res) => { const r = await run(`INSERT INTO pos_customer_packages (customer_phone, package_id, total_qty, "
    "delivered_qty, status, created_at) VALUES (?, ?, ?, 0, 'active', datetime('now'))`, [req.body.customer_phone, req.body.package_id, req.body.total_qty]); "
    "res.json({ success: true, data: { id: Number(r.lastInsertRowid) } }); });\n// P26b (D): BỎ POST /buy", 1)], r'✗ D '),
  # ── giả lập: bất biến ──
  ('I1-nhanh-refunded-false', 'gl13', [('bat_bien.js', "|| (r.status === 'refunded' && String(r.luc_hoan) >= String(r.luc_dung)))))",
                                         "|| (false && String(r.luc_hoan) >= String(r.luc_dung)))))", 1)], r'KB13 → I1:'),
  # I10-bo: bỏ ở HOC-2b — I10 đã xoá (I10 ⊂ I11, chủ quán chốt 2a); neo của nó nay chỉ còn trong I11.
]
# BUSY → 409: bỏ ánh xạ ở TỪNG route (lần xuất hiện thứ i của loiGhi trong file) → đúng ca K1 của route đó đỏ.
for f, ds in [(O, ['tạo đơn', 'huỷ đơn', 'xoá đơn']), (R, ['tạo yêu cầu hoàn', 'duyệt hoàn', 'từ chối hoàn']),
              (W, ['nạp ví', 'trừ tay', 'điều chỉnh', 'đối soát', 'đối soát toàn bộ']), (D, ['báo hỏng'])]:
  for i, ten in enumerate(ds):
    DOT_BIEN.append((f'K1-bo-409-{ten.replace(" ", "-")}', 'thu', [(f, 'loiGhi(res, err);', ('res.status(500).json({ error: err.message });', i), len(ds))],
                     r'✗ K1 ' + re.escape(ten) + ':'))


def ap(thu_muc, cap):
  for f, cu, moi, n in cap:
    p = os.path.join(thu_muc, f)
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n:
      return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
    if isinstance(moi, tuple):   # chỉ thay lần xuất hiện thứ moi[1]
      vt = -1
      for _ in range(moi[1] + 1): vt = s.index(cu, vt + 1)
      s = s[:vt] + moi[0] + s[vt + len(cu):]
    else:
      s = s.replace(cu, moi)
    open(p, 'w', encoding='utf-8').write(s)
  return ''


def chay1(db):
  ten, cach, cap, bat = db
  tam = tempfile.mkdtemp(prefix='p26b_db_')
  try:
    if cach in ('gl13', 'thugl'):   # bản sao đặt ĐÚNG độ sâu: chay.js tự tìm tu_chay/ và server/ từ thư mục của nó
      thu = os.path.join(tam, 'cong_cu', 'gia_lap')
      shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), thu)
      for x in ('server', 'tu_chay', 'node_modules'): os.symlink(os.path.join(GOC, x), os.path.join(tam, x))
    else:
      thu = os.path.join(tam, 'server')
      shutil.copytree(os.path.join(GOC, 'server'), thu)
      os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
    loi = ap(thu, cap)
    if loi: return ten, False, loi
    if cach == 'thu': lenh = ['node', 'cong_cu/thu_P26b.js', '--may-chu', thu]
    elif cach.startswith('kb'): lenh = ['node', 'cong_cu/gia_lap/chay.js', '--may-chu', thu, '--den-kb', cach[2:]]
    elif cach == 'gl13': lenh = ['node', os.path.join(thu, 'chay.js'), '--den-kb', '13']
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
