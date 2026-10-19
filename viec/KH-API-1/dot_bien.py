#!/usr/bin/env python3
"""KH-API-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-API-1/dot_bien.py              # đối chứng + mọi đột biến
    python3 viec/KH-API-1/dot_bien.py <tên> ...    # đối chứng + từng tên

Khuôn viec/GOI-2/dot_bien.py: chép THẬT server/ ra thư mục tạm (node_modules nối symlink, chỉ đọc) + chép cong_cu/thu_KH1.js vào
<tạm>/cong_cu/ (bài tự lấy gốc kho = thư mục cha của nó), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3),
chạy bài trên bản sao. BẮT = thoát ≠ 0 VÀ có dòng tổng "N đạt · M hỏng" (bài sập không phải BẮT) VÀ có dòng ✗ khớp mẫu.
ĐỐI CHỨNG (bản sao không đột biến) phải XANH — không thì mọi kết quả vô nghĩa, dừng. Không đụng server/ thật, data/, Turso.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_KH1.js'

KA, MK, GM = 'server/middleware/khachAuth.js', 'server/utils/maKhach.js', 'server/utils/guiMaKhach.js'
KI, KQ, KL = 'server/routes/kh/index.js', 'server/routes/kh/quay.js', 'server/routes/kh/loi.js'
SC, PR, DK, IX = 'server/routes/signup-codes.js', 'server/routes/products.js', 'server/utils/diemKhach.js', 'server/index.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu dòng ✗ phải thấy)
DOT_BIEN = [
  # ── F2: kiểm loại token ──
  ('BV-F2-bo-kiem-loai', [(KA, "if (!tt || tt.loai !== 'kh') return tuChoi();", "if (!tt) return tuChoi();", 1)], r"✗ F2 token ký khoá khách nhưng không có loai"),
  ('VS-F2-loai-sai-chieu', [(KA, "tt.loai !== 'kh'", "tt.loai === 'nv'", 1)], r"✗ F2 token ký khoá khách nhưng không có loai"),
  # ── F1: đóng khi thiếu / trùng khoá ──
  ('BV-F1-bo-chan-thieu-khoa', [(KA, "if (!khoaKhach()) return res.status(503)", "if (false) return res.status(503)", 1)], r"✗ F1 khoá thiếu"),
  ('VS-F1-khoa-du-phong-jwt', [(KA, "return k && k !== process.env.JWT_SECRET ? k : null;", "return k || process.env.JWT_SECRET;", 1)], r"✗ F1 khoá thiếu"),
  ('VS-F1-cho-trung-khoa', [(KA, "return k && k !== process.env.JWT_SECRET ? k : null;", "return k ? k : null;", 1)], r"✗ F1 khoá trùng"),
  # ── F3: SĐT chỉ từ token ──
  ('VS-F3-ma-bill-sdt-tu-than', [(KI, "phone: req.khach.phone }, khach", "phone: (req.body || {}).phone || req.khach.phone }, khach", 1)], r"✗ E6 A nhận mã bill"),
  ('VS-F3-diem-tu-query', [(KI, "await layDiemKhach(req.khach.phone);", "await layDiemKhach(req.query.phone || req.khach.phone);", 1)], r"✗ F3 /kh/diem"),
  ('VS-F3-don-tu-query', [(KI, "[req.khach.phone, SO_DON_MOI_TRANG + 1", "[req.query.customer_phone || req.khach.phone, SO_DON_MOI_TRANG + 1", 1)], r"✗ F3 /kh/don"),
  # ── A2: chiếm mã một lần, lưu băm, hạn ──
  ('BV-A2-bo-chua-dung', [(MK, "WHERE id = ? AND dung_luc IS NULL AND huy_luc IS NULL`, [now, dong.id]);", "WHERE id = ?`, [now, dong.id]);", 1)], r"✗ A2 đua: người đến sau"),
  ('VS-A2-changes-lon-hon-1', [(MK, "if (!chiem || chiem.changes !== 1)", "if (!chiem || chiem.changes > 1)", 1)], r"✗ A2 đua: người đến sau"),
  ('VS-A2-luu-ma-tho', [(MK, "[sdt, bamMa(sdt, ma), ip, now,", "[sdt, ma, ip, now,", 1)], r"✗ A2 lưu băm"),
  ('VS-A3-han-50-phut', [(MK, "const hanMa = () => `+${GIOI_HAN.HAN_MA_PHUT} minutes`;", "const hanMa = () => `+50 minutes`;", 1)], r"✗ A2 het_han"),
  ('BV-A3-bo-loc-het-han', [(MK, "AND huy_luc IS NULL AND het_han > ? AND so_lan_thu < ?", "AND huy_luc IS NULL AND ? IS NOT NULL AND so_lan_thu < ?", 1)], r"✗ A3 het_han lùi 1 giây"),
  # ── A3 / B2: 5 lần thử mỗi mã ──
  ('BV-B2-bo-gioi-han-moi-ma', [(MK, "het_han > ? AND so_lan_thu < ?", "het_han > ? AND ? > 0", 1),
                                (MK, "WHERE id = ? AND so_lan_thu < ? AND dung_luc IS NULL", "WHERE id = ? AND ? > 0 AND dung_luc IS NULL", 1)], r"✗ A3 sai 5 lần"),
  ('VS-B2-thu-6-lan', [(MK, "THU_MOI_MA: 5,", "THU_MOI_MA: 6,", 1)], r"✗ A3 sai 5 lần"),
  # ── B2: trần lượt sai theo SĐT, chỉ mã App (Q7) ──
  ('BV-B2-bo-gioi-han-sdt', [(MK, "    if (Number(sai.n) >= GIOI_HAN.SAI_SDT_GIO) return { loi: 'QUA_NHIEU_LAN' };\n", "", 1)], r"✗ B2 SĐT đã 10"),
  ('VS-B2-sdt-11', [(MK, "SAI_SDT_GIO: 10,", "SAI_SDT_GIO: 11,", 1)], r"✗ B2 SĐT đã 10"),
  ('VS-B2-chan-ca-ma-quay', [(MK, "if (dong.nguon === 'gui') {", "if (true) {", 1)], r"✗ B2 cùng SĐT bị khoá lối App"),
  # ── B1: giới hạn xin mã, chỉ mã App ──
  ('BV-B1-bo-60-giay', [(MK, "sdt, now, `-${GIOI_HAN.CACH_GIAY} seconds`,", "sdt, now, '+1 seconds',", 1)], r"✗ B1 dòng trước cách 59 giây"),
  ('VS-B1-61-giay', [(MK, "CACH_GIAY: 60,", "CACH_GIAY: 61,", 1)], r"✗ B1 dòng trước cách ĐÚNG 60 giây"),
  ('VS-B1-so-bang', [(MK, "AND tao_luc > ${GIO})\n", "AND tao_luc >= ${GIO})\n", 1)], r"✗ B1 dòng trước cách ĐÚNG 60 giây"),
  ('BV-B1-bo-sdt-gio', [(MK, "sdt, now, '-1 hour', GIOI_HAN.SDT_GIO,", "sdt, now, '-1 hour', 1000000,", 1)], r"✗ B1 đã 5 lần trong giờ"),
  ('VS-B1-sdt-6', [(MK, "SDT_GIO: 5,", "SDT_GIO: 6,", 1)], r"✗ B1 đã 5 lần trong giờ"),
  ('BV-B1-bo-ip', [(MK, "ip, now, '-1 hour', GIOI_HAN.IP_GIO]", "ip, now, '-1 hour', 1000000]", 1)], r"✗ B1 IP đã 20"),
  ('VS-B1-ip-21', [(MK, "IP_GIO: 20,", "IP_GIO: 21,", 1)], r"✗ B1 IP đã 20"),
  ('VS-B1-tinh-ca-quay-ip', [(MK, "WHERE nguon = 'gui' AND ip = ?", "WHERE ip = ?", 1)], r"✗ B1 20 mã QUẦY cùng IP"),
  ('VS-B1-tinh-ca-quay-60', [(MK, "SELECT 1 FROM pos_kh_ma_dang_nhap WHERE nguon = 'gui' AND sdt = ?", "SELECT 1 FROM pos_kh_ma_dang_nhap WHERE sdt = ?", 1)],
   r"✗ B1 xin-ma NGAY sau cap-ma"),
  # ── B3: hằng số một chỗ ──
  ('VS-B3-so-ten-roi', [(MK, "[...t].length <= GIOI_HAN.TEN_TOI_DA", "[...t].length <= 50", 1)], r"✗ B3 "),
  # ── A4: khách mới / cũ ──
  ('VS-A4-tieu-ma-truoc-khi-hoi-ten', [(MK, "  if (dung && !khach && !tenMoi) return { loi: 'CAN_TEN' };\n", "", 1),
                                       (MK, "  if (!dung) return { loi: 'MA_SAI' };\n", "  if (!dung) return { loi: 'MA_SAI' };\n  if (!khach && !tenMoi) return { loi: 'CAN_TEN' };\n", 1)],
   r"✗ A4 CAN_TEN không tiêu mã"),
  ('BV-A4-bo-can-ten', [(MK, "  if (dung && !khach && !tenMoi) return { loi: 'CAN_TEN' };\n", "", 1)], r"✗ A4 SĐT mới không ten"),
  ('VS-A4-loai-khach-sai', [(MK, "'retail', 'retail_only', 'app_kh'", "'subscription', 'new', 'app_kh'", 1)], r"✗ A4 khách mới"),
  # ── A5: không lộ ai là khách ──
  ('VS-A5-bao-khach-moi', [(KI, "res.json({ success: true, lay_ma_tai_quay: kq.layMaTaiQuay });",
                            "res.json({ success: true, lay_ma_tai_quay: kq.layMaTaiQuay, moi: !(await queryOne('SELECT 1 FROM pos_customers WHERE phone = ?', [sdt])) });", 1)],
   r"✗ A5 "),
  # ── C: chế độ gửi ──
  ('VS-C-mac-dinh-gia', [(GM, "const v = process.env.GUI_MA_KHACH || 'quay';", "const v = process.env.GUI_MA_KHACH || 'gia';", 1)], r"✗ C không đặt GUI_MA_KHACH"),
  ('BV-C-quay-khong-huy', [(MK, "guiDuoc ? null : now,", "null,", 1)], r"✗ C dòng mã App ở chế độ quay bị huỷ"),
  ('VS-C-doc-luc-nap', [(GM, "function cheDo() {\n  const v = process.env.GUI_MA_KHACH || 'quay';",
                         "const V_NAP = process.env.GUI_MA_KHACH || 'quay';\nfunction cheDo() {\n  const v = V_NAP;", 1)], r"✗ C không đặt GUI_MA_KHACH"),
  ('BV-C-gia-ngoai-may-thu', [(GM, "(v === 'gia' && laMayThu())", "v === 'gia'", 1)], r"✗ C gia NGOÀI máy thử"),
  # ── D: quầy cấp mã ──
  ('BV-D-bo-authenticate', [(KQ, "router.post('/cap-ma', authenticate, canCauHinhKhach,", "router.post('/cap-ma', canCauHinhKhach,", 1)], r"✗ D không token"),
  ('VS-D-ma-quay-thanh-gui', [(MK, "VALUES (?, ?, 'quay', ?, ?, ?, ${GIO})", "VALUES (?, ?, 'gui', ?, ?, ?, ${GIO})", 1)], r"✗ D dòng nguon quay"),
  # ── E1: chỉ sửa tên ──
  ('VS-E1-sua-ca-sdt', [(KI, "'UPDATE pos_customers SET name = ?, updated_at = ? WHERE id = ?', [ten, getNow(), req.khach.id]",
                         "'UPDATE pos_customers SET name = ?, updated_at = ?, phone = COALESCE(?, phone) WHERE id = ?', [ten, getNow(), (req.body || {}).sdt || null, req.khach.id]", 1)],
   r"✗ E1 PUT /toi đổi tên"),
  # ── E2 / E3: cùng hàm với route cũ ──
  ('VS-E2-kh-tu-tinh-bo-han', [(KI, "const { points, history } = await layDiemKhach(req.khach.phone);",
                                "const { history } = await layDiemKhach(req.khach.phone); const points = (await queryOne('SELECT COALESCE(SUM(points), 0) AS p FROM pos_point_transactions WHERE customer_phone = ?', [req.khach.phone])).p;", 1)],
   r"✗ E2 số dư 7"),
  ('VS-E3-kh-tu-loc', [(KI, "await layVoucherKhach(phone, req.query.all === '1')", "await layVoucherKhach(phone, true)", 1)], r"✗ E3 \(còn dùng\)"),
  ('VS-E3-ma-moi-khong-loc-sdt', [(DK, "WHERE s.claimed_phone = ? AND", "WHERE ? IS NOT NULL AND s.claimed_phone IS NOT NULL AND", 1)], r"✗ E3 khách khác không thấy"),
  # ── E4: chỉ đơn của mình ──
  ('BV-E4-bo-loc-sdt', [(KI, "FROM pos_orders WHERE customer_phone = ? ORDER BY id DESC", "FROM pos_orders WHERE ? IS NOT NULL ORDER BY id DESC", 1)], r"✗ E4 A chỉ thấy"),
  ('VS-E4-chi-tiet-bo-loc', [(KI, "FROM pos_orders WHERE customer_phone = ? AND code = ?", "FROM pos_orders WHERE ? IS NOT NULL AND code = ?", 1)], r"✗ E4 A đọc đơn của B"),
  # ── E5: danh sách trắng + hồi quy products.js ──
  ('VS-E5-tra-them-gia-von', [(KI, "  ma: p.unique_id, ten: p.name,", "  ma: p.unique_id, gia_von: p.cost_price ?? null, ten: p.name,", 1)], r"✗ E5 mỗi món"),
  ('BV-E5-tra-nguyen-mon', [(KI, "data: mon.filter((p) => p.sellable).map(monKhach)", "data: mon.filter((p) => p.sellable)", 1)], r"✗ E5 mỗi món"),
  ('VS-Q3-route-cu-bo-gia', [(PR, "price: priceInfo?.price ?? null,", "price: null,", 1)], r"✗ E5 hồi quy GET /api/pos/products \(JWT\)"),
  # ── E6 / E7: cùng hàm /claim, /nhan-diem ──
  ('VS-E6-bo-claim-chung', [(KI, "router.post('/nhan-ma-bill', (req, res) => nhanMaUuDai(quaToken(req), res));",
                             "router.post('/nhan-ma-bill', async (req, res) => { await run('UPDATE pos_signup_codes SET claimed_at = ?, claimed_phone = ? WHERE UPPER(code) = ?', [getNow(), req.khach.phone, String((req.body || {}).ma || '').toUpperCase()]); res.json({ success: true }); });", 1)],
   r"✗ (E6 mã đã dùng|H voucher)"),
  ('VS-E7-sai-ham', [(KI, "router.post('/nhan-diem', (req, res) => nhanDiemMaBill(quaToken(req), res));",
                      "router.post('/nhan-diem', (req, res) => nhanMaUuDai(quaToken(req), res));", 1)], r"✗ E7 F nhận điểm"),
  # ── G: không lộ ──
  ('VS-G-500-lo-loi', [(KL, "return res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });",
                        "return res.status(500).json({ error: err.message, code: 'LOI_MAY_CHU' });", 1)], r"✗ G lỗi máy chủ"),
  ('BV-G-claim-bo-loiMayChu', [(SC, "    if (req.khach) return loiMayChu(res, err, 'kh nhan-ma-bill');\n", "", 1)], r"✗ G /kh/nhan-ma-bill lỗi nội bộ"),
  ('BV-G-nhandiem-bo-loiMayChu', [(SC, "    if (req.khach) return loiMayChu(res, err, 'kh nhan-diem');\n", "", 1)], r"✗ G /kh/nhan-diem lỗi nội bộ"),
  ('VS-G-claim-500-khong-code', [(SC, "if (req.khach) return loiMayChu(res, err, 'kh nhan-ma-bill');",
                                  "if (req.khach) return res.status(500).json({ success: false, error: 'Lỗi máy chủ, thử lại sau' });", 1)],
   r"✗ G /kh/nhan-ma-bill lỗi nội bộ"),
  ('BV-G-bo-code-ma-khong-co', [(SC, "error: 'Mã không tồn tại', code: 'MA_KHONG_TON_TAI' })", "error: 'Mã không tồn tại' })", 3)],
   r"✗ G /kh/nhan-ma-bill mã không có"),
  ('BV-G-bo-code-thieu-ma', [(SC, "error: 'Thiếu mã ưu đãi', code: 'THIEU_MA' })", "error: 'Thiếu mã ưu đãi' })", 1)], r"✗ G /kh/nhan-ma-bill thiếu ma"),
  ('VS-G-log-ma', [(MK, "  if (guiDuoc) await guiMaKhach(sdt, ma);", "  console.log('gui ma', sdt, ma);\n  if (guiDuoc) await guiMaKhach(sdt, ma);", 1)], r"✗ G log máy chủ"),
  # ── H / Q2: /claim cũ không đổi hành vi ──
  ('VS-P7-sdt-ngoai-try', [(SC, "async function nhanMaUuDai(req, res) {\n  try {\n    const rawCode = String(req.body.code || '').trim().toUpperCase();\n    const phone = normalizePhone(req.body.phone);",
                            "async function nhanMaUuDai(req, res) {\n  const phone = normalizePhone(req.body.phone);\n  try {\n    const rawCode = String(req.body.code || '').trim().toUpperCase();", 1)],
   r"✗ H /claim không thân JSON"),
  # ── index.js: gắn route + trust proxy (Q5) ──
  ('BV-Q5-trust-proxy', [(IX, "app.set('trust proxy', 1);", "", 1)], r"✗ index.js: app.set\('trust proxy'"),
  ('BV-IX-bo-gan-kh', [(IX, "app.use('/api/kh', require('./routes/kh'));", "", 1)], r"✗ index.js: app.use\('/api/kh'"),
  ('VS-IX-gan-kh-chu-thich', [(IX, "app.use('/api/kh', require('./routes/kh'));", "// app.use('/api/kh', require('./routes/kh'));", 1)], r"✗ index.js: app.use\('/api/kh'"),
  ('VS-Q5-trust-proxy-chu-thich', [(IX, "app.set('trust proxy', 1);", "/* app.set('trust proxy', 1); */", 1)], r"✗ index.js: app.set\('trust proxy'"),
]

TONG = re.compile(r'\d+ đạt · \d+ hỏng')


def ap(goc_tam, cap):
  for f, cu, moi, n in cap:
    p = os.path.join(goc_tam, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tempfile.gettempdir())):
      return f'{f}: đích {os.path.realpath(p)} không nằm trong thư mục tạm — KHÔNG sửa (K5)'
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n:
      return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return ''


def chay1(db):
  ten, cap, bat = db
  tam = tempfile.mkdtemp(prefix='kh1_db_')
  try:
    shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server'))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
    os.makedirs(os.path.join(tam, 'cong_cu'))
    shutil.copy(os.path.join(GOC, BAI), os.path.join(tam, BAI))
    loi = ap(tam, cap)
    if loi: return ten, False, loi
    r = subprocess.run(['node', BAI], cwd=tam, capture_output=True, text=True, timeout=300)
    ra = re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)
    tong = TONG.search(ra)
    if cap == []:
      return ten, r.returncode == 0 and bool(tong) and ' 0 hỏng' in tong.group(0), tong.group(0) if tong else 'không in dòng tổng'
    trung = [l.strip() for l in ra.splitlines() if re.search(bat, l)]
    if not tong: return ten, False, f'bài SẬP (không in dòng tổng, thoát {r.returncode}) — sập không phải BẮT'
    return ten, r.returncode != 0 and bool(trung), (trung[0][:160] if trung else f'thoát {r.returncode}, KHÔNG thấy /{bat}/ · {tong.group(0)}')
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  ten_dk = 'ĐỐI-CHỨNG (không đột biến)'
  _, xanh, chi = chay1((ten_dk, [], None))
  print(('  ✓ ' if xanh else '  ✗ ') + f'{ten_dk}: {chi}')
  if not xanh:
    print('\n  Đối chứng KHÔNG xanh — kết quả đột biến vô nghĩa, dừng.')
    sys.exit(2)
  la = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  thieu = [t for t in sys.argv[1:] if t not in {d[0] for d in DOT_BIEN}]
  if thieu:
    print('  ✗ không có đột biến tên: ' + ', '.join(thieu))
    sys.exit(2)
  with ThreadPoolExecutor(max_workers=6) as ex:
    kq = list(ex.map(chay1, la))
  hong = 0
  for ten, dat, chi in kq:
    print(('  ✓ ' if dat else '  ✗ ') + f'{ten}: {chi}')
    hong += not dat
  print(f'\n  {len(kq) - hong} đột biến bị bắt · {hong} KHÔNG bị bắt (trên {len(kq)})')
  sys.exit(1 if hong else 0)
