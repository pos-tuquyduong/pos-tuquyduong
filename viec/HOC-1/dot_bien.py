#!/usr/bin/env python3
# HOC-1 — đột biến tay (bước 4–6). Chạy lại: python3 viec/HOC-1/dot_bien.py [tên đột biến …]
# Mỗi đột biến: chép tu_chay/ + vài file nó đọc sang thư mục tạm, thay ĐÚNG MỘT chuỗi trong một file nguồn, chạy bài thử
# của bản chép. Mong đợi: M0 (không đột biến) XANH; mọi đột biến khác ĐỎ ở đúng ca ghi trong cột "ca phải đỏ".
# Không đụng kho thật. Thay không được (chuỗi không có đúng 1 lần) → báo LỖI, không tính.
import os, shutil, subprocess, sys, tempfile

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHEP = ['tu_chay', 'kiem_tra_truoc_khi_giao.js', 'CLAUDE.md', 'KHUON_LOI.md', '.github/workflows/keep-alive.yml']
DB = [
    # tên, file, tìm, thay, bài thử, chuỗi phải có trong dòng ✗
    ('M0-cong', None, None, None, 'thu_cong.js', None),
    ('M0-gac', None, None, None, 'thu_nguoi_gac.js', None),
    ('M0-cc', None, None, None, 'thu_cong_cu.js', None),
    ('M9 cai_dat bỏ phép kiểm muc_gac', 'tu_chay/cai_dat.js', "dung('tu_chay/cau_hinh.json: muc_gac phải",
     "void ('tu_chay/cau_hinh.json: muc_gac phải", 'thu_nguoi_gac.js', 'muc_gac'),
    ('M10 cong.js bỏ throw cấu hình thiếu khoá', 'tu_chay/cong.js', "throw new Error('tu_chay/cau_hinh.json (bản main) thiếu",
     "void ('tu_chay/cau_hinh.json (bản main) thiếu", 'thu_cong.js', 'D2'),
    ('MA1 bỏ miễn (về luật cũ)', 'tu_chay/cong.js', 'if (r.status === 0 && mienCu.has(p))', 'if (false)', 'thu_cong.js', 'HOC-1 A1'),
    ('MA3 bỏ điều kiện "có ở mốc"', 'tu_chay/cong.js', "blob(thuMuc, moc, p) !== null ? ''", "true ? ''", 'thu_cong.js', 'HOC-1 A3'),
    ('MA4 miễn bỏ luôn kiểm xanh trên PR', 'tu_chay/cong.js', 'for (const p of baiThu) {\n      const h',
     'for (const p of baiThu.filter((x) => !mienCu.has(x))) {\n      const h', 'thu_cong.js', 'HOC-1 A4'),
    ('MA6a bỏ kiểm lý do', 'tu_chay/cong.js', '!p || !ly ?', '!p ?', 'thu_cong.js', 'HOC-1 A6'),
    ('MA6b bỏ kiểm thu_*.js', 'tu_chay/cong.js', "!laBaiThu(p) ? 'không phải", "false ? 'không phải", 'thu_cong.js', 'HOC-1 A6'),
    ('MA6c bỏ kiểm "không có trong kho"', 'tu_chay/cong.js', "blob(thuMuc, head, p) === null ? 'không có trong kho'",
     "false ? 'không có trong kho'", 'thu_cong.js', 'HOC-1 A6'),
    ('MX bỏ kiểm "bị PR xoá / đổi tên"', 'tu_chay/cong.js', "st === 'D' ?", 'false ?', 'thu_cong.js', 'duyệt (1)'),
    ('MA7 miễn tính là bài đỏ hợp lệ', 'tu_chay/cong.js', '${mienCu.get(p)}`); //',
     '${mienCu.get(p)}`), doHopLe++; //', 'thu_cong.js', 'HOC-1 A7'),
    ('MB cau_hinh bỏ package.json khỏi file_luat', 'tu_chay/cau_hinh.json', ', "package.json"]', ']', 'thu_nguoi_gac.js', 'package.json'),
    ('MB4 như MB, đo bằng bài thử cổng', 'tu_chay/cau_hinh.json', ', "package.json"]', ']', 'thu_cong.js', 'HOC-1 B4'),
    ('MC T2 về bản cũ (đọc cả thư mục)', 'kiem_tra_truoc_khi_giao.js', '.filter((x) => x.isFile())', '', 'thu_cong_cu.js', 'C'),
]


def chay(ten, f, tim, thay, bai, phai):
    tam = tempfile.mkdtemp(prefix='dot_bien_')
    try:
        for c in CHEP:
            nguon, dich = os.path.join(GOC, c), os.path.join(tam, c)
            os.makedirs(os.path.dirname(dich), exist_ok=True)
            (shutil.copytree if os.path.isdir(nguon) else shutil.copyfile)(nguon, dich)
        if f:
            p = os.path.join(tam, f)
            s = open(p, encoding='utf8').read()
            if s.count(tim) != 1:
                return f'LỖI — chuỗi tìm có {s.count(tim)} lần trong {f}'
            open(p, 'w', encoding='utf8').write(s.replace(tim, thay))
        r = subprocess.run(['node', os.path.join(tam, 'tu_chay', bai)], cwd=tam, capture_output=True, text=True, timeout=900)
        ra = r.stdout + r.stderr
        hong = [l.strip() for l in ra.splitlines() if l.strip().startswith('✗')]
        if not f:
            return 'XANH (đối chứng đúng)' if r.returncode == 0 else 'ĐỎ — đối chứng hỏng: ' + ' | '.join(hong[:3])[:300]
        dung = [h for h in hong if phai in h]
        if r.returncode == 0:
            return 'XANH — đột biến SỐNG'
        return (f'ĐỎ đúng chỗ — {len(dung)} dòng có "{phai}": ' if dung else 'ĐỎ nhưng SAI chỗ: ') + ' | '.join((dung or hong)[:2])[:300]
    finally:
        shutil.rmtree(tam, ignore_errors=True)


chon = sys.argv[1:]
for ten, f, tim, thay, bai, phai in DB:
    if chon and not any(ten.startswith(c) for c in chon):
        continue
    print(f'{ten} [{bai}] → {chay(ten, f, tim, thay, bai, phai)}', flush=True)
