#!/usr/bin/env python3
"""P20b — đột biến cho chỗ vá A2 (orders.js): VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/P20b/dot_bien.py [tên...]

Khuôn viec/P26c/dot_bien.py, nhưng thu_P20.js KHÔNG nhận --may-chu (nó tự lấy GOC = cong_cu/..), nên bản sao là kiểu `sv` của
viec/AUDIT-1 (:248–250): chép THẬT server/ + cong_cu/ vào thư mục tạm, symlink node_modules (chỉ đọc), rồi chạy
`node cong_cu/thu_P20.js` TRONG bản sao. Chuỗi gốc phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt (K3).
BẮT = thoát ≠ 0 VÀ đầu ra có dòng khớp mẫu `bat` (đúng ca phải bắt). Đối chứng (bản sao KHÔNG đột biến) phải xanh trước, không thì dừng.
Không đụng server/ thật, data/, Turso. Thư mục tạm xoá trong finally. Công cụ chép-rồi-sửa tự kiểm realpath đích nằm trong thư mục tạm (K5).
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
O = 'server/routes/orders.js'
# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
DOT_BIEN = [
  ('BV-A2-bo-tra-signup', [(O, 'if (maBill) {', 'if (false) {', 1)], r'✗ G1 đơn gốc đã huỷ: dùng voucher'),
  ('VS-A2-chi-chan-don-huy', [(O, 'const kqDon = await kiemDonCuaMa(maBill);',
    'const kqDon = (await queryOne("SELECT status FROM pos_orders WHERE id = ?", [maBill.order_id]))?.status === "cancelled" ? { loi: { error: "huy" } } : {};', 1)],
    r'✗ G2 đơn gốc đã hoàn: dùng voucher'),
  ('VS-A2-chan-ca-ma-tay', [(O, 'if (maBill) {', 'if (!maBill) return res.status(400).json({ code: "MA_DON_GOC_KHONG_HOP_LE" }); {', 1)],
    r'✗ G5 mã tay: dùng mã → 200'),
  ('VS-A2-tra-ca-ma-chua-claim', [(O, ' AND claimed_at IS NOT NULL"', '"', 1)], r'✗ G7 mã tay trùng chữ mã bill chưa claim: dùng mã → 200'),
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
  tam = tempfile.mkdtemp(prefix='p20b_')
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
      if ma != 0 and khop: bat += 1; print(f'  BẮT   {ten} — {khop[0][:100]}')
      elif ma != 0: print(f'  LẠC   {ten} — thoát {ma}, không dòng nào khớp /{mau}/')
      else: print(f'  SỐNG  {ten} — bài thử vẫn xanh')
  finally:
    shutil.rmtree(tam, ignore_errors=True)
  print(f'\n{bat}/{len(ds)} đột biến bị bắt')
  return 0 if bat == len(ds) else 1


if __name__ == '__main__': sys.exit(main())
