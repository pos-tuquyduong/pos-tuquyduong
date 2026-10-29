#!/usr/bin/env python3
"""KHO-2a — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-2a/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-2a/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KHO-2a/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ của commit sha)
    python3 viec/KHO-2a/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/KHO-1/dot_bien.py: chép server/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_KHO2a.js --may-chu <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 (bài sập) hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
T, D, L, N, S, B2 = ('server/kho/tinh.js', 'server/kho/duong.js', 'server/kho/duLieu.js', 'server/kho/nhapSx.js', 'server/routes/settings.js',
                     'server/nang_cap/002_kho_pha_che.js')

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── B: pha chế ──
  ('VS-dangco-tinh-lo-het-han', [(L, "'l.san_pham_id IS NOT NULL AND (l.han_dung IS NULL OR l.han_dung > ?)', [moc]", "'l.san_pham_id IS NOT NULL AND ? IS NOT NULL', [moc]", 1)], r'✗ B[13] '),
  ('VS-thu-gio-may', [(L, '  const thu = thuCuaNgay(ngay);', '  const thu = new Date().getDay();', 1)], r'✗ B3 '),
  ('VS-mai-moc-bay-gio', [(D, "return duLieu.docPhaChe(csdl, mai, mai + 'T00:00:00');", 'return duLieu.docPhaChe(csdl, mai, luc);', 1)], r'✗ B3 '),
  ('VS-vai-tro-la-qua', [(D, "const NHAN_VIEN = checkRole(...VAI_QUAN_LY, 'staff');", 'const NHAN_VIEN = (req, res, next) => next();', 1)], r'✗ (B5|I1) '),
  # ── A: định mức ──
  ('BV-dinh-muc-xoa-cu', [(L, "  await tx.run('DELETE FROM kho_dinh_muc WHERE san_pham_id = ?', [spId]);\n", '', 1)], r'✗ A1 '),
  # ── C: phiếu ──
  ('VS-tong-khong-trien-khai', [(T, 'nguyen_lieu: trienKhai({ goc: m.san_pham_id, bang }, m.so_phan)',
    'nguyen_lieu: (bang[m.san_pham_id] || []).filter((d) => d.nguyen_lieu_id != null).map((d) => ({ nguyen_lieu_id: d.nguyen_lieu_id, luong: d.luong * m.so_phan }))', 1)], r'✗ C1 '),
  ('BV-ma-gui', [(B2, "  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_phieu_ma_gui ON kho_phieu(ma_gui) WHERE ma_gui IS NOT NULL');\n", '', 1)], r'✗ C7 '),
  ('BV-tra-phieu-da-co', [(D, 'const id = khiTrung && tinh.laTrungKhoa(e) ?', 'const id = false ?', 1)], r'✗ C7 '),
  # ── D: duyệt ──
  ('BV-khoa-trang-thai-duyet', [(L, "    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [nguoi, luc, id, nguoi]);", "    AND nguoi_tao <> ?`, [nguoi, luc, id, nguoi]);", 1)], r'✗ D[56] '),
  ('BV-chan-tu-duyet', [(L, "    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [nguoi, luc, id, nguoi]);", "    AND trang_thai = 'cho_duyet' AND ? IS NOT NULL`, [nguoi, luc, id, nguoi]);", 1)], r'✗ D3 '),
  ('VS-tu-choi-khong-chan-nguoi-tao', [(L, "    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [lyDo, nguoi, luc, id, nguoi]);",
    "    AND trang_thai = 'cho_duyet' AND ? IS NOT NULL`, [lyDo, nguoi, luc, id, nguoi]);", 1)], r'✗ D12 '),
  ('BV-khoa-trang-thai-tu-choi', [(L, "    AND trang_thai = 'cho_duyet' AND nguoi_tao <> ?`, [lyDo, nguoi, luc, id, nguoi]);",
    "    AND nguoi_tao <> ?`, [lyDo, nguoi, luc, id, nguoi]);", 1)], r'✗ D1[12] '),
  ('BV-ly-do-tu-choi', [(D, "router.post('/phieu/:id/tu-choi', QUAN_LY, (req, res, next) => (lyDoCua(req) ? next() : thieuLyDo(res)),", "router.post('/phieu/:id/tu-choi', QUAN_LY,", 1)], r'✗ D7 '),
  ('VS-nhan-vien-duyet', [(D, "router.post('/phieu/:id/duyet', QUAN_LY,", "router.post('/phieu/:id/duyet', NHAN_VIEN,", 1)], r'✗ (D4|I1) '),
  ('VS-cong-tac-khac-0-la-tat', [(L, "[KHOA_CONG_TAC]))?.value) !== '0';", "[KHOA_CONG_TAC]))?.value) === '1';", 1)], r'✗ D8 '),
  ('BV-cong-tac-chi-chu-quan', [(S, "if (Object.keys(settings).some((key) => key.startsWith('kho_')) && req.user.role !== 'owner') {", 'if (false) {', 1)], r'✗ D10 '),
  ('BV-cong-tac-gia-tri-la', [(S, " || key === 'kho_px_nv_can_duyet')", ')', 1)], r'✗ D10 '),
  # ── E: ghi kho ──
  ('VS-fefo-han-xa-truoc', [(L, "[nlId, luc], 'han_dung IS NULL, han_dung, id')", "[nlId, luc], 'han_dung IS NULL, han_dung DESC, id')", 1)], r'✗ E2 '),
  ('BV-lo-qua-han', [(L, "'l.nguyen_lieu_id = ? AND (l.han_dung IS NULL OR l.han_dung > ?)', [nlId, luc]", "'l.nguyen_lieu_id = ? AND ? IS NOT NULL', [nlId, luc]", 1)], r'✗ E2 '),
  ('VS-gia-von-thieu-gia', [(L, 'cua.length && cua.every((x) => giaCua(x) != null) ?', 'cua.length ?', 1)], r'✗ E4 '),
  ('VS-han-xoa-khi-khong-gui', [(D, "const hanNgay = !('han_ngay' in req.body) ? undefined :", "const hanNgay = !('han_ngay' in req.body) ? null :", 1)], r'✗ E0b '),
  ('BV-han-tu-sx', [(N, "    if (m.han_ngay) await tx.run('UPDATE kho_san_pham SET han_ngay = ? WHERE pos_product_id = ? AND han_ngay IS NULL', [m.han_ngay, spId]);\n", '', 1)], r'✗ E7 '),
  ('VS-han-de-o-co-san', [(N, 'WHERE pos_product_id = ? AND han_ngay IS NULL', 'WHERE pos_product_id = ?', 1)], r'✗ E7 '),
  ('VS-han-sx-cot-cu', [(N, '`SELECT p.*, t.code AS loai FROM sx_products p', '`SELECT p.id, p.code, p.name, p.legacy_id, t.code AS loai FROM sx_products p', 1)], r'✗ E7 '),
  # ── F: kết quả ──
  ('BV-chi-muc-ket-qua', [(B2, "  await tx.run(\"CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_ket_qua_lo ON kho_phieu_dong(lo_id) WHERE loai = 'ket_qua'\");\n", '', 1)], r'✗ F4 '),
  ('BV-bat-trung-ket-qua', [(L, '    if (!laTrungKhoa(e)) throw e;\n    return { loi: [409,', '    throw e;\n    return { loi: [409,', 1)], r'✗ F4 '),
  ('VS-lech-lon-bang', [(T, '> Number(lechChoPhep) + SAI_SO', '>= Number(lechChoPhep) - SAI_SO', 1)], r'✗ F3 '),
  ('VS-tu-chot-gio-may', [(D, 'getNow().slice(0, 10)', 'new Date().toISOString().slice(0, 10)', 2),
                          (L, 'trangThaiKetQua(p.duyet_luc.slice(0, 10), luc.slice(0, 10), false, false)', 'trangThaiKetQua(p.duyet_luc.slice(0, 10), new Date().toISOString().slice(0, 10), false, false)', 1)], r'✗ F5 '),
  ('VS-ket-qua-phieu-sua', [(L, "if (p.trang_thai !== 'da_duyet' || p.thay_cho_id != null) {", "if (p.trang_thai !== 'da_duyet') {", 1)], r'✗ F6b '),
  # ── G: tồn ──
  ('VS-ton-tinh-cho-duyet', [(L, 'WHERE d.nguyen_lieu_id = l.id AND ${DA_DUYET})`', 'WHERE d.nguyen_lieu_id = l.id)`', 1)], r'✗ (D1|G1) '),
  ('VS-sap-het-nho-hon', [(T, "han <= mocSapHet ? 'sap_het'", "han < mocSapHet ? 'sap_het'", 1)], r'✗ G2 '),
  ('BV-an-gia-phan-hoi-ghi', [(D, '  traVe(req, res, { ...p, ...them });', '  res.json({ ...p, ...them });', 1)], r'✗ G3 '),
  # ── H: in · sửa · huỷ ──
  ('BV-dem-in', [(D, 'SET so_lan_in = so_lan_in + 1 WHERE', 'SET so_lan_in = 1 WHERE', 1)], r'✗ H2 '),
  ('VS-sua-lo-han-gio-sua', [(L, 'lucLam: cu.duyet_luc || luc', 'lucLam: luc', 1)], r'✗ H3 '),
  ('VS-quan-ly-sua-phieu', [(D, "router.post('/phieu/:id/sua', CHU_QUAN,", "router.post('/phieu/:id/sua', QUAN_LY,", 1)], r'✗ (H4|I1) '),
  ('BV-huy-khoa-trang-thai', [(L, "\n    AND trang_thai IN ('cho_duyet', 'da_duyet')`, [lyDo, nguoi, luc, id]);", '`, [lyDo, nguoi, luc, id]);', 1)], r'✗ H5b '),
  # ── vòng sửa 1 (soát lần 1) ──
  ('VS-lo-tinh-moi-trang-thai', [(L, "WHERE d.lo_id = l.id AND ${DA_DUYET}) AS con", 'WHERE d.lo_id = l.id) AS con', 1)], r'✗ (H3c|H5c|B1) '),
  ('BV-in-chua-duyet', [(D, "WHERE id = ? AND trang_thai = 'da_duyet'\", [id]);", 'WHERE id = ?", [id]);', 1)], r'✗ H2b '),
  ('BV-so-thuc-am', [(D, "(soThuc != null && soThuc !== '' && !(Number(soThuc) >= 0))", 'false', 1)], r'✗ F7 '),
  ('BV-mon-trung', [(D, ' && new Set(mon.map((m) => m.san_pham_id)).size === mon.length', '', 1)], r'✗ C5 '),
  ('VS-han-le', [(D, '!(Number.isInteger(hanNgay) && hanNgay > 0)', '!(hanNgay > 0)', 1)], r'✗ E0c '),
  ('BV-ghi-nguoi-huy', [(L, "SET trang_thai = 'huy', ly_do = ?, nguoi_huy = ?, huy_luc = ? WHERE id = ? AND loai = 'PX'\n    AND trang_thai IN",
    "SET trang_thai = 'huy', ly_do = ? WHERE id = ? AND loai = 'PX' AND ? IS NOT NULL AND ? IS NOT NULL\n    AND trang_thai IN", 1),
    (L, '[lyDo, nguoi, luc, id]);', '[lyDo, id, nguoi, luc]);', 1)], r'✗ H5c '),
  ('VS-tu-choi-ghi-nguoi-duyet', [(L, "SET trang_thai = 'huy', ly_do = ?, nguoi_huy = ?, huy_luc = ? WHERE id = ? AND loai = 'PX'\n    AND trang_thai = 'cho_duyet'",
    "SET trang_thai = 'huy', ly_do = ?, nguoi_duyet = ?, duyet_luc = ? WHERE id = ? AND loai = 'PX'\n    AND trang_thai = 'cho_duyet'", 1)], r'✗ D7 '),
  ('VS-lech-0-la-khong', [(D, "c === 'lech_cho_phep' ? soKhongAm(b[c])", "c === 'lech_cho_phep' ? (Number(b[c]) > 0 ? Number(b[c]) : null)", 1)], r'✗ A0c '),
  # ── I: quyền ──
  ('BV-duong-la-403', [(D, "router.use((req, res) => res.status(403).json({ error: 'Không có quyền truy cập đường này', code: 'DUONG_LA' }));\n", '', 1)], r'✗ I2 '),
]


def ban_sao(thay):
  """Chép server/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_kho2a_')
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
  return subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_KHO2a.js'), '--may-chu', os.path.join(tmp, 'server')],
                        cwd=GOC, capture_output=True, text=True, timeout=300)


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = chay_bai(tmp)
    ra = (r.stdout or '') + (r.stderr or '')
    if '--in-ra' in sys.argv: print(f'── {ten}: 12 dòng cuối ──\n' + '\n'.join(ra.strip().splitlines()[-12:]))
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
    r = chay_bai(tmp)
    ra = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: bài thử HIỆN TẠI với server/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_kho2a_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = chay_bai(tmp)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
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
