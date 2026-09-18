# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P5 - POS-MADON-v1   (ma don theo so thu tu, khong con trung)
======================================================================

VAN DE
  helpers.js:8   ma don = ORD-<ngay>-<3 so NGAU NHIEN>
  database.js    `code TEXT UNIQUE NOT NULL`

  1.000 kha nang moi ngay. Ban 40 don thi hon NUA so ngay co trung
  (bai toan sinh nhat: 1 - e^(-40x39/2000) ~ 54%).
  Trung thi INSERT vi pham UNIQUE -> ca giao dich bi huy -> don BI TU CHOI
  giua luc khach dang dung cho, va nhan vien khong hieu vi sao.

  Chua xay ra vi luong don con thap. Se xay ra khi ban dong hon.

SUA THE NAO
  Doi sang SO THU TU trong ngay: ORD-20260917-001, -002, -003...
  · Khong bao gio trung — moi don lay so ke tiep
  · De doc, de doi chieu: "don thu 15 hom nay"
  · Qua 999 don/ngay van chay (thanh -1000), khong vo

  Chong hai don cung luc (hiem o 1 quay nhung van phai chan): sau khi tinh
  so ke tiep, KIEM xem ma do co ai lay chua; co roi thi lay so tiep theo,
  thu toi da 30 lan. Het 30 lan thi dung ma theo mili giay — xau nhung
  KHONG BAO GIO chan duoc ca ban hang.

DIEU PATCH NAY CO TINH KHONG LAM
  Khong doi ma cac don DA CO. Don cu giu nguyen ma ngau nhien cua no.
  Ma moi va ma cu song chung duoc vi deu cung dang ORD-<ngay>-<so>.

CHU Y
  Chi dung 2 file may chu — KHONG can build lai client.

DUONG LUI
  cp server/utils/helpers.js.truoc_madon  server/utils/helpers.js
  cp server/routes/orders.js.truoc_madon  server/routes/orders.js
"""

import os
import sys
import shutil

MARKER = "POS-MADON-v1"
HAU_TO = ".truoc_madon"

F_HELP = os.path.join("server", "utils", "helpers.js")
F_ORD = os.path.join("server", "routes", "orders.js")
TAT_CA = [F_HELP, F_ORD]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · helpers.js — them ham sinh ma theo so thu tu
# ══════════════════════════════════════════════════════════════════════
H_CU = """/**
 * Tạo mã QR từ SĐT: QR-0901234567
 */"""

H_MOI = """/**
 * POS-MADON-v1 — Tạo mã đơn theo SỐ THỨ TỰ trong ngày: ORD-YYYYMMDD-001
 *
 * Thay cho `generateOrderCode()` bốc ngẫu nhiên 3 số: chỉ 1.000 khả năng mỗi
 * ngày, bán 40 đơn là hơn nửa số ngày có trùng. Cột `code` có UNIQUE nên
 * trùng = đơn BỊ TỪ CHỐI lúc ghi, giữa lúc khách đang đứng chờ.
 *
 * Nhận `queryOne` từ nơi gọi để không tạo phụ thuộc vòng giữa helpers và
 * database (helpers hiện không nạp database, giữ nguyên như vậy).
 */
async function taoMaDonTheoSo(queryOne) {
  const ngay = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
    .replace(/-/g, "");
  const dau = `ORD-${ngay}-`;

  // Số lớn nhất đã dùng hôm nay. Đơn CŨ mang mã ngẫu nhiên cũng cùng dạng
  // nên vẫn đếm được — mã mới luôn lớn hơn mọi mã cũ trong ngày.
  let ke = 1;
  try {
    const rows = await queryOne(
      `SELECT code FROM pos_orders WHERE code LIKE ? ORDER BY LENGTH(code) DESC, code DESC LIMIT 1`,
      [`${dau}%`],
    );
    if (rows && rows.code) {
      const phan = String(rows.code).slice(dau.length);
      const so = parseInt(phan, 10);
      if (Number.isFinite(so)) ke = so + 1;
    }
  } catch (e) {
    // Đọc hỏng thì bắt đầu từ 1 rồi để vòng dưới tự tránh trùng.
    console.error("Khong doc duoc ma don gan nhat:", e.message);
  }

  // Hai đơn cùng lúc có thể cùng tính ra một số. Hiếm ở một quầy nhưng vẫn
  // phải chặn: thử số kế tiếp cho tới khi tìm được mã chưa ai lấy.
  for (let i = 0; i < 30; i++) {
    const ma = dau + String(ke + i).padStart(3, "0");
    try {
      const da = await queryOne("SELECT id FROM pos_orders WHERE code = ?", [ma]);
      if (!da) return ma;
    } catch (e) {
      return ma; // không kiểm được thì cứ dùng, UNIQUE là chốt cuối
    }
  }

  // Hết 30 lần: dùng mã theo mili giây. Xấu nhưng KHÔNG BAO GIỜ được để
  // việc sinh mã chặn một ca bán thật.
  return dau + String(Date.now()).slice(-6);
}

/**
 * Tạo mã QR từ SĐT: QR-0901234567
 */"""

H_EXPORT_CU = """module.exports = {
  generateOrderCode,"""

H_EXPORT_MOI = """module.exports = {
  generateOrderCode,
  taoMaDonTheoSo, // POS-MADON-v1"""

# ══════════════════════════════════════════════════════════════════════
#  2 · orders.js — dung ham moi
# ══════════════════════════════════════════════════════════════════════
O1_CU = """  generateOrderCode,"""
O1_MOI = """  generateOrderCode,
  taoMaDonTheoSo, // POS-MADON-v1"""

O2_CU = """    const orderCode = generateOrderCode();"""
O2_MOI = """    // POS-MADON-v1: so thu tu trong ngay thay cho 3 so ngau nhien.
    // Ngau nhien chi co 1.000 kha nang/ngay -> ban 40 don la hon nua so ngay
    // co trung -> UNIQUE chan -> don bi tu choi giua luc khach dang cho.
    const orderCode = await taoMaDonTheoSo(queryOne);"""


def main():
    print("=" * 70)
    print("  PATCH P5 - POS-MADON-v1  (ma don theo so thu tu)")
    print("=" * 70)

    for f in TAT_CA:
        if not os.path.isfile(f):
            thoat(f"Khong thay {f}. Cua so nay khong phai POS?")

    noi = {f: open(f, encoding="utf-8").read() for f in TAT_CA}

    co = [f for f in TAT_CA if MARKER in noi[f]]
    if len(co) == len(TAT_CA):
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return
    if co:
        thoat(
            f"Marker chi co o {len(co)}/{len(TAT_CA)} file - lan chay truoc dut giua chung.\n"
            + "\n".join(f"         cp {f}{HAU_TO} {f}" for f in TAT_CA)
        )

    print("\n[1/4] Kiem phu thuoc va 4 mo neo (CHUA ghi gi)")
    if "queryOne" not in noi[F_ORD]:
        thoat("orders.js khong co queryOne — file khong dung nhu mong doi.")
    print("   [ok] orders.js co san queryOne de truyen vao")

    for f, nhan, mo in [
        (F_HELP, "diem chen ham moi", H_CU),
        (F_HELP, "danh sach xuat khau", H_EXPORT_CU),
        (F_ORD, "dong nap ham tu helpers", O1_CU),
        (F_ORD, "cho sinh ma don", O2_CU),
    ]:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):12} {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    for f in TAT_CA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    print("\n[3/4] Ap 4 thay doi")
    noi[F_HELP] = noi[F_HELP].replace(H_CU, H_MOI, 1)
    print("   [ok] helpers.js   them ham sinh ma theo so thu tu")
    noi[F_HELP] = noi[F_HELP].replace(H_EXPORT_CU, H_EXPORT_MOI, 1)
    print("   [ok] helpers.js   xuat khau ham moi")
    noi[F_ORD] = noi[F_ORD].replace(O1_CU, O1_MOI, 1)
    print("   [ok] orders.js    nap ham moi")
    noi[F_ORD] = noi[F_ORD].replace(O2_CU, O2_MOI, 1)
    print("   [ok] orders.js    dung so thu tu thay cho ngau nhien")

    print("\n[4/4] Chot 12 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = {f: bo_ghi_chu(noi[f]) for f in TAT_CA}

    chot = [
        ("async function taoMaDonTheoSo(queryOne)" in ma[F_HELP],
         "co ham sinh ma moi"),

        ("const orderCode = await taoMaDonTheoSo(queryOne);" in ma[F_ORD],
         "cho tao don da dung ham moi"),

        ("Math.random()" not in ma[F_HELP].split("function taoMaDonTheoSo")[1],
         "ham moi KHONG dung so ngau nhien"),

        ("for (let i = 0; i < 30; i++)" in ma[F_HELP],
         "co vong thu lai khi hai don cung luc"),

        ("SELECT id FROM pos_orders WHERE code = ?" in ma[F_HELP],
         "co kiem ma da ai lay chua truoc khi dung"),

        ("String(Date.now()).slice(-6)" in ma[F_HELP],
         "het cach van tra ve mot ma, KHONG chan ca ban hang"),

        (ma[F_HELP].count("function generateOrderCode()") == 1,
         "ham cu VAN con — don cu va ma cu khong bi dung toi"),

        ("taoMaDonTheoSo, " in ma[F_HELP],
         "ham moi duoc xuat khau"),

        ("taoMaDonTheoSo, " in ma[F_ORD],
         "orders.js co nap ham moi"),

        ("padStart(3, \"0\")" in ma[F_HELP],
         "so thu tu co dem 0 dang truoc cho de doc"),

        (ma[F_HELP].find("let ke = 1;") < ma[F_HELP].find("for (let i = 0; i < 30"),
         "tinh so ke tiep TRUOC roi moi vao vong tranh trung"),

        ("catch" in ma[F_HELP].split("function taoMaDonTheoSo")[1],
         "doc hong thi van sinh duoc ma, khong nem loi ra ngoai"),
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
    print("  KHONG can build lai client.\n")
    print("  Buoc tiep:")
    print("    node --check server/utils/helpers.js")
    print("    node --check server/routes/orders.js\n")
    print("  Duong lui:")
    for f in TAT_CA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
