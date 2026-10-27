#!/usr/bin/env python3
"""HD-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/HD-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/HD-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/HD-1/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ + client/src/ của commit sha)
    python3 viec/HD-1/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/DIEM-THAT-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink,
chỉ đọc), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy
`node cong_cu/thu_HD1.js --goc <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 / bài sập hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Đối chứng (bản chưa đột biến) phải xanh TRỪ ca C0 (thư viện qrcode-generator chưa cài — xem trang_thai.md ## Câu hỏi 1); đột biến
của veQr.js chỉ chạy được khi thư viện có mặt.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HD, ND, SC, ST, IX, DB = ('server/routes/hoaDon.js', 'server/utils/nhanDiem.js', 'server/routes/signup-codes.js',
                          'server/routes/settings.js', 'server/index.js', 'server/database.js')
CH, IP, VQ, PR = ('client/src/utils/hoaDon.js', 'client/src/utils/inPhieu.js', 'client/src/utils/veQr.js',
                  'client/src/components/InvoicePrint.jsx')

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: cửa dữ liệu (server/routes/hoaDon.js) ──
  ('BV-HD-DANG-NHAP', [(HD, "router.get('/:id', authenticate, async", "router.get('/:id', async", 1)], r'✗ A1 '),
  ('VS-HD-N-THEO-TOTAL', [(HD, 'tienDiem: tienTinhDiem(o)', 'tienDiem: Number(o.total)', 1)], r'✗ A18'),
  ('VS-HD-MA-DA-DUNG', [(HD, '!m.diem_nhan_luc && !hetHan && o.status', '!hetHan && o.status', 1)], r'✗ A10 '),
  ('VS-HD-MA-HET-HAN', [(HD, "ch.bat && !m.diem_nhan_luc && !hetHan &&", "ch.bat && !m.diem_nhan_luc &&", 1)], r'✗ A18c '),
  ('VS-HD-MA-DON-HUY', [(HD, " && o.status === 'completed' && o.payment_status === 'paid'", '', 1)], r'✗ A28 '),
  ('VS-HD-KHACH-QUEN-CO-MA', [(HD, '  if (o.customer_phone) return null;\n  const m = await queryOne', '  const m = await queryOne', 1)], r'✗ (A14|A23) '),
  ('VS-HD-N-KHONG-TAT-CT', [(HD, 'ch.bat && !m.diem_nhan_luc', '!m.diem_nhan_luc', 1)], r'✗ A15 '),
  ('VS-HD-GIAM-MA-THEO-COT', [(HD, 'Math.max(0, gocTong - giamHang - giamFlash + phiGiao - tongDon)', 'so(o.discount)', 1)], r'✗ (A21|A12) '),
  ('VS-HD-TT-BO-DON-LECH', [(HD, '  if (lech > 0) t[chinh] += lech;\n', '', 1)], r'✗ A29 '),
  ('VS-HD-TT-CK-CU', [(HD, "o.payment_method === 'transfer' ? 'chuyen_khoan' : 'tien_mat'", "'tien_mat'", 1)], r'✗ A30 '),
  ('VS-HD-DIEM-TRUOC-DON-SAU', [(HD, '(order_id IS NULL OR order_id < ?)', '(order_id IS NULL OR order_id <> ?)', 1)], r'✗ A24 '),
  ('VS-HD-DIEM-DOI-QUA-BO', [(HD, "const doi = o.discount_code\n", "const doi = false\n", 1)], r'✗ A23b '),
  ('VS-HD-DIEM-CONG-MOI-LOAI', [(HD, "AND customer_phone = ? AND type = 'earn'", "AND customer_phone = ?", 1)], r'✗ A23 '),
  ('VS-HD-SO-LAN-MOI-DON', [(HD, "FROM pos_invoice_logs WHERE order_id = ?', [o.id]", "FROM pos_invoice_logs WHERE ? > 0', [o.id]", 1)], r'✗ A31 '),
  ('VS-HD-GIA-HANG-BANG-GOC', [(HD, 'm.tier_unit_price != null && so(m.tier_unit_price) < goc ?', 'm.tier_unit_price != null ?', 1)], r'✗ A29 '),
  ('VS-HD-SO-BILL-MA-DAY-DU', [(HD, "const soBill = (code) => String(code || '').split('-').pop();", "const soBill = (code) => String(code || '');", 1)], r'✗ A3 '),
  ('BV-HD-KHONG-GHI', [(HD, "router.get('/:id', authenticate, async (req, res) => {\n  try {", "router.get('/:id', authenticate, async (req, res) => {\n  try {\n    await query(\"UPDATE pos_orders SET status = 'completed' WHERE id = ?\", [req.params.id]);", 1)], r'✗ A(28|34) '),
  ('VS-HD-LO-LOI-NOI-BO', [(HD, "res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });", "res.status(500).json({ error: err.message });", 1)], r'✗ A36 '),
  ('BV-MOUNT-HOA-DON', [(IX, "app.use('/api/pos/hoa-don', require('./routes/hoaDon'));", '', 1)], r'✗ A35 '),
  # ── D: /nhan-diem và hoá đơn cùng một hàm ──
  ('VS-ND-FLASH-HOI', [(ND, "if (Number(don.flash_discount) > 0) {", "if (false) {", 1)], r'✗ A12 '),
  ('VS-ND-HE-SO-CO-DINH', [(ND, ': Math.round(diemGoc * ch.heSo)', ': Math.round(diemGoc * 2)', 1)], r'✗ A11 '),
  ('VS-ND-TICH-DIEM-TAT', [(ND, "if (loy.loyalty_enabled !== '1' && loy.loyalty_enabled !== 'true') {", "if (false) {", 1)], r'✗ A17 '),
  ('VS-ND-LAM-TRON', [(ND, 'Math.floor(tienDiem / moiBaoNhieu)', 'Math.round(tienDiem / moiBaoNhieu)', 1)], r'✗ A18'),
  ('BV-ND-ROUTE-GOI-HAM', [(SC, 'tienDiem: tienTinhDiem(don)', 'tienDiem: Number(don.total || 0)', 1)], r'✗ A18b '),
  # ── E: PUT /settings ──
  ('BV-ST-KHONG-AN', [(ST, 'if (anBatBuoc.length) {', 'if (false) {', 1)], r'✗ E2 '),
  ('VS-ST-KHONG-AN-THIEU-TONG', [(HD, "const KHONG_AN_DUOC = ['ten_quan', 'so_bill', 'tong', ", "const KHONG_AN_DUOC = ['ten_quan', 'so_bill', ", 1)], r'✗ E[12] '),
  ('VS-ST-KHONG-AN-GIA-TRI-1', [(ST, "['true', '1'].includes(String(settings['invoice_an_' + k]))", "['true'].includes(String(settings['invoice_an_' + k]))", 1)], r'✗ E2b '),
  ('VS-ST-SO-TO-BA', [(ST, "['1', '2'].includes(String(settings.invoice_so_to))", "['1', '2', '3'].includes(String(settings.invoice_so_to))", 1)], r'✗ E4 '),
  ('VS-ST-GHI-TRUOC-KHI-KIEM', [(ST, "    // HD-1: mục bắt buộc của hoá đơn", "    for (const [k0, v0] of Object.entries(settings)) await run(\"INSERT OR REPLACE INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)\", [k0, String(v0), 'x']);\n    // HD-1: mục bắt buộc của hoá đơn", 1)], r'✗ E2 '),
  ('VS-SEED-LECH', [(DB, "['invoice_chu_gia_goc', 'Giá gốc']", "['invoice_chu_gia_goc', 'Tiền hàng']", 1)], r'✗ E6 '),
  # ── G: hàm thuần (client/src/utils/hoaDon.js) ──
  ('VS-G-KHONG-AN-BO', [(CH, "an[k] = !KHONG_AN.includes(k) && laBat(", "an[k] = laBat(", 1)], r'✗ G33 '),
  ('VS-G-KHONG-AN-THIEU-TM', [(CH, "'ck', 'tm'];", "'ck'];", 1)], r'✗ (G34|E1) '),
  ('VS-G-KHONG-AN-TRONG-RONG', [(CH, 'if (KHONG_AN.includes(k) && !String(v).trim()) v = CHU_MAC_DINH[k];', '', 1)], r'✗ G36b '),
  ('VS-G-CHU-CU-MAT', [(CH, "else if (KHOA_CU[k] && co(s, KHOA_CU[k])", "else if (false && KHOA_CU[k] && co(s, KHOA_CU[k])", 1)], r'✗ G41 '),
  ('VS-G-KHOA-MOI-KHONG-DE', [(CH, "if (co(s, `invoice_chu_${k}`)) v =", "if (false) v =", 1)], r'✗ (G38|G42|G37) '),
  ('VS-G-DEM-NGUONG', [(CH, 'qua: dai > gioiHan', 'qua: dai >= gioiHan', 1)], r'✗ G40 '),
  ('VS-G-DEM-CHUA-DIEN', [(CH, 'const dai = dienChu(text, MAU_DEM).length;', 'const dai = String(text ?? "").length;', 1)], r'✗ G44 '),
  ('VS-G-INLAI-LAN-1', [(CH, 'Math.max(2, (Number(hd?.so_lan_in) || 0) + 1)', 'Math.max(1, (Number(hd?.so_lan_in) || 0) + 1)', 1)], r'✗ G31 '),
  ('BV-G-INLAI', [(CH, "in_lai: inLai ? `IN LẠI · LẦN ${lan}` : null,", "in_lai: null,", 1)], r'✗ G30 '),
  ('VS-G-INLAI-LAN-KHONG-TANG', [(CH, '(Number(hd?.so_lan_in) || 0) + 1)', '1)', 1)], r'✗ G31 '),
  ('VS-G-CHAN-CA-HAI-TO', [(CH, "if (laKhach && hien('cam_on'))", "if (hien('cam_on'))", 1)], r'✗ G26 '),
  ('VS-G-CHINH-SACH-CA-HAI-TO', [(CH, "if (laKhach && hien('chinh_sach'))", "if (hien('chinh_sach'))", 1)], r'✗ G26 '),
  ('VS-G-SO-TO-MAC-DINH-1', [(CH, 'export const SO_TO_MAC_DINH = 2;', 'export const SO_TO_MAC_DINH = 1;', 1)], r'✗ G(25|28) '),
  ('VS-G-SO-TO-RAC', [(CH, 'return n === 1 ? 1 : n === 2 ? 2 : SO_TO_MAC_DINH;', 'return n === 1 ? 1 : n >= 2 ? n : SO_TO_MAC_DINH;', 1)], r'✗ G28 '),
  ('VS-G-GIAM-HANG-LUON-HIEN', [(CH, 'if (tien.giam_hang > 0 && hien(', 'if (hien(', 1)], r'✗ G12 '),
  ('VS-G-PHI-GIAO-LUON-HIEN', [(CH, 'if (tien.phi_giao > 0 && hien(', 'if (hien(', 1)], r'✗ G20 '),
  ('VS-G-N0-VAN-HUA', [(CH, 'if (m.diem > 0 && hien(\'ma_diem\'))', 'if (hien(\'ma_diem\'))', 1)], r'✗ G1[78] '),
  ('VS-G-N0-KHONG-UU-DAI', [(CH, "else if (!(m.diem > 0) && m.uu_dai && hien('ma_uu_dai'))", "else if (!(m.diem > 0) && hien('ma_uu_dai'))", 1)], r'✗ G17 '),
  ('VS-G-UU-DAI-HUA-DIEM', [(CH, "else if (!(m.diem > 0) && m.uu_dai && hien('ma_uu_dai')) maDiem = { chu: d('ma_uu_dai'), ma: m.ma };", "else if (m.uu_dai && hien('ma_uu_dai')) maDiem = { chu: d('ma_uu_dai'), ma: m.ma };", 1)], r'✗ G13 '),
  ('VS-G-QR-KHONG-MA-GIU-THAM-SO', [(CH, ".replace(/([?&])ma=\\{ma\\}(&?)/, (_, sep, amp) => (amp ? sep : ''))\n", "\n", 1)], r'✗ G(15|45) '),
  ('VS-G-QR-THAM-SO-DAU-SAI', [(CH, "(_, sep, amp) => (amp ? sep : '')", "(_, sep, amp) => (amp ? '&' : '')", 1)], r'✗ G45 '),
  ('VS-G-QR-TRONG-VAN-IN', [(CH, "if (!/^https?:\\/\\/\\S+$/i.test(m)) return '';", "if (!m) return '';", 1)], r'✗ G46 '),
  ('VS-G-QR-KHONG-MA-HOA', [(CH, 'encodeURIComponent(String(ma))', 'String(ma)', 1)], r'✗ G47 '),
  ('VS-G-CHU-GIA-GOC-SAI', [(CH, "return `Giá gốc ${so(goc)} → ${so(hang)}`;", "return `Giá gốc ${so(hang)} → ${so(goc)}`;", 1)], r'✗ (G11|G48) '),
  ('VS-G-TIEN-KHONG-LAM-TRON', [(CH, 'const x = Math.round(Number(n) || 0);', 'const x = Number(n) || 0;', 1)], r'✗ G53 '),
  ('VS-G-DUA-TRA-LUON-HIEN', [(CH, 'if (hd?.khach_dua > 0 && hien', 'if (hien', 1)], r'✗ G52 '),
  ('VS-G-HUY-KHONG-BAO', [(CH, "trangThai === 'cancelled' && hien('da_huy')", "false && hien('da_huy')", 1)], r'✗ G49 '),
  ('VS-G-DIEM-DOI-LUON-HIEN', [(CH, 'if (diem.doi_qua > 0 && hien(', 'if (hien(', 1)], r'✗ G9 '),
  ('VS-G-TEM-CAT-40', [(CH, "String(s).length > n ? String(s).slice(0, n - 1)", "String(s).length >= n ? String(s).slice(0, n - 1)", 1)], r'✗ (G57|F3) '),
  # ── F: tem ──
  ('BV-TEM-CHU-TUY-CHINH', [(IP, "moi = dungTem(don, nhomTheoMa, cfg, inLai, settings);", "moi = dungTem(don, nhomTheoMa, cfg, inLai);", 1)], r'✗ F2 '),
  ('VS-TEM-CHAN-LAY-DAU', [(IP, "const chan = settings ? chuTem(settings, 'tem_chan', tenKhach) : '';", "const chan = dau;", 1)], r'✗ F2 '),
  ('VS-TEM-KHACH-LE-TEN', [(IP, "const tenKhach = String(don?.customer_name || '').trim() === KHACH_LE ? '' : String(don?.customer_name || '').trim();", "const tenKhach = String(don?.customer_name || '').trim();", 1)], r'✗ F7 '),
  # ── H: InvoicePrint đi qua cửa hoá đơn ──
  ('BV-IN-QUA-CUA-HOA-DON', [(PR, 'api.get(`/hoa-don/${order.id}`)', 'Promise.reject(new Error("tat"))', 1)], r'✗ H1 '),
  # ── C: QR (cần thư viện qrcode-generator trong client/node_modules) ──
  ('VS-QR-DAO-MAU', [(VQ, 'q.isDark(r, c)', '!q.isDark(r, c)', 1)], r'✗ C1 '),
  ('VS-QR-KHONG-VIEN', [(VQ, 'const le = 2, W = n + 2 * le;', 'const le = 0, W = n + 2 * le;', 1)], r'✗ C2 '),
]


def ban_sao(thay, goc_sha=None):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_hd1_')
  if goc_sha:
    import io, tarfile
    tar = subprocess.run(['git', 'archive', goc_sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
  else:
    shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
    shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  os.makedirs(os.path.join(tmp, 'client'), exist_ok=True)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_HD1.js'), '--goc', tmp], cwd=GOC, capture_output=True, text=True, timeout=300)
  return r.returncode, (r.stdout or '') + (r.stderr or '')


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp)
    if '--in-ra' in sys.argv: print(f'── {ten}: 12 dòng cuối ──\n' + '\n'.join(ra.strip().splitlines()[-12:]))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if ma == 2 or 'Bài thử sập' in ra:
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
    ma, ra = chay_bai(tmp)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    chi_c0 = all(l.startswith('✗ C0') for l in hong)   # thư viện QR chưa cài là lỗi đã biết, không phải lỗi của đột biến
    return m is not None and (m.group(2) == '0' or (chi_c0 and m.group(2) == '1')), (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: chạy bài thử HIỆN TẠI với server/ + client/src/ của commit `sha` (git archive, bản chép thật)."""
  tmp, _ = ban_sao([], sha)
  try:
    ma, ra = chay_bai(tmp)
    print('\n'.join(l for l in ra.strip().splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
    print(f'GỐC {sha}: thoát {ma}')
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
