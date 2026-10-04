#!/usr/bin/env python3
"""AUDIT-1 — đo lưới an toàn bằng đột biến. Chạy ở GỐC kho:

    python3 viec/AUDIT-1/dot_bien.py [nhóm|tên …] [-j N] [--json <file>]

  nhóm: G3 A3 B1 C1 C2 D1 E1 (hoặc tên đột biến, hoặc tiền tố tên kết thúc bằng *).

Mỗi đột biến: dựng BẢN SAO trong thư mục tạm (không bao giờ sửa file thật), thay chuỗi — chuỗi gốc phải khớp ĐÚNG số
lần ghi sẵn, không thì HỎNG (không chạy, không bao giờ đếm BẮT — K3) — rồi chạy lệnh đo trên bản sao.
  BẮT  = một lệnh thoát ≠ 0 VÀ đầu ra của chính lệnh đó có dòng khớp mẫu (đúng ca / đúng mã)
  LẠC  = có lệnh thoát ≠ 0 nhưng không dòng nào khớp mẫu (đỏ vì sập / sai chỗ — chưa phải bắt)
  SỐNG = mọi lệnh thoát 0
  TREO = quá giờ (cả nhóm tiến trình bị giết)
  HỎNG = đột biến không áp được
Trước khi chấm, mỗi loại bản sao chạy KHÔNG đột biến, 3 bản cùng lúc (kiểm sạch) — đỏ thì dừng, không chấm gì.
Thư mục tạm dọn trong finally và khi SIGINT/SIGTERM. Cuối lần chạy so git status (ngoài viec/AUDIT-1/), nhật ký người
gác, data/ trước/sau — khác là in KHO BẨN, thoát 3.
"""
import json, os, re, shutil, signal, subprocess, sys, tempfile, threading, time
from concurrent.futures import ThreadPoolExecutor

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GOC_TAM = tempfile.mkdtemp(prefix='audit1_')
KHOA = threading.Lock()
CON = set()  # pid nhóm tiến trình con đang chạy — giết khi bị ngắt

# ═══ Bảng đột biến ═══════════════════════════════════════════════════════════
# (tên, nhóm, cách chạy, [(file, chuỗi gốc, chuỗi thay, số lần khớp[, chỉ thay lần thứ k])], mẫu phải thấy)
#   file tương đối với gốc bản sao. chuỗi thay None = xoá file; chuỗi gốc None = tạo file mới (số lần 0).
#   cách chạy → xem LENH bên dưới. Tên bắt đầu "!" thì bản sao kho KHÔNG thay bài chạy thật bằng bài rỗng.
O, R, W, Dm, SC = 'server/routes/orders.js', 'server/routes/refunds.js', 'server/routes/wallets.js', \
    'server/routes/damages.js', 'server/routes/signup-codes.js'
NG, CG = 'tu_chay/nguoi_gac.js', 'tu_chay/cong.js'
DOT_BIEN = [
  # ── G3: công cụ đo tự chứng minh ──
  ('G3-sai-chuoi', 'G3', 'kb1', [(O, 'CHUOI_KHONG_CO_TRONG_FILE_AUDIT1', 'x', 1)], r'KB1 → '),
  ('G3-da-biet', 'G3', 'kb10', [(O, "WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'`",
                                'WHERE id = ? AND ? IS NOT NULL`', 1)], r'KB10 → I6:'),
  ('G3-vo-hai', 'G3', 'c2', [(O, '// 1. Tạo đơn hàng', '// 1. Tao don hang (AUDIT-1 vo hai)', 1)], r'KB\d+ → |✗'),
  ('G3-sap', 'G3', 'kb1', [(O, '// 1. Tạo đơn hàng', '}}}{{{', 1)], r'KB\d+ → '),

  # ── A3: VÁ SAI người gác (bản sao tu_chay/), ≥1 mỗi nhóm luật; mở một lỗ cho lệnh nguy hiểm lọt.
  #    BẮT = thu_nguoi_gac.js bắt (dòng ✗ ca / tự sinh / đối chiếu). SỐNG = lỗ lọt mà bài thử vẫn xanh = phát hiện.
  ('A3-GITADD-bo-A', 'A3', 'gac', [(NG, '/[Aufpie]/.test(v.slice(1))', '/[ufpie]/.test(v.slice(1))', 1)], r'✗ (ca |tự sinh)'),
  ('A3-GITCOMMIT-bo-a', 'A3', 'gac', [(NG, "'naio'.includes(v[x])", "'nio'.includes(v[x])", 1)], r'✗ (ca |tự sinh)'),
  ('A3-GITPUSH-moi-nhanh', 'A3', 'gac', [(NG, 'vt[1] !== dung', 'false', 1)], r'✗ (ca |tự sinh|đối chiếu)'),
  ('A3-SED-i-ngan', 'A3', 'gac', [(NG, "if (v[j] === 'i' && luat('SED-I'))", "if (v[j] === 'Z' && luat('SED-I'))", 1)], r'✗ (ca |tự sinh)'),
  ('A3-RM-bo-realpath', 'A3', 'gac', [(NG, '!(trongNhap(abs, nc) && trongNhap(thuc(abs), nc))', '!(trongNhap(abs, nc))', 1)], r'✗ (ca |tự sinh)'),
  ('A3-CURL-moi-host', 'A3', 'gac', [(NG, "!['localhost', '127.0.0.1'].includes(host)", "!['localhost', '127.0.0.1', host].includes(host)", 1)], r'✗ (ca |tự sinh)'),
  ('A3-LN-dao-s', 'A3', 'gac', [(NG, "if (ten === 'ln' && !coCo('-s', '--symbolic'))", "if (ten === 'ln' && coCo('-s', '--symbolic'))", 1)], r'✗ (ca |tự sinh)'),
  ('A3-G1CAM-theoten', 'A3', 'gac', [(NG, 'khop(nc.cauHinh.file_cam, rel, true)', 'khop(nc.cauHinh.file_cam, rel, false)', 1)], r'✗ (ca |tự sinh)'),
  ('A3-FINDCAM-bo-delete', 'A3', 'gac', [(NG, '/^-(delete|exec|execdir|ok|okdir|fls|fprint0?|fprintf)$/', '/^-(exec|execdir|ok|okdir|fls|fprint0?|fprintf)$/', 1)], r'✗ (ca |tự sinh)'),
  ('A3-NPM-them-install', 'A3', 'gac', [(NG, "['test', 'ci', 'run', 'ls'].includes(sub.val)", "['test', 'ci', 'run', 'ls', 'install'].includes(sub.val)", 1)], r'✗ (ca |tự sinh)'),
  ('A3-MKDIR-bo-khung', 'A3', 'gac', [(NG, 'ngoaiKho(rel) || KHUNG.test(rel)', 'ngoaiKho(rel)', 1)], r'✗ (ca |tự sinh)'),
  ('A3-TARX-moi-dich', 'A3', 'gac', [(NG, '!trongNhap(thuc(path.resolve(cwd.d, d.val)), nc)', 'false', 1)], r'✗ (ca |tự sinh)'),
  ('A3-FILEC-bo-ngan', 'A3', 'gac', [(NG, "laDai(w.val, '--compile') || /^-[a-zA-Z]*C/.test(w.val)", "laDai(w.val, '--compile')", 1)], r'✗ (ca |tự sinh)'),
  ('A3-BGAN-bo-PATH', 'A3', 'gac', [(NG, 'PATH|NODE_OPTIONS', 'NODE_OPTIONS', 1)], r'✗ (ca |tự sinh)'),
  ('A3-CCLA-them-la', 'A3', 'gac', [(NG, "'SubagentHandback']);", "'SubagentHandback', 'Bash2']);", 1)], r'✗ (ca |tự sinh)'),
  ('A3-GHIDUOC-bo-khung', 'A3', 'gac', [(NG, "KHUNG.test(rel) || rel.startsWith('.tu_chay_nhat_ky')", 'false', 1)], r'✗ (ca |tự sinh)'),

  # ── B1: VÁ SAI cổng PR (bản sao tu_chay/), chạy thu_cong.js. BẮT = một ca "phải ĐỎ/ĐẠT" của thu_cong lật.
  ('B1-A11-dao-goc', 'B1', 'cong', [(CG, 'else if (r.status === 0) doLy(\'A11\', `bài thử \\`${p}\\` XANH trên code gốc', 'else if (r.status === 7) doLy(\'A11\', `bài thử \\`${p}\\` XANH trên code gốc', 1)], r'✗ A11'),
  ('B1-A11-bo-xanh-PR', 'B1', 'cong', [(CG, 'for (const p of baiThu) {\n      const h = chayLenh', 'for (const p of []) {\n      const h = chayLenh', 1)], r'✗ A11'),
  ('B1-A6-bo-phamvi', 'B1', 'cong', [(CG, 'const r = gac.xetPhamVi(p, phamVi || [], CH);', 'const r = null;', 1)], r'✗ A6'),
  ('B1-A10-bo-filecam', 'B1', 'cong', [(CG, 'if (gac.khop(CH.file_cam, p, true)) {', 'if (false) {', 1)], r'✗ A10'),
  ('B1-A7-noi-tieude', 'B1', 'cong', [(CG, "if (!td.startsWith(dau) || !/^([^A-Za-z0-9._-]|$)/.test(td.slice(dau.length))) {", 'if (false) {', 1)], r'✗ A7'),
  ('B1-A12-bo', 'B1', 'cong', [(CG, "if (coCode && !baiThu.length && !mien) doLy('A12'", "if (false) doLy('A12'", 1)], r'✗ A12'),
  ('B1-laBaiThu-noi-slash', 'B1', 'cong', [(CG, "/^thu_[^/]*\\.js$/.test(path.posix.basename(p))", '/^thu_.*\\.js$/.test(p)', 1)], r'✗ A1[12]'),
  ('B1-A14-bo-dang-nhanh', 'B1', 'cong', [(CG, "if (!m) { doLy('A14', `nhánh \"${nhanh}\" không có dạng viec/<MÃ>`); if (bat('A14')) return kq(); }", 'if (!m) { }', 1)], r'✗ A14'),

  # C2: cau ghi duong tien NGOAI P26b (diem ban, diem ma bill). Bo cau -> gia lap phai BAT (I8). SONG = NANG.
  ('C2-orders-bo-diem-ban', 'C2', 'gl', [(O, 'if (shouldEarnPoints) {', 'if (false) {', 1)], r'→ I8:'),
  ('C2-sc-bo-diem-ma', 'C2', 'gl', [(SC, 'await tx.run(\n        `INSERT INTO pos_point_transactions', 'if (false) await tx.run(\n        `INSERT INTO pos_point_transactions', 1)], r'→ I8:'),
  # loyalty redeem (đổi điểm→voucher ở quầy): trừ 0 điểm = đổi quà miễn phí. KHÔNG KB nào gọi POST /redeem → SỐNG =
  # xác nhận lưới giả lập KHÔNG phủ đường này (ra-soat vòng 1 — lỗ mới, xếp CHƯA KIỂM ƯU TIÊN, không phải admin NHẸ).
  ('C2-loyalty-redeem-tru-0', 'C2', 'gl', [('server/routes/loyalty.js', '[phone, -cost,', '[phone, 0,', 1)], r'→ I8:'),

  # D1: dot bien vao THU phep soi (code dich), KHONG sua kiem_tra. Chay kiem_tra tren ban sao kho. BAT = phep do -> ✗.
  ('D1-A1-fffd', 'D1', 'kiem', [('server/ketNoiKho.js', 'function laMayThu() {', 'function laMayThu() { /*�*/', 1)], r'✗ Ký tự hỏng mã'),
  ('D1-B1-json-tran', 'D1', 'kiem', [('client/src/utils/api.js', 'this.sessionExpiredHandled = true;', 'this.sessionExpiredHandled = true; await response.json();', 1)], r'✗ api.js không có response.json'),
  ('D1-C1-them-fetch', 'D1', 'kiem', [('client/src/pages/Customers.jsx', 'const res = await fetch(url, opts);', 'const res = await fetch(url, opts); fetch("/x");', 1)], r'✗ fetch trần ngoài api.js'),
  ('D1-E1-unitprice', 'D1', 'kiem', [(O, 'let shouldEarnPoints = false;', 'let shouldEarnPoints = false; const _x = item.unit_price;', 1)], r'✗ orders.js KHÔNG tính tiền theo item.unit_price'),
  ('D1-E7-paydebt', 'D1', 'kiem', [(O, 'WHERE id = ? AND debt_amount = ?', 'WHERE id = ? AND debt_amount >= ?', 1)], r'✗ pay-debt chặn thu hai lần'),
  ('D1-E8-backup', 'D1', 'kiem', [('server/database.js', 'CREATE TABLE IF NOT EXISTS pos_orders (', 'CREATE TABLE IF NOT EXISTS pos_audit_x (x TEXT);\n    CREATE TABLE IF NOT EXISTS pos_orders (', 1)], r'✗ mọi bảng đều được sao lưu'),
  ('D1-E12-vi-ngoai', 'D1', 'kiem', [('server/routes/don-mo-rong.js', 'const pmMoi =', 'await run("UPDATE pos_wallets SET balance = 0 WHERE phone = ?");\n    const pmMoi =', 1)], r'✗ ví: mọi lệnh ghi pos_wallets'),
  ('D1-K1-env-tho', 'D1', 'kiem', [('server/index.js', "const express = require('express');", "const express = require('express'); const _u = process.env.TURSO_DATABASE_URL;", 1)], r'✗ chỉ server/ketNoiKho.js đọc biến'),
  ('D1-S3-vi-lech', 'D1', 'kiem', [('cong_cu/gia_lap/bat_bien.js', "'refund', 'adjust', 'compensation']", "'refund', 'compensation']", 1)], r'✗ giả lập: danh sách trắng ví'),
  ('D1-F3-test-thieu', 'D1', 'kiem', [('package.json', 'node kiem_tra_truoc_khi_giao.js', 'node khong_co_file.js', 1)], r'✗ npm test trỏ vào file có thật'),

  # D1 ĐỦ — một đột biến riêng cho MỖI phép (đặt vào THỨ phép soi). "!" = không stub bài thật (phép chạy thật).
  # B1 thêm: A8/A9/A13 (bản sao cong.js) + A15 (bản sao cong_github.yml).
  ('D1-A2-server-cu-phap', 'D1', 'kiem', [('server/ketNoiKho.js', 'module.exports = { laMayThu', 'module.exports = {{ laMayThu', 1)], r'✗ Cú pháp server'),
  ('D1-A2c-client-cu-phap', 'D1', 'kiem', [('client/src/main.jsx', "import ErrorBoundary from './components/ErrorBoundary.jsx'", "import import ErrorBoundary from './components/ErrorBoundary.jsx'", 1)], r'✗ Cú pháp client'),
  ('D1-B2-login-2-cho', 'D1', 'kiem', [('client/src/utils/api.js', "window.location.href = '/login';", "window.location.href = '/login'; window.location.href = '/login';", 1)], r'✗ api.js chỉ có 1 chỗ đá về /login'),
  ('D1-B-handleSE', 'D1', 'kiem', [('client/src/utils/api.js', 'handleSessionExpired', 'handleSE2', 2)], r'✗ api.js có handleSessionExpired'),
  ('D1-B-co-song-song', 'D1', 'kiem', [('client/src/utils/api.js', 'sessionExpiredHandled', 'sehai2', 4)], r'✗ api.js có cờ chặn request song song'),
  ('D1-B-pathname', 'D1', 'kiem', [('client/src/utils/api.js', "window.location.pathname !== '/login'", "window.location.pathname !== '/login2'", 1)], r'✗ api.js không đá đi khi đang ở sẵn /login'),
  ('D1-B-deadcodes-thieu', 'D1', 'kiem', [('client/src/utils/api.js', "'USER_INACTIVE'", '', 1)], r'✗ SESSION_DEAD_CODES đủ 5'),
  ('D1-B-eb-getDerived', 'D1', 'kiem', [('client/src/components/ErrorBoundary.jsx', 'getDerivedStateFromError', 'getDerivedX', 1)], r'✗ ErrorBoundary có getDerivedStateFromError'),
  ('D1-B-eb-ton-tai', 'D1', 'kiem', [('client/src/components/ErrorBoundary.jsx', None, None, 1)], r'✗ ErrorBoundary.jsx tồn tại'),
  ('D1-B-main-boc', 'D1', 'kiem', [('client/src/main.jsx', 'ErrorBoundary', 'EBhai2', 4)], r'✗ main.jsx bọc'),
  ('D1-B-layout-boc', 'D1', 'kiem', [('client/src/components/Layout.jsx', 'ErrorBoundary', 'EBba3', 4)], r'✗ Layout.jsx bọc'),
  ('D1-B-key', 'D1', 'kiem', [('client/src/components/Layout.jsx', 'key={location.pathname}', 'keyX={location.pathname}', 1)], r'✗ Layout.jsx dùng key'),
  ('D1-B-ahref-api', 'D1', 'kiem', [('client/src/pages/Settings.jsx', 'export default', 'const _a = `<a href="/api/x">`;\nexport default', 1)], r'✗ Không có <a href'),
  ('D1-B-pos6-loginTime', 'D1', 'kiem', [('client/src/pages/Settings.jsx', 'export default', 'const _lt = "loginTime";\nexport default', 1)], r'✗ POS-6'),
  ('D1-D-build-prod', 'D1', 'kiem', [('client/package.json', 'NODE_ENV=production vite build', 'vite build', 1)], r'✗ client build script ép NODE_ENV=production'),
  ('D1-E-gia-0', 'D1', 'kiem', [('server/routes/orders.js', 'product.price <= 0', 'product.price < -1', 1)], r'✗ orders.js chặn sản phẩm chưa có giá'),
  ('D1-E2-authz-tho', 'D1', 'kiem', [('server/routes/orders.js', 'let shouldEarnPoints = false;', 'let shouldEarnPoints = false; const _z2 = item.from_package ? 0 : 1;', 1)], r'✗ POST /orders có cổng phân quyền'),
  ('D1-E-trangthai-dungma', 'D1', 'kiem', [('server/routes/signup-codes.js', "const TRANG_THAI_DUNG_MA = { status: 'completed', payment_status: 'paid' }", "const TRANG_THAI_DUNG_MA = { status: 'pending', payment_status: 'paid' }", 1)], r'✗ kiemDonCuaMa: hằng TRANG_THAI_DUNG_MA'),
  ('D1-E-danhsach-trang', 'D1', 'kiem', [('server/routes/signup-codes.js', 'return { don };', 'return { don }; return { don };', 1)], r'✗ kiemDonCuaMa là DANH SÁCH TRẮNG'),
  ('D1-E-claim-chiem', 'D1', 'kiem', [('server/routes/signup-codes.js', 'SET claimed_at = ?, claimed_phone = ? WHERE id = ? AND claimed_at IS NULL', 'SET claimed_at = ?, claimed_phone = ? WHERE id = ?', 1)], r'✗ /claim: chiếm mã'),
  ('D1-E-ndiem-chiem', 'D1', 'kiem', [('server/routes/signup-codes.js', 'WHERE id = ? AND diem_nhan_luc IS NULL', 'WHERE id = ?', 1)], r'✗ /nhan-diem: chiếm mã'),
  ('D1-E-vi-tuongdoi', 'D1', 'kiem', [('server/routes/wallets.js', 'SET balance = balance + ?', 'SET balance = ?', 1)], r'✗ ví: ghiVi đọc số dư'),
  ('D1-E-vi-trang5', 'D1', 'kiem', [('server/routes/wallets.js', "const LOAI_TINH_VAO_VI = ['topup', 'purchase', 'refund', 'adjust', 'compensation']", "const LOAI_TINH_VAO_VI = ['topup', 'purchase', 'refund', 'adjust', 'compensation', 'debt_payment']", 1)], r'✗ ví: danh sách trắng LOAI_TINH_VAO_VI'),
  ('D1-K-4ca', 'D1', 'kiem', [('server/ketNoiKho.js', 'process.env.REPL_ID', 'process.env.REPL_IDX', 1)], r'✗ ketNoiKho.js chạy đúng cả 4 ca'),
  ('D1-K-data', 'D1', 'kiem', [('.gitignore', 'data/', 'data_x/', 1)], r'✗ .gitignore chặn thư mục data/'),
  ('D1-F-attached', 'D1', 'kiem', [('.gitignore', 'attached_assets/', 'attached_assetsX/', 1)], r'✗ .gitignore có attached_assets/'),
  ('D1-F-dist', 'D1', 'kiem', [('.gitignore', 'data/', 'data/\nclient/dist/', 1)], r'✗ .gitignore KHÔNG chặn client/dist'),
  ('!D1-E11-P20', 'D1', 'kiem', [('server/routes/orders.js', 'WHERE id = ? AND debt_amount = ?', 'WHERE id = ? AND debt_amount >= ?', 1)], r'✗ bài chạy thật cong_cu/thu_P20.js'),
  ('!D1-E11-P21', 'D1', 'kiem', [('server/routes/wallets.js', "const LOAI_TINH_VAO_VI = ['topup', 'purchase', 'refund', 'adjust', 'compensation']", "const LOAI_TINH_VAO_VI = ['topup', 'purchase', 'refund', 'adjust', 'compensation', 'debt_payment']", 1)], r'✗ bài chạy thật cong_cu/thu_P21.js'),
  ('!D1-E11-P26a', 'D1', 'kiem', [('server/routes/refunds.js', 'if (chiem.changes !== 1) return', 'if (false) return', 1)], r'✗ bài chạy thật cong_cu/thu_P26a.js'),
  ('!D1-E11-P26b', 'D1', 'kiem', [('server/routes/wallets.js', 'SET balance = balance + ?', 'SET balance = ?', 1)], r'✗ bài chạy thật cong_cu/thu_P26b.js'),
  ('!D1-T1-nguoi-gac', 'D1', 'kiem', [('tu_chay/nguoi_gac.js', "if (/[Aufpie]/.test(v.slice(1))) return chan('GIT-ADD', v);", "if (/[ufpie]/.test(v.slice(1))) return chan('GIT-ADD', v);", 1)], r'✗ bài chạy thật tu_chay/thu_nguoi_gac.js'),
  ('!D1-T1b-cong-cu', 'D1', 'kiem', [('tu_chay/xem_thu.sh', 'if [ -n "$CLAUDECODE" ] || [ -n "$CLAUDE_CODE_CHILD_SESSION" ]; then', 'if [ -n "$KHONG_CO_BIEN_NAY" ]; then', 1)], r'✗ bài chạy thật tu_chay/thu_cong_cu.js'),
  ('!D1-T1c-cong', 'D1', 'kiem', [('tu_chay/cong.js', 'const r = gac.xetPhamVi(p, phamVi || [], CH);', 'const r = null;', 1)], r'✗ bài chạy thật tu_chay/thu_cong.js'),
  ('B1-A8-noi', 'D1', 'cong', [('tu_chay/cong.js', "if (lech.length) doLy('A8', `bản cài lệch nguồn", "if (lech.length > 99) doLy('A8', `bản cài lệch nguồn", 1)], r'✗ A8'),
  ('B1-A9-noi', 'D1', 'cong', [('tu_chay/cong.js', "if (p !== '.github/workflows/cong.yml') doLy('A9'", "if (false) doLy('A9'", 1)], r'✗ A9'),
  ('B1-A13-bo-daydu', 'D1', 'cong', [('tu_chay/cong.js', 'for (const l of [...CH.lenh_bai_thu, ...CH.lenh_kiem_day_du]) {', 'for (const l of [...CH.lenh_bai_thu]) {', 1)], r'✗ A13'),
  ('B1-A15-dao-fork', 'D1', 'cong', [('tu_chay/cong_github.yml', 'if [ "$HEAD_REPO" != "$BASE_REPO" ]; then', 'if [ "$HEAD_REPO" = "$BASE_REPO" ]; then', 2)], r'✗ A15'),
]

# ═══ C2 ĐỦ — sinh một đột biến "bỏ câu" cho MỖI câu ghi thật ở 11 file routes tiền + lời gọi ghiVi ═══
# Bỏ câu = thay callee bằng stub vô hại qua ternary `(0?callee:STUB)(…)` — giữ nguyên SQL/đối số, không sập cú pháp,
# trả về {changes:1,…} nên downstream không ném. BẮT = giả lập/thu_P26a/b/P20/P21 in dòng ✗ (bất biến lệch / HTTP sai).
# SỐNG = không bài nào bắt → câu ghi đó KHÔNG được lưới phủ (xếp mức theo middleware route, ghi "ở quầy sẽ sai gì").
C2_FILES = ['orders', 'refunds', 'wallets', 'damages', 'packages', 'signup-codes', 'discount-codes', 'rewards',
            'loyalty', 'don-mo-rong', 'customers-v2']
STUB = '(0?%s:async()=>({changes:1,lastInsertRowid:1,rows:[],rowsAffected:1,id:1}))'


def _bo_ghi_chu(s):
  s = re.sub(r'/\*[\s\S]*?\*/', lambda m: ' ' * len(m.group()), s)
  s = re.sub(r'(^|[^:])//[^\n]*', lambda m: m.group(1) + ' ' * (len(m.group()) - len(m.group(1))), s)
  return s


def _middleware(raw, pos):
  # router.<verb>('...', <middleware…>, async…) gần nhất TRƯỚC pos → phân loại quầy/khách vs quản trị
  best = None
  for m in re.finditer(r"router\.(get|post|put|delete|patch)\(", raw):
    if m.start() < pos: best = m
    else: break
  if not best: return 'khong-ro'
  dong = raw[best.start():raw.find('\n', best.start()) + 1 or best.start() + 200]
  dinh = raw[best.start():best.start() + 400]
  if re.search(r"checkPermission\(\s*['\"]manage", dinh): return 'quan-tri'
  if 'authenticateServiceOrUser' in dinh: return 'khach-app'
  if 'authenticate' in dinh: return 'quay'
  return 'khong-ro'


def sinh_c2full():
  ra = []
  for f in C2_FILES:
    rel = f'server/routes/{f}.js'
    raw = open(os.path.join(GOC, rel), encoding='utf-8').read()
    clean = _bo_ghi_chu(raw)
    idx = 0
    for m in re.finditer(r'(?<![\w.])(tx\.run|run|ghiVi)\(', clean):
      callee = m.group(1)
      pre = clean[max(0, m.start() - 20):m.start()]
      if re.search(r'function\s*$', pre): continue  # bỏ ĐỊNH NGHĨA function ghiVi(
      after = clean[m.end():m.end() + 240]
      if callee == 'ghiVi':
        kind = 'ghiVi'
      else:
        km = re.search(r'\b(INSERT INTO|UPDATE|DELETE FROM|REPLACE INTO)\b', after)
        if not km: continue
        kind = km.group(1).split()[0].lower()
      start = m.start()
      # nới neo trên RAW tới khi duy nhất (callee ở clean và raw cùng offset vì _bo_ghi_chu giữ độ dài)
      L = 70
      while L <= 600 and raw.count(raw[start:start + L]) != 1: L += 40
      anchor = raw[start:start + L]
      if raw.count(anchor) != 1: continue  # không neo được duy nhất → bỏ (ghi CHƯA KIỂM thủ công nếu cần)
      new = (STUB % callee) + '(' + anchor[len(callee) + 1:]
      mw = _middleware(raw, start)
      idx += 1
      ten = f'C2F-{f}-{idx:02d}-{kind}-{mw}'
      ra.append((ten, 'C2F', 'c2full', [(rel, anchor, new, 1)], r'✗ '))
  return ra


DOT_BIEN += sinh_c2full()

# ═══ Bản sao + lệnh ══════════════════════════════════════════════════════════
BAI_THAT = ['cong_cu/thu_P20.js', 'cong_cu/thu_P21.js', 'cong_cu/thu_P26a.js', 'cong_cu/thu_P26b.js',
            'tu_chay/thu_nguoi_gac.js', 'tu_chay/thu_cong_cu.js', 'tu_chay/thu_cong.js']
N = lambda *a: ['node', *a]
LENH = {  # cách chạy → (loại bản sao, [tầng: [lệnh…]], giây tối đa mỗi lệnh)
  'gac': ('tu', [[N('tu_chay/thu_nguoi_gac.js')]], 300),
  'cong': ('tu', [[N('tu_chay/thu_cong.js')]], 400),
  'gac+cong': ('tu', [[N('tu_chay/thu_nguoi_gac.js'), N('tu_chay/thu_cong.js')]], 400),
  'congcu': ('tu', [[N('tu_chay/thu_cong_cu.js')]], 300),
  'gl': ('sv', [[N('cong_cu/gia_lap/chay.js')]], 300),
  'thugl': ('sv', [[N('cong_cu/thu_gia_lap.js')]], 400),
  'p26b': ('sv', [[N('cong_cu/thu_P26b.js')]], 180),
  # C2: tầng nhanh = 4 bài chạy thật của npm test (P26a, P26b, P20, P21); còn sống mới chạy giả lập đủ 18 KB.
  'c2': ('sv', [[N('cong_cu/thu_P26a.js'), N('cong_cu/thu_P26b.js'), N('cong_cu/thu_P20.js'), N('cong_cu/thu_P21.js')],
                [N('cong_cu/gia_lap/chay.js')]], 300),
  # C2 ĐỦ: tầng 1 = giả lập 18 KB + thu_P26a + thu_P26b; SỐNG thì tầng 2 = thu_P20 + thu_P21 (hai bài này không nhận --may-chu).
  'c2full': ('sv', [[N('cong_cu/gia_lap/chay.js'), N('cong_cu/thu_P26a.js'), N('cong_cu/thu_P26b.js')],
                    [N('cong_cu/thu_P20.js'), N('cong_cu/thu_P21.js')]], 300),
  'kiem': ('kho', [[N('kiem_tra_truoc_khi_giao.js')]], 900),
  'kiemdd': ('khodd', [[N('kiem_tra_truoc_khi_giao.js', '--day-du')]], 1500),
}
for _k in range(1, 19):
  LENH[f'kb{_k}'] = ('sv', [[N('cong_cu/gia_lap/chay.js', '--den-kb', str(_k))]], 300)


def git_ls():
  r = subprocess.run(['git', 'ls-files', '-z'], cwd=GOC, capture_output=True, check=True)
  return [p for p in r.stdout.decode().split('\0') if p and not p.startswith('attached_assets/')]


def chep(nguon_rel, dich_goc):
  n, d = os.path.join(GOC, nguon_rel), os.path.join(dich_goc, nguon_rel)
  os.makedirs(os.path.dirname(d), exist_ok=True)
  if os.path.isdir(n): shutil.copytree(n, d, symlinks=True)
  else: shutil.copy2(n, d)


def dung_ban_sao(loai, tam, that):
  k = os.path.join(tam, 'kho')
  os.makedirs(k)
  if loai == 'tu':
    for x in ('tu_chay', '.github/workflows/keep-alive.yml'): chep(x, k)
  elif loai == 'sv':
    for x in ('server', 'cong_cu', 'tu_chay/cau_hinh.json'): chep(x, k)
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))
  else:  # kho / khodd: mọi file git theo dõi (trừ attached_assets/)
    for p in git_ls(): chep(p, k)
    os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(k, 'node_modules'))
    cnm = os.path.join(GOC, 'client', 'node_modules')
    if loai == 'khodd': shutil.copytree(cnm, os.path.join(k, 'client', 'node_modules'), symlinks=True)
    else: os.symlink(cnm, os.path.join(k, 'client', 'node_modules'))  # chỉ esbuild đọc, không ghi
    if not that:  # bài chạy thật thay bằng bài rỗng: nhanh, và đột biến không nhắm chúng thì không ảnh hưởng
      for b in BAI_THAT: open(os.path.join(k, b), 'w').write('process.exit(0);\n')
  return k


def ap(k, doi):
  for d in doi:
    f, cu, moi, n = d[:4]
    p = os.path.join(k, f)
    if cu is None:
      if os.path.exists(p): return f'{f}: đã có, không tạo được'
      os.makedirs(os.path.dirname(p), exist_ok=True)
      open(p, 'w', encoding='utf-8').write(moi)
      continue
    try: s = open(p, encoding='utf-8').read()
    except OSError: return f'{f}: không có file'
    if s.count(cu) != n: return f'{f}: chuỗi gốc khớp {s.count(cu)} lần, cần {n} — đột biến không áp được'
    if moi is None: os.remove(p); continue
    if len(d) > 4:
      vt = -1
      for _ in range(d[4] + 1): vt = s.index(cu, vt + 1)
      s = s[:vt] + moi + s[vt + len(cu):]
    else:
      s = s.replace(cu, moi)
    open(p, 'w', encoding='utf-8').write(s)
  return ''


def moi_truong(tam):
  t = os.path.join(tam, 'tmp')
  os.makedirs(t, exist_ok=True)
  e = {x: os.environ[x] for x in ('PATH', 'HOME', 'LANG', 'LC_ALL') if x in os.environ}
  e['TMPDIR'] = t
  return e


def chay_lenh(argv, cwd, env, gio):
  t0 = time.time()
  p = subprocess.Popen(argv, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
  with KHOA: CON.add(p.pid)
  try:
    ra, _ = p.communicate(timeout=gio)
    ma = p.returncode
  except subprocess.TimeoutExpired:
    try: os.killpg(p.pid, signal.SIGKILL)
    except ProcessLookupError: pass
    ra, _ = p.communicate()
    ma = None
  finally:
    with KHOA: CON.discard(p.pid)
  return ma, re.sub(r'\x1b\[[0-9;]*m', '', ra.decode('utf-8', 'replace')), time.time() - t0


def cham(db, that=None):
  ten, nhom, cach, doi, mau = db
  loai, tang, gio = LENH[cach]
  tam = tempfile.mkdtemp(prefix='db_', dir=GOC_TAM)
  t0 = time.time()
  try:
    k = dung_ban_sao(loai, tam, ten.startswith('!') if that is None else that)
    loi = ap(k, doi)
    if loi: return dict(ten=ten, nhom=nhom, kq='HỎNG', giay=0, chi=loi)
    env, lac, treo = moi_truong(tam), [], []
    for lop in tang:
      for argv in lop:
        ma, ra, g = chay_lenh(argv, k, env, gio)
        ten_lenh = ' '.join(argv[1:])
        if ma is None: treo.append(f'{ten_lenh} quá {gio} s'); continue
        if ma == 0: continue
        trung = [l.strip() for l in ra.splitlines() if re.search(mau, l)]
        if trung:
          return dict(ten=ten, nhom=nhom, kq='BẮT', giay=round(time.time() - t0), chi=f'[{ten_lenh}] {trung[0][:220]}')
        dong = [l.strip() for l in ra.strip().splitlines() if l.strip()]
        lac.append(f'[{ten_lenh} thoát {ma}] ' + (dong[-1][:200] if dong else '(không in gì)'))
    kq = 'TREO' if treo else 'LẠC' if lac else 'SỐNG'
    return dict(ten=ten, nhom=nhom, kq=kq, giay=round(time.time() - t0), chi=' | '.join(treo + lac)[:400] or 'mọi lệnh thoát 0')
  finally:
    shutil.rmtree(tam, ignore_errors=True)


def kiem_sach(cach_ds, j):
  """Mỗi cách chạy dùng tới: chạy bản sao KHÔNG đột biến, 3 bản cùng lúc → phải xanh cả 3."""
  viec = [(c, that) for c, that in cach_ds for _ in range(3)]
  with ThreadPoolExecutor(max_workers=max(j, 3)) as ex:
    kq = list(ex.map(lambda x: cham((f'sạch:{x[0]}', '-', x[0], [], r'$^'), x[1]), viec))
  hong = [r for r in kq if r['kq'] != 'SỐNG']
  for r in hong: print(f"  ✗ KIỂM SẠCH {r['ten']}: {r['kq']} · {r['chi']}", flush=True)
  return not hong


# ═══ Kho thật không đổi (K5) ════════════════════════════════════════════════
def anh_kho():
  st = subprocess.run(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=GOC, capture_output=True, text=True).stdout
  st = '\n'.join(l for l in st.splitlines() if not l[3:].startswith('viec/AUDIT-1/'))
  # KHÔNG so nhật ký người gác (.tu_chay_nhat_ky*): hook ghi MỌI lệnh Bash của CẢ phiên vào đó, nên hoạt động song
  # song (soát viên / chủ quán gõ lệnh khác) làm nó đổi → báo "KHO BẨN" OAN dù dot_bien.py không đụng kho (ra-soat
  # vòng 1, khuôn K8). Chỉ so data/ (dữ liệu quầy) — thứ dot_bien.py tuyệt đối không được chạm.
  phu = []
  for f in sorted(os.listdir(GOC)):
    if f == 'data':
      s = os.stat(os.path.join(GOC, f)); phu.append(f'{f}:{s.st_size}:{s.st_mtime_ns}')
  vite = os.path.join(GOC, 'client', 'node_modules', '.vite')
  phu.append('.vite:' + (str(os.stat(vite).st_mtime_ns) if os.path.exists(vite) else 'không có'))
  return st + '\n' + '|'.join(phu)


def don(*_):
  for pid in list(CON):
    try: os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError: pass
  shutil.rmtree(GOC_TAM, ignore_errors=True)
  sys.exit(130)


def chon_db(tu):
  if not tu: return [d for d in DOT_BIEN if d[1] != 'G3']
  ra = []
  for d in DOT_BIEN:
    if any(t == d[1] or t == d[0] or (t.endswith('*') and d[0].startswith(t[:-1])) for t in tu): ra.append(d)
  return ra


def main():
  a = sys.argv[1:]
  j, ra_json = 3, None
  if '-j' in a: i = a.index('-j'); j = int(a[i + 1]); del a[i:i + 2]
  if '--json' in a: i = a.index('--json'); ra_json = a[i + 1]; del a[i:i + 2]
  ds = chon_db(a)
  if not ds: print('không có đột biến nào khớp', a); return 2
  trung = [t for t in {d[0] for d in DOT_BIEN} if sum(d[0] == t for d in DOT_BIEN) > 1]
  if trung: print('tên đột biến trùng:', trung); return 2
  truoc = anh_kho()
  t0 = time.time()
  try:
    cach = sorted({(d[2], d[0].startswith('!')) for d in ds})
    print(f'AUDIT-1 dot_bien: {len(ds)} đột biến · -j {j} · kiểm sạch {len(cach)} loại', flush=True)
    if not kiem_sach(cach, j):
      print('  DỪNG — bản sao không đột biến đã đỏ, không chấm gì'); return 4
    kq = []
    with ThreadPoolExecutor(max_workers=j) as ex:
      for r in ex.map(cham, ds):
        kq.append(r)
        print(f"{r['kq']:4}  {r['nhom']:3} {r['ten']}  ({r['giay']} s) · {r['chi']}", flush=True)
  finally:
    shutil.rmtree(GOC_TAM, ignore_errors=True)
  print(f'\n  tổng {len(kq)} · thời gian {round(time.time() - t0)} s')
  for n in sorted({r['nhom'] for r in kq}):
    x = [r for r in kq if r['nhom'] == n]
    dem = {k: sum(r['kq'] == k for r in x) for k in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC', 'TREO')}
    print(f'  {n:3} ' + ' · '.join(f'{k} {v}' for k, v in dem.items()))
  if ra_json:
    with open(ra_json, 'w', encoding='utf-8') as f: json.dump(kq, f, ensure_ascii=False, indent=1)
  sot = os.path.exists(GOC_TAM)
  if anh_kho() != truoc or sot:
    print('  ✗ KHO BẨN — git status / nhật ký người gác / data/ / .vite đổi, hoặc thư mục tạm còn sót'); return 3
  print('  ✓ kho thật không đổi (git status ngoài viec/AUDIT-1/, data/, .vite); thư mục tạm đã xoá')
  return 0


if __name__ == '__main__':
  for s in (signal.SIGINT, signal.SIGTERM): signal.signal(s, don)
  sys.exit(main())
