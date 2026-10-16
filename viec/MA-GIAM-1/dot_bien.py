#!/usr/bin/env python3
"""MA-GIAM-1 — đột biến cho chỗ vá A1–A8: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:  python3 viec/MA-GIAM-1/dot_bien.py [tên...]

Khuôn viec/P20b/dot_bien.py: chép THẬT server/ + cong_cu/ vào thư mục tạm, symlink node_modules (chỉ đọc), chạy bài thử TRONG bản sao
(thu_P20.js và thu_P26a.js đều lấy GOC = cong_cu/..). Chuỗi gốc phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là
đạt (K3). BẮT = thoát ĐÚNG 1 (bài đỏ, không sập — sập thoát 2) VÀ đầu ra có dòng khớp mẫu `bat` (đúng ca phải bắt). Đối chứng (bản sao KHÔNG
đột biến) của mỗi bài phải xanh trước, không thì dừng. Công cụ chép-rồi-sửa tự kiểm realpath đích nằm trong thư mục tạm (K5).
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D, O, S = 'server/routes/discount-codes.js', 'server/routes/orders.js', 'server/routes/signup-codes.js'
BAI = {'p20': 'cong_cu/thu_P20.js', 'p26a': 'cong_cu/thu_P26a.js'}
XOA_ID = "'DELETE FROM pos_discount_codes WHERE id = ? AND COALESCE(used_count, 0) = 0', [voucherRow.id]"
CHAN_DOI_TEN = "if (maBill) {\n        return res.status(400).json({ error: 'Mã này sinh từ mã in bill"
# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong đầu ra)
DOT_BIEN = [
  # ── A1 · DELETE /discount-codes/:id ──
  ('BV-A1-bo-dieu-kien', 'p26a', [(D, "WHERE id = ? AND COALESCE(used_count, 0) = 0'", "WHERE id = ?'", 1)], r'✗ M1 xoá mã vừa được dùng'),
  ('VS-A1-null-lech', 'p26a', [(D, 'AND COALESCE(used_count, 0) = 0', 'AND used_count = 0', 1)], r'✗ M3 xoá mã used_count NULL'),
  ('VS-A1-khong-vo-hieu', 'p26a', [(D, "const tat = await run('UPDATE pos_discount_codes SET is_active = 0, updated_at = ? WHERE id = ?', [getNow(), id]);",
    'const tat = { changes: 1 };', 1)], r'✗ M[14] xoá mã'),
  ('VS-A1-mat-404', 'p26a', [(D, 'if (tat.changes === 0) {', 'if (false) {', 1)], r'✗ M5 xoá id không có'),
  # ── A2 · /validate qua cổng đơn gốc ──
  ('BV-A2-bo-cong-validate', 'p20', [(D, "if (kqDon.loi) return res.status(400).json({ error: kqDon.loi.error, code: 'MA_DON_GOC_KHONG_HOP_LE' });", '', 1)],
    r'✗ G1 đơn gốc đã huỷ: /validate'),
  ('VS-A2-tra-ca-chua-claim', 'p20', [(D, "AND claimed_at IS NOT NULL'", "'", 1)], r'✗ G7 .*/validate'),
  ('VS-A2-tra-chu-go', 'p20', [(D, '[discountCode.code]\n', '[code]\n', 1)], r'✗ G8 .*/validate'),
  ('VS-A2-doi-ma-loi', 'p20', [(D, "code: 'MA_DON_GOC_KHONG_HOP_LE' });", 'code: kqDon.loi.code });', 1)], r'✗ G1 đơn gốc đã huỷ: /validate'),
  # ── A3 · freshCode null / vô hiệu trong giao dịch ──
  ('BV-A3-bo-kiem-null', 'p20', [(O, 'if (!freshCode) {', 'if (false) {', 1)], r'✗ G9 mã bị xoá giữa chừng: dùng mã'),
  ('VS-A3-bo-is-active', 'p20', [(O, 'used_count FROM pos_discount_codes WHERE id = ? AND is_active = 1",', 'used_count FROM pos_discount_codes WHERE id = ?",', 1)], r'✗ G10 mã bị vô hiệu giữa chừng: dùng mã'),
  ('VS-A3-doi-ma-loi', 'p20', [(O, 'code: "MA_GIAM_KHONG_CON"', 'code: "DISCOUNT_CODE_LIMIT_REACHED"', 1)], r'✗ G9 mã bị xoá giữa chừng: dùng mã'),
  # Cùng neo AUDIT-2 BK-KB20-bo-kiem-lai-ma (SỐNG dưới giả lập KB20 — AU2-9): G11 phải bắt.
  ('BV-KB20-bo-kiem-lai-luot', 'p20', [(O, 'freshCode.used_count >= freshCode.usage_limit', 'false', 1)], r'✗ G11 mã hết lượt giữa chừng'),
  ('VS-A3-gop-ma-loi', 'p20', [(O, 'code: "DISCOUNT_CODE_LIMIT_REACHED"', 'code: "MA_GIAM_KHONG_CON"', 1)], r'✗ G11 mã hết lượt giữa chừng'),
  # ── A4 · cổng P20b tra bằng mã chuẩn (bản sao của AUDIT-4 VS-AU4-P20B-TRA-MA-THO) ──
  ('VS-A4-tra-ma-tho', 'p20', [(O, '[codeRecord.code],', '[discount_code],', 1)], r'✗ G8 mã có khoảng trắng, đơn gốc đã huỷ: dùng voucher'),
  # ── A5 · /reset ──
  ('BV-A5-xoa-theo-code', 'p20', [(S, XOA_ID, "'DELETE FROM pos_discount_codes WHERE code = ? AND COALESCE(used_count, 0) = 0', [signupRow.code]", 1)],
    r'✗ H3j hoàn tác B'),
  ('VS-A5-null-van-xoa', 'p20', [(S, ': { changes: 0 };',
    ": await tx.run('DELETE FROM pos_discount_codes WHERE code = ? AND COALESCE(used_count, 0) = 0', [signupRow.code]);", 1)],
    r'✗ H3k voucher chen vào giữa chừng'),
  ('VS-A5-phan-biet-hoa', 'p20', [(S, "WHERE UPPER(code) = UPPER(?)', [signupRow.code]);", "WHERE code = ?', [signupRow.code]);", 1)],
    r'✗ H3l hoàn tác voucher đã dùng'),
  ('BV-A5-loi-bao-null', 'p20', [(S, "const ai = signupRow.claimed_phone ? `SĐT ${signupRow.claimed_phone}` : 'mã này';",
    'const ai = `SĐT ${signupRow.claimed_phone}`;', 1)], r'✗ H3h lời báo'),
  ('BV-A5-loi-bao-voucher', 'p20', [(S, "${voucherRow ? ', voucher cũ đã xoá' : ''}", ', voucher cũ đã xoá', 1)], r'✗ H3c lời báo'),
  # Port neo rữa viec/P20c/dot_bien.py:24 BV-A3-bo-dieu-kien (câu xoá đổi `code` → `id`).
  ('BV-P20C-A3-bo-dieu-kien', 'p20', [(S, "WHERE id = ? AND COALESCE(used_count, 0) = 0'", "WHERE id = ?'", 1)], r'✗ H3 hoàn tác voucher vừa được dùng'),
  # ── A6 · /increment-usage ──
  ('BV-A6-bo-quyen', 'p26a', [(D, "authenticate, checkPermission('manage_promotions'), async (req, res) => { // MA-GIAM-1 (A6)",
    'authenticate, async (req, res) => {', 1)], r'✗ M6 nhân viên'),
  ('VS-A6-sai-quyen', 'p26a', [(D, "checkPermission('manage_promotions'), async (req, res) => { // MA-GIAM-1 (A6)",
    "checkPermission('cancel_order'), async (req, res) => {", 1)], r'✗ M6 nhân viên'),
  # ── A8 · PUT không đổi tên voucher mã bill ──
  ('BV-A8-bo-chan-doi-ten', 'p20', [(D, CHAN_DOI_TEN, CHAN_DOI_TEN.replace('if (maBill)', 'if (false)'), 1)], r'✗ G12 voucher mã bill: PUT đổi tên'),
  ('VS-A8-tra-ma-moi', 'p20', [(D, "[existing.code]);\n      if (maBill) {", "[code]);\n      if (maBill) {", 1)], r'✗ G12 voucher mã bill: PUT đổi tên'),
  ('VS-A8-chan-ca-ma-tay', 'p20', [(D, CHAN_DOI_TEN, CHAN_DOI_TEN.replace('if (maBill)', 'if (true)'), 1)], r'✗ G14 mã tay đổi tên'),
  ('VS-A8-chan-moi-put', 'p20', [(D, "    if (code && code.trim().toUpperCase() !== existing.code) {\n      // MA-GIAM-1 (A8)",
    "    if (code) {\n      // MA-GIAM-1 (A8)", 1)], r'✗ G13 voucher mã bill: PUT giữ mã'),
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


def chay(k, bai):
  r = subprocess.run(['node', BAI[bai]], cwd=k, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def main():
  chon = sys.argv[1:]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  tam = tempfile.mkdtemp(prefix='ma_giam_1_')
  bat = 0
  try:
    for bai in sorted({d[1] for d in ds}):
      k = ban_sao(tam)
      ma, ra = chay(k, bai)
      shutil.rmtree(k)
      tong = next((l for l in ra.splitlines()[::-1] if 'đạt ·' in l), '(không dòng tổng)').strip()
      print(f'đối chứng {bai} (không đột biến): thoát {ma} · {tong}')
      if ma != 0 or ' 0 hỏng' not in tong: print('✗ đối chứng ĐỎ — không chấm đột biến'); return 2
    for ten, bai, cap, mau in ds:
      k = ban_sao(tam)
      loi = ap(k, cap)
      if loi: print(f'  HỎNG  {ten} — {loi}'); shutil.rmtree(k); continue
      ma, ra = chay(k, bai); shutil.rmtree(k)
      khop = [l.strip() for l in ra.splitlines() if re.search(mau, l)]
      if ma == 1 and khop: bat += 1; print(f'  BẮT   {ten} — {khop[0][:110]}')
      elif ma not in (0, 1): print(f'  SẬP   {ten} — thoát {ma}')
      elif ma == 1: print(f'  LẠC   {ten} — thoát 1, không dòng nào khớp /{mau}/')
      else: print(f'  SỐNG  {ten} — bài thử vẫn xanh')
  finally:
    shutil.rmtree(tam, ignore_errors=True)
  print(f'\n{bat}/{len(ds)} đột biến bị bắt')
  return 0 if bat == len(ds) else 1


if __name__ == '__main__': sys.exit(main())
