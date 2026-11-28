#!/usr/bin/env python3
"""GIAO-DIEN-3 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-DIEN-3/dot_bien.py [tên...]     (không tên = chạy hết; có ĐỐI CHỨNG trước: bản chưa đột biến phải XANH)
    python3 viec/GIAO-DIEN-3/dot_bien.py --liet-ke    (chỉ in danh sách)

Chép index.css, kho.css, client/index.html, kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT, không symlink), thay chuỗi (mỗi chuỗi phải khớp
ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_GIAODIEN3.js --goc <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CSS, KHO, HTML, KT = 'client/src/index.css', 'client/src/pages/Kho/kho.css', 'client/index.html', 'kiem_tra_truoc_khi_giao.js'
CAN_CHEP = [CSS, KHO, HTML, KT]
MC = '.main-content { flex: 1; margin-left: 240px; min-width: 0; }'
M768 = '  .main-content { margin-left: 0; padding-bottom: 80px; }'
TS = 'html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }'
KHOI = '@media (min-width: 769px) { .kho-tabs { flex-wrap: wrap; overflow-x: visible; } }'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A1: .main-content min-width 0 ──
  ('BV-bo-min-width', [(CSS, MC, '.main-content { flex: 1; margin-left: 240px; }', 1)], r'✗ T1[abc] '),
  ('VS-min-width-chi-trong-media-768', [(CSS, MC, '.main-content { flex: 1; margin-left: 240px; }', 1), (CSS, M768, '  .main-content { margin-left: 0; padding-bottom: 80px; min-width: 0; }', 1)], r'✗ T1[bc] '),
  ('VS-min-width-mot-pixel', [(CSS, 'margin-left: 240px; min-width: 0; }', 'margin-left: 240px; min-width: 1px; }', 1)], r'✗ T1[abc] '),
  ('VS-min-width-bi-ghi-de-sau', [(CSS, M768, M768 + '\n  .main-content { min-width: 600px; }', 1)], r'✗ T1a '),
  ('VS-main-content-doi-flex', [(CSS, MC, '.main-content { flex: 0 0 auto; margin-left: 240px; min-width: 0; }', 1)], r'✗ T1d '),
  ('VS-giau-tran-overflow-hidden', [(CSS, MC, '.main-content { flex: 1; margin-left: 240px; min-width: 0; overflow-x: hidden; }', 1)], r'✗ T1e '),
  # ── A2: text-size-adjust ──
  ('BV-bo-text-size-adjust', [(CSS, TS, '', 1)], r'✗ T2[abc] '),
  ('VS-text-size-auto', [(CSS, TS, 'html { -webkit-text-size-adjust: auto; text-size-adjust: 100%; }', 1)], r'✗ T2a '),
  ('VS-text-size-chi-webkit', [(CSS, TS, 'html { -webkit-text-size-adjust: 100%; }', 1)], r'✗ T2b '),
  ('VS-text-size-chi-trong-media', [(CSS, TS, '@media (max-width: 768px) { ' + TS + ' }', 1)], r'✗ T2c '),
  # ── T3: viewport ──
  ('VS-viewport-khoa-phong-to', [(HTML, 'maximum-scale=5.0', 'maximum-scale=1.0, user-scalable=no', 1)], r'✗ T3[bc] '),
  ('VS-viewport-scale-1', [(HTML, 'maximum-scale=5.0', 'maximum-scale=1.0', 1)], r'✗ T3c '),
  ('BV-viewport-mat-width', [(HTML, 'width=device-width, ', '', 1)], r'✗ T3a '),
  # ── B1: hàng tab Kho ──
  ('BV-bo-khoi-tab-may-tinh', [(KHO, KHOI, '', 1)], r'✗ T4[bc] '),
  ('VS-tab-wrap-ngoai-media', [(KHO, KHOI, '.kho-tabs { flex-wrap: wrap; overflow-x: visible; }', 1)], r'✗ T4[ac] '),
  ('VS-tab-media-min-0', [(KHO, '@media (min-width: 769px) { .kho-tabs', '@media (min-width: 0px) { .kho-tabs', 1)], r'✗ T4[ac] '),
  ('VS-tab-nguong-lech-len', [(KHO, '@media (min-width: 769px) { .kho-tabs', '@media (min-width: 800px) { .kho-tabs', 1)], r'✗ T4[bc] '),
  ('VS-tab-nguong-lech-xuong', [(KHO, '@media (min-width: 769px) { .kho-tabs', '@media (min-width: 768px) { .kho-tabs', 1)], r'✗ T4[ac] '),
  ('VS-tab-van-cuon-ngang', [(KHO, 'flex-wrap: wrap; overflow-x: visible; } }', 'flex-wrap: wrap; overflow-x: auto; } }', 1)], r'✗ T4b '),
  ('VS-tab-khong-wrap-chi-visible', [(KHO, 'flex-wrap: wrap; overflow-x: visible; } }', 'flex-wrap: nowrap; overflow-x: visible; } }', 1)], r'✗ T4[bc] '),
  ('VS-tab-mat-hang-flex', [(KHO, '.kho-tabs { display: flex; gap: 0.5rem; overflow-x: auto;', '.kho-tabs { display: block; gap: 0.5rem; overflow-x: auto;', 1)], r'✗ T4d '),
  # ── C1: nối vào bộ kiểm ──
  ('BV-quen-gan-bai-vao-bo-kiem', [(KT, "chayBaiThat('cong_cu/thu_GIAODIEN3.js');", "// chayBaiThat('cong_cu/thu_GIAODIEN3.js'); //", 1)], r'✗ C1 '),
]


def chay_ban(ten, thay, mau):
    tmp = tempfile.mkdtemp(prefix='dotbien_gd3_')
    try:
        for f in CAN_CHEP:
            dich = os.path.join(tmp, f)
            os.makedirs(os.path.dirname(dich), exist_ok=True)
            shutil.copy(os.path.join(GOC, f), dich)
        for f, a, b, n in thay:
            p = os.path.join(tmp, f)
            assert os.path.realpath(p).startswith(os.path.realpath(tmp)), 'ghi xuyên ra ngoài bản sao'
            s = open(p, encoding='utf8').read()
            if s.count(a) != n:
                return 'HONG', f'{ten}: chuỗi gốc khớp {s.count(a)} lần (cần {n}) trong {f}'
            open(p, 'w', encoding='utf8').write(s.replace(a, b))
        r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_GIAODIEN3.js'), '--goc', tmp], capture_output=True, text=True, timeout=300)
        ra = r.stdout + r.stderr
        if 'BÀI SẬP' in ra:
            return 'LAC', 'bài sập'
        do = [l for l in ra.splitlines() if '✗' in l]
        if r.returncode == 0:
            return 'SONG', 'xanh trọn'
        if mau and any(re.search(mau, l) for l in do):
            return 'BAT', next(l for l in do if re.search(mau, l)).strip()[:110]
        return 'LAC', 'đỏ nhưng không khớp mẫu: ' + (do[0].strip()[:90] if do else '?')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    arg = sys.argv[1:]
    if '--liet-ke' in arg:
        for t, _, _ in DOT_BIEN: print(t)
        return
    ds = [d for d in DOT_BIEN if not arg or d[0] in arg]
    kq, _ = chay_ban('DOI-CHUNG', [], None)
    print(f'ĐỐI CHỨNG (chưa đột biến): {"XANH" if kq == "SONG" else "ĐỎ — dừng"}')
    if kq != 'SONG': sys.exit(2)
    dem = {'BAT': 0, 'SONG': 0, 'LAC': 0, 'HONG': 0}
    for ten, thay, mau in ds:
        k, ct = chay_ban(ten, thay, mau)
        dem[k] += 1
        print(f'  {k:5} {ten}  {ct}')
    print(f'TỔNG {len(ds)}: BẮT {dem["BAT"]} · SỐNG {dem["SONG"]} · LẠC {dem["LAC"]} · HỎNG {dem["HONG"]}')
    sys.exit(0 if dem['BAT'] == len(ds) else 1)


main()
