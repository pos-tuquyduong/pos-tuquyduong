#!/usr/bin/env python3
"""KHACH-CK-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHACH-CK-1/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHACH-CK-1/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/KHACH-CK-1/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)
    python3 viec/KHACH-CK-1/dot_bien.py --bai-cu <sha> <bài...> (bản bài của commit sha chạy trên code HIỆN TẠI — bài cũ phải đỏ)
    python3 viec/KHACH-CK-1/dot_bien.py --help

Khuôn viec/UUDAI-1/dot_bien.py: chép server/, client/src/, cong_cu/, kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node <tạm>/cong_cu/<bài>`
(mọi bài lấy gốc = thư mục cha của chính nó → chạy trọn trên bản sao). BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt.
Bài sập (thoát 2) hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O, C1, C2 = 'server/routes/orders.js', 'server/routes/customers.js', 'server/routes/customers-v2.js'
N4 = 'server/nang_cap/004_bo_chiet_khau_rieng.js'
TI, BM, SA = 'client/src/pages/BanHang/tinh.js', 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/Sales.jsx'
CI, CU = 'client/src/components/CustomerInput.jsx', 'client/src/pages/Customers.jsx'
CHEP = ['server', 'client/src', 'cong_cu', 'kiem_tra_truoc_khi_giao.js']

LO2_MOI = '    if (!discountCodeId) {\n      finalDiscountType = null;\n      finalDiscountValue = 0;\n    }\n'
LO2_CU = ('    if (!discountCodeId) {\n      const khCK = phone\n        ? await queryOne("SELECT discount_type, discount_value FROM pos_customers WHERE phone = ?", [phone])\n        : null;\n'
          '      const mucCK = Number(khCK?.discount_value || 0);\n      if (mucCK > 0) {\n        finalDiscountType = khCK.discount_type || "percent";\n'
          '        finalDiscountValue = mucCK;\n      } else {\n        finalDiscountType = null;\n        finalDiscountValue = 0;\n      }\n    }\n')
CHAN = '    if (Number(discount_value) > 0) {\n'
SAO_LUU = "  await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_004_pos_customers AS SELECT * FROM pos_customers');\n"
DAT_LAI = "  const kq = await tx.run(`UPDATE pos_customers SET discount_value = 0, discount_type = 'percent' WHERE ${CO_MUC}`);\n"
CHON_KHACH = "    // KHACH-CK-1: khong con chiet khau rieng cua khach de dien vao.\n    setDiscountType('percent');\n    setDiscountValue(0);\n"
CHON_KHACH_CU = ("    if (selectedCustomer?.discount_value > 0) {\n      setDiscountType(selectedCustomer.discount_type || 'percent');\n"
                 "      setDiscountValue(selectedCustomer.discount_value);\n    } else {\n      setDiscountType('percent');\n      setDiscountValue(0);\n    }\n")

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── orders.js LO 2: máy chủ không áp chiết khấu hồ sơ ──
  ('BV-LO2', [(O, LO2_MOI, LO2_CU, 1)], r'✗ A1 ', 'thu_KHACHCK1.js'),
  ('BV-LO2-TINHTHU', [(O, LO2_MOI, LO2_CU, 1)], r'✗ A3 ', 'thu_KHACHCK1.js'),
  ('BV-LO2-FLASH', [(O, LO2_MOI, LO2_CU, 1)], r'✗ A7 ', 'thu_KHACHCK1.js'),
  ('BV-LO2-UUDAI1', [(O, LO2_MOI, LO2_CU, 1)], r'✗ G5b ', 'thu_UUDAI1.js'),
  ('BV-LO2-GOI1', [(O, LO2_MOI, LO2_CU, 1)], r'✗ B3c2 ', 'thu_GOI1.js'),
  ('BV-LO2-P20', [(O, LO2_MOI, LO2_CU, 1)], r'✗ hồ sơ cũ fixed 5\.000', 'thu_P20.js'),
  ('VS-LO2-TIN-TO-KHAI', [(O, LO2_MOI, '    if (!discountCodeId) {\n      finalDiscountType = discount_type;\n      finalDiscountValue = discount_value;\n    }\n', 1)],
   r'✗ F3b ', 'thu_KHACHCK1.js'),
  # ── hai cửa ghi: chặn mức > 0 ──
  ('BV-CHAN-V2', [(C2, CHAN, '    if (false) {\n', 1)], r'✗ B1 ', 'thu_KHACHCK1.js'),
  ('BV-CHAN-V2-INSERT', [(C2, CHAN, '    if (false) {\n', 1)], r'✗ B4 ', 'thu_KHACHCK1.js'),
  ('BV-CHAN-V2-P26C', [(C2, CHAN, '    if (false) {\n', 1)], r'✗ X1a ', 'thu_P26c.js'),
  ('VS-CHAN-V2-CHI-PERCENT', [(C2, CHAN, "    if (req.body.discount_type === 'percent' && Number(discount_value) > 0) {\n", 1)], r'✗ B2 ', 'thu_KHACHCK1.js'),
  ('VS-V2-GHI-MUC-THAN', [(C2, "SET discount_type = 'percent', discount_value = 0, discount_note = ?, updated_at = ?",
                          "SET discount_type = 'percent', discount_value = 0 + " + "?, discount_note = ?, updated_at = ?", 1),
                         (C2, '`, [discount_note || null, getNow(), phone]);', '`, [Number(discount_value) || 0, discount_note || null, getNow(), phone]);', 1)],
   r'✗ B7 ', 'thu_KHACHCK1.js'),
  ('BV-CHAN-V1', [(C1, CHAN, '    if (false) {\n', 1)], r'✗ B3 ', 'thu_KHACHCK1.js'),
  ('VS-CHAN-V1-CHI-FIXED', [(C1, CHAN, "    if (req.body.discount_type === 'fixed' && Number(discount_value) > 0) {\n", 1)], r'✗ B3 ', 'thu_KHACHCK1.js'),
  ('VS-V1-GHI-LOAI-THAN', [(C1, "        discount_type = 'percent',\n", "        discount_type = COALESCE(?, 'percent'),\n", 1),
                          (C1, '    `, [\n      discount_note || null,\n      getNow(),', '    `, [\n      req.body.discount_type || null,\n      discount_note || null,\n      getNow(),', 1)],
   r'✗ B7 ', 'thu_KHACHCK1.js'),
  # ── nâng cấp 004 ──
  ('BV-004-SAO-LUU', [(N4, SAO_LUU, '', 1)], r'✗ C1b ', 'thu_KHACHCK1.js'),
  ('VS-004-SAO-LUU-SAU-UPDATE', [(N4, SAO_LUU, '', 1), (N4, DAT_LAI, DAT_LAI + SAO_LUU, 1)], r'✗ C1b ', 'thu_KHACHCK1.js'),
  ('VS-004-CHI-PERCENT', [(N4, "WHERE ${CO_MUC}`);\n", "WHERE ${CO_MUC} AND discount_type = 'percent'`);\n", 1)], r'✗ C1a ', 'thu_KHACHCK1.js'),
  ('VS-004-CHI-DUONG', [(N4, "const CO_MUC = 'COALESCE(discount_value, 0) <> 0';", "const CO_MUC = 'discount_value > 0';", 1)], r'✗ C1a ', 'thu_KHACHCK1.js'),
  ('VS-004-LUON-SAO-LUU', [(N4, "  if (!(await tx.queryOne(`SELECT 1 AS co FROM pos_customers WHERE ${CO_MUC} LIMIT 1`))) return;\n", '', 1)], r'✗ C3 ', 'thu_KHACHCK1.js'),
  ('BV-004-BANG-TRONG', [(N4, "  if (!(await tx.query('PRAGMA table_info(pos_customers)')).some((c) => c.name === 'discount_value')) return;\n", '', 1)],
   r'✗ C6 ', 'thu_KHACHCK1.js'),
  ('VS-004-KHONG-LOG', [(N4, '${kq.changes} khách', '${kq.changes} dòng', 1)], r'✗ C4 ', 'thu_KHACHCK1.js'),
  # ── màn Bán hàng mới ──
  ('BV-TINH-KHACHGIAM', [(TI, '  const { flash, hang } = ctx;', '  const { flash, hang, khachGiam } = ctx;', 1),
                        (TI, '  const tong = Math.max(0, tamTinh - giamFlash - giamHang);',
                         '  const tong = Math.max(0, tamTinh - giamFlash - giamHang - (khachGiam ? (tamTinh * khachGiam.gia_tri) / 100 : 0));', 1)],
   r'✗ D2 ', 'thu_KHACHCK1.js'),
  ('BV-TINH-KHACHGIAM-BH1', [(TI, '  const { flash, hang } = ctx;', '  const { flash, hang, khachGiam } = ctx;', 1),
                            (TI, '  const tong = Math.max(0, tamTinh - giamFlash - giamHang);',
                             '  const tong = Math.max(0, tamTinh - giamFlash - giamHang - (khachGiam ? (tamTinh * khachGiam.gia_tri) / 100 : 0));', 1)],
   r'✗ D13 ', 'thu_BH1.js'),
  ('BV-DUNG-DON-GUI-MUC', [(TI, '    discount_type: null,\n    discount_value: 0,\n',
                           "    discount_type: so(khach?.discount_value) > 0 ? (khach.discount_type || 'percent') : null,\n    discount_value: so(khach?.discount_value),\n", 1)],
   r'✗ I8 ', 'thu_BH1.js'),
  ('BV-CHAN-BANHANGMOI', [(BM, 'coSo={coSo}', 'coSo={coSo && !(khach?.discount_value > 0)}', 1)], r'✗ D1b ', 'thu_KHACHCK1.js'),
  ('BV-CHAN-BANHANGMOI-BH2', [(BM, 'coSo={coSo}', 'coSo={coSo && !(khach?.discount_value > 0)}', 1)], r'✗ S19 ', 'thu_BH2.js'),
  ('BV-TINH-COCHIETKHAURIENG', [(TI, '// ── Chia tiền: tài khoản khách', 'export const coChietKhauRieng = (khach) => so(khach?.discount_value) > 0;\n\n// ── Chia tiền: tài khoản khách', 1)],
   r'✗ D18 ', 'thu_BH2.js'),
  # ── màn cũ, ô chọn khách, màn Khách hàng ──
  ('BV-SALES-CHON-KHACH', [(SA, CHON_KHACH, CHON_KHACH_CU, 1)], r'✗ D1c ', 'thu_KHACHCK1.js'),
  ('BV-CUSTOMERINPUT-HUY-HIEU', [(CI, "            {customerData.source === 'sx' && (",
                                 "            {customerData.discount_value > 0 && <span>🏷️ CK: {customerData.discount_value}</span>}\n            {customerData.source === 'sx' && (", 1)],
   r'✗ D1d ', 'thu_KHACHCK1.js'),
  ('BV-CUSTOMERS-LOC', [(CU, "              { key: 'has_balance', label: '💰 Có số dư' }",
                        "              { key: 'has_balance', label: '💰 Có số dư' },\n              { key: 'has_discount', label: '🏷️ Có CK' }", 1)], r'✗ D1e ', 'thu_KHACHCK1.js'),
  ('VS-NHAN-GHI-CHU', [(CU, '💬 Ghi chú khách (in trên hoá đơn)', '💬 Lý do chiết khấu', 1)], r'✗ E1b ', 'thu_KHACHCK1.js'),
  ('VS-CUSTOMERS-GHI-CHU-KHI-CO-CK', [(CU, '{c.discount_note && (', '{c.discount_note && c.discount_value > 0 && (', 1)],
   r'✗ E1c ', 'thu_KHACHCK1.js'),
  ('VS-CUSTOMERS-MAT-GHI-CHU', [(CU, '        discount_note: detailForm.discount_note\n      });', '        ghi_chu: detailForm.discount_note\n      });', 1)],
   r'✗ E1b ', 'thu_KHACHCK1.js'),
]


def lam_cay(tmp):
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))


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
  tmp = tempfile.mkdtemp(prefix='dotbien_khachck1_')
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


def bang_chung(sha, bai_ds, bai_cu):
  """bai_cu False: bài hiện tại trên code của sha. True: bài của sha trên code hiện tại."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khachck1_goc_')
  try:
    ma_nguon = [p for p in CHEP if p != 'cong_cu']
    chep(None if bai_cu else sha, tmp, ma_nguon)
    chep(sha if bai_cu else None, tmp, ['cong_cu'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} ({"bản bài " + sha + " trên code HIỆN TẠI" if bai_cu else "bài HIỆN TẠI trên code " + sha}):')
      print('\n'.join('  ' + l.strip() for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng', l) or 'SẬP' in l))
      print(f'  thoát {ma}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  for co in ('--goc', '--bai-cu'):
    if co in sys.argv:
      i = sys.argv.index(co)
      bang_chung(sys.argv[i + 1], sys.argv[i + 2:], co == '--bai-cu'); sys.exit(0)
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
