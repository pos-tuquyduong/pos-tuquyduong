#!/usr/bin/env python3
"""QUAY-UI-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/QUAY-UI-1/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/QUAY-UI-1/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/QUAY-UI-1/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)

Khuôn viec/KHACH-APP-1/dot_bien.py: chép server/, client/src/, cong_cu/, kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node <tạm>/cong_cu/<bài>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DM, RG = 'server/routes/damages.js', 'server/routes/registrations.js'
TI = 'client/src/pages/BanHang/tinh.js'
BH, TT = 'client/src/pages/BanHang/BanHangMoi.jsx', 'client/src/pages/BanHang/ThuTien.jsx'
CU, OR = 'client/src/pages/Customers.jsx', 'client/src/pages/Orders.jsx'
CHEP = ['server', 'client/src', 'cong_cu', 'kiem_tra_truoc_khi_giao.js']
T = 'thu_QUAYUI1.js'
SQL_SUA = "WHERE phone = ? AND created_by = ? AND created_at >= ?',"
PAR_SUA = 'getNow(), existing.phone, existing.created_by, existing.created_at]);'
GOI_DON_NAP = "if (await laDonNap(tx, order.id)) return loi(400, LOI_DON_NAP, 'DON_NAP_KHONG_SU_CO');"

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── D: máy chủ damages.js ──
  ('BV-DON-NAP-GO-CHAN', [(DM, GOI_DON_NAP, "if (false && await laDonNap(tx, order.id)) return loi(400, LOI_DON_NAP, 'DON_NAP_KHONG_SU_CO');", 1)], r'✗ D1 đơn nạp, hành động refund', T),
  ('VS-DON-NAP-CHI-HOAN-TIEN', [(DM, GOI_DON_NAP, "if (action === 'refund' && await laDonNap(tx, order.id)) return loi(400, LOI_DON_NAP, 'DON_NAP_KHONG_SU_CO');", 1)], r'✗ D1 đơn nạp, hành động none', T),
  ('VS-DON-NAP-MA-CU', [(DM, "return loi(400, LOI_DON_NAP, 'DON_NAP_KHONG_SU_CO');", "return loi(400, LOI_DON_NAP, 'GOI_THE_KHONG_DEN');", 1)], r'✗ D1 đơn nạp, hành động refund', T),
  ('VS-DON-NAP-CAU-CU', [(DM, "const LOI_DON_NAP = 'Đơn nạp tiền không xử lý sự cố — tiền nạp không hoàn';", "const LOI_DON_NAP = 'Gói / thẻ trả trước không đền qua báo sự cố — dùng Huỷ đơn';", 1)], r'✗ D1 đơn nạp, hành động refund', T),
  ('VS-DON-NAP-CHAN-CA-THE', [(DM, GOI_DON_NAP, "if ((await tx.queryOne('SELECT 1 AS co FROM pos_order_items WHERE order_id = ? AND product_id < 0', [order.id]))) return loi(400, LOI_DON_NAP, 'DON_NAP_KHONG_SU_CO');", 1)], r'✗ D3 ', T),
  ('VS-DON-NAP-CHAN-DON-THUONG', [(DM, GOI_DON_NAP, "if (true) return loi(400, LOI_DON_NAP, 'DON_NAP_KHONG_SU_CO');", 1)], r'✗ D2 ', T),
  # ── E: máy chủ registrations.js (PUT) ──
  ('BV-SUA-DK-GO-DIEU-KIEN', [(RG, SQL_SUA, "WHERE phone = ?',", 1), (RG, PAR_SUA, 'getNow(), existing.phone]);', 1)], r'✗ E2 ', T),
  ('VS-SUA-DK-CHI-NGUOI-NHAP', [(RG, SQL_SUA, "WHERE phone = ? AND created_by = ?',", 1), (RG, PAR_SUA, 'getNow(), existing.phone, existing.created_by]);', 1)], r'✗ E3 ', T),
  ('VS-SUA-DK-CHI-GIO-TAO', [(RG, SQL_SUA, "WHERE phone = ? AND created_at >= ?',", 1), (RG, PAR_SUA, 'getNow(), existing.phone, existing.created_at]);', 1)], r'✗ E4 ', T),
  ('VS-SUA-DK-CHAN-LUON', [(RG, SQL_SUA, "WHERE phone = ? AND created_by = ? AND created_at >= ? AND 0',", 1)], r'✗ E1 ', T),
  # ── A: thẻ (tinh.js) ──
  ('BV-THE-KHONG-GUI', [(TI, "    ...(the ? { membership_buy: { tier_id: the.the.tier_id, so_thang: the.the.so_thang } } : {}),\n", '', 1)], r'✗ A2 thanTinhThu: món', T),
  ('VS-THE-CON-TRONG-ITEMS', [(TI, 'items: gio.filter((m) => !m.the).map((m) => ({', 'items: gio.map((m) => ({', 1)], r'✗ A2 thanTinhThu: món', T),
  ('VS-THE-GUI-GIA', [(TI, "membership_buy: { tier_id: the.the.tier_id, so_thang: the.the.so_thang } }", "membership_buy: { tier_id: the.the.tier_id, so_thang: the.the.so_thang, gia: the.unit_price } }", 1)], r'✗ A2 thanTinhThu: món', T),
  ('BV-THE-KHOA', [(TI, ", ...(the ? { the: [the.the.tier_id, the.the.so_thang] } : {}) });", ' });', 1)], r'✗ A3 khoá', T),
  ('VS-THE-GIAM-HANG', [(TI, 'm.goi_nap_id || m.the ? m.unit_price', 'm.goi_nap_id ? m.unit_price', 1)], r'✗ A4 ', T),
  ('VS-THE-GOI-GIA-0', [(TI, 'Number.isInteger(g.gia) && g.gia > 0).sort((a, b) => a.so_thang', 'Number.isInteger(g.gia)).sort((a, b) => a.so_thang', 1)], r'✗ A1 chỉ gói', T),
  ('VS-THE-GOI-TAT', [(TI, '.filter((g) => g.bat === true && Number.isInteger(g.gia)', '.filter((g) => Number.isInteger(g.gia)', 1)], r'✗ A1 chỉ gói', T),
  ('VS-THE-HANG-CAP-BAN', [(TI, "filter((t) => t.cach_co === 'ban').flatMap", 'filter(() => true).flatMap', 1)], r'✗ A1 chỉ gói', T),
  ('BV-THE-KHONG-CAN-KHACH', [(TI, "  if (!khach?.phone) return 'Chọn khách trước khi bán thẻ thành viên';\n", '', 1)], r'✗ A5 chưa chọn khách', T),
  ('VS-THE-CHO-HANG-CAP', [(TI, "  if (tier.cach_co !== 'ban') return `Hạng ${tier.name}: Chủ quán cấp — không bán ở quầy`;\n", '', 1)], r'✗ A5 hạng chỉ cấp', T),
  ('VS-THE-CHUNG-GIO-NAP', [(TI, "  if (layGoiNap(gio)) return 'Giỏ đang là gói nạp — thu xong hoặc xoá giỏ rồi mới bán thẻ';\n", '', 1)], r'✗ A5 giỏ đang là gói nạp', T),
  ('VS-THE-NHIEU-THE', [(TI, "  if (layThe(gio)) return 'Giỏ đã có một thẻ thành viên — xoá thẻ cũ trước nếu muốn đổi';\n", '', 1)], r'✗ A5 giỏ đã có một thẻ', T),
  ('VS-THE-CHAN-GIO-CO-MON', [(TI, "  if (layThe(gio)) return 'Giỏ đã có", "  if (gio.length) return 'Giỏ đang có món';\n  if (layThe(gio)) return 'Giỏ đã có", 1)], r'✗ A5 giỏ có món', T),
  ('VS-THE-HANG-CAO-HET-HAN', [(TI, 'if (hang?.usable && Number(hang.thu_bac)', 'if (Number(hang?.thu_bac)', 1)], r'✗ A5 hạng cao hơn nhưng đã HẾT HẠN', T),
  ('VS-THE-HANG-CAO-CUNG-BAC', [(TI, 'Number(hang.thu_bac) > Number(tier.sort_order)) return `Khách đang có hạng', 'Number(hang.thu_bac) >= Number(tier.sort_order)) return `Khách đang có hạng', 1)], r'✗ A5 khách có hạng cùng bậc', T),
  ('BV-THE-HANG-CAO-KHONG-CHAN', [(TI, 'if (hang?.usable && Number(hang.thu_bac) > Number(tier.sort_order)) return `Khách', 'if (false) return `Khách', 1)], r'✗ A5 khách đang có hạng CAO HƠN', T),
  # ── B: cách trả (tinh.js) ──
  ('VS-TRU-MAC-DINH', [(TI, "export const CACH_TRA_MAC_DINH = 'tien_mat';", "export const CACH_TRA_MAC_DINH = 'tai_khoan';", 1)], r'✗ B2 ', T),
  ('BV-TRU-KHONG-LY-DO-SO-DU', [(TI, "  if (so(khach.balance) + so(khach.parent_balance) <= 0) return 'Khách chưa có số dư';\n", '', 1)], r'✗ B1 khách không có số dư', T),
  ('VS-TRU-BO-SO-DU-ME', [(TI, 'if (so(khach.balance) + so(khach.parent_balance) <= 0)', 'if (so(khach.balance) <= 0)', 1)], r'✗ B1 chỉ tài khoản mẹ', T),
  ('VS-TRU-NAP', [(TI, "  if (laNap) return 'Đơn nạp chỉ trả tiền mặt hoặc chuyển khoản';\n", '', 1)], r'✗ B1 đơn nạp', T),
  ('BV-TRU-CHUA-CHON-KHACH', [(TI, "  if (!khach) return 'Chọn khách để trừ tài khoản';\n", '  if (!khach) return null;\n', 1)], r'✗ B1 chưa chọn khách', T),
  # ── giao diện: đọc nguồn ──
  ('BV-BH-TAB-THE', [(BH, '>Thẻ thành viên</button>', '>Thẻ</button>', 1)], r'✗ A7 BanHangMoi có tab', T),
  ('BV-BH-KHONG-KIEM-THE', [(BH, 'const e = kiemTraThe(gio, khach, hang, tier);', 'const e = null;', 1)], r'✗ A7 chạm gói', T),
  ('BV-BH-TRU-MAC-DINH', [(BH, 'useState(CACH_TRA_MAC_DINH)', "useState('tai_khoan')", 1)], r'✗ B4 BanHangMoi: có trạng thái', T),
  ('BV-BH-TU-TRU-LAI', [(BH, 'setCachTra(CACH_TRA_MAC_DINH); setDungMe(false); setHang(null);', "setCachTra('tai_khoan'); setDungMe(false); setHang(null);", 1)], r'✗ B4b ', T),
  ('BV-TT-NUT-TRU', [(TT, '>Trừ tài khoản</button>', '>Trừ TK</button>', 1)], r'✗ B5 ThuTien có đủ ba nút', T),
  ('BV-TT-KHONG-LY-DO', [(TT, 'const lyDoMo = lyDoKhongTru({ khach, laNap });', 'const lyDoMo = null;', 1)], r'✗ B5 ThuTien: nút Trừ', T),
  ('BV-TT-NUT-BO-CU', [(TT, 'onClick={() => onDungMe(false)}>Không dùng', 'onClick={() => { onDungMe(false); onDungTK(false); }}>Không dùng', 1)], r'✗ B5 ThuTien: chọn cách trả', T),
  ('BV-CUS-KHONG-TRA', [(CU, 'customersV2Api.search(sdtChuan)', 'Promise.resolve({ results: [] })', 1)], r'✗ C1 ', T),
  ('BV-CUS-NUT-LUU', [(CU, 'disabled={submitting || !!khachTrung}', 'disabled={submitting}', 1)], r'✗ C3 ', T),
  ('VS-CUS-SO-CHUOI-CON', [(CU, '.find((c) => c.phone === sdtChuan)', '.find((c) => c.phone.includes(sdtChuan))', 1)], r'✗ C4 ', T),
  ('BV-CUS-KHONG-BAO', [(CU, '{khachTrung && <div className="alert alert-danger" style={{ marginTop: 6 }}>Khách đã có: ', '{false && <div className="alert alert-danger" style={{ marginTop: 6 }}>Khách đã có: ', 1)], r'✗ C2 ', T),
  ('BV-ORD-NUT-SU-CO', [(OR, '!laDonNap(selectedOrder) && ', '', 1)], r'✗ D4 ', T),
]


def lam_cay(tmp):
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))


def chep(nguon_sha, tmp, phan):
  """Đổ `phan` vào tmp: nguon_sha None = cây làm việc hiện tại (copytree), có sha = git archive commit đó."""
  if nguon_sha is None:
    for p in phan:
      a, b = os.path.join(GOC, p), os.path.join(tmp, p)
      os.makedirs(os.path.dirname(b), exist_ok=True)
      (shutil.copytree(a, b, ignore=shutil.ignore_patterns('node_modules')) if os.path.isdir(a) else shutil.copyfile(a, b))
  else:
    tar = subprocess.run(['git', 'archive', nguon_sha, *phan], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_quayui1_')
  chep(None, tmp, CHEP)
  lam_cay(tmp)
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
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', bai)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, (r.stdout or '') + (r.stderr or '')


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if ma == 2 or 'BÀI SẬP' in ra or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai_ds):
  tmp, _ = ban_sao([])
  try:
    kq = []
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      dong = [l.strip() for l in ra.splitlines() if re.search(r'\d+ đạt · \d+ hỏng|TỔNG: \d+/\d+ ca đạt', l)]
      kq.append((bai, ma, dong[-1] if dong else ra.strip()[-160:]))
    return all(m == 0 for _, m, _ in kq), kq
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bang_chung(sha, bai_ds):
  """Bài HIỆN TẠI (cong_cu/ của cây làm việc) trên server/ + client/src/ của commit sha."""
  tmp = tempfile.mkdtemp(prefix='dotbien_quayui1_goc_')
  try:
    chep(sha, tmp, ['server', 'client/src'])
    chep(None, tmp, ['cong_cu', 'kiem_tra_truoc_khi_giao.js'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} (bài HIỆN TẠI trên code {sha}):')
      print('\n'.join('  ' + l.strip() for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng|TỔNG: ', l) or 'SẬP' in l))
      print(f'  thoát {ma}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    i = sys.argv.index('--goc')
    bang_chung(sys.argv[i + 1], sys.argv[i + 2:]); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, kq_dc = doi_chung(sorted({d[3] for d in ds}))
  for bai, ma, dong in kq_dc: print(f'ĐỐI CHỨNG {bai}: thoát {ma} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
