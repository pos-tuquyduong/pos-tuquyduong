#!/usr/bin/env python3
"""GIO-VN-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIO-VN-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/GIO-VN-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/GIO-VN-1/dot_bien.py --help

Khuôn viec/MANKHACH-1/dot_bien.py: chép server/, cong_cu/thu_GIOVN1.js, cong_cu/gia_lap/ (doiSoat.js nạp bat_bien.js), HOP_DONG_API_KH.md,
client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp
là HỎNG, K3), chạy bài thử TRONG bản sao. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC.
Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
B = 'server/utils/chuanHoaGio.js'   # quy tắc bước 012 (bước chỉ gọi lại)
BAI = 'cong_cu/thu_GIOVN1.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B: bước nâng cấp 012 ──
  ('BV-012', [(B, '  const ketQua = [];\n  const bangs', '  const ketQua = [];\n  return ketQua;\n  const bangs', 1)], r'✗ B1 '),
  ('VS-012-VN-CUNG-CONG-7', [(B, 'loai === UTC ? CONG7(c) :', 'loai !== LAN ? CONG7(c) :', 1)], r'✗ B1 '),
  ('VS-012-COT-LAN-CUNG-DOI', [(B, "      if (loai === LAN) { ketQua.push({ bang, cot: cTen, loai, doi: 0, deNguyen: n }); continue; }\n", '', 1)], r'✗ B1 '),
  ('VS-012-Z-THIEU-MAU-MILI-GIAY', [(B, "const MAU_Z = [`'${NGAY}T${GIO}Z'`, `'${NGAY}T${GIO}.${SO}${SO}${SO}Z'`];", "const MAU_Z = [`'${NGAY}T${GIO}Z'`];", 1)], r'✗ B1 '),
  ('BV-012-SAO-LUU', [(B, "      if (saoLuu && !daLuu) { await tx.run(`CREATE TABLE IF NOT EXISTS ${ten('_sao_luu_012_' + bang)} AS SELECT * FROM ${ten(bang)}`); daLuu = true; }\n", '', 1)], r'✗ B2 '),
  # ── vòng 2: mỗi mục bảng phân loại (người soát dựng R12–R17 sống) ──
  ('BV-012-DON', [(B, '  pos_orders: { created_at: UTC },\n', '', 1)], r'✗ B1c '),
  ('VS-012-DON-KIEU-VN', [(B, '  pos_orders: { created_at: UTC },', '  pos_orders: { created_at: VN },', 1)], r'✗ B1c '),
  ('BV-012-VI', [(B, '  pos_wallets: { created_at: UTC, updated_at: UTC },\n', '', 1)], r'✗ B1c '),
  ('BV-012-MON', [(B, '  pos_products: { created_at: UTC, updated_at: UTC, ton_luc: VN },', '  pos_products: { ton_luc: VN },', 1)], r'✗ B1c '),
  ('BV-012-MA-GIAM', [(B, '  pos_discount_codes: { valid_to: VN },\n', '', 1)], r'✗ B1c '),
  ('BV-012-TON-CHO', [(B, '  pos_stock_pending: { resolved_at: UTC },\n', '', 1)], r'✗ B1c '),
  ('BV-012-NHOM-MON', [(B, '  pos_product_group_members: { created_at: UTC },\n', '', 1)], r'✗ B1c '),
  ('VS-012-COT-THUA', [(B, '  pos_settings: { updated_at: LAN },', '  pos_settings: { updated_at: LAN },\n  pos_point_transactions: { created_at: UTC },', 1)], r'✗ B1c '),
  ('BV-012-SO-VI', [(B, '  pos_balance_transactions: { created_at: UTC },\n', '', 1)], r'✗ B1 '),
  ('BV-012-HAN-THE', [(B, '  pos_membership_purchases: { expires_at: VN },\n', '', 1)], r'✗ B1 '),
  ('BV-KHOI-PHUC', [('server/utils/khoiPhuc.js', '    if (banCu) await chuanHoaGio(tx, { saoLuu: false });', '', 1)], r'✗ B6 '),
  ('BV-012-BUOC-RONG', [('server/nang_cap/012_gio_viet_nam.js', 'module.exports.chay = (tx) => chuanHoaGio(tx);', 'module.exports.chay = async () => [];', 1)], r'✗ B1 '),
  ('VS-KHOI-PHUC-BO-QUA-BAN-CU', [('server/routes/backup.js', "    const ngaySao = wb.Sheets._Metadata ? String(docTrang(wb.Sheets._Metadata)[0]?.backup_date ?? '') : '';", '    const ngaySao = getNow();', 1)], r'✗ B6 '),
  ('VS-SAO-LUU-NGAY-DAU-CACH', [('server/routes/backup.js', '[{ backup_date: getNow(), system:', "[{ backup_date: getNow().replace('T', ' '), system:", 1)], r'✗ B6b '),
  ('VS-KHOI-PHUC-CO-SAO-LUU', [('server/utils/khoiPhuc.js', '    if (banCu) await chuanHoaGio(tx, { saoLuu: false });', '    if (banCu) await chuanHoaGio(tx);', 1)], r'✗ B6c '),
  ('BV-SYNC-DA-XUAT', [('server/routes/sync.js', "      AND exported_at < strftime('%Y-%m-%dT%H:%M:%S', ?, '-2 day')\n    `, [getNow()]);", "      AND datetime(exported_at) < datetime('now', '-2 day')\n    `);", 1)], r'✗ C11 '),
  # ── vòng sửa 4 (lần soát cuối: N17 / R5 / R8 / N15 / N2 sống) ──
  ('BV-DOSONO-DAU-CACH', [('server/utils/doSoNo.js', '          [getNow(), d.id],', "          [getNow().replace(/T/, ' '), d.id],", 1)], r'✗ A2i '),
  ('BV-KHACH-SX-CACHE', [('server/routes/customers-v2.js', "        VALUES (?, ?, ?, ?, 'active', ?, ?)\n        ON CONFLICT(phone) DO UPDATE SET", "        VALUES (?, ?, ?, ?, 'active', datetime(?, '+0 hours'), ?)\n        ON CONFLICT(phone) DO UPDATE SET", 1)], r'✗ A2j '),
  ('BV-KHACH-SX-CAP-NHAT', [('server/routes/customers-v2.js', '          updated_at = excluded.updated_at', '          updated_at = CURRENT_TIMESTAMP', 1)], r'✗ A2j '),
  ('VS-012-MAU-THIEU-GIAY', [(B, "const MAU_CACH = `'${NGAY} ${GIO}'`;", "const MAU_CACH = `'${NGAY} ${SO}${SO}:${SO}${SO}*'`;", 1)], r'✗ B1d '),
  ('VS-012-MAU-NOI-HET', [(B, "const MAU_CACH = `'${NGAY} ${GIO}'`;", "const MAU_CACH = `'${NGAY} *'`;", 1)], r'✗ B1d '),
  ('VS-KHOI-PHUC-MOI-FILE', [('server/routes/backup.js', "{ banCu: !/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d$/.test(ngaySao) }", '{ banCu: true }', 1)], r'✗ B6b '),
  # ── A: chỗ ghi ──
  ('BV-DAMAGES', [('server/routes/damages.js', "processed_by, processed_by_name, created_at\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)", "processed_by, processed_by_name, created_at\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'))", 1), ('server/routes/damages.js', 'req.user.id, req.user.display_name || req.user.username, getNow()\n', 'req.user.id, req.user.display_name || req.user.username\n', 1)], r'✗ A2d '),
  ('BV-SETTINGS', [('server/routes/settings.js', '    const timestamp = getNow();', '    const timestamp = new Date().toISOString();', 3)], r'✗ A2a '),
  ('BV-PACKAGES', [('server/routes/packages.js', '    const now = getNow();', '    const now = new Date().toISOString();', 2)], r'✗ A2b '),
  ('BV-IN-HOA-DON', [('server/routes/settings.js', '      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', "      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(?, '+0 hours'))", 1)], r'✗ A2c '),
  ('BV-GIEO-CHU', [('server/database.js', "      INSERT INTO pos_users (username, password, display_name, role, is_active, created_at)\n      VALUES (?, ?, ?, ?, ?, ?)\n    `, ['admin', hashedPassword, 'Owner', 'owner', 1, getNow()]);",
                    "      INSERT INTO pos_users (username, password, display_name, role, is_active)\n      VALUES (?, ?, ?, ?, ?)\n    `, ['admin', hashedPassword, 'Owner', 'owner', 1]);", 1)], r'✗ A1 '),   # bước 012 chạy lúc khởi tạo chữa luôn dòng gieo → chỉ phép quét bắt
  ('BV-NHOM-MON', [('server/routes/product-groups.js', "(group_id, sx_product_type, sx_product_id, created_at) VALUES (?, ?, ?, ?)',\n        [group.id, m.sx_product_type, m.sx_product_id, getNow()]",
                    "(group_id, sx_product_type, sx_product_id) VALUES (?, ?, ?)',\n        [group.id, m.sx_product_type, m.sx_product_id]", 1)], r'✗ A2f '),
  ('BV-TON-LUC', [('server/routes/products.js', '        const nowVn = getNow();', "        const nowVn = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');", 1)], r'✗ A1 '),
  ('BV-NGAY-MAN-QUAY', [('client/src/utils/ngayVN.js', "  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });", '  return d.toISOString().slice(0, 10);', 1)], r'✗ A3 '),
  ('BV-QUET-M5', [(BAI, "    for (const m of s.matchAll(/INSERT\\s+(?:OR\\s+\\w+\\s+)?INTO\\s+(\\w+)\\s*\\(([^)]*)\\)/gi)) {",
                   "    for (const m of [].values()) {", 1)], r'✗ D5 '),
  # ── C: so giờ ──
  ('VS-THE-DAU-CACH', [('server/routes/orders.js', '        const expiresAt = expiresDate.toISOString().slice(0, 19);', "        const expiresAt = expiresDate.toISOString().slice(0, 19).replace('T', ' ');", 1)], r'✗ C5a '),
  ('BV-THE-THEO-MUI-GIO-MAY', [('server/utils/helpers.js', "  const targetMonth = d.getUTCMonth() + months;\n  const lastDayOfTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();\n  d.setUTCDate(Math.min(d.getUTCDate(), lastDayOfTargetMonth));\n  d.setUTCMonth(targetMonth);",
                                "  const targetMonth = d.getMonth() + months;\n  const lastDayOfTargetMonth = new Date(d.getFullYear(), targetMonth + 1, 0).getDate();\n  d.setDate(Math.min(d.getDate(), lastDayOfTargetMonth));\n  d.setMonth(targetMonth);", 1)], r'✗ C5b '),
  ('VS-DEN-BU-HAI-LAN', [('server/utils/doiSoat.js', "CASE WHEN created_at LIKE '%T%' THEN created_at ELSE DATETIME(created_at, '+7 hours') END", "DATETIME(created_at, '+7 hours')", 1)], r'✗ C6 '),
  ('BV-HOM-NAY', [('server/routes/orders.js', "      statsSql += ` AND DATE(created_at) = ?`;   // GIO-VN-1: hôm nay theo giờ VN (máy chủ chạy UTC)\n      statsParams.push(getToday());",
                   "      statsSql += ` AND DATE(created_at) = DATE('now', 'localtime')`;", 1)], r'✗ C7a '),
  ('BV-NAM-HOA-DON', [('server/routes/settings.js', '    const currentYear = Number(getToday().slice(0, 4));   // GIO-VN-1: năm theo giờ VN', '    const currentYear = new Date().getFullYear();', 2)], r'✗ C7b '),
  ('BV-SYNC', [('server/routes/sync.js', "      AND created_at < strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 day')\n    `, [getNow()]);",
                "      AND datetime(created_at) < datetime('now', '-1 day')\n    `);", 1)], r'✗ C11 '),
  # ── C hồi quy: đưa lại đúng cách so giờ UTC cũ (code chưa đổi — chứng minh ca có sức bắt, K3) ──
  ('BV-HAN-MA-THEO-UTC', [('server/utils/diemKhach.js', '    [phone, getNow().slice(0, 10)],', '    [phone, new Date().toISOString().slice(0, 10)],', 1)], r'✗ C2 '),
  ('BV-HAN-MA-BILL-THEO-UTC', [('server/routes/signup-codes.js', "    const bayGio = new Date(getNow().replace(' ', 'T') + 'Z').getTime();", '    const bayGio = Date.now();', 1)], r'✗ C3 '),
  ('BV-HAN-GOI-THEO-UTC', [('server/utils/goiKhach.js', 'bayGio = new Date(getNow()).getTime()) {', 'bayGio = Date.now()) {', 1)], r'✗ C4 '),
  ('BV-PHIEN-QR-THEO-UTC', [('server/utils/giuCho.js', "p.het_han <= getNow() ? 'het_han'", "p.het_han <= new Date().toISOString().slice(0, 19) ? 'het_han'", 1)], r'✗ C10 '),
  # ── E: App KH ──
  ('BV-HOP-DONG', [('HOP_DONG_API_KH.md', '  hoạt động, từ v2), không lấy đồng hồ điện thoại.\n',
                    '  hoạt động, từ v2), không lấy đồng hồ điện thoại. Lỗi đã biết: một số giờ CŨ còn lưu theo giờ quốc tế.\n', 1)], r'✗ E2 '),
  ('BV-012-KHACH', [(B, '  pos_customers: { created_at: UTC, updated_at: UTC },\n', '', 1)], r'✗ E1 '),
]


def ban_sao(thay):
  """Chép phần cần của kho ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_giovn1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  for f in (BAI, 'HOP_DONG_API_KH.md'):
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tmp, f))
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


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(tmp, BAI)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'Bài thử sập' in ra:
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
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-160:])
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
