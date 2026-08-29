#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH POS-2 - POS-NHOMKHONGKHO-v1 : hieu nhom KHONG QUAN KHO
============================================================================

Nen: SX sap co nhom san pham "pha khi khach goi" (ca phe, tra pha san) —
KHONG dem ton kho. SX se tra them co `khong_quan_kho: true` cho nhung mon do.

Neu POS khong biet co nay:
  · badge ton kho in thang stock_quantity -> null => O DO TRONG, trong nhu loi
  · 3 cho chan ban theo ton kho -> mon do bi coi la HET HANG, khong ban duoc
  · the san pham bi lam mo di

Patch nay day len TRUOC patch SX (thu tu bat buoc), va HOAN TOAN VO HAI khi
SX chua gui co: `product.khong_quan_kho` la undefined -> moi nhanh chay y nhu cu.

4 CHO SUA trong client/src/pages/Sales.jsx
  1. badge: hien "Co san" (nen tim) thay vi so — KHONG bia so 999 (POS-2:
     "API khong bao gio phat gia 0 gia hay ton 999 gia")
  2. chan ban khi ton = 0 (them mon vao gio da co)      -> bo qua neu khong quan kho
  3. chan ban khi ton = 0 (them mon moi)                -> bo qua neu khong quan kho
  4. chan khi so luong trong gio >= ton                 -> bo qua neu khong quan kho
  + the san pham khong bi lam mo

⚠️ P1 — dist NAM TRONG GIT: patch nay sua client/ nen PHAI `npm run build`
   truoc khi commit, neu khong ban chay that VAN LA BAN CU (loi am tham).

AN TOAN
  · Kiem HET 4 mo neo truoc khi ghi (F1) · Idempotent qua marker
  · Tu luu Sales.jsx.truoc_khongkho
  · KHONG dung duong tien, khong dung logic gio hang nao khac
"""

import io
import os
import shutil
import sys

MARKER = "POS-NHOMKHONGKHO-v1"
FILE = "client/src/pages/Sales.jsx"
LUU = "client/src/pages/Sales.jsx.truoc_khongkho"

SUA = [
    (r"""                  <div style={{ position: 'absolute', top: '4px', right: '4px', background: product.stock_quantity > 0 ? '#dcfce7' : '#fee2e2', color: product.stock_quantity > 0 ? '#166534' : '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {product.stock_quantity}
                  </div>""", r"""                  <div style={{ position: 'absolute', top: '4px', right: '4px', background: product.khong_quan_kho ? '#e0e7ff' : (product.stock_quantity > 0 ? '#dcfce7' : '#fee2e2'), color: product.khong_quan_kho ? '#3730a3' : (product.stock_quantity > 0 ? '#166534' : '#dc2626'), padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {/* POS-NHOMKHONGKHO-v1: nhóm pha theo yêu cầu (cà phê, trà pha sẵn)
                        KHÔNG đếm tồn. Trước đây badge in thẳng stock_quantity nên
                        nhóm này ra Ô ĐỎ TRỐNG — trông như lỗi. Nay hiện "Có sẵn".
                        KHÔNG bịa số 999 (POS-2): số giả nguy hiểm hơn không có số. */}
                    {product.khong_quan_kho ? 'Có sẵn' : product.stock_quantity}
                  </div>""", 1, "badge: hien 'Co san' thay vi o do trong"),
    (r"""      if (product.stock_quantity > 0 && existing.quantity >= product.stock_quantity) {""", r"""      if (!product.khong_quan_kho && product.stock_quantity > 0 && existing.quantity >= product.stock_quantity) {""", 1, "bo qua chan 'da du so luong trong gio'"),
    (r"""      if (product.stock_quantity === 0) {""", r"""      if (!product.khong_quan_kho && product.stock_quantity === 0) {""", 2, "bo qua chan 'het hang' (2 cho)"),
    (r"""                  opacity: product.stock_quantity <= 0 && !inPkg ? 0.5 : 1,""", r"""                  opacity: !product.khong_quan_kho && product.stock_quantity <= 0 && !inPkg ? 0.5 : 1,""", 1, "khong lam mo the san pham"),
]


def thoat(msg):
    print("\n\x1b[31m[DUNG] Khong sua file nao.\x1b[0m\n  " + msg + "\n")
    sys.exit(1)


def main():
    print("\n" + "=" * 70)
    print("  PATCH POS-2 - " + MARKER + "  (hieu nhom khong quan kho)")
    print("=" * 70)

    if not os.path.exists(FILE):
        thoat("Khong thay %s - chay o thu muc goc du an POS." % FILE)
    goc = io.open(FILE, encoding="utf-8").read()

    if MARKER in goc:
        print("\n\x1b[33m[bo qua] Da ap %s truoc do.\x1b[0m\n" % MARKER)
        return 0

    print("\n[1/4] Kiem 4 mo neo (chua ghi gi)")
    hong = []
    for cu, moi, can, ten in SUA:
        n = goc.count(cu)
        print("   %s %-42s %d (can %d)" % (
            "\x1b[32m[ok]\x1b[0m" if n == can else "\x1b[31m[X]\x1b[0m", ten, n, can))
        if n != can:
            hong.append("%s: thay %d, can %d" % (ten, n, can))
    if hong:
        thoat("Mo neo khong khop:\n    - " + "\n    - ".join(hong))

    print("\n[2/4] Luu ban truoc khi sua -> %s" % LUU)
    shutil.copyfile(FILE, LUU)

    print("\n[3/4] Ap 4 thay doi")
    nd = goc
    for cu, moi, can, ten in SUA:
        nd = nd.replace(cu, moi)      # thay HET so lan tim thay
        print("   \x1b[32m[ok]\x1b[0m %s" % ten)

    print("\n[4/4] Chot sau khi sua")
    loi = []
    if MARKER not in nd:
        loi.append("thieu marker")
    if nd.count("\ufffd"):
        loi.append("co ky tu hong ma (F8)")
    if nd.count("khong_quan_kho") != 7:
        loi.append("so lan dung khong_quan_kho = %d, cho 7" % nd.count("khong_quan_kho"))
    # KHONG duoc bia so gia
    if "999" in nd and "999" not in goc:
        loi.append("da them so 999 gia (vi pham POS-2)")
    # duong tien phai nguyen
    for t in ["formatPrice", "product.price", "setCart", "unique_key"]:
        if goc.count(t) != nd.count(t):
            loi.append("da cham logic gio hang / tien: %s (%d -> %d)" % (t, goc.count(t), nd.count(t)))
    # 3 cho chan van con (chi them dieu kien, khong xoa)
    if nd.count("stock_quantity === 0") != 2:
        loi.append("mat cho chan het hang: con %d, can 2" % nd.count("stock_quantity === 0"))
    if loi:
        thoat("Ket qua khong nhu du tinh:\n    - " + "\n    - ".join(loi))

    io.open(FILE, "w", encoding="utf-8").write(nd)
    print("   \x1b[32m[ok]\x1b[0m marker co · 0 ky tu hong · 7 cho dung co moi")
    print("   \x1b[32m[ok]\x1b[0m KHONG bia so gia · duong tien va gio hang nguyen ven")
    print("   \x1b[32m[ok]\x1b[0m 2 cho chan het hang van con (chi them dieu kien)")

    print("\n\x1b[32m[XONG]\x1b[0m Ban luu: %s" % LUU)
    print("\n  \x1b[33mBUOC BAT BUOC — dist nam trong git (P1):\x1b[0m")
    print("    cd client && npm run build && cd ..")
    print("    git add client/src/pages/Sales.jsx client/dist %s" % os.path.basename(__file__))
    print("\n  Khong build thi ban chay that VAN LA BAN CU — loi am tham.")
    print("\n  Duong lui:  cp %s %s\n" % (LUU, FILE))
    return 0


if __name__ == "__main__":
    sys.exit(main())
