#!/usr/bin/env python3
"""P16 — đột biến cho client/src/utils/inPhieu.js: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/P16/dot_bien.py [tên...]

Mỗi đột biến: CHÉP THẬT inPhieu.js vào thư mục tạm (không symlink), sửa bản chép, chạy
`node cong_cu/thu_P16.js --file <bản chép>`. ĐỐI CHỨNG trước: bản chưa đột biến phải xanh.
Bắt = thoát 1 VÀ có dòng tổng "n đạt · m hỏng" (m > 0) VÀ có dòng "✗" khớp `bat`. Bài sập (thoát 2) không phải bắt.
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))
NGUON = os.path.join(GOC, 'client', 'src', 'utils', 'inPhieu.js')
BAI = os.path.join(GOC, 'cong_cu', 'thu_P16.js')

# (tên, chuỗi gốc, chuỗi thay, số lần khớp, regex dòng ✗ phải thấy)
DOT_BIEN = [
  ('VS-P16-SO-BAN-NOI-TRAN', "Math.min(SO_BAN_TOI_DA, Math.max(1,", "Math.min(SO_BAN_TOI_DA + 1, Math.max(1,", 1, r'✗ C14 '),
  ('VS-P16-SO-BAN-HA-SAN', "Math.min(SO_BAN_TOI_DA, Math.max(1, Math.floor(n)))", "Math.min(SO_BAN_TOI_DA, Math.max(0, Math.floor(n)))", 1, r'✗ C11 '),
  ('VS-P16-TEM-MOT-TEM-MOI-DONG', "for (let i = 1; i <= n; i++) {", "for (let i = 1; i <= Math.min(n, 1); i++) {", 1, r'✗ A1 '),
  ('VS-P16-GOP-BO-GHI-CHU', "const khoa = `${m.product_code || m.product_name}\\u0000${ghiChu}`;", "const khoa = `${m.product_code || m.product_name}`;", 1, r'✗ B[12] '),
  ('VS-P16-GHI-CHU-CHI-NOTE', "String(m.note ?? m.notes ?? '').trim()", "String(m.note ?? '').trim()", 1, r'✗ A11 '),
  ('VS-P16-CAT-TEM-SAI-NGUONG', "s.length > TEM_TOI_DA_KY_TU", "s.length >= TEM_TOI_DA_KY_TU", 1, r'✗ A20 '),
  ('VS-P16-KHACH-LE-VAN-IN', "ten && ten !== KHACH_LE ? ten : ''", "ten", 1, r'✗ A9 '),
  ('VS-P16-SDT-LO-DU-SO', "sdt.slice(-4)", "sdt", 1, r'✗ A4 '),
  ('VS-P16-LOC-GOI-NHAM-ID-0', "Number(m.product_id) < 0)", "Number(m.product_id) <= 0)", 1, r'✗ A14c '),
  ('BV-P16-LOC-GOI-BO-HAN', "if (Number(m.product_id) < 0) return false;", "", 1, r'✗ A1[23] '),
  ('BV-P16-LOC-NHOM', "return !(nhom && cfg.khong_pha.includes(nhom));", "return true;", 1, r'✗ A15 '),
  ('BV-P16-CO-IN-LAI', "return { kieu: 'pha_che', ma: String(don?.code || ''), gio: gioHHmm(don?.created_at), dong: [...gop.values()], inLai };",
   "return { kieu: 'pha_che', ma: String(don?.code || ''), gio: gioHHmm(don?.created_at), dong: [...gop.values()], inLai: false };", 1, r'✗ (B9|E2) '),
  ('BV-P16-CHON-LOAI', "if (loai ? !loai.includes(ten) : !cfg[ten].bat) continue;", "if (!cfg[ten].bat) continue;", 1, r'✗ E3 '),
  ('BV-P16-BO-JOB-RONG', "if (trang.length) viec.push(", "if (true) viec.push(", 1, r'✗ D7 '),
  ('VS-P16-TU-MO-BO-QUA-GIA-TRI-LUU', "tu_mo: luu.tu_mo === undefined ? D.tu_mo : !!luu.tu_mo,", "tu_mo: D.tu_mo,", 1, r'✗ C19 '),
  ('VS-P16-KHONG-PHA-GIU-RAC', "luu.khong_pha.filter((g) => typeof g === 'string')", "luu.khong_pha", 1, r'✗ C21 '),
  ('VS-P16-TEN-MON-KHONG-CAT', "ten: cat(String(m.product_name || '')),", "ten: String(m.product_name || ''),", 1, r'✗ A23 '),
  ('VS-P16-GIO-KHONG-DEM-0', "m[1].padStart(2, '0') + ':' + m[2]", "m[1] + ':' + m[2]", 1, r'✗ A24 '),
  ('VS-P16-LY-LAM-TRON-LEN', "Math.floor(Number(m.quantity))", "Math.round(Number(m.quantity))", 1, r'✗ A26 '),
  ('VS-P16-TEN-KHACH-KHONG-TRIM', "const ten = String(don?.customer_name || '').trim();", "const ten = String(don?.customer_name || '');", 1, r'✗ A25 '),
  ('BV-P16-DON-HUY-VAN-IN-TEM', "if (ten !== 'bill' && don?.status === 'cancelled') continue;", "", 1, r'✗ D(9|10) '),
  ('VS-P16-NHAN-SO-BAN-TUNG-TRANG', "const trang = Array.from({ length: cfg[ten].ban }, () => moi).flat();", "const trang = moi.flatMap((x) => Array.from({ length: cfg[ten].ban }, () => x));", 1, r'✗ D4 '),
]


def chay(file_in):
    r = subprocess.run(['node', BAI, '--file', file_in], cwd=GOC, capture_output=True, text=True, timeout=120)
    return r.returncode, r.stdout + r.stderr


def main():
    chon = set(sys.argv[1:])
    goc = open(NGUON, encoding='utf-8').read()
    tmp = tempfile.mkdtemp(prefix='dot_bien_p16_')
    try:
        real = os.path.realpath(tmp)
        if real.startswith(GOC + os.sep):
            print('✗ thư mục tạm nằm trong kho'); return 2
        f = os.path.join(tmp, 'inPhieu.js')
        shutil.copyfile(NGUON, f)
        ma, ra = chay(f)
        if ma != 0 or not re.search(r'^\d+ đạt · 0 hỏng', ra, re.M):
            print('✗ ĐỐI CHỨNG đỏ — bản chưa đột biến phải xanh\n' + ra); return 2
        print('✓ đối chứng xanh')
        sot = 0
        for ten, a, b, so, bat in DOT_BIEN:
            if chon and ten not in chon: continue
            if goc.count(a) != so:
                print(f'✗ {ten}: neo khớp {goc.count(a)} lần (cần {so}) — đột biến LẠC'); sot += 1; continue
            open(f, 'w', encoding='utf-8').write(goc.replace(a, b))
            ma, ra = chay(f)
            tong = re.search(r'^(\d+) đạt · (\d+) hỏng', ra, re.M)
            bi_bat = ma == 1 and tong and int(tong.group(2)) > 0 and re.search(bat, ra) and 'sập' not in ra
            print(('✓ BẮT ' if bi_bat else '✗ SỐNG ') + ten + (f'  ({tong.group(2)} ca đỏ)' if tong else ''))
            if not bi_bat: sot += 1
        print(f'\nđột biến: {sot} sống')
        return 1 if sot else 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
