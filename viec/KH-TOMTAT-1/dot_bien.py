#!/usr/bin/env python3
"""KH-TOMTAT-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-TOMTAT-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-TOMTAT-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/HD-KH-1/dot_bien.py: chép server/, client/package.json, client/src/utils/hoaDon.js, hợp đồng và hai bài thử ra thư mục tạm (BẢN CHÉP
THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D, H = 'server/utils/donApp.js', 'server/routes/hoaDon.js'
HD = 'HOP_DONG_API_KH.md'
BAI = {'tt': 'cong_cu/thu_KHTOMTAT1.js', 'hopdong': 'cong_cu/thu_HOPDONG_KH.js'}
CHEP = ['client/package.json', 'client/src/utils/hoaDon.js', HD]

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── tomTat (donApp.js): từng trường ──
  ('BV-BO-TOM-TAT', 'tt', [(D, '    ...tomTat(r, ext),\n', '', 1)], r'✗ A1 '),
  ('VS-KENH-LUON-QUAY', 'tt', [(D, "kenh: r.ma_app ? 'app' : 'quay',", "kenh: 'quay',", 1)], r'✗ AP1 '),
  ('VS-KENH-LUON-APP', 'tt', [(D, "kenh: r.ma_app ? 'app' : 'quay',", "kenh: 'app',", 1)], r'✗ A1 '),
  ('VS-CACH-NHAN-LUON-TAI-QUAN', 'tt', [(D, "Number(o.shipping_fee) > 0 ? 'giao' : 'tai_quan'", "'tai_quan'", 1)], r'✗ A7 '),
  ('VS-CACH-NHAN-NGUONG-NOI', 'tt', [(D, "Number(o.shipping_fee) > 0 ? 'giao'", "Number(o.shipping_fee) >= 0 ? 'giao'", 1)], r'✗ A1 '),
  ('VS-CACH-NHAN-DOAN-KHI-THIEU', 'tt', [(D, '!o || o.shipping_fee == null ? null :', '!o ? null :', 1)], r'✗ C1 '),
  ('VS-TRA-CO-DONG-GHI-NO', 'tt', [(D, ".filter((x) => x.loai !== 'ghi_no')", '', 1)], r'✗ A5 '),
  ('VS-TRA-DOI-TEN-CACH', 'tt', [(D, 'cach: x.loai, so_tien', "cach: x.loai === 'chuyen_khoan' ? 'qr' : x.loai, so_tien", 1)], r'✗ A2 '),
  ('VS-TRA-DOI-SO-TIEN', 'tt', [(D, 'so_tien: x.so_tien }))', 'so_tien: Number(o.total) }))', 1)], r'✗ A4 '),
  ('VS-TRA-THIEU-KHI-THIEU-TONG', 'tt', [(D, 'const coTien = !!o && o.total != null;', 'const coTien = !!o;', 1)], r'✗ C1 '),
  ('VS-GIAM-LUON-0', 'tt', [(D, 'giam: coTien ? tinhGiam(o).tong : null,', 'giam: coTien ? 0 : null,', 1)], r'✗ A6 '),
  ('VS-GIAM-TINH-LAI-KIEU-KHAC', 'tt', [(D, 'giam: coTien ? tinhGiam(o).tong : null,', 'giam: coTien ? Number(o.subtotal) - Number(o.total) : null,', 1)], r'✗ A7 '),
  ('VS-GIAM-THIEU-MA', 'tt', [(D, 'giam: coTien ? tinhGiam(o).tong : null,', 'giam: coTien ? tinhGiam(o).giamHang + tinhGiam(o).giamFlash : null,', 1)], r'✗ A6 '),
  ('VS-GIAM-THIEU-FLASH', 'tt', [(D, 'giam: coTien ? tinhGiam(o).tong : null,', 'giam: coTien ? tinhGiam(o).giamHang + tinhGiam(o).giamMa : null,', 1)], r'✗ A8 '),
  ('VS-SO-MON-DEM-DONG', 'tt', [(D, 'SUM(quantity) AS n', 'COUNT(*) AS n', 1)], r'✗ A1 '),
  ('VS-MON-DAU-LA-MON-CUOI', 'tt', [(D, 'ORDER BY i.id LIMIT 1) AS ten', 'ORDER BY i.id DESC LIMIT 1) AS ten', 1)], r'✗ A2 '),
  ('VS-SO-MON-THIEU-THANH-0', 'tt', [(D, 'so_mon: ext?.n ?? null, mon_dau: ext?.ten ?? null,', 'so_mon: ext?.n ?? 0, mon_dau: ext?.ten ?? null,', 1)], r'✗ C1 '),
  ('VS-APP-CHO-TRA-LA-NULL', 'tt', [(D, "cach_nhan: 'tai_quan', tra: [], so_mon:", "cach_nhan: 'tai_quan', tra: null, so_mon:", 1)], r'✗ AP3 '),
  ('VS-APP-CHO-TRA-DEM-DONG', 'tt', [(D, 'dong.reduce((s, d) => s + Number(d.so_luong || 0), 0)', 'dong.length', 1)], r'✗ AP3 '),
  # ── hai cửa cùng đi qua tomDon (K4) ──
  ('VS-DS-KHONG-TOM-TAT', 'tt', [(D, 'trangDs.map((r) => tomDon(r, ext.get(r.oid)))', 'trangDs.map((r) => tomDon(r))', 1)], r'✗ A1 '),
  ('VS-CHI-TIET-KHONG-TOM-TAT', 'tt', [(D, '...tomDon(r, (await tomTatDonThat([r])).get(r.oid)), mon', '...tomDon(r), mon', 1)], r'✗ A1 '),
  ('VS-TOM-TAT-LAY-SAI-DON', 'tt', [(D, 'trangDs.map((r) => tomDon(r, ext.get(r.oid)))', 'trangDs.map((r, i) => tomDon(r, ext.get(trangDs[0].oid)))', 1)], r'✗ A10 '),
  # ── E: chỉ đơn của SĐT trong token ──
  ('BV-BO-LOC-SDT-DON-THAT', 'tt', [(D, 'WHERE o.customer_phone = ?\n    UNION', 'WHERE ? IS NOT NULL\n    UNION', 1)], r'✗ E[12] '),
  # ── hoaDon.js: hàm chung ──
  ('BV-KHONG-EXPORT-DUNG-THANH-TOAN', 'tt', [(H, 'module.exports.dungThanhToan = dungThanhToan;\n', '', 1)], r'✗ A1 '),
  ('BV-KHONG-EXPORT-TINH-GIAM', 'tt', [(H, 'module.exports.tinhGiam = tinhGiam;\n', '', 1)], r'✗ A1 '),
  ('VS-TINH-GIAM-MA-KHONG-TRU-HANG', 'tt', [(H, 'so(o.subtotal) - giamHang - giamFlash + so(o.shipping_fee)', 'so(o.subtotal) - giamFlash + so(o.shipping_fee)', 1)], r'✗ A6c '),
  ('VS-TINH-GIAM-MA-KHONG-CONG-PHI-GIAO', 'tt', [(H, 'giamFlash + so(o.shipping_fee) - so(o.total))', 'giamFlash - so(o.total))', 1)], r'✗ A9 '),
  ('VS-TINH-GIAM-TONG-THIEU-FLASH', 'tt', [(H, 'tong: giamHang + giamFlash + giamMa }', 'tong: giamHang + giamMa }', 1)], r'✗ A8 '),
  # ── D/E: hợp đồng ──
  ('BV-HOPDONG-CUA-DON-BO-KENH', 'hopdong', [(HD, ', "data[].kenh"', '', 1)], r'✗ v12: khối máy đọc'),
  ('BV-HOPDONG-CUA-DON-CT-BO-GIAM', 'hopdong', [(HD, ', "don.giam"', '', 1)], r'✗ v12: khối máy đọc'),
  ('BV-HOPDONG-BO-GHI-CHU-V12', 'hopdong', [(HD, '### Ghi chú v12 — tóm tắt', '### Ghi chú tóm tắt', 1)], r'✗ v12: hợp đồng có mục'),
  ('BV-HOPDONG-NHAT-KY-V12', 'hopdong', [(HD, '- v12 · 07.11.2026', '- v11b · 07.11.2026', 1)], r'✗ .*nhật ký'),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_khtomtat1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  os.makedirs(os.path.join(tmp, 'cong_cu'))
  os.makedirs(os.path.join(tmp, 'client', 'src', 'utils'))
  for f in list(BAI.values()) + CHEP:
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
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai]), '--goc', tmp] if bai == 'tt' else ['node', os.path.join(tmp, BAI[bai])],
                     cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, bai, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'BÀI THỬ SẬP' in ra:
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
