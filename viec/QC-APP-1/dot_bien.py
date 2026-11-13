#!/usr/bin/env python3
"""QC-APP-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/QC-APP-1/dot_bien.py [tên...]            (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/QC-APP-1/dot_bien.py --liet-ke            (chỉ in danh sách)
    python3 viec/QC-APP-1/dot_bien.py --goc <sha> <bài...>  (bằng chứng ĐỎ: bài HIỆN TẠI trên server/ + client/src/ của commit sha)

Khuôn viec/BAO-1b/dot_bien.py: chép server/ + client/src/ + cong_cu/ + HOP_DONG_API_KH.md + kiem_tra_truoc_khi_giao.js ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules
nối symlink), thay chuỗi (mỗi chuỗi khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy `node <tạm>/cong_cu/thu_QCAPP1.js`. BẮT = thoát ≠ 0 VÀ có dòng `✗`
khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG.
"""
import io, os, re, shutil, subprocess, sys, tarfile, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
Q = 'server/routes/quang-cao.js'
KH = 'server/routes/kh/index.js'
BK = 'server/routes/backup.js'
KT = 'kiem_tra_truoc_khi_giao.js'
CD = 'client/src/pages/CaiDat/'
QJ = CD + 'QuangCao.jsx'
QS = CD + 'quangCao.js'
ST = 'client/src/pages/Settings.jsx'
API = 'client/src/utils/api.js'
CHEP = ['server', 'client/src', 'cong_cu', 'HOP_DONG_API_KH.md', KT]
T = 'thu_QCAPP1.js'

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗, bài)
DOT_BIEN = [
  # ── A: quyền + PIN ──
  ('BV-AUTH-BO', [(Q, 'const quyen = [authenticate, checkPermission(\'manage_settings\')];', 'const quyen = [checkPermission(\'manage_settings\')];', 1)], r'✗ (A1|A2|A4)', T),
  ('BV-QUYEN-BO', [(Q, 'const quyen = [authenticate, checkPermission(\'manage_settings\')];', 'const quyen = [authenticate];', 1)], r'✗ A2', T),
  ('BV-PIN-BO', [(Q, 'if (pin.loi) return baoPin(res, pin.loi);', '', 1)], r'✗ A[45]', T),
  ('VS-PIN-RONG-QUA', [(Q, "const pin = await kiemPinChuQuan(req.body.pin);", "const pin = req.body.pin === undefined ? {} : await kiemPinChuQuan(req.body.pin);", 1)], r'✗ A[45]', T),
  ('BV-XOA-DONG-VANG', [(Q, 'await tx.run(`DELETE FROM pos_quang_cao', 'await tx.run(`SELECT 1 FROM pos_quang_cao', 1)], r'✗ A7', T),
  ('BV-ID-LA-BO', [(Q, 'if (!r.changes) { await tx.rollback(); return tuChoi(', 'if (false) { await tx.rollback(); return tuChoi(', 1)], r'✗ A10', T),
  ('VS-UUTIEN-KHONG-THEO-MANG', [(Q, 'i + 1, d.bat ? 1 : 0', '0, d.bat ? 1 : 0', 1)], r'✗ C6c', T),
  ('BV-GIOVANG-KHONG-LUU', [(Q, "[KHOA_GIO_VANG, gio_vang ? '1' : '0', now]", "[KHOA_GIO_VANG, '0', now]", 1)], r'✗ A8', T),
  ('BV-GIOVANG-KIEU-BO', [(Q, "if (typeof gio_vang !== 'boolean') return tuChoi(", "if (false) return tuChoi(", 1)], r'✗ A12', T),
  # ── B: máy chủ tự kiểm ──
  ('VS-DAI-33', [(Q, 'if (demKyTu(s) > toiDa) return', 'if (demKyTu(s) > toiDa + 1) return', 1)], r'✗ B chữ dải 33', T),
  ('BV-DAI-BO', [(Q, 'if (demKyTu(s) > toiDa) return sai(truong, `${ten} tối đa ${toiDa} ký tự`);', '', 1)], r'✗ B chữ dải 33', T),
  ('VS-DEM-MA-KY-TU', [(Q, "Array.from(BO_TACH.segment(String(s ?? ''))).length", "String(s ?? '').length", 1)], r'✗ B \(K5\) 32 chữ', T),
  ('VS-DEM-CODEPOINT', [(Q, "Array.from(BO_TACH.segment(String(s ?? ''))).length", "Array.from(String(s ?? '')).length", 1)], r'✗ B \(K5\) (32 chữ|32 biểu)', T),
  ('BV-CHU-TRONG-BO', [(Q, "if (batBuoc && !s) return sai(truong, `Nhập ${ten.toLowerCase()}`);", '', 1)], r'✗ B chữ dải (trống|toàn)', T),
  ('BV-DIEU-KHIEN-BO', [(Q, 'if (DIEU_KHIEN.test(s)) return sai(', 'if (false) return sai(', 1)], r'✗ B chữ dải có xuống dòng', T),
  ('VS-GIOIHAN-TIEUDE-41', [(Q, 'tieu_de: 40,', 'tieu_de: 41,', 1)], r'✗ B (tiêu đề 41|chữ nút)|✗ H12g', T),
  ('VS-GIOIHAN-PHU-81', [(Q, 'phu: 80,', 'phu: 81,', 1)], r'✗ B dòng phụ 81|✗ H12g', T),
  ('VS-GIOIHAN-NUT-21', [(Q, 'chu_nut: 20,', 'chu_nut: 21,', 1)], r'✗ B chữ nút 21|✗ H12g', T),
  ('VS-GIOIHAN-SODONG-21', [(Q, 'so_dong: 20 }', 'so_dong: 21 }', 1)], r'✗ B hơn 20 dòng|✗ H12g', T),
  ('BV-SODONG-BO', [(Q, 'if (dong.length > GIOI_HAN.so_dong) return tuChoi(', 'if (false) return tuChoi(', 1)], r'✗ B hơn 20 dòng', T),
  ('BV-DICH-BO', [(Q, "if (!DICH.includes(dich)) return sai('dich'", "if (false) return sai('dich'", 1)], r'✗ B dich lạ', T),
  ('BV-MON-THIEU-BO', [(Q, "if (typeof d.ma_mon !== 'string' || !d.ma_mon) return sai(", 'if (false) return sai(', 1)], r'✗ B dich mon thiếu món', T),
  ('BV-MON-TONTAI-BO', [(Q, 'if (!(await tonTai(d.ma_mon))) return sai(', 'if (false) return sai(', 1)], r'✗ B dich mon món không tồn tại', T),
  ('VS-MON-DANG-BAN-THAY-TONTAI', [(Q, "SELECT 1 AS co FROM pos_products WHERE sx_product_type || '_' || sx_product_id = ?", "SELECT 1 AS co FROM pos_products WHERE is_active = 1 AND sx_product_type || '_' || sx_product_id = ?", 1)], r'✗ B \(K5\) món tồn tại nhưng ĐÃ TẮT', T),
  ('VS-MON-GIU-KHI-KHONG-PHAI-MON', [(Q, "o.ma_mon = null;\n  if (dich === 'mon')", "o.ma_mon = d.ma_mon ?? null;\n  if (dich === 'mon')", 1)], r'✗ B chuẩn hoá', T),
  ('BV-KIEU-NGAY-BO', [(Q, "if (!KIEU_NGAY.includes(kieu)) return sai('kieu_ngay'", "if (false) return sai('kieu_ngay'", 1)], r'✗ B kiểu ngày lạ', T),
  ('BV-THU-RONG-BO', [(Q, '!Array.isArray(ds) || !ds.length || ds.some(', '!Array.isArray(ds) || ds.some(', 1)], r'✗ B theo thứ nhưng không chọn thứ', T),
  ('VS-THU-8', [(Q, '!Number.isInteger(t) || t < 1 || t > 7', '!Number.isInteger(t) || t < 1', 1)], r'✗ B thứ 8', T),
  ('VS-THU-0', [(Q, '!Number.isInteger(t) || t < 1 || t > 7', '!Number.isInteger(t) || t < 0 || t > 7', 1)], r'✗ B thứ 0', T),
  ('BV-THU-KIEU-BO', [(Q, '!Number.isInteger(t) || t < 1 || t > 7', 't < 1 || t > 7', 1)], r'✗ B thứ là chữ', T),
  ('VS-NGAY-THAT-LUON-DUNG', [(Q, 'return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;', 'return true;', 1)], r'✗ B (ngày không có thật|tháng 13)', T),
  ('VS-NGAY-THAT-BO-NGAY', [(Q, ' && t.getUTCDate() === d;', ';', 1), (Q, ' && t.getUTCMonth() === m - 1', '', 1)], r'✗ B (ngày không có thật|tháng 13)', T),
  ('VS-DEN-NGAY-BANG-LOI', [(Q, 'if (d.den_ngay < d.tu_ngay) return', 'if (d.den_ngay <= d.tu_ngay) return', 1)], r'✗ B \(K5\) khoảng ngày một ngày', T),
  ('BV-DEN-NGAY-BO', [(Q, 'if (d.den_ngay < d.tu_ngay) return sai(', 'if (false) return sai(', 1)], r'✗ B ngày kết thúc trước', T),
  ('VS-GIO-MAU-NOI', [(Q, '/^([01]\\d|2[0-3]):[0-5]\\d$/', '/^([01]\\d|2[0-9]):[0-5]\\d$/', 1)], r'✗ B giờ bắt đầu 25:00', T),
  ('VS-GIO-MAU-LONG', [(Q, '/^([01]\\d|2[0-3]):[0-5]\\d$/', '/^\\d{1,2}:\\d{2}$/', 1)], r'✗ B giờ (không đủ|bắt đầu 25|phút 60)', T),
  ('VS-GIO-BANG-DUOC', [(Q, 'if (d.den_gio <= d.tu_gio) return', 'if (d.den_gio < d.tu_gio) return', 1)], r'✗ B giờ kết thúc = giờ bắt đầu', T),
  ('BV-GIO-SAU-BO', [(Q, 'if (d.den_gio <= d.tu_gio) return sai(', 'if (false) return sai(', 1)], r'✗ B (giờ kết thúc|vắt qua)', T),
  ('BV-GIO-MOT-DAU-BO', [(Q, 'if (!(trong(d?.tu_gio) && trong(d?.den_gio))) {', 'if (!(trong(d?.tu_gio) || trong(d?.den_gio))) {', 1)], r'✗ B chỉ có giờ', T),
  ('BV-BAT-BO', [(Q, "if (typeof d?.bat !== 'boolean') return sai(", 'if (false) return sai(', 1)], r'✗ B bat không', T),
  # ── C: cửa công khai ──
  ('BV-NGAY-LOC-BO', [(Q, '.filter((d) => homNayHop(d, bayGio));', ';', 1)], r'✗ C1', T),
  ('BV-TAT-LOC-BO', [(Q, 'SELECT * FROM pos_quang_cao WHERE bat = 1 ORDER BY', 'SELECT * FROM pos_quang_cao ORDER BY', 1)], r'✗ C1', T),
  ('VS-THU-LECH', [(Q, '.getUTCDay() + 6) % 7 + 1; };', '.getUTCDay() + 6) % 7; };', 1)], r'✗ C5', T),
  ('VS-THU-CN-LA-0', [(Q, '.getUTCDay() + 6) % 7 + 1; };', '.getUTCDay() + 7) % 7 + 1; };', 1)], r'✗ C5', T),
  ('VS-KHOANG-DAU-LOAI', [(Q, 'd.tu_ngay <= ngay && ngay <= d.den_ngay', 'd.tu_ngay < ngay && ngay <= d.den_ngay', 1)], r'✗ C5d', T),
  ('VS-KHOANG-CUOI-LOAI', [(Q, 'd.tu_ngay <= ngay && ngay <= d.den_ngay', 'd.tu_ngay <= ngay && ngay < d.den_ngay', 1)], r'✗ C5(b)?', T),
  ('BV-KHOANG-THIEU-NGAY', [(Q, "return !!d.tu_ngay && !!d.den_ngay && d.tu_ngay <= ngay", "return d.tu_ngay <= ngay", 1)], r'✗ (C|D|F)', T),
  ('BV-MON-TAT-BO', [(Q, "const mon = d.dich === 'mon' && ban.has(d.ma_mon);", "const mon = d.dich === 'mon';", 1)], r'✗ C4', T),
  ('VS-MON-TAT-KHONG-MENU', [(Q, "dich: d.dich === 'mon' && !mon ? 'menu' : d.dich,", "dich: d.dich,", 1)], r'✗ C4', T),
  ('VS-MON-DUNG-ACTIVE-THAY-SELLABLE', [(Q, '.filter((p) => p.sellable)', '', 1)], r'✗ (C4|A6b)', T),
  ('VS-TRA-THUA-BAT', [(Q, 'uu_tien: d.uu_tien };', 'uu_tien: d.uu_tien, bat: d.bat };', 1)], r'✗ C(2|7)', T),
  ('VS-TRA-THUA-NGAY', [(Q, 'uu_tien: d.uu_tien };', 'uu_tien: d.uu_tien, tu_ngay: d.tu_ngay };', 1)], r'✗ C2', T),
  ('VS-GIO-RONG-LA-CHUOI', [(Q, "tu_gio: d.tu_gio || null, den_gio: d.den_gio || null, uu_tien: d.uu_tien };", "tu_gio: d.tu_gio, den_gio: d.den_gio, uu_tien: d.uu_tien };", 1)], r'✗ C2b|✗ C0', T),
  ('BV-TRAN-LUOT-BO', [(KH, "if (!giuLuotMenu(req.ip || '')) return bao(res, 'QUA_NHIEU_LAN');\n    const bayGio = getNow();", 'const bayGio = getNow();', 1)], r'✗ C8', T),
  # ── D: Giờ vàng ──
  ('BV-GIOVANG-CONGTAC-BO', [(KH, "if (cai?.value === '1' && gv.bat && gv.f.is_flash_now) {", 'if (gv.bat && gv.f.is_flash_now) {', 1)], r'✗ D1', T),
  ('VS-GIOVANG-KHONG-CHAY', [(KH, "if (cai?.value === '1' && gv.bat && gv.f.is_flash_now) {", "if (cai?.value === '1' && gv.bat) {", 1)], r'✗ D3', T),
  ('VS-GIOVANG-KHONG-BAT', [(KH, "if (cai?.value === '1' && gv.bat && gv.f.is_flash_now) {", "if (cai?.value === '1' && gv.f.is_flash_now) {", 1)], r'✗ D4', T),
  ('VS-GIOVANG-UUTIEN-1', [(KH, "tu_gio: null, den_gio: den, uu_tien: 0 });", "tu_gio: null, den_gio: den, uu_tien: 1 });", 1)], r'✗ D2', T),
  ('VS-GIOVANG-DEN-GIO-LA-GIO-MO', [(KH, 'gv.khung.dong.slice(11, 16)', 'gv.khung.mo.slice(11, 16)', 1)], r'✗ D(2|5)', T),
  ('VS-GIOVANG-DICH-RONG', [(KH, "tieu_de: '', phu: '', chu_nut: '', dich: 'menu', ma_mon: null,\n        tu_gio: null", "tieu_de: '', phu: '', chu_nut: '', dich: '', ma_mon: null,\n        tu_gio: null", 1)], r'✗ D2', T),
  ('VS-GIOVANG-KHONG-DAU-DANH-SACH', [(KH, 'data.unshift({ id: \'gio_vang\'', 'data.push({ id: \'gio_vang\'', 1)], r'✗ D2', T),
  ('VS-GIOVANG-PHAN-TRAM-CUNG', [(KH, 'giảm ${gv.f.percent}% đến', 'giảm 20% đến', 1)], r'✗ D2', T),
  ('BV-GIOVANG-DOC-RIENG-KHONG-NGUON', [(KH, "async function docGioVang() {\n  const f = await readFlashState(query, getNow);\n  const bat = f.enabled && !!f.start && !!f.end && f.start !== f.end && f.percent > 0 && f.product_keys.length > 0;",
                                       "async function docGioVang() {\n  const f = await readFlashState(query, getNow);\n  const bat = f.enabled && !!f.start && !!f.end && f.start !== f.end && f.percent > 0;", 1)], r'✗ D4b', T),
  # ── F: lưu trữ, sao lưu ──
  ('BV-BACKUP-BO', [(BK, "  { name: 'pos_quang_cao', label: 'Quảng cáo trên App', key: 'id' },", '', 1)], r'✗ F4', T),
  ('VS-BACKUP-KHONG-KHOI-PHUC', [(BK, "  'pos_goi_nap'];", "  'pos_goi_nap', 'pos_quang_cao'];", 1)], r'✗ F4', T),
  ('BV-NANGCAP-UPDATE', [('server/nang_cap/028_quang_cao.js', "  )`);\n};", "  )`);\n  await tx.run(\"UPDATE pos_quang_cao SET bat = 1\");\n};", 1)], r'✗ F2', T),
  ('VS-NANGCAP-GIO-SQLITE', [('server/nang_cap/028_quang_cao.js', "created_at TEXT NOT NULL,", "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,", 1)], r'✗ F2b', T),
  ('VS-NANGCAP-KHONG-LAP-LAI', [('server/nang_cap/028_quang_cao.js', 'CREATE TABLE IF NOT EXISTS pos_quang_cao', 'CREATE TABLE pos_quang_cao', 1)], r'✗ F[23]', T),
  ('BV-DONTHU-XOA-QUANG-CAO', [('server/utils/donThu.js', "const THU_TU_XOA = [...BANG_THEO_DON,", "const THU_TU_XOA = [...BANG_THEO_DON, 'pos_quang_cao',", 1)], r'✗ F[56]', T),
  # ── H: giao diện ──
  ('BV-UI-BO-HOIPIN', [(QJ, '<HoiPin mo=', '<Khong mo=', 1)], r'✗ H4 ', T),
  ('BV-UI-BO-THANHLUU', [(QJ, '<ThanhLuu id="quang-cao"', '<Khong id="quang-cao"', 1)], r'✗ H4 ', T),
  ('BV-UI-BO-LOI-O', [(QJ, "const o = (t) => <LoiO loi={loiO[`${d.khoa}:${t}`]} />;", "const o = () => null;", 1)], r'✗ H4 ', T),
  ('VS-UI-ALERT', [(QJ, "baoXong(`Đã lưu ${ds.length} dòng quảng cáo`);", "baoXong(`Đã lưu ${ds.length} dòng quảng cáo`); alert('x');", 1)], r'✗ H4b', T),
  ('VS-UI-FETCH-TRAN', [(QJ, 'const r = await quangCaoApi.ds();', "const r = await quangCaoApi.ds(); void fetch('/api/pos/quang-cao');", 1)], r'✗ H4b', T),
  ('BV-UI-BO-TAI-LAI', [(QJ, "      baoXong(`Đã lưu ${ds.length} dòng quảng cáo`);\n      await tai();", "      baoXong(`Đã lưu ${ds.length} dòng quảng cáo`);", 1)], r'✗ H4c', T),
  ('BV-UI-NUT-LUU-KHONG-KHOA', [(QJ, 'onClick={batLuu} disabled={dangLuu}>', 'onClick={batLuu}>', 1)], r'✗ H4c', T),
  ('BV-UI-BO-NHAC', [(QJ, 'Không ghi công dụng chữa bệnh (quy định quảng cáo thực phẩm).', 'Không ghi công dụng.', 1)], r'✗ H5', T),
  ('BV-UI-BO-DEM-NGUOC', [(QJ, '{con < 0 ? `Quá ${-con} ký tự` : `Còn ${con} ký tự`}', "{''}", 1)], r'✗ H6', T),
  ('BV-UI-BO-CAT-DAU-BA-CHAM', [(QJ, "textOverflow: 'ellipsis', ", '', 1)], r'✗ H7', T),
  ('BV-UI-BO-XEM-TRUOC', [(QJ, 'Xem trước dải:', 'Dải:', 1)], r'✗ H7', T),
  ('BV-UI-BO-LEN-XUONG', [(QJ, 'aria-label="Lên"', 'aria-label="Len"', 1)], r'✗ H8', T),
  ('BV-UI-BO-TRACNGHIEM', [(QJ, "['tracnghiem', 'Trắc nghiệm thể trạng']", "['tracnghiem', 'Trắc nghiệm']", 1)], r'✗ H8', T),
  ('BV-UI-BO-GIOVANG-CHU', [(QJ, 'Khi Giờ vàng đang chạy thì dải hiện Giờ vàng', 'Hiện Giờ vàng', 1)], r'✗ H9', T),
  ('BV-UI-BO-MON-DA-TAT', [(QJ, ' (món đã tắt)', '', 1)], r'✗ H10', T),
  ('BV-UI-LOI-O-VE-LUU', [(QJ, "setLoiO({ [`${ds[vt.dong].khoa}:${vt.truong}`]: lyDoLoi(e) })", 'setLoiLuu(lyDoLoi(e))', 1)], r'✗ H11', T),
  ('BV-UI-API-LOI-O', [(API, 'err.loi_o = data && data.loi_o;', '', 1)], r'✗ H2b', T),
  ('BV-UI-API-LUU-SAI-PT', [(API, "luu: (body) => api.put('/quang-cao', body)", "luu: (body) => api.post('/quang-cao', body)", 1)], r'✗ H2 ', T),
  ('BV-UI-SETTINGS-BO-IMPORT', [(ST, "import QuangCao from './CaiDat/QuangCao';", '', 1)], r'✗ H3 ', T),
  ('VS-UI-SETTINGS-QUYEN-SAI', [(ST, "quangCao: 'manage_settings',\n  };", "quangCao: 'manage_users',\n  };", 1)], r'✗ H3 ', T),
  ('BV-UI-SETTINGS-NUT-KHONG-QUYEN', [(ST, "theTrongNhom.includes('quangCao') && hasPermission('manage_settings')", "theTrongNhom.includes('quangCao')", 1)], r'✗ H3b', T),
  ('BV-UI-SETTINGS-KHONG-VE', [(ST, ") : tab === 'quangCao' ? (\n            <QuangCao />\n          ) : null}", ") : null}", 1)], r'✗ H3 ', T),
  # ── H12: hàm thuần phía quầy ──
  ('VS-QS-DEM-MA-KY-TU', [(QS, "return typeof Intl !== 'undefined' && Intl.Segmenter", "return t.length || typeof Intl !== 'undefined' && Intl.Segmenter", 1)], r'✗ H12a', T),
  ('VS-QS-CHU-33', [(QS, "> GIOI_HAN.chu_dai) o('chu_dai'", "> GIOI_HAN.chu_dai + 1) o('chu_dai'", 1)], r'✗ H12c', T),
  ('BV-QS-CHU-TRONG', [(QS, "if (!String(d.chu_dai || '').trim()) o('chu_dai'", "if (false) o('chu_dai'", 1)], r'✗ H12c', T),
  ('VS-QS-GIO-BANG', [(QS, 'else if (d.den_gio <= d.tu_gio) o(', 'else if (d.den_gio < d.tu_gio) o(', 1)], r'✗ H12d', T),
  ('BV-QS-GIO-MOT-DAU', [(QS, "if (!(trong(d.tu_gio) && trong(d.den_gio))) {", "if (!(trong(d.tu_gio) || trong(d.den_gio))) {", 1)], r'✗ H12d', T),
  ('VS-QS-NGAY-31', [(QS, 'd <= ngayCuaThang;', 'd <= 31;', 1)], r'✗ H12e', T),
  ('VS-QS-NHUAN-CHIA-4', [(QS, '(y % 4 === 0 && y % 100 !== 0) || y % 400 === 0', 'y % 4 === 0', 1)], r'✗ H12e2', T),
  ('VS-QS-NHUAN-BO-400', [(QS, '(y % 4 === 0 && y % 100 !== 0) || y % 400 === 0', '(y % 4 === 0 && y % 100 !== 0)', 1)], r'✗ H12e2', T),
  ('VS-QS-DEN-NGAY-BANG', [(QS, 'else if (d.den_ngay < d.tu_ngay) o(', 'else if (d.den_ngay <= d.tu_ngay) o(', 1)], r'✗ H12e', T),
  ('VS-QS-THU-RONG-BO', [(QS, "if (d.kieu_ngay === 'thu' && !(d.cac_thu || []).length) o(", "if (false) o(", 1)], r'✗ H12e', T),
  ('VS-QS-MON-THIEU-BO', [(QS, "if (d.dich === 'mon' && trong(d.ma_mon)) o(", "if (false) o(", 1)], r'✗ H12e', T),
  ('VS-QS-GIOIHAN-TIEUDE-41', [(QS, 'tieu_de: 40,', 'tieu_de: 41,', 1)], r'✗ H12[fg]', T),
  ('VS-QS-GIOIHAN-SODONG-21', [(QS, 'so_dong: 20 }', 'so_dong: 21 }', 1)], r'✗ H12[fg]', T),
  # ── I: nối bộ kiểm ──
  ('BV-NOI-BO-KIEM-TRA', [(KT, "chayBaiThat('cong_cu/thu_QCAPP1.js');", "// chayBaiThat('cong_cu/thu_QCAPP1.js');", 1)], r'✗ I1', T),
  ('BV-HOPDONG-BO-DONG-CUA', [('HOP_DONG_API_KH.md', '| `GET /quang-cao` | không |', '| `GET /quang-cua` | không |', 1)], r'✗ I2', T),
]


def lam_cay(tmp):
  nm = os.path.join(GOC, 'node_modules')
  if os.path.isdir(nm):
    os.symlink(nm, os.path.join(tmp, 'node_modules'))


def chep(nguon_sha, tmp, phan):
  """Đổ `phan` vào tmp: nguon_sha None = cây làm việc hiện tại (copytree), có sha = git archive commit đó."""
  if nguon_sha is None:
    for p in phan:
      a, b = os.path.join(GOC, p), os.path.join(tmp, p)
      os.makedirs(os.path.dirname(b), exist_ok=True)
      (shutil.copytree(a, b, ignore=shutil.ignore_patterns('node_modules')) if os.path.isdir(a) else shutil.copyfile(a, b))
  else:
    tar = subprocess.run(['git', 'archive', nguon_sha, *phan], cwd=GOC, capture_output=True, check=True).stdout
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(tmp, filter='data')


def ban_sao(thay):
  tmp = tempfile.mkdtemp(prefix='dotbien_qcapp1_')
  chep(None, tmp, CHEP)
  lam_cay(tmp)
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
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', bai)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, (r.stdout or '') + (r.stderr or '')


def chay(ten, thay, mau, bai):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp, bai)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if ma == 2 or 'BÀI SẬP' in ra or 'Bài thử sập' in ra:
      return ten, 'LẠC', 'bài sập: ' + (hong[-1][:160] if hong else ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:140]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung(bai_ds):
  tmp, _ = ban_sao([])
  try:
    kq = []
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      dong = [l.strip() for l in ra.splitlines() if re.search(r'\d+ đạt · \d+ hỏng', l)]
      kq.append((bai, ma, dong[-1] if dong else ra.strip()[-160:]))
    return all(m == 0 for _, m, _ in kq), kq
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def bang_chung(sha, bai_ds):
  """Bài HIỆN TẠI (cong_cu/ + kiem_tra + hợp đồng của cây làm việc) trên server/ + client/src/ của commit sha."""
  tmp = tempfile.mkdtemp(prefix='dotbien_qcapp1_goc_')
  try:
    chep(sha, tmp, ['server', 'client/src', 'HOP_DONG_API_KH.md', KT])
    chep(None, tmp, ['cong_cu'])
    lam_cay(tmp)
    for bai in bai_ds:
      ma, ra = chay_bai(tmp, bai)
      print(f'── {bai} (bài HIỆN TẠI trên code {sha}):')
      print('\n'.join('  ' + l.strip()[:200] for l in ra.splitlines() if '✗' in l or re.search(r'\d+ đạt · \d+ hỏng', l) or 'SẬP' in l or 'sập' in l))
      print(f'  thoát {ma}')
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--goc' in sys.argv:
    i = sys.argv.index('--goc')
    bang_chung(sys.argv[i + 1], sys.argv[i + 2:]); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, kq_dc = doi_chung(sorted({d[3] for d in ds}))
  for bai, ma, dong in kq_dc: print(f'ĐỐI CHỨNG {bai}: thoát {ma} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
