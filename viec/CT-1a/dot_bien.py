#!/usr/bin/env python3
"""CT-1a — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/CT-1a/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/CT-1a/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/CT-1a/dot_bien.py --help

Khuôn viec/MANKHACH-1/dot_bien.py: chép server/ + client/src/ + bài thử ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso.

KHÔNG có đột biến cho hai lớp phòng thủ lần hai của datNgaySinh (điều kiện `ngay_sinh IS <cũ>` trong câu UPDATE và kiểm `changes`):
giao dịch ghi đã tuần tự hoá hai máy (câu đầu mở khoá ghi), nên gỡ chúng đi bài thử vẫn xanh — đột biến sẽ SỐNG tương đương. Giữ theo
LUAT_XAY_APP §5; ghi ở trang_thai.md mục CHƯA KIỂM.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CT, KH, CV = 'server/routes/chuong-trinh.js', 'server/routes/kh/index.js', 'server/routes/customers-v2.js'
N17, BK, IX = 'server/nang_cap/017_chuong_trinh.js', 'server/routes/backup.js', 'server/index.js'
ST, CS, AP = 'client/src/pages/Settings.jsx', 'client/src/pages/Customers.jsx', 'client/src/utils/api.js'
BAI = {'ct': 'cong_cu/thu_CT1a.js'}

TUOI = 'tuoi >= khoang.toi_thieu && tuoi <= khoang.toi_da'

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── ngày sinh: ngày thật · tuổi ──
  ('BV-NGAY-KHONG-KIEM-LICH', 'ct', [(CT, 'dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d', 'true', 1)], r'✗ B7 '),
  ('VS-DANG-NGAY-LONG-LEO', 'ct', [(CT, r'/^\d{4}-\d{2}-\d{2}$/.test(s)', r'/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)', 1)], r'✗ B7 '),
  ('BV-TUOI-TOI-THIEU', 'ct', [(CT, TUOI, 'tuoi <= khoang.toi_da', 1)], r'✗ B7 '),
  ('VS-TUOI-TOI-THIEU-LECH', 'ct', [(CT, TUOI, 'tuoi > khoang.toi_thieu && tuoi <= khoang.toi_da', 1)], r'✗ B7b '),
  ('BV-TUOI-TOI-DA', 'ct', [(CT, TUOI, 'tuoi >= khoang.toi_thieu', 1)], r'✗ B7 '),
  ('VS-TUOI-TOI-DA-LECH', 'ct', [(CT, TUOI, 'tuoi >= khoang.toi_thieu && tuoi < khoang.toi_da', 1)], r'✗ B7b '),
  ('VS-TUOI-BO-QUA-SINH-NHAT', 'ct', [(CT, '- (m2 < m || (m2 === m && d2 < d) ? 1 : 0);', '- 0;', 1)], r'✗ B7 '),
  ('VS-TUOI-LAY-TUYET-DOI', 'ct', [(CT, TUOI, 'Math.abs(tuoi) >= khoang.toi_thieu && Math.abs(tuoi) <= khoang.toi_da', 1)], r'✗ B8c '),
  ('BV-KIEM-NGAY-SINH-TRUOC-GHI', 'ct', [(CT, "if (!ngaySinhHopLe(ngaySinh, await docKhoangTuoi())) return { loi: thanLoi('NGAY_SINH_SAI') };", '', 1)], r'✗ B7 '),
  # ── khoảng tuổi: đọc cài đặt · ghi cài đặt ──
  ('BV-KHOANG-TUOI-CAI-DAT', 'ct', [(CT, '? { toi_thieu: toiThieu, toi_da: toiDa } : { ...TUOI_MAC_DINH };', '? { ...TUOI_MAC_DINH } : { ...TUOI_MAC_DINH };', 1)], r'✗ B8 '),
  ('VS-KHOANG-TUOI-MIN-LON-MAX', 'ct', [(CT, '&& toiThieu <= toiDa && ', '&& ', 1)], r'✗ B8b '),
  ('BV-KHOANG-TUOI-KIEM-MIN-MAX', 'ct', [(CT, '|| toiThieu > toiDa) return traLoi', '|| false) return traLoi', 1)], r'✗ A10b '),
  ('VS-KHOANG-TUOI-TRAN-151', 'ct', [(CT, '!so(toiDa, 0, GIOI_HAN.TUOI_TRAN)', '!so(toiDa, 0, GIOI_HAN.TUOI_TRAN + 1)', 1)], r'✗ A10b '),
  # ── datNgaySinh: một lần · lý do · sổ ──
  ('BV-CHAN-DA-CO', 'ct', [(CT, "if (cu !== null && !choPhepSua) return await tuChoi('NGAY_SINH_DA_CO');", '', 1)], r'✗ C3 '),
  ('BV-BAT-LY-DO', 'ct', [(CT, "if (cu !== null && (!lyDoSach || [...lyDoSach].length > GIOI_HAN.LY_DO_TOI_DA)) return await tuChoi('LY_DO_BAT_BUOC');", '', 1)], r'✗ B3 '),
  ('VS-LY-DO-KHONG-CAT', 'ct', [(CT, "typeof lyDo === 'string' ? lyDo.trim() : ''", "typeof lyDo === 'string' ? lyDo : ''", 1)], r'✗ B3 '),
  ('VS-LY-DO-QUA-DAI-LOT', 'ct', [(CT, '[...lyDoSach].length > GIOI_HAN.LY_DO_TOI_DA', '[...lyDoSach].length > 100000', 1)], r'✗ B5d '),
  ('VS-LY-DO-DAI-SIET', 'ct', [(CT, '[...lyDoSach].length > GIOI_HAN.LY_DO_TOI_DA', '[...lyDoSach].length >= GIOI_HAN.LY_DO_TOI_DA', 1)], r'✗ B5d '),
  ('BV-GHI-SO-NGAY-SINH', 'ct', [(CT, "await tx.run('INSERT INTO pos_ngay_sinh_sua (phone, cu, moi, ly_do, boi, luc) VALUES (?, ?, ?, ?, ?, ?)', [phone, cu, ngaySinh, cu === null ? null : lyDoSach, nguoi, luc]);", '', 1)], r'✗ B1b '),
  ('VS-SO-GHI-NHAM-GIA-TRI-CU', 'ct', [(CT, '[phone, cu, ngaySinh, cu === null', '[phone, ngaySinh, ngaySinh, cu === null', 1)], r'✗ B4b '),
  ('VS-SO-GHI-LY-DO-LAN-DAU', 'ct', [(CT, 'cu === null ? null : lyDoSach, nguoi, luc]', 'lyDoSach, nguoi, luc]', 1)], r'✗ B1b '),
  ('BV-KHACH-KHONG-CO', 'ct', [(CT, "if (!kh) return await tuChoi('KHACH_KHONG_TON_TAI');", '', 1)], r'✗ B6 '),
  # ── chương trình: kiểm giá trị ──
  ('BV-UU-DAI-TOI-THIEU-MOT', 'ct', [(CT, 'g.mien_so_mon > 0 || g.giam_ca_don_pt > 0 || g.giam_con_lai_pt > 0,', 'true,', 1)], r'✗ A4 '),
  ('VS-GIAM-CA-DON-TRAN-101', 'ct', [(CT, 'so(g.giam_ca_don_pt, 0, 100)', 'so(g.giam_ca_don_pt, 0, 101)', 1)], r'✗ A4 '),
  ('VS-GIAM-CON-LAI-TRAN-101', 'ct', [(CT, 'so(g.giam_con_lai_pt, 0, 100)', 'so(g.giam_con_lai_pt, 0, 101)', 1)], r'✗ A4 '),
  ('VS-SO-NHAN-CHUOI', 'ct', [(CT, "typeof v === 'number' && Number.isInteger(v) && v >= tu && v <= den;", 'Number.isInteger(Number(v)) && Number(v) >= tu && Number(v) <= den;', 1)], r'✗ A4 '),
  ('BV-NGAY-KET-TRUOC-BAT-DAU', 'ct', [(CT, 'batDau === null || ketThuc === null || batDau <= ketThuc,', 'true,', 1)], r'✗ A4 '),
  ('VS-NGAY-BANG-NHAU-BI-CHAN', 'ct', [(CT, 'batDau <= ketThuc,', 'batDau < ketThuc,', 1)], r'✗ A4b '),
  ('BV-NGAY-CT-PHAI-THAT', 'ct', [(CT, 'batDau === null || laNgayThat(batDau), ketThuc === null || laNgayThat(ketThuc),', 'true, true,', 1)], r'✗ A4 '),
  ('VS-TEN-DAI-NOI', 'ct', [(CT, '[...ten].length <= GIOI_HAN.TEN_TOI_DA', '[...ten].length <= GIOI_HAN.TEN_TOI_DA + 1', 1)], r'✗ A4 '),
  ('VS-TEN-DAI-SIET', 'ct', [(CT, '[...ten].length <= GIOI_HAN.TEN_TOI_DA', '[...ten].length < GIOI_HAN.TEN_TOI_DA', 1)], r'✗ A4b '),
  ('VS-MO-TA-DAI-NOI', 'ct', [(CT, '[...moTa.trim()].length <= GIOI_HAN.MO_TA_TOI_DA', '[...moTa.trim()].length <= GIOI_HAN.MO_TA_TOI_DA + 1', 1)], r'✗ A4 '),
  ('BV-LOAI-PHAI-TRONG-DANH-SACH', 'ct', [(CT, 'LOAI.includes(g.loai),', 'true,', 1)], r'✗ A4 '),
  ('BV-KY-PHAI-TRONG-DANH-SACH', 'ct', [(CT, 'KY_GIOI_HAN.includes(g.gioi_han_ky),', 'true,', 1)], r'✗ A4 '),
  ('VS-SO-LAN-CHO-0', 'ct', [(CT, 'so(g.gioi_han_so, 1, GIOI_HAN.SO_LAN_TOI_DA)', 'so(g.gioi_han_so, 0, GIOI_HAN.SO_LAN_TOI_DA)', 1)], r'✗ A4 '),
  ('VS-SO-LAN-TRAN-100', 'ct', [(CT, 'so(g.gioi_han_so, 1, GIOI_HAN.SO_LAN_TOI_DA)', 'so(g.gioi_han_so, 1, GIOI_HAN.SO_LAN_TOI_DA + 1)', 1)], r'✗ A4 '),
  ('VS-MIEN-MON-TRAN-21', 'ct', [(CT, 'so(g.mien_so_mon, 0, GIOI_HAN.MIEN_MON_TOI_DA)', 'so(g.mien_so_mon, 0, GIOI_HAN.MIEN_MON_TOI_DA + 1)', 1)], r'✗ A4 '),
  ('VS-GIA-MIEN-CHO-0', 'ct', [(CT, 'so(g.mien_gia_toi_da, 1, GIOI_HAN.GIA_MIEN_TOI_DA)', 'so(g.mien_gia_toi_da, 0, GIOI_HAN.GIA_MIEN_TOI_DA)', 1)], r'✗ A4 '),
  ('BV-CO-PHAI-LA-BOOL', 'ct', [(CT, 'laBool(g.chi_tai_quan), laBool(g.can_xem_giay_to), laBool(g.dang_bat),', 'true, true, true,', 1)], r'✗ A4 '),
  # ── chương trình: quyền · sửa từng phần ──
  ('BV-QUYEN-QUAN-LY-KHUYEN-MAI', 'ct', [(CT, "const quyen = [authenticate, checkPermission('manage_promotions')];", 'const quyen = [authenticate];', 1)], r'✗ A2b '),
  ('BV-DANG-NHAP-CHUONG-TRINH', 'ct', [(CT, "const quyen = [authenticate, checkPermission('manage_promotions')];", "const quyen = [checkPermission('manage_promotions')];", 1)], r'✗ A2a '),
  ('VS-SUA-MAT-TRUONG-KHONG-GUI', 'ct', [(CT, 'kiemChuongTrinh(dangApi(dong), req.body)', 'kiemChuongTrinh({}, req.body)', 1)], r'✗ A5 '),
  # ── GET /chuong-trinh (App) ──
  ('BV-LOC-DANG-BAT', 'ct', [(CT, 'WHERE dang_bat = 1 AND (bat_dau', 'WHERE (bat_dau', 1)], r'✗ C7 '),
  ('BV-LOC-NGAY-BAT-DAU', 'ct', [(CT, '(bat_dau IS NULL OR bat_dau <= ?)', '(? IS NOT NULL)', 1)], r'✗ C7 '),
  ('BV-LOC-NGAY-KET-THUC', 'ct', [(CT, '(ket_thuc IS NULL OR ket_thuc >= ?)', '(? IS NOT NULL)', 1)], r'✗ C7 '),
  ('VS-LOC-BAT-DAU-LECH', 'ct', [(CT, 'bat_dau <= ?', 'bat_dau < ?', 1)], r'✗ C7 '),
  ('VS-LOC-KET-THUC-LECH', 'ct', [(CT, 'ket_thuc >= ?', 'ket_thuc > ?', 1)], r'✗ C7 '),
  ('VS-LOC-SAI-THU-TU', 'ct', [(CT, 'ORDER BY id`, [nay, nay]', 'ORDER BY id DESC`, [nay, nay]', 1)], r'✗ C7 '),
  ('VS-CONG-KHAI-LO-UU-DAI', 'ct', [(CT, 'SELECT ma, ten, mo_ta, loai FROM pos_chuong_trinh', 'SELECT ma, ten, mo_ta, loai, giam_ca_don_pt FROM pos_chuong_trinh', 1),
                                     (CT, 'loai: r.loai, dang_bat: true }', 'loai: r.loai, giam_ca_don_pt: r.giam_ca_don_pt, dang_bat: true }', 1)], r'✗ C8 '),
  ('BV-CONG-KHAI-KHONG-TRAN-LUOT', 'ct', [(KH, "if (!giuLuotMenu(req.ip || '')) return bao(res, 'QUA_NHIEU_LAN');\n    res.json({ success: true, data: await chuongTrinh", 'res.json({ success: true, data: await chuongTrinh', 1)], r'✗ A17 '),
  ('VS-CONG-KHAI-DOI-TOKEN', 'ct', [(KH, "router.get('/chuong-trinh', async (req, res) => {", "router.get('/chuong-trinh', xacThucKhach, async (req, res) => {", 1)], r'✗ C7 '),
  # ── kh/index.js: PUT /toi · hồ sơ ──
  ('BV-HOSO-NGAY-SINH', 'ct', [(KH, ', ngay_sinh: kh.ngay_sinh ?? null });', ' });', 1)], r'✗ C1 '),
  ('BV-PUT-TOI-NHAN-NGAY-SINH', 'ct', [(KH, "const coNgaySinh = 'ngay_sinh' in b;", 'const coNgaySinh = false;', 1)], r'✗ C2 '),
  ('VS-PUT-TOI-APP-SUA-DUOC', 'ct', [(KH, "nguoi: 'app_kh', choPhepSua: false", "nguoi: 'app_kh', choPhepSua: true", 1)], r'✗ C3 '),
  ('VS-PUT-TOI-BO-QUA-LOI-NGAY-SINH', 'ct', [(KH, 'if (kq.loi) return res.status(kq.loi.status).json({ error: kq.loi.error, code: kq.loi.code });', '', 1)], r'✗ C3 '),
  # ── customers-v2.js: quầy ──
  ('BV-QUYEN-SUA-NGAY-SINH', 'ct', [(CV, 'return quyenSuaNgaySinh(req, res, () => { req.duocSuaNgaySinh = true; next(); });', 'req.duocSuaNgaySinh = true; return next();', 1)], r'✗ B2 '),
  ('VS-QUYEN-SUA-NHAM-QUYEN-KHAC', 'ct', [(CV, "checkPermission('sua_ngay_sinh')", "checkPermission('manage_promotions')", 1)], r'✗ B2 '),
  ('VS-NHAP-LAN-DAU-CUNG-CAN-QUYEN', 'ct', [(CV, '    if (kh.ngay_sinh == null) return next();   // đang trống: nhân viên nào cũng nhập được\n', '', 1)], r'✗ B1 '),
  ('BV-QUAY-KHACH-KHONG-CO', 'ct', [(CV, "if (!kh) return traLoiNgaySinh(res, thanLoi('KHACH_KHONG_TON_TAI'));", '', 1)], r'✗ B6 '),
  ('BV-QUAY-SDT-HONG', 'ct', [(CV, "if (!phone || !isValidPhone(phone)) return traLoiNgaySinh", 'if (!phone) return traLoiNgaySinh', 1)], r'✗ B6 '),
  ('BV-QUAY-NGAY-SINH-KHONG-DANG-NHAP', 'ct', [(CV, 'router.put("/:phone/ngay-sinh", authenticate, async', 'router.put("/:phone/ngay-sinh", async', 1)], r'✗ B6b '),
  ('BV-DANH-SACH-KHACH-NGAY-SINH', 'ct', [(CV, '        ngay_sinh: extras?.ngay_sinh || null,   // CT-1a\n', '', 2)], r'✗ B9 '),
  # ── bước 017 ──
  ('VS-017-QUYEN-NHAN-VIEN', 'ct', [(N17, "['staff', 0]]", "['staff', 1]]", 1)], r'✗ 0e '),
  ('VS-017-QUYEN-QUAN-LY', 'ct', [(N17, "['manager', 0]", "['manager', 1]", 1)], r'✗ 0e '),
  ('BV-017-COT-NGAY-SINH', 'ct', [(N17, "if (await co(tx, 'pos_customers')) await themCot('pos_customers', 'ngay_sinh TEXT');", '', 1)], r'✗ 0a '),
  ('BV-017-BANG-SO', 'ct', [(N17, 'CREATE TABLE IF NOT EXISTS pos_ngay_sinh_sua (', 'CREATE TABLE IF NOT EXISTS pos_ngay_sinh_sua_x (', 1)], r'✗ 0b '),
  ('VS-017-MAU-BAT-SAN', 'ct', [(N17, '?, 1, 1, ?, 1, 0, ?)`', '?, 1, 1, ?, 1, 1, ?)`', 1)], r'✗ A1 '),
  ('VS-017-MAU-HOC-SINH-GIOI-KY', 'ct', [(N17, "'hoc_sinh_gioi', 1, 0, 50, 'nam_hoc']", "'hoc_sinh_gioi', 1, 0, 50, 'nam']", 1)], r'✗ A1b '),
  ('VS-017-MAU-SINH-NHAT-DOI-CHO', 'ct', [(N17, "'sinh_nhat', 0, 50, 0, 'nam']", "'sinh_nhat', 0, 0, 50, 'nam']", 1)], r'✗ A1c '),
  # ── sao lưu · gắn route ──
  ('BV-SAO-LUU-CHUONG-TRINH', 'ct', [(BK, "  { name: 'pos_chuong_trinh', label:", "  { name: 'pos_chuong_trinh_x', label:", 1)], r'✗ 0f '),
  ('BV-SAO-LUU-SO-NGAY-SINH', 'ct', [(BK, "  { name: 'pos_ngay_sinh_sua', label:", "  { name: 'pos_ngay_sinh_sua_x', label:", 1)], r'✗ 0f '),
  ('BV-SO-NGAY-SINH-KHOI-PHUC-DUOC', 'ct', [(BK, "  'pos_ngay_sinh_sua'];   //", "  'pos_x'];   //", 1)], r'✗ 0f '),
  ('BV-GAN-ROUTE-CHUONG-TRINH', 'ct', [(IX, "app.use('/api/pos/chuong-trinh', require('./routes/chuong-trinh'));", '', 1)], r'✗ D0 '),
  # ── giao diện (bài đọc tĩnh) ──
  ('BV-THE-CHUONG-TRINH-TRONG-NHOM', 'ct', [(ST, "['chuongTrinh', 'manage_promotions'],", '', 1)], r'✗ D1 '),
  ('VS-CUSTOMERS-SUA-KHONG-HOI-QUYEN', 'ct', [(CS, "hasPermission('sua_ngay_sinh')", 'true', 1)], r'✗ D5 '),
  ('BV-API-NGAY-SINH', 'ct', [(AP, '/ngay-sinh`', '/ngaysinh`', 1)], r'✗ D3 '),
]


def ban_sao(thay):
  """Chép server/ + client/src/ + bài thử ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_ct1a_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  os.makedirs(os.path.join(tmp, 'cong_cu'))
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
