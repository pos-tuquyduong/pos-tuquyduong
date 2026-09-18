# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P4 - POS-DOICHIEU-v1   (doi chieu so van tay SX voi don POS)
======================================================================

KHAC GI BAN v1 — LOI SE XAY RA THUONG XUYEN
  v1 tra don CHI TRONG KHOANG NGAY doi chieu. Nhung bo di doi (POS-DODNO-v1)
  gui lai viec cu: don tao HOM QUA, SX ghi van tay HOM NAY. Van tay do tro
  vao mot don khong nam trong khoang -> v1 bao "kho bi tru oan" OAN.
  Chinh bo di doi vua lam o P1 tao ra ca nay, nen loi se xay ra deu.
  v2 tra don theo ID lay tu van tay, khong gioi han ngay. Khoang ngay chi con
  dung de dem tong.

  Da ra soat va XAC NHAN AN TOAN: gio hai ben CUNG MUI — `pos_orders.created_at`
  dat bang `getNow()` tra gio Viet Nam (helpers.js:135), SX cung ghi gio VN.
  Khong co chuyen lech 7 tieng lam don ban sang som roi sang ngay hom truoc.

VIEC NAY LAM GI
  SX giu so van tay: moi lenh tru kho / hoan kho da xu ly deu co mot dong
  (`pos_van_tay`, doc qua `GET /api/pos/van-tay?tu=&den=`).
  POS giu so don. Hai ben chua bao gio duoc so voi nhau — lech bao nhieu
  cung khong ai biet, tru khi tinh co phat hien.

  Patch them duong doi chieu: lay so van tay cua SX trong mot khoang ngay,
  doi voi tung dong xem co don POS tuong ung khong.

PHAT HIEN DUOC GI
  · KHO BI TRU OAN — SX da tru kho cho mot don KHONG CON TON TAI o POS,
    hoac cho don DA HUY ma chua hoan kho. Day la mat hang that.
  · Lech tong — POS co N don trong khoang ma SX chi co M lenh; chenh nhieu
    thi co chuyen, can nguoi xem.

DIEU PATCH NAY CO TINH KHONG LAM  (doc ky — day la gioi han that)
  KHONG phat hien duoc ca "POS tao don xong roi chet TRUOC khi gui lenh
  sang SX". Ca do khong de lai dau vet nao o ca hai ben: POS co don, SX
  khong co van tay, va so no cung khong co dong nao.

  Vi sao khong lam duoc: `pos_order_items` KHONG luu `sx_product_type`
  va KHONG luu co mon-goi, nen tu dong don KHONG suy lai duoc chinh xac
  van tay dang le phai co. Suy bang chi so mon thi lech ngay khi don co
  mon goi hoac mon khong quan kho.

  Muon bit ca do thi phai ghi van tay vao so NGAY CA KHI GUI THANH CONG
  — la mot viec khac, doi y nghia bang `pos_stock_pending`. De sau.

CACH DUNG
  GET /api/pos/doi-chieu?tu=2026-09-01&den=2026-09-17
  Khong truyen gi thi doi chieu NGAY HOM NAY.

CHU Y
  Chi them 1 file may chu + 1 dong dang ky — KHONG can build lai client.

DUONG LUI
  rm server/routes/doi-chieu.js
  cp server/index.js.truoc_doichieu server/index.js
"""

import os
import sys
import shutil

MARKER = "POS-DOICHIEU-v1"
HAU_TO = ".truoc_doichieu"

F_INDEX = os.path.join("server", "index.js")
F_ROUTE = os.path.join("server", "routes", "doi-chieu.js")


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  FILE MOI · server/routes/doi-chieu.js
# ══════════════════════════════════════════════════════════════════════
ROUTE_JS = r'''/**
 * POS-DOICHIEU-v1 — doi chieu so van tay cua SX voi so don cua POS
 *
 *   GET /api/pos/doi-chieu?tu=YYYY-MM-DD&den=YYYY-MM-DD
 *
 * Chieu doi chieu: SX -> POS. Voi moi lenh tru kho / hoan kho ma SX da xu ly,
 * kiem xem o POS co don tuong ung khong. Van tay co dang `POS:<id don>:<out|in>:<stt>`
 * nen suy ra ma don rat chac — KHONG phai doan.
 *
 * GIOI HAN (doc ky): KHONG phat hien duoc ca POS tao don xong roi chet TRUOC
 * khi gui lenh. Ca do khong de lai dau vet o ca hai ben. Xem ghi chu dau patch.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query, queryOne } = require('../database');
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

router.get('/', authenticate, async (req, res) => {
  try {
    if (!isSxConfigured()) {
      return res.status(400).json({
        error: 'Chua cau hinh ket noi tu POS sang SX — khong doi chieu duoc.',
        code: 'CHUA_CAU_HINH_SX',
      });
    }

    const homNay = new Date()
      .toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const tu = req.query.tu || homNay;
    const den = req.query.den || tu;

    // ── Ben SX: so van tay ──────────────────────────────────────────────
    let sx;
    try {
      sx = await callSxApi(`/api/pos/van-tay?tu=${encodeURIComponent(tu)}&den=${encodeURIComponent(den)}`);
    } catch (err) {
      return res.status(502).json({
        error: `Khong goi duoc sang SX: ${err.message}`,
        code: 'SX_KHONG_TRA_LOI',
      });
    }
    const dsSx = Array.isArray(sx?.danh_sach) ? sx.danh_sach : [];

    // ── Ben POS: don trong khoang (chi de bao cao tong) ─────────────────
    const donPos = await query(
      `SELECT id, code, status, total, cancelled_at FROM pos_orders
        WHERE DATE(created_at) BETWEEN ? AND ?`,
      [tu, den],
    );

    // Tra don theo ID lay tu van tay, KHONG gioi han ngay.
    // Ly do: bo di doi (POS-DODNO-v1) gui lai viec cu — don tao HOM QUA nhung
    // SX ghi van tay HOM NAY. Neu chi tra don trong khoang thi bao "kho bi tru
    // oan" OAN cho moi lan doi so thanh cong. Chinh bo di doi tao ra ca nay.
    const idTuVanTay = [
      ...new Set(
        dsSx
          .map((d) => String(d.van_tay || '').split(':')[1])
          .filter((x) => /^[0-9]+$/.test(x || '')),
      ),
    ];
    const theoId = new Map();
    // Chia lo 100 de cau lenh khong dai vo han khi doi chieu ca thang.
    for (let i = 0; i < idTuVanTay.length; i += 100) {
      const lo = idTuVanTay.slice(i, i + 100);
      const rows = await query(
        `SELECT id, code, status, total, cancelled_at FROM pos_orders
          WHERE id IN (${lo.map(() => '?').join(',')})`,
        lo,
      );
      for (const d of rows) theoId.set(String(d.id), d);
    }

    // ── Doi chieu tung dong cua SX ──────────────────────────────────────
    const khoTruOan = [];   // SX da tru nhung POS khong co don / don da huy
    const khongDocDuoc = []; // van tay khong theo dang POS:<id>:...
    let khop = 0;

    for (const d of dsSx) {
      const vt = String(d.van_tay || '');
      const phan = vt.split(':');
      // Dang chuan: POS:<id>:<out|in>:<stt>
      if (phan.length < 3 || phan[0] !== 'POS') {
        khongDocDuoc.push({ van_tay: vt, order_code: d.order_code, ghi_chu: 'khong theo dang POS:<id>:...' });
        continue;
      }
      const idDon = phan[1];
      const chieu = phan[2];
      const don = theoId.get(idDon);

      if (!don) {
        khoTruOan.push({
          van_tay: vt, chieu, order_code: d.order_code,
          san_pham: `${d.product_type}/${d.product_id}`, so_luong: d.quantity,
          luc: d.created_at,
          ly_do: 'POS KHONG co don nao mang ma nay',
        });
        continue;
      }
      // Don da huy ma SX chi tru kho (chieu out) va KHONG co lenh hoan (chieu in)
      if (don.status === 'cancelled' && chieu === 'out') {
        const coHoan = dsSx.some(
          (x) => String(x.van_tay || '').startsWith(`POS:${idDon}:in:`),
        );
        if (!coHoan) {
          khoTruOan.push({
            van_tay: vt, chieu, order_code: don.code,
            san_pham: `${d.product_type}/${d.product_id}`, so_luong: d.quantity,
            luc: d.created_at,
            ly_do: 'Don DA HUY nhung kho chua duoc hoan lai',
          });
          continue;
        }
      }
      khop++;
    }

    // ── So no con dang ket (de nhin cung mot cho) ───────────────────────
    const soNo = await query(
      `SELECT status, COUNT(*) AS n FROM pos_stock_pending
        WHERE status IN ('pending','can_xem') GROUP BY status`,
    );
    const demNo = { cho: 0, can_xem: 0 };
    for (const r of soNo) {
      if (r.status === 'pending') demNo.cho = Number(r.n);
      if (r.status === 'can_xem') demNo.can_xem = Number(r.n);
    }

    const donHopLe = donPos.filter((d) => d.status !== 'cancelled').length;

    res.json({
      tu, den,
      ben_sx: { so_lenh: dsSx.length },
      ben_pos: { so_don: donPos.length, so_don_hop_le: donHopLe },
      khop,
      kho_bi_tru_oan: khoTruOan,
      van_tay_khong_doc_duoc: khongDocDuoc,
      so_no_dang_ket: demNo,
      ket_luan:
        khoTruOan.length === 0 && khongDocDuoc.length === 0 && demNo.cho === 0 && demNo.can_xem === 0
          ? 'Khong thay lech.'
          : 'CO CHUYEN — xem cac muc ben duoi.',
      gioi_han:
        'Chua phat hien duoc ca POS tao don xong roi chet TRUOC khi gui lenh sang SX. ' +
        'Ca do khong de lai dau vet o ca hai ben.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
'''

# ══════════════════════════════════════════════════════════════════════
#  SUA · server/index.js — dang ky duong moi
# ══════════════════════════════════════════════════════════════════════
I_CU = """app.use('/api/pos/so-no', soNoRoutes);   // POS-DODNO-v1"""
I_MOI = """app.use('/api/pos/so-no', soNoRoutes);   // POS-DODNO-v1
app.use('/api/pos/doi-chieu', require('./routes/doi-chieu'));   // POS-DOICHIEU-v1"""


def main():
    print("=" * 70)
    print("  PATCH P4 - POS-DOICHIEU-v1  (doi chieu so van tay SX voi don POS)")
    print("=" * 70)

    if not os.path.isfile(F_INDEX):
        thoat(f"Khong thay {F_INDEX}. Cua so nay khong phai POS?")

    s = open(F_INDEX, encoding="utf-8").read()

    if MARKER in s and os.path.isfile(F_ROUTE):
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return

    print("\n[1/4] Kiem phu thuoc va 1 mo neo (CHUA ghi gi)")
    if "POS-DODNO-v1" not in s:
        thoat("Thieu POS-DODNO-v1 trong index.js — ap patch nguoi di doi truoc.")
    sx = open(os.path.join("server", "utils", "sxApi.js"), encoding="utf-8").read()
    if "callSxApi" not in sx:
        thoat("sxApi.js khong co callSxApi — file khong dung nhu mong doi.")
    print("   [ok] phu thuoc  POS-DODNO-v1 · callSxApi")

    n = s.count(I_CU)
    if n != 1:
        thoat(f"Mo neo 'dong dang ky so no' xuat hien {n} lan (can dung 1).")
    print("   [ok] index.js   dong dang ky duong so no")

    if os.path.exists(F_ROUTE):
        thoat(f"{F_ROUTE} da ton tai san — dung lai de khong ghi de nham.")
    print("   [ok] file moi chua ton tai, an toan de tao")

    print("\n[2/4] Luu ban truoc khi sua")
    shutil.copy2(F_INDEX, F_INDEX + HAU_TO)
    print(f"   -> {F_INDEX}{HAU_TO}")

    print("\n[3/4] Ap 1 file moi + 1 thay doi")
    s = s.replace(I_CU, I_MOI, 1)
    print("   [ok] index.js   dang ky duong doi chieu")

    print("\n[4/4] Chot 15 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = bo_ghi_chu(s)
    mr = bo_ghi_chu(ROUTE_JS)

    chot = [
        ("app.use('/api/pos/doi-chieu'" in ma,
         "duong doi chieu da duoc dang ky"),

        (ma.find("app.use('/api/pos', (req, res, next)") < ma.find("app.use('/api/pos/doi-chieu'"),
         "duong moi dat SAU lop 1 cua so no — van an theo hoat dong"),

        ("authenticate" in mr,
         "duong doi chieu doi dang nhap"),

        ("/api/pos/van-tay?tu=" in mr,
         "goi dung duong so van tay cua SX"),

        ("vt.split(':')" in mr and "phan[0] !== 'POS'" in mr,
         "suy ma don tu van tay, khong doan"),

        ("kho_bi_tru_oan" in mr,
         "bao cao chi ro truong hop kho bi tru oan"),

        ("don.status === 'cancelled' && chieu === 'out'" in mr,
         "bat truong hop don da huy ma kho chua duoc hoan"),

        ("startsWith(`POS:${idDon}:in:`)" in mr,
         "don da huy nhung DA hoan kho thi KHONG bao lech"),

        ("SX_KHONG_TRA_LOI" in mr,
         "SX chet thi noi ro, khong bao 'khong lech' oan"),

        ("so_no_dang_ket" in mr,
         "gom luon so no dang ket de nhin mot cho"),

        ("gioi_han" in mr,
         "bao cao TU NOI dieu no chua phat hien duoc"),

        ("van_tay_khong_doc_duoc" in mr,
         "van tay la dang khong biet thi tach rieng, khong bo qua im lang"),

        ("WHERE id IN (" in mr,
         "tra don theo ID lay tu van tay, KHONG gioi han ngay"),

        ("i += 100" in mr,
         "chia lo de doi chieu ca thang khong lam cau lenh dai vo han"),

        ("DATE(created_at) BETWEEN" in mr
         and mr.find("DATE(created_at) BETWEEN") < mr.find("WHERE id IN ("),
         "khoang ngay chi dung de dem tong, khong dung de tra don"),
    ]

    hong = [t for ok, t in chot if not ok]
    for ok, t in chot:
        print(("   [ok] " if ok else "   [HONG] ") + t)
    if hong:
        os.remove(F_INDEX + HAU_TO)
        thoat(f"{len(hong)} dieu kien khong dat. Da xoa ban luu, file goc nguyen ven.")

    open(F_ROUTE, "w", encoding="utf-8").write(ROUTE_JS)
    open(F_INDEX, "w", encoding="utf-8").write(s)
    print(f"   [ok] da tao {F_ROUTE}")

    print("\n[XONG]\n")
    print("  KHONG can build lai client.\n")
    print("  Buoc tiep:")
    print("    node --check server/index.js")
    print("    node --check server/routes/doi-chieu.js\n")
    print("  Cach dung sau khi deploy:")
    print("    GET /api/pos/doi-chieu              (hom nay)")
    print("    GET /api/pos/doi-chieu?tu=...&den=...\n")
    print("  Duong lui:")
    print(f"    rm {F_ROUTE}")
    print(f"    cp {F_INDEX}{HAU_TO} {F_INDEX}")


if __name__ == "__main__":
    main()
