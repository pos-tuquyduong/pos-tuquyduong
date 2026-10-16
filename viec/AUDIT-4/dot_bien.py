#!/usr/bin/env python3
"""AUDIT-4 A3 — đột biến ĐỘC LẬP cho đường tiền thêm sau AUDIT-3 (P20b cổng voucher đơn gốc, BAN-HANG-1 cổng thẻ + hạn 30 ngày, vùng ca
LUOI-3 [M] / A2l–n / B3p), ở chỗ bộ của chính việc chưa đột biến (ke_hoach.md mục 4). Chạy ở GỐC kho:

    python3 viec/AUDIT-4/dot_bien.py [tên…]                  # bộ của việc này
    python3 viec/AUDIT-4/dot_bien.py --bo <SO-LUONG-1|BAN-HANG-1|P20b> [tên…]   # A2: bộ cũ (nạp CHỈ ĐỌC) chạy bằng luật của file này

Khuôn viec/AUDIT-3/dot_bien.py: chép THẬT server/ + cong_cu/ (+ tu_chay/cau_hinh.json) vào thư mục tạm, node_modules nối symlink (chỉ đọc), thay
chuỗi (khớp ĐÚNG số lần — không thì HỎNG, K3), chạy bài trên bản sao: 'p26c' / 'thu' / 'thub' = thu_P26c / thu_GOI1 / thu_P26b `--may-chu`,
'p20' = thu_P20.js chạy TRONG bản sao (không nhận --may-chu). Một đột biến khai nhiều cách thì chạy mọi bài (BẮT khi một bài bắt).
ĐỐI CHỨNG mỗi cách: bản sao chưa đột biến thoát 0 VÀ số ca khớp `BAI` — lệch thì DỪNG thoát 4. Nhãn: HỎNG = neo không áp được ·
HỎNG-sập = bài sập (`sap_cua` của boc.py) · BẮT = thoát ≠ 0 + dòng ✗ khớp mẫu · LẠC = thoát ≠ 0 không khớp · SỐNG = thoát 0.
SỐNG ở chỗ tiền / ví / gói / kho = NẶNG-lưới (chủ quán chốt Câu hỏi 2 = a). Tên lạ / chọn 0 → thoát 2. SIGINT / SIGTERM → dọn tạm, thoát 130.
Riêng hợp đồng D2: `python3 viec/AUDIT-4/dot_bien.py D2-AU4-sai-chuoi D2-AU4-da-biet D2-AU4-vo-hai D2-AU4-sap D2-AU4-sap-0` (thoát chỉ
phụ thuộc D2). Thoát 0 KHI VÀ CHỈ KHI mọi nhãn đúng `MONG` (D2 theo hợp đồng, còn lại BẮT); luật sập + bản sao nạp từ boc.py (một định nghĩa).
"""
import importlib.util, os, re, shutil, signal, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TONG = re.compile(r'\d+ đạt · \d+ hỏng')
O, T, G, A = 'routes/orders.js', 'utils/tienDaTra.js', 'utils/goiKhach.js', 'routes/auth.js'
BAI = {'p26c': ('cong_cu/thu_P26c.js', 118), 'thu': ('cong_cu/thu_GOI1.js', 105), 'thub': ('cong_cu/thu_P26b.js', 66), 'p20': ('cong_cu/thu_P20.js', 75)}
P20_CONG = 'if (kqDon.loi) return res.status(400).json({ error: kqDon.loi.error, code: "MA_DON_GOC_KHONG_HOP_LE" });'
COMMIT = "console.log(`✅ Đơn ${orderCode} - Transaction committed (order + wallet + log)`);"

# (tên, cách | (cách…), [(file tính từ server/, chuỗi gốc, chuỗi thay, số lần)], mẫu dòng ✗)
DOT_BIEN = [
  # ── D2 (cách MỚI p20): công cụ không nói dối ──
  ('D2-AU4-sai-chuoi', 'p20', [(O, 'CHUOI_KHONG_CO_TRONG_FILE_AUDIT4', 'x', 1)], r'✗ '),
  ('D2-AU4-da-biet', 'p20', [(O, 'if (maBill) {', 'if (false) {', 1)], r'✗ G1 '),
  ('D2-AU4-vo-hai', 'p20', [(O, '// 1. Tạo đơn hàng', '// 1. Tao don hang (AUDIT-4 vo hai)', 1)], r'✗ '),
  ('D2-AU4-sap', 'p20', [(O, '// 1. Tạo đơn hàng', '}}}{{{', 1)], r'✗ '),
  ('D2-AU4-sap-0', 'p20', [(O, '// 1. Tạo đơn hàng', 'process.exit(0);', 1)], r'✗ '),   # thu_P20 nạp máy chủ TRONG tiến trình (thu_P20.js:78)
  # ── P20b: cổng voucher từ mã bill (orders.js:508–519) ──
  ('VS-AU4-P20B-CHI-TRA-MA-CHUA-CLAIM', 'p20', [(O, ' AND claimed_at IS NOT NULL"', ' AND claimed_at IS NULL"', 1)], r'✗ G\d'),
  ('VS-AU4-P20B-DOI-MA-LOI', 'p20', [(O, 'code: "MA_DON_GOC_KHONG_HOP_LE"', 'code: kqDon.loi.code', 1)], r'✗ G1 '),
  ('BV-AU4-P20B-CHAN-SAU-GIAO-DICH', 'p20', [(O, P20_CONG, 'if (kqDon.loi) req._chanP20b = kqDon.loi;', 1),
    (O, COMMIT, COMMIT + '\n      if (req._chanP20b) return res.status(400).json({ error: req._chanP20b.error, code: "MA_DON_GOC_KHONG_HOP_LE" });', 1)], r'✗ G1 '),
  ('VS-AU4-P20B-TRA-MA-THO', 'p20', [(O, '[codeRecord.code],', '[discount_code],', 1)], r'✗ G\d'),
  # ── BAN-HANG-1: cổng thẻ (orders.js:190–191), hạn đăng nhập (auth.js:64) ──
  ('VS-AU4-BH1-THE-KIEM-OBJ', 'p26c', [(O, '!(membership_buy.tier_id && normalizePhone(customer_phone))', '!(membership_buy && normalizePhone(customer_phone))', 1)], r'✗ T1'),
  ('VS-AU4-BH1-DOI-MA-LOI', 'p26c', [(O, ', code: "THE_MUA_THIEU_THONG_TIN"', '', 1)], r'✗ T1'),
  ('VS-AU4-BH1-HAN-29D', 'p26c', [(A, "|| '30d' }", "|| '29d' }", 1)], r'✗ T3a'),
  # ── LUOI-3 vùng ca [M] / A2l–n / B3p (tienDaTra.js, goiKhach.js) ──
  ('VS-AU4-L3-DATRA-LAM-TRON-LEN', ('p26c', 'thu'), [(T, 'Math.floor((gia[i] * tra) / tong)', 'Math.ceil((gia[i] * tra) / tong)', 1)], r'✗ '),
  ('VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG', ('p26c', 'thu'), [(T, '- Math.ceil(daDung);', '- Math.floor(daDung);', 1)], r'✗ '),
  ('VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN', ('p26c', 'thu'), [(T, 'const goc = Math.floor(', 'const goc = Math.ceil(', 1)], r'✗ '),
  ('VS-AU4-L3-CHAN-TREN-CA-HOAN', ('p26c', 'thu'), [(T, 'const ma = chanTren && order.discount_code', 'const ma = order.discount_code', 1)], r'✗ '),
  ('VS-AU4-L3-LOAI-CHAN-BANG', 'thu', [(G, 'if (xin[khoaLoai(g)] > con) {', 'if (xin[khoaLoai(g)] >= con) {', 1)], r'✗ A2'),
  ('VS-AU4-L3-KHOA-LOAI-BO-KIEU', ('thu', 'p26c'), [(G, 'const khoaLoai = (i) => `${i.sx_product_type}_${i.sx_product_id}`;', 'const khoaLoai = (i) => `${i.sx_product_id}`;', 1)], r'✗ '),
  ('BV-AU4-L3-B3P-BO-SAN-0', ('thu', 'p26c'), [(T, 'Math.max(0, Math.min(goc, Number(don.total || 0) - Number(so.nhan)))', 'Math.min(goc, Number(don.total || 0) - Number(so.nhan))', 1)], r'✗ '),
]

MONG = {'D2-AU4-sai-chuoi': 'HỎNG', 'D2-AU4-vo-hai': 'SỐNG', 'D2-AU4-sap': 'HỎNG-sập', 'D2-AU4-sap-0': 'HỎNG-sập',   # hợp đồng D2; còn lại mong BẮT
        'VS-SOLUONG1-THE-SDT-THO': 'HỎNG'}   # --bo: neo cổng thẻ cũ, đã thay = BAN-HANG-1 `VS-BANHANG1-THE-SDT-THO` (kiem_neo.py RUA_CO_Y — soát vòng 2)

# MỘT luật sập + MỘT cách dựng bản sao: nạp từ boc.py (soát vòng 1 — không chép). boc.py tạo TAM, atexit xoá.
_sp = importlib.util.spec_from_file_location('boc_audit4', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'boc.py'))
B = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(B)
TAM = os.path.realpath(B.TAM)
ban_sao, sap_cua = B.ban_sao_sc, B.sap_cua


def ap(k, cap):
  for f, cu, moi, n in cap:
    p = os.path.join(k, 'server', f)
    if not os.path.realpath(p).startswith(TAM + os.sep): return f'{f}: đích {os.path.realpath(p)} ngoài thư mục tạm — KHÔNG sửa (K5)'
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n: return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return ''


def chay_bai(cach, k):   # → (mã thoát, đầu ra bỏ mã màu); TMPDIR = bản sao (bài chết giữa chừng không sót /tmp/thu_*)
  bai = BAI[cach][0]
  argv, cwd = (['node', bai], k) if cach == 'p20' else (['node', bai, '--may-chu', os.path.join(k, 'server')], GOC)
  r = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=300, env={**os.environ, 'TMPDIR': k})
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def chay1(db):   # → (tên, nhãn, [chi tiết])
  ten, cach, cap, mau = db
  ds = (cach,) if isinstance(cach, str) else cach
  k = ban_sao()
  try:
    loi = ap(k, cap)
    if loi: return ten, 'HỎNG', [loi]
    chi, bat, lac = [], False, False
    for c in ds:
      ma, ra = chay_bai(c, k)
      s = sap_cua(ma, ra)
      do = [l.strip() for l in ra.splitlines() if l.strip().startswith('✗ ')]
      if s: return ten, 'HỎNG-sập', [f'[{c}] bài thử SẬP (không phải bị bắt): {s}'] + [f'[{c}] (trước khi sập) {l[:200]}' for l in do]
      if ma != 0 and any(re.search(mau, l) for l in do): bat = True
      elif ma != 0: lac = True
      tong = (TONG.search(ra) or re.search(r'.+', ra) or re.search('', '')).group(0)[:80]   # dòng tổng 'n đạt · m hỏng'; thiếu thì dòng đầu (soát vòng 2)
      chi += [f'[{c}] thoát {ma} · {tong}'] + [f'[{c}] {l[:230]}' for l in do]
    return ten, 'BẮT' if bat else 'LẠC' if lac else 'SỐNG', chi
  finally:
    shutil.rmtree(k, ignore_errors=True)


def doi_chung(cach):
  k = ban_sao()
  try:
    ma, ra = chay_bai(cach, k)
    tong = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    ok = ma == 0 and not sap_cua(ma, ra) and bool(tong) and int(tong.group(1)) == BAI[cach][1] and tong.group(2) == '0'
    print(('  ✓ ' if ok else '  ✗ ') + f'đối chứng {cach} ({BAI[cach][0]}): thoát {ma} · ' + (tong.group(0) if tong else 'không dòng tổng')
          + f' (mong {BAI[cach][1]} đạt · 0 hỏng)', flush=True)
    return ok
  finally:
    shutil.rmtree(k, ignore_errors=True)


def bo_cu(bo):   # A2: DOT_BIEN của bộ cũ (nạp chỉ đọc) → dạng của file này
  sp = importlib.util.spec_from_file_location(f'au4_{bo}'.replace('-', '_'), os.path.join(GOC, 'viec', bo, 'dot_bien.py'))
  m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
  if bo == 'SO-LUONG-1': return [tuple(d) for d in m.DOT_BIEN]
  if bo == 'BAN-HANG-1': return [(t, 'p26c', cap, mau) for t, cap, mau in m.DOT_BIEN]
  if bo == 'P20b': return [(t, 'p20', [(f[len('server/'):], cu, moi, n) for f, cu, moi, n in cap], mau) for t, cap, mau in m.DOT_BIEN]
  sys.exit(f'--bo: không biết bộ {bo}')


def main():
  a = sys.argv[1:]
  bo = None
  if a[:1] == ['--bo']:
    if len(a) < 2: print('--bo cần tên bộ'); return 2
    bo, a = a[1], a[2:]
  ds_goc = bo_cu(bo) if bo else DOT_BIEN
  if len({d[0] for d in ds_goc}) != len(ds_goc): print('tên đột biến trùng'); return 2
  la = [t for t in a if t not in {d[0] for d in ds_goc}]
  chon = [d for d in ds_goc if not a or d[0] in a]
  if la or not chon: print(f'tên đột biến lạ: {la} / chọn 0 đột biến — không chạy rỗng rồi báo xanh'); return 2
  print(f'AUDIT-4 dot_bien{" --bo " + bo if bo else ""}: {len(chon)} đột biến', flush=True)
  cach = sorted({c for d in chon for c in ((d[1],) if isinstance(d[1], str) else d[1])})
  if not all([doi_chung(c) for c in cach]): print('\n  DỪNG — đối chứng đỏ / lệch số ca, không chấm (K3)'); return 4
  with ThreadPoolExecutor(max_workers=4) as ex: kq = list(ex.map(chay1, chon))
  for ten, k, chi in kq:
    print(f"  {k:8} {ten}" + ('' if k == MONG.get(ten, 'BẮT') else f"   ← mong {MONG.get(ten, 'BẮT')}"))
    for l in chi[:10]: print(f'           {l}')
  dem = {x: sum(k == x for _, k, _ in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'HỎNG-sập', 'LẠC')}
  dung = sum(k == MONG.get(t, 'BẮT') for t, k, _ in kq)
  print(f'\n  tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()) + f' · đúng mong {dung}/{len(kq)}', flush=True)
  return 0 if dung == len(kq) else 1   # thoát 0 KHI VÀ CHỈ KHI mọi nhãn đúng mong (D2 theo hợp đồng, còn lại BẮT) — soát vòng 1


if __name__ == '__main__':
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, lambda *_: sys.exit(130))   # SystemExit → atexit xoá TAM
  sys.exit(main())
