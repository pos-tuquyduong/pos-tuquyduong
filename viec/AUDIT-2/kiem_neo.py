#!/usr/bin/env python3
# AUDIT-2 C1 — mở rộng viec/HOC-2b/kiem_neo.py: rà NEO (chuỗi gốc khớp ĐÚNG số lần) và MẪU nhận kết quả của MỌI bộ đột biến
# viec/*/dot_bien.py + AUDIT-2/dot_bien_bb.py + neo của viec/*/do_*.js, KHÔNG chạy lệnh đo nào (vài giây).
# Chạy: python3 viec/AUDIT-2/kiem_neo.py   → thoát 1 nếu còn HỎNG ngoài danh sách RUA_CO_Y.
# MẪU: mọi TỪ (≥ 4 chữ cái liền) trong phần chữ cố định của mẫu phải có trong nguồn in ra (tu_chay/, cong_cu/, server/,
# kiem_tra_truoc_khi_giao.js, viec/LUOI-1/do_thoi_gian.js) hoặc trong chuỗi chính đột biến đó chèn vào. Thiếu → "mẫu nghi rữa"
# (câu in đã đổi chữ) — xem tay (K2), không đếm HỎNG. So theo TỪ vì nguồn in câu bằng `${}` nên không so được cả câu.
import glob, importlib.util, json, os, re, shutil, subprocess, sys

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Rữa CỐ Ý (tên → lý do). Không có ở đây mà HỎNG = phát hiện.
RUA_CO_Y = {
  ('AUDIT-1', 'G3-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-1 G3)',
  ('AUDIT-2', 'D2K-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-2 D2)',
  ('AUDIT-2 bb', 'D2-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-2 D2)',
  ('HOC-2', 'VS-E3-phien-ban-cu'): 'neo "tu-chay 1.4.0" rữa tất yếu khi lên 1.5.0 (TU-CHAY-5 Phát hiện 6) — đề xuất đổi neo, không sửa HOC-2',
}


def nap(bo, cat=None, ten='DOT_BIEN', tep='dot_bien.py'):
    p = os.path.join(GOC, 'viec', bo, tep)
    if cat is None:   # nạp cả module (không chạy __main__)
        sp = importlib.util.spec_from_file_location(f'kn_{bo}_{tep}'.replace('-', '_').replace('.', '_'), p)
        m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
        return m
    src = open(p, encoding='utf-8').read()
    ns = {'__file__': p, '__name__': 'kiem_neo'}
    exec(compile(src[:src.index(cat)], p, 'exec'), ns)
    if 'GOC_TAM' in ns: shutil.rmtree(ns['GOC_TAM'], ignore_errors=True)   # AUDIT-1 tạo thư mục tạm lúc nạp
    return ns[ten]


def dem(f, cu):
    p = os.path.join(GOC, f)
    return open(p, encoding='utf-8').read().count(cu) if os.path.isfile(p) else None


NGUON = ''.join(open(p, encoding='utf-8', errors='replace').read() for p in sorted(
    glob.glob(os.path.join(GOC, 'tu_chay', '*.js')) + glob.glob(os.path.join(GOC, 'cong_cu', '**', '*.js'), recursive=True)
    + glob.glob(os.path.join(GOC, 'server', '**', '*.js'), recursive=True)
    + [os.path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), os.path.join(GOC, 'viec', 'LUOI-1', 'do_thoi_gian.js')]))
TU = lambda x: set(re.findall(r'[^\W\d_]{4,}', x))
TU_NGUON = TU(NGUON)


def tu_mau(mau, regex=True):
    if regex: mau = re.sub(r'\\[dDsSwWbB]', ' ', mau).replace('\\', '')
    return TU(mau)


kq, rua = {}, []
def ghi(bo, ten, ds, maus=(), regex=True, chen=''):   # ds: [(file từ gốc kho, chuỗi gốc, số lần cần)]; chen: chữ đột biến chèn
    loi = []
    for f, cu, n in ds:
        if cu is None:
            if os.path.exists(os.path.join(GOC, f)): loi.append(f'{f}: đã có (đột biến tạo file mới)')
            continue
        c = dem(f, cu)
        if c != n: loi.append(f'{f}: khớp {c} lần, cần {n}')
    kq.setdefault(bo, []).append((ten, loi))
    for m in maus:
        thieu = sorted(w for w in tu_mau(m, regex) if w not in TU_NGUON and w not in TU(chen))
        if thieu: rua.append(f'{bo} {ten}: mẫu {m!r} — không thấy trong nguồn: {thieu}')


def tep_ds(t):   # bảng (file, cũ, mới, n[, k]) → (file, cũ, n)
    return [(d[0], d[1], d[3]) for d in t]


for t in nap('AUDIT-1', '\n# ═══ Bản sao + lệnh'):
    ghi('AUDIT-1', t[0], tep_ds(t[3]), [t[4]] if t[1] not in ('G3', 'C2F') else [], chen=' '.join(str(d[2]) for d in t[3]))
for t in nap('P26b', '\ndef ap('):
    ghi('P26b', t[0], [(('cong_cu/gia_lap/' if d[0] == 'bat_bien.js' else 'server/') + d[0], d[1], d[3]) for d in t[2]], [t[3]],
        chen=' '.join(str(d[2]) for d in t[2]))
for t in nap('HOC-1', '\ndef chay(', 'DB'):
    ghi('HOC-1', t[0], [(t[1], t[2], 1)] if t[1] else [], [t[5]] if t[5] else [], regex=False, chen=str(t[3]))
for t in nap('HOC-2', '\ndef chay(', 'DB'):
    ghi('HOC-2', t[0], [(t[1], t[2], 1)] if t[1] else [], [t[5]] if t[5] else [], regex=False, chen=str(t[3]))
for t in nap('TU-CHAY-4', '\ndef thay(', 'DB'):
    ghi('TU-CHAY-4', t[0], [(('cong_cu/gia_lap/' if t[1] == 'gl' else '') + t[2], t[3], 1)] if t[2] else [], [t[5]] if t[5] else [], regex=False,
        chen=str(t[4]))
for t in nap('HOC-2b', '\ndef chep_kho(', 'DB'):
    if isinstance(t[2], tuple): continue   # dùng lại bản vá của P26b — đã kiểm ở bộ P26b
    ghi('HOC-2b', t[0], [(f, a, 1) for f, a, b in t[2]], t[3], regex=False, chen=' '.join(b for f, a, b in t[2]))
for bo, cat in (('LUOI-1', '\ndef dung_ban_sao('), ('TACH-GL', '\ndef dung_ban_sao('), ('TU-CHAY-5', '\ndef dung_ban_sao(')):
    for t in nap(bo, cat):
        ds = [(d[0], d[1], d[3]) for d in t[2]]
        if bo == 'LUOI-1' and t[1].startswith('goc'): ds = []   # đột biến trên GỐC 9521cec (git archive) — neo theo gốc, không theo HEAD
        ghi(bo, t[0], ds, t[3], chen=' '.join(str(d[2]) for d in t[2]))
m2 = nap('AUDIT-2')   # bọc khung AUDIT-1: dọn thư mục tạm khung tạo lúc nạp
shutil.rmtree(m2.K.GOC_TAM, ignore_errors=True)
for t in m2.K.DOT_BIEN:
    ghi('AUDIT-2', t[0], tep_ds(t[3]), [t[4]] if t[1] in ('B3', 'A3B', 'A3P') else [], chen=' '.join(str(d[2]) for d in t[3]))
bb = nap('AUDIT-2', tep='dot_bien_bb.py')
s_bb, db_bb, _ = bb.sinh()
for d in db_bb:
    kq.setdefault('AUDIT-2 bb', []).append((d['ten'], [] if s_bb[d['a']:d['b']] == d['cu'] else [f'neo tại bat_bien.js:{d["dong"]} lệch']))
for d in bb.D2:
    ghi('AUDIT-2 bb', d['ten'], [(bb.BB, d['cu'], 1)])

# neo của viec/*/do_*.js: mọi `s.split(X).length !== 2` — X là hằng chuỗi (hoặc phần tử đầu của cặp [neo, chèn]) trên chay.js
for p in sorted(glob.glob(os.path.join(GOC, 'viec', '*', 'do_*.js'))):
    src, ten = open(p, encoding='utf-8').read(), os.path.relpath(p, GOC)
    mang = re.findall(r'(?:const neo = |of )(\[\s*\[[\s\S]*?\]\s*\])(?=\)? ?[;{\n])', src) + re.findall(r'const (?:neo|a3) = (\'(?:[^\'\\]|\\.)*\')', src)
    if not mang: kq.setdefault('do_*.js', []).append((ten + ' (không có bảng neo)', [])); continue
    gt = json.loads(subprocess.run(['node', '-e', 'console.log(JSON.stringify([' + ','.join(mang) + ']))'], capture_output=True, text=True,
                                   check=True).stdout)
    for x in gt:
        for cu in ([c[0] for c in x] if isinstance(x, list) else [x]):
            ghi('do_*.js', f'{ten}: {cu.strip()[:40]}', [('cong_cu/gia_lap/chay.js', cu, 1)])

hong = 0
for bo, ds in kq.items():
    h = [(t, l) for t, l in ds if l]
    co_y = [(t, l) for t, l in h if (bo, t) in RUA_CO_Y]
    hong += len(h) - len(co_y)
    print(f'{bo}: {len(ds)} đột biến · neo khớp {len(ds) - len(h)} · HỎNG {len(h) - len(co_y)} · rữa cố ý {len(co_y)}')
    if bo == 'do_*.js': print('  ' + ' · '.join(t for t, _ in ds))
    for t, l in h: print(f'  {"rữa cố ý" if (bo, t) in RUA_CO_Y else "HỎNG"} {t}: {"; ".join(l)}' + (f' — {RUA_CO_Y[(bo, t)]}' if (bo, t) in RUA_CO_Y else ''))
print(f'\nMẫu nghi rữa (xem tay, không đếm HỎNG): {len(rua)}')
for x in rua: print('  ' + x)
sys.exit(1 if hong else 0)
