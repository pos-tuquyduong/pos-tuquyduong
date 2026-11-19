#!/usr/bin/env python3
"""GIAO-3 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-3/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/GIAO-3/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/GIAO-2/dot_bien.py: chép server/, cong_cu/gia_lap/, client/src/ và bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối
symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GH, AH, RP, DS = 'server/utils/giaoHang.js', 'server/utils/ahamove.js', 'server/routes/reports.js', 'server/utils/doiSoat.js'
MAN, HOP, API = 'client/src/pages/GiaoHang/index.jsx', 'client/src/pages/GiaoHang/HopLyDo.jsx', 'client/src/utils/api.js'
MDS, MBC = 'client/src/components/DoiSoat.jsx', 'client/src/pages/Reports.jsx'
BAI = {'g3': 'cong_cu/thu_GIAO3.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: lý do ──
  ('BV-ly-do-giao-loi', 'g3', [(GH, "const loiGiao = (d) => 'Giao không thành công' + (d.ly_do ? ': ' + d.ly_do : '');", "const loiGiao = () => 'Giao không thành công';", 1)], r'✗ A1 COMPLETED'),
  ('VS-ly-do-khong-cat', 'g3', [(AH, ".trim().slice(0, 200)) || null;", ".trim()) || null;", 1)], r'✗ A1 lý do dài'),
  ('BV-ly-do-huy', 'g3', [(GH, " + (d.ly_do_huy ? ': ' + d.ly_do_huy : '')", "", 1)], r'✗ A3 '),
  # ── B: trả hàng ──
  ('BV-giao-loi-tra-hang', 'g3', [(GH, "  if (c.trang_thai === 'giao_loi') return capNhatTraHang(c, d);\n", "", 1)], r'✗ B2 tin IN_RETURN'),
  ('BV-chong-lap-sub-status', 'g3', [(GH, "${d.tra_hang ? '|' + d.tra_hang : ''}", "", 1)], r'✗ B2 tin IN_RETURN'),
  ('BV-gio-return', 'g3', [(GH, "[d.tra_hang, d.tra_hang, d.tra_luc || getNow(), lyDo,", "[d.tra_hang, d.tra_hang, getNow(), lyDo,", 1)], r'✗ B1/B2 tin RETURNED'),
  ('VS-ly-do-ghi-de-rong', 'g3', [(GH, "  const lyDo = d.trang_thai === 'COMPLETED' && d.diem_giao === 'FAILED' && d.ly_do ? loiGiao(d) : null;",
    "  const lyDo = d.trang_thai === 'COMPLETED' && d.diem_giao === 'FAILED' ? loiGiao({ ly_do: null }) : null;", 1)], r'✗ B1/B2 tin RETURNED'),
  ('BV-doc-lai-giao-loi', 'g3', [(GH, ", ...ds.filter((x) => x.trang_thai === 'giao_loi' && x.xong_luc && x.tra_hang !== 'da_ve')]", "]", 1)], r'✗ B3 tin RETURNED lỡ'),
  ('VS-doc-lai-ca-da-ve', 'g3', [(GH, "x.trang_thai === 'giao_loi' && x.xong_luc && x.tra_hang !== 'da_ve'", "x.trang_thai === 'giao_loi' && x.xong_luc", 1)], r'✗ B3 thẻ đã về quán'),
  ('BV-mot-chieu-da-ve', 'g3', [(GH, " AND COALESCE(tra_hang, '') <> 'da_ve'`,", "`,", 1)], r'✗ B1 một chiều'),
  ('BV-tra-hang-update-chinh', 'g3', [(GH, "tra_hang = CASE WHEN ? = 'giao_loi' THEN ? ELSE tra_hang END", "tra_hang = CASE WHEN ? = 'khong_co' THEN ? ELSE tra_hang END", 1)], r'✗ B1 \(đường UPDATE chính\)'),
  # Bỏ vá thẳng (TRA_HANG[o.sub_status] || null) làm libsql PANIC (tham số là hàm) → bài sập, không đếm là BẮT; vá sai dạng chuỗi thì bài phải bắt.
  ('VS-sub-status-chuoi', 'g3', [(AH, "Object.hasOwn(TRA_HANG, String(o.sub_status)) ? TRA_HANG[o.sub_status] : null", "(TRA_HANG[o.sub_status] ? String(TRA_HANG[o.sub_status]) : null)", 1)], r'✗ B4 sub_status lạ'),
  ('BV-danh-sach-tra-hang', 'g3', [(GH, " tra_hang: c.tra_hang || null, tra_hang_luc: c.tra_hang_luc || null,", "", 1)], r'✗ B1 danh sách'),
  ('BV-man-tra-hang', 'g3', [(MAN, "const traHang = (c) => (c.tra_hang === 'da_ve'", "const traHang = (c) => '' && (c.tra_hang === 'da_ve'", 1)], r'✗ B1 màn'),
  # ── C: phí ──
  ('BV-phi-doc-chuyen', 'g3', [(AH, "    phi: phiDuong(o.total_price),", "    phi: so(o.total_price),", 1)], r'✗ C1 phí lúc gọi'),
  ('BV-phi-tao-chuyen', 'g3', [(AH, "phi: phiDuong(j.order?.total_price ?? j.total_price)", "phi: so(j.order?.total_price ?? j.total_price)", 1)], r'✗ C3 \(K4\)'),
  ('BV-phi-bao-0', 'g3', [(GH, "t.phi ?? (bp.phi > 0 ? bp.phi : null)", "t.phi ?? bp.phi", 1)], r'✗ C3 \(K4\) báo phí'),
  ('VS-doc-lai-giao-loi-do-huy', 'g3', [(GH, "x.trang_thai === 'giao_loi' && x.xong_luc && x.tra_hang", "x.trang_thai === 'giao_loi' && x.tra_hang", 1)], r'✗ B3 thẻ giao_loi do Ahamove HUỶ'),
  ('BV-bao-phi-khach-0', 'g3', [(GH, "    if (!(bp.phi > 0)) return loi(502, 'AHAMOVE_CHUA_BAO_PHI', 'Ahamove chưa báo được phí — bấm báo phí lại');\n", "", 1)], r'✗ C1 \(chủ quán 19.11\)'),
  ('VS-bao-phi-khach-am', 'g3', [(GH, "if (!(bp.phi > 0)) return loi(502", "if (bp.phi < 0) return loi(502", 1)], r'✗ C1 \(chủ quán 19.11\)'),
  ('BV-chu-thich-thuc-thu', 'g3', [(MBC, "= tiền thật vào quán (gồm nạp, trừ hoàn) — cùng số Đối soát", "= tiền mặt + chuyển khoản thật nhận", 1)], r'✗ G3 dưới ô'),
  ('VS-phi-nhan-am', 'g3', [(AH, "const phiDuong = (x) => (so(x) > 0 ?", "const phiDuong = (x) => (so(x) != null ?", 1)], r'✗ C1 phí lúc gọi'),
  ('BV-log-phi', 'g3', [(GH, "  if (d.phi_tho.total_price !== c.phi_that) logPhi(c, d);\n", "", 1)], r'✗ C3 log'),
  # ── G: thực thu ──
  ('BV-thuc-thu-may-chu', 'g3', [(RP, "      thuc_thu: vao.tien_mat + vao.chuyen_khoan,\n", "", 1)], r'✗ G2 Thực thu do máy chủ'),
  ('VS-thuc-thu-cong-ship', 'g3', [(RP, "thuc_thu: vao.tien_mat + vao.chuyen_khoan,", "thuc_thu: vao.tien_mat + vao.chuyen_khoan + (orderStats.total_shipping || 0),", 1)], r'✗ G2 Thực thu do máy chủ'),
  ('BV-man-thuc-thu', 'g3', [(MBC, "{formatPrice(report?.thuc_thu)}", "{formatPrice((report?.order_stats?.total_revenue || 0) - (report?.order_stats?.total_discount || 0) + (report?.order_stats?.total_shipping || 0))}", 1)], r'✗ G2 màn'),
  # ── D: Đối soát ──
  ('BV-han-doi-soat', 'g3', [(MDS, ", { han: HAN_DOI_SOAT_MS });", ");", 1)], r'✗ D3 máy chủ không trả lời'),
  ('VS-han-thanh-mat-mang', 'g3', [(API, "throw huy?.signal.aborted ? loiQuaHan() : e;", "throw e;", 1)], r'✗ D3 máy chủ không trả lời'),
  ('BV-log-doi-soat', 'g3', [(DS, "  console.log(`[DOISOAT] ${kieu} ${ky.tu} · ${Date.now() - t0}ms · ${demCau - cau0} câu`);", "", 1)], r'✗ D3 bấm lại'),
  # ── E: hộp lý do ──
  ('BV-hop-ly-do', 'g3', [(MAN, "const lyDo = await hoiLyDo('Lý do đóng thẻ giao lỗi", "const lyDo = window.prompt('Lý do đóng thẻ giao lỗi", 1)], r'✗ E4 '),
  ('VS-hop-khong-kiem-do-dai', 'g3', [(HOP, "if (chu.trim().length < LY_DO_TOI_THIEU) {", "if (false) {", 1)], r'✗ E2 lý do 2 ký tự'),
  ('VS-nguong-4', 'g3', [(HOP, "if (chu.trim().length < LY_DO_TOI_THIEU) {", "if (chu.trim().length <= LY_DO_TOI_THIEU) {", 1)], r'✗ E3 '),
  ('VS-khong-trim', 'g3', [(HOP, "if (chu.trim().length < LY_DO_TOI_THIEU) {", "if (chu.length < LY_DO_TOI_THIEU) {", 1)], r'✗ E2 "  ab  "'),
  ('VS-thoi-gui-rong', 'g3', [(HOP, "onClick={() => hop.xong(null)}>Thôi", "onClick={() => hop.xong('---')}>Thôi", 1)], r'✗ E2 '),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_giao3_')
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
    ma, ra = chay_bai(tmp, 'g3')
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
