# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH - POS-DOIKHACH-v1   (doi khach thi don sach trang thai cu)
======================================================================

KHAC GI BAN v1
  · Tim them LOI C cung mot khuon: `loadMembershipInfo` cung thieu nhanh else
    -> HANG cua khach truoc dinh sang khach sau (chi tiet o muc 1b).
  · v1 goi `setError` BEN TRONG updater cua `setCart`. Updater cua React phai
    thuan tuy, khong duoc co tac dung phu. v2 tinh truoc roi moi doi trang thai
    — vua dung chuan vua de doc hon.

  Den day da thay BA cho cung mot loi "chi biet dien, khong biet xoa":
  chiet khau · goi · hang khach. Ca ba deu o duong DOI KHACH, trong khi duong
  BO CHON KHACH da don dung tu truoc.

HAI LOI DANG XAY RA O QUAY, KHONG CAN AI PHA HOAI

  LOI A — giam gia cua khach truoc dinh sang khach sau
    `handleSelectCustomer` CHI biet DIEN o giam gia khi khach moi co chiet
    khau, KHONG biet XOA khi khach moi khong co:
        if (selectedCustomer?.discount_value > 0) { ...dien... }
        // thieu else
    Chon chi Lan (giam 10%) -> bam nham -> chon lai anh Nam (khong giam)
    -> o giam gia VAN la 10% -> anh Nam duoc giam oan.
    Xay ra ngay ca khi GIO CON RONG, nen quy trinh "chon khach xong moi
    them hang" KHONG chan duoc loi nay.
    Ma chiet khau da nhap cung khong bi xoa.

  LOI B — mon "lay tu goi" dinh sang khach sau, KHONG AI bi tru luot
    Doi khach KHONG xoa gio hang. Mon da danh dau `fromPkg` van nam do,
    trong khi `setActivePkgId(null)` da xoa ma goi.
    May chu thay dau do nen tinh mon ay 0d (orders.js ~229), nhung khong
    co ma goi nen KHONG tru luot cua ai (orders.js ~917).
    Ket qua: hang ra khoi cua · khong thu tien · goi khach cu con nguyen
    luot · kho van hut. KHONG co dau vet nao de lan ra.

BANG CHUNG LOI NAY DA DUOC NHAN RA MOT NUA
  `handleClearCustomer` (bo chon khach) DA don chiet khau day du, co ghi
  chu "=== Phase B: Reset chiet khau ===". Cung mot loi, da sua cho duong
  "bo chon", QUEN duong "doi khach". Patch nay lam not nua con lai.

SUA GI
  1. Doi khach -> don giam gia, ma chiet khau (them nhanh else)
  2. Doi khach -> bo mon "lay tu goi" khoi gio, GIU nguyen mon thuong,
     bao ro da bo may mon de nhan vien bam lai neu can
  3. May chu -> khai "lay tu goi" ma KHONG kem ma goi thi TU CHOI

VI SAO CAN CA TANG 3
  Tang 1-2 lam it loi hon. Tang 3 lam loi khong gay hau qua. Du man hinh
  co sot duong nao khac, tien van khong mat. Day la tang khong ai vuot qua.

DIEU PATCH NAY CO TINH KHONG LAM
  KHONG kiem goi co THUOC VE khach dang mua hay khong — do la viec cua P2
  day du. Patch nay chi chan truong hop khai co goi ma khong noi goi nao.

CHU Y - PHAI BUILD LAI CLIENT
      cd client && npm run build && cd ..

DUONG LUI
  cp client/src/pages/Sales.jsx.truoc_doikhach client/src/pages/Sales.jsx
  cp server/routes/orders.js.truoc_doikhach   server/routes/orders.js
"""

import os
import sys
import shutil

MARKER = "POS-DOIKHACH-v1"
HAU_TO = ".truoc_doikhach"

F_SALES = os.path.join("client", "src", "pages", "Sales.jsx")
F_ORDERS = os.path.join("server", "routes", "orders.js")
TAT_CA = [F_SALES, F_ORDERS]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · Sales.jsx — doi khach thi don sach
# ══════════════════════════════════════════════════════════════════════
S_CU = """    if (selectedCustomer?.discount_value > 0) {
      setDiscountType(selectedCustomer.discount_type || 'percent');
      setDiscountValue(selectedCustomer.discount_value);
      setDiscountCode('');
      setDiscountCodeValid(null);
    }"""

S_MOI = """    // POS-DOIKHACH-v1: PHAI co nhanh else. Truoc day chi biet DIEN khi khach
    // moi co chiet khau, khong biet XOA khi khach moi khong co -> con so cua
    // khach TRUOC van nam nguyen do va khach SAU duoc giam oan.
    // `handleClearCustomer` da don dung tu truoc; day la lam not duong con lai.
    if (selectedCustomer?.discount_value > 0) {
      setDiscountType(selectedCustomer.discount_type || 'percent');
      setDiscountValue(selectedCustomer.discount_value);
    } else {
      setDiscountType('percent');
      setDiscountValue(0);
    }
    // Ma chiet khau luon xoa: no gan voi khach hoac voi lan mua do,
    // khong mang sang nguoi khac duoc.
    setDiscountCode('');
    setDiscountCodeValid(null);

    // POS-DOIKHACH-v1: goi la cua khach CU, khong mang sang khach MOI duoc.
    // Doi khach ma de nguyen mon "lay tu goi" trong gio thi may chu van tinh
    // 0d (orders.js) trong khi ma goi da bi xoa -> khong ai bi tru luot.
    // GIU nguyen mon thuong, chi bo mon tu goi, va noi ro da bo may mon.
    const monTuGoi = cart.filter((m) => m.fromPkg);
    if (monTuGoi.length) {
      setCart(cart.filter((m) => !m.fromPkg));
      setError(
        `Đã bỏ ${monTuGoi.length} món lấy từ gói ra khỏi giỏ vì gói thuộc về khách trước. ` +
        `Bấm lại nếu khách mới cũng có gói.`
      );
    }"""

# ══════════════════════════════════════════════════════════════════════
#  1b · Sales.jsx — hang khach cung dinh sang khach sau (CUNG MOT KHUON)
#
#  `loadMembershipInfo` co `if (result.success) { ...dien... }` ma KHONG co
#  else. Khach moi khong co the thanh vien -> may chu tra success=false ->
#  hang cua khach TRUOC van nam nguyen.
#  KHONG mat tien that (orders.js ~387 TU TRA hang theo so dien thoai, khong
#  tin man hinh), nhung man hinh bao mot dang may chu tinh mot neo -> so tien
#  lech -> don BI TU CHOI giua luc khach dang dung cho.
# ══════════════════════════════════════════════════════════════════════
M_CU = """        setMembershipInfo({ ...status, usable, discount_percent: tierRates?.discount_percent || 0, special_discount_percent: tierRates?.special_discount_percent || 0 });
      }"""

M_MOI = """        setMembershipInfo({ ...status, usable, discount_percent: tierRates?.discount_percent || 0, special_discount_percent: tierRates?.special_discount_percent || 0 });
      } else {
        // POS-DOIKHACH-v1: khach moi khong co the -> PHAI xoa hang cua khach truoc.
        setMembershipInfo(null);
      }"""

# ══════════════════════════════════════════════════════════════════════
#  2 · orders.js — khai "tu goi" thi phai noi ro goi nao
# ══════════════════════════════════════════════════════════════════════
O_CU = """      // Mix mode: SP từ gói → 0đ, SP lẻ → giá thường
      const unitPrice = item.from_package ? 0 : product.price;"""

O_MOI = """      // POS-DOIKHACH-v1: khai "lay tu goi" thi PHAI noi ro goi nao.
      // Thieu ma goi ma van cho 0d chinh la ke ho lam hang ra khoi cua,
      // khong thu tien, va KHONG goi nao bi tru luot (orders.js ~917).
      // Chan o day la tang cuoi: du man hinh co sot, tien van khong mat.
      if (item.from_package && !customer_package_id) {
        return res.status(400).json({
          error:
            `Sản phẩm ${product.name} khai là lấy từ gói nhưng không kèm gói nào. ` +
            `Hãy chọn lại gói của khách, hoặc bỏ món này ra khỏi giỏ.`,
          code: "TU_GOI_NHUNG_THIEU_GOI",
        });
      }

      // Mix mode: SP từ gói → 0đ, SP lẻ → giá thường
      const unitPrice = item.from_package ? 0 : product.price;"""


def main():
    print("=" * 70)
    print("  PATCH - POS-DOIKHACH-v1  (doi khach thi don sach trang thai cu)")
    print("=" * 70)

    for f in TAT_CA:
        if not os.path.isfile(f):
            thoat(f"Khong thay {f}. Cua so nay khong phai POS?")

    noi = {f: open(f, encoding="utf-8").read() for f in TAT_CA}

    co = [f for f in TAT_CA if MARKER in noi[f]]
    if len(co) == len(TAT_CA):
        print("\n[BO QUA] Patch nay da duoc ap tu truoc (co marker o ca 2 file).")
        return
    if co:
        thoat(
            f"Marker chi co o {len(co)}/{len(TAT_CA)} file - lan chay truoc dut giua chung.\n"
            + "\n".join(f"         cp {f}{HAU_TO} {f}" for f in TAT_CA)
        )

    print("\n[1/4] Kiem phu thuoc va 3 mo neo (CHUA ghi gi)")
    if "POS-TONCU-v1" not in noi[F_SALES]:
        thoat("Sales.jsx chua co POS-TONCU-v1 — ap patch do truoc.")
    print("   [ok] phu thuoc  POS-TONCU-v1")

    for f, nhan, mo in [
        (F_SALES, "khoi chiet khau khi doi khach", S_CU),
        (F_SALES, "khoi nap hang khach", M_CU),
        (F_ORDERS, "cho tinh gia mon tu goi", O_CU),
    ]:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):12} {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    for f in TAT_CA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    print("\n[3/4] Ap 3 thay doi")
    noi[F_SALES] = noi[F_SALES].replace(S_CU, S_MOI, 1)
    print("   [ok] Sales.jsx    don giam gia + ma + mon tu goi khi doi khach")
    noi[F_SALES] = noi[F_SALES].replace(M_CU, M_MOI, 1)
    print("   [ok] Sales.jsx    xoa hang khach cu khi khach moi khong co the")
    noi[F_ORDERS] = noi[F_ORDERS].replace(O_CU, O_MOI, 1)
    print("   [ok] orders.js    tu choi khi khai 'tu goi' ma thieu ma goi")

    print("\n[4/4] Chot 13 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = {f: bo_ghi_chu(noi[f]) for f in TAT_CA}

    chot = [
        ("} else {\n      setDiscountType('percent');\n      setDiscountValue(0);\n    }" in ma[F_SALES],
         "doi khach sang nguoi KHONG co chiet khau thi giam gia ve 0"),

        (ma[F_SALES].count("setDiscountCode('');") >= 2,
         "ma chiet khau bi xoa o CA hai duong (doi khach + bo chon khach)"),

        ("setCart(cart.filter((m) => !m.fromPkg));" in ma[F_SALES],
         "doi khach thi bo mon lay tu goi khoi gio"),

        ("setCart([])" not in ma[F_SALES].split("handleSelectCustomer")[1][:1200],
         "mon THUONG trong gio duoc giu nguyen, khong xoa sach gio"),

        ("Đã bỏ" in ma[F_SALES] and "monTuGoi.length} món" in ma[F_SALES],
         "co bao ro da bo may mon, khong am tham"),

        ("TU_GOI_NHUNG_THIEU_GOI" in ma[F_ORDERS],
         "may chu tu choi khi khai 'tu goi' ma thieu ma goi"),

        (ma[F_ORDERS].find("item.from_package && !customer_package_id")
         < ma[F_ORDERS].find("const unitPrice = item.from_package ? 0"),
         "phep chan dung TRUOC cho tinh gia 0d"),

        ("const unitPrice = item.from_package ? 0 : product.price;" in ma[F_ORDERS],
         "duong tinh gia cu van nguyen ven"),

        ("Phase B: Reset chiết khấu" in noi[F_SALES],
         "duong 'bo chon khach' cu KHONG bi dung toi"),

        (ma[F_SALES].count("const handleSelectCustomer") == 1,
         "chi co dung mot ham chon khach, khong nhan doi"),

        ("} else {\n        setMembershipInfo(null);\n      }" in ma[F_SALES],
         "khach moi khong co the thi xoa hang cua khach truoc"),

        ("setCart((gioCu)" not in ma[F_SALES],
         "KHONG goi setError trong updater cua setCart (updater phai thuan tuy)"),

        ("const monTuGoi = cart.filter((m) => m.fromPkg);" in ma[F_SALES],
         "tinh mon tu goi TRUOC roi moi doi trang thai"),
    ]

    hong = [t for ok, t in chot if not ok]
    for ok, t in chot:
        print(("   [ok] " if ok else "   [HONG] ") + t)
    if hong:
        for f in TAT_CA:
            os.remove(f + HAU_TO)
        thoat(f"{len(hong)} dieu kien khong dat. Da xoa ban luu, file goc nguyen ven.")

    for f in TAT_CA:
        open(f, "w", encoding="utf-8").write(noi[f])

    print("\n[XONG]\n")
    print("  ⚠️  PHAI BUILD LAI CLIENT truoc khi commit:")
    print("      cd client && npm run build && cd ..\n")
    print("  Buoc tiep:")
    print("    node --check server/routes/orders.js\n")
    print("  Duong lui:")
    for f in TAT_CA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
