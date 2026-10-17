#!/usr/bin/env python3
"""LUOI-5 — 18 đột biến SỐNG cũ AU4-21 đo dưới LƯỚI ĐỦ (mọi bài chạy thật của `npm test` + `--day-du` chạm máy chủ). Chạy ở GỐC kho:

    python3 viec/LUOI-5/dot_bien.py [--truoc] [-j N] [tên…]   # --truoc: số ca đối chứng của bài TRƯỚC LUOI-5

Chỉ ĐỌC khung `viec/AUDIT-1/dot_bien.py` (bản sao 'sv', áp neo, chạy lệnh, dọn tạm), bảng `viec/AUDIT-2/dot_bien.py` (A3L / BK) và luật sập
`viec/AUDIT-4/boc.py` (`sap_cua`). C2F sinh lại trên HEAD (`sinh_c2full`) rồi chọn theo CHỮ KÝ câu ghi, không theo số thứ tự — MA-GIAM-1 đổi
thứ tự câu ghi discount-codes nên số trong tên AUDIT-4 trỏ câu khác (AUDIT-4 03 = tắt, HEAD sinh 03 = xoá). Mọi bài trong LUOI chạy hết
(không dừng ở bài đỏ đầu) để thấy MỌI bài bắt. BẮT = không bài nào sập + một bài thoát ≠ 0 có dòng ✗ khớp mẫu · LẠC = có bài đỏ, không dòng
khớp · SỐNG = mọi bài thoát 0 · HỎNG = neo không áp được / chữ ký không đúng 1 câu · HỎNG-sập = `sap_cua` · TREO = quá giờ.
Thoát: 0 mọi tên BẮT · 1 còn tên khác BẮT · 2 tên lạ · 3 kho bẩn · 4 đối chứng đỏ / lệch số ca.
"""
import importlib.util, os, re, shutil, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True   # trước khi nạp: không đẻ __pycache__ trong viec/AUDIT-*/ (Cấm)


def nap(ten, rel):
  sp = importlib.util.spec_from_file_location(ten, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', rel))
  m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m


B = nap('boc_audit4', 'AUDIT-4/boc.py')
M2 = nap('dot_bien_audit2', 'AUDIT-2/dot_bien.py')
K = M2.K
GOC, CLIENT = K.GOC, os.path.join(K.GOC, 'client')
TRUOC = '--truoc' in sys.argv
N = K.N
# Lưới đủ = 6 bài `chayBaiThat` của kiem_tra_truoc_khi_giao.js:492 + giả lập (chay.js — nạp server/index.js thật, mọi route) +
# thu_gia_lap.js (--day-du :854; tự thử khung giả lập, chạy chay.js trên server/ của bản sao). Bài khác của npm test (tu_chay/*, thu_TOCDO1)
# không nạp server/ (grep `MAY_CHU|server` — thu_TOCDO1 chỉ dựng kho git tạm).
LUOI = [N('cong_cu/gia_lap/chay.js'), N('cong_cu/thu_P26a.js'), N('cong_cu/thu_P26b.js'), N('cong_cu/thu_P26c.js', '--client', CLIENT),
        N('cong_cu/thu_GOI1.js', '--client', CLIENT), N('cong_cu/thu_P20.js'), N('cong_cu/thu_P21.js'), N('cong_cu/thu_gia_lap.js')]
GIO = 300
# Số ca dòng tổng "n đạt · 0 hỏng" của bài khi KHÔNG đột biến (đối chứng — bài chạy hết, không thiếu ca). Giả lập: dòng ĐẠT.
SO_CA = {'cong_cu/thu_P26a.js': 16, 'cong_cu/thu_P26b.js': 66, 'cong_cu/thu_P26c.js': 121, 'cong_cu/thu_GOI1.js': 110,
         'cong_cu/thu_P20.js': 169, 'cong_cu/thu_P21.js': 14, 'cong_cu/thu_gia_lap.js': 148}

# (tên AUDIT-4, file, chữ ký câu ghi trên HEAD, dòng AUDIT-4, mẫu dòng ✗ phải thấy)
C2F = [
  ('C2F-damages-03-update-quan-tri', 'damages', 'UPDATE pos_damage_logs SET returned_to_stock = 1', 218, r'✗ '),
  ('C2F-packages-01-insert-quan-tri', 'packages', 'INSERT INTO pos_packages (', 61, r'✗ '),
  ('C2F-packages-03-update-quan-tri', 'packages', 'UPDATE pos_packages SET is_active = 0', 136, r'✗ '),
  ('C2F-packages-04-delete-quan-tri', 'packages', 'DELETE FROM pos_packages WHERE id = ?', 139, r'✗ '),
  ('C2F-packages-06-update-quay', 'packages', "UPDATE pos_customer_packages SET status = 'cancelled'", 262, r'✗ '),
  ('C2F-discount-codes-02-update-quan-tri', 'discount-codes', 'UPDATE pos_discount_codes SET\n        code = ?', 265, r'✗ '),
  ('C2F-discount-codes-03-update-quan-tri', 'discount-codes', 'UPDATE pos_discount_codes SET is_active = 0', 319, r'✗ '),
  ('C2F-discount-codes-04-delete-quan-tri', 'discount-codes', 'DELETE FROM pos_discount_codes WHERE id = ?', 326, r'✗ '),
  ('C2F-signup-codes-05-update-quan-tri', 'signup-codes', 'UPDATE pos_signup_codes SET claimed_at = NULL', 477, r'✗ '),
  ('C2F-signup-codes-06-delete-quan-tri', 'signup-codes', 'DELETE FROM pos_discount_codes WHERE id = ?', 484, r'✗ '),
  ('C2F-rewards-02-update-quan-tri', 'rewards', 'UPDATE pos_reward_catalog SET name=?', 74, r'✗ '),
  ('C2F-rewards-03-update-quan-tri', 'rewards', 'UPDATE pos_reward_catalog SET is_active = 0', 87, r'✗ '),
  ('C2F-customers-v2-04-update-quan-tri', 'customers-v2', 'SET discount_type = ?', 369, r'✗ '),
  ('C2F-customers-v2-05-insert-quan-tri', 'customers-v2', 'INSERT INTO pos_customers (phone, name, discount_type', 376, r'✗ '),
]
# (tên AUDIT-2 — neo lấy NGUYÊN bảng viec/AUDIT-2/dot_bien.py, dòng AUDIT-4, mẫu)
AU2 = [
  ('A3L-redeem-bo-han-diem', 31, r'✗ '),
  ('A3L-nhandiem-he-so-mac-dinh', 108, r'✗ '),
  ('A3L-goi-bo-kiem-con-lai', 248, r'✗ '),
  ('BK-KB16-duyet-bo-cong-don', 158, r'✗ '),
]


def dung_bang():   # → [(tên, [cặp thay], mẫu, ghi chú neo)]; cặp rỗng + ghi chú = HỎNG
  sinh = K.sinh_c2full()
  ra = []
  for ten, f, ky, dong, mau in C2F:
    rel = f'server/routes/{f}.js'
    raw = open(os.path.join(GOC, rel), encoding='utf-8').read()
    hop = [d for d in sinh if d[3][0][0] == rel and ky in raw[raw.index(d[3][0][1]):raw.index(d[3][0][1]) + len(d[3][0][1]) + 120]]
    if len(hop) != 1: ra.append((ten, [], mau, f'chữ ký khớp {len(hop)} câu ghi, cần 1')); continue
    d = hop[0]
    ra.append((ten, d[3], mau, f'{f}.js:{dong} → :{raw[:raw.index(d[3][0][1])].count(chr(10)) + 1} (HEAD sinh tên {d[0]})'))
  bang2 = {d[0]: d for d in K.DOT_BIEN}
  for ten, dong, mau in AU2:
    f, cu = bang2[ten][3][0][:2]
    raw = open(os.path.join(GOC, f), encoding='utf-8').read()
    ra.append((ten, bang2[ten][3], mau, f'{os.path.basename(f)}:{dong} → :' + (str(raw[:raw.index(cu)].count(chr(10)) + 1) if cu in raw else 'mất')))
  return ra


def tong_cua(ra):
  t = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
  return t.group(0) if t else (re.search(r'^\s*Giả lập: \d+ kịch bản · \d+ bất biến · (?:ĐẠT|KHÔNG ĐẠT \(\d+ lệch\))\s*$', ra, re.M) or re.search('', '')).group(0).strip()


def chay1(db):   # → (tên, nhãn, [chi tiết theo bài], {bài: tổng})
  ten, cap, mau, _ = db
  tam = tempfile.mkdtemp(prefix='luoi5_', dir=K.GOC_TAM)
  try:
    if not cap: return ten, 'HỎNG', [db[3]], {}
    k = K.dung_ban_sao('sv', tam, False)
    K.chep('kiem_tra_truoc_khi_giao.js', k)   # thu_gia_lap [C3] cắt chayBaiThat từ file này (bản sao 'sv' không có)
    loi = K.ap(k, cap)
    if loi: return ten, 'HỎNG', [loi], {}
    env, chi, tong, sap, treo, bat, lac = K.moi_truong(tam), [], {}, False, False, False, False
    for argv in LUOI:
      bai = argv[1]
      ma, ra, g = K.chay_lenh(argv, k, env, GIO)
      if ma is None: treo = True; chi.append(f'[{bai}] TREO quá {GIO} s'); continue
      tong[bai] = tong_cua(ra)
      s = B.sap_cua(ma, ra)
      do = [l.strip() for l in ra.splitlines() if l.strip().startswith('✗ ')]
      if s: sap = True; chi.append(f'[{bai}] SẬP: {s[:160]}')
      if ma != 0:
        khop = [l for l in do if re.search(mau, l)]
        bat, lac = bat or bool(khop), lac or not khop
        chi.append(f'[{bai}] thoát {ma} · {tong[bai]} ({round(g)} s)')
        chi += [f'[{bai}]   {l[:230]}' for l in do]
    nhan = 'HỎNG-sập' if sap else 'TREO' if treo else 'BẮT' if bat else 'LẠC' if lac else 'SỐNG'
    return ten, nhan, chi or ['mọi bài thoát 0'], tong
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def doi_chung():   # bản sao KHÔNG đột biến: mọi bài thoát 0, không sập, đủ số ca
  ten, nhan, chi, tong = chay1(('sạch', [('server/routes/orders.js', '// 1. Tạo đơn hàng', '// 1. Tạo đơn hàng', 1)], r'$^', ''))
  ok = nhan == 'SỐNG'
  for bai in [a[1] for a in LUOI]:
    mong = SO_CA.get(bai)
    t = tong.get(bai, '(không chạy)')
    dung = mong is None or re.fullmatch(rf'{mong} đạt · 0 hỏng', t) is not None
    ok = ok and dung
    print(('  ✓ ' if dung and nhan == 'SỐNG' else '  ✗ ') + f'đối chứng {bai}: {t}' + ('' if mong is None else f' (mong {mong} đạt)'))
  if nhan != 'SỐNG': print(f'  ✗ đối chứng: {nhan} · ' + ' | '.join(chi)[:400])
  return ok


def main():
  a = [x for x in sys.argv[1:] if x != '--truoc']
  j = 4
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  bang = dung_bang()
  la = [t for t in a if t not in {b[0] for b in bang}]
  chon = [b for b in bang if not a or b[0] in a]
  if la or not chon: print(f'tên đột biến lạ: {la} / chọn 0 — không chạy rỗng rồi báo xanh'); return 2
  truoc = B.anh_kho()
  try:
    print(f'LUOI-5 dot_bien: {len(chon)} đột biến · -j {j} · lưới {len(LUOI)} bài', flush=True)
    for t, _, _, g in chon: print(f'  neo {t}: {g}')
    if not doi_chung(): print('\n  DỪNG — đối chứng đỏ / lệch số ca, không chấm (K3)'); return 4
    with ThreadPoolExecutor(max_workers=j) as ex: kq = list(ex.map(chay1, chon))
  finally:
    shutil.rmtree(K.GOC_TAM, ignore_errors=True)
  for ten, nhan, chi, _ in kq:
    print(f'  {nhan:8} {ten}')
    for l in chi: print(f'           {l}')
  dem = {x: sum(k == x for _, k, _, _ in kq) for x in ('BẮT', 'SỐNG', 'LẠC', 'HỎNG', 'HỎNG-sập', 'TREO')}
  print(f'\n  tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()), flush=True)
  if B.anh_kho() != truoc: print('  ✗ KHO BẨN — git status ngoài viec/AUDIT-4/ đổi'); return 3
  return 0 if dem['BẮT'] == len(kq) else 1


if __name__ == '__main__':
  sys.exit(main())
