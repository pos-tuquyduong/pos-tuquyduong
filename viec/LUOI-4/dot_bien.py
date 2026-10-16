#!/usr/bin/env python3
"""LUOI-4 — 7 đột biến NẶNG-lưới AU4-2…8 của AUDIT-4 phải bị ĐÚNG ca của LUOI-4 bắt. Chạy ở GỐC kho:

    python3 viec/LUOI-4/dot_bien.py [--truoc] [tên...]     # --truoc: số ca đối chứng của bài TRƯỚC LUOI-4 (bằng chứng SỐNG)

Cặp thay chuỗi + bản sao + máy chạy + luật sập lấy NGUYÊN từ viec/AUDIT-4/dot_bien.py (chỉ đọc — một nguồn neo). Ở đây chỉ: số ca đối chứng
của bài SAU LUOI-4 (BAI của AUDIT-4 là hằng 118 / 105 — sửa trong bộ nhớ, không sửa file), mẫu = TÊN CA LUOI-4, in MỌI dòng ✗.
BẮT = không sập + thoát ≠ 0 + MỖI mẫu khớp một dòng ✗ ở một bài của đột biến. Tên lạ / chọn 0 → thoát 2; đối chứng đỏ → thoát 4.
"""
import importlib.util, os, re, shutil, sys
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True   # trước khi nạp: không đẻ __pycache__ trong viec/AUDIT-4/ (Cấm)

_sp = importlib.util.spec_from_file_location('dot_bien_audit4', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'AUDIT-4', 'dot_bien.py'))
A = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(A)
CAP = {d[0]: d for d in A.DOT_BIEN}
TRUOC = '--truoc' in sys.argv   # bằng chứng đỏ: bài CHƯA có ca LUOI-4 → số ca cũ
A.BAI['p26c'] = ('cong_cu/thu_P26c.js', 118 if TRUOC else 121)   # + N1a, N2a, N4a
A.BAI['thu'] = ('cong_cu/thu_GOI1.js', 105 if TRUOC else 110)    # + A2o, A2p, A2p2, B3q, B3r

# (tên đột biến trong AUDIT-4, [mẫu dòng ✗ — mỗi mẫu phải khớp])
DOT_BIEN = [
  ('VS-AU4-L3-DATRA-LAM-TRON-LEN', [r'✗ N1a ']),
  ('VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG', [r'✗ N2a ']),
  ('VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN', [r'✗ B3q ']),
  ('VS-AU4-L3-CHAN-TREN-CA-HOAN', [r'✗ N4a ']),
  ('VS-AU4-L3-KHOA-LOAI-BO-KIEU', [r'✗ A2o ', r'✗ A2p2? ']),
  ('BV-AU4-L3-B3P-BO-SAN-0', [r'✗ B3r ']),
  ('VS-AU4-L3-LOAI-CHAN-BANG', [r'✗ A2b ']),
]


def chay1(db):   # → (tên, BẮT/SỐNG/HỎNG/HỎNG-sập/LẠC, [chi tiết])
  ten, mau = db
  _, cach, cap, _ = CAP[ten]
  k = A.ban_sao()
  try:
    loi = A.ap(k, cap)
    if loi: return ten, 'HỎNG', [loi]
    chi, do, ma_khac = [], [], False
    for c in ((cach,) if isinstance(cach, str) else cach):
      ma, ra = A.chay_bai(c, k)
      s = A.sap_cua(ma, ra)
      d = [l.strip() for l in ra.splitlines() if l.strip().startswith('✗ ')]
      if s: return ten, 'HỎNG-sập', [f'[{c}] bài thử SẬP: {s}'] + [f'[{c}] {l[:230]}' for l in d]
      ma_khac = ma_khac or ma != 0
      do += d
      chi += [f'[{c}] thoát {ma} · ' + (A.TONG.search(ra) or re.search('', '')).group(0)] + [f'[{c}] {l[:230]}' for l in d]
    if ma_khac and all(any(re.search(m, l) for l in do) for m in mau): return ten, 'BẮT', chi
    return ten, ('LẠC' if ma_khac else 'SỐNG'), chi
  finally:
    shutil.rmtree(k, ignore_errors=True)


def main():
  a = [x for x in sys.argv[1:] if x != '--truoc']
  if len({t for t, _ in DOT_BIEN}) != len(DOT_BIEN) or any(t not in CAP for t, _ in DOT_BIEN): print('tên đột biến trùng / không có trong AUDIT-4'); return 2
  la = [t for t in a if t not in dict(DOT_BIEN)]
  chon = [d for d in DOT_BIEN if not a or d[0] in a]
  if la or not chon: print(f'tên đột biến lạ: {la} / chọn 0 đột biến — không chạy rỗng rồi báo xanh'); return 2
  print(f'LUOI-4 dot_bien: {len(chon)} đột biến', flush=True)
  cach = sorted({c for t, _ in chon for c in ((CAP[t][1],) if isinstance(CAP[t][1], str) else CAP[t][1])})
  if not all([A.doi_chung(c) for c in cach]): print('\n  DỪNG — đối chứng đỏ / lệch số ca, không chấm (K3)'); return 4
  with ThreadPoolExecutor(max_workers=4) as ex: kq = list(ex.map(chay1, chon))
  for ten, k, chi in kq:
    print(f'  {k:8} {ten} (mẫu ' + ' + '.join(f'/{m}/' for m in dict(DOT_BIEN)[ten]) + ')')
    for l in chi: print(f'           {l}')
  dem = {x: sum(k == x for _, k, _ in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'HỎNG-sập', 'LẠC')}
  print(f'\n  tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()), flush=True)
  return 0 if dem['BẮT'] == len(kq) else 1


if __name__ == '__main__':
  sys.exit(main())
