# -*- coding: utf-8 -*-
"""
======================================================================
  PATCH P11a - POS-NHANDIEM-v1   (ma tren bill = nhan diem tich luy)
======================================================================

KHAC GI BAN v2
  Doi mac dinh han MA tu 720 gio (30 ngay) ve 24 GIO theo y chu quan: ma tren
  bill chi song 24h de tao ap luc tao tai khoan ngay. Van chinh duoc trong
  cau hinh neu sau nay muon dai hon.

KHAC GI BAN v1 — LOI KHONG NHAT QUAN
  v1 de `expires_at = NULL` cho diem tu ma bill, trong khi diem BAN HANG tinh
  han theo cau hinh `loyalty_expiry_mode` (orders.js ~787): che do 'quarter'
  thi diem het han dau quy tuong ung nam sau.
  Hau qua: neu chu quan bat che do quy, diem ban hang het han con diem tu ma
  bill song VINH VIEN. Cung mot bang, hai luat khac nhau — sau nay doi chieu
  hay tinh ton diem se lech ma khong ai hieu vi sao.
  v2 dung DUNG cong thuc cua orders.js.

VI SAO DOI
  Hien ma in tren bill dung de doi lay VOUCHER GIAM GIA khi khach tao tai
  khoan. Nhung tao tai khoan lan dau von da co ma giam gia chao mung (se do
  App KH cap), nen cap them mot voucher nua la DU THUA.
  Doi thanh: ma tren bill cho NHAN DIEM TICH LUY cua chinh don vua mua.

MOI THONG SO DEU TUY CHINH — khong cam cung so nao
  Doc tu `pos_settings`, tien to `nhandiem_`:
    nhandiem_enabled       0 = tat  · 1 = bat          (mac dinh TAT)

  HAI LOAI HAN — KHONG lan nhau:
    · HAN CUA MA   = `nhandiem_han_gio`, tinh tu luc IN BILL. Qua han thi
                     khong nhap duoc nua. Mac dinh 24 gio.
    · HAN CUA DIEM = sau khi diem DA VAO TAI KHOAN thi song bao lau. KHONG
                     do patch nay quyet — lay theo `loyalty_expiry_mode` cua
                     he thong diem, GIONG HET diem mua hang binh thuong.
    nhandiem_he_so         2 = nhan doi · 3 = nhan ba  (mac dinh 2)
    nhandiem_han_gio       so GIO ke tu luc in bill    (mac dinh 24)
    nhandiem_chi_lan_dau   1 = moi SDT chi mot lan     (mac dinh 1)
                           0 = cho moi lan (chay chuong trinh khuyen mai)

  Mac dinh TAT vi App KH chua co. Bat luc nao la viec cua chu quan.
  Duong VOUCHER cu VAN NGUYEN VEN — hai duong doc lap, bat/tat rieng.

CACH TINH
  Diem goc = tong tien don / `loyalty_earn_per_amount` (dung cau hinh diem
  dang chay, KHONG tu dat cong thuc rieng).
    · Don CHUA duoc cong diem (khach khong cho SDT) -> cong  goc x he_so
    · Don DA duoc cong diem (khach co cho SDT)      -> cong them goc x (he_so - 1)
      de tong cong dung bang goc x he_so, KHONG cong doi.

KHAC GI BAN v3 — VA LO CHAY DUA
  v3 kiem `dong.diem_nhan_luc` o NGOAI giao dich roi moi vao trong cong diem.
  Hai nguoi nhap CUNG MOT MA cung luc: ca hai deu doc thay ma chua dung, ca hai
  deu cong diem -> mot ma cho diem HAI LAN.
  v4 chiem ma bang `UPDATE ... WHERE id = ? AND diem_nhan_luc IS NULL` va kiem
  so dong bi doi: chi MOT nguoi qua duoc, nguoi kia bi tra ve. Va CHIEM TRUOC
  roi moi cong diem — dao thu tu thi van ho.

  GHI DE SAU: duong /claim (doi voucher) co Y HET lo nay — kiem `claimed_at`
  ngoai giao dich. Ngoai pham vi patch nay, da ghi vao ho so.

CHONG LOI DUNG
  · Moi ma chi nhan diem MOT lan (cot `diem_nhan_luc`)
  · `chi_lan_dau=1` thi moi SDT chi nhan mot lan trong doi
  · Don DA HUY thi khong nhan diem
  · Qua han thi tu choi, noi ro qua bao lau

DIEU PATCH NAY CO TINH KHONG LAM
  Chua co man Cai dat de bam chinh, va bill van in chu cu "Ma uu dai khach
  moi". Do la patch P11b — lam sau khi phan may chu nay chay on.
  Tam thoi chinh cau hinh bang duong `/api/pos/settings` co san.

CHU Y
  Chi dung 2 file may chu — KHONG can build lai client.

DUONG LUI
  cp server/database.js.truoc_nhandiem        server/database.js
  cp server/routes/signup-codes.js.truoc_nhandiem server/routes/signup-codes.js
"""

import os
import sys
import shutil

MARKER = "POS-NHANDIEM-v1"
HAU_TO = ".truoc_nhandiem"

F_DB = os.path.join("server", "database.js")
F_ROUTE = os.path.join("server", "routes", "signup-codes.js")
TAT_CA = [F_DB, F_ROUTE]


def thoat(msg):
    print("\n[DUNG] " + msg)
    print("       Khong file nao bi sua.")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════
#  1 · database.js — 2 cot danh dau da nhan diem + cau hinh mac dinh
#
#  ALTER dat NGAY SAU CREATE TABLE cua chinh bang nay. Bai hoc cu: ALTER
#  dat truoc CREATE thi tren database moi tinh no nem loi, bi catch nuot,
#  va cot khong bao gio duoc them (loi cot `van_tay` tim ra 30.08).
# ══════════════════════════════════════════════════════════════════════
D_CU = """  console.log('✅ Đã đảm bảo bảng mã ưu đãi khách mới (pos_signup_codes)');"""

D_MOI = """  console.log('✅ Đã đảm bảo bảng mã ưu đãi khách mới (pos_signup_codes)');

  // POS-NHANDIEM-v1: đánh dấu mã đã dùng để NHÂN ĐIỂM (khác với claimed_at
  // là đã dùng để đổi voucher — hai việc độc lập, bật/tắt riêng).
  try {
    await db.execute(`ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_luc DATETIME`);
  } catch (e) { /* cột đã tồn tại */ }
  try {
    await db.execute(`ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_phone TEXT`);
  } catch (e) { /* cột đã tồn tại */ }

  // Cấu hình mặc định — chỉ chèn khi CHƯA có, không đè cấu hình owner đã đặt.
  // Mặc định TẮT vì App KH chưa có; bật lúc nào là việc của chủ quán.
  for (const [k, v] of [
    ['nhandiem_enabled', '0'],
    ['nhandiem_he_so', '2'],
    ['nhandiem_han_gio', '24'],
    ['nhandiem_chi_lan_dau', '1'],
  ]) {
    try {
      await db.execute({
        sql: `INSERT INTO pos_settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO NOTHING`,
        args: [k, v],
      });
    } catch (e) { /* đã có hoặc bảng chưa sẵn — bỏ qua */ }
  }
  console.log('✅ Đã đảm bảo cấu hình nhân điểm từ mã bill (POS-NHANDIEM-v1)');"""

# ══════════════════════════════════════════════════════════════════════
#  2 · signup-codes.js — duong nhan diem
# ══════════════════════════════════════════════════════════════════════
R_CU = """// POST /api/pos/signup-codes/claim"""

R_MOI = '''// ═══════════════════════════════════════════════════════════════════════════
//  POS-NHANDIEM-v1 — ma tren bill dung de NHAN DIEM TICH LUY cua don vua mua
//
//  Doc lap hoan toan voi duong /claim (doi voucher): hai viec khac nhau, bat
//  tat rieng, danh dau bang 2 cot khac nhau. Mot ma co the dung ca hai neu
//  chu quan bat ca hai.
// ═══════════════════════════════════════════════════════════════════════════

async function docCauHinhNhanDiem() {
  const rows = await query(
    "SELECT key, value FROM pos_settings WHERE key LIKE 'nhandiem_%'",
  );
  const c = {};
  for (const r of rows) c[r.key] = r.value;
  const heSo = Number(c.nhandiem_he_so);
  const hanGio = Number(c.nhandiem_han_gio);
  return {
    bat: c.nhandiem_enabled === '1' || c.nhandiem_enabled === 'true',
    heSo: Number.isFinite(heSo) && heSo >= 1 ? heSo : 2,
    hanGio: Number.isFinite(hanGio) && hanGio > 0 ? hanGio : 24,
    chiLanDau: c.nhandiem_chi_lan_dau !== '0',
  };
}

// POST /api/pos/signup-codes/nhan-diem
// Body: { code, phone }
router.post('/nhan-diem', authenticateServiceOrUser, async (req, res) => {
  try {
    const maGoc = String(req.body.code || '').trim().toUpperCase();
    const phone = normalizePhone(req.body.phone);

    if (!maGoc) return res.status(400).json({ success: false, error: 'Thiếu mã trên bill' });
    if (!phone) return res.status(400).json({ success: false, error: 'Số điện thoại không hợp lệ' });

    const ch = await docCauHinhNhanDiem();
    if (!ch.bat) {
      return res.status(400).json({
        success: false,
        error: 'Chương trình nhân điểm đang tắt.',
        code: 'NHANDIEM_DANG_TAT',
      });
    }

    const dong = await queryOne(
      'SELECT * FROM pos_signup_codes WHERE UPPER(code) = ?',
      [maGoc],
    );
    if (!dong) return res.status(404).json({ success: false, error: 'Mã không tồn tại' });

    if (dong.diem_nhan_luc) {
      return res.status(400).json({
        success: false,
        error: 'Mã này đã được dùng để nhận điểm rồi.',
        code: 'MA_DA_NHAN_DIEM',
      });
    }

    // Hạn tính bằng GIỜ kể từ lúc in bill — so bằng mili-giây, không phụ thuộc chuỗi.
    const lucIn = new Date(String(dong.issued_at).replace(' ', 'T') + 'Z').getTime();
    const bayGio = new Date(getNow().replace(' ', 'T') + 'Z').getTime();
    const daQua = (bayGio - lucIn) / (1000 * 60 * 60);
    if (!Number.isFinite(daQua) || daQua > ch.hanGio) {
      return res.status(400).json({
        success: false,
        error: `Mã đã hết hạn (quá ${ch.hanGio} giờ kể từ lúc in bill).`,
        code: 'MA_HET_HAN',
      });
    }

    if (ch.chiLanDau) {
      const daNhan = await queryOne(
        'SELECT id FROM pos_signup_codes WHERE diem_nhan_phone = ? LIMIT 1',
        [phone],
      );
      if (daNhan) {
        return res.status(400).json({
          success: false,
          error: 'Số điện thoại này đã từng nhận điểm nhân từ mã bill.',
          code: 'SDT_DA_NHAN',
        });
      }
    }

    if (!dong.order_id) {
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

    // Điểm gốc tính theo ĐÚNG cấu hình điểm đang chạy, không tự đặt công thức riêng.
    const loyRows = await query(
      "SELECT key, value FROM pos_settings WHERE key IN ('loyalty_enabled','loyalty_earn_per_amount','loyalty_expiry_mode')",
    );
    const loy = {};
    for (const r of loyRows) loy[r.key] = r.value;
    if (loy.loyalty_enabled !== '1' && loy.loyalty_enabled !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Chương trình tích điểm đang tắt.',
        code: 'TICH_DIEM_DANG_TAT',
      });
    }
    const moiBaoNhieu = Number(loy.loyalty_earn_per_amount);
    if (!Number.isFinite(moiBaoNhieu) || moiBaoNhieu < 1) {
      return res.status(400).json({ success: false, error: 'Cấu hình tích điểm chưa hợp lệ.' });
    }
    const diemGoc = Math.floor(Number(don.total || 0) / moiBaoNhieu);
    if (diemGoc <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Đơn này không đủ để tính điểm.',
        code: 'DON_KHONG_DU_DIEM',
      });
    }

    // Đơn đã được cộng điểm lúc bán (khách có cho SĐT) thì chỉ cộng BÙ phần
    // còn thiếu, để tổng đúng bằng gốc x hệ số — KHÔNG cộng đôi.
    const daCong = await queryOne(
      "SELECT id FROM pos_point_transactions WHERE order_id = ? AND type = 'earn' LIMIT 1",
      [don.id],
    );
    const diemCong = daCong
      ? Math.round(diemGoc * (ch.heSo - 1))
      : Math.round(diemGoc * ch.heSo);

    if (diemCong <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Hệ số hiện tại không cộng thêm điểm nào cho đơn này.',
        code: 'KHONG_THEM_DIEM',
      });
    }

    const now = getNow();

    // Han diem PHAI theo dung luat cua diem ban hang (orders.js ~787): che do
    // 'quarter' thi diem het han dau quy tuong ung nam sau. De NULL thi diem tu
    // ma bill song vinh vien trong khi diem ban hang het han — cung mot bang,
    // hai luat khac nhau.
    let hanDiem = null;
    if (loy.loyalty_expiry_mode === 'quarter') {
      const y = parseInt(now.slice(0, 4), 10);
      const m = parseInt(now.slice(5, 7), 10);
      const qStart = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10;
      const mm = qStart < 10 ? '0' + qStart : '' + qStart;
      hanDiem = (y + 1) + '-' + mm + '-01T00:00:00';
    }

    const tx = await beginTransaction();
    try {
      // CHIEM MA TRUOC, cong diem sau. `AND diem_nhan_luc IS NULL` la cho then
      // chot: hai nguoi nhap cung mot ma cung luc thi ca hai deu thay ma chua
      // dung (phep kiem o tren nam NGOAI giao dich), nhung chi MOT nguoi UPDATE
      // duoc — nguoi kia thay changes = 0 va bi chan. Khong co no thi ca hai
      // cung duoc cong diem.
      const chiem = await tx.run(
        `UPDATE pos_signup_codes SET diem_nhan_luc = ?, diem_nhan_phone = ?
          WHERE id = ? AND diem_nhan_luc IS NULL`,
        [now, phone, dong.id],
      );
      if (!chiem || chiem.changes === 0) {
        await tx.rollback();
        return res.status(400).json({
          success: false,
          error: 'Mã này vừa được dùng để nhận điểm.',
          code: 'MA_DA_NHAN_DIEM',
        });
      }
      await tx.run(
        `INSERT INTO pos_point_transactions
           (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at)
         VALUES (?, 'earn', ?, ?, ?, ?, ?, ?)`,
        [phone, diemCong, don.id, hanDiem,
         `Nhân ${ch.heSo} điểm từ mã bill ${maGoc} (đơn ${don.code})`,
         (req.user && req.user.username) || 'service', now],
      );
      await tx.commit();
    } catch (e) {
      try { await tx.rollback(); } catch {}
      throw e;
    }

    res.json({
      success: true,
      diem_cong: diemCong,
      diem_goc: diemGoc,
      he_so: ch.heSo,
      het_han: hanDiem,
      da_cong_truoc_do: !!daCong,
      don: don.code,
      message: `Đã cộng ${diemCong} điểm cho ${phone} từ đơn ${don.code}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pos/signup-codes/claim'''


def main():
    print("=" * 70)
    print("  PATCH P11a - POS-NHANDIEM-v1  (ma tren bill = nhan diem tich luy)")
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

    print("\n[1/4] Kiem phu thuoc va 2 mo neo (CHUA ghi gi)")
    for ten, mo in [
        ("beginTransaction", "beginTransaction"),
        ("queryOne", "queryOne"),
        ("getNow", "getNow"),
        ("normalizePhone", "normalizePhone"),
    ]:
        if mo not in noi[F_ROUTE]:
            thoat(f"signup-codes.js khong nap {ten} — file khong dung nhu mong doi.")
    print("   [ok] signup-codes.js co san beginTransaction · queryOne · getNow · normalizePhone")

    for f, nhan, mo in [
        (F_DB, "cuoi khoi tao bang ma uu dai", D_CU),
        (F_ROUTE, "diem chen truoc duong claim", R_CU),
    ]:
        n = noi[f].count(mo)
        if n != 1:
            thoat(f"Mo neo '{nhan}' trong {f} xuat hien {n} lan (can dung 1).")
        print(f"   [ok] {os.path.basename(f):18} {nhan}")

    print("\n[2/4] Luu ban truoc khi sua")
    for f in TAT_CA:
        shutil.copy2(f, f + HAU_TO)
        print(f"   -> {f}{HAU_TO}")

    print("\n[3/4] Ap 2 thay doi")
    noi[F_DB] = noi[F_DB].replace(D_CU, D_MOI, 1)
    print("   [ok] database.js        2 cot moi + 4 cau hinh mac dinh")
    noi[F_ROUTE] = noi[F_ROUTE].replace(R_CU, R_MOI, 1)
    print("   [ok] signup-codes.js    duong nhan diem")

    print("\n[4/4] Chot 23 dieu kien (sai mot dieu la khong ghi gi)")

    def bo_ghi_chu(v):
        return "\n".join(
            d for d in v.split("\n")
            if not (d.strip().startswith("//") or d.strip().startswith("*")
                    or d.strip().startswith("/*"))
        )

    ma = {f: bo_ghi_chu(noi[f]) for f in TAT_CA}

    chot = [
        ("ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_luc" in ma[F_DB]
         and "ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_phone" in ma[F_DB],
         "them du 2 cot danh dau da nhan diem"),

        (ma[F_DB].find("CREATE TABLE IF NOT EXISTS pos_signup_codes")
         < ma[F_DB].find("ALTER TABLE pos_signup_codes ADD COLUMN diem_nhan_luc"),
         "ALTER dat SAU CREATE — khong lap lai loi cot van_tay"),

        ("'nhandiem_enabled', '0'" in ma[F_DB],
         "mac dinh TAT — chu quan tu bat khi san sang"),

        ("'nhandiem_han_gio', '24'" in ma[F_DB],
         "mac dinh han MA la 24 gio (tao ap luc tao tai khoan ngay)"),

        ("ON CONFLICT(key) DO NOTHING" in ma[F_DB],
         "khong de len cau hinh chu quan da dat"),

        ("nhandiem_he_so" in ma[F_ROUTE] and "nhandiem_han_gio" in ma[F_ROUTE]
         and "nhandiem_chi_lan_dau" in ma[F_ROUTE],
         "ca 3 thong so deu doc tu cau hinh, khong cam cung"),

        ("router.post('/nhan-diem'" in ma[F_ROUTE],
         "co duong nhan diem"),

        ("NHANDIEM_DANG_TAT" in ma[F_ROUTE],
         "tat thi tu choi ro rang"),

        ("MA_DA_NHAN_DIEM" in ma[F_ROUTE],
         "moi ma chi nhan diem MOT lan"),

        ("SDT_DA_NHAN" in ma[F_ROUTE] and "ch.chiLanDau" in ma[F_ROUTE],
         "co the gioi han moi SDT mot lan, va tat duoc de chay chuong trinh"),

        ("DON_DA_HUY" in ma[F_ROUTE],
         "don da huy thi khong nhan diem"),

        ("MA_HET_HAN" in ma[F_ROUTE] and "ch.hanGio" in ma[F_ROUTE],
         "han tinh theo cau hinh, khong cam cung 24h"),

        ("loyalty_earn_per_amount" in ma[F_ROUTE],
         "diem goc tinh theo cau hinh diem dang chay"),

        ("Math.round(diemGoc * (ch.heSo - 1))" in ma[F_ROUTE],
         "don DA cong diem thi chi cong BU, khong cong doi"),

        ("UPDATE pos_signup_codes SET diem_nhan_luc" in ma[F_ROUTE]
         and ma[F_ROUTE].find("const tx = await beginTransaction();")
             < ma[F_ROUTE].find("UPDATE pos_signup_codes SET diem_nhan_luc"),
         "cong diem va danh dau ma nam trong MOT giao dich"),

        ("try { await tx.rollback(); } catch {}" in ma[F_ROUTE],
         "loi giua chung thi huy sach, khong de ma danh dau ma diem chua cong"),

        ("AND diem_nhan_luc IS NULL" in ma[F_ROUTE],
         "chiem ma bang dieu kien — hai nguoi cung luc chi MOT nguoi qua"),

        ("chiem.changes === 0" in ma[F_ROUTE],
         "kiem so dong bi doi, khong tin phep kiem ngoai giao dich"),

        (ma[F_ROUTE].find("UPDATE pos_signup_codes SET diem_nhan_luc")
         < ma[F_ROUTE].find("INSERT INTO pos_point_transactions"),
         "CHIEM MA truoc, cong diem sau — thu tu nay moi chan duoc"),

        ("router.post('/claim'" in ma[F_ROUTE],
         "duong doi voucher cu VAN NGUYEN VEN"),

        ("loyalty_expiry_mode" in ma[F_ROUTE],
         "han diem doc theo cau hinh, khong de vinh vien"),

        ("hanDiem = (y + 1)" in ma[F_ROUTE],
         "che do quy tinh GIONG HET diem ban hang (orders.js)"),

        ("VALUES (?, 'earn', ?, ?, ?, ?, ?, ?)" in ma[F_ROUTE],
         "cau lenh ghi diem co truyen han vao, khong cam NULL"),
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
    print("    node --check server/database.js")
    print("    node --check server/routes/signup-codes.js\n")
    print("  Bat chuong trinh (sau khi deploy) — dat qua duong cai dat co san:")
    print("    nhandiem_enabled = 1")
    print("    nhandiem_he_so = 2 (hoac 3)")
    print("    nhandiem_han_gio = 720 (30 ngay)")
    print("    nhandiem_chi_lan_dau = 1\n")
    print("  Duong lui:")
    for f in TAT_CA:
        print(f"    cp {f}{HAU_TO} {f}")


if __name__ == "__main__":
    main()
