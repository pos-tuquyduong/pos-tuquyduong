#!/usr/bin/env python3
# HOC-2 — đột biến của chính việc này. Chạy lại: python3 viec/HOC-2/dot_bien.py [tiền tố tên …]
# Mỗi đột biến: chép tu_chay/ + các file bài thử đọc sang thư mục tạm (có server/ rỗng để bài chạy đủ phần cần kho:
# A2 soi cong_cu/gia_lap/chay.js, B2 chạy cong_cu/ban_sao_goc.py), thay ĐÚNG MỘT chuỗi, chạy bài thử của bản chép.
# Mong: M0-* XANH; mọi đột biến ĐỎ ở dòng ✗ chứa chuỗi cột cuối. VS- = vá sai, BV- = bỏ vá. Không đụng kho thật.
# Chuỗi tìm không có đúng 1 lần → LỖI (HỎNG), không tính.
import os, shutil, subprocess, sys, tempfile

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHEP = ['tu_chay', 'cong_cu/ban_sao_goc.py', 'cong_cu/gia_lap/chay.js', 'kiem_tra_truoc_khi_giao.js', 'CLAUDE.md',
        'KHUON_LOI.md', '.github/workflows/keep-alive.yml']
CG, CH, NG, BS = 'tu_chay/cong.js', 'tu_chay/cau_hinh.json', 'tu_chay/nguoi_gac.js', 'cong_cu/ban_sao_goc.py'
DB = [
    # tên, file, tìm, thay, bài thử, chuỗi phải có trong dòng ✗
    ('M0-cong', None, None, None, 'thu_cong.js', None),
    ('M0-gac', None, None, None, 'thu_nguoi_gac.js', None),
    ('M0-cc', None, None, None, 'thu_cong_cu.js', None),
    # A16 — bằng chứng khớp số ca (cong.js chay)
    ('BV-A16-bo-khoi', CG, 'if (!mien && doGoc.length) {', 'if (false) {', 'thu_cong.js', 'HOC-2 A16 thêm 1 ca'),
    ('VS-A16-mien-van-ap', CG, 'if (!mien && doGoc.length) {', 'if (doGoc.length) {', 'thu_cong.js', 'HOC-2 A16 K5 phiếu miễn'),
    ('VS-A16-dong-dau', CG, ".replace(/\\x1b\\[[0-9;]*m/g, '').split('\\n')) {", ".replace(/\\x1b\\[[0-9;]*m/g, '').split('\\n').reverse()) {",
     'thu_cong.js', 'lấy dòng tổng CUỐI'),
    ('VS-A16-bo-mau', CG, "String(ra).replace(/\\x1b\\[[0-9;]*m/g, '')", 'String(ra)', 'thu_cong.js', 'kèm mã màu'),
    ('VS-A16-bo-thieu-dong', CG, "if (!ghiCa.has(p)) doLy('A16'", "if (false) doLy('A16'", 'thu_cong.js', 'thiếu dòng SỐ CA'),
    # A17 — tên đột biến có trong trang_thai (cong.js tinh)
    ('BV-A17-bo', CG, "if (thieuTen.length) doLy('A17'", "if (false) doLy('A17'", 'thu_cong.js', 'HOC-2 A17 tên đột biến M2'),
    ('VS-A17-bo-ranh-gioi', CG, 'if (!chu(tt[i - 1]) && !chu(tt[i + t.length])) return true;', 'return true;', 'thu_cong.js', 'HOC-2 A17 tên đột biến M2'),
    # A18 — VÁ SAI bắt buộc (cong.js tinh)
    ('BV-A18-bo', CG, "if (doiChay.length && !mien && !tenDB.some((t) => t.startsWith('VS-'))) {", 'if (false) {', 'thu_cong.js', 'HOC-2 A18 đổi server/'),
    ('VS-A18-chi-server', CG, "/^(server|client\\/src)\\//.test(f.p)", "/^server\\//.test(f.p)", 'thu_cong.js', 'HOC-2 A18 đổi client/src/'),
    ('VS-A18-bo-xoa', CG, 'doi.filter((f) => /^(server', "doi.filter((f) => f.st !== 'D' && /^(server", 'thu_cong.js', 'HOC-2 A18 xoá file server/'),
    ('VS-A18-mien-van-ap', CG, 'if (doiChay.length && !mien && ', 'if (doiChay.length && ', 'thu_cong.js', 'HOC-2 A18 K5 (Q4)'),
    # A2, A7 — cấu hình
    ('VS-A2-them-khoa', CH, '{\n  "lenh_bai_thu"', '{\n  "app": "POS",\n  "lenh_bai_thu"', 'thu_cong.js', 'HOC-2 A2'),
    ('VS-A7-bo-P26b', CH, ', "cong_cu/thu_P26b.js"]', ']', 'thu_nguoi_gac.js', 'thu_P26b'),
    # B1 — khoá tập công cụ (bài đọc mã nguồn người gác)
    ('VS-B1-them-la', NG, "const CONG_CU_SUA = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);",
     "const CONG_CU_SUA = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Edit2']);", 'thu_nguoi_gac.js', 'khoá tập CONG_CU_SUA'),
    # B2 — cong_cu/ban_sao_goc.py
    ('VS-B2-bo-kiem-kho', BS, 'if trong(dich, kho) or trong(kho, dich):', 'if False:', 'thu_nguoi_gac.js', 'đích trong kho'),
    ('VS-B2-bo-kiem-tam', BS, 'if not trong(dich, tam) or dich == tam:', 'if False:', 'thu_nguoi_gac.js', 'ngoài thư mục tạm'),
    ('VS-B2-de-thu-muc', BS, 'if os.path.lexists(dich) and (not os.path.isdir(dich) or os.listdir(dich)):', 'if False:', 'thu_nguoi_gac.js', 'không rỗng'),
    ('VS-B2-cay-lam-viec', BS, "['git', 'archive', '--format=tar', sha, 'server']", "['tar', '-c', 'server']", 'thu_nguoi_gac.js', 'đúng byte commit'),
    # E3 — tài liệu, phiên bản
    ('VS-E3-phien-ban-cu', 'tu_chay/PHIEN_BAN', 'tu-chay 1.4.0', 'tu-chay 1.3.2', 'thu_nguoi_gac.js', 'PHIEN_BAN'),
    ('VS-E3-skill-bo-VS', 'tu_chay/skill_lam_viec.md', 'một đột biến `VS-…` (vá sai', 'một đột biến (vá sai', 'thu_cong_cu.js', 'HOC-2 E3a'),
    ('VS-E3-ra-soat-bo-dem', 'tu_chay/lenh_ra_soat.md', 'Đối chiếu ĐỦ từng mục nghiệm thu', 'Đối chiếu vài mục', 'thu_cong_cu.js', 'HOC-2 E3 lenh_ra_soat'),
]


def chay(ten, f, tim, thay, bai, phai):
    tam = tempfile.mkdtemp(prefix='hoc2_db_')
    try:
        for c in CHEP:
            nguon, dich = os.path.join(GOC, c), os.path.join(tam, c)
            os.makedirs(os.path.dirname(dich), exist_ok=True)
            (shutil.copytree if os.path.isdir(nguon) else shutil.copyfile)(nguon, dich)
        os.makedirs(os.path.join(tam, 'server'))
        if f:
            p = os.path.join(tam, f)
            s = open(p, encoding='utf8').read()
            if s.count(tim) != 1:
                return f'LỖI — chuỗi tìm có {s.count(tim)} lần trong {f}'
            open(p, 'w', encoding='utf8').write(s.replace(tim, thay))
        r = subprocess.run(['node', os.path.join(tam, 'tu_chay', bai)], cwd=tam, capture_output=True, text=True, timeout=900)
        hong = [l.strip() for l in (r.stdout + r.stderr).splitlines() if l.strip().startswith('✗')]
        if not f:
            return 'XANH (đối chứng đúng)' if r.returncode == 0 else 'ĐỎ — đối chứng hỏng: ' + ' | '.join(hong[:3])[:300]
        if r.returncode == 0:
            return 'XANH — đột biến SỐNG'
        dung = [h for h in hong if phai in h]
        return (f'ĐỎ đúng chỗ — {len(dung)} dòng có "{phai}": ' if dung else 'ĐỎ nhưng SAI chỗ: ') + ' | '.join((dung or hong)[:2])[:300]
    finally:
        shutil.rmtree(tam, ignore_errors=True)


chon = sys.argv[1:]
for ten, f, tim, thay, bai, phai in DB:
    if chon and not any(ten.startswith(c) for c in chon):
        continue
    print(f'{ten} [{bai}] → {chay(ten, f, tim, thay, bai, phai)}', flush=True)
