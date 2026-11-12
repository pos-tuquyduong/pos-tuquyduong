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

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── orders.js kiemVoucherDon: từng vế kiểm voucher ──
  ('BV-V2-CHINH-CHU', [(O, 'Number(v.chinh_chu) && v.chu !== phone ?', 'false ?', 1)], r'✗ C4a ', 'V2'),
  ('VS-V2-CHINH-CHU-MOI-MA', [(O, 'Number(v.chinh_chu) && v.chu !== phone ?', 'v.chu !== phone ?', 1)], r'✗ C4c ', 'V2'),
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
  ('BV-V2-HOA-DON-VOUCHER', [(H, 'giam_ma: Math.max(0, giamMa - giamVoucher),', 'giam_ma: giamMa,', 1)], r'✗ I2 ', 'V2'),
  ('BV-V2-APP-VOUCHER', [(D, '...(vouchers.length ? { vouchers } : {}),', '', 1)], r'✗ H2 ', 'V2'),
  ('VS-V2-APP-BAM-CU', [(D, "...(Array.isArray(b.vouchers) && b.vouchers.length ? [b.vouchers] : [])", "b.vouchers ?? null", 1)], r'✗ K1 ', 'KHTHE1'),
  ('BV-V2-APP-SAI-DANG', [(D, "  if (b.vouchers != null && !(Array.isArray(b.vouchers)", "  if (false && !(Array.isArray(b.vouchers)", 1)], r'✗ H5 ', 'V2'),
]

BAI = {'V2': 'thu_VOUCHER2.js', 'KHTHE1': 'thu_KHTHE1.js', 'P26c': 'thu_P26c.js', 'UUDAI1': 'thu_UUDAI1.js'}


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_voucher2_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
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
  return ['node', os.path.join(GOC, 'cong_cu', BAI[bai]), '--may-chu', os.path.join(tmp, 'server')]


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=400)
    ra = re.sub(r'\x1b\[\d+m', '', (r.stdout or '') + (r.stderr or ''))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra):
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
  tmp, _ = ban_sao([])
  try:
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=400)
    ra = re.sub(r'\x1b\[\d+m', '', (r.stdout or '') + (r.stderr or ''))
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
