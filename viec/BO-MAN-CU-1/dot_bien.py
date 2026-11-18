#!/usr/bin/env python3
"""BO-MAN-CU-1 — đột biến cho MỖI vế chặn: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/BO-MAN-CU-1/dot_bien.py [tên...]             (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/BO-MAN-CU-1/dot_bien.py --liet-ke             (chỉ in danh sách)
    python3 viec/BO-MAN-CU-1/dot_bien.py --cay-goc <sha>       (bằng chứng ĐỎ như cổng A11: cả cây commit sha + MỘT bài thử hiện tại, lần lượt
                                                                 mọi cong_cu/thu_*.js đổi so với sha; --bai <file> chỉ một bài;
                                                                 --kem-ham-phu: chép kèm cong_cu/gia_lap/donCu.js)
    python3 viec/BO-MAN-CU-1/dot_bien.py --so-ca <sha>         (in "SỐ CA <bài>: <N>" của mọi bài đổi, chạy trên cây hiện tại)

Khuôn viec/KET-NOI-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_BOMANCU1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2 / "Bài thử sập") hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_BOMANCU1.js'
OR, GC = 'server/routes/orders.js', 'server/utils/giuCho.js'
IX, TI = 'client/src/pages/BanHang/index.jsx', 'client/src/pages/BanHang/tinh.js'
BH, API = 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/utils/api.js'
TRA_VE = 'return <BanHangMoi kieu={kieu} onDoiKieu={doiKieu} />;'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B1: tài khoản khách / mẹ trên đường thẳng ──
  ('BV-VI-THANG', [(OR, 'if (Number(b.balance_amount) > 0 || Number(b.parent_balance_amount) > 0', 'if (Number(b.parent_balance_amount) > 0', 1)], r'✗ B1a'),
  ('BV-VI-ME-THANG', [(OR, ' || Number(b.parent_balance_amount) > 0 || b.payment_method === "balance"', ' || b.payment_method === "balance"', 1)], r'✗ B1d'),
  ('BV-BALANCE-NHAN', [(OR, ' || b.payment_method === "balance") {', ') {', 1)], r'✗ B1b'),
  ('VS-CAI-DAT-CON', [(OR, '  if (!phien) {\n    if (Number(b.balance_amount)',
                       '''  if (!phien && (await queryOne("SELECT value FROM pos_settings WHERE key = 'thanh_toan_payos_bat_buoc'"))?.value === "1") {\n    if (Number(b.balance_amount)''', 1)],
   r'✗ B1a'),
  # ── B2: chuyển khoản trên đường thẳng ──
  ('BV-CK-THANG', [(OR, 'if (Number(b.transfer_amount) > 0 || b.payment_method === "transfer") {', 'if (b.payment_method === "transfer") {', 1)], r'✗ B2c'),
  ('BV-CK-NHAN', [(OR, 'if (Number(b.transfer_amount) > 0 || b.payment_method === "transfer") {', 'if (Number(b.transfer_amount) > 0) {', 1)], r'✗ B2b'),
  # ── câu 5: ghi nợ / chờ thu trên đường thẳng ──
  ('BV-GHI-NO-THANG', [(OR, 'if (Number(b.debt_amount) > 0 || b.payment_method === "debt" || b.payment_method === "cho_thu") {', 'if (false) {', 1)], r'✗ N1'),
  ('VS-GHI-NO-CHI-SO', [(OR, ' || b.payment_method === "debt" || b.payment_method === "cho_thu") {', ') {', 1)], r'✗ N4'),
  # ── B3: gói, mọi lối ──
  ('BV-GOI-MUA', [(OR, 'if (b.package_buy || b.customer_package_id ||', 'if (b.customer_package_id ||', 1)], r'✗ G1'),
  ('BV-GOI-MA', [(OR, 'if (b.package_buy || b.customer_package_id ||', 'if (b.package_buy ||', 1)], r'✗ G11'),
  ('BV-GOI-TU-GOI', [(OR, ' || (Array.isArray(b.items) && b.items.some((i) => i && i.from_package))) {', ') {', 1)], r'✗ G10'),
  ('VS-GOI-CHI-THANG', [(OR, '    return res.status(400).json({ error: "Quầy tạm ngưng gói", code: "GOI_TAM_DUNG" });',
                         '    if (!phien) return res.status(400).json({ error: "Quầy tạm ngưng gói", code: "GOI_TAM_DUNG" });', 1)], r'✗ G3'),
  ('VS-GOI-THANG-LOI-GOC', [(GC, "const { taoDon } = require('../routes/orders');", "const { taoDonGoc: taoDon } = require('../routes/orders');", 1)], r'✗ K1'),
  # ── A: một màn Bán hàng ──
  ('VS-MAN-THEO-KHO-CU', [(IX, TRA_VE, "return layKho()?.getItem('pos_man_ban_hang_moi') === '0' ? null : <BanHangMoi kieu={kieu} onDoiKieu={doiKieu} />;", 1)],
   r'✗ A1b'),
  ('VS-MAN-CU-QUERY', [(IX, TRA_VE, "return window.location.search.includes('man=cu') ? null : <BanHangMoi kieu={kieu} onDoiKieu={doiKieu} />;", 1)], r'✗ A1c'),
  ('BV-KIEU-KHONG-NHO', [(TI, "    kho.setItem(KHOA_KIEU, KIEU_MAN.includes(kieu) ? kieu : 'tudong');\n", '', 1)], r'✗ A1e'),
  ('BV-NUT-TAT', [(BH, '<b>Kiểu màn bán hàng (máy này)</b>', "<b>Kiểu màn bán hàng (máy này)</b><button onClick={() => onDoiKieu('tudong')}>Tắt — về màn cũ</button>", 1)],
   r'✗ A2a'),
  ('BV-API-CREATE', [(API, "  tinhThu: (data) =>", "  create: (data) => api.post('/orders', data),\n  tinhThu: (data) =>", 1)], r'✗ A3b'),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_bomancu1_')
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


def lenh(tmp, bai=BAI):
  return ['node', os.path.join(GOC, bai), '--may-chu', os.path.join(tmp, 'server')]


def sach(ra):
  return re.sub(r'\x1b\[[0-9;]*m', '', ra)


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = sach((r.stdout or '') + (r.stderr or ''))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
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
    ra = sach((r.stdout or '') + (r.stderr or ''))
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bai_doi(sha):
  ra = subprocess.run(['git', 'diff', '--name-only', '--no-renames', sha, 'HEAD', '--', 'cong_cu'], cwd=GOC, capture_output=True, text=True, check=True).stdout
  return [f for f in ra.split() if re.match(r'^cong_cu/thu_[^/]*\.js$', f) and os.path.exists(os.path.join(GOC, f))]


def so_ca(ra):
  m = re.findall(r'(\d+) đạt · (\d+) hỏng', sach(ra))
  return int(m[-1][0]) + int(m[-1][1]) if m else None


def chay_cay_goc(sha, bai):
  """Như cổng A11: cả cây của commit `sha` (git archive, KHÔNG .git) + chép đè `bai` HIỆN TẠI, chạy `bai` trong cây đó."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_bomancu1_cay_')
  try:
    tar = subprocess.run(['git', 'archive', sha], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    shutil.copy(os.path.join(GOC, bai), os.path.join(tmp, bai))
    if '--kem-ham-phu' in sys.argv:   # lượt thứ hai: kèm hàm phụ mới cong_cu/gia_lap/donCu.js → thấy bài đỏ vì HÀNH VI gốc, không vì thiếu file
      shutil.copy(os.path.join(GOC, 'cong_cu', 'gia_lap', 'donCu.js'), os.path.join(tmp, 'cong_cu', 'gia_lap', 'donCu.js'))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    if os.path.isdir(os.path.join(GOC, 'client', 'node_modules')):
      os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))
    r = subprocess.run(['node', bai], cwd=tmp, capture_output=True, text=True, timeout=300)
    ra = sach(((r.stdout or '') + (r.stderr or '')).strip())
    dong = [l.strip() for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l.lower() or 'Cannot find module' in l]
    print(f'== CÂY GỐC {sha} · {bai}: thoát {r.returncode}')
    for l in dong[:6]: print('   ' + l[:200])
    if len(dong) > 6: print(f'   … (+{len(dong) - 6} dòng)')
  except subprocess.TimeoutExpired:
    print(f'== CÂY GỐC {sha} · {bai}: QUÁ GIỜ 300 s')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--cay-goc' in sys.argv:
    sha = sys.argv[sys.argv.index('--cay-goc') + 1]
    ds = [sys.argv[sys.argv.index('--bai') + 1]] if '--bai' in sys.argv else bai_doi(sha)
    for b in ds: chay_cay_goc(sha, b)
    sys.exit(0)
  if '--so-ca' in sys.argv:
    for b in bai_doi(sys.argv[sys.argv.index('--so-ca') + 1]):
      r = subprocess.run(['node', b], cwd=GOC, capture_output=True, text=True, timeout=600)
      print(f'SỐ CA {b}: {so_ca((r.stdout or "") + (r.stderr or ""))}' + ('' if r.returncode == 0 else f'   (thoát {r.returncode})'))
    sys.exit(0)
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
  print(f"TỔNG: {len(kq)} đột biến · BẮT {dem['BẮT']} · SỐNG {dem['SỐNG']} · HỎNG {dem['HỎNG']} · LẠC {dem['LẠC']}")
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
