#!/usr/bin/env python3
"""TIEN-KHOA-2 — đột biến cho MỖI vế chặn: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/TIEN-KHOA-2/dot_bien.py [tên...]             (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/TIEN-KHOA-2/dot_bien.py --liet-ke             (chỉ in danh sách)
    python3 viec/TIEN-KHOA-2/dot_bien.py --cay-goc <sha>       (bằng chứng ĐỎ như cổng A11: cả cây commit sha + MỘT bài thử hiện tại, lần lượt
                                                                 mọi cong_cu/thu_*.js đổi so với sha; --bai <file> chỉ một bài;
                                                                 --kem-ham-phu: chép kèm cong_cu/gia_lap/donCu.js)
    python3 viec/TIEN-KHOA-2/dot_bien.py --so-ca <sha>         (in "SỐ CA <bài>: <N>" của mọi bài đổi, chạy trên cây hiện tại)

Khuôn viec/BO-MAN-CU-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_TIENKHOA2.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2 / "Bài thử sập") hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_TIENKHOA2.js'
W, D, O, S = 'server/routes/wallets.js', 'server/routes/don-mo-rong.js', 'server/routes/orders.js', 'server/utils/doiSoat.js'
V, OJ, API = 'client/src/components/ViKhach.jsx', 'client/src/pages/Orders.jsx', 'client/src/utils/api.js'
KIEM_PIN = '    const pin = await kiemPinChuQuan(req.body?.pin);\n'
BAO_PIN = '    if (pin.loi) return res.status(pin.loi[0]).json({ code: pin.loi[1], error: pin.loi[2] });\n'
TRA_CHINH = '    res.json({ success: true, balance: kq.sau, adjusted: adjustAmount });\n'
CHAN_NO = '    if (payment_method === "transfer") {\n      return res.status(400).json({ error: "Thu nợ chuyển khoản phải qua QR'
GOI_NO = "await ordersApi.payDebt(selectedOrder.id, { payment_method: 'cash', amount: selectedOrder.debt_amount });"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A1: trừ tay /wallets/deduct ──
  ('BV-DEDUCT', [(W, '/**\n * POST /api/pos/wallets/adjust\n',
     "router.post('/deduct', authenticate, checkPermission('adjust_balance'), async (req, res) => {\n"
     "  const kq = await trongGiaoDich((tx) => ghiVi(tx, { phone: normalizePhone(req.body.phone), loai: 'purchase', soTien: -parseInt(req.body.amount),\n"
     "    nguoi: req.user.username, khongAm: true }));\n  res.json({ success: true, balance: kq.sau });\n});\n\n/**\n * POST /api/pos/wallets/adjust\n", 1)], r'✗ A1 chủ quán'),
  ('BV-API-DEDUCT', [(API, "  adjust: (data) => api.post('/wallets/adjust', data),\n",
     "  deduct: (data) => api.post('/wallets/deduct', data),\n  adjust: (data) => api.post('/wallets/adjust', data),\n", 1)], r'✗ A1b'),
  # ── A2: điều chỉnh ví cần PIN chủ quán ──
  ('BV-PIN-ADJUST', [(W, KIEM_PIN + BAO_PIN, '', 1)], r'✗ A2a '),
  ('VS-PIN-BO-LOI', [(W, BAO_PIN, '', 1)], r'✗ A2a '),
  ('VS-PIN-CHI-KHI-TRU', [(W, KIEM_PIN, '    const pin = adjustAmount < 0 ? await kiemPinChuQuan(req.body?.pin) : {};\n', 1)], r'✗ A2a '),
  ('VS-PIN-SAU-GHI', [(W, KIEM_PIN + BAO_PIN, '', 1), (W, TRA_CHINH, KIEM_PIN + BAO_PIN + TRA_CHINH, 1)], r'✗ A2a '),
  ('VS-PIN-TRUOC-KIEM-DU-LIEU', [(W, KIEM_PIN + BAO_PIN, '', 1), (W, '    const { phone, amount, customer_name, reason } = req.body;\n',
     '    const { phone, amount, customer_name, reason } = req.body;\n' + KIEM_PIN + BAO_PIN, 1)], r'✗ A2g'),
  ('VS-ADJUST-AM', [(W, 'khongAm: adjustAmount < 0 });', 'khongAm: false });', 1)], r'✗ A2e'),
  # ── A3: đổi cách trả ──
  ('BV-DOI-CK', [(D, "    if (sang === 'transfer') {\n", "    if (false) {\n", 1)], r'✗ A3a'),
  ('VS-DOI-CHAN-CA-HAI', [(D, "    if (sang === 'transfer') {\n", "    if (sang === 'transfer' || sang === 'cash') {\n", 1)], r'✗ A3b'),
  # ── A4: thu nợ chỉ tiền mặt ──
  ('BV-NO-CK', [(O, CHAN_NO, CHAN_NO.replace('if (payment_method === "transfer")', 'if (false)'), 1)], r'✗ A4a'),
  ('VS-NO-CK-CHI-KHI-CO-SO', [(O, CHAN_NO, CHAN_NO.replace('if (payment_method === "transfer")', 'if (payment_method === "transfer" && amount)'), 1)], r'✗ A4b'),
  ('VS-NO-CHAN-CA-TIEN-MAT', [(O, CHAN_NO, CHAN_NO.replace('if (payment_method === "transfer")', 'if (payment_method === "transfer" || payment_method === "cash")'), 1)],
   r'✗ A4f'),
  # ── Đối soát: phép DC ──
  ('BV-DS-DC', [(S, ", ['DC', phepSuaTay]]) {", ']) {', 1)], r'✗ A2j'),
  ('VS-DS-DC-CHI-VI', [(S, '  ...doi.map((r) => ({', '  ...[].map((r) => ({', 1)], r'✗ A3c'),
  ('VS-DS-DC-DO', [(S, "  return [...vi.map((r) => ({ ngay: r.created_at || null, canXem: true,", "  return [...vi.map((r) => ({ ngay: r.created_at || null, canXem: false,", 1)],
   r'✗ A2j'),
  # ── Màn hình ──
  ('BV-VIKHACH-PIN', [(V, 'reason: nhap.text, pin });', 'reason: nhap.text });', 1)], r'✗ A2i'),
  ('VS-VIKHACH-KHONG-MO', [(V, "<HoiPin mo={hoiPin && cua === 'chinh'}", '<HoiPin mo={false}', 1)], r'✗ A2i'),
  ('VS-VIKHACH-GUI-THANG', [(V, '    if (!nap) { setHoiPin(true); return; }\n', '', 1)], r'✗ A2i'),
  ('BV-ORDERS-FETCH', [(OJ, GOI_NO, "await fetch(`/api/pos/orders/${selectedOrder.id}/pay-debt`, { method: 'POST', body: JSON.stringify({ payment_method: 'cash' }) });", 1)],
   r'✗ A4e'),
  ('VS-ORDERS-NUT-CK', [(OJ, '/> Thu tiền mặt\n', "/> Thu tiền mặt <button onClick={() => setPaymentMethod('transfer')}>CK</button>\n", 1)], r'✗ A4e'),
]

def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_tienkhoa2_')
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
  tmp = tempfile.mkdtemp(prefix='dotbien_tienkhoa2_cay_')
  try:
    tar = subprocess.run(['git', 'archive', sha], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    shutil.copy(os.path.join(GOC, bai), os.path.join(tmp, bai))
    if '--kem-ham-phu' in sys.argv:
      # Lượt hành vi (soát vòng 1 lỗi 3): kèm hàm phụ donCu.js; ở cây gốc chưa có taoDonGoc thì donCu dùng `taoDon` của GỐC — chính là thân cũ
      # (cổng cờ đọc '0' → không chặn). Khoá đầu donCu (đường thẳng phải chặn thân này) → bài dùng donCu ĐỎ vì "đường thẳng KHÔNG chặn";
      # ca đổi hành vi đỏ đúng ca. (Trước khi có khoá, lượt này cho thấy ca F XANH trên gốc = donCu cho kết quả y đường cũ — bang_chung_do.txt.)
      # Bản vá chữ chỉ nằm trong thư mục tạm.
      s = open(os.path.join(GOC, 'cong_cu', 'gia_lap', 'donCu.js'), encoding='utf-8').read()
      neo = "const taoDonGoc = m.taoDonGoc;"
      if s.count(neo) != 1: sys.exit('donCu.js: neo taoDonGoc khớp %d lần' % s.count(neo))
      s = s.replace(neo, "const taoDonGoc = m.taoDonGoc || m.taoDon;")
      open(os.path.join(tmp, 'cong_cu', 'gia_lap', 'donCu.js'), 'w', encoding='utf-8').write(s)
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
