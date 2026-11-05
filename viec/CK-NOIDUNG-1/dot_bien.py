#!/usr/bin/env python3
"""CK-NOIDUNG-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/CK-NOIDUNG-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/CK-NOIDUNG-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/CK-NOIDUNG-1/dot_bien.py --help

Khuôn viec/SEPAY-1/dot_bien.py: chép server/, cong_cu/gia_lap, client/src/utils/hoaDon.js, DonApp.jsx, client/dist, bài thử, bộ kiểm, hợp đồng ra
thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink; đích ghi kiểm realpath trong thư mục tạm, K5), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số
lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ
không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
H, GC, SP = 'server/utils/helpers.js', 'server/utils/giuCho.js', 'server/utils/sepay.js'
TT, DA, DS = 'server/routes/thanh-toan.js', 'server/utils/donApp.js', 'server/utils/doiSoat.js'
OR, HD, DM, HDC = 'server/routes/orders.js', 'server/routes/hoaDon.js', 'server/routes/don-mo-rong.js', 'client/src/utils/hoaDon.js'
BAI = {'ck': 'cong_cu/thu_CKNOIDUNG1.js'}
CHEP = list(BAI.values()) + ['kiem_tra_truoc_khi_giao.js', 'HOP_DONG_API_KH.md', HDC, 'client/src/pages/DonApp.jsx']

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: sổ số hoá đơn ──
  ('VS-so-khong-theo-ngay', 'ck', [(H, "FROM pos_so_hoa_don WHERE ngay = ?`, [ngay, kenh, phienId, now, ngay]);", "FROM pos_so_hoa_don`, [ngay, kenh, phienId, now]);", 1)], r'✗ A5 '),
  ('VS-ngay-utc', 'ck', [(H, '  const ngay = now.slice(0, 10);\n', '  const ngay = new Date().toISOString().slice(0, 10);\n', 1)], r'✗ (A5|B8) '),
  ('VS-so-qua-9999', 'ck', [(H, 'if (!s || s.so > SO_HD_TOI_DA)', 'if (!s)', 1)], r'✗ A7 '),
  ('BV-so-giu', 'ck', [(GC, "const so = cach === 'payos' || kenh === 'APP' ?", "const so = false ?", 1)], r'✗ A1 '),
  ('VS-kenh-tu-than', 'ck', [(GC, "async function taoPhien(b, nguoi, { kenh = 'HD' } = {}) {", "async function taoPhien(b, nguoi, { kenh = b.kenh || 'HD' } = {}) {", 1)], r'✗ A8 '),
  ('VS-so-moi-khi-chot', 'ck', [(H, "const s = (phienId && await tx.queryOne(", "const s = (false && await tx.queryOne(", 1)], r'✗ C1 tiền SePay về'),
  ('BV-gan-so-don', 'ck', [(OR, "if ((await tx.run('UPDATE pos_so_hoa_don SET order_id = ? WHERE id = ? AND order_id IS NULL', [orderId, maDon.soId])).changes !== 1) {",
                             'if (false) {', 1)], r'✗ (E2 |E1 kỳ ngày)'),
  # ── B: nội dung + khớp webhook ──
  ('BV-noi-dung-so', 'ck', [(SP, 'const NOI_DUNG_SO_HD = true;', 'const NOI_DUNG_SO_HD = false;', 1)], r'✗ A1 '),
  ('VS-payos-noi-dung-so', 'ck', [(GC, "const noiDung = cong.NOI_DUNG_SO_HD ? noiDungCk(so) : 'TQD' + id;", 'const noiDung = noiDungCk(so);', 1)], r'✗ B6 '),
  ('VS-regex-cach', 'ck', [(SP, r"const MAU_SO_HD = /TQD[\s._-]*([A-Z]{3})[\s._-]*(\d{2})[\s._-]*(HD|APP)[\s._-]*(\d{4})(?!\d)/i;",
                            r"const MAU_SO_HD = /TQD([A-Z]{3})(\d{2}) ?(HD|APP)(\d{4})(?!\d)/i;", 1)], r'✗ B3 .*chấm / gạch'),
  ('VS-regex-hoa', 'ck', [(SP, r"[\s._-]*(\d{4})(?!\d)/i;", r"[\s._-]*(\d{4})(?!\d)/;", 1)], r'✗ B3 .*chữ thường'),
  ('VS-regex-dinh-so', 'ck', [(SP, r"[\s._-]*(\d{4})(?!\d)/i;", r"[\s._-]*(\d{4})/i;", 1)], r'✗ B4 '),
  ('BV-mau-cu', 'ck', [(SP, 'm = h ? null : tim(MA_PHIEN);', 'm = null;', 1)], r'✗ B7 '),
  ('BV-khong-phien-chuoi', 'ck', [(TT, "khongPhien: `mã ${d.noiDung || 'TQD' + d.ma} không thuộc phiên nào`", "khongPhien: `mã TQD${d.ma} không thuộc phiên nào`", 1)], r'✗ B9 '),
  # ── C · D: số bill, mã GD ──
  ('BV-don-mo-rong', 'ck', [(DM, r"/^ORD-\d{8}-((?:HD|APP)\d{4}|\d{3,})$/", r"/^ORD-\d{8}-(\d{3,})$/", 1)], r'✗ C1 số bill của don-mo-rong'),
  ('BV-ma-gd', 'ck', [(GC, "      if (them.maGd) await tx.run('UPDATE pos_orders SET ma_gd = ? WHERE id = ?', [String(them.maGd).slice(0, 64), orderId]);\n", '', 1)], r'✗ D1 '),
  ('BV-ma-gd-payos', 'ck', [(TT, "maGd: String(d.reference ?? '').trim() || null, duLieu: d,", 'duLieu: d,', 1)], r'✗ D2 '),
  ('BV-hoa-don-ma-gd', 'ck', [(HD, '      ma_gd: o.ma_gd || null },', '      },', 1)], r'✗ D5 dữ liệu hoá đơn'),
  ('BV-bill-ma-gd', 'ck', [(HDC, "  if (hd?.don?.ma_gd) tt.push({ khoa: 'ma_gd', ten: 'Mã GD', tien: String(hd.don.ma_gd), dam: false });\n", '', 1)], r'✗ D5 bill quầy'),
  ('BV-ghi-chu-ma-app', 'ck', [(DA, "notes: 'Đơn App · nhận tại quán',", "notes: `Đơn App ${ma} · nhận tại quán`,", 1)], r'✗ BỎ mã App'),
  # ── C4: Q1a quầy xác nhận tay muộn ──
  ('BV-xnt-muon', 'ck', [(TT, "lyDo: lyDo.trim(), muon }));", 'lyDo: lyDo.trim() }));', 1)], r'✗ C4 '),
  ('BV-xnt-chan-app', 'ck', [(TT, '    if (muon && await laPhienApp(p.id)) {', '    if (false) {', 1)], r'✗ C4e '),
  ('VS-muon-moi-cach', 'ck', [(GC, "const muon = nguon === 'tay' && them.muon === true;", 'const muon = true;', 1)], r'✗ G7b '),
  ('VS-muon-khoa-loi', 'ck', [(GC, '  if (!muon && r.statusCode >= 400', '  if (r.statusCode >= 400', 1)], r'✗ C4b khách nạp đủ'),
  ('BV-nut-xnt', 'ck', [(DS, '...(choTay ? { xac_nhan_tay: r.phien_id } : {})', '...({})', 1)], r'✗ C4h Đối soát: dòng tiền về muộn'),
  ('BV-da-tay-can-xem', 'ck', [(DS, "canXem: r.ket_qua !== 'chua_khop' || daTay || [", "canXem: r.ket_qua !== 'chua_khop' || [", 1)], r'✗ C4h Đối soát sau'),
  # ── G: Q1b App tiền về muộn cộng ví ──
  ('BV-cong-vi', 'ck', [(TT, '  if (quaHan && p.phone && t.soTien > 0', '  if (false && quaHan && p.phone && t.soTien > 0', 1)], r'✗ G1 '),
  ('VS-cong-vi-hai-lan', 'ck', [(TT, '      if (ins.changes !== 1) return;\n', '', 1)], r'✗ G2 '),
  ('VS-cong-vi-quay', 'ck', [(TT, 't.soTien > 0 && await laPhienApp(p.id)', 't.soTien > 0', 1)], r'✗ G7 '),
  ('VS-cong-vi-chi-huy', 'ck', [(TT, "(p.trang_thai === 'cho' && (luc > p.het_han || p.het_han <= getNow()))", 'false', 1)], r'✗ G4 '),
  ('BV-tien-ve-vi-app', 'ck', [(DA, 'tien_ve_da_cong_vi: Number(r.vao_vi || 0),', 'tien_ve_da_cong_vi: 0,', 1)], r'✗ G1 App thấy'),
  ('VS-vao-vi-do', 'ck', [(DS, "canXem: r.ket_qua !== 'chua_khop' || daTay ||", "canXem: r.ket_qua === 'khong_phien' || daTay ||", 1)], r'✗ G8 '),
  # ── E: Đối soát số hoá đơn ──
  ('BV-doi-soat-so', 'ck', [(DS, '    kq.so_hd = await soHoaDonNgay(ky.tu, chiDoc);', '    kq.so_hd = [];', 1)], r'✗ C2 / E1 '),
  ('BV-so-trong-do', 'ck', [(DS, '    for (const s of kq.so_hd.filter((x) => !x.phien_id && !x.ma_don)) {', '    for (const s of []) {', 1)], r'✗ E3 '),
  ('VS-ly-do-het-han', 'ck', [(DS, "(r.p_het_han > bayGio ? 'đang chờ' : 'QR hết hạn, chưa nhận tiền')", "'đang chờ'", 1)], r'✗ C2 / E1 '),
  # ── F: cửa App ──
  ('BV-so-hd-app', 'ck', [(DA, 'so_hd: r.loai ? soHdCuaMa(r.ma_bill) : r.so_giu ?? null, ', '', 1)], r'✗ F2 '),
  ('BV-so-hd-post', 'ck', [(DA, 'so_hd: so ? soHd(so.kenh, so.so) : null, ', '', 1)], r'✗ F1 '),
  ('BV-so-hd-quay', 'ck', [(DA, 'so_hd: soHdCuaMa(r.code), ', '', 1)], r'✗ F3 '),
  ('VS-hop-dong-luat-4xx', 'ck', [('HOP_DONG_API_KH.md', '409 `KHOA_GUI_DA_DUNG` (khoá đã dùng', '409 (khoá đã dùng', 1)], r'✗ F2 câu luật 4xx'),
]


def ban_sao(thay):
  """Chép server/ + giả lập + phần client bài đọc + bài thử + bộ kiểm + hợp đồng ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_ckn1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))   # doiSoat.js nạp bat_bien.js ở đây
  shutil.copytree(os.path.join(GOC, 'client', 'dist'), os.path.join(tmp, 'client', 'dist'))
  for f in CHEP:
    os.makedirs(os.path.dirname(os.path.join(tmp, f)), exist_ok=True)
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
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai])], cwd=tmp, capture_output=True, text=True, timeout=400)
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
    return ten, 'LẠC', 'quá hạn 400 s'
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
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]) + ''.join(' | ' + l.strip()[:140] for l in ra.splitlines() if '✗' in l))
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
