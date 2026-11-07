#!/usr/bin/env python3
"""KHACH-APP-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHACH-APP-1/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHACH-APP-1/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/KHACH-APP-1/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)
    python3 viec/KHACH-APP-1/dot_bien.py --help

Khuôn viec/KHACH-CK-1/dot_bien.py: chép server/, client/src/, cong_cu/, kiem_tra_truoc_khi_giao.js, HOP_DONG_API_KH.md ra thư mục tạm
(BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy
`node <tạm>/cong_cu/<bài>` (bài lấy gốc = thư mục cha của chính nó). BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt.
Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DK, KM, MK = 'server/utils/docKhach.js', 'server/utils/khachMoi.js', 'server/utils/maKhach.js'
C1, C2, RG = 'server/routes/customers.js', 'server/routes/customers-v2.js', 'server/routes/registrations.js'
CH, N20, N22 = 'server/nang_cap/chay.js', 'server/nang_cap/020_chep_khach_sx.js', 'server/nang_cap/022_chep_dang_ky_qr.js'
CHEP = ['server', 'client/src', 'cong_cu', 'kiem_tra_truoc_khi_giao.js', 'HOP_DONG_API_KH.md']
T = 'thu_KHACHAPP1.js'
GOI_SX = 'await require("../utils/sxApi").callSxApi("/api/pos/customers/export").catch(() => []);\n    '

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── A: một hàm đọc, không gọi SX ──
  ('BV-DOC-SX-DANH-SACH', [(C2, '    const customers = await docKhach();\n', '    ' + GOI_SX + 'const customers = await docKhach();\n', 1)], r'✗ A11 \(ds\)', T),
  ('BV-DOC-SX-TIM', [(C2, '    const ds = await docKhach({ dangKy: "tat_ca" });\n', '    ' + GOI_SX + 'const ds = await docKhach({ dangKy: "tat_ca" });\n', 1)], r'✗ A11 \(ds\)', T),
  ('BV-DOC-SX-HO-SO', [(C2, 'const motKhach = async (phone) => (await docKhach(',
                        'const motKhach = async (phone) => (await require("../utils/sxApi").callSxApi("/api/pos/customers/export").catch(() => 0), await docKhach(', 1)],
   r'✗ A11 \(ds\)', T),
  ('VS-DOC-CHI-ACTIVE', [(DK, "await query('SELECT * FROM pos_customers ORDER BY id')",
                          "await query(\"SELECT * FROM pos_customers WHERE sx_status = 'active' OR sx_status IS NULL ORDER BY id\")", 1)], r'✗ A14 ', T),
  ('VS-DOC-LO-BI-MAT', [(DK, 'ra.set(c.phone, { id: c.id, ...chung(c),', 'ra.set(c.phone, { ...c, id: c.id, ...chung(c),', 1)], r'✗ A12b ', T),
  ('VS-DOC-DANG-KY-DE-KHACH', [(DK, '    if (ra.has(r.phone)) continue;\n', '    if (ra.has(r.phone + "x")) continue;\n', 1)], r'✗ A6b ', T),
  ('VS-DOC-DIEM-HET-HAN', [(DK, 'WHERE expires_at IS NULL OR expires_at > ? GROUP BY customer_phone`, [getNow()])', 'GROUP BY customer_phone`, [])', 1)], r'✗ A1b ', T),
  ('VS-DOC-SO-DU-ME', [(DK, 'parent_balance: me ? vi[me]?.balance || 0 : 0', 'parent_balance: me ? vi[d.phone]?.balance || 0 : 0', 1)], r'✗ A13 ', T),
  ('BV-DOC-XUNG-HO', [(DK, ', xung_ho: c.xung_ho ?? null,', ',', 1)], r'✗ A12 ', T),
  # ── C: một hàm tạo ──
  ('BV-TAO-MAC-DINH', [(KM, "const LOAI_MAC_DINH = 'retail';", "const LOAI_MAC_DINH = 'subscription';", 1)], r'✗ C1 mặc định ', T),
  ('BV-TAO-QR-KHONG-KIEM', [(KM, 'k.xung_ho || null, k.address || null, await sinhQrKhongTrung(db.queryOne),',
                             "k.xung_ho || null, k.address || null, require('./helpers').generateQRCode(),", 1)], r'✗ C2b App', T),
  ('BV-TAO-TRUNG-NGOAI-CAU', [(KM, 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(phone) DO NOTHING',
                               'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 1)], r'✗ C4 ', T),
  ('VS-QUAY-TRUNG-SAI-MA', [(C1, "if (kq.trung) return res.status(400).json({ error: 'Số điện thoại đã tồn tại trong hệ thống', code: 'SDT_DA_CO' });\n\n    // Người nhận",
                             "if (kq.trung) return res.status(400).json({ error: 'Số điện thoại đã tồn tại trong hệ thống' });\n\n    // Người nhận", 1)], r'✗ C4b ', T),
  ('BV-QUAY-MAC-DINH-CU', [(C1, 'const kq = await taoKhach({ phone, name, notes, parent_phone, relationship, customer_type,',
                            "const kq = await taoKhach({ phone, name, notes, parent_phone, relationship, customer_type: customer_type || 'subscription',", 1)],
   r'✗ C1 so ', T),
  ('BV-APP-TAO-RIENG', [(MK, "      const t = await taoKhach({ phone: sdt, name: tenMoi, xung_ho: xhMoi, address: dcMoi, created_by: 'app_kh' }, tx);\n"
                             "      if (t.loi) throw new Error('không tạo được khách: ' + t.loi);\n",
                         "      await tx.run(`INSERT INTO pos_customers (phone, name, xung_ho, address, qr_code, customer_type, sync_status, created_by, created_at)\n"
                         "        VALUES (?, ?, ?, ?, ?, 'retail', 'retail_only', 'app_kh', ?) ON CONFLICT DO NOTHING`, [sdt, tenMoi, xhMoi, dcMoi, require('./helpers').generateQRCode(), now]);\n", 1)],
   r'✗ C2b App', T),
  ('BV-NHAN-RIENG-QR', [(C1, "    const kq = await taoKhach({ phone: phone || '', name, parent_phone: parent.phone, relationship,",
                         "    const kq = phone ? { khach: await (async () => { await run('INSERT INTO pos_customers (phone, name, parent_phone, created_at) VALUES (?, ?, ?, ?)', [phone, name, parent.phone, getNow()]); return queryOne('SELECT * FROM pos_customers WHERE phone = ?', [phone]); })() } : await taoKhach({ phone: '', name, parent_phone: parent.phone, relationship,", 1)],
   r'✗ K2c ', T),
  ('BV-DK-KHONG-TAO', [(RG, '      const t = await taoKhach({ phone: normalizedPhone,', '      const t = { khach: null } || await taoKhach({ phone: normalizedPhone,', 1)], r'✗ C7 ', T),
  ('VS-DK-TRUNG-VAN-GHI', [(RG, '      if (t.loi || t.trung) return { huy: true, ...t };', '      if (t.loi) return { huy: true, ...t };', 1)], r'✗ C7b ', T),
  # ── Q6 / Q7 (chủ quán 07.11): màn Đăng ký sửa / xoá; "Thêm khách" SĐT đã là khách ──
  ('VS-DK-TRUNG-400', [(RG, "if (kq.trung) return res.status(409).json(", "if (kq.trung) return res.status(400).json(", 1)], r'✗ C7b ', T),
  ('BV-DK-DUA-500', [(RG, "VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) ON CONFLICT(phone) DO NOTHING`,", "VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,", 1)], r'✗ C7c ', T),
  ('BV-DK-SUA-KHONG-KHACH', [(RG, "      await tx.run('UPDATE pos_customers SET name = ?, notes = ?, parent_phone = ?, relationship = ?, updated_at = ? WHERE phone = ?',",
                              "      if (0) await tx.run('UPDATE pos_customers SET name = ?, notes = ?, parent_phone = ?, relationship = ?, updated_at = ? WHERE phone = ?',", 1)],
   r'✗ R1 ', T),
  ('VS-DK-SUA-MOI-KHACH', [(RG, "updated_at = ? WHERE phone = ?',\n        [ten, ghiChu, sdtMe, validRelationship, getNow(), existing.phone]);",
                            "updated_at = ? WHERE phone <> ?',\n        [ten, ghiChu, sdtMe, validRelationship, getNow(), '0']);", 1)], r'✗ R1b ', T),
  ('BV-DK-XOA-KHONG-KHACH', [(RG, "      if (dk.status !== 'pending' || !dk.created_by", "      if (1 || dk.status !== 'pending' || !dk.created_by", 1)], r'✗ R2 ', T),
  ('VS-XOA-MOI-VAI', [(RG, " || !VAI_XOA_KHACH.includes(req.user.role)) return { xoaKhach: false };", ") return { xoaKhach: false };", 1)], r'✗ R3 ', T),
  ('VS-XOA-MOI-TRANG-THAI', [(RG, "      if (dk.status !== 'pending' || !dk.created_by", "      if (!dk.created_by", 1)], r'✗ R5c ', T),
  ('BV-XOA-KHONG-NHAT-KY', [(RG, "      await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at) VALUES ('xoa_khach',",
                             "      if (0) await tx.run(`INSERT INTO pos_sync_logs (type, record_count, details, status, created_by, created_at) VALUES ('xoa_khach',", 1)],
   r'✗ R2b ', T),
  ('VS-XOA-KHACH-CUA-NGUOI-KHAC', [(RG, 'DELETE FROM pos_customers WHERE phone = ? AND created_by = ? AND created_at >= ?',
                                    'DELETE FROM pos_customers WHERE phone = ? AND ? IS NOT NULL AND ? IS NOT NULL', 1)], r'✗ R5 ', T),
  ('VS-XOA-BO-VI', [(RG, "AND NOT EXISTS (SELECT 1 FROM pos_wallets WHERE phone = ? AND (COALESCE(balance, 0) <> 0 OR COALESCE(total_topup, 0) <> 0 OR COALESCE(total_spent, 0) <> 0))",
                     "AND NOT EXISTS (SELECT 1 FROM pos_wallets WHERE phone = ? AND 0)", 1)], r'✗ R4 khách có ví còn tiền ', T),
  ('BV-XOA-BO-DON', [(RG, "  ['pos_orders', 'customer_phone'],\n", "", 1)], r'✗ R4 khách có đơn ', T),
  ('BV-XOA-BO-GD-VI', [(RG, "  ['pos_balance_transactions', 'customer_phone'],\n", "", 1)], r'✗ R4 khách có giao dịch ví ', T),
  ('BV-XOA-BO-DIEM', [(RG, "  ['pos_point_transactions', 'customer_phone'],\n", "", 1)], r'✗ R4 khách có điểm ', T),
  ('BV-XOA-BO-GOI', [(RG, "  ['pos_customer_packages', 'customer_phone'],\n", "", 1)], r'✗ R4 khách có gói ', T),
  # ── vòng sửa 2 (soát vòng 2) ──
  ('VS-DK-DA-DANG-KY-CAU-CU', [(RG, "? { trung: true } : { daDangKy: true }", "? { daDangKy: true } : { daDangKy: true }", 1)], r'✗ C7d ', T),
  ('BV-XOA-LO-PIN', [(RG, "          khach: Object.fromEntries(COT_NHAT_KY_KHACH.map((c) => [c, kh[c] ?? null])) }),", "          khach: kh }),", 1)], r'✗ R2d ', T),
  ('BV-XOA-BO-VOUCHER', [(RG, "  ['pos_voucher_grants', 'customer_phone'],\n", "", 1)], r'✗ R4 khách có voucher ', T),
  ('BV-XOA-BO-HOAN-TIEN', [(RG, "  ['pos_refund_requests', 'customer_phone'],\n", "", 1)], r'✗ R4 khách có yêu cầu hoàn tiền ', T),
  ('BV-XOA-BO-PHIEN', [(RG, "  ['pos_phien_thanh_toan', 'phone'],\n", "", 1)], r'✗ R4 khách có phiên thanh toán ', T),
  ('BV-XOA-BO-DON-APP', [(RG, "  ['pos_don_app', 'phone'],\n", "", 1)], r'✗ R4 khách có đơn App ', T),
  ('BV-V2-CHEN-RIENG', [(C2, '  const t = await taoKhach({ phone, name: "Khách hàng", created_by: nguoi });\n  return t.loi || null;',
                         '  await run("INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)", [phone, "Khách hàng", getNow()]);\n  return null;', 1)],
   r'✗ C8 ', T),
  # ── B: khung HOÃN + bước 020 / 022 ──
  ('BV-HOAN', [(CH, '      if (duLieu && duLieu.hoan) {', '      if (false) {', 1)], r'✗ B3 ', T),
  ('VS-NEM-THANH-HOAN', [(CH, '      await tx.rollback();\n      return { hong: `${ten}: ${e.message}` };', '      await tx.rollback();\n      continue;', 1)], r'✗ B7 ', T),
  ('VS-HOAN-GOI-LAI-SX', [(CH, "      if ((await query('SELECT 1 FROM pos_nang_cap WHERE so = ?', [Number(so)])).length) continue;\n", '', 1)], r'✗ B2 ', T),
  ('VS-CHEP-GHI-DE', [(N20, "{ so.da_co++; continue; }",
                       "{ so.da_co++; await tx.run('UPDATE pos_customers SET name = ? WHERE phone = ?', [c.name, normalizePhone(c.phone)]); continue; }", 1)],
   r'✗ B1b ', T),
  ('BV-CHEP-SAO-LUU', [(N20, "  if (truoc > 0) await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_020_pos_customers AS SELECT * FROM pos_customers');\n", '', 1)], r'✗ B1d ', T),
  ('BV-CHEP-NHAT-KY', [(N20, "VALUES ('chep_khach_sx', ?, ?, 'success', 'nang_cap', ?)`, [so.them, JSON.stringify(ghi), getNow()]);",
                        "VALUES ('chep_khach_sx', ?, ?, 'success', 'nang_cap', ?)`, [so.them, JSON.stringify(so), getNow()]);", 1)], r'✗ B1e ', T),
  ('VS-CHEP-RONG-LA-XONG', [(N20, 'if (!Array.isArray(ds) || ds.length === 0)', 'if (!Array.isArray(ds))', 1)], r'✗ B3c ', T),
  ('VS-022-DOI-COT', [(N22, "UPDATE pos_customers SET qr_code = ? WHERE id = ? AND (qr_code IS NULL OR qr_code = '')",
                       "UPDATE pos_customers SET qr_code = ?, updated_at = '2026-11-07T00:00:00' WHERE id = ?", 1)], r'✗ B6 ', T),
  ('BV-022-DANG-KY', [(N22, "SELECT * FROM pos_registrations WHERE status = 'pending'", "SELECT * FROM pos_registrations WHERE 0 AND status = 'pending'", 1)], r'✗ B6b ', T),
  ('VS-022-CHEP-DA-XUAT', [(N22, "WHERE status = 'pending'\n    AND phone NOT IN", 'WHERE phone NOT IN', 1)], r'✗ B6b ', T),
  # ── vòng sửa 1 (soát độc lập 07.11): lỗ bài thử C3 (so định danh qua `??`) và thu_KHO1 B1c (tập miễn HOÃN sinh từ file) ──
  ('VS-APP-SAI-KHACH', [(MK, "    const kh = await tx.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [sdt]);\n    if (!kh)",
                         "    const kh = await tx.queryOne('SELECT id FROM pos_customers ORDER BY id LIMIT 1', []);\n    if (!kh)", 1)], r'✗ C3 ', T),
  ('VS-BUOC-KHAC-HOAN', [('server/nang_cap/019_so_hoa_don.js', 'module.exports.chay = async (tx, { themCot }) => {',
                          "module.exports.truoc = async () => ({ hoan: 'thử' });\nmodule.exports.chay = async (tx, { themCot }) => {", 1)],
   r'✗ B1c ', 'thu_KHO1.js'),
  ('BV-022-CAP-QR', [(N22, "WHERE qr_code IS NULL OR qr_code = '' ORDER BY id", "WHERE 0 ORDER BY id", 1)], r'✗ B6 ', T),
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
  tmp = tempfile.mkdtemp(prefix='dotbien_khachapp1_')
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
      dong = [l.strip() for l in ra.splitlines() if re.search(r'\d+ đạt · \d+ hỏng|TỔNG: \d+/\d+ ca đạt', l)]
      kq.append((bai, ma, dong[-1] if dong else ra.strip()[-160:]))
    return all(m == 0 for _, m, _ in kq), kq
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bang_chung(sha, bai_ds):
  """Bài HIỆN TẠI (cong_cu/ của cây làm việc) trên server/ + client/src/ của commit sha."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khachapp1_goc_')
  try:
    chep(sha, tmp, ['server', 'client/src'])
    chep(None, tmp, ['cong_cu', 'kiem_tra_truoc_khi_giao.js', 'HOP_DONG_API_KH.md'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} (bài HIỆN TẠI trên code {sha}):')
      print('\n'.join('  ' + l.strip() for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng|TỔNG: ', l) or 'SẬP' in l))
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
