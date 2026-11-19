#!/usr/bin/env python3
"""KHO-3a — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-3a/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-3a/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KHO-3a/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ của commit sha)
    python3 viec/KHO-3a/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/KHO-2b/dot_bien.py: chép server/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_KHO3a.js --may-chu <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (LỖI CHẠY BÀI) hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BH, O, G, TT, DA, DL, P, B31, B32, MK = ('server/kho/banHang.js', 'server/routes/orders.js', 'server/utils/giuCho.js', 'server/routes/thanh-toan.js',
  'server/utils/donApp.js', 'server/kho/duLieu.js', 'server/routes/products.js', 'server/nang_cap/031_ban_theo_kho.js', 'server/nang_cap/032_ten_mon_sx.js',
  'server/utils/manKhach.js')

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B1: làm sẵn — FEFO, lô hết hạn, ngưỡng ──
  ('VS-FEFO-HAN-XA-TRUOC', [(BH, "const LO_FEFO = 'han_dung IS NULL, han_dung, id';", "const LO_FEFO = 'han_dung DESC, id';", 1)], r'✗ B1 FEFO'),
  ('VS-LO-HET-HAN-VAN-BAN', [(BH, "'l.san_pham_id IS NOT NULL AND (l.han_dung IS NULL OR l.han_dung > ?)'", "'l.san_pham_id IS NOT NULL AND ? IS NOT NULL'", 1)],
    r'✗ A2 làm sẵn'),
  ('VS-NGUONG-LON-HON-BANG', [(BH, 'if (con + tinh.SAI_SO < sl) {', 'if (con <= sl) {', 1)], r'✗ B1 đủ ĐÚNG'),
  # ── B2 / B8: pha tại chỗ — cả giỏ, cho bán khi thiếu ──
  ('BV-KIEM-CA-GIO', [(BH, 'if (can.nguyenLieu.get(nlId) > (ctx.tonNL.get(nlId)', 'if (can.phaCua.get(khoa) > (ctx.tonNL.get(nlId)', 1)], r'✗ B2 hai món chung'),
  ('BV-CHO-BAN-THIEU', [(BH, '    if (Number(p.cho_ban_thieu) === 1) continue;\n', '', 1)], r'✗ B2 BẬT \+ thiếu'),
  ('VS-CHO-BAN-THIEU-MAC-DINH-BAT', [(B31, "'cho_ban_thieu INTEGER NOT NULL DEFAULT 0'", "'cho_ban_thieu INTEGER NOT NULL DEFAULT 1'", 1)], r'✗ B8 mặc định TẮT'),
  # ── B3: chưa công thức ──
  ('BV-CHUA-CONG-THUC', [(BH, 'if (can.chua.length) return loi(', 'if (false) return loi(', 1)], r'✗ B3 (không dòng kho|công thức rỗng|chua_dinh_luong)'),
  ('BV-TINH-THU-KHONG-KIEM', [(O, '    if (phien?.chiTinh) {\n', "    if (phien?.chiTinh) {\n      { const l = await banHang.kiemDuHang({ query, queryOne }, items, { bayGio: getNow() }); if (l) return res.status(l.status).json(l.body); }\n", 1)],
    r'✗ B6 tinh-thu \(báo giá\)'),
  # ── B3b: giữ hàng ──
  ('BV-GIU-HANG-TAO-PHIEN', [(G, '    if (thieu) return { huy: true, status: thieu.status, body: thieu.body };\n', '', 1)], r'✗ B3b (phiên B|ba phiên)'),
  # Vòng đột biến 1: VS-GIU-HANG-TINH-CA-PHIEN-MINH SỐNG — phiên đang chốt đã là da_thu (vaoGiaoDich chạy trước) → bỏ tham số phienId (thừa), bỏ đột biến.
  ('VS-CHOT-TRUOC-KHI-DOI-PHIEN', [(O, '      if (phien && !(await phien.vaoGiaoDich(tx, now))) {', '      if (false) {', 1)], r'✗ B(3b C trả trong hạn|6 phiên tiền mặt)'),
  ('BV-CHOT-MUON-BO-QUA-GIU', [(BH, 'const ctx = await docKhaNang(tx, { bayGio: luc });',
    "const ctx = await docKhaNang(tx, { bayGio: luc }); if (orderId) { ctx.giu.thanhPham.clear(); ctx.giu.nguyenLieu.clear(); }", 1)],
    r'✗ B3b xác nhận tay'),
  ('BV-MENU-TRU-GIU', [(BH, "stock_quantity: nguyen((ctx.tonTP.get(p.id) || 0) - (ctx.giu.thanhPham.get(p.id) || 0))", "stock_quantity: nguyen(ctx.tonTP.get(p.id) || 0)", 1)],
    r'✗ B3b menu quầy hiện 0'),
  ('BV-APP-MA-HET-HANG', [(DA, "  if (code === 'HET_HANG' || code === 'THIEU_NGUYEN_LIEU') return thanLoi('HET_HANG', { ma: body.ma ?? null });\n", '', 1)], r'✗ B3b App: thiếu'),
  ('BV-MAN-KHACH-BO-NHO', [(MK, "async function layMenu() {\n  return (await layMenuQuay())", "let nho = null;\nasync function layMenu() {\n  return nho || (nho = await layMenuQuay())", 1)],
    r'✗ B3b màn khách'),
  # ── B3c: lưới an toàn ──
  ('BV-LUOI-VAO-VI-QUAY', [(TT, '  const moi = laApp || loiKho ? await docPhien(p.id) : null;', '  const moi = laApp ? await docPhien(p.id) : null;', 1)], r'✗ B3c phiên QR QUẦY có SĐT'),
  ('BV-LUOI-HOAN-TAY', [(TT, "  if (loiKho && moi && !moi.phone) {", "  if (false) {", 1)], r'✗ B3c QR quầy KHÔNG SĐT'),
  ('BV-LUOI-TEN-MON', [(G, " + (r.body?.mon ? `: ${r.body.mon}` : '')", '', 1)], r'✗ B3c (App thấy|quầy có dòng)'),
  # ── vòng sửa 1 (soát độc lập): màn QR quầy báo hết hàng · xác nhận tay hỏng vì kho hoàn ví một lần ──
  ('BV-QR-QUAY-HET-HANG', [(G, 'order, het_hang: hetHangCua(p),', 'order, het_hang: null,', 1)], r'✗ B3c màn QR quầy'),
  ('BV-TAY-HOAN-VI', [(TT, "    if (kq.status === 400 && LOI_KHO.includes(kq.body?.code)) kq.body =", "    if (false) kq.body =", 1)], r'✗ B3c xác nhận tay'),
  # VS-TAY-HOAN-HAI-LAN (gỡ vế `.changes !== 1` của khoá `tay:<phiên>`) SỐNG: hai xác nhận tay cùng lúc thường bị chặn sớm vì phiên đã đóng ('loi') —
  # đua không tất định, không dựng được ca đỏ tất định → CHƯA KIỂM (K3), không đếm là phép (trang_thai.md).
  ('BV-MOT-VI-TU-CON-RONG', [(BH, "\n  || (p.kieu === 'pha_tai_cho' && !tinh.trienKhai({ goc: p.id, bang }, 1).length);", ';', 1)], r'✗ B3 pha tại chỗ chỉ gồm món con rỗng'),
  ('BV-SUA-TEN-TRUNG', [(P, "    if ((doi.name || hienLai) && await tenTrung(", "    if (false && await tenTrung(", 1)], r'✗ A4 sửa tên trùng'),
  # ── vòng sửa 3 (soát vòng 2): hiện lại món ẩn trùng tên · cổng đã cộng rồi mới xác nhận tay ──
  ('BV-HIEN-LAI-TRUNG-TEN', [(P, "    if ((doi.name || hienLai) && await tenTrung(", "    if ((doi.name) && await tenTrung(", 1)], r'✗ A4 hiện lại món ẩn'),
  ('BV-PUT-404', [(P, "      if (!cu) return { huy: true, khongThay: true };\n", '', 1)], r'✗ A4 sửa / hiện lại món KHÔNG có'),
  ('VS-HIEN-LAI-XET-CA-MON-DANG-BAN', [(P, "const hienLai = doi.is_active === 1 && Number(cu.is_active) !== 1;", "const hienLai = doi.is_active === 1 || 'sort_order' in doi;", 1)],
    r'✗ A4 đối chứng K5'),
  ('BV-TAY-SAU-CONG', [(TT, "    if (await daHoanDuongKia(tx, p, true)) {", "    if (false) {", 1)], r'✗ B3c (cổng đã cộng ví|vòng 4 \(c\))'),
  ('VS-TAY-SAU-CONG-MOI-MA', [(TT, "OR (ma_payos IS NOT NULL AND ma_payos = ?))", "OR (ma_payos IS NOT NULL AND ma_payos <> ?))", 1)],
    r'✗ B3c (đối chứng|cổng đã cộng|vòng 4)'),
  # ── vòng sửa 4 (soát vòng 3): MỘT vị từ dòng hoàn cho mọi cặp (có / không SĐT × tay / cổng trước) · màn QR theo dòng hoàn thật · PUT 404 ──
  ('VS-HOAN-CHI-VAO-VI', [(TT, "  AND (ket_qua = 'vao_vi' OR (ket_qua = 'chua_khop' AND ly_do LIKE ?))`", "  AND (ket_qua = 'vao_vi' OR (? IS NULL))`", 1)],
    r'✗ B3c (vòng 4 \(c\)|vòng 4 \(d\)|màn QR quầy KHÔNG SĐT)'),
  ('VS-HOAN-KHONG-XET-HUONG', [(TT, ".some((d) => laDongTay(d) !== tuTay);", ".length > 0;", 1)], r'✗ B3c vòng 4 K5'),
  ('BV-KHONG-SDT-TAY-TRUOC', [(TT, "thamSo('chua_khop', await daHoanDuongKia(tx, moi, false)", "thamSo('chua_khop', false", 1)], r'✗ B3c vòng 4 \(d\)'),
  ('BV-MAN-QR-HOAN-THAT', [(TT, "vao_vi: ds.some((d) => d.ket_qua === 'vao_vi'),", "vao_vi: !!p.phone,", 1)], r'✗ B3c màn QR quầy \(vòng 4\): có SĐT nhưng'),
  ('BV-MAN-QR-SO-TIEN-SDT', [(TT, "        so_tien: Number(p.con_lai) || 0, sdt:", "        so_tien: 0, sdt0:", 1)], r'✗ B3c màn QR quầy \(vòng 4\): câu nêu SỐ TIỀN'),
  ('VS-MAN-QR-LO-SDT', [(TT, ".replace(/^(\\d{3})\\d+(\\d{3})$/, '$1****$2')", "", 1)], r'✗ B3c màn QR quầy \(vòng 4\): câu nêu SỐ TIỀN'),
  # ── vòng sửa 2 (soát bảo mật): hoàn tay đóng phiên · tiền về sau khi đã hoàn tay không cộng lần hai ──
  ('BV-DONG-PHIEN-KHI-HOAN-TAY', [(TT, """    await tx.run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi', ly_do = ? WHERE id = ? AND trang_thai IN ('cho', 'huy', 'loi')",""",
    """    if (false) await tx.run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi', ly_do = ? WHERE id = ? AND trang_thai IN ('cho', 'huy', 'loi')",""", 1)],
    r'✗ B3c xác nhận tay muộn'),
  ('BV-TIEN-VE-SAU-HOAN-TAY', [(TT, "      if (await daHoanDuongKia(tx, x, false)) {", '      if (false) {', 1)], r'✗ B3c (App: xác nhận tay|vòng 4 \(b\))'),
  # ── B4 / B6 / B7: trừ trong giao dịch, một phiếu ──
  ('BV-TRU-KHO', [(O, 'const kho = await banHang.truKhoDon(tx, {', 'const kho = await (async () => ({}))(tx, {', 1)], r'✗ B(1 FEFO|4 đúng MỘT)'),
  ('BV-CHAN-TRONG-TX', [(O, '      if (kho.loi) {\n        await tx.rollback();', '      if (false) {\n        await tx.rollback();', 1)], r'✗ B(1 thiếu 1|3b POST)'),
  # Vòng đột biến 1: BV-THANH-PHAM-KHONG-AM SỐNG — nhánh "lô thiếu" không bao giờ chạy (kiểm và chia lô cùng một câu) → bỏ nhánh, bỏ đột biến.
  # ── B5: huỷ / xoá trả kho ──
  ('BV-HUY-TRA-KHO', [(O, "        await banHang.huyPhieuBan(tx, order.id, { doDaPha: huyGiao?.doDaPha,", "        if (false) await banHang.huyPhieuBan(tx, order.id, { doDaPha: huyGiao?.doDaPha,", 1)],
    r'✗ B5 hai lần huỷ'),
  ('BV-XOA-TRA-KHO', [(O, "        await banHang.huyPhieuBan(tx, order.id, { nguoi: req.user.username, luc: now, lyDo: `Xoá đơn", "        if (false) await banHang.huyPhieuBan(tx, order.id, { nguoi: req.user.username, luc: now, lyDo: `Xoá đơn", 1)],
    r'✗ B5 xoá đơn completed'),
  ('VS-XOA-CHI-COMPLETED', [(O, '      if (order.status !== "cancelled") {\n        await banHang.huyPhieuBan(', '      if (order.status === "completed") {\n        await banHang.huyPhieuBan(', 1)],
    r'✗ B5 xoá đơn đã hoàn tiền'),   # lỗi giả lập I7 bắt (KB14): xoá đơn refunded không trả kho
  ('VS-BO-DI-VAN-TRA-KHO', [(BH, "  if (doDaPha === 'bo_di') {", '  if (false) {', 1)], r'✗ B5 đơn giao "Bỏ đi"'),
  # ── A2 / A3b / Câu 4 / K4 / khoá CSDL ──
  ('VS-MENU-SO-PHAN-LAM-TRON-LEN', [(BH, 'const nguyen = (x) => Math.max(0, Math.floor(x + tinh.SAI_SO));', 'const nguyen = (x) => Math.max(0, Math.round(x));', 1)], r'✗ A2 pha tại chỗ'),
  ('BV-032-CHI-TEN-TAM', [(B32, 'WHERE sx_product_type = ? AND sx_product_id = ? AND name = ?', 'WHERE sx_product_type = ? AND sx_product_id = ? AND ? IS NOT NULL', 1)],
    r'✗ A3b juice 8 đã sửa tay'),
  ('BV-PHIEU-BAN-KHONG-HUY-TAY', [(DL, "  if ((await tx.queryOne('SELECT su_co FROM kho_phieu WHERE id = ?', [id]))?.su_co === 'ban_hang') {", '  if (false) {', 1)],
    r'✗ Câu 4'),
  ('BV-DS-AN-PHIEU-BAN', [(DL, """  dk.push(String(loc.ban_hang) === '1' ? "p.su_co = 'ban_hang'" : "p.su_co IS NOT 'ban_hang'");\n""", '', 1)], r'✗ Kho › Phiếu'),
  ('BV-031-KHOA-DON-HANG', [(B31, "  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_phieu_don_hang ON kho_phieu(don_hang_id) WHERE don_hang_id IS NOT NULL');\n", '', 1)],
    r'✗ (Khoá duy nhất|Ghi hai phiếu)'),
  # ── A1 / A4 / A7: menu, quản lý món ──
  ('BV-MENU-SELLABLE-CONG-THUC', [(P, "sellable: typeof p.price === 'number' && p.price > 0 && !k.chua_cong_thuc,", "sellable: typeof p.price === 'number' && p.price > 0,", 1)],
    r'✗ B3 món chưa công thức'),
  ('BV-MON-POS-KHOA', [(P, "await tx.run('UPDATE pos_products SET code = ?, sx_product_type = ?, sx_product_id = ? WHERE id = ?', [`POS${id}`, LOAI_MON_POS, id, id]);", '', 1)],
    r'✗ A4 quản lý tạo món'),
  ('BV-MON-CHUA-SAN-HET-LO', [(BH, "      : p.kieu === 'lam_san' && (ctx.tonTP.get(p.id) || 0) <= tinh.SAI_SO ? 'Làm sẵn: hết lô còn hạn' : null;", '      : null;', 1)],
    r'✗ A7 liệt kê'),
]


def ban_sao(thay):
  """Chép server/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_kho3a_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
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
  return subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_KHO3a.js'), '--may-chu', os.path.join(tmp, 'server')],
                        cwd=GOC, capture_output=True, text=True, timeout=400)


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = chay_bai(tmp)
    ra = (r.stdout or '') + (r.stderr or '')
    if '--in-ra' in sys.argv: print(f'── {ten}: 12 dòng cuối ──\n' + '\n'.join(ra.strip().splitlines()[-12:]))
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if 'LỖI CHẠY BÀI' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 400 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    r = chay_bai(tmp)
    ra = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: bài thử HIỆN TẠI với server/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_kho3a_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = chay_bai(tmp)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'LỖI CHẠY BÀI' in l))
    print(f'GỐC {sha}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    chay_goc(sys.argv[sys.argv.index('--goc') + 1]); sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  if '--liet-ke' in sys.argv:
    for t, _, _ in DOT_BIEN: print(t)
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
