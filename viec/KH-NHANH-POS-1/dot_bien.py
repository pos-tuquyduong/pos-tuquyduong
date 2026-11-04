#!/usr/bin/env python3
"""KH-NHANH-POS-1 — đột biến cho chỗ vá `maxAge` ở server/index.js: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KH-NHANH-POS-1/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KH-NHANH-POS-1/dot_bien.py --liet-ke

Chép server/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink), thay chuỗi (phải khớp ĐÚNG số lần ghi sẵn),
chạy bài thử với --goc <thư mục tạm>. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu. Bài sập / đỏ sai ca = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
F = 'server/index.js'
BAI = 'cong_cu/thu_KHNHANHPOS1.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  ('BV-BO-MAXAGE', [(F, '  maxAge: CORS_NHO_PREFLIGHT_GIAY\n', '', 1)], r'✗ A1 '),
  ('VS-MAXAGE-SAI-SO', [(F, 'const CORS_NHO_PREFLIGHT_GIAY = 7200;', 'const CORS_NHO_PREFLIGHT_GIAY = 720;', 1)], r'✗ A1 '),
  ('VS-MAXAGE-NOI-NGOAI-CORS', [(F, '  maxAge: CORS_NHO_PREFLIGHT_GIAY\n', '', 1),
                                (F, "app.use(express.json({ limit: '5mb' }));", "app.use((req, res, next) => { res.set('Access-Control-Max-Age', '7200'); next(); });\napp.use(express.json({ limit: '5mb' }));", 1)], r'✗ K5b '),
  ('VS-DOI-ORIGIN', [(F, "  origin: '*',", "  origin: true,", 1)], r'✗ B1 '),
  ('VS-DOI-HEADERS', [(F, "allowedHeaders: ['Content-Type', 'Authorization'],", "allowedHeaders: ['Content-Type'],", 1)], r'✗ B3 '),
]


def chay(ten, thays, mau):
    tam = tempfile.mkdtemp(prefix='dotbien_khnhanh_')
    try:
        shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server'))
        os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tam, 'node_modules'))
        os.makedirs(os.path.join(tam, 'data'), exist_ok=True)
        if os.path.exists(os.path.join(GOC, 'package.json')):
            shutil.copy(os.path.join(GOC, 'package.json'), tam)
        if thays:
            for f, cu, moi, n in thays:
                if n == 0:
                    continue
                p = os.path.join(tam, f)
                s = open(p, encoding='utf-8').read()
                if s.count(cu) != n:
                    return 'HỎNG', f'{ten}: chuỗi khớp {s.count(cu)} lần, cần {n}'
                open(p, 'w', encoding='utf-8').write(s.replace(cu, moi))
        r = subprocess.run(['node', os.path.join(GOC, BAI), '--goc', tam], cwd=GOC, capture_output=True, text=True, timeout=120)
        ra = r.stdout + r.stderr
        hong = [l for l in ra.splitlines() if '✗' in l]
        if thays is None:
            return ('ĐỐI CHỨNG XANH', '') if r.returncode == 0 else ('ĐỐI CHỨNG ĐỎ', '\n'.join(hong))
        if r.returncode == 0:
            return 'SỐNG', ''
        if any(re.search(mau, l) for l in hong):
            return 'BẮT', ''
        return 'LẠC', '\n'.join(hong) or ra[-300:]
    finally:
        shutil.rmtree(tam, ignore_errors=True)


def main():
    a = sys.argv[1:]
    if '--liet-ke' in a:
        for t, _, _ in DOT_BIEN:
            print(t)
        return 0
    chon = [d for d in DOT_BIEN if not a or d[0] in a]
    kq, tt = chay('ĐỐI CHỨNG', None, ''), 0
    print(f'  {kq[0]}' + (f'\n{kq[1]}' if kq[1] else ''))
    if kq[0] != 'ĐỐI CHỨNG XANH':
        return 2
    for t, th, mau in chon:
        v, ct = chay(t, th, mau)
        print(f'  {v:6} {t}' + (f' — {ct}' if ct else ''))
        if v != 'BẮT':
            tt += 1
    print(f'\n{len(chon) - tt}/{len(chon)} đột biến bị BẮT')
    return 1 if tt else 0


sys.exit(main())
