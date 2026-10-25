#!/usr/bin/env python3
"""DIEM-THAT-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/DIEM-THAT-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/DIEM-THAT-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/DIEM-THAT-1/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ + cong_cu/gia_lap/ của commit sha)
    python3 viec/DIEM-THAT-1/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/P24/dot_bien.py: chép server/ và cong_cu/gia_lap/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink,
chỉ đọc), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy bài:
  'dt'    → `node cong_cu/thu_DIEMTHAT1.js --may-chu <bản sao server>` (bài nạp bat_bien.js từ <bản sao>/cong_cu/gia_lap);
  'gl'    → `node cong_cu/thu_gia_lap.js --chi-du-lieu-tay --gia-lap <bản sao>/cong_cu/gia_lap` (I8 trên kho dữ liệu tay);
  'p2223', 'p24' → bài cũ cùng khuôn --may-chu (chỉ dùng cho --goc).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 / bài sập hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DT, O, S, BB = 'server/utils/diemThat.js', 'server/routes/orders.js', 'server/routes/signup-codes.js', 'cong_cu/gia_lap/bat_bien.js'
TAO = ('tinhDiemDon(tienTinhDiem({ cash_amount, transfer_amount, shipping_fee: finalShippingFee, total, '
       'balance_amount: actualBalanceAmount, parent_balance_amount: actualParentBalanceAmount }), now)')
THU = 'tienTinhDiem({ ...order, [cotTien]: (Number(order[cotTien]) || 0) + paidAmount })'
G_MOI = 'const g = Math.floor(Math.max(0, Math.round(tra - so(r.shipping_fee))) / per);'
TRA = 'const tra = Math.min(so(r.cash_amount) + so(r.transfer_amount), so(r.total) - so(r.balance_amount) - so(r.parent_balance_amount));'
VE_THAT = "      if (cu && String(r.created_at) < DIEM_THAT_TU && so(r.diem) === diemDung(false, gCu)) return [];   // DIEM-THAT-1: luật P22-23\n"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── A: hàm tienTinhDiem (server/utils/diemThat.js) ──
  ('VS-HAM-BO-PHI', [(DT, ' - (Number(dong.shipping_fee) || 0)', '', 1)], r'✗ B3 ', 'dt'),
  ('VS-HAM-BO-CK', [(DT, ' + (Number(dong.transfer_amount) || 0)', '', 1)], r'✗ B4 ', 'dt'),
  # soát vòng 2 (câu hỏi 4 (b)): trần total − ví − ví mẹ
  ('VS-HAM-BO-TRAN', [(DT, 'Math.min(traThat, tran)', 'traThat', 1)], r'✗ B7 ', 'dt'),
  ('VS-HAM-TRAN-BO-VI-ME', [(DT, ' - (Number(dong.parent_balance_amount) || 0)', '', 1)], r'✗ A1 ', 'dt'),
  # soát vòng 2: vế ví thường của trần trong hàm
  ('VS-HAM-TRAN-BO-VI', [(DT, ' - (Number(dong.balance_amount) || 0)', '', 1)], r'✗ B7 ', 'dt'),
  ('VS-HAM-LAM-TRON', [(DT, 'Math.max(0, Math.round(', 'Math.max(0, (', 1)], r'✗ A1 ', 'dt'),
  # ── B: POST / ──
  ('BV-TAO', [(O, TAO, 'tinhDiemDon(total, now)', 1)], r'✗ B1 ', 'dt'),
  ('VS-TAO-PHI-THO', [(O, 'shipping_fee: finalShippingFee, total,', 'shipping_fee, total,', 1)], r'✗ B6 ', 'dt'),
  ('VS-TAO-BO-VI', [(O, 'balance_amount: actualBalanceAmount, parent_balance_amount', 'parent_balance_amount', 1)], r'✗ B7 ', 'dt'),
  ('VS-TAO-BO-VI-ME', [(O, ', parent_balance_amount: actualParentBalanceAmount })', ' })', 1)], r'✗ B8 ', 'dt'),
  ('VS-TAO-BO-TOTAL', [(O, 'shipping_fee: finalShippingFee, total,', 'shipping_fee: finalShippingFee,', 1)], r'✗ G1 ', 'dt'),
  # ── C: pay-debt ──
  ('BV-THU', [(O, 'tinhDiemDon(' + THU + ', now)', 'tinhDiemDon(Number(order.total), now)', 1)], r'✗ C2 ', 'dt'),
  ('VS-THU-QUEN-LAN-NAY', [(O, THU, 'tienTinhDiem(order)', 1)], r'✗ C1 ', 'dt'),
  # ── D: /nhan-diem ──
  ('BV-MA', [(S, 'Math.floor(tienTinhDiem(don) / moiBaoNhieu)', 'Math.floor(Number(don.total || 0) / moiBaoNhieu)', 1)], r'✗ D1 ', 'dt'),
  ('VS-MA-THIEU-COT', [(S, 'flash_discount, cash_amount, transfer_amount, shipping_fee, balance_amount, parent_balance_amount FROM pos_orders',
                        'flash_discount FROM pos_orders', 1)], r'✗ G4 ', 'dt'),
  ('VS-MA-THIEU-COT-VI', [(S, ', balance_amount, parent_balance_amount FROM pos_orders', ', parent_balance_amount FROM pos_orders', 1)], r'✗ D4 ', 'dt'),
  ('VS-MA-THIEU-COT-VI-ME', [(S, ', balance_amount, parent_balance_amount FROM pos_orders', ', balance_amount FROM pos_orders', 1)], r'✗ D5 ', 'dt'),
  # ── F: bất biến I8 (cong_cu/gia_lap/bat_bien.js) ──
  ('BV-I8', [(BB, G_MOI, 'const g = Math.floor(so(r.total) / per);', 1)], r'✗ F2 ', 'dt'),
  ('BV-I8-tay', [(BB, G_MOI, 'const g = Math.floor(so(r.total) / per);', 1)], r'✗ I8 \(DIEM-THAT-1\) đơn ví trọn có điểm theo total', 'gl'),
  ('VS-I8-BO-PHI', [(BB, ' - so(r.shipping_fee)', '', 1)], r'✗ F5 ', 'dt'),
  # soát vòng 1: mỗi vế của I8 một đột biến MANG TÊN (CK, làm tròn, vế `cu` của mốc mới)
  ('VS-I8-BO-CK', [(BB, 'Math.min(so(r.cash_amount) + so(r.transfer_amount),', 'Math.min(so(r.cash_amount),', 1)], r'✗ F1 ', 'dt'),
  ('VS-I8-BO-TRAN', [(BB, TRA, 'const tra = so(r.cash_amount) + so(r.transfer_amount);', 1)], r'✗ F1 ', 'dt'),
  ('VS-I8-TRAN-BO-VI', [(BB, ' - so(r.balance_amount)', '', 1)], r'✗ F1 ', 'dt'),
  ('VS-I8-TRAN-BO-VI-ME', [(BB, ' - so(r.parent_balance_amount)', '', 1)], r'✗ F1 ', 'dt'),
  ('VS-I8-BO-LAM-TRON', [(BB, 'Math.round(tra - so(r.shipping_fee))', '(tra - so(r.shipping_fee))', 1)],
   r'✗ I8 sạch \(DIEM-THAT-1\): tiền mặt lẻ', 'gl'),
  ('VS-I8-MOC-THAT-BO-HUYCU', [(BB, 'if (cu && String(r.created_at) < DIEM_THAT_TU', 'if (ctx.thuc && String(r.created_at) < DIEM_THAT_TU', 1)],
   r'✗ I8 Đối soát thật \(P24\): đơn TẠO trước mốc thu đủ', 'gl'),
  ('VS-I8-BO-MOC', [(BB, 'if (cu && String(r.created_at) < DIEM_THAT_TU && ', 'if (cu && ', 1)], r'✗ F2 ', 'dt'),
  ('VS-I8-MOC-GIA-LAP', [(BB, 'if (cu && String(r.created_at) < DIEM_THAT_TU',
                          "if ((huyCu || r.status !== 'cancelled') && String(r.created_at) < DIEM_THAT_TU", 1)], r'✗ F4 ', 'dt'),
  ('BV-I8-VE-LUAT-CU', [(BB, VE_THAT, '', 1)], r'✗ F3 ', 'dt'),
  ('VS-I8-CU-CU-GMOI', [(BB, '< DIEM_KHI_THU_TU && so(r.diem) === diemDung(true, gCu)', '< DIEM_KHI_THU_TU && so(r.diem) === diemDung(true, g)', 1)],
   r'✗ F6 ', 'dt'),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/gia_lap/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_diemthat1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
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


BAI = {'dt': 'thu_DIEMTHAT1.js', 'p2223': 'thu_P2223.js', 'p24': 'thu_P24.js'}


def lenh(bai, tmp):
  if bai == 'gl':
    return ['node', os.path.join(GOC, 'cong_cu', 'thu_gia_lap.js'), '--chi-du-lieu-tay', '--gia-lap', os.path.join(tmp, 'cong_cu', 'gia_lap')]
  return ['node', os.path.join(GOC, 'cong_cu', BAI[bai]), '--may-chu', os.path.join(tmp, 'server')]


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(bai, tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    if '--in-ra' in sys.argv: print(f'── {ten}: 12 dòng cuối ──\n' + '\n'.join(ra.strip().splitlines()[-12:]))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if r.returncode == 2 or 'Bài thử sập' in ra or 'bài thử sập' in ra:
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
    kq = []
    for bai in ('dt', 'gl'):
      r = subprocess.run(lenh(bai, tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
      ra = (r.stdout or '') + (r.stderr or '')
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      kq.append((r.returncode == 0 and m is not None and m.group(2) == '0', f'{bai}: ' + (m.group(0) if m else ra[-200:])))
    return all(x for x, _ in kq), ' · '.join(d for _, d in kq)
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: chạy bài thử HIỆN TẠI với server/ + cong_cu/gia_lap/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_diemthat1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'cong_cu/gia_lap'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    for bai in ('dt', 'p2223', 'p24', 'gl'):
      r = subprocess.run(lenh(bai, tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
      ra = ((r.stdout or '') + (r.stderr or '')).strip()
      print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
      print(f'GỐC {sha} [{bai}]: thoát {r.returncode}')
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
