#!/usr/bin/env python3
"""MANKHACH-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/MANKHACH-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/MANKHACH-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/MANKHACH-1/dot_bien.py --help

Khuôn viec/KH-MUA-1/dot_bien.py: chép server/ và bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi
(mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
U, R, S = 'server/utils/manKhach.js', 'server/routes/man-khach.js', 'server/routes/settings.js'
BAI = {'mk': 'cong_cu/thu_MANKHACH1.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: ghép máy ──
  ('BV-MA-HET-HAN-VAN-GHEP', 'mk', [(U, "WHERE ma = ? AND ma_het_han > ?', [ma, getNow()])", "WHERE ma = ?', [ma])", 1)], r'✗ A9 '),
  ('BV-MO-QUAY-KHONG-CAP-MA-MOI', 'mk', [(U, '  if (q.ma_het_han <= getNow()) await capMaMoi(q.id);', '', 1)], r'✗ A1 '),
  ('BV-KHOA-GOC-LUU-TRONG-KHO', 'mk', [(U, '[q.id, tenGon, bam(khoa), getNow()]', '[q.id, tenGon, khoa, getNow()]', 1)], r'✗ A8 '),
  ('BV-THU-HOI-VAN-DUNG-DUOC', 'mk', [(U, "  if (may.thu_hoi_luc) return loi(401, 'KHOA_THU_HOI', 'Màn khách đã bị thu hồi — ghép lại bằng mã mới');\n", '', 1)], r'✗ E2 '),
  ('BV-GIOI-HAN-LAN-SAI', 'mk', [(U, '  return e.n >= TOI_DA_SAI;', '  return false;', 1)], r'✗ A16 '),
  ('VS-GIOI-HAN-LECH-MOT', 'mk', [(U, '  return e.n >= TOI_DA_SAI;', '  return e.n > TOI_DA_SAI;', 1)], r'✗ A16 '),
  ('VS-KHONG-DAT-LAI-DEM-KHI-DUNG', 'mk', [(U, '  lanSai.delete(ip);\n  const khoa', '  const khoa', 1)], r'✗ A16 '),
  ('BV-DOI-MA-MA-CU-VAN-DUNG', 'mk', [(U, "  await run('UPDATE pos_man_khach_quay SET ma = ?, ma_het_han = ? WHERE id = ?', [ma, cong(HAN_MA_PHUT * 60), quayId]);", '', 1)], r'✗ A11 '),
  ('BV-TRANG-THAI-KHONG-CAN-KHOA', 'mk', [(R, "router.get('/trang-thai', canKhoaMan, bao(", "router.get('/trang-thai', bao(", 1)], r'✗ A1[23] '),
  ('BV-DANH-SACH-MAY-KHONG-CAN-QUYEN', 'mk', [(R, "router.get('/may', authenticate, checkPermission('manage_settings'), bao(", "router.get('/may', authenticate, bao(", 1)], r'✗ A15 '),
  ('BV-MO-QUAY-KHONG-CAN-DANG-NHAP', 'mk', [(R, "router.post('/quay/mo', authenticate, bao(", "router.post('/quay/mo', bao(", 1)], r'✗ A4 '),
  ('BV-THU-HOI-KHONG-CAN-QUYEN', 'mk', [(R, "router.post('/may/:id/thu-hoi', authenticate, checkPermission('manage_settings'), bao(", "router.post('/may/:id/thu-hoi', authenticate, bao(", 1)], r'✗ A15 '),
  ('VS-THU-HOI-HET-MAY', 'mk', [(U, "WHERE id = ? AND thu_hoi_luc IS NULL', [getNow(), nguoi, id]", "WHERE thu_hoi_luc IS NULL', [getNow(), nguoi]", 1)], r'✗ E2 '),
  ('VS-DS-MAY-LO-KHOA', 'mk', [(U, "SELECT id, quay_id, ten, tao_luc FROM pos_man_khach_may WHERE thu_hoi_luc IS NULL ORDER BY id'", "SELECT id, quay_id, ten, tao_luc, khoa_bam FROM pos_man_khach_may WHERE thu_hoi_luc IS NULL ORDER BY id'", 1)], r'✗ E1 '),
  # ── B: lúc thu ──
  ('BV-BAO-PHIEN-KHONG-KIEM-PHIEN', 'mk', [(U, "  if (!phien) return loi(404, 'KHONG_THAY_PHIEN', 'Không tìm thấy phiên thanh toán');\n", '', 1)], r'✗ B1 '),
  ('BV-BAO-PHIEN-QUAY-LA-TU-TAO', 'mk', [(U, "if (!await queryOne('SELECT id FROM pos_man_khach_quay WHERE id = ?', [quayId])) return loi(404, 'KHONG_THAY_QUAY', 'Không tìm thấy máy quầy này — mở lại màn Bán hàng');\n  const phien",
                                          "const phien", 1)], r'✗ F2 '),
  ('VS-TRANG-THAI-DOC-QUAY-KHAC', 'mk', [(U, "FROM pos_man_khach_quay WHERE id = ?', [quayId]);\n  const p = q?.phien_id", "FROM pos_man_khach_quay WHERE phien_id IS NOT NULL ORDER BY rowid DESC LIMIT 1');\n  const p = q?.phien_id", 1)], r'✗ B6 '),
  ('BV-PHIEN-HET-HAN-VAN-THU', 'mk', [(U, "p.trang_thai === 'cho' && p.het_han > bay && p.qr", "p.trang_thai === 'cho' && p.qr", 1)], r'✗ B14 '),
  ('BV-PHIEN-KHONG-QR-VAN-THU', 'mk', [(U, "p.het_han > bay && p.qr) {", "p.het_han > bay) {", 1)], r'✗ B15 '),
  ('BV-CAM-ON-KHONG-HET', 'mk', [(U, " && epoch(bay) - epoch(p.luc_chot) <= CAM_ON_GIAY) return", ") return", 1)], r'✗ B11 '),
  ('VS-CAM-ON-QUA-NGAN', 'mk', [(U, 'epoch(p.luc_chot) <= CAM_ON_GIAY', 'epoch(p.luc_chot) <= 1', 1)], r'✗ B12 '),
  ('VS-CAM-ON-QUA-DAI', 'mk', [(U, 'epoch(p.luc_chot) <= CAM_ON_GIAY', 'epoch(p.luc_chot) <= 60', 1)], r'✗ B11 '),
  ('VS-LO-TEN-KHI-CHUA-BAT', 'mk', [(U, 'ten_khach: hienTen ? h.ten_khach_goc : null', 'ten_khach: h.ten_khach_goc', 1)], r'✗ B7 '),
  ('VS-LO-SDT-KHACH', 'mk', [(U, 'tru_tai_khoan: p.giu_vi + p.giu_vi_me,', 'tru_tai_khoan: p.giu_vi + p.giu_vi_me, phone: p.phone,', 1)], r'✗ B7 '),
  ('BV-HIEN-TEN-KHONG-CHAY', 'mk', [(U, "=== '1';\n    return { ...goc, che_do: 'thu'", "=== '1' && false;\n    return { ...goc, che_do: 'thu'", 1)], r'✗ B8 '),
  ('BV-KIEM-LECH-TONG-PHIEN', 'mk', [(U, 'Math.round(tinh.total) !== phien.tong', 'false', 1)], r'✗ B16 '),
  ('BV-DONG-GIAM-KHONG-HIEN', 'mk', [(U, 'if (tien > 0) hien.giam.push', 'if (false) hien.giam.push', 1)], r'✗ B9 '),
  ('VS-THANH-TIEN-TRU-GIO-VANG-HAI-LAN', 'mk', [(U, 'thanh_tien: Math.round(it.unit_price * it.quantity)', 'thanh_tien: Math.round((it.flash_unit_price ?? it.unit_price) * it.quantity)', 1)], r'✗ B9 '),
  ('VS-QR-TU-DUNG-LAI', 'mk', [(U, 'phien_id: p.id, qr: p.qr,', "phien_id: p.id, qr: 'QR_TU_DUNG_' + p.id,", 1)], r'✗ B3 '),
  ('VS-SO-PHAI-TRA-LA-TONG', 'mk', [(U, 'tong: p.tong, con_lai: p.con_lai,', 'tong: p.tong, con_lai: p.tong,', 1)], r'✗ B3 '),
  # ── C/D: nội dung rảnh · cài đặt ──
  ('BV-KIEM-CAI-DAT-MAN-KHACH', 'mk', [(S, 'if (loiMan) return res.status(400)', 'if (false) return res.status(400)', 1)], r'✗ D2 '),
  ('VS-GIAY-TOI-THIEU-LECH', 'mk', [(U, 't.giay < GIAY_TOI_THIEU', 't.giay < GIAY_TOI_THIEU - 1', 1)], r'✗ D2 '),
  ('VS-GIAY-TOI-DA-LECH', 'mk', [(U, 't.giay > GIAY_TOI_DA', 't.giay > GIAY_TOI_DA + 1', 1)], r'✗ D2 '),
  ('VS-GIAY-TOI-DA-NOI-QUA', 'mk', [(U, 't.giay > GIAY_TOI_DA', 't.giay >= GIAY_TOI_DA', 1)], r'✗ D5 '),
  ('BV-ANH-BAT-DUOC', 'mk', [(U, "      if (t.loai === 'anh' && t.bat) return 'Trang ảnh chưa dùng được (chờ chỗ lưu ảnh) — để tắt';\n", '', 1)], r'✗ D2 '),
  ('VS-CHU-DAI-LECH', 'mk', [(U, 't.noi_dung.length > NOI_DUNG_TOI_DA', 't.noi_dung.length >= NOI_DUNG_TOI_DA', 1)], r'✗ D5 '),
  ('VS-CHU-DAI-NOI', 'mk', [(U, 't.noi_dung.length > NOI_DUNG_TOI_DA', 't.noi_dung.length > NOI_DUNG_TOI_DA + 1', 1)], r'✗ D2 '),
  ('VS-QUA-12-TRANG', 'mk', [(U, 'ds.length > TOI_DA_TRANG', 'ds.length > TOI_DA_TRANG + 1', 1)], r'✗ D2 '),
  ('VS-DIA-CHI-MOI-KIEU', 'mk', [(U, 'const laDiaChiWeb = (s) => /^https?:\\/\\/\\S+$/i.test(s)', 'const laDiaChiWeb = (s) => /^\\S+$/i.test(s)', 1)], r'✗ D3 '),
  ('VS-HIEN-TEN-NOI', 'mk', [(U, "!['0', '1'].includes(String(settings.man_khach_hien_ten))", "!['0', '1', '2'].includes(String(settings.man_khach_hien_ten))", 1)], r'✗ D3 '),
  ('BV-TRANG-TAT-VAN-CHAY', 'mk', [(U, 'ds.filter((t) => t.bat).map', 'ds.map', 1)], r'✗ D1 '),
  ('BV-MENU-KHONG-DANH-DAU-HET', 'mk', [(U, 'het: !p.khong_quan_kho && p.stock_quantity === 0', 'het: false', 1)], r'✗ C2 '),
  ('VS-MENU-LO-TON-KHO', 'mk', [(U, "nhom: p.category || '', het:", "nhom: p.category || '', stock_quantity: p.stock_quantity, het:", 1)], r'✗ C2 '),
  ('BV-FLASH-KHONG-KIEM-DANG-CHAY', 'mk', [(U, 'const dangChay = !!(f.is_flash_now && f.percent > 0', 'const dangChay = !!(f.percent > 0', 1)], r'✗ C4 '),
  ('BV-FLASH-KHONG-TEN-MON', 'mk', [(U, 'mon: f.product_keys.map((k) => ten.get(k)).filter(Boolean)', 'mon: []', 1)], r'✗ C3 '),
]


def ban_sao(thay):
  """Chép server/ + bài thử ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_mankhach1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  os.makedirs(os.path.join(tmp, 'cong_cu'))
  for f in BAI.values():
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
