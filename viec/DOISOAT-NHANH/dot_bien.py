#!/usr/bin/env python3
"""DOISOAT-NHANH — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/DOISOAT-NHANH/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/DOISOAT-NHANH/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/GIAO-3/dot_bien.py: chép server/, cong_cu/gia_lap/, client/src/ và bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối
symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Bài thử có ca đo thời gian → chạy TỪNG đột biến một (không song song — K3: ca thời gian không chạy chung đợt nặng).
"""
import os, re, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB, DS, RP = 'server/database.js', 'server/utils/doiSoat.js', 'server/routes/reports.js'
BAI = {'dsn': 'cong_cu/thu_DOISOATNHANH.js', 'kn1': 'cong_cu/thu_KETNOI1.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A2: đang chờ ──
  ('BV-dang-cho-log', 'dsn', [(DB, " · đang chờ ${d.cho} câu`);", "`);", 1)], r'✗ A2 câu kho không trả lời'),
  ('VS-dang-cho-chi-khi-xong', 'dsn', [(DB, "try { return await lam(); } finally { if (d) { d.cau++; d.cho--; d.khoMs += Date.now() - t; } }",
    "try { const kq = await lam(); if (d) d.cho--; return kq; } finally { if (d) { d.cau++; d.khoMs += Date.now() - t; } }", 1)], r'✗ A2 câu kho ném lỗi'),
  ('BV-dang-cho-kn1', 'kn1', [(DB, " · đang chờ ${d.cho} câu`);", "`);", 1)], r'✗ F1 yêu cầu 2,15 giây'),
  # ── B1: hạn mỗi câu (database.js) — BV đưa lỗi cũ (treo mãi) trở lại (C2) ──
  ('BV-han-cau', 'dsn', [(DB, "const result = await (han ? coHan(viec, ms) : viec);", "const result = await viec;", 1)], r'✗ C1 \(1\)'),
  ('VS-qua-han-khong-doc-lai', 'dsn', [(DB, "(!quaHan || han.het - Date.now() > CHO_DOC_MS[lan])", "!quaHan", 1)], r'✗ B1 đọc lại đúng luật'),
  ('VS-qua-han-thanh-mat-ket-noi', 'dsn', [(DB, "throw quaHan ? err : loiKho(err, doc ? 'doc' : 'ghi');", "throw loiKho(err, doc ? 'doc' : 'ghi');", 1)], r'✗ B1 → lỗi 503'),
  ('VS-han-mac-dinh-moi-duong', 'dsn', [(DB, "async function query(sql, params = [], han = null) {", "async function query(sql, params = [], han = { ms: 300, het: Infinity }) {", 1)], r'✗ D2 query thường'),
  # ── B2: mốc cả lượt ──
  ('VS-han-khong-moc', 'dsn', [(DB, "const ms = han ? Math.min(han.ms, han.het - Date.now()) : 0;", "const ms = han ? han.ms : 0;", 1)], r'✗ B2 lượt dài hơn hạn tổng'),
  ('VS-luot-khong-moc', 'dsn', [(DS, "{ ms: HAN.CAU_DOI_SOAT_MS, het: l.het }", "{ ms: HAN.CAU_DOI_SOAT_MS, het: Infinity }", 1)], r'✗ B2 lượt dài hơn hạn tổng'),
  ('VS-hang-so-cau', 'dsn', [(DS, "CAU_DOI_SOAT_MS: 15000,", "CAU_DOI_SOAT_MS: 20000,", 1)], r'✗ B1 HAN.CAU_DOI_SOAT_MS'),
  ('VS-hang-so-luot', 'dsn', [(DS, "LUOT_DOI_SOAT_MS: 50000 }", "LUOT_DOI_SOAT_MS: 60000 }", 1)], r'✗ B2 HAN.LUOT_DOI_SOAT_MS'),
  # ── B1: lỗi trả cho màn ──
  ('VS-ma-loi-qua-han', 'dsn', [(DS, "loiDS(503, 'DOI_SOAT_QUA_HAN',", "loiDS(503, 'KHO_MAT_KET_NOI',", 1)], r'✗ B1 → lỗi 503'),
  ('VS-loi-sai-buoc', 'dsn', [(DS, "throw err.code === 'KHO_QUA_HAN' ? quaHan(l.buoc, n) : err;", "throw err.code === 'KHO_QUA_HAN' ? quaHan('I8', n) : err;", 1)], r'✗ B1 câu treo ở bước khác \(I9\)'),
  ('BV-log-qua-han', 'dsn', [(DS, "  console.warn(`[DOISOAT] qua_han buoc ${buoc} cau ${n}`);", "", 1)], r'✗ B1 log "\[DOISOAT\] qua_han'),
  # ── A1: log từng bước, đếm theo lượt — BV ngữ cảnh lượt đưa cả lỗi treo cũ trở lại ──
  ('BV-ngu-canh-luot', 'dsn', [(DS, "return luotDS.run(l, () => chayLuot(l, kieu, ky, boBatBien));", "return chayLuot(l, kieu, ky, boBatBien);", 1)], r'✗ A1 ngay: dòng cuối'),
  ('BV-log-bat-dau', 'dsn', [(DS, "  console.log(`[DOISOAT] bat_dau ${kieu} ${ky.tu}`);\n", "", 1)], r'✗ A1 ngay: dòng đầu'),
  ('BV-log-buoc', 'dsn', [(DS, "  console.log(`[DOISOAT] buoc ${ten} · ${Date.now() - t} ms · ${l.cau - c} câu`);\n", "", 1)], r'✗ A1 ngay: mỗi bước'),
  ('BV-buoc-D2', 'dsn', [(DS, "await buoc(l, 'D2', () => ganNhanD2(dong));", "await ganNhanD2(dong);", 1)], r'✗ A1 ngay: mỗi bước'),
  ('BV-buoc-sao-ke', 'dsn', [(DS, "await buoc(l, 'sao_ke', () => chiDoc(", "await (() => chiDoc(", 1)], r'✗ A1 tuan: mỗi bước'),
  # ── B3: dừng khi khách bỏ ──
  ('BV-bo-giua', 'dsn', [(DS, "if (l.tinHieu && l.tinHieu.aborted) {", "if (false) {", 1)], r'✗ B3 log'),
  ('BV-tin-hieu-route', 'dsn', [(RP, ", tinHieu: bo.signal }));", " }));", 1)], r'✗ B3 log'),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_dsn_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  for f in BAI.values():
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tmp, f))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
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
    kq = []
    for bai in BAI:
      ma, ra = chay_bai(tmp, bai)
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      kq.append((ma == 0 and m is not None and m.group(2) == '0', f'{bai}: ' + (m.group(0) if m else ra[-160:])))
    return all(x for x, _ in kq), ' · '.join(d for _, d in kq)
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
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
  kq = [chay(*d) for d in ds]
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
