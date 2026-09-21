#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
POS-CHUATHU-v1 — ĐƠN CHƯA THU CHO KHÁCH LẺ
================================================================================
Chay:  python3 patch_pos_chuathu_v1.py     (o goc kho POS, canh package.json)
Lui :  bash lui_CHUATHU.sh                 (patch tu sinh ra tep nay)

VAN DE
  Khach dung truoc quay phai nhan bill roi moi tra tien. Nhung man ban hang bat
  khai DA THU TIEN xong moi ghi duoc don:
    · nut "Ghi no" boc trong dieu kien {customer && (...)}  (Sales.jsx ~1994)
    · handleSubmit chan thang: khong co khach thi khong ghi no duoc (~665)
  -> KHACH LE KHONG TAO DUOC DON CHUA THU.

  May chu thi KHONG doi khach: no chi nhin debt_amount roi tu dat payment_status
  (orders.js 726-734), va phep doi chieu tong tien khong quan tam cach tra
  (orders.js 745-755). Duong thu tien sau da co san: POST /orders/:id/pay-debt
  (orders.js 1220) — dung cho webhook payOS goi sau nay. Trang Don hang da co
  3 tab Da TT / Chua TT / No va nut "Xac nhan thanh toan" hien khi
  debt_amount > 0 && payment_status != 'paid', KHONG doi khach (Orders.jsx 979).

  Rao chan nam o MAN HINH, khong phai o may chu. Nen patch nay CHI sua client.

CACH SUA — cong them, khong viet lai
  Them MOT co moi `choThuTaiQuay`, dung kem `isDebt` san co:
      isDebt = true            -> phan con lai chua thu (co san, khong doi)
      choThuTaiQuay = true     -> day la khach dung cho tra, KHONG phai no khach quen

  Moi duong `isDebt` cu giu nguyen hanh vi. Nut "Ghi no" cu chay y het truoc.

  Khac nhau giua hai kieu — phai nhin thay duoc, neu khong cuoi ca khong biet
  don nao phai di doi:
      Ghi no    : can co khach · co han thanh toan · payment_method 'debt'
      Chua thu  : khach le cung duoc · khong han · payment_method 'cho_thu'

  KHONG them bang, KHONG them trang thai, KHONG doi cau truc du lieu.
  `payment_method` la cot TEXT khong rang buoc (database.js 174), may chu khong
  co danh sach trang, va man Don hang co nhanh bieu tuong mac dinh — nen them
  mot gia tri moi khong gay cho nao.

VI SAO LAM TRUOC P3 (ma QR payOS)
  Lam xong thi P3 chi con mot viec: goi payOS roi cho webhook goi vao duong
  pay-debt DA CHAY THAT ngoai quay may hom. Gop chung thi vua dung trang thai
  moi vua noi cong tien cung luc, ma payOS lai KHONG co moi truong thu.

KHONG LAM TRONG PATCH NAY
  · Ma QR tren bill: la P3, can H1 xong truoc.
  · Man "don chua thu" rieng: trang Don hang da co tab Chua TT va o dem.
  · Nho co khong_quan_kho de hien chu luc mat mang: tach ra patch rieng cho gon.

SAU KHI CHAY
  BAT BUOC: cd client && npm run build && cd ..
  Patch nay dung client/src/** — quen build la loi AM THAM, Render chay ban cu.
"""

import hashlib
import io
import os
import shutil
import sys

MA_PATCH = "POS-CHUATHU-v1"
MA_VIEC = "P12"

SALES = "client/src/pages/Sales.jsx"
ORDERS = "client/src/pages/Orders.jsx"
BILL = "client/src/components/InvoicePreview.jsx"

# ══════════════════════════════════════════════════════════════════════════
# Cac cap sua: (tep, ten, chuoi cu, chuoi moi)
# ══════════════════════════════════════════════════════════════════════════
CAP = []

# ── 1. Co moi, dat ngay canh isDebt ──────────────────────────────────────
CAP.append((SALES, "khai_bao_co", """  const [isDebt, setIsDebt] = useState(false);                // Có ghi nợ không
  const [dueDate, setDueDate] = useState('');                 // Hạn thanh toán""",
"""  const [isDebt, setIsDebt] = useState(false);                // Có ghi nợ không
  const [dueDate, setDueDate] = useState('');                 // Hạn thanh toán
  // POS-CHUATHU-v1: khách đứng trước quầy chờ trả, KHÁC với nợ khách quen.
  // Luôn đi kèm isDebt=true (phần còn lại chưa thu). Cờ này chỉ quyết định:
  // có đòi khách hàng không · có hỏi hạn thanh toán không · ghi payment_method nào.
  const [choThuTaiQuay, setChoThuTaiQuay] = useState(false);
  // Hai câu hỏi, mỗi câu MỘT chỗ trả lời — sửa ở đây là mọi nơi đổi theo:
  const laGhiNo = isDebt && !choThuTaiQuay;          // nợ khách quen (có hạn, cần khách)
  const cachGhiSo = isDebt                           // chữ ghi vào cột payment_method
    ? (choThuTaiQuay ? 'cho_thu' : 'debt')
    : paymentMethod;"""))

# ── 2-5. Dat lai co o 4 cho reset (di kem setIsDebt(false) san co) ───────
CAP.append((SALES, "reset_doi_khach", """    setParentBalanceToUse(0);
    setIsDebt(false);
    setActivePkgId(null);
    // POS-DOIKHACH-v1""",
"""    setParentBalanceToUse(0);
    setIsDebt(false);
    setChoThuTaiQuay(false);   // POS-CHUATHU-v1
    setActivePkgId(null);
    // POS-DOIKHACH-v1"""))

CAP.append((SALES, "reset_bo_khach", """    setIsDebt(false);
    setPaymentMethod('cash');
    setActivePkgId(null);""",
"""    setIsDebt(false);
    setChoThuTaiQuay(false);   // POS-CHUATHU-v1
    setPaymentMethod('cash');
    setActivePkgId(null);"""))

CAP.append((SALES, "reset_mo_popup", """    setIsDebt(false);
    setDueDate('');
    setShowPaymentModal(true);""",
"""    setIsDebt(false);
    setChoThuTaiQuay(false);   // POS-CHUATHU-v1
    setDueDate('');
    setShowPaymentModal(true);"""))

CAP.append((SALES, "reset_sau_don", """      setIsDebt(false);
      setDueDate('');
      // === Phase B: Reset chiết khấu + shipping ===""",
"""      setIsDebt(false);
      setChoThuTaiQuay(false);   // POS-CHUATHU-v1
      setDueDate('');
      // === Phase B: Reset chiết khấu + shipping ==="""))

# ── 6-7. Hai nut tra tien thuong cung phai tat co ────────────────────────
CAP.append((SALES, "nut_tien_mat", """                  onClick={() => { setPaymentMethod('cash'); setIsDebt(false); }}""",
"""                  onClick={() => { setPaymentMethod('cash'); setIsDebt(false); setChoThuTaiQuay(false); }}"""))

CAP.append((SALES, "nut_chuyen_khoan", """                  onClick={() => { setPaymentMethod('transfer'); setIsDebt(false); }}""",
"""                  onClick={() => { setPaymentMethod('transfer'); setIsDebt(false); setChoThuTaiQuay(false); }}"""))

# ── 8. Nut moi + nut Ghi no cu phai tat co ───────────────────────────────
CAP.append((SALES, "nut_moi", """                {customer && (
                  <button
                    onClick={() => { setIsDebt(true); setPaymentMethod('debt'); }}""",
"""                {/* POS-CHUATHU-v1: khách lẻ cũng tạo được đơn chưa thu.
                    Không đòi khách hàng, không hỏi hạn — bill in ra rồi thu sau. */}
                <button
                  onClick={() => {
                    setIsDebt(true);
                    setChoThuTaiQuay(true);
                    setPaymentMethod('debt');
                    setDueDate('');   // lỡ bấm Ghi nợ trước rồi đổi ý thì bỏ hạn cũ đi
                  }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem',
                    border: '2px solid',
                    borderColor: choThuTaiQuay ? '#0ea5e9' : '#e2e8f0',
                    background: choThuTaiQuay ? '#0ea5e9' : 'white',
                    color: choThuTaiQuay ? 'white' : '#333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  <Printer size={18} /> Chưa thu
                </button>
                {customer && (
                  <button
                    onClick={() => { setIsDebt(true); setChoThuTaiQuay(false); setPaymentMethod('debt'); }}"""))

# ── 9. Vien nut Ghi no: chi sang khi la no THAT ──────────────────────────
CAP.append((SALES, "vien_nut_ghino", """                      borderColor: isDebt ? '#f97316' : '#e2e8f0',
                      background: isDebt ? '#f97316' : 'white',
                      color: isDebt ? 'white' : '#333',""",
"""                      borderColor: laGhiNo ? '#f97316' : '#e2e8f0',
                      background: laGhiNo ? '#f97316' : 'white',
                      color: laGhiNo ? 'white' : '#333',"""))

# ── 10. Khong doi khach khi la chua thu tai quay ─────────────────────────
CAP.append((SALES, "bo_doi_khach", """    } else {
      // Nếu ghi nợ, cần có khách hàng
      if (!customer) {
        setError('Vui lòng chọn khách hàng để ghi nợ');
        return;
      }
    }""",
"""    } else if (!choThuTaiQuay) {
      // Ghi nợ khách quen: bắt buộc có khách để còn biết đòi ai.
      // POS-CHUATHU-v1: "chưa thu tại quầy" thì KHÔNG đòi — khách đang đứng đó,
      // và máy chủ vốn không yêu cầu khách (orders.js 726-734).
      if (!customer) {
        setError('Vui lòng chọn khách hàng để ghi nợ');
        return;
      }
    }"""))

# ── 11. payment_method gui len ───────────────────────────────────────────
CAP.append((SALES, "payment_method_payload", """        payment_method: isDebt ? 'debt' : paymentMethod,""",
"""        // POS-CHUATHU-v1: phân biệt "chưa thu tại quầy" với "nợ khách quen".
        // Cùng vào payment_status='pending', nhưng cuối ca phải nhìn ra đơn nào
        // cần đi đòi và đơn nào chỉ là khách chưa kịp quét mã.
        payment_method: cachGhiSo,"""))

# ── 12. Man hinh thanh cong ghi dung kieu ────────────────────────────────
CAP.append((SALES, "successinfo", """        paymentMethod: isDebt ? 'debt' : paymentMethod,""",
"""        paymentMethod: cachGhiSo,   // POS-CHUATHU-v1: cùng một nguồn với payload"""))

# ── 13. O han thanh toan: chi hien khi la no THAT ────────────────────────
CAP.append((SALES, "o_han_thanh_toan", """          {/* 5. Hạn thanh toán (nếu ghi nợ) */}
          {isDebt && (""",
"""          {/* 5. Hạn thanh toán (nếu ghi nợ) — POS-CHUATHU-v1: không hỏi hạn cho
              đơn chưa thu tại quầy, khách đang đứng chờ chứ không hẹn ngày trả */}
          {laGhiNo && ("""))

# ── 14. Nut xac nhan: chu va mau ─────────────────────────────────────────
CAP.append((SALES, "nut_xac_nhan", """                : isDebt ? '#f97316' : '#22c55e',""",
"""                : choThuTaiQuay ? '#0ea5e9' : isDebt ? '#f97316' : '#22c55e',"""))

CAP.append((SALES, "chu_nut_xac_nhan", """            {submitting ? 'Đang xử lý...' : isDebt ? '📝 Tạo đơn ghi nợ' : '✓ Xác nhận thanh toán'}""",
"""            {submitting
              ? 'Đang xử lý...'
              : choThuTaiQuay
                ? '🧾 Tạo đơn — chưa thu'
                : isDebt
                  ? '📝 Tạo đơn ghi nợ'
                  : '✓ Xác nhận thanh toán'}"""))

# ── 15. Bill: goi dung ten ───────────────────────────────────────────────
CAP.append((BILL, "chu_tren_bill", """              <span>  Ghi nợ:</span>
              <span>{formatCurrency(data.debt_amount)}</span>""",
"""              {/* POS-CHUATHU-v1: cùng một dòng tiền, hai ý nghĩa khác nhau.
                  Đưa cho khách đang đứng chờ tờ bill ghi "Ghi nợ" là sai. */}
              <span>  {data.payment_method === 'cho_thu' ? 'CHƯA THU:' : 'Ghi nợ:'}</span>
              <span>{formatCurrency(data.debt_amount)}</span>"""))

# ── 15b. Dong tom tat trong popup — duong song song cua muc 15.
# Bill goi dung ten roi ma cho nay van ghi "Ghi no", nhan vien nhin thay no
# NGAY TRUOC khi bam xac nhan. Cung mot khuon loi, cach nhau 60 dong (K4).
CAP.append((SALES, "chu_dong_tom_tat", """                <span style={{ color: '#ea580c' }}>Ghi nợ</span>
                <span style={{ color: '#ea580c' }}>{formatPrice(remainingAfterBalance)}</span>""",
"""                <span style={{ color: choThuTaiQuay ? '#0284c7' : '#ea580c' }}>
                  {choThuTaiQuay ? 'Chưa thu' : 'Ghi nợ'}
                </span>
                <span style={{ color: choThuTaiQuay ? '#0284c7' : '#ea580c' }}>{formatPrice(remainingAfterBalance)}</span>"""))

# ── 15c. Dong "Thanh toan:" tren bill — duong song song THU HAI cua bill.
# Danh sach ten khong co 'cho_thu' thi roi xuong nhanh cuoi, in NGUYEN VAN chu goc:
# khach cam bill doc thay "Thanh toan: cho_thu". Cach dong "Ghi no:" ~30 dong (K4).
CAP.append((BILL, "ten_cach_tra_tren_bill", """               data.payment_method === 'debt' ? '📝 Ghi nợ' :""",
"""               data.payment_method === 'debt' ? '📝 Ghi nợ' :
               data.payment_method === 'cho_thu' ? '🧾 Chưa thu' :"""))


def doc(t):
    return io.open(t, encoding="utf-8").read()


def main():
    print("=" * 74)
    print("  %s — DON CHUA THU CHO KHACH LE" % MA_PATCH)
    print("=" * 74)

    # ORDERS khong co cap nao nhung van bi sua (them bieu tuong) -> phai co trong danh sach
    tep_can = sorted(set([t for t, _, _, _ in CAP] + [ORDERS]))
    thieu = [t for t in tep_can if not os.path.exists(t)]
    if thieu:
        print("\n[DUNG] Khong thay: %s" % ", ".join(thieu))
        print("       Chay patch nay o GOC kho POS (canh package.json).")
        return 1

    goc = {t: doc(t) for t in tep_can}

    # ── Phep chot 1: da chay roi thi thoi ────────────────────────────────
    if any(MA_PATCH in v for v in goc.values()):
        print("\n[BO QUA] %s da co trong ma nguon — khong lam gi." % MA_PATCH)
        print("         Muon va lai: bash lui_CHUATHU.sh roi chay lai.")
        return 0

    # ── Phep chot 2: nhung thu patch dua vao phai con nguyen ────────────
    dk = []
    if "getPaymentIcon" not in goc[ORDERS]:
        dk.append("Orders.jsx thieu getPaymentIcon")
    if "payment_method" not in goc[BILL]:
        dk.append("InvoicePreview.jsx khong nhan payment_method")
    if dk:
        print("\n[DUNG] %s" % " · ".join(dk))
        return 1

    # ── Phep chot 3: moi mo neo dung 1 lan ───────────────────────────────
    print("\nKiem mo neo:")
    hong = []
    for t, ten, cu, _m in CAP:
        n = goc[t].count(cu)
        print("  [%s] %-22s %d lan   %s" % ("OK " if n == 1 else "SAI", ten, n, os.path.basename(t)))
        if n != 1:
            hong.append("%s (%d lan)" % (ten, n))
    if hong:
        print("\n[DUNG] %d mo neo khong khop: %s" % (len(hong), ", ".join(hong)))
        print("       KHONG ghi gi ca. Moi tep nguyen ven.")
        return 1

    # ── Va trong bo nho ──────────────────────────────────────────────────
    moi = dict(goc)
    for t, _ten, cu, m in CAP:
        moi[t] = moi[t].replace(cu, m, 1)

    # ── Them bieu tuong cho kieu moi o trang Don hang ────────────────────
    # Lam rieng vi phai doc nhanh 'debt' de bat chuoc dung khuon dang co.
    src = moi[ORDERS]
    i = src.find("const getPaymentIcon")
    j = src.find("case 'debt'", i)
    if j == -1:
        j = src.find('case "debt"', i)
    if i == -1 or j == -1:
        print("\n[DUNG] Khong tim duoc nhanh 'debt' trong getPaymentIcon — khong ghi gi.")
        return 1
    dong_dau = src.rfind("\n", 0, j) + 1
    thut = src[dong_dau:j]
    themvao = ("%scase 'cho_thu': return '\\u23f3';   // POS-CHUATHU-v1: cho khach tra tai quay\n" % thut)
    moi[ORDERS] = src[:dong_dau] + themvao + src[dong_dau:]

    # ── Phep chot 4: kiem ket qua TRUOC khi ghi ──────────────────────────
    loi = []
    for t in tep_can:
        if moi[t] == goc[t]:
            loi.append("%s khong doi gi" % os.path.basename(t))
    s = moi[SALES]
    # Dem chinh xac, khong dat nguong bang cach doan (khuon K2 trong so loi):
    #   tat co o 7 cho — 4 cho reset + nut Tien mat + nut Chuyen khoan + nut Ghi no
    #   bat co o 1 cho — dung nut Chua thu moi
    n_tat = s.count("setChoThuTaiQuay(false)")
    n_bat = s.count("setChoThuTaiQuay(true)")
    if n_tat != 7:
        loi.append("phai tat co o dung 7 cho, dang co %d" % n_tat)
    if n_bat != 1:
        loi.append("phai bat co o dung 1 cho, dang co %d" % n_bat)
    if s.count("const [choThuTaiQuay") != 1:
        loi.append("co choThuTaiQuay phai khai bao dung 1 lan")
    if "'cho_thu'" not in s:
        loi.append("Sales.jsx chua gui payment_method 'cho_thu'")
    if moi[ORDERS].count("case 'cho_thu'") != 1:
        loi.append("Orders.jsx phai co dung 1 nhanh bieu tuong cho_thu")
    if moi[BILL].count("CHƯA THU:") != 1:
        loi.append("Bill chua doi chu")
    if s.count("'Chưa thu' : 'Ghi nợ'") != 1:
        loi.append("dong tom tat trong popup chua doi chu")
    # K10 — moi cau hoi MOT cho tra loi
    if s.count("const laGhiNo") != 1 or s.count("const cachGhiSo") != 1:
        loi.append("laGhiNo / cachGhiSo phai khai bao dung 1 lan")
    if s.count("isDebt && !choThuTaiQuay") != 1:
        loi.append("bieu thuc 'isDebt && !choThuTaiQuay' con lap %d lan" % s.count("isDebt && !choThuTaiQuay"))
    if s.count("choThuTaiQuay ? 'cho_thu' : 'debt'") != 1:
        loi.append("cong thuc chon payment_method con lap o nhieu cho")
    # K4 — ca HAI dong tren bill phai goi dung ten
    if moi[BILL].count("'cho_thu' ? '🧾 Chưa thu'") != 1:
        loi.append("dong 'Thanh toan:' tren bill van in chu goc 'cho_thu'")
    if "<Printer size={18} /> Chưa thu" not in s:
        loi.append("nut Chua thu phai co bieu tuong rieng, khong trung nut Ghi no")
    # Duong cu phai con nguyen: nut Ghi no van doi khach
    if "Vui lòng chọn khách hàng để ghi nợ" not in s:
        loi.append("mat phep chan 'phai co khach de ghi no' — duong Ghi no cu bi hong")
    # Luat banh coc: khong duoc them fetch tran
    for t in tep_can:
        if moi[t].count("fetch(") > goc[t].count("fetch("):
            loi.append("%s them loi goi fetch tran — vi pham luat banh coc" % os.path.basename(t))

    if loi:
        print("\n[DUNG] Ket qua khong dat:")
        for x in loi:
            print("   - %s" % x)
        print("       KHONG ghi gi ca. Moi tep nguyen ven.")
        return 1

    # ── Ban luu + duong lui ──────────────────────────────────────────────
    for t in tep_can:
        shutil.copy2(t, t + ".truoc_CHUATHU")
    with io.open("lui_CHUATHU.sh", "w", encoding="utf-8") as f:
        f.write("#!/usr/bin/env bash\n# Duong lui cua %s\nset -e\n" % MA_PATCH)
        for t in tep_can:
            f.write('cp "%s.truoc_CHUATHU" "%s"\n' % (t, t))
        f.write('echo "Da tra 3 tep ve ban truoc patch. Nho: cd client && npm run build && cd .."\n')

    for t in tep_can:
        io.open(t, "w", encoding="utf-8").write(moi[t])

    print("\nDa ghi %d tep:" % len(tep_can))
    for t in tep_can:
        b = io.open(t, "rb").read()
        print("  %-42s %s  %d byte" % (t, hashlib.sha256(b).hexdigest()[:16], len(b)))
    print("  Ban luu: *.truoc_CHUATHU   ·   Duong lui: bash lui_CHUATHU.sh")

    try:
        sys.path.insert(0, os.getcwd())
        from dong_tien_do import ghi_tien_do
        ghi_tien_do(MA_VIEC, MA_PATCH)
    except Exception as e:
        print("  [tien do] khong goi duoc dong_tien_do.py (%s) — bo qua" % e)

    print("""
──────────────────────────────────────────────────────────────────────────
VIEC TIEP THEO — dung thu tu

  1. node cong_cu/do_chuathu.js               ← phai 16 dat · 0 hong
  2. cd client && npm run build && cd ..      ← BAT BUOC. Quen la loi AM THAM
  3. node kiem_tra_truoc_khi_giao.js          ← phai 31 dat · 0 loi
  4. THU TAY o quay, 5 ca — xem huong dan trong doan chat

DUONG LUI
  bash lui_CHUATHU.sh   roi build lai.
──────────────────────────────────────────────────────────────────────────
""")
    return 0


if __name__ == "__main__":
    sys.exit(main())
