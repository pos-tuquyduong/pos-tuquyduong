#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
POS-P20-v1 — MA TREN BILL CHI DUNG DUOC KHI BILL DA THANH TOAN  (viec P20)
================================================================================
Chay:  python3 patch_pos_P20_ma_bill_v1.py                 (o GOC kho POS)
       python3 patch_pos_P20_ma_bill_v1.py --chi-phep-kiem  (chi them phep kiem E9,
                                                            de chung minh no DO truoc khi va)
Lui :  cp server/routes/signup-codes.js.truoc_P20 server/routes/signup-codes.js
       cp kiem_tra_truoc_khi_giao.js.truoc_P20 kiem_tra_truoc_khi_giao.js

LO: bill "mang ra ban chua thu" van in ma. Khach dung duoc ma (doi voucher qua
/claim, nhan diem qua /nhan-diem) du CHUA tra tien.
  · /nhan-diem kiem don da huy nhung KHONG kiem payment_status.
  · /claim KHONG doc don chut nao — ke ca don da huy.

SUA: mot ham dung chung kiemDonCuaMa() (C15), goi o CA HAI duong, truoc moi
lenh ghi. Ma chi dung duoc khi: gan voi mot don · don chua huy · don da thu du
(payment_status='paid'). Khong doi viec in ma len bill, khong dong orders.js.

THEM phep kiem E9 vao bo kiem (chi THEM, khong sua phep cu).

F1: kiem HET moc neo truoc khi ghi bat ky file nao. F2: marker POS-P20-v1, chay
lai lan hai khong doi gi. F8: chi dung content.replace(), doc/ghi utf-8.
"""
import os
import shutil
import sys

MARKER = "POS-P20-v1"
CHI_PHEP_KIEM = "--chi-phep-kiem" in sys.argv

F_SC = "server/routes/signup-codes.js"
F_KT = "kiem_tra_truoc_khi_giao.js"

# ─── Moc neo signup-codes.js ────────────────────────────────────────────────
SC_NEO_HAM = "const DEFAULT_VALID_DAYS = 30;\n"
SC_HAM = SC_NEO_HAM + """
// ═══════════════════════════════════════════════════════════════════════════
//  POS-P20-v1 — mã in bill chỉ dùng được khi bill ĐÃ THANH TOÁN
//
//  Bill "mang ra bàn chưa thu" vẫn in mã. Trước đây khách dùng được mã (đổi
//  voucher qua /claim, nhận điểm qua /nhan-diem) khi chưa trả tiền; /claim còn
//  không đọc đơn — đơn đã huỷ vẫn claim được. Một hàm dùng chung cho CẢ HAI
//  đường (C15), gọi trước mọi lệnh ghi. Không đổi việc in mã lên bill.
//
//  Trả { don } nếu dùng được, hoặc { loi: { status, code, error } }.
// ═══════════════════════════════════════════════════════════════════════════
async function kiemDonCuaMa(dong) {
  if (!dong.order_id) {
    return { loi: { status: 400, code: 'MA_KHONG_GAN_DON', error: 'Mã này không gắn với đơn nào.' } };
  }
  const don = await queryOne(
    'SELECT id, code, total, status, payment_status FROM pos_orders WHERE id = ?',
    [dong.order_id],
  );
  if (!don) {
    return { loi: { status: 404, code: 'KHONG_THAY_DON', error: 'Không tìm thấy đơn của mã này.' } };
  }
  if (don.status === 'cancelled') {
    return { loi: { status: 400, code: 'DON_DA_HUY', error: 'Đơn của mã này đã bị huỷ, mã không dùng được.' } };
  }
  if (don.payment_status !== 'paid') {
    return { loi: { status: 400, code: 'BILL_CHUA_THANH_TOAN', error: 'Mã dùng được sau khi bill được thanh toán.' } };
  }
  return { don };
}
"""

SC_NEO_NHANDIEM = """    if (!dong.order_id) {
      return res.status(400).json({ success: false, error: 'Mã này không gắn với đơn nào.' });
    }
    const don = await queryOne(
      'SELECT id, code, total, status FROM pos_orders WHERE id = ?',
      [dong.order_id],
    );
    if (!don) return res.status(404).json({ success: false, error: 'Không tìm thấy đơn của mã này.' });
    if (don.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Đơn của mã này đã bị huỷ, không nhận điểm được.',
        code: 'DON_DA_HUY',
      });
    }
"""
SC_NHANDIEM = """    // POS-P20-v1: gắn đơn · chưa huỷ · ĐÃ THANH TOÁN — cùng một hàm với /claim.
    const kqDon = await kiemDonCuaMa(dong);
    if (kqDon.loi) {
      return res.status(kqDon.loi.status).json({ success: false, error: kqDon.loi.error, code: kqDon.loi.code });
    }
    const don = kqDon.don;
"""

SC_NEO_CLAIM = """    if (claimedBefore) {
      return res.status(400).json({ success: false, error: 'Số điện thoại này đã từng nhận ưu đãi khách mới' });
    }
"""
SC_CLAIM = SC_NEO_CLAIM + """
    // POS-P20-v1: gắn đơn · chưa huỷ · ĐÃ THANH TOÁN — cùng một hàm với /nhan-diem.
    // Đặt sau các phép kiểm hạn / SĐT (thứ tự lời báo giống /nhan-diem), TRƯỚC khi phát voucher.
    const kqDon = await kiemDonCuaMa(signupRow);
    if (kqDon.loi) {
      return res.status(kqDon.loi.status).json({ success: false, error: kqDon.loi.error, code: kqDon.loi.code });
    }
"""

# ─── Moc neo kiem_tra_truoc_khi_giao.js ─────────────────────────────────────
KT_NEO = """// ═══════════════════════════════════════════════════════════════════════════
nhom('F · VỆ SINH REPO');"""
KT_E9 = """// E9 — POS-P20-v1: mã in trên bill chỉ dùng được khi bill ĐÃ THANH TOÁN.
// Bill "mang ra bàn chưa thu" vẫn in mã; /claim từng không đọc đơn (đơn huỷ vẫn
// đổi được voucher), /nhan-diem không kiểm payment_status. Mỗi đường dùng mã
// phải gọi kiemDonCuaMa TRƯỚC lệnh ghi đầu tiên, và hàm đó phải chặn đơn huỷ +
// đơn chưa 'paid'. Bài chạy thật: node cong_cu/thu_P20.js
{
  const src = boGhiChu(doc('server/routes/signup-codes.js'));
  const khoi = (ten) => {
    const a = src.indexOf(`router.post('${ten}'`);
    return a < 0 ? '' : src.slice(a, src.indexOf('router.', a + 20));
  };
  for (const ten of ['/claim', '/nhan-diem']) {
    const k = khoi(ten);
    const goi = k.indexOf('kiemDonCuaMa(');
    const ghi = [k.indexOf('beginTransaction('), k.indexOf('UPDATE pos_signup_codes')].filter((i) => i >= 0);
    const ghiDau = ghi.length ? Math.min(...ghi) : Infinity;
    chac(`${ten}: kiểm đơn của mã (chưa huỷ, đã thanh toán) TRƯỚC lệnh ghi`,
      k !== '' && goi >= 0 && goi < ghiDau,
      'khách dùng được mã in trên bill khi bill chưa trả tiền hoặc đã huỷ');
  }
  const a = src.indexOf('function kiemDonCuaMa');
  const than = a < 0 ? '' : src.slice(a, src.indexOf('\\n}', a));
  chac('kiemDonCuaMa chặn đơn đã huỷ và đơn chưa thanh toán đủ',
    /status\\s*===\\s*'cancelled'/.test(than) && /payment_status\\s*!==\\s*'paid'/.test(than),
    'thiếu điều kiện cancelled hoặc payment_status !== \\'paid\\'');
}

""" + KT_NEO


def doc(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def ghi(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def main():
    if not os.path.exists("package.json") or not os.path.exists(F_SC):
        sys.exit("✖ Chay o GOC kho POS (canh package.json).")

    sc, kt = doc(F_SC), doc(F_KT)
    lam_sc = MARKER not in sc and not CHI_PHEP_KIEM
    lam_kt = MARKER not in kt

    # F1 — kiem HET moc neo truoc khi ghi bat ky file nao.
    thieu = []
    if lam_sc:
        for ten, neo in (("ham", SC_NEO_HAM), ("nhan-diem", SC_NEO_NHANDIEM), ("claim", SC_NEO_CLAIM)):
            if sc.count(neo) != 1:
                thieu.append(f"{F_SC}: moc '{ten}' xuat hien {sc.count(neo)} lan (can dung 1)")
    if lam_kt and kt.count(KT_NEO) != 1:
        thieu.append(f"{F_KT}: moc nhom F xuat hien {kt.count(KT_NEO)} lan (can dung 1)")
    if thieu:
        sys.exit("✖ KHONG sua gi — moc neo lech:\n  " + "\n  ".join(thieu))

    if lam_kt:
        if not os.path.exists(F_KT + ".truoc_P20"):
            shutil.copy2(F_KT, F_KT + ".truoc_P20")
        ghi(F_KT, kt.replace(KT_NEO, KT_E9))
        print(f"✓ {F_KT}: them phep kiem E9")
    else:
        print(f"· {F_KT}: da co E9, bo qua")

    if CHI_PHEP_KIEM:
        print("· --chi-phep-kiem: KHONG va signup-codes.js")
        return
    if lam_sc:
        if not os.path.exists(F_SC + ".truoc_P20"):
            shutil.copy2(F_SC, F_SC + ".truoc_P20")
        sc = sc.replace(SC_NEO_HAM, SC_HAM)
        sc = sc.replace(SC_NEO_NHANDIEM, SC_NHANDIEM)
        sc = sc.replace(SC_NEO_CLAIM, SC_CLAIM)
        ghi(F_SC, sc)
        print(f"✓ {F_SC}: kiemDonCuaMa + goi o /nhan-diem va /claim")
    else:
        print(f"· {F_SC}: da va, bo qua")


if __name__ == "__main__":
    main()
