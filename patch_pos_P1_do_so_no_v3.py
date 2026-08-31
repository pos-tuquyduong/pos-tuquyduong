# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P1 - POS-DODNO-v1   (nguoi di doi so no, ba lop)
======================================================================

KHAC GI BAN v2 — LOI THAT
  v2 chen lop 1 SAU toan bo 25 duong /api/pos (dong 105, cac duong o 67-98).
  Express: yeu cau khop duong nao thi duong do tra loi va KHONG goi next(),
  nen lop 1 KHONG BAO GIO CHAY cho viec ban hang — dung cai no sinh ra de lam.
  Bai thu cua v2 tu gan middleware dung cho nen bao dat: no kiem Y TUONG chu
  khong kiem PATCH. v3 chuyen len truoc duong dau tien, va them 2 phep chot
  so sanh VI TRI trong file de loi nay khong tai dien.

KHAC GI BAN v1
  v1 dung `fetch` tran trong Layout.jsx -> bo kiem POS BAO LOI: luat "banh coc"
  dem so fetch tran ngoai api.js va CHI CHO GIAM (34 -> 36 la moc them).
  v2 dua loi goi vao lop chung `api.js`. Vua qua duoc bo kiem, vua tot hon that:
  duoc thua ke xu ly 401, doi ve /login, va chan yeu cau song song.

VIEC NAY LAM GI
  So no `pos_stock_pending` hien CHI CO GHI VAO, khong co noi nao doc ra.
  Trong toan bo ma nguon POS bang nay xuat hien dung 3 lan, ca 3 deu la
  INSERT. Viec roi vao do nam im vinh vien — ghi giay no rat can than roi
  cat ngan keo khong bao gio mo lai.

  Patch dung bo di doi: doc so, gui lai SX kem DUNG VAN TAY DA LUU, thanh
  cong thi danh dau xong.

VI SAO AN TOAN KHI GUI LAI
  SX da co chong trung bang van tay (SX-VANTAY-v1). Gui lai muoi lan cung
  chi tru kho MOT lan — SX tra `da_lam_roi` kem gio da lam. Khong co van
  tay thi TUYET DOI khong duoc gui lai: se tru kho lan nua.

BA LOP - KHONG LOP NAO CAN MAY CHU THUC
  1. An theo hoat dong: moi khi co nguoi dung POS, neu so con viec va lan
     doi truoc cach day qua 3 phut thi doi luon. KHONG DUNG HEN GIO —
     Render Free ngu khi khong ai dung, cron se hong CAM ma van tuong dang
     chay. Chinh viec ban hang lam dong ho.
  2. Dai bao tren thanh dieu huong: thay ngay con bao nhieu viec ket.
  3. Bam vao dai bao = doi ngay.

LUAT CHONG HONG
  · Chi gui lai dong CO VAN TAY. Dong khong co van tay -> 'can_xem' ngay,
    khong bao gio tu dong gui.
  · Thu qua 5 lan -> 'can_xem', khong thu vo han.
  · Moi lan doi toi da 20 dong, khong treo may chu.
  · Co chong chay song song: hai nguoi bam cung luc chi chay mot lan.
  · Loi khi doi KHONG duoc lam hong viec dang lam cua nguoi dung.

DIEU PATCH NAY CO TINH KHONG LAM
  Khong tu doi khi may chu vua khoi dong (Render restart) — phai co nguoi
  dung POS thi moi doi. Do la danh doi CO Y: gói Free ngu, khong the tin
  vao bat ky thu gi chay nen.

CHU Y - PHAI BUILD LAI CLIENT
      cd client && npm run build && cd ..

DUONG LUI
  rm server/utils/doSoNo.js server/routes/so-no.js
  cp client/src/utils/api.js.truoc_dodno client/src/utils/api.js
  cp server/index.js.truoc_dodno server/index.js
  cp client/src/components/Layout.jsx.truoc_dodno client/src/components/Layout.jsx
"""

import os
import sys
import shutil

MARKER = "POS-DODNO-v1"
HAU_TO = ".truoc_dodno"

F_INDEX = os.path.join("server", "index.js")
F_LAYOUT = os.path.join("client", "src", "components", "Layout.jsx")
F_API = os.path.join("client", "src", "utils", "api.js")
F_UTIL = os.path.join("server", "utils", "doSoNo.js")
F_ROUTE = os.path.join("server", "routes", "so-no.js")
SUA = [F_INDEX, F_LAYOUT, F_API]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  FILE MOI 1 · server/utils/doSoNo.js
# ══════════════════════════════════════════════════════════════════════
UTIL_JS = r'''/**
 * POS-DODNO-v1 — NGUOI DI DOI so no
 *
 * So no `pos_stock_pending` truoc day chi co ghi vao, khong ai doc ra.
 * File nay la ben doc: gui lai SX nhung viec con no, kem DUNG van tay da luu.
 *
 * An toan tuyet doi khi gui lai vi SX chong trung bang van tay: gui muoi lan
 * cung chi tru kho mot lan, lan sau tra ve `da_lam_roi`.
 */

const { query, run } = require('../database');
const { isSxConfigured, outStockFIFO, inStockReturn } = require('./sxApi');

const SO_LAN_TOI_DA = 5;      // thu qua nguong nay -> can nguoi xem
const MOI_LAN_TOI_DA = 20;    // moi lan doi toi da bao nhieu dong
const GIAN_CACH_MS = 3 * 60 * 1000;  // 3 phut

let dangChay = false;   // chong hai nguoi bam cung luc
let lanCuoi = 0;        // moc thoi gian lan doi truoc

/** Dem viec dang ket — dung cho dai bao tren thanh dieu huong. */
async function demViecKet() {
  const r = await query(
    `SELECT status, COUNT(*) AS n FROM pos_stock_pending
      WHERE status IN ('pending', 'can_xem') GROUP BY status`,
  );
  const lay = (s) => {
    const d = r.find((x) => x.status === s);
    return d ? Number(d.n) : 0;
  };
  return { cho: lay('pending'), canXem: lay('can_xem'), dangChay };
}

/**
 * Doi mot luot. Tra ve so lieu de hien cho nguoi dung.
 * KHONG BAO GIO nem loi ra ngoai — noi goi khong duoc hong vi viec nay.
 */
async function doSoNo() {
  if (dangChay) return { boQua: 'dang chay' };
  if (!isSxConfigured()) return { boQua: 'chua cau hinh SX' };

  dangChay = true;
  const kq = { daDoc: 0, xong: 0, hong: 0, canXem: 0 };
  try {
    const ds = await query(
      `SELECT * FROM pos_stock_pending
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT ${MOI_LAN_TOI_DA}`,
    );
    kq.daDoc = ds.length;

    for (const d of ds) {
      // Khong co van tay thi TUYET DOI khong gui lai: SX se khong nhan ra
      // la viec cu va tru kho LAN NUA. Chuyen thang sang cho nguoi xem.
      if (!d.van_tay) {
        await run(
          `UPDATE pos_stock_pending
              SET status = 'can_xem',
                  error_message = 'Khong co van tay — khong the gui lai an toan, can xu ly tay'
            WHERE id = ?`,
          [d.id],
        );
        kq.canXem++;
        continue;
      }

      try {
        const ham = d.direction === 'in' ? inStockReturn : outStockFIFO;
        await ham(
          d.sx_product_type,
          d.sx_product_id,
          d.quantity,
          d.order_code,
          d.van_tay,
        );
        // SX tra ve `da_lam_roi` cung di vao day — voi POS thi ca hai deu la XONG.
        await run(
          `UPDATE pos_stock_pending
              SET status = 'resolved', resolved_at = datetime('now')
            WHERE id = ?`,
          [d.id],
        );
        kq.xong++;
      } catch (err) {
        const soLan = Number(d.retry_count || 0) + 1;
        const het = soLan >= SO_LAN_TOI_DA;
        await run(
          `UPDATE pos_stock_pending
              SET retry_count = ?, status = ?, error_message = ?
            WHERE id = ?`,
          [soLan, het ? 'can_xem' : 'pending', String(err.message).slice(0, 300), d.id],
        );
        if (het) kq.canXem++;
        else kq.hong++;
      }
    }
  } catch (err) {
    console.error('Doi so no gap loi:', err.message);
    kq.loi = err.message;
  } finally {
    dangChay = false;
    lanCuoi = Date.now();
  }
  if (kq.daDoc) console.log('So no:', JSON.stringify(kq));
  return kq;
}

/**
 * LOP 1 — an theo hoat dong.
 * Goi sau moi yeu cau cua nguoi dung. KHONG await o noi goi: nguoi dung
 * khong phai cho viec nay. Gian cach 3 phut de khong doi lien tuc.
 */
function doNeuDenLuc() {
  if (dangChay) return;
  if (Date.now() - lanCuoi < GIAN_CACH_MS) return;
  lanCuoi = Date.now();   // dat truoc de hai yeu cau sat nhau khong cung kich hoat
  demViecKet()
    .then((d) => { if (d.cho > 0) return doSoNo(); })
    .catch((e) => console.error('doNeuDenLuc:', e.message));
}

module.exports = { demViecKet, doSoNo, doNeuDenLuc };
'''

# ══════════════════════════════════════════════════════════════════════
#  FILE MOI 2 · server/routes/so-no.js
# ══════════════════════════════════════════════════════════════════════
ROUTE_JS = r'''/**
 * POS-DODNO-v1 — hai duong cho so no
 *   GET  /api/pos/so-no          dem viec ket + danh sach ngan (dai bao)
 *   POST /api/pos/so-no/doi-ngay doi ngay khong cho gian cach (nut bam)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const { demViecKet, doSoNo } = require('../utils/doSoNo');

router.get('/', authenticate, async (req, res) => {
  try {
    const dem = await demViecKet();
    const ds = await query(
      `SELECT id, order_code, product_name, quantity, direction, status,
              retry_count, error_message, created_at
         FROM pos_stock_pending
        WHERE status IN ('pending', 'can_xem')
        ORDER BY created_at DESC LIMIT 20`,
    );
    res.json({ ...dem, danh_sach: ds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/doi-ngay', authenticate, async (req, res) => {
  try {
    const kq = await doSoNo();
    const dem = await demViecKet();
    res.json({ ...kq, con_lai: dem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
'''

# ══════════════════════════════════════════════════════════════════════
#  SUA · server/index.js
# ══════════════════════════════════════════════════════════════════════
I1_CU = "const packagesRoutes = require('./routes/packages');"
I1_MOI = """const packagesRoutes = require('./routes/packages');
// POS-DODNO-v1: nguoi di doi so no
const soNoRoutes = require('./routes/so-no');
const { doNeuDenLuc } = require('./utils/doSoNo');"""

I2_CU = """// API Routes
app.use('/api/pos/auth', authRoutes);"""

I2_MOI = """// ═══ POS-DODNO-v1 · LOP 1: doi so no an theo hoat dong ═══════════════════
// PHAI dat TRUOC moi duong /api/pos. Dat sau thi khong bao gio chay: yeu cau
// khop duong nao thi duong do tra loi va KHONG goi next() di tiep.
// KHONG dung hen gio: Render Free ngu khi khong ai dung, cron se hong CAM ma
// van tuong dang chay. Lay chinh viec ban hang lam dong ho.
// KHONG await: nguoi dung khong phai cho viec nay.
app.use('/api/pos', (req, res, next) => {
  try { doNeuDenLuc(); } catch (e) { /* khong bao gio chan nguoi dung */ }
  next();
});

// API Routes
app.use('/api/pos/auth', authRoutes);"""

I3_CU = "app.use('/api/pos/packages', packagesRoutes);"

I3_MOI = """app.use('/api/pos/packages', packagesRoutes);
app.use('/api/pos/so-no', soNoRoutes);   // POS-DODNO-v1"""

# ══════════════════════════════════════════════════════════════════════
#  SUA · client/src/utils/api.js — them loi goi vao LOP CHUNG
#
#  KHONG dung fetch tran trong Layout: bo kiem co luat "banh coc" dem so
#  fetch tran ngoai api.js va CHI CHO GIAM. Dung lop chung cung tot hon that
#  — duoc thua ke xu ly 401, doi ve /login, va chan yeu cau song song.
# ══════════════════════════════════════════════════════════════════════
API_CU = """// Orders API"""

API_MOI = """// POS-DODNO-v1 · So no kho
export const soNoApi = {
  xem: () => api.get('/so-no'),
  doiNgay: () => api.post('/so-no/doi-ngay', {})
};

// Orders API"""

# ══════════════════════════════════════════════════════════════════════
#  SUA · client/src/components/Layout.jsx
# ══════════════════════════════════════════════════════════════════════
L1_CU = "import { useState } from 'react';"
L1_MOI = """import { useState, useEffect } from 'react';
// POS-DODNO-v1: goi qua lop chung, KHONG fetch tran (luat banh coc cua bo kiem)
import { soNoApi } from '../utils/api';"""

L2_CU = "  const navigate = useNavigate();"
L2_MOI = """  const navigate = useNavigate();

  // ═══ POS-DODNO-v1 · LOP 2 + 3: dai bao viec ket, bam vao la doi ngay ═══
  // Gop hai lop vao MOT khoi: thay so va xu ly ngay tai cho, khong phai di
  // tim man hinh khac. Goi qua soNoApi (lop chung) chu KHONG fetch tran.
  const [soNo, setSoNo] = useState({ cho: 0, canXem: 0 });
  const [dangDoi, setDangDoi] = useState(false);

  const xemSoNo = async () => {
    try {
      setSoNo(await soNoApi.xem());
    } catch { /* im lang: dai bao hong khong duoc lam hong ca man hinh */ }
  };

  useEffect(() => {
    xemSoNo();
    const h = setInterval(xemSoNo, 60000);
    return () => clearInterval(h);
  }, []);

  const doiNgay = async () => {
    if (dangDoi) return;
    setDangDoi(true);
    try {
      await soNoApi.doiNgay();
      await xemSoNo();
    } catch { /* im lang */ }
    finally { setDangDoi(false); }
  };"""

L3_CU = """        <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '0.5rem' }}>"""
L3_MOI = """        {/* POS-DODNO-v1: chi hien khi CO viec ket — khong co thi khong chiem cho */}
        {(soNo.cho > 0 || soNo.canXem > 0) && (
          <div
            onClick={doiNgay}
            title="Việc kho chưa gửi được sang bên sản xuất. Bấm để gửi lại ngay."
            style={{
              margin: '0.5rem 0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8,
              background: soNo.canXem > 0 ? '#fee2e2' : '#fef3c7',
              color: soNo.canXem > 0 ? '#991b1b' : '#92400e',
              fontSize: '0.75rem', fontWeight: 600,
              cursor: dangDoi ? 'wait' : 'pointer', lineHeight: 1.35,
            }}
          >
            {dangDoi
              ? 'Đang gửi lại...'
              : <>
                  ⏳ {soNo.cho > 0 && <>{soNo.cho} việc kho chờ gửi</>}
                  {soNo.cho > 0 && soNo.canXem > 0 && ' · '}
                  {soNo.canXem > 0 && <>{soNo.canXem} việc cần bạn xem</>}
                  <div style={{ fontWeight: 400, marginTop: 2 }}>Bấm để gửi lại ngay</div>
                </>}
          </div>
        )}
        <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '0.5rem' }}>"""


def main():
    print("=" * 70)
    print("  PATCH P1 - POS-DODNO-v1  (nguoi di doi so no, ba lop)")
    print("=" * 70)

    for f in SUA:
        if not os.path.isfile(f):
            thoat(f"Khong thay {f}. Cua so nay khong phai POS?")

    noi = {f: open(f, encoding="utf-8").read() for f in SUA}

    # ---- idempotent ----
    co = [f for f in SUA if MARKER in noi[f]]
    if len(co) == len(SUA) and os.path.isfile(F_UTIL) and os.path.isfile(F_ROUTE):
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return
    if co:
        thoat(
            f"Marker chi co o {len(co)}/{len(SUA)} file - lan chay truoc dut giua chung.\n"
            "       Khoi phuc roi chay lai:\n"
            + "\n".join(f"         cp {f}{HAU_TO} {f}" for f in SUA)
            + f"\n         rm -f {F_UTIL} {F_ROUTE}"
        )

    # ---- phu thuoc ----
    print("\n[1/4] Kiem phu thuoc va 7 mo neo (CHUA ghi gi)")
    sx = open(os.path.join("server", "utils", "sxApi.js"), encoding="utf-8").read()
    if "POS-VANTAY-v1" not in sx:
        thoat("Thieu POS-VANTAY-v1 trong sxApi.js — khong co van tay thi KHONG duoc gui lai.")
    if "throw err;" not in sx or "POS-TONCU-v1" not in sx:
        thoat("Thieu POS-TONCU-v1 — chua co patch do thi so no chieu 'in' khong bao gio duoc ghi.")
    db = open(os.path.join("server", "database.js"), encoding="utf-8").read()
    if "van_tay TEXT" not in db:
        thoat("database.js chua co cot van_tay trong bang so no — ap POS-TONCU-v1 truoc.")
    print("   [ok] phu thuoc  POS-VANTAY-v1 · POS-TONCU-v1")

    for f, nhan, mo in [
        (F_INDEX, "dong nap route cuoi", I1_CU),
        (F_INDEX, "dau khoi dang ky duong", I2_CU),
        (F_INDEX, "dong dang ky duong cuoi", I3_CU),
        (F_LAYOUT, "dong nap useState", L1_CU),
        (F_LAYOUT, "diem chen trang thai", L2_CU),
        (F_LAYOUT, "dau thanh dieu huong", L3_CU),
        (F_API, "diem chen loi goi so no", API_CU),
    ]:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):12} {nhan}")

    for f in (F_UTIL, F_ROUTE):
        if os.path.exists(f):
            thoat(f"{f} da ton tai san — dung lai de khong ghi de nham.")
    print("   [ok] 2 file moi chua ton tai, an toan de tao")

    # ---- luu ban truoc ----
    print("\n[2/4] Luu ban truoc khi sua")
    for f in SUA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    # ---- ap ----
    print("\n[3/4] Ap 2 file moi + 7 thay doi")
    for f, cu, moi, nhan in [
        (F_INDEX, I1_CU, I1_MOI, "nap bo di doi"),
        (F_INDEX, I2_CU, I2_MOI, "LOP 1 dat TRUOC moi duong /api/pos"),
        (F_INDEX, I3_CU, I3_MOI, "dang ky duong so no"),
        (F_LAYOUT, L1_CU, L1_MOI, "nap useEffect"),
        (F_LAYOUT, L2_CU, L2_MOI, "trang thai + doc so + doi ngay"),
        (F_LAYOUT, L3_CU, L3_MOI, "LOP 2+3 dai bao bam duoc"),
        (F_API, API_CU, API_MOI, "them soNoApi vao lop chung"),
    ]:
        noi[f] = noi[f].replace(cu, moi, 1)
        print(f"   [ok] {os.path.basename(f):12} {nhan}")

    # ---- chot ----
    print("\n[4/4] Chot 16 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        ra = []
        for d in v.split("\n"):
            t = d.strip()
            if t.startswith("//") or t.startswith("*") or t.startswith("/*"):
                continue
            ra.append(d)
        return "\n".join(ra)

    ma = {f: bo_ghi_chu(noi[f]) for f in SUA}
    mu = bo_ghi_chu(UTIL_JS)

    chot = [
        ("if (!d.van_tay)" in mu and "'can_xem'" in mu,
         "dong KHONG co van tay thi KHONG BAO GIO tu dong gui lai"),

        ("SO_LAN_TOI_DA = 5" in mu and "soLan >= SO_LAN_TOI_DA" in mu,
         "thu qua 5 lan thi dung, khong thu vo han"),

        ("d.van_tay," in mu,
         "gui lai kem DUNG van tay da luu (khong sinh van tay moi)"),

        ("d.direction === 'in' ? inStockReturn : outStockFIFO" in mu,
         "chon dung ham theo chieu vao/ra"),

        ("let dangChay = false" in mu and "if (dangChay) return" in mu,
         "co chong chay song song"),

        ("GIAN_CACH_MS" in mu and "Date.now() - lanCuoi < GIAN_CACH_MS" in mu,
         "co gian cach, khong doi lien tuc moi yeu cau"),

        ("LIMIT ${MOI_LAN_TOI_DA}" in mu,
         "moi lan doi co gioi han, khong treo may chu"),

        ("setInterval" not in mu and "setTimeout" not in mu,
         "KHONG dung hen gio (Render Free ngu -> cron hong cam)"),

        ("doNeuDenLuc();" in ma[F_INDEX] and "await doNeuDenLuc" not in ma[F_INDEX],
         "lop 1 KHONG cho: nguoi dung khong phai doi viec nay"),

        ("app.use('/api/pos/so-no', soNoRoutes);" in ma[F_INDEX],
         "duong so no da duoc dang ky"),

        (ma[F_INDEX].find("doNeuDenLuc();") < ma[F_INDEX].find("app.use('/api/pos/auth'"),
         "LOP 1 dung TRUOC duong dau tien (dat sau la KHONG BAO GIO CHAY)"),

        (ma[F_INDEX].find("doNeuDenLuc();") < ma[F_INDEX].find("app.use('/api/pos/orders'"),
         "LOP 1 dung truoc duong ban hang — viec ban hang moi lam dong ho duoc"),

        ("soNo.cho > 0 || soNo.canXem > 0" in ma[F_LAYOUT],
         "man hinh: khong co viec ket thi dai bao KHONG chiem cho"),

        ("onClick={doiNgay}" in ma[F_LAYOUT] and "useEffect" in ma[F_LAYOUT],
         "man hinh: dai bao tu cap nhat va bam duoc de doi ngay"),

        ("fetch(" not in ma[F_LAYOUT],
         "man hinh: KHONG fetch tran (luat banh coc cua bo kiem)"),

        ("export const soNoApi" in ma[F_API],
         "loi goi so no nam trong lop chung api.js"),
    ]

    hong = [t for ok, t in chot if not ok]
    for ok, t in chot:
        print(("   [ok] " if ok else "   [HONG] ") + t)
    if hong:
        for f in SUA:
            os.remove(f + HAU_TO)
        thoat(f"{len(hong)} dieu kien khong dat. Da xoa ban luu, file goc nguyen ven.")

    open(F_UTIL, "w", encoding="utf-8").write(UTIL_JS)
    open(F_ROUTE, "w", encoding="utf-8").write(ROUTE_JS)
    for f in SUA:
        open(f, "w", encoding="utf-8").write(noi[f])
    print(f"   [ok] da tao {F_UTIL}")
    print(f"   [ok] da tao {F_ROUTE}")

    print("\n[XONG]\n")
    print("  ⚠️  PHAI BUILD LAI CLIENT truoc khi commit:")
    print("      cd client && npm run build && cd ..\n")
    print("  Buoc tiep:")
    print("    node --check server/index.js")
    print("    node --check server/utils/doSoNo.js")
    print("    node --check server/routes/so-no.js\n")
    print("  Duong lui:")
    print(f"    rm -f {F_UTIL} {F_ROUTE}")
    for f in SUA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
