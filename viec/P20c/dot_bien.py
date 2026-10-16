#!/usr/bin/env python3
"""P20c — đột biến cho chỗ vá A1 (/claim), A2 (/nhan-diem), A3 (/reset), A4 (mã lỗi) trong signup-codes.js: VS- (vá sai cách) và
BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/P20c/dot_bien.py [tên...]

Khung chép từ viec/P20b/dot_bien.py, thêm phép dòng tổng (soát vòng 2): thu_P20.js KHÔNG nhận --may-chu (nó tự lấy GOC = cong_cu/..), nên chép THẬT server/ +
cong_cu/ vào thư mục tạm, symlink node_modules (chỉ đọc), rồi chạy `node cong_cu/thu_P20.js` TRONG bản sao. Chuỗi gốc phải khớp ĐÚNG
số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt (K3). BẮT = thoát ≠ 0 VÀ đầu ra có dòng khớp mẫu `bat` (đúng ca phải
bắt) VÀ có dòng tổng `N đạt · M hỏng` — thiếu dòng tổng là SẬP, không đếm BẮT (khuôn AUDIT-3 HET). Đối chứng (bản sao KHÔNG đột biến) phải xanh trước, không thì dừng. Không đụng server/ thật, data/, Turso. Thư mục tạm xoá
trong finally. Công cụ chép-rồi-sửa tự kiểm realpath đích nằm trong thư mục tạm (K5).
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
S = 'server/routes/signup-codes.js'
# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
DOT_BIEN = [
  ('BV-A1-bo-chan-sdt', [(S, "' AND NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE claimed_phone = ? AND id <> ?)'",
    "' AND ? IS NOT NULL AND ? IS NOT NULL'", 1)], r'✗ H1 người đến sau'),
  ('VS-A1-id-bang', [(S, 'WHERE claimed_phone = ? AND id <> ?', 'WHERE claimed_phone = ? AND id = ?', 1)], r'✗ H1 người đến sau'),
  ('VS-A1-mot-ma-loi', [(S, 'if (d.luc) return', 'if (true) return', 1)], r'✗ H1 người đến sau'),
  ('BV-A2-bo-chan-sdt', [(S, "' AND (? = 0 OR NOT EXISTS (SELECT 1 FROM pos_signup_codes WHERE diem_nhan_phone = ? AND id <> ?))'",
    "' AND (? = 0 OR ? IS NOT NULL OR ? IS NOT NULL)'", 1)], r'✗ H2 người đến sau'),
  ('VS-A2-bo-co', [(S, '(? = 0 OR NOT EXISTS', '(? = -1 OR NOT EXISTS', 1)], r'✗ H2b chiLanDau tắt: người đến sau'),
  ('BV-A3-bo-dieu-kien', [(S, "WHERE code = ? AND COALESCE(used_count, 0) = 0'", "WHERE code = ?'", 1)], r'✗ H3 hoàn tác voucher vừa được dùng'),
  ('VS-A3-null-lech', [(S, 'AND COALESCE(used_count, 0) = 0', 'AND used_count = 0', 1)], r'✗ H3f hoàn tác voucher used_count NULL'),
  ('BV-A3-bo-khoa-claim', [(S, "WHERE id = ? AND claimed_at = ? AND claimed_phone IS ?'", "WHERE id = ? AND ? IS NOT NULL AND ? IS NOT NULL'", 1)],
    r'✗ H3d hoàn tác B'),
  ('VS-A3-khoa-chi-gio', [(S, "WHERE id = ? AND claimed_at = ? AND claimed_phone IS ?'", "WHERE id = ? AND claimed_at = ? AND (? IS NULL OR 1)'", 1)],
    r'✗ H3d hoàn tác B'),
  ('VS-A3-khoa-chi-sdt', [(S, "WHERE id = ? AND claimed_at = ? AND claimed_phone IS ?'", "WHERE id = ? AND (? IS NULL OR 1) AND claimed_phone IS ?'", 1)],
    r'✗ H3g .*hoàn tác B'),
  ('VS-A3-gio-lon-hon', [(S, "AND claimed_at = ? AND claimed_phone IS ?'", "AND claimed_at >= ? AND claimed_phone IS ?'", 1)],
    r'✗ H3g muộn hơn 1 giây: hoàn tác B'),
  ('VS-A3-gio-nho-hon', [(S, "AND claimed_at = ? AND claimed_phone IS ?'", "AND claimed_at <= ? AND claimed_phone IS ?'", 1)],
    r'✗ H3g sớm hơn 1 giây: hoàn tác B'),
  ('VS-A3-so-toi-phut', [(S, "AND claimed_at = ? AND claimed_phone IS ?'",
    "AND substr(claimed_at, 1, 16) = substr(?, 1, 16) AND claimed_phone IS ?'", 1)], r'✗ H3g muộn hơn 1 giây: hoàn tác B'),
  ('VS-A3-sdt-bang', [(S, "AND claimed_phone IS ?'", "AND claimed_phone = ?'", 1)], r'✗ H3h hoàn tác dòng claimed_phone NULL'),
  ('BV-A2-bo-bao-chiem', [(S, "return baoChiemHong(res, dong.id, 'diem_nhan_luc',",
    "return res.status(400).json({ success: false, code: 'MA_DA_NHAN_DIEM' }); (res, dong.id, 'diem_nhan_luc',", 1)],
    r'✗ H6 /nhan-diem khi dòng mã vừa bị xoá'),
  ('VS-A1-cheo-cot', [(S, 'WHERE claimed_phone = ? AND id <> ?', 'WHERE ? IN (claimed_phone, diem_nhan_phone) AND id <> ?', 1)],
    r'✗ H4b cùng SĐT: nhận điểm mã A'),
  ('VS-A2-cheo-cot', [(S, 'WHERE diem_nhan_phone = ? AND id <> ?', 'WHERE ? IN (claimed_phone, diem_nhan_phone) AND id <> ?', 1)],
    r'✗ H4b cùng SĐT: claim mã A'),
  ('BV-A1-bo-404', [(S, "  if (!d) return res.status(404).json({ success: false, error: 'Mã không tồn tại' });\n", '', 1)],
    r'✗ H6 /claim khi dòng mã vừa bị xoá'),
  ('VS-A3-changes-0-chan', [(S, 'if (voucherRow && xoa.changes === 0)', 'if (xoa.changes === 0)', 1)],
    r'✗ H3c hoàn tác khi không còn voucher'),
  ('BV-A4-claim-bo-ma', [(S, "return res.status(409).json({ success: false, error: 'Mã này đã được sử dụng', code: 'MA_DA_DUNG' });",
    "return res.status(400).json({ success: false, error: 'Mã này đã được sử dụng' });", 1)], r'✗ H4 /claim mã đã claim'),
  ('BV-A4-claim-bo-ma-sdt', [(S, "'Số điện thoại này đã từng nhận ưu đãi khách mới', code: 'SDT_DA_NHAN'",
    "'Số điện thoại này đã từng nhận ưu đãi khách mới'", 1)], r'✗ H4 /claim bằng SĐT đã claim'),
]


def ban_sao(tam):
  k = os.path.join(tam, 'kho'); os.makedirs(k)
  for x in ('server', 'cong_cu'): shutil.copytree(os.path.join(GOC, x), os.path.join(k, x), symlinks=True)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))
  return k


def ap(k, cap):
  for f, goc, thay, so_lan in cap:
    p = os.path.join(k, f)
    if not os.path.realpath(p).startswith(os.path.realpath(k) + os.sep): return f'{f}: đích ngoài bản sao — không ghi'
    nd = open(p, encoding='utf-8').read()
    co = nd.count(goc)
    if co != so_lan: return f'{f}: chuỗi gốc khớp {co} lần, cần {so_lan}'
    open(p, 'w', encoding='utf-8').write(nd.replace(goc, thay))
  return None


def chay(k):
  r = subprocess.run(['node', 'cong_cu/thu_P20.js'], cwd=k, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def main():
  chon = sys.argv[1:]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  tam = tempfile.mkdtemp(prefix='p20c_')
  bat = 0
  try:
    k = ban_sao(tam)
    ma, ra = chay(k)
    tong = next((l for l in ra.splitlines()[::-1] if 'đạt ·' in l), '(không dòng tổng)').strip()
    print(f'đối chứng (không đột biến): thoát {ma} · {tong}')
    if ma != 0: print('✗ đối chứng ĐỎ — không chấm đột biến'); return 2
    shutil.rmtree(k)
    for ten, cap, mau in ds:
      k = ban_sao(tam)
      loi = ap(k, cap)
      if loi: print(f'  HỎNG  {ten} — {loi}'); shutil.rmtree(k); continue
      ma, ra = chay(k); shutil.rmtree(k)
      khop = [l.strip() for l in ra.splitlines() if re.search(mau, l)]
      if not re.search(r'\d+ đạt · \d+ hỏng', ra): print(f'  SẬP   {ten} — thoát {ma}, không có dòng tổng (bài thử sập ≠ BẮT)')
      elif ma != 0 and khop: bat += 1; print(f'  BẮT   {ten} — {khop[0][:100]}')
      elif ma != 0: print(f'  LẠC   {ten} — thoát {ma}, không dòng nào khớp /{mau}/')
      else: print(f'  SỐNG  {ten} — bài thử vẫn xanh')
  finally:
    shutil.rmtree(tam, ignore_errors=True)
  print(f'\n{bat}/{len(ds)} đột biến bị bắt')
  return 0 if bat == len(ds) else 1


if __name__ == '__main__': sys.exit(main())
