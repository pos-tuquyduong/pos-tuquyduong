#!/usr/bin/env python3
"""SEPAY-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/SEPAY-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/SEPAY-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/SEPAY-1/dot_bien.py --help

Khuôn viec/KH-MUA-1/dot_bien.py: chép server/, hai bài thử, bộ kiểm (phép T3) và cai_dat_sepay.md (phép F1) ra thư mục tạm (BẢN CHÉP THẬT —
chỉ node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SP, VQ, CQ, GC = 'server/utils/sepay.js', 'server/utils/vietQr.js', 'server/utils/congQr.js', 'server/utils/giuCho.js'
TT, IX, DS = 'server/routes/thanh-toan.js', 'server/index.js', 'server/utils/doiSoat.js'
BAI = {'sp': 'cong_cu/thu_SEPAY1.js', 'p3': 'cong_cu/thu_P3.js'}
CHEP = list(BAI.values()) + ['kiem_tra_truoc_khi_giao.js', 'viec/SEPAY-1/cai_dat_sepay.md']

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── C: xác thực webhook SePay ──
  ('BV-chu-ky', 'sp', [(SP, '  return a.length === b.length && crypto.timingSafeEqual(a, b);\n', '  return true;\n', 1)], r'✗ C1 '),
  ('VS-ky-lai-json', 'sp', [(SP, ".update(ts + '.').update(than)", ".update(ts + '.' + JSON.stringify(JSON.parse(than)))", 1)], r'✗ C3 mốc giờ cũ 298'),
  ('BV-moc-gio', 'sp', [(SP, '\n    || Math.abs(giayBayGio - Number(ts)) > LECH_TOI_DA_GIAY) return false;', ') return false;', 1)], r'✗ C3 mốc giờ cũ 302'),
  ('VS-moc-gio-mot-phia', 'sp', [(SP, 'Math.abs(giayBayGio - Number(ts)) > LECH_TOI_DA_GIAY', 'giayBayGio - Number(ts) > LECH_TOI_DA_GIAY', 1)], r'✗ C4 '),
  ('VS-nguong-6-phut', 'sp', [(SP, 'const LECH_TOI_DA_GIAY = 300;', 'const LECH_TOI_DA_GIAY = 360;', 1)], r'✗ C3 mốc giờ cũ 302'),
  ('VS-nguong-290-giay', 'sp', [(SP, 'const LECH_TOI_DA_GIAY = 300;', 'const LECH_TOI_DA_GIAY = 290;', 1)], r'✗ C3 mốc giờ cũ 298'),
  # ── C: đọc báo · chống trùng · khớp phiên ──
  ('BV-chong-trung', 'sp', [(SP, 'khoa: `sepay:${b.id}`', 'khoa: `sepay:${b.id}:${Date.now()}${Math.random()}`', 1)], r'✗ C(5|6) '),
  ('VS-tien-ra', 'sp', [(TT, "boQua: !d.vao ? 'SePay báo tiền ra' : ", 'boQua: ', 1)], r'✗ C8 '),
  ('VS-ma-dau-chuoi', 'sp', [(SP, r"const MA_PHIEN = /TQD(\d{1,6})(?!\d)/i;", r"const MA_PHIEN = /^TQD(\d{1,6})(?!\d)/i;", 1)], r'✗ C11 '),
  ('VS-ma-khong-chan-so', 'sp', [(SP, r"const MA_PHIEN = /TQD(\d{1,6})(?!\d)/i;", r"const MA_PHIEN = /TQD(\d{1,6})/i;", 1)], r'✗ C10b '),
  ('VS-ma-chi-code', 'sp', [(SP, " || MA_PHIEN.exec(String(b.content ?? ''))", '', 1)], r'✗ C11 '),
  ('VS-nguon-sepay-thanh-payos', 'sp', [(TT, "nguon: 'sepay',   // không lưu số dư", "nguon: 'payos',   // không lưu số dư", 1)], r'✗ (A7|C5) '),
  ('BV-hai-cong', 'sp', [(TT, "sau.trang_thai === 'da_thu' && TEN_CONG[sau.nguon] && sau.nguon !== t.nguon", 'false', 1)], r'✗ C14b '),
  ('BV-5xx-tra-loi', 'sp', [(TT, "  if (kq.status >= 500 || kq.body?.code === 'KHO_BAN') return tra(res, kq);\n", '', 1)], r'✗ C16 '),
  ('VS-tra-202', 'sp', [(TT, 'await run(CAU_GHI, thamSo(ketQua, lyDo)); res.json({ success: true });', 'await run(CAU_GHI, thamSo(ketQua, lyDo)); res.status(202).json({ success: true });', 1)], r'✗ C8 '),
  ('BV-raw', 'sp', [(IX, "app.use('/api/sepay/webhook', express.raw({ type: '*/*', limit: '100kb' }));\n", '', 1)], r'✗ T1 '),
  # ── A: công tắc ──
  ('VS-cong-mac-dinh-sepay', 'sp', [(CQ, "const MAC_DINH = 'payos';", "const MAC_DINH = 'sepay';", 1)], r'✗ A1 '),
  ('VS-cong-la-thanh-payos', 'sp', [(CQ, 'Object.hasOwn(CONG, ten) ? CONG[ten] : null', 'CONG[ten] || CONG.payos', 1)], r'✗ A3 '),
  ('BV-giuCho-kiem-cau-hinh', 'sp', [(GC, "if (cach === 'payos' && !cong?.daCauHinh())", "if (cach === 'payos' && !cong)", 1)], r'✗ A2 '),
  ('BV-dang-bin-so-tk', 'sp', [(SP, r"/^\d{6}$/.test(c.bin) && /^[0-9A-Za-z]{1,19}$/.test(c.soTk) && !!c.khoa", '!!(c.bin && c.soTk && c.khoa)', 1)], r'✗ A2 .*sai dạng'),
  ('VS-doc-cong-ngoai', 'sp', [(GC, "const cong = cach === 'payos' ? congQr() : null;", "const cong = cach === 'payos' ? (process.env.CONG_QR === 'x' ? null : congQr()) : null;", 1)], r'✗ A4 '),
  # ── B: VietQR ──
  ('VS-so-tien-tong', 'sp', [(GC, 'soTien: phien.con_lai,', 'soTien: phien.tong,', 1)], r'✗ B1 VietQR: BIN'),
  ('VS-crc-sai', 'sp', [(VQ, '((c << 1) ^ 0x1021) & 0xffff', '((c << 1) ^ 0x8005) & 0xffff', 1)], r'✗ B2 CRC'),
  ('VS-qr-tinh', 'sp', [(VQ, "truong('01', '12')", "truong('01', '11')", 1)], r'✗ B1 VietQR: 00=01'),
  # ── D: Đối soát ──
  ('BV-nguon-doi-soat', 'sp', [(DS, 'mo_ta: `${nguon(r)}: về', 'mo_ta: `payOS mã ${r.ma_payos}: về', 1)], r'✗ D1 '),
  # vòng sửa 1 (soát vòng 1 lỗi 2): dòng "hai cổng … KHÔNG hoàn" ở CẦN XEM; dòng "xác nhận tay … KHÔNG hoàn" cũ giữ ĐỎ
  ('BV-hai-cong-can-xem', 'sp', [(DS, '[LY_DO_HAI_CONG, LY_DO_TK_KHAC].some', '[LY_DO_TK_KHAC].some', 1)], r'✗ D2 dòng "cùng một khoản'),
  ('VS-can-xem-moi-khong-hoan', 'sp', [(DS, '[LY_DO_HAI_CONG, LY_DO_TK_KHAC].some', "['KHÔNG hoàn', LY_DO_TK_KHAC].some", 1)], r'✗ D2 dòng "đã xác nhận tay'),
  # vòng sửa 2 (soát vòng 2): "hai cổng" chỉ khi cổng này chưa báo; hai chiều; thân thiếu id; không lưu số dư
  ('BV-hai-cong-da-bao', 'sp', [(TT, ' && sau.nguon !== t.nguon && !daBao', ' && sau.nguon !== t.nguon', 1)], r'✗ C14c '),
  ('VS-hai-cong-mot-chieu', 'sp', [(TT, ' && sau.nguon !== t.nguon && !daBao', " && t.nguon === 'sepay' && sau.nguon === 'payos' && !daBao", 1)], r'✗ C14d '),
  ('BV-bao-thieu-id', 'sp', [(TT, ' || b.id == null)', ')', 1)], r'✗ C9b '),
  ('BV-luu-so-du', 'sp', [(TT, 'duLieu: { ...b, accumulated: undefined }', 'duLieu: b', 1)], r'✗ C5b '),
  # vòng sửa 4 (sổ QUYET_DINH 01.11): Q5 máy SO số tài khoản nhận (bỏ khoảng trắng) với SEPAY_SO_TK; Q4 hướng dẫn tắt lọc
  ('BV-tk-khac', 'sp', [(TT, "  if (t.tkKhac) return ghi('chua_khop', `${LY_DO_TK_KHAC} ${t.tkKhac}`);\n", '', 1)], r'✗ Q5a '),
  ('VS-tk-so-dai-hon', 'sp', [(SP, "tkKhac: tk === cauHinh().soTk ? null : tk || '(trống)' };", "tkKhac: tk.startsWith(cauHinh().soTk) ? null : tk || '(trống)' };", 1)], r'✗ Q5b '),
  ('VS-tk-so-ngan-hon', 'sp', [(SP, "tkKhac: tk === cauHinh().soTk ? null : tk || '(trống)' };", "tkKhac: cauHinh().soTk.startsWith(tk) ? null : tk || '(trống)' };", 1)], r'✗ Q5c '),
  ('VS-tk-thieu-van-chot', 'sp', [(SP, "tkKhac: tk === cauHinh().soTk ? null : tk || '(trống)' };", "tkKhac: !tk || tk === cauHinh().soTk ? null : tk };", 1)], r'✗ Q5d '),
  ('VS-tk-khong-bo-trang', 'sp', [(SP, ".replace(/\\s+/g, '');   // số tài khoản nhận", ";   // số tài khoản nhận", 1)], r'✗ Q5e '),
  ('BV-tk-can-xem', 'sp', [(DS, '[LY_DO_HAI_CONG, LY_DO_TK_KHAC].some', '[LY_DO_HAI_CONG].some', 1)], r'✗ D3 '),
  ('VS-huong-dan-bat-loc', 'sp', [('viec/SEPAY-1/cai_dat_sepay.md', 'không có mã thanh toán:** TẮT', 'không có mã thanh toán:** bật', 1)], r'✗ F2 .*TẮT lọc'),
  ('VS-huong-dan-khong-so-tk', 'sp', [('viec/SEPAY-1/cai_dat_sepay.md', 'Máy chủ SO số tài khoản', 'Máy chủ KHÔNG so số tài khoản', 1)], r'✗ F2 .*so số tài khoản'),
  # ── hàm chung xuLyTienVe: webhook payOS cũ (thu_P3) canh ──
  ('BV-lech-tien-ham-chung', 'p3', [(TT, "const lyDo = t.soTien !== p.con_lai ? ", 'const lyDo = false ? ', 1)], r'✗ B6 '),
]


def ban_sao(thay):
  """Chép server/ + bài thử + bộ kiểm + hướng dẫn ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_sepay1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))   # doiSoat.js nạp bat_bien.js ở đây
  for f in CHEP:
    os.makedirs(os.path.dirname(os.path.join(tmp, f)), exist_ok=True)
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'Bài thử sập' in ra:
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
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]) + ''.join(' | ' + l.strip()[:140] for l in ra.splitlines() if '✗' in l))
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
