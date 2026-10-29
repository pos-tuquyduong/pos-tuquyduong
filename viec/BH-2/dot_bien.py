#!/usr/bin/env python3
"""BH-2 — đột biến cho client/src (màn Bán hàng mới đợt 2, menu 6 mục) + bộ kiểm. Chạy ở GỐC kho:

    python3 viec/BH-2/dot_bien.py [tên …]        (không tên = chạy hết)

Mỗi đột biến dựng BẢN SAO thật (copytree, không symlink) của client/src + kiem_tra_truoc_khi_giao.js trong thư mục tạm, thay chuỗi — chuỗi
gốc phải khớp ĐÚNG số lần ghi sẵn (không thì HỎNG, không chạy) — rồi chạy `node cong_cu/thu_BH2.js --goc <bản sao>` (máy chủ luôn là của kho thật).
  BẮT  = bài thoát ≠ 0 VÀ có dòng "✗ <mã ca>" đúng ca dự kiến
  LẠC  = bài đỏ nhưng không đúng ca dự kiến      SỐNG = bài vẫn xanh (lỗ hổng bài thử)
Trước khi chấm, bản sao KHÔNG đột biến phải xanh (đối chứng) — đỏ thì dừng, không chấm gì.
Thoát 0 chỉ khi mọi đột biến BẮT.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BH = 'client/src/pages/BanHang/'
TINH, MENU = BH + 'tinh.js', 'client/src/pages/QuanLy/menu.js'
BHM, QR, KT = BH + 'BanHangMoi.jsx', BH + 'ManQr.jsx', BH + 'ManKetThuc.jsx'
LAYOUT, APP, KIEM = 'client/src/components/Layout.jsx', 'client/src/App.jsx', 'kiem_tra_truoc_khi_giao.js'
CAN = ['client/src', KIEM]   # phần bản sao cần cho bài thử

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mã ca phải ✗)   file mới: chuỗi gốc None, số lần 0
DOT_BIEN = [
  # ── A · giá máy chủ tính ──
  ('BV-khoa-bo-ma', [(TINH, 'mon, ma: chuanMa(ma) });', 'mon });', 1)], 'A7'),
  ('VS-khoa-tinh-ca-ghi-chu', [(TINH, 'soLuong[m.product_id] = (soLuong[m.product_id] || 0) + m.quantity;', "const k2 = m.product_id + '|' + (m.note || ''); soLuong[k2] = (soLuong[k2] || 0) + m.quantity;", 1)], 'A2'),
  ('VS-khoa-bo-khach', [(TINH, 'sdt: khach?.phone || null,', 'sdt: null,', 1)], 'A6'),
  ('VS-khoa-bo-so-luong', [(TINH, '[Number(id), soLuong[id]]', '[Number(id), 1]', 1)], 'A4'),
  ('VS-ma-khong-viet-hoa', [(TINH, ".trim().toUpperCase();", ".trim();", 1)], 'A7'),
  ('BV-tinh-thu-mang-tien', [(TINH, '      quantity: m.quantity,\n      from_package: false,', '      quantity: m.quantity,\n      unit_price: m.unit_price,\n      from_package: false,', 1)], 'A9'),
  ('VS-tinh-thu-ma-rong-khong-null', [(TINH, 'discount_code: chuanMa(ma) || null,', 'discount_code: chuanMa(ma),', 1)], 'A10'),
  ('BV-so-may-chu-cu-van-dung', [(TINH, '!!mayChu && mayChu.khoa === khoa && Number.isFinite(mayChu.total)', '!!mayChu && Number.isFinite(mayChu.total)', 1)], 'A13'),
  ('VS-so-may-chu-thieu-tong', [(TINH, '!!mayChu && mayChu.khoa === khoa && Number.isFinite(mayChu.total)', '!!mayChu && mayChu.khoa === khoa', 1)], 'A13'),
  ('BV-nut-thu-bo-coSo', [(TINH, 'if (!coSo || dangGui) return false;', 'if (dangGui) return false;', 1)], 'A12'),
  ('VS-nut-thu-bo-dangGui', [(TINH, 'if (!coSo || dangGui) return false;', 'if (!coSo) return false;', 1)], 'A14'),
  ('BV-gia-0-van-ban', [(TINH, "typeof sp?.price === 'number' && sp.price > 0", "typeof sp?.price === 'number' && sp.price >= 0", 1)], 'A15'),
  # ── B / C · tiền mặt, QR ──
  ('VS-nut-ck-luon-sang', [(TINH, "if (cach === 'chuyen_khoan') return so(phaiTra) > 0;", "if (cach === 'chuyen_khoan') return true;", 1)], 'C7'),
  ('VS-gio-het-han-theo-utc', [(TINH, "const MUI_VN = '+07:00';", "const MUI_VN = '+00:00';", 1)], 'C1'),
  ('VS-dem-nguoc-lam-tron-xuong', [(TINH, 'Math.ceil((m - bayGioMs) / 1000)', 'Math.floor((m - bayGioMs) / 1000)', 1)], 'C3'),
  ('VS-dem-nguoc-am', [(TINH, 'return Math.max(0, Math.ceil(', 'return (Math.ceil(', 1)], 'C2'),
  ('VS-dinh-dang-giay-thieu-so-0', [(TINH, "String(g % 60).padStart(2, '0')", 'String(g % 60)', 1)], 'C4'),
  ('VS-phien-het-han-van-doi', [(TINH, "['het_han', 'huy', 'loi'].includes(trangThai)", "['huy', 'loi'].includes(trangThai)", 1)], 'C5'),
  ('VS-phien-xong-bi-bo', [(TINH, "if (trangThai === 'da_thu') return 'xong';", '', 1)], 'C5'),
  ('VS-phien-la-tu-nha', [(TINH, "includes(trangThai) ? 'nha' : 'doi';", "includes(trangThai) ? 'nha' : 'nha';", 1)], 'C6'),
  # ── D · tài khoản + PIN ──
  ('VS-chia-vuot-tong', [(TINH, 'Math.min(Math.max(0, so(khach?.balance)), t)', 'Math.max(0, so(khach?.balance))', 1)], 'D4'),
  ('VS-chia-me-tren-tong', [(TINH, 'Math.min(Math.max(0, so(khach?.parent_balance)), t - soDuDung)', 'Math.min(Math.max(0, so(khach?.parent_balance)), t)', 1)], 'D3b'),
  ('BV-chia-bo-nut-bo', [(TINH, 'const soDuDung = dungTK ?', 'const soDuDung = true ?', 1)], 'D2'),
  ('VS-chia-so-du-am', [(TINH, 'Math.min(Math.max(0, so(khach?.balance)), t)', 'Math.min(so(khach?.balance), t)', 1)], 'D6'),
  ('VS-cach-tra-het-nut', [(TINH, 'so(phaiTra) > 0 ? [', 'so(phaiTra) > 1 ? [', 1)], 'D10'),
  ('VS-cach-tra-0-van-tien-mat', [(TINH, 'so(phaiTra) > 0 ? [', 'so(phaiTra) >= 0 ? [', 1)], 'D8'),
  ('VS-pin-khoa-nhap-lai', [(TINH, "if (code === 'PIN_DANG_KHOA') return 've_gio';", "if (code === 'PIN_DANG_KHOA') return 'nhap_lai';", 1)], 'D12'),
  ('VS-pin-chua-co-bo-qua', [(TINH, "if (code === 'CHUA_CO_PIN') return 'dat_pin';", '', 1)], 'D12'),
  ('VS-dat-pin-khong-so-khop', [(TINH, ": 'PIN_KHONG_KHOP';", ': null;', 1)], 'D13'),
  ('VS-pin-nam-so', [(TINH, 'cur.length < DO_DAI_PIN', 'cur.length <= DO_DAI_PIN', 1)], 'D14'),
  ('VS-pin-phim-la', [(TINH, r'/^\d$/.test(phim) && cur.length', 'cur.length', 1)], 'D14'),
  ('VS-phien-pin-luon-gui', [(TINH, 'if (dungTK) than.pin = pin;', 'than.pin = pin;', 1)], 'D15'),
  ('VS-phien-me-quen-dieu-kien', [(TINH, 'if (dungMe && khach?.parent_phone)', 'if (khach?.parent_phone)', 1)], 'D16'),
  ('BV-phien-gui-tien', [(TINH, 'const than = { cach, don, tru_tai_khoan', 'const than = { cach, don, total: 1, tru_tai_khoan', 1)], 'D17'),
  ('VS-phien-doi-cach', [(TINH, 'const than = { cach, don,', "const than = { cach: 'ck_tay', don,", 1)], 'R6'),
  ('BV-phien-mat-khach', [(TINH, 'const than = { cach, don, tru_tai_khoan', 'const than = { cach, don: { items: don.items }, tru_tai_khoan', 1)], 'R11'),
  # ── F · menu ──
  ('BV-menu-con-dang-ky-moi', [(MENU, "  { to: '/quan-ly', ten: 'Quản lý' },\n];", "  { to: '/quan-ly', ten: 'Quản lý' },\n  { to: '/registrations', ten: 'Đăng ký mới' },\n];", 1)], 'F1'),
  ('VS-hom-nay-khong-quyen', [(MENU, "ten: 'Hôm nay', quyen: 'view_reports' },\n  { to: '/orders', ten: 'Đơn hàng'", "ten: 'Hôm nay' },\n  { to: '/orders', ten: 'Đơn hàng'", 1)], 'F3'),
  ('BV-bo-kiem-quyen', [(MENU, 'const hien = (coQuyen, quyen) => !quyen || coQuyen(quyen);', 'const hien = () => true;', 1)], 'F3'),
  ('BV-o-rong-van-hien', [(MENU, '.filter((o) => o.loi.length > 0);', ';', 1)], 'F7'),
  ('VS-loi-hoan-tien-khong-quyen', [(MENU, "ten: 'Hoàn tiền', quyen: 'approve_refund'", "ten: 'Hoàn tiền'", 1)], 'F8'),
  ('VS-loi-so-du-sai-duong', [(MENU, "to: '/balance', ten: 'Số dư'", "to: '/balances', ten: 'Số dư'", 1)], 'F8'),
  ('VS-menu-dien-thoai-them-hoan-tien', [(MENU, "{ to: null, ten: 'Thêm' }", "{ to: null, ten: 'Thêm' },\n  { to: '/refunds', ten: 'Hoàn tiền' }", 1)], 'F2'),
  # ── cấu trúc ──
  ('BV-thu-bang-orders-create', [(BHM, 'ordersApi.tinhThu(thanTinhThu(gio, khach, ma))', 'ordersApi.create(thanTinhThu(gio, khach, ma))', 1)], 'S2'),
  ('VS-xac-nhan-tay-ai-cung-thay', [(QR, "hasPermission('xac_nhan_ck_tay') &&", 'true &&', 1)], 'S7'),
  ('VS-nut-da-nhan-ck', [(QR, 'Huỷ — quay về giỏ</button>', 'Huỷ — quay về giỏ</button><button>Đã nhận chuyển khoản</button>', 1)], 'S6'),
  ('BV-qr-khong-hoi-phien', [(QR, 'thanhToanApi.hoiPhien(phien.id)', 'thanhToanApi.huyPhien(phien.id)', 1)], 'S5'),
  ('BV-ket-thuc-mat-to-luu', [(KT, "['luu', 'Tờ lưu']", "['luu', 'Tờ 2']", 1)], 'S9'),
  ('BV-ket-thuc-mat-tra-lai', [(KT, 'Trả lại khách<b>', 'Tiền thối<b>', 1)], 'S10'),
  ('BV-lien-chong-bam-doi', [(BHM, 'if (dangGuiRef.current || !coSo) return;', 'if (!coSo) return;', 1)], 'S12'),
  ('BV-khoa-luoi-sau-thanh-toan', [(BHM, "xong && !daIn ? ' bh-khoa' : ''", "''", 1)], 'S12'),
  ('VS-layout-con-dang-ky-moi', [(LAYOUT, '  const gan = ', "  const dangKy = 'Đăng ký mới';\n  const gan = ", 1)], 'S14'),
  ('BV-app-mat-route-quan-ly', [(APP, 'path="quan-ly"', 'path="quan-ly-x"', 1)], 'S15'),
  ('BV-app-mat-route-cu', [(APP, '        <Route path="registrations" element={<Registrations />} />\n', '', 1)], 'S15'),
  ('BV-app-trang-chu-ve-sales', [(APP, '<Route index element={<TrangChu />} />', '<Route index element={<Sales />} />', 1)], 'S16'),
  ('BV-bo-bai-khoi-bo-kiem', [(KIEM, "'cong_cu/thu_BH2.js', ", '', 1)], 'S18'),
  ('VS-fetch-tran', [(BH + 'tam.js', None, "export const tai = () => fetch('/api/pos/x');\n", 0)], 'S1'),
  ('VS-van-dung-orders-create', [(BH + 'tam.js', None, "export const tao = (d) => ordersApi.create(d);\n", 0)], 'S3'),
  ('VS-ghi-no', [(BH + 'tam.js', None, "export const nhan = 'Ghi nợ';\n", 0)], 'S13'),
]


def dung_ban_sao(tam):
    for rel in CAN:
        nguon = os.path.join(GOC, rel)
        dich = os.path.join(tam, rel)
        if os.path.isdir(nguon):
            shutil.copytree(nguon, dich, symlinks=False)
            continue
        os.makedirs(os.path.dirname(dich), exist_ok=True)
        shutil.copyfile(nguon, dich)
    for r, _, fs in os.walk(tam):   # bản sao phải là file thật (K5)
        for f in fs:
            assert not os.path.islink(os.path.join(r, f)), 'symlink trong bản sao'


def chay(tam):
    p = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_BH2.js'), '--goc', tam], capture_output=True, text=True, timeout=300)
    return p.returncode, p.stdout + p.stderr


def main():
    chon = sys.argv[1:]
    ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
    with tempfile.TemporaryDirectory(prefix='bh2_') as tam:
        dung_ban_sao(tam)
        ma, ra = chay(tam)
        dong_tong = [l for l in ra.splitlines() if l.startswith('BH-2:')]
        print('ĐỐI CHỨNG (không đột biến):', dong_tong[-1] if dong_tong else '(không có dòng tổng)', '→', 'XANH' if ma == 0 else 'ĐỎ')
        if ma != 0 or not dong_tong:
            print(ra[-1500:]); sys.exit(2)
    bat = 0
    for ten, sua, ca in ds:
        with tempfile.TemporaryDirectory(prefix='bh2_') as tam:
            dung_ban_sao(tam)
            hong = None
            for rel, goc, moi, so_lan in sua:
                f = os.path.join(tam, rel)
                if goc is None:
                    open(f, 'w', encoding='utf8').write(moi); continue
                s = open(f, encoding='utf8').read()
                if s.count(goc) != so_lan:
                    hong = f'{rel}: chuỗi gốc khớp {s.count(goc)} lần, cần {so_lan}'; break
                open(f, 'w', encoding='utf8').write(s.replace(goc, moi))
            if hong:
                print(f'HỎNG {ten} — {hong}'); continue
            ma, ra = chay(tam)
            do = [l for l in ra.splitlines() if re.search(r'✗ ' + re.escape(ca) + r'\b', l)]
            if ma != 0 and do:
                bat += 1; print(f'BẮT  {ten}  → ✗ {ca}')
            elif ma != 0:
                print(f'LẠC  {ten}  (đỏ nhưng không ✗ {ca})')
            else:
                print(f'SỐNG {ten}')
    print(f'\nĐỘT BIẾN: {bat}/{len(ds)} BẮT')
    sys.exit(0 if bat == len(ds) else 1)


if __name__ == '__main__':
    main()
