#!/usr/bin/env python3
"""HUY-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/HUY-1/dot_bien.py [tên...]           (không tên = chạy hết; có ĐỐI CHỨNG trước cho từng bài)
    python3 viec/HUY-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/HUY-1/dot_bien.py --help

Khuôn viec/VI-ME-1/dot_bien.py: chép server/ + cong_cu/ + HOP_DONG_API_KH.md + kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử của đột biến TRONG bản sao
(`node <tạm>/cong_cu/<bài>` — thu_GIAO1.js không có --may-chu, đọc server/ cạnh nó). BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải
bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O, W, DB, NC = 'server/routes/orders.js', 'server/routes/wallets.js', 'server/database.js', 'server/nang_cap/025_huy_don.js'
DS, DA, GH = 'server/utils/doiSoat.js', 'server/utils/donApp.js', 'server/utils/giaoHang.js'NGAY = 'if (req.user.role !== "owner" && String(order.created_at || "").slice(0, 10) < now.slice(0, 10)) {'
TONG = 'viCon + meTra + (huy ? tienMat + ck : 0)'
Y_KET = "(SELECT COALESCE(SUM(so_tien), 0) FROM pos_hoan_tien_mat WHERE DATE(luc) BETWEEN ? AND ?)' : '0'"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── orders.js hoanVi: hoàn toàn bộ ──
  ('BV-HOAN-TIEN-MAT', [(O, TONG, 'viCon + meTra + (huy ? ck : 0)', 1)], r'✗ D1 ', 'thu_HUY1.js'),
  ('BV-HOAN-CK', [(O, TONG, 'viCon + meTra + (huy ? tienMat : 0)', 1)], r'✗ D2 ', 'thu_HUY1.js'),
  ('VS-CK-VAO-TIEN-MAT', [(O, 'const phanTienMat = huy ? Math.min(ngoaiVi, tienMat) : ngoaiVi;', 'const phanTienMat = ngoaiVi;', 1)], r'✗ D2 ', 'thu_HUY1.js'),
  ('VS-TIEN-MAT-NHU-VI', [(O, 'const tuVi = coGoi || huy ? Math.min(con, viCon) : con;', 'const tuVi = coGoi ? Math.min(con, viCon) : con;', 1)], r'✗ D1 ', 'thu_HUY1.js'),
  ('BV-KHACH-LE', [(O, 'if (huy && !order.customer_phone) {', 'if (false) {', 1)], r'✗ E1 ', 'thu_HUY1.js'),
  ('VS-XOA-DOI', [(O, 'await hoanVi(tx, order, req.user.username, now, "xóa");', 'await hoanVi(tx, order, req.user.username, now, "xóa", { ma: "khac", chu: "x" });', 1)],
   r'✗ K1 ', 'thu_HUY1.js'),
  # ── orders.js route huỷ: quyền theo ngày ──
  ('BV-NGAY-TRUOC', [(O, NGAY, 'if (false) {', 1)], r'✗ B3 ', 'thu_HUY1.js'),
  ('VS-NGAY-BANG', [(O, NGAY, NGAY.replace('< now.slice', '<= now.slice'), 1)], r'✗ B2 ', 'thu_HUY1.js'),
  ('VS-NGAY-CHO-QUAN-LY', [(O, NGAY, NGAY.replace('req.user.role !== "owner"', '!["owner", "manager"].includes(req.user.role)'), 1)], r'✗ B3 ', 'thu_HUY1.js'),
  # ── orders.js lý do ──
  ('BV-LY-DO', [(O, '        if (!lyDo) {   // HUY-1 (C)', '        if (false) {   // HUY-1 (C)', 1)], r'✗ C1 ', 'thu_HUY1.js'),
  ('VS-KHAC-KHONG-TRIM', [(O, ".trim().slice(0, 300);\n  if (!Object.hasOwn", ".slice(0, 300);\n  if (!Object.hasOwn", 1)], r'✗ C3 ', 'thu_HUY1.js'),
  ('VS-MA-LA-QUA', [(O, 'if (!Object.hasOwn(LY_DO_HUY, ma) || (ma', 'if ((ma', 1)], r'✗ C2 ', 'thu_HUY1.js'),
  ('VS-BO-THAN-CU', [(O, "const ma = moi ? String(body.ly_do_ma) : 'khac';", 'const ma = String(body?.ly_do_ma);', 1)], r'✗ C6 ', 'thu_HUY1.js'),
  # ── quyền staff: seed + bước 025 ──
  ('BV-SEED-STAFF', [(DB, "['staff', 'cancel_order', 0],", "['staff', 'cancel_order', 1],", 1)], r'✗ B1 ', 'thu_HUY1.js'),
  ('BV-025-QUYEN', [(NC, 'UPDATE pos_permissions SET allowed = 0 WHERE', 'UPDATE pos_permissions SET allowed = allowed WHERE', 1)], r'✗ B1b ', 'thu_HUY1.js'),
  # ── wallets.js ghiHoan: nguồn từng dòng ──
  ('VS-CACH-HOAN-GOI', [(W, "[tienMat, huy ? 'huy_tien_mat' : 'hoan_goi', null,", "[tienMat, 'hoan_goi', null,", 1)], r'✗ D1 ', 'thu_HUY1.js'),
  ('BV-GHI-CK', [(W, "[ck, 'huy_ck', null,", "[0, 'huy_ck', null,", 1)], r'✗ D2 ', 'thu_HUY1.js'),
  # ── doiSoat.js: két + hai dòng mới ──
  ('VS-KET-CU', [(DS, "o.status = 'cancelled' AND o.huy_ly_do_ma IS NULL AND DATE(o.cancelled_at)", "o.status = 'cancelled' AND DATE(o.cancelled_at)", 1)], r'✗ F2 ', 'thu_HUY1.js'),
  ('BV-KET-Y', [(DS, Y_KET, Y_KET.replace('SUM(so_tien)', 'SUM(0 * so_tien)'), 1)], r'✗ F2 ', 'thu_HUY1.js'),
  ('VS-X-DON-CU', [(DS, 'o.huy_ly_do_ma IS NOT NULL AND DATE(t.created_at)', 'o.huy_ly_do_ma IS NULL AND DATE(t.created_at)', 1)], r'✗ F1 ', 'thu_HUY1.js'),
  # ── donApp.js: App ──
  ('VS-LO-GHI-THEM', [(DA, '(LY_DO_HUY[ext?.o?.huy_ly_do_ma] ?? null)', '(ext?.o?.cancelled_reason ?? null)', 1)], r'✗ H1 ', 'thu_HUY1.js'),
  ('BV-HOAN-APP', [(DA, "hoan_vao_tai_khoan: tt === 'da_huy' ? (ext?.hoan ?? 0) : null,", "hoan_vao_tai_khoan: tt === 'da_huy' ? 0 : null,", 1)], r'✗ H1 ', 'thu_HUY1.js'),
  ('BV-OID', [(DA, 'o.id AS oid, o.code, o.customer_name', 'o.code, o.customer_name', 1)], r'✗ A4 ', 'thu_HUY1.js'),
  ('BV-HOAN-ME', [(DA, 'JOIN pos_orders o ON o.id = t.order_id AND o.customer_phone = t.customer_phone', 'JOIN pos_orders o ON o.id = t.order_id', 1)],
   r'✗ H6 ', 'thu_HUY1.js'),   # soát vòng 1  # ── giaoHang.js: Q6 bỏ cổng tạm, Q8 giữ chặn đơn giao không tài khoản ──
  ('BV-Q8', [(GH, 'if (!order.customer_phone && (Number(order.cash_amount)', 'if (false && (Number(order.cash_amount)', 1)], r'✗ J4b ', 'thu_GIAO1.js'),
  ('VS-Q8-CHAN-HET', [(GH, 'if (!order.customer_phone && (Number(order.cash_amount)', 'if ((Number(order.cash_amount)', 1)], r'✗ J4 \+ J9 ', 'thu_GIAO1.js'),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/ + HOP_DONG_API_KH.md ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_huy1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tmp, 'cong_cu'), ignore=shutil.ignore_patterns('node_modules'))
  for tep in ('HOP_DONG_API_KH.md', 'kiem_tra_truoc_khi_giao.js'):   # thu_HUY1 H5 đọc hợp đồng; thu_GIAO1 T2 đọc bộ kiểm
    shutil.copy(os.path.join(GOC, tep), tmp)
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
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', bai)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[\d+m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai):
  tmp, _ = ban_sao([])
  try:
    ma, ra = chay_bai(tmp, bai)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  for bai in sorted({d[3] for d in ds}):
    ok, dong = doi_chung(bai)
    print(f'ĐỐI CHỨNG {bai} (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
    if not ok:
      sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
