#!/usr/bin/env python3
"""AUDIT-2 B1 — TỰ SINH đột biến từ cong_cu/gia_lap/bat_bien.js, chạy trên BẢN SAO. Chạy ở GỐC kho:

    python3 viec/AUDIT-2/dot_bien_bb.py [--liet-ke] [--chi <tiền tố>…] [-j N] [--json <file ngoài kho>]

Sinh (mỗi bất biến I<n>, theo vị trí trong khối `async I<n>(`):
  bo-ve  — mỗi vế của một chuỗi `||` / `&&` (JS) hay `OR` / `AND` (SQL, trong chuỗi `…`): vế của || / OR → false / 1=0
           (NỚI), vế của && / AND → true / 1=1 (SIẾT). Chuỗi có vế là giá trị mặc định (`x || 0`, `|| {}`…) không phải
           phép logic → bỏ qua (in ở --liet-ke).
  duong / am — mỗi phép so BẰNG / KHÁC (JS === !== !=, SQL = <>, Math.abs(x − y) > t) mà một vế có TÊN tiền / lượng / điểm
           (danh sách TIEN dưới đây, khớp trọn từ): hai đột biến MỘT CHIỀU — chỉ còn bắt lệch dương / chỉ lệch âm.
Chấm (bản sao server/ + cong_cu/ + tu_chay/cau_hinh.json, đích ghi phải nằm trong thư mục tạm):
  tầng 1 `node cong_cu/thu_gia_lap.js --chi-du-lieu-tay` → thoát ≠ 0 và dòng `✗ I<n> …` (trọn từ) không có "SẬP" = BẮT;
  tầng 2 (tầng 1 xanh) `node cong_cu/gia_lap/chay.js` → dòng `→ I<n>:` = BẮT (siết làm đỏ dữ liệu đúng).
  Thoát ≠ 0 mà không khớp đúng I<n> (sập, cú pháp, bất biến khác) = LẠC · mọi tầng xanh = SỐNG · neo không khớp = HỎNG.
D2 (công cụ không nói dối): `--chi D2-` — sai chuỗi → HỎNG · đã biết → BẮT · vô hại → SỐNG · sập → LẠC.
"""
import json, os, re, shutil, signal, subprocess, sys, tempfile, threading, time
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BB = 'cong_cu/gia_lap/bat_bien.js'
# Tên tiền / lượng / điểm: tên trọn (hoặc một mảnh khi tách theo '_'); bỏ bí danh bảng (tên đứng trước '.') và chữ trong '…'.
GOC_TIEN = set('amount total balance price points cost qty quantity debt value count limit tien diem'.split())
TIEN = GOC_TIEN | set('''so_sach da_ghi da_lay da_nhan so_qua so_ma so_don tri_gia_qua tran tran_qua hoan tra gia n tay length
  tongLog dung doi dem soNo chuaXong g flash'''.split())


def la_tien(x):
  x = re.sub(r"'[^']*'", ' ', x)
  return any(t in TIEN or (not t.endswith('_id') and any(m in GOC_TIEN for m in t.split('_')))
             for t in re.findall(r'[A-Za-z_]\w*(?![\w.])', x))
MAC_DINH = re.compile(r"^(-?\d+(\.\d+)?|''|\"\"|`[^`]*`|\{\}|\[\]|null|undefined)$")
MO, DONG = '([{', ')]}'


# ═══ Quét bat_bien.js ═══════════════════════════════════════════════════════════
def quet(s):
  """Trả (loai[i], sau[i]): loai = 'c' code JS · 't' trong chuỗi `…` (SQL) · 's' chuỗi '…'/"…" · '#' chú thích.
  ${…} trong `…` là code. sau[i] = độ sâu ngoặc của code tại i."""
  loai, sau, i, n, ngan = [''] * len(s), [0] * len(s), 0, len(s), []   # ngan: ngăn xếp 'b' ngoặc / 't' template / '$' ${
  d = 0
  while i < n:
    ch, top = s[i], (ngan[-1] if ngan else None)
    if top == 't':
      if ch == '`': loai[i] = 't'; ngan.pop(); i += 1; continue
      if s.startswith('${', i): loai[i] = loai[i + 1] = 't'; ngan.append('$'); i += 2; continue
      loai[i] = 't'; i += 1; continue
    if s.startswith('//', i):
      j = s.find('\n', i); j = n if j < 0 else j
      for k in range(i, j): loai[k] = '#'
      i = j; continue
    if ch in '\'"':
      j = i + 1
      while s[j] != ch: j += 2 if s[j] == '\\' else 1
      for k in range(i, j + 1): loai[k] = 's'
      i = j + 1; continue
    if ch == '`': loai[i] = 't'; ngan.append('t'); i += 1; continue
    if ch == '}' and top == '$': loai[i] = 't'; ngan.pop(); i += 1; continue
    loai[i] = 'c'
    if ch in MO: d += 1; ngan.append('b')
    sau[i] = d
    if ch in DONG: d -= 1; ngan.pop()
    i += 1
  return loai, sau


def khoi_bat_bien(s):
  m = list(re.finditer(r'\n  async (I\d+)\(', s))
  return [(x.group(1), x.start(), m[k + 1].start() if k + 1 < len(m) else s.index('\n};', x.start())) for k, x in enumerate(m)]


def vung(s, loai, sau, p, ma):
  """Đoạn chứa p cùng độ sâu, giữa hai dấu phân cách (JS: , ; ? : => = và ngoặc; SQL: từ khoá mệnh đề, ngoặc, phẩy)."""
  d = sau[p] if ma == 'c' else None
  def cung(k): return loai[k] == ma and (sau[k] == d if ma == 'c' else True)
  if ma == 'c':
    a = p
    while a > 0:
      c = s[a - 1]
      if loai[a - 1] == 't':   # chuỗi `…` đứng làm giá trị → nhảy qua; chữ của chuỗi bao ${…} → biên
        if c != '`': break
        a = s.rindex('`', 0, a - 1); continue
      if loai[a - 1] == 'c' and sau[a - 1] == d and c in MO: break
      if loai[a - 1] == 'c' and sau[a - 1] == d and (c in ',;:' or (c == '?' and s[a] != '.') or s[a - 2:a] == '=>' or
          (c == '=' and s[a - 2] not in '=!<>' and s[a] not in '=>')): break
      if loai[a - 1] == 'c' and sau[a - 1] == d and s[a - 7:a] == 'return ': break
      a -= 1
    b = p
    while b < len(s):
      c = s[b]
      if loai[b] == 't':
        if c != '`': break
        b = s.index('`', b + 1) + 1; continue
      if loai[b] == 'c' and sau[b] == d and c in DONG: break
      if loai[b] == 'c' and sau[b] == d and (c in ',;:' or (c == '?' and s[b + 1] != '.')): break
      b += 1
    return a, b
  # SQL: trong cùng chuỗi `…`, độ sâu ngoặc SQL tính riêng
  t0 = p
  while loai[t0 - 1] == 't' and s[t0 - 1] != '`': t0 -= 1
  t1 = s.index('`', p)
  sql = s[t0:t1]
  q = p - t0
  kw = re.compile(r'\b(WHERE|ON|WHEN|THEN|ELSE|END|GROUP BY|ORDER BY|LIMIT|SELECT|FROM|JOIN|HAVING)\b|,')
  def sau_sql(k): return sql[:k].count('(') - sql[:k].count(')')
  dq = sau_sql(q)
  a = q
  while a > 0 and not (sql[a - 1] == '(' and sau_sql(a - 1) == dq - 1):
    if sau_sql(a) == dq and kw.match(sql, a - 1) is None and any(m.end() == a for m in kw.finditer(sql, max(0, a - 9), a) if sau_sql(m.start()) == dq): break
    a -= 1
  b = q
  while b < len(sql) and not (sql[b] == ')' and sau_sql(b) == dq):
    m = kw.match(sql, b)
    if m and sau_sql(b) == dq and b > q: break
    b += 1
  return t0 + a, t0 + b


def tach(s, loai, sau, a, b, toan, ma, d):
  """Cắt [a,b) theo toán tử `toan` ở cùng mức → [(đầu, cuối)] (đã bỏ khoảng trắng hai đầu)."""
  ds, dau, k = [], a, a
  rx = re.compile(r'\s(' + toan + r')\s') if ma == 't' else None
  while k < b:
    if ma == 'c' and loai[k] == 'c' and sau[k] == d and s.startswith(toan, k) and s[k - 1] not in '|&' and s[k + 2] not in '|&':
      ds.append((dau, k)); dau = k = k + 2; continue
    if ma == 't' and loai[k] == 't':
      m = rx.match(s, k - 1) if k else None
      if m and m.start(1) == k and s[a:k].count('(') == s[a:k].count(')'):
        ds.append((dau, k)); dau = k = k + len(toan); continue
    k += 1
  ds.append((dau, b))
  ra = []
  for x, y in ds:
    while x < y and s[x].isspace(): x += 1
    while y > x and s[y - 1].isspace(): y -= 1
    ra.append((x, y))
  return ra


def sinh():
  s = open(os.path.join(GOC, BB), encoding='utf-8').read()
  loai, sau = quet(s)
  dong = lambda p: s.count('\n', 0, p) + 1
  db, bo_qua, da_ve = [], [], set()
  for bb, k0, k1 in khoi_bat_bien(s):
    dem = {}
    def them(kieu, dang, a, b, moi, ghi=''):
      key = (kieu, dang == 'bo-ve'); dem[key] = dem.get(key, 0) + (0 if dang == 'am' else 1)
      db.append(dict(ten=f'BB-{bb}-{kieu}-{dem[key]}-{dang}', bb=bb, dong=dong(a), a=a, b=b, cu=s[a:b], moi=moi, ghi=ghi))
    # 1. bỏ vế — mọi || && (JS) / OR AND (SQL), xếp theo vị trí
    vt = [(m.start(), 'c', m.group()) for m in re.finditer(r'\|\||&&', s[k0:k1]) if loai[k0 + m.start()] == 'c']
    vt += [(m.start(1), 't', m.group(1)) for m in re.finditer(r'\s(OR|AND)\s', s[k0:k1]) if loai[k0 + m.start(1)] == 't']
    for p, ma, op in sorted(vt):
      p += k0
      a, b = vung(s, loai, sau, p, ma)
      d = sau[p]
      hoac = '\\|\\|' if ma == 'c' else 'OR'
      ve_or = tach(s, loai, sau, a, b, '||' if ma == 'c' else 'OR', ma, d)
      if op in ('&&', 'AND'):
        x, y = next((x, y) for x, y in ve_or if x <= p < y)
        ve = tach(s, loai, sau, x, y, '&&' if ma == 'c' else 'AND', ma, d)
      else: ve = ve_or
      if (ve[0][0], ve[-1][1], op) in da_ve: continue
      da_ve.add((ve[0][0], ve[-1][1], op))
      if any(MAC_DINH.match(s[x:y]) for x, y in ve):
        bo_qua.append(f'{bb} bat_bien.js:{dong(p)} chuỗi {op} có vế mặc định: {s[ve[0][0]:ve[-1][1]][:90]!r}'); continue
      tri = {'||': 'false', '&&': 'true', 'OR': '1=0', 'AND': '1=1'}[op]
      for x, y in ve: them('js' if ma == 'c' else 'sql', 'bo-ve', x, y, f'({tri})' if ma == 'c' else tri, f'{op} → {tri}')
    # 2. một chiều — so bằng / khác trên tiền-lượng-điểm
    for m in re.finditer(r'Math\.abs\(([^()]*(?:\([^()]*\)[^()]*)*?) - ([^()]*(?:\([^()]*\)[^()]*)*)\) > ([\d.]+)', s[k0:k1]):
      a, b = k0 + m.start(), k0 + m.end()
      x, y, t = m.group(1), m.group(2), m.group(3)
      them('js', 'duong', a, b, f'({x} - {y}) > {t}'); them('js', 'am', a, b, f'({y} - {x}) > {t}')
    cmp = [(m.start(), 'c', m.group()) for m in re.finditer(r'===|!==|!=(?!=)', s[k0:k1]) if loai[k0 + m.start()] == 'c' and s[k0 + m.start() - 1] != '!']
    cmp += [(m.start(1), 't', m.group(1)) for m in re.finditer(r'\s(<>|=)\s', s[k0:k1]) if loai[k0 + m.start(1)] == 't']
    for p, ma, op in sorted(cmp):
      p += k0
      a, b = vung(s, loai, sau, p, ma)
      chuoi = '||' if ma == 'c' else 'OR'
      for x, y in tach(s, loai, sau, a, b, chuoi, ma, sau[p]):
        if x <= p < y: a, b = x, y
      for x, y in tach(s, loai, sau, a, b, '&&' if ma == 'c' else 'AND', ma, sau[p]):
        if x <= p < y: a, b = x, y
      trai, phai = s[a:p].strip(), s[p + len(op):b].strip()
      b = s.index(phai, p) + len(phai)
      if not (la_tien(trai) or la_tien(phai)) or re.search(r"^'|'$", trai) or re.search(r"^'|'$", phai) or phai in ('null', 'NULL'):
        bo_qua.append(f'{bb} bat_bien.js:{dong(p)} so {op} không trên tiền/lượng/điểm: {trai[:40]} {op} {phai[:40]}'); continue
      t = trai + phai
      null = ' (có thể null)' if '.get(' in t or (ma == 't' and 'COALESCE' not in t) else ''
      bang = op in ('===', '=')
      kieu = 'js' if ma == 'c' else 'sql'
      them(kieu, 'duong', a, b, f'{trai} {"<=" if bang else ">"} {phai}', null)
      them(kieu, 'am', a, b, f'{trai} {">=" if bang else "<"} {phai}', null)
  return s, db, bo_qua


# ═══ D2 — bốn đột biến chứng minh (tên viết tay) ═══════════════════════════════
D2 = [
  dict(ten='D2-sai-chuoi', bb='I7', cu='CHUOI_KHONG_CO_TRONG_BAT_BIEN_AUDIT2', moi='x'),
  dict(ten='D2-da-biet', bb='I7', cu='of daXong) if (dem.get(vt) !== 1)', moi='of daXong) if (false)'),   # = LUOI-1 BV-I7-b-no-da-xong
  dict(ten='D2-vo-hai', bb='I7', cu='SX nhận vân tay lạ', moi='SX nhan van tay la'),
  dict(ten='D2-sap', bb='I7', cu='const hong = ctx.sxGia.hong;', moi='const hong = ctx.sxGia.hong;}}}{{'),
]

# ═══ Chạy ═══════════════════════════════════════════════════════════════════════
GOC_TAM = None
CON, KHOA = set(), threading.Lock()


def ban_sao(tam):
  k = os.path.join(tam, 'kho')
  for x in ('server', 'cong_cu', 'tu_chay/cau_hinh.json'):
    n, d = os.path.join(GOC, x), os.path.join(k, x)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    (shutil.copytree if os.path.isdir(n) else shutil.copy2)(n, d)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))   # chỉ đọc
  return k


def ap(k, tam, d):
  p = os.path.join(k, BB)
  if not os.path.realpath(p).startswith(os.path.realpath(tam) + os.sep): return 'đích ghi ra ngoài thư mục tạm — không ghi'
  s = open(p, encoding='utf-8').read()
  if 'a' in d:
    if s[d['a']:d['b']] != d['cu']: return f'neo tại bat_bien.js:{d["dong"]} không khớp'
    s = s[:d['a']] + d['moi'] + s[d['b']:]
  else:
    if s.count(d['cu']) != 1: return f'chuỗi gốc khớp {s.count(d["cu"])} lần, cần 1'
    s = s.replace(d['cu'], d['moi'])
  open(p, 'w', encoding='utf-8').write(s)
  return ''


def chay_lenh(argv, k, tam, gio):
  e = {x: os.environ[x] for x in ('PATH', 'HOME', 'LANG', 'LC_ALL') if x in os.environ}
  e['TMPDIR'] = os.path.join(tam, 'tmp'); os.makedirs(e['TMPDIR'], exist_ok=True)
  p = subprocess.Popen(argv, cwd=k, env=e, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
  with KHOA: CON.add(p.pid)
  try: ra, _ = p.communicate(timeout=gio); ma = p.returncode
  except subprocess.TimeoutExpired:
    os.killpg(p.pid, signal.SIGKILL); ra, _ = p.communicate(); ma = None
  finally:
    with KHOA: CON.discard(p.pid)
  return ma, re.sub(r'\x1b\[[0-9;]*m', '', ra.decode('utf-8', 'replace')).splitlines()


TANG = [(['node', 'cong_cu/thu_gia_lap.js', '--chi-du-lieu-tay'], r'✗ {bb}\b(?!.*SẬP)', 120),
        (['node', 'cong_cu/gia_lap/chay.js'], r'→ {bb}:', 300)]


def cham(d):
  tam = tempfile.mkdtemp(prefix='au2bb_', dir=GOC_TAM)
  t0 = time.time()
  try:
    k = ban_sao(tam)
    loi = ap(k, tam, d) if d.get('cu') is not None else ''
    if loi: return dict(ten=d['ten'], kq='HỎNG', giay=0, chi=loi)
    lac = []
    for argv, mau, gio in TANG:
      ma, ra = chay_lenh(argv, k, tam, gio)
      if ma is None: lac.append(f'{argv[1]} quá {gio} s'); continue
      if ma == 0: continue
      trung = [l.strip() for l in ra if re.search(mau.format(bb=d['bb']), l)]
      if trung:
        nhan = ' (ca SẠCH lệch — đột biến siết)' if ' sạch' in trung[0] else ''
        return dict(ten=d['ten'], kq='BẮT', giay=round(time.time() - t0), chi=f'[{argv[1]}] {trung[0][:200]}{nhan}')
      lac.append(f'[{argv[1]} thoát {ma}] ' + next((l.strip()[:200] for l in ra if '✗' in l or 'SẬP' in l), ra[-1][:200] if ra else ''))
    return dict(ten=d['ten'], kq='LẠC' if lac else 'SỐNG', giay=round(time.time() - t0), chi=' | '.join(lac) or 'mọi tầng xanh')
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def anh_kho():
  return subprocess.run(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=GOC, capture_output=True, text=True).stdout


def don(*_):
  for pid in list(CON):
    try: os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError: pass
  if GOC_TAM: shutil.rmtree(GOC_TAM, ignore_errors=True)
  sys.exit(130)


def main():
  global GOC_TAM
  a = sys.argv[1:]
  j, ra_json, chi = 4, None, []
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  if '--json' in a: i = a.index('--json'); ra_json = a[i + 1]; del a[i:i + 2]
  while '--chi' in a: i = a.index('--chi'); chi.append(a[i + 1]); del a[i:i + 2]
  _, db, bo_qua = sinh()
  ten = [d['ten'] for d in db] + [d['ten'] for d in D2]
  if len(set(ten)) != len(ten): print('tên đột biến trùng'); return 2
  if '--liet-ke' in a:
    for d in db: print(f"{d['ten']:28} bat_bien.js:{d['dong']:<4} {d['cu'][:70]!r} → {d['moi'][:60]!r} {d['ghi']}")
    for x in bo_qua: print('  bỏ qua:', x)
    print(f'\n  {len(db)} đột biến sinh · {len(bo_qua)} chỗ bỏ qua · D2 {len(D2)}')
    return 0
  ds = [d for d in db + D2 if not chi or any(d['ten'].startswith(c) for c in chi)]
  if not ds: print('không có đột biến nào khớp', chi); return 2
  truoc = anh_kho()
  GOC_TAM = tempfile.mkdtemp(prefix='au2bb_')
  t0 = time.time()
  try:
    print(f'AUDIT-2 dot_bien_bb: {len(ds)} đột biến · -j {j} · kiểm sạch 3 bản', flush=True)
    with ThreadPoolExecutor(max_workers=max(j, 3)) as ex:
      sach = list(ex.map(cham, [dict(ten=f'sạch:{x}', bb='I0', cu=None) for x in range(3)]))
    hong = [r for r in sach if r['kq'] != 'SỐNG']
    for r in hong: print(f"  ✗ KIỂM SẠCH {r['ten']}: {r['kq']} · {r['chi']}")
    if hong: print('  DỪNG — bản sao không đột biến đã đỏ'); return 4
    kq = []
    with ThreadPoolExecutor(max_workers=j) as ex:
      for d, r in zip(ds, ex.map(cham, ds)):
        r['dong'] = d.get('dong'); kq.append(r)
        print(f"{r['kq']:4}  {r['ten']}  (bat_bien.js:{r['dong'] or '-'}, {r['giay']} s) · {r['chi']}", flush=True)
  finally:
    shutil.rmtree(GOC_TAM, ignore_errors=True)
  dem = {x: sum(r['kq'] == x for r in kq) for x in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f"\n  tổng {len(kq)} · " + ' · '.join(f'{x} {v}' for x, v in dem.items()) + f' · {round(time.time() - t0)} s')
  if ra_json: json.dump(kq, open(ra_json, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
  if anh_kho() != truoc or os.path.exists(GOC_TAM): print('  ✗ KHO BẨN — git status đổi hoặc thư mục tạm còn sót'); return 3
  print('  ✓ kho thật không đổi (git status); thư mục tạm đã xoá')
  return 0


if __name__ == '__main__':
  for sg in (signal.SIGINT, signal.SIGTERM): signal.signal(sg, don)
  sys.exit(main())
