#!/usr/bin/env python3
"""P22-23 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/P22-23/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/P22-23/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/P22-23/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ + cong_cu/gia_lap/ của commit sha)
    python3 viec/P22-23/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/DOI-SOAT-1/dot_bien.py: chép server/ và cong_cu/gia_lap/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink,
chỉ đọc), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy bài:
  'p2223' → `node cong_cu/thu_P2223.js --may-chu <bản sao server>` (bài nạp bat_bien.js từ <bản sao>/cong_cu/gia_lap);
  'gl'    → `node cong_cu/thu_gia_lap.js --chi-du-lieu-tay --gia-lap <bản sao>/cong_cu/gia_lap` (I8 trên kho dữ liệu tay).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 / bài sập hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O, S, BB = 'server/routes/orders.js', 'server/routes/signup-codes.js', 'cong_cu/gia_lap/bat_bien.js'
CONG = "if ((package_buy || membership_buy) && debt_amount > 0) {"
DIEM_TAO = "if (phone && finalPaymentStatus === 'paid' && !flashApplied)"
GHI_THU = "await tx.run(\n            `INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at)"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── D: cổng mua gói / thẻ chưa thu đủ ──
  ('BV-cong-goi-the', [(O, CONG, "if (false) {", 1)], r'✗ D1 ', 'p2223'),
  ('VS-cong-chi-goi', [(O, CONG, "if (package_buy && debt_amount > 0) {", 1)], r'✗ D2 ', 'p2223'),
  ('VS-cong-tin-may-khach', [(O, CONG, "if ((package_buy || membership_buy) && payment_status !== 'paid') {", 1)], r'✗ D3b', 'p2223'),
  # ── A/B: điểm lúc tạo chỉ khi thu đủ ──
  ('BV-diem-tao-bo-dk-thu', [(O, DIEM_TAO, "if (phone && !flashApplied)", 1)], r'✗ B1 ', 'p2223'),
  ('VS-diem-tao-tin-may-khach', [(O, DIEM_TAO, "if (phone && payment_status === 'paid' && !flashApplied)", 1)], r'✗ B4 ', 'p2223'),
  # ── C/G: pay-debt cộng điểm khi thu đủ ──
  ('BV-pay-debt-diem', [(O, "if (diemThu) {", "if (false) {", 1)], r'✗ C1 ', 'p2223'),
  ('VS-pay-debt-ca-partial', [(O, 'if (newPaymentStatus === "paid" && order.customer_phone', 'if (order.customer_phone', 1)], r'✗ C2 ', 'p2223'),
  ('VS-pay-debt-bo-flash', [(O, " && !(Number(order.flash_discount) > 0)) {", ") {", 1)], r'✗ C3 ', 'p2223'),
  ('VS-pay-debt-khong-boc', [(O, "console.error(`⚠️ Đơn ${order.code} - Ghi điểm khi thu nợ lỗi (bỏ qua, vẫn thu):`, loyErr.message);",
                              "throw loyErr;", 1)], r'✗ C4 ', 'p2223'),
  ('VS-pay-debt-bo-not-exists', [(O, "WHERE NOT EXISTS (SELECT 1 FROM pos_point_transactions WHERE order_id = ? AND type = 'earn')`,",
                                  "WHERE ? IS NOT NULL`,", 1)], r'✗ C5 ', 'p2223'),
  ('VS-pay-debt-diem-ngoai-tx', [(O, GHI_THU, GHI_THU.replace('await tx.run(', 'await run('), 1)], r'✗ C[18] ', 'p2223'),
  # ── E: /nhan-diem Flash 0 điểm · hệ số MỘT hàm ──
  ('BV-bill-flash-hua-diem', [(O, "c.nhandiem_enabled === '1' && !flashApplied;", "c.nhandiem_enabled === '1';", 1)], r'✗ E1c', 'p2223'),
  ('VS-pay-debt-han-gio-tao', [(O, "tinhDiemDon(Number(order.total), now)", "tinhDiemDon(Number(order.total), order.created_at)", 1)], r'✗ C1 ', 'p2223'),
  ('VS-pay-debt-diem-sau-commit', [(O, "      if (diemThu) {\n        try {\n          const kqDiem = await tx.run(", "      if (false) {\n        try {\n          const kqDiem = await tx.run(", 1),
                                  (O, "        );\n      }\n      await tx.commit();\n    } catch (txErr) {\n      await tx.rollback();\n      throw txErr;\n    }\n\n    res.json({",
                                   "        );\n      }\n      await tx.commit();\n      if (diemThu) await run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at) VALUES (?, 'earn', ?, ?, ?, ?, ?, ?)`, [order.customer_phone, diemThu.diem, order.id, diemThu.han, 'sau commit', req.user.username, now]);\n    } catch (txErr) {\n      await tx.rollback();\n      throw txErr;\n    }\n\n    res.json({", 1)], r'✗ C10', 'p2223'),
  ('BV-nhan-diem-flash', [(S, "if (Number(don.flash_discount) > 0) {", "if (false) {", 1)], r'✗ E1 ', 'p2223'),
  ('VS-nhan-diem-flash-khong-doc-cot', [(S, "payment_status, flash_discount FROM pos_orders", "payment_status FROM pos_orders", 1)], r'✗ E1 ', 'p2223'),
  ('VS-he-so-bill-cu', [(O, "const { heSo } = await docCauHinhNhanDiem();", "const heSo = Number(c.nhandiem_he_so) || 2;", 1),
                        (O, "WHERE key IN ('nhandiem_enabled','nhandiem_han_gio','signup_enabled')",
                         "WHERE key IN ('nhandiem_enabled','nhandiem_he_so','nhandiem_han_gio','signup_enabled')", 1)], r'✗ E2 ', 'p2223'),
  # ── F: bất biến I8 ──
  ('BV-I8-dk-thu', [(BB, " && (luatCu || r.payment_status === 'paid');", ";", 1)], r'✗ F1 ', 'p2223'),
  ('VS-I8-moc-ca-gia-lap', [(BB, "if (ctx.thuc && String(r.created_at) < DIEM_KHI_THU_TU", "if (String(r.created_at) < DIEM_KHI_THU_TU", 1)], r'✗ F2 ', 'p2223'),
  ('VS-I8-moc-nguoc', [(BB, "String(r.created_at) < DIEM_KHI_THU_TU &&", "String(r.created_at) >= DIEM_KHI_THU_TU &&", 1)], r'✗ F2 ', 'p2223'),
  ('VS-I8-flash-nhan-ma', [(BB, "        if (!luatCu && so(r.flash) > 0) return 0;\n", "", 1)], r'✗ I8 đơn Flash nhận mã', 'gl'),
  ('VS-I8-tha-moi-don-truoc-moc', [(BB, "&& so(r.diem) === diemDung(true)) return [];", ") return [];", 1)], r'✗ I8 Đối soát thật: đơn trước mốc sai', 'gl'),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/gia_lap/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_p2223_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
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


def lenh(bai, tmp):
  if bai == 'gl':
    return ['node', os.path.join(GOC, 'cong_cu', 'thu_gia_lap.js'), '--chi-du-lieu-tay', '--gia-lap', os.path.join(tmp, 'cong_cu', 'gia_lap')]
  return ['node', os.path.join(GOC, 'cong_cu', 'thu_P2223.js'), '--may-chu', os.path.join(tmp, 'server')]


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(bai, tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    if '--in-ra' in sys.argv: print(f'── {ten}: 12 dòng cuối ──\n' + '\n'.join(ra.strip().splitlines()[-12:]))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if r.returncode == 2 or 'Bài thử sập' in ra or 'bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
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
    kq = []
    for bai in ('p2223', 'gl'):
      r = subprocess.run(lenh(bai, tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
      ra = (r.stdout or '') + (r.stderr or '')
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      kq.append((r.returncode == 0 and m is not None and m.group(2) == '0', f'{bai}: ' + (m.group(0) if m else ra[-200:])))
    return all(x for x, _ in kq), ' · '.join(d for _, d in kq)
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: chạy bài thử HIỆN TẠI với server/ + cong_cu/gia_lap/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_p2223_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'cong_cu/gia_lap'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(lenh('p2223', tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
    print(f'GỐC {sha}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    chay_goc(sys.argv[sys.argv.index('--goc') + 1]); sys.exit(0)
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
