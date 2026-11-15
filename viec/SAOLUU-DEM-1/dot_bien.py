#!/usr/bin/env python3
"""SAOLUU-DEM-1 — đột biến cho MỖI chỗ vá: VS- (vá sai cách) và BV- (bỏ vá). Chạy ở GỐC kho:
    python3 viec/SAOLUU-DEM-1/dot_bien.py [tên...]      (không tên = chạy hết; có ĐỐI CHỨNG trước)
    python3 viec/SAOLUU-DEM-1/dot_bien.py --liet-ke
    python3 viec/SAOLUU-DEM-1/dot_bien.py --help

Khuôn viec/DANG-NHAP-2/dot_bien.py: chép server/ + cong_cu/ + client/src/ + bộ kiểm ra thư mục tạm (BẢN CHÉP THẬT — chỉ node_modules nối symlink),
thay chuỗi (mỗi chuỗi phải khớp ĐÚNG số lần ghi sẵn — không khớp là HỎNG, K3), chạy cong_cu/thu_SAOLUUDEM1.js TRONG bản sao.
BẮT = thoát ≠ 0 VÀ có dòng `✗` khớp mẫu ĐÚNG ca phải bắt. Bài sập hoặc đỏ không khớp mẫu = LẠC. Xanh trọn = SỐNG. Không đụng server/ thật.
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

sys.dont_write_bytecode = True
GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BK, KM, ST, IX = 'server/routes/backup.js', 'server/utils/khoaSaoLuuPos.js', 'server/routes/settings.js', 'server/index.js'
UI, SJ, KT = 'client/src/pages/CaiDat/KhoaSaoLuuPos.jsx', 'client/src/pages/Settings.jsx', 'kiem_tra_truoc_khi_giao.js'
BAI = 'thu_SAOLUUDEM1.js'

CHAN_LUOT = "if (khoaTuDong.chanLuot(req.ip)) return res.status(429).json({ error: 'Gọi quá nhiều lần — thử lại sau ít phút', code: 'QUA_NHIEU_LAN' });"
KIEM_KHOA = "if (!m || !(await khoaTuDong.khoaDung(m[1]))) return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết — đăng nhập lại', code: 'CHUA_DANG_NHAP' });"
CAU_401 = "{ error: 'Chưa đăng nhập hoặc phiên đã hết — đăng nhập lại', code: 'CHUA_DANG_NHAP' }"
TIM_BEARER = "const m = /^Bearer (\\S+)$/.exec(req.headers.authorization || '');"
GHI_LAY = "await khoaTuDong.ghiLanLay(m[1], tep.buffer.length);"
LOG_TU_DONG = "console.log(`[sao-luu-tu-dong] da gui ${tep.filename} (${tep.buffer.length} byte) cho ${req.ip}`);"
CHI_CHU_QUAN = "if (req.user.role !== 'owner') return res.status(403).json({ error: 'Chỉ chủ quán quản lý khoá sao lưu tự động', code: 'CHI_CHU_QUAN' });"
PIN_TAO = "router.post('/khoa-tu-dong', ...chuQuanLam(async (req, res) => {\n  if (!(await quaPin(req, res))) return undefined;\n"
PIN_THU_HOI = "router.post('/khoa-tu-dong/thu-hoi', ...chuQuanLam(async (req, res) => {\n  if (!(await quaPin(req, res))) return undefined;\n"
LOC_XUAT = "return t.name === 'pos_settings' ? rows.filter((r) => r.key !== khoaTuDong.KHOA_CAI_DAT) : rows;"
LOC_KE_HOACH = "    m.dong = m.dong.filter((d) => d.key !== khoaTuDong.KHOA_CAI_DAT);\n"
TRANG_TRONG = "    if (!m.dong.length) { m.status = 'skipped'; m.code = 'TRANG_TRONG'; m.reason = 'Không có dữ liệu'; delete m.dong; }\n"
CHEN_KHOA = "    if (dongKhoa) trangCaiDat.dong.push({ ...Object.fromEntries(trangCaiDat.cot.map((c) => [c, dongKhoa[c] ?? null])), __rowNum__: 0 });\n"
GAN_THE = "{isAdmin && <KhoaSaoLuuPos />}"
CAU_DAN = "Dán vào Apps Script › Cài đặt dự án › Thuộc tính tập lệnh, tên KHOA_POS. Không gửi khoá qua chat / Zalo."

# (tên, [(file, chuỗi gốc, chuỗi thay, số lần khớp)], mẫu phải thấy trong dòng ✗)
DOT_BIEN = [
  # ── A1: MỘT hàm dựng tệp ──
  ('VS-TEP-RIENG', [(BK, 'const tep = await dungTepSaoLuu();', "const tep = { buffer: Buffer.from(XLSX.write(XLSX.utils.book_new(), { type: 'buffer', bookType: 'xlsx' })), filename: 'x.xlsx' };", 1)], r'✗ (A1a|A1b|A1c) '),
  ('VS-EXPORT-ALL-RIENG', [(BK, 'guiTepXlsx(res, await dungTepSaoLuu());', "guiTepXlsx(res, { buffer: Buffer.from(XLSX.write(XLSX.utils.book_new(), { type: 'buffer', bookType: 'xlsx' })), filename: 'POS-backup-x.xlsx' });", 1)], r'✗ (A1a|A1b|A1c|A1d) '),
  # ── C1–C2: khoá, so băm, câu 401 chung ──
  ('VS-KHONG-SO-BAM', [(KM, 'return crypto.timingSafeEqual(a, b) && !!d;', 'return !!d;', 1)], r'✗ C2a '),
  ('VS-401-KHAC-CAU', [(BK, KIEM_KHOA, "if (!m) return res.status(401).json({ error: 'Thiếu khoá', code: 'CHUA_DANG_NHAP' });\n    if (!(await khoaTuDong.khoaDung(m[1]))) return res.status(401).json(" + CAU_401 + ");", 1)], r'✗ C2a '),
  ('VS-401-MA-KHAC', [(BK, KIEM_KHOA, KIEM_KHOA.replace("code: 'CHUA_DANG_NHAP'", "code: 'KHOA_SAI'"), 1)], r'✗ C2a '),
  ('VS-KHOA-TRONG-QUERY', [(BK, TIM_BEARER, TIM_BEARER + "\n    const m2 = m || (req.query.khoa ? [0, String(req.query.khoa)] : null);", 1),
                           (BK, 'if (!m || !(await khoaTuDong.khoaDung(m[1])))', 'if (!m2 || !(await khoaTuDong.khoaDung(m2[1])))', 1)], r'✗ C2a '),
  ('VS-VE-POS-QUA-CUA', [(BK, KIEM_KHOA, "if (!m || !(await khoaTuDong.khoaDung(m[1])) && !String(m?.[1]).includes('.')) return res.status(401).json(" + CAU_401 + ");", 1)], r'✗ C2a '),
  # ── B1: khoá ngẫu nhiên, chỉ băm, một khoá ──
  ('VS-KHOA-NGAN', [(KM, 'crypto.randomBytes(32)', 'crypto.randomBytes(16)', 1)], r'✗ B1c '),
  ('VS-TIEN-TO-SAI', [(KM, "const TIEN_TO = 'posk_';", "const TIEN_TO = 'ndk_';", 1)], r'✗ B1c '),
  ('VS-LUU-KHOA-THO', [(KM, 'ma_bam: bam(khoa)', 'ma_bam: bam(khoa), khoa', 1)], r'✗ B1d '),
  ('VS-BAM-MD5', [(KM, "const bam = (s) => crypto.createHash('sha256')", "const bam = (s) => crypto.createHash('md5')", 1)], r'✗ B1d '),
  ('VS-TAO-KHONG-THAY', [(KM, 'DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at', 'DO NOTHING', 1)], r'✗ B1f '),
  ('BV-TRANG-THAI-LO-BAM', [(KM, 'tao_boi: d.tao_boi, lay_luc', 'tao_boi: d.tao_boi, ma_bam: d.ma_bam, lay_luc', 1)], r'✗ B1e '),
  # ── B2: chỉ chủ quán + PIN, thu hồi có hiệu lực ngay ──
  ('BV-CHI-CHU-QUAN', [(BK, CHI_CHU_QUAN, '', 1)], r'✗ (B2a|B2b|B2c) '),
  ('BV-PIN-TAO', [(BK, PIN_TAO, "router.post('/khoa-tu-dong', ...chuQuanLam(async (req, res) => {\n", 1)], r'✗ B2a '),
  ('BV-PIN-THU-HOI', [(BK, PIN_THU_HOI, "router.post('/khoa-tu-dong/thu-hoi', ...chuQuanLam(async (req, res) => {\n", 1)], r'✗ B2c '),
  ('BV-THU-HOI', [(KM, "run('DELETE FROM pos_settings WHERE key = ?'", "run('DELETE FROM pos_settings WHERE key = ? AND 0'", 1)], r'✗ B2d '),
  ('VS-THU-HOI-LAN-HAI-200', [(KM, "[KHOA_CAI_DAT])).changes === 1;", "[KHOA_CAI_DAT])).changes >= 0;", 1)], r'✗ B2d '),
  # ── C4: trần 6 lần / giờ / IP, đúng lẫn sai ──
  ('BV-CHAN-LUOT', [(BK, CHAN_LUOT, '', 1)], r'✗ C4 '),
  ('VS-TRAN-7', [(KM, 'const TRAN_LUOT = 6;', 'const TRAN_LUOT = 7;', 1)], r'✗ C4 '),
  ('VS-TRAN-5', [(KM, 'const TRAN_LUOT = 6;', 'const TRAN_LUOT = 5;', 1)], r'✗ C4 '),
  ('VS-LUOT-CHI-KHOA-SAI', [(BK, CHAN_LUOT, '', 1),
                            (BK, KIEM_KHOA, "if (!m || !(await khoaTuDong.khoaDung(m[1]))) { if (khoaTuDong.chanLuot(req.ip)) return res.status(429).json({ error: 'x', code: 'QUA_NHIEU_LAN' }); return res.status(401).json(" + CAU_401 + "); }", 1)], r'✗ C4 '),
  ('VS-LUOT-THEO-KHOA', [(BK, 'khoaTuDong.chanLuot(req.ip)', "khoaTuDong.chanLuot(String(req.headers.authorization))", 1)], r'✗ C4 '),
  # ── C5: lần lấy gần nhất + log không chứa khoá ──
  ('BV-GHI-LAN-LAY', [(BK, GHI_LAY, '', 1)], r'✗ C5a '),
  ('VS-LAN-LAY-CO-SAI', [(BK, GHI_LAY, 'await khoaTuDong.ghiLanLay(m[1], 0);', 1)], r'✗ C5a '),
  ('VS-LOG-KHOA', [(BK, LOG_TU_DONG, LOG_TU_DONG.replace('cho ${req.ip}', 'khoa ${m[1]}'), 1)], r'✗ C5b '),
  ('VS-LOG-BAM', [(BK, LOG_TU_DONG, LOG_TU_DONG.replace('cho ${req.ip}', 'ma ${require("crypto").createHash("sha256").update(m[1]).digest("hex")}'), 1)], r'✗ C5b '),
  # ── B1 / phát hiện: khoá riêng không lộ ở Cài đặt, không ghi được, không vào tệp xuất ──
  ('BV-SETTINGS-GET-ALL', [(ST, "WHERE key != 'store_logo' AND key != ?\", [KHOA_CAI_DAT]);", "WHERE key != 'store_logo'\");", 1)], r'✗ B1g '),
  ('BV-SETTINGS-GET-MOT', [(ST, "    if (key === KHOA_CAI_DAT) return res.status(404)", "    if (false) return res.status(404)", 1)], r'✗ B1g '),
  ('BV-SETTINGS-PUT', [(ST, "if (Object.keys(settings).includes(KHOA_CAI_DAT)) {", "if (false) {", 1)], r'✗ B1h '),
  ('VS-SETTINGS-PUT-CHI-KHOA-DAU', [(ST, "Object.keys(settings).includes(KHOA_CAI_DAT)", "Object.keys(settings)[0] === KHOA_CAI_DAT", 1)], r'✗ B1h '),
  ('VS-SETTINGS-PUT-SAU-GHI', [(ST, "return res.status(403).json({ success: false, error: 'Khoá này không sửa được ở đây', code: 'KHOA_RIENG' });", "{ await run(\"INSERT OR REPLACE INTO pos_settings (key, value, updated_at) VALUES ('thu_khoa_moi', 'x', ?)\", [getNow()]); return res.status(403).json({ success: false, error: 'Khoá này không sửa được ở đây', code: 'KHOA_RIENG' }); }", 1)], r'✗ B1h '),
  ('BV-XUAT-LOC', [(BK, LOC_XUAT, 'return rows;', 1)], r'✗ P1 '),
  ('VS-XUAT-TUNG-BANG-KHONG-LOC', [(BK, 'const rows = await docBang(tableDef);', 'const rows = await readTablePaged(tableDef.name, tableDef.key, tableDef.boCot);', 1)], r'✗ P1 '),
  ('VS-XUAT-TAT-CA-KHONG-LOC', [(BK, 'const rows = await docBang(t);', 'const rows = await readTablePaged(t.name, t.key, t.boCot);', 1)], r'✗ P1 '),
  ('BV-KHOI-PHUC-LOC', [(BK, LOC_KE_HOACH, '', 1)], r'✗ (R1|R2) '),
  ('BV-KHOI-PHUC-GIU-KHOA', [(BK, CHEN_KHOA, '', 1)], r'✗ R2 '),
  ('VS-KHOI-PHUC-TRANG-TRONG', [(BK, TRANG_TRONG, '', 1)], r'✗ R3 '),
  ('VS-XEM-TRUOC-KHONG-LOC', [(BK, 'await lapKeHoachBoKhoa(wb)) {', 'await lapKeHoach(wb, BANG_KHOI_PHUC)) {', 1)], r'✗ R1 '),
  ('VS-KHOI-PHUC-KHONG-LOC', [(BK, 'const keHoach = await lapKeHoachBoKhoa(wb);', 'const keHoach = await lapKeHoach(wb, BANG_KHOI_PHUC);', 1)], r'✗ R2 '),
  # ── B3: không đụng index.js ──
  ('VS-SUA-INDEX', [(IX, "app.use('/api/pos/backup', backupRoutes);", "app.use('/api/pos/backup', backupRoutes);   // khoaSaoLuuPos", 1)], r'✗ B3 '),
  # ── D: giao diện ──
  ('BV-UI-GAN-THE', [(SJ, GAN_THE, '', 1)], r'✗ D1a '),
  ('VS-UI-AI-CUNG-THAY', [(SJ, GAN_THE, '<KhoaSaoLuuPos />', 1)], r'✗ D1a '),
  ('VS-UI-BO-CAU-DAN', [(UI, CAU_DAN, 'Dán khoá vào Apps Script.', 1)], r'✗ D2 '),
  ('VS-UI-LUU-KHOA-TRINH-DUYET', [(UI, 'setKhoaMoi(r.khoa);', "setKhoaMoi(r.khoa); localStorage.setItem('khoa_pos', r.khoa);", 1)], r'✗ D3 '),
  ('VS-UI-FETCH-TRAN', [(UI, 'setTt((await api.get(CUA)).data);', "setTt((await (await fetch('/api/pos' + CUA)).json()).data);", 1)], r'✗ D3 '),
  ('VS-UI-BO-HOI-PIN', [(UI, '<HoiPin mo=', '<div data-mo=', 1)], r'✗ D1b '),
  # ── vòng sửa 1 (soát độc lập): lỗi phụ không phá đường chính, cửa đếm dòng, cột thiếu, so băm / điều kiện ghi ──
  ('BV-GHI-LAN-LAY-KHONG-BOC', [(BK, "try { await khoaTuDong.ghiLanLay(m[1], tep.buffer.length); } catch (e) { console.error('[sao-luu-tu-dong] khong ghi duoc lan lay gan nhat:', e.message); }",
                                 "await khoaTuDong.ghiLanLay(m[1], tep.buffer.length);", 1)], r'✗ G1 '),
  ('VS-LOG-LOI-KHOA', [(BK, "khong ghi duoc lan lay gan nhat:', e.message)", "khong ghi duoc lan lay gan nhat:', e.message, m[1])", 1)], r'✗ G1 '),
  ('BV-DEM-DONG-INFO', [(BK, 'const result = await demDong(t.name);', 'const result = await query(`SELECT COUNT(*) as count FROM ${t.name}`);', 1)], r'✗ I1 '),
  ('VS-DEM-DONG-XEM-TRUOC', [(BK, 'await demDong(m.table).catch(', 'await query(`SELECT COUNT(*) as count FROM ${m.table}`).catch(', 1)], r'✗ I1 '),
  ('BV-KHOI-PHUC-THIEU-COT', [(BK, "    if (dongKhoa) for (const c of ['key', 'value', 'updated_at']) if (!trangCaiDat.cot.includes(c)) { trangCaiDat.cot.push(c); for (const d of trangCaiDat.dong) d[c] = null; }\n", '', 1)], r'✗ R5 '),
  ('VS-SO-BANG', [(KM, 'crypto.timingSafeEqual(a, b)', 'a.equals(b)', 1)], r'✗ S1 '),
  ('BV-GHI-LAN-LAY-DIEU-KIEN', [(KM, "WHERE key = ? AND json_extract(value, '$.ma_bam') = ?`, [getNow(), coTep, KHOA_CAI_DAT, bam(khoa)]);", "WHERE key = ?`, [getNow(), coTep, KHOA_CAI_DAT]);", 1)], r'✗ S1 '),
  ('BV-NOI-BO-KIEM',[(KT, "chayBaiThat('cong_cu/thu_SAOLUUDEM1.js');", '', 1)], r'✗ E1 '),
]


def ban_sao(thay):
  """Chép server/ + cong_cu/ + client/src/ + bộ kiểm ra thư mục tạm, áp các thay thế. Trả (thư mục, lỗi|None)."""
  tmp = tempfile.mkdtemp(prefix='dotbien_saoluudem1_')
  for d in ('server', 'cong_cu', 'client/src'):
    shutil.copytree(os.path.join(GOC, d), os.path.join(tmp, d), ignore=shutil.ignore_patterns('node_modules'))
  shutil.copy(os.path.join(GOC, KT), os.path.join(tmp, KT))
  os.symlink(os.path.join(GOC, 'node_modules'), os.path.join(tmp, 'node_modules'))
  for f, goc, moi, n in thay:
    p = os.path.join(tmp, f)
    if not os.path.realpath(p).startswith(os.path.realpath(tmp) + os.sep):
      return tmp, f'{f}: đích ghi nằm NGOÀI thư mục tạm'   # K5
    s = open(p, encoding='utf-8').read()
    if s.count(goc) != n:
      return tmp, f'{f}: khớp {s.count(goc)} lần, cần {n} — {goc[:50]!r}'
    open(p, 'w', encoding='utf-8').write(s.replace(goc, moi))
  return tmp, None


def chay_bai(tmp):
  r = subprocess.run(['node', os.path.join(tmp, 'cong_cu', BAI)], cwd=tmp, capture_output=True, text=True, timeout=300)
  return r.returncode, re.sub(r'\x1b\[[0-9;]*m', '', (r.stdout or '') + (r.stderr or ''))


def chay(ten, thay, mau):
  tmp, loi = ban_sao(thay)
  try:
    if loi:
      return ten, 'HỎNG', loi
    ma, ra = chay_bai(tmp)
    hong = [l.strip() for l in ra.splitlines() if '✗' in l]
    if not re.search(r'\d+ đạt · \d+ hỏng', ra):
      return ten, 'LẠC', 'bài sập (không in dòng tổng): ' + (ra.strip().splitlines()[-1][:160] if ra.strip() else '')
    if ma == 0:
      return ten, 'SỐNG', 'bài xanh trọn'
    khop = [l for l in hong if re.search(mau, l)]
    return (ten, 'BẮT', khop[0][:120]) if khop else (ten, 'LẠC', f'đỏ nhưng không khớp {mau}: ' + ' | '.join(h[:60] for h in hong[:3]))
  except subprocess.TimeoutExpired:
    return ten, 'LẠC', 'quá hạn 300 s'
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


def doi_chung():
  tmp, _ = ban_sao([])
  try:
    ma, ra = chay_bai(tmp)
    m = re.search(r'(\d+) đạt · (\d+) hỏng', ra)
    return ma == 0 and m is not None and m.group(2) == '0', (m.group(0) if m else ra[-200:])
  finally:
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
  if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__); sys.exit(0)
  if '--liet-ke' in sys.argv:
    for t, *_ in DOT_BIEN: print(t)
    sys.exit(0)
  chon = [a for a in sys.argv[1:] if not a.startswith('--')]
  ds = [d for d in DOT_BIEN if not chon or d[0] in chon]
  if chon and len(ds) != len(chon):
    sys.exit('tên không có trong danh sách: ' + ', '.join(set(chon) - {d[0] for d in ds}))
  ok, dong = doi_chung()
  print(f'ĐỐI CHỨNG {BAI} (bản chưa đột biến): {"XANH" if ok else "ĐỎ"} · {dong}')
  if not ok:
    sys.exit('đối chứng đỏ — không chạy đột biến (K3)')
  with ThreadPoolExecutor(max_workers=4) as ex:
    kq = list(ex.map(lambda d: chay(*d), ds))
  for ten, tt, ghi in kq: print(f'{tt:5} {ten} — {ghi}')
  dem = {t: sum(1 for _, x, _ in kq if x == t) for t in ('BẮT', 'SỐNG', 'HỎNG', 'LẠC')}
  print(f'TỔNG {len(kq)} đột biến · BẮT {dem["BẮT"]} · SỐNG {dem["SỐNG"]} · HỎNG {dem["HỎNG"]} · LẠC {dem["LẠC"]}')
  sys.exit(0 if dem['BẮT'] == len(kq) else 1)
