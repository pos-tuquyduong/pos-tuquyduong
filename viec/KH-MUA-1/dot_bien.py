#!/usr/bin/env python3
"""KH-MUA-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-MUA-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-MUA-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KH-MUA-1/dot_bien.py --help

Khuôn viec/KH-API-3/dot_bien.py: chép server/, HOP_DONG_API_KH.md và hai bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules
nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao (bài lấy
GOC = thư mục cha của chính nó, nên đọc server/ của bản sao).
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D, I, Q = 'server/utils/donApp.js', 'server/routes/kh/index.js', 'server/routes/kh/quay.js'
S, HD = 'server/routes/settings.js', 'HOP_DONG_API_KH.md'
BAI = {'mua': 'cong_cu/thu_KHMUA1.js', 'hd': 'cong_cu/thu_HOPDONG_KH.js'}
XOA_GIU_KHOA = ("        await run(`DELETE FROM pos_don_app WHERE id = ? AND NOT EXISTS (SELECT 1 FROM pos_phien_thanh_toan p\n"
                "          WHERE p.id = pos_don_app.phien_id AND p.trang_thai = 'da_thu')`, [appId]);\n")

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B: giờ hoạt động · món ──
  ('BV-BO-KIEM-GIO', 'mua', [(D, '  const loiGio = await kiemGio();\n  if (loiGio) return loiGio;\n', '', 1)], r'✗ B1 '),
  ('VS-GIO-CHI-DANG-MO', 'mua', [(D, ": !m.nhan_don ? thanLoi('QUA_GIO_NHAN_DON')", ": false ? thanLoi('QUA_GIO_NHAN_DON')", 1)], r'✗ B2 '),
  ('VS-CON-HANG-NULL-LA-HET', 'mua', [(D, "typeof p.stock_quantity === 'number' && sl > p.stock_quantity", '!(sl <= p.stock_quantity)', 1)], r'✗ K5 món tồn chưa rõ'),
  ('BV-HET-HANG-TONG-SL', 'mua', [(D, 'can.set(m.ma, (can.get(m.ma) || 0) + m.so_luong);', 'can.set(m.ma, Math.max(can.get(m.ma) || 0, m.so_luong));', 1)], r'✗ B5 '),
  # ── A: báo giá ──
  ('VS-MA-GIAM-LOI-HONG-CA-GIO', 'mua', [(D, 'if (ct.status && gio.maGiam && ct.status < 500) {', 'if (false) {', 1)], r'✗ A7 '),
  ('VS-BAO-GIA-DON-GIA-HANG', 'mua', [(D, 'don_gia: ct.items[i].unit_price,', 'don_gia: ct.items[i].tier_unit_price ?? ct.items[i].unit_price,', 1)], r'✗ A6 '),
  # ── C: tạo đơn qua phiên ──
  ('VS-CHOT-VI-KHONG-CHOT', 'mua', [(D, "    if (tra.cach === 'tai_khoan') {\n", '    if (false) {\n', 1)], r'✗ C2 '),
  ('BV-SO-DU-THANH-VI-KHONG-DU', 'mua', [(D, "  if (code === 'SO_DU_KHONG_DU') return thanLoi('VI_KHONG_DU');\n", '', 1)], r'✗ C5 '),
  ('VS-HET-HANG-SX-KHONG-DOI', 'mua', [(D, "if (!code && /^Không đủ hàng: /.test(error || '')) {", 'if (false) {', 1)], r'✗ C10 '),
  # ── tong_da_xem / GIA_DA_DOI (chủ quán duyệt 31.10) ──
  ('VS-bo-so-tong-da-xem', 'mua', [(D, "  if (kq.bao.tong !== b.tong_da_xem) return thanLoi('GIA_DA_DOI', { bao_gia: kq.bao });\n", '', 1)], r'✗ (P1|D1 GIA_DA_DOI) '),
  ('VS-GIA-DA-DOI-THIEU-BAO-GIA', 'mua', [(D, "return thanLoi('GIA_DA_DOI', { bao_gia: kq.bao });", "return thanLoi('GIA_DA_DOI');", 1)], r'✗ (P1|P5) '),
  ('BV-KIEM-DANG-TONG-DA-XEM', 'mua', [(D, '!Number.isInteger(b.tong_da_xem) || b.tong_da_xem < 0', 'b.tong_da_xem == null', 1)], r'✗ D1 YEU_CAU_KHONG_HOP_LE'),
  # ── D / R: luật 4xx — không giữ khoá gửi ──
  ('BV-BO-XOA-GIU-KHOA', 'mua', [(D, XOA_GIU_KHOA, '', 1)], r'✗ (D1|R1) '),
  # ── E: chống trùng ──
  ('VS-KHOA-GUI-NOI', 'mua', [(D, 'KHOA_GUI: /^[A-Za-z0-9-]{16,64}$/,', 'KHOA_GUI: /^[A-Za-z0-9_-]{15,65}$/,', 1)], r'✗ E3 '),
  ('VS-BAM-CO-PIN', 'mua', [(D, "b.ma_giam || null, b.cach_nhan ?? null, b.cach_tra ?? null])", "b.ma_giam || null, b.cach_nhan ?? null, b.cach_tra ?? null, b.pin ?? null])", 1)], r'✗ E1 '),
  ('VS-NHO-KHOA-MAI', 'mua', [(D, 'cu.bam === bam && cu.tao_luc > truGiay(GIOI.NHO_KHOA_GIAY)', 'cu.bam === bam', 1)], r'✗ E6 '),
  ('BV-BO-LUOI-10-GIAY', 'mua', [(D, '  if (trung) return traDon(trung, true);\n', '', 1)], r'✗ E4 '),
  ('VS-DEM-LUOT-TRUOC-TRA-KHOA', 'mua', [(D, '  const bam = bamGio(b);\n', "  const bam = bamGio(b);\n  if (giuLuotDat(khach.id)) return thanLoi('QUA_NHIEU_LAN', { thu_lai_sau_giay: 1 });\n", 1)], r'✗ E8 '),
  ('BV-TRAN-LUOT', 'mua', [(D, '  if (cho) return thanLoi(\'QUA_NHIEU_LAN\', { thu_lai_sau_giay: cho });\n', '', 1)], r'✗ D1 / K3 '),
  # ── F / G: tiến trình · huỷ ──
  ('VS-TIEN-TRINH-HET-HAN-VAN-CHO-TRA', 'mua', [(D, "return p.trang_thai === 'cho' && p.het_han > getNow() ? 'cho_tra' : 'da_huy';", "return p.trang_thai === 'cho' ? 'cho_tra' : 'da_huy';", 1)], r'✗ F4 '),
  ('BV-BO-DIEU-KIEN-SDT-DON', 'mua', [(D, '    WHERE o.customer_phone = ?\n', '    WHERE (o.customer_phone = ? OR 1)\n', 1)], r'✗ F5 '),
  ('VS-HUY-DA-TRA', 'mua', [(D, "kq.body.tien_trinh === 'da_huy' ? {", "kq.body.tien_trinh !== 'cho_tra' ? {", 1)], r'✗ G2 '),
  # ── H: quầy · chuông ──
  ('BV-QUAY-THAY-DON-CHO-TRA', 'mua', [(D, " JOIN pos_orders o ON o.id = p.order_id\n    WHERE p.trang_thai = 'da_thu' AND (p.luc_chot >= ? OR (",
                                         " LEFT JOIN pos_orders o ON o.id = p.order_id\n    WHERE 1 AND (1 OR (", 1)], r'✗ H2 '),
  ('BV-DOI-TIEN-TRINH-CHUA-TRA', 'mua', [(D, "\n    AND EXISTS (SELECT 1 FROM pos_phien_thanh_toan p JOIN pos_orders o ON o.id = p.order_id\n"
                                           "      WHERE p.id = pos_don_app.phien_id AND p.trang_thai = 'da_thu' AND ${DON_CON})`", '`', 1)], r'✗ H3 đơn chưa trả'),
  ('BV-CHUONG-KIEM', 'mua', [(S, "    if (chuongSai) return res.status(400)", "    if (false) return res.status(400)", 1)], r'✗ H5 '),
  ('VS-AM-LUONG-101', 'mua', [(S, 'Number(value) <= 100)', 'Number(value) <= 101)', 1)], r'✗ H5 '),
  # ── vòng sửa 1 (soát độc lập lỗi 1–5) ──
  ('VS-FINALLY-TIN-CO-BO-NHO', 'mua', [(D, " AND NOT EXISTS (SELECT 1 FROM pos_phien_thanh_toan p\n          WHERE p.id = pos_don_app.phien_id AND p.trang_thai = 'da_thu')`", '`', 1)], r'✗ V1 '),
  ('BV-FINALLY-HUY-PHIEN', 'mua', [(D, '        if (phienId) await huyPhien(phienId);\n', '', 1)], r'✗ V4 '),
  ('BV-GIA-DOI-SAU-PHIEN', 'mua', [(D, 'if (tp.body.phien.tong !== kq.bao.tong) {', 'if (false) {', 1)], r'✗ V4 '),
  ('BV-DANG-XU-LY-GIU-KHOA', 'mua', [(D, "  if (cu && !cu.phien_id) return thanLoi('DANG_XU_LY');\n", '', 1)], r'✗ V3 '),
  ('BV-TRUNG-KHOA-NEM', 'mua', [(D, "    if (laTrungKhoa(e)) return thanLoi('DANG_XU_LY');", '', 1)], r'✗ V2 '),
  ('VS-CHOT-VI-BO-KIEM-DA-THU', 'mua', [(D, "if ((await docPhien(phienId)).trang_thai !== 'da_thu') return chuanLoi(", 'if (false) return chuanLoi(', 1)], r'✗ V5 '),
  ('VS-QUAY-KHONG-LOC-HOM-NAY', 'mua', [(D, 'p.luc_chot >= ? OR (', 'p.luc_chot >= ? OR 1 OR (', 1)], r'✗ V7 '),
  ('VS-QUAY-BAM-DON-HUY', 'mua', [(D, "p.trang_thai = 'da_thu' AND ${DON_CON})`", "p.trang_thai = 'da_thu')`", 1)], r'✗ V7 '),
  # ── I: tiền về muộn ──
  ('BV-TIEN-VE-CO', 'mua', [(D, "const CO_TIEN_VE = \"EXISTS (SELECT 1 FROM pos_payos_su_kien s WHERE s.ma_payos = p.ma_payos AND s.ket_qua = 'chua_khop')\";", 'const CO_TIEN_VE = "0";', 1)], r'✗ I1 '),
  # ── J: hợp đồng v5 (thu_HOPDONG_KH.js) ──
  ('BV-HOPDONG-CAU-4XX', 'hd', [(HD, 'Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như lần đầu.', 'Trả lời 4xx của POST /don không giữ khoá gửi.', 1)], r'✗ v5: hợp đồng ghi NGUYÊN câu'),
  ('BV-HOPDONG-CUA-DON', 'hd', [(HD, '    { "pt": "POST", "duong": "/don", "token": true, "tra": ["ma_don", "tong", "giu_vi", "con_lai", "tien_trinh", "qr.chuoi", "qr.het_han", "trung"] },\n', '', 1)], r'✗ mọi route dưới /api/kh'),
  ('VS-HOPDONG-MA-THIEU', 'hd', [(HD, '"VI_KHONG_DU", "CACH_KHONG_KHOP",', '"CACH_KHONG_KHOP",', 1)], r'✗ server/routes/kh/loi\.js'),
]


def ban_sao(thay):
  """Chép server/ + hợp đồng + hai bài thử ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khmua1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  os.makedirs(os.path.join(tmp, 'cong_cu'))
  for f in list(BAI.values()) + [HD]:
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
