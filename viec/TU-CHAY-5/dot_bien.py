#!/usr/bin/env python3
"""TU-CHAY-5 — đột biến của chính việc này. Chạy ở GỐC kho, KHÔNG chạy lệnh khác song song:

    python3 viec/TU-CHAY-5/dot_bien.py [tên|tiền tố* …] [-j N]

Mỗi đột biến: chép THẬT (không nối) các thư mục bài thử cần vào thư mục tạm (node_modules nối — chỉ đọc), thay chuỗi (chuỗi gốc
phải khớp ĐÚNG số lần ghi sẵn, không thì HỎNG — K3), kiểm đích ghi nằm trong thư mục tạm (realpath — K5/HOC-2b), rồi chạy bài:
  gac   : node tu_chay/thu_nguoi_gac.js      (B1–B3)       cong : node tu_chay/thu_cong.js   (C1, C2)
  gl    : node cong_cu/thu_gia_lap.js        (D1–D3)       d4   : node viec/LUOI-1/do_thoi_gian.js kb (D4)
  cc    : node tu_chay/thu_cong_cu.js        (skill / tài liệu)
  BẮT = thoát ≠ 0 VÀ MỌI mẫu đều khớp một dòng ra     LẠC = thoát ≠ 0 nhưng thiếu mẫu     SỐNG = thoát 0     TREO = quá giờ
Trước khi chấm, mỗi cách chạy chạy KHÔNG đột biến một lần → phải thoát 0 (đỏ thì dừng, thoát 4). Lệch mong đợi → thoát 1.
Khung chép từ viec/TACH-GL/dot_bien.py.
"""
import os, re, shutil, subprocess, sys, tempfile, time
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NG, CG = 'tu_chay/nguoi_gac.js', 'tu_chay/cong.js'
CH, TG, DO = 'cong_cu/gia_lap/chay.js', 'cong_cu/thu_gia_lap.js', 'viec/LUOI-1/do_thoi_gian.js'
CHEP = ('server', 'cong_cu', 'tu_chay', 'ban_mau_pos', 'viec/LUOI-1', '.github/workflows', 'kiem_tra_truoc_khi_giao.js',
        'KHUON_LOI.md', 'CLAUDE.md', 'CHECKLIST_CODE.md', 'package.json')
LENH = {
  'gac': (['node', 'tu_chay/thu_nguoi_gac.js'], 120),
  'cong': (['node', 'tu_chay/thu_cong.js'], 600),
  'gl': (['node', 'cong_cu/thu_gia_lap.js'], 300),
  'd4': (['node', 'viec/LUOI-1/do_thoi_gian.js', 'kb'], 300),
  'cc': (['node', 'tu_chay/thu_cong_cu.js'], 120),
}
SK = 'tu_chay/skill_lam_viec.md'
IPC = "if (KHO && !process.send) { viet('Giả lập: TỪ CHỐI chạy — --kho chỉ nhận từ tiến trình cha (kênh IPC)'); process.exit(3); }\n"

# (tên, cách chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], [mẫu — PHẢI khớp hết], kết quả mong đợi)
DOT_BIEN = [
  # ── B1 git rm ──
  ('BV-B1-bo-rm', 'gac', [(NG, "    if (sub && sub.chu && sub.val === 'rm') return xetHoanTac(a.slice(i + 1), true, nc, cwd, 'GIT-RM', RM_CO);\n", '', 1)],
   [r'✗ ca Bash "git rm server/a.js": mong CHO, ra CHAN:GIT-LENH'], 'BẮT'),
  ('VS-B1-rm-cho-moi-co', 'gac', [(NG, 'if (bat && !coCho.has(w.val))', 'if (bat && hoanTac && !coCho.has(w.val))', 1)],
   [r'✗ ca Bash "git rm -r server/a.js": mong CHAN:GIT-RM'], 'BẮT'),
  ('VS-B1-rm-mien-hoantac', 'gac', [(NG, 'ghiDuoc(w.val, nc, cwd.d, false, hoanTac)', 'ghiDuoc(w.val, nc, cwd.d, false, true)', 1)],
   [r'✗ ca Bash "git rm server/b.js": mong CHAN:G5-NGOAIPV, ra CHO'], 'BẮT'),
  ('VS-B1-rm-bo-khoLong', 'gac', [(NG, 'const x = !hoanTac && khoLong(', 'const x = false && khoLong(', 1)],
   [r'✗ ca Bash "cd viec/X/long && git rm a.js": mong CHAN:GIT-RM, ra CHO'], 'BẮT'),
  # khoLong không dừng ở ngoài kho → path.dirname('/') = '/' mãi: tiến trình người gác treo, ca tiến trình thật (hạn 10 s) đỏ
  ('VS-B1-khoLong-bo-dung-ngoai-kho', 'gac', [(NG, 'laCon(x, nc.goc) && x !== nc.goc', 'x !== nc.goc', 1)],
   [r'✗ tiến trình: git rm với cwd ngoài kho'], 'BẮT'),
  # ── B2 TaskStop ──
  ('BV-B2-bo-TaskStop', 'gac', [(NG, "'TaskOutput', 'TaskStop',\n", "'TaskOutput',\n", 1)],
   [r'✗ ca công cụ cho qua TaskStop: mong CHO, ra CHAN:CC-LA', r'✗ ca khoá tập CONG_CU_DOC'], 'BẮT'),
  # ── B3 fetch / pull ──
  ('BV-B3-bo-keo', 'gac', [(NG, 'if (sub && sub.chu && Object.hasOwn(KEO_CO, sub.val)) {', 'if (false) {', 1)],
   [r'✗ ca Bash "git fetch origin viec/X": mong CHO, ra CHAN:GIT-LENH', r'✗ TU-CHAY-5 B4|✗ ca Bash "git pull --no-rebase --ff-only origin viec/X"'], 'BẮT'),
  ('VS-B3-pull-thieu-ff-only', 'gac', [(NG, "['--no-rebase', '--ff-only']] };", "['--no-rebase']] };", 1)],
   [r'✗ ca Bash "git pull --no-rebase origin viec/X": mong CHAN:GIT-KEO, ra CHO'], 'BẮT'),
  ('VS-B3-keo-moi-nhanh', 'gac', [(NG, "vt[0] !== 'origin' || vt[1] !== dung)", "vt[0] !== 'origin' || (ma !== 'GIT-KEO' && vt[1] !== dung))", 1)],
   [r'✗ ca Bash "git fetch origin viec/Y": mong CHAN:GIT-KEO, ra CHO'], 'BẮT'),
  ('VS-B3-keo-bo-khoLong', 'gac', [(NG, '  const x = khoLong(d, nc);\n', "  const x = ma === 'GIT-KEO' ? null : khoLong(d, nc);\n", 1)],
   [r'✗ ca Bash "cd viec/X/long && git fetch origin viec/X": mong CHAN:GIT-KEO, ra CHO'], 'BẮT'),
  # ── C1 A19 ──
  ('BV-C1-bo-A19', 'cong', [(CG, '    if (doiCode(moc).length) {', '    if (false) {', 1)],
   [r'✗ TU-CHAY-5 A19 thiếu dòng HEAD ĐÃ KIỂM: phải ĐỎ'], 'BẮT'),
  ('VS-C1-tinh-ca-commit-ho-so', 'cong', [(CG, 'const sau = khop.length === 1 ? doiCode(khop[0]) : [];',
                                           "const sau = khop.length === 1 ? git(thuMuc, 'rev-list', `${khop[0]}..${head}`).split('\\n').filter(Boolean) : [];", 1)],
   [r'✗ TU-CHAY-5 A19 K5 commit hồ sơ sau lần kiểm: phải ĐẠT'], 'BẮT'),
  ('VS-C1-commit-nay-moi-noi', 'cong', [(CG, '\n        && coDong(sau[0]))) {', ')) {', 1)],
   [r'✗ TU-CHAY-5 A19 "\+ commit này" ghi ở commit hồ sơ SAU commit code: phải ĐỎ'], 'BẮT'),
  # soát vòng 2: hai vế từng SỐNG — đọc dòng CUỐI, loại cong.yml
  ('VS-C1-doc-dong-dau', 'cong', [(CG, "( \\+ commit này)?$/gm)].pop();", "( \\+ commit này)?$/gm)][0];", 1)],
   [r'✗ TU-CHAY-5 A19 K5 hai dòng HEAD ĐÃ KIỂM: dòng đầu cũ, dòng cuối đúng: phải ĐẠT'], 'BẮT'),
  ('VS-C1-khong-loai-cong-yml', 'cong', [(CG, ", ':(exclude).github/workflows/cong.yml'", '', 1)],
   [r'✗ TU-CHAY-5 A19 K5 chủ quán cài đổi cả cong.yml sau lần kiểm: phải ĐẠT'], 'BẮT'),
  ('VS-C1-thong-bao-buoc-10', 'cc', [(CG, '(skill bước 11.4)', '(skill bước 10)', 1)], [r'✗ TU-CHAY-5 C1: mọi file tu_chay/ nhắc HEAD ĐÃ KIỂM .*tu_chay/cong\.js:'], 'BẮT'),
  ('VS-C1-khong-loai-claude', 'cong', [(CG, "':(exclude).claude/', ", '', 1)],
   [r'✗ TU-CHAY-5 A19 K5 chủ quán cài \.claude/ sau lần kiểm: phải ĐẠT'], 'BẮT'),
  # soát vòng 1: dòng HEAD ĐÃ KIỂM ghi ở bước 10 (trước bước 11 đổi KHUON_LOI / KHOÁ) → A19 tự đỏ trên luồng của chính skill
  ('VS-C1-skill-ghi-o-buoc-10', 'cc', [(SK, '    không lấy mẫu; còn mục thiếu bằng chứng thì chưa xong.\n',
                                       '    không lấy mẫu; còn mục thiếu bằng chứng thì chưa xong. Ghi `HEAD ĐÃ KIỂM: <SHA>` sau lần kiểm cuối.\n', 1)],
   [r'✗ TU-CHAY-5 C1 skill: "HEAD ĐÃ KIỂM'], 'BẮT'),
  # bước 11 (soát vòng 4): phép quét "bước 10" mở rộng sang MỌI file tu_chay/ — chú thích bài thử cũng bị bắt
  ('VS-C1-chu-thich-thu-cong-buoc-10', 'cc', [('tu_chay/thu_cong.js', 'như skill bước 11.4 dặn', 'như skill bước 10 dặn', 1)],
   [r'✗ TU-CHAY-5 C1: mọi file tu_chay/ .*tu_chay/thu_cong\.js:'], 'BẮT'),
  ('VS-SK-11-dieu-kien', 'cc', [(SK, 'LUÔN — đổi hay không — SAU lần kiểm cuối mới ghi', 'SAU lần kiểm cuối đó mới ghi', 1)],
   [r'✗ TU-CHAY-5 C1 skill 11.4: ghi HEAD ĐÃ KIỂM LUÔN'], 'BẮT'),
  ('VS-SK-12-bo-loai-hoi', 'cc', [(SK, 'có dòng KHÔNG mở đầu `??` (file đã theo dõi đang sửa dở)', 'có dòng nào', 1)],
   [r'✗ TU-CHAY-5 B4 skill 1.2'], 'BẮT'),
  # ── C2 cảnh báo A16 ──
  ('BV-C2-bo-canh-bao', 'cong', [(CG, 'if (g !== null && h !== null && g !== h) {', 'if (false) {', 1)],
   [r'✗ TU-CHAY-5 C2 gốc 2 ca, head 3 ca → cảnh báo nêu cả hai số: lý do có "CẢNH BÁO A16"'], 'BẮT'),
  # soát vòng 3: ba vế của soCa(…, chiCa) — bỏ mã màu · đọc dòng ĐẦU · dạng phép không thành null
  ('VS-C2-bo-mau', 'cong', [(CG, "String(ra).replace(/\\x1b\\[[0-9;]*m/g, '')", 'String(ra)', 1)],
   [r'✗ TU-CHAY-5 C2 gốc in kèm mã màu'], 'BẮT'),
  ('VS-C2-dong-dau', 'cong', [(CG, ".split('\\n')) {\n    let x;", ".split('\\n').reverse()) {\n    let x;", 1)],
   [r'✗ TU-CHAY-5 C2 gốc in hai dòng tổng'], 'BẮT'),
  ('VS-C2-phep-khong-null', 'cong', [(CG, 'n = chiCa ? null : +x[1];', 'n = +x[1];', 1)],
   [r'✗ TU-CHAY-5 C2 K5 gốc in dòng "đạt · hỏng" rồi dòng "phép · chỗ hỏng"'], 'BẮT'),
  ('VS-C2-so-ca-phep', 'cong', [(CG, 'n = +x[1] + (chiCa ? 0 : +x[2]);', 'n = +x[1] + +x[2];', 1)],
   [r'✗ TU-CHAY-5 C2 K5 dạng người gác: chỉ số phép khác đổi → không cảnh báo: KHÔNG có "CẢNH BÁO"'], 'BẮT'),
  # ── D1–D3 giả lập ──
  ('BV-D1-bo-ipc', 'gl', [(CH, IPC, '', 1)], [r'✗ T7c '], 'BẮT'),
  ('BV-D2-bo-dung-het-3', 'gl', [(CH, '      if (ma === 3) dungHet(cuoiCon, 3);\n', '      if (false) dungHet(cuoiCon, 3);\n', 1)],
   [r'✗ D2 lượt con TỪ CHỐI'], 'BẮT'),
  ('BV-D3-chayGL-bo-setEncoding', 'gl', [(TG, "  c.stdout.setEncoding('utf8');   // TU-CHAY-5 D3: Buffer", '  // TU-CHAY-5 D3: Buffer', 1)],
   [r"✗ D3 chayGL: con in 'Lượt'"], 'BẮT'),
  ('BV-D3-theodoi-bo-setEncoding', 'gl', [(TG, "  c.stdout.setEncoding('utf8');   // TU-CHAY-5 D3 (K4)", '  // TU-CHAY-5 D3 (K4)', 1)],
   [r"✗ D3 chayTheoDoi \(cùng khuôn\)"], 'BẮT'),
  # ── D4 công cụ đo ──
  # soát vòng 3: một lượt sập (bản sao chay.js: lượt 2 thoát 2 trước KB đầu) → công cụ phải thoát ≠ 0, không in thiếu mà thoát 0
  ('VS-D4-luot-sap', 'd4', [(CH, '    try { await kb.chay(ctx); }', "    if (LUOT_K === 2) process.exit(2);\n    try { await kb.chay(ctx); }", 1)],
   [r'lượt đo thoát ≠ 0: lượt 2/4'], 'BẮT'),
  # phép ĐẾM riêng (bước 11): lượt 2 bỏ qua KB3 nhưng vẫn thoát 0 → chỉ phép đếm DO KB bắt được
  ('VS-D4-luot-bo-kb', 'd4', [(CH, '    if (!luot.includes(i + 1)) continue;', '    if (!luot.includes(i + 1) || (LUOT_K === 2 && i === 2)) continue;', 1)],
   [r'chỉ 28/29 dòng DO KB'], 'BẮT'),
  # soát vòng 4: lượt 4 thoát 1 SAU khi đã in đủ DO KB (đếm dòng không bắt được) → công cụ phải thoát ≠ 0
  ('VS-D4-luot-thoat-1', 'd4', [(CH, "  const tong = `Lượt ${LUOT_K}", "  if (LUOT_K === 4) process.exit(1);\n  const tong = `Lượt ${LUOT_K}", 1)],
   [r'lượt đo thoát ≠ 0: lượt 4/4'], 'BẮT'),
  ('BV-D4-neo-cu', 'd4', [(DO, "const a3 = '  const tong = `Lượt ';", "const a3 = '  const tong = `Giả lập:';", 1)],
   [r'neo đo không khớp: +const tong = `Giả lập:'], 'BẮT'),
]


def dung_ban_sao(tam):
  k = os.path.join(tam, 'kho')
  for x in CHEP:
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
  tam = tempfile.mkdtemp(prefix='tuchay5_')
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
  j = 2   # 3 thu_gia_lap cùng lúc làm C3 (đo giờ) đỏ oan — đo 10.10 (TACH-GL)
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  if len({d[0] for d in DOT_BIEN}) != len(DOT_BIEN): print('tên đột biến trùng'); return 2
  ds = [d for d in DOT_BIEN if not a or any(t == d[0] or (t.endswith('*') and d[0].startswith(t[:-1])) for t in a)]
  if not ds: print('không có đột biến nào khớp', a); return 2
  t0 = time.time()
  cach = sorted({d[1] for d in ds})
  print(f'TU-CHAY-5 dot_bien: {len(ds)} đột biến · -j {j} · kiểm sạch {len(cach)} cách chạy ({", ".join(cach)})', flush=True)
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
