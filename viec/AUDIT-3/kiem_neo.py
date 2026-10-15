#!/usr/bin/env python3
# AUDIT-3 A5 — mở rộng viec/AUDIT-2/kiem_neo.py: rà NEO (chuỗi gốc khớp ĐÚNG số lần) và MẪU nhận kết quả của MỌI bộ đột biến
# viec/*/dot_bien*.py + neo của viec/*/do_*.js, KHÔNG chạy lệnh đo nào (vài giây). Thêm so bản AUDIT-2: GOI-1, GOI-2, P26c, SO-LUONG-1,
# TOC-DO-1, AUDIT-3; LUOI-1 nạp được trên kho NÔNG (dòng `git show 9521cec` → '' khi commit vắng — không sửa file LUOI-1); ảnh neo
# dot_bien_bb.py = viec/AUDIT-3/bb_neo.json (chủ quán chốt Câu hỏi 2), in thêm tên mới / tên trôi so ảnh AUDIT-2 (bao_cao.md).
# LUOI-2 không có dot_bien*.py / do_*.js (đột biến LUOI-2 nằm trong AUDIT-2 A3L — đã rà). Chạy: python3 viec/AUDIT-3/kiem_neo.py
#   → thoát 1 nếu còn HỎNG ngoài danh sách RUA_CO_Y (mỗi tên một lý do "đã thay bằng …" / cố ý).
# MẪU: mọi TỪ (≥ 4 chữ cái liền) trong phần chữ cố định của mẫu phải có trong nguồn in ra hoặc chuỗi đột biến chèn vào; thiếu → "mẫu
# nghi rữa" (xem tay, K2), không đếm HỎNG.
import glob, importlib.util, json, os, re, shutil, subprocess, sys
sys.dont_write_bytecode = True

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Rữa CỐ Ý / ĐÃ THAY (tên → lý do). Không có ở đây mà HỎNG = phát hiện.
P26C = 'neo rữa vì P26c viết lại — đã thay bằng P26c `{}` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")'
GOI2 = 'neo rữa vì GOI-2 — đã thay bằng GOI-2 `{}` (viec/GOI-2/trang_thai.md:98–101)'
RUA_CO_Y = {
  ('AUDIT-1', 'G3-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-1 G3)',
  ('AUDIT-1', 'G3-da-biet'): P26C.format('BV-G3-da-biet-thu-no'),
  ('AUDIT-2', 'D2K-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-2 D2)',
  ('AUDIT-2', 'D2K-da-biet'): 'neo câu thu nợ rữa vì P26c C1 (AUDIT-3 phát hiện AU3-2) — cùng neo `BV-G3-da-biet-thu-no`',
  ('AUDIT-2', 'A3L-goi-giao-them-1'): 'phát hiện AU3-3: trừ lượt dời vào giao dịch (P26c A2) — hồ sơ không ghi; cùng ý P26c `BV-A2-bo-tran` / `VS-A2-bo-kiem-changes`',
  ('AUDIT-2', 'A3L-deliver-bo-chan-am'): 'phát hiện AU3-3: PUT /deliver đã bỏ (P26c A4) — hồ sơ không ghi; cùng ý P26c `BV-A4-deliver-song-lai`',
  ('AUDIT-2 bb', 'D2-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-2 D2)',
  ('AUDIT-3', 'D2-AU3-sai-chuoi'): 'công cụ tự chứng minh HỎNG (AUDIT-3 D2)',
  ('HOC-2', 'VS-E3-phien-ban-cu'): 'neo "tu-chay 1.4.0" rữa tất yếu khi lên 1.5.0 (TU-CHAY-5 Phát hiện 6) — đề xuất đổi neo, không sửa HOC-2',
  ('HOC-2b', 'VS-q9-me-lon-hon-bang-0'): P26C.format('VS-q9-me-lon-hon-bang-0'),
  ('HOC-2b', 'BV-q9-bo-hoan-me'): P26C.format('BV-Q9-bo-hoan-me'),
  **{('P26b', t): P26C.format(m) for t, m in [('me-huy-hoan-gap-doi', 'VS-me-hoan-gap-doi-huy'), ('me-xoa-hoan-gap-doi', 'VS-me-hoan-gap-doi-xoa'),
     ('Q9-bo-hoan-me', 'BV-Q9-bo-hoan-me'), ('Q9-hoan-me-vao-vi-con', 'VS-Q9-hoan-me-vao-vi-con'), ('Q9-hoan-me-ngoai-tx', 'VS-Q9-hoan-me-ngoai-tx'),
     ('Q9-hoan-me-khong-qua-cong-don', 'VS-Q9-hoan-me-khong-qua-cong-don'), ('duyet-cong-don-khong-kiem-changes', 'BV-duyet-cong-don-khong-kiem-changes'),
     ('hong-bo-tran', 'BV-hong-bo-tran'), ('hong-bo-tran-cong-don', 'BV-hong-bo-tran-cong-don')]},   # P26c bảng ghi chuyển cả hong-tran-theo-man-hinh, hong-lay-dong-dau nhưng neo vẫn khớp HEAD → không ở đây (A2 chấm)
  **{('P26c', t): GOI2.format(t) for t in ('VS-H2-khong-ghi-hoan-goi', 'VS-H2-hoan-goi-giam-total-spent', 'VS-me-hoan-gap-doi-huy', 'VS-me-hoan-gap-doi-xoa')},
  **{('GOI-1', t): GOI2.format(m) for t, m in [('VS-GOI1-DUNG-QUYEN', 'VS-GOI2-KET-THUC-QUYEN'), ('VS-GOI1-DUNG-DUA', 'BV-GOI2-CONG'),
     ('VS-GOI1-LOC-GOI', 'BV-GOI2-LOC-GOI'), ('BV-GOI1-TIM-TEN', 'BV-GOI2-TIM-TEN'), ('BV-GOI1-DANG-GIAO', 'VS-GOI2-LOC-MAC-DINH'),
     ('VS-GOI1-SAP-CHUA-LAY', 'VS-GOI2-MOC-CHI-NGAY-MUA'), ('BV-GOI1-NUT-LYDO', 'VS-GOI2-HOP-KHONG-LY-DO')]},
  ('GOI-1', 'BV-GOI1-SL-AM'): 'neo gom về soNguyenDuong (SO-LUONG-1, chủ quán chốt Q1 = b) — đã thay bằng `BV-SOLUONG1-MON-THU-GOI1`',
  ('GOI-1', 'VS-GOI1-SL-AM-CHI-0'): 'như trên — đã thay bằng `VS-SOLUONG1-MON-CHI-0-THU-GOI1`',
  **{('TACH-GL', t): P26C.format(t) for t in ('VS-kb-hai-luot', 'VS-luot-trung-thieu', 'BV-cha-kiem-mot-lan')},   # VS-luot-thieu-bat-bien: neo khớp, LẠC là kết quả chạy (A2)
}


def nap(bo, cat=None, ten='DOT_BIEN', tep='dot_bien.py', va=None):
    p = os.path.join(GOC, 'viec', bo, tep)
    if cat is None:   # nạp cả module (không chạy __main__)
        sp = importlib.util.spec_from_file_location(f'kn_{bo}_{tep}'.replace('-', '_').replace('.', '_'), p)
        m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
        return m
    src = open(p, encoding='utf-8').read()
    if va: src = va(src)
    ns = {'__file__': p, '__name__': 'kiem_neo'}
    exec(compile(src[:src.index(cat)], p, 'exec'), ns)
    if 'GOC_TAM' in ns: shutil.rmtree(ns['GOC_TAM'], ignore_errors=True)   # AUDIT-1 tạo thư mục tạm lúc nạp
    return ns[ten]


def va_luoi1(src):   # kho nông (máy mây) không có 9521cec: KB10_GOC chỉ dùng cho 2 GOC-* (neo theo gốc, kiem_neo không rà) → rỗng
    if subprocess.run(['git', 'cat-file', '-e', '9521cec'], cwd=GOC, capture_output=True).returncode == 0: return src
    print('(LUOI-1: kho nông, không có 9521cec — KB10_GOC rỗng trong bộ nhớ; 2 GOC-* không rà như trước)')
    return re.sub(r'^KB10_GOC = .*$', "KB10_GOC = ''", src, count=1, flags=re.M)


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
    kq.setdefault(bo, []).append((ten, loi, bool(ds)))   # ds rỗng = đối chứng / đột biến không neo — không đếm "neo khớp"
    for m in maus:
        thieu = sorted(w for w in tu_mau(m, regex) if w not in TU_NGUON and w not in TU(chen))
        if thieu: rua.append(f'{bo} {ten}: mẫu {m!r} — không thấy trong nguồn: {thieu}')


def tep_ds(t):   # bảng (file, cũ, mới, n[, k]) → (file, cũ, n)
    return [(d[0], d[1], d[3]) for d in t]


# khuôn GOI-1 (GOI-1, GOI-2, P26c, SO-LUONG-1, AUDIT-3): (tên, cách, [(file, cũ, mới, n)], mẫu) — file tính từ thư mục bản sao theo cách
def tien_to(cach): return 'client/' if cach == 'cli' else 'cong_cu/gia_lap/' if cach == 'thugl' else 'server/'


for t in nap('AUDIT-1', '\n# ═══ Bản sao + lệnh'):
    ghi('AUDIT-1', t[0], tep_ds(t[3]), [t[4]] if t[1] not in ('G3', 'C2F') else [], chen=' '.join(str(d[2]) for d in t[3]))
for t in nap('P26b', '\ndef ap('):
    ghi('P26b', t[0], [(('cong_cu/gia_lap/' if d[0] == 'bat_bien.js' else 'server/') + d[0], d[1], d[3]) for d in t[2]], [t[3]],
        chen=' '.join(str(d[2]) for d in t[2]))
for bo in ('P26c', 'GOI-1', 'GOI-2', 'SO-LUONG-1', 'AUDIT-3'):
    for t in nap(bo, '\ndef ap('):
        ghi(bo, t[0], [(tien_to(t[1]) + d[0], d[1], d[3]) for d in t[2]], [t[3]], chen=' '.join(str(d[2]) for d in t[2]))
for t in nap('TOC-DO-1', '\ndef chay_bai('):
    ghi('TOC-DO-1', t[0], [('kiem_tra_truoc_khi_giao.js', d[0], d[2]) for d in t[1]], [t[2]], chen=' '.join(str(d[1]) for d in t[1]))
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
for bo, cat, va in (('LUOI-1', '\ndef dung_ban_sao(', va_luoi1), ('TACH-GL', '\ndef dung_ban_sao(', None), ('TU-CHAY-5', '\ndef dung_ban_sao(', None)):
    for t in nap(bo, cat, va=va):
        ds = [(d[0], d[1], d[3]) for d in t[2]]
        if bo == 'LUOI-1' and t[1].startswith('goc'): ds = []   # đột biến trên GỐC 9521cec (git archive) — neo theo gốc, không theo HEAD
        ghi(bo, t[0], ds, t[3], chen=' '.join(str(d[2]) for d in t[2]))
m2 = nap('AUDIT-2')   # bọc khung AUDIT-1: dọn thư mục tạm khung tạo lúc nạp
shutil.rmtree(m2.K.GOC_TAM, ignore_errors=True)
for t in m2.K.DOT_BIEN:
    ghi('AUDIT-2', t[0], tep_ds(t[3]), [t[4]] if t[1] in ('B3', 'A3B', 'A3P') else [], chen=' '.join(str(d[2]) for d in t[3]))
bb = nap('AUDIT-2', tep='dot_bien_bb.py')
_, db_bb, _ = bb.sinh()
# Tên SINH LẠI phải trỏ đúng vế đã ghi trong ẢNH neo AUDIT-3 (`dot_bien_bb.py --liet-ke --json viec/AUDIT-3/bb_neo.json`, HEAD a13d8ad).
# bat_bien.js đổi thì tên trôi sang vế khác → HỎNG "tên trôi" (sinh lại ảnh CHỈ cùng commit chạy đủ dot_bien_bb.py — AUDIT-2 B4).
anh = json.load(open(os.path.join(GOC, 'viec', 'AUDIT-3', 'bb_neo.json'), encoding='utf-8'))
anh2 = json.load(open(os.path.join(GOC, 'viec', 'AUDIT-2', 'bb_neo.json'), encoding='utf-8'))
moi = {d['ten']: [d['dong'], d['cu']] for d in db_bb}
doi_dong = []   # cùng chuỗi, chỉ dời dòng (code dời) — báo riêng, KHÔNG HỎNG
for t in sorted(set(anh) | set(moi), key=lambda x: (x not in anh, x)):
    a, m = anh.get(t), moi.get(t)
    loi = [] if a and m and a[1] == m[1] else [f'tên trôi: ảnh {a[1][:50] if a else "(không có)"!r} ↔ sinh lại {m[1][:50] if m else "(không có)"!r}']
    if not loi and a[0] != m[0]: doi_dong.append(f'{t} {a[0]}→{m[0]}')
    kq.setdefault('AUDIT-2 bb', []).append((t, loi, True))
if doi_dong: print(f'(AUDIT-2 bb: {len(doi_dong)} tên chỉ dời dòng, cùng vế — không tính HỎNG: {", ".join(doi_dong[:5])}…)')
print(f'(AUDIT-2 bb so ảnh AUDIT-2 ({len(anh2)}) ↔ ảnh AUDIT-3 ({len(anh)}): tên mới {sum(t not in anh2 for t in anh)} · tên mất {sum(t not in anh for t in anh2)}'
      f' · tên trôi khác vế {sorted(t for t in anh if t in anh2 and anh2[t][1] != anh[t][1])})')
for d in bb.D2:
    ghi('AUDIT-2 bb', d['ten'], [(bb.BB, d['cu'], 1)])

# neo của viec/*/do_*.js: mọi `s.split(X).length !== 2` — X là hằng chuỗi (hoặc phần tử đầu của cặp [neo, chèn]) trên chay.js
for p in sorted(glob.glob(os.path.join(GOC, 'viec', '*', 'do_*.js'))):
    src, ten = open(p, encoding='utf-8').read(), os.path.relpath(p, GOC)
    mang = re.findall(r'(?:const neo = |of )(\[\s*\[[\s\S]*?\]\s*\])(?=\)? ?[;{\n])', src) + re.findall(r'const (?:neo|a3) = (\'(?:[^\'\\]|\\.)*\')', src)
    if not mang: print(f'(do_*.js: {ten} không có bảng neo — không tính)'); continue
    gt = json.loads(subprocess.run(['node', '-e', 'console.log(JSON.stringify([' + ','.join(mang) + ']))'], capture_output=True, text=True,
                                   check=True).stdout)
    for x in gt:
        for cu in ([c[0] for c in x] if isinstance(x, list) else [x]):
            ghi('do_*.js', f'{ten}: {cu.strip()[:40]}', [('cong_cu/gia_lap/chay.js', cu, 1)])

hong = 0
for bo, ds in kq.items():
    h = [(t, l) for t, l, _ in ds if l]
    co_y = [(t, l) for t, l in h if (bo, t) in RUA_CO_Y]
    hong += len(h) - len(co_y)
    co_neo = sum(c for _, _, c in ds)
    print(f'{bo}: {len(ds)} đột biến ({len(ds) - co_neo} không neo — đối chứng) · neo khớp {co_neo - len(h)}/{co_neo} · HỎNG {len(h) - len(co_y)} · đã thay / cố ý {len(co_y)}')
    if bo == 'do_*.js': print('  ' + ' · '.join(t for t, _, _ in ds))
    for t, l in h: print(f'  {"đã thay / cố ý" if (bo, t) in RUA_CO_Y else "HỎNG"} {t}: {"; ".join(l)}' + (f' — {RUA_CO_Y[(bo, t)]}' if (bo, t) in RUA_CO_Y else ''))
thua = [k for k in RUA_CO_Y if not any(t == k[1] and l for t, l, _ in kq.get(k[0], []))]
if thua: print(f'\nRUA_CO_Y có {len(thua)} tên KHÔNG còn hỏng (neo lại khớp) → bỏ khỏi danh sách, thoát 1: {thua}')
print(f'\nMẫu nghi rữa (xem tay, không đếm HỎNG): {len(rua)}')
for x in rua: print('  ' + x)
sys.exit(1 if hong or thua else 0)   # tên thừa trong RUA_CO_Y cũng đỏ (soát vòng 1)
