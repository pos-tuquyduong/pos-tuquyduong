#!/usr/bin/env python3
"""ban_sao_goc.py — dựng bản sao server/ của MỘT commit để chạy bài thử --may-chu trên code gốc (HOC-2 B2, bài học P26b).

    python3 cong_cu/ban_sao_goc.py <commit> <thư mục đích>
    node cong_cu/thu_P26b.js --may-chu <thư mục đích>/server

Chỉ đọc git (rev-parse, archive) — không ghi ref, chỉ mục hay cây làm việc. Đích: nằm dưới thư mục tạm của hệ thống
(TMPDIR; thư mục nháp của Claude ở dưới đó), KHÔNG trong kho, chưa có hoặc rỗng — không đè gì. node_modules của bản
sao là liên kết tới node_modules của kho. Bài thử: tu_chay/thu_nguoi_gac.js (baiBanSaoGoc).
"""
import os
import subprocess
import sys
import tempfile


def loi(s):
    print('✗ ban_sao_goc: ' + s, file=sys.stderr)
    sys.exit(1)


def trong(con, cha):
    return con == cha or con.startswith(cha.rstrip(os.sep) + os.sep)


if len(sys.argv) != 3:
    loi('cách dùng: python3 cong_cu/ban_sao_goc.py <commit> <thư mục đích>')
commit, dich = sys.argv[1], os.path.realpath(sys.argv[2])
r = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
if r.returncode:
    loi('không đứng trong kho git')
kho = os.path.realpath(r.stdout.strip())
r = subprocess.run(['git', 'rev-parse', '--verify', '-q', commit + '^{commit}'], cwd=kho, capture_output=True, text=True)
if r.returncode:
    loi(f'không có commit "{commit}"')
sha = r.stdout.strip()
tam = os.path.realpath(tempfile.gettempdir())
if not trong(dich, tam) or dich == tam:
    loi(f'đích {dich} phải nằm dưới thư mục tạm {tam}')
if trong(dich, kho) or trong(kho, dich):
    loi(f'đích {dich} nằm trong kho {kho} — bản sao không được để trong kho')
if os.path.lexists(dich) and (not os.path.isdir(dich) or os.listdir(dich)):
    loi(f'đích {dich} đã có và không rỗng — không đè')
a = subprocess.run(['git', 'archive', '--format=tar', sha, 'server'], cwd=kho, capture_output=True)
if a.returncode:
    loi('git archive hỏng: ' + a.stderr.decode('utf-8', 'replace').strip())
os.makedirs(dich, exist_ok=True)
if subprocess.run(['tar', '-x', '-C', dich], input=a.stdout).returncode:
    loi('tar -x hỏng')
nm = os.path.join(kho, 'node_modules')
if os.path.isdir(nm):
    os.symlink(nm, os.path.join(dich, 'node_modules'))
print(f'✓ server/ của {sha[:12]} → {dich}/server')
print(f'  dùng: --may-chu {dich}/server')
