#!/usr/bin/env python3
# HOC-2b — đột biến của chính việc này. Chạy lại: python3 viec/HOC-2b/dot_bien.py [tiền tố tên …]
# Mỗi đột biến dựng BẢN SAO trong thư mục tạm (không bao giờ sửa file thật), thay chuỗi — chuỗi gốc phải khớp ĐÚNG 1 lần,
# không thì HỎNG (K3) — rồi chạy lệnh đo của kiểu. M0-* = đối chứng không đột biến, phải XANH. Đột biến: phải ĐỎ (thoát ≠ 0)
# và đầu ra có MỌI chuỗi ở cột cuối; kiểu `kiem` còn đòi KHÔNG có dòng ✗ nào khác (C5: chỉ thu_P20 đỏ).
# VS- = vá sai, BV- = bỏ vá. Cuối lần chạy so git status + data/ của kho thật trước/sau — khác là KHO BẨN, thoát 3.
#   p26b : chép server/ → node cong_cu/thu_P26b.js --may-chu <bản sao>                       (C4)
#   kb   : chép server/ → node cong_cu/gia_lap/chay.js --may-chu <bản sao> --den-kb <n>       (C2: I11 bắt thay I10)
#   kb17 : chép cong_cu/gia_lap/ (server, tu_chay, node_modules nối) → giả lập bản sao tới KB17 (C4)
#   glk  : chép kiem_tra_truoc_khi_giao.js + cong_cu/ (server, tu_chay, node_modules nối) → thu_gia_lap của bản sao (C3)
#   kiem : chép mọi file git theo dõi (trừ attached_assets/) → bộ kiểm bản nhanh của bản sao (C5)
#   tc4  : như kiem + git init/commit trong bản sao → python3 viec/TU-CHAY-4/dot_bien.py S3 TRONG bản sao (D3)
#   glsym: như glk nhưng server/ của bản sao là LIÊN KẾT tới một bản chép khác (`that_server`, đóng vai kho thật) → thu_gia_lap;
#          that_server đổi = "GHI XUYÊN" (khoá banSao của thu_gia_lap — sự cố 08.10)
import importlib.util, os, re, shutil, subprocess, sys, tempfile

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_s = importlib.util.spec_from_file_location('p26b_db', os.path.join(GOC, 'viec', 'P26b', 'dot_bien.py'))
P26B = importlib.util.module_from_spec(_s); _s.loader.exec_module(P26B)
P26B_DB = {d[0]: d[2] for d in P26B.DOT_BIEN}   # C2: dùng LẠI đúng bản vá sai của P26b, chỉ đổi mẫu bắt sang I11
R, SC = 'server/routes/refunds.js', 'server/routes/signup-codes.js'
KT, TC4 = 'kiem_tra_truoc_khi_giao.js', 'viec/TU-CHAY-4/dot_bien.py'
DB = [
    # tên, kiểu, [(file trong bản sao, tìm, thay)] hoặc ('p26b', tên đột biến P26b), [chuỗi phải có]
    ('M0-p26b', 'p26b', [], []),
    ('VS-q9-me-lon-hon-bang-0', 'p26b', [(R, 'if (me?.parent_phone && Number(me.parent_balance_amount) > 0) {',
                                           'if (me?.parent_phone && Number(me.parent_balance_amount) >= 0) {')], ['✗ M9 ']),
    ('BV-q9-bo-hoan-me', 'p26b', [(R, 'if (me?.parent_phone && Number(me.parent_balance_amount) > 0) {', 'if (false) {')],
     ['✗ M6 ', '✗ M10 ']),
    ('M0-kb17', 'kb17', [], []),
    ('KB17-khong-nap-me', 'kb17', [('cong_cu/gia_lap/kich_ban.js', '    await c.nap(ME, 20000);\n', '')],
     ['KB17 → HTTP: đơn ví con 5.000 + ví mẹ 20.000 tạo được (200)']),
    ('C2-I11-huy-kiem-ngoai-tx', 'kb15', ('p26b', 'huy-kiem-ngoai-tx'), ['KB15 → I11:']),
    ('C2-I11-xoa-doc-don-ngoai-tx', 'kb14', ('p26b', 'xoa-doc-don-ngoai-tx'), ['KB14 → I11:']),
    ('M0-glk', 'glk', [], []),
    ('VS-C3-doi-ten-ham', 'glk', [(KT, 'function chayBaiThat(bai, env, han = 120000, canhGan = false) {',
                                    'function chayBaiThat2(bai, env, han = 120000, canhGan = false) {')], ['✗ C3e ']),
    ('BV-C3-bo-canh-bao', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {', 'if (false) {')], ['✗ C3a ']),
    ('VS-C3-bo-co', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                              'if (xanh && Date.now() - t0 > han * 0.8) {')], ['✗ C3d ']),
    ('VS-C3-nguong-giay-co-dinh', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                                            'if (xanh && canhGan && Date.now() - t0 > 96000) {')], ['✗ C3a ']),
    ('VS-C3-bo-xanh', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                                'if (canhGan && Date.now() - t0 > han * 0.8) {')], ['✗ C3c ']),
    ('VS-C3-mac-dinh-bat', 'glk', [(KT, 'function chayBaiThat(bai, env, han = 120000, canhGan = false) {',
                                     'function chayBaiThat(bai, env, han = 120000, canhGan = true) {')], ['✗ C3f ']),
    ('BV-C3-bo-co-gia-lap', 'glk', [(KT, "chayBaiThat('cong_cu/gia_lap/chay.js', MT_SACH, 120000, true)",
                                      "chayBaiThat('cong_cu/gia_lap/chay.js', MT_SACH)")], ['✗ C3f ']),
    ('VS-C3-ty-le-thap', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                                   'if (xanh && canhGan && Date.now() - t0 > han * 0.5) {')], ['✗ C3g ']),
    ('VS-C3-ty-le-cao', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                                  'if (xanh && canhGan && Date.now() - t0 > han * 0.95) {')], ['✗ C3a ']),
    # soát chat 08.10 (c2a1143): tỉ lệ lệch ít (0,75 / 0,85) lọt khe C3g/C3a — C3f khoá đúng chữ han * 0.8
    ('VS-C3-ty-le-075', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                                  'if (xanh && canhGan && Date.now() - t0 > han * 0.75) {')], ['✗ C3f ']),
    ('VS-C3-ty-le-085', 'glk', [(KT, 'if (xanh && canhGan && Date.now() - t0 > han * 0.8) {',
                                  'if (xanh && canhGan && Date.now() - t0 > han * 0.85) {')], ['✗ C3f ']),
    ('VS-C3-mac-dinh-theo-so-doi-so', 'glk', [(KT, '  const t0 = Date.now();\n  const r = spawnSync(',
                                                '  if (arguments.length < 4) canhGan = true;\n  const t0 = Date.now();\n  const r = spawnSync(')],
     ['✗ C3h ']),
    ('VS-C3-bat-qua-bien', 'glk', [(KT, "chayBaiThat('tu_chay/thu_cong.js');", "chayBaiThat('tu_chay/thu_cong.js', undefined, 120000, BAT_CO);")],
     ['✗ C3f ']),
    ('M0-glsym', 'glsym', [], []),
    ('BV-banSao-bo-khoa', 'glsym', [('cong_cu/thu_gia_lap.js', "{ recursive: true, dereference: true }", '{ recursive: true }'),
                                    ('cong_cu/thu_gia_lap.js', "if (!fs.realpathSync(p).startsWith(TAM + path.sep)) return", 'if (false) return')],
     ['GHI XUYÊN']),
    # chỉ gỡ lớp chép-thật: lớp realpath phải chặn ghi (13 dòng M báo "trỏ ra ngoài") và KHÔNG ghi xuyên. (Chỉ gỡ lớp realpath thì
    # lớp chép-thật vẫn giữ an toàn — không dựng được ca đỏ: lớp phụ, CHƯA KIỂM riêng.)
    ('BV-banSao-bo-dereference', 'glsym', [('cong_cu/thu_gia_lap.js', "{ recursive: true, dereference: true }", '{ recursive: true }')],
     ['trỏ ra ngoài thư mục tạm']),
    ('M0-kiem', 'kiem', [], []),
    ('C5-P20-hoan-bao-huy', 'kiem', [(SC, "if (don.status === 'cancelled') {",
                                      "if (don.status === 'cancelled' || don.status === 'refunded') {")],
     ['✗ bài chạy thật cong_cu/thu_P20.js']),
    ('M0-tc4', 'tc4', [], ['✓ S3 ']),
    ('VS-D3-ghi-that', 'tc4', [(TC4, 'if not thay(os.path.join(kho, f), tim, moi):', 'if not thay(os.path.join(GOC, f), tim, moi):')],
     ['KHO BẨN']),
]


def chep_kho(dich):
    ds = [x for x in subprocess.run(['git', 'ls-files', '-z'], cwd=GOC, capture_output=True, check=True).stdout.decode().split('\0')
          if x and not x.startswith('attached_assets/') and os.path.isfile(os.path.join(GOC, x))]
    for x in ds:
        os.makedirs(os.path.dirname(os.path.join(dich, x)), exist_ok=True)
        shutil.copy2(os.path.join(GOC, x), os.path.join(dich, x))
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(dich, 'node_modules'))
    os.symlink(os.path.join(GOC, 'client', 'node_modules'), os.path.join(dich, 'client', 'node_modules'))
    return ds


def noi(tam, ds):
    for x in ds: os.symlink(os.path.join(GOC, x), os.path.join(tam, x))


def chay(ten, kieu, doi, phai):
    tam = tempfile.mkdtemp(prefix='hoc2b_db_')
    try:
        env, cwd = None, GOC
        if kieu in ('p26b', 'kb14', 'kb15'):
            shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server')); noi(tam, ['node_modules'])
            lenh = (['node', 'cong_cu/thu_P26b.js', '--may-chu', os.path.join(tam, 'server')] if kieu == 'p26b' else
                    ['node', 'cong_cu/gia_lap/chay.js', '--may-chu', os.path.join(tam, 'server'), '--den-kb', kieu[2:]])
        elif kieu == 'kb17':
            shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tam, 'cong_cu', 'gia_lap'))
            noi(tam, ['server', 'tu_chay', 'node_modules'])
            lenh = ['node', os.path.join(tam, 'cong_cu', 'gia_lap', 'chay.js'), '--den-kb', '17']
        elif kieu in ('glk', 'glsym'):
            shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tam, 'cong_cu'))
            shutil.copy2(os.path.join(GOC, KT), os.path.join(tam, KT))
            # server/ CHÉP THẬT, không nối: thu_gia_lap chép server/ rồi sửa bản chép — nối symlink thì cpSync chép cái liên
            # kết và 13 đột biến M1–M13 ghi XUYÊN vào server/ thật (đã xảy ra 08.10, HOC-2b — bắt nhờ KHO BẨN).
            if kieu == 'glk':
                shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tam, 'server'))
            else:
                that = os.path.join(tam, 'that_server')   # TRONG tam: node tìm node_modules theo đường thật của liên kết
                shutil.copytree(os.path.join(GOC, 'server'), that)
                os.symlink(that, os.path.join(tam, 'server'))
            noi(tam, ['tu_chay', 'node_modules'])
            lenh, cwd = ['node', 'cong_cu/thu_gia_lap.js'], tam
        else:  # kiem, tc4
            kho = os.path.join(tam, 'kho'); ds = chep_kho(kho); cwd = kho
            if kieu == 'kiem':
                lenh = ['node', KT]
            else:
                g = lambda *a: subprocess.run(['git', '-c', 'user.name=hoc2b', '-c', 'user.email=hoc2b@local', *a], cwd=kho,
                                              capture_output=True, text=True, check=True, input='\n'.join(ds) if 'add' in a else None)
                g('init', '-q'); g('add', '--pathspec-from-file=-'); g('commit', '-q', '-m', 'ban sao')
                lenh = ['python3', TC4, 'S3']
        if isinstance(doi, tuple):
            doi = [(('cong_cu/gia_lap/' if f == 'bat_bien.js' else 'server/') + f, a, b) for f, a, b, *_ in P26B_DB[doi[1]]]
        goc_bs = tam if kieu != 'kiem' and kieu != 'tc4' else cwd
        for f, a, b in doi:
            p = os.path.join(goc_bs, f)
            s = open(p, encoding='utf-8').read()
            if s.count(a) != 1:
                return f'HỎNG — chuỗi gốc khớp {s.count(a)} lần trong {f}, cần 1'
            os.remove(p)  # xoá rồi ghi: lỡ p là liên kết về kho thật thì cũng không ghi xuyên qua
            open(p, 'w', encoding='utf-8').write(s.replace(a, b))
        anh = lambda d: sorted((os.path.relpath(os.path.join(a, f), d), open(os.path.join(a, f), 'rb').read())
                               for a, _, fs_ in os.walk(d) for f in fs_)
        that = os.path.join(tam, 'that_server')
        truoc_that = anh(that) if kieu == 'glsym' else None
        r = subprocess.run(lenh, cwd=cwd, env=env, capture_output=True, text=True, timeout=900)
        ra = re.sub(r'\x1b\[[0-9;]*m', '', r.stdout + r.stderr)
        xuyen = kieu == 'glsym' and anh(that) != truoc_that
        if xuyen:
            ra += '\n✗ GHI XUYÊN — server/ "thật" (đích của liên kết) bị sửa\n'
            if 'GHI XUYÊN' not in phai:
                return 'ĐỎ nhưng GHI XUYÊN — khoá còn lại không chặn ghi vào server/ "thật"'
        do = [l.strip() for l in ra.splitlines() if '✗' in l and 'CÓ LỖI' not in l]
        if not doi:
            thieu = [x for x in phai if x not in ra]
            # tc4: đầu ra của TU-CHAY-4 có sẵn dòng ✗ của bộ kiểm bên trong (S3 phải đỏ) — đối chứng xét mã thoát + chuỗi phải có
            return ('XANH (đối chứng đúng)' if r.returncode == 0 and (kieu == 'tc4' or not do) and not thieu and 'KHO BẨN' not in ra else
                    f'ĐỎ — đối chứng hỏng (thoát {r.returncode}): ' + ' | '.join(do[:3] + thieu)[:400])
        if r.returncode == 0 and not xuyen:   # ghi xuyên là bắt, kể cả khi bài thử tình cờ thoát 0
            return 'XANH — đột biến SỐNG'
        thieu = [x for x in phai if x not in ra]
        trung = [l for l in do if any(x in l for x in phai)] or [l.strip() for l in ra.splitlines() if any(x in l for x in phai)]
        la = [l for l in do if l not in trung] if kieu == 'kiem' else []
        if thieu or la:
            return f'ĐỎ nhưng SAI chỗ — thiếu {thieu} · dòng ✗ khác: ' + ' | '.join((la or do)[:3])[:400]
        return f'ĐỎ đúng chỗ — ' + ' | '.join(trung[:3])[:400]
    finally:
        shutil.rmtree(tam, ignore_errors=True)


def anh_kho():
    st = subprocess.run(['git', 'status', '--porcelain'], cwd=GOC, capture_output=True, text=True).stdout
    data = os.path.join(GOC, 'data')
    return st, sorted(f'{x}:{os.stat(os.path.join(data, x)).st_mtime_ns}' for x in os.listdir(data)) if os.path.isdir(data) else []


chon = sys.argv[1:]
truoc = anh_kho()
dat = hong = 0
for ten, kieu, doi, phai in DB:
    if chon and not any(ten.startswith(c) for c in chon):
        continue
    kq = chay(ten, kieu, doi, phai)
    ok = kq.startswith('XANH (đối chứng đúng)') or kq.startswith('ĐỎ đúng chỗ')
    dat, hong = dat + ok, hong + (not ok)
    print(f"{'✓' if ok else '✗'} {ten} [{kieu}] → {kq}", flush=True)
    if anh_kho() != truoc:   # soát SAU MỖI đột biến: ghi xuyên vào kho thật thì dừng ngay, không chạy tiếp trên kho bẩn
        print(f'  ✗ KHO BẨN sau {ten} — git status / data/ của kho thật đổi; DỪNG'); sys.exit(3)
print(f'\n  {dat} đạt · {hong} không đạt')
sys.exit(1 if hong else 0)
