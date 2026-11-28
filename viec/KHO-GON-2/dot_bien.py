#!/usr/bin/env python3
"""KHO-GON-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-GON-2/dot_bien.py [tên...]             (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-GON-2/dot_bien.py --liet-ke             (chỉ in danh sách)
    python3 viec/KHO-GON-2/dot_bien.py --cay-goc <sha>       (bằng chứng ĐỎ như cổng A11: cả cây commit sha + bài thử hiện tại, lần lượt mọi
                                                               cong_cu/thu_*.js đổi so với sha; --bai <file> chỉ một bài)
    python3 viec/KHO-GON-2/dot_bien.py --so-ca <sha>         (in "SỐ CA <bài>: <N>" của mọi bài đổi, chạy trên cây hiện tại)

Khuôn viec/KHO-GON-1/dot_bien.py: chép server/ và client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node cong_cu/thu_KHOGON2.js --may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập (thoát 2 / "Bài thử sập") hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_KHOGON2.js'
T, D, R, NH, AP = 'server/kho/tinh.js', 'server/kho/duLieu.js', 'server/kho/duong.js', 'server/kho/nhapHang.js', 'server/kho/anhPhieu.js'
ST = 'server/routes/settings.js'
CPC, CSP = 'client/src/pages/Kho/PhaChe.jsx', 'client/src/pages/Kho/SanPham.jsx'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A2: tối đa theo kho (tinh.toiDa) ──
  ('VS-toi-da-bo-1-nguyen-lieu', [(T, "Math.min(...motPhan.map((d) =>", "Math.min(...motPhan.slice(0, 1).map((d) =>", 1)], r'✗ A2[bf] '),
  ('VS-toi-da-lam-tron-sai', [(T, "/ d.luong + SAI_SO)", "/ d.luong)", 1)], r'✗ A2c '),
  # ── A3 / Q1: chặn thiếu lúc tạo (đường người dùng) + lúc duyệt; sửa của chủ quán KHÔNG chặn ──
  ('BV-bo-chan-thieu', [(R, ", chanThieu: true })), timMaGui));", " })), timMaGui));", 1)], r'✗ A3[abc] '),
  ('BV-bo-chan-luc-duyet', [(D, "    const thieu = await require('./phaChe').kiemDuKho(tx, can, luc);\n    if (thieu) return thieu;\n", "", 1)], r'✗ A3d '),
  ('VS-chan-ca-khi-sua', [(D, "tuDuyet: true, thayCho: id, lyDo, luc, lucLam: cu.duyet_luc || luc });", "tuDuyet: true, thayCho: id, lyDo, luc, lucLam: cu.duyet_luc || luc, chanThieu: true });", 1)], r'✗ A3f '),
  ('VS-chan-bang-ton', [(T, "d.luong > Number(ton.get(d.khoa) ?? 0) + SAI_SO", "d.luong >= Number(ton.get(d.khoa) ?? 0) - SAI_SO", 1)], r'✗ A3e '),
  ('VS-nut-khong-khoa-thieu', [(CPC, "disabled={khoa || thieu.length > 0}", "disabled={dangGui}", 1)], r'✗ A3g '),
  # ── A4 / Q2: món nồi, trừ lô gói (đột biến chủ quán dặn: đưa lại cách trừ thảo dược) ──
  ('VS-goi-trien-khai', [(D, "lapPhieuXuat(mon, await docBangCongThuc(tx), await phaChe.docLamSan(tx))", "lapPhieuXuat(mon, await docBangCongThuc(tx))", 1)], r'✗ A4f '),
  ('BV-goi-khong-chan-lo', [(D, "    if (manh.some((m) => m.lo_id == null)) {", "    if (false) {", 1)], r'✗ A4[hi] '),
  ('VS-noi-khong-nhan', [(CPC, "(m.me_ra ? n * m.me_ra : n)", "(n)", 1)], r'✗ A4l '),
  ('VS-me-ra-nhan-0', [(R, "Number.isFinite(me.me_ra) && me.me_ra > 0", "Number.isFinite(me.me_ra) && me.me_ra >= 0", 1)], r'✗ A4b '),
  ('VS-so-noi-khong-chan-me', [(D, "Math.abs(m.so_phan / meRa - Math.round(m.so_phan / meRa)) < 1e-6", "true", 1)], r'✗ A4g '),
  # ── B: ảnh hoá đơn ──
  ('VS-anh-tin-duoi-file', [(AP, "const kieu = Buffer.isBuffer(buf) ? loaiAnh(buf) : null;", "const kieu = Buffer.isBuffer(buf) ? loaiAnh(buf) || 'image/jpeg' : null;", 1)], r'✗ B3b '),
  ('VS-anh-khong-gioi-han', [(R, "limit: GIOI_HAN_ANH_PHIEU });", "limit: '5mb' });", 1)], r'✗ B3c '),
  ('VS-anh-qua-so', [(AP, "WHERE phieu_id = ?) < ?`", "WHERE phieu_id = ?) < ? + 1`", 1)], r'✗ B3[ef] '),
  ('VS-anh-nguoi-khac-gan', [(AP, "  if (!quanLy && p.nguoi_tao !== nguoi)", "  if (false)", 1)], r'✗ B3g '),
  ('BV-anh-phieu-huy', [(AP, "  if (p.trang_thai === 'huy') return", "  if (false) return", 1)], r'✗ B3j '),
  ('BV-bo-kiem-quyen-xem-anh', [(R, "router.get('/phieu/:id/anh/:anhId', NHAN_VIEN, soPhieu,", "router.get('/phieu/:id/anh/:anhId', soPhieu,", 1)], r'✗ B4d '),
  ('VS-anh-doc-khong-theo-phieu', [(AP, "WHERE id = ? AND phieu_id = ?', [anhId, phieuId]", "WHERE id = ? AND (phieu_id = ? OR 1)', [anhId, phieuId]", 1)], r'✗ B4c '),
  ('BV-sua-pn-mat-anh', [(R, "  if (!moi.loi && cu.loai === 'PN') await anhPhieu.chepAnh(tx, id, moi.id);", "", 1)], r'✗ B4f '),
  # ── D: thẻ nguyên liệu · số gọn ──
  ('VS-the-lo-gia', [(R, "    res.json(anGia(req) ? tinh.boGia(r) : r);\n  } catch (e) { console.error('Lỗi đọc thẻ nguyên liệu:'", "    res.json(r);\n  } catch (e) { console.error('Lỗi đọc thẻ nguyên liệu:'", 1)], r'✗ D1e '),
  ('BV-so-gon', [(CSP, "so: soGon(d.luong_hien) }", "so: d.luong_hien }", 1)], r'✗ D5 '),
  # ── E: luật duyệt (tên chủ quán đặt) ──
  ('VS-nhan-van-cho-duyet', [(NH, "tuDuyet: true, nguoi, luc, nccId, ghiChu, donId", "tuDuyet: ep, nguoi, luc, nccId, ghiChu, donId", 1), (NH, "  await ghiKhoNhan(tx, id, luc);\n  return { id };", "  if (ep) await ghiKhoNhan(tx, id, luc);\n  return { id };", 1)], r'✗ E1a '),
  ('VS-cong-tac-bo-qua', [(R, "VAI_QUAN_LY.includes(req.user.role) || !(await duLieu.nvCanDuyet(tx)), chanThieu: true", "VAI_QUAN_LY.includes(req.user.role), chanThieu: true", 1)], r'✗ E2c '),
  ('VS-nv-doi-cong-tac', [(ST, "key.startsWith('kho_')) && req.user.role !== 'owner'", "key.startsWith('kho_')) && !['owner', 'manager'].includes(req.user.role)", 1)], r'✗ E2b '),
  ('BV-xuat-nv-khong-duyet-khi-tat', [(D, "[KHOA_CONG_TAC]))?.value) !== '0';", "[KHOA_CONG_TAC]))?.value) === 'khong_bao_gio';", 1)], r'✗ E2a '),
]

def ban_sao(thay):
  """Chép server/ + client/src/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_khogon2_')
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
  tmp = tempfile.mkdtemp(prefix='dotbien_khogon2_cay_')
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
