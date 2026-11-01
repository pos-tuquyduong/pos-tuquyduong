# TU-CHAY-10 — đột biến cổng A20 (tu_chay/cong.js). Mỗi đột biến: (tên, file, chuỗi tìm, chuỗi thay, ca thu_cong.js phải bắt).
# Cách chạy (cây HEAD giải nén từ `git archive -o <tar> HEAD`, thư mục làm việc ngoài kho):
#   python3 viec/TU-CHAY-10/dot_bien.py <head.tar> <thư mục tạm> [tên …]
# Luật (K3): ĐỐI CHỨNG (không đột biến) phải XANH; mỗi đột biến: chuỗi tìm khớp ĐÚNG 1 lần, bài thử ĐỎ VÀ có dòng ✗ của ca phải bắt
# → BẮT; bài sập / không in dòng tổng ≠ BẮT.
import os, re, shutil, subprocess, sys, tarfile

DB = [
    ('VS-A20-dong-dau', 'tu_chay/cong.js', "matchAll(/^SOÁT BẢO MẬT:.*$/gm)].pop();", "matchAll(/^SOÁT BẢO MẬT:.*$/gm)][0];",
     'TU-CHAY-10 A20 ĐẠT rồi lần soát sau KHÔNG ĐẠT'),
    ('VS-A20-bo-ranh-gioi', 'tu_chay/cong.js', "(có|không)(?![\\p{L}\\p{N}])/iu", "(có|không)/iu", 'TU-CHAY-10 A20 chữ dính'),
    ('VS-A20-bo-hoa-thuong', 'tu_chay/cong.js', "(?![\\p{L}\\p{N}])/iu.exec(baoMat.dau)", "(?![\\p{L}\\p{N}])/u.exec(baoMat.dau)",
     'TU-CHAY-10 A20 K5 "- Có — tiền"'),
    ('VS-A20-chi-tinh', 'tu_chay/cong.js', "const baoMat = mucBaoMat(phieu);", "const baoMat = cheDo === 'tinh' ? mucBaoMat(phieu) : null;",
     'TU-CHAY-10 A20 có + trang_thai thiếu dòng (chay)'),
    ('VS-A20-dat-mot-phan', 'tu_chay/cong.js', "/^SOÁT BẢO MẬT: ĐẠT\\s*$/u", "/^SOÁT BẢO MẬT: /u", 'TU-CHAY-10 A20 có + KHÔNG ĐẠT'),
    ('VS-A20-tieu-de-sat-chu', 'tu_chay/cong.js', "/^#+\\s*soát\\s*bảo\\s*mật/iu", "/^##\\s+Soát bảo mật$/u",
     'TU-CHAY-10 A20 tiêu đề lệch "## Soát Bảo Mật"'),
    ('VS-A20-lay-tieu-de-dau', 'tu_chay/cong.js', "if (gan.length > 1) return", "if (gan.length > 9) return",
     'TU-CHAY-10 A20 hai tiêu đề ## Soát bảo mật'),
    ('BV-A20', 'tu_chay/cong.js', "const baoMat = mucBaoMat(phieu);", "const baoMat = null;",
     'TU-CHAY-10 A20 có + trang_thai thiếu dòng (tinh)'),
]


KHO = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))


def dung(tar, dich):
    # K5 (soát vòng 1): kiểm đích TRƯỚC khi xoá / giải nén, so với gốc kho (không so với thư mục đang đứng)
    thuc = os.path.realpath(dich)
    if thuc == KHO or thuc.startswith(KHO + os.sep):
        sys.exit(f'thư mục tạm {thuc} nằm trong kho {KHO} — dừng, không ghi xuyên vào kho thật')
    if os.path.exists(dich):
        shutil.rmtree(dich)
    os.makedirs(dich)
    with tarfile.open(tar) as t:
        t.extractall(dich)


def chay(dich):
    r = subprocess.run(['node', 'tu_chay/thu_cong.js'], cwd=dich, capture_output=True, text=True, timeout=600)
    ra = r.stdout + r.stderr
    return r.returncode, ra, re.search(r'^thu_cong: \d+ phép · \d+ chỗ hỏng', ra, re.M) is not None


def main():
    tar, tam = sys.argv[1], sys.argv[2]
    chon = sys.argv[3:]
    d = os.path.join(tam, 'doi_chung')
    dung(tar, d)
    ma, ra, tong = chay(d)
    print(f'ĐỐI CHỨNG: thoát {ma} → {"XANH" if ma == 0 and tong else "HỎNG — bỏ cả đợt"}')
    if ma != 0 or not tong:
        print(ra[-2000:])
        sys.exit(1)
    song = 0
    for ten, f, tim, thay, ca in DB:
        if chon and ten not in chon:
            continue
        d = os.path.join(tam, ten)
        dung(tar, d)
        p = os.path.join(d, f)
        s = open(p, encoding='utf-8').read()
        if s.count(tim) != 1:
            print(f'{ten}: LẠC — chuỗi tìm khớp {s.count(tim)} lần')
            song += 1
            continue
        open(p, 'w', encoding='utf-8').write(s.replace(tim, thay))
        ma, ra, tong = chay(d)
        bat = ma != 0 and tong and any(l.startswith('  ✗ ' + ca) for l in ra.split('\n'))
        print(f'{ten}: {"BẮT" if bat else "SỐNG"} (thoát {ma}, ca "{ca}")')
        song += 0 if bat else 1
    sys.exit(1 if song else 0)


main()
