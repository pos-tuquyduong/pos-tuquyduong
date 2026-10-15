#!/usr/bin/env python3
"""AUDIT-3 A1 — lớp bọc ĐỐI CHỨNG cho các bộ đột biến cũ (KHÔNG sửa file bộ cũ). Chạy ở GỐC kho:

    python3 viec/AUDIT-3/boc.py <P26b|P26c|GOI-1|GOI-2> [tên…] [-j N]   # bộ khuôn GOI-1 qua lớp bọc: đối chứng đếm số, sập = HỎNG
    python3 viec/AUDIT-3/boc.py --sap            # mỗi bộ: sập lúc nạp (cú pháp) + sai chuỗi + NÉM giữa ca (throw trong route) + đỏ-rồi-sập
                                                 #   (P26b/P26c) → không bộ nào ra BẮT mà không có dấu sập (soát vòng 1)
    python3 viec/AUDIT-3/boc.py --xep <file…>    # đầu ra bộ khung AUDIT-1 / LUOI-1 / TACH-GL / bb: dòng BẮT hay LẠC có dấu sập → HỎNG-sập
    python3 viec/AUDIT-3/boc.py --c2luoi [tên…] [-j N] [--json <nháp>]   # C2F của AUDIT-1 + A3L c2full của AUDIT-2, cách c2luoi
    python3 viec/AUDIT-3/boc.py --luoi1 [tên…] [-j N]   # LUOI-1 trên kho nông: dòng `git show 9521cec` → '' trong bộ nhớ, bỏ GOC-*
    python3 viec/AUDIT-3/boc.py --khung <nhóm|tên…> [-j N] [--json <nháp>]   # bảng AUDIT-1 qua khung ĐÃ BỌC (soát vòng 2): mỗi lệnh con
    python3 viec/AUDIT-3/boc.py --audit2 <nhóm|tên…> [-j N]                  #   sập (thoát 2 / dấu sập / thoát 0 không dòng tổng) → HỎNG-sập

Chấm theo AUDIT-3: HỎNG = neo không áp được / bài thử SẬP (`Bài thử sập`, `Giả lập: SẬP`) · BẮT = bộ báo đạt và không sập ·
LẠC = thoát ≠ 0 không mẫu · SỐNG = thoát 0. Bộ khuôn GOI-1: nạp nguồn cắt tới `if __name__`, thay `subprocess` bằng vỏ giữ đầu ra, gọi
`chay1` + `ap` CỦA bộ (bản sao, lệnh, dọn tạm đều của bộ). Đối chứng = `chay1` với danh sách đổi rỗng → phải thoát 0 và dòng tổng khớp
số đo mục 0 của ke_hoach.md (DOI_CHUNG), lệch thì DỪNG thoát 4. Cuối: git status (ngoài viec/AUDIT-3/) không đổi, không thì thoát 3.
"""
import contextlib, importlib.util, io, os, re, signal, shutil, subprocess, sys, threading
from concurrent.futures import ThreadPoolExecutor
sys.dont_write_bytecode = True

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
VIEC = os.path.join(GOC, 'viec')
SAP = re.compile(r'Bài thử sập|bài thử sập|Giả lập: SẬP|SẬP giữa kịch bản|Node\.js v\d')   # thu_*.js · chay.js nạp/dựng · kịch bản ném · node văng thô
TONG = re.compile(r'\d+ đạt · 0 hỏng|· ĐẠT\b|Qua hết|PASS \d+|✓ XANH')   # dòng tổng của mỗi bài: thoát 0 mà không có = sập mã 0 (soát vòng 2)
DOI_CHUNG = {'cong_cu/thu_P26c.js': 105, 'cong_cu/thu_GOI1.js': 101, 'cong_cu/thu_P26b.js': 66, 'cong_cu/thu_gia_lap.js': 145}
O, CH = 'routes/orders.js', 'cong_cu/gia_lap/chay.js'
KHUON = ('P26b', 'P26c', 'GOI-1', 'GOI-2')
SAP_KHUON = [(O, '// 1. Tạo đơn hàng', '}}}{{{', 1)]   # orders.js hỏng cú pháp → máy chủ không nạp → bài thử sập
SAI_KHUON = [(O, 'CHUOI_KHONG_CO_TRONG_FILE_AUDIT3', 'x', 1)]
NEM_KHUON = [(O, 'subtotal += pkg.price * pkgQty;', 'throw new Error("AUDIT-3 ném giữa ca");', 1)]   # route ném → thu_*: 500 (ca đỏ, bài đi tiếp); chay.js: 'SẬP giữa kịch bản'
DOSAP_KHUON = [(O, 'const meTra = order.parent_phone ? Number(order.parent_balance_amount || 0) : 0;', 'const meTra = 0;', 1)]   # thu_P26b: ✗ M2/M3 rồi sập (AU3-6)
SAP0_KHUON = [(O, '// 1. Tạo đơn hàng', 'process.exit(0);', 1)]   # máy chủ chạy TRONG tiến trình bài thử → bài thoát 0 không dòng tổng (soát vòng 2)


class Vo:   # vỏ thay `subprocess` trong không gian tên của bộ: chạy thật, giữ kết quả theo luồng
  TimeoutExpired = subprocess.TimeoutExpired
  def __init__(self): self.tl = threading.local()
  def run(self, *a, **k):
    r = subprocess.run(*a, **k); self.tl.r = r; return r


def nap_khuon(bo):
  p = os.path.join(VIEC, bo, 'dot_bien.py')
  src = open(p, encoding='utf-8').read()
  ns = {'__file__': p, '__name__': f'boc_{bo}'}
  exec(compile(src[:src.index('\nif __name__')], p, 'exec'), ns)
  ns['subprocess'] = vo = Vo()
  return ns, vo


def ra_cua(r): return re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)


def co_sap(ra):   # dấu sập theo DÒNG; ca T3…T10 của thu_gia_lap kiểm hành vi sập nên mô tả có 'Giả lập: SẬP' — không tính
  for l in ra.splitlines():
    if SAP.search(l) and not re.search(r'✗ T\d', l): return l.strip()[:160]
  return ''


def cham(ns, vo, db):
  vo.tl.r = None
  try: ten, dat, chi = ns['chay1'](db)
  except Exception as e: return db[0], 'HỎNG', f'bọc: chay1 ném {e}'
  r = vo.tl.r
  if r is None: return ten, 'HỎNG', chi   # ap của bộ từ chối (neo không khớp / đích ngoài tạm) — bài chưa chạy
  ra = ra_cua(r)
  # thoát 2 = sập của thu_*.js / chay.js; thoát 3 (chay.js TỪ CHỐI) không phải sập; thoát 0 mà không có dòng tổng = sập mã 0 (process.exit)
  if co_sap(ra) or r.returncode == 2: return ten, 'HỎNG-sập', (co_sap(ra) or '(thoát 2)') + f' · thoát {r.returncode}'
  if r.returncode == 0 and not TONG.search(ra): return ten, 'HỎNG-sập', 'thoát 0 KHÔNG có dòng tổng · dòng cuối: ' + (ra.strip().splitlines() or ['(không in gì)'])[-1][:120]
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
  return '\n'.join(l for l in st.splitlines() if not l[3:].startswith('viec/AUDIT-3/'))


def chay_khuon(bo, ten_chon, j, them=()):
  ns, vo = nap_khuon(bo)
  ds = [d for d in ns['DOT_BIEN'] if not ten_chon or d[0] in ten_chon] + list(them)
  if not ds: print('không có đột biến nào khớp', ten_chon); return 2, []
  print(f'AUDIT-3 bọc {bo}: {len(ds)} đột biến · -j {j} · đối chứng {sorted({d[1] for d in ds})}', flush=True)
  if not all([doi_chung(ns, vo, c) for c in sorted({d[1] for d in ds})]):
    print('  DỪNG — đối chứng đỏ hoặc lệch số đo, không chấm gì'); return 4, []
  with ThreadPoolExecutor(max_workers=j) as ex: kq = list(ex.map(lambda d: cham(ns, vo, d), ds))
  for ten, k, chi in kq: print(f'{k:9} {ten}  · {chi[:200]}', flush=True)
  dem = {x: sum(k == x for _, k, _ in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'HỎNG-sập', 'LẠC')}
  print(f'\n  {bo}: tổng {len(kq)} · ' + ' · '.join(f'{x} {v}' for x, v in dem.items()))
  return 0, kq


def nap_module(bo, tep='dot_bien.py'):
  sp = importlib.util.spec_from_file_location(f'boc_{bo}'.replace('-', '_'), os.path.join(VIEC, bo, tep))
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


def boc_khung(m2):   # khung AUDIT-1 chỉ giữ dòng khớp ĐẦU (dot_bien.py:326–330) nên đỏ-rồi-sập / sập mã 0 vô hình — bọc đọc cả đầu ra +
  K, tl = m2.K, threading.local()   # mã thoát của MỖI lệnh con rồi chấm lại (soát vòng 2)
  cl, ch = K.chay_lenh, K.cham
  def chay_lenh(argv, *a, **k):
    ma, ra, g = cl(argv, *a, **k)
    dau = co_sap(ra) or (ma == 2 and '(thoát 2)') or (ma == 0 and not TONG.search(ra) and 'thoát 0 không dòng tổng') or ''
    if dau: tl.sap = getattr(tl, 'sap', '') + f' [{" ".join(argv[1:3])}: {dau}]'
    return ma, ra, g
  def cham(db, that=None):
    tl.sap = ''
    r = ch(db, that)
    if tl.sap and r['kq'] in ('BẮT', 'SỐNG', 'LẠC'): r['kq'] = 'HỎNG-sập'; r['chi'] = 'sập' + tl.sap[:200] + ' | ' + r['chi'][:160]
    return r
  K.chay_lenh, K.cham = chay_lenh, cham


def nap_m2():
  m2 = nap_module('AUDIT-2')
  boc_khung(m2)
  cu = m2.K.anh_kho
  m2.K.anh_kho = lambda: '\n'.join(l for l in cu().split('\n') if not l[3:].startswith('viec/AUDIT-3/'))
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, m2.K.don)
  return m2


def sap():
  xau = []
  for bo in KHUON:
    them = [(f'SAP-{bo}', 'thu', SAP_KHUON, r'✗ '), (f'SAI-{bo}', 'thu', SAI_KHUON, r'✗ '), (f'NEM-{bo}', 'thu', NEM_KHUON, r'✗ '), (f'SAP0-{bo}', 'thu', SAP0_KHUON, r'✗ ')]
    if bo == 'P26b': them.append(('DOSAP-P26b', 'thu', DOSAP_KHUON, r'✗ M2 '))
    _, kq = chay_khuon(bo, ['VS-Q9-hoan-me-ngoai-tx'] if bo == 'P26c' else ['__khong_co__'], 2, them=them)   # P26c: đỏ-rồi-sập có sẵn
    xau += [(bo, t, k) for t, k, _ in kq if k in ('BẮT', 'SỐNG') and t.startswith(('SAP-', 'SAI-', 'DOSAP-', 'VS-Q9', 'SAP0-'))]   # NEM- ở thu_*: 500 là ca đỏ thật, bài không sập → BẮT đúng
  m2 = nap_m2()
  m2.K.DOT_BIEN.append(('SAP-AUDIT2', 'D2K', 'c2luoi', [('server/' + O, '// 1. Tạo đơn hàng', '}}}{{{', 1)], r'✗ '))
  sv = lambda cap: [('server/' + d[0], d[1], d[2], d[3]) for d in cap]
  m2.K.DOT_BIEN += [('NEM-AUDIT2', 'D2K', 'gl', sv(NEM_KHUON), r'✗ '),           # kịch bản ném → khung ghi BẮT 'SẬP giữa kịch bản'
                    ('DOSAP-AUDIT2', 'D2K', 'p26b', sv(DOSAP_KHUON), r'✗ '),     # ✗ M2 rồi thu_P26b sập: khung ghi BẮT (dòng đầu) — bọc khung xếp lại
                    ('SAP0-AUDIT2', 'D2K', 'p26b', sv(SAP0_KHUON), r'✗ ')]       # thoát 0 không dòng tổng: khung ghi SỐNG — bọc khung xếp lại
  _, ra = goi_main(m2.K.main, ['SAP-AUDIT2', 'NEM-AUDIT2', 'DOSAP-AUDIT2', 'SAP0-AUDIT2', '-j', '2'])
  for l in ra.splitlines():
    m = re.match(r'(BẮT|SỐNG)\s+D2K (SAP-AUDIT2|NEM-AUDIT2|DOSAP-AUDIT2|SAP0-AUDIT2)', l)
    if m: xau.append(('AUDIT-2', m.group(2), m.group(1)))   # qua bọc khung mọi ca sập phải ra HỎNG-sập; còn BẮT / SỐNG = bọc khung hỏng
  for bo, ns, cach in (('LUOI-1', nap_luoi1(), 'kb1'), ('TACH-GL', vars(nap_module('TACH-GL')), 'gl29')):
    ns['DOT_BIEN'].append((f'SAP-{bo}', cach, [(CH, 'const sxGia = { loi: false,', '}}}{{{', 1)], [r'KB\d+ → '], 'LẠC'))
    _, ra = goi_main(ns['main'], [f'SAP-{bo}', '-j', '1']); xau += [(bo, f'SAP-{bo}', 'BẮT') for l in ra.splitlines() if re.match(r'[✓✗] BẮT', l) and not SAP.search(l)]
  sl = nap_module('SO-LUONG-1')
  for ten, cap in (('SAP-SOLUONG1', SAP_KHUON), ('NEM-SOLUONG1', NEM_KHUON)):
    ten, dat, chi = sl.chay1((ten, 'p26c', cap, r'✗ '))
    print(f"SO-LUONG-1 {ten} → {'bị bắt' if dat else 'không bắt'} · {chi[:160]}")
    if dat and ten.startswith('SAP-'): xau.append(('SO-LUONG-1', ten, 'BẮT'))
  print(f'\n  --sap: {len(xau)} bộ báo BẮT / SỐNG khi bài thử sập ' + ('— ĐẠT (không bộ nào)' if not xau else '— KHÔNG ĐẠT: ' + ', '.join(f'{b} {t} {k}' for b, t, k in xau)))
  return 1 if xau else 0


def xep(tep):
  dem = {}
  for p in tep:
    for l in open(p, encoding='utf-8'):
      m = re.match(r'[✓✗]?\s*(BẮT|SỐNG|HỎNG|LẠC|TREO)\b', l)
      if not m: continue
      # BẮT nhờ dòng sập cũng là sập (soát vòng 1). Ca T3…T10 của thu_gia_lap KIỂM hành vi sập nên mô tả có 'Giả lập: SẬP' — không phải sập của bài.
      k = 'HỎNG-sập' if m.group(1) in ('LẠC', 'BẮT') and SAP.search(l) and not re.search(r'✗ T\d', l) else m.group(1)
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
  elif a[0] == '--xep': return xep(a[1:])
  elif a[0] in ('--c2luoi', '--khung', '--audit2'):   # bảng AUDIT-1 / AUDIT-2 chạy qua khung ĐÃ BỌC (boc_khung)
    m2 = nap_m2()
    if a[0] != '--audit2':
      k1 = nap_module('AUDIT-1'); shutil.rmtree(k1.GOC_TAM, ignore_errors=True)
      if a[0] == '--c2luoi': m2.K.DOT_BIEN = [(n, g, 'c2luoi', d, m) for n, g, c, d, m in k1.DOT_BIEN + m2.K.DOT_BIEN if (g == 'C2F' or (g == 'A3L' and c == 'c2full'))]
      else: m2.K.DOT_BIEN = [d for d in k1.DOT_BIEN if d[1] != 'C2F']
    ma, _ = goi_main(m2.K.main, a[1:] + ['-j', str(j)])
  elif a[0] == '--luoi1':
    ns = nap_luoi1()
    ten = [d[0] for d in ns['DOT_BIEN'] if not d[0].startswith('GOC-') and (len(a) == 1 or d[0] in a[1:])]
    ma, _ = goi_main(ns['main'], ten + ['-j', str(j)])
  elif a[0] in KHUON: ma, _ = chay_khuon(a[0], a[1:], j)
  else: print('không hiểu', a[0]); return 2
  if anh_kho() != truoc: print('  ✗ KHO BẨN — git status ngoài viec/AUDIT-3/ đổi'); return 3
  print('  ✓ kho thật không đổi (git status ngoài viec/AUDIT-3/)'); return ma


if __name__ == '__main__':
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, lambda *_: sys.exit(130))
  sys.exit(main())
