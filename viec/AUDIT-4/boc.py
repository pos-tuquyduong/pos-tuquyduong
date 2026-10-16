#!/usr/bin/env python3
"""AUDIT-4 A1 — lớp bọc ĐỐI CHỨNG (chép viec/AUDIT-3/boc.py, vá AU3-22…24; KHÔNG sửa file bộ cũ). Chạy ở GỐC kho:

    python3 viec/AUDIT-4/boc.py <P26b|P26c|GOI-1|GOI-2> [tên…] [-j N]   # bộ khuôn GOI-1: đối chứng đếm số, sập = HỎNG-sập
    python3 viec/AUDIT-4/boc.py --sap            # mỗi bộ các dạng sập (nạp / ném / sập mã 0 / đỏ-rồi-sập, + DOSAP-KIEM cách `kiem`) → không bộ nào BẮT/SỐNG
    python3 viec/AUDIT-4/boc.py --tu-thu         # ca đỏ AU3-22 / 23 / 24 + K5 `HET`: luật CŨ (viec/AUDIT-3/boc.py, chỉ đọc) và MỚI chấm CÙNG đầu vào
    python3 viec/AUDIT-4/boc.py --khung <nhóm|tên…> · --c2luoi [tên…] · --audit2 <nhóm|tên…>   # khung AUDIT-1 / AUDIT-2 ĐÃ BỌC
    python3 viec/AUDIT-4/boc.py --bb [--chi <tiền tố>…] · --luoi1 [tên…] · --tachgl [tên…]          # bb / LUOI-1 / TACH-GL ĐÃ BỌC

Chấm (luật sập (a), chủ quán chốt 16.10): HỎNG = neo không áp được · HỎNG-sập = `sap_cua` (dấu sập trong đầu ra ĐỦ, trừ dấu nằm trong CHI TIẾT một
dòng ca · dòng gộp kiem_tra chỉ còn 'thoát mã N' · không dòng "chạy hết") · BẮT = bộ báo đạt và không sập · LẠC = thoát ≠ 0 không mẫu · SỐNG = thoát 0 · TREO = quá giờ. Cuối: git status không đổi
(ngoài viec/AUDIT-4/), không thì thoát 3. SO-LUONG-1 / BAN-HANG-1 / P20b chạy qua `viec/AUDIT-4/dot_bien.py --bo` (đối chứng + cùng luật sập).
"""
import atexit, contextlib, importlib.util, io, os, re, shutil, signal, subprocess, sys, tempfile, threading, types
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True   # nạp viec/AUDIT-3/boc.py, bộ cũ: không đẻ __pycache__ trong thư mục Cấm

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VIEC = os.path.join(GOC, 'viec')
SAP = re.compile(r'Bài thử sập|bài thử sập|Giả lập: SẬP|SẬP giữa kịch bản|Node\.js v\d|\bbai[A-Z]\w* sập: ')   # thu_*.js · chay.js nạp/dựng · kịch bản ném ·
# node văng thô · một KHỐI của thu_cong / thu_cong_cu ném (`${bai.name} sập: `, thu_cong.js:721, thu_cong_cu.js:510 — soát vòng 2)
# Dòng "chạy HẾT" (xanh hay đỏ). AU3-24: dòng tổng chay.js neo NGUYÊN dòng (chay.js:136–138, :298–300) — `· ĐẠT` trơn khớp cả TÊN ca T0 / T9c
# của thu_gia_lap.js:300, :320 nên thu_gia_lap thoát 0 không dòng tổng vẫn "chạy hết" (soát vòng 4 AUDIT-3). Có `KHÔNG ĐẠT (n lệch)` (soát kế hoạch).
HET = re.compile(r'\d+ đạt · \d+ hỏng|^\s*(?:Giả lập: \d+ kịch bản|Lượt \d+: KB[^\n]*) · \d+ bất biến · (?:ĐẠT|KHÔNG ĐẠT \(\d+ lệch\))\s*$'
                 r'|Qua hết|CÓ LỖI|PASS \d+|✓ XANH|ĐỎ — \d+ chỗ hỏng', re.M)
TAM = tempfile.mkdtemp(prefix='audit4_boc_')
atexit.register(shutil.rmtree, TAM, True)   # TMPDIR cho mọi bài con: bài chết giữa chừng không dọn thư mục tạm của nó → vẫn nằm trong TAM
DOI_CHUNG = {'cong_cu/thu_P26c.js': 118, 'cong_cu/thu_GOI1.js': 105, 'cong_cu/thu_P26b.js': 66, 'cong_cu/thu_gia_lap.js': 145}
O, CH = 'routes/orders.js', 'cong_cu/gia_lap/chay.js'
KHUON = ('P26b', 'P26c', 'GOI-1', 'GOI-2')
SAP_KHUON = [(O, '// 1. Tạo đơn hàng', '}}}{{{', 1)]   # orders.js hỏng cú pháp → máy chủ không nạp → bài thử sập
SAI_KHUON = [(O, 'CHUOI_KHONG_CO_TRONG_FILE_AUDIT4', 'x', 1)]
NEM_KHUON = [(O, 'subtotal += pkg.price * pkgQty;', 'throw new Error("AUDIT-4 ném giữa ca");', 1)]   # AU3-23: thu_* → `✖ Bài thử sập … HTTP 500` thoát 2; chay.js → 'SẬP giữa kịch bản'
DOSAP_KHUON = [(O, 'const meTra = order.parent_phone ? Number(order.parent_balance_amount || 0) : 0;', 'const meTra = 0;', 1)]   # thu_P26b: ✗ M2/M3 rồi sập (AU3-6)
SAP0_KHUON = [(O, '// 1. Tạo đơn hàng', 'process.exit(0);', 1)]   # máy chủ chạy TRONG tiến trình bài thử → bài thoát 0 không dòng tổng
XAU = ('SAP-', 'SAI-', 'NEM-', 'DOSAP-', 'SAP0-', 'VS-Q9')   # AU3-23: NEM- cũng phải HỎNG-sập (AUDIT-3 loại NEM- khỏi danh sách — :172)


class Vo:   # vỏ thay `subprocess` trong không gian tên của bộ: chạy thật, giữ kết quả theo luồng; thứ khác chuyển thẳng `subprocess`
  def __init__(self): self.tl = threading.local()
  def __getattr__(self, ten): return getattr(subprocess, ten)
  def run(self, *a, **k):
    k.setdefault('env', {**os.environ, 'TMPDIR': TAM})
    r = subprocess.run(*a, **k); self.tl.r = r; return r


def nap_khuon(bo):
  p = os.path.join(VIEC, bo, 'dot_bien.py')
  src = open(p, encoding='utf-8').read()
  ns = {'__file__': p, '__name__': f'boc_{bo}'}
  exec(compile(src[:src.index('\nif __name__')], p, 'exec'), ns)
  ns['subprocess'] = vo = Vo()
  return ns, vo


def ra_cua(r): return re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


GOP = re.compile(r'^.*?bài chạy thật \S+ xanh \([^)]*\)\s*→\s*')   # đầu dòng gộp của kiem_tra (kiem_tra_truoc_khi_giao.js:483–486)


def doan(l):   # dòng → các DÒNG GỐC của bài: dòng gộp kiem_tra bỏ đầu '… bài chạy thật <bài> xanh (… s)  → ' rồi tách ' | ' (soát vòng 1 + 2)
  return GOP.sub('', l).split(' | ') if GOP.match(l) else [l]


def chi_tiet(d, m):   # dấu sập nằm trong CHI TIẾT của một dòng ca ('✓/✗ <tên>  — <chi tiết>', thu_*.js k() / thu_cong chac()) = đầu ra của HỆ ĐANG
  return re.match(r'\s*[✓✗] ', d) and ' — ' in d[:m.start()]   # KIỂM nhúng vào (thu_gia_lap T3…T10, E1, "máy chủ hỏng" — moTa) — không phải bài sập


def co_sap(ra):   # dấu sập theo DÒNG GỐC (soát vòng 1–3). AU3-22: '✗ bài chạy thật …' báo bài con sập = HỎNG-sập (luật (a))
  for l in ra.splitlines():
    ds = doan(l)
    if GOP.match(l) and any(re.fullmatch(r'thoát mã (?:\d+|null)', d.strip()) or 'ETIMEDOUT' in d for d in ds):
      return l.strip()[:160]   # bài con sập KHÔNG in ✗/✖ nào: kiem_tra chỉ giữ 'thoát mã N' / lỗi hết giờ (kiem_tra_truoc_khi_giao.js:483–486)
    for d in ds:
      m = SAP.search(d)
      if m and not chi_tiet(d, m): return l.strip()[:160]
  return ''


def sap_cua(ma, ra):   # MỘT luật sập (dot_bien.py nạp hàm này): (1) dấu sập trong đầu ra ĐỦ; (2) không dòng "chạy hết".
  # Bỏ vế (4) "dòng khớp mang dấu sập" (thừa — cột "cách vá" AU3-22, soát vòng 1) và vế "thoát 2" (soát vòng 3: mọi đường thoát 2 thật — chay.js,
  # thu_* — đều in dấu sập; gỡ vế đó 0/21 dạng dòng thật đổi nhãn, không ca nào phân biệt được)
  return co_sap(ra) or (not HET.search(ra) and f'thoát {ma} KHÔNG có dòng chạy hết') or ''


def cham(ns, vo, db):
  vo.tl.r = None
  try: ten, dat, chi = ns['chay1'](db)
  except Exception as e: return db[0], 'HỎNG', f'bọc: chay1 ném {e}'
  r = vo.tl.r
  if r is None: return ten, 'HỎNG', chi   # ap của bộ từ chối (neo không khớp / đích ngoài tạm) — bài chưa chạy
  ra = ra_cua(r)
  d = sap_cua(r.returncode, ra)
  if d: return ten, 'HỎNG-sập', d[:160] + f' · thoát {r.returncode} · dòng cuối: ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:80]
  return ten, ('BẮT' if dat else 'LẠC' if r.returncode != 0 else 'SỐNG'), chi


def doi_chung(ns, vo, cach):
  ten, kq, chi = cham(ns, vo, (f'sạch:{cach}', cach, [], r'$^'))
  r, ra = vo.tl.r, ra_cua(vo.tl.r) if vo.tl.r else ''
  tong = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
  bai = next((a for a in (r.args if r else []) if str(a).startswith('cong_cu/') or str(a).endswith('chay.js')), '?')
  bai = os.path.relpath(bai, GOC) if os.path.isabs(str(bai)) else str(bai)
  if tong: ok = int(tong.group(2)) == 0 and (bai not in DOI_CHUNG or int(tong.group(1)) == DOI_CHUNG[bai]); mo = tong.group(0)
  else: ok = bool(re.search(r'^\s*(?:Giả lập: \d+ kịch bản|Lượt \d+: KB[^\n]*) · \d+ bất biến · ĐẠT\s*$', ra, re.M)); mo = (ra.strip().splitlines() or ['(không in gì)'])[-1][:120]
  ok = ok and kq == 'SỐNG'
  print(('  ✓ ' if ok else '  ✗ ') + f'đối chứng {cach} ({bai}): {mo}' + ('' if ok else f' — {kq} · {chi}'))
  return ok


def anh_kho():
  st = subprocess.run(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=GOC, capture_output=True, text=True).stdout
  return '\n'.join(l for l in st.splitlines() if not l[3:].startswith('viec/AUDIT-4/'))


def chay_khuon(bo, ten_chon, j, them=()):
  ns, vo = nap_khuon(bo)
  ds = [d for d in ns['DOT_BIEN'] if not ten_chon or d[0] in ten_chon] + list(them)
  if not ds: print('không có đột biến nào khớp', ten_chon); return 2, []
  print(f'AUDIT-4 bọc {bo}: {len(ds)} đột biến · -j {j} · đối chứng {sorted({d[1] for d in ds})}', flush=True)
  if not all([doi_chung(ns, vo, c) for c in sorted({d[1] for d in ds})]):
    print('  DỪNG — đối chứng đỏ hoặc lệch số đo, không chấm gì'); return 4, []
  with ThreadPoolExecutor(max_workers=j) as ex: kq = list(ex.map(lambda d: cham(ns, vo, d), ds))
  for ten, k, chi in kq: print(f'{k:9} {ten}  · {chi[:200]}', flush=True)
  dem = {x: sum(k == x for _, k, _ in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'HỎNG-sập', 'LẠC')}
  print(f'\n  {bo}: tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()))
  return 0, kq


def nap_module(bo, tep='dot_bien.py'):
  sp = importlib.util.spec_from_file_location(f'boc4_{bo}_{tep}'.replace('-', '_').replace('.', '_'), os.path.join(VIEC, bo, tep))
  m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m


def nap_luoi1():   # kho nông không có 9521cec: KB10_GOC = '' (chỉ GOC-* cần, không chạy) — không sửa file LUOI-1
  p = os.path.join(VIEC, 'LUOI-1', 'dot_bien.py')
  src = open(p, encoding='utf-8').read()
  if subprocess.run(['git', 'cat-file', '-e', '9521cec'], cwd=GOC, capture_output=True).returncode != 0:
    src = re.sub(r'^KB10_GOC = .*$', "KB10_GOC = ''   # boc.py: kho nông, không có 9521cec", src, count=1, flags=re.M)
    print('(LUOI-1: kho nông — KB10_GOC rỗng trong bộ nhớ, 2 GOC-* không chạy = CHƯA KIỂM)')
  ns = {'__file__': p, '__name__': 'boc_luoi1'}
  exec(compile(src, p, 'exec'), ns); return ns


def goi_main(ham, argv):   # gọi main() của bộ với argv riêng, in nguyên đầu ra, trả (mã, đầu ra)
  cu, sys.argv = sys.argv, ['dot_bien.py', *argv]
  buf = io.StringIO()
  try:
    with contextlib.redirect_stdout(buf): ma = ham()
  finally: sys.argv = cu
  print(buf.getvalue(), end='', flush=True); return ma, buf.getvalue()


def boc_lenh(M, noi=lambda ra: ra):   # khung AUDIT-1 (K) và bb: cả hai chỉ giữ dòng khớp ĐẦU nên đỏ-rồi-sập / sập mã 0 vô hình — bọc `chay_lenh`
  tl, cl, ch = threading.local(), M.chay_lenh, M.cham   # (đọc đầu ra + mã thoát MỖI lệnh con) rồi chấm lại `cham`. bb trả list dòng → `noi`
  def chay_lenh(*a, **k):
    r = cl(*a, **k)
    if r[0] is None: tl.treo = True
    else:
      dau = sap_cua(r[0], noi(r[1]))
      if dau: tl.sap = getattr(tl, 'sap', '') + f' [{" ".join(a[0][1:3])}: {dau}]'
    return r
  def cham(*a, **k):
    tl.sap, tl.treo = '', False
    r = ch(*a, **k)
    if r['kq'] in ('BẮT', 'SỐNG', 'LẠC') and tl.sap:
      r['kq'] = 'HỎNG-sập'; r['chi'] = 'sập' + tl.sap[:200] + ' | ' + r['chi'][:160]
    elif r['kq'] == 'LẠC' and tl.treo: r['kq'] = 'TREO'   # bb: quá giờ ghi LẠC — là TREO (soát kế hoạch)
    return r
  M.chay_lenh, M.cham = chay_lenh, cham


def boc_dict(ns):   # LUOI-1 / TACH-GL: `cham` (dict) gọi subprocess.run một lần cho bài → Vo giữ đầu ra, chấm lại bằng sap_cua
  vo, ch = Vo(), ns['cham']
  ns['subprocess'] = vo
  def cham(db):
    vo.tl.r = None
    r = ch(db)
    x = vo.tl.r
    if x is not None and r['kq'] in ('BẮT', 'SỐNG', 'LẠC'):
      d = sap_cua(x.returncode, ra_cua(x))
      if d: r['kq'], r['chi'] = 'HỎNG-sập', f'sập [{d[:140]}] | ' + r['chi'][:160]
    return r
  ns['cham'] = cham
  return ns


def nap_m2():
  m2 = nap_module('AUDIT-2')
  boc_lenh(m2.K)
  cu = m2.K.anh_kho
  m2.K.anh_kho = lambda: '\n'.join(l for l in cu().split('\n') if not l[3:].startswith('viec/AUDIT-4/'))
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, m2.K.don)
  return m2


def gom_xau(bo, kq):   # AU3-23: mọi đột biến cố ý sập / sai chuỗi ra BẮT hay SỐNG = bộ nói dối
  return [(bo, t, k) for t, k, _ in kq if k in ('BẮT', 'SỐNG') and t.startswith(XAU)]


def sap():
  xau = []
  for bo in KHUON:
    them = [(f'SAP-{bo}', 'thu', SAP_KHUON, r'✗ '), (f'SAI-{bo}', 'thu', SAI_KHUON, r'✗ '), (f'NEM-{bo}', 'thu', NEM_KHUON, r'✗ '), (f'SAP0-{bo}', 'thu', SAP0_KHUON, r'✗ ')]
    if bo == 'P26b': them.append(('DOSAP-P26b', 'thu', DOSAP_KHUON, r'✗ M2 '))
    _, kq = chay_khuon(bo, ['VS-Q9-hoan-me-ngoai-tx'] if bo == 'P26c' else ['__khong_co__'], 2, them=them)   # P26c: đỏ-rồi-sập có sẵn
    xau += gom_xau(bo, kq)
  m2 = nap_m2()
  sv = lambda cap: [('server/' + d[0], d[1], d[2], d[3]) for d in cap]
  m2.K.DOT_BIEN += [('SAP-AUDIT2', 'D2K', 'c2luoi', sv(SAP_KHUON), r'✗ '),
                    ('NEM-AUDIT2', 'D2K', 'gl', sv(NEM_KHUON), r'✗ '),           # kịch bản ném → khung ghi BẮT 'SẬP giữa kịch bản'
                    ('DOSAP-AUDIT2', 'D2K', 'p26b', sv(DOSAP_KHUON), r'✗ '),     # ✗ M2 rồi thu_P26b sập: khung ghi BẮT (dòng đầu)
                    ('SAP0-AUDIT2', 'D2K', 'p26b', sv(SAP0_KHUON), r'✗ '),       # thoát 0 không dòng tổng: khung ghi SỐNG
                    ('!DOSAP-KIEM', 'D2K', 'kiem', sv(DOSAP_KHUON), r'✗ ')]      # AU3-22: kiem_tra chạy hết, báo thu_P26b sập ở dòng ✗ ('!' = bài chạy thật thật)
  ten = ['SAP-AUDIT2', 'NEM-AUDIT2', 'DOSAP-AUDIT2', 'SAP0-AUDIT2', '!DOSAP-KIEM']
  ma, ra = goi_main(m2.K.main, ten + ['-j', '2'])
  if ma: xau.append(('khung AUDIT-1', f'thoát {ma}', 'KHO BẨN / dừng'))
  for l in ra.splitlines():
    m = re.match(r'(BẮT|SỐNG)\s+D2K (' + '|'.join(map(re.escape, ten)) + r')\b', l)
    if m: xau.append(('AUDIT-2', m.group(2), m.group(1)))
  for bo, ns, cach in (('LUOI-1', boc_dict(nap_luoi1()), 'kb1'), ('TACH-GL', boc_dict(vars(nap_module('TACH-GL'))), 'gl29')):
    ns['DOT_BIEN'].append((f'SAP-{bo}', cach, [(CH, 'const sxGia = { loi: false,', '}}}{{{', 1)], [r'KB\d+ → '], 'LẠC'))
    _, ra = goi_main(ns['main'], [f'SAP-{bo}', '-j', '1'])
    xau += [(bo, f'SAP-{bo}', m.group(1)) for m in re.finditer(r'^[✓✗] (BẮT|SỐNG)\b', ra, re.M)]
  print(f'\n  --sap: {len(xau)} bộ báo BẮT / SỐNG khi bài thử sập ' + ('— ĐẠT (không bộ nào)' if not xau else '— KHÔNG ĐẠT: ' + ', '.join(f'{b} {t} {k}' for b, t, k in xau)))
  return 1 if xau else 0


def ban_sao_sc(doi=()):   # chép THẬT server/ + cong_cu/ vào TAM (khuôn viec/P20b/dot_bien.py:24–29), áp đổi — cho --tu-thu
  k = tempfile.mkdtemp(prefix='kho_', dir=TAM)
  for x in ('server', 'cong_cu'): shutil.copytree(os.path.join(GOC, x), os.path.join(k, x), symlinks=True)
  os.makedirs(os.path.join(k, 'tu_chay')); shutil.copyfile(os.path.join(GOC, 'tu_chay', 'cau_hinh.json'), os.path.join(k, 'tu_chay', 'cau_hinh.json'))   # chay.js đọc ten_mien_production
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))
  for f, cu, moi in doi:
    p = os.path.join(k, f); s = open(p, encoding='utf-8').read()
    if s.count(cu) != 1 or not os.path.realpath(p).startswith(os.path.realpath(TAM) + os.sep): raise SystemExit(f'{f}: neo / đích sai — DỪNG')
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return k


def chay(argv, cwd):
  r = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=900, env={**os.environ, 'TMPDIR': TAM})
  return r.returncode, ra_cua(r)


def tu_thu():   # ca đỏ A1: luật CŨ (viec/AUDIT-3/boc.py) và MỚI chấm CÙNG đầu vào thật. Cũ sai + mới đúng = ĐẠT; mới sai → thoát 1
  A3 = nap_module('AUDIT-3', 'boc.py')
  phep = []
  def ghi(ten, cu, moi, mong):
    phep.append(moi == mong)
    print(f"  {'ĐẠT' if moi == mong else 'ĐỎ '} {ten}: cũ → {cu} · mới → {moi} (mong {mong})", flush=True)
  # AU3-24 (a): thu_gia_lap thoát 0 KHÔNG dòng tổng — đầu ra thật, cắt dòng tổng
  ma, ra = chay(['node', 'cong_cu/thu_gia_lap.js'], GOC)
  tong = [l for l in ra.splitlines() if re.search(r'^\s*\d+ đạt · \d+ hỏng\s*$', l)]
  cat = '\n'.join(l for l in ra.splitlines() if l not in tong)
  print(f'  (thu_gia_lap thật: thoát {ma} · {tong[-1].strip() if tong else "không dòng tổng"} · cắt {len(tong)} dòng · còn T0: {"✓ T0" in cat})')
  la = lambda d: 'sập' if d else 'không sập'
  ghi('AU3-24 thu_gia_lap thoát 0 không dòng tổng', la(A3.sap_cua(0, cat)), la(sap_cua(0, cat)), 'sập')
  # AU3-24 (b) K5: chay.js đỏ ĐÚNG ca (`KHÔNG ĐẠT (n lệch)`, thoát 1) là "chạy hết" — đột biến TACH-GL `BV-SRV-ban-bo-ap-tran`
  k = ban_sao_sc([('server/routes/orders.js', 'codeRecord?.max_discount > 0 &&', 'false &&')])
  ma, ra = chay(['node', CH, '--den-kb', '29'], k)
  print(f'  (chay.js KB29 có đột biến: thoát {ma} · {(ra.strip().splitlines() or [""])[-1][:100]})')
  ghi('K5 HET: chay.js KHÔNG ĐẠT (n lệch) thoát 1', la(A3.sap_cua(ma, ra)), la(sap_cua(ma, ra)), 'không sập')
  # AU3-22: DOSAP_KHUON qua khung cách `kiem` ('!' = giữ bài chạy thật — AUDIT-1 :257) — chạy K.cham THẬT, một lần bọc CŨ (A3.boc_khung), một lần MỚI
  db = ('!DOSAP-KIEM', 'D2K', 'kiem', [('server/' + d[0], d[1], d[2], d[3]) for d in DOSAP_KHUON], r'✗ ')
  cu, moi = nap_module('AUDIT-2'), nap_module('AUDIT-2')
  A3.boc_khung(cu)
  ghiLai = {}
  cl = moi.K.chay_lenh
  moi.K.chay_lenh = lambda *a, **k: ghiLai.setdefault('r', cl(*a, **k))   # giữ (mã, đầu ra) THẬT của kiem_tra cho ca dòng gộp dưới
  boc_lenh(moi.K)
  rc, rm = cu.K.cham(db), moi.K.cham(db)
  for m in (cu, moi): shutil.rmtree(m.K.GOC_TAM, ignore_errors=True)
  print(f"  (DOSAP-KIEM khung: cũ {rc['kq']} · mới {rm['kq']} · {rm['chi'][:150]})")
  ghi('AU3-22 DOSAP-KIEM qua khung cách kiem (K.cham thật)', rc['kq'], rm['kq'], 'HỎNG-sập')
  # Soát vòng 1: dòng gộp của kiem_tra có ca T của thu_P26c (✗ T1a …) + ✖ Bài thử sập — cùng đầu ra thật, đổi mã ca M2 → T1a
  ma, ra = ghiLai['r'][0], ghiLai['r'][1].replace('✗ M2 ', '✗ T1a ')
  print(f"  (dòng gộp T1a: {next((l.strip()[:150] for l in ra.splitlines() if '✗ T1a' in l and 'bài chạy thật' in l), 'KHÔNG thấy')})")
  ghi('vòng 1: dòng gộp kiem_tra ✗ T1a … | ✖ Bài thử sập', la(A3.sap_cua(ma, ra)), la(sap_cua(ma, ra)), 'sập')
  # Soát vòng 2 (a) K5 ngoại lệ chi tiết: thu_gia_lap ĐỎ THẬT ở ca T (đột biến TACH-GL `BV-cha-khong-dung-con-SIGTERM`) — dòng ✗ T3 mang 'Giả lập: SẬP' phải KHÔNG sập;
  # gỡ ngoại lệ (đột biến của chính luật) phải ra sập → vế trừ có ca đỏ
  tg = nap_module('TACH-GL')
  dbt = next(d for d in tg.DOT_BIEN if d[0] == 'BV-cha-khong-dung-con-SIGTERM')
  tam = tempfile.mkdtemp(prefix='tg_', dir=TAM)
  k = tg.dung_ban_sao(tam)
  print(f"  (TACH-GL bản sao: áp {tg.ap(k, dbt[2], tam) or 'được'})")
  ma, ra = chay(tg.LENH['thugl'][0], k)
  t3 = next((l.strip() for l in ra.splitlines() if re.match(r'\s*✗ T\d', l) and SAP.search(l)), 'KHÔNG thấy dòng ✗ T… mang dấu sập')
  print(f'  (thu_gia_lap đột biến: thoát {ma} · {t3[:150]})')
  go = any(SAP.search(d) for l in ra.splitlines() for d in doan(l))   # = co_sap khi gỡ ngoại lệ `chi_tiet` (đột biến của luật)
  ghi('vòng 2: thu_gia_lap đỏ thật ✗ T3 … Giả lập: SẬP (gỡ ngoại lệ → ' + la(go) + ')', la(A3.sap_cua(ma, ra)), la(sap_cua(ma, ra)) if go else 'gỡ ngoại lệ vẫn không sập', 'không sập')
  # (b) cùng đầu ra đó đi qua kiem_tra --day-du (:829): dòng gộp '✗ bài chạy thật cong_cu/thu_gia_lap.js xanh (…)  → <✗/✖ nối ' | '>' (:483–486)
  hong = [l.strip() for l in ra.splitlines() if re.search('[✗✖]', l)]
  gop = f"  ✗ bài chạy thật cong_cu/thu_gia_lap.js xanh (50.0 s)  → {' | '.join(hong)}\n  ✗ CÓ LỖI — sửa xong rồi commit.\n"
  ghi('vòng 2: dòng gộp --day-du của thu_gia_lap ✗ T3 (đỏ thật)', la(A3.sap_cua(1, gop)), la(sap_cua(1, gop)), 'không sập')
  # (c) một KHỐI của thu_cong_cu ném → '✗ baiT2 sập: …' (thu_cong_cu.js:510): bản sao chép thật của TU-CHAY-6 (`ban_sao`), chèn throw đầu baiT2
  t6 = nap_module('TU-CHAY-6')
  b = t6.ban_sao()
  try:
    f = os.path.join(b, 'tu_chay', 'thu_cong_cu.js')
    src = open(f, encoding='utf-8').read()
    if src.count('function baiT2() {') != 1: raise SystemExit('thu_cong_cu.js: neo baiT2 sai — DỪNG')
    open(f, 'w', encoding='utf-8').write(src.replace('function baiT2() {', 'function baiT2() { throw new Error("AUDIT-4 khối sập");'))
    ma, ra = chay(['node', f], GOC)
  finally:
    shutil.rmtree(b, ignore_errors=True)
  print(f"  (thu_cong_cu khối ném: thoát {ma} · {next((l.strip()[:120] for l in ra.splitlines() if 'baiT2 sập' in l), 'KHÔNG thấy baiT2 sập')} · {(ra.strip().splitlines() or [''])[-1][:80]})")
  ghi('vòng 2: khối thu_cong_cu ném (✗ baiT2 sập: …)', la(A3.sap_cua(ma, ra)), la(sap_cua(ma, ra)), 'sập')
  # Soát vòng 3 (a): bài con sập KHÔNG in ✗ / ✖ (chay.js `--may-chu` rỗng — đầu ra THẬT, thoát 2) đi qua kiem_tra: dòng gộp chỉ còn 'thoát mã 2' (:486)
  ma, ra = chay(['node', CH, '--may-chu', ''], GOC)
  hong = [l.strip() for l in ra.splitlines() if re.search('[✗✖]', l)]
  gop = f"  ✗ bài chạy thật {CH} xanh (0.5 s)  → {' | '.join(hong) or f'thoát mã {ma}'}\n  ✗ CÓ LỖI — sửa xong rồi commit.\n"
  print(f"  (chay.js --may-chu rỗng: thoát {ma} · {(ra.strip().splitlines() or [''])[-1][:100]} · dòng gộp: {gop.splitlines()[0].strip()[:120]})")
  ghi('vòng 3: dòng gộp kiem_tra, bài con sập không dòng ✗ (→ thoát mã N)', la(A3.sap_cua(1, gop)), la(sap_cua(1, gop)), 'sập')
  # (b) ngoại lệ theo NỘI DUNG, không theo tên ca T: ca thu_gia_lap "máy chủ hỏng" (thu_gia_lap.js:360, moTa — dựng theo định dạng k() :49)
  ca = "  ✗ máy chủ hỏng → chay.js thoát 2, dòng SẬP  — thoát 1 · Giả lập: SẬP — /tmp/x/server/routes/orders.js:1\n  144 đạt · 1 hỏng\n"
  ghi('vòng 3: ca không tiền tố T nhúng "Giả lập: SẬP" trong chi tiết (dựng theo :49, :360)', la(A3.sap_cua(1, ca)), la(sap_cua(1, ca)), 'không sập')
  # AU3-23: sap() của CẢ HAI bản với cùng bộ giả — chay_khuon trả NEM- ra BẮT, mọi bộ khác rỗng
  gia = dict(chay_khuon=lambda bo, *a, **k: (0, [(f'NEM-{bo}', 'BẮT', '')]),
             nap_m2=lambda: types.SimpleNamespace(K=types.SimpleNamespace(DOT_BIEN=[], main=lambda: 0)), goi_main=lambda *a: (0, ''),
             nap_luoi1=lambda: {'DOT_BIEN': [], 'main': lambda: 0}, boc_dict=lambda ns: ns,
             nap_module=lambda *a, **k: types.SimpleNamespace(DOT_BIEN=[], main=lambda: 0, chay1=lambda db: (db[0], False, '')))
  def chay_sap(g):
    cu = {x: g.get(x) for x in gia}
    g.update(gia)
    try:
      with contextlib.redirect_stdout(io.StringIO()): return g['sap']()
    finally: g.update({x: v for x, v in cu.items() if v is not None})
  ghi('AU3-23 NEM- ra BẮT → --sap phải KHÔNG ĐẠT', 'ĐẠT' if chay_sap(vars(A3)) == 0 else 'KHÔNG ĐẠT',
      'ĐẠT' if chay_sap(globals()) == 0 else 'KHÔNG ĐẠT', 'KHÔNG ĐẠT')
  print(f'\n  --tu-thu: {sum(phep)}/{len(phep)} phép luật mới đúng')
  return 0 if all(phep) else 1



def main():
  a = sys.argv[1:]
  j = 4
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  if not a: print(__doc__); return 2
  truoc = anh_kho()
  if a[0] == '--sap': ma = sap()
  elif a[0] == '--tu-thu': ma = tu_thu()
  elif a[0] in ('--c2luoi', '--khung', '--audit2'):   # bảng AUDIT-1 / AUDIT-2 chạy qua khung ĐÃ BỌC
    m2 = nap_m2()
    if a[0] != '--audit2':
      k1 = nap_module('AUDIT-1'); shutil.rmtree(k1.GOC_TAM, ignore_errors=True)
      if a[0] == '--c2luoi': m2.K.DOT_BIEN = [(n, g, 'c2luoi', d, m) for n, g, c, d, m in k1.DOT_BIEN + m2.K.DOT_BIEN if (g == 'C2F' or (g == 'A3L' and c == 'c2full'))]
      else: m2.K.DOT_BIEN = [d for d in k1.DOT_BIEN if d[1] != 'C2F']
    ma, _ = goi_main(m2.K.main, a[1:] + ['-j', str(j)])
  elif a[0] == '--bb':
    bb = nap_module('AUDIT-2', 'dot_bien_bb.py'); boc_lenh(bb, '\n'.join)
    for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, bb.don)
    ma, _ = goi_main(bb.main, a[1:] + ['-j', str(j)])
  elif a[0] in ('--luoi1', '--tachgl'):
    ns = boc_dict(nap_luoi1() if a[0] == '--luoi1' else vars(nap_module('TACH-GL')))
    ten = [d[0] for d in ns['DOT_BIEN'] if not d[0].startswith('GOC-') and (len(a) == 1 or d[0] in a[1:])]
    ma, _ = goi_main(ns['main'], ten + ['-j', str(j)])
  elif a[0] in KHUON: ma, _ = chay_khuon(a[0], a[1:], j)
  else: print('không hiểu', a[0]); return 2
  if anh_kho() != truoc: print('  ✗ KHO BẨN — git status ngoài viec/AUDIT-4/ đổi'); return 3
  print('  ✓ kho thật không đổi (git status ngoài viec/AUDIT-4/)'); return ma


if __name__ == '__main__':
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, lambda *_: sys.exit(130))
  sys.exit(main())
