#!/usr/bin/env python3
"""KH-NAP-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-NAP-1/dot_bien.py [tên...]                 (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-NAP-1/dot_bien.py --liet-ke                 (chỉ in danh sách)
    python3 viec/KH-NAP-1/dot_bien.py --goc <sha> [--bai <file>] (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha;
                                                                  mặc định bài cong_cu/thu_KHNAP1.js — bài cũ sửa (G2) dùng --bai)
    python3 viec/KH-NAP-1/dot_bien.py --cay-goc <sha> --bai <file> (bài không có --may-chu: cả cây gốc + cong_cu/ và hợp đồng hiện tại)

Khuôn viec/KH-THE-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_KHNAP1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2) hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_KHNAP1.js'
O, G, V = 'server/routes/orders.js', 'server/utils/giuCho.js', 'server/utils/viKhach.js'
D, TT, L = 'server/utils/donApp.js', 'server/routes/thanh-toan.js', 'server/utils/lichSuVi.js'
GN, TI, BH, DA = 'server/routes/goi-nap.js', 'client/src/pages/BanHang/tinh.js', 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/DonApp.jsx'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B: chỉ trả tiền thật (một vị từ, hai chỗ) ──
  ('BV-the-quay', [(O, 'if (tienThat && (Number(balance_amount) > 0', 'if (false && (Number(balance_amount) > 0', 1)], r'✗ B2 quầy'),
  ('BV-the-giu', [(G, 'if (tienThat && (b.tru_tai_khoan', 'if (false && (b.tru_tai_khoan', 1)], r'✗ B2 phiên PIN'),
  ('VS-the-chi-balance', [(O, '(Number(balance_amount) > 0 || Number(parent_balance_amount) > 0 || payment_method === "balance")) {\n      return res.status(400).json(tienThat);',
                           '(Number(balance_amount) > 0)) {\n      return res.status(400).json(tienThat);', 1)], r'✗ B2 quầy'),
  ('VS-the-chi-payment', [(O, '(Number(balance_amount) > 0 || Number(parent_balance_amount) > 0 || payment_method === "balance")) {\n      return res.status(400).json(tienThat);',
                           '(payment_method === "balance")) {\n      return res.status(400).json(tienThat);', 1)], r'✗ B2 quầy'),
  ('VS-tien-that-chi-nap', [(V, '  if (don.membership_buy) return', '  if (false) return', 1)], r'✗ B2 quầy'),
  ('VS-the-sau-pin', [(O, '    // KH-NAP-1: đơn có gói nạp / thẻ hạng không trừ số dư', '    if (!phien && payment_method === "balance" && (await queryOne("SELECT value FROM pos_settings WHERE key = \'thanh_toan_payos_bat_buoc\'"))?.value === "1") return res.status(400).json({ code: "VI_PHAI_QUA_PIN" });\n    // KH-NAP-1: đơn có gói nạp / thẻ hạng không trừ số dư', 1)], r'✗ B2 cờ'),
  # ── A: dòng nạp trong đơn App ──
  ('BV-nap-docgio', [(D, "      dong.push({ loai: 'nap', ma_goi: m.ma_goi });\n      continue;", '      return sai;', 1)], r'✗ A1 báo giá giỏ chỉ nạp'),
  ('VS-nap-so-luong', [(D, "!soDuong(m.ma_goi) || (m.so_luong !== undefined && m.so_luong !== 1)) return sai;", "!soDuong(m.ma_goi)) return sai;", 1)], r'✗ A1 so_luong 2'),
  ('VS-nap-nhieu', [(D, 'if (nap.length > 1)', 'if (nap.length > 2)', 1)], r'✗ A2 hai dòng nạp'),
  ('BV-nap-giu-ma', [(D, "'NAP_KHONG_GOP', 'GOI_NAP_KHONG_CO', 'NAP_CHI_TIEN_MAT_QR', 'THE_KHONG_TRA_VI'];", '];', 1)], r'✗ A2 nạp \+ món'),
  ('VS-nap-gio-mon', [(D, "mon: dong.filter((d) => !d.loai), the:", "mon: dong.filter((d) => d.loai !== 'the'), the:", 1)], r'✗ A1 báo giá giỏ chỉ nạp'),
  ('VS-nap-ghep', [(D, "g.loai === 'nap' ? { g, it: napCt }", "g.loai === 'nap' ? { g, it: theCt }", 1)], r'✗ A1 báo giá giỏ chỉ nạp'),
  ('VS-nap-ma-dung', [(D, 'maDung = gio.nap ? null : gio.maGiam', 'maDung = gio.maGiam', 1)], r'✗ A2 đặt đơn nạp kèm mã'),
  ('VS-tinh-thu-cung', [(O, '(!phien?.tinhThu && (discount_code', '(true && (discount_code', 1)], r'✗ A2 nạp \+ ma_giam'),
  ('BV-bam-nap', [(D, "    : m?.loai === 'nap' ? ['nap', m.ma_goi ?? null, m.so_luong ?? 1]   // KH-NAP-1: dòng nạp băm riêng một dạng\n      :", '    :', 1)], r'✗ A1 khoá gửi'),
  ('BV-than-ten-nap', [(D, "ten: tenDongNap(goiNap), ghi_chu: null }", "ten: 'Nạp tiền', ghi_chu: null }", 1)], r'✗ A8 dòng nạp'),
  ('VS-ten-quay-rieng', [(O, 'product_name: tenDongNap(goiNap),', 'product_name: `Nạp ${goiNap.ten}`,', 1)], r'✗ A8 dòng nạp'),
  ('BV-chi-tiet-nap', [(D, " : laDongNap(d.product_id) ? { loai: 'nap' } : {}) }))", " : {}) }))", 1)], r'✗ A8 dòng nạp'),
  ('BV-quay-co-nap', [(D, "co_nap: dong.find((d) => d.loai === 'nap')?.ten ?? null,", 'co_nap: null,', 1)], r'✗ E1 màn Đơn App'),
  ('VS-quay-mon', [(D, "    mon: dong.filter((d) => !d.loai).map(", "    mon: dong.filter((d) => d.loai !== 'the').map(", 1)], r'✗ E1 màn Đơn App'),
  # ── A6: tiền về muộn ──
  ('BV-muon', [(TT, 'const muonChot = laApp &&', 'const muonChot = false &&', 1)], r'✗ A6 nạp về muộn'),
  ('VS-muon-moi-don', [(TT, "return !d.items?.length && !d.package_buy &&", "return true || !d.items?.length && !d.package_buy &&", 1)], r'✗ A6 / K5 ĐỒ UỐNG'),
  ('VS-muon-lech', [(TT, ' && t.soTien === p.con_lai && chiTheNap(p)', ' && chiTheNap(p)', 1)], r'✗ A6 tiền về muộn LỆCH'),
  ('BV-muon-cong', [(TT, ' && !(await congKiaDaBao({ query }, t))', '', 1)], r'✗ A6 cổng kia'),
  ('BV-muon-ly-do', [(TT, "    await run(\"UPDATE pos_phien_thanh_toan SET ly_do = ? WHERE id = ? AND trang_thai IN ('cho', 'huy')\",", "    if (0) await run(\"\",", 1)], r'✗ A6 gói nạp đã tắt'),
  ('VS-muon-p-cu', [(TT, '  const moi = laApp ? await docPhien(p.id) : null;', '  if (muonChot) return vaoVi(p);\n  const moi = laApp ? await docPhien(p.id) : null;', 1)], r'✗ A6 gói nạp đã tắt'),
  ('BV-muon-chot-giu', [(G, 'const muon = them.muon === true;', "const muon = nguon === 'tay' && them.muon === true;", 1)], r'✗ A6 nạp về muộn'),
  ('BV-muon-ly-do-khach', [(D, "  const muon = r.p_ly_do ? `Tiền về sau khi đơn đã huỷ / hết hạn, không tạo được đơn ${lyDoNgan(r.p_ly_do)}` :", "  const muon = false ? '' :", 1)], r'✗ A6 gói nạp đã tắt'),
  # ── vòng sửa 1 (soát độc lập) — đưa ĐÚNG lỗi cũ trở lại ──
  ('BV-muon-khoa', [(TT, "\n    && !(await queryOne('SELECT 1 AS co FROM pos_payos_su_kien WHERE khoa = ?', [t.khoa]));", ';', 1)], r'✗ A6 gói bật lại'),
  ('BV-muon-dua', [(TT, "      if (muonChot && r.changes !== 1) throw new Error", "      if (false) throw new Error", 1)], r'✗ A6 hai bản CÙNG khoá đua'),
  ('VS-vi-don-xoa', [(L, 'const traHo = t.don_phone != null && t.don_phone !== t.customer_phone;', 'const traHo = t.don_phone !== t.customer_phone;', 1)], r'✗ D4 đơn của chính khách đã xoá'),
  ('BV-goi-tran', [(GN.replace('goi-nap.js', 'kh/index.js'), "    if (!giuLuotMenu(req.ip || '')) return bao(res, 'QUA_NHIEU_LAN');\n    res.json({ success: true, data: (await dsGoiBat())",
                    "    res.json({ success: true, data: (await dsGoiBat())", 1)], r'✗ C1 /goi-nap dùng CHUNG'),
  ('VS-vi-trang', [(L, 'LIMIT ? OFFSET ?`, [phone, ...LOAI_TINH_VAO_VI, MOI_TRANG + 1,', 'LIMIT ? OFFSET ?`, [phone, ...LOAI_TINH_VAO_VI, MOI_TRANG,', 1)], r'✗ D1 21 dòng'),
  ('VS-vi-thu-tu', [(L, 'ORDER BY t.created_at DESC, t.id DESC', 'ORDER BY t.created_at ASC, t.id ASC', 1)], r'✗ D1 '),
  # ── C, D: /goi-nap, /vi ──
  ('VS-goi-tat', [(GN, 'FROM pos_goi_nap WHERE is_active = 1 ORDER BY thu_tu, khach_tra, id`);', 'FROM pos_goi_nap ORDER BY thu_tu, khach_tra, id`);', 1)], r'✗ C1 GET /goi-nap'),
  ('VS-goi-truong', [(GN.replace('goi-nap.js', 'kh/index.js'), 'vao: g.vao_tk }))', 'vao: g.vao_tk, bat: g.is_active }))', 1)], r'✗ C1 GET /goi-nap'),
  ('VS-vi-loai', [(L, "AND t.type IN (${LOAI_TINH_VAO_VI.map(() => '?').join(', ')})\n", "AND (t.type = 'debt_payment' OR t.type IN (${LOAI_TINH_VAO_VI.map(() => '?').join(', ')}))\n", 1)], r'✗ D1 trang 1'),
  ('VS-vi-me', [(L, 'ma_don: t.don_phone != null && t.don_phone === t.customer_phone ? (t.ma_app || t.code) : null,', 'ma_don: t.ma_app || t.code || null,', 1)], r'✗ D4 ví của bạn trả hộ'),
  ('VS-vi-ghi-chu', [(L, 't.created_by, t.customer_phone,', 't.created_by, t.notes, t.customer_phone,', 1), (L, '...phanLoai(t), so_tien', '...phanLoai(t), ...(t.notes ? { ghi_chu: t.notes } : {}), so_tien', 1)], r'✗ D4 ví của bạn trả hộ'),
  ('VS-vi-nhan-dong', [(L, "      (SELECT a.ma FROM pos_phien_thanh_toan p JOIN pos_don_app a ON a.phien_id = p.id WHERE p.order_id = o.id ORDER BY a.id LIMIT 1) AS ma_app\n    FROM pos_balance_transactions t LEFT JOIN pos_orders o ON o.id = t.order_id",
                        "      a.ma AS ma_app\n    FROM pos_balance_transactions t LEFT JOIN pos_orders o ON o.id = t.order_id LEFT JOIN pos_phien_thanh_toan p ON p.order_id = o.id LEFT JOIN pos_don_app a ON a.phien_id = p.id", 1)],
   r'✗ D1 trang 1'),
  ('VS-vi-tru-tay', [(L, "if (!t.order_id) return { loai: 'dieu_chinh'", "if (!t.order_id) return { loai: 'tra_don'", 1)], r'✗ D2 loai'),
  ('VS-vi-phone', [(GN.replace('goi-nap.js', 'kh/index.js'), 'await lichSuVi(req.khach.phone, trang)', 'await lichSuVi(req.query.phone || req.khach.phone, trang)', 1)], r'✗ D4 khách B'),
  # ── F: màn quầy ──
  ('BV-ui-the', [(TI, "  if (laThe) return 'Thẻ hội viên", "  if (false) return 'Thẻ hội viên", 1)], r'✗ B5 lyDoKhongTru'),
  ('BV-ui-ban-hang', [(BH, 'dungTK: dungTK && !chiTienThat, dungMe: dungMe && dungTK && !chiTienThat', 'dungTK: dungTK && !laNap, dungMe: dungMe && dungTK && !laNap', 1)], r'✗ B5 BanHangMoi'),
  ('BV-ui-don-app', [(DA, "{d.co_nap && <div", "{false && <div", 1)], r'✗ E1 DonApp'),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khnap1_')
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


def chay_goc(sha, bai):
  """Bằng chứng ĐỎ trên code chưa vá: bài HIỆN TẠI `bai` với server/ + client/src/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_khnap1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', ((r.stdout or '') + (r.stderr or '')).strip())
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l or 'Giả lập:' in l))
    print(f'GỐC {sha} · {bai}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_cay_goc(sha, bai):
  """Bằng chứng ĐỎ cho bài KHÔNG có --may-chu: cả cây của commit `sha` (git archive) + chép đè cong_cu/ và HOP_DONG_API_KH.md HIỆN TẠI, chạy `bai` trong cây đó."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_khnap1_cay_')
  try:
    tar = subprocess.run(['git', 'archive', sha], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    shutil.rmtree(os.path.join(tmp, 'cong_cu'))
    shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tmp, 'cong_cu'))
    shutil.copy(os.path.join(GOC, 'HOP_DONG_API_KH.md'), os.path.join(tmp, 'HOP_DONG_API_KH.md'))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    if os.path.isdir(os.path.join(GOC, 'client', 'node_modules')):
      os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))
    r = subprocess.run(['node', bai], cwd=tmp, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', ((r.stdout or '') + (r.stderr or '')).strip())
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l or 'Giả lập:' in l))
    print(f'CÂY GỐC {sha} · {bai}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--cay-goc' in sys.argv:
    chay_cay_goc(sys.argv[sys.argv.index('--cay-goc') + 1], sys.argv[sys.argv.index('--bai') + 1]); sys.exit(0)
  if '--goc' in sys.argv:
    bai = sys.argv[sys.argv.index('--bai') + 1] if '--bai' in sys.argv else BAI
    chay_goc(sys.argv[sys.argv.index('--goc') + 1], bai); sys.exit(0)
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
