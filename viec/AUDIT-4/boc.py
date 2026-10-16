#!/usr/bin/env python3
"""AUDIT-4 A1 — lớp bọc ĐỐI CHỨNG (chép viec/AUDIT-3/boc.py, vá AU3-22…24; KHÔNG sửa file bộ cũ). Chạy ở GỐC kho:

    python3 viec/AUDIT-4/boc.py <P26b|P26c|GOI-1|GOI-2> [tên…] [-j N]   # bộ khuôn GOI-1: đối chứng đếm số, sập = HỎNG-sập
    python3 viec/AUDIT-4/boc.py --sap            # mỗi bộ các dạng sập (nạp / ném / sập mã 0 / đỏ-rồi-sập, + DOSAP-KIEM cách `kiem`) → không bộ nào BẮT/SỐNG
    python3 viec/AUDIT-4/boc.py --tu-thu         # ca đỏ AU3-22 / 23 / 24 + K5 `HET`: luật CŨ (viec/AUDIT-3/boc.py, chỉ đọc) và MỚI chấm CÙNG đầu vào
    python3 viec/AUDIT-4/boc.py --khung <nhóm|tên…> · --c2luoi [tên…] · --audit2 <nhóm|tên…>   # khung AUDIT-1 / AUDIT-2 ĐÃ BỌC
    python3 viec/AUDIT-4/boc.py --bb [--chi <tiền tố>…] · --luoi1 [tên…] · --tachgl [tên…]          # bb / LUOI-1 / TACH-GL ĐÃ BỌC
    python3 viec/AUDIT-4/boc.py --xep <file…>    # đầu ra cũ: dòng BẮT / LẠC mang dấu sập → HỎNG-sập (cận dưới)

Chấm (luật sập (a), chủ quán chốt 16.10): HỎNG = neo không áp được · HỎNG-sập = `sap_cua` (dấu sập trong đầu ra · thoát 2 · không dòng "chạy hết" ·
dòng khớp mang dấu sập) · BẮT = bộ báo đạt và không sập · LẠC = thoát ≠ 0 không mẫu · SỐNG = thoát 0 · TREO = quá giờ. Cuối: git status không đổi
(ngoài viec/AUDIT-4/), không thì thoát 3. SO-LUONG-1 / BAN-HANG-1 / P20b chạy qua `viec/AUDIT-4/dot_bien.py --bo` (đối chứng + cùng luật sập).
"""
import atexit, contextlib, importlib.util, io, os, re, shutil, signal, subprocess, sys, tempfile, threading, types
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True   # nạp viec/AUDIT-3/boc.py, bộ cũ: không đẻ __pycache__ trong thư mục Cấm

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VIEC = os.path.join(GOC, 'viec')
SAP = re.compile(r'Bài thử sập|bài thử sập|Giả lập: SẬP|SẬP giữa kịch bản|Node\.js v\d')   # thu_*.js · chay.js nạp/dựng · kịch bản ném · node văng thô
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


def co_sap(ra):   # dấu sập theo DÒNG. Chỉ trừ ca T3…T10 của thu_gia_lap (kiểm hành vi sập, mô tả có 'Giả lập: SẬP'). AU3-22: KHÔNG còn trừ dòng
  for l in ra.splitlines():   # '✗ bài chạy thật …' của kiem_tra — bộ kiểm báo bài con sập = HỎNG-sập (luật (a)), dòng đó phải được soi
    if SAP.search(l) and not re.search(r'✗ T\d', l): return l.strip()[:160]
  return ''


def sap_cua(ma, ra, chi=''):   # MỘT luật sập: (1) dấu sập trong đầu ra ĐỦ; (2) thoát 2; (3) không dòng "chạy hết"; (4) dòng khớp mẫu mang dấu sập
  d = '' if ra is None else (co_sap(ra) or (ma == 2 and '(thoát 2)') or (not HET.search(ra) and f'thoát {ma} KHÔNG có dòng chạy hết') or '')
  if not d and chi and SAP.search(chi) and not re.search(r'✗ T\d', chi): d = 'dòng khớp mang dấu sập: ' + chi[:120]   # ra=None: chỉ vế (4)
  return d


def cham(ns, vo, db):
  vo.tl.r = None
  try: ten, dat, chi = ns['chay1'](db)
  except Exception as e: return db[0], 'HỎNG', f'bọc: chay1 ném {e}'
  r = vo.tl.r
  if r is None: return ten, 'HỎNG', chi   # ap của bộ từ chối (neo không khớp / đích ngoài tạm) — bài chưa chạy
  ra = ra_cua(r)
  d = sap_cua(r.returncode, ra, chi)
  if d: return ten, 'HỎNG-sập', d[:160] + f' · thoát {r.returncode} · dòng cuối: ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:80]
  return ten, ('BẮT' if dat else 'LẠC' if r.returncode != 0 else 'SỐNG'), chi


def doi_chung(ns, vo, cach):
  ten, kq, chi = cham(ns, vo, (f'sạch:{cach}', cach, [], r'$^'))
  r, ra = vo.tl.r, ra_cua(vo.tl.r) if vo.tl.r else ''
  tong = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
  bai = next((a for a in (r.args if r else []) if str(a).startswith('cong_cu/') or str(a).endswith('chay.js')), '?')
  bai = os.path.relpath(bai, GOC) if os.path.isabs(str(bai)) else str(bai)
  if tong: ok = int(tong.group(2)) == 0 and (bai not in DOI_CHUNG or int(tong.group(1)) == DOI_CHUNG[bai]); mo = tong.group(0)
  else: ok = bool(re.search(r'Giả lập: \d+ kịch bản · \d+ bất biến · ĐẠT|KB\d+ · \d+ bất biến · ĐẠT', ra)); mo = (ra.strip().splitlines() or ['(không in gì)'])[-1][:120]
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
    if r['kq'] in ('BẮT', 'SỐNG', 'LẠC') and (tl.sap or sap_cua(0, None, r['chi'])):   # vế (4): dòng khớp mang dấu sập
      r['kq'] = 'HỎNG-sập'; r['chi'] = 'sập' + (tl.sap or ' [dòng khớp mang dấu sập]')[:200] + ' | ' + r['chi'][:160]
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
      d = sap_cua(x.returncode, ra_cua(x), r['chi'])
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
    assert s.count(cu) == 1 and os.path.realpath(p).startswith(os.path.realpath(TAM)), f'{f}: neo / đích sai'
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
  # AU3-22: DOSAP_KHUON qua khung cách `kiem` — kiem_tra chạy hết, dòng ✗ báo thu_P26b sập; quyết định của bọc khung = sap_cua(lệnh) hoặc vế (4)
  m2 = nap_module('AUDIT-2'); K = m2.K
  tam = tempfile.mkdtemp(prefix='kiem_', dir=TAM)
  kk = K.dung_ban_sao('kho', tam, True)   # True = giữ bài chạy thật (khung thay bằng bài rỗng nếu tên không mở đầu '!' — AUDIT-1 :257)
  loi = K.ap(kk, [('server/' + d[0], d[1], d[2], d[3]) for d in DOSAP_KHUON])
  argv = K.LENH['kiem'][1][0][0]
  ma, ra, _ = K.chay_lenh(argv, kk, K.moi_truong(tam), 900)
  shutil.rmtree(K.GOC_TAM, ignore_errors=True)
  trung = [l.strip() for l in ra.splitlines() if re.search(r'✗ ', l)]
  chi = f'[{" ".join(argv[1:])}] {trung[0][:220]}' if trung else ''
  print(f'  (DOSAP-KIEM: áp {loi or "được"} · kiem_tra thoát {ma} · {len(trung)} dòng ✗ · dòng khớp đầu: {chi[:160]})')
  kq = lambda f: 'BẮT' if (ma not in (0, None) and trung and not (f(ma, ra) or f(0, None, chi))) else 'HỎNG-sập' if trung else f'không ✗ (thoát {ma})'
  ghi('AU3-22 DOSAP-KIEM qua khung cách kiem', kq(A3.sap_cua), kq(sap_cua), 'HỎNG-sập')
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


def xep(tep):
  dem = {}
  for p in tep:
    for l in open(p, encoding='utf-8'):
      m = re.match(r'[✓✗]?\s*(BẮT|SỐNG|HỎNG|LẠC|TREO)\b', l)
      if not m: continue
      k = 'HỎNG-sập' if m.group(1) in ('LẠC', 'BẮT') and SAP.search(l) and not re.search(r'✗ T\d', l) else m.group(1)   # cận dưới (không mã thoát)
      dem[k] = dem.get(k, 0) + 1
      if k == 'HỎNG-sập': print('HỎNG-sập ← ' + l.rstrip()[:200])
  print('  --xep: ' + ' · '.join(f'{k} {v}' for k, v in sorted(dem.items()))); return 0


def main():
  a = sys.argv[1:]
  j = 4
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  if not a: print(__doc__); return 2
  truoc = anh_kho()
  if a[0] == '--sap': ma = sap()
  elif a[0] == '--tu-thu': ma = tu_thu()
  elif a[0] == '--xep': return xep(a[1:])
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
