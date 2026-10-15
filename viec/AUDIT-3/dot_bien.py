#!/usr/bin/env python3
"""AUDIT-3 A4 — đột biến ĐỘC LẬP cho đường tiền thêm từ sau AUDIT-2 (P26c hoàn tiền, GOI-1 trần theo loại, GOI-2 kết thúc gói, SO-LUONG-1
cổng mua gói / thẻ), ở chỗ bộ của CHÍNH việc đó chưa đột biến (đối chiếu neo bằng grep — ke_hoach.md A4). Chạy ở GỐC kho:

    python3 viec/AUDIT-3/dot_bien.py [tên...]

Khuôn viec/SO-LUONG-1/dot_bien.py: chép server/ ra thư mục tạm, thay chuỗi (phải khớp ĐÚNG số lần — không khớp là HỎNG, K3), chạy bài thử trên
bản sao. ĐỐI CHỨNG trước: bản sao chưa đột biến phải 0 hỏng với mỗi bài dùng tới. BẮT = thoát ≠ 0 + dòng khớp mẫu + bài chạy HẾT (dòng
`N đạt · M hỏng`) + không dấu sập `SAP` (sập = HỎNG, không bắt — soát vòng 3). SỐNG ở đột biến đụng tiền / ví / gói = NẶNG (bao_cao.md). Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SAP = re.compile(r'Bài thử sập|bài thử sập|Giả lập: SẬP|SẬP giữa kịch bản|Node\.js v\d')   # cùng boc.py (soát vòng 3): dấu harness chết, kể cả node văng thô
HET = re.compile(r'\d+ đạt · \d+ hỏng')   # bài chạy HẾT (xanh hay đỏ); thiếu = sập mã 0 / mã 1 không dấu → HỎNG, không BẮT
O, T, G, W, R, D = 'routes/orders.js', 'utils/tienDaTra.js', 'utils/goiKhach.js', 'routes/wallets.js', 'routes/refunds.js', 'routes/damages.js'

# (tên, chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
#   chạy: 'p26c' = thu_P26c.js · 'thu' = thu_GOI1.js · 'thub' = thu_P26b.js (đều --may-chu <bản sao server>)
DOT_BIEN = [
  # ── D2: công cụ không nói dối ──
  ('D2-AU3-sai-chuoi', 'p26c', [(O, 'CHUOI_KHONG_CO_TRONG_FILE_AUDIT3', 'x', 1)], r'✗ '),
  ('D2-AU3-da-biet', 'p26c', [(O, '      if (!soNguyenDuong(sl)) {', '      if (false) {', 1)], r'✗ S1c'),
  ('D2-AU3-vo-hai', 'p26c', [(O, '// 1. Tạo đơn hàng', '// 1. Tao don hang (AUDIT-3 vo hai)', 1)], r'✗ '),
  ('D2-AU3-sap', 'p26c', [(O, '// 1. Tạo đơn hàng', '}}}{{{', 1)], r'✗ '),
  ('D2-AU3-sap-0', 'p26c', [(O, '// 1. Tạo đơn hàng', 'process.exit(0);', 1)], r'✗ '),   # máy chủ trong tiến trình bài → thoát 0 không dòng tổng (soát vòng 2)
  # ── P26c: hoàn tiền / đền (tienDaTra.js, damages.js, refunds.js, orders.js hoanVi) ──
  ('BV-AU3-P26C-DATRA-BO-TRU-SHIP', 'p26c', [(T, 'Number(order.total || 0) - Number(order.shipping_fee || 0)', 'Number(order.total || 0)', 1)], r'✗ '),
  ('VS-AU3-P26C-DATRA-GIA-GOC', 'p26c', [(T, 'Number(d.flash_unit_price || d.tier_unit_price || d.unit_price || 0)', 'Number(d.unit_price || 0)', 1)], r'✗ B1'),
  ('VS-AU3-P26C-DEN-GIAM-BO-FLASH', 'p26c', [(T, 'const giam = Number(order.discount || 0) - Number(order.flash_discount || 0) - Number(order.tier_discount || 0);',
                                              'const giam = Number(order.discount || 0) - Number(order.tier_discount || 0);', 1)], r'✗ B1'),
  ('VS-AU3-P26C-DEN-TRAN-CA-DON', 'p26c', [(D, '.filter((d) => d.product_code === product_code)', '', 1)], r'✗ B1'),
  ('VS-AU3-P26C-DUYET-VI-DA-TRA-CHI-CON', 'thub', [(R, 'Number(refund.refund_amount) + (don.parent_phone ? Number(don.parent_balance_amount || 0) : 0)',
                                                     'Number(refund.refund_amount)', 1)], r'✗ M5'),
  ('VS-AU3-P26C-HUY-ME-TRA-0', 'thub', [(O, 'const meTra = order.parent_phone ? Number(order.parent_balance_amount || 0) : 0;', 'const meTra = 0;', 1)], r'✗ M[23]'),
  # ── GOI-1: trần theo loại (goiKhach.js) ──
  ('VS-AU3-GOI1-LOAI-KHONG-CONG-DON', 'thu', [(G, 'xin[khoaLoai(m)] = (xin[khoaLoai(m)] || 0) + Number(m.quantity);', 'xin[khoaLoai(m)] = Number(m.quantity);', 1)], r'✗ A2'),
  ('BV-AU3-GOI1-LOAI-BO-DA-LAY', 'thu', [(G, 'const con = Number(g.qty) - Number(da?.delivered_qty || 0);', 'const con = Number(g.qty);', 1)], r'✗ A2'),
  ('VS-AU3-GOI1-DEM-DONG-THAY-SL', 'thu', [(G, 'SUM(oi.quantity) AS delivered_qty', 'COUNT(*) AS delivered_qty', 1)], r'✗ A2'),
  ('VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN', 'thu', [(G, 'if (!(Number(g.qty) > 0) || !xin[khoaLoai(g)]) continue;', 'if (!xin[khoaLoai(g)]) continue;', 1)], r'✗ A[12]'),
  # ── GOI-2: kết thúc gói (tienDaTra.js soTienHoanGoi, wallets.js ghiHoan) ──
  ('BV-AU3-GOI2-BO-TRAN-DA-NHAN', 'thu', [(T, 'Math.max(0, Math.min(goc, Number(don.total || 0) - Number(so.nhan)))', 'goc', 1)], r'✗ B[37]'),
  ('VS-AU3-GOI2-HOAN-CA-DA-LAY', 'thu', [(T, 'Math.max(0, Number(cp.total_qty) - Number(cp.delivered_qty))', 'Number(cp.total_qty)', 1)], r'✗ B3'),
  ('VS-AU3-GOI2-NHAN-BO-DEN', 'thu', [(T, "type IN ('refund', 'compensation')", "type IN ('refund')", 1)], r'✗ B[37]'),
  ('VS-AU3-GOI2-GHI-HOAN-PHAN-VI-HOAN-GOI', 'thu', [(W, "[tuVi, 'cash', 'total_spent']", "[tuVi, 'hoan_goi', null]", 1)], r'✗ B[37]'),
  # ── SO-LUONG-1: đường nhiều gói (orders.js pkgQty, tienDaTra.js mẫu số) ──
  ('VS-AU3-SL-TIEN-MOT-GOI', 'p26c', [(O, 'subtotal += pkg.price * pkgQty;', 'subtotal += pkg.price;', 1)], r'✗ S2'),
  ('VS-AU3-SL-DONG-GOI-SL-1', 'p26c', [(O, 'quantity: pkgQty,', 'quantity: 1,', 1)], r'✗ (S2|A5)'),
  ('VS-AU3-SL-DONG-GOI-TONG-1', 'p26c', [(O, 'total_price: pkg.price * pkgQty,', 'total_price: pkg.price,', 1)], r'✗ (S2|A5|I)'),
  ('VS-AU3-SL-TAO-MOT-GOI', 'p26c', [(O, 'for (let i = 0; i < pkgQty; i++) {', 'for (let i = 0; i < 1; i++) {', 1)], r'✗ S2'),
  ('VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL', 'p26c', [(T, '(Number(d.quantity) * Number(g.total_qty))', 'Number(g.total_qty)', 1)], r'✗ A5'),
  # ── bổ sung (cùng neo bộ SO-LUONG-1, khác lỗi — không đếm vào "≥ 3 chỗ mới") ──
  ('BV-AU3-SL-HAM-LUON-DUNG', 'p26c', [(O, 'const soNguyenDuong = (x) => Number.isInteger(Number(x)) && Number(x) >= 1;', 'const soNguyenDuong = (x) => true;', 1)], r'✗ S[12]'),
  ('BV-AU3-SL-THE-BO-CONG', 'p26c', [(O, 'if (membership_buy && membership_buy.tier_id && !normalizePhone(customer_phone)) {', 'if (false) {', 1)], r'✗ S4c'),
]

BAI = {'p26c': 'cong_cu/thu_P26c.js', 'thu': 'cong_cu/thu_GOI1.js', 'thub': 'cong_cu/thu_P26b.js'}


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


def ban_sao(tam):  # chép server/ thật ra thư mục tạm, node_modules chỉ nối symlink (đọc)
  thu = os.path.join(tam, 'server')
  shutil.copytree(os.path.join(GOC, 'server'), thu)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
  return thu


def chay_bai(cach, thu):  # → (mã thoát, đầu ra đã bỏ mã màu); TMPDIR = thư mục tạm của đột biến → bài chết giữa chừng không để sót /tmp/thu_* (soát vòng 3)
  r = subprocess.run(['node', BAI[cach], '--may-chu', thu], cwd=GOC, capture_output=True, text=True, timeout=300, env={**os.environ, 'TMPDIR': os.path.dirname(thu)})
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def chay1(db):  # → (tên, kết quả BẮT/SỐNG/HỎNG/LẠC, chi tiết)
  ten, cach, cap, bat = db
  tam = tempfile.mkdtemp(prefix='audit3_db_')
  try:
    thu = ban_sao(tam)
    loi = ap(thu, cap)
    if loi: return ten, 'HỎNG', loi
    ma, ra = chay_bai(cach, thu)
    sap = [l.strip() for l in ra.splitlines() if SAP.search(l)]   # harness chết (ném, văng thô) → KHÔNG tính là bắt, dù đã in ✗ trước đó (soát vòng 1, 2, 3)
    if sap or ma == 2 or not HET.search(ra):
      return ten, 'HỎNG', 'bài thử SẬP (không phải đột biến bị bắt): ' + (sap[0][:140] if sap else f'thoát {ma} KHÔNG có dòng tổng · ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:100])
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    if ma != 0 and trung: return ten, 'BẮT', trung[0][:160]
    return ten, ('SỐNG' if ma == 0 else 'LẠC'), f'thoát {ma}, KHÔNG thấy /{bat}/ · ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:120]
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def doi_chung(cach):  # bản sao CHƯA đột biến phải xanh — nếu không, mọi kết quả dưới đều vô nghĩa
  tam = tempfile.mkdtemp(prefix='audit3_dc_')
  try:
    ma, ra = chay_bai(cach, ban_sao(tam))
    tong = [l.strip() for l in ra.splitlines() if 'đạt · ' in l]
    return ma == 0, f'{BAI[cach]}: ' + (tong[-1] if tong else (ra.strip().splitlines() or [f'thoát {ma}, không in gì'])[-1][:120])
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  if len({d[0] for d in DOT_BIEN}) != len(DOT_BIEN): print('tên đột biến trùng'); sys.exit(2)
  for cach in sorted({d[1] for d in chon}):
    xanh, chi = doi_chung(cach)
    print(('  ✓ ' if xanh else '  ✗ ') + f'đối chứng (bản sao chưa đột biến phải xanh): {chi}')
    if not xanh:
      print('\n  DỪNG — bài thử đỏ trên bản chưa đột biến, không chạy đột biến (K3)')
      sys.exit(4)
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(chay1, chon))
  for ten, k, chi in kq:
    print(f'  {k:5} {ten}: {chi}')
  dem = {x: sum(k == x for _, k, _ in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'\n  tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()))
  sys.exit(1 if dem['SỐNG'] + dem['LẠC'] else 0)
