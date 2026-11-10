#!/usr/bin/env python3
"""DIEM-MON-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/DIEM-MON-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/DIEM-MON-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/NAP-1/dot_bien.py: chép server/, cong_cu/gia_lap/ (I8), cong_cu/thu_DIEMMON1.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules
nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao. BẮT = thoát ≠ 0 VÀ có
dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_DIEMMON1.js'
DT = 'server/utils/diemThat.js'
OR = 'server/routes/orders.js'
SC = 'server/routes/signup-codes.js'
DA = 'server/routes/damages.js'
LO = 'server/routes/loyalty.js'
N24 = 'server/nang_cap/024_tich_diem_mon.js'
BB = 'cong_cu/gia_lap/bat_bien.js'

LOG_DA = "      const log = await ghiHangHong(tx, { order, product_code, ten: dong.ten, soLuong, gia, reason, reason_note, action, refund: finalRefund, user: req.user });\n"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: bước nâng cấp 024 ──
  ('BV-024-cot-don', [(N24, "  if (await coBang('pos_orders')) await themCot('pos_orders', 'tien_hang_diem INTEGER');\n", '', 1)], r'✗ T1 '),
  ('BV-024-co-goi', [(N24, "['pos_products', 'pos_packages', 'pos_membership_tiers']", "['pos_products', 'pos_membership_tiers']", 1)], r'✗ T1 '),
  # ── B: MỘT hàm tính tiền tích điểm (diemThat.js) ──
  ('BV-ham-bo-ty-le', [(DT, '  if (dong.tien_hang_diem == null) return tra;\n  const hang', '  return tra;\n  const hang', 1)], r'✗ T3 '),
  ('VS-chia-0', [(DT, 'return hang > 0 ? Math.round((tra * (Number(dong.tien_hang_diem) || 0)) / hang) : 0;',
                  'return Math.round((tra * (Number(dong.tien_hang_diem) || 0)) / hang);', 1)], r'✗ T2 '),
  ('VS-null-la-tat', [(DT, 'const batDiem = (d) => d.tich_diem == null || Number(d.tich_diem) !== 0;', 'const batDiem = (d) => Number(d.tich_diem) !== 0;', 1)], r'✗ T2b '),
  ('VS-khong-chia-ty-le', [(DT, 'return tong > 0 ? Math.floor((bat * tienHang) / tong) : 0;', 'return bat;', 1)], r'✗ T5 '),
  ('VS-gia-goc-bo-gia-hang', [(DT, 'Number(d.flash_unit_price || d.tier_unit_price || d.unit_price || 0)', 'Number(d.unit_price || 0)', 1)], r'✗ T6 '),
  ('BV-dong-tat-van-tinh', [(DT, 't + (batDiem(dongDon[i]) ? g : 0)', 't + g', 1)], r'✗ T3 '),
  # ── C: trừ điểm CÁCH 2 (tienHoanTinhDiem, truDiemHoan) ──
  ('VS-hoan-toan-don', [(DT, '  return denBat + (goi && batDiem(goi) ? hoan : 0) + (conTra > 0 ? (khongGan * Math.max(0, tienDiem - denBat)) / conTra : 0);',
                         '  return conTra + den > 0 ? (Number(so?.n || 0) * tienDiem) / (conTra + den) : 0;', 1)], r'✗ T13 '),
  ('VS-den-mon-tat-van-tru', [(DT, 'const denBat = den - Math.min(den, denTat);', 'const denBat = den;', 1)], r'✗ T13 '),
  # Q4 = a (chủ quán 09.11): duyệt hoàn sau đền quy theo PHẦN CÒN LẠI
  ('BV-q4-hoan-theo-toan-don', [(DT, '(conTra > 0 ? (khongGan * Math.max(0, tienDiem - denBat)) / conTra : 0)',
                                 '(conTra + den > 0 ? (khongGan * tienDiem) / (conTra + den) : 0)', 1)], r'✗ T13e '),
  ('VS-q4-con-lai-bo-den-bat', [(DT, '(khongGan * Math.max(0, tienDiem - denBat)) / conTra', '(khongGan * tienDiem) / conTra', 1)], r'✗ T13g '),
  ('VS-q4-mau-so-ca-don', [(DT, '(khongGan * Math.max(0, tienDiem - denBat)) / conTra', '(khongGan * Math.max(0, tienDiem - denBat)) / (conTra + den)', 1)], r'✗ T13e '),
  ('VS-goi-tat-van-tru', [(DT, '(goi && batDiem(goi) ? hoan : 0)', '(goi ? hoan : 0)', 1)], r'✗ T14 '),
  ('VS-ket-thuc-goi-nhu-duyet-hoan', [(DT, 'const khongGan = goi ? 0 : hoan;', 'const khongGan = hoan;', 1), (DT, '(goi && batDiem(goi) ? hoan : 0)', '0', 1)], r'✗ T14b '),
  ('VS-mau-so-tien-tra', [(DT, 'diemTruKhiHoan(diem, hoan, tienDiem)', 'diemTruKhiHoan(diem, hoan, tienTraDon(don))', 1)], r'✗ T13 '),
  # ── orders.js: cờ dòng + phần tiền tích điểm lưu lúc bán ──
  ('BV-co-mon', [(OR, 'tich_diem: batDiem(product) ? 1 : 0,', 'tich_diem: 1,', 1)], r'✗ T3 '),
  ('BV-co-goi', [(OR, 'tich_diem: batDiem(pkg) ? 1 : 0,', 'tich_diem: 1,', 1)], r'✗ T10 '),
  ('BV-co-hang', [(OR, 'tich_diem: batDiem(membershipTier) ? 1 : 0,', 'tich_diem: 1,', 1)], r'✗ T11 '),
  ('BV-luu-tien-hang-diem', [(OR, 'customer_package_id || null, tienHangDiemDon,', 'customer_package_id || null, null,', 1)], r'✗ T3 |✗ T8 '),
  ('BV-luu-co-dong', [(OR, 'item.tier_unit_price || null, item.tich_diem ?? null],', 'item.tier_unit_price || null, null],', 1)], r'✗ T3 |✗ T13 '),
  ('BV-diem-luc-tao', [(OR, 'parent_balance_amount: actualParentBalanceAmount, tien_hang_diem: tienHangDiemDon })', 'parent_balance_amount: actualParentBalanceAmount })', 1)], r'✗ T3 '),
  ('VS-tien-hang-gom-phi-giao', [(OR, 'tienHangDiem(orderItems, total - finalShippingFee)', 'tienHangDiem(orderItems, total)', 1)], r'✗ T12 '),
  # ── /nhan-diem (signup-codes.js) đọc số đã lưu ──
  ('BV-nhan-diem-thieu-cot', [(SC, 'parent_balance_amount, tien_hang_diem FROM pos_orders WHERE id = ?', 'parent_balance_amount FROM pos_orders WHERE id = ?', 1)], r'✗ T8 '),
  # ── Q2: damages.js ghi dòng sự cố TRƯỚC khi trừ điểm ──
  ('BV-ghi-su-co-sau', [(DA, LOG_DA, '', 1), (DA, '      return { order, finalRefund, logId: log.lastInsertRowid };', LOG_DA + '      return { order, finalRefund, logId: log.lastInsertRowid };', 1)], r'✗ T13 '),
  # ── D: cửa Cài đặt (loyalty.js) ──
  ('BV-quyen-sua', [(LO, "router.put('/tich-diem', authenticate, checkPermission('manage_promotions'),", "router.put('/tich-diem', authenticate, checkPermission('manage_settings'),", 1)], r'✗ T16 '),
  ('BV-quyen-xem', [(LO, "router.get('/tich-diem', authenticate, checkPermission('manage_settings'),", "router.get('/tich-diem', authenticate,", 1)], r'✗ T17 '),
  ('VS-bang-tu-do', [(LO, 'const bang = Object.hasOwn(BANG_TICH_DIEM, loai) ? BANG_TICH_DIEM[loai] : null;', 'const bang = BANG_TICH_DIEM[loai] || loai;', 1)], r'✗ T16 '),
  ('BV-id-khong-kiem', [(LO, '\n      || !ids.every((id) => Number.isSafeInteger(id) && id > 0)', '', 1)], r'✗ T16 '),
  # ── E: I8 trọng tài (bat_bien.js) ──
  ('BV-i8-khong-ty-le', [(BB, 'const tienDiem = r.thd == null ? traDon : hang > 0 ? Math.round((traDon * so(r.thd)) / hang) : 0;', 'const tienDiem = traDon;', 1)], r'✗ T18 '),
  ('VS-i8-den-tat-van-tru', [(BB, 'const denBat = den - Math.min(den, so(r.den_tat));', 'const denBat = den;', 1)], r'✗ T18 '),
  ('BV-i8-q4-hoan-theo-toan-don', [(BB, '(!coGoi && traDon - den > 0 ? (so(r.hoan_r) * Math.max(0, tienDiem - denBat)) / (traDon - den) : 0)',
                                    '(!coGoi && traDon > 0 ? (so(r.hoan_r) * tienDiem) / traDon : 0)', 1)], r'✗ T18 '),
  ('VS-i8-goi-tat-van-tru', [(BB, '(coGoi && so(r.goi_bat) !== 0 ? so(r.hoan_r) : 0)', '(coGoi ? so(r.hoan_r) : 0)', 1)], r'✗ T18 '),
  ('BV-i8-bo-cot-moi', [(BB, 'const coMonDiem = so(', 'const coMonDiem = 0 && so(', 1)], r'✗ T18 '),
]


def ban_sao(thay):
  """Chép phần cần của kho ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_diemmon1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  shutil.copyfile(os.path.join(GOC, BAI), os.path.join(tmp, BAI))
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


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(tmp, BAI)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'SẬP:' in ra:
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
    ma, ra = chay_bai(tmp)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-160:])
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
