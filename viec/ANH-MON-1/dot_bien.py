#!/usr/bin/env python3
"""ANH-MON-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/ANH-MON-1/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG — bản chưa đột biến — trước)
    python3 viec/ANH-MON-1/dot_bien.py --liet-ke
    python3 viec/ANH-MON-1/dot_bien.py --goc <sha>   (bằng chứng ĐỎ: chép server/ + client/src/ của commit <sha> + bài thử HIỆN TẠI, chạy)

Khuôn viec/TIEN-KHOA-2/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_ANHMON1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2 / "Bài thử sập") hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_ANHMON1.js'
P, K, D = 'server/routes/products.js', 'server/routes/kh/index.js', 'server/kho/duong.js'
A, T = 'server/utils/anhMon.js', 'server/nd/tinh.js'
BH, AM = 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/BanHang/AnhMon.jsx'
SP = 'client/src/pages/Kho/SanPham.jsx'
KM, TM, BK = 'client/src/pages/BanHang/KhungChonMon.jsx', 'client/src/pages/Kho/ToppingMon.jsx', 'server/routes/backup.js'
SL = 'cong_cu/thu_SAOLUU2.js'   # đột biến backup.js chạy bài của SAOLUU-2 (tuple có phần tử thứ 4 = bài thử)

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗ [, bài thử — mặc định BAI])
DOT_BIEN = [
  # ── kiểm kiểu THẬT bằng byte ──
  ('VS-anh-tin-duoi', [(P, "const kieu = Buffer.isBuffer(req.body) ? loaiAnh(req.body) : null;",
     "const kieu = Buffer.isBuffer(req.body) ? String(req.get('content-type') || '').split(';')[0] : null;", 1)], r'✗ B1 '),
  ('VS-anh-webp-chi-RIFF', [(T, " && buf.toString('latin1', 8, 12) === 'WEBP'", '', 1)], r'✗ B3 '),
  ('VS-anh-jpeg-hai-byte', [(T, 'buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF', 'buf[0] === 0xFF && buf[1] === 0xD8', 1)], r'✗ B11 '),
  # ── giới hạn 120 KB ──
  ('VS-anh-khong-gioi-han', [(A, 'const GIOI_HAN_ANH = 120 * 1024;', 'const GIOI_HAN_ANH = 64 * 1024 * 1024;', 1)], r'✗ C[2345] '),
  ('VS-anh-gioi-han-thap-mot', [(A, 'const GIOI_HAN_ANH = 120 * 1024;', 'const GIOI_HAN_ANH = 120 * 1024 - 1;', 1)], r'✗ C1 '),
  ('VS-anh-413-xoa-anh-cu', [(P, "  if (e.type === 'entity.too.large') return res.status(413)",
     "  if (e.type === 'entity.too.large') run('DELETE FROM pos_anh_mon WHERE product_id = ?', [Number(req.params.id)]);\n  if (e.type === 'entity.too.large') return res.status(413)", 1)], r'✗ C3 '),
  # ── quyền ──
  ('BV-bo-kiem-quyen-anh', [(P, "router.put('/:id/anh', authenticate, checkPermission('manage_settings'), nhanAnh,", "router.put('/:id/anh', nhanAnh,", 1)], r'✗ D[12] '),
  ('BV-bo-kiem-quyen-xoa-anh', [(P, "router.delete('/:id/anh', authenticate, checkPermission('manage_settings'),", "router.delete('/:id/anh',", 1)], r'✗ D[34] '),
  ('VS-anh-quyen-chi-xac-thuc', [(P, "router.put('/:id/anh', authenticate, checkPermission('manage_settings'), nhanAnh,", "router.put('/:id/anh', authenticate, nhanAnh,", 1)], r'✗ D1 '),
  # ── một ảnh / món, phiên bản đường dẫn ──
  ('VS-anh-ten-co-dinh', [(P, ".digest('hex').slice(0, DO_DAI_PHIEN_BAN);", ".digest('hex').slice(0, 0) + 'abcdef012345';", 1)], r'✗ E2 '),
  ('VS-anh-doc-khong-kiem-pb', [(P, "WHERE product_id = ? AND phien_ban = ?', [Number(id), phienBan]", "WHERE product_id = ?', [Number(id)]", 1)], r'✗ E3 '),
  ('VS-anh-them-hang-moi', [(P, " ON CONFLICT(product_id) DO UPDATE SET", " ON CONFLICT(product_id) DO NOTHING -- ", 1)], r'✗ E[1-7] '),
  ('VS-anh-xoa-khong-xoa', [(P, "'DELETE FROM pos_anh_mon WHERE product_id = ?', [Number(req.params.id)]);\n    res.json", "'SELECT 1 FROM pos_anh_mon WHERE product_id = ?', [Number(req.params.id)]);\n    res.json", 1)], r'✗ E8 '),
  # ── menu ──
  ('BV-anh-menu-null', [(P, 'anh: anhMon.get(p.id) ?? null,', 'anh: null,', 1)], r'✗ (A8|F3) '),
  ('BV-kh-anh-cung-null', [(K, 'anh: p.anh ?? null,', 'anh: null,', 1)], r'✗ A7 '),
  ('VS-anh-menu-chet-theo-anh', [(A, "    console.error('docAnhMon (menu vẫn trả, không ảnh):', e.message);\n    return new Map();", "    throw e;", 1)], r'✗ F[67] '),
  ('VS-kho-san-pham-khong-anh', [(D, "({ ...p, anh: anh.get(p.id) ?? null })", "({ ...p })", 1)], r'✗ F[45] '),
  # ── giao diện ──
  ('BV-the-mon-khong-anh', [(BH, '                <AnhMon anh={s.anh} ten={s.name} kich={48} />\n', '', 1)], r'✗ H5 '),
  ('BV-dong-gio-khong-anh', [(BH, '              <AnhMon anh={anhTheoId.get(d.product_id)} ten={d.product_name} kich={36} />\n', '', 1)], r'✗ H5 '),
  ('VS-AnhMon-luon-chu', [(AM, 'const coAnh = !!anh && hong !== anh;', 'const coAnh = false;', 1)], r'✗ H7 '),
  ('VS-AnhMon-khong-lazy', [(AM, ' loading="lazy"', '', 1)], r'✗ H4 '),
  ('BV-SanPham-bo-xoa-anh', [(SP, "{anh && <button className=\"btn btn-outline\" disabled={dang} onClick={xoa}>Xoá ảnh</button>}\n", '', 1)], r'✗ H2 '),
  ('BV-topping-khung-khong-anh', [(KM, '<AnhMon anh={t.anh} ten={t.name} kich={40} />', '<span>{t.name[0]}</span>', 1)], r'✗ H1[12] '),
  ('VS-topping-khung-anh-sai-truong', [(KM, '<AnhMon anh={t.anh} ten={t.name} kich={40} />', '<AnhMon anh={sp.anh} ten={t.name} kich={40} />', 1)], r'✗ H1[12] '),
  ('BV-topping-kho-khong-anh', [(TM, '          <AnhMon anh={t.anh} ten={t.name} kich={32} />\n', '', 1)], r'✗ H14 '),
  # ── A5: bảng ảnh cố ý không xuất Excel (bài thử của SAOLUU-2 — D2c / D2e) ──
  ('BV-saoluu-bo-danh-sach-mien', [(BK, "const BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon'];", 'const BANG_KHONG_XUAT_EXCEL = [];', 1)], r'✗ D2[ce] ', SL),
  ('VS-saoluu-mien-them-bang-khac', [(BK, "const BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon'];", "const BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon', 'kho_lo'];", 1)], r'✗ D2e ', SL),
  ('VS-saoluu-mien-chi-trong-chu-thich', [(BK, "const BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon'];", "// const BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon'];", 1)], r'✗ D2[ce] ', SL),
  ('VS-SanPham-chat-luong-1', [(SP, 'const CHAT_LUONG_ANH = 0.7;', 'const CHAT_LUONG_ANH = 1;', 1)], r'✗ H1 '),
]


def ban_sao(thay, goc_sha=None):
  """Chép server/ + client/src/ (bản hiện tại, hoặc của commit goc_sha) ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_anhmon1_')
  if goc_sha:
    ra = subprocess.run(['git', 'archive', goc_sha, 'server', 'client/src'], cwd=GOC, capture_output=True, check=True).stdout
    subprocess.run(['tar', '-x', '-C', tmp], input=ra, check=True)
  else:
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


def sach(ra):
  return re.sub(r'\x1b\[[0-9;]*m', '', ra)


def chay(ten, thay, mau, bai=BAI):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = sach((r.stdout or '') + (r.stderr or ''))
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


def doi_chung(bai=BAI):
  tmp, _ = ban_sao([])
  try:
    r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = sach((r.stdout or '') + (r.stderr or ''))
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    sha = sys.argv[sys.argv.index('--goc') + 1]   # [--bai cong_cu/thu_X.js] đổi bài thử (mặc định thu_ANHMON1)
    bai = sys.argv[sys.argv.index('--bai') + 1] if '--bai' in sys.argv else BAI
    tmp, loi = ban_sao([], sha)
    try:
      r = subprocess.run(lenh(tmp, bai), cwd=GOC, capture_output=True, text=True, timeout=300)
      ra = sach((r.stdout or '') + (r.stderr or ''))
      for l in ra.splitlines():
        if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng', l): print(l.rstrip()[:200])
      print(f'THOÁT {r.returncode} (trên cây {sha})')
    finally:
      shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  for b in dict.fromkeys(d[3] if len(d) > 3 else BAI for d in ds):
    ok, dong = doi_chung(b)
    print(f'ĐỐI CHỨNG {b} (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
    if not ok:
      sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f"TỔNG: {len(kq)} đột biến · BẮT {dem['BẮT']} · SỐNG {dem['SỐNG']} · HỎNG {dem['HỎNG']} · LẠC {dem['LẠC']}")
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
