#!/usr/bin/env python3
"""KH-THE-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-THE-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-THE-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KH-THE-1/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ + client/src/ của commit sha)

Khuôn viec/UUDAI-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_KHTHE1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2) hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D, T, H = 'server/utils/donApp.js', 'server/routes/tiers.js', 'server/utils/dongHoaDon.js'
I = 'server/routes/kh/index.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B: đọc giỏ (docGio) ──
  ('BV-the-docgio', [(D, "      dong.push({ loai: 'the', hang_id: m.hang_id, so_thang: m.so_thang });\n      continue;", '      return sai;', 1)], r'✗ B1 thẻ GIỮA'),
  ('VS-the-nhieu', [(D, 'if (the.length > 1)', 'if (the.length > 2)', 1)], r'✗ B3 hai dòng'),
  ('VS-the-so-luong', [(D, '(m.so_luong !== undefined && m.so_luong !== 1)', '(m.so_luong !== undefined && m.so_luong > 2)', 1)], r'✗ B4 so_luong 2'),
  ('VS-the-khoa-la', [(D, "const TRUONG_THE = ['hang_id', 'loai', 'so_luong', 'so_thang'];", "const TRUONG_THE = ['hang_id', 'loai', 'so_luong', 'so_thang', 'don_gia', 'gia'];", 1)],
   r'✗ S3 '),
  # ── băm giỏ (khoá gửi) ──
  ('VS-the-bam-bo-the', [(D, "(m?.loai === 'the' ? ['the',", "(false ? ['the',", 1)], r'✗ B10 '),
  ('VS-the-bam-doi-cu', [(D, ": [m?.ma ?? null, m?.so_luong ?? null, m?.ghi_chu || null])) : null,", ": ['mon', m?.ma ?? null, m?.so_luong ?? null, m?.ghi_chu || null])) : null,", 1)],
   r'✗ K1 '),
  # ── báo giá / đặt: thẻ đi đúng membership_buy của quầy ──
  ('BV-the-membership-buy', [(D, "{ ...thanDon(khach, kq.d.items, kq.maDung, kq.gio.the), notes", "{ ...thanDon(khach, kq.d.items, kq.maDung, null), notes", 1)], r'✗ D1 trả ví'),
  ('VS-the-ghep-vi-tri', [(D, "{ g, it: theCt }", "{ g, it: ct.items[gio.dong.indexOf(g)] }", 1)], r'✗ B1 '),
  ('BV-the-giu-ma', [(D, "\n  'HANG_CHI_CAP', 'GOI_HANG_KHONG_BAN', 'DA_CO_HANG_CAO_HON'];", '];', 1)], r'✗ A2/B5–B7 Kim Cương'),
  ('VS-the-sdt-than', [(D, "{ ...thanDon(khach, kq.d.items, kq.maDung, kq.gio.the), notes",
                        "{ ...thanDon(khach, kq.d.items, kq.maDung, kq.gio.the), ...(b.customer_phone ? { customer_phone: b.customer_phone } : {}), notes", 1)], r'✗ S1 '),
  ('VS-the-ly-do-thieu-chu', [(D, "/HANG_CHI_CAP|GOI_HANG_KHONG_BAN|DA_CO_HANG_CAO_HON|Hạng thành viên/", "/HANG_CHI_CAP|GOI_HANG_KHONG_BAN|DA_CO_HANG_CAO_HON/", 1)], r'✗ D8 '),
  # ── Q3: giỏ không pha → tự "xong" lúc đã thu ──
  ('BV-tu-xong', [(D, "getNow(), gioCanPhaChe(kq.gio) ? '' : 'xong']", "getNow(), '']", 1)], r'✗ Q3 giỏ chỉ thẻ trả QR'),
  ('VS-tu-xong-tra-ve', [(D, "tien_trinh_quay: gioCanPhaChe(kq.gio) ? '' : 'xong' }", "tien_trinh_quay: '' }", 1)], r'✗ Q3 giỏ chỉ thẻ trả ví'),
  # ── Q4: giỏ không pha bán mọi giờ ──
  ('BV-gio-moi-gio', [(D, 'gioCanPhaChe(gio) ? await kiemGio() : null', 'await kiemGio()', 1)], r'✗ GIO1 '),
  ('VS-gio-can-pha-dem-ca-the', [(D, 'const gioCanPhaChe = (gio) => gio.mon.length > 0;', 'const gioCanPhaChe = (gio) => gio.dong.length > 0;', 1)], r'✗ GIO1 '),
  # ── G: hiển thị ──
  ('BV-chi-tiet-loai', [(D, "...(laDongThe(d.product_id) ? { loai: 'the' } : {})", '', 1)], r'✗ G2 đơn đã trả'),
  ('BV-quay-bo-the', [(D, "dong.filter((d) => d.loai !== 'the').map((d) => ({ ten:", "dong.map((d) => ({ ten:", 1)], r'✗ G3 '),
  ('BV-hoa-don-the', [(H, "the[i] != null ? 'the' : 'mon'", "'mon'", 1)], r'✗ G1 '),
  ('VS-hoa-don-han-rong', [(H, "const ghiChu = han ? `Hạn mới:", "const ghiChu = !han ? `Hạn mới:", 1)], r'✗ G1 '),
  # ── F: quyền lợi hạng ──
  ('BV-quyen-loi-giu', [(T, 'quyen_loi=COALESCE(?, quyen_loi)', "quyen_loi=COALESCE(?, '')", 1)], r'✗ F3 '),
  ('VS-quyen-loi-tran-dong', [(T, 'dong.length > QUYEN_LOI_TOI_DA_DONG', 'dong.length > QUYEN_LOI_TOI_DA_DONG + 1', 1)], r'✗ F4 '),
  ('VS-quyen-loi-tran-ky-tu', [(T, 'x.length > QUYEN_LOI_TOI_DA_KY_TU', 'x.length >= QUYEN_LOI_TOI_DA_KY_TU', 1)], r'✗ F4 '),
  ('BV-hang-quyen-loi', [(I, "quyen_loi: String(h.quyen_loi || '').split('\\n').filter(Boolean)", "quyen_loi: [String(h.quyen_loi || '')]", 1)], r'✗ F2 '),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khthe1_')
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
  return ['node', os.path.join(GOC, 'cong_cu', 'thu_KHTHE1.js'), '--may-chu', os.path.join(tmp, 'server')]


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    hong = [re.sub(r'\x1b\[[0-9;]*m', '', l).strip() for l in ra.splitlines() if '✗' in l]
    if r.returncode == 2 or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
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
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', re.sub(r'\x1b\[[0-9;]*m', '', ra))
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: bài HIỆN TẠI với server/ + client/src/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_khthe1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', ((r.stdout or '') + (r.stderr or '')).strip())
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or '✓' in l or 'đạt ·' in l or 'sập' in l))
    print(f'GỐC {sha}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    chay_goc(sys.argv[sys.argv.index('--goc') + 1]); sys.exit(0)
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
