#!/usr/bin/env python3
"""LUOI-3 — 10 đột biến NẶNG-lưới của AUDIT-3 (AU3-8…17) phải bị ĐÚNG ca của nó bắt. Chạy ở GỐC kho:

    python3 viec/LUOI-3/dot_bien.py [tên...]

Cặp thay chuỗi + máy chạy lấy NGUYÊN từ viec/AUDIT-3/dot_bien.py (chỉ đọc — một nguồn neo); ở đây chỉ thay mẫu bằng TÊN CA của
LUOI-3 và in MỌI dòng ✗ NGUYÊN VĂN (thấy ca nào khác cùng đỏ, đủ số lỗi). BẮT = thoát ≠ 0 + bài chạy hết + không dấu sập + MỖI mẫu
của đột biến khớp một dòng ✗ (N1, N2 có hai vế → hai mẫu, cả hai phải đỏ). Tên lạ / chọn 0 đột biến → thoát 2 (soát vòng 1).
"""
import importlib.util, os, re, shutil, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True   # trước khi nạp AUDIT-3: không đẻ __pycache__ trong viec/AUDIT-3/ (Cấm)

_spec = importlib.util.spec_from_file_location('dot_bien_audit3', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'AUDIT-3', 'dot_bien.py'))
A = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(A)
CAP = {d[0]: d for d in A.DOT_BIEN}

# (tên đột biến trong AUDIT-3, [mẫu dòng ✗ của MỖI ca LUOI-3 phải đỏ])
DOT_BIEN = [
  ('BV-AU3-P26C-DATRA-BO-TRU-SHIP', [r'✗ M1a ', r'✗ M1b ']),
  ('VS-AU3-P26C-DATRA-GIA-GOC', [r'✗ M2a ', r'✗ M2b ']),
  ('VS-AU3-P26C-DEN-GIAM-BO-FLASH', [r'✗ M3a ']),
  ('VS-AU3-GOI1-LOAI-KHONG-CONG-DON', [r'✗ A2l ']),
  ('VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN', [r'✗ A2n ']),
  ('BV-AU3-GOI2-BO-TRAN-DA-NHAN', [r'✗ B3p ']),
  ('VS-AU3-GOI2-NHAN-BO-DEN', [r'✗ B3p ']),
  ('VS-AU3-SL-DONG-GOI-SL-1', [r'✗ M4a ']),
  ('VS-AU3-SL-DONG-GOI-TONG-1', [r'✗ M4b ']),
  ('VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL', [r'✗ M4a ']),
]


def chay1(db):  # → (tên, BẮT/SỐNG/HỎNG/LẠC, các dòng ✗)
  ten, mau = db
  _, cach, cap, _ = CAP[ten]
  tam = tempfile.mkdtemp(prefix='luoi3_db_')
  try:
    thu = A.ban_sao(tam)
    loi = A.ap(thu, cap)
    if loi: return ten, 'HỎNG', [loi]
    ma, ra = A.chay_bai(cach, thu)
    dong = ra.splitlines()
    do = [l.strip() for l in dong if l.strip().startswith('✗ ')]
    if any(A.SAP.search(l) for l in dong) or ma == 2 or not A.HET.search(ra): return ten, 'HỎNG', ['bài thử SẬP'] + do
    if ma != 0 and all(any(re.search(m, l) for l in do) for m in mau): return ten, 'BẮT', do
    return ten, ('SỐNG' if ma == 0 else 'LẠC'), do or [f'thoát {ma}, không dòng ✗ · ' + ([l.strip() for l in dong if l.strip()] or [''])[-1][:100]]
  finally:
    shutil.rmtree(tam, ignore_errors=True)


if __name__ == '__main__':
  if len({t for t, _ in DOT_BIEN}) != len(DOT_BIEN) or any(t not in CAP for t, _ in DOT_BIEN): print('tên đột biến trùng / không có trong AUDIT-3'); sys.exit(2)
  chon = [d for d in DOT_BIEN if len(sys.argv) < 2 or d[0] in sys.argv[1:]]
  la = [a for a in sys.argv[1:] if a not in dict(DOT_BIEN)]
  if la or not chon: print(f'tên đột biến lạ: {la} / chọn 0 đột biến — không chạy rỗng rồi báo xanh'); sys.exit(2)
  for cach in sorted({CAP[t][1] for t, _ in chon}):
    xanh, chi = A.doi_chung(cach)
    print(('  ✓ ' if xanh else '  ✗ ') + f'đối chứng (bản sao chưa đột biến phải xanh): {chi}')
    if not xanh: print('\n  DỪNG — bài thử đỏ trên bản chưa đột biến (K3)'); sys.exit(4)
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(chay1, chon))
  for ten, k, do in kq:
    print(f'  {k:5} {ten} (mẫu ' + ' + '.join(f'/{m}/' for m in dict(DOT_BIEN)[ten]) + ')')
    for l in do: print(f'          {l}')
  dem = {x: sum(k == x for _, k, _ in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'\n  tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()))
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
