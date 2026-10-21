#!/usr/bin/env python3
"""DOI-SOAT-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/DOI-SOAT-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/DOI-SOAT-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/DOI-SOAT-1/dot_bien.py --goc <sha>        (bằng chứng ĐỎ: bài hiện tại trên server/ của commit sha)
    python3 viec/DOI-SOAT-1/dot_bien.py --help             (in hướng dẫn này)

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
  ('BV-DS-GHI-DUOC', [(DS, r"if (!/^(SELECT|WITH)\b/i.test(dau) || TU_GHI.test(dau)) throw new Error(", "if (false) throw new Error(", 1)], r'✗ A2b'),
  ('VS-DS-CHI-DOC-TIEN-TO', [(DS, " || TU_GHI.test(dau)) throw new Error(", ") throw new Error(", 1)], r'✗ A2c'),
  ('VS-DS-CHI-DOC-SOI-CHUOI', [(DS, '|\'(?:[^\']|\'\')*\'|"(?:', '|"(?:', 1)], r'✗ A2d'),
  ('VS-DS-CHI-DOC-DINH-DANH', [(DS, '|\'(?:[^\']|\'\')*\'|"(?:[^"]|"")*"|`[^`]*`|\\[[^\\]]*\\]/g, \' \')', "|'(?:[^']|'')*'/g, ' ')", 1)], r'✗ A2e'),
  ('BV-DS-CHI-DOC-CHU-THICH', [(DS, "replace(/\\/\\*[\\s\\S]*?\\*\\/|--[^\\n]*|'", "replace(/'", 1)], r'✗ A2f'),
  ('VS-DS-NAP-SOM', [(DS, "const batBien = () => require('../../cong_cu/gia_lap/bat_bien.js').BAT_BIEN;",
                      "const BAT_BIEN_SOM = require('../../cong_cu/gia_lap/bat_bien.js').BAT_BIEN;\nconst batBien = () => BAT_BIEN_SOM;", 1)], r'✗ A6'),
  # ── B: kỳ và giờ VN ──
  ('BV-DS-BO-LOC-KY', [(DS, LOC, "if (false) return null;", 1)], r'✗ B1b'),
  ('VS-DS-LOP2-LOC-KY', [(DS, "if (!gop && phamVi === 'ky' && n10 &&", "if (!gop && n10 &&", 1)], r'✗ C4b (I2|I4|I5|I8|I13|I18)'),
  ('VS-DS-GIO-UTC', [(DS, "const n = ngay || getToday();", "const n = ngay || new Date().toISOString().slice(0, 10);", 1)], r'✗ B4'),
  ('VS-DS-TUAN-CN', [(DS, "-((thuTrongTuan(n) + 6) % 7)", "-thuTrongTuan(n)", 1)], r'✗ B2 '),
  # ── C: dữ liệu cũ ──
  ('VS-DS-NGAY-BO-VI', [(DS, "COALESCE((SELECT MAX(created_at) FROM pos_balance_transactions WHERE order_id = o.id), ''),", "'',", 1)], r'✗ C6 '),
  ('VS-DS-GOI-NGAY-TAO', [(DS, "    COALESCE((SELECT MAX(x.created_at) FROM pos_orders x WHERE x.customer_package_id = cp.id), ''),\n", "    '',\n", 1)], r'✗ C6b'),
  ('VS-DS-GOI-UPDATED-AT', [(DS, 'MAX(cp.created_at,\n', "MAX(cp.created_at, COALESCE(cp.updated_at, ''),\n", 1)], r'✗ C6c'),
  ('VS-DS-NGAY-BO-HUY', [(DS, "MAX(o.created_at, COALESCE(o.cancelled_at, ''),", "MAX(o.created_at, '',", 1)], r'✗ C7 .*huỷ'),
  ('VS-DS-NGAY-BO-NHAT-KY', [(DS, "COALESCE((SELECT MAX(luc) FROM pos_order_log WHERE order_id = o.id), ''),", "'',", 1)], r'✗ C7 .*nhật ký'),
  ('VS-DS-NGAY-BO-DIEM', [(DS, "COALESCE((SELECT MAX(created_at) FROM pos_point_transactions WHERE order_id = o.id), '')) AS d", "'') AS d", 1)], r'✗ C7 .*dòng điểm'),
  ('VS-DS-GOI-BO-HUY-MUA', [(DS, "COALESCE((SELECT m.cancelled_at FROM pos_orders m WHERE m.id = cp.order_id), '')) AS d", "'') AS d", 1)], r'✗ C7d'),
  ('VS-DS-I1-MIN', [(DS, 'ELSE MAX(claimed_at, diem_nhan_luc) END AS d', 'ELSE MIN(claimed_at, diem_nhan_luc) END AS d', 1)], r'✗ C7e'),
  ('VS-DS-D2-MOI-DONG', [(DS, "if (c && the.has(c)) l.nhan = 'D2';", "if (c) l.nhan = 'D2';", 1)], r'✗ D2e'),
  ('BV-DS-BO-AP-DUNG-TU', [(DS, "n10 && apDung && n10 < apDung ? 'cu'", "false ? 'cu'", 1)], r'✗ C1'),
  ('VS-DS-AP-DUNG-NGUOC', [(DS, "n10 < apDung ? 'cu'", "n10 <= apDung ? 'cu'", 1)], r'✗ C2'),
  ('VS-DS-AN-KHONG-RO-NGAY', [(DS, LOC, "if (!gop && phamVi === 'ky' && (!n10 || n10 < ky.tu || n10 > ky.den)) return null;", 1)], r'✗ C5'),
  # ── D: SĐT nhận ≥ 2 lần ──
  ('BV-DS-D1-BO-DIEM-NHAN', [(DS, "WHERE diem_nhan_phone IS NOT NULL", "WHERE 1 = 0", 1)], r'✗ D1c'),
  ('VS-DS-D1-VANG-NGUOC', [(DS, "canXem: r.cot === 'diem_nhan_phone' && !chiLanDau,", "canXem: r.cot === 'diem_nhan_phone' && chiLanDau,", 1)], r'✗ D1[cd]'),
  # ── câu 10 = C: đền tiền cho khách lẻ không SĐT → CẦN XEM, két không tính ──
  ('BV-DS-DEN-BO', [(DS, "[['D1', phepD1], ['DEN', phepDenLe]]", "[['D1', phepD1]]", 1)], r'✗ DEN1'),
  ('VS-DS-DEN-GIO-UTC', [(DS, "DATETIME(created_at, '+7 hours') AS ngay FROM pos_damage_logs", "created_at AS ngay FROM pos_damage_logs", 1)], r'✗ DEN[12]'),
  ('VS-DS-DEN-DO', [(DS, "ngay: r.ngay || null, canXem: true }));", "ngay: r.ngay || null, canXem: false }));", 1)], r'✗ DEN1'),
  ('VS-DS-DEN-CA-CO-SDT', [(DS, "WHERE refund_amount > 0 AND COALESCE(customer_phone, '') = ''", "WHERE refund_amount > 0", 1)], r'✗ DEN3'),
  ('VS-DS-DEN-VAO-KET', [(DS, "chiDoc(`SELECT COALESCE(SUM(o.${cot}), 0) AS n FROM pos_orders o WHERE o.status = 'cancelled'",
                          "chiDoc(`SELECT (SELECT COALESCE(SUM(refund_amount), 0) FROM pos_damage_logs WHERE ? = 'cash' AND DATE(created_at, '+7 hours') BETWEEN ? AND ?) + COALESCE(SUM(o.${cot}), 0) AS n FROM pos_orders o WHERE o.status = 'cancelled'", 1),
                         (DS, "-1000000)`, [tu, den]),", "-1000000)`, [cach, tu, den, tu, den]),", 1)], r'✗ DEN4'),
  # ── E: tiền mặt vào két ──
  ('VS-DS-BAN-KHONG-TRU-THU', [(DS, "SELECT COALESCE(SUM(o.${cot} - (SELECT COALESCE(SUM(${jTien}), 0) FROM pos_order_log WHERE order_id = o.id AND loai = 'thu')), 0) AS n",
                                "SELECT COALESCE(SUM(o.${cot}) + 0 * ?, 0) AS n", 1)], r'✗ (E0c|F3)'),
  ('VS-DS-THU-THEO-NGAY-TAO', [(DS, "FROM pos_order_log WHERE loai = 'thu' AND DATE(luc) BETWEEN ? AND ?",
                                "FROM pos_order_log WHERE loai = 'thu' AND DATE((SELECT created_at FROM pos_orders WHERE id = order_id)) BETWEEN ? AND ?", 1)], r'✗ E0 '),
  ('VS-DS-RA-CA-GOI', [(DS, "AND NOT EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id < 0 AND oi.product_id > -1000000)", "AND 1 = 1", 1)], r'✗ E0 '),
  ('BV-DS-BO-NAP-VI', [(DS, "type = 'topup' AND COALESCE(payment_method, 'cash') = ?", "type = 'xx' AND COALESCE(payment_method, 'cash') = ?", 1)], r'✗ E0 '),
  ('VS-DS-KET-MOC-DONG-DAU', [(DS, 'SELECT MAX(x.id) FROM pos_doi_soat_ghi x', 'SELECT MIN(x.id) FROM pos_doi_soat_ghi x', 1)], r'✗ E7'),
  ('VS-DS-KET-MOC-XA-NHAT', [(DS, 'ORDER BY g.ky DESC LIMIT 1', 'ORDER BY g.ky ASC LIMIT 1', 1)], r'✗ E7'),
  ('VS-DS-RA-THEO-NGAY-TAO', [(DS, 'AND DATE(o.cancelled_at) BETWEEN ? AND ?', 'AND DATE(o.created_at) BETWEEN ? AND ?', 1)], r'✗ E8'),
  ('VS-DS-RA-THEO-GOI-KHACH', [(DS, 'SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id < 0 AND oi.product_id > -1000000)`, [tu, den])', 'SELECT 1 FROM pos_customer_packages cp WHERE cp.order_id = o.id)`, [tu, den])', 1)], r'✗ E0 '),
  ('VS-DS-THU-BO-CACH', [(DS, "CASE WHEN json_extract(chi_tiet, '$.cach') = ? THEN", 'CASE WHEN ? IS NOT NULL THEN', 1)], r'✗ E10'),
  ('VS-DS-KET-MOC-MOI-LOAI', [(DS, "x.loai = 'ket' AND x.ky = g.ky", 'x.ky = g.ky', 1)], r'✗ E11'),
  ('VS-DS-GHI-DE', [(DS, "  const d = kiemTraGhi(b);\n", "  const d = kiemTraGhi(b);\n  await db.run('DELETE FROM pos_doi_soat_ghi WHERE loai = ? AND ky = ?', [d.loai, d.ky]);\n", 1)], r'✗ E4'),
  ('BV-DS-BO-KIEM-SO-TIEN', [(DS, "const nguyen = (v) => Number.isInteger(v) && v >= 0 && v <= TRAN_KET;", "const nguyen = () => true;", 1)], r'✗ E5 '),
  # ── F: tuần / tháng ──
  ('BV-DS-F-BO-DA-SO', [(DS, "['sao_ke', ky.tu]))[0] || null;", "['sao_ke', ky.tu]))[0] && null;", 1)], r'✗ F2'),
  ('BV-DS-VI-ME', [(DS, "SUM(COALESCE(balance_amount, 0) + COALESCE(parent_balance_amount, 0))", "SUM(COALESCE(balance_amount, 0))", 1)], r'✗ F3b'),
  ('VS-DS-TRA-TUNG-DONG', [(DS, "for (let i = 0; i < khoa.length; i += 400) {\n    const phan = khoa.slice(i, i + 400);",
                            "for (let i = 0; i < khoa.length; i += 1) {\n    const phan = khoa.slice(i, i + 1);", 1)], r'✗ H2'),
  ('BV-DS-LOAI-SAI', [(DS, "if (!['ket', 'sao_ke'].includes(b.loai)) throw", 'if (false) throw', 1)], r'✗ F2c'),
  ('BV-DS-DA-SO-SAI', [(DS, 'if (b.da_so !== 0 && b.da_so !== 1) throw', 'if (false) throw', 1)], r'✗ F2c'),
  ('VS-DS-F-BO-DIEM-TRU', [(DS, 'COALESCE(-SUM(CASE WHEN points < 0 THEN points END), 0) AS tru', '0 AS tru', 1)], r'✗ F3c'),
  ('BV-DS-VI-CHI-HUY', [(DS, "FROM pos_orders WHERE status = 'completed' AND DATE(created_at) BETWEEN ? AND ?", 'FROM pos_orders WHERE DATE(created_at) BETWEEN ? AND ?', 1)], r'✗ F3d'),
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
