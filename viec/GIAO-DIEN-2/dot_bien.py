#!/usr/bin/env python3
"""GIAO-DIEN-2 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/GIAO-DIEN-2/dot_bien.py [tên...]     (không tên = chạy hết; có ĐỐI CHỨNG trước: bản chưa đột biến phải XANH)
    python3 viec/GIAO-DIEN-2/dot_bien.py --liet-ke    (chỉ in danh sách)

Chép client/src + kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT, không symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn —
không khớp là HỎNG, không bao giờ đếm là đạt, K3), chạy `node cong_cu/thu_GIAODIEN2.js --goc <bản sao>`.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ mà không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import os, re, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
S = 'client/src/'
MENU, QL, LOC, SET, REP, HANG, ORD, APP, API, CUS, CSS = (S + 'pages/QuanLy/menu.js', S + 'pages/QuanLy/QuanLy.jsx', S + 'pages/QuanLy/locKhach.js', S + 'pages/Settings.jsx',
  S + 'pages/Reports.jsx', S + 'pages/CaiDat/HangThe.jsx', S + 'pages/Orders.jsx', S + 'App.jsx', S + 'utils/api.js', S + 'pages/Customers.jsx', S + 'index.css')

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A: menu + tìm nhanh ──
  ('VS-TIM-CO-DAU', [(MENU, ".normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')", '', 1)], r'✗ A2'),
  ('VS-TIM-PHAN-BIET-HOA', [(MENU, ".toLowerCase().trim();", ".trim();", 1)], r'✗ A2g'),
  ('BV-TIM-QUYEN', [(MENU, "  const luoi = luoiQuanLy(coQuyen);\n  if (!q) return luoi;", "  const luoi = luoiQuanLy(() => true);\n  if (!q) return luoi;", 1)], r'✗ A2j'),
  ('VS-ENTER-NHIEU-NUT', [(MENU, 'nut.length === 1 ? nut[0] : null', 'nut.length >= 1 ? nut[0] : null', 1)], r'✗ A2l'),
  ('BV-QUYEN-PIN-CHU-QUAN', [(MENU, "to: '/settings?the=pin', quyen: 'chi_chu_quan'", "to: '/settings?the=pin', quyen: 'manage_settings'", 1)], r'✗ (B1 nút "PIN chủ quán"|A1e)'),
  ('BV-NHOM-HET-NUT-VAN-HIEN', [(MENU, "n.quyen)) })).filter((g) => g.nut.length > 0);", "n.quyen)) }));", 1)], r'✗ A1d'),
  ('BV-QUANLY-KHONG-TIM', [(QL, 'const nhom = timMuc(chuoi, hasPermission);', 'const nhom = timMuc("", hasPermission);', 1)], r'✗ A3a'),
  ('BV-CSS-DIEN-THOAI-3-COT', [(CSS, '.ql-luoi { grid-template-columns: 1fr; gap: 1rem; }', '.ql-luoi { grid-template-columns: repeat(3, 1fr); gap: 1rem; }', 1)], r'✗ A3d'),
  # ── B: mở thẳng đúng màn ──
  ('BV-SETTINGS-KHONG-DOC-THE', [(SET, ".get('the')", ".get('khong')", 1)], r'✗ B1a'),
  ('BV-REPORTS-KHONG-NHAN-DOISOAT', [(REP, "['packages', 'doisoat'].includes", "['packages'].includes", 1)], r'✗ B1e'),
  ('BV-HANGTHE-BO-LINK-PIN', [(HANG, '"/settings?the=pin"', '"/settings"', 1)], r'✗ B4b'),
  ('BV-SETTINGS-THE-PIN-RONG', [(SET, "          ) : tab === 'pin' ? (\n            <PinChuQuan />", "          ) : tab === 'pin' ? (\n            null", 1)], r'✗ B4c'),
  # ── C: gỡ SX ──
  ('VS-ORDERS-CON-RETURN-STOCK', [(ORD, "{ 'refund': 'Hoàn tiền', 'none': 'Chỉ ghi nhận' };", "{ 'refund': 'Hoàn tiền', 'return_stock': 'Hoàn kho', 'none': 'Chỉ ghi nhận' };", 1)], r'✗ C2a'),
  ('BV-ORDERS-MAT-NHAN-CU', [(ORD, '<td>{NHAN_XU_LY_CU[d.action] || d.action}</td>', '<td>{DAMAGE_ACTIONS[d.action] || d.action}</td>', 1)], r'✗ C2c'),
  ('BV-ORDERS-CAU-HUY-SX', [(ORD, '<li>Trả lại kho (các món trong đơn)</li>', '<li>Hoàn tồn kho SX (các sản phẩm trong đơn)</li>', 1)], r'✗ (C2d|C4)'),
  ('BV-APP-REGISTRATIONS-LAC', [(APP, 'path="registrations" element={<Navigate to="/customers" replace />}', 'path="registrations" element={<Navigate to="/settings" replace />}', 1)], r'✗ C3b'),
  ('BV-API-CON-EXPORT', [(API, "  create: (data) => api.post('/registrations', data),\n", "  create: (data) => api.post('/registrations', data),\n  exportCsv: () => api.get('/registrations/export/csv'),\n", 1)], r'✗ C5'),
  ('BV-KHACH-CAU-SX', [(CUS, 'baoXong(`Đã thêm khách ${formData.name || formData.phone}.${phat}`);', 'baoXong(`Đã thêm khách ${formData.name || formData.phone}. Chờ đồng bộ với SX.${phat}`);', 1)], r'✗ (C1a|C1b|C4)'),
  # ── D: khách gọn ──
  ('VS-LOC-SO-DU-BANG-0', [(LOC, '!(c.balance > 0)', '!(c.balance >= 0)', 1)], r'✗ D2b'),
  ('VS-LOC-HANG-HET-HAN', [(LOC, "(m.status === 'active' || m.status === 'expiring_soon')", "m.status !== 'none'", 1)], r'✗ D2c'),
  ('VS-LOC-SINH-NHAT-LAY-NGAY', [(LOC, '/^\\d{4}-(\\d{2})-\\d{2}$/', '/^\\d{4}-\\d{2}-(\\d{2})$/', 1)], r'✗ D2[de]'),
  ('BV-LOC-TIM', [(LOC, 'if (q && !c.name', 'if (false && !c.name', 1)], r'✗ D2g'),
  ('BV-KHACH-BACK-URL', [(CUS, "get('khach')", "get('khong')", 2)], r'✗ D1b'),
  ('BV-KHACH-DON-CUA-NGUOI-KHAC', [(CUS, 'ordersApi.list({ customer_phone: sdt, limit: 10 })', 'ordersApi.list({ limit: 10 })', 1)], r'✗ D3d'),
  ('BV-KHACH-HOM-NAY-MAY', [(CUS, 'homNay: ngayVN()', 'homNay: new Date().toISOString().slice(0, 10)', 1)], r'✗ D1a'),
  ('BV-KHACH-BO-VI', [(CUS, '<ViKhach khach={kh} onDoi={lamMoiKhach} />', '', 1)], r'✗ D3c'),
  # ── E: hạng ──
  ('BV-HANG-KHONG-HOI-KHI-DOI', [(HANG, 'if (coDoi && !window.confirm(', 'if (false && !window.confirm(', 1)], r'✗ E1b'),
  ('BV-HANG-BO-PIN-KHI-LUU', [(HANG, 'pin: pinLuu', 'pin: undefined', 1)], r'✗ E2'),
  # ── F: chữ Thực thu ──
  ('BV-THUC-THU-CHU-CU', [(REP, '= tiền thật vào quán (gồm tiền khách nạp, đã trừ hoàn) — khớp tab Đối soát', '= tiền mặt + chuyển khoản thật nhận', 1)], r'✗ F1'),
]


def chay_ban(ten, thay, mau):
    tmp = tempfile.mkdtemp(prefix='dotbien_gd2_')
    try:
        shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
        shutil.copy(os.path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), tmp)
        for f, a, b, n in thay:
            p = os.path.join(tmp, f)
            assert os.path.realpath(p).startswith(os.path.realpath(tmp)), 'ghi xuyên ra ngoài bản sao'
            s = open(p, encoding='utf8').read()
            if s.count(a) != n:
                return 'HONG', f'{ten}: chuỗi gốc khớp {s.count(a)} lần (cần {n}) trong {f}'
            open(p, 'w', encoding='utf8').write(s.replace(a, b))
        r = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_GIAODIEN2.js'), '--goc', tmp], capture_output=True, text=True, timeout=300)
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
    kq, doi_chung = chay_ban('DOI-CHUNG', [], None)
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
