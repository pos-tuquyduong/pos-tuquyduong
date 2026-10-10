#!/usr/bin/env python3
"""TACH-GL — đột biến của chính việc này (D4). Chạy ở GỐC kho, KHÔNG chạy lệnh khác song song:

    python3 viec/TACH-GL/dot_bien.py [tên|tiền tố* …] [-j N]

Mỗi đột biến: chép THẬT (không nối) server/, cong_cu/, tu_chay/cau_hinh.json, kiem_tra_truoc_khi_giao.js vào thư mục tạm
(node_modules nối — chỉ đọc), thay chuỗi (chuỗi gốc phải khớp ĐÚNG số lần ghi sẵn, không thì HỎNG — K3), kiểm đích ghi nằm trong
thư mục tạm (realpath — K5/HOC-2b), rồi chạy lệnh trên bản sao:
  thugl : node cong_cu/thu_gia_lap.js (của bản sao) — đột biến cơ chế chia lượt (chay.js / kich_ban.js)
  gl29  : node cong_cu/gia_lap/chay.js --den-kb 29 (lượt 4 tới KB29) — đột biến máy chủ C2 (quà % có trần)
  BẮT = thoát ≠ 0 VÀ MỌI mẫu đều khớp một dòng ra     LẠC = thoát ≠ 0 nhưng thiếu mẫu     SỐNG = thoát 0
Trước khi chấm, mỗi cách chạy chạy KHÔNG đột biến một lần → phải thoát 0 (đỏ thì dừng, thoát 4). Lệch mong đợi → thoát 1.
Không có phần dựng đầu lượt (B2 ii) → không có đột biến "bỏ dựng đầu lượt" (ke_hoach.md mục 2).
"""
import os, re, shutil, subprocess, sys, tempfile, time
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CH, KB = 'cong_cu/gia_lap/chay.js', 'cong_cu/gia_lap/kich_ban.js'
LY, OR = 'server/routes/loyalty.js', 'server/routes/orders.js'
L1, L3 = '[[2, 15, 17, 28]', '[1, 4, 5, 6, 7, 8,'
DEM = "  for (const [n, c] of dem) if (c !== 1) lech.push(`chia lượt → KB${n} chạy ${c} lần`);\n"
KET = "  viet(lech.length ? `${tongCha} · KHÔNG ĐẠT (${lech.length} lệch)` : `${tongCha} · ĐẠT`);\n  process.exit(lech.length ? 1 : 0);\n"

# (tên, cách chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], [mẫu — PHẢI khớp hết], kết quả mong đợi)
DOT_BIEN = [
  # ── chay.js / kich_ban.js — cơ chế chia lượt, bắt bằng ca của thu_gia_lap ──
  ('BV-cha-bo-luot', 'thugl', [(CH, 'LUOT.filter((l) => l.includes(DEN_KB)) : LUOT;',
                                'LUOT.filter((l) => l.includes(DEN_KB)) : LUOT.slice(1);', 1)],
   [r'✗ thoát 0, dòng tổng đúng', r'✗ T2 '], 'BẮT'),
  ('VS-kb-hai-luot', 'thugl', [(KB, L1, '[[2, 5, 15, 17, 28]', 1)], [r'✗ thoát 0, dòng tổng đúng', r'chia lượt → KB5 chạy 2 lần'], 'BẮT'),
  # KB5 hai lượt + KB6 không lượt nào: N vẫn 29 — dòng tổng chỉ đỏ nhờ phép "đúng một lần" của cha.
  ('VS-luot-trung-thieu', 'thugl', [(KB, L1, '[[2, 5, 15, 17, 28]', 1), (KB, L3, '[1, 4, 5, 7, 8,', 1)],
   [r'✗ thoát 0, dòng tổng đúng .* — thoát 1 · Giả lập: 29 kịch bản', r'chia lượt → KB6 chạy 0 lần'], 'BẮT'),
  ('BV-cha-kiem-mot-lan', 'thugl', [(CH, DEM, '', 1), (KB, L1, '[[2, 5, 15, 17, 28]', 1), (KB, L3, '[1, 4, 5, 7, 8,', 1)],
   [r'✗ T2 '], 'BẮT'),
  ('VS-cha-nuot-ma-thoat', 'thugl', [(CH, KET, "  viet(`${tongCha} · ĐẠT`);\n  process.exit(0);\n", 1)], [r'✗ M1 ', r'✗ M13 '], 'BẮT'),
  ('VS-cha-in-lai-tong-con', 'thugl', [(CH, '    if (t) viet(t[0]);\n',
                                        "    if (t) viet(t[0].replace(/^Lượt \\d+: KB ([\\d,]*) · /, (_, ds) => `Giả lập: ${ds.split(',').length} kịch bản · `));\n", 1)],
   [r'✗ đúng MỘT dòng "Giả lập'], 'BẮT'),
  ('BV-cha-khong-dung-con-SIGTERM', 'thugl', [(CH, "    for (const r of kq) if (r.ma === undefined) r.con.kill('SIGTERM');\n", '', 1)], [r'✗ T3 '], 'BẮT'),
  ('BV-cha-khong-dung-con-khi-sap', 'thugl', [(CH, '      else if (ma !== 0 && ma !== 1) dungHet(', '      else if (false) dungHet(', 1)], [r'✗ T4 '], 'BẮT'),
  ('BV-con-khong-theo-doi-cha', 'thugl', [(CH, "  process.on('disconnect', () => process.exit(2));", '', 1)], [r'✗ T5 '], 'BẮT'),
  # Soát vòng 2 (chập chờn tái hiện dưới tải: con bị SIGKILL sau 10 s / chết trước khi cài xử lý tín hiệu → sót kho): cha tạo + dọn
  # kho từng lượt. Bỏ phần dọn của cha → T6 TẤT ĐỊNH (kho có trước khi con kịp khởi động, con chết theo mặc định — không ai dọn).
  ('BV-cha-khong-don-kho', 'thugl', [(CH, "  process.on('exit', () => khoCon.forEach(", "  if (0) process.on('exit', () => khoCon.forEach(", 1)], [r'✗ T6 '], 'BẮT'),
  # A2: --kho phải là gia_lap_xxxxxx ngay trong thư mục tạm (con xoá nó lúc thoát) — bỏ phép → con nhận thư mục lạ, T7 bắt.
  ('BV-kho-khong-kiem', 'thugl', [(CH, 'if (KHO && !(path.dirname', 'if (0 && KHO && !(path.dirname', 1)], [r'✗ T7 '], 'BẮT'),
  # Soát vòng 1 (K5): --den-kb 0 = lượt rỗng (khởi động + dựng) như trước chia lượt — bỏ nhánh đó thì T0 bắt.
  ('BV-den-kb-0-luot-rong', 'thugl', [(CH, 'const chon = DEN_KB < 1 ? LUOT.slice(0, 1) : rut', 'const chon = rut', 1),
    (CH, 'const phai = DEN_KB < 1 ? [] : rut', 'const phai = rut', 1)], [r'✗ T0 '], 'BẮT'),
  # Soát vòng 2: hai phép của cha chưa có đột biến. Một lượt kiểm thiếu bất biến (8) → chỉ phép "số bất biến các lượt khác nhau" bắt
  # (cha lấy M của lượt đầu = 16 → dòng tổng vẫn đúng chữ). Con giấu dòng lệch mà thoát 1 → phép "thoát 1 không kèm kết quả" + E2.
  ('VS-luot-thieu-bat-bien', 'thugl', [(CH, 'const tenBB = Object.keys(BAT_BIEN);', 'const tenBB = Object.keys(BAT_BIEN).slice(0, LUOT_K === 2 ? 8 : 99);', 1)],
   [r'✗ thoát 0, dòng tổng đúng .* — thoát 1 · Giả lập: 29 kịch bản · 16 bất biến', r'chia lượt → số bất biến các lượt khác nhau'], 'BẮT'),
  ('VS-con-giau-dong-lech', 'thugl', [(CH, "  if (lech.length) { lech.forEach((l) => viet('  ✗ ' + l)); viet(", '  if (lech.length) { viet(', 1)],
   [r'✗ M1 .* — thoát 1 · Giả lập: 0 kịch bản · 0 bất biến · KHÔNG ĐẠT .*không có dòng lệch bất biến'], 'BẮT'),   # cha không tin lượt thoát 1 không kèm dòng lệch
  ('VS-luot-tuan-tu', 'thugl', [(CH, '  await Promise.all(chon.map(mo));\n', '  for (const l of chon) await mo(l);\n', 1)], [r'✗ T1 '], 'BẮT'),
  ('VS-dong-lech-so-trong-luot', 'thugl', [(CH, '        lech.push(`KB${i + 1} → ${ten}: ${l}`);', '        lech.push(`KB${daChay.length} → ${ten}: ${l}`);', 1)],
   [r'✗ M1 '], 'BẮT'),
  # ── máy chủ (C2, quà % có trần) — bắt bằng KB29 ──
  ('VS-SRV-qua-viet-cung-fixed', 'gl29', [(LY, '[code, reward.discount_type, reward.discount_value,', "[code, 'fixed', reward.discount_value,", 1)],
   [r'KB29 → HTTP: ', r'KB29 → I12: '], 'BẮT'),
  ('VS-SRV-qua-bo-tran', 'gl29', [(LY, 'reward.max_discount || 0,', '0,', 1)], [r'KB29 → HTTP: bán 35\.000', r'KB29 → I12: '], 'BẮT'),
  ('BV-SRV-ban-bo-ap-tran', 'gl29', [(OR, 'codeRecord?.max_discount > 0 &&', 'false &&', 1)], [r'KB29 → HTTP: bán 35\.000'], 'BẮT'),
  # Soát vòng 1: dời ngưỡng trần ±n (dựng tay: +3000 SỐNG khi KB29 chỉ có ca xa ngưỡng) — ca 15.000 ±1đ quanh trần bắt.
  ('VS-SRV-tran-doi-nguong-tren', 'gl29', [(OR, 'finalDiscountAmount > codeRecord.max_discount', 'finalDiscountAmount > codeRecord.max_discount + 1', 1)],
   [r'KB29 → HTTP: quà trần 7\.499'], 'BẮT'),
  ('VS-SRV-tran-doi-nguong-duoi', 'gl29', [(OR, 'finalDiscountAmount > codeRecord.max_discount', 'finalDiscountAmount > codeRecord.max_discount - 2', 1)],
   [r'KB29 → HTTP: quà trần 7\.501'], 'BẮT'),
  ('VS-SRV-tran-luon-ap', 'gl29', [(OR, 'finalDiscountAmount > codeRecord.max_discount', 'true', 1)], [r'KB29 → HTTP: bán 10\.000'], 'BẮT'),
]

LENH = {'thugl': (['node', 'cong_cu/thu_gia_lap.js'], 300), 'gl29': (['node', CH, '--den-kb', '29'], 200)}


def dung_ban_sao(tam):
  k = os.path.join(tam, 'kho')
  for x in ('server', 'cong_cu', 'tu_chay/cau_hinh.json', 'kiem_tra_truoc_khi_giao.js'):
    n, d = os.path.join(GOC, x), os.path.join(k, x)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    if os.path.isdir(n): shutil.copytree(n, d, symlinks=False)
    else: shutil.copy2(n, d)
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))   # chỉ đọc
  return k


def ap(k, doi, tam):
  for f, cu, moi, n in doi:
    p = os.path.join(k, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tam) + os.sep): return f'{f}: đích ghi ra ngoài thư mục tạm — không ghi'
    s = open(p, encoding='utf-8').read()
    if s.count(cu) != n: return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
  return ''


def cham(db):
  ten, cach, doi, mau, mong = db
  argv, gio = LENH[cach]
  tam = tempfile.mkdtemp(prefix='tachgl_')
  t0 = time.time()
  try:
    k = dung_ban_sao(tam)
    loi = ap(k, doi, tam)
    if loi: return dict(ten=ten, kq='HỎNG', mong=mong, giay=0, chi=loi)
    t = os.path.join(tam, 'tmp')
    os.makedirs(t)
    e = {x: os.environ[x] for x in ('PATH', 'HOME', 'LANG', 'LC_ALL') if x in os.environ}
    e['TMPDIR'] = t
    try:
      r = subprocess.run(argv, cwd=k, env=e, capture_output=True, text=True, timeout=gio)
    except subprocess.TimeoutExpired:
      return dict(ten=ten, kq='TREO', mong=mong, giay=round(time.time() - t0), chi=f'quá {gio} s')
    ra = (r.stdout + r.stderr).splitlines()
    if r.returncode == 0: kq, chi = 'SỐNG', 'thoát 0'
    else:
      thay = [next((l.strip() for l in ra if re.search(m, l)), None) for m in mau]
      kq = 'BẮT' if all(thay) else 'LẠC'
      chi = ' | '.join(x[:200] for x in thay if x) or (ra[-1].strip()[:200] if ra else '(không in gì)')
      if kq == 'LẠC': chi += ' · thiếu mẫu: ' + ', '.join(m for m, x in zip(mau, thay) if not x) + ' · ' + ' | '.join(l.strip()[:160] for l in ra if '✗' in l)[:600]
    return dict(ten=ten, kq=kq, mong=mong, giay=round(time.time() - t0), chi=chi)
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def main():
  a = sys.argv[1:]
  j = 2   # 3 thu_gia_lap cùng lúc làm C3 (đo giờ) đỏ oan — đo 10.10
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  if len({d[0] for d in DOT_BIEN}) != len(DOT_BIEN): print('tên đột biến trùng'); return 2
  ds = [d for d in DOT_BIEN if not a or any(t == d[0] or (t.endswith('*') and d[0].startswith(t[:-1])) for t in a)]
  if not ds: print('không có đột biến nào khớp', a); return 2
  t0 = time.time()
  cach = sorted({d[1] for d in ds})
  print(f'TACH-GL dot_bien: {len(ds)} đột biến · -j {j} · kiểm sạch {len(cach)} cách chạy ({", ".join(cach)})', flush=True)
  with ThreadPoolExecutor(max_workers=j) as ex:
    sach = list(ex.map(lambda c: cham((f'sạch:{c}', c, [], [], 'SỐNG')), cach))
  hong = [r for r in sach if r['kq'] != 'SỐNG']
  for r in hong: print(f"  ✗ KIỂM SẠCH {r['ten']}: {r['kq']} · {r['chi']}")
  if hong: print('  DỪNG — bản sao không đột biến đã đỏ'); return 4
  with ThreadPoolExecutor(max_workers=j) as ex:
    kq = []
    for r in ex.map(cham, ds):
      kq.append(r)
      print(f"{'✓' if r['kq'] == r['mong'] else '✗'} {r['kq']:4} (mong {r['mong']})  {r['ten']}  ({r['giay']} s) · {r['chi']}", flush=True)
  sai = [r for r in kq if r['kq'] != r['mong']]
  dem = {x: sum(r['kq'] == x for r in kq) for x in ('BẮT', 'LẠC', 'SỐNG', 'HỎNG', 'TREO')}
  print(f"\n  tổng {len(kq)} · " + ' · '.join(f'{x} {v}' for x, v in dem.items()) + f" · đúng mong đợi {len(kq) - len(sai)}/{len(kq)} · {round(time.time() - t0)} s")
  return 1 if sai else 0


if __name__ == '__main__':
  sys.exit(main())
