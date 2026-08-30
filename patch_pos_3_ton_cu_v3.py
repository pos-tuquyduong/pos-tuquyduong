# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH POS - POS-TONCU-v1   (bo so gia · ton gan nhat kem gio)
======================================================================

KHAC GI BAN v2
  Ra soat lai tim ra 3 diem, trong do 2 la LOI THAT ve hien thi:
   · So CU van to MAU XANH nhu so tuoi -> nhin qua tuong binh thuong nen
     khong ai kiem tra. Do dung la cai bay cua so 999 doi lot khac. Nay ra VANG.
   · CHUA RO ton (null) bi to MAU DO -> do nghia la HET HANG, sai nghia han.
     Nay ra XAM.
   · Hieu nang: v2 ghi lai ton cho MOI mon MOI LAN tai danh sach = 10 luot ghi
     Turso moi lan, phan lon la ghi lai dung con so cu. Nay doc 1 luot roi
     CHI GHI MON NAO THAY DOI.
  Tien the huy hieu gom vao mot ham kieuTon() nen doc ro hon bieu thuc long 4 tang.

KHAC GI BAN v1
  v1 chua biet mot LOI THAT chi lo ra khi dung database tu dau: bang so no
  pos_stock_pending tao moi KHONG CO cot van_tay (chi tiet o muc 1b duoi).
  v2 va them cho do. Tim ra nho dung POS that tren SQLite trong tinh.

BA VIEC
  1. BO TON 999 GIA. Mat ket noi SX thi tra SO THAT CUOI CUNG BIET DUOC
     kem gio biet. Chua tung biet thi tra null. KHONG BAO GIO bia so.
  2. BO GIA 0 GIA. Thieu gia tra null + co sellable=false, khong tra 0.
  3. inStockReturn NEM LOI thay vi return null.

VI SAO VIEC 3 QUAN TRONG NHAT
  orders.js co san khoi ghi so no chieu "in" nam trong catch. Nhung
  inStockReturn nuot loi va tra null -> catch KHONG BAO GIO CHAY.
  Huy don luc SX mat ket noi: kho KHONG duoc cong lai VA khong co dau
  vet nao. So no chieu "in" chua tung co mot dong. Sua 3 dong o sxApi.js
  la khoi ghi so no san co bat dau lam viec — khong phai viet gi moi.

TON = SO + THOI DIEM, KHONG PHAI SO TRAN
  Moi lan goi SX thanh cong, POS ghi lai so ton va gio biet vao 2 cot moi
  cua pos_products. SX chet -> tra dung so do kem ton_cu=true va ton_luc.
  Man ban hang hien "29 · 14:03" mau vang thay cho so 999 mau xanh trong
  nhu binh thuong.

  Day cung la vien gach dau cua duong lui tach he thong: POS giu duoc ban
  sao du dung thi ngay muon tach chi con thieu so kho rieng.

CHU Y - PHAI BUILD LAI CLIENT
  Patch nay dung client/src/pages/Sales.jsx. POS phuc vu tu client/dist
  ma dist NAM TRONG GIT. Khong build thi Render deploy xong van chay ban
  cu, loi am tham (muc P1 trong CHECKLIST_CODE.md cua POS).
      cd client && npm run build && cd ..

DUONG LUI
  cp server/routes/products.js.truoc_toncu server/routes/products.js
  cp server/database.js.truoc_toncu       server/database.js
  cp server/utils/sxApi.js.truoc_toncu    server/utils/sxApi.js
  cp client/src/pages/Sales.jsx.truoc_toncu client/src/pages/Sales.jsx
"""

import os
import sys
import shutil

MARKER = "POS-TONCU-v1"
HAU_TO = ".truoc_toncu"

F_PROD = os.path.join("server", "routes", "products.js")
F_DB = os.path.join("server", "database.js")
F_SX = os.path.join("server", "utils", "sxApi.js")
F_SALES = os.path.join("client", "src", "pages", "Sales.jsx")
TAT_CA = [F_PROD, F_DB, F_SX, F_SALES]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · database.js — them 2 cot nho ton gan nhat
# ══════════════════════════════════════════════════════════════════════
D_CU = '''    await db.execute(`ALTER TABLE pos_stock_pending ADD COLUMN van_tay TEXT`);'''

D_MOI = '''    await db.execute(`ALTER TABLE pos_stock_pending ADD COLUMN van_tay TEXT`);'''

D_THEM = '''
  // POS-TONCU-v1: nho SO TON CUOI CUNG BIET DUOC va GIO biet.
  // Mat ket noi SX thi tra dung so nay kem gio, thay cho so 999 bia ra.
  // Chi ghi cho mon CO QUAN KHO va khi SX tra ve mot con so that.
  try {
    await db.execute(`ALTER TABLE pos_products ADD COLUMN ton_gan_nhat INTEGER`);
  } catch (e) {
    // Cot da ton tai — bo qua
  }
  try {
    await db.execute(`ALTER TABLE pos_products ADD COLUMN ton_luc TEXT`);
  } catch (e) {
    // Cot da ton tai — bo qua
  }
'''

# ══════════════════════════════════════════════════════════════════════
#  1b · database.js — VA LOI THAT: pos_stock_pending tao moi THIEU van_tay
#
#  ALTER TABLE them cot van_tay nam o dong ~140, nhung bang nay mai dong ~765
#  moi duoc CREATE. Tren database MOI TINH, ALTER chay khi bang CHUA TON TAI
#  -> nem loi -> bi catch nuot -> cot khong bao gio duoc them.
#  Production khong dinh vi bang da co san tu truoc, nen loi nay AN KY.
#  Hau qua neu phai dung lai POS tu dau (doi Turso / khoi phuc / tach he thong):
#  so no mat cot van_tay -> bo "nguoi di doi" gui lai KHONG co van tay
#  -> SX khong nhan ra la viec cu -> TRU KHO LAN NUA.
#  Va bang cach them thang vao CREATE TABLE; ALTER giu nguyen cho bang cu.
# ══════════════════════════════════════════════════════════════════════
D2_CU = """      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    )"""

D2_MOI = """      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      van_tay TEXT
    )"""

# ══════════════════════════════════════════════════════════════════════
#  2 · products.js — ghi lai ton moi lan goi SX thanh cong
# ══════════════════════════════════════════════════════════════════════
P1_CU = '''        products = await callSxApi('/api/pos/products-with-stock');'''

P1_MOI = '''        products = await callSxApi('/api/pos/products-with-stock');

        // POS-TONCU-v1: goi duoc SX thi NHO LAI so ton va gio biet.
        // Lan sau SX chet, POS con cai that de tra ve thay vi bia 999.
        // Chi nho mon CO QUAN KHO va ton la so that (nhom "pha khi khach
        // goi" tra null — nho null vao la bien no thanh "chua ro ton").
        // Loi o day KHONG duoc lam hong man ban hang: chi ghi log.
        try {
          // ton_luc la GIO VIET NAM (de hien "luc 14:03" cho nguoi nhin).
          // Cac cot khac cua POS dung datetime('now') = gio UTC — DUNG so sanh
          // truc tiep ton_luc voi created_at, lech 7 tieng.
          const nowVn = new Date(Date.now() + 7 * 3600 * 1000)
            .toISOString().slice(0, 19).replace('T', ' ');

          // Chi GHI KHI TON THAY DOI. Man ban hang tai lai danh sach rat nhieu
          // lan moi ca; ghi mu quang la 10 luot ghi Turso moi lan tai, phan lon
          // la ghi lai dung con so cu. Doc 1 luot roi so re hon nhieu.
          const daNho = await query(
            'SELECT sx_product_type, sx_product_id, ton_gan_nhat FROM pos_products',
          );
          for (const p of products) {
            if (p.khong_quan_kho) continue;
            if (typeof p.stock_quantity !== 'number') continue;
            const cu = daNho.find(
              (x) => x.sx_product_type === p.sx_product_type &&
                     String(x.sx_product_id) === String(p.sx_product_id),
            );
            if (cu && cu.ton_gan_nhat === p.stock_quantity) continue;
            await run(
              `UPDATE pos_products SET ton_gan_nhat = ?, ton_luc = ?
                WHERE sx_product_type = ? AND sx_product_id = ?`,
              [p.stock_quantity, nowVn, p.sx_product_type, p.sx_product_id],
            );
          }
        } catch (e) {
          console.error('Khong ghi duoc ton gan nhat:', e.message);
        }'''

# ══════════════════════════════════════════════════════════════════════
#  3 · products.js — bo ton 999
# ══════════════════════════════════════════════════════════════════════
P2_CU = '''  return products.map(p => ({
    ...p,
    unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
    stock_quantity: 999,
    stock_status: 'unknown'
  }));'''

P2_MOI = '''  // POS-TONCU-v1: TUYET DOI khong tra 999. Tra so that cuoi cung biet duoc
  // kem gio biet; chua tung biet thi tra null. So gia nguy hiem hon khong co so:
  // 999 trong nhu binh thuong nen khong ai kiem tra (su co 25.08 keo 1 tieng).
  return products.map(p => ({
    ...p,
    unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
    stock_quantity: typeof p.ton_gan_nhat === 'number' ? p.ton_gan_nhat : null,
    ton_cu: true,
    ton_luc: p.ton_luc || null,
    stock_status: typeof p.ton_gan_nhat === 'number' ? 'ton_cu' : 'chua_ro'
  }));'''

# ══════════════════════════════════════════════════════════════════════
#  4 · products.js — bo gia 0 gia
# ══════════════════════════════════════════════════════════════════════
P3_CU = '''        price: priceInfo?.price || 0,'''

P3_MOI = '''        // POS-TONCU-v1: thieu gia thi tra null, KHONG tra 0.
        // Dung ?? chu khong || — gia 0 that (hang tang) la hop le.
        // Man ban hang da chan them vao gio khi gia khong hop le; co sellable
        // de App KH sau nay khong phai tu doan.
        price: priceInfo?.price ?? null,
        sellable: typeof priceInfo?.price === 'number' && priceInfo.price > 0,'''

# ══════════════════════════════════════════════════════════════════════
#  5 · sxApi.js — hoan kho NEM LOI
# ══════════════════════════════════════════════════════════════════════
S_CU = '''    console.error('❌ Stock return error:', err.message);
    // Không throw - hoàn kho fail không nên block hủy đơn
    return null;'''

S_MOI = '''    console.error('❌ Stock return error:', err.message);
    // POS-TONCU-v1: PHAI nem loi. Truoc day `return null` lam khoi ghi so no
    // chieu "in" trong orders.js KHONG BAO GIO CHAY (no nam trong catch, cho
    // nhan loi ma loi khong bao gio toi). Hau qua: huy don luc SX mat ket noi
    // thi kho KHONG duoc cong lai VA khong co dau vet nao.
    // Nem loi KHONG lam hong viec huy don: noi goi da boc san try/catch,
    // huy don van xong, chi khac la viec hoan kho duoc GHI VAO SO NO de doi sau.
    throw err;'''

# ══════════════════════════════════════════════════════════════════════
#  6 · Sales.jsx — tong ton khong duoc thanh NaN
# ══════════════════════════════════════════════════════════════════════
A1_CU = '''  const juiceStock = products.filter(p => p.category === 'juice').reduce((sum, p) => sum + p.stock_quantity, 0);
  const teaStock = products.filter(p => p.category === 'tea').reduce((sum, p) => sum + p.stock_quantity, 0);'''

A1_MOI = '''  // POS-TONCU-v1: ton co the la null (chua ro / khong quan kho). null cong vao
  // so ra NaN -> tab hien "Tra (3) - NaN". Ep ve 0 truoc khi cong.
  const congTon = (sum, p) => sum + (Number(p.stock_quantity) || 0);
  const juiceStock = products.filter(p => p.category === 'juice').reduce(congTon, 0);
  const teaStock = products.filter(p => p.category === 'tea').reduce(congTon, 0);

  // POS-TONCU-v1: MAU cua huy hieu ton, gom mot cho de khong lech nhau.
  // Quan trong: so CU phai ra MAU VANG. De mau xanh nhu so tuoi thi lai dung
  // cai bay cua so 999 — nhin qua tuong binh thuong nen khong ai kiem tra.
  // Va CHUA RO (null) phai ra mau XAM, khong duoc do: do nghia la HET HANG.
  const kieuTon = (p) => {
    if (p.khong_quan_kho) return { nen: '#e0e7ff', chu: '#3730a3', nhan: 'Có sẵn', chuThich: 'Pha khi khách gọi' };
    const ton = p.stock_quantity;
    if (ton === null || ton === undefined)
      return { nen: '#f1f5f9', chu: '#475569', nhan: '⏱ ?', chuThich: 'Chưa rõ tồn — chưa liên lạc được kho' };
    if (p.ton_cu) {
      const gio = (p.ton_luc || '').slice(11, 16);
      return { nen: '#fef3c7', chu: '#92400e', nhan: `⏱ ${ton}`,
               chuThich: `Tồn ${ton}${gio ? ' lúc ' + gio : ''} — chưa liên lạc được kho, số có thể đã cũ` };
    }
    return ton > 0
      ? { nen: '#dcfce7', chu: '#166534', nhan: String(ton), chuThich: `Còn ${ton}` }
      : { nen: '#fee2e2', chu: '#dc2626', nhan: String(ton), chuThich: 'Hết hàng' };
  };'''

# ══════════════════════════════════════════════════════════════════════
#  7 · Sales.jsx — o san pham khong bi mo khi CHUA RO ton
# ══════════════════════════════════════════════════════════════════════
A2_CU = '''                  opacity: !product.khong_quan_kho && product.stock_quantity <= 0 && !inPkg ? 0.5 : 1,'''

A2_MOI = '''                  // POS-TONCU-v1: chi mo khi BIET CHAC la het (so 0).
                  // null = chua ro, khong phai het -> khong lam mo.
                  opacity: !product.khong_quan_kho && product.stock_quantity !== null
                    && product.stock_quantity <= 0 && !inPkg ? 0.5 : 1,'''

# ══════════════════════════════════════════════════════════════════════
#  8 · Sales.jsx — huy hieu ton: hien gio khi so da cu
# ══════════════════════════════════════════════════════════════════════
A3_CU = '''                    {product.khong_quan_kho ? 'Có sẵn' : product.stock_quantity}'''

A3_MOI = '''                    {kieuTon(product).nhan}'''

# ══════════════════════════════════════════════════════════════════════
#  8b · Sales.jsx — MAU huy hieu: so cu ra VANG, chua ro ra XAM
# ══════════════════════════════════════════════════════════════════════
A5_CU = """                  <div style={{ position: 'absolute', top: '4px', right: '4px', background: product.khong_quan_kho ? '#e0e7ff' : (product.stock_quantity > 0 ? '#dcfce7' : '#fee2e2'), color: product.khong_quan_kho ? '#3730a3' : (product.stock_quantity > 0 ? '#166534' : '#dc2626'), padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>"""

A5_MOI = """                  <div title={kieuTon(product).chuThich} style={{ position: 'absolute', top: '4px', right: '4px', background: kieuTon(product).nen, color: kieuTon(product).chu, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>"""

# ══════════════════════════════════════════════════════════════════════
#  9 · Sales.jsx — chan them vao gio khi gia khong hop le (tuong minh)
# ══════════════════════════════════════════════════════════════════════
A4_CU = '''    if (!fromPkg && product.price <= 0) {'''

A4_MOI = '''    // POS-TONCU-v1: gia nay co the la null. `null <= 0` tinh ra true nen dong
    // cu VAN chan dung — nhung do la ep kieu ngam, doc khong ra. Viet tuong minh:
    // chi ban khi gia la SO va lon hon 0.
    if (!fromPkg && !(typeof product.price === 'number' && product.price > 0)) {'''


def main():
    print("=" * 70)
    print("  PATCH POS - POS-TONCU-v1  (bo so gia · ton gan nhat kem gio)")
    print("=" * 70)

    for f in TAT_CA:
        if not os.path.isfile(f):
            thoat(f"Khong thay {f}. Cua so nay khong phai POS?")

    noi = {f: open(f, encoding="utf-8").read() for f in TAT_CA}

    # ---- idempotent ----
    co = [f for f in TAT_CA if MARKER in noi[f]]
    if len(co) == len(TAT_CA):
        print("\n[BO QUA] Patch nay da duoc ap tu truoc (co marker o ca 4 file).")
        return
    if co:
        thoat(
            f"Marker chi co o {len(co)}/{len(TAT_CA)} file - lan chay truoc dut giua chung.\n"
            "       Khoi phuc ban luu roi chay lai:\n"
            + "\n".join(f"         cp {f}{HAU_TO} {f}" for f in TAT_CA)
        )

    # ---- phu thuoc ----
    print("\n[1/4] Kiem phu thuoc va 11 mo neo (CHUA ghi gi)")
    if "POS-VANTAY-v1" not in noi[F_DB]:
        thoat("Thieu POS-VANTAY-v1 trong database.js - phai ap patch do truoc.")
    if "van_tay" not in noi[F_SX]:
        thoat("sxApi.js chua co van tay - phai ap POS-VANTAY-v1 truoc.")
    print("   [ok] phu thuoc  POS-VANTAY-v1")

    moneo = [
        (F_DB, "diem chen 2 cot moi", D_CU),
        (F_DB, "cau lenh tao bang so no", D2_CU),
        (F_PROD, "loi goi SX thanh cong", P1_CU),
        (F_PROD, "duong lui gan ton 999", P2_CU),
        (F_PROD, "gop gia tu POS", P3_CU),
        (F_SX, "inStockReturn nuot loi", S_CU),
        (F_SALES, "tong ton tren tab", A1_CU),
        (F_SALES, "do mo o san pham", A2_CU),
        (F_SALES, "huy hieu ton", A3_CU),
        (F_SALES, "mau huy hieu ton", A5_CU),
        (F_SALES, "chan them vao gio khi thieu gia", A4_CU),
    ]
    for f, nhan, mo in moneo:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):14} {nhan}")

    # ---- luu ban truoc ----
    print("\n[2/4] Luu ban truoc khi sua")
    for f in TAT_CA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    # ---- ap ----
    print("\n[3/4] Ap 11 thay doi")
    noi[F_DB] = noi[F_DB].replace(D_CU, D_MOI + "\n  } catch (e) {\n    // Cot da ton tai — bo qua\n  }" if False else D_CU, 1)
    # chen khoi them cot NGAY SAU khoi try/catch cua van_tay
    moc_dong = D_CU + '''
  } catch (e) {
    // Cột đã tồn tại — bỏ qua
  }
'''
    if noi[F_DB].count(moc_dong) != 1:
        for f in TAT_CA:
            os.remove(f + HAU_TO)
        thoat("Khong tim thay diem dong khoi try/catch van_tay trong database.js.")
    noi[F_DB] = noi[F_DB].replace(moc_dong, moc_dong + D_THEM, 1)
    print("   [ok] database.js   them cot ton_gan_nhat + ton_luc")
    noi[F_DB] = noi[F_DB].replace(D2_CU, D2_MOI, 1)
    print("   [ok] database.js   VA: bang so no tao moi gio co san cot van_tay")

    for f, cu, moi, nhan in [
        (F_PROD, P1_CU, P1_MOI, "nho ton moi lan goi SX thanh cong"),
        (F_PROD, P2_CU, P2_MOI, "BO TON 999 · tra so cu kem gio"),
        (F_PROD, P3_CU, P3_MOI, "BO GIA 0 GIA · them co sellable"),
        (F_SX, S_CU, S_MOI, "hoan kho NEM LOI de so no duoc ghi"),
        (F_SALES, A1_CU, A1_MOI, "tong ton khong thanh NaN"),
        (F_SALES, A2_CU, A2_MOI, "chua ro ton thi khong lam mo o"),
        (F_SALES, A5_CU, A5_MOI, "MAU huy hieu: so cu VANG, chua ro XAM"),
        (F_SALES, A3_CU, A3_MOI, "huy hieu goi ham kieuTon"),
        (F_SALES, A4_CU, A4_MOI, "chan ban khi gia khong hop le"),
    ]:
        noi[f] = noi[f].replace(cu, moi, 1)
        print(f"   [ok] {os.path.basename(f):14} {nhan}")

    # ---- chot ----
    print("\n[4/4] Chot 18 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        ra = []
        for d in v.split("\n"):
            t = d.strip()
            if t.startswith("//") or t.startswith("*") or t.startswith("/*"):
                continue
            ra.append(d)
        return "\n".join(ra)

    ma = {f: bo_ghi_chu(noi[f]) for f in TAT_CA}

    chot = [
        ("stock_quantity: 999" not in ma[F_PROD],
         "KHONG con so ton 999 gia trong products.js"),

        ("999" not in ma[F_PROD],
         "KHONG con so 999 o bat ky dau trong products.js"),

        ("price: priceInfo?.price || 0" not in ma[F_PROD],
         "KHONG con gia 0 gia"),

        ("price: priceInfo?.price ?? null" in ma[F_PROD],
         "thieu gia thi tra null (dung ?? chu khong ||)"),

        ("sellable:" in ma[F_PROD],
         "co co sellable cho ben tieu thu"),

        ("ton_gan_nhat" in ma[F_PROD] and "ton_luc" in ma[F_PROD],
         "duong lui doc ton gan nhat kem gio"),

        ("UPDATE pos_products SET ton_gan_nhat" in ma[F_PROD],
         "goi SX thanh cong thi ghi lai ton"),

        ("ALTER TABLE pos_products ADD COLUMN ton_gan_nhat" in ma[F_DB]
         and "ALTER TABLE pos_products ADD COLUMN ton_luc" in ma[F_DB],
         "database.js them du 2 cot"),

        ("return null;" not in S_MOI and "throw err;" in ma[F_SX],
         "inStockReturn NEM LOI thay vi tra null"),

        (ma[F_SX].count("throw err;") >= 1,
         "hoan kho co lenh nem loi that su"),

        ("Number(p.stock_quantity) || 0" in ma[F_SALES],
         "man hinh: tong ton ep ve 0, khong ra NaN"),

        ("const kieuTon = (p) =>" in ma[F_SALES],
         "man hinh: mau va nhan huy hieu gom mot cho"),

        ("nen: '#fef3c7'" in ma[F_SALES],
         "man hinh: so CU ra mau VANG, khong xanh nhu so tuoi"),

        ("nen: '#f1f5f9'" in ma[F_SALES],
         "man hinh: CHUA RO ra mau XAM, khong do (do = het hang)"),

        ("background: kieuTon(product).nen" in ma[F_SALES],
         "man hinh: huy hieu that su dung mau tu kieuTon"),

        ("product.stock_quantity > 0 ? '#dcfce7'" not in ma[F_SALES],
         "man hinh: KHONG con duong cu to mau xanh cho so cu"),

        ("typeof product.price === 'number' && product.price > 0" in ma[F_SALES],
         "man hinh: chi ban khi gia la SO va lon hon 0"),

        ("resolved_at DATETIME,\n      van_tay TEXT" in ma[F_DB],
         "so no tao moi co san cot van_tay (chong tru kho lan hai)"),
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
    print("    node --check server/routes/products.js")
    print("    node --check server/database.js")
    print("    node --check server/utils/sxApi.js\n")
    print("  Duong lui:")
    for f in TAT_CA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
