#!/usr/bin/env python3
"""TOPPING-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/TOPPING-1/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/TOPPING-1/dot_bien.py --liet-ke      (chỉ in danh sách)

Khuôn viec/TIEN-KHOA-2/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_TOPPING1.js --may-chu <bản sao>/server --bo C4,Q7`.
`--bo C4,Q7`: hai mục cần 8 file chat duyệt 27.11 mà phiếu chưa ghi (trang_thai.md ## Câu hỏi) — bỏ TẠM, đối chứng xanh trên phần còn lại; chat mở
Phạm vi xong thì bỏ cờ này và thêm đột biến cho damages.js / hoaDon / inPhieu.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2) hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_TOPPING1.js'
BO = 'C4,Q7'
TP, O, K, P = 'server/utils/topping.js', 'server/routes/orders.js', 'server/kho/banHang.js', 'server/routes/products.js'
A, KH, MK, GH, NC = 'server/utils/donApp.js', 'server/routes/kh/index.js', 'server/utils/manKhach.js', 'server/utils/giaoHang.js', 'server/nang_cap/036_topping.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── D1: máy chủ tự tra giá topping ──
  ('VS-tin-gia-topping-cua-man', [(TP, 'quantity: phan * sl, unit_price: p.price, total_price: p.price * phan * sl,',
     'quantity: phan * sl, unit_price: t.unit_price ?? p.price, total_price: (t.unit_price ?? p.price) * phan * sl,', 1)], r'✗ T1[23]'),
  ('BV-dong-cha-id', [(O, "           item.cha != null ? idDong[item.cha] : null],", '           null],', 1)], r'✗ T12b'),
  # ── D2: chặn sai ──
  ('VS-topping-ngoai-danh-sach-lot', [(TP, 'if (!laTopping(p) || !choPhep.includes(Number(p.id)))', 'if (!laTopping(p))', 1)], r'✗ T14 '),
  ('VS-qua-3-phan-lot', [(TP, 'phan > TOPPING_TOI_DA_PHAN ||', 'phan > TOPPING_TOI_DA_PHAN + 1 ||', 1)], r'✗ T15b'),
  ('VS-ban-rieng-khi-khong-gia', [(TP, "? { gia: g } : { loi: loi('TOPPING_KHONG_BAN_RIENG'", "? { gia: g } : { gia: p.price, loi0: loi('TOPPING_KHONG_BAN_RIENG'", 1)],
   r'✗ T16'),
  # ── D3: tiền ──
  ('VS-bo-giam-hang-topping', [(O, 'if (it.is_package_item || it.is_membership_item || it.is_nap_item) continue;',
     'if (it.is_package_item || it.is_membership_item || it.is_nap_item || it.cha != null) continue;', 1)], r'✗ T18'),
  ('VS-voucher-bo-topping', [(O, 'const khongGiam = (it) => !!(it.is_package_item || it.is_membership_item || it.is_nap_item);',
     'const khongGiam = (it) => !!(it.is_package_item || it.is_membership_item || it.is_nap_item || it.cha != null);', 1)], r'✗ T19'),
  ('VS-voucher-nhom-bo-topping', [(O, '(khop(orderItems[i]) || (orderItems[i].cha != null && khop(orderItems[orderItems[i].cha])))', 'khop(orderItems[i])', 1)],
   r'✗ T21'),
  # ── D4: kho ──
  ('VS-kho-dem-tung-dong', [(K, "if (p.kieu === 'lam_san') { cong(ra.thanhPham, p.id, sl); continue; }",
     "if (p.kieu === 'lam_san') { ra.thanhPham.set(p.id, Math.max(ra.thanhPham.get(p.id) || 0, sl)); continue; }", 1)], r'✗ T24 hai dòng'),
  ('BV-kho-mo-topping', [(K, '  for (const i of det) {', '  for (const i of (Array.isArray(items) ? items : [])) {', 1)], r'✗ T25 '),
  ('VS-huy-khong-tra-topping', [(K, "WHERE don_hang_id = ? AND su_co = ? AND trang_thai = 'da_duyet'`,\n    [lyDo, nguoi, luc, orderId, SU_CO_BAN]);",
     "WHERE don_hang_id = ? AND su_co = ? AND trang_thai = 'da_duyet' AND id NOT IN (SELECT d.phieu_id FROM kho_phieu_dong d JOIN pos_products x ON x.id = d.san_pham_id WHERE x.la_topping = 1)`,\n    [lyDo, nguoi, luc, orderId, SU_CO_BAN]);", 1)],
   r'✗ T27'),
  # ── B: cài đặt + nâng cấp ──
  ('BV-kiem-topping-cho-mon', [(P, "if (tpMoi.length && ((doi.la_topping ?? Number(cu.la_topping)) === 1", "if (false && ((doi.la_topping ?? Number(cu.la_topping)) === 1", 1)],
   r'✗ T05'),
  ('BV-036-chep-ghi-chu', [(NC, "    await tx.run('UPDATE pos_products SET ghi_chu_nhanh = ? WHERE id = ? AND ghi_chu_nhanh IS NULL', [JSON.stringify(THEO_NHOM[p.category] || DU_PHONG), p.id]);\n", '', 1)],
   r'✗ T03 '),
  # ── D5: App KH ──
  ('BV-bo-kiem-topping-app', [(A, '      ...(m.topping ? { topping: m.topping.map((t) => { const pt = theoMa.get(t.ma);',
     '      ...(false ? { topping: m.topping.map((t) => { const pt = theoMa.get(t.ma);', 1)], r'✗ T3[13] '),
  ('VS-bao-gia-app-lech-dong', [(A, '!laDongNap(x.product_id) && x.cha == null)', '!laDongNap(x.product_id))', 1)], r'✗ T3[12]'),
  ('VS-bam-gio-bo-topping', [(A, ", ...(m?.topping !== undefined ? [m.topping] : [])])) : null,", '])) : null,', 1)], r'✗ T34b'),
  ('BV-menu-app-topping', [(KH, ': { ...monKhach(p, dsHang), topping: p.topping.map((id) => theoId.get(id)).filter((t) => t && t.sellable).map(tp) }));',
     ': { ...monKhach(p, dsHang), topping: [] }));', 1)], r'✗ T30 '),
  ('BV-man-khach-loc-topping', [(MK, '.filter((p) => p.sellable && (!p.la_topping || p.gia_ban_rieng > 0))', '.filter((p) => p.sellable)', 1)], r'✗ T46'),
  ('VS-so-mon-giao-dem-topping', [(GH, 'const soMonDon = (dong) => (dong || []).filter((x) => x.dong_cha_id == null).reduce(',
     'const soMonDon = (dong) => (dong || []).reduce(', 1)], r'✗ T47'),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_topping1_')
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


def lenh(tmp):
  return ['node', os.path.join(GOC, BAI), '--may-chu', os.path.join(tmp, 'server'), '--bo', BO]


def sach(ra):
  return re.sub(r'\x1b\[[0-9;]*m', '', ra)


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=600)
    ra = sach((r.stdout or '') + (r.stderr or ''))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if r.returncode == 2 or 'BÀI SẬP' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 600 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=600)
    ra = sach((r.stdout or '') + (r.stderr or ''))
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
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
  print(f'ĐỐI CHỨNG (bản chưa đột biến, --bo {BO}): {"XANH" if ok else "ĐỎ"} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=3) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f"TỔNG: {len(kq)} đột biến · BẮT {dem['BẮT']} · SỐNG {dem['SỐNG']} · HỎNG {dem['HỎNG']} · LẠC {dem['LẠC']}")
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
