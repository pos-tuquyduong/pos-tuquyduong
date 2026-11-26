#!/usr/bin/env python3
"""KHO-GON-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-GON-1/dot_bien.py [tên...]             (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-GON-1/dot_bien.py --liet-ke             (chỉ in danh sách)
    python3 viec/KHO-GON-1/dot_bien.py --cay-goc <sha>       (bằng chứng ĐỎ như cổng A11: cả cây commit sha + bài thử hiện tại, lần lượt mọi
                                                               cong_cu/thu_*.js đổi so với sha; --bai <file> chỉ một bài)
    python3 viec/KHO-GON-1/dot_bien.py --so-ca <sha>         (in "SỐ CA <bài>: <N>" của mọi bài đổi, chạy trên cây hiện tại)

Khuôn viec/TIEN-KHOA-2/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_KHOGON1.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2 / "Bài thử sập") hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_KHOGON1.js'
V, K, T, R, N = 'server/kho/viec.js', 'server/kho/kiemKe.js', 'server/kho/tinh.js', 'server/kho/duong.js', 'server/nang_cap/033_viec_kho.js'
IDX = 'client/src/pages/Kho/index.jsx'
NOT_EXISTS = " WHERE NOT EXISTS (SELECT 1 FROM kho_viec WHERE ngay = ? AND mau_id IS NOT NULL)`, [ngay, luc, ngay]);"
CHAN_KK = "  if (await tx.queryOne(\"SELECT 1 FROM kho_phieu WHERE loai = 'KK' AND id > ? LIMIT 1\", [m])) return"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A3: sinh việc một lần / ngày ──
  ('VS-sinh-viec-2-lan', [(V, NOT_EXISTS, "`, [ngay, luc]);", 1),
     (N, "  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_viec_ngay_mau ON kho_viec(ngay, mau_id) WHERE mau_id IS NOT NULL');\n", '', 1)], r'✗ A3[ab] '),
  ('BV-bo-not-exists', [(V, NOT_EXISTS, "`, [ngay, luc]);", 1)], r'✗ A3c '),
  # ── A2: ai thấy gì ──
  ('VS-ca-toi-thay-viec-sang', [(T, "viec.giao === 'tat_ca' || viec.giao === ca;", "viec.giao === 'tat_ca' || viec.giao === 'sang' || viec.giao === ca;", 1)], r'✗ A2f '),
  ('VS-nv-thay-viec-ql', [(T, "  if (viec.giao === 'ql') return false;\n", '', 1)], r'✗ A2d '),
  # ── B1 / B4: quá giờ, xong ──
  ('VS-qua-gio-lech-1', [(T, "String(bayGio).slice(11, 16) > viec.gio_han", "String(bayGio).slice(11, 16) >= viec.gio_han", 1)], r'✗ B1a '),
  ('VS-xong-hai-lan', [(V, "WHERE id = ? AND xong_luc IS NULL', [nguoi, luc, id]", "WHERE id = ?', [nguoi, luc, id]", 1)], r'✗ B4a '),
  ('VS-mo-lai-quan-ly', [(R, "router.post('/viec/:id/mo-lai', CHU_QUAN,", "router.post('/viec/:id/mo-lai', QUAN_LY,", 1)], r'✗ B4b '),
  ('BV-bo-chan-viec-ngoai-phan', [(V, "  if (!tinh.viecHienCho(v, { vaiTro, soCa: (await docCaiDat(tx)).so_ca, ca })) return", "  if (false) return", 1)], r'✗ A2h '),
  # ── B3 / E1: tự xong ──
  ('BV-bo-tu-xong-goi-hang', [(V, "    await tuXong(tx, { nguyenLieuIds:", "    if (0) await tuXong(tx, { nguyenLieuIds:", 1)], r'✗ B3c '),
  ('BV-bo-tu-xong-pha-che', [(V, "    await tuXong(tx, { loai: 'phache', nguoi, luc });\n", '', 1)], r'✗ E1a '),
  ('BV-bo-tu-xong-kiem-ke', [(K, "  await viec.tuXong(tx, { loai: cheDo, nguoi, luc });\n", '', 1)], r'✗ C3b '),
  # ── Q1: kiểm kê đếm mù ──
  ('VS-kiemke-lo-so-may', [(K, "if (cheDo !== 'bangiao') { dong.push(m); continue; }", "if (cheDo !== 'bangiao') { dong.push({ ...m, may: ton }); continue; }", 1)], r'✗ Q1a '),
  ('VS-kiemke-thieu-so-lot', [(K, "(cheDo === 'bangiao' ? soChot : undefined)", "(cheDo === 'bangiao' ? soChot : g.goc)", 1)], r'✗ Q1[bc] '),
  # ── C4 / C6 / D2: ghi chú, dòng lạ, số âm ──
  ('VS-lech-khong-ghi-chu-lot', [(K, "Math.abs(d.lech) > tinh.SAI_SO) && !d.ghi_chu) {", "Math.abs(d.lech) > tinh.SAI_SO) && false) {", 1)], r'✗ C4a '),
  ('VS-ban-giao-chi-so-may', [(K, "if ((Math.abs(d.dc) > tinh.SAI_SO || Math.abs(d.lech) > tinh.SAI_SO) && !d.ghi_chu)", "if (Math.abs(d.dc) > tinh.SAI_SO && !d.ghi_chu)", 1)], r'✗ C4b '),
  ('VS-nv-kiem-ke-ngoai-danh-sach', [(K, "if (!duoc.has(khoaCua(m)) || vao.has(khoaCua(m)))", "if (vao.has(khoaCua(m)))", 1)], r'✗ C6b '),
  ('VS-kiem-ke-so-am-lot', [(K, "    if (thuc < 0 || !Number.isFinite(thuc)) return", "    if (!Number.isFinite(thuc)) return", 1)], r'✗ D2a '),
  # ── C3: bàn giao so với chốt ──
  ('VS-so-voi-may-thay-chot', [(K, "chot: gon(c ? c.chot : ton)", "chot: gon(ton)", 1)], r'✗ C3c '),
  # ── C5: tồn đổi giữa lúc mở và lúc lưu ──
  ('VS-lech-gia-khi-vua-ban', [(K, "goc: hien - await tongDong(tx, m, 'AND p.id > ?', [moc])", "goc: hien", 1)], r'✗ C5a '),
  ('VS-anh-chot-la-so-go', [(K, "chot: gon(d.hien + d.dc)", "chot: gon(d.thuc)", 1)], r'✗ C5b '),
  ('BV-bo-chan-ton-moi-am', [(K, "    if (d.hien + d.dc < -tinh.SAI_SO) return", "    if (false) return", 1)], r'✗ C5e '),
  ('BV-bo-kiem-huy-xen-giua', [(K, "  if (doi) return", "  if (false) return", 1)], r'✗ C5f '),
  ('BV-bo-kiem-moc-sai', [(K, " || m > await docMoc(tx) || ", " || ", 1)], r'✗ C5d '),
  ('BV-bo-chan-hai-nguoi-chot', [(K, CHAN_KK, "  if (false) return", 1)], r'✗ C-đua '),
  # ── D1: quyền chỉnh tay ──
  ('VS-ql-chinh-tay-khi-tat', [(R, "(req.user.role === 'manager' && (await viec.docCaiDat(csdl2)).ql_chinh_tay)", "req.user.role === 'manager'", 1)], r'✗ D1[ad] '),
  ('BV-bo-kiem-quyen-chinh-tay', [(R, "router.post('/chinh-tay', QUAN_LY,", "router.post('/chinh-tay', NHAN_VIEN,", 1),
     (R, "  if (!(await duocChinhTay(tx, req))) return", "  if (false) return", 1)], r'✗ D1[de] '),
  ('VS-chinh-tay-khong-ly-do', [(R, "router.post('/chinh-tay', QUAN_LY, (req, res, next) => (lyDoCua(req) ? next() : thieuLyDo(res)),", "router.post('/chinh-tay', QUAN_LY,", 1)], r'✗ D1h '),
  # ── B5: đã xem theo người ──
  ('VS-chua-xem-chung-nguoi', [(V, "'SELECT den_id FROM kho_dien_bien_xem WHERE nguoi = ?', [nguoi]", "'SELECT MAX(den_id) AS den_id FROM kho_dien_bien_xem', []", 1)], r'✗ B5d '),
  ('VS-da-xem-vuot-id', [(V, "Math.min(Number(denId) || 0, max)", "Number(denId) || 0", 1)], r'✗ B5e '),
  # ── E2: màn ──
  ('BV-bo-tab-viec-dau', [(IDX, "    { ma: 'viec', ten: 'Việc hôm nay', hien: true },\n", '', 1)], r'✗ E2a '),
  ('VS-vong-hoi-thu-hai', [(IDX, "    api.get('/kho/dien-bien/so').then((r) => setSoMoi(r.chua_xem)).catch(() => {});", "", 1)], r'✗ B5f '),
]

def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khogon1_')
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


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
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


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    r = subprocess.run(lenh(tmp), cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = sach((r.stdout or '') + (r.stderr or ''))
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bai_doi(sha):
  ra = subprocess.run(['git', 'diff', '--name-only', '--no-renames', sha, 'HEAD', '--', 'cong_cu'], cwd=GOC, capture_output=True, text=True, check=True).stdout
  return [f for f in ra.split() if re.match(r'^cong_cu/thu_[^/]*\.js$', f) and os.path.exists(os.path.join(GOC, f))]


def so_ca(ra):
  m = re.findall(r'(\d+) đạt · (\d+) hỏng', sach(ra))
  return int(m[-1][0]) + int(m[-1][1]) if m else None


def chay_cay_goc(sha, bai):
  """Như cổng A11: cả cây của commit `sha` (git archive, KHÔNG .git) + chép đè `bai` HIỆN TẠI, chạy `bai` trong cây đó."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_khogon1_cay_')
  try:
    tar = subprocess.run(['git', 'archive', sha], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    shutil.copy(os.path.join(GOC, bai), os.path.join(tmp, bai))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    if os.path.isdir(os.path.join(GOC, 'client', 'node_modules')):
      os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(tmp, 'client', 'node_modules'))
    r = subprocess.run(['node', bai], cwd=tmp, capture_output=True, text=True, timeout=300)
    ra = sach(((r.stdout or '') + (r.stderr or '')).strip())
    dong = [l.strip() for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l.lower() or 'Cannot find module' in l]
    print(f'== CÂY GỐC {sha} · {bai}: thoát {r.returncode}')
    for l in dong[:6]: print('   ' + l[:200])
    if len(dong) > 6: print(f'   … (+{len(dong) - 6} dòng)')
  except subprocess.TimeoutExpired:
    print(f'== CÂY GỐC {sha} · {bai}: QUÁ GIỜ 300 s')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--cay-goc' in sys.argv:
    sha = sys.argv[sys.argv.index('--cay-goc') + 1]
    ds = [sys.argv[sys.argv.index('--bai') + 1]] if '--bai' in sys.argv else bai_doi(sha)
    for b in ds: chay_cay_goc(sha, b)
    sys.exit(0)
  if '--so-ca' in sys.argv:
    for b in bai_doi(sys.argv[sys.argv.index('--so-ca') + 1]):
      r = subprocess.run(['node', b], cwd=GOC, capture_output=True, text=True, timeout=600)
      print(f'SỐ CA {b}: {so_ca((r.stdout or "") + (r.stderr or ""))}' + ('' if r.returncode == 0 else f'   (thoát {r.returncode})'))
    sys.exit(0)
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
