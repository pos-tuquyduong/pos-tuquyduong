#!/usr/bin/env python3
# HOC-2b D5 (b) phần (1) — MỌI đột biến của 6 bộ: chuỗi gốc có khớp ĐÚNG số lần trên các file hiện tại không, KHÔNG chạy
# lệnh đo (vài giây). Neo rữa = HỎNG. Chạy: python3 viec/HOC-2b/kiem_neo.py
# Đọc bảng của từng bộ bằng cách chạy phần ĐẦU file (tới hàm chạy đầu tiên) — không chạy đột biến nào.
import os, shutil, sys

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def bang(bo, cat, ten_bang):
    p = os.path.join(GOC, 'viec', bo, 'dot_bien.py')
    src = open(p, encoding='utf-8').read()
    ns = {'__file__': p, '__name__': 'kiem_neo'}
    exec(compile(src[:src.index(cat)], p, 'exec'), ns)
    if 'GOC_TAM' in ns: shutil.rmtree(ns['GOC_TAM'], ignore_errors=True)   # AUDIT-1 tạo thư mục tạm lúc nạp
    return ns[ten_bang]


def dem(f, cu):
    p = os.path.join(GOC, f)
    return open(p, encoding='utf-8').read().count(cu) if os.path.isfile(p) else None


kq = {}
def ghi(bo, ten, ds):   # ds: [(file từ gốc kho, chuỗi gốc, số lần cần)]
    loi = []
    for f, cu, n in ds:
        if cu is None:
            if os.path.exists(os.path.join(GOC, f)): loi.append(f'{f}: đã có (đột biến tạo file mới)')
            continue
        c = dem(f, cu)
        if c != n: loi.append(f'{f}: khớp {c} lần, cần {n}')
    kq.setdefault(bo, []).append((ten, loi))


for t in bang('AUDIT-1', '\n# ═══ Bản sao + lệnh', 'DOT_BIEN'):
    ghi('AUDIT-1', t[0], [(d[0], d[1], d[3]) for d in t[3]])
for t in bang('P26b', '\ndef ap(', 'DOT_BIEN'):
    ghi('P26b', t[0], [(('cong_cu/gia_lap/' if d[0] == 'bat_bien.js' else 'server/') + d[0], d[1], d[3]) for d in t[2]])
for t in bang('HOC-1', '\ndef chay(', 'DB'):
    ghi('HOC-1', t[0], [(t[1], t[2], 1)] if t[1] else [])
for t in bang('HOC-2', '\ndef chay(', 'DB'):
    ghi('HOC-2', t[0], [(t[1], t[2], 1)] if t[1] else [])
for t in bang('TU-CHAY-4', '\ndef thay(', 'DB'):
    ghi('TU-CHAY-4', t[0], [(('cong_cu/gia_lap/' if t[1] == 'gl' else '') + t[2], t[3], 1)] if t[2] else [])
for t in bang('HOC-2b', '\ndef chep_kho(', 'DB'):
    if isinstance(t[2], tuple): continue   # dùng lại bản vá của P26b — đã kiểm ở bộ P26b
    ghi('HOC-2b', t[0], [(f, a, 1) for f, a, b in t[2]])

hong = 0
for bo, ds in kq.items():
    h = [(t, l) for t, l in ds if l]
    hong += len(h)
    print(f'{bo}: {len(ds)} đột biến · neo khớp {len(ds) - len(h)} · HỎNG {len(h)}')
    for t, l in h: print(f'  HỎNG {t}: {"; ".join(l)}')
sys.exit(1 if hong else 0)
