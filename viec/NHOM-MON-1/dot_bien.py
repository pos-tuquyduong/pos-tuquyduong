#!/usr/bin/env python3
"""NHOM-MON-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/NHOM-MON-1/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/NHOM-MON-1/dot_bien.py --liet-ke      (chỉ in danh sách)

Khuôn viec/VOUCHER-2/dot_bien.py: chép server/ + client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi
chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy thu_NHOMMON1.js với `--may-chu <bản sao>/server`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật.
GHI CHÚ TẠM: `donApp.js` chưa nằm trong Phạm vi phiếu (người gác G5 chặn máy sửa) → bản sao áp BAN_DON_APP (đúng bản vá mong muốn) để thử đường đơn App;
khi donApp.js đã sửa thật thì chuỗi gốc không còn → bước này tự bỏ qua.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P, K, M, D, N = 'server/routes/products.js', 'server/routes/kh/index.js', 'server/utils/manKhach.js', 'server/utils/donApp.js', 'server/nang_cap/035_nhom_mon.js'
BH, SP = 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/Kho/SanPham.jsx'

BAN_DON_APP = [(D, "const { layMenuQuay } = require('../routes/products');", "const { menuApp } = require('../routes/products');", 1),
               (D, '(await layMenuQuay()).map((p) => [p.unique_id, p])', '(await menuApp()).map((p) => [p.unique_id, p])', 1)]

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  ('VS-loc-app-theo-quay', [(P, "cho === 'app' ? p.nhom_hien_app : p.nhom_hien_quay", "p.nhom_hien_quay", 1)], r'✗ A5a '),
  ('VS-doi-ma-khi-sua-ten', [(P, "  for (const c of ['hien_quay', 'hien_app']) if (c in b)", "  if (b.ma) doi.ma = b.ma;\n  for (const c of ['hien_quay', 'hien_app']) if (c in b)", 1)], r'✗ A2f '),
  ('VS-xoa-nhom-con-mon', [(P, "'DELETE FROM pos_nhom_mon WHERE ma = ? AND NOT EXISTS (SELECT 1 FROM pos_products WHERE category = ?)', [ma, ma]", "'DELETE FROM pos_nhom_mon WHERE ma = ?', [ma]", 1)], r'✗ A2j '),
  ('VS-category-tu-do-lot', [(P, "if (!(await coNhom(tx, chuNgan(b.category, 'juice')))) return", "if (!(await coNhom(tx, 'juice'))) return", 1)], r'✗ A3b '),
  ('BV-bo-loc-app', [(P, "const menuApp = () => layMenuQuay(undefined, 'app');", "const menuApp = () => layMenuQuay(undefined);", 1)], r'✗ A5c '),
  ('BV-bo-kiem-nhom-put', [(P, "if (doi.category !== undefined && doi.category !== cu.category && !(await coNhom(tx, doi.category))) return", "if (false) return", 1)], r'✗ A3a '),
  ('VS-cong-tac-nhan-null', [(P, "[0, 1, '0', '1'].includes(b[c]) ? Number(b[c]) : null", "[0, 1].includes(Number(b[c])) ? Number(b[c]) : null", 1)], r'✗ A2g2 '),
  ('VS-put-kiem-ca-khi-khong-doi', [(P, "doi.category !== cu.category && ", "", 1)], r'✗ A3f '),
  ('VS-035-trim-ma', [(N, "SELECT DISTINCT category AS ma", "SELECT DISTINCT TRIM(category) AS ma", 1)], r'✗ A1f '),
  ('BV-bo-kiem-nhom-post', [(P, "if (!(await coNhom(tx, chuNgan(b.category, 'juice')))) return", "if (false) return", 1)], r'✗ A3b '),
  ('VS-man-khach-theo-app', [(P, "layMenuQuay(undefined, 'quay')", "layMenuQuay(undefined, 'app')", 1)], r'✗ Q3a '),
  ('VS-hai-cong-tac-chung', [(P, "COALESCE(g.hien_app, 1) AS nhom_hien_app", "COALESCE(g.hien_quay, 1) AS nhom_hien_app", 1)], r'✗ A5a '),
  ('VS-nhom-chua-co-bi-an', [(P, "COALESCE(g.hien_app, 1) AS nhom_hien_app", "COALESCE(g.hien_app, 0) AS nhom_hien_app", 1)], r'✗ A5f '),
  ('BV-bo-chan-nhom-goc', [(P, "if (MA_NHOM_GOC.includes(ma)) return", "if (false) return", 1)], r'✗ A2l '),
  ('VS-thu-tu-khong-doi', [(P, "[i + 1, ma[i]]", "[1, ma[i]]", 1)], r'✗ A2h '),
  ('BV-bo-kiem-danh-sach-thu-tu', [(P, " || ma.length !== co.length", "", 1)], r'✗ A2i '),
  ('VS-035-chen-khong-bo-qua', [(N, "INSERT OR IGNORE INTO pos_nhom_mon", "INSERT INTO pos_nhom_mon", 1)], r'✗ A1d '),
  ('VS-menu-bo-nhom-ten', [(K, "nhom_ten: p.nhom_ten, nhom_thu_tu: p.nhom_thu_tu, ", "", 1)], r'✗ A5b '),
  ('BV-don-app-khong-loc', [(D, '(await menuApp()).map((p) => [p.unique_id, p])', "(await require('../routes/products').layMenuQuay()).map((p) => [p.unique_id, p])", 1)], r'✗ A5i '),
  ('BV-ui-bo-loc-quay', [(BH, 'sp.filter((p) => p.nhom_hien_quay !== 0)', 'sp.filter(() => true)', 1)], r'✗ A4e '),
  ('VS-ui-ten-cung', [(BH, 'tenNhom[n] || n', "n", 1)], r'✗ A4e '),
  ('VS-san-pham-go-tay', [(SP, '<select className="input" value={f.category}', '<input className="input" value={f.category}', 1)], r'✗ A3e '),
]

BAI = 'thu_NHOMMON1.js'


def ban_sao(thay):
  """Chép server/ + client/src/ + cong_cu/gia_lap ra thư mục tạm, áp BAN_DON_APP (nếu còn chuỗi gốc) rồi các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_nhommon1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  base = [b for b in BAN_DON_APP if b[1] in open(os.path.join(tmp, b[0]), encoding='utf-8').read()]
  for f, goc, moi, n in base + thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', BAI), '--may-chu', os.path.join(tmp, 'server')], cwd=GOC, capture_output=True, text=True, timeout=400)
  return r, re.sub(r'\x1b\[\d+m', '', (r.stdout or '') + (r.stderr or ''))


TONG = r'\d+ đạt · \d+ hỏng'


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r, ra = chay_bai(tmp)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(TONG, ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if r.returncode == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 400 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, loi = ban_sao([])
  try:
    if loi:
      return False, loi
    r, ra = chay_bai(tmp)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--liet-ke' in sys.argv:
    for d in DOT_BIEN: print(f'{d[0]:32} → mẫu {d[2]}')
    sys.exit(0)
  ten = [a for a in sys.argv[1:] if not a.startswith('--')]
  lam = [d for d in DOT_BIEN if not ten or d[0] in ten]
  if ten and len(lam) != len(set(ten)):
    print('✗ tên lạ: ' + ', '.join(sorted(set(ten) - {d[0] for d in lam}))); sys.exit(2)
  ok, tom = doi_chung()
  print(f'ĐỐI CHỨNG {BAI} (bản sao chưa đột biến): {"xanh" if ok else "ĐỎ"} — {tom}')
  if not ok:
    print('✗ đối chứng đỏ — kết quả đột biến vô nghĩa'); sys.exit(2)
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), lam))
  for t, tt, ly in kq: print(f'  {tt:5} {t:32} {ly}')
  bat = sum(1 for _, tt, _ in kq if tt == 'BẮT')
  print(f'\nĐỘT BIẾN NHOM-MON-1: {bat}/{len(kq)} bị bắt')
  sys.exit(0 if bat == len(kq) else 1)
