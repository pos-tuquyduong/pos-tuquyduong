#!/usr/bin/env python3
"""KH-SP-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-SP-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-SP-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KH-SP-1/dot_bien.py --help

Khuôn viec/KH-API-3/dot_bien.py: chép server/, cong_cu/, HOP_DONG_API_KH.md, client/src/utils/thongTinMon.js ra thư mục tạm (BẢN CHÉP
THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG
bản sao (bài lấy GOC = thư mục cha của chính nó, nên đọc server/ của bản sao).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
T, K, P, N = 'server/utils/thongTinMon.js', 'server/routes/kh/index.js', 'server/routes/products.js', 'server/nang_cap/005_thong_tin_mon.js'
HD, CL = 'HOP_DONG_API_KH.md', 'client/src/utils/thongTinMon.js'
BAI = {'sp': 'cong_cu/thu_KHSP1.js', 'hd': 'cong_cu/thu_HOPDONG_KH.js', 'kho2a': 'cong_cu/thu_KHO2a.js'}
KT_MA = "typeof m !== 'string' || !DANH_SACH[cot].includes(m)"
COT_005 = "  for (const cot of ['nhu_cau', 'the_chat', 'mo_ta', 'cong_dung', 'thanh_phan']) await themCot('pos_products', `${cot} TEXT`);\n"
GAC_BANG = "  if (!(await tx.queryOne(\"SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_products'\"))) return;\n"
CUA_GHI = "router.put('/thong-tin', authenticate, checkPermission('manage_settings'), async"

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: bước 005 ──
  ('BV-005-COT', 'sp', [(N, COT_005, '', 1)], r'✗ A1 '),
  ('VS-005-THIEU-COT', 'sp', [(N, "'cong_dung', 'thanh_phan']) await", "'cong_dung']) await", 1)], r'✗ A1 '),
  ('BV-005-KIEM-BANG', 'kho2a', [(N, GAC_BANG, '', 1)], r'✗ '),
  # ── B: kiểm đầu vào (utils/thongTinMon.js) ──
  ('VS-MA-LA-LOT', 'sp', [(T, KT_MA, "typeof m !== 'string'", 1)], r'✗ B2 (nhu_cau|the_chat) mã lạ'),
  ('VS-MA-TRUNG-LOT', 'sp', [(T, ' || new Set(v).size !== v.length', '', 1)], r'✗ B2 .* trùng mã'),
  ('VS-MA-CHEO-LOT', 'sp', [(T, 'nhu_cau: NHU_CAU, the_chat', 'nhu_cau: NHU_CAU.concat(THE_CHAT), the_chat', 1)], r'✗ B2 mã của danh sách kia'),
  ('VS-MANG-KHONG-PHAI-MANG', 'sp', [(T, '!Array.isArray(v) || v.some(', 'v.some(', 1)], r'✗ B2 nhu_cau không phải mảng'),
  ('VS-MO-TA-161', 'sp', [(T, 'mo_ta: 160,', 'mo_ta: 161,', 1)], r'✗ B3 mo_ta 161 ký tự'),
  ('VS-CONG-DUNG-161', 'sp', [(T, 'cong_dung: 160,', 'cong_dung: 161,', 1)], r'✗ B3 cong_dung 161 ký tự'),
  ('VS-THANH-PHAN-201', 'sp', [(T, 'thanh_phan: 200 }', 'thanh_phan: 201 }', 1)], r'✗ B3 thanh_phan 201 ký tự'),
  ('VS-MO-TA-159', 'sp', [(T, 'mo_ta: 160,', 'mo_ta: 159,', 1)], r'✗ B3 mo_ta đúng 160 ký tự'),
  ('VS-THANH-PHAN-199', 'sp', [(T, 'thanh_phan: 200 }', 'thanh_phan: 199 }', 1)], r'✗ B3 thanh_phan đúng 200 ký tự'),
  ('VS-DEM-BYTE', 'sp', [(T, 'const demKyTu = (s) => [...s].length;', 'const demKyTu = (s) => s.length;', 1)], r'✗ B3 mo_ta 160 chữ ngoài BMP'),
  ('VS-KHONG-CAT-KHOANG-TRANG', 'sp', [(T, 'const chu = v.trim();', 'const chu = v;', 1)], r'✗ B4 '),
  ('VS-RONG-KHONG-XOA', 'sp', [(T, 'doi[cot] = chu || null;', 'doi[cot] = chu;', 1)], r'✗ B4 '),
  ('VS-MANG-RONG-KHONG-XOA', 'sp', [(T, ' || (Array.isArray(v) && v.length === 0)', '', 1)], r'✗ B4 '),
  ('VS-TRUONG-VANG-GHI-DE', 'sp', [(T, 'if (!(cot in b)) continue;', '', 2)], r'✗ B[1567] '),
  # ── B: cửa ghi (routes/products.js) ──
  ('VS-DOI-GIA-XOA-THONG-TIN', 'sp', [(P, "'UPDATE pos_products SET price = ?, is_special_group = ?,", "'UPDATE pos_products SET nhu_cau = NULL, price = ?, is_special_group = ?,", 1)], r'✗ B9 '),
  ('BV-QUYEN-CAI-DAT', 'sp', [(P, CUA_GHI, "router.put('/thong-tin', authenticate, async", 1)], r'✗ B6 nhân viên'),
  ('BV-DANG-NHAP', 'sp', [(P, CUA_GHI, "router.put('/thong-tin', async", 1)], r'✗ B6 '),
  ('BV-TEN-HANG-MOI', 'sp', [(P, 'tenHopLe(b.name) || ', '', 1)], r'✗ B8 hàng mới mang tên'),
  ('BV-MA-HANG-MOI', 'sp', [(P, 'tenHopLe(b.code) || ', '', 1)], r'✗ B8 hàng mới mang tên'),
  ('BV-TAO-HANG-MON-MOI', 'sp', [(P, 'if (!sua.changes) {', 'if (false) {', 1)], r'✗ B8 '),
  ('VS-HANG-MOI-CO-GIA', 'sp', [(P, "VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?, ?, ${cot", "VALUES (?, ?, ?, ?, ?, 1, ?, 1, ?, ?, ${cot", 1)], r'✗ B8 '),
  ('VS-GHI-DOI-GIA', 'sp', [(P, 'SET ${cot.map((c) => `${c} = ?`)', 'SET price = 0, ${cot.map((c) => `${c} = ?`)', 1)], r'✗ B1 K5'),
  ('BV-THIEU-LOAI-MON', 'sp', [(P, "if (!loai || typeof loai !== 'string' || ma === undefined || ma === null || ma === '') {", 'if (false) {', 1)], r'✗ B7 '),
  ('BV-KHONG-TRUONG-NAO', 'sp', [(P, '    if (!cot.length) return res.status(400)', '    if (false) return res.status(400)', 1)], r'✗ B7 không trường'),
  # ── C: quầy + /api/kh/menu ──
  ('BV-QUAY-THONG-TIN', 'sp', [(P, '      ...docThongTin(priceInfo), // KH-SP-1: thông tin ngắn của món\n', '', 1)], r'✗ (B1 quầy|C[123]) '),
  ('BV-MENU-ANH', 'sp', [(K, 'thanh_phan: p.thanh_phan, anh: null,', 'thanh_phan: p.thanh_phan,', 1)], r'✗ C[123] '),
  ('VS-MENU-ANH-CHUOI', 'sp', [(K, 'anh: null,\n});', "anh: '',\n});", 1)], r'✗ C[123] '),
  ('BV-MENU-NHU-CAU', 'sp', [(K, 'nhu_cau: p.nhu_cau, ', '', 1)], r'✗ C[123] '),
  ('VS-DOC-NULL-THAY-MANG', 'sp', [(T, 'nhu_cau: docMang(h.nhu_cau), the_chat: docMang(h.the_chat),', 'nhu_cau: h.nhu_cau ? docMang(h.nhu_cau) : null, the_chat: docMang(h.the_chat),', 1)], r'✗ C2 '),
  ('VS-DOC-CHUOI-RONG', 'sp', [(T, 'mo_ta: h.mo_ta || null,', "mo_ta: h.mo_ta ?? '',", 1)], r'✗ C2 '),
  # ── D: hằng số giao diện = máy chủ ──
  ('VS-GIAO-DIEN-MA-NHU-CAU', 'sp', [(CL, "ma: 'dep_da'", "ma: 'dep_da2'", 1)], r'✗ D1 '),
  ('VS-GIAO-DIEN-MA-THE-CHAT', 'sp', [(CL, "ma: 'dac_bam'", "ma: 'dac_bam2'", 1)], r'✗ D2 '),
  ('VS-GIAO-DIEN-GIOI-HAN', 'sp', [(CL, 'mo_ta: 160,', 'mo_ta: 150,', 1)], r'✗ D3 '),
  # ── E: hợp đồng v4 (thu_HOPDONG_KH.js) ──
  ('BV-HOPDONG-ANH', 'sp', [(HD, ', "data[].anh"]', ']', 1)], r'✗ E1 '),
  ('BV-HOPDONG-NHU-CAU', 'sp', [(HD, ', "data[].nhu_cau"', '', 1)], r'✗ E1 '),
  ('VS-HOPDONG-PHIEN-BAN', 'sp', [(HD, 'PHIEN_BAN: 4', 'PHIEN_BAN: 3', 1)], r'✗ E2 '),
  ('BV-HOPDONG-NHAT-KY', 'sp', [(HD, '- v4 · 31.10.2026 · KH-SP-1:', '- v4 · 31.10.2026 · KH-X:', 1)], r'✗ E3 '),
  ('VS-HOPDONG-TEN-LA', 'hd', [(HD, '"data[].thanh_phan"', '"data[].thanh_phan_x"', 1)], r'✗ '),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/ + hợp đồng + file mã giao diện ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khsp1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tmp, 'cong_cu'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))   # thu_KHO2a K2 đọc màn Kho
  for f in (HD, 'kiem_tra_truoc_khi_giao.js'):                                              # thu_KHO2a K1 đọc bộ kiểm
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
