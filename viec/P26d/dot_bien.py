#!/usr/bin/env python3
"""P26d — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:

    python3 viec/P26d/dot_bien.py [-j N] [tên…]

Khuôn viec/P26c/dot_bien.py (chép server/ ra thư mục tạm, thay chuỗi — mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn, không khớp là HỎNG; chạy
bài trên bản sao bằng --may-chu) + luật sập `sap_cua` của viec/AUDIT-4/boc.py (chỉ ĐỌC) + ĐỐI CHỨNG (K3, TOC-DO-1): bản sao KHÔNG đột
biến, hai bài thoát 0, đủ số ca ở dòng tổng — đối chứng đỏ thì không chấm. Nhãn: BẮT = bài không sập, thoát ≠ 0, có dòng ✗ khớp mẫu ·
LẠC = đỏ ở ca khác · SỐNG = thoát 0 · HỎNG = neo không áp được · HỎNG-sập = bài sập / không in dòng tổng · TREO = quá giờ.
Không đụng server/ thật, data/, Turso. Thư mục tạm xoá khi xong. Thoát: 0 mọi tên BẮT · 1 có tên khác BẮT · 2 tên lạ · 4 đối chứng đỏ.
"""
import importlib.util, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True   # nạp viec/AUDIT-4/boc.py: không đẻ __pycache__ trong thư mục việc khác

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
_sp = importlib.util.spec_from_file_location('boc_audit4', os.path.join(GOC, 'viec', 'AUDIT-4', 'boc.py'))
B = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(B)

BAI = {'thub': 'cong_cu/thu_P26b.js', 'thu': 'cong_cu/thu_P26c.js'}
SO_CA = {'thub': 102, 'thu': 150}   # dòng tổng "n đạt · 0 hỏng" khi KHÔNG đột biến (đối chứng)
GIO = 300
DB, W, H, O, BK, N = 'database.js', 'routes/wallets.js', 'utils/helpers.js', 'routes/orders.js', 'routes/backup.js', 'utils/nhatKyDon.js'
GOI = "          const cpResult = await tx.run("
THE = "        await tx.run(\n          `INSERT INTO pos_membership_purchases"
SO_NO = "        await tx.run(\n          `\n          INSERT INTO pos_balance_transactions ("

# (tên, bài, [(file trong server/, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu dòng ✗ phải thấy)
DOT_BIEN = [
  # ── A: thử lại BEGIN, kết nối không hỏng ──
  ('BV-A-bo-thu-lai', 'thub', [(DB, "if (lan >= CHO_BEGIN_MS.length) throw err;", "if (lan >= 0) throw err;", 1)], r'✗ D(1|5|8) '),
  ('VS-A-thu-lai-moi-loi', 'thub', [(DB, "        if (!laLoiBan(err)) throw err;\n", "", 1)], r'✗ D4 '),
  ('BV-A-bo-dong-tx-hong', 'thub', [(DB, "        if (tx) { try { tx.close(); } catch (e) { /* đã đóng */ } tx = null; }", "        tx = null;", 1)], r'✗ D8 '),
  ('BV-A-bo-thay-ket-noi', 'thub', [(DB, "  if (!laLoiBan(err) || db.protocol !== 'file') return;", "  return;", 1)], r'✗ D(3|7) '),
  ('VS-A-cho-qua-lau', 'thub', [(DB, "const CHO_BEGIN_MS = [50, 100, 200, 400, 800];", "const CHO_BEGIN_MS = [50, 100, 200, 400, 800, 2000];", 1)], r'✗ D(0|2) '),
  # ── B: một hàm laLoiBan, loiGhi không lộ câu nội bộ ──
  ('VS-B-chi-khop-mot-ma', 'thub', [(DB, "return MA_BAN.test(String((err && err.code) || ''));", "return String((err && err.code) || '') === 'SQLITE_BUSY';", 1)], r'✗ D(5|9) '),
  ('VS-B-khop-rong', 'thub', [(DB, "const MA_BAN = /^(SQLITE_BUSY|TRANSACTION_BUSY)(_|$)/;", "const MA_BAN = /BUSY|^TRANSACTION_/;", 1)], r'✗ D4 '),
  ('BV-B-loiGhi-ma-cu', 'thub', [(W, "  if (laLoiBan(err)) {", "  if (err && err.code === 'SQLITE_BUSY') {", 1)], r'✗ D9 '),
  ('BV-B-lo-message', 'thub', [(W, "error: 'Lỗi máy chủ — xem lại đã ghi chưa trước khi bấm lại' });", "error: err.message });", 1)], r'✗ D4 '),
  # ── C: mã đơn trong giao dịch ──
  ('BV-C-ma-don-ngoai-tx', 'thu', [(O, "    let orderCode;\n", "    let orderCode = await taoMaDonTheoSo(queryOne);\n", 1),
                                   (O, "orderCode = await taoMaDonTheoSo(tx.queryOne);", "void 0;", 1)], r'✗ (C1|G1) '),
  ('VS-C-nuot-loi-doc-ma', 'thu', [(H, "async function taoMaDonTheoSo(queryOne) {",
                                    "async function taoMaDonTheoSo(qo) {\n  const queryOne = (...a) => qo(...a).catch(() => null);", 1)], r'✗ C3 kho bận'),
  # ── D: 409 chỉ khi lỗi TRƯỚC commit ──
  ('BV-D-huy-doc-mon-sau-commit', 'thu', [
    (O, "đã bọc try/catch.\n        orderItems = await tx.query(", "đã bọc try/catch.\n        orderItems = await (async () => [])(", 1),
    (O, "      // Hoàn kho SX (bên ngoài transaction)\n", "      // Hoàn kho SX (bên ngoài transaction)\n      orderItems = await query(`SELECT oi.*, p.sx_product_type, "
        "p.sx_product_id FROM pos_order_items oi LEFT JOIN pos_products p ON oi.product_id = p.id WHERE oi.order_id = ?`, [order.id]);\n", 1)], r'✗ H1 '),
  ('BV-D-doi-soat-409', 'thub', [(W, "        if (!results.length) throw err;", "        throw err;", 1)], r'✗ H2 '),
  # ── E: ví không NULL, ví tạo lại không tổng chi âm ──
  ('BV-E-bo-chuan-hoa-null', 'thub', [(W, "  if (w && w.balance == null) await tx.run(", "  if (false) await tx.run(", 1)], r'✗ V1 '),
  ('BV-E-bo-coalesce-cot-tong', 'thub', [(W, "total_topup = COALESCE(total_topup, 0) + ?,", "total_topup = total_topup + ?,", 1),
                                         (W, "total_spent = COALESCE(total_spent, 0) + ?,", "total_spent = total_spent + ?,", 1)], r'✗ V2 '),
  ('VS-E-tong-chi-am', 'thub', [(W, "[phone, soTien, nap, Math.max(0, tieu), luc, luc]", "[phone, soTien, nap, tieu, luc, luc]", 1)], r'✗ V3 '),
  # ── F: khôi phục chặn mọi trang tiền, TRƯỚC mọi ghi; xem trước dùng CHUNG vị từ chanTrangTien (Q7d) ──
  ('BV-F-khong-chan', 'thub', [(BK, "  if (!bang.length) return false;", "  return false;", 1)], r'✗ F(1|2|4) '),
  ('VS-F-chan-sau-khi-xoa', 'thub', [(BK, "Vẫn SAO LƯU được (BACKUP_TABLES giữ đủ).\n    if (chanTrangTien(res, wb)) return;\n", "Vẫn SAO LƯU được (BACKUP_TABLES giữ đủ).\n", 1),
    (BK, "      const tableDef = labelToTable[sheetName];\n      if (!tableDef) {",
         "      if (chanTrangTien(res, { SheetNames: [sheetName], Sheets: wb.Sheets })) return;\n      const tableDef = labelToTable[sheetName];\n      if (!tableDef) {", 1)],
   r'✗ F1 '),
  ('BV-F-chi-nam-trang', 'thub', [(BK, ",\n  'pos_point_transactions', 'pos_customer_packages', 'pos_membership_purchases', 'pos_voucher_grants', 'pos_damage_logs',\n"
                                       "  'pos_discount_codes', 'pos_signup_codes', 'pos_order_log', 'pos_promotion_usage'];", "];", 1)],
   r'✗ F2 file có trang "(Giao dịch điểm thưởng|Gói của khách|Lịch sử mua thẻ|Voucher đã phát|Hàng hỏng|Mã chiết khấu)"'),
  ('VS-F-sot-ma-giam', 'thub', [(BK, "'pos_discount_codes', 'pos_signup_codes',", "'pos_signup_codes',", 1)], r'✗ F2 file có trang "Mã chiết khấu"'),
  ('BV-Q7a-bo-3-bang', 'thub', [(BK, ", 'pos_signup_codes', 'pos_order_log', 'pos_promotion_usage'];", "];", 1)],
   r'✗ F2 file có trang "(Mã ưu đãi khách mới|Nhật ký đơn|Lịch sử dùng khuyến mãi)"'),
  ('BV-Q7d-xem-truoc-khong-chan', 'thub', [(BK, "    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });\n    if (chanTrangTien(res, wb)) return;\n    const preview = [];",
                                            "    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });\n    const preview = [];", 1)], r'✗ F4 '),
  ('VS-Q7d-xem-truoc-chan-moi-file', 'thub', [(BK, "    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });\n    if (chanTrangTien(res, wb)) return;\n    const preview = [];",
                                               "    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });\n    if (chanTrangTien(res, wb) || res.status(400).json({ code: 'KHOI_PHUC_VI_DON_BI_CHAN', bang: [] })) return;\n    const preview = [];", 1)], r'✗ F5 '),
  # ── G: KB20 — kiểm lại mã giảm trong giao dịch ──
  ('BV-G-bo-kiem-lai-ma', 'thu', [(O, "        if (\n          freshCode.usage_limit > 0 &&", "        if (\n          false &&", 1)], r'✗ G1 '),
  # ── I: gói / thẻ trong giao dịch đơn ──
  # Bỏ vá gói = đưa NGUYÊN khối cũ (sau commit, run thường, nuốt lỗi) trở lại, tắt khối trong giao dịch. Neo "ghi gói bằng run trong
  # giao dịch" làm MỌI lần mua gói 409 → bước dựng thu_P26c / thu_GOI1 sập trước I3 (sập ≠ BẮT, K3) — đã thử, ghi ở trang_thai.md.
  ('BV-I-goi-sau-commit', 'thu', [(O, "      if (package_buy && package_buy.package_id && phone) {", "      if (false) {", 1),
    (O, "    // Tạo registration cho khách mới", "    if (package_buy && package_buy.package_id && phone) { try { for (let i = 0; i < pkgQty; i++) { const cp = await run("
        "`INSERT INTO pos_customer_packages (customer_phone, package_id, order_id, total_qty, delivered_qty, status, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, 0, 'active', ?, ?)`, [phone, package_buy.package_id, orderId, soLuotGoi, now, now]); const cpId = Number(cp.lastInsertRowid); "
        "if (i === 0) { const q = orderItems.reduce((t, it) => t + (it.from_package ? it.quantity : 0), 0); if (q > 0) { await run(`UPDATE "
        "pos_customer_packages SET delivered_qty = ?, status = CASE WHEN ? >= total_qty THEN 'completed' ELSE 'active' END, updated_at = ? WHERE id = ?`, "
        "[q, q, now, cpId]); await run('UPDATE pos_orders SET customer_package_id = ? WHERE id = ?', [cpId, orderId]); } } } } catch (err) { "
        "console.error('Package buy record error:', err.message); } }\n    // Tạo registration cho khách mới", 1)], r'✗ I1 '),
  ('VS-I-nuot-loi-goi', 'thu', [(O, GOI, "          const cpResult = await ((...a) => tx.run(...a).catch(() => ({ lastInsertRowid: 0 })))(", 1)], r'✗ I1 '),
  ('BV-I-the-ngoai-tx', 'thu', [(O, THE, "        await run(\n          `INSERT INTO pos_membership_purchases", 1)], r'✗ I4 '),
  ('VS-I-nuot-loi-the', 'thu', [(O, THE, "        await ((...a) => tx.run(...a).catch(() => {}))(\n          `INSERT INTO pos_membership_purchases", 1)], r'✗ I2 '),
  # ── P: pay-debt một giao dịch, nhật ký qua ghiNhatKy(…, tx) (Q6 a) ──
  ('BV-P-so-ngoai-tx', 'thu', [(O, SO_NO, "        await run(\n          `\n          INSERT INTO pos_balance_transactions (", 1)], r'✗ P4 '),
  ('VS-P-lo-message', 'thu', [(O, "    loiGhi(res, err);   // P26d: bận → 409 KHO_BAN (giao dịch đã rollback); khác → 500 không lộ câu nội bộ",
                               "    res.status(500).json({ error: err.message });", 1)], r'✗ P1 '),
  ('BV-P-nhat-ky-nuot-loi', 'thu', [(N, "  if (tx) return tx.run(cau, thamSo);", "  if (tx) return tx.run(cau, thamSo).catch(() => {});", 1)], r'✗ P2 '),
  ('BV-P-nhat-ky-ngoai-tx', 'thu', [(O, "con_no: remainingDebt }, tx);", "con_no: remainingDebt });", 1)], r'✗ P(2|4) '),
  # ── PD: pay-debt amount phải số nguyên dương hữu hạn (chủ quán 19.10); không gửi = thu đủ; đúng bằng nợ trong sổ (nợ cũ lẻ) vẫn thu ──
  ('BV-PD-bo-kiem-so-tien', 'thu', [(O, "    if (amount != null && amount !== order.debt_amount && !(Number.isInteger(amount) && amount > 0)) {", "    if (false) {", 1)], r'✗ P6 '),
  ('VS-PD-chi-chan-khong-duong', 'thu', [(O, "!(Number.isInteger(amount) && amount > 0)) {", "!(Number(amount) > 0)) {", 1)], r'✗ P6 thu nợ amount (số lẻ|chuỗi số)'),
  ('VS-PD-bo-ngoai-le-no-le', 'thu', [(O, "if (amount != null && amount !== order.debt_amount && !(", "if (amount != null && !(", 1)], r'✗ P9 '),
  ('VS-PD-chan-ca-khong-gui', 'thu', [(O, "if (amount != null && amount !== order.debt_amount && !(", "if (amount !== order.debt_amount && !(", 1)], r'✗ P7 '),
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


def chay1(db):   # → (tên, nhãn, chi tiết, dòng tổng)
  ten, cach, cap, mau = db
  tam = tempfile.mkdtemp(prefix='p26d_db_')
  try:
    thu = os.path.join(tam, 'server')
    shutil.copytree(os.path.join(GOC, 'server'), thu)
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
    loi = ap(thu, cap)
    if loi: return ten, 'HỎNG', loi, ''
    try:
      r = subprocess.run(['node', BAI[cach], '--may-chu', thu], cwd=GOC, capture_output=True, text=True, timeout=GIO)
    except subprocess.TimeoutExpired:
      return ten, 'TREO', f'quá {GIO} s', ''
    ra = B.ra_cua(r)
    t = re.search(r'\d+ đạt · \d+ hỏng', ra)
    tong = t.group(0) if t else ''
    sap = B.sap_cua(r.returncode, ra)
    if sap: return ten, 'HỎNG-sập', f'{sap[:160]} · thoát {r.returncode}', tong
    if r.returncode == 0: return ten, 'SỐNG', f'thoát 0 · {tong}', tong
    do = [l.strip() for l in ra.splitlines() if l.strip().startswith('✗ ')]
    khop = [l for l in do if re.search(mau, l)]
    if khop: return ten, 'BẮT', f'{khop[0][:170]} · {tong}', tong
    return ten, 'LẠC', f'thoát {r.returncode} · {tong} · ' + (' | '.join(do)[:200] or 'không dòng ✗'), tong
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def doi_chung():   # bản sao KHÔNG đột biến (neo thay bằng chính nó): mỗi bài thoát 0, không sập, đúng số ca
  ok = True
  for cach in BAI:
    ten, nhan, chi, tong = chay1((f'sạch:{cach}', cach, [(O, '// 1. Tạo đơn hàng', '// 1. Tạo đơn hàng', 1)], r'$^'))
    dung = nhan == 'SỐNG' and tong == f'{SO_CA[cach]} đạt · 0 hỏng'
    ok = ok and dung
    print(('  ✓ ' if dung else '  ✗ ') + f'đối chứng {BAI[cach]}: {nhan} · {tong or chi} (mong {SO_CA[cach]} đạt · 0 hỏng)')
  return ok


def main():
  a = sys.argv[1:]
  j = 4
  if '-j' in a:
    i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  ten_co = {d[0] for d in DOT_BIEN}
  la = [t for t in a if t not in ten_co]
  if la: print('  tên lạ: ' + ', '.join(la)); return 2
  if not doi_chung(): print('\n  DỪNG — đối chứng đỏ / lệch số ca, không chấm (K3)'); return 4
  chon = [d for d in DOT_BIEN if not a or d[0] in a]
  with ThreadPoolExecutor(max_workers=j) as ex:
    kq = list(ex.map(chay1, chon))
  for ten, nhan, chi, _ in kq:
    print(('  ✓ ' if nhan == 'BẮT' else '  ✗ ') + f'{ten}: {nhan} · {chi}')
  bat = sum(n == 'BẮT' for _, n, _, _ in kq)
  print(f'\n  {bat} đột biến BẮT · {len(kq) - bat} KHÔNG (trên {len(kq)})')
  return 0 if bat == len(kq) else 1


if __name__ == '__main__':
  sys.exit(main())
