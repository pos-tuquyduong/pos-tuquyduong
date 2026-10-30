#!/usr/bin/env python3
"""KH-API-3 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-API-3/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-API-3/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KH-API-3/dot_bien.py --help

Khuôn viec/KH-API-2/dot_bien.py: chép server/, HOP_DONG_API_KH.md và hai bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules
nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao (bài lấy
GOC = thư mục cha của chính nó, nên đọc server/ của bản sao).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
M, K, A = 'server/utils/maKhach.js', 'server/routes/kh/index.js', 'server/middleware/khachAuth.js'
N, HD = 'server/nang_cap/003_xung_ho_khach.js', 'HOP_DONG_API_KH.md'
BAI = {'api': 'cong_cu/thu_KHAPI3.js', 'hd': 'cong_cu/thu_HOPDONG_KH.js'}
UPDATE_HAN = ("      await run(`UPDATE pos_kh_ma_dang_nhap SET het_han = ${GIO} WHERE id = ? AND dung_luc IS NULL AND het_han = ${GIO}`,\n"
              "        [now, `+${GIOI_HAN.THEM_PHUT_CAN_TEN} minutes`, dong.id, dong.tao_luc, hanMa()]);\n")

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: /menu không bắt buộc đăng nhập + giới hạn trong bộ nhớ ──
  ('BV-MENU-BAT-DANG-NHAP', 'api', [(K, "router.get('/menu', tuyChonKhach, async", "router.get('/menu', xacThucKhach, async", 1)], r'✗ A1 '),
  ('VS-MENU-NUOT-MA-SAI', 'api', [(A, '  return xacThucKhach(req, res, next);\n}', '  req.khach = null; return next();\n}', 1)], r'✗ A3 '),
  ('BV-MENU-GIOI-HAN', 'api', [(K, "    if (!req.khach && !giuLuotMenu(req.ip || '')) return bao(res, 'QUA_NHIEU_LAN');\n", '', 1)], r'✗ A4 lượt 301'),
  ('VS-MENU-TRAN-301', 'api', [(M, 'MENU_IP_PHUT: 300,', 'MENU_IP_PHUT: 301,', 1)], r'✗ A4 lượt 301'),
  ('VS-MENU-DEM-CA-CO-DANG-NHAP', 'api', [(K, 'if (!req.khach && !giuLuotMenu(', 'if (!giuLuotMenu(', 1)], r'✗ A4 có token'),
  ('VS-CUA-SO-LECH', 'api', [(M, 'luc - o.bat_dau >= ms)', 'luc - o.bat_dau > ms)', 1)], r'✗ A4b '),
  ('VS-TRAN-LECH', 'api', [(M, 'if (o.dem >= tran) return false;', 'if (o.dem > tran) return false;', 1)], r'✗ A4'),
  # ── B: đăng ký 3 bước ──
  ('BV-XUNG-HO-CAN-TEN', 'api', [(M, 'if (!tenMoi || !xhMoi) {', 'if (!tenMoi) {', 1)], r'✗ B1 '),
  ('VS-XUNG-HO-LA', 'api', [(M, "return XUNG_HO.includes(v) ? v : { loi: 'XUNG_HO_SAI' };", 'return v;', 1)], r'✗ (B2|C2) '),
  ('VS-XUNG-HO-THIEU-BAN', 'api', [(M, "'em', 'ban'];", "'em'];", 1)], r'✗ B2 đủ 7'),
  ('VS-DIA-CHI-300', 'api', [(M, 'length > GIOI_HAN.DIA_CHI_TOI_DA)', 'length >= GIOI_HAN.DIA_CHI_TOI_DA)', 1)], r'✗ B3 '),
  ('VS-DIA-CHI-KHONG-CAT', 'api', [(M, "const t = v.normalize('NFC').trim();", 'const t = v;', 1)], r'✗ (B3|B4|C2) '),
  ('BV-INSERT-XUNG-HO', 'api', [(M, '[sdt, tenMoi, xhMoi, dcMoi, generateQRCode(sdt), now]', '[sdt, tenMoi, null, dcMoi, generateQRCode(sdt), now]', 1)], r'✗ (B4|B2 đủ 7) '),
  ('BV-GIA-HAN-MA', 'api', [(M, UPDATE_HAN, '', 1)], r'✗ B5 .*590'),
  ('VS-GIA-HAN-11-PHUT', 'api', [(M, 'THEM_PHUT_CAN_TEN: 10,', 'THEM_PHUT_CAN_TEN: 11,', 1)], r'✗ B5 .*610'),
  ('VS-GIA-HAN-MA-MAI', 'api', [(M, 'AND het_han = ${GIO}`,', 'AND (het_han = ${GIO} OR 1)`,', 1)], r'✗ B6 CAN_TEN lần hai'),
  ('VS-KIEM-CA-KHACH-CU', 'api', [(M, '  if (dung && !khach) {\n    const sai = [xhMoi, dcMoi].find((x) => x && x.loi);\n',
                                   '  const sai = [xhMoi, dcMoi].find((x) => x && x.loi);\n  if (dung && !khach) {\n', 1)], r'✗ B8 '),
  # ── C: hồ sơ ──
  ('VS-PUT-RONG', 'api', [(K, "    if (!cot.length) return bao(res, 'YEU_CAU_KHONG_HOP_LE');\n",
                           '    if (!cot.length) return res.json({ success: true, khach: hoSo(req.khach) });\n', 1)], r'✗ C3 PUT \{\}'),
  ('VS-PUT-DIA-CHI-KHONG-XOA', 'api', [(M, '  return t || null;\n', '  return t;\n', 1)], r'✗ C2 PUT dia_chi ""'),
  ('VS-PUT-XUNG-HO-RONG-XOA', 'api', [(K, 'if (!doi.xung_ho || doi.xung_ho.loi)', 'if (doi.xung_ho && doi.xung_ho.loi)', 1)], r'✗ C2 PUT xung_ho ""'),
  ('BV-HOSO-XUNG-HO', 'api', [(K, 'ngay_tao: kh.created_at, xung_ho: kh.xung_ho ?? null, dia_chi: kh.address ?? null });', 'ngay_tao: kh.created_at });', 1)], r'✗ C1 '),
  ('BV-NANG-CAP-003', 'api', [(N, "  await themCot('pos_customers', 'xung_ho TEXT');\n", '', 1)], r'✗ C4 '),
  # ── D: tự gia hạn ──
  ('BV-GIA-HAN-TRAN', 'api', [(K, "    if (!giuLuotGiaHan(req.khach.id)) return bao(res, 'QUA_NHIEU_LAN');\n", '', 1)], r'✗ D3 lượt 11'),
  ('VS-GIA-HAN-UTC', 'api', [(A, "{ timeZone: 'Asia/Ho_Chi_Minh' }", "{ timeZone: 'UTC' }", 1)], r'✗ D1 het_han'),
  ('VS-GIA-HAN-BANG-LAN-THU', 'api', [(K, "router.post('/gia-han', (req, res) =>", "router.post('/gia-han', async (req, res) =>", 1),
                                       (K, 'if (!giuLuotGiaHan(req.khach.id))', "if (!(await giuLuotNhanMa(req.khach.phone, req.ip || '', 'gia_han')))", 1)], r'✗ F4 '),
  # ── E: hợp đồng v3 (thu_HOPDONG_KH.js) ──
  ('BV-HOPDONG-TUY-CHON', 'hd', [(HD, '"duong": "/menu", "token": "tuy_chon"', '"duong": "/menu", "token": true', 1)], r'✗ GET /menu không token'),
  ('VS-HOPDONG-GIA-TRI-LA', 'hd', [(HD, '"duong": "/menu", "token": "tuy_chon"', '"duong": "/menu", "token": "co"', 1)], r'✗ GET /menu token: "co"'),
  ('BV-HOPDONG-GIA-HAN', 'hd', [(HD, '    { "pt": "POST", "duong": "/gia-han", "token": true, "tra": ["token", "het_han"] },\n', '', 1)], r'✗ mọi route dưới /api/kh'),
]


def ban_sao(thay):
  """Chép server/ + hợp đồng + hai bài thử ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khapi3_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  os.makedirs(os.path.join(tmp, 'cong_cu'))
  for f in list(BAI.values()) + [HD]:
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
    ok, dong = True, []
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
