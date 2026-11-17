#!/usr/bin/env python3
"""KET-NOI-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KET-NOI-1/dot_bien.py [tên...]                  (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KET-NOI-1/dot_bien.py --liet-ke                  (chỉ in danh sách)
    python3 viec/KET-NOI-1/dot_bien.py --goc <sha> [--bai <file>] (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)
    python3 viec/KET-NOI-1/dot_bien.py --cay-goc <sha> --bai <file> (như cổng A11: cả cây gốc không .git + bài hiện tại)

Khuôn viec/KH-NAP-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_KETNOI1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2) hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_KETNOI1.js'
DB, IX, GC = 'server/database.js', 'server/index.js', 'server/utils/giuCho.js'
TT, W, NC = 'server/routes/thanh-toan.js', 'server/routes/wallets.js', 'server/nang_cap/029_ket_noi.js'
API, TI = 'client/src/utils/api.js', 'client/src/pages/BanHang/tinh.js'
BH, THU = 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/BanHang/ThuTien.jsx'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: đọc tự thử lại (database.js) ──
  ('BV-DOC-THU-LAI', [(DB, 'const conLuot = doc && lan < CHO_DOC_MS.length;', 'const conLuot = false;', 1)], r'✗ A1a'),
  ('VS-THU-LAI-BA', [(DB, 'const CHO_DOC_MS = [200, 600];', 'const CHO_DOC_MS = [200, 600, 100];', 1)], r'✗ A1c'),
  ('VS-THU-LAI-GHI', [(DB, 'const doc = laCauDoc(sql);', 'const doc = true;', 1)], r'✗ A2b'),
  ('VS-CAU-DOC-CHUA-TU', [(DB, r"return /^select\b/i.test(s) || (/^with\b/i.test(s) && !/\b(insert|update|delete|replace)\b/i.test(s));",
                          r"return /^(select|with)\b/i.test(s) && !/\b(insert|update|delete|replace)\b/i.test(s);", 1)], r'✗ A2d'),
  ('VS-MANG-RONG', [(DB, 'function laLoiMang(err) {\n  if (!err) return false;', 'function laLoiMang(err) {\n  if (err) return true;', 1)], r'✗ A3'),
  ('VS-MANG-BO-FETCHERROR', [(DB, "(err.name === 'FetchError' && err.type === 'system') || ", '', 1)], r'✗ A1e'),
  ('VS-MANG-BO-CAUSE', [(DB, ' || MA_MANG.has(goc.code)', '', 1)], r'✗ A1f'),
  ('VS-LOI-GIU-CAUSE', [(DB, 'Object.assign(new Error(LOI_KHO[kieu]), {', 'Object.assign(new Error(LOI_KHO[kieu], { cause: err }), {', 1)], r'✗ A1c lỗi ném ra'),
  ('BV-CAU-GHI', [(DB, "throw loiKho(err, doc ? 'doc' : 'ghi');", "throw loiKho(err, 'doc');", 1)], r'✗ A2b'),
  ('BV-RUN-DOI-LOI', [(DB, '    if (laLoiMang(err)) {   // KET-NOI-1: câu ghi KHÔNG gửi lại', '    if (false) {   // KET-NOI-1: câu ghi KHÔNG gửi lại', 1)], r'✗ A2a'),
  ('BV-TX-DOI-LOI', [(DB, 'if (tx) return doCau(() => tx.execute(cau)).catch(nemLoiGhi);', 'if (tx) return doCau(() => tx.execute(cau));', 1)], r'✗ C2c câu GHI thứ hai'),
  ('BV-TX-CAU-DAU-DOI-LOI', [(DB, 'if (!laLoiBan(err)) nemLoiGhi(err);', 'if (!laLoiBan(err)) throw err;', 1)], r'✗ C2c2'),
  ('BV-COMMIT-DOI-LOI', [(DB, 'await doCau(() => tx.commit()).catch(nemLoiGhi);', 'await doCau(() => tx.commit());', 1)], r'✗ B4a kho ghi phiên'),
  ('BV-LOG-DEM', [(DB, '  demRot.rot++;\n', '', 1)], r'✗ A4b'),
  # ── B: mã lượt bấm + chốt lại (giuCho.js, thanh-toan.js, 029) ──
  ('BV-MA-GUI-NHANH', [(GC, '  if (daCo) return daCo;\n', '', 1)], r'✗ B1i'),
  ('BV-MA-GUI-TRONG-GD', [(GC, '    if (daCoTx) return { huy: true, ...daCoTx };\n', '', 1)], r'✗ B1f3'),
  ('VS-MA-GUI-BO-SO-THAN', [(GC, 'if (p.than !== thanDon || p.cach', 'if (p.cach', 1)], r'✗ B1c'),
  ('VS-MA-GUI-BO-TK', [(GC, ' || (p.giu_vi > 0 && !truTK)', '', 1)], r'✗ B1h'),
  ('BV-MA-GUI-QR-DANG-TAO', [(GC, "  if (p.cach === 'payos' && !p.qr) return loi(503, 'DANG_XU_LY', 'Đang tạo mã QR — chờ vài giây');\n", '', 1)], r'✗ B1j phiên QR đang'),
  ('VS-MA-GUI-QR-LOI', [(GC, "  if (tt === 'loi' && p.cach === 'payos') return LOI_QR();\n", '', 1)], r'✗ B1j cổng QR hỏng'),
  ('BV-MA-GUI-DANG', [(GC, ' && MAU_MA_GUI.test(maGui)', '', 1)], r'✗ B1g mã sai dạng'),
  ('BV-029-UNIQUE', [(NC, "CREATE UNIQUE INDEX IF NOT EXISTS ux_phien_ma_gui", "CREATE INDEX IF NOT EXISTS ux_phien_ma_gui", 1)], r'✗ B1k'),
  ('BV-CHOT-LAI', [(GC, 'if (them.lapLai === true && phien.trang_thai', 'if (false && phien.trang_thai', 1)], r'✗ B2a'),
  ('VS-CHOT-LAI-MOI-NGUON', [(GC, 'if (them.lapLai === true && phien.trang_thai', 'if (phien.trang_thai', 1)], r'✗ B2c'),
  ('VS-CHOT-LAI-APP', [(GC, "\n    && !(await queryOne('SELECT 1 AS co FROM pos_don_app WHERE phien_id = ?', [phien.id]))", '', 1)], r'✗ B2e'),
  ('VS-MA-GUI-BO-CACH', [(GC, ' || p.cach !== cach', '', 1)], r'✗ B1c2'),
  ('BV-MA-GUI-TRUNG-KHOA', [(GC, '    if (daCoTrung) return { huy: true, ...daCoTrung };\n', '', 1)], r'✗ B1f2'),
  ('BV-LAP-LAI-ROUTE', [(TT, ', lapLai: true }));', ' }));', 1)], r'✗ B2a'),
  # ── C2: lỗi mạng tới kho → 503 ──
  ('BV-LOIGHI-503', [(W, '  if (traLoiKho(res, err)) return undefined;', '', 1)], r'✗ C2a'),
  ('BV-LOI-KHO-MOC', [(DB, 'if (res.statusCode >= 500 && than && CAU_LOI_KHO.includes(than.error))', 'if (false)', 1)], r'✗ C2b'),
  ('BV-MOC-INDEX', [(IX, "app.use('/api/pos', mocLoiKho);\n", '', 1)], r'✗ G2'),
  ('BV-TRA-LOI-KHO-CUOI', [(IX, '  if (traLoiKho(res, err)) return;   // KET-NOI-1', '  // KET-NOI-1', 1)], r'✗ C2e traLoiKho'),
  ('BV-HEALTH', [(IX, '    ket_noi: demKetNoi(),', '', 1)], r'✗ G1'),
  # ── C1 / B3: quầy api.js ──
  ('BV-API-MAT-KET-NOI', [(API, '    throw loiMatKetNoi();   // không lời gọi', "    throw new Error('Failed to fetch');   // không lời gọi", 1)], r'✗ C1a fetch ném'),
  ('BV-API-PROXY', [(API, '  if (data && data.khong_json && MA_TRANG_PROXY.includes(response.status)) return Object.assign(loiMatKetNoi(), { status: response.status });\n', '', 1)],
   r'✗ (B3b GET gặp trang 502|C1a POST)'),
  ('VS-PROXY-CHI-502', [(API, 'const MA_TRANG_PROXY = [502, 503, 504, 520, 521, 522, 523, 524];', 'const MA_TRANG_PROXY = [502];', 1)], r'✗ B3b trang 503'),
  ('VS-API-POST-THU-LAI', [(API, "(options.method || 'GET') === 'GET' ? 'mang' : false", "'mang'", 1)], r'✗ C1b POST'),
  ('BV-API-GET-THU-LAI', [(API, "(options.method || 'GET') === 'GET' ? 'mang' : false", 'false', 1)], r'✗ C1b GET'),
  ('BV-API-PHIEN-THU-LAI', [(API, "taoPhien: (data) => api.post('/thanh-toan/phien', data, { thuLai: 'co_ma' }),", "taoPhien: (data) => api.post('/thanh-toan/phien', data),", 1)], r'✗ B3a'),
  ('BV-API-CHOT-THU-LAI', [(API, "api.post(`/thanh-toan/phien/${id}/chot`, data, { thuLai: 'co_ma' }),", "api.post(`/thanh-toan/phien/${id}/chot`, data),", 1)], r'✗ B4b'),
  ('VS-NEN-GUI-LAI-BO-KHO-BAN', [(API, "const MA_GUI_LAI_CO_MA = ['DANG_XU_LY', 'KHO_BAN'];", "const MA_GUI_LAI_CO_MA = ['DANG_XU_LY'];", 1)], r'✗ B3c chotPhien'),
  ('VS-NEN-GUI-LAI-MOI-MA', [(API, "(thuLai === 'co_ma' && MA_GUI_LAI_CO_MA.includes(err?.code))", "MA_GUI_LAI_CO_MA.includes(err?.code)", 1)], r'✗ B3c GET'),
  ('BV-API-TINH-THU', [(API, "api.post('/orders/tinh-thu', data, { thuLai: 'mang' })", "api.post('/orders/tinh-thu', data)", 1)], r'✗ C1 ngoại lệ'),
  ('BV-GOI-FETCH-UPLOAD', [(API, "const response = await goiFetch(url, {\n      method: 'POST',", "const response = await fetch(url, {\n      method: 'POST',", 1)], r'✗ C1c'),
  # ── E / B5: màn Bán hàng ──
  ('BV-NUT-0D', [(THU, "      {nhanh === 'cho' ? null : nhanh === 'het' ? (", "      {nhanh === 'het' || nhanh === 'cho' ? (", 1)], r'✗ E1a ThuTien'),
  ('VS-NHANH-NUT', [(TI, "  if (!coSo) return 'cho';\n", '', 1)], r'✗ E1a'),
  ('BV-LOI-TINH', [(TI, "laMatKetNoi(e) ? 'Mất kết nối, bấm Thử lại' : e?.message", "false ? '' : e?.message", 1)], r'✗ E2a'),
  ('BV-HUY-409-HOI-LAI', [(TI, "  const lan2 = await daThu();\n  return lan2.xong ? { viec: 'xong', phien: lan2.p } : { viec: 'bao_chua_biet' };", "  return { viec: 'bao_loi' };", 1)],
   r'✗ B3d xuLyThuHong \(soát'),
  ('VS-HUY-MOI-TRANG-THAI', [(TI, "  if (hanhDongPhien(lan1.p.trang_thai) === 'nha') return { viec: 'bao_loi' };", '', 1)], r'✗ B3d xuLyThuHong \(soát vòng 2'),
  ('VS-HOI-HONG-NHA', [(TI, "  if (!lan1.p) return { viec: 'bao_chua_biet' };\n", '', 1)], r'✗ B3d'),
  ('VS-VIEC-KHONG-PHIEN', [(TI, "if (!phienId) return { viec: chuaBietDaGhi(loi) ? 'bao_chua_biet' : 'bao_loi' };", "if (!phienId) return { viec: 'bao_loi' };", 1)], r'✗ B3d'),
  ('VS-DANG-XU-LY', [(TI, " || e?.code === 'DANG_XU_LY'", '', 1)], r'✗ B3d'),
  ('BV-MA-GUI-THAN', [(TI, '  if (maGui) than.ma_gui = maGui;', '', 1)], r'✗ B5b'),
  ('BV-BH-MA-GUI', [(BH, ',\n        maGui: maGuiMoi() });', ' });', 1)], r'✗ B1/B3 BanHangMoi'),
  ('BV-BH-CAU-B5', [(BH, 'setLoi(CAU_CHUA_BIET_DON);', "setLoi('Mất kết nối khi chốt');", 1)], r'✗ B5a BanHangMoi'),
  # ── vòng sửa 4 (soát vòng 3) — đưa ĐÚNG lỗ cũ trở lại ──
  ('VS-CHO-GUI-KHONG', [(API, 'const CHO_GUI_LAI_MS = [500, 1500];', 'const CHO_GUI_LAI_MS = [0, 0];', 1)], r'✗ B3e'),
  ('BV-LOG-GIAO-DICH', [(DB, "  baoRot(err, 'ghi', 1, 1, 'khong thu lai (giao dich)');\n", '', 1)], r'✗ A4c'),
  ('VS-BH-P-NULL', [(BH, '      const p = phien; phien = null;\n      const { viec', '      const p = null; phien = null;\n      const { viec', 1)], r'✗ B5a BanHangMoi'),
  ('VS-BH-NHANH-B5', [(BH, "else if (viec === 'bao_chua_biet') {", "else if (viec === 'khong_co') {", 1)], r'✗ B5a BanHangMoi'),
  ('BV-THAN-DUT', [(API, '    throw loiMatKetNoi();   // KET-NOI-1: thân trả về đứt', '    return {};   // KET-NOI-1: thân trả về đứt', 1)], r'✗ C1d'),
  # ── F: đo chậm ──
  ('BV-CHAM-CLOSE', [(DB, "res.on('close', () => {", "res.on('finish', () => {", 1)], r'✗ F1 khách bỏ'),
  ('VS-CHAM-BO-QR', [(DB, " || a[i - 1] === 'qr'", '', 1)], r'✗ F1 dòng \[CHAM\]'),
  ('VS-CHO-KHONG', [(DB, 'const CHO_DOC_MS = [200, 600];', 'const CHO_DOC_MS = [0, 0];', 1)], r'✗ A1d'),
  ('VS-MOC-MOI-MA', [(DB, 'if (res.statusCode >= 500 && than && CAU_LOI_KHO', 'if (than && CAU_LOI_KHO', 1)], r'✗ C2d móc'),
  ('BV-CHAM', [(DB, '    if (tong <= NGUONG_CHAM_MS) return;', '    if (tong <= NGUONG_CHAM_MS * 2) return;', 1)], r'✗ F1 yêu cầu 2,15'),
  ('VS-CHAM-NGUONG', [(DB, '    if (tong <= NGUONG_CHAM_MS) return;', '    if (tong <= NGUONG_CHAM_MS - 400) return;', 1)], r'✗ F1 yêu cầu 1,8'),
  ('VS-CHAM-LO-DUONG', [(DB, '${req.method} ${duongLog(req)} ·', '${req.method} ${req.originalUrl} ·', 1)], r'✗ F1 dòng \[CHAM\]'),
  ('BV-DEM-CAU', [(DB, 'if (d) { d.cau++; d.khoMs', 'if (d) { d.khoMs', 1)], r'✗ F1 yêu cầu 2,15'),
  ('BV-NGOAI', [(DB, 'finally { if (d) d.ngoaiMs += Date.now() - t; }', 'finally { /* bỏ */ }', 1)], r'✗ F1 yêu cầu 2,15'),
  ('BV-CHAM-HEALTH', [(DB, '    cham.so_lan++;\n', '', 1)], r'✗ F3'),
  ('BV-DO-HAI-LAN', [(DB, '  if (res.locals.ketNoi) return next();', '', 1)], r'✗ F1 yêu cầu 2,15'),
  ('BV-ND-DO', [(IX, "app.use('/api/nd', doYeuCau);", '', 1)], r'✗ F1 index.js'),
  ('BV-DO-INDEX', [(IX, "app.use('/api', doYeuCau);\n", '', 1)], r'✗ F1 index.js'),
]


def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_ketnoi1_')
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
  tmp = tempfile.mkdtemp(prefix='dotbien_ketnoi1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', ((r.stdout or '') + (r.stderr or '')).strip())
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
    print(f'GỐC {sha} · {bai}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_cay_goc(sha, bai):
  """Như cổng A11: cả cây của commit `sha` (git archive, KHÔNG .git) + chép đè `bai` HIỆN TẠI, chạy `bai` trong cây đó."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_ketnoi1_cay_')
  try:
    tar = subprocess.run(['git', 'archive', sha], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    shutil.copy(os.path.join(GOC, bai), os.path.join(tmp, bai))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    if os.path.isdir(os.path.join(GOC, 'client', 'node_modules')):
      os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))
    r = subprocess.run(['node', bai], cwd=tmp, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', ((r.stdout or '') + (r.stderr or '')).strip())
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
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
  print(f"TỔNG: {len(kq)} đột biến · BẮT {dem['BẮT']} · SỐNG {dem['SỐNG']} · HỎNG {dem['HỎNG']} · LẠC {dem['LẠC']}")
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
