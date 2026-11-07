#!/usr/bin/env python3
"""TINGEE-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/TINGEE-1/dot_bien.py [tên...]          (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/TINGEE-1/dot_bien.py --liet-ke          (chỉ in danh sách)
    python3 viec/TINGEE-1/dot_bien.py --help

Khuôn viec/SEPAY-1/dot_bien.py: chép server/, bài thử, bộ kiểm (phép T3) và hai hướng dẫn (phép F1) ra thư mục tạm (BẢN CHÉP THẬT — chỉ
node_modules nối symlink), thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy bài thử TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
Không đụng server/ thật, data/, Turso, không gọi Tingee.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TG, SP, CQ = 'server/utils/tingee.js', 'server/utils/sepay.js', 'server/utils/congQr.js'
TT, IX, DS, ST = 'server/routes/thanh-toan.js', 'server/index.js', 'server/utils/doiSoat.js', 'server/routes/settings.js'
KT, HD = 'kiem_tra_truoc_khi_giao.js', 'viec/TINGEE-1/cai_dat_tingee.md'
BAI = {'tg': 'cong_cu/thu_TINGEE1.js', 'sp': 'cong_cu/thu_SEPAY1.js'}
CHEP = list(BAI.values()) + [KT, HD, 'viec/SEPAY-1/cai_dat_sepay.md']

# (tên, bài, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── C: chữ ký Webhook Tingee (tingee.js kiemBao) ──
  ('BV-chu-ky', 'tg', [(TG, 'return a.length === b.length && crypto.timingSafeEqual(a, b); };', 'return true; };', 1)], r'✗ C3 chữ ký sai một ký tự'),
  ('VS-ky-chi-ban-gon', 'tg', [(TG, "  if (khop(than)) return 'tho';\n", '', 1)], r'✗ C5 thân có dấu cách / xuống dòng'),
  ('VS-ky-chi-than-tho', 'tg', [(TG, "return khop(gon) ? 'gon' : null;", 'return null;', 1)], r'✗ C5 thân có dấu cách nhưng'),
  ('VS-nguong-gio-300-giay', 'tg', [(TG, '|| !DANG_TS.test(ts)) return null;',
    "|| !DANG_TS.test(ts) || Math.abs(Date.now() - new Date(ts.replace(/^(\\d{4})(\\d\\d)(\\d\\d)(\\d\\d)(\\d\\d)(\\d\\d)(\\d{3})$/, '$1-$2-$3T$4:$5:$6.$7+07:00')).getTime()) > 300000) return null;", 1)],
    r'✗ C4 mốc giờ CŨ'),
  ('BV-dang-timestamp', 'tg', [(TG, ' || !DANG_TS.test(ts)) return null;', ') return null;', 1)], r'✗ C3 x-request-timestamp sai dạng'),
  ('VS-lo-khoa-nhat-ky', 'tg', [(TG, "const khoa = cauHinh().khoa, ts =", "const khoa = cauHinh().khoa, _l = console.warn('khoa', cauHinh().khoa), ts =", 1)], r'✗ X1 '),
  # ── A / B: cấu hình + QR ──
  ('VS-thieu-client-id-van-cai', 'tg', [(TG, 'return !!c.id && !!c.khoa &&', 'return !!c.khoa &&', 1)], r'✗ A2 thiếu / sai TINGEE_CLIENT_ID'),
  ('VS-moi-truong-la-van-cai', 'tg', [(TG, ' && MOI_TRUONG.includes(c.moiTruong); };', '; };', 1)], r'✗ A2 thiếu / sai TINGEE_MOI_TRUONG lạ'),
  ('VS-moi-truong-chi-production', 'tg', [(TG, "const MOI_TRUONG = ['', 'production', 'uat'];", "const MOI_TRUONG = ['', 'production'];", 1)], r'✗ A3 TINGEE_MOI_TRUONG=uat'),
  ('VS-dang-so-tk-long', 'tg', [(TG, '/^[0-9A-Za-z]{1,19}$/.test(c.soTk) && MOI', '!!c.soTk && MOI', 1)], r'✗ A2 thiếu / sai TINGEE_SO_TK sai dạng'),
  ('VS-qr-sai-so-tk', 'tg', [(TG, 'dungVietQr({ bin: c.bin, soTk: c.soTk,', "dungVietQr({ bin: c.bin, soTk: c.soTk.replace(/[A-Z]/g, ''),", 1)], r'✗ B2 '),
  ('BV-cong-tingee', 'tg', [(CQ, ", tingee: require('./tingee') };", ' };', 1)], r'✗ A1 '),
  ('BV-cong-qr-settings', 'tg', [(ST, '      data: settingsObj,\n      cong_qr: {', '      data: settingsObj,\n      cong_qr_bo: {', 1)], r'✗ A5 '),
  # ── C: đọc báo (tingee.js docBao) + trả lời (thanh-toan.js webhookTingee) ──
  ('BV-tk-va', 'tg', [(TG, "tkKhac: va && va === cauHinh().soTk.toUpperCase() ? null : va || '(trống)' };", 'tkKhac: null };', 1)], r'✗ D3 vaAccountNumber KHÁC'),
  # vòng sửa 1 (soát vòng 1): VA rỗng + chưa cài số VA không được "rỗng bằng rỗng"; số gốc trùng không thay được VA; type khác chữ hoa / null
  ('BV-va-rong-khop', 'tg', [(TG, 'tkKhac: va && va === cauHinh()', 'tkKhac: va === cauHinh()', 1)], r'✗ D3 máy chủ CHƯA cài'),
  ('VS-tk-mot-trong-hai', 'tg', [(TG, "const va = String(b.vaAccountNumber ?? '')",
    "const va = String((String(b.accountNumber ?? '').toUpperCase() === cauHinh().soTk.toUpperCase() ? b.accountNumber : b.vaAccountNumber) ?? '')", 1)],
    r'✗ D3 accountNumber = TINGEE_SO_TK'),
  ('VS-type-phan-biet-hoa', 'tg', [(TG, "String(b.type).toLowerCase() === 'credit'", "b.type === 'credit'", 1)], r'✗ C6 type "CREDIT"'),
  ('VS-tk-so-goc', 'tg', [(TG, "const va = String(b.vaAccountNumber ?? '')", "const va = String(b.accountNumber ?? '')", 1)], r'✗ C1 phiên da_thu'),
  ('VS-tk-phan-biet-hoa-thuong', 'tg', [(TG, ".replace(/\\s+/g, '').toUpperCase();", ".replace(/\\s+/g, '');", 1)], r'✗ D3 accountNumber'),
  ('VS-bat-buoc-type', 'tg', [(TG, "vao: b.type == null || String(b.type).toLowerCase() === 'credit'", "vao: String(b.type).toLowerCase() === 'credit'", 1)], r'✗ C6 không có trường type'),
  ('BV-loc-tien-ra', 'tg', [(TG, "vao: b.type == null || String(b.type).toLowerCase() === 'credit'", 'vao: true', 1)], r'✗ C6 type "debit"'),
  ('BV-doc-gio-giao-dich', 'tg', [(TG, 'luc: d ? `', 'luc: d && false ? `', 1)], r'✗ D5 transactionDate 1 giây SAU'),
  ('VS-khoa-khong-tien-to', 'tg', [(TG, 'khoa: `tingee:${b.transactionCode}`', 'khoa: `${b.transactionCode}`', 1)], r'✗ C1 một dòng sự kiện'),
  ('BV-tra-02', 'tg', [(TT, "    if (await queryOne('SELECT 1 AS co FROM pos_payos_su_kien WHERE khoa = ?', [d.khoa])) return res.json({ code: '02', message: 'Đã ghi nhận trước đó' });\n", '', 1)], r'✗ C2 '),
  ('VS-tra-success', 'tg', [(TT, '    res.json = (x) => json(x?.success === true ? DA_NHAN_TINGEE : x);\n', '', 1)], r'✗ C1 đúng chữ ký'),
  ('VS-401-ma-sai', 'tg', [(TT, "{ error: 'Chữ ký không hợp lệ', code: '09' }", "{ error: 'Chữ ký không hợp lệ', code: 'CHU_KY_SAI' }", 1)], r'✗ C3 '),
  ('VS-tin-la-400', 'tg', [(TT, "|| Array.isArray(b)) return res.status(400)", "|| Array.isArray(b) || !b.transactionCode) return res.status(400)", 1)], r'✗ C8 '),
  ('BV-luu-client-id', 'tg', [(TT, 'duLieu: { ...b, clientId: undefined }', 'duLieu: b', 1)], r'✗ X2 '),
  ('VS-nguon-thanh-sepay', 'tg', [(TT, "nguon: 'tingee',   // không lưu Client ID", "nguon: 'sepay',   // không lưu Client ID", 1)], r'✗ C1 phiên da_thu'),
  # ── D / E: cổng của khoá, tên cổng, Đối soát ──
  ('VS-cong-cua-khoa-chi-sepay', 'tg', [(CQ, "return t === 'sepay' || t === 'tingee' ? t : 'payos';", "return t === 'sepay' ? t : 'payos';", 1)], r'✗ (D6|D7|E1) '),
  ('BV-ten-tingee', 'tg', [(CQ, ", tingee: 'Tingee' };", ' };', 1)], r'✗ (A5|D6) '),
  ('VS-luoi-gop-tingee-payos', 'tg', [(DS, "SUM(s.khoa NOT LIKE 'sepay:%' AND s.khoa NOT LIKE 'tingee:%' AND ${VAO}) AS payos",
    "SUM(s.khoa NOT LIKE 'sepay:%' AND ${VAO}) AS payos", 1)], r'✗ E2 '),
  ('VS-nhan-cat-6', 'tg', [(DS, 'String(r.khoa).slice(c.length + 1)', 'String(r.khoa).slice(6)', 1)], r'✗ E1 dòng Tingee mang nhãn'),
  # ── hàm đọc nội dung dùng chung (sepay.js docNoiDung) ──
  ('VS-noi-dung-dau-chuoi', 'tg', [(SP, r'const MAU_SO_HD = /TQD', r'const MAU_SO_HD = /^TQD', 1)], r'✗ D1 nội dung HOA'),
  ('VS-noi-dung-chi-chuoi-dau', 'sp', [(SP, "chuoi.reduce((kq, c) => kq || mau.exec(String(c ?? '')), null)", "mau.exec(String(chuoi[0] ?? ''))", 1)], r'✗ C'),
  # ── T / F: index.js thân thô + gắn đường, bộ kiểm, hướng dẫn ──
  ('BV-than-tho-tingee', 'tg', [(IX, "app.use('/api/tingee/webhook', express.raw({ type: '*/*', limit: '100kb' }));\n", '', 1)], r'✗ T1 '),
  ('BV-gan-duong-tingee', 'tg', [(IX, "app.use('/api/tingee/webhook', require('./routes/thanh-toan').webhookTingee);   // TINGEE-1\n", '', 1)], r'✗ T2 '),
  ('BV-bo-kiem-chay-bai', 'tg', [(KT, "chayBaiThat('cong_cu/thu_TINGEE1.js');", "// chayBaiThat('cong_cu/thu_TINGEE1.js');", 1)], r'✗ T3 '),
  ('VS-huong-dan-khong-www', 'tg', [(HD, 'https://www.pos-tuquyduong.io.vn/api/tingee/webhook', 'https://pos-tuquyduong.io.vn/api/tingee/webhook', 1)], r'✗ F1 '),
  ('VS-huong-dan-khong-quay-lai', 'tg', [(HD, 'đổi lại `CONG_QR=sepay` NGAY', 'đổi lại cổng cũ NGAY', 1)], r'✗ F2 '),
  # vòng sửa 2 (soát vòng 2): đưa ĐÚNG câu cũ của lỗi 1 vòng 1 trở lại
  ('VS-huong-dan-ve-nhu-cu', 'tg', [(HD, 'Lưu ý: bạn ĐÃ GỠ Webhook ở SePay (phiếu 05.11) — đổi lại `sepay` thì QR\nvề tài khoản cũ nhưng KHÔNG còn tự báo tiền về: mọi đơn QR phải xác nhận tay, cho tới khi khai lại Webhook SePay (`viec/SEPAY-1/cai_dat_sepay.md`).',
    'Trục trặc → `CONG_QR=sepay` là về như cũ ngay.', 1)], r'✗ F3 '),
  ('BV-huong-dan-buoc-lui-khong-noi-go', 'tg', [(HD, ' (QR về tài khoản cũ; đơn QR xác nhận tay vì Webhook SePay đã gỡ)', '', 1)], r'✗ F3 '),
]


def ban_sao(thay):
  """Chép server/ + bài thử + bộ kiểm + hướng dẫn ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_tingee1_')
  shutil.copytree(os.path.join(GOC, 'server'), os.path.join(tmp, 'server'), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copytree(os.path.join(GOC, 'cong_cu', 'gia_lap'), os.path.join(tmp, 'cong_cu', 'gia_lap'))   # doiSoat.js nạp bat_bien.js ở đây
  for f in CHEP:
    os.makedirs(os.path.dirname(os.path.join(tmp, f)) or tmp, exist_ok=True)
    shutil.copyfile(os.path.join(GOC, f), os.path.join(tmp, f))
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
    if not re.search(r'\d+ đạt · \d+ hỏng', ra) or 'Bài thử sập' in ra:
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
      dong.append(f'{bai}: ' + (m.group(0) if m else ra[-160:]) + ''.join(' | ' + l.strip()[:140] for l in ra.splitlines() if '✗' in l))
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
