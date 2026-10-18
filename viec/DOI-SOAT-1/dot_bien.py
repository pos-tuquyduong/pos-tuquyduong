#!/usr/bin/env python3
"""DOI-SOAT-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/DOI-SOAT-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/DOI-SOAT-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/P26c/dot_bien.py: chép server/ và cong_cu/gia_lap/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink, chỉ đọc),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy
`node cong_cu/thu_DOISOAT1.js --may-chu <bản sao server>`. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt.
Thoát 2 (bài sập) hoặc thoát ≠ 0 mà không khớp mẫu = LẠC (không tính là bắt). Xanh trọn = SỐNG. Không đụng server/ thật, data/, Turso.
doiSoat.js nạp ../../cong_cu/gia_lap/bat_bien.js nên bản sao phải có cả hai thư mục cạnh nhau (tmp/server, tmp/cong_cu/gia_lap).
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DS, RP, BB = 'server/utils/doiSoat.js', 'server/routes/reports.js', 'cong_cu/gia_lap/bat_bien.js'
LOC = "if (!gop && phamVi === 'ky' && n10 && (n10 < ky.tu || n10 > ky.den)) return null;"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: dùng lại bất biến, chỉ đọc ──
  ('BV-DS-BO-BAT-BIEN', [(DS, "  for (const ten of Object.keys(boBatBien)) {\n    if (BO_QUA[ten])", "  for (const ten of Object.keys(boBatBien).filter((t) => t !== 'I6')) {\n    if (BO_QUA[ten])", 1)], r'✗ (A1|C4 I6)'),
  ('BV-DS-GHI-DUOC', [(DS, r"if (!/^(SELECT|WITH)\b/i.test(dau)) throw new Error(", "if (false) throw new Error(", 1)], r'✗ A2b'),
  ('VS-DS-NAP-SOM', [(DS, "const batBien = () => require('../../cong_cu/gia_lap/bat_bien.js').BAT_BIEN;",
                      "const BAT_BIEN_SOM = require('../../cong_cu/gia_lap/bat_bien.js').BAT_BIEN;\nconst batBien = () => BAT_BIEN_SOM;", 1)], r'✗ A6'),
  # ── B: kỳ và giờ VN ──
  ('BV-DS-BO-LOC-KY', [(DS, LOC, "if (false) return null;", 1)], r'✗ B1b'),
  ('VS-DS-LOP2-LOC-KY', [(DS, "if (!gop && phamVi === 'ky' && n10 &&", "if (!gop && n10 &&", 1)], r'✗ C4b (I2|I4|I5|I8|I13|I18)'),
  ('VS-DS-GIO-UTC', [(DS, "const n = ngay || getToday();", "const n = ngay || new Date().toISOString().slice(0, 10);", 1)], r'✗ B4'),
  ('VS-DS-TUAN-CN', [(DS, "-((thuTrongTuan(n) + 6) % 7)", "-thuTrongTuan(n)", 1)], r'✗ B2 '),
  # ── C: dữ liệu cũ ──
  ('BV-DS-BO-AP-DUNG-TU', [(DS, "!troi && n10 && apDung && n10 < apDung ? 'cu'", "false ? 'cu'", 1)], r'✗ C1'),
  ('VS-DS-AP-DUNG-NGUOC', [(DS, "n10 < apDung ? 'cu'", "n10 <= apDung ? 'cu'", 1)], r'✗ C2'),
  ('VS-DS-AN-KHONG-RO-NGAY', [(DS, LOC, "if (!gop && phamVi === 'ky' && (!n10 || n10 < ky.tu || n10 > ky.den)) return null;", 1)], r'✗ C5'),
  # ── D: SĐT nhận ≥ 2 lần ──
  ('BV-DS-D1-BO-DIEM-NHAN', [(DS, "WHERE diem_nhan_phone IS NOT NULL", "WHERE 1 = 0", 1)], r'✗ D1c'),
  ('VS-DS-D1-VANG-NGUOC', [(DS, "canXem: r.cot === 'diem_nhan_phone' && !chiLanDau,", "canXem: r.cot === 'diem_nhan_phone' && chiLanDau,", 1)], r'✗ D1[cd]'),
  # ── E: tiền mặt vào két ──
  ('VS-DS-BAN-KHONG-TRU-THU', [(DS, "SELECT COALESCE(SUM(o.${cot} - (SELECT COALESCE(SUM(${jTien}), 0) FROM pos_order_log WHERE order_id = o.id AND loai = 'thu')), 0) AS n",
                                "SELECT COALESCE(SUM(o.${cot}) + 0 * ?, 0) AS n", 1)], r'✗ (E0c|F3)'),
  ('VS-DS-THU-THEO-NGAY-TAO', [(DS, "FROM pos_order_log WHERE loai = 'thu' AND DATE(luc) BETWEEN ? AND ?",
                                "FROM pos_order_log WHERE loai = 'thu' AND DATE((SELECT created_at FROM pos_orders WHERE id = order_id)) BETWEEN ? AND ?", 1)], r'✗ E0 '),
  ('VS-DS-RA-CA-GOI', [(DS, "AND NOT EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id < 0 AND oi.product_id > -1000000)", "AND 1 = 1", 1)], r'✗ E0 '),
  ('BV-DS-BO-NAP-VI', [(DS, "type = 'topup' AND COALESCE(payment_method, 'cash') = ?", "type = 'xx' AND COALESCE(payment_method, 'cash') = ?", 1)], r'✗ E0 '),
  ('VS-DS-GHI-DE', [(DS, "  const d = kiemTraGhi(b);\n", "  const d = kiemTraGhi(b);\n  await db.run('DELETE FROM pos_doi_soat_ghi WHERE loai = ? AND ky = ?', [d.loai, d.ky]);\n", 1)], r'✗ E4'),
  ('BV-DS-BO-KIEM-SO-TIEN', [(DS, "const nguyen = (v) => Number.isInteger(v) && v >= 0 && v <= TRAN_KET;", "const nguyen = () => true;", 1)], r'✗ E5 '),
  # ── F: tuần / tháng ──
  ('BV-DS-F-BO-DA-SO', [(DS, "['sao_ke', ky.tu]))[0] || null;", "['sao_ke', ky.tu]))[0] && null;", 1)], r'✗ F2'),
  ('VS-DS-F-THANG-NHOM', [(DS, "COALESCE(SUM(CASE WHEN points > 0 THEN points END), 0) AS cong", "COALESCE(COUNT(CASE WHEN points > 0 THEN points END), 0) AS cong", 1)], r'✗ F3'),
  # ── G: quyền ──
  ('BV-DS-BO-QUYEN-GET', [(RP, "router.get('/doi-soat', authenticate, checkPermission('view_reports'), async", "router.get('/doi-soat', authenticate, async", 1)], r'✗ G1 '),
  ('BV-DS-BO-QUYEN-POST', [(RP, "router.post('/doi-soat/ghi', authenticate, checkPermission('view_reports'), async", "router.post('/doi-soat/ghi', authenticate, async", 1)], r'✗ G1b'),
  # ── bản rút gọn của bất biến trên dữ liệu thật (ctx.thuc) ──
  ('BV-DS-THUC-I13', [(BB, "const tay = ctx.thuc ? 0 : ctx.soQuay.tangMa.get(String(r.code).toUpperCase()) || 0;", "const tay = ctx.soQuay.tangMa.get(String(r.code).toUpperCase()) || 0;", 1)], r'✗ B0 '),
  ('VS-DS-THUC-I13-BANG', [(BB, "(ctx.thuc ? so(r.used_count) < so(r.so_don) :", "(ctx.thuc ? so(r.used_count) !== so(r.so_don) :", 1)], r'✗ B0 '),
  ('VS-DS-THUC-I14-BANG', [(BB, "(ctx.thuc ? so(g.delivered_qty) < so(g.da_lay) :", "(ctx.thuc ? so(g.delivered_qty) !== so(g.da_lay) :", 1)], r'✗ B0 '),
  ('VS-DS-THUC-I9-QUAY-RONG', [(BB, "const quay = ctx.thuc ? soLog : ctx.soQuay.thu.get(id) || [];", "const quay = ctx.thuc ? [] : ctx.soQuay.thu.get(id) || [];", 1)], r'✗ B0 '),
  ('BV-DS-THUC-I9-DOI', [(BB, "if (!ctx.thuc && doi !== (ctx.soQuay.doi.get(id) || 0))", "if (doi !== (ctx.soQuay.doi.get(id) || 0))", 1)], r'✗ B0 '),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/gia_lap/ ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_ds1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))
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


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_DOISOAT1.js'), '--may-chu', os.path.join(tmp, 'server')],
                       cwd=GOC, capture_output=True, text=True, timeout=300)
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
    r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_DOISOAT1.js'), '--may-chu', os.path.join(tmp, 'server')],
                       cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return r.returncode == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def chay_goc(sha):
  """Bằng chứng ĐỎ trên code chưa vá: chạy bài thử HIỆN TẠI với server/ + cong_cu/gia_lap/ của commit `sha` (git archive, bản chép thật)."""
  import io, tarfile
  tmp = tempfile.mkdtemp(prefix='dotbien_ds1_goc_')
  try:
    tar = subprocess.run(['git', 'archive', sha, 'server', 'cong_cu/gia_lap'], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
    r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_DOISOAT1.js'), '--may-chu', os.path.join(tmp, 'server')],
                       cwd=GOC, capture_output=True, text=True, timeout=300)
    ra = ((r.stdout or '') + (r.stderr or '')).strip()
    print('\n'.join(l for l in ra.splitlines() if '✗' in l or 'đạt ·' in l or 'sập' in l))
    print(f'GỐC {sha}: thoát {r.returncode}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
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
