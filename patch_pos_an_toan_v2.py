# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH - POS-ANTOAN-v1   (sao luu du bang · khoa duong cai dat)
======================================================================

HAI LO TIM RA KHI RA SOAT 18.09 — CA HAI DEU NANG

  LO 1 — SAO LUU THIEU 15 TRONG 29 BANG
    `BACKUP_TABLES` (backup.js:41) chi liet ke 14 bang. 15 bang KHONG bao gio
    duoc sao luu, trong do co:
      · pos_point_transactions  -> TOAN BO DIEM THUONG cua moi khach
      · pos_customer_packages   -> goi khach da mua, con bao nhieu luot
      · pos_packages            -> danh muc goi
      · pos_membership_tiers    -> hang thanh vien
      · pos_membership_purchases-> lich su mua the
      · pos_users · pos_permissions -> tai khoan nhan vien va phan quyen
      · pos_reward_catalog · pos_voucher_grants -> kho qua
      · pos_stock_pending       -> so no kho (viec chua gui sang SX)
      · pos_damage_logs · pos_promotion_usage · pos_invoice_logs

    Khoi phuc tu ban sao luu hien tai = MAT sach diem khach, mat goi da ban,
    mat the thanh vien, mat ca tai khoan nhan vien.
    Chinh file nay tung co ghi chu "09.08.2026 — 4 bang truoc day chua co
    trong backup" — tuc la loi nay da tung xay ra mot lan va chua duoc ra soat het.

  LO 2 — BA DUONG GHI KHONG KIEM QUYEN
    (a) `PUT /api/pos/settings`
    `PUT /api/pos/settings` (settings.js:82) chi co `authenticate`.
    Bat ky nhan vien nao dang nhap deu sua duoc MOI cau hinh: ty le tich diem,
    he so nhan diem, cau hinh hoa don, flash sale...
    Cac duong cai dat khac deu da co `checkPermission('manage_settings')`
    (products.js:141, 188, 239 · product-groups.js:43 · signup-codes.js:385)
    — rieng duong nay bi sot.

    (b) `PUT /api/pos/customers/:id/discount` — dat chiet khau rieng cho khach.
        NGUY HIEM NHAT: POS-CONGDON-v1 vua bat may chu TU TRA con so nay khi
        ban (thay vi tin to khai). Dat 90% vao ho so khach o day nghia la ban
        giam 90% ma KHONG qua bat ky cong nao. Cong vua dung bi di vong.

    (c) `POST /api/pos/wallets/deduct` — tru so du khach thu cong.
        Ban hang khong di qua day (orders.js tu cap nhat vi ~886).

SUA GI
  1. Them 15 bang vao danh sach sao luu, DUNG THU TU cha truoc con sau
     (restore chen theo thu tu nay).
  2. Them `checkPermission('manage_settings')` vao duong luu cai dat.
     Chu quan (role owner) LUON qua duoc (auth.js:90), khong lo bi chan nham.

DIEU PATCH NAY CO TINH KHONG LAM
  Khong dong den ban sao luu DA TAO truoc day — chung van thieu bang.
  Sau khi ap, phai TAO BAN SAO LUU MOI thi moi co du du lieu.

CHU Y
  Chi dung 2 file may chu — KHONG can build lai client.

DUONG LUI
  cp server/routes/backup.js.truoc_antoan   server/routes/backup.js
  cp server/routes/settings.js.truoc_antoan server/routes/settings.js
  cp server/routes/customers.js.truoc_antoan server/routes/customers.js
  cp server/routes/wallets.js.truoc_antoan   server/routes/wallets.js
"""

import os
import sys
import shutil

MARKER = "POS-ANTOAN-v1"
HAU_TO = ".truoc_antoan"

F_BK = os.path.join("server", "routes", "backup.js")
F_ST = os.path.join("server", "routes", "settings.js")
F_CUS = os.path.join("server", "routes", "customers.js")
F_WAL = os.path.join("server", "routes", "wallets.js")
TAT_CA = [F_BK, F_ST, F_CUS, F_WAL]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · backup.js — them 15 bang con thieu
# ══════════════════════════════════════════════════════════════════════
B_CU = """  { name: 'pos_product_groups', label: 'Nhóm sản phẩm', key: 'id' },
  { name: 'pos_product_group_members', label: 'Thành viên nhóm SP', key: 'id' }
];"""

B_MOI = """  { name: 'pos_product_groups', label: 'Nhóm sản phẩm', key: 'id' },
  { name: 'pos_product_group_members', label: 'Thành viên nhóm SP', key: 'id' },

  // ═══ POS-ANTOAN-v1 (18.09.2026) — 15 bảng TRƯỚC ĐÂY KHÔNG ĐƯỢC SAO LƯU ═══
  // Rà soát toàn bộ 29 bảng của database thì chỉ 14 bảng có trong danh sách này.
  // Khôi phục từ bản sao lưu cũ = MẤT sạch điểm thưởng của khách, mất gói đã
  // bán, mất thẻ thành viên, mất cả tài khoản nhân viên.
  // Thứ tự dưới đây là CHA TRƯỚC CON SAU — restore chèn theo đúng thứ tự này.

  // Tài khoản và quyền (phải có trước, mọi thứ khác tham chiếu created_by)
  { name: 'pos_users', label: 'Tài khoản nhân viên', key: 'id' },
  { name: 'pos_permissions', label: 'Phân quyền', key: 'id' },

  // Điểm thưởng — MẤT LÀ MẤT HẾT, không dựng lại được từ đơn hàng vì
  // điểm còn phụ thuộc cấu hình tại thời điểm bán và các lần đổi quà.
  { name: 'pos_point_transactions', label: 'Giao dịch điểm thưởng', key: 'id' },
  { name: 'pos_reward_catalog', label: 'Kho quà', key: 'id' },
  { name: 'pos_voucher_grants', label: 'Voucher đã phát', key: 'id' },

  // Gói: danh mục trước, gói của khách sau
  { name: 'pos_packages', label: 'Danh mục gói', key: 'id' },
  { name: 'pos_customer_packages', label: 'Gói của khách', key: 'id' },

  // Thẻ thành viên: hạng trước, lịch sử mua sau
  { name: 'pos_membership_tiers', label: 'Hạng thành viên', key: 'id' },
  { name: 'pos_membership_purchases', label: 'Lịch sử mua thẻ', key: 'id' },

  // Sổ nợ kho — việc chưa gửi được sang SX. Mất là mất luôn dấu vết hàng
  // đã bán mà kho chưa trừ.
  { name: 'pos_stock_pending', label: 'Sổ nợ kho', key: 'id' },

  // Sự cố và lịch sử — ảnh hưởng tiền nên phải giữ
  { name: 'pos_damage_logs', label: 'Hàng hỏng', key: 'id' },
  { name: 'pos_promotion_usage', label: 'Lịch sử dùng khuyến mãi', key: 'id' },
  { name: 'pos_invoice_logs', label: 'Nhật ký hoá đơn', key: 'id' },

  // Nhật ký kỹ thuật — giữ để truy nguyên sự cố
  { name: 'pos_sync_logs', label: 'Nhật ký đồng bộ', key: 'id' },
  { name: 'pos_export_logs', label: 'Nhật ký xuất dữ liệu', key: 'id' }
];"""

# ══════════════════════════════════════════════════════════════════════
#  2a · settings.js — nap them checkPermission
# ══════════════════════════════════════════════════════════════════════
N_CU = """const { authenticate } = require('../middleware/auth');"""

N_MOI = """const { authenticate, checkPermission } = require('../middleware/auth');"""

# ══════════════════════════════════════════════════════════════════════
#  2b · settings.js — khoa duong luu cai dat
# ══════════════════════════════════════════════════════════════════════
S_CU = """router.put('/', authenticate, async (req, res) => {"""

S_MOI = """// POS-ANTOAN-v1: duong nay truoc day chi co `authenticate` — BAT KY nhan vien
// nao dang nhap deu sua duoc MOI cau hinh: ty le tich diem, he so nhan diem,
// cau hinh hoa don, flash sale. Cac duong cai dat khac deu da kiem quyen nay
// (products.js:141,188,239 · product-groups.js:43 · signup-codes.js:385),
// rieng duong nay bi sot.
// Chu quan (role 'owner') LUON qua duoc (auth.js:90) nen khong lo bi chan nham.
router.put('/', authenticate, checkPermission('manage_settings'), async (req, res) => {"""


# ══════════════════════════════════════════════════════════════════════
#  3 · customers.js — dat chiet khau rieng cho khach PHAI co quyen
#
#  Day la lo lam VO HIEU MOT PHAN patch POS-CONGDON-v1. Patch do bit duong
#  "tu khai muc giam trong don" va bat may chu TU TRA chiet khau tu ho so
#  khach. Nhung duong DAT chiet khau vao ho so lai khong kiem quyen — nhan
#  vien dat 90% vao ho so khach roi ban, may chu tu tra va ap dung 90%.
#  Cong da dung bi di vong bang cua khac.
# ══════════════════════════════════════════════════════════════════════
C_CU = """router.put('/:id/discount', authenticate, async (req, res) => {"""

C_MOI = """// POS-ANTOAN-v1: chiet khau rieng cua khach la uu dai thuong mai, phai co
// quyen moi dat duoc. Truoc day bat ky nhan vien nao cung dat duoc — va vi
// POS-CONGDON-v1 lam may chu TU TRA con so nay khi ban, dat 90% o day nghia
// la ban giam 90% ma khong qua bat ky cong nao.
router.put('/:id/discount', authenticate, checkPermission('manage_settings'), async (req, res) => {"""

# ══════════════════════════════════════════════════════════════════════
#  4 · wallets.js — tru so du thu cong PHAI co quyen
#
#  Ban hang KHONG di qua duong nay: orders.js tu cap nhat vi (dong ~886).
#  Duong nay chi dung de tru tay, nen khoa lai khong anh huong quay.
# ══════════════════════════════════════════════════════════════════════
W_CU = """router.post('/deduct', authenticate, async (req, res) => {"""

W_MOI = """// POS-ANTOAN-v1: tru so du thu cong phai co quyen `adjust_balance`.
// Ban hang khong di qua day (orders.js tu cap nhat vi ~886) nen khoa lai
// KHONG anh huong quay.
router.post('/deduct', authenticate, checkPermission('adjust_balance'), async (req, res) => {"""


def main():
    print("=" * 70)
    print("  PATCH - POS-ANTOAN-v1  (sao luu du bang · khoa duong cai dat)")
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

    print("\n[1/4] Kiem phu thuoc va 5 mo neo (CHUA ghi gi)")
    auth = open(os.path.join("server", "middleware", "auth.js"), encoding="utf-8").read()
    if "checkPermission," not in auth and "checkPermission" not in auth:
        thoat("middleware/auth.js khong xuat khau checkPermission.")
    print("   [ok] middleware/auth.js co xuat khau checkPermission")

    for f, nhan, mo in [
        (F_BK, "cuoi danh sach bang sao luu", B_CU),
        (F_ST, "dong nap tu middleware", N_CU),
        (F_ST, "duong luu cai dat", S_CU),
        (F_CUS, "duong dat chiet khau khach", C_CU),
        (F_WAL, "duong tru so du thu cong", W_CU),
    ]:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):14} {nhan}")

    # Kiem 15 bang deu CO THAT trong database.js — tranh sao luu bang khong ton tai
    db_path = os.path.join("server", "database.js")
    db = open(db_path, encoding="utf-8").read()
    import re
    co_that = set(re.findall(r"CREATE TABLE IF NOT EXISTS (\w+)", db))
    them = re.findall(r"\{ name: '(\w+)'", B_MOI)
    thieu = [t for t in them if t not in co_that]
    if thieu:
        thoat("Cac bang sau KHONG co trong database.js: " + ", ".join(thieu))
    print(f"   [ok] ca {len(them)} bang trong danh sach moi deu CO THAT trong database")

    print("\n[2/4] Luu ban truoc khi sua")
    for f in TAT_CA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    print("\n[3/4] Ap 5 thay doi")
    noi[F_BK] = noi[F_BK].replace(B_CU, B_MOI, 1)
    print("   [ok] backup.js    them 15 bang con thieu")
    noi[F_ST] = noi[F_ST].replace(N_CU, N_MOI, 1)
    print("   [ok] settings.js  nap them checkPermission")
    noi[F_ST] = noi[F_ST].replace(S_CU, S_MOI, 1)
    print("   [ok] settings.js  khoa duong luu cai dat")
    noi[F_CUS] = noi[F_CUS].replace(C_CU, C_MOI, 1)
    print("   [ok] customers.js khoa duong dat chiet khau khach")
    noi[F_WAL] = noi[F_WAL].replace(W_CU, W_MOI, 1)
    print("   [ok] wallets.js   khoa duong tru so du thu cong")

    print("\n[4/4] Chot 16 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = {f: bo_ghi_chu(noi[f]) for f in TAT_CA}
    ds_bk = re.findall(r"\{ name: '(\w+)'", ma[F_BK])

    chot = [
        (len(ds_bk) == 29,
         f"sao luu du CA 29 bang (dang co {len(ds_bk)})"),

        (len(set(ds_bk)) == len(ds_bk),
         "khong bang nao bi liet ke hai lan"),

        (not (co_that - set(ds_bk)),
         "khong con bang nao cua database bi bo sot"),

        ("pos_point_transactions" in ds_bk,
         "DIEM THUONG cua khach da duoc sao luu"),

        ("pos_customer_packages" in ds_bk and "pos_packages" in ds_bk,
         "goi da ban va danh muc goi da duoc sao luu"),

        ("pos_users" in ds_bk and "pos_permissions" in ds_bk,
         "tai khoan nhan vien va phan quyen da duoc sao luu"),

        ("pos_stock_pending" in ds_bk,
         "so no kho da duoc sao luu"),

        (ds_bk.index("pos_packages") < ds_bk.index("pos_customer_packages"),
         "danh muc goi dung TRUOC goi cua khach (restore chen theo thu tu)"),

        (ds_bk.index("pos_membership_tiers") < ds_bk.index("pos_membership_purchases"),
         "hang thanh vien dung TRUOC lich su mua the"),

        (ds_bk.index("pos_users") < ds_bk.index("pos_permissions"),
         "tai khoan dung TRUOC phan quyen"),

        ("router.put('/', authenticate, checkPermission('manage_settings')" in ma[F_ST],
         "duong luu cai dat da doi quyen manage_settings"),

        (ma[F_ST].count("router.put('/', authenticate, async") == 0,
         "khong con duong luu cai dat nao bo ngo"),

        ("const { authenticate, checkPermission } = require('../middleware/auth');" in ma[F_ST],
         "settings.js co nap checkPermission"),

        ("router.put('/:id/discount', authenticate, checkPermission('manage_settings')" in ma[F_CUS],
         "dat chiet khau khach da doi quyen — khong di vong duoc cong cua POS-CONGDON-v1"),

        ("router.post('/deduct', authenticate, checkPermission('adjust_balance')" in ma[F_WAL],
         "tru so du thu cong da doi quyen"),

        ("UPDATE pos_wallets SET balance" in open(os.path.join("server","routes","orders.js"), encoding="utf-8").read(),
         "ban hang VAN tu cap nhat vi, khong di qua duong vua khoa"),
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
    print("  ⚠️  QUAN TRONG: cac ban sao luu DA TAO truoc day VAN THIEU 15 bang.")
    print("      Sau khi deploy, vao Cai dat > Sao luu va TAO BAN MOI ngay.\n")
    print("  Buoc tiep:")
    print("    node --check server/routes/backup.js")
    print("    node --check server/routes/settings.js\n")
    print("  Duong lui:")
    for f in TAT_CA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
