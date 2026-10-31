#!/usr/bin/env python3
"""KH-QUAY-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-QUAY-2/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-QUAY-2/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/KH-SP-1/dot_bien.py: chép server/, cong_cu/, client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UI, UM = 'client/src/utils/inPhieu.js', 'client/src/utils/maApp.js'
QS, MD = 'client/src/components/MaAppSoMoi.jsx', 'client/src/components/MaDangNhapApp.jsx'
IP, PV = 'client/src/components/InvoicePrint.jsx', 'client/src/components/InvoicePreview.jsx'
IS, KH, IPH = 'client/src/pages/InvoiceSettings.jsx', 'client/src/pages/Customers.jsx', 'client/src/components/InPhieu.jsx'
QY, DB = 'server/routes/kh/quay.js', 'server/database.js'
BAI = {'q2': 'cong_cu/thu_KHQUAY2.js', 'p16': 'cong_cu/thu_P16.js', 'q1': 'cong_cu/thu_KHQUAY1.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: ô số mới ──
  ('BV-SO-MOI-GAN', 'q2', [(KH, '<MaAppSoMoi />', '', 1)], r'✗ A2 màn Khách hàng gắn'),
  ('BV-SO-MOI-THANH-PHAN', 'q2', [(QS, '<MaDangNhapApp key={sdt} sdt={sdt} tuLay />', '', 1)], r'✗ A2 (ô dùng lại|MaDangNhapApp \(nơi duy nhất)'),
  ('VS-SO-MOI-BO-CHAN', 'q2', [(QS, 'const s = chuanSdtQuay(go);', 'const s = go;', 1)], r'✗ A2 SĐT sai dạng bị chặn'),
  ('VS-SO-MOI-LUON-HIEN', 'q2', [(QS, '{sdt && <MaDangNhapApp', '{<MaDangNhapApp', 1)], r'✗ A2 MaDangNhapApp \(nơi duy nhất'),
  ('VS-SO-MOI-TAO-KHACH', 'q2', [(QS, "setSdt(s || '');", "fetch('/api/pos/customers', { method: 'POST' }); setSdt(s || '');", 1)], r'✗ A2 ô KHÔNG tự gọi máy chủ'),
  ('VS-SO-MOI-KHONG-BAO-LOI', 'q2', [(QS, "setLoi(s ? '' : 'SĐT không hợp lệ — nhập số bắt đầu bằng 0, đủ 10–11 số');", "setLoi('');", 1)], r'✗ A2 SĐT sai dạng → báo lỗi'),
  ('BV-SO-MOI-TU-LAY', 'q2', [(MD, "if (tuLay) layMa();", "", 1)], r'✗ A2 MaDangNhapApp có prop tuLay'),
  ('VS-CHUAN-SDT-9-SO', 'q2', [(UM, r'/^0\d{9,10}$/', r'/^0\d{8,10}$/', 1)], r'✗ A1 ranh giới dưới'),
  ('VS-CHUAN-SDT-12-SO', 'q2', [(UM, r'/^0\d{9,10}$/', r'/^0\d{9,11}$/', 1)], r'✗ A1 ranh giới trên: 12 số'),
  ('VS-CHUAN-SDT-84', 'q2', [(UM, "if (p.startsWith('84') && p.length >= 11) p = '0' + p.slice(2);", '', 1)], r'✗ A1 \+84 / 84 đầu'),
  ('VS-CHUAN-SDT-GIU-CHU', 'q2', [(UM, r"String(v ?? '').replace(/\D/g, '')", "String(v ?? '').replace(/\\s/g, '')", 1)], r'✗ A1 '),
  ('VS-CAP-MA-TAO-KHACH', 'q2', [(QY, "    if (!sdt) return bao(res, 'SDT_KHONG_HOP_LE');\n", "    if (!sdt) return bao(res, 'SDT_KHONG_HOP_LE');\n    await require('../../database').run(\"INSERT INTO pos_customers (phone, name, created_at) VALUES (?, 'x', 'x')\", [sdt]);\n", 1)], r'✗ A3 bảng khách KHÔNG thêm dòng'),
  # ── B: khổ hoá đơn ──
  ('BV-KHO-BILL-4-KHO', 'q2', [(UI, "export const KHO_BILL = ['58mm', '80mm'];", "export const KHO_BILL = ['58mm', '80mm', 'a5', 'a4'];", 1)], r'✗ B1 KHO_BILL'),
  ('VS-KHO-GIU-A5', 'q2', [(UI, 'chonKho(v, KHO_BILL, MAC_DINH_BO_IN.bill.kho)', "chonKho(v, [...KHO_BILL, 'a5'], MAC_DINH_BO_IN.bill.kho)", 1)], r"✗ B1 'a5' / 'a4' → '80mm'"),
  ('VS-KHO-MAC-DINH-58', 'q2', [(UI, "bill: { bat: true, ban: 1, kho: '80mm' },", "bill: { bat: true, ban: 1, kho: '58mm' },", 1)], r"✗ B1 (không có cài đặt|rỗng / undefined)"),
  ('VS-KHO-DOC-BO-IN-THO', 'q2', [(UI, 'khoHoaDon(settings?.invoice_default_size)', 'settings?.invoice_default_size', 1)], r"✗ B1 cài đặt cũ invoice_default_size"),
  ('VS-KHO-58-THANH-80', 'q2', [(UI, 'chonKho(v, KHO_BILL, MAC_DINH_BO_IN.bill.kho)', "(v === '58mm' ? MAC_DINH_BO_IN.bill.kho : chonKho(v, KHO_BILL, MAC_DINH_BO_IN.bill.kho))", 1)], r"✗ B1 khổ nhiệt giữ nguyên"),
  ('BV-IP-BANG-A5', 'q2', [(IP, "  '80mm': {", "  'a5': { width: '148mm', minWidth: '400px', maxWidth: '560px', name: 'A5', fontSize: '12px', padding: '16px', productColWidth: '50%' },\n  '80mm': {", 1)], r'✗ B2 InvoicePrint: bảng PAPER_SIZES'),
  ('BV-IP-KHONG-QUA-HAM', 'q2', [(IP, 'useState(khoHoaDon(initialPaperSize || boIn.bill.kho))', 'useState(initialPaperSize || boIn.bill.kho)', 1)], r'✗ B2 InvoicePrint: khổ khởi tạo'),
  ('BV-IP-NHANH-IN-A4', 'q2', [(IP, 'size: ${paper.width} auto; ', "size: ${paperSize === 'a4' ? 'A4' : paper.width + ' auto'}; ", 1)], r'✗ B2 InvoicePrint: hết nhánh in'),
  ('BV-IS-OPTION-A5', 'q2', [(IS, '<option value="80mm">80mm</option>', '<option value="80mm">80mm</option>\n            <option value="a5">A5</option>', 1)], r'✗ B2 InvoiceSettings "Khổ mặc định"'),
  ('VS-IS-KHONG-QUA-HAM', 'q2', [(IS, 'value={khoHoaDon(config.default_size)}', 'value={config.default_size}', 1)], r'✗ B2 InvoiceSettings: giá trị cũ'),
  ('BV-IS-MAC-DINH-A5', 'q2', [(IS, 'default_size: "80mm",', 'default_size: "a5",', 1)], r"✗ B2 InvoiceSettings: khổ mặc định cấu hình"),
  ('BV-IS-XEM-TRUOC-A4', 'q2', [(IS, '{KHO_BILL.map((size) => (', '{["58mm", "80mm", "a5", "a4"].map((size) => (', 1)], r'✗ B2 InvoiceSettings: nút xem trước'),
  ('BV-PV-CO-TO-A5', 'q2', [(PV, "  '80mm': { w: '80mm', chu: 11, qr: 84, bill: 40 },", "  '80mm': { w: '80mm', chu: 11, qr: 84, bill: 40 },\n  a5: { w: '148mm', chu: 13, qr: 110, bill: 52 },", 1)], r'✗ B2 InvoicePreview \(HoaDonTo CO_TO\)'),
  ('BV-PV-KIEU-A5', 'q2', [(PV, "      '80mm': {\n", "      'a5': { width: '148mm' },\n      '80mm': {\n", 1)], r'✗ B2 InvoicePreview: kiểu theo khổ'),
  ('BV-PV-MAC-DINH-A5', 'q2', [(PV, "size = '80mm', logo = ''", "size = 'a5', logo = ''", 1)], r'✗ B2 InvoicePreview: không còn khổ mặc định'),
  # ── C: K5 — bản vá quá tay sẽ bị bắt ──
  ('VS-QUA-TAY-KHO-PHIEU', 'q2', [(IPH, ", a5: 'A5', a4: 'A4' };", ' };', 1)], r'✗ C2 phiếu kho'),
  ('VS-QUA-TAY-KHO-PHA-CHE', 'q2', [(UI, "export const KHO_PHIEU = ['80mm', '58mm'];", "export const KHO_PHIEU = ['80mm'];", 1)], r'✗ C1 khổ phiếu pha chế'),
  ('VS-QUA-TAY-NUT-MA-CU', 'q2', [(KH, '<MaDangNhapApp key={selectedCustomer.phone} sdt={selectedCustomer.phone} />', '', 1)], r'✗ C3 nút'),
  ('VS-QUA-TAY-SEED-MAY-CHU', 'q2', [(DB, "['invoice_default_size', 'a5'],", "['invoice_default_size', '80mm'],", 1)], r'✗ C5 máy chủ KHÔNG đổi'),
  # ── bài cũ thu_P16 theo quyết định 31.10 ──
  ('BV-P16-MAC-DINH-A5', 'p16', [(UI, "bill: { bat: true, ban: 1, kho: '80mm' },", "bill: { bat: true, ban: 1, kho: 'a5' },", 1)], r'✗ C24 '),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_khquay2_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tmp, 'cong_cu'))
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'bài thử sập' in ra:
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
