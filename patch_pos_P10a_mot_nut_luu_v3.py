# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P10a - POS-MOTNUTLUU-v1   (gop hai nut luu thanh mot)
======================================================================

VAN DE — CHO DE MAT DU LIEU NHAT TRONG CA MAN HINH

  The "Gia ban" hien co HAI nut luu cho CUNG MOT BANG:
      [Luu tat ca]                  -> luu gia + co "SP dac biet"
      [Luu nhom voucher khach moi]  -> luu rieng cot "Ap voucher khach moi"
  Kem mot dong giai thich:
      "Cot 'Ap voucher khach moi' luu rieng, khong chung nut 'Luu tat ca'"

  Go gia cho 5 mon roi tick them 2 o voucher, bam "Luu tat ca" -> phan voucher
  KHONG duoc luu. Bam nut kia -> phan gia KHONG duoc luu. Bam mot nut roi tai
  lai trang la MAT phan con lai, khong co canh bao gi.

  Dong giai thich kia ton tai chi de bao chua cho bo cuc. Mot dong huong dan
  sinh ra vi giao dien lam nguoc voi truc giac thi cai can sua la giao dien.

SUA GI
  Mot nut duy nhat luu CA HAI, va DEM so thay doi dang cho:
      [Luu thay doi (3)]   <- 3 dong da sua
      [Chua co thay doi]   <- khong co gi de luu thi nut MO DI
  Bo dong giai thich.

CACH GOP AN TOAN
  KHONG viet lai hai ham luu. Nut moi goi lan luot `savePrices()` roi
  `saveSignupGroup()` — hai duong may chu giu NGUYEN VEN, khong doi mot byte.
  Chi doi cach nguoi dung bam.

KHAC GI BAN v2 — LOI NANG
  Hai ham luu cu deu NUOT LOI (catch xong chi hien thong bao). Nut gop cua v2
  goi chung roi chup lai ban moi bat ke ket qua -> LUU HONG ma nut van ve
  "Chua co thay doi", nguoi dung tuong da luu xong va tai lai trang la mat
  sach phan vua go. Dung cai loi ma patch nay sinh ra de chua.
  v3: hai ham tra ve true/false, chi chup khi CA HAI thanh cong; hong thi noi
  ro va giu nguyen so thay doi de bam lai.

KHAC GI BAN v1
  v1 chup ban dau ngay sau khi tai san pham — nhung NHOM VOUCHER tai sau do
  mot dong. Ban chup ghi nhom rong, den khi nhom tai xong phep dem thay khac
  -> mo the Gia ban ra la nut da hien "Luu thay doi (1)" du chua ai lam gi.
  v2 chup khi `loading` ve false, luc ca hai deu da xong.

DEM THAY DOI THE NAO
  So sanh danh sach hien tai voi ban chup luc vua tai xong:
    · gia khac        -> dong do tinh la 1 thay doi
    · co "SP dac biet" khac
    · tick voucher khac (so sanh tap hop)
  Tai lai hoac luu xong thi chup lai, dem ve 0.

DIEU PATCH NAY CO TINH KHONG LAM
  KHONG dong den 9 the tren cung va KHONG doi 2 cot danh dau thanh nhan —
  do la P10b, lam rieng de neu co gi hong thi biet ngay do phan nao.

CHU Y - PHAI BUILD LAI CLIENT
      cd client && npm run build && cd ..

DUONG LUI
  cp client/src/pages/Settings.jsx.truoc_motnutluu client/src/pages/Settings.jsx
"""

import os
import sys
import shutil

MARKER = "POS-MOTNUTLUU-v1"
HAU_TO = ".truoc_motnutluu"
F = os.path.join("client", "src", "pages", "Settings.jsx")


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · Ban chup de dem thay doi + ham luu gop
# ══════════════════════════════════════════════════════════════════════
A_CU = """  const saveSignupGroup = async () => {"""

A_MOI = """  // ═══ POS-MOTNUTLUU-v1 ════════════════════════════════════════════════
  // Ban chup luc vua tai xong, de biet dong nao da bi sua.
  const [banChupGia, setBanChupGia] = useState(null);

  // Chup lai: goi sau khi tai danh sach va sau khi luu xong.
  const chupLaiGia = (ds, nhom) => {
    setBanChupGia({
      gia: JSON.stringify((ds || []).map(p => [
        `${p.sx_product_type}_${p.sx_product_id}`, p.price ?? null, !!p.is_special_group,
      ])),
      nhom: JSON.stringify(Array.from(nhom || []).sort()),
    });
  };

  // Dem so dong da sua. Tick voucher khong gan voi dong nao cu the nen dem
  // rieng: co doi tap hop hay khong (0 hoac 1).
  const demThayDoi = () => {
    if (!banChupGia) return 0;
    let n = 0;
    try {
      const cu = new Map(JSON.parse(banChupGia.gia).map(x => [x[0], x]));
      for (const p of products) {
        const k = `${p.sx_product_type}_${p.sx_product_id}`;
        const c = cu.get(k);
        if (!c) { n++; continue; }
        if ((p.price ?? null) !== c[1] || !!p.is_special_group !== c[2]) n++;
      }
      if (JSON.stringify(Array.from(signupGroupMembers).sort()) !== banChupGia.nhom) n++;
    } catch { return 0; }
    return n;
  };

  // MOT nut luu CA HAI. Khong viet lai hai ham cu — goi lan luot, hai duong
  // may chu giu nguyen ven.
  const luuTatCaThayDoi = async () => {
    // CHI chup lai khi CA HAI thanh cong. Luu hong ma van chup thi nut ve 0
    // va nguoi dung tuong da luu xong — mat phan vua go ma khong biet.
    const okGia = await savePrices();
    const okNhom = await saveSignupGroup();
    if (okGia && okNhom) {
      chupLaiGia(products, signupGroupMembers);
    } else {
      setMessage('Chưa lưu được hết — số thay đổi vẫn còn, bấm lại để thử.');
      setTimeout(() => setMessage(''), 5000);
    }
  };
  // ═══ het POS-MOTNUTLUU-v1 ════════════════════════════════════════════

  const saveSignupGroup = async () => {"""

# ══════════════════════════════════════════════════════════════════════
#  1b · Hai ham luu cu phai BAO duoc thanh cong hay that bai
#
#  Ca hai deu NUOT LOI: catch xong chi `setMessage('Loi: ...')` roi thoi.
#  Nut gop goi chung roi chup lai ban moi -> LUU HONG ma nut van ve 0,
#  nguoi dung tuong da luu xong. Day la loi nang nhat cua ban v2.
#  Sua: tra ve true/false. Cho goi cu (dong ~1631) bo qua gia tri tra ve
#  nen KHONG anh huong gi.
# ══════════════════════════════════════════════════════════════════════
E1_CU = """      setMessage('Đã lưu giá thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }"""

E1_MOI = """      setMessage('Đã lưu giá thành công!');
      setTimeout(() => setMessage(''), 3000);
      return true;   // POS-MOTNUTLUU-v1: bao cho nut gop biet da luu duoc
    } catch (err) { setMessage('Lỗi: ' + err.message); return false; }
    finally { setSaving(false); }"""

E2_CU = """      setMessage(data.success ? `Đã lưu nhóm sản phẩm (${data.data.count} món)` : 'Lỗi: ' + data.error);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setSavingSignupGroup(false);
    }"""

E2_MOI = """      setMessage(data.success ? `Đã lưu nhóm sản phẩm (${data.data.count} món)` : 'Lỗi: ' + data.error);
      setTimeout(() => setMessage(''), 3000);
      return !!data.success;   // POS-MOTNUTLUU-v1: may chu tra success=false cung la HONG
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
      return false;
    } finally {
      setSavingSignupGroup(false);
    }"""

# ══════════════════════════════════════════════════════════════════════
#  2 · Giao dien — mot nut, bo dong giai thich
# ══════════════════════════════════════════════════════════════════════
B_CU = """              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>Quản lý giá bán</div>
                <button className="btn btn-primary" onClick={savePrices} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu tất cả'}
                </button>
              </div>
              <div className="flex flex-between mb-2">
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                  Cột "Áp voucher khách mới" lưu riêng, không chung nút "Lưu tất cả" ở trên.
                </p>
                <button className="btn btn-secondary" onClick={saveSignupGroup} disabled={savingSignupGroup}>
                  <Save size={16} /> {savingSignupGroup ? 'Đang lưu...' : 'Lưu nhóm voucher khách mới'}
                </button>
              </div>"""

B_MOI = """              {/* POS-MOTNUTLUU-v1: MOT nut luu ca gia lan tick voucher.
                  Truoc day hai nut rieng cho cung mot bang, kem mot dong giai
                  thich — go gia xong bam nham nut la mat phan vua go. */}
              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>Quản lý giá bán</div>
                {(() => {
                  const soDoi = demThayDoi();
                  const dangLuu = saving || savingSignupGroup;
                  return (
                    <button
                      className={`btn ${soDoi > 0 ? 'btn-primary' : 'btn-outline'}`}
                      onClick={luuTatCaThayDoi}
                      disabled={dangLuu || soDoi === 0}
                      title={soDoi > 0
                        ? `${soDoi} dòng đã sửa — lưu cả giá và tick voucher trong một lần`
                        : 'Chưa sửa gì'}
                    >
                      <Save size={16} />{' '}
                      {dangLuu ? 'Đang lưu...' : soDoi > 0 ? `Lưu thay đổi (${soDoi})` : 'Chưa có thay đổi'}
                    </button>
                  );
                })()}
              </div>"""

# ══════════════════════════════════════════════════════════════════════
#  3 · Chup ban dau — PHAI doi CA HAI tai xong
#
#  Ban dau dinh chup ngay sau `setProducts(data)`, nhung nhom voucher tai
#  SAU do (`await loadSignupGroup()` o dong ke tiep). Chup som thi ban chup
#  ghi nhom RONG, den khi nhom tai xong phep dem thay khac -> mo the ra la
#  nut da hien "Luu thay doi (1)" du chua ai lam gi.
#  Chup khi `loading` chuyen ve false: luc do CA HAI deu da xong.
# ══════════════════════════════════════════════════════════════════════
D_CU = """  useEffect(() => { loadData(); }, [tab]);"""

D_MOI = """  useEffect(() => { loadData(); }, [tab]);

  // POS-MOTNUTLUU-v1: chup khi tai xong HAN (loading ve false), khong chup
  // giua chung. Chi phu thuoc [tab, loading] nen KHONG chay lai khi nguoi
  // dung go gia — neu phu thuoc products thi ban chup bi ghi de va so thay
  // doi luon bang 0.
  useEffect(() => {
    if (tab === 'products' && !loading) {
      chupLaiGia(products, signupGroupMembers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loading]);"""


def main():
    print("=" * 70)
    print("  PATCH P10a - POS-MOTNUTLUU-v1  (gop hai nut luu thanh mot)")
    print("=" * 70)

    if not os.path.isfile(F):
        thoat(f"Khong thay {F}. Cua so nay khong phai POS?")

    s = open(F, encoding="utf-8").read()

    if MARKER in s:
        print("\n[BO QUA] Patch nay da duoc ap tu truoc.")
        return

    print("\n[1/4] Kiem phu thuoc va 5 mo neo (CHUA ghi gi)")
    for ten in ["savePrices", "saveSignupGroup", "signupGroupMembers", "useEffect"]:
        if ten not in s:
            thoat(f"Settings.jsx khong co `{ten}` — file khong dung nhu mong doi.")
    print("   [ok] co san savePrices · saveSignupGroup · signupGroupMembers")

    for nhan, mo in [
        ("diem chen ham moi", A_CU),
        ("khoi hai nut luu", B_CU),
        ("dong goi tai du lieu", D_CU),
    ]:
        n = s.count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' xuat hien {n} lan (can dung 1).")
        print(f"   [ok] Settings.jsx  {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    shutil.copy2(F, F + HAU_TO)
    print(f"   -> {F}{HAU_TO}")

    print("\n[3/4] Ap 3 thay doi")
    s = s.replace(A_CU, A_MOI, 1)
    print("   [ok] Settings.jsx  ban chup + ham dem + ham luu gop")
    s = s.replace(B_CU, B_MOI, 1)
    print("   [ok] Settings.jsx  mot nut duy nhat, bo dong giai thich")

    s = s.replace(D_CU, D_MOI, 1)
    print("   [ok] Settings.jsx  chup ban dau SAU khi tai xong ca hai")
    s = s.replace(E1_CU, E1_MOI, 1)
    print("   [ok] Settings.jsx  ham luu gia bao duoc thanh/bai")
    s = s.replace(E2_CU, E2_MOI, 1)
    print("   [ok] Settings.jsx  ham luu nhom bao duoc thanh/bai")

    print("\n[4/4] Chot 18 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        ra = []
        for d in v.split("\n"):
            t = d.strip()
            if t.startswith("//") or t.startswith("*") or t.startswith("/*") or t.startswith("{/*"):
                continue
            ra.append(d)
        return "\n".join(ra)

    ma = bo_ghi_chu(s)

    chot = [
        ("const luuTatCaThayDoi = async () => {" in ma,
         "co ham luu gop"),

        ("await savePrices();" in ma and "await saveSignupGroup();" in ma,
         "goi lai HAI ham cu, khong viet lai duong may chu"),

        (ma.find("await savePrices();") < ma.find("await saveSignupGroup();"),
         "luu gia truoc, luu tick voucher sau"),

        ('Cột "Áp voucher khách mới" lưu riêng' not in ma,
         "dong giai thich bao chua cho bo cuc da bien mat"),

        ("Lưu nhóm voucher khách mới" not in ma,
         "khong con nut luu thu hai"),

        (ma.count("onClick={savePrices}") == 0,
         "khong con nut nao goi thang savePrices"),

        ("onClick={luuTatCaThayDoi}" in ma,
         "nut duy nhat goi ham gop"),

        ("const demThayDoi = () => {" in ma,
         "co ham dem thay doi"),

        ("disabled={dangLuu || soDoi === 0}" in ma,
         "khong co gi doi thi nut MO DI, khong bam nham duoc"),

        ("`Lưu thay đổi (${soDoi})`" in ma,
         "nut hien SO dong da sua"),

        ("const okGia = await savePrices();" in ma
         and "if (okGia && okNhom) {" in ma,
         "CHI chup lai khi CA HAI luu thanh cong"),

        ("return !!data.success;" in ma,
         "may chu tra success=false cung tinh la HONG"),

        (ma.count("return false;") >= 2,
         "ca hai ham deu bao that bai ra ngoai"),

        ("Chưa lưu được hết" in ma,
         "luu hong thi noi ro, so thay doi VAN con de bam lai"),

        (ma.count("chupLaiGia(products, signupGroupMembers);") == 2,
         "chup ban dau sau khi tai xong VA chup lai sau khi luu"),

        ("}, [tab, loading]);" in ma,
         "chup khi `loading` ve false — doi CA HAI tai xong"),

        ("chupLaiGia(data," not in ma,
         "KHONG chup giua chung khi nhom voucher chua tai xong"),

        ("const saveSignupGroup = async () => {" in ma
         and "const savePrices = async () => {" in ma,
         "hai ham luu cu VAN NGUYEN VEN"),
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
