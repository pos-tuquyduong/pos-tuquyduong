#!/usr/bin/env python3
"""HANG-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/HANG-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/HANG-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/GIO-VN-1/dot_bien.py: chép server/, cong_cu/gia_lap/ (bất biến I15), client/src/, cong_cu/thu_HANG1.js ra thư mục tạm (BẢN CHÉP
THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản
sao. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_HANG1.js'
MS = 'server/utils/membershipStatus.js'
OR = 'server/routes/orders.js'
MB = 'server/routes/membership.js'
TI = 'server/routes/tiers.js'
PIN = 'server/utils/pinChuQuan.js'
N13 = 'server/nang_cap/013_hang.js'
KH = 'server/routes/kh/index.js'
SA = 'client/src/pages/Sales.jsx'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── D: hạng hiện tại = thứ bậc CAO NHẤT còn hạn (membershipStatus.js) ──
  ('VS-hang-moi-nhat', [(MS, 'if (han > now) { if (!dung || x.bac > dung.bac) dung = x; }', 'if (han > now) { dung = x; }', 1)], r'✗ D5 '),
  ('VS-vo-han-het', [(MS, "moi = d.so_thang == null ? HAN_VO_HAN : congThang(luc, Number(d.so_thang));", "moi = d.so_thang == null ? luc : congThang(luc, Number(d.so_thang));", 1)], r'✗ D3 '),
  ('VS-khong-cong-noi', [(MS, 'moi = congThang(cu && cu > luc ? cu : luc, Number(d.so_thang));', 'moi = congThang(luc, Number(d.so_thang));', 1)], r'✗ B5 '),
  ('VS-cap-cong-noi', [(MS, "else if (d.loai === 'cap') moi = d.so_thang == null ? HAN_VO_HAN : congThang(luc, Number(d.so_thang));",
                        "else if (d.loai === 'cap') moi = d.so_thang == null ? HAN_VO_HAN : congThang(cu && cu > luc && cu !== HAN_VO_HAN ? cu : luc, Number(d.so_thang));", 1)], r'✗ C5c '),
  ('BV-thu-hoi', [(MS, "    if (d.loai === 'thu_hoi') moi = null;\n    else if", '    if', 1)], r'✗ C6 '),
  ('BV-customers-v2', [('server/routes/customers-v2.js', '    const tierMap = await hangNhieuKhach(query, getNow);', '    const tierMap = {};', 1)], r'✗ D1 '),
  # ── B: bán gói ở quầy (orders.js) ──
  ('VS-gia-may-khach', [(OR, '      const cardPrice = membershipGoi.gia;', '      const cardPrice = Number(membership_buy.gia ?? membershipGoi.gia);', 1)], r'✗ B1 '),
  ('VS-goi-chua-gia-ban', [(MS, "g.bat === true && Number.isInteger(g.gia) && g.gia > 0", "g.bat === true", 1)], r'✗ N1b |✗ B2 '),
  ('VS-goi-tat-ban', [(MS, "g.bat === true && Number.isInteger(g.gia) && g.gia > 0", "Number.isInteger(g.gia) && g.gia > 0", 1)], r'✗ B2 gói 12'),
  ('BV-chi-cap', [(OR, "      if (membershipTier.cach_co !== 'ban') {\n        return res.status(400).json({ error: `Hạng ${membershipTier.name} chỉ chủ quán cấp, không bán`, code: 'HANG_CHI_CAP' });\n      }\n", '', 1)], r'✗ B3 '),
  ('BV-cao-hon', [(OR, "      if (isTierUsable(hangDangCo.status) && hangDangCo.thu_bac > Number(membershipTier.sort_order)) {", "      if (false) {", 1)], r'✗ B4 '),
  ('VS-chieu-cao-hon', [(OR, 'hangDangCo.thu_bac > Number(membershipTier.sort_order)', 'hangDangCo.thu_bac < Number(membershipTier.sort_order)', 1)], r'✗ B4c |✗ B4 '),
  ('VS-cao-hon-bang', [(OR, 'hangDangCo.thu_bac > Number(membershipTier.sort_order)', 'hangDangCo.thu_bac >= Number(membershipTier.sort_order)', 1)], r'✗ B5 '),
  ('VS-cao-hon-het-han', [(OR, 'if (isTierUsable(hangDangCo.status) && hangDangCo.thu_bac >', 'if (hangDangCo.thu_bac >', 1)], r'✗ B4b '),
  ('BV-thieu-thang', [(OR, 'membership_buy.tier_id && membership_buy.so_thang && normalizePhone(customer_phone)', 'membership_buy.tier_id && normalizePhone(customer_phone)', 1)], r'✗ B7 '),
  # ── C: cấp / thu hồi (membership.js, pinChuQuan.js) ──
  ('VS-cap-quyen-chung', [(MB, "router.post('/cap', authenticate, checkPermission('cap_hang'),", "router.post('/cap', authenticate, checkPermission('manage_promotions'),", 1)], r'✗ C1 quản lý'),
  ('VS-thu-hoi-quyen-chung', [(MB, "router.post('/thu-hoi', authenticate, checkPermission('cap_hang'),", "router.post('/thu-hoi', authenticate, checkPermission('manage_promotions'),", 1)], r'✗ C6b quản lý'),
  ('VS-cap-khong-pin', [(MB, "    const pin = await kiemPinChuQuan(b.pin);\n    if (pin.loi) return bao(res, pin.loi);\n    await ghiDong(yc.phone, yc.hang, 'cap'",
                         "    await ghiDong(yc.phone, yc.hang, 'cap'", 1)], r'✗ C0d |✗ C2 '),
  ('VS-thu-hoi-khong-pin', [(MB, "    const pin = await kiemPinChuQuan(b.pin);\n    if (pin.loi) return bao(res, pin.loi);\n    await ghiDong(yc.phone, yc.hang, 'thu_hoi'",
                             "    await ghiDong(yc.phone, yc.hang, 'thu_hoi'", 1)], r'✗ C6b thu hồi sai PIN'),
  ('BV-cap-chi-cap', [(MB, "  if (!hang || hang.cach_co !== 'chi_cap') return", "  if (!hang) return", 1)], r'✗ C4 '),
  ('VS-cap-thang-chuoi', [(MB, "!(typeof b.so_thang === 'number' && Number.isInteger(soThang)", "!(Number.isInteger(soThang)", 1)], r'✗ C5b cấp "3"|✗ C5b cấp true'),
  ('VS-cap-thieu-thang-vo-han', [(MB, '    const voHan = b.so_thang === null;', '    const voHan = b.so_thang == null;', 1)], r'✗ C5b cấp không gửi so_thang'),
  ('BV-pin-khoa', [(PIN, "  if (giu.changes !== 1) return loi('PIN_CHU_QUAN_KHOA');\n", '', 1)], r'✗ C2b '),
  ('VS-pin-khoa-bo-dem', [(PIN, "khoa_den = CASE WHEN ${dem} >= ? THEN ${GIO} ELSE NULL END", "khoa_den = CASE WHEN ${dem} > ? THEN ${GIO} ELSE NULL END", 1)], r'✗ C2b '),
  ('BV-pin-chi-chu', [(PIN, "  if (user?.role !== 'owner') return loi('CHI_CHU_QUAN');\n", '', 1)], r'✗ C0a '),
  ('BV-pin-mat-khau', [(PIN, "  if (!u || !bcrypt.compareSync(String(matKhau ?? ''), String(u.password || ''))) return loi('MAT_KHAU_SAI');\n", '', 1)], r'✗ C0b '),
  # ── A: cài đặt hạng (tiers.js) ──
  ('VS-thang-61', [(TI, 'const THANG_TOI_DA = 60;', 'const THANG_TOI_DA = 61;', 1)], r'✗ A3 gói 61'),
  ('BV-bac-trung', [(TI, "    if (new Set(bac).size !== bac.length) return sai('Hai hạng không được cùng thứ bậc');\n", '', 1)], r'✗ A4 thứ bậc trùng'),
  ('BV-chi-cap-goi-rong', [(TI, "  for (const g of cachCo === 'ban' ? vao : []) {", '  for (const g of vao) {', 1)], r'✗ A6 '),
  ('BV-xoa-hang', [(TI, "    if (dangGiu > 0) {", '    if (false) {', 1)], r'✗ A5 '),
  ('VS-xoa-hang-ca-het-han', [(MS, "(hanCacHang(ds).get(Number(tierId))?.han ?? '') > now", "(hanCacHang(ds).get(Number(tierId))?.han ?? '') !== ''", 1)], r'✗ A5b '),
  ('VS-xoa-chi-hang-hien-tai', [(TI, '    const dangGiu = await soKhachGiuHang(query, getNow, id);', "    const dangGiu = Object.values(await require('../utils/membershipStatus').hangNhieuKhach(query, getNow)).filter((m) => m.tier_id === id && m.status !== 'expired').length;", 1)], r'✗ A5d '),
  ('BV-doi-cach-co', [(TI, "&& !(await coQuyen(req.user, 'cap_hang'))) {", '&& false) {', 1)], r'✗ A8 '),
  ('VS-doi-cach-co-mot-chieu', [(TI, 'cu.get(h.id) !== h.cach_co)', "cu.get(h.id) === 'chi_cap' && h.cach_co === 'ban')", 1)], r'✗ A8b '),
  ('VS-doi-cach-co-quyen-chung', [(TI, "!(await coQuyen(req.user, 'cap_hang'))", "!(await coQuyen(req.user, 'manage_promotions'))", 1)], r'✗ A8 '),
  ('BV-none-loc', [(MS, ".filter(([, m]) => m.status !== 'none'));", ');', 1)], r'✗ C6d '),
  # ── N: bước nâng cấp 013 ──
  ('BV-013-vang', [(N13, '  await tx.run("UPDATE pos_membership_tiers SET goi = ? WHERE name = \'Vàng\' AND cach_co = \'ban\' AND goi = \'[]\'", [GOI_VANG]);\n', '', 1)], r'✗ N1 '),
  ('VS-013-ten-gan-dung', [(N13, "WHERE name = 'Kim Cương' AND goi = '[]'", "WHERE TRIM(name) LIKE 'V%' OR name = 'Kim Cương' AND goi = '[]'", 1)], r'✗ N3 |✗ N1'),
  ('VS-013-de-goi', [(N13, "WHERE name = 'Vàng' AND cach_co = 'ban' AND goi = '[]'", "WHERE name = 'Vàng' AND cach_co = 'ban'", 1)], r'✗ N2 '),
  ('BV-013-bac', [(N13, "  for (const [i, h] of dsHang.entries()) await tx.run('UPDATE pos_membership_tiers SET sort_order = ? WHERE id = ?', [i + 1, h.id]);\n", '', 1)], r'✗ N2b '),
  ('BV-013-quyen', [(N13, "VALUES (?, 'cap_hang', ?, ?)", "VALUES (?, 'cap_hang_x', ?, ?)", 1)], r'✗ N6 '),
  # ── F: App KH (kh/index.js) ──
  ('BV-hang-kh', [(KH, "chi_cap: h.cach_co === 'chi_cap', goi, thu_bac: h.sort_order, gia_the: goi.length ? goi[0].gia : null, thu_tu: h.sort_order",
                   "gia_the: Number(h.card_price) || 0, thu_tu: h.sort_order", 1)], r'✗ F1 '),
  ('VS-het-han-chuoi', [(KH, '  return h ? { h, het_han: m.expires_at } : null;', "  return h ? { h, het_han: String(m.expires_at).replace(' ', 'T') } : null;", 1)], r'✗ F2 '),
  # ── O: bất biến Đối soát I15 ──
  ('VS-I15-cap', [('cong_cu/gia_lap/bat_bien.js', "      WHERE m.order_id IS NOT NULL AND (o.id IS NULL OR o.status = 'cancelled')`);", "      WHERE o.id IS NULL OR o.status = 'cancelled'`);", 1)], r'✗ O1 '),
  # ── G: giao diện ──
  ('VS-khoa-gio-thieu-thang', [('client/src/pages/Sales.jsx', 'i.package_id, i.tier_id, i.so_thang]));', 'i.package_id, i.tier_id]));', 1)], r'✗ G2 '),
  ('BV-ban-khoa-cao-hon', [(SA, "{khoa && <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: 4 }}>Khách đang có hạng cao hơn</div>}", '', 1), (SA, "title={khoa ? 'Khách đang có hạng cao hơn' : ''}", "title=''", 1), (SA, "setError(`Khách đang có hạng cao hơn (${membershipInfo.tier_name}) — không bán hạng ${tier.name}`)", "setError('')", 1)], r'✗ G2b '),
  ('VS-xoa-hop-thoai', [('client/src/pages/CaiDat/HangThe.jsx', "    if (xoaCho !== h.khoa) { setXoaCho(h.khoa); return; }", "    if (!window.confirm('Xoá hạng?')) return;", 1)], r'✗ G1b '),
  ('VS-nhat-ky-han-luu', [('client/src/components/CapHang.jsx', "              {Number(d.price_paid) > 0", "              {d.expires_at && ` → đến ${d.expires_at}`}\n              {Number(d.price_paid) > 0", 1)], r'✗ G3c '),
  ('BV-cap-quyen-giao-dien', [('client/src/pages/Customers.jsx', "coQuyen={hasPermission('cap_hang')}", 'coQuyen={true}', 1)], r'✗ G3 '),
]


def ban_sao(thay):
  """Chép phần cần của kho ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_hang1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'Bài thử sập' in ra:
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
