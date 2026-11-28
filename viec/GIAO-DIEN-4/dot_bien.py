#!/usr/bin/env python3
"""GIAO-DIEN-4 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-DIEN-4/dot_bien.py [tên...]     (không tên = chạy hết; có ĐỐI CHỨNG trước: bản chưa đột biến phải XANH)
    python3 viec/GIAO-DIEN-4/dot_bien.py --liet-ke    (chỉ in danh sách)

Chép client/src (KHÔNG node_modules), client/index.html, kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT, không symlink; esbuild lấy từ
client/node_modules của kho thật — bài thử tự tìm), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, không bao giờ
đếm là đạt, K3), chạy `node cong_cu/thu_GIAODIEN4.js --goc <bản sao>`. BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt.
Bài sập hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CSS, HTML, KT = 'client/src/index.css', 'client/index.html', 'kiem_tra_truoc_khi_giao.js'
LAY, TD = 'client/src/components/Layout.jsx', 'client/src/components/TieuDeMan.jsx'
AM, TI, BH, BC, TT = ('client/src/pages/BanHang/' + x for x in ('AnhMon.jsx', 'tinh.js', 'BanHangMoi.jsx', 'banHang.css', 'ThuTien.jsx'))
KC = 'client/src/pages/BanHang/KhungChonMon.jsx'
QL, MENU = 'client/src/pages/QuanLy/QuanLy.jsx', 'client/src/pages/QuanLy/menu.js'
REF, ORD = 'client/src/pages/Refunds.jsx', 'client/src/pages/Orders.jsx'
CAN_CHEP = [HTML, KT]   # + cả cây client/src (copytree)

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A2: quy tắc đỏ toàn cục ──
  ('BV-input-lai-do', [(CSS, 'input, select, textarea { color: var(--chu); }', 'input, select, textarea { color: #991B1B; }', 1)], r'✗ A2a '),
  ('BV-strong-lai-do', [(CSS, 'a { color: #DC2626; }\nbutton,', 'a { color: #DC2626; }\nstrong, b { color: #991B1B; }\nbutton,', 1)], r'✗ A2a '),
  ('BV-td-lai-xam', [(CSS, 'a { color: #DC2626; }\nbutton,', 'a { color: #DC2626; }\ntd, th { color: #78716C; }\nbutton,', 1)], r'✗ A2a '),
  ('BV-body-lai-xam', [(CSS, '  color: var(--chu);\n  min-height: 100vh;', '  color: #78716C;\n  min-height: 100vh;', 1)], r'✗ A2[ab] '),
  ('VS-o-nhap-van-do-lop', [(CSS, '  transition: all 0.2s ease;\n  color: var(--chu);\n}', '  transition: all 0.2s ease;\n  color: #991B1B;\n}', 1)], r'✗ A2c '),
  # ── F2: khối in ──
  ('BV-bo-khoi-in', [(CSS, '@media print {', '@media screen {', 1)], r'✗ F2[ab] '),
  ('VS-khoi-in-sai-phong', [(CSS, "body { font-family: 'Inter', -apple-system, sans-serif; color: #78716C; background: none; }", "body { font-family: 'Be Vietnam Pro', sans-serif; color: #78716C; background: none; }", 1)], r'✗ F2a '),
  ('VS-khoi-in-bat-nen-may', [(CSS, "color: #78716C; background: none; }", "color: #78716C; background: url(\"data:image/svg+xml,x\"); }", 1)], r'✗ F2c '),
  # ── A1, A3, A4, A5 ──
  ('BV-bo-bien-giay', [(CSS, '  --giay: #fffdf8;\n', '', 1)], r'✗ A1 '),
  ('VS-bien-giay-lech-mau', [(CSS, '  --giay: #fffdf8;', '  --giay: #ffffff;', 1)], r'✗ A1 '),
  ('BV-bo-link-phong', [(HTML, 'Be+Vietnam+Pro:wght@400;500;600;700', 'Be+Vietnam+Pro:wght@400', 1)], r'✗ A3a '),
  ('BV-phong-chinh-mat-du-phong', [(CSS, "font-family: 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', sans-serif;\n  background: var(--kem)", "font-family: 'Be Vietnam Pro';\n  background: var(--kem)", 1)], r'✗ A3b '),
  ('VS-card-con-backdrop', [(CSS, '  box-shadow: 0 1px 0 #f3e5d0, 0 6px 14px rgba(127,29,29,0.06);\n  padding: 1.5rem;', '  box-shadow: 0 1px 0 #f3e5d0, 0 6px 14px rgba(127,29,29,0.06);\n  backdrop-filter: blur(10px);\n  padding: 1.5rem;', 1)], r'✗ A4b '),
  ('VS-body-lai-gradient', [(CSS, 'background: var(--kem) url("data:image/svg+xml', 'background: linear-gradient(#fef7ed, #fee2e2) url("data:image/svg+xml', 1)], r'✗ A4a '),
  ('VS-page-header-con-gradient', [(CSS, '.page-header {\n  background: var(--giay);', '.page-header {\n  background: linear-gradient(135deg, #fff, #fef7ed);', 1)], r'✗ A5 '),
  # ── B1: tiêu đề + icon ──
  ('BV-tieu-de-emoji-lai', [(REF, '<TieuDeMan icon={Undo2} ten="Yêu cầu hoàn tiền" />', '<h1 className="page-title">💸 Yêu cầu hoàn tiền</h1>', 1)], r'✗ B1c Refunds'),
  ('VS-emoji-trong-ten-TieuDeMan', [(ORD, 'ten="Đơn hàng"', 'ten="📦 Đơn hàng"', 1)], r'✗ B1c Orders'),
  ('BV-quan-ly-h1-tro', [(QL, '<TieuDeMan icon={LayoutGrid} ten="Quản lý" />', '<h1>Quản lý</h1>', 1)], r'✗ B1d '),
  ('VS-TieuDeMan-bo-icon', [(TD, '{Icon && <span className="tieu-de-o" aria-hidden="true"><Icon size={20} /></span>}', '', 1)], r'✗ B1a '),
  # ── C1/C2: thanh bên + thanh dưới ──
  ('BV-bo-khau-hieu', [(LAY, "const KHAU_HIEU = 'Đông Y Dưỡng Thể';", "const KHAU_HIEU = '';", 1)], r'✗ C1a '),
  ('VS-khau-hieu-viet-cung-trong-JSX', [(LAY, '{KHAU_HIEU}</small>', 'Đông Y Dưỡng Thể</small>', 1)], r'✗ C1a '),
  ('BV-logo-cu-icon-72', [(LAY, '<img src={logo} alt="Tứ Quý Đường" />', '<img src="/icons/icon-72x72.png" alt="Tứ Quý Đường" />', 1)], r'✗ C1b '),
  ('BV-sidebar-het-may-vang', [(CSS, '.sidebar::before {', '.sidebar::xbefore {', 1)], r'✗ C1c '),
  ('VS-nav-active-het-vach-vang', [(CSS, '.nav-item.active::before {', '.nav-item.active::after {', 1)], r'✗ C1e '),
  ('VS-bottom-nav-cham-do', [(CSS, 'border-radius: 50%; background: var(--dat); }', 'border-radius: 50%; background: var(--do); }', 1)], r'✗ C2b '),
  # ── D1: nhãn tồn ──
  ('BV-nhanTon-het-nhan-con', [(TI, "n === 0 ? 'Hết' : n > 0 ? `Còn ${n}` : ''", "n === 0 ? 'Hết' : ''", 1)], r'✗ D1d '),
  ('VS-nhanTon-bo-pha-ngay', [(TI, "if (sp?.khong_quan_kho) return 'Pha ngay';", '', 1)], r'✗ D1c '),
  ('VS-nhanTon-khong-co-so-thanh-het', [(TI, "if (typeof n !== 'number' || !Number.isFinite(n)) return '';", "if (typeof n !== 'number' || !Number.isFinite(n)) return 'Hết';", 1)], r'✗ D1e '),
  ('BV-the-mon-het-nhan', [(BH, '{nhanTon(s) && <span className="bh-nhan-ton">{nhanTon(s)}</span>}', '', 1)], r'✗ D1f '),
  ('VS-mon-het-khong-mo', [(BC, 'filter: grayscale(0.85); opacity: 0.55;', 'filter: grayscale(0.85); opacity: 1;', 1)], r'✗ D1g '),
  ('BV-nhan-ton-khong-goc', [(BC, '.bh-nhan-ton { position: absolute;', '.bh-nhan-ton { position: relative;', 1)], r'✗ D1g '),
  # ── D2: hình ly ──
  ('BV-luon-ve-ly', [(AM, 'const coAnh = !!anh && hong !== anh;', 'const coAnh = false;', 1)], r'✗ D2e '),
  ('BV-luon-img', [(AM, 'const coAnh = !!anh && hong !== anh;', 'const coAnh = true;', 1)], r'✗ D2[cdfgh] '),
  ('VS-nhom-la-ra-mau-tra', [(AM, ': MAU_MAC_DINH);', ': MAU_NHOM.tea);', 1)], r'✗ D2b '),
  ('VS-ly-trung-id-gradient', [(AM, '<linearGradient id={`g${id}`}', '<linearGradient id="gly"', 1), (AM, 'url(#g${id})', 'url(#gly)', 1)], r'✗ D2i '),
  ('VS-ly-khong-theo-nhom', [(AM, 'const { nuoc } = mauNhom(nhom);', 'const { nuoc } = mauNhom();', 1)], r'✗ D2c '),
  ('BV-dong-gio-khong-truyen-nhom', [(BH, 'nhom={nhomTheoId.get(d.product_id)} ', '', 1)], r'✗ D2l '),
  # ── D3: chip ──
  ('BV-chip-khong-ly', [(BH, '<HinhLy nhom={n} kich={18} />', 'null', 1)], r'✗ D3a '),
  # ── D4: bill ──
  ('BV-bill-het-rang-cua', [(BC, '-webkit-mask:', '-webkit-xmask:', 1), (BC, '\n  mask:', '\n  xmask:', 1)], r'✗ D4a '),
  ('BV-dong-gio-net-lien', [(BC, 'border-bottom: 1px dashed #e7d5bf;', 'border-bottom: 1px solid #e7d5bf;', 1)], r'✗ D4b '),
  ('VS-tong-het-playfair', [(BC, 'font-family: var(--font-chu-dep); font-weight: 700; font-size: 1.6rem;', 'font-weight: 700; font-size: 1.6rem;', 1)], r'✗ D4c '),
  ('BV-nut-tra-tien-het-icon', [(TT, '<IconTien />Tiền mặt', 'Tiền mặt', 1)], r'✗ D4d '),
  ('VS-icon-dem-dau-cach-lam-vo-chu-nut', [(TT, '<IconQr />Chuyển khoản', '<IconQr /> Chuyển khoản', 1)], r'✗ D4d '),
  ('BV-thanh-gio-het-do-dam', [(BC, 'background: linear-gradient(180deg, #931c1b, #7f1d1d);', 'background: var(--bh-do);', 1)], r'✗ D4e '),
  # ── E1: Quản lý ──
  ('BV-nhom-mat-mau', [(MENU, "icon: 'Megaphone', mau: 'do'", "icon: 'Megaphone', mau: 'luc'", 1)], r'✗ E1b '),
  ('BV-nhom-mat-icon', [(MENU, "icon: 'Wallet', mau: 'luc', ", "mau: 'luc', ", 1)], r'✗ E1[bc] '),
  ('VS-mau-luc-lech-ma', [(CSS, '.ql-mau-luc { --mau: #3f7a45;', '.ql-mau-luc { --mau: #3f7a46;', 1)], r'✗ E1d '),
  # ── R: vòng sửa 1 (soát độc lập) ──
  ('BV-vach-vang-lai-ra-ngoai', [(CSS, ".nav-item.active::before { content: ''; position: absolute; left: 0;", ".nav-item.active::before { content: ''; position: absolute; left: -0.875rem;", 1)], r'✗ R1 '),
  ('BV-the-nap-mat-khung', [(BH, '<span className="bh-chu-mon">\n                <span className="bh-mon-ten">{g.ten}</span>', '<span>\n                <span className="bh-mon-ten">{g.ten}</span>', 1)], r'✗ R2 '),
  ('VS-bh-to-lai-hang-ngang-moi-nut', [(BC, '.bh-to button { display: flex; flex-direction: column;', '.bh-to button { display: flex; flex-direction: row;', 1)], r'✗ R3a '),
  ('BV-nut-icon-mat-lop-rieng', [(TT, "bh-nut bh-nut-ic ${cachTra === 'tien_mat'", "bh-nut ${cachTra === 'tien_mat'", 1)], r'✗ R3b '),
  ('BV-in-card-title-bo', [(CSS, '  .card-title { font-family: inherit; font-size: 1rem; font-weight: 600; color: #B91C1C; }\n', '', 1)], r'✗ R4a '),
  ('VS-in-card-title-sai-mau', [(CSS, '.card-title { font-family: inherit; font-size: 1rem; font-weight: 600; color: #B91C1C; }', '.card-title { font-family: inherit; font-size: 1rem; font-weight: 600; color: #7F1D1D; }', 1)], r'✗ R4a '),
  ('BV-in-table-th-bo', [(CSS, '  .table th { color: #B91C1C; }\n}', '}', 1)], r'✗ R4b '),
  ('BV-topping-khong-truyen-nhom', [(KC, '<AnhMon anh={t.anh} nhom={t.category} kich={40} />', '<AnhMon anh={t.anh} ten={t.name} kich={40} />', 1)], r'✗ R5 '),
  ('BV-mau-the-khong-du-phong', [(CSS, 'background: var(--mau, var(--dat)); color: #fff;', 'background: var(--mau); color: #fff;', 1)], r'✗ R6 '),
  ('VS-chip-lech-dem', [(BC, 'padding: 0.5rem 1rem; font-weight: 500;', 'padding: 0.5rem 1rem 0.5rem 0.5rem; font-weight: 500;', 1)], r'✗ R7 '),
  ('BV-hasOwn-lai', [(AM, 'Object.prototype.hasOwnProperty.call(MAU_NHOM, nhom)', 'Object.hasOwn(MAU_NHOM, nhom)', 1)], r'✗ R8 '),
  # ── F1: nối vào bộ kiểm ──
  ('BV-quen-gan-bai-vao-bo-kiem', [(KT, "chayBaiThat('cong_cu/thu_GIAODIEN4.js');", "// chayBaiThat('cong_cu/thu_GIAODIEN4.js'); //", 1)], r'✗ F1a '),
]


def chay_ban(ten, thay, mau):
    tmp = tempfile.mkdtemp(prefix='dotbien_gd4_')
    try:
        for f in CAN_CHEP:
            dich = os.path.join(tmp, f)
            os.makedirs(os.path.dirname(dich), exist_ok=True)
            shutil.copy(os.path.join(GOC, f), dich)
        shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'), symlinks=False)
        for f, a, b, n in thay:
            p = os.path.join(tmp, f)
            assert os.path.realpath(p).startswith(os.path.realpath(tmp)), 'ghi xuyên ra ngoài bản sao'
            s = open(p, encoding='utf8').read()
            if s.count(a) != n:
                return 'HONG', f'{ten}: chuỗi gốc khớp {s.count(a)} lần (cần {n}) trong {f}'
            open(p, 'w', encoding='utf8').write(s.replace(a, b))
        r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_GIAODIEN4.js'), '--goc', tmp], capture_output=True, text=True, timeout=300)
        ra = r.stdout + r.stderr
        if 'bài thử sập' in ra:
            return 'LAC', 'bài sập'
        if 'SỐ CA:' not in ra:
            return 'LAC', 'không in dòng tổng'
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
