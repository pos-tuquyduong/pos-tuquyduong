# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P10b - POS-BOCUC-v1   (gom the thanh 3 nhom · cot nhan bam duoc)
======================================================================

HAI VIEC, CA HAI DEU THUAN HIEN THI — KHONG dong den duong tien.

  VIEC 1 — 9 the tran 2 hang
    Thanh the hien xep 9 nut mot hang ngang, tran xuong hang hai va hang
    duoi chi con MOT the le loi ("Hang thanh vien"). Sap toi them muc nhan
    diem la thanh 10.
    Gom theo viec: Ban hang · Khach hang · He thong. Moi nhom 2-4 the nen
    KHONG BAO GIO tran dong nua.

  VIEC 2 — 2 cot danh dau kho hieu
    Cot "SP dac biet" va "Ap voucher khach moi" la hai o vuong. Nhin vao
    KHONG biet tick thi chuyen gi xay ra — phai re chuot moi thay chu thich.
    Doi thanh MOT cot nhan bam duoc: nhan dam = dang bat, nhan mo vien dut
    = dang tat. Nhin la biet, khong phai doan. Bang tu 7 cot con 6.

KHAC GI BAN v2 — MAT DU LIEU KHI DOI THE
  Chay gia lap chuoi thao tac that thi lo ra: dang go gia chua luu, bam sang
  nhom khac -> `useEffect [tab]` tai lai tu may chu, GHI DE phan vua go, MAT
  sach va KHONG canh bao gi.
  Truoc day chi mat khi bam the khac; hang nhom cua v2 THEM mot duong nua.
  Dung cai tai nan ma POS-MOTNUTLUU-v1 sinh ra de ngan.
  v3: moi duong doi the deu hoi lai khi con thay doi chua luu; bam Huy thi
  giu nguyen ca the lan nhom.

KHAC GI BAN v1 — HAI CHO DUNG THAT SE KHO CHIU
  · Bam sang nhom khac ma noi dung KHONG doi: dang xem bang Gia ban, bam
    "He thong" -> hien 3 the nhung khong the nao sang, ben duoi van la bang
    gia. Nguoi dung nhin khong biet dang o dau.
    v2: bam nhom thi MO LUON the dau tien cua nhom do.
  · Nhom RONG van hien: nhan vien khong co quyen nao o nhom He thong bam vao
    thay trong tron. v2: an han nhom do.

CACH LAM AN TOAN
  · Nhom the CHI la lop hien thi. `tab` va `setTab` giu nguyen, moi nut van
    goi dung `setTab(...)` cu. Nhom nao dang chua the dang mo thi tu sang.
  · Nhan bam duoc goi dung 2 ham cu `updateSpecialGroup` va
    `toggleSignupGroupMember` — khong viet lai gi.
  · Quyen hien the giu y nguyen: van boc `hasPermission(...)` nhu cu.
  · Nut luu gop (POS-MOTNUTLUU-v1) va phep dem thay doi KHONG bi dung toi.

DIEU PATCH NAY CO TINH KHONG LAM
  Khong dong den cac the khac ngoai "Gia ban", khong doi mau thuong hieu,
  khong doi cach luu.

PHU THUOC
  POS-MOTNUTLUU-v1

CHU Y - PHAI BUILD LAI CLIENT
      cd client && npm run build && cd ..

DUONG LUI
  cp client/src/pages/Settings.jsx.truoc_bocuc client/src/pages/Settings.jsx
"""

import os
import sys
import shutil

MARKER = "POS-BOCUC-v1"
HAU_TO = ".truoc_bocuc"
F = os.path.join("client", "src", "pages", "Settings.jsx")


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · Trang thai nhom dang mo + bang phan nhom
# ══════════════════════════════════════════════════════════════════════
A_CU = """  const [banChupGia, setBanChupGia] = useState(null);"""

A_MOI = """  const [banChupGia, setBanChupGia] = useState(null);

  // ═══ POS-BOCUC-v1: gom 9 the thanh 3 nhom ════════════════════════════
  // CHI la lop hien thi. `tab` giu nguyen y nghia, moi nut van goi setTab
  // nhu cu — khong doi mot dong logic nao.
  // Kem QUYEN de: (a) an nhom ma nguoi dung khong co the nao, (b) bam nhom
  // thi mo dung the dau tien HO XEM DUOC.
  const NHOM_THE = [
    { ma: 'ban', ten: 'Bán hàng', the: [
      ['products', 'manage_settings'], ['packages', 'manage_users'],
    ]},
    { ma: 'khach', ten: 'Khách hàng', the: [
      ['loyalty', 'manage_settings'], ['signup', 'manage_settings'],
      ['tiers', 'manage_promotions'], ['flash', 'manage_settings'],
      ['rewards', 'manage_promotions'],
    ]},
    { ma: 'hethong', ten: 'Hệ thống', the: [
      ['users', 'manage_users'], ['permissions', 'manage_permissions'],
      ['backup', 'export_data'],
    ]},
  ];

  // The nao trong nhom nay nguoi dung xem duoc.
  const theXemDuoc = (nhom) => nhom.the.filter(([, q]) => hasPermission(q)).map(([t]) => t);
  // Nhom KHONG co the nao xem duoc thi an han — bam vao khong thay gi con
  // kho hieu hon la khong co nhom do.
  const nhomHienDuoc = NHOM_THE.filter(n => theXemDuoc(n).length > 0);

  // Nhom nao dang chua the dang mo thi nhom do sang — khong can nho rieng.
  const nhomDangMo = (nhomHienDuoc.find(n => n.the.some(([t]) => t === tab))
    || nhomHienDuoc[0] || NHOM_THE[0]).ma;
  const [nhomChon, setNhomChon] = useState(nhomDangMo);
  // Doi the bang cach khac (vd bam tu noi khac) thi nhom tu nhay theo.
  useEffect(() => { setNhomChon(nhomDangMo); }, [nhomDangMo]);

  const nhomHienTai = nhomHienDuoc.find(n => n.ma === nhomChon) || nhomHienDuoc[0] || NHOM_THE[0];
  const theTrongNhom = nhomHienTai.the.map(([t]) => t);

  // Bam sang nhom khac thi MO LUON the dau tien cua nhom do. Neu chi doi
  // hang the ma giu nguyen noi dung cu thi nguoi dung thay mot nhom dang
  // sang, khong the nao duoc chon, va ben duoi van la man hinh cu.
  // Doi the LA tai lai du lieu tu may chu (useEffect [tab]) — phan gia vua
  // go ma chua luu se bi ghi de va MAT, khong canh bao gi. Truoc day chi mat
  // khi bam the khac; hang nhom moi them mot duong nua de mat.
  // Chi hoi khi dang o the Gia ban, vi chi the do co phep dem thay doi.
  const doiThe = (t) => {
    if (t !== tab && tab === 'products') {
      const n = demThayDoi();
      if (n > 0 && !window.confirm(
        `Còn ${n} thay đổi chưa lưu ở bảng giá. Rời đi sẽ mất. Vẫn rời?`
      )) return;
    }
    setTab(t);
  };

  const chonNhom = (n) => {
    const ds = theXemDuoc(n);
    // Hoi TRUOC khi doi nhom: hoi xong nguoi dung bam Huy ma nhom da nhay
    // roi thi ho thay nhom moi sang trong khi van dang o man cu.
    if (ds.length && !ds.includes(tab)) {
      const truoc = tab;
      doiThe(ds[0]);
      if (tab === truoc) return;   // nguoi dung bam Huy -> giu nguyen ca nhom
    }
    setNhomChon(n.ma);
  };
  // ═══ het POS-BOCUC-v1 ════════════════════════════════════════════════"""

# ══════════════════════════════════════════════════════════════════════
#  2 · Hang chon nhom, dat TRUOC thanh the
# ══════════════════════════════════════════════════════════════════════
B_CU = """        <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
          {hasPermission('manage_settings') && ("""

B_MOI = """        {/* POS-BOCUC-v1: hang chon NHOM. Hang the ben duoi chi hien the
            thuoc nhom dang chon, nen moi hang chi con 2-4 the. */}
        <div className="flex gap-2 mb-2" style={{ borderBottom: '1px solid #e5e7eb' }}>
          {nhomHienDuoc.map(n => (
            <button
              key={n.ma}
              onClick={() => chonNhom(n)}
              style={{
                background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer',
                padding: '0 0 8px', fontSize: '0.95rem',
                fontWeight: nhomChon === n.ma ? 600 : 400,
                color: nhomChon === n.ma ? '#b91c1c' : '#6b7280',
                borderBottom: nhomChon === n.ma ? '2px solid #b91c1c' : '2px solid transparent',
              }}
            >
              {n.ten}
            </button>
          ))}
        </div>

        <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
          {theTrongNhom.includes('products') && hasPermission('manage_settings') && ("""

# ══════════════════════════════════════════════════════════════════════
#  3 · Chin the con lai — chi hien khi thuoc nhom dang chon
# ══════════════════════════════════════════════════════════════════════
# Quyen lay DUNG tu ma nguon, khong doan: doc dong `hasPermission(...)`
# ngay tren moi nut. Ban dau toi ghi nham 3 the (loyalty · flash dung
# manage_settings chu khong phai manage_promotions) va patch tu dung lai.
THE = [
    ("packages", "manage_users"),
    ("users", "manage_users"),
    ("permissions", "manage_permissions"),
    ("backup", "export_data"),
    ("loyalty", "manage_settings"),
    ("rewards", "manage_promotions"),
    ("signup", "manage_settings"),
    ("flash", "manage_settings"),
    ("tiers", "manage_promotions"),
]

# ══════════════════════════════════════════════════════════════════════
#  4 · Bang gia — 2 cot danh dau -> 1 cot nhan
# ══════════════════════════════════════════════════════════════════════
D_CU = """                    <th style={{ textAlign: 'center' }}>SP đặc biệt</th>
                    <th style={{ textAlign: 'center' }}>Áp voucher khách mới</th>"""

D_MOI = """                    {/* POS-BOCUC-v1: 2 cot o vuong -> 1 cot nhan bam duoc */}
                    <th>
                      Áp dụng cho
                      <div style={{ fontWeight: 400, fontSize: '0.75rem', color: '#9ca3af' }}>
                        bấm để bật hoặc tắt
                      </div>
                    </th>"""

E_CU = """                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!p.is_special_group}
                          onChange={e => updateSpecialGroup(getUniqueId(p), e.target.checked)}
                          title="SP thuộc nhóm đặc biệt (vd cà phê) — nhận % giảm hạng riêng, khác % giảm thường"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={signupGroupMembers.has(getUniqueId(p))}
                          onChange={() => toggleSignupGroupMember(getUniqueId(p))}
                          title="Món này được phép áp voucher khách-mới (giảm 50% 1 món)"
                        />
                      </td>"""

E_MOI = """                      {/* POS-BOCUC-v1: nhan bam duoc thay cho 2 o vuong.
                          Dam = dang bat · mo vien dut = dang tat. Goi DUNG hai
                          ham cu, khong viet lai gi. */}
                      <td>
                        {(() => {
                          const kieu = (bat) => ({
                            fontSize: '0.75rem', padding: '3px 10px', borderRadius: 12,
                            marginRight: 6, cursor: 'pointer',
                            background: bat ? '#fef3c7' : 'transparent',
                            color: bat ? '#92400e' : '#9ca3af',
                            border: bat ? 'none' : '1px dashed #d1d5db',
                          });
                          const dacBiet = !!p.is_special_group;
                          const coVoucher = signupGroupMembers.has(getUniqueId(p));
                          return (
                            <>
                              <button
                                style={kieu(coVoucher)}
                                onClick={() => toggleSignupGroupMember(getUniqueId(p))}
                                title="Món này được phép áp voucher khách-mới (giảm 50% 1 món)"
                              >
                                Voucher KH mới
                              </button>
                              <button
                                style={kieu(dacBiet)}
                                onClick={() => updateSpecialGroup(getUniqueId(p), !dacBiet)}
                                title="SP thuộc nhóm đặc biệt (vd cà phê) — nhận % giảm hạng riêng, khác % giảm thường"
                              >
                                SP đặc biệt
                              </button>
                            </>
                          );
                        })()}
                      </td>"""


def main():
    print("=" * 70)
    print("  PATCH P10b - POS-BOCUC-v1  (3 nhom the · cot nhan bam duoc)")
    print("=" * 70)

    if not os.path.isfile(F):
        thoat(f"Khong thay {F}. Cua so nay khong phai POS?")

    s = open(F, encoding="utf-8").read()

    if MARKER in s:
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return

    print("\n[1/4] Kiem phu thuoc va 13 mo neo (CHUA ghi gi)")
    if "POS-MOTNUTLUU-v1" not in s:
        thoat("Thieu POS-MOTNUTLUU-v1 — ap patch gop nut luu truoc.")
    print("   [ok] phu thuoc  POS-MOTNUTLUU-v1")

    for nhan, mo in [
        ("diem chen bang phan nhom", A_CU),
        ("dau thanh the", B_CU),
        ("tieu de 2 cot danh dau", D_CU),
        ("2 o vuong trong bang", E_CU),
    ]:
        n = s.count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' xuat hien {n} lan (can dung 1).")
        print(f"   [ok] Settings.jsx  {nhan}")

    # 9 the con lai: moi cai co dang {hasPermission('X') && (\n<button ... setTab('ma')
    goi = {}
    for ma, quyen in THE:
        cu = f"{{hasPermission('{quyen}') && (\n          <button className={{`btn ${{tab === '{ma}' ?"
        n = s.count(cu)
        if n != 1:
            thoat(f"Mo neo the '{ma}' xuat hien {n} lan (can dung 1).")
        goi[ma] = cu
    print(f"   [ok] Settings.jsx  ca {len(THE)} the con lai deu tim thay")

    print("\n[2/4] Luu ban truoc khi sua")
    shutil.copy2(F, F + HAU_TO)
    print(f"   -> {F}{HAU_TO}")

    print("\n[3/4] Ap 13 thay doi")
    s = s.replace(A_CU, A_MOI, 1)
    print("   [ok] Settings.jsx  bang phan nhom + trang thai nhom dang chon")
    s = s.replace(B_CU, B_MOI, 1)
    print("   [ok] Settings.jsx  hang chon nhom + the dau tien theo nhom")

    for ma, quyen in THE:
        cu = goi[ma]
        moi = (f"{{theTrongNhom.includes('{ma}') && hasPermission('{quyen}') && (\n"
               f"          <button className={{`btn ${{tab === '{ma}' ?")
        s = s.replace(cu, moi, 1)
    print(f"   [ok] Settings.jsx  {len(THE)} the con lai chi hien trong nhom cua no")

    # Doi 10 nut the: setTab(...) -> doiThe(...) de hoi truoc khi roi
    truoc_doi = s.count("onClick={() => setTab('")
    s = s.replace("onClick={() => setTab('", "onClick={() => doiThe('")
    print(f"   [ok] Settings.jsx  {truoc_doi} nut the hoi truoc khi roi (chong mat du lieu)")

    s = s.replace(D_CU, D_MOI, 1)
    print("   [ok] Settings.jsx  2 cot danh dau -> 1 cot nhan")
    s = s.replace(E_CU, E_MOI, 1)
    print("   [ok] Settings.jsx  2 o vuong -> 2 nhan bam duoc")

    print("\n[4/4] Chot 22 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        ra = []
        for d in v.split("\n"):
            t = d.strip()
            if t.startswith("//") or t.startswith("*") or t.startswith("/*") or t.startswith("{/*"):
                continue
            ra.append(d)
        return "\n".join(ra)

    ma_ = bo_ghi_chu(s)

    chot = [
        ("const NHOM_THE = [" in ma_,
         "co bang phan nhom"),

        (ma_.count("theTrongNhom.includes('") == 10,
         f"ca 10 the deu theo nhom (dang co {ma_.count(chr(34)+chr(34).join(['theTrongNhom.includes(',chr(39)]))})"),

        ("theTrongNhom.includes('products')" in ma_,
         "the Gia ban cung theo nhom"),

        (ma_.count("onClick={() => doiThe('") == 10,
         "ca 10 the di qua phep hoi truoc khi roi"),

        (ma_.count("onClick={() => setTab('") == 0,
         "khong con nut nao doi the THANG, bo qua phep hoi"),

        ("const doiThe = (t) => {" in ma_ and "window.confirm(" in ma_,
         "co hoi lai khi con thay doi chua luu"),

        ("t !== tab && tab === 'products'" in ma_,
         "chi hoi o the Gia ban — the khac khong co phep dem, hoi la bao nham"),

        ("if (tab === truoc) return;" in ma_,
         "bam Huy thi GIU nguyen ca nhom, khong de nhom nhay ma man hinh dung yen"),

        ("const nhomDangMo = (nhomHienDuoc.find(n => n.the.some(([t]) => t === tab))" in ma_,
         "nhom tu sang theo the dang mo"),

        ("const nhomHienDuoc = NHOM_THE.filter(n => theXemDuoc(n).length > 0);" in ma_,
         "nhom khong co the nao xem duoc thi AN han"),

        ("doiThe(ds[0]);" in ma_ and "if (ds.length && !ds.includes(tab)) {" in ma_,
         "bam sang nhom khac thi MO LUON the dau tien — noi dung khop ngay"),

        ("const ds = theXemDuoc(n);" in ma_,
         "mo the dau tien NGUOI DUNG XEM DUOC, khong phai the dau danh sach"),

        ("onClick={() => chonNhom(n)}" in ma_,
         "hang nhom goi ham chon, khong chi doi trang thai"),

        ("useEffect(() => { setNhomChon(nhomDangMo); }, [nhomDangMo]);" in ma_,
         "doi the tu noi khac thi nhom nhay theo"),

        (ma_.count("hasPermission('") >= 10,
         "quyen hien the giu y nguyen"),

        ("<th style={{ textAlign: 'center' }}>SP đặc biệt</th>" not in ma_,
         "khong con cot o vuong 'SP dac biet'"),

        ("<th style={{ textAlign: 'center' }}>Áp voucher khách mới</th>" not in ma_,
         "khong con cot o vuong 'Ap voucher'"),

        ("Áp dụng cho" in ma_,
         "co cot nhan gop"),

        ("type=\"checkbox\"\n                          checked={!!p.is_special_group}" not in ma_,
         "hai o vuong trong bang da thanh nhan"),

        ("onClick={() => updateSpecialGroup(getUniqueId(p), !dacBiet)}" in ma_
         and "onClick={() => toggleSignupGroupMember(getUniqueId(p))}" in ma_,
         "nhan goi DUNG hai ham cu, khong viet lai"),

        ("const demThayDoi = () => {" in ma_ and "onClick={luuTatCaThayDoi}" in ma_,
         "nut luu gop cua patch truoc KHONG bi dung toi"),

        ("border: bat ? 'none' : '1px dashed #d1d5db'" in ma_,
         "nhan tat co vien dut — nhin la biet dang bat hay tat"),
    ]

    hong = [t for ok, t in chot if not ok]
    for ok, t in chot:
        print(("   [ok] " if ok else "   [HONG] ") + t)
    if hong:
        os.remove(F + HAU_TO)
        thoat(f"{len(hong)} dieu kien khong dat. Da xoa ban luu, file goc nguyen ven.")

    open(F, "w", encoding="utf-8").write(s)

    print("\n[XONG]\n")
    print("  ⚠️  PHAI BUILD LAI CLIENT truoc khi commit:")
    print("      cd client && npm run build && cd ..\n")
    print("  Duong lui:")
    print(f"    cp {F}{HAU_TO} {F}")


if __name__ == "__main__":
    main()
