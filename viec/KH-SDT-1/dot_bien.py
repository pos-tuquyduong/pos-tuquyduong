#!/usr/bin/env python3
"""KH-SDT-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-SDT-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-SDT-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/KH-QUAY-2/dot_bien.py: chép server/, cong_cu/, client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SV, RT, IX = 'server/utils/donThu.js', 'server/routes/don-thu.js', 'server/index.js'
CL, DT = 'client/src/pages/QuanLy/donThu.js', 'client/src/pages/DonThu.jsx'
QL, AP = 'client/src/pages/QuanLy/QuanLy.jsx', 'client/src/App.jsx'
BAI = {'s1': 'cong_cu/thu_KHSDT1.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── quyền ──
  ('BV-chi-chu-quan', 's1', [(RT, "req.user.role === 'owner' ? next()", 'true ? next()', 1)], r'✗ D9 nhân viên'),
  # ── tiêu chí ──
  ('BV-ngay-truoc-hom-nay', 's1', [(SV, ' || ngay >= homNay', '', 1)], r'✗ D8 ngày X = hôm nay'),
  ('VS-ngay-ca-ngay-x', 's1', [(SV, "const theoNgay = X ? 'created_at < ?' : '0';", "const theoNgay = X ? 'substr(created_at, 1, 10) <= ?' : '0';", 1)], r'✗ D1 đơn trước X'),
  ('VS-xoa-ngay-ho-so', 's1', [(SV, "['pos_kh_lan_thu', 'sdt', 'tao_luc', false]];",
    "['pos_kh_lan_thu', 'sdt', 'tao_luc', false], ['pos_customers', 'phone', 'created_at', false]];", 1)], r'✗ D1 theo ngày KHÔNG chạm'),
  ('BV-giu-so-gan-don-khac', 's1', [(SV, "      ...ganDon.filter((r) => !xoaDon(r.order_id)).map((r) => r.phone),\n", "", 1)], r'✗ D5 giữ cả số'),
  ('BV-ma-giam', 's1', [(SV, 'if (maGiam.length) await gom(', 'if (false) await gom(', 1)], r'✗ D1 voucher trước X'),
  # ── giữ lại ──
  ('VS-don-vi-khac-0', 's1', [(SV, 'const coVi = new Set(vi.map((v) => v.phone));', 'const coVi = new Set();', 1)], r'✗ D3 đơn của K'),
  ('VS-ngay-dung-vi', 's1', [(SV, '(${cot} IS NULL OR ${cot} NOT IN (${VI_KHAC_0}))', '1', 1)], r'✗ D1 voucher trước X'),
  ('BV-giu-phien', 's1', [(SV, ": coPhien.has(Number(o.id)) ? 'Có phiên", ": false ? 'Có phiên", 1)], r'✗ D3 đơn có phiên'),
  ('BV-diem-am', 's1', [(SV, 'else if (c.diem_am.length) tra', 'else if (false) tra', 1)], r'✗ D10 dọn khi có điểm âm'),
  ('BV-giu-hom-nay', 's1', [(SV, "const l = o.created_at >= homNay ? 'Đơn hôm nay", "const l = false ? 'Đơn hôm nay", 1)], r'✗ D2 (200|K và T3|đơn hôm nay)'),
  ('BV-giu-kho', 's1', [(SV, ": noKho.has(Number(o.id)) ? 'Còn", ": false ? 'Còn", 1)], r'✗ D3 đơn còn nợ kho'),
  ('BV-giu-so-vi', 's1', [(SV, '(r.soVi || r.phone !== o.customer_phone)', '(r.phone !== o.customer_phone)', 1)], r'✗ (D1 theo ngày KHÔNG xoá dòng sổ ví|D3 đơn R mua bằng ví)'),
  ('BV-giu-so-khac', 's1', [(SV, '(r.soVi || r.phone !== o.customer_phone)', '(r.soVi)', 1)], r'✗ D3 đơn thử có mã bill khách thật B'),
  ('BV-tra-luot-moi-don', 's1', [(SV, "filter((o) => o.status === 'completed')", 'filter(() => true)', 1)], r'✗ E2 xoá đơn dùng mã'),
  ('BV-mo-coi', 's1', [(SV, 'AND order_id IN (SELECT id FROM pos_orders)`, L)', '`, L)', 1)], r'✗ D5 giữ cả số'),
  ('BV-mo-coi-ngay', 's1', [(SV, "' AND (order_id IS NULL OR order_id NOT IN (SELECT id FROM pos_orders))'", "' AND order_id IS NULL'", 1)], r'✗ D1 điểm trước X'),
  ('BV-goi-so-khac', 's1', [(SV, "      ...goi.filter((g) => dungGoi.some((d) => Number(d.customer_package_id) === Number(g.id) && !xoaDon(d.id))).map((g) => g.customer_phone)]);", "]);", 1)], r'✗ D5 giữ cả số'),
  ('BV-me-cua-khach', 's1', [(SV, '!conCua.some((c) => c.parent_phone === s && !P.includes(c.phone))', 'true', 1)], r'✗ D5 giữ cả số'),
  ('BV-hoa-don-nam', 's1', [(SV, 'hdGiu && hdNam.some(', 'false && hdNam.some(', 1)], r'✗ D13 còn hoá đơn năm nay'),
  ('BV-sua-truoc', 's1', [(SV, ', sua_truoc: suaTruoc })', ' })', 1)], r'✗ D6 nhật ký chụp dòng bị SỬA'),
  ('BV-ket', 's1', [(SV, 'ket_se_lech: ket.map((r) => r.ky),', 'ket_se_lech: [],', 1)], r'✗ D1 liệt kê ngày thử đã đếm két'),
  ('VS-ma-bill-giu-so', 's1', [(SV, "if (L.length && !t.startsWith('pos_signup')) ganDon.push(", 'if (L.length) ganDon.push(', 1)], r'✗ D2 (200|K và T3|đơn: chỉ O2|đủ mọi bảng)'),
  ('BV-bang-khong-don', 's1', [(SV, "const BANG_KHONG_DON = ['pos_stock_pending', ", 'const BANG_KHONG_DON = [', 1)], r'✗ D14 '),
  ('BV-giu-goi', 's1', [(SV, ": g && !goiXoa(g) ? 'Lấy từ gói", ": false ? 'Lấy từ gói", 1)], r'✗ D3 đơn R lấy từ gói'),
  ('BV-giu-mua-goi', 's1', [(SV, "!xoaDon(d.id)))\n            ? 'Mua gói", "false))\n            ? 'Mua gói", 1)], r'✗ D3 đơn T1 mua gói'),
  ('BV-giu-ca-so', 's1', [(SV, "const P = L.filter((s) => !coVi.has(s) && !sdtGiu.has(s));", "const P = L.filter((s) => !coVi.has(s));", 1)], r'✗ D2 (200|K và T3)'),
  ('BV-giu-don-theo-so', 's1', [(SV, "!o.theo_ngay && !P.includes(o.customer_phone) ? 'SĐT", "false ? 'SĐT", 1)], r'✗ D2 đơn: chỉ O2'),
  ('VS-diem-am-het-han', 's1', [(SV, 'WHERE (expires_at IS NULL OR expires_at > ?) AND customer_phone IN', 'WHERE ? IS NOT NULL AND customer_phone IN', 1)], r'✗ D10 không chặn oan'),
  ('BV-tra-luot-ma', 's1', [(SV, 'for (const o of banChup.pos_orders || []) await traLuotMa(tx, o);', '', 1)], r'✗ E2 xoá đơn dùng mã'),
  ('VS-chup-mot-o', 's1', [(SV, 'const PHAN = 30000;', 'const PHAN = 1e9;', 1)], r'✗ (D6 bản chụp trong nhật ký chia phần|E4 sao lưu)'),
  ('BV-che-bi-mat', 's1', [(SV, "(COT_BI_MAT.includes(k) && v != null ? '[ẩn]' : v)", 'v', 1)], r'✗ D6 nhật ký \(nhân viên'),
  # ── dọn ──
  ('VS-sai-chu', 's1', [(SV, 'if (than.go_xac_nhan !== CHU_XAC_NHAN)', 'if (!than.go_xac_nhan)', 1)], r'✗ D5 chữ thường'),
  ('VS-bo-so-ma', 's1', [(SV, 'if (c.ma_xac_nhan !== than.ma_xac_nhan) tra =', 'if (false) tra =', 1)], r'✗ D5 (sai|thiếu) mã xác nhận'),
  ('VS-bam-thieu-id', 's1', [(SV, 'JSON.stringify({ tieuChi, idTheoBang })', 'JSON.stringify({ tieuChi })', 1)], r'✗ D5 có đơn mới'),
  # xoá xong commit RỒI mới ghi nhật ký (ngoài giao dịch) — ghi hỏng thì dữ liệu đã mất mà không có nhật ký / bản chụp
  ('VS-ngoai-giao-dich', 's1', [(SV, 'const nk = await tx.run(`INSERT INTO pos_sync_logs', "await tx.commit(); const nk = await require('../database').run(`INSERT INTO pos_sync_logs", 1)], r'✗ D11 không xoá dòng nào'),
  ('VS-ban-chup-thieu', 's1', [(SV, 'SELECT * FROM ${t} WHERE id IN', 'SELECT id FROM ${t} WHERE id IN', 1)], r'✗ D6 bản chụp (nhật ký giữ NGUYÊN|trả về)'),
  ('BV-mount', 's1', [(IX, "app.use('/api/pos/don-thu', require('./routes/don-thu'));", '', 1)], r'✗ D12 server/index.js'),
  # ── màn hình ──
  ('BV-nut-sao-luu', 's1', [(CL, 'daTaiSaoLuu === true && ', '', 1)], r'✗ D12 nút Dọn ĐÓNG'),
  ('VS-csv-thieu-giu-lai', 's1', [(CL, "  for (const d of (kq.giu_lai && kq.giu_lai.don) || []) ra.push(dong('GIỮ LẠI — đơn', d.code, d.created_at, '', '', d.ly_do));\n", '', 1)], r'✗ D12 CSV'),
  ('VS-man-khong-bo-dau', 's1', [(DT, 'setKetQua(null); setDaTaiDs(false); setDaTaiSaoLuu(false); setGo(\'\'); };', 'setGo(\'\'); };', 1)], r'✗ D12 đổi tiêu chí'),
  ('BV-o-quan-ly', 's1', [(QL, "{user?.role === 'owner' && (", '{(', 1)], r'✗ D12 Quản lý'),
  ('BV-route-app', 's1', [(AP, '<Route path="don-thu" element={<DonThu />} />', '', 1)], r'✗ D12 App.jsx'),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_khsdt1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tmp, 'cong_cu'))
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
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
    ok, dong = True, []
    for bai in BAI:
      ma, ra = chay_bai(tmp, bai)
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      ok = ok and ma == 0 and m is not None and m.group(2) == '0'
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]))
    return ok, ' · '.join(dong)
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
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
