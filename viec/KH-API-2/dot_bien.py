#!/usr/bin/env python3
"""KH-API-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-API-2/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-API-2/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KH-API-2/dot_bien.py --help

Khuôn viec/UUDAI-1/dot_bien.py: chép server/, client/src/, HOP_DONG_API_KH.md và hai bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao
(`node <bản sao>/cong_cu/thu_KHAPI2.js` — bài lấy GOC = thư mục cha của chính nó, nên đọc server/ của bản sao).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GH, GD = 'server/utils/giaHang.js', 'server/utils/gioHoatDong.js'
O, K, ST, SC = 'server/routes/orders.js', 'server/routes/kh/index.js', 'server/routes/settings.js', 'server/routes/signup-codes.js'
BAI = {'api': 'cong_cu/thu_KHAPI2.js', 'hd': 'cong_cu/thu_HOPDONG_KH.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: một hàm % hạng (giaHang.js) + orders.js gọi lại ──
  ('BV-GIAHANG-KEP', 'api', [(GH, 'return Math.min(HANG_TOI_DA, Math.max(0, tho));', 'return tho;', 1)], r'✗ A1 tiLeHangMon (95|−5)'),
  ('VS-GIAHANG-NHOM-NGUOC', 'api', [(GH, 'laNhomDacBiet ? hang.special_discount_percent : hang.discount_percent',
                                     'laNhomDacBiet ? hang.discount_percent : hang.special_discount_percent', 1)], r'✗ A1 tiLeHangMon (thường|nhóm)'),
  ('VS-GIAHANG-TU-TINH-FLOOR', 'api', [(GH, "return tinhUuDai({ dong: [{ unit_price: gia, quantity: 1, ti_le_hang: tiLe }], ma: null, dungChung: false }).gia_hang[0] ?? gia;",
                                        'return Math.floor((gia * (100 - tiLe)) / 100);', 1)], r'✗ A2 '),
  ('VS-GIAHANG-KHONG-VE-GIA-GOC', 'api', [(GH, '.gia_hang[0] ?? gia;', '.gia_hang[0];', 1)], r'✗ (A2 giaHangMon\(45000, 0\)|E4 )'),
  ('BV-GIACACHANG-GIA-0', 'api', [(GH, "  if (!(typeof gia === 'number' && gia > 0)) return [];\n", '', 1)], r'✗ E5 giaCacHang'),
  ('BV-ORDERS-GIAHANG', 'api', [(O, 'tiLeHang.set(it, tiLeHangMon(tier, it.is_special_group));',
                                 'tiLeHang.set(it, Math.min(90, Math.max(0, Number(it.is_special_group ? tier.special_discount_percent : tier.discount_percent) || 0)));', 1)],
   r'✗ A5 '),
  ('VS-ORDERS-BO-NHOM', 'api', [(O, 'tiLeHang.set(it, tiLeHangMon(tier, it.is_special_group));', 'tiLeHang.set(it, tiLeHangMon(tier, false));', 1)],
   r'✗ A3 (tinh-thu|POST)'),
  # ── B: /toi hang + so_du_vi ──
  ('BV-TOI-HANG', 'api', [(K, 'hang: await hangCuaKhach(phone), ', '', 1)], r'✗ B1 '),
  ('VS-TOI-HANG-KHONG-XET-HET-HAN', 'api', [(K, 'const h = isTierUsable(m.status) && await', 'const h = m.tier_id && await', 1)], r'✗ B3 '),
  ('VS-TOI-SO-DU-KHONG-TRU-GIU', 'api', [(K, ' - (await dangGiu({ queryOne }, phone))', '', 1)], r'✗ B5 '),
  # ── C: /hang ──
  ('VS-HANG-CA-HANG-TAT', 'api', [(K, "FROM pos_membership_tiers WHERE is_active = 1 ORDER BY", 'FROM pos_membership_tiers ORDER BY', 1)], r'✗ C1 '),
  ('VS-HANG-CAN-TOKEN', 'api', [(K, "router.get('/hang', async", "router.get('/hang', xacThucKhach, async", 1)], r'✗ C1 '),
  # ── D: /gio-vang ──
  ('VS-GIOVANG-BO-PERCENT', 'api', [(K, 'dang_chay: f.is_flash_now && f.percent > 0 &&', 'dang_chay: f.is_flash_now &&', 1)], r'✗ D4 '),
  ('BV-GIOVANG-TAT', 'api', [(K, 'mon: bat ? f.product_keys : []', 'mon: f.product_keys', 1)], r'✗ D3 '),
  # ── E: /menu gia_hang ──
  ('BV-MENU-GIA-HANG', 'api', [(K, 'gia_hang: giaCacHang(p.price, p.is_special_group, dsHang),', 'gia_hang: [],', 1)], r'✗ (A3|E1) '),
  ('VS-MENU-BO-NHOM', 'api', [(K, 'giaCacHang(p.price, p.is_special_group, dsHang)', 'giaCacHang(p.price, false, dsHang)', 1)], r'✗ (A3|E2) '),
  # ── F: giờ hoạt động ──
  ('VS-GIOHD-GIO-MAY', 'api', [(K, 'traGioHoatDong(getNow(),', 'traGioHoatDong(new Date().toISOString().slice(0, 19),', 1)], r'✗ F8 '),
  ('VS-GIOHD-QUA-NUA-DEM', 'api', [(GD, 'const ca = trong(homQua) ? homQua : trong(homNay)', 'const ca = trong(homNay)', 1)], r'✗ F2 01:00'),
  ('VS-GIOHD-NGUNG-LE', 'api', [(GD, 'bayGio < congPhut(ca.dong, cd.ngungTruocPhut)', 'bayGio <= congPhut(ca.dong, cd.ngungTruocPhut)', 1)], r'✗ F5 ngừng'),
  ('BV-GIOHD-NGAY-NGHI', 'api', [(GD, '  if (cd.ngayNghi.some((d) => d.ngay === ngay)) return null;\n', '', 1)], r'✗ F3 '),
  ('VS-GIOHD-CHUA-CAI-DONG', 'api', [(GD, "  if (!cd.lich) return { mo: `${ngay}T00:00:00`, dong: `${congNgay(ngay, 1)}T00:00:00` };",
                                      '  if (!cd.lich) return null;', 1)], r'✗ F6 '),
  ('BV-GIOHD-KIEM-PUT', 'api', [(ST, "    if (loiGio) return res.status(400)", "    if (false) return res.status(400)", 1)], r'✗ F10 PUT giờ 25:00'),
  ('VS-GIOHD-KIEM-N-AM', 'api', [(GD, "!(/^\\d+$/.test(s) && Number(s) <= NGUNG_TOI_DA)", '!(Number(s) <= NGUNG_TOI_DA)', 1)], r'✗ F10 PUT N âm'),
  ('VS-GIOHD-KIEM-NGAY-SAI', 'api', [(GD, '!ds.every((d) => d && laNgay(d.ngay)', '!ds.every((d) => d && /^\\d{4}-\\d\\d-\\d\\d$/.test(d.ngay)', 1)],
   r'✗ F10 PUT ngày sai'),
  # ── G: hạn mã theo cài đặt ──
  ('BV-HANMA-24', 'api', [(SC, 'hoursPassed > hanGio', 'hoursPassed > 24', 1)], r'✗ G2 cài hạn 48'),
  ('VS-HANMA-LOI-CUNG', 'api', [(SC, '(quá ${hanGio} giờ kể từ lúc in)', '(quá 24 giờ kể từ lúc in)', 1)], r'✗ G2 mã in 49'),
  # ── I: hợp đồng khớp code (thu_HOPDONG_KH.js) ──
  ('VS-HD-ROUTE-NGOAI-HOP-DONG', 'hd', [(K, '// ── Từ đây: token khách bắt buộc', "router.get('/bi-mat', (req, res) => res.json({}));\n// ── Từ đây: token khách bắt buộc", 1)],
   r'✗ mọi route dưới /api/kh'),
  ('VS-HD-MA-LOI-NGOAI', 'hd', [(K, "loiMayChu(res, err, 'kh hang');", "res.status(500).json({ error: 'x', code: 'MA_LA_KHONG_CO' });", 1)],
   r'✗ server/routes/kh/index.js'),
  ('VS-HD-TOI-THIEU-TRUONG', 'hd', [(K, ', so_du_vi: await soDuVi(phone)', '', 1)], r'✗ GET /toi → 200'),
  ('BV-HD-PHIEN-BAN', 'hd', [('HOP_DONG_API_KH.md', '\nPHIEN_BAN: 2\n', '\nPHIEN_BAN: 1\n', 1)], r'✗ PHIEN_BAN'),
]


def ban_sao(thay):
  """Chép server/ + client/src/ + hợp đồng + hai bài thử ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khapi2_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  os.makedirs(os.path.join(tmp, 'cong_cu'))
  for f in list(BAI.values()) + ['HOP_DONG_API_KH.md']:
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tmp, f))
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
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai])], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, bai, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'BÀI SẬP' in ra:
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
    dong, ok = [], True
    for bai in BAI:
      ma, ra = chay_bai(tmp, bai)
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      ok = ok and ma == 0 and m is not None and m.group(2) == '0'
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]))
    return ok, ' · '.join(dong)
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
