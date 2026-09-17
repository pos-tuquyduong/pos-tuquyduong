# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P2 - POS-CONGDON-v1   (may chu tu tra, thoi tin to khai)
======================================================================

KHAC GI BAN v3 — BIT DUONG THU BA
  Ra soat co he thong moi duong dua so tien tu to khai vao phep tinh total,
  tim ra PHI VAN CHUYEN khong kiem am (muc 1c). Khai -90.000d la giam thang
  90.000d. Cung ho voi LO 2 va LO 2b — sua hai cai ma bo cai thu ba thi van ho.

  Da ra soat va XAC NHAN AN TOAN (khong can sua):
   · so du va so du me   -> co kiem du truoc khi tru (orders.js ~616, ~640)
   · gia goi va gia the  -> doc tu DB (`pkg.price`), khong nhan tu to khai
   · tien khach dua      -> chi ghi so, da co phep doi chieu tong thanh toan
   · goi cua khach con   -> route tra goi loc dung `customer_phone`, khong co
                            chuyen con dung goi me -> phep chan khong chan nham

KHAC GI BAN v2 — BIT NOT MOT DUONG CON SOT
  "Uu tien 3" (orders.js ~510) van lay so tien giam THANG tu to khai. Te hon:
  phep sua LO 2 dat finalDiscountType = null khi khach khong co chiet khau —
  dung dieu kien ma nhanh nay cho — nen v2 vo tinh MO DUONG cho no.
  Sua LO 2 ma khong tat nhanh nay thi coi nhu khong sua gi. Chi tiet o muc 1b.

KHAC GI BAN v1 — VA MOT LOI CUA PATCH TRUOC
  Ra soat lai tim ra: POS-DOIKHACH-v1 CHAN NHAM luong "mua goi roi lay hang
  ngay trong cung don". Chi tiet o muc 0 duoi. Neu da ap patch do thi quay
  DANG khong ban duoc kieu nay. v2 va luon.

HAI LO CON LAI O DUONG TAO DON
  Patch POS-DOIKHACH-v1 da bit lo thu nhat (khai "lay tu goi" ma khong kem
  goi nao). Con hai lo, ca hai deu la MAY CHU TIN TO KHAI gui len:

  LO 2 — tu khai giam bao nhieu thi giam bay nhieu
    orders.js:340-341  finalDiscountValue = discount_value  (lay thang tu body)
    Khong can ma chiet khau nao. Khai giam 90% thi duoc giam 90%.
    Man ban hang chi gui so lay tu HO SO KHACH (Sales.jsx ~331) hoac tu ma
    chiet khau — nen KHONG co truong hop hop le nao can gui tay.

  LO 3 — tru luot vao goi cua NGUOI KHAC
    orders.js:917 tru luot theo `customer_package_id` gui len ma KHONG kiem
    goi do co thuoc ve khach dang mua hay khong.
    Cho nay KHONG CAN AC Y cung hong: nhan vien chon nham khach la luot bi
    tru vao goi nguoi khac, va nguoi bi tru khong biet gi cho toi luc den lay
    hang ma may bao het luot.

SUA THEO HUONG "MAY CHU TU TRA SO"
  LO 2 -> khong co ma chiet khau hop le thi may chu TU DOC chiet khau rieng
          cua khach tu `pos_customers`, KHONG nhan so tu to khai.
          Khach vang lai (khong so dien thoai) -> khong chiet khau.
  LO 3 -> truoc khi tinh tien, kiem goi CO THAT · DUNG CHU · CON HIEU LUC.
          Sai mot dieu la tu choi ca don, noi ro vuong o dau.

VI SAO CHAN TRUOC VONG LAP MON
  Vong lap mon la noi tinh 0d cho mon "lay tu goi". Chan sau do thi hang da
  duoc tinh gia roi. Chan truoc thi khong mon nao duoc tinh 0d oan.

DIEU PATCH NAY CO TINH KHONG LAM
  Khong dung den Flash sale va hang thanh vien — ca hai da TU TRA tu truoc
  (orders.js ~387), khong tin to khai, nen khong co lo.

PHU THUOC
  POS-DOIKHACH-v1 (da bit lo thu nhat)

CHU Y
  Patch nay CHI dung server/routes/orders.js — KHONG can build lai client.

DUONG LUI
  cp server/routes/orders.js.truoc_congdon server/routes/orders.js
"""

import os
import sys
import shutil

MARKER = "POS-CONGDON-v1"
HAU_TO = ".truoc_congdon"
F = os.path.join("server", "routes", "orders.js")


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  0 · VA LOI CUA POS-DOIKHACH-v1 — chan nham luong "mua goi, lay hang ngay"
#
#  Sales.jsx:90  `if (buyPkgTemplate && buyPkgAllowedKeys.has(key)) return true;`
#  -> khi khach MUA GOI MOI, mon thuoc goi do CUNG duoc danh dau from_package,
#     trong khi customer_package_id VAN RONG vi goi chua ton tai.
#  Phep chan cua POS-DOIKHACH-v1 se TU CHOI dung luong nay, trong khi may chu
#  von ho tro no (orders.js ~951 "Giao lan 1 cung don").
#  Ngoai le: co `package_buy` thi cho qua — goi se duoc tao ngay trong don nay.
# ══════════════════════════════════════════════════════════════════════
Z_CU = """      if (item.from_package && !customer_package_id) {"""

Z_MOI = """      // POS-CONGDON-v1: them ngoai le `package_buy`. Khach MUA GOI roi lay hang
      // ngay trong cung don thi goi chua ton tai nen chua co ma — nhung don van
      // hop le, may chu se tao goi va tru luot lan 1 o cuoi (orders.js ~951).
      if (item.from_package && !customer_package_id && !package_buy) {"""

# ══════════════════════════════════════════════════════════════════════
#  1 · LO 3 — kiem goi CO THAT, DUNG CHU, CON HIEU LUC (truoc vong lap mon)
# ══════════════════════════════════════════════════════════════════════
A_CU = """    for (const item of items) {"""

A_MOI = """    // ═══ POS-CONGDON-v1 · LO 3: goi phai DUNG CHU ════════════════════════
    // Truoc day tru luot theo ma goi gui len ma khong kiem chu. Nhan vien
    // chon nham khach la luot bi tru vao goi NGUOI KHAC, va nguoi bi tru
    // khong biet gi cho toi luc den lay hang ma may bao het luot.
    // Chan o DAY, truoc vong lap mon, vi vong lap moi la noi tinh 0d.
    if (customer_package_id) {
      const goiKH = await queryOne(
        `SELECT id, customer_phone, status, total_qty, delivered_qty
           FROM pos_customer_packages WHERE id = ?`,
        [customer_package_id],
      );
      if (!goiKH) {
        return res.status(400).json({
          error: "Khong tim thay goi nay. Hay chon lai goi cua khach.",
          code: "GOI_KHONG_TON_TAI",
        });
      }
      const sdtDon = normalizePhone(customer_phone);
      const sdtGoi = normalizePhone(goiKH.customer_phone);
      if (!sdtDon || sdtDon !== sdtGoi) {
        return res.status(400).json({
          error:
            "Goi nay thuoc ve khach khac, khong dung cho don nay duoc. " +
            "Hay chon lai dung khach, hoac bo cac mon lay tu goi ra khoi gio.",
          code: "GOI_KHONG_DUNG_CHU",
        });
      }
      if (goiKH.status !== "active") {
        return res.status(400).json({
          error: `Goi cua khach dang o trang thai "${goiKH.status}", khong dung duoc.`,
          code: "GOI_HET_HIEU_LUC",
        });
      }
      const conLai = Number(goiKH.total_qty || 0) - Number(goiKH.delivered_qty || 0);
      if (conLai <= 0) {
        return res.status(400).json({
          error: "Goi cua khach da giao het luot.",
          code: "GOI_HET_LUOT",
        });
      }
    }
    // ═══ het POS-CONGDON-v1 · LO 3 ═══════════════════════════════════════

    for (const item of items) {"""

# ══════════════════════════════════════════════════════════════════════
#  1b · LO 2b — "Uu tien 3" van lay so tien giam THANG tu to khai
#
#  orders.js ~510:  if (!finalDiscountType && discount > 0) {
#                     finalDiscountType = "fixed"; finalDiscountValue = discount; }
#  `discount` lay thang tu req.body, KHONG co nguon nao kiem chung.
#  Nguy hiem hon: phep sua LO 2 o tren dat finalDiscountType = null khi khach
#  khong co chiet khau -> dung dieu kien ma nhanh nay cho -> MO DUONG cho no.
#  Sua LO 2 ma khong tat nhanh nay thi coi nhu khong sua gi.
#
#  Man ban hang LUON gui 0: `const [discount] = useState(0)` (Sales.jsx:29) va
#  khong cho nao dat khac 0 ngoai luc don sach sau thanh toan. Nen tat nhanh
#  nay KHONG doi gi o quay.
# ══════════════════════════════════════════════════════════════════════
C_CU = """    // Ưu tiên 3: Chiết khấu cũ (discount số cố định) - backward compatible
    if (!finalDiscountType && discount > 0) {
      finalDiscountType = "fixed";
      finalDiscountValue = discount;
    }"""

C_MOI = """    // Ưu tiên 3: Chiết khấu cũ (discount số cố định) - backward compatible
    // ═══ POS-CONGDON-v1: TAT duong nay ══════════════════════════════════
    // `discount` lay THANG tu to khai, khong co nguon nao kiem chung — khai
    // bao nhieu duoc giam bay nhieu. Man ban hang LUON gui 0 (Sales.jsx:29
    // khoi tao 0, khong cho nao dat khac), nen tat di khong doi gi o quay.
    // Giu lai khoi de thay ro da tat co chu y, khong phai vo tinh xoa.
    if (false && !finalDiscountType && discount > 0) {
      finalDiscountType = "fixed";
      finalDiscountValue = discount;
    }
    // ═══ het POS-CONGDON-v1 · LO 2b ═════════════════════════════════════"""

# ══════════════════════════════════════════════════════════════════════
#  1c · LO 2c — PHI VAN CHUYEN khong kiem am
#
#  orders.js ~575:  const finalShippingFee = shipping_fee || 0;
#  Roi:             total = Math.max(0, subtotal - ... + finalShippingFee)
#  `Math.max(0, ...)` chan total AM, KHONG chan total bi GIAM.
#  Khai shipping_fee = -90000 cho don 100.000d -> total con 10.000d.
#  Duong thu BA tin to khai, cung ho voi LO 2 va LO 2b.
# ══════════════════════════════════════════════════════════════════════
D_CU = """    const finalShippingFee = shipping_fee || 0;"""

D_MOI = """    // POS-CONGDON-v1: phi van chuyen KHONG duoc am. Truoc day khai so am la
    // giam thang vao tong don — `Math.max(0, total)` chi chan total am, khong
    // chan total bi giam. Ep ve so, am thi coi nhu 0.
    const finalShippingFee = Math.max(0, Number(shipping_fee) || 0);"""

# ══════════════════════════════════════════════════════════════════════
#  2 · LO 2 — chiet khau rieng cua khach: MAY CHU TU DOC, khong nhan tu body
# ══════════════════════════════════════════════════════════════════════
B_CU = """    // Normalize phone (chuyển lên sớm hơn — TIER-2 cần biết khách là ai trước khi tính chiết khấu)
    const phone = normalizePhone(customer_phone);"""

B_MOI = """    // Normalize phone (chuyển lên sớm hơn — TIER-2 cần biết khách là ai trước khi tính chiết khấu)
    const phone = normalizePhone(customer_phone);

    // ═══ POS-CONGDON-v1 · LO 2: thoi tin muc giam gui len ════════════════
    // Truoc day: finalDiscountValue = discount_value lay THANG tu to khai,
    // khong can ma chiet khau nao -> khai giam 90% thi duoc giam 90%.
    // Nay: khong co ma chiet khau hop le thi may chu TU DOC chiet khau rieng
    // cua khach tu ho so. Man ban hang von cung chi gui so lay tu ho so do,
    // nen quay KHONG doi gi — chi khac la so tien nay do may chu tu tra.
    // Khach vang lai (khong so dien thoai) -> khong co chiet khau rieng.
    if (!discountCodeId) {
      const khCK = phone
        ? await queryOne(
            "SELECT discount_type, discount_value FROM pos_customers WHERE phone = ?",
            [phone],
          )
        : null;
      const mucCK = Number(khCK?.discount_value || 0);
      if (mucCK > 0) {
        finalDiscountType = khCK.discount_type || "percent";
        finalDiscountValue = mucCK;
      } else {
        finalDiscountType = null;
        finalDiscountValue = 0;
      }
    }
    // ═══ het POS-CONGDON-v1 · LO 2 ═══════════════════════════════════════"""


def main():
    print("=" * 70)
    print("  PATCH P2 - POS-CONGDON-v1  (may chu tu tra, thoi tin to khai)")
    print("=" * 70)

    if not os.path.isfile(F):
        thoat(f"Khong thay {F}. Cua so nay khong phai POS?")

    s = open(F, encoding="utf-8").read()

    if MARKER in s:
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return

    print("\n[1/4] Kiem phu thuoc va 5 mo neo (CHUA ghi gi)")
    if "POS-DOIKHACH-v1" not in s:
        thoat(
            "Thieu POS-DOIKHACH-v1 trong orders.js.\n"
            "       Patch do bit lo thu nhat (khai 'tu goi' ma thieu goi) — phai ap truoc."
        )
    if "normalizePhone" not in s:
        thoat("Khong thay ham normalizePhone — file khong dung nhu mong doi.")
    print("   [ok] phu thuoc  POS-DOIKHACH-v1")

    for nhan, mo in [
        ("phep chan cua patch truoc", Z_CU),
        ("dau vong lap mon", A_CU),
        ("cho chuan hoa so dien thoai", B_CU),
        ("nhanh chiet khau cu", C_CU),
        ("cho tinh phi van chuyen", D_CU),
    ]:
        n = s.count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' xuat hien {n} lan (can dung 1).")
        print(f"   [ok] orders.js  {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    shutil.copy2(F, F + HAU_TO)
    print(f"   -> {F}{HAU_TO}")

    print("\n[3/4] Ap 5 thay doi")
    s = s.replace(Z_CU, Z_MOI, 1)
    print("   [ok] orders.js  VA · cho qua luong mua goi lay hang ngay")
    s = s.replace(A_CU, A_MOI, 1)
    print("   [ok] orders.js  LO 3 · goi phai dung chu, con hieu luc")
    s = s.replace(B_CU, B_MOI, 1)
    print("   [ok] orders.js  LO 2 · may chu tu doc chiet khau cua khach")
    s = s.replace(C_CU, C_MOI, 1)
    print("   [ok] orders.js  LO 2b · tat duong lay so tien giam tu to khai")
    s = s.replace(D_CU, D_MOI, 1)
    print("   [ok] orders.js  LO 2c · phi van chuyen khong duoc am")

    print("\n[4/4] Chot 18 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = bo_ghi_chu(s)

    chot = [
        ("GOI_KHONG_DUNG_CHU" in ma,
         "tu choi khi goi thuoc ve khach khac"),

        ("GOI_KHONG_TON_TAI" in ma,
         "tu choi khi ma goi khong co that"),

        ("GOI_HET_HIEU_LUC" in ma and "GOI_HET_LUOT" in ma,
         "tu choi khi goi het han hoac het luot"),

        (ma.find("GOI_KHONG_DUNG_CHU") < ma.find("for (const item of items) {"),
         "phep kiem goi dung TRUOC vong lap mon (noi tinh 0d)"),

        ("sdtDon !== sdtGoi" in ma and "normalizePhone(goiKH.customer_phone)" in ma,
         "so sanh so dien thoai da chuan hoa ca hai ben"),

        ("!sdtDon ||" in ma,
         "don khong co so dien thoai thi KHONG duoc dung goi cua ai"),

        ("if (!discountCodeId) {" in ma,
         "chi tu doc chiet khau khi KHONG co ma chiet khau hop le"),

        ("SELECT discount_type, discount_value FROM pos_customers WHERE phone = ?" in ma,
         "may chu TU DOC chiet khau tu ho so khach"),

        ("finalDiscountValue = mucCK;" in ma and "finalDiscountValue = 0;" in ma,
         "co ca nhanh CO chiet khau va nhanh KHONG co"),

        (ma.find("if (!discountCodeId) {") > ma.find("finalDiscountValue = discount_value;"),
         "phep tu doc dung SAU cho gan gia tri cu -> ghi de duoc"),

        ("finalDiscountValue = codeRecord.discount_value;" in ma,
         "duong ma chiet khau cu VAN nguyen ven"),

        ("TU_GOI_NHUNG_THIEU_GOI" in ma,
         "phep chan cua POS-DOIKHACH-v1 KHONG bi dung toi"),

        ("!customer_package_id && !package_buy" in ma,
         "luong MUA GOI roi lay hang ngay KHONG bi chan nham"),

        (ma.count("item.from_package && !customer_package_id") == 1,
         "chi con MOT phep chan, khong de sot ban cu"),

        ("if (false && !finalDiscountType && discount > 0) {" in ma,
         "duong lay so tien giam THANG tu to khai da bi tat"),

        (ma.count("finalDiscountValue = discount;") == 1,
         "chi con MOT cho gan tu `discount`, va no da bi tat"),

        ("Math.max(0, Number(shipping_fee) || 0)" in ma,
         "phi van chuyen am bi ep ve 0, khong giam duoc tong don"),

        ("const finalShippingFee = shipping_fee || 0;" not in ma,
         "khong con duong nhan thang phi van chuyen tu to khai"),
    ]

    hong = [t for ok, t in chot if not ok]
    for ok, t in chot:
        print(("   [ok] " if ok else "   [HONG] ") + t)
    if hong:
        os.remove(F + HAU_TO)
        thoat(f"{len(hong)} dieu kien khong dat. Da xoa ban luu, file goc nguyen ven.")

    open(F, "w", encoding="utf-8").write(s)

    print("\n[XONG]\n")
    print("  KHONG can build lai client — patch nay chi dung file may chu.\n")
    print("  Buoc tiep:")
    print("    node --check server/routes/orders.js\n")
    print("  Duong lui:")
    print(f"    cp {F}{HAU_TO} {F}")


if __name__ == "__main__":
    main()
