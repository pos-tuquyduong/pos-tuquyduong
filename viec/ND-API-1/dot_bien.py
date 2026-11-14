#!/usr/bin/env python3
"""ND-API-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/ND-API-1/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/ND-API-1/dot_bien.py --liet-ke      (chỉ in danh sách)
    python3 viec/ND-API-1/dot_bien.py --goc <sha>    (bài HIỆN TẠI trên server/ + client/src/ của commit sha — bằng chứng đỏ)
    python3 viec/ND-API-1/dot_bien.py --help

Khuôn viec/VI-ME-1/dot_bien.py: chép server/ + client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi
(mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_NDAPI1.js --goc <bản sao>` (máy chủ thật của bản sao,
kho tạm). BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DU, XT, TI, DL = 'server/nd/duong.js', 'server/nd/xacThuc.js', 'server/nd/tinh.js', 'server/nd/duLieu.js'
KS, NC, IX = 'server/nd/khoaSaoLuu.js', 'server/nang_cap/027_noi_dung.js', 'server/index.js'
BK, DT, US = 'server/routes/backup.js', 'server/utils/donThu.js', 'server/routes/users.js'
API, ST = 'client/src/utils/api.js', 'client/src/pages/Settings.jsx'
LO = "  const lo = ['ip:' + ip, `cap:${ten}|${ip}`];\n"
MOUNT = "app.use('/api/nd', require('./nd/duong'));\n"
JSON5 = "app.use(express.json({ limit: '5mb' }));\n"
SO_GOC = "  if (cu.so_ban !== banGoc) return { loi: 'CO_BAN_MOI_HON' };\n"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── CORS + gắn đường (H, C4) ──
  ('VS-CORS-SAO', [(DU, 'router.use(cors({ origin: TEN_MIEN_APP,', "router.use(cors({ origin: '*',", 1)], r'✗ H1b '),
  ('VS-GAN-SAU-CORS', [(IX, MOUNT, '', 1), (IX, JSON5, MOUNT + JSON5, 1)], r'✗ H1b '),
  ('BV-404-TRONG-ND', [(DU, "router.use((req, res) => guiLoi(res, 'KHONG_TIM_THAY'));\n", '', 1)], r'✗ C4 '),
  # ── cập nhật an toàn (E, B) ──
  ('BV-BAN-GOC', [(DL, SO_GOC + '  const nhap = await dsNhap(tx);\n', '  const nhap = await dsNhap(tx);\n', 1)], r'✗ E1 '),
  ('BV-BAN-GOC-QUAY-LAI', [(DL, SO_GOC + '  const dich =', '  const dich =', 1)], r'✗ E4 '),
  ('BV-CHI-MUC-MOT', [(NC, "  'CREATE UNIQUE INDEX IF NOT EXISTS nd_ban_mot_dang_chay ON nd_ban (dang_chay) WHERE dang_chay = 1',\n", '', 1)], r'✗ B3 '),
  # ── quyền + vé (F, G) ──
  ('VS-QUYEN-VE', [(XT, "    if (!(await cauNoi.coQuyen(u.role, quyen))) return guiLoi(res, 'KHONG_DU_QUYEN');\n",
                    "    if (!(jwt.decode(ve).quyen || []).includes(quyen)) return guiLoi(res, 'KHONG_DU_QUYEN');\n", 1),
                   (XT, 'jwt.sign({ nd: u.id }', 'jwt.sign({ nd: u.id, quyen }', 1)], r'✗ F3'),
  ('BV-IS-ACTIVE', [(XT, "    if (!u || !Number(u.is_active)) return guiLoi(res, 'CHUA_DANG_NHAP');\n", "    if (!u) return guiLoi(res, 'CHUA_DANG_NHAP');\n", 1)], r'✗ F4 '),
  ('VS-GIEO-MANAGER', [(NC, "[['owner', 1], ['manager', 0], ['staff', 0]]", "[['owner', 1], ['manager', 1], ['staff', 0]]", 1)], r'✗ F2 '),
  ('BV-NHOM-QUYEN', [(US, "label: 'Xem Chế độ sửa App', nhom: 'App khách hàng — nội dung' }", "label: 'Xem Chế độ sửa App' }", 1)], r'✗ F1 '),
  ('BV-DUONG-LUU-QUYEN', [(API, "api.put(`/users/permissions/${role}`", "api.put(`/permissions/${role}`", 1)], r'✗ F3a '),
  ('VS-KHOA-CHUNG', [(XT, 'const khoa = () => T.khoaVe(cauNoi.khoaVePos());', 'const khoa = () => cauNoi.khoaVePos();', 1)], r'✗ G2c '),
  ('BV-AUD', [(XT, "jwt.verify(ve, khoa(), { audience: 'nd' })", 'jwt.verify(ve, khoa())', 1)], r'✗ G5 '),
  ('VS-LOI-RIENG-KHOA', [(XT, "  if (!u || !dung || !Number(u.is_active)) return { loi: 'SAI_DANG_NHAP' };\n",
                          "  if (u && !Number(u.is_active)) return { loi: 'CHUA_DANG_NHAP' };\n  if (!u || !dung) return { loi: 'SAI_DANG_NHAP' };\n", 1)], r'✗ G3 '),
  ('VS-NGUONG-6', [(TI, '  sai_toi_da: 5,', '  sai_toi_da: 6,', 1)], r'✗ G4a '),
  ('BV-DEM-IP', [(XT, LO, "  const lo = [`cap:${ten}|${ip}`];\n", 1)], r'✗ G4c '),
  ('BV-DEM-CAP', [(XT, LO, "  const lo = ['ip:' + ip];\n", 1)], r'✗ G4d '),
  ('VS-KHOA-TEN-TOAN-CUC', [(XT, LO, "  const lo = ['ip:' + ip, `cap:${ten}`];\n", 1)], r'✗ G4b '),
  # ── giới hạn (D) ──
  ('VS-KHOA-81', [(TI, '{1,${GIOI_HAN.khoa_toi_da}}', '{1,${GIOI_HAN.khoa_toi_da + 1}}', 1)], r'✗ D1 '),
  ('VS-DEM-KY-TU', [(TI, "const soByte = (obj) => Buffer.byteLength(JSON.stringify(obj), 'utf8');", 'const soByte = (obj) => JSON.stringify(obj).length;', 1)], r'✗ D3 '),
  ('BV-LUU-QUA-LON', [(DL, "  if (T.soByte(gop) > T.GIOI_HAN.ban_toi_da_byte) return { loi: 'QUA_LON' };\n", '', 1)], r'✗ D3 '),
  ('BV-ANH-512', [(DU, 'limits: { fileSize: T.GIOI_HAN.anh_toi_da_byte + 1, files: 1', 'limits: { files: 1', 1)], r'✗ D4 '),
  ('VS-ANH-MULTER-BANG', [(DU, 'fileSize: T.GIOI_HAN.anh_toi_da_byte + 1,', 'fileSize: T.GIOI_HAN.anh_toi_da_byte,', 1)], r'✗ D4 '),
  ('VS-ANH-THEO-TEN', [(DU, 'const loai = req.file ? T.loaiAnh(req.file.buffer) : null;', 'const loai = req.file ? req.file.mimetype : null;', 1)], r'✗ D5 '),
  # ── nhà riêng (A) ──
  ('VS-POS-TRONG-ND', [(DL, "const T = require('./tinh');\n", "const T = require('./tinh');\nconst docDon = () => query('SELECT 1 FROM pos_orders LIMIT 1');\n", 1)], r'✗ A1 '),
  # ── khoá sao lưu (J) ──
  ('VS-KHOA-SAO-LUU-MOI-CUA', [(XT, "      if (!choKhoa) return guiLoi(res, 'KHONG_DU_QUYEN');\n", '', 1)], r'✗ J2 '),
  ('BV-THU-HOI', [(DL, 'WHERE ma_bam = ? AND thu_hoi_luc IS NULL', 'WHERE ma_bam = ?', 1)], r'✗ J3 '),
  ('BV-PIN-KHOA', [(KS, "  if (!(await quaPin(req, res))) return undefined;\n  return res.json({ success: true, ...(await D.taoKhoa",
                    "  return res.json({ success: true, ...(await D.taoKhoa", 1)], r'✗ J4 '),
  # ── xuất / nhập (I) ──
  ('VS-NHAP-DE', [(DL, "  if (Number(dem.n) > 0) return { loi: 'KHO_DA_CO_DU_LIEU' };\n", '', 1)], r'✗ I2 '),
  ('BV-BAN-CHAY-LON-NHAT', [(TI, 'return chay.length === 1 && chay[0].so_ban === Math.max(...ban.map((b) => b.so_ban));', 'return chay.length === 1;', 1)], r'✗ I3 '),
  ('VS-BAN-RONG-CHAN', [(TI, '  if (!ban.length) return true;', '  if (!ban.length) return false;', 1)], r'✗ I4 '),
  ('BV-NHAP-BAN-1MB', [(TI, "    if (soByte(b.gia_tri) > GIOI_HAN.ban_toi_da_byte) return sai('QUA_LON', `Bản ${b.so_ban} quá 1 MB`);\n", '', 1)], r'✗ I3f '),
  ('BV-NHAP-ANH-512', [(TI, "    if (buf.length > GIOI_HAN.anh_toi_da_byte) return sai('QUA_LON', `Ảnh ${a.ma.slice(0, 12)}… quá 500 KB`);\n", '', 1)], r'✗ I3f '),
  ('VS-KHO-TRONG-CHI-BAN', [(DL, 'SELECT (SELECT COUNT(*) FROM nd_ban) + (SELECT COUNT(*) FROM nd_nhap) + (SELECT COUNT(*) FROM nd_anh) AS n',
                             'SELECT (SELECT COUNT(*) FROM nd_ban) AS n', 1)], r'✗ I2b '),
  ('BV-DOIBAN-1MB', [(DL, "  if (T.soByte(giaTri) > T.GIOI_HAN.ban_toi_da_byte) return { loi: 'QUA_LON' };\n", '', 1)], r'✗ D7 '),
  ('VS-GHI-CHU-5000', [(TI, '  ghi_chu_toi_da: 500,', '  ghi_chu_toi_da: 5000,', 1)], r'✗ E2c '),
  ('VS-GHI-CHU-499', [(DU, 'g.length <= T.GIOI_HAN.ghi_chu_toi_da);', 'g.length < T.GIOI_HAN.ghi_chu_toi_da);', 1)], r'✗ E2d '),
  ('BV-GHI-CHU-QUAY-LAI', [(DU, 'if (!Number.isInteger(so) || so < 1 || !T.laSoKhongAm(banGoc) || !ghiChuHopLe(ghiChu)) {',
                            'if (!Number.isInteger(so) || so < 1 || !T.laSoKhongAm(banGoc)) {', 1)], r'✗ E2d '),
  ('BV-NHAP-NHAP-1MB', [(TI, "    return sai('QUA_LON', 'Bản đang chạy cộng các nháp trong tệp quá 1 MB');\n", '', 1)], r'✗ I3h '),
  ('BV-NHAP-NHAP-KHOA', [(TI, "if (!laObject(n) || !khoaHopLe(n.khoa) || khoa.has(n.khoa)", "if (!laObject(n) || khoa.has(n.khoa)", 1)], r'✗ I3h '),
  ('BV-NHAP-ANH-TRUNG', [(TI, '!MAU_MA_ANH.test(a.ma) || ma.has(a.ma) ||', '!MAU_MA_ANH.test(a.ma) ||', 1)], r'✗ I3h '),
  ('BV-NHAP-SOBAN-TRUNG', [(TI, ' || soBan.has(b.so_ban) ||', ' ||', 1)], r'✗ I3h '),
  ('BV-NHATKY-VIEC', [(TI, 'if (!laObject(n) || !VIEC.includes(n.viec) ||', 'if (!laObject(n) ||', 1)], r'✗ I3h '),
  ('BV-NHATKY-NHAP', [(DL, "  await ghiNhatKy(tx, nguoi, 'nhap', dang ? dang.so_ban : 0, du.nhap.length);\n", '', 1)], r'✗ I1d '),
  ('BV-NHATKY-XUAT', [(DU, '  await D.ghiXuat(req.ndNguoi);\n', '', 1)], r'✗ I1d '),
  ('BV-BOC-LOI-ND', [(BK, "        dong = [{ phan: 0, du_lieu: '', loi: 'Chưa xuất được nội dung App — tải bản sao ở /admin › Xuất toàn bộ, hoặc thử lại sau' }];\n",
                      '        throw err;\n', 1)], r'✗ K4 '),
  ('VS-XUAT-KHONG-DOC-LAI', [(DL, 'for (let lan = 0; lan < 3; lan++) {', 'for (let lan = 0; lan < 1; lan++) {', 1)], r'✗ X1 '),
  ('BV-XUAT-THROW', [(DL, "  if (!T.banChayDung(ban)) throw new Error('xuất: bản đang chạy đổi liên tục — thử lại');\n", '', 1)], r'✗ X2 '),
  ('BV-NO-STORE', [(DU, "  res.set('Cache-Control', 'no-store');\n", '', 1)], r'✗ C2 '),
  ('VS-TEN-KHOA-61', [(KS, '!ten || ten.length > 60)', '!ten || ten.length > 61)', 1)], r'✗ J1b '),
  ('VS-TEN-DN-101', [(DU, 'ten.length > 100 ||', 'ten.length > 101 ||', 1)], r'✗ G6 '),
  ('BV-KIEM-KHOA-TRUOC', [(XT, "  if (await D.dangKhoa(lo)) return { loi: 'QUA_NHIEU_LAN' };\n", '', 1)], r'✗ G4f '),
  ('VS-TEN-SO-BAN', [(DL, 'return { so_luong_ban: du.ban.length,', 'return { so_ban: du.ban.length,', 1)], r'✗ I1c '),
  ('BV-HET-KHOA', [(DL, '    WHERE khoa_den IS NULL OR khoa_den <= ?`, [khoa,', '    WHERE khoa_den IS NULL AND ? IS NOT NULL`, [khoa,', 1)], r'✗ G4e '),
  ('VS-SAO-LUU-BO-ANH', [(DL, 'ban, nhap: await dsNhap(), anh, nhat_ky: nhatKy };', 'ban, nhap: await dsNhap(), anh: [], nhat_ky: nhatKy };', 1)], r'✗ (C1b|I1) '),
  # ── sao lưu Excel + dọn thử (K) ──
  ('BV-TRANG-ND', [(BK, '    if (co.some((x) => x.nd)) {', '    if (false) {', 1)], r'✗ K1 '),
  ('VS-ND-THO-EXCEL', [(BK, '    for (const t of co.filter((x) => !x.nd)) {', '    for (const t of co) {', 1)], r'✗ K1 '),
  ('BV-LOC-ND-KHOI-PHUC', [(BK, 'lapKeHoach(wb, BANG_KHOI_PHUC)', 'lapKeHoach(wb, BACKUP_TABLES)', 2)], r'✗ K2 '),
  ('BV-ND-DON-THU', [(DT, "\n  'nd_ban', 'nd_nhap', 'nd_anh', 'nd_nhat_ky', 'nd_khoa_sao_luu', 'nd_lan_sai'];", '\n];', 1)], r'✗ K3 '),
  # ── giao diện (S) ──
  ('BV-THE-CHI-CHU-QUAN', [(ST, "{theTrongNhom.includes('appKh') && isAdmin && (", "{theTrongNhom.includes('appKh') && (", 1)], r'✗ S1 '),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_ndapi1_')
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


def lenh(tmp):
  return ['node', os.path.join(GOC, 'cong_cu', 'thu_NDAPI1.js'), '--goc', tmp]


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    if any('sập' in l for l in hong):
      return ten, 'LẠC', 'một đoạn bài sập: ' + ' | '.join(l[:100] for l in hong if 'sập' in l)
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
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bài HIỆN TẠI với server/ + client/src/ của commit `sha` (git archive, bản chép thật)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_ndapi1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l))
    print(f'GỐC {sha} · thu_NDAPI1.js: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    chay_goc(sys.argv[sys.argv.index('--goc') + 1]); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
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
