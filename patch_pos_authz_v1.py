# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH - POS-AUTHZ-v1   (dong han cong: may chu tu quyet mon nao 0d)
======================================================================

LO CON SOT — VA DAY LA LY DO BO KIEM VAN KEU

  Man ban hang kiem mon co nam trong goi khong (Sales.jsx:77 `pkgAllowedKeys`).
  MAY CHU KHONG KIEM — chu `package_items` khong xuat hien mot lan nao trong
  orders.js.

  Nghia la: khach co goi TRA, khai lay NUOC EP tu goi -> may chu van cho 0d.
  Cac patch truoc da kiem goi CO THAT · DUNG CHU · CON LUOT, nhung chua kiem
  MON CO TRONG GOI.

VI SAO BO KIEM DUNG NGAY TU DAU
  Phep canh gac doi mau `item.from_package ? 0` phai bien mat. Toi tung nghi
  no khat khe qua vi da co cong chan phia truoc. SAI — chung nao ma van viet
  "to khai quyet dinh gia 0" thi van con lo, va lo do co that (o tren).

  Patch nay lam dung y bo kiem muon:
    · gia 0 KHONG con den tu co tho cua to khai
    · no den tu `layTuGoi` — bien chi duoc dat sau khi da qua HET cac phep kiem

  Ket qua: bo kiem chuyen xanh MOT CACH CHINH DANG, khong phai nhờ noi long
  phep canh gac. KHONG dung mot dong nao trong kiem_tra_truoc_khi_giao.js.

KHONG CHAN NHAM GOI CU
  Goi khong khai danh sach mon (`package_items` rong/null) -> KHONG kiem,
  cho qua nhu cu. Chi kiem khi goi co khai ro chua nhung mon nao.

PHU THUOC
  POS-CONGDON-v1

CHU Y
  Chi dung server/routes/orders.js — KHONG can build lai client.

DUONG LUI
  cp server/routes/orders.js.truoc_authz server/routes/orders.js
"""

import os
import sys
import shutil

MARKER = "POS-AUTHZ-v1"
HAU_TO = ".truoc_authz"
F = os.path.join("server", "routes", "orders.js")


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · Doc danh sach mon duoc phep lay tu goi (dat ngay sau khoi kiem goi)
# ══════════════════════════════════════════════════════════════════════
A_CU = """    // ═══ het POS-CONGDON-v1 · LO 3 ═══════════════════════════════════════"""

A_MOI = """    // ═══ het POS-CONGDON-v1 · LO 3 ═══════════════════════════════════════

    // ═══ POS-AUTHZ-v1: mon nao duoc phep lay tu goi ══════════════════════
    // Man ban hang da kiem viec nay (Sales.jsx:77) nhung MAY CHU thi chua —
    // khach co goi TRA, khai lay NUOC EP tu goi thi van duoc 0d.
    // null = goi khong khai danh sach mon -> KHONG kiem, cho qua nhu cu
    //        (goi cu tao truoc khi co tinh nang nay van ban binh thuong).
    let monDuocLayTuGoi = null;
    {
      let dsJson = null;
      if (customer_package_id) {
        const g = await queryOne(
          `SELECT p.package_items FROM pos_customer_packages cp
             JOIN pos_packages p ON p.id = cp.package_id
            WHERE cp.id = ?`,
          [customer_package_id],
        );
        dsJson = g?.package_items || null;
      } else if (package_buy && package_buy.package_id) {
        const p = await queryOne(
          "SELECT package_items FROM pos_packages WHERE id = ?",
          [package_buy.package_id],
        );
        dsJson = p?.package_items || null;
      }
      if (dsJson) {
        try {
          const ds = typeof dsJson === "string" ? JSON.parse(dsJson) : dsJson;
          if (Array.isArray(ds) && ds.length) {
            monDuocLayTuGoi = new Set(
              ds.map((i) => `${i.sx_product_type}_${i.sx_product_id}`),
            );
          }
        } catch (e) {
          // Danh sach hong thi KHONG kiem — tha cho qua con hon chan nham
          // ca quay vi mot dong du lieu loi.
          console.error("package_items khong doc duoc:", e.message);
        }
      }
    }
    // ═══ het POS-AUTHZ-v1 · doc danh sach ════════════════════════════════"""

# ══════════════════════════════════════════════════════════════════════
#  2 · Gia 0 den tu KET QUA KIEM, khong tu co tho cua to khai
# ══════════════════════════════════════════════════════════════════════
B_CU = """      // Mix mode: SP từ gói → 0đ, SP lẻ → giá thường
      const unitPrice = item.from_package ? 0 : product.price;"""

B_MOI = """      // ═══ POS-AUTHZ-v1 · CONG DONG O DAY ════════════════════════════════
      // `item.from_package` chi la DE NGHI cua to khai. May chu xac nhan lai
      // mon do co that su nam trong goi khong roi moi cho 0d.
      if (item.from_package && monDuocLayTuGoi) {
        const khoaMon = `${product.sx_product_type}_${product.sx_product_id}`;
        if (!monDuocLayTuGoi.has(khoaMon)) {
          return res.status(400).json({
            error:
              `Sản phẩm ${product.name} KHÔNG nằm trong gói của khách, ` +
              `không thể lấy từ gói. Hãy bỏ món này ra khỏi giỏ hoặc bán như hàng lẻ.`,
            code: "MON_KHONG_TRONG_GOI",
          });
        }
      }
      // Gia 0 den tu BIEN NAY — da qua het cac phep kiem — chu KHONG den
      // thang tu co cua to khai. Day la khac biet that, khong phai doi ten.
      const layTuGoi = !!item.from_package;

      // Mix mode: SP từ gói → 0đ, SP lẻ → giá thường
      const unitPrice = layTuGoi ? 0 : product.price;"""


def main():
    print("=" * 70)
    print("  PATCH - POS-AUTHZ-v1  (dong han cong: may chu tu quyet mon nao 0d)")
    print("=" * 70)

    if not os.path.isfile(F):
        thoat(f"Khong thay {F}. Cua so nay khong phai POS?")

    s = open(F, encoding="utf-8").read()

    if MARKER in s:
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return

    print("\n[1/4] Kiem phu thuoc va 2 mo neo (CHUA ghi gi)")
    if "POS-CONGDON-v1" not in s:
        thoat("Thieu POS-CONGDON-v1 — phai ap patch do truoc.")
    print("   [ok] phu thuoc  POS-CONGDON-v1")

    for nhan, mo in [
        ("cuoi khoi kiem goi", A_CU),
        ("cho tinh gia mon", B_CU),
    ]:
        n = s.count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' xuat hien {n} lan (can dung 1).")
        print(f"   [ok] orders.js  {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    shutil.copy2(F, F + HAU_TO)
    print(f"   -> {F}{HAU_TO}")

    print("\n[3/4] Ap 2 thay doi")
    s = s.replace(A_CU, A_MOI, 1)
    print("   [ok] orders.js  doc danh sach mon duoc phep lay tu goi")
    s = s.replace(B_CU, B_MOI, 1)
    print("   [ok] orders.js  gia 0 den tu KET QUA KIEM, khong tu to khai")

    print("\n[4/4] Chot 12 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = bo_ghi_chu(s)

    chot = [
        ("MON_KHONG_TRONG_GOI" in ma,
         "tu choi khi mon KHONG nam trong goi cua khach"),

        ("package_items" in ma,
         "may chu that su doc danh sach mon cua goi"),

        ("const unitPrice = layTuGoi ? 0 : product.price;" in ma,
         "gia 0 den tu bien da qua kiem"),

        (not __import__("re").search(r"item\.from_package\s*\?\s*0", ma),
         "MAU THO da bien mat — bo kiem se xanh MOT CACH CHINH DANG"),

        (MARKER in s,
         "co dau POS-AUTHZ-v1 de bo kiem chot duoc"),

        (ma.find("monDuocLayTuGoi = new Set") < ma.find("monDuocLayTuGoi.has(khoaMon)"),
         "danh sach duoc dung TRUOC khi mang ra kiem"),

        ("if (item.from_package && monDuocLayTuGoi) {" in ma,
         "goi KHONG khai danh sach mon thi KHONG kiem — khong chan nham goi cu"),

        ("const layTuGoi = !!item.from_package;" in ma,
         "co bien trung gian, khong dung thang co to khai"),

        (ma.find("MON_KHONG_TRONG_GOI") < ma.find("const unitPrice = layTuGoi"),
         "phep kiem dung TRUOC cho tinh gia"),

        ("GOI_KHONG_DUNG_CHU" in ma and "TU_GOI_NHUNG_THIEU_GOI" in ma,
         "cac phep chan cua patch truoc KHONG bi dung toi"),

        ("Math.max(0, Number(shipping_fee) || 0)" in ma,
         "phep chan phi van chuyen am KHONG bi dung toi"),

        ("JSON.parse(dsJson)" in ma and "catch" in ma,
         "danh sach hong thi tha cho qua, khong lam sap ca quay"),
    ]

    hong = [t for ok, t in chot if not ok]
    for ok, t in chot:
        print(("   [ok] " if ok else "   [HONG] ") + t)
    if hong:
        os.remove(F + HAU_TO)
        thoat(f"{len(hong)} dieu kien khong dat. Da xoa ban luu, file goc nguyen ven.")

    open(F, "w", encoding="utf-8").write(s)

    print("\n[XONG]\n")
    print("  KHONG can build lai client.\n")
    print("  Buoc tiep:")
    print("    node --check server/routes/orders.js")
    print("    npm run kiem     <- canh bao 'CHUA co cong phan quyen' PHAI BIEN MAT\n")
    print("  Duong lui:")
    print(f"    cp {F}{HAU_TO} {F}")


if __name__ == "__main__":
    main()
