#!/usr/bin/env python3
# TU-CHAY-4 — đột biến tay vào CHÍNH lưới (E4, F2). Chạy lại: python3 viec/TU-CHAY-4/dot_bien.py [tên đột biến …]
# Đột biến máy chủ (M1–M10) nằm sẵn trong cong_cu/thu_gia_lap.js — file này phá GIẢ LẬP và BỘ KIỂM.
#   gl      : chép cong_cu/gia_lap/ sang kho tạm (server/, tu_chay/, node_modules nối symlink về kho thật), thay ĐÚNG
#             một chuỗi, chạy `node cong_cu/thu_gia_lap.js --gia-lap <bản chép>` → phải ĐỎ, dòng ✗ chứa chuỗi đánh dấu.
#   tai_cho : thay chuỗi trong file THẬT, chạy bộ kiểm, rồi TRẢ LẠI nguyên văn (bản lưu ở thư mục tạm, so lại từng byte).
# M0 (không đột biến) phải XANH. Thay không được (chuỗi không có đúng 1 lần) → LỖI, không tính.
import os, shutil, subprocess, sys, tempfile

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB = [
    # tên, kiểu, file, tìm, thay, chuỗi phải có trong một dòng ✗
    ('M0 giả lập nguyên vẹn', 'gl', None, None, None, None),
    ('E4a I7 luôn trả rỗng', 'gl', 'bat_bien.js', 'async I7(q, ctx) {', 'async I7(q, ctx) { return [];', 'M4'),
    ('E4b bỏ trễ mạng', 'gl', 'chay.js', 'const TRE_MS = 40;', 'const TRE_MS = 0;', 'trễ kho đang bật'),
    ('E4c bỏ kiểm một bất biến', 'gl', 'chay.js', 'const tenBB = Object.keys(BAT_BIEN);',
     'const tenBB = Object.keys(BAT_BIEN).slice(0, 8);', 'dòng tổng đúng'),
    ('E4d bỏ một kịch bản', 'gl', 'kich_ban.js', 'module.exports = { KICH_BAN,',
     'module.exports = { KICH_BAN: KICH_BAN.slice(0, 10),', 'dòng tổng đúng'),
    ('E4e A1 bỏ một tên biến khoá', 'gl', 'chay.js', '|SX_API_KEY|', '|', 'SX_API_KEY'),
    ('E4f A2 bỏ dọn kho tạm', 'gl', 'chay.js', "process.on('exit', () => { try { fs.rmSync(THU_MUC",
     "process.on('khong_bao_gio', () => { try { fs.rmSync(THU_MUC", 'gia_lap_'),
    ('E4g bắt nhầm máy chủ (đọc cổng SX giả thay cổng POS)', 'gl', 'chay.js', 'http://127.0.0.1:${mayPos.address().port}/api/pos',
     'http://127.0.0.1:${sxMay.address().port}/api/pos', 'dòng tổng đúng'),
    ('F2 bánh cóc: 10 kịch bản', 'tai_cho', 'cong_cu/gia_lap/kich_ban.js', 'module.exports = { KICH_BAN,',
     'module.exports = { KICH_BAN: KICH_BAN.slice(0, 10),', 'bánh cóc giả lập'),
    ('S3 danh sách trắng ví lệch wallets.js', 'tai_cho', 'cong_cu/gia_lap/bat_bien.js', "'refund', 'adjust', 'compensation'];",
     "'refund', 'compensation'];", 'danh sách trắng ví'),
]


def thay(p, tim, moi):
    nd = open(p, encoding='utf-8').read()
    if nd.count(tim) != 1:
        return False
    open(p, 'w', encoding='utf-8').write(nd.replace(tim, moi))
    return True


def dong_do(ra):
    return [l.strip() for l in ra.splitlines() if '✗' in l]


def chay(ten, kieu, f, tim, moi, dau):
    tam = tempfile.mkdtemp(prefix='db_tc4_')
    try:
        if kieu == 'gl':
            gl = os.path.join(tam, 'cong_cu', 'gia_lap')
            shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), gl)
            for x in ('server', 'tu_chay', 'node_modules'):
                os.symlink(os.path.join(GOC, x), os.path.join(tam, x))
            if f and not thay(os.path.join(gl, f), tim, moi):
                return 'LỖI', 'chuỗi không có đúng 1 lần'
            r = subprocess.run(['node', 'cong_cu/thu_gia_lap.js', '--gia-lap', gl], cwd=GOC, capture_output=True, text=True)
        else:
            p = os.path.join(GOC, f)
            luu = os.path.join(tam, 'luu')
            shutil.copy2(p, luu)
            try:
                if not thay(p, tim, moi):
                    return 'LỖI', 'chuỗi không có đúng 1 lần'
                lenh = ['node', 'kiem_tra_truoc_khi_giao.js'] + (['--day-du'] if 'bánh cóc' in dau else [])
                r = subprocess.run(lenh, cwd=GOC, capture_output=True, text=True)
            finally:
                shutil.copy2(luu, p)
                assert open(luu, 'rb').read() == open(p, 'rb').read(), 'KHÔNG trả lại được ' + p
        do = dong_do(r.stdout + r.stderr)
        if dau is None:
            return ('XANH' if r.returncode == 0 and not do else 'ĐỎ'), '; '.join(do)[:300]
        trung = [l for l in do if dau in l]
        # In MỌI dòng ✗ (soát vòng 3): lỗi lạ không được nấp sau lỗi cố ý.
        return ('ĐỎ đúng chỗ' if r.returncode != 0 and trung else 'SAI'), (' | '.join(trung + [l for l in do if l not in trung]))[:900]
    finally:
        shutil.rmtree(tam, ignore_errors=True)


chon = sys.argv[1:]
hong = 0
for ten, kieu, f, tim, moi, dau in DB:
    if chon and not any(c in ten for c in chon):
        continue
    kq, ghi = chay(ten, kieu, f, tim, moi, dau)
    dat = kq == ('XANH' if dau is None else 'ĐỎ đúng chỗ')
    hong += 0 if dat else 1
    print(f"{'✓' if dat else '✗'} {ten}: {kq} — {ghi}", flush=True)
print(f"\n{'XANH' if not hong else 'ĐỎ'} — {hong} đột biến không đạt")
sys.exit(1 if hong else 0)
