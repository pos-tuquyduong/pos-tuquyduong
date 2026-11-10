#!/usr/bin/env python3
"""BAO-1a — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/BAO-1a/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/BAO-1a/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/BAO-1a/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên client/src/ của commit sha)

Khuôn viec/QUAY-UI-1/dot_bien.py: chép client/src/ + cong_cu/ ra thư mục tạm (BẢN CHÉP THẬT), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần
ghi sẵn — không khớp là HỎNG, K3), chạy `node <tạm>/cong_cu/thu_BAO1a.js`. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt.
Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
KHO, TB, CSS, LAY = 'client/src/components/thongBaoKho.js', 'client/src/components/ThongBao.jsx', 'client/src/index.css', 'client/src/components/Layout.jsx'
OR, RF, DC = 'client/src/pages/Orders.jsx', 'client/src/pages/Refunds.jsx', 'client/src/pages/DiscountCodes.jsx'
CHEP = ['client/src', 'cong_cu']
T = 'thu_BAO1a.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── A: kho thông báo ──
  ('VS-DO-TU-AN', [(KHO, "if (loai === 'xong') hen.set(id, setTimeout(() => bo(id), TG_TU_AN));\n  phat();", "if (loai) hen.set(id, setTimeout(() => bo(id), TG_TU_AN));\n  phat();", 1)], r'✗ A5 đỏ KHÔNG tự ẩn', T),
  ('BV-XANH-KHONG-AN', [(KHO, "if (loai === 'xong') hen.set(id, setTimeout(() => bo(id), TG_TU_AN));\n  phat();", "phat();", 1)], r'✗ A4 xanh TỰ ẨN', T),
  ('VS-TOI-DA-NAM', [(KHO, 'export const TOI_DA = 3;', 'export const TOI_DA = 5;', 1)], r'✗ A6 tối đa 3', T),
  ('VS-TG-TU-AN-DAI', [(KHO, 'export const TG_TU_AN = 4000;', 'export const TG_TU_AN = 9000;', 1)], r'✗ A3 TG_TU_AN', T),
  ('BV-GO-CHONG-TRUNG', [(KHO, '  if (trung) {', '  if (false && trung) {', 1)], r'✗ A10 cùng một câu lỗi', T),
  ('VS-BAO-NGAY-KHONG-GOM', [(KHO, '  if (dangHen) return;\n  dangHen = true;', '  dangHen = true;', 1), (KHO, 'queueMicrotask(() => { dangHen = false; for (const f of nghe) f(); });', 'for (const f of nghe) f();', 1)], r'✗ A8a dangKy báo cho màn vẽ', T),
  # ── C: câu lỗi ──
  ('VS-LOI-KY-THUAT-LOT', [(KHO, 'return !s || KY_THUAT.test(s) ? CAU_CHUNG : s;', 'return !s ? CAU_CHUNG : s;', 1)], r'✗ C4 chữ kỹ thuật', T),
  ('VS-LOI-TRONG-HIEN-TRONG', [(KHO, 'return !s || KY_THUAT.test(s) ? CAU_CHUNG : s;', 'return KY_THUAT.test(s) ? CAU_CHUNG : s;', 1)], r'✗ C3 không có câu', T),
  ('VS-LOI-BO-CAU-MAY-CHU', [(KHO, 'return !s || KY_THUAT.test(s) ? CAU_CHUNG : s;', 'return CAU_CHUNG;', 1)], r'✗ C1 lấy câu error', T),
  ('VS-LOI-TU-TIEU-DE', [(KHO, 'baoLoi(`Chưa ${viec} được`, lyDoLoi(err))', 'baoLoi(`Lỗi ${viec}`, lyDoLoi(err))', 1)], r'✗ C5 baoLoiTu', T),
  # ── B: thành phần + Layout ──
  ('BV-LAYOUT-GO-THONGBAO', [(LAY, '      <ThongBao />\n', '', 1)], r'✗ B7 Layout gắn', T),
  ('VS-LAYOUT-GAN-HAI-LAN', [(LAY, '      <ThongBao />\n', '      <ThongBao />\n      <ThongBao />\n', 1)], r'✗ B7 Layout gắn', T),
  ('VS-ROLE-DAO-NGUOC', [(TB, "role={t.loai === 'loi' ? 'alert' : 'status'}", "role={t.loai === 'loi' ? 'status' : 'alert'}", 1)], r'✗ B2 role=', T),
  ('BV-NUT-DONG-GO-NHAN', [(TB, ' aria-label="Đóng thông báo"', '', 1)], r'✗ B3 nút đóng', T),
  ('VS-THONGBAO-RE-EXPORT', [(TB, "import { dangKy, laySnapshot, bo } from './thongBaoKho.js';", "import { dangKy, laySnapshot, bo } from './thongBaoKho.js';\nexport { baoXong, baoLoi } from './thongBaoKho.js';", 1)], r'✗ B4b ThongBao.jsx chỉ export', T),
  ('VS-CSS-NUT-DONG-NHO', [(CSS, '.thong-bao-dong { flex: none; min-width: 44px; min-height: 44px;', '.thong-bao-dong { flex: none; min-width: 30px; min-height: 30px;', 1)], r'✗ B6 nút đóng', T),
  ('VS-CSS-KHONG-NOI', [(CSS, '.thong-bao-khung { position: fixed;', '.thong-bao-khung { position: absolute;', 1)], r'✗ B5 CSS nổi', T),
  # ── D: alert( + nút khoá ──
  ('BV-REFUNDS-GO-LOI-GOI', [(RF, "baoXong(`Đã duyệt hoàn tiền đơn ${maDon(id)}`); ", '', 1), (RF, "baoXong(`Đã từ chối hoàn tiền đơn ${maDon(id)}`); ", '', 1)], r'✗ D2 pages/Refunds.jsx: gọi', T),
  ('BV-DINHMUC-MO-NUT-LUU-MON', [('client/src/pages/Kho/DinhMuc.jsx', 'disabled={dang} onClick={() => luuMon(m)}', 'onClick={() => luuMon(m)}', 1)], r'✗ D4 pages/Kho/DinhMuc.jsx', T),
  ('VS-DAY-DO-CU-NHAT', [(KHO, "const cu = ds.find((t) => t.loai === 'xong' && t.id !== id) || ds[0];", 'const cu = ds[0];', 1)], r'✗ A11 đỏ chưa đọc', T),
  ('VS-MOI-BI-BO', [(KHO, "t.loai === 'xong' && t.id !== id) || ds[0]", "t.loai === 'xong') || ds[0]", 1)], r'✗ A13 đang 3 đỏ', T),
  ('BV-DOISOAT-MO-NUT-KET', [('client/src/components/DoiSoat.jsx', 'disabled={dangGhi} onClick={luuKet}', 'onClick={luuKet}', 1)], r'✗ D4 components/DoiSoat.jsx', T),
  ('VS-LAYOUT-DIEU-KIEN', [(LAY, '      <ThongBao />\n', '      {false && <ThongBao />}\n', 1)], r'✗ B7b Layout gắn', T),
  ('VS-SALES-BO-LYDO', [('client/src/pages/Sales.jsx', 'baoLoi(lyDoLoi(cau))', 'baoLoi(cau)', 1)], r'✗ C6 Sales.setError', T),
  ('BV-ORDERS-ALERT-TRO-LAI', [(OR, "baoLoi('Chưa gửi được', 'Chọn sản phẩm, số lượng và cách xử lý rồi gửi lại.'); return;", "alert('Vui lòng điền đầy đủ thông tin'); return;", 1)], r'✗ D1 alert\(', T),
  ('BV-REFUNDS-ALERT-TRO-LAI', [(RF, "baoLoiTu('duyệt hoàn tiền', err);", 'alert(err.message);', 1)], r'✗ D2 pages/Refunds.jsx', T),
  ('VS-ORDERS-BO-NOI-THONGBAO', [(OR, "import { baoXong, baoLoi, baoLoiTu } from '../components/thongBaoKho.js';   // BAO-1a\n", '', 1)], r'✗ D2 pages/Orders.jsx', T),
  ('BV-DISCOUNT-MO-NUT', [(DC, '                            disabled={dangXuLy}\n', '', 2)], r'✗ D4 pages/DiscountCodes.jsx', T),
  ('BV-CSS-KHONG-MO', [(CSS, '.btn:disabled, .btn[disabled] { opacity: 0.55; cursor: not-allowed; }', '', 1)], r'✗ D3 CSS', T),
  ('VS-CSS-MO-GIA', [(CSS, '.btn:disabled, .btn[disabled] { opacity: 0.55; cursor: not-allowed; }', '.btn:disabled, .btn[disabled] { opacity: 1; cursor: not-allowed; }', 1)], r'✗ D3 CSS', T),
]


def lam_cay(tmp):
  nm = os.path.join(GOC, 'node_modules')
  if os.path.isdir(nm):
    os.symlink(nm, os.path.join(tmp, 'node_modules'))


def chep(nguon_sha, tmp, phan):
  """Đổ `phan` vào tmp: nguon_sha None = cây làm việc hiện tại (copytree), có sha = git archive commit đó."""
  if nguon_sha is None:
    for p in phan:
      a, b = os.path.join(GOC, p), os.path.join(tmp, p)
      os.makedirs(os.path.dirname(b), exist_ok=True)
      (shutil.copytree(a, b, ignore=shutil.ignore_patterns('node_modules')) if os.path.isdir(a) else shutil.copyfile(a, b))
  else:
    tar = subprocess.run(['git', 'archive', nguon_sha, *phan], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_bao1a_')
  chep(None, tmp, CHEP)
  lam_cay(tmp)
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
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', bai)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, (r.stdout or '') + (r.stderr or '')


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if ma == 2 or 'BÀI SẬP' in ra or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai_ds):
  tmp, _ = ban_sao([])
  try:
    kq = []
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      dong = [l.strip() for l in ra.splitlines() if re.search(r'\d+ đạt · \d+ hỏng', l)]
      kq.append((bai, ma, dong[-1] if dong else ra.strip()[-160:]))
    return all(m == 0 for _, m, _ in kq), kq
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bang_chung(sha, bai_ds):
  """Bài HIỆN TẠI (cong_cu/ của cây làm việc) trên client/src/ của commit sha."""
  tmp = tempfile.mkdtemp(prefix='dotbien_bao1a_goc_')
  try:
    chep(sha, tmp, ['client/src'])
    chep(None, tmp, ['cong_cu'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} (bài HIỆN TẠI trên code {sha}):')
      print('\n'.join('  ' + l.strip() for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng', l) or 'SẬP' in l))
      print(f'  thoát {ma}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    i = sys.argv.index('--goc')
    bang_chung(sys.argv[i + 1], sys.argv[i + 2:]); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, kq_dc = doi_chung(sorted({d[3] for d in ds}))
  for bai, ma, dong in kq_dc: print(f'ĐỐI CHỨNG {bai}: thoát {ma} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
