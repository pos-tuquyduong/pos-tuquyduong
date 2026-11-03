#!/usr/bin/env python3
"""HD-KH-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/HD-KH-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/HD-KH-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/KH-MUA-1/dot_bien.py: chép server/, client/package.json, client/src/utils/hoaDon.js, hợp đồng và hai bài thử ra thư mục tạm (BẢN CHÉP
THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D, H, DH = 'server/utils/donApp.js', 'server/routes/hoaDon.js', 'server/utils/dongHoaDon.js'
HD = 'HOP_DONG_API_KH.md'
BAI = {'hdkh': 'cong_cu/thu_HDKH1.js', 'hopdong': 'cong_cu/thu_HOPDONG_KH.js'}
CHEP = ['client/package.json', 'client/src/utils/hoaDon.js', HD]

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B: cach_tra / giu_vi / con_lai ──
  ('BV-BO-CACH-TRA', 'hdkh', [(D, '    ...cachTraCua(r),\n', '', 1)], r'✗ B1 '),
  ('VS-QUAY-KHONG-NULL', 'hdkh', [(D, "  if (!r.ma_app) return { cach_tra: null, giu_vi: null, con_lai: null };\n", '', 1)], r'✗ B5 '),
  ('VS-VI-THANH-QR', 'hdkh', [(D, "r.cach === 'tai_khoan' ? 'vi'", "r.cach === 'khong_co' ? 'vi'", 1)], r'✗ B2 '),
  ('VS-VI-QR-THANH-QR', 'hdkh', [(D, "r.giu_vi > 0 ? 'vi_qr' : 'qr'", "'qr'", 1)], r'✗ B3 '),
  ('VS-QR-THANH-VI-QR', 'hdkh', [(D, "r.giu_vi > 0 ? 'vi_qr' : 'qr'", "r.giu_vi >= 0 ? 'vi_qr' : 'qr'", 1)], r'✗ B1 '),
  ('VS-DOI-SO-GIU-VI', 'hdkh', [(D, 'return { cach_tra: cach, giu_vi: r.giu_vi, con_lai: r.con_lai };', 'return { cach_tra: cach, giu_vi: r.con_lai, con_lai: r.giu_vi };', 1)], r'✗ B1 '),
  ('BV-CAU-DON-NHANH-1-THIEU-COT-PHIEN', 'hdkh', [(D, "AS tien_ve, 1 AS loai,\n      p.cach, p.giu_vi, p.con_lai", "AS tien_ve, 1 AS loai,\n      NULL AS cach, NULL AS giu_vi, NULL AS con_lai", 1)], r'✗ B[1-4] '),
  ('BV-CAU-DON-NHANH-2-THIEU-COT-PHIEN', 'hdkh', [(D, "${CO_TIEN_VE}, 0, p.cach, p.giu_vi, p.con_lai", "${CO_TIEN_VE}, 0, NULL, NULL, NULL", 1)], r'✗ B1 '),
  # ── A: hoa_don[] ──
  ('BV-BO-HOA-DON', 'hdkh', [(D, "hoa_don: r.loai ? await hoaDonCua(r.oid) : [] }", 'hoa_don: [] }', 1)], r'✗ A1 '),
  ('VS-HOA-DON-SAI-DON', 'hdkh', [(D, 'await hoaDonCua(r.oid, !!r.ma_app)', 'await hoaDonCua(1, !!r.ma_app)', 1)], r'✗ A[2-6] '),
  ('BV-BO-AN-NHAN-VIEN', 'hdkh', [(DH, "  if (anNhanVien) hd.don.nhan_vien = '';\n", '', 1)], r'✗ A6'),
  ('VS-AN-NHAN-VIEN-CA-DON-QUAY', 'hdkh', [(D, '{ anNhanVien: laDonApp }', '{ anNhanVien: true }', 1)], r'✗ A1c '),
  ('VS-AN-NHAN-VIEN-KHONG-AN', 'hdkh', [(D, 'await hoaDonCua(r.oid, !!r.ma_app)', 'await hoaDonCua(r.oid, false)', 1)], r'✗ A6'),
  ('BV-BO-TRY-CATCH-HOA-DON', 'hdkh', [(D, "  } catch (e) {\n    console.error('HD-KH-1 dựng hoá đơn lỗi:', e.message);\n    return [];\n  }", "  } finally { /* bỏ catch */ }", 1)], r'✗ A9 '),
  ('VS-HOA-DON-LIEN-LUU', 'hdkh', [(DH, "{ lien: 'khach', inLai: false }", "{ lien: 'luu', inLai: false }", 1)], r'✗ A1 '),
  ('VS-CAI-DAT-THIEU-INVOICE', 'hdkh', [(DH, "key LIKE 'invoice%' OR key IN", 'key IN', 1)], r'✗ A7 '),
  ('VS-BO-CANH-BAO', 'hdkh', [(DH, "  if (to.canh_bao) ds.push(dong('canh_bao', to.canh_bao, '', { dam: true }));\n", '', 1)], r'✗ A5 '),
  ('VS-BO-GACH', 'hdkh', [(DH, '{ gach: m.tien_goc, ghi_chu: m.ghi_chu }', "{ gach: '', ghi_chu: m.ghi_chu }", 1)], r'✗ A2 '),
  ('VS-BO-GHI-CHU-MON', 'hdkh', [(DH, '{ gach: m.tien_goc, ghi_chu: m.ghi_chu }', "{ gach: m.tien_goc, ghi_chu: '' }", 1)], r'✗ A1 '),
  ('VS-BO-DAM', 'hdkh', [(DH, "ds.push(dong(d.khoa, d.ten, d.tien, { dam: d.dam }));", 'ds.push(dong(d.khoa, d.ten, d.tien));', 1)], r'✗ A1 '),
  ('VS-BO-DONG-THANH-TOAN', 'hdkh', [(DH, 'for (const d of [...to.thanh_toan, ...to.diem])', 'for (const d of [...to.diem])', 1)], r'✗ A1 '),
  ('VS-BO-LOI-CHAN', 'hdkh', [(DH, "for (const c of to.chan) ds.push(dong('chan', c.chu));\n", '', 1)], r'✗ A1 '),
  ('VS-DOI-THU-TU-GIO-KHACH', 'hdkh', [(DH, "  ds.push(dong('gio', dau.gio, dau.nhan_vien ? `${dau.nhan_nv ? dau.nhan_nv + ': ' : ''}${dau.nhan_vien}` : ''));\n  ds.push(dong('khach', dau.nhan_khach, dau.khach, { dam: true }));\n",
                                       "  ds.push(dong('khach', dau.nhan_khach, dau.khach, { dam: true }));\n  ds.push(dong('gio', dau.gio, dau.nhan_vien ? `${dau.nhan_nv ? dau.nhan_nv + ': ' : ''}${dau.nhan_vien}` : ''));\n", 1)], r'✗ A1 '),
  ('VS-LO-QR-DAU-TO', 'hdkh', [(DH, "  ds.push(dong('so_bill', dau.chu_so_bill, dau.so_bill, { dam: true }));\n", "  ds.push(dong('so_bill', dau.chu_so_bill, dau.so_bill, { dam: true }));\n  if (dau.qr) ds.push(dong('qr', dau.qr));\n", 1)], r'✗ A8 '),
  # ── D: hợp đồng ──
  ('BV-HOPDONG-CUA-DON-CACH-TRA', 'hopdong', [(HD, ', "data[].cach_tra", "data[].giu_vi", "data[].con_lai"]', ']', 1)], r'✗ v6: khối máy đọc'),
  ('BV-HOPDONG-HOA-DON', 'hopdong', [(HD, ', "don.hoa_don[].loai"', '', 1)], r'✗ v6: khối máy đọc'),
  ('BV-HOPDONG-NHAT-KY-V6', 'hopdong', [(HD, '- v6 · 03.11.2026', '- v5b · 03.11.2026', 1)], r'✗ nhật ký'),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_hdkh1_')
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
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai])], cwd=tmp, capture_output=True, text=True, timeout=300)
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
