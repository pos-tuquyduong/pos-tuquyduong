#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
POS-KHOTHU-v2 — tách KHO THỬ khỏi KHO THẬT · MỘT nơi quyết định nối vào đâu

v2 THAY v1. Rà lại v1 ngày 24.09.2026 tìm ra 3 lỗi:
  1. (K4) cong_cu/thu_p1.js tự nối Turso production và CHÈN dòng giả vào
     pos_stock_pending. v1 chỉ vá server → công cụ thử và server lệch kho nhau.
  2. (C16) v1 để việc tắt SX cho người tự sửa .env = LỜI DẶN, không phải KHOÁ.
     Tệ hơn: nếu SX_API_URL nằm trong tab Secrets của Replit thì dotenv KHÔNG
     ghi đè → sửa .env cũng vô tác dụng, đơn thử vẫn trừ kho thật.
  3. (K3/E13) phép kiểm của v1 chỉ soi database.js bằng regex → qua mặt được
     bằng một biến trung gian. Chưa thử nhánh "marker suông".

GIẢI PHÁP v2:
  · server/ketNoiKho.js (MỚI) — nơi DUY NHẤT đọc TURSO_DATABASE_URL và
    SX_API_URL. Replit → data/pos_thu.db + SX tắt. Render → như cũ.
  · database.js, utils/sxApi.js, cong_cu/thu_p1.js — đều hỏi ketNoiKho.js
  · Bộ kiểm nhóm K: (1) không file nào khác được đọc 2 biến đó, (2) CHẠY THẬT
    ketNoiKho.js qua 4 ca môi trường, (3) .gitignore chặn data/
  · CHECKLIST_CODE.md thêm mục P8 · CLAUDE.md sửa ràng buộc số 7 (nếu có file)

AN TOÀN: kiểm HẾT mỏ neo trước khi ghi (F1) · idempotent · phát hiện áp nửa
chừng · phát hiện v1 · lưu bản .truoc_KHOTHU2 · sinh lui_KHOTHU_v2.sh ·
giữ nguyên kiểu xuống dòng · KHÔNG đụng .env

CHẠY:  python3 patch_pos_khothu_v2.py        (ở gốc kho POS)
"""

import os
import sys

MOC = "POS-KHOTHU-v2"
MOC_V1 = "POS-KHOTHU-v1"
DUOI = ".truoc_KHOTHU2"

F_KN = "server/ketNoiKho.js"
F_DB = "server/database.js"
F_SX = "server/utils/sxApi.js"
F_P1 = "cong_cu/thu_p1.js"
F_KIEM = "kiem_tra_truoc_khi_giao.js"
F_CL = "CHECKLIST_CODE.md"
F_CLAUDE = "CLAUDE.md"

# ══════════════════════════════════════════════════════════════════════════
# FILE MỚI — server/ketNoiKho.js
# ══════════════════════════════════════════════════════════════════════════
KN = r"""/**
 * POS-KHOTHU-v2 — MỘT nơi DUY NHẤT quyết định POS nối vào đâu (C15, C16).
 *
 *   Replit → KHO THỬ: file data/pos_thu.db · SX TẮT (trừ khi đặt SX_API_URL_THU)
 *   Render → KHO THẬT: Turso + SX production, y như trước patch
 *
 * LUẬT: không file nào khác được đọc process.env.TURSO_DATABASE_URL hay
 * process.env.SX_API_URL. Bộ kiểm nhóm K chặn commit nếu có.
 *
 * VÌ SAO không nhận ra Replit thì nghiêng về Turso: nhận sai trên Render mà rơi
 * vào file cục bộ thì đơn bán thật ghi vào ổ đĩa tạm, MẤT khi khởi động lại.
 * Nhận sai ở Replit thì chỉ quay về tình trạng cũ — và dòng log đầu tiên của
 * server báo PRODUCTION cho người thấy ngay.
 *
 * ⚠ Nếu sau này deploy POS bằng Replit Deployments thì PHẢI xem lại file này:
 * môi trường đó cũng có REPL_ID.
 */
const fs = require('fs');
const path = require('path');

const FILE_THU = path.join(__dirname, '..', 'data', 'pos_thu.db');

function laMayThu() {
  return !!(process.env.REPL_ID || process.env.REPL_SLUG || process.env.REPLIT);
}

/** Trả { laMayThu, cauHinh } — cauHinh đưa thẳng vào createClient(). */
function cauHinhTurso() {
  if (laMayThu()) {
    fs.mkdirSync(path.dirname(FILE_THU), { recursive: true });
    return { laMayThu: true, cauHinh: { url: 'file:' + FILE_THU } };
  }
  const url = process.env.TURSO_DATABASE_URL;
  if (!url || !url.trim()) {
    // B5 — cấu hình rỗng KHÔNG được coi là hợp lệ.
    throw new Error('POS-KHOTHU-v2: thiếu TURSO_DATABASE_URL — từ chối khởi động');
  }
  return {
    laMayThu: false,
    cauHinh: { url, authToken: process.env.TURSO_AUTH_TOKEN },
  };
}

/** Địa chỉ SX. Chuỗi rỗng = không gọi SX (sxApi.isSxConfigured() trả false). */
function diaChiSX() {
  if (laMayThu()) return (process.env.SX_API_URL_THU || '').trim();
  return process.env.SX_API_URL || '';
}

module.exports = { laMayThu, cauHinhTurso, diaChiSX, FILE_THU };
"""

# ══════════════════════════════════════════════════════════════════════════
# database.js — 2 mỏ neo
# ══════════════════════════════════════════════════════════════════════════
NEO_DB_A = "const { createClient } = require('@libsql/client');\n"
MOI_DB_A = NEO_DB_A + "const { cauHinhTurso, diaChiSX } = require('./ketNoiKho'); // POS-KHOTHU-v2\n"

NEO_DB_B = r"""async function initDatabase() {
  // Kết nối Turso
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('✅ Đã kết nối Turso database');
"""

MOI_DB_B = r"""async function initDatabase() {
  // POS-KHOTHU-v2 — nối vào đâu do server/ketNoiKho.js quyết định.
  // KHÔNG tự đọc biến môi trường ở đây.
  const kn = cauHinhTurso();
  db = createClient(kn.cauHinh);

  console.log(kn.laMayThu
    ? `⚠️  KHO THỬ cục bộ: ${kn.cauHinh.url} · SX: ${diaChiSX() || 'TẮT'} — KHÔNG phải dữ liệu thật`
    : '✅ Đã kết nối Turso database (PRODUCTION)');
"""

# ══════════════════════════════════════════════════════════════════════════
# utils/sxApi.js — 1 mỏ neo
# ══════════════════════════════════════════════════════════════════════════
NEO_SX = "const SX_API_URL = process.env.SX_API_URL || '';\n"
MOI_SX = r"""// POS-KHOTHU-v2 — địa chỉ SX do ketNoiKho.js quyết định. Replit: TẮT, trừ khi
// đặt SX_API_URL_THU. Render: như cũ. Là KHOÁ trong code, không phải lời dặn
// sửa .env — vì biến trong tab Secrets của Replit thì dotenv không ghi đè.
const SX_API_URL = require('../ketNoiKho').diaChiSX();
"""

# ══════════════════════════════════════════════════════════════════════════
# cong_cu/thu_p1.js — 1 mỏ neo
# ══════════════════════════════════════════════════════════════════════════
NEO_P1 = r"""if (!process.env.TURSO_DATABASE_URL) {
  console.error('\n❌ Khong doc duoc TURSO_DATABASE_URL.\n');
  console.error('   Kiem hai dieu:');
  console.error('   1. Dang o THU MUC GOC cua repo POS?   ->  ls .env');
  console.error('   2. File .env co dong TURSO_DATABASE_URL?  ->  grep TURSO .env | cut -c1-40\n');
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
"""

MOI_P1 = r"""// POS-KHOTHU-v2 — dùng CHUNG quyết định với server (C15). Trước đây file này
// tự nối Turso production và CHÈN dòng giả vào kho thật, dù ghi chú đầu file
// nói "không dùng kho thật". Giờ chạy trong Replit là thử trên kho thử —
// đúng cái kho server đang chạy cạnh nó.
const { cauHinhTurso } = require('../server/ketNoiKho');
const kn = cauHinhTurso();
console.log(kn.laMayThu ? '⚠️  KHO THỬ: ' + kn.cauHinh.url : '✅ Turso PRODUCTION');
const db = createClient(kn.cauHinh);
"""

# ══════════════════════════════════════════════════════════════════════════
# kiem_tra_truoc_khi_giao.js — chèn nhóm K trước khối in kết quả
# ══════════════════════════════════════════════════════════════════════════
NEO_KIEM = """console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');"""

MOI_KIEM = r"""// ═══════════════════════════════════════════════════════════════════════════
nhom('K · KHO THỬ — Replit KHÔNG được chạm dữ liệu thật (POS-KHOTHU-v2)');

// K1 — chỉ ketNoiKho.js được đọc 2 biến kết nối. Kiểm MẪU NGUY HIỂM VẮNG MẶT
// ở MỌI file (E13) — bắt được cả biến trung gian lẫn cách viết khác, vì mọi
// đường nối vào kho thật đều phải đi qua việc đọc biến môi trường.
{
  const cam = [
    /process\.env\.(TURSO_DATABASE_URL|SX_API_URL)\b/,
    /process\.env\[\s*['"`](TURSO_DATABASE_URL|SX_API_URL)['"`]\s*\]/,
    /\{[^}]*\b(TURSO_DATABASE_URL|SX_API_URL)\b[^}]*\}\s*=\s*process\.env/,
  ];
  const cho = path.join('server', 'ketNoiKho.js');
  const vi = [];
  for (const f of [...liet('server', ['.js']), ...liet('cong_cu', ['.js'])]) {
    if (f === cho) continue;
    const src = boGhiChu(doc(f));
    if (cam.some((re) => re.test(src))) vi.push(f);
  }
  chac('chỉ server/ketNoiKho.js đọc biến kết nối kho thật',
    vi.length === 0, 'tự đọc biến kết nối: ' + vi.join(', '));
}

// K2 — CHẠY THẬT ketNoiKho.js qua 4 ca môi trường. Kiểm HÀNH VI, không kiểm
// câu chữ: bản vá có vô số cách viết, hành vi đúng chỉ có một (E12, E13).
{
  const p = path.join(GOC, 'server', 'ketNoiKho.js');
  if (!co('server/ketNoiKho.js')) {
    fail('server/ketNoiKho.js tồn tại', 'thiếu file');
  } else {
    const BIEN = ['REPL_ID', 'REPL_SLUG', 'REPLIT', 'TURSO_DATABASE_URL',
                  'TURSO_AUTH_TOKEN', 'SX_API_URL', 'SX_API_URL_THU'];
    const giu = {};
    for (const k of BIEN) giu[k] = process.env[k];
    const dat = (o) => { for (const k of BIEN) delete process.env[k]; Object.assign(process.env, o); };
    const nap = () => { delete require.cache[require.resolve(p)]; return require(p); };
    const sai = [];
    try {
      // Ca 1 — Replit, có ĐỦ biến production → PHẢI dùng file, PHẢI tắt SX
      dat({ REPL_ID: 'x', TURSO_DATABASE_URL: 'libsql://that', TURSO_AUTH_TOKEN: 't', SX_API_URL: 'https://that' });
      let m = nap(); let c = m.cauHinhTurso();
      if (!c.laMayThu || !String(c.cauHinh.url).startsWith('file:')) sai.push('ca 1: Replit không dùng file');
      if (c.cauHinh.authToken) sai.push('ca 1: Replit vẫn mang authToken');
      if (m.diaChiSX() !== '') sai.push('ca 1: Replit vẫn bật SX');
      // Ca 2 — Replit + SX_API_URL_THU → dùng đúng địa chỉ thử
      dat({ REPL_SLUG: 'x', SX_API_URL: 'https://that', SX_API_URL_THU: 'https://thu' });
      m = nap();
      if (m.diaChiSX() !== 'https://thu') sai.push('ca 2: không dùng SX_API_URL_THU');
      // Ca 3 — không phải Replit → Turso + SX thật, y như trước patch
      dat({ TURSO_DATABASE_URL: 'libsql://that', TURSO_AUTH_TOKEN: 't', SX_API_URL: 'https://that' });
      m = nap(); c = m.cauHinhTurso();
      if (c.laMayThu || c.cauHinh.url !== 'libsql://that' || c.cauHinh.authToken !== 't') sai.push('ca 3: production không dùng Turso');
      if (m.diaChiSX() !== 'https://that') sai.push('ca 3: production mất SX');
      // Ca 4 — không phải Replit, thiếu URL → PHẢI từ chối (B5)
      dat({});
      m = nap(); let nem = false;
      try { m.cauHinhTurso(); } catch { nem = true; }
      if (!nem) sai.push('ca 4: thiếu URL mà không từ chối');
    } catch (e) {
      sai.push('lỗi khi chạy: ' + e.message);
    } finally {
      for (const k of BIEN) {
        if (giu[k] === undefined) delete process.env[k]; else process.env[k] = giu[k];
      }
      delete require.cache[require.resolve(p)];
    }
    chac('ketNoiKho.js chạy đúng cả 4 ca môi trường', sai.length === 0, sai.join(' · '));
  }
}

// K3 — kho thử không được lọt vào git
chac('.gitignore chặn thư mục data/', /^data\/\s*$/m.test(doc('.gitignore')),
  'thêm dòng "data/" vào .gitignore');

"""

# ══════════════════════════════════════════════════════════════════════════
# CHECKLIST_CODE.md — thêm P8 trước mục G
# ══════════════════════════════════════════════════════════════════════════
NEO_CL = "\n---\n\n## G. CHECKLIST TRƯỚC KHI GIAO CODE\n"
MOI_CL = """
### P8. ⭐ Kho thử cục bộ — MỘT nơi quyết định nối vào đâu (POS-KHOTHU-v2)
Trước 24.09.2026, cửa sổ Replit nối thẳng Turso production **và** gọi SX
production: đơn thử ghi vào dữ liệu bán hàng thật và trừ kho thật.
`cong_cu/thu_p1.js` ghi "không dùng kho thật" ở đầu file nhưng thực tế nối
đúng Turso đó và chèn dòng giả vào `pos_stock_pending` — ghi chú lệch code.

Từ POS-KHOTHU-v2:
- `server/ketNoiKho.js` là nơi **DUY NHẤT** đọc `TURSO_DATABASE_URL` và
  `SX_API_URL`. Cần kết nối thì gọi `cauHinhTurso()` / `diaChiSX()`. Bộ kiểm
  nhóm K chặn commit nếu file khác tự đọc.
- Replit → `data/pos_thu.db`, SX **TẮT**. Muốn thử liên thông thì đặt
  `SX_API_URL_THU` trỏ vào **SX Replit** — không bao giờ trỏ vào production.
- Tắt SX bằng **code**, không bằng sửa `.env`: biến đặt trong tab Secrets của
  Replit thì `dotenv` không ghi đè, sửa `.env` vô tác dụng.
- Kho thử trống lần đầu: đăng nhập `admin` / `admin123` (`seedDefaultData`).
- Không nhận ra Replit thì nghiêng về Turso: nhận sai trên Render mà rơi vào
  file cục bộ thì đơn thật ghi vào ổ tạm, **mất khi khởi động lại**. Dòng log
  đầu tiên luôn báo đang ở kho nào — đọc nó.
- `data/pos.db` là file cũ thời sql.js — KHÔNG dùng. `index.js` vẫn truyền
  `DB_PATH` vào `initDatabase()` nhưng hàm bỏ qua tham số đó.
- Kho thử KHÔNG dựng lại được lỗi mạng / 502 / Turso chậm. Nhánh xử lý lỗi
  kết nối vẫn phải soi bằng mắt (E6).
- Deploy POS bằng Replit Deployments thì PHẢI xem lại `ketNoiKho.js` — môi
  trường đó cũng có `REPL_ID`.
""" + NEO_CL

# ══════════════════════════════════════════════════════════════════════════
# CLAUDE.md — ràng buộc số 7 (chỉ khi file có mặt)
# ══════════════════════════════════════════════════════════════════════════
NEO_CLAUDE = "7. **Không có file DB local.** `pos.db` trong máy là rác — số thật ở Turso (P5).\n"
MOI_CLAUDE = ("7. **Replit dùng kho thử `data/pos_thu.db`, Render dùng Turso.** Chỉ\n"
              "   `server/ketNoiKho.js` được đọc biến kết nối (P8). `data/pos.db` là rác.\n")

LUI = """#!/usr/bin/env bash
# Duong lui cua POS-KHOTHU-v2
set -e
for f in server/database.js server/utils/sxApi.js cong_cu/thu_p1.js \\
         kiem_tra_truoc_khi_giao.js CHECKLIST_CODE.md CLAUDE.md; do
  if [ -f "$f.truoc_KHOTHU2" ]; then cp "$f.truoc_KHOTHU2" "$f"; echo "  tra ve: $f"; fi
done
rm -f server/ketNoiKho.js && echo "  xoa:    server/ketNoiKho.js"
echo "Xong. Kho thu data/pos_thu.db van con, khong anh huong gi."
"""


# ══════════════════════════════════════════════════════════════════════════
def doc(p):
    # newline='' — giữ NGUYÊN kiểu xuống dòng. File CRLF thì mỏ neo (LF) không
    # khớp và patch DỪNG, thay vì lặng lẽ đổi cả file sang LF.
    with open(p, encoding="utf-8", newline="") as f:
        return f.read()


def ghi(p, s):
    tam = p + ".tam"
    with open(tam, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    os.replace(tam, p)


def thoat(msg):
    print("\n  ✗ " + msg)
    print("  → KHÔNG file nào bị sửa.\n")
    sys.exit(1)


def main():
    print("\n═══ POS-KHOTHU-v2 — tách kho thử khỏi kho thật ═══\n")

    # ── 0. Đúng kho chưa ──
    for f in ("server/index.js", F_DB, F_SX, F_P1, F_KIEM, F_CL):
        if not os.path.exists(f):
            thoat("Không thấy %s — chạy script này ở GỐC kho POS." % f)
    src = {f: doc(f) for f in (F_DB, F_SX, F_P1, F_KIEM, F_CL)}

    # CLAUDE.md là TÀI LIỆU, không phải code: dòng số 7 đã bị sửa tay thì bỏ
    # qua và nhắc, KHÔNG để một dòng tài liệu chặn cả bản vá an toàn dữ liệu.
    # CLAUDE.md đứng NGOÀI phép đếm "áp nửa chừng": nó có thể đã mang dòng mới
    # từ trước (cài lại bộ file) trong khi code chưa vá.
    co_claude = False   # True = patch này sẽ sửa CLAUDE.md
    nhac_claude = None
    if os.path.exists(F_CLAUDE):
        s = doc(F_CLAUDE)
        if MOI_CLAUDE in s:
            nhac_claude = "· CLAUDE.md đã có ràng buộc số 7 bản mới — không cần sửa"
        elif s.count(NEO_CLAUDE) == 1:
            co_claude = True
            src[F_CLAUDE] = s
        else:
            nhac_claude = ("! CLAUDE.md có, nhưng ràng buộc số 7 đã bị sửa tay — "
                           "bỏ qua, tự cập nhật theo mục P8")

    # ── 1. v1 đã áp? ──
    if any(MOC_V1 in s for s in src.values()):
        thoat("Kho đang mang bản v1. Chạy  bash lui_KHOTHU.sh  trước, rồi áp v2.")

    # ── 2. Idempotent + phát hiện áp nửa chừng (F2) ──
    da = {f: (MOC in s) for f, s in src.items() if f != F_CLAUDE}
    da[F_KN] = os.path.exists(F_KN) and MOC in doc(F_KN)
    if all(da.values()):
        print("  ✓ Đã có sẵn %s ở cả %d chỗ — bỏ qua, không sửa gì.\n" % (MOC, len(da)))
        return
    if any(da.values()):
        chi_tiet = "\n     ".join("%s = %s" % (f, "đã áp" if v else "CHƯA") for f, v in da.items())
        thoat("ÁP NỬA CHỪNG:\n     " + chi_tiet + "\n  Chạy  bash lui_KHOTHU_v2.sh  rồi áp lại.")
    if os.path.exists(F_KN):
        thoat("%s đã tồn tại mà không phải của patch này — không ghi đè file lạ." % F_KN)

    # ── 3. Kiểm HẾT mỏ neo TRƯỚC khi ghi bất kỳ file nào (F1) ──
    print("  Kiểm mỏ neo:")
    neo = [
        (F_DB, NEO_DB_A, "dòng require @libsql/client"),
        (F_DB, NEO_DB_B, "khối mở kết nối trong initDatabase()"),
        (F_SX, NEO_SX, "dòng đọc SX_API_URL"),
        (F_P1, NEO_P1, "khối tự nối Turso"),
        (F_KIEM, NEO_KIEM, "khối in kết quả cuối"),
        (F_CL, NEO_CL, "chỗ trước mục G"),
    ]
    if co_claude:
        neo.append((F_CLAUDE, NEO_CLAUDE, "ràng buộc số 7"))
    for f, n, ten in neo:
        k = src[f].count(n)
        print("    · %-28s %-38s → %d" % (f, ten, k))
        if k != 1:
            thoat("Mỏ neo '%s' trong %s phải xuất hiện đúng 1 lần, thấy %d.\n"
                  "     File đã đổi so với lúc viết patch (24.09.2026)." % (ten, f, k))
    for ten in ("function nhom(", "function chac(", "function boGhiChu(",
                "function liet(", "function co("):
        if ten not in src[F_KIEM]:
            thoat("Bộ kiểm thiếu %s — nhóm K sẽ không chạy được." % ten)
    print("    · bộ kiểm có đủ 5 hàm nhom/chac/boGhiChu/liet/co")
    if nhac_claude:
        print("    " + nhac_claude)
    elif not co_claude:
        print("    · CLAUDE.md không có — bỏ qua, không phải lỗi")
    print("  ✓ Mỏ neo đủ.\n")

    # ── 4. Dựng nội dung mới trong bộ nhớ ──
    moi = dict(src)
    moi[F_DB] = moi[F_DB].replace(NEO_DB_A, MOI_DB_A, 1).replace(NEO_DB_B, MOI_DB_B, 1)
    moi[F_SX] = moi[F_SX].replace(NEO_SX, MOI_SX, 1)
    moi[F_P1] = moi[F_P1].replace(NEO_P1, MOI_P1, 1)
    moi[F_KIEM] = moi[F_KIEM].replace(NEO_KIEM, MOI_KIEM + NEO_KIEM, 1)
    moi[F_CL] = moi[F_CL].replace(NEO_CL, MOI_CL, 1)
    if co_claude:
        moi[F_CLAUDE] = moi[F_CLAUDE].replace(NEO_CLAUDE, MOI_CLAUDE, 1)

    # ── 5. Soát TRƯỚC khi ghi — người chép và người soát là 2 đoạn code (C4) ──
    loi = []
    for f in (F_DB, F_SX, F_P1):
        if "process.env.TURSO_DATABASE_URL" in moi[f] or "process.env.SX_API_URL " in moi[f]:
            loi.append("%s: vẫn còn tự đọc biến kết nối" % f)
    if "createClient(kn.cauHinh)" not in moi[F_DB]:
        loi.append("database.js: chưa dùng cấu hình từ ketNoiKho")
    if "require('../ketNoiKho').diaChiSX()" not in moi[F_SX]:
        loi.append("sxApi.js: chưa hỏi ketNoiKho")
    if "require('../server/ketNoiKho')" not in moi[F_P1]:
        loi.append("thu_p1.js: chưa hỏi ketNoiKho")
    if moi[F_KIEM].count(NEO_KIEM) != 1 or moi[F_KIEM].count("nhom('K · KHO THỬ") != 1:
        loi.append("bộ kiểm: chèn sai số lần")
    if moi[F_CL].count("### P8.") != 1:
        loi.append("CHECKLIST: P8 sai số lần")
    for f in src:
        if f != F_CLAUDE and MOC not in moi[f]:
            loi.append("%s: thiếu marker" % f)
    if loi:
        thoat("Soát nội dung mới phát hiện lỗi:\n     - " + "\n     - ".join(loi))
    print("  ✓ Soát nội dung mới: đạt")

    # ── 6. Lưu bản trước khi vá — SAU khi soát đạt ──
    for f, s in src.items():
        ghi(f + DUOI, s)
    print("  ✓ Đã lưu %d bản %s" % (len(src), DUOI))

    # ── 7. Ghi ──
    ghi(F_KN, KN)
    print("  ✓ Tạo  %s" % F_KN)
    for f in src:
        ghi(f, moi[f])
        print("  ✓ Sửa  %s" % f)
    ghi("lui_KHOTHU_v2.sh", LUI)
    print("  ✓ Sinh lui_KHOTHU_v2.sh")

    # ── 8. Việc người phải làm ──
    print("""
═══ XONG PHẦN CODE — NGHIỆM THU ═══

  1. node --check server/ketNoiKho.js && node --check server/database.js \\
       && node --check server/utils/sxApi.js && node --check cong_cu/thu_p1.js
  2. npm test                    → nhóm K phải 3/3 xanh
  3. node server/index.js        → dòng đầu phải là:
         ⚠️  KHO THỬ cục bộ: file:... · SX: TẮT
  4. Mở app, đăng nhập  admin / admin123  → danh sách khách phải TRỐNG

  KHÔNG cần sửa .env nữa — SX đã tắt bằng code khi chạy ở Replit.

  Đường lui:  bash lui_KHOTHU_v2.sh
""")


if __name__ == "__main__":
    main()
