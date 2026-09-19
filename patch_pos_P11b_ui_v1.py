# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P11b - POS-NHANDIEM-UI-v1   (man cai dat + chu tren bill)
======================================================================

PHAN CON THIEU CUA POS-NHANDIEM-v1
  Phan may chu da xong: doc 4 cau hinh `nhandiem_*`, co duong nhan diem.
  Nhung chua co MAN HINH de bam chinh, va bill van in chu cu "Ma uu dai
  khach moi · Tao tai khoan app trong 24h de nhan uu dai" — sai voi chuong
  trinh moi.

SUA GI
  1. Them khoi "Nhan diem tu ma bill" vao the "Uu dai khach moi" — 4 thong so:
       bat/tat · he so (2 hay 3) · han ma tinh bang gio · moi SDT mot lan?
  2. MAY CHU dung san chu roi gui kem ma; bill chi IN. Bill khong phai biet
     chuong trinh nao dang bat — doi chuong trinh thi sua MOT cho.
     Khong co chu gui sang (don cu) thi bill GIU NGUYEN chu cu, khong de trong.
     Cac truong hop:
       · chi bat nhan diem  -> "Ma nhan diem" · "Tao tai khoan trong N gio
         de nhan gap K diem cua don nay"
       · chi bat voucher    -> giu nguyen chu cu
       · bat CA HAI         -> "Ma uu dai" + noi ca hai quyen loi
       · TAT CA HAI         -> van in ma (may chu van sinh) nhung khong hua
         gi ca, chi ghi "Ma don hang"
  3. Chu tren bill lay tu CAU HINH, khong cam cung so 24 hay chu "voucher".

VI SAO GOP VAO THE CU
  Hai chuong trinh dung CHUNG mot ma in tren bill. Tach hai the thi chu quan
  phai nho ma nao thuoc the nao. Gop mot cho de thay ngay dang bat cai gi.

DIEU PATCH NAY CO TINH KHONG LAM
  KHONG gop 2 nut luu o the "Gia ban" — do la viec P10, de rieng.

PHU THUOC
  POS-NHANDIEM-v1 (phan may chu)

CHU Y - PHAI BUILD LAI CLIENT
      cd client && npm run build && cd ..

DUONG LUI
  cp client/src/pages/Settings.jsx.truoc_ndui  client/src/pages/Settings.jsx
  cp client/src/components/InvoicePreview.jsx.truoc_ndui client/src/components/InvoicePreview.jsx
"""

import os
import sys
import shutil

MARKER = "POS-NHANDIEM-UI-v1"
HAU_TO = ".truoc_ndui"

F_SET = os.path.join("client", "src", "pages", "Settings.jsx")
F_BILL = os.path.join("client", "src", "components", "InvoicePreview.jsx")
F_ORD = os.path.join("server", "routes", "orders.js")
F_SALES = os.path.join("client", "src", "pages", "Sales.jsx")
F_PRINT = os.path.join("client", "src", "components", "InvoicePrint.jsx")
TAT_CA = [F_SET, F_BILL, F_ORD, F_SALES, F_PRINT]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · Settings.jsx — trang thai cho 4 thong so
# ══════════════════════════════════════════════════════════════════════
S1_CU = """  const [signupCfg, setSignupCfg] = useState({
    signup_enabled: 'false',"""

S1_MOI = """  // POS-NHANDIEM-UI-v1: 4 thong so cua chuong trinh nhan diem. Dung chung
  // duong /api/pos/settings nhu signupCfg, chi khac tien to key.
  const [nhanDiemCfg, setNhanDiemCfg] = useState({
    nhandiem_enabled: '0',
    nhandiem_he_so: '2',
    nhandiem_han_gio: '24',
    nhandiem_chi_lan_dau: '1',
  });

  const [signupCfg, setSignupCfg] = useState({
    signup_enabled: 'false',"""

# ══════════════════════════════════════════════════════════════════════
#  2 · Settings.jsx — nap + luu
# ══════════════════════════════════════════════════════════════════════
S2_CU = """  const loadSignupCfg = async () => {
    const data = await pkgApi('GET', '/api/pos/settings');"""

S2_MOI = """  // POS-NHANDIEM-UI-v1: nap va luu 4 thong so nhan diem.
  // Luu RIENG khoi signupCfg: hai chuong trinh doc lap, bat/tat rieng, nen
  // luu cai nay KHONG duoc dong cham cai kia.
  const loadNhanDiemCfg = async () => {
    const data = await pkgApi('GET', '/api/pos/settings');
    if (data.success) {
      const s = data.data || {};
      setNhanDiemCfg(prev => ({
        nhandiem_enabled: s.nhandiem_enabled ?? prev.nhandiem_enabled,
        nhandiem_he_so: s.nhandiem_he_so ?? prev.nhandiem_he_so,
        nhandiem_han_gio: s.nhandiem_han_gio ?? prev.nhandiem_han_gio,
        nhandiem_chi_lan_dau: s.nhandiem_chi_lan_dau ?? prev.nhandiem_chi_lan_dau,
      }));
    }
  };

  const saveNhanDiemCfg = async () => {
    setSaving(true);
    try {
      const heSo = parseFloat(nhanDiemCfg.nhandiem_he_so);
      if (!(heSo >= 1)) throw new Error('Hệ số phải từ 1 trở lên');
      const hanGio = parseInt(nhanDiemCfg.nhandiem_han_gio, 10);
      if (!(hanGio > 0)) throw new Error('Hạn mã phải lớn hơn 0 giờ');
      const kq = await pkgApi('PUT', '/api/pos/settings', {
        settings: {
          nhandiem_enabled: nhanDiemCfg.nhandiem_enabled === '1' ? '1' : '0',
          nhandiem_he_so: String(heSo),
          nhandiem_han_gio: String(hanGio),
          nhandiem_chi_lan_dau: nhanDiemCfg.nhandiem_chi_lan_dau === '1' ? '1' : '0',
        },
      });
      if (!kq.success) throw new Error(kq.error || 'Không lưu được');
      setMessage('Đã lưu cấu hình nhân điểm');
      setTimeout(() => setMessage(''), 3000);
      await loadNhanDiemCfg();
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadSignupCfg = async () => {
    const data = await pkgApi('GET', '/api/pos/settings');"""

# ══════════════════════════════════════════════════════════════════════
#  3 · Settings.jsx — nap cung luc voi the signup
# ══════════════════════════════════════════════════════════════════════
S3_CU = """      } else if (tab === 'signup') {"""
S3_MOI = """      } else if (tab === 'signup') {
        await loadNhanDiemCfg();   // POS-NHANDIEM-UI-v1: nap cung the"""

# ══════════════════════════════════════════════════════════════════════
#  4 · Settings.jsx — khoi giao dien
# ══════════════════════════════════════════════════════════════════════
S4_CU = """              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🎯 Ưu đãi khách mới</div>"""

S4_MOI = """              {/* ═══ POS-NHANDIEM-UI-v1 · Nhân điểm từ mã bill ═══════════════════
                  Đặt TRƯỚC khối voucher vì đây là chương trình chính từ 18.09.
                  Hai chương trình dùng CHUNG một mã in trên bill nhưng độc lập
                  nhau — bật tắt riêng, lưu riêng. */}
              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>⭐ Nhân điểm từ mã bill</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
                Khách chưa cho số điện thoại thì đơn đó không được tính điểm. Mã in trên bill cho phép
                khách tạo tài khoản sau và nhận điểm của chính đơn vừa mua, nhân theo hệ số bên dưới.
                <br />
                <b>Hai loại hạn khác nhau:</b> hạn của MÃ là số giờ kể từ lúc in bill · điểm sau khi đã
                vào tài khoản thì sống theo cấu hình ở thẻ "Điểm thưởng", giống hệt điểm mua hàng.
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={nhanDiemCfg.nhandiem_enabled === '1'}
                  onChange={e => setNhanDiemCfg({ ...nhanDiemCfg, nhandiem_enabled: e.target.checked ? '1' : '0' })}
                />
                Bật chương trình nhân điểm
              </label>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ minWidth: 150 }}>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Hệ số nhân</p>
                  <input
                    className="input" type="number" min="1" step="1"
                    value={nhanDiemCfg.nhandiem_he_so}
                    onChange={e => setNhanDiemCfg({ ...nhanDiemCfg, nhandiem_he_so: e.target.value })}
                  />
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>2 = gấp đôi · 3 = gấp ba</p>
                </div>
                <div style={{ minWidth: 150 }}>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Hạn của mã (giờ)</p>
                  <input
                    className="input" type="number" min="1" step="1"
                    value={nhanDiemCfg.nhandiem_han_gio}
                    onChange={e => setNhanDiemCfg({ ...nhanDiemCfg, nhandiem_han_gio: e.target.value })}
                  />
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>24 = một ngày · 168 = một tuần</p>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={nhanDiemCfg.nhandiem_chi_lan_dau === '1'}
                  onChange={e => setNhanDiemCfg({ ...nhanDiemCfg, nhandiem_chi_lan_dau: e.target.checked ? '1' : '0' })}
                />
                Mỗi số điện thoại chỉ nhận một lần
                <span style={{ fontSize: 12, color: '#9ca3af' }}>— bỏ tick để chạy chương trình cho mọi lần mua</span>
              </label>

              <button className="btn btn-primary" onClick={saveNhanDiemCfg} disabled={saving}
                style={{ marginBottom: 28 }}>
                {saving ? 'Đang lưu...' : 'Lưu cấu hình nhân điểm'}
              </button>

              <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: 20 }} />

              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🎯 Ưu đãi khách mới</div>"""

# ══════════════════════════════════════════════════════════════════════
#  5 · Settings.jsx — sua mo ta cu (dang noi 24h va voucher)
# ══════════════════════════════════════════════════════════════════════
S5_CU = """                In mã trên bill khi bán — khách tạo tài khoản app trong 24h để đổi mã lấy voucher.
                Bỏ qua nếu SĐT đơn đó đã từng đổi ưu đãi này trước đây."""

S5_MOI = """                Chương trình CŨ: đổi mã lấy phiếu giảm giá. Dùng CHUNG mã in trên bill với chương trình
                nhân điểm ở trên, nhưng bật tắt và lưu riêng.
                Bỏ qua nếu SĐT đơn đó đã từng đổi ưu đãi này trước đây.
                <br />
                <b>Từ 18.09:</b> tạo tài khoản lần đầu vốn đã có mã giảm giá riêng, nên chương trình này
                sẽ tắt khi App khách hàng xong. Giữ lại để không có khoảng trống."""

# ══════════════════════════════════════════════════════════════════════
#  6 · InvoicePreview.jsx — chu tren bill theo cau hinh
# ══════════════════════════════════════════════════════════════════════
B_CU = """            <div style={{ color: '#666', fontSize: '0.85em' }}>
              Tạo tài khoản app trong 24h để nhận ưu đãi
            </div>"""

B_MOI = """            {/* POS-NHANDIEM-UI-v1: chu do MAY CHU dung san (orders.js) roi gui kem
                ma. Bill chi in, khong tu tinh — doi chuong trinh thi sua MOT cho.
                Khong co chu gui sang (don cu, hoac may chu chua cap nhat) thi giu
                nguyen chu cu, KHONG bao gio de trong. */}
            <div style={{ color: '#666', fontSize: '0.85em' }}>
              {data.signup_loi || 'Tạo tài khoản app trong 24h để nhận ưu đãi'}
            </div>"""

B2_CU = """            <div style={{ color: '#666', marginBottom: '1mm' }}>Mã ưu đãi khách mới</div>"""

B2_MOI = """            <div style={{ color: '#666', marginBottom: '1mm' }}>{data.signup_nhan || 'Mã ưu đãi khách mới'}</div>"""

# ══════════════════════════════════════════════════════════════════════
#  7 · orders.js — dung san CHU cho bill theo cau hinh dang bat
# ══════════════════════════════════════════════════════════════════════
O_CU = """        signup_code: signupCode,"""

O_MOI = """        signup_code: signupCode,
        // POS-NHANDIEM-UI-v1: dung san CHU cho bill ngay tai day. Bill khong
        // phai biet chuong trinh nao dang bat — doi chuong trinh thi sua MOT cho.
        ...(await (async () => {
          try {
            if (!signupCode) return {};
            const rows = await query(
              "SELECT key, value FROM pos_settings WHERE key IN ('nhandiem_enabled','nhandiem_he_so','nhandiem_han_gio','signup_enabled')",
            );
            const c = {};
            for (const r of rows) c[r.key] = r.value;
            const batDiem = c.nhandiem_enabled === '1';
            const batVoucher = c.signup_enabled === 'true' || c.signup_enabled === '1';
            const heSo = Number(c.nhandiem_he_so) || 2;
            const gio = Number(c.nhandiem_han_gio) || 24;
            const hanChu = gio >= 24 && gio % 24 === 0 ? (gio / 24) + ' ngay' : gio + ' gio';
            if (batDiem && batVoucher) {
              return { signup_nhan: 'Ma uu dai',
                signup_loi: `Tao tai khoan trong ${hanChu} de nhan uu dai va gap ${heSo} diem cua don nay` };
            }
            if (batDiem) {
              return { signup_nhan: 'Ma nhan diem',
                signup_loi: `Tao tai khoan trong ${hanChu} de nhan gap ${heSo} diem cua don nay` };
            }
            if (batVoucher) {
              return { signup_nhan: 'Ma uu dai khach moi',
                signup_loi: `Tao tai khoan app trong ${hanChu} de nhan uu dai` };
            }
            return { signup_nhan: 'Ma don hang', signup_loi: null };
          } catch (e) {
            return {};   // loi doc cau hinh KHONG duoc lam hong viec tao don
          }
        })()),"""

# ══════════════════════════════════════════════════════════════════════
#  8 · Sales.jsx — chuyen chu tu may chu xuong bill
# ══════════════════════════════════════════════════════════════════════
A1_CU = """        signupCode: result.order.signup_code || null, // Bước 3: mã ưu đãi khách mới, để in ra bill"""
A1_MOI = """        signupCode: result.order.signup_code || null, // Bước 3: mã ưu đãi khách mới, để in ra bill
        signupNhan: result.order.signup_nhan || null,  // POS-NHANDIEM-UI-v1: nhãn + lời do máy chủ dựng
        signupLoi: result.order.signup_loi || null,"""

A2_CU = """        signup_code: completedOrder.signupCode || null"""
A2_MOI = """        signup_code: completedOrder.signupCode || null,
        signup_nhan: completedOrder.signupNhan || null,   // POS-NHANDIEM-UI-v1
        signup_loi: completedOrder.signupLoi || null"""

# ══════════════════════════════════════════════════════════════════════
#  9 · InvoicePrint.jsx — dua 2 truong moi vao du lieu bill
# ══════════════════════════════════════════════════════════════════════
P_CU = """    signup_code: order.signup_code || null,"""
P_MOI = """    signup_code: order.signup_code || null,
    signup_nhan: order.signup_nhan || null,   // POS-NHANDIEM-UI-v1
    signup_loi: order.signup_loi || null,"""


def main():
    print("=" * 70)
    print("  PATCH P11b - POS-NHANDIEM-UI-v1  (man cai dat + chu tren bill)")
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

    print("\n[1/4] Kiem phu thuoc va 11 mo neo (CHUA ghi gi)")
    sc = os.path.join("server", "routes", "signup-codes.js")
    if not os.path.isfile(sc) or "POS-NHANDIEM-v1" not in open(sc, encoding="utf-8").read():
        thoat("Thieu POS-NHANDIEM-v1 o phan may chu — ap patch do truoc.")
    print("   [ok] phu thuoc  POS-NHANDIEM-v1")

    for f, nhan, mo in [
        (F_SET, "khoi trang thai signupCfg", S1_CU),
        (F_SET, "ham nap cau hinh signup", S2_CU),
        (F_SET, "nhanh nap theo the", S3_CU),
        (F_SET, "tieu de khoi uu dai", S4_CU),
        (F_SET, "mo ta cu cua khoi uu dai", S5_CU),
        (F_BILL, "dong loi huong dan tren bill", B_CU),
        (F_BILL, "dong nhan cua ma tren bill", B2_CU),
        (F_ORD, "cho tra ma ve cho may khach", O_CU),
        (F_SALES, "cho nhan ma tu may chu", A1_CU),
        (F_SALES, "cho truyen ma sang bill", A2_CU),
        (F_PRINT, "cho dua ma vao du lieu bill", P_CU),
    ]:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):20} {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    for f in TAT_CA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    print("\n[3/4] Ap 11 thay doi")
    for f, cu, moi, nhan in [
        (F_SET, S1_CU, S1_MOI, "trang thai 4 thong so"),
        (F_SET, S2_CU, S2_MOI, "nap + luu RIENG, khong dong cham voucher"),
        (F_SET, S3_CU, S3_MOI, "nap cung the uu dai"),
        (F_SET, S4_CU, S4_MOI, "khoi giao dien nhan diem"),
        (F_SET, S5_CU, S5_MOI, "sua mo ta cu cho dung thuc te"),
        (F_BILL, B_CU, B_MOI, "bill in LOI may chu gui, khong tu tinh"),
        (F_BILL, B2_CU, B2_MOI, "bill in NHAN may chu gui"),
        (F_ORD, O_CU, O_MOI, "may chu dung san chu theo cau hinh"),
        (F_SALES, A1_CU, A1_MOI, "man ban hang nhan 2 truong moi"),
        (F_SALES, A2_CU, A2_MOI, "chuyen 2 truong xuong bill"),
        (F_PRINT, P_CU, P_MOI, "dua 2 truong vao du lieu bill"),
    ]:
        noi[f] = noi[f].replace(cu, moi, 1)
        print(f"   [ok] {os.path.basename(f):20} {nhan}")

    print("\n[4/4] Chot 18 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        ra = []
        for d in v.split("\n"):
            t = d.strip()
            if t.startswith("//") or t.startswith("*") or t.startswith("/*") or t.startswith("{/*"):
                continue
            ra.append(d)
        return "\n".join(ra)

    ma = {f: bo_ghi_chu(noi[f]) for f in TAT_CA}

    chot = [
        ("const [nhanDiemCfg, setNhanDiemCfg] = useState({" in ma[F_SET],
         "co trang thai rieng cho nhan diem"),

        (all(k in ma[F_SET] for k in
             ["nhandiem_enabled", "nhandiem_he_so", "nhandiem_han_gio", "nhandiem_chi_lan_dau"]),
         "du CA 4 thong so tren man hinh"),

        ("const saveNhanDiemCfg = async () => {" in ma[F_SET],
         "co ham luu rieng"),

        ("signup_" not in ma[F_SET].split("const saveNhanDiemCfg")[1].split("const loadSignupCfg")[0],
         "luu nhan diem KHONG dong cham cau hinh voucher"),

        ("await loadNhanDiemCfg();" in ma[F_SET],
         "nap cau hinh khi mo the"),

        ("if (!(heSo >= 1)) throw" in ma[F_SET],
         "chan he so nho hon 1"),

        ("if (!(hanGio > 0)) throw" in ma[F_SET],
         "chan han ma bang 0 hoac am"),

        ("Nhân điểm từ mã bill" in ma[F_SET],
         "khoi giao dien co tieu de"),

        ("Hai loại hạn khác nhau" in ma[F_SET],
         "man hinh noi ro hai loai han, tranh hieu nham"),

        ("saveSignupCfg" in ma[F_SET],
         "nut luu voucher cu VAN CON"),

        ("{data.signup_loi || 'Tạo tài khoản app trong 24h để nhận ưu đãi'}" in ma[F_BILL],
         "bill in loi may chu gui, KHONG co thi giu chu cu — khong bao gio de trong"),

        ("{data.signup_nhan || 'Mã ưu đãi khách mới'}" in ma[F_BILL],
         "nhan cung vay: co thi dung, khong co thi giu chu cu"),

        ("batDiem" not in ma[F_BILL],
         "bill KHONG tu tinh chuong trinh nao dang bat"),

        ("signup_nhan: 'Ma nhan diem'" in ma[F_ORD]
         and "signup_nhan: 'Ma don hang'" in ma[F_ORD],
         "may chu dung du 4 truong hop chu"),

        ("hanChu" in ma[F_ORD] and "gio % 24 === 0" in ma[F_ORD],
         "doi gio sang ngay cho de doc"),

        ("return {};   " in ma[F_ORD],
         "loi doc cau hinh KHONG lam hong viec tao don"),

        ("signupNhan: result.order.signup_nhan" in ma[F_SALES]
         and "signup_nhan: completedOrder.signupNhan" in ma[F_SALES],
         "duong truyen tu may chu xuong bill day du"),

        ("signup_nhan: order.signup_nhan" in ma[F_PRINT],
         "bill nhan duoc 2 truong moi"),
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

    print("  Duong lui:")
    for f in TAT_CA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
