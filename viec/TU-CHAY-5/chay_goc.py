#!/usr/bin/env python3
"""TU-CHAY-5 — bằng chứng đỏ trên GỐC như cổng A11: `git archive <gốc>` vào thư mục tạm + bài thử của cây làm việc (HEAD) + nối
node_modules, chạy từng bài, in mã thoát + dòng tổng + các dòng ✗. Chạy ở GỐC kho, KHÔNG chạy lệnh khác song song:

    python3 viec/TU-CHAY-5/chay_goc.py [gốc=5ad35ea]
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOC = sys.argv[1] if len(sys.argv) > 1 else '5ad35ea'
BAI = ['tu_chay/thu_nguoi_gac.js', 'tu_chay/thu_cong.js', 'tu_chay/thu_cong_cu.js', 'cong_cu/thu_gia_lap.js']
TONG = re.compile(r'\d+ đạt · \d+ hỏng|\d+ phép · \d+ chỗ hỏng|\d+/\d+ ca người gác')

for p in BAI:
  tam = tempfile.mkdtemp(prefix='tuchay5_goc_')
  try:
    a = subprocess.run(['git', 'archive', MOC], cwd=GOC, capture_output=True, check=True)
    subprocess.run(['tar', '-x', '-C', tam], input=a.stdout, check=True)
    shutil.copy2(os.path.join(GOC, p), os.path.join(tam, p))
    for d in ('.', 'client'):
      nm = os.path.join(GOC, d, 'node_modules')
      if os.path.isdir(nm) and os.path.isdir(os.path.join(tam, d)): os.symlink(nm, os.path.join(tam, d, 'node_modules'))
    e = {x: os.environ[x] for x in ('PATH', 'HOME', 'LANG', 'LC_ALL') if x in os.environ}
    r = subprocess.run(['node', p], cwd=tam, env=e, capture_output=True, text=True, timeout=600)
    ra = (r.stdout + r.stderr).splitlines()
    tong = [l.strip() for l in ra if TONG.search(l)]
    print(f'== {p} trên gốc {MOC}: thoát {r.returncode} · {tong[-1] if tong else "(không in dòng tổng)"}')
    for l in [l for l in ra if '✗' in l][:400]: print('   ' + l.strip()[:220])
  finally:
    shutil.rmtree(tam, ignore_errors=True)
