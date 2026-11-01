#!/usr/bin/env python3
"""SAOLUU-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/SAOLUU-2/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/SAOLUU-2/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/SAOLUU-2/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ của commit sha)
    python3 viec/SAOLUU-2/dot_bien.py --help             (in hướng dẫn này)

Khuôn viec/KHO-1/dot_bien.py: chép server/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi
phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_SAOLUU2.js --may-chu <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Thoát 2 (bài sập) hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
K, B = 'server/utils/khoiPhuc.js', 'server/routes/backup.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  ('VS-DONG-DAU', [(K, 'XLSX.utils.sheet_to_json(ws, { defval: null })', 'XLSX.utils.sheet_to_json(ws)', 1)], r'✗ (A[12]|F1) '),
  ('VS-RONG-THANH-NULL', [(K, 'm.cot.map((c) => d[c])', "m.cot.map((c) => (d[c] === '' ? null : d[c]))", 1)], r'✗ (A4|F1) '),
  ('BV-LOC-COT', [(K, 'const cot = cotTrang.filter((c) => cotBang.has(c));', 'const cot = cotTrang;', 1)], r'✗ A3 '),
  ('VS-NUOT-LOI', [(K, '        if (!laLoiDuLieu(err)) throw err;\n        throw Object.assign(', '        if (!laLoiDuLieu(err)) throw err;\n        return; throw Object.assign(', 1)], r'✗ B[124] '),
  ('VS-NGOAI-GIAO-DICH', [(K, 'await chay(m, null, `DELETE FROM ${m.table}`, []);', "await require('../database').run(`DELETE FROM ${m.table}`);", 1)], r'✗ B1 '),
  ('VS-THU-TU-FILE', [(K, ".filter((m) => m.status === 'se_khoi_phuc').sort((a, b) => a.viTri - b.viTri);", ".filter((m) => m.status === 'se_khoi_phuc');", 1)], r'✗ B5 '),
  ('BV-BANG-CHUA-CO', [(K, "    if (!cotBang.size) { boQua('BANG_CHUA_CO', 'Bỏ qua vì cơ sở dữ liệu chưa có bảng này'); continue; }\n", '', 1)], r'✗ (C5|D3) '),
  ('BV-XEM-TRUOC', [(B, 'preview.push({ ...m, currentRows', 'preview.push({ sheet: m.sheet, table: m.table, label: m.label, recognized: m.recognized, fileRows: m.fileRows, currentRows', 1)], r'✗ C[1245] '),
  ('BV-DON-APP', [(B, "  'pos_don_app'];", '  ];', 1)], r'✗ D1 '),
  ('BV-SAO-LUU-DON-APP', [(B, "  { name: 'pos_don_app', label: 'Đơn từ App KH', key: 'id' },", '', 1)], r'✗ D1 '),
  ('BV-KHO-CO-DU-LIEU', [(K, "if (bang.name.startsWith('kho_') && !khoTrong) {", 'if (false) {', 1)], r'✗ (C2|E2) '),
  ('BV-NANG-CAP', [(K, "if (bang.name === 'pos_nang_cap') {", 'if (false) {', 1)], r'✗ (C4|E2) '),
  ('BV-KHO-TRONG-LOI', [(K, "AS n').catch(() => null);", "AS n');", 1)], r'✗ E8 '),
  ('VS-LY-DO-KHOI-PHUC', [(K, '      if (demKho) boQua(', '      if (true) boQua(', 1)], r'✗ E8 '),
  # ── vòng sửa 1 (soát độc lập: lỗi hạ tầng báo nhầm thành dòng hỏng · số dòng lệch khi có dòng trống) ──
  ('VS-LOI-HA-TANG-THANH-DONG', [(K, '      if (!laLoiDuLieu(err)) throw err;\n', "      if (String(err?.code) === 'SQLITE_BUSY') throw err;\n", 1)], r'✗ B7 '),
  ('VS-SO-DONG-THU-TU', [(K, 'for (const d of m.dong) await chay(m, d.__rowNum__ + 1,', 'for (const [i, d] of m.dong.entries()) await chay(m, i + 2,', 1)], r'✗ B6 '),
  # ── vòng sửa 2 (soát độc lập vòng 2: mỗi nhánh lý do một ca; câu khoá ngoại theo xoá / chèn) ──
  ('VS-KHOA-NGOAI-MOT-CAU', [(K, 'ly_do: lyDo(err, soDong === null)', 'ly_do: lyDo(err, true)', 1)], r'✗ B9 '),
  ('BV-MISMATCH', [(K, '/^SQLITE_(CONSTRAINT|MISMATCH)/', '/^SQLITE_(CONSTRAINT)/', 1)], r'✗ B8 '),
  ('VS-DONG-CAU-XOA', [(K, 'await chay(m, null, `DELETE FROM', 'await chay(m, 1, `DELETE FROM', 1)], r'✗ B10 '),
  # ── vòng sửa cuối (soát vòng 3: catch xem trước lộ câu nội bộ · trang không cột khớp → 500) ──
  ('BV-LOI-GHI-XEM-TRUOC', [(B, '    loiGhi(res, err);   // SAOLUU-2: cùng khuôn /restore', '    res.status(500).json({ error: err.message });   //', 1)], r'✗ B11 '),
  ('BV-KHONG-CO-COT', [(K, "    if (!cot.length) { boQua('KHONG_CO_COT_KHOP', 'Bỏ qua vì không cột nào của trang khớp bảng'); continue; }\n", '', 1)], r'✗ C6 '),
  ('VS-TRANG-TRONG-XOA', [(K, "    if (!dong.length) { boQua('TRANG_TRONG', 'Không có dữ liệu'); continue; }", '', 1)], r'✗ E7 '),
]


def ban_sao(thay):
  """Chép server/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_saoluu2_')
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
  return subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_SAOLUU2.js'), '--may-chu', os.path.join(tmp, 'server')],
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
  tmp = tempfile.mkdtemp(prefix='dotbien_saoluu2_goc_')
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
