#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH POS-1 - POS-VANTAY-v1 : POS gui VAN TAY khi goi SX
============================================================================

SX da co SX-VANTAY-v1 tren production (28.08) nhung CHUA CO TAC DUNG GI, vi
POS chua gui van tay. Patch nay noi hai dau lai.

VAN TAY BA PHAN:  POS:<order_id>:<out|in>:<so thu tu mon>

  · order_id  - so tu tang cua pos_orders, duy nhat VINH VIEN.
    KHONG dung ma don: ORD-ngay-3 so chi co 1.000 kha nang/ngay, ban 40 don
    thi 54% so ngay co trung. Dung order_id nen KHONG can sua ma don truoc.
  · chieu out/in - mot don vua ban vua tra hang dung chung order_id. Thieu
    chieu thi lenh tra hang bi coi la trung va KHO KHONG DUOC CONG LAI.
  · so thu tu mon - mot don nhieu mon gui nhieu lenh, va mot don co the co
    HAI dong cung san pham (mot tu goi, mot mua thuong).

SAU PATCH NAY: gui lai bao nhieu lan cung VO HAI. Do la dieu kien de bat
duoc buoc TU DO HANG DOI va DOI CHIEU DINH KY.

5 CHO SUA
  1. orders.js ~830   ban hang: dung .entries() lay so thu tu, gui van tay out
  2. orders.js ~1320  huy don:  gui van tay in
  3. orders.js ~1494  xoa don:  gui van tay in   (cung van ban voi #2)
  4. sxApi.js  ~150   outStockFIFO nhan them tham so vanTay
  5. sxApi.js  ~173   inStockReturn nhan them tham so vanTay
  6-8. orders.js: GHI van tay vao pos_stock_pending o ca 3 cho (out + 2 in)\n  + database.js: them cot van_tay vao pos_stock_pending (cho buoc TU DO
    HANG DOI sau nay - khong co cot nay thi khong dung lai duoc van tay cu,
    va gui lai se TRU KHO LAN NUA)

LUU Y VE #2 VA #3
  Hai cho co van ban GIONG HET nhau -> patch thay CA HAI bang cung mot phep.
  Ca hai deu dung `POS:<order.id>:in:<stt>`, nen neu mot don vua bi huy vua
  bi xoa thi lan thu hai bi SX chan - dung y muon, tranh cong kho hai lan.

TUONG THICH NGUOC
  Khong truyen vanTay thi SX chay y nhu cu. Va SX da len production truoc,
  nen POS len sau khong can dong bo thoi diem.

AN TOAN
  · Kiem HET 5 mo neo truoc khi ghi (F1) · Idempotent qua marker POS-VANTAY-v1
  · Tu luu <ten>.truoc_vantay cho tung file
  · KHONG dung logic tinh tien, giam gia, hay giao dich don hang
"""

import io
import os
import shutil
import sys

MARKER = "POS-VANTAY-v1"
F_ORDERS = "server/routes/orders.js"
F_SXAPI = "server/utils/sxApi.js"
F_DB = "server/database.js"

O_LOOP_CU = r"""    for (const item of orderItems) {
      if (item.is_package_item || !item.sx_product_type) continue;
      try {
        await outStockFIFO(
          item.sx_product_type, item.sx_product_id,
          item.quantity, `POS: ${orderCode}`,
        );"""
O_LOOP_MOI = r"""    // POS-VANTAY-v1: dung .entries() de co SO THU TU MON on dinh.
    // So thu tu bam theo VI TRI TRONG MANG, khong bam theo bo dem tang dan —
    // nhu vay dong item bi bo qua (goi ao) khong lam lech so thu tu cua cac
    // dong sau, va gui lai lan nao cung ra dung van tay do.
    for (const [sttMon, item] of orderItems.entries()) {
      if (item.is_package_item || !item.sx_product_type) continue;
      const vanTay = `POS:${orderId}:out:${sttMon}`;
      try {
        await outStockFIFO(
          item.sx_product_type, item.sx_product_id,
          item.quantity, `POS: ${orderCode}`, vanTay,
        );"""
O_IN_CU = r"""      for (const item of orderItems) {
        if (item.sx_product_type && item.quantity > 0) {
          try {
            await inStockReturn(
              item.sx_product_type, item.sx_product_id,
              item.quantity, order.code,
            );"""
O_IN_MOI = r"""      for (const [sttMon, item] of orderItems.entries()) {
        if (item.sx_product_type && item.quantity > 0) {
          // POS-VANTAY-v1: chieu "in" — PHAI khac chieu "out" du cung order_id,
          // neu khong lenh tra hang bi coi la trung va kho KHONG duoc cong lai.
          const vanTay = `POS:${order.id}:in:${sttMon}`;
          try {
            await inStockReturn(
              item.sx_product_type, item.sx_product_id,
              item.quantity, order.code, vanTay,
            );"""
X_OUT_CU = r"""async function outStockFIFO(productType, productId, quantity, orderCode) {
  try {
    const result = await callSxApi('/api/pos/stock/out', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        notes: `POS: ${orderCode}`
      })
    });"""
X_OUT_MOI = r"""/**
 * POS-VANTAY-v1: them tham so vanTay (tuy chon).
 * SX (SX-VANTAY-v1) ghi lai van tay; gap lai thi tra 200 kem da_lam_roi:true
 * va KHONG tru lan nua. Nho vay gui lai bao nhieu lan cung vo hai — do la dieu
 * kien de bat duoc viec tu do hang doi va doi chieu dinh ky.
 * Khong truyen vanTay thi SX chay y nhu cu (tuong thich nguoc).
 */
async function outStockFIFO(productType, productId, quantity, orderCode, vanTay) {
  try {
    const result = await callSxApi('/api/pos/stock/out', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        van_tay: vanTay || undefined,
        notes: `POS: ${orderCode}`
      })
    });
    if (result && result.da_lam_roi) {
      console.log(`↩️  Stock out DA LAM ROI: ${vanTay} (luc ${result.lam_luc}) — khong tru lai`);
      return result;
    }"""
X_IN_CU = r"""async function inStockReturn(productType, productId, quantity, orderCode) {
  try {
    const result = await callSxApi('/api/pos/stock/in', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        notes: `POS hoàn kho: ${orderCode}`
      })
    });"""
X_IN_MOI = r"""/** POS-VANTAY-v1: xem chu thich o outStockFIFO. */
async function inStockReturn(productType, productId, quantity, orderCode, vanTay) {
  try {
    const result = await callSxApi('/api/pos/stock/in', {
      method: 'POST',
      body: JSON.stringify({
        product_type: productType,
        product_id: productId,
        quantity: quantity,
        order_code: orderCode,
        van_tay: vanTay || undefined,
        notes: `POS hoàn kho: ${orderCode}`
      })
    });
    if (result && result.da_lam_roi) {
      console.log(`↩️  Stock return DA LAM ROI: ${vanTay} (luc ${result.lam_luc}) — khong cong lai`);
      return result;
    }"""
SO_OUT_CU = r"""              order_code, order_id, sx_product_type, sx_product_id,
              product_name, quantity, direction, error_message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'out', ?, ?)`,
            [orderCode, orderId, item.sx_product_type, item.sx_product_id,
             item.product_name, item.quantity, err.message, now],"""

SO_OUT_MOI = r"""              order_code, order_id, sx_product_type, sx_product_id,
              product_name, quantity, direction, error_message, created_at, van_tay
            ) VALUES (?, ?, ?, ?, ?, ?, 'out', ?, ?, ?)`,
            [orderCode, orderId, item.sx_product_type, item.sx_product_id,
             item.product_name, item.quantity, err.message, now, vanTay],"""

SO_IN_CU = r"""                  order_code, order_id, sx_product_type, sx_product_id,
                  product_name, quantity, direction, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?)`,
                [order.code, order.id, item.sx_product_type, item.sx_product_id,
                 item.product_name, item.quantity, err.message, now],"""

SO_IN_MOI = r"""                  order_code, order_id, sx_product_type, sx_product_id,
                  product_name, quantity, direction, error_message, created_at, van_tay
                ) VALUES (?, ?, ?, ?, ?, ?, 'in', ?, ?, ?)`,
                [order.code, order.id, item.sx_product_type, item.sx_product_id,
                 item.product_name, item.quantity, err.message, now, vanTay],"""

D_CU = r"""    await db.execute(`ALTER TABLE pos_products ADD COLUMN is_special_group INTEGER DEFAULT 0`);
  } catch (e) {
    // Cột đã tồn tại (bảng mới tạo đã có, hoặc đã ALTER trước đó) — bỏ qua
  }"""
D_MOI = r"""    await db.execute(`ALTER TABLE pos_products ADD COLUMN is_special_group INTEGER DEFAULT 0`);
  } catch (e) {
    // Cột đã tồn tại (bảng mới tạo đã có, hoặc đã ALTER trước đó) — bỏ qua
  }

  // POS-VANTAY-v1: luu van tay vao so no de buoc TU DO HANG DOI sau nay gui
  // lai dung van tay cu. Khong co cot nay thi khong dung lai duoc van tay,
  // va gui lai se tru kho LAN NUA.
  try {
    await db.execute(`ALTER TABLE pos_stock_pending ADD COLUMN van_tay TEXT`);
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }"""


def thoat(msg):
    print("\n\x1b[31m[DUNG] Khong sua file nao.\x1b[0m\n  " + msg + "\n")
    sys.exit(1)


def main():
    print("\n" + "=" * 70)
    print("  PATCH POS-1 - " + MARKER + "  (POS gui van tay khi goi SX)")
    print("=" * 70)

    for f in (F_ORDERS, F_SXAPI, F_DB):
        if not os.path.exists(f):
            thoat("Khong thay %s - chay o thu muc goc du an POS." % f)

    o = io.open(F_ORDERS, encoding="utf-8").read()
    x = io.open(F_SXAPI, encoding="utf-8").read()
    d = io.open(F_DB, encoding="utf-8").read()

    if MARKER in o and MARKER in x and MARKER in d:
        print("\n\x1b[33m[bo qua] Da ap %s truoc do.\x1b[0m\n" % MARKER)
        return 0

    print("\n[1/4] Kiem 5 mo neo (chua ghi gi)")
    hong = []
    for ten, src, neo, can in [
        ("orders.js - vong lap ban hang", o, O_LOOP_CU, 1),
        ("orders.js - khoi hoan kho (2 cho giong het)", o, O_IN_CU, 2),
        ("sxApi.js  - outStockFIFO", x, X_OUT_CU, 1),
        ("sxApi.js  - inStockReturn", x, X_IN_CU, 1),
        ("orders.js - ghi so no chieu OUT", o, SO_OUT_CU, 1),
        ("orders.js - ghi so no chieu IN (2 cho)", o, SO_IN_CU, 2),
        ("database.js - diem them cot", d, D_CU, 1),
    ]:
        n = src.count(neo)
        print("   %s %-44s %d (can %d)" % (
            "\x1b[32m[ok]\x1b[0m" if n == can else "\x1b[31m[X]\x1b[0m", ten, n, can))
        if n != can:
            hong.append("%s: thay %d, can %d" % (ten, n, can))
    if hong:
        thoat("Mo neo khong khop:\n    - " + "\n    - ".join(hong))

    print("\n[2/4] Luu ban truoc khi sua")
    for f in (F_ORDERS, F_SXAPI, F_DB):
        shutil.copyfile(f, f + ".truoc_vantay")
        print("   -> %s.truoc_vantay" % f)

    print("\n[3/4] Ap 6 thay doi")
    o2 = o.replace(O_LOOP_CU, O_LOOP_MOI, 1)
    print("   \x1b[32m[ok]\x1b[0m orders.js  - ban hang: van tay chieu OUT")
    o2 = o2.replace(O_IN_CU, O_IN_MOI)          # CA HAI cho
    print("   \x1b[32m[ok]\x1b[0m orders.js  - hoan kho: van tay chieu IN (2 cho)")
    # Them cot van_tay ma KHONG ghi gi vao do thi buoc TU DO HANG DOI sau nay
    # khong co van tay de dung lai -> gui lai se TRU KHO LAN NUA.
    # (Lo hong nay da sap khi ra checklist POS — cot co ma khong ai ghi.)
    o2 = o2.replace(SO_OUT_CU, SO_OUT_MOI, 1)
    print("   \x1b[32m[ok]\x1b[0m orders.js  - so no chieu OUT ghi kem van tay")
    o2 = o2.replace(SO_IN_CU, SO_IN_MOI)
    print("   \x1b[32m[ok]\x1b[0m orders.js  - so no chieu IN ghi kem van tay (2 cho)")
    x2 = x.replace(X_OUT_CU, X_OUT_MOI, 1)
    print("   \x1b[32m[ok]\x1b[0m sxApi.js   - outStockFIFO nhan vanTay")
    x2 = x2.replace(X_IN_CU, X_IN_MOI, 1)
    print("   \x1b[32m[ok]\x1b[0m sxApi.js   - inStockReturn nhan vanTay")
    d2 = d.replace(D_CU, D_MOI, 1)
    print("   \x1b[32m[ok]\x1b[0m database.js - them cot van_tay vao pos_stock_pending")

    print("\n[4/4] Chot sau khi sua")
    loi = []
    if o2.count("POS:${orderId}:out:${sttMon}") != 1:
        loi.append("van tay OUT: %d cho, can 1" % o2.count("POS:${orderId}:out:${sttMon}"))
    if o2.count("POS:${order.id}:in:${sttMon}") != 2:
        loi.append("van tay IN: %d cho, can 2" % o2.count("POS:${order.id}:in:${sttMon}"))
    if o2.count("orderItems.entries()") != 3:
        loi.append("entries(): %d cho, can 3" % o2.count("orderItems.entries()"))
    # File co 4 vong lap `for (const item of orderItems)`. Patch chi doi 3 cai
    # dung cho KHO; cai thu 4 (dong ~716) la chen pos_order_items, khong lien
    # quan. Nen chot dung la: 2 vong lap KHO cu phai bien mat.
    # Dau hieu phai la dong THAT SU DOI: dong `for (...)`, khong phai dong
    # `if (item.is_package_item...)` — dong do GIU NGUYEN o ban moi.
    if "for (const item of orderItems) {\n      if (item.is_package_item" in o2:
        loi.append("vong lap ban hang chua doi sang entries()")
    if o2.count("for (const item of orderItems) {") != 1:
        loi.append("con %d vong lap kieu cu, chi duoc con 1 (pos_order_items)"
                   % o2.count("for (const item of orderItems) {"))
    if x2.count("van_tay: vanTay || undefined") != 2:
        loi.append("sxApi gui van_tay: %d cho, can 2" % x2.count("van_tay: vanTay || undefined"))
    # Dem cho DOC THAT, khong dem trong ghi chu (loi E16 — chot bat nham
    # chinh ghi chu cua patch; da sap 3 lan trong phien nay).
    if x2.count("result.da_lam_roi") != 2:
        loi.append("sxApi doc result.da_lam_roi: %d cho, can 2" % x2.count("result.da_lam_roi"))
    if o2.count("created_at, van_tay") != 3:
        loi.append("so no ghi van tay: %d cho, can 3" % o2.count("created_at, van_tay"))
    if o2.count("now, vanTay]") != 3:
        loi.append("tham so vanTay trong INSERT: %d cho, can 3" % o2.count("now, vanTay]"))
    if "ADD COLUMN van_tay TEXT" not in d2:
        loi.append("thieu cot van_tay")
    for f, g in ((F_ORDERS, o2), (F_SXAPI, x2), (F_DB, d2)):
        if MARKER not in g:
            loi.append("%s thieu marker" % f)
        if g.count("\ufffd"):
            loi.append("%s co ky tu hong ma" % f)
    # KHONG duoc dung logic tien nong
    for tu in ["subtotal", "discount", "total", "payment_method"]:
        if o.count(tu) != o2.count(tu):
            loi.append("da cham logic tinh tien: " + tu)
    if loi:
        thoat("Ket qua khong nhu du tinh:\n    - " + "\n    - ".join(loi))

    io.open(F_ORDERS, "w", encoding="utf-8").write(o2)
    io.open(F_SXAPI, "w", encoding="utf-8").write(x2)
    io.open(F_DB, "w", encoding="utf-8").write(d2)

    print("   \x1b[32m[ok]\x1b[0m van tay OUT 1 cho · IN 2 cho · entries() 3 cho")
    print("   \x1b[32m[ok]\x1b[0m sxApi gui van_tay + doc da_lam_roi o ca 2 ham")
    print("   \x1b[32m[ok]\x1b[0m cot van_tay da them VA duoc ghi o ca 3 cho · 3 marker")
    print("   \x1b[32m[ok]\x1b[0m KHONG cham logic tinh tien / giam gia")

    print("\n\x1b[32m[XONG]\x1b[0m")
    print("\n  Buoc tiep:")
    print("    node --check %s && node --check %s && node --check %s" % (F_ORDERS, F_SXAPI, F_DB))
    print("    node test_van_tay_pos_v1.js")
    print("    (trien khai len Render, roi ban thu 1 don nhieu mon)")
    print("\n  Duong lui:")
    for f in (F_ORDERS, F_SXAPI, F_DB):
        print("    cp %s.truoc_vantay %s" % (f, f))
    print("")
    return 0


if __name__ == "__main__":
    sys.exit(main())
