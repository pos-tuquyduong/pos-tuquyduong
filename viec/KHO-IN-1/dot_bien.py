#!/usr/bin/env python3
"""KHO-IN-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/KHO-IN-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/KHO-IN-1/dot_bien.py --liet-ke          (chỉ in danh sách)

Khuôn viec/KH-QUAY-2/dot_bien.py: chép server/, cong_cu/, client/src/ ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng file thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UI, XP, CSS = 'client/src/utils/inPhieu.js', 'client/src/pages/Kho/XemPhieu.jsx', 'client/src/pages/Kho/inPhieuKho.css'
CD, ST, IS = 'client/src/pages/CaiDat/InPhieu.jsx', 'client/src/pages/Settings.jsx', 'client/src/pages/InvoiceSettings.jsx'
SV, DB = 'server/routes/settings.js', 'server/database.js'
BAI = {'in1': 'cong_cu/thu_KHOIN1.js', 'q2': 'cong_cu/thu_KHQUAY2.js', 'p16': 'cong_cu/thu_P16.js'}

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── Máy chủ: kiểm khoá in_phieu_* ──
  ('BV-SV-BO-KIEM', 'in1', [(SV, "    if (inPhieuSai) return res.status(400).json({ success: false, error: `Cài đặt ${inPhieuSai} không hợp lệ`, code: 'CAI_DAT_KHONG_HOP_LE' });\n", '', 1)], r"✗ A khổ lạ 'a3'"),
  ('VS-SV-KHO-58', 'in1', [(SV, "const KHO_IN_PHIEU = ['80mm', 'a5', 'a4'];", "const KHO_IN_PHIEU = ['58mm', '80mm', 'a5', 'a4'];", 1)], r"✗ A khổ nhiệt '58mm'"),
  ('VS-SV-KHO-THIEU-A5', 'in1', [(SV, "const KHO_IN_PHIEU = ['80mm', 'a5', 'a4'];", "const KHO_IN_PHIEU = ['80mm', 'a4'];", 1)], r'✗ A (lưu rồi đọc lại|hợp lệ → 200)'),
  ('VS-SV-BAN-TOI-DA-4', 'in1', [(SV, 'const SO_BAN_IN_TOI_DA = 3;', 'const SO_BAN_IN_TOI_DA = 4;', 1)], r'✗ A số bản: ngay dưới'),
  ('VS-SV-BAN-TOI-DA-2', 'in1', [(SV, 'const SO_BAN_IN_TOI_DA = 3;', 'const SO_BAN_IN_TOI_DA = 2;', 1)], r'✗ A (số bản: ranh giới|lưu rồi đọc lại|hợp lệ → 200)'),
  ('VS-SV-BAN-TOI-THIEU-0', 'in1', [(SV, 'Number(v) >= 1 && ', 'Number(v) >= 0 && ', 1)], r'✗ A số bản: ngay dưới'),
  ('VS-SV-LOAI-LA', 'in1', [(SV, '(px|dh|pn|ps)_(kho|ban)', r'(px|dh|pn|ps|\w+)_(kho|ban)', 1)], r'✗ A loại lạ'),
  ('VS-SV-TRUONG-LA', 'in1', [(SV, '_(kho|ban)$/', '_(kho|ban|\\w+)$/', 1)], r'✗ A loại lạ'),
  ('VS-SV-CHAN-QUA-TAY', 'in1', [(SV, "if (!key.startsWith('in_phieu_')) return false;", "if (!key.startsWith('in_phieu_')) return true;", 1)], r'✗ A khoá cài đặt khác'),
  ('VS-SV-GHI-TRUOC-KIEM', 'in1', [(SV, "    let updated = 0;\n", "    for (const [kk, vv] of Object.entries(settings)) { if (kk.startsWith('in_phieu_')) await run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [kk, String(vv)]); }\n    let updated = 0;\n", 1),
                         (SV, "    if (inPhieuSai) return res.status(400)", "    if (inPhieuSai && false) return res.status(400)", 1)], r'✗ A '),
  ('BV-SV-LOG-A5', 'in1', [(SV, "paper_size = '80mm'", "paper_size = 'a5'", 1)], r'✗ C đường đọc máy chủ'),
  ('BV-SEED-A5', 'in1', [(DB, "['invoice_default_size', '80mm']", "['invoice_default_size', 'a5']", 1)], r'✗ C seed máy chủ'),
  # ── Hàm thuần inPhieu.js ──
  ('BV-UI-THIEU-A5', 'in1', [(UI, "export const KHO_PHIEU_KHO = ['80mm', 'a5', 'a4'];", "export const KHO_PHIEU_KHO = ['80mm', 'a4'];", 1)], r'✗ B0 KHO_PHIEU_KHO'),
  ('VS-UI-KHOA-VIET-HOA', 'in1', [(UI, 'String(loai).toLowerCase()', 'String(loai).toUpperCase()', 1)], r'✗ B0 tên khoá'),
  ('VS-UI-BAN-TOI-DA-4', 'in1', [(UI, 'ban <= SO_BAN_TOI_DA ?', 'ban <= SO_BAN_TOI_DA + 1 ?', 1)], r'✗ B0 số bản: ngay dưới'),
  ('VS-UI-BAN-TOI-THIEU-0', 'in1', [(UI, 'ban >= 1 && ban <=', 'ban >= 0 && ban <=', 1)], r'✗ B0 (chưa có cài đặt|số bản)'),
  ('VS-UI-MAC-DINH-A4', 'in1', [(UI, 'kho: KHO_PHIEU_KHO[0], ban: 1 }', 'kho: KHO_PHIEU_KHO[2], ban: 1 }', 1)], r'✗ B0 chưa có cài đặt'),
  ('VS-UI-KHONG-KIEM-KHO', 'in1', [(UI, "kho: chonKho(settings?.[khoaInPhieu(loai, 'kho')], KHO_PHIEU_KHO, MAC_DINH_PHIEU_KHO.kho),", "kho: settings?.[khoaInPhieu(loai, 'kho')] || MAC_DINH_PHIEU_KHO.kho,", 1)], r'✗ B0 khổ lạ'),
  ('VS-UI-CHUNG-KHOA', 'in1', [(UI, "settings?.[khoaInPhieu(loai, 'kho')], KHO_PHIEU_KHO", "settings?.[khoaInPhieu('PX', 'kho')], KHO_PHIEU_KHO", 1)], r'✗ B0 mỗi loại'),
  ('VS-UI-BAN-CHUNG-KHOA', 'in1', [(UI, "Number(settings[khoaInPhieu(loai, 'ban')])", "Number(settings[khoaInPhieu('PX', 'ban')])", 1)], r'✗ B0 số bản đọc đúng theo loại'),
  ('VS-UI-NUT-KHONG-DAU', 'in1', [(UI, 'return [dau, ...KHO_PHIEU_KHO.filter((x) => x !== dau)];', 'return [...KHO_PHIEU_KHO];', 1)], r'✗ B0 thứ tự nút'),
  ('VS-UI-NUT-LAP', 'in1', [(UI, 'return [dau, ...KHO_PHIEU_KHO.filter((x) => x !== dau)];', 'return [dau, ...KHO_PHIEU_KHO];', 1)], r'✗ B0 thứ tự nút'),
  ('VS-UI-NUT-KHO-LA', 'in1', [(UI, 'const dau = chonKho(khoMacDinh, KHO_PHIEU_KHO, MAC_DINH_PHIEU_KHO.kho);', 'const dau = khoMacDinh;', 1)], r'✗ B0 khổ lạ truyền vào'),
  ('VS-QUA-TAY-KHO-BILL-A5', 'in1', [(UI, "export const KHO_BILL = ['58mm', '80mm'];", "export const KHO_BILL = ['58mm', '80mm', 'a5'];", 1)], r'✗ D1 hoá đơn khách vẫn chỉ khổ nhiệt'),
  ('VS-QUA-TAY-KHO-PHA-CHE', 'in1', [(UI, "export const KHO_PHIEU = ['80mm', '58mm'];", "export const KHO_PHIEU = ['80mm', '58mm', 'a5'];", 1)], r'✗ D1 khổ tem'),
  ('VS-QUA-TAY-BO-IN-MAC-DINH', 'in1', [(UI, "bill: { bat: true, ban: 1, kho: '80mm' },", "bill: { bat: true, ban: 2, kho: '80mm' },", 1)], r'✗ D1 bộ in sau thanh toán'),
  # ── Màn xem phiếu ──
  ('BV-XP-NUT-CUNG', 'in1', [(XP, 'thuTuNutIn(mac.kho).map(', "['80mm', 'a5', 'a4'].map(", 1)], r'✗ B nút in dựng từ thuTuNutIn'),
  ('BV-XP-KHONG-DOC-CAI-DAT', 'in1', [(XP, 'docInPhieuKho(caiDat, dl?.phieu.loai)', 'docInPhieuKho({}, dl?.phieu.loai)', 1)], r'✗ B màn đọc cài đặt'),
  ('BV-XP-KHONG-TAI-CAI-DAT', 'in1', [(XP, "api.get('/settings').then((r) => setCaiDat(r.data || {}))", "Promise.resolve({}).then((r) => setCaiDat(r.data || {}))", 1)], r'✗ B màn đọc cài đặt'),
  ('VS-XP-SO-BAN-MOT', 'in1', [(XP, 'length: kho ? mac.ban : 1 }', 'length: 1 }', 1)], r'✗ B số bản'),
  ('VS-XP-BAN-LUON-NHIEU', 'in1', [(XP, 'length: kho ? mac.ban : 1 }', 'length: mac.ban }', 1)], r'✗ B số bản'),
  ('BV-XP-THIEU-A5', 'in1', [(XP, "a5: '@page { size: A5; margin: 8mm; }', ", '', 1)], r'✗ B KHO_IN có đủ'),
  ('VS-XP-A5-KHONG-LE', 'in1', [(XP, 'size: A5; margin: 8mm;', 'size: A5;', 1)], r'✗ B khổ A5 có lề'),
  ('VS-XP-A5-LA-A4', 'in1', [(XP, 'size: A5; margin: 8mm;', 'size: A4; margin: 8mm;', 1)], r'✗ B @page'),
  ('BV-XP-KHONG-TO-MAC-DINH', 'in1', [(XP, "i === 0 ? 'btn-primary' : 'btn-outline'", "'btn-outline'", 1)], r'✗ B nút khổ mặc định được tô nổi'),
  ('VS-XP-IN-TRUOC-GHI', 'in1', [(XP, "const inRa = async (k) => { if (await ghi(() => api.post(`/kho/phieu/${id}/in`))) setKho(k); };", "const inRa = async (k) => { setKho(k); await ghi(() => api.post(`/kho/phieu/${id}/in`)); };", 1)], r'✗ B lệnh in vẫn'),
  ('VS-XP-MAT-IN-LAI', 'in1', [(XP, '<div className="kho-in-lai">IN LẠI · LẦN {p.so_lan_in}</div>', '<div className="kho-in-lai">{p.so_lan_in}</div>', 1)], r'✗ B tờ in thêm'),
  ('VS-QUA-TAY-XP-MAT-KHOI-B', 'in1', [(XP, '{laPX && <h4 className="kho-muc">B · Định lượng từng công thức</h4>}', '', 1)], r'✗ D4 nội dung phiếu kho'),
  ('VS-QUA-TAY-XP-MAT-CHU-KY', 'in1', [(XP, "'Người lập: ________ · Người nhận / duyệt: ________'", "''", 1)], r'✗ D4 nội dung phiếu kho'),
  # ── CSS ──
  ('BV-CSS-KHONG-NGAT-TRANG', 'in1', [(CSS, '.kho-ban { break-after: page; page-break-after: always; }', '', 1)], r'✗ B CSS in: ngắt trang'),
  ('BV-CSS-BAN-AN-KHI-IN', 'in1', [(CSS, '  .kho-ban:not(:first-child) { display: block; }\n', '', 1)], r'✗ B CSS in: các bản sau'),
  ('BV-CSS-BAN-HIEN-MAN-HINH', 'in1', [(CSS, '.kho-ban:not(:first-child) { display: none; }\n', '', 1)], r'✗ B CSS màn hình'),
  ('BV-CSS-A5', 'in1', [(CSS, '  .kho-in-a5 { font-size: 13px; }\n', '', 1)], r'✗ B CSS in: có kiểu cho khổ a5'),
  ('BV-CSS-TRAN-CHU', 'in1', [(CSS, '  .kho-in { overflow-wrap: anywhere; }\n', '', 1)], r'✗ B CSS in: dòng bảng không tràn'),
  # ── Khối Cài đặt in phiếu ──
  ('BV-CD-KHONG-CHAN-LUU', 'in1', [(CD, 'if (taiLoi || !gia) return;', '', 1)], r'✗ B2 không cho Lưu'),
  ('VS-CD-LUU-SAI-KHOA', 'in1', [(CD, "settings[khoaInPhieu(l, 'ban')] = String(gia[l].ban);", "settings[khoaInPhieu(l, 'kho')] = String(gia[l].ban);", 1)], r'✗ B2 lưu'),
  ('VS-CD-LUU-KHONG-DOC-MAY-CHU', 'in1', [(CD, 'docInPhieuKho(r.data || {}, l)', 'docInPhieuKho({}, l)', 1)], r'✗ B2 đọc lại'),
  ('BV-ST-KHONG-GAN', 'in1', [(ST, '            <InPhieu />\n', '            null\n', 1)], r'✗ B2 Settings.jsx'),
  ('BV-ST-KHONG-NHOM', 'in1', [(ST, " ['inPhieu', 'manage_settings'],", '', 1)], r'✗ B2 Settings.jsx'),
  ('VS-ST-QUYEN-LA', 'in1', [(ST, "inPhieu: 'manage_settings',", "inPhieu: 'export_data',", 1)], r'✗ B2 Settings.jsx'),
  # ── Ô Khổ mặc định của hoá đơn ──
  ('BV-IS-DOC-KHOA-CU', 'in1', [(IS, 'value={khoHoaDon(boIn.bill.kho)}', 'value={khoHoaDon(config.default_size)}', 1)], r'✗ C ô "Khổ mặc định" đọc'),
  ('BV-IS-GHI-KHOA-CU', 'in1', [(IS, 'setBoIn((b) => ({ ...b, bill: { ...b.bill, kho: e.target.value } }))', 'setConfig((prev) => ({ ...prev, default_size: e.target.value }))', 1)], r'✗ C đổi ô'),
  ('BV-IS-KHONG-GUI-KHOA', 'in1', [(IS, '[KHOA_BO_IN]: JSON.stringify(boIn), invoice_default_size: khoHoaDon(boIn.bill.kho) }', '[KHOA_BO_IN]: JSON.stringify(boIn) }', 1)], r'✗ C lưu'),
  ('VS-IS-GUI-KHI-CHUA-NAP', 'in1', [(IS, '...(boIn ? { [KHOA_BO_IN]: JSON.stringify(boIn), invoice_default_size: khoHoaDon(boIn.bill.kho) } : {}),', "...(boIn ? { [KHOA_BO_IN]: JSON.stringify(boIn) } : {}), invoice_default_size: khoHoaDon(boIn ? boIn.bill.kho : ''),", 1)], r'✗ C chỉ gửi'),
]


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_khoin1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu'), os.path.join(tmp, 'cong_cu'))
  shutil.copytree(os.path.join(GOC, 'client', 'src'), os.path.join(tmp, 'client', 'src'))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp, bai):
  r = subprocess.run(['node', os.path.join(tmp, BAI[bai])], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, bai, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    ok, dong = True, []
    for bai in BAI:
      ma, ra = chay_bai(tmp, bai)
      m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
      ok = ok and ma == 0 and m is not None and m.group(2) == '0'
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]))
    return ok, ' · '.join(dong)
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, dong = doi_chung()
  print(f'ĐỐI CHỨNG (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
