#!/usr/bin/env python3
"""P3 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/P3/dot_bien.py              # đối chứng + mọi đột biến
    python3 viec/P3/dot_bien.py <tên> ...    # đối chứng + từng tên

Khuôn viec/KH-API-1/dot_bien.py: chép THẬT server/ + cong_cu/gia_lap/ (Đối soát nạp bat_bien.js) + kiem_tra_truoc_khi_giao.js (phép tĩnh)
ra thư mục tạm (node_modules nối symlink, chỉ đọc) + chép cong_cu/thu_P3.js vào <tạm>/cong_cu/ (bài tự lấy gốc kho = thư mục cha của nó),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài trên bản sao. BẮT = thoát ≠ 0 VÀ có dòng tổng
"N đạt · M hỏng" (bài sập không phải BẮT) VÀ có dòng ✗ khớp mẫu. ĐỐI CHỨNG (bản sao không đột biến) phải XANH — không thì dừng.
Không đụng server/ thật, data/, Turso, payOS thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BAI = 'cong_cu/thu_P3.js'

GC, PO, PK, TT = 'server/utils/giuCho.js', 'server/utils/payos.js', 'server/utils/pinKhach.js', 'server/routes/thanh-toan.js'
OR, WA, CU, KI = 'server/routes/orders.js', 'server/routes/wallets.js', 'server/routes/customers.js', 'server/routes/kh/index.js'
DS, BK, DB = 'server/utils/doiSoat.js', 'server/routes/backup.js', 'server/database.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu dòng ✗ phải thấy)
DOT_BIEN = [
  # ── B: cổng chốt MỘT lần (cho → da_thu, còn hạn) trong giao dịch ──
  ('BV-cong-phien', [(GC, "WHERE id = ? AND trang_thai = 'cho' AND het_han > ?`", "WHERE id = ? AND ? IS NOT NULL`", 1)], r"✗ B9b"),
  ('VS-cong-changes', [(GC, "if (cong.changes !== 1) return false;", "if (cong.changes > 1) return false;", 1)], r"✗ B9b"),
  ('BV-cong-orders', [(OR, "if (phien && !(await phien.vaoGiaoDich(tx, now))) {", "if (phien && !(await phien.vaoGiaoDich(tx, now)) && false) {", 1)], r"✗ B9b"),
  ('BV-sau-ghi-don', [(OR, "      if (phien) await phien.sauGhiDon(tx, orderId, orderCode);", "      if (false) await phien.sauGhiDon(tx, orderId, orderCode);", 1)], r"✗ B3 đúng chữ ký"),
  ('BV-chi-tinh', [(OR, "    if (phien?.chiTinh) return { total };", "    if (false) return { total };", 1)], r"✗ A1 tạo phiên 50.000"),
  ('BV-loi-phien', [(GC, "if (r.statusCode >= 400 && r.statusCode < 500 && !['PHIEN_DA_CHOT', 'KHO_BAN']", "if (false && !['PHIEN_DA_CHOT', 'KHO_BAN']", 1)], r"✗ B12 giá đổi"),
  ('BV-su-kien-tx', [(TT, "const kq = await chotPhien(p, 'payos', { suKien: (tx) => tx.run(cauGhi, thamSo('khop', null)) });",
                      "await ghi('khop', null); const kq = await chotPhien(p, 'payos', {});", 1)], r"✗ B13"),
  ('BV-khoa-unique', [(DB, "khoa TEXT UNIQUE NOT NULL,", "khoa TEXT NOT NULL,", 1), (TT, "\n      ON CONFLICT(khoa) DO NOTHING`", "`", 1)], r"✗ B4 báo lặp"),
  # ── B: chữ ký / tiền / hạn ──
  ('BV-chu-ky', [(PO, "return a.length === b.length && crypto.timingSafeEqual(a, b);", "return true;", 1)], r"✗ B1 chữ ký sai"),
  ('VS-khoa-rong', [(PO, "if (!ck || typeof chuKy !== 'string'", "if (typeof chuKy !== 'string'", 1)], r"✗ B2 khoá checksum rỗng"),
  ('VS-so-tien', [(TT, "const lyDo = Number(d.amount) !== p.con_lai ?", "const lyDo = Math.abs(Number(d.amount) - p.con_lai) > 1000 ?", 1)], r"✗ B6 lệch 1.000đ"),
  ('BV-ve-muon-payos', [(TT, ": luc > p.het_han ? 'tiền về sau khi QR hết hạn' : null;", ": null;", 1)], r"✗ B7 transactionDateTime"),
  ('VS-that-bai', [(TT, "if (b.code !== '00' || d.code !== '00')", "if (b.code !== '00')", 1)], r"✗ B11"),
  # ── A: tạo phiên ──
  ('VS-tien-client', [(GC, "const tong = Math.round(tinh.total);", "const tong = Math.round(Number(goc.total) || tinh.total);", 1)], r"✗ A2 giỏ gửi"),
  ('BV-chua-cau-hinh', [(GC, "if (cach === 'payos' && !payos.daCauHinh()) return loi(503,", "if (false) return loi(503,", 1)], r"✗ A3 thiếu khoá"),
  ('VS-noi-dung-10', [(GC, "const NOI_DUNG_TOI_DA = 9;", "const NOI_DUNG_TOI_DA = 10;", 1)], r"✗ A5 mã phiên 1000000"),
  ('VS-han-15-phut', [(GC, "const HAN_PHUT = 10;", "const HAN_PHUT = 15;", 1)], r"✗ A1 (expiredAt|cột het_han)"),
  ('VS-tom-het-han', [(GC, "trang_thai: p.trang_thai === 'cho' && p.het_han <= getNow() ? 'het_han' : p.trang_thai,", "trang_thai: p.trang_thai,", 1)], r"✗ C1 phiên lùi quá hạn"),
  # ── C / D: không tự đánh dấu đã thu; xác nhận tay ──
  ('VS-chot-ca-payos', [(TT, "if (p.cach !== 'tien_mat' && p.cach !== 'tai_khoan') {", "if (p.cach === 'ck_tay') {", 1)], r"✗ C2 nhân viên tự chốt"),
  ('BV-quyen-tay', [(TT, "router.post('/phien/:id/xac-nhan-tay', authenticate, checkPermission('xac_nhan_ck_tay'),", "router.post('/phien/:id/xac-nhan-tay', authenticate,", 1)], r"✗ D1 nhân viên"),
  ('BV-ly-do-tay', [(TT, "if (!lyDoHopLe(lyDo)) return loi(res, 400, 'CAN_LY_DO', 'Nhập lý do xác nhận tay", "if (false) return loi(res, 400, 'CAN_LY_DO', 'Nhập lý do xác nhận tay", 1)], r"✗ D2 quản lý thiếu lý do"),
  ('BV-nhat-ky-tay', [(GC, "      if (nguon === 'tay') {\n        await ghiNhatKy(", "      if (false) {\n        await ghiNhatKy(", 1)], r"✗ D5 nhật ký"),
  ('VS-quyen-seed-staff', [(DB, "[['owner', 1], ['manager', 1], ['staff', 0]]", "[['owner', 1], ['manager', 1], ['staff', 1]]", 1)], r"✗ D4 quyền seed"),
  # ── E: PIN ──
  ('VS-pin-luu-tho', [(PK, "const bam = await bcrypt.hash(String(pin), 10);", "const bam = String(pin);", 1)], r"✗ E1 đặt PIN ở quầy"),
  ('BV-pin-lan-dau', [(PK, "${lanDau ? \" AND COALESCE(pin_code, '') NOT LIKE '$2%'\" : ''}", "${''}", 1)], r"✗ E1 quầy đặt lại"),
  ('BV-pin-khop', [(PK, "  if (String(pin) !== String(pinLai ?? '')) return loi('PIN_KHONG_KHOP');\n", "", 1)], r"✗ E2 hai lần lệch"),
  ('VS-pin-tho', [(PK, "if (!kh || !laBam(kh.pin_code)) return loi('CHUA_CO_PIN');", "if (!kh || !kh.pin_code) return loi('CHUA_CO_PIN');", 1)], r"✗ E5 \(Q7\)"),
  ('BV-pin-dem', [(PK, "const dem = 'CASE WHEN pin_khoa_den IS NULL THEN COALESCE(pin_sai, 0) + 1 ELSE 1 END';", "const dem = 'COALESCE(pin_sai, 0)';", 1)], r"✗ E3 sai 5 lần"),
  # Đưa ĐÚNG lỗi vòng soát 1 trở lại: đọc "đang khoá?" → bcrypt (chậm) → rồi mới ghi đếm (không điều kiện).
  ('VS-pin-doc-roi', [(PK, "  const now = getNow();\n  const dem", "  const now = getNow();\n  if ((await queryOne('SELECT pin_khoa_den FROM pos_customers WHERE phone = ?', [phone]))?.pin_khoa_den > now) return loi('PIN_DANG_KHOA');\n  const dung = await bcrypt.compare(String(pin ?? ''), kh.pin_code);\n  const dem", 1),
                      (PK, "  const giu = await run(", "  const giu = dung ? { changes: 1 } : await run(", 1),
                      (PK, "WHERE phone = ? AND (pin_khoa_den IS NULL OR pin_khoa_den <= ?)`", "WHERE phone = ? AND ? IS NOT NULL`", 1),
                      (PK, "if (!(await bcrypt.compare(String(pin ?? ''), kh.pin_code))) return loi('PIN_SAI');", "if (!dung) return loi('PIN_SAI');", 1)],
   r"✗ E10"),
  ('BV-pin-giu-cho', [(PK, "  if (giu.changes !== 1) return loi('PIN_DANG_KHOA');\n", "", 1)], r"✗ E3 sai 5 lần"),
  ('VS-pin-nguong-6', [(PK, "const PIN_SAI_TOI_DA = 5;", "const PIN_SAI_TOI_DA = 6;", 1)], r"✗ E3 sai 5 lần"),
  ('VS-pin-nguong-4', [(PK, "const PIN_SAI_TOI_DA = 5;", "const PIN_SAI_TOI_DA = 4;", 1)], r"✗ E4 sai 4 lần"),
  ('VS-pin-khoa-30', [(PK, "const PIN_KHOA_PHUT = 15;", "const PIN_KHOA_PHUT = 30;", 1)], r"✗ E3 khoá đến"),
  # VS-pin-dem-tuyet-doi (đọc rồi ghi tuyệt đối) đã thử: SỐNG — ca E8 đua thật, không tất định (K3) → CHƯA KIỂM, không đếm là phép.
  ('BV-pin-me-cua-con', [(GC, "[b.tru_tai_khoan_me, phoneMe, b.pin_me]", "[b.tru_tai_khoan_me, phone, b.pin_me]", 1)], r"✗ F5 trừ tài khoản mẹ bằng PIN của con"),
  ('BV-xoa-pin-quyen', [(TT, "router.post('/pin/xoa', authenticate, checkPermission('xoa_pin_khach'),", "router.post('/pin/xoa', authenticate,", 1)], r"✗ E \(Q6\) Xoá PIN: nhân viên"),
  ('BV-bo-mat', [(CU, "res.json = (than) => json(boMat(than));", "res.json = (than) => json(than);", 1)], r"✗ E6 10 đường"),
  ('VS-kh-pin-sdt-than', [(KI, "await datPin(req.khach.phone, b.pin,", "await datPin(b.sdt || req.khach.phone, b.pin,", 1)], r"✗ E7 App KH"),
  # ── F: giữ tài khoản ──
  ('BV-giu-ghivi', [(WA, "if (khongAm && sau - giu < 0)", "if (khongAm && sau < 0)", 1)], r"✗ F1 đang giữ"),
  ('VS-giu-het-han', [(WA, "WHERE trang_thai = 'cho' AND het_han > ? AND (phone = ?", "WHERE trang_thai = 'cho' AND ? IS NOT NULL AND (phone = ?", 1)], r"✗ F2 phiên hết hạn"),
  ('VS-giu-me', [(WA, "+ CASE WHEN phone_me = ? THEN giu_vi_me ELSE 0 END), 0) AS n", "+ CASE WHEN ? IS NULL THEN giu_vi_me ELSE 0 END), 0) AS n", 1)], r"✗ F5 giữ 50.000"),
  ('VS-kha-dung-tu-chan', [(OR, "dangGiu({ queryOne }, phone, phien?.id)", "dangGiu({ queryOne }, phone)", 1)], r"✗ F7 phiên chỉ trả tài khoản"),
  # ── H / I: kết hợp, cờ payOS ──
  ('BV-ket-hop', [(OR, "if (Number(cash_amount) > 0 && Number(transfer_amount) > 0) {", "if (false) {", 1)], r"✗ H1"),
  ('VS-co-bo-vi-me', [(OR, " || Number(parent_balance_amount) > 0 || payment_method === \"balance\")", " || payment_method === \"balance\")", 1)], r"✗ I7 cờ BẬT: CK trần"),
  ('VS-so-tien-du', [(TT, "const lyDo = Number(d.amount) !== p.con_lai ?", "const lyDo = Number(d.amount) < p.con_lai ?", 1)], r"✗ B6 trả DƯ"),
  ('BV-co-payos', [(OR, "if (co?.value === \"1\") {", "if (false) {", 1)], r"✗ I7 cờ BẬT: CK trần"),
  ('VS-co-chan-phien', [(OR, "if (!phien && (Number(transfer_amount) > 0", "if ((Number(transfer_amount) > 0", 1)], r"✗ I7 cờ BẬT \(K5\)"),
  # ── Đối soát / sao lưu ──
  ('BV-ds-ck', [(DS, "['CK', phepTienVe], ", "", 1)], r"✗ B10 Đối soát hôm nay ĐỎ"),
  ('VS-ds-ck-vang', [(DS, "canXem: r.ket_qua === 'khong_phien',", "canXem: true,", 1)], r"✗ B10 Đối soát hôm nay ĐỎ"),
  ('BV-ds-xnt', [(DS, ", ['XNT', phepXacNhanTay]", "", 1)], r"✗ D4 Đối soát"),
  ('BV-backup-khong-kp', [(BK, "  'pos_phien_thanh_toan', 'pos_payos_su_kien', 'pos_nhat_ky_pin'];", "  ];", 1)], r"✗ backup.js"),
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
  tam = tempfile.mkdtemp(prefix='p3_db_')
  try:
    shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server'))
    shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tam, 'cong_cu', 'gia_lap'))
    shutil.copy(os.path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), os.path.join(tam, 'kiem_tra_truoc_khi_giao.js'))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
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
