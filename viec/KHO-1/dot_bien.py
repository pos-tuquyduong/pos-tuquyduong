#!/usr/bin/env python3
"""KHO-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/KHO-1/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ của commit sha)
    python3 viec/KHO-1/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/DOI-SOAT-1/dot_bien.py: chép server/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_KHO1.js --may-chu <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 (bài sập) hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
T, D, N, L, C, B, DB, B1 = ('server/kho/tinh.js', 'server/kho/duong.js', 'server/kho/nhapSx.js', 'server/kho/duLieu.js',
                            'server/nang_cap/chay.js', 'server/routes/backup.js', 'server/database.js', 'server/nang_cap/001_kho.js')

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── E: công thức, vòng lặp ──
  ('VS-VONG-CHI-TU-THAN', [(T, '} else if (duong.includes(d.thanh_phan_id)) {', '} else if (d.thanh_phan_id === congThuc.goc && duong.length === 1) {', 1)], r'✗ (E4|E14)'),
  ('BV-VONG-PUT', [(D, '        tinh.trienKhai({ goc: spId, bang }, 1);\n', '        void bang;\n', 1)], r'✗ E1[34]'),
  ('VS-TRIEN-KHAI-MOT-TANG', [(T, '        di(d.thanh_phan_id, he * d.luong, [...duong, d.thanh_phan_id]);', '        tong.set(d.thanh_phan_id, (tong.get(d.thanh_phan_id) || 0) + he * d.luong);', 1)], r'✗ E1 '),
  ('VS-GOP-BO-DAU', [(T, ".normalize('NFC').trim()", ".normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim()", 1)], r'✗ E7'),
  ('VS-TEN-TRUNG-500', [(D, '(tinh.laTrungKhoa(e) ? tenTrung(res) : loiGhi(res, e))', 'loiGhi(res, e)', 1)], r'✗ I[45]'),
  # ── B: nâng cấp dữ liệu ──
  ('BV-NANG-CAP-GOI', [(DB, "  nangCapHong = (await require('./nang_cap/chay').chayNangCap({ beginTransaction, query })).hong;\n", '', 1)], r'✗ B1'),
  ('VS-BO-KHOA-CHAY-DOI', [(C, "'INSERT INTO pos_nang_cap (so, ten, luc)", "'INSERT OR IGNORE INTO pos_nang_cap (so, ten, luc)", 1)], r'✗ B8'),
  ('BV-ROLLBACK-BUOC-HONG', [(C, '      await tx.rollback();\n      return { hong:', '      await tx.commit();\n      return { hong:', 1)], r'✗ B[34]'),
  ('BV-DUNG-KHI-HONG', [(C, '      return { hong: `${ten}: ${e.message}` };', '      continue;', 1)], r'✗ B[34]'),
  ('BV-SAO-LUU', [(C, 'if (Number(dong.n) > 0) await tx.run(', 'if (false) await tx.run(', 1)], r'✗ B5'),
  ('VS-SAO-LUU-MOI-BANG', [(C, 'if (Number(dong.n) > 0) await tx.run(', 'if (Number(dong.n) >= 0) await tx.run(', 1)], r'✗ B6'),
  ('BV-503', [(D, '  if (hong) return res.status(503)', '  if (false) return res.status(503)', 1)], r'✗ B9'),
  ('VS-CHECK-KIEU', [(B1, "    kieu TEXT NOT NULL CHECK (kieu IN ('pha_tai_cho', 'lam_san', 'chua_dinh_luong')),", '    kieu TEXT NOT NULL,', 1)], r'✗ C2'),
  # ── F/G: nhập SX ──
  ('VS-NHAP-GHI-DE', [(N, '.filter((g) => !daCoNL.has(g.ten_chuan) && !daCoSx.has(g.sx_id))', '.filter(() => true)', 1),
                      (N, 'INSERT OR IGNORE INTO kho_nguyen_lieu', 'INSERT OR REPLACE INTO kho_nguyen_lieu', 1)], r'✗ F1[56]'),
  ('BV-CONG-THUC-DA-CO', [(N, 'const ghiCT = dong.size > 0 && !(sp && hienCo.co_cong_thuc.map(Number).includes(Number(sp.id)));', 'const ghiCT = dong.size > 0;', 1)], r'✗ F1[56]'),
  ('BV-TRUNG-MA', [(N, '    if (!sp && hienCo.san_pham.some((p) => p.code === m.code)) {', '    if (false) {', 1)], r'✗ F[12] '),
  ('VS-MON-TAO-HIEN', [(N, 'VALUES (?, ?, ?, 0, ?, 0, ?, ?)', 'VALUES (?, ?, ?, 0, ?, 1, ?, ?)', 1)], r'✗ (F9|K1)'),
  ('VS-GIA-NHO', [(N, 'const gia = Number(n.price) >= GIA_TOI_THIEU ? Number(n.price) : null;', 'const gia = Number(n.price) > 0 ? Number(n.price) : null;', 1)], r'✗ F5'),
  ('VS-GOP-GIA-DAU', [(N, 'gia_nhap: lon(g.gia_nhap, gia)', 'gia_nhap: g.gia_nhap ?? gia', 1)], r'✗ G2'),
  ('VS-LAM-TRON', [(N, 'luong: lamTron6(luong)', 'luong', 1)], r'✗ G4'),
  ('VS-SX-THEO-LEGACY', [(N, 'ten: r.name, dong: dongCua(r.id) });\n      }\n    } else {', 'ten: r.name, dong: dongCua(r.legacy_id) });\n      }\n    } else {', 1)], r'✗ G5'),
  ('BV-XOA-FILE-TAM', [(D, '    if (req.file) fs.rmSync(req.file.path, { force: true });', '    void fs;', 1)], r'✗ F14'),
  ('BV-QUYEN-NHAP', [(D, "router.post('/nhap-sx', CHU_QUAN,", "router.post('/nhap-sx', QUAN_LY,", 1)], r'✗ F19'),
  # ── I: quyền + xoá ──
  ('BV-QUYEN-CONG-THUC', [(D, "router.put('/san-pham/:id', CHU_QUAN,", "router.put('/san-pham/:id', QUAN_LY,", 1)], r'✗ I15'),
  ('VS-QUYEN-SUA-NL', [(D, "router.post('/nguyen-lieu', QUAN_LY,", "router.post('/nguyen-lieu',", 1)], r'✗ I2'),
  ('BV-XOA-KIEM-DUNG', [(L, '  AND NOT EXISTS (SELECT 1 FROM kho_cong_thuc WHERE nguyen_lieu_id = ?)', '  AND ? IS NOT NULL', 1)], r'✗ I8'),
  # ── J: sao lưu / khôi phục ──
  ('BV-SAO-LUU-BANG', [(B, "  { name: 'kho_nguyen_lieu', label: 'Kho - Nguyên liệu', key: 'id' },\n", '', 1)], r'✗ J[125]'),
  ('BV-KHOI-PHUC-KHO', [(B, "(tableDef.name.startsWith('kho_') && !khoTrong)", 'false', 1)], r'✗ J3'),
  ('BV-KHOI-PHUC-NANG-CAP', [(B, "if (tableDef.name === 'pos_nang_cap' || ", 'if (', 1)], r'✗ J4'),
]


def ban_sao(thay):
  """Chép server/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_kho1_')
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
  return subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_KHO1.js'), '--may-chu', os.path.join(tmp, 'server')],
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
  tmp = tempfile.mkdtemp(prefix='dotbien_kho1_goc_')
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
