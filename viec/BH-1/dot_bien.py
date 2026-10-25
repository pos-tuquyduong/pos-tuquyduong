#!/usr/bin/env python3
"""BH-1 — đột biến cho client/src/pages/BanHang/ + App.jsx + bộ kiểm. Chạy ở GỐC kho:

    python3 viec/BH-1/dot_bien.py [tên …]        (không tên = chạy hết)

Mỗi đột biến dựng BẢN SAO thật (copytree, không symlink) trong thư mục tạm, thay chuỗi — chuỗi gốc phải khớp ĐÚNG số lần ghi sẵn
(không thì HỎNG, không chạy) — rồi chạy `node cong_cu/thu_BH1.js --goc <bản sao>`.
  BẮT  = bài thoát ≠ 0 VÀ có dòng "✗ <mã ca>" đúng ca dự kiến
  LẠC  = bài đỏ nhưng không đúng ca dự kiến      SỐNG = bài vẫn xanh (lỗ hổng bài thử)
Trước khi chấm, bản sao KHÔNG đột biến phải xanh (đối chứng) — đỏ thì dừng, không chấm gì.
Thoát 0 chỉ khi mọi đột biến BẮT.
"""
import os, re, shutil, subprocess, sys, tempfile

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BH = 'client/src/pages/BanHang/'
TINH, APP, KIEM = BH + 'tinh.js', 'client/src/App.jsx', 'kiem_tra_truoc_khi_giao.js'
CAN = [BH, 'client/src/pages/Sales.jsx', APP, KIEM]   # phần bản sao cần cho bài thử

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mã ca phải ✗)   file mới: chuỗi gốc None, số lần 0
DOT_BIEN = [
  ('BV-tra-lai-am', [(TINH, 'export const traLai = (phaiTra, dua) => Math.max(0, so(dua) - so(phaiTra));', 'export const traLai = (phaiTra, dua) => so(dua) - so(phaiTra);', 1)], 'F3'),
  ('VS-to-bang-so-phai-tra', [(TINH, 'TO_TIEN.filter((t) => t > can)', 'TO_TIEN.filter((t) => t >= can)', 1)], 'F8'),
  ('VS-to-bo-to-ngay-duoi', [(TINH, 'TO_TIEN.filter((t) => t > can)', 'TO_TIEN.filter((t) => t > can + 1)', 1)], 'F9'),
  ('VS-bo-gioi-han-4-nut', [(TINH, '.slice(0, SO_NUT_TIEN_TOI_DA);', ';', 1)], 'F10'),
  ('VS-dua-du-khong-can-phai-tra', [(TINH, 'so(phaiTra) > 0 && so(dua) >= so(phaiTra)', 'so(dua) >= so(phaiTra)', 1)], 'F5'),
  ('VS-ngung-hep-bang-600', [(TINH, 'so(rong) < NGUONG_DIEN_THOAI', 'so(rong) <= NGUONG_DIEN_THOAI', 1)], 'B2'),
  ('VS-kieu-ep-bi-bo', [(TINH, "if (kieu === 'dienthoai') return 'hai-trang';", '', 1)], 'B4'),
  ('VS-cong-tac-mac-dinh-bat', [(TINH, "kho.getItem(KHOA_CONG_TAC) === '1'", "kho.getItem(KHOA_CONG_TAC) !== '0'", 1)], 'A1'),
  ('VS-cong-tac-bat-khi-gia-tri-la', [(TINH, "kho.getItem(KHOA_CONG_TAC) === '1'", "!!kho.getItem(KHOA_CONG_TAC) && kho.getItem(KHOA_CONG_TAC) !== '0'", 1)], 'A7'),
  ('BV-kho-hong-doc', [(TINH, "  } catch {\n    return { bat: false, kieu: 'tudong' };\n  }", "  } finally {\n    // bỏ catch\n  }", 1)], 'A4'),
  ('BV-chan-hang-90', [(TINH, 'const pt = Math.min(HANG_TOI_DA, Math.max(0, so(phanTram)));', 'const pt = so(phanTram);', 1)], 'D4'),
  ('VS-hang-am-khong-ve-0', [(TINH, 'const pt = Math.min(HANG_TOI_DA, Math.max(0, so(phanTram)));', 'const pt = Math.min(HANG_TOI_DA, so(phanTram));', 1)], 'D5'),
  ('VS-hang-dac-biet-lay-nhom-thuong', [(TINH, 'laNhomDacBiet ? hang.special_discount_percent : hang.discount_percent', 'hang.discount_percent', 1)], 'D6'),
  ('VS-hang-het-han-van-giam', [(TINH, 'if (!hang || !hang.usable) return 0;', 'if (!hang) return 0;', 1)], 'D7'),
  ('VS-hang-cong-voi-flash', [(TINH, '(giamFlash > 0 ? m.unit_price : giaHang(', '(false ? m.unit_price : giaHang(', 1)], 'D11'),
  ('VS-flash-khi-khong-chay', [(TINH, 'const flashChay = !!(flash && flash.is_flash_now && flash.percent);', 'const flashChay = !!(flash && flash.percent);', 1)], 'D12'),
  ('BV-khach-giam-vuot-don', [(TINH, 'giamKhach = Math.min(giamKhach, Math.max(0, tamTinh - giamFlash - giamHang));', '', 1)], 'D14'),
  ('VS-ton-kho-bang-nhau', [(TINH, 'soDangCo + them > sp.stock_quantity', 'soDangCo + them >= sp.stock_quantity', 1)], 'E3'),
  ('VS-ton-kho-xa-hon-1', [(TINH, 'soDangCo + them > sp.stock_quantity', 'soDangCo + them > sp.stock_quantity + 1', 1)], 'E4'),
  ('BV-khong-quan-kho', [(TINH, '  if (sp.khong_quan_kho) return null;\n', '', 1)], 'E5'),
  ('BV-gia-null', [(TINH, 'if (!(typeof sp.price === \'number\' && sp.price > 0))', 'if (typeof sp.price !== \'number\')', 1)], 'E1'),
  ('BV-ghi-chu-cat-200', [(TINH, "return ds.join(', ').slice(0, GHI_CHU_TOI_DA);", "return ds.join(', ');", 1)], 'E7'),
  ('VS-ghi-chu-khong-bo-trung', [(TINH, 'if (thay.has(x)) return false; ', '', 1)], 'E7'),
  ('BV-chuyen-khoan-quen-tien', [(TINH, "transfer_amount: cach === 'transfer' ? conLai : 0,", 'transfer_amount: 0,', 1)], 'I3'),
  ('VS-tien-mat-tinh-theo-khach-dua', [(TINH, "cash_amount: cach === 'cash' ? conLai : 0,", "cash_amount: cach === 'cash' ? so(khachDua) : 0,", 1)], 'I2'),
  ('VS-so-du-mot-phan-bi-quen', [(TINH, 'balance_amount: soDuDung,', 'balance_amount: 0,', 1)], 'I4'),
  ('VS-tien-mat-khong-tru-so-du', [(TINH, 'const conLai = tong - soDuDung - soDuMeDung;', 'const conLai = tong;', 1)], 'I4'),
  ('BV-thieu-khoa-payload', [(TINH, '    membership_buy: null,\n', '', 1)], 'I11'),
  ('VS-tu-goi-duoc-gui', [(TINH, 'from_package: false,', 'from_package: true,', 1)], 'I7'),
  ('VS-me-quen-phone', [(TINH, 'parent_phone: soDuMeDung > 0 ? khach?.parent_phone || null : null,', 'parent_phone: khach?.parent_phone || null,', 1)], 'I6'),
  ('BV-ten-bai-trong-bo-kiem', [(KIEM, "'cong_cu/thu_P24.js', 'cong_cu/thu_BH1.js']", "'cong_cu/thu_P24.js']", 1)], 'S11'),
  ('BV-app-tro-lai-sales', [(APP, '<Route index element={<TrangChu />} />', '<Route index element={<Sales />} />', 1)], 'S8'),
  ('VS-sales-nhac-banhang', [('client/src/pages/Sales.jsx', "import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\n// BanHang", 1)], 'S10'),
  ('VS-fetch-tran-trong-banhang', [(BH + 'tam.js', None, "export const tai = () => fetch('/api/pos/x');\n", 0)], 'S2'),
  ('VS-tao-khach-o-quay', [(BH + 'tam.js', None, "export const them = () => api.post('/registrations', {});\n", 0)], 'S4'),
  ('VS-ghi-no', [(BH + 'tam.js', None, "export const nhan = 'Ghi nợ';\n", 0)], 'S5'),
  ('VS-chu-thoi', [(BH + 'tam.js', None, "export const nhan = 'Tiền thối';\n", 0)], 'S6'),
  ('VS-localstorage-ngoai-try', [(BH + 'tam.js', None, "export const doc = () => localStorage.getItem('a');\n", 0)], 'S3'),
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
    p = subprocess.run(['node', os.path.join(GOC, 'cong_cu', 'thu_BH1.js'), '--goc', tam], capture_output=True, text=True, timeout=120)
    return p.returncode, p.stdout + p.stderr


def main():
    chon = sys.argv[1:]
    ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
    with tempfile.TemporaryDirectory(prefix='bh1_') as tam:
        dung_ban_sao(tam)
        ma, ra = chay(tam)
        dong_tong = [l for l in ra.splitlines() if l.startswith('BH-1:')]
        print('ĐỐI CHỨNG (không đột biến):', dong_tong[-1] if dong_tong else '(không có dòng tổng)', '→', 'XANH' if ma == 0 else 'ĐỎ')
        if ma != 0 or not dong_tong:
            print(ra[-1500:]); sys.exit(2)
    bat = 0
    for ten, sua, ca in ds:
        with tempfile.TemporaryDirectory(prefix='bh1_') as tam:
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
