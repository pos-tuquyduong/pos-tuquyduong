#!/usr/bin/env python3
"""GIAO-4 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-4/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/GIAO-4/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/GIAO-3/dot_bien.py: chép server/, cong_cu/gia_lap/ và bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GH, AH = 'server/utils/giaoHang.js', 'server/utils/ahamove.js'
BAI = {'g4': 'cong_cu/thu_GIAO4.js'}

VI_TU = "const phiHopLe = (phi) => Number.isInteger(phi) && phi > 0;"
CHAN = """    if (!phiHopLe(bp.phi)) {   // TRƯỚC khi lưu báo phí: không dòng pos_giao_bao_phi nào mang phí ≤ 0
      console.warn(`[GIAO] phi_0 total_price=${bp.phi_tho.total_price} total_fee=${bp.phi_tho.total_fee}`);
      return loi(502, 'AHAMOVE_PHI_0', 'Ahamove báo phí 0đ — bấm Tính phí lại (nếu lặp lại, gọi Ahamove kiểm tra)');
    }
"""
SAU_GHI = "      [ma, d.dia_chi, d.lat ?? bp.lat, d.lng ?? bp.lng, bp.km, loaiXe, bp.phi, hetHan, nguoi, now]);\n"
LOG = "      console.warn(`[GIAO] phi_0 total_price=${bp.phi_tho.total_price} total_fee=${bp.phi_tho.total_fee}`);\n"
PHI_THO = ",\n    phi_tho: { total_price: so(d.total_price), total_fee: so(d.total_fee) } };"

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  ('VS-phi-0-lot', 'g4', [(GH, VI_TU, VI_TU.replace('phi > 0', 'phi >= 0'), 1)], r'✗ T1 total_price 0 → 502'),
  ('VS-phi-am-lot', 'g4', [(GH, VI_TU, VI_TU.replace('phi > 0', 'phi !== 0'), 1)], r'✗ T2 total_price -5000 → 502'),
  ('VS-chan-ca-1d', 'g4', [(GH, VI_TU, VI_TU.replace('phi > 0', 'phi > 1'), 1)], r'✗ K1 phí 1đ'),
  ('BV-bo-chan-phi-0', 'g4', [(GH, CHAN, '', 1)], r'✗ T1 total_price 0 → 502'),
  ('VS-chan-sau-ghi', 'g4', [(GH, CHAN, '', 1), (GH, SAU_GHI, SAU_GHI + CHAN, 1)], r'✗ T1 total_price 0 → KHÔNG ghi'),
  ('VS-chan-o-aha', 'g4', [(GH, CHAN, '', 1), (AH, "  const den = d.path?.[1] || {};\n  return { km,",
    "  if (!(Math.round(phi) > 0)) throw loi('AHAMOVE_PHI_0', 200);\n  const den = d.path?.[1] || {};\n  return { km,", 1)], r'✗ K6 gọi xe'),
  ('BV-bo-log-phi-0', 'g4', [(GH, LOG, '', 1)], r'✗ T6 T1 '),
  ('BV-phi-tho', 'g4', [(AH, PHI_THO, ' };', 1)], r'✗ T6 T1 '),
  ('VS-ma-loi-cu', 'g4', [(GH, "loi(502, 'AHAMOVE_PHI_0',", "loi(502, 'AHAMOVE_LOI',", 1)], r'✗ T1 total_price 0 → 502'),
  ('VS-total-fee-thay', 'g4', [(AH, "phi = so(d.total_price ?? d.total_fee);", "phi = so(d.total_price || d.total_fee);", 1)], r'✗ T5 total_price 0, total_fee 20000'),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_giao4_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  for f in BAI.values():
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'SẬP:' in ra:
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
    ma, ra = chay_bai(tmp, 'g4')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-160:])
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
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
