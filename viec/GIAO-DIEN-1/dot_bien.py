#!/usr/bin/env python3
"""GIAO-DIEN-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-DIEN-1/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/GIAO-DIEN-1/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/GIAO-DIEN-1/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)
Khuôn viec/BH-CKTAY-1/dot_bien.py: chép server/, client/src/, cong_cu/, kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG), chạy bài trên bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'thu_GIAODIEN1.js'
CHEP = ['server', 'client/src', 'cong_cu', 'kiem_tra_truoc_khi_giao.js']
DB, N18 = 'server/database.js', 'server/nang_cap/018_nap_tay_chu_quan.js'
DAI, NOI = 'client/src/utils/donAppDai.js', 'client/src/components/DonAppNoi.jsx'
LAY, MENU = 'client/src/components/Layout.jsx', 'client/src/pages/QuanLy/menu.js'
VI, KH, APP = 'client/src/components/ViKhach.jsx', 'client/src/pages/Customers.jsx', 'client/src/App.jsx'
QR, THE = 'client/src/utils/veQrThuongHieu.js', 'client/src/components/TheQr.jsx'
MQ, MT, HDP = 'client/src/pages/BanHang/ManQr.jsx', 'client/src/pages/ManKhach/ManThu.jsx', 'client/src/components/InvoicePreview.jsx'
VIROUTE, CHAY = 'server/routes/wallets.js', 'server/nang_cap/chay.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── E nạp tay chỉ chủ quán ──
  ('BV-SEED-MANAGER', [(DB, "['manager', 'topup_balance', 0]", "['manager', 'topup_balance', 1]", 1)], r'✗ E(1|2|11) ', BAI),
  ('BV-SEED-STAFF', [(DB, "['staff', 'topup_balance', 0],", "['staff', 'topup_balance', 1],", 1)], r'✗ E(1|3|11) ', BAI),
  ('VS-SEED-OWNER-TAT', [(DB, "['owner', 'topup_balance', 1]", "['owner', 'topup_balance', 0]", 1)], r'✗ E(1|11) ', BAI),
  ('BV-018-KHONG-DOI', [(N18, "SET allowed = 0", "SET allowed = 1", 1)], r'✗ E6 ', BAI),
  ('VS-018-DOI-CA-OWNER', [(N18, "role IN ('manager', 'staff')", "role IN ('manager', 'staff', 'owner')", 1)], r'✗ E(6|7) ', BAI),
  ('BV-018-KHONG-SAO-LUU', [(N18, "  await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_018_pos_permissions AS SELECT * FROM pos_permissions');\n", "", 1)], r'✗ E7 ', BAI),
  ('VS-CHAY-NANG-CAP-CHAY-LAI', [(CHAY, "'INSERT INTO pos_nang_cap (so, ten, luc) VALUES (?, ?, ?)'", "'INSERT OR REPLACE INTO pos_nang_cap (so, ten, luc) VALUES (?, ?, ?)'", 1)], r'✗ E8 ', BAI),
  ('VS-ROUTE-NAP-BI-CHAN-QUYEN-LA', [(VIROUTE, "router.post('/topup', authenticate, checkPermission('topup_balance')", "router.post('/topup', authenticate, checkPermission('quyen_khong_ton_tai')", 1)], r'✗ E(9|12) ', BAI),
  ('BV-ROUTE-NAP-BO-CONG', [(VIROUTE, "router.post('/topup', authenticate, checkPermission('topup_balance'), async", "router.post('/topup', authenticate, async", 1)], r'✗ E(2|3|12) ', BAI),
  # ── A dải báo ──
  ('VS-DEM-CA-DANG-LAM', [(DAI, "const moi = dong.filter((d) => d?.tien_trinh === 'da_tra');", "const moi = dong.filter((d) => d?.tien_trinh === 'da_tra' || d?.tien_trinh === 'dang_lam');", 1)], r'✗ A(1|3) ', BAI),
  ('VS-SOM-NHAT-LA-MIN', [(DAI, "Math.max(...phut)", "Math.min(...phut)", 1)], r'✗ A3 ', BAI),
  ('VS-PHUT-AM', [(DAI, "Math.max(0, Math.floor((bayGioMs - t) / 60000))", "Math.floor((bayGioMs - t) / 60000)", 1)], r'✗ A7 ', BAI),
  ('BV-DAI-HIEN-LUON', [(DAI, "export const hienDai = (tom) => tom.soMoi > 0;", "export const hienDai = () => true;", 1)], r'✗ A4 ', BAI),
  ('VS-DAI-HIEN-KHI-CHI-VAO-VI', [(DAI, "export const hienDai = (tom) => tom.soMoi > 0;", "export const hienDai = (tom) => tom.soMoi > 0 || tom.soViVe > 0;", 1)], r'✗ A5 ', BAI),
  ('VS-DAI-HEP-VAN-HIEN-PHUT', [(DAI, "if (rong && tom.soMoi > 0", "if (tom.soMoi > 0", 1)], r'✗ A9 ', BAI),
  ('BV-NUT-NOI-VE', [(NOI, "      background: tom.soMoi ? '#dc2626' : '#f59e0b', color: '#fff',\n", "      background: tom.soMoi ? '#dc2626' : '#f59e0b', color: '#fff', position: 'fixed', top: 10, right: 12,\n", 1)], r'✗ A(11|12) ', BAI),
  ('BV-DAI-BO-GAN', [(LAY, "        <DaiDonApp tom={donApp} />\n", "", 1)], r'✗ A13 ', BAI),
  ('VS-DAI-DOI-NUT-XEM', [(NOI, "        Xem\n", "        Mở\n", 1)], r'✗ A16 ', BAI),
  ('BV-CHUONG-BO-EXPORT', [(NOI, "export function keuChuong(", "function keuChuong(", 1)], r'✗ A14 ', BAI),
  # ── B menu ──
  ('BV-MENU-BO-DON-APP', [(MENU, "  { to: '/don-app', ten: 'Đơn App' },", "", 1)], r'✗ B(1|2) ', BAI),
  ('VS-MENU-DON-APP-DOI-QUYEN', [(MENU, "{ to: '/don-app', ten: 'Đơn App' },", "{ to: '/don-app', ten: 'Đơn App', quyen: 'view_reports' },", 1)], r'✗ B(1|2) ', BAI),
  ('BV-SO-DO', [(MENU, "Number(so?.donApp) > 0 ? Number(so.donApp) : 0", "0", 1)], r'✗ B4 ', BAI),
  ('VS-SO-DO-MUC-KHAC', [(MENU, "(to === '/don-app' && Number(so?.donApp) > 0", "(Number(so?.donApp) > 0", 1)], r'✗ B4 ', BAI),
  ('BV-LAYOUT-BO-SO-DO', [(LAY, 'className="nav-badge"', 'className="nav"', 2)], r'✗ B5 ', BAI),
  # ── D lưới Quản lý ──
  ('BV-O-KHACH-VA-TIEN', [(MENU, "  { ten: 'Khách và tiền',", "  { ten: 'Khách và tiền (tắt)', loi: [], x: 0,", 1)], r'✗ D', BAI),
  ('VS-O-HOAN-TIEN-KHONG-QUYEN', [(MENU, "{ to: '/refunds', ten: 'Hoàn tiền', quyen: 'approve_refund' }, { to: '/reports', ten: 'Báo cáo / đối soát'", "{ to: '/refunds', ten: 'Hoàn tiền' }, { to: '/reports', ten: 'Báo cáo / đối soát'", 1)], r'✗ D(2|4) ', BAI),
  ('VS-O-KHACH-CAN-QUYEN-OAN', [(MENU, "{ to: '/customers', ten: 'Khách hàng và số dư' }", "{ to: '/customers', ten: 'Khách hàng và số dư', quyen: 'view_reports' }", 1)], r'✗ D2 ', BAI),
  # ── C Số dư gộp ──
  ('VS-NAP-TAY-MOI-NGUOI', [(VI, "user?.role === 'owner' &&", "true &&", 1)], r'✗ C4 ', BAI),
  ('VS-DIEU-CHINH-MOI-NGUOI', [(VI, "hasPermission('adjust_balance') &&", "true &&", 1)], r'✗ C3 ', BAI),
  ('BV-KHU-VI-KHONG-GAN', [(KH, "<ViKhach khach=", "<span khach=", 1)], r'✗ C6 ', BAI),
  ('BV-TONG-GUI-QUAN', [(KH, "Khách đang gửi quán", "Có số dư tổng", 1)], r'✗ C6 ', BAI),
  ('VS-BALANCE-VE-TRANG-CHU', [(APP, 'element={<Navigate to="/customers" replace />} />   {/* GIAO-DIEN-1 C', 'element={<Navigate to="/" replace />} />   {/* GIAO-DIEN-1 C', 1)], r'✗ C9 ', BAI),
  ('BV-LOI-SO-DU-CON', [(MENU, "  orders: [{ to: '/refunds', ten: 'Hoàn tiền', quyen: 'approve_refund' }],\n", "  orders: [{ to: '/refunds', ten: 'Hoàn tiền', quyen: 'approve_refund' }],\n  customers: [{ to: '/balance', ten: 'Số dư', quyen: 'view_customer_balance' }],\n", 1)], r'✗ (C8|F8)', BAI),
  # ── F thẻ QR ──
  ('VS-QR-MUC-M', [(QR, "const q = qrcode(0, 'H');", "const q = qrcode(0, 'M');", 1)], r'✗ F(1|10) ', BAI),
  ('VS-QR-MAU-DAO-TRAI-PHAI', [(QR, "${c + 0.5 < n / 2 ? 't' : 'p'}", "${c + 0.5 < n / 2 ? 'p' : 't'}", 1)], r'✗ F(3|4) ', BAI),
  ('VS-QR-LOGO-TO', [(QR, "n * 0.19 * 100", "n * 0.3 * 100", 1)], r'✗ F(6|10) ', BAI),
  ('VS-QR-VIEN-NHO', [(QR, "const LE_TRANG = 3;", "const LE_TRANG = 2;", 1)], r'✗ F2 ', BAI),
  ('VS-QR-CHAM-DE-LOGO', [(QR, "    if (Math.hypot(c + LE_TRANG + 0.5 - tam, r + LE_TRANG + 0.5 - tam) <= kinhNen / 2) continue;   // dưới nền logo\n", "", 1)], r'✗ F(7|10) ', BAI),
  ('VS-QR-CHAM-TRONG-O-GOC', [(QR, "if (!hang[r][c] || trongGoc(r, c)) continue;", "if (!hang[r][c]) continue;", 1)], r'✗ F5 ', BAI),
  ('VS-QR-GOC-DAO-MAU', [(QR, "mau: MAU_GOC[phanTu(r + 3, c + 3, n)]", "mau: MAU_GOC.tt", 1)], r'✗ F4 ', BAI),
  ('VS-QR-CHAM-VUONG', [(QR, '<circle cx="${x.c + le + 0.5}" cy="${x.r + le + 0.5}" r="0.47"/>', '<rect x="${x.c + le}" y="${x.r + le}" width="1" height="1"/>', 1)], r'✗ F8 ', BAI),
  ('VS-QR-CHAN-THE-CHI-NOI-DUNG', [(QR, "return s ? `${s.split(/\\s+/).pop()} · ${s}` : '';", "return s;", 1)], r'✗ F16 ', BAI),
  ('VS-THE-VIEN-SAI-MAU', [(THE, "#B08028", "#B08029", 1)], r'✗ F13 ', BAI),
  ('VS-THE-CHEN-DONG-CUOI', [(THE, "        {chan &&", "        <div>Cảm ơn quý khách</div>\n        {chan &&", 1)], r'✗ F13 ', BAI),
  ('BV-MANQR-QR-CU', [(MQ, "import TheQr from '../../components/TheQr';", "import TheQr from '../../components/TheQr';\nimport { qrSvg } from '../../utils/veQr';", 1)], r'✗ F14 ', BAI),
  ('BV-MANTHU-BO-THE', [(MT, '<TheQr className="mk-the"', '<div className="mk-the"', 1)], r'✗ F14 ', BAI),
  ('VS-BILL-DOI-SANG-THE', [(HDP, "import { qrSvg } from '../utils/veQr';", "import { qrSvg } from '../utils/veQr';\nimport { veQrThuongHieu } from '../utils/veQrThuongHieu';", 1)], r'✗ F15 ', BAI),
]


def lam_cay(tmp):
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))   # qrcode-generator + jsqr cho bài thử


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
  tmp = tempfile.mkdtemp(prefix='dotbien_gd1_')
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
    if ma == 2 or 'BÀI SẬP' in ra:
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
  """Bài HIỆN TẠI trên server/ + client/src của commit sha (bằng chứng ĐỎ)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_gd1_goc_')
  try:
    chep(sha, tmp, ['server', 'client/src'])
    chep(None, tmp, ['cong_cu', 'kiem_tra_truoc_khi_giao.js'])
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
