/**
 * GIẢ LẬP QUẦY (TU-CHAY-4) — 16 bất biến sổ sách. SQL CHỈ ĐỌC trên kho tạm.
 *
 * Mỗi hàm I<n>(q, ctx) trả mảng chuỗi mô tả dòng lệch — rỗng = đạt. Mô tả phải
 * ỔN ĐỊNH (có mã đơn, số tiền) vì chay.js chỉ in lần đầu một lệch xuất hiện.
 * Câu SQL viết từ schema THẬT (database.js) và code thật — xem ke_hoach.md mục 3.
 *
 * I8 MÔ TẢ LUẬT ĐIỂM HIỆN TẠI (chủ quán chốt 02.10.2026): đơn chưa thu và đơn đã
 * huỷ VẪN giữ điểm. P22 (điểm chỉ cộng khi thu đủ) và P24 (huỷ đơn trừ điểm)
 * PHẢI sửa I8 cùng lúc — phiếu của hai việc đó phải ghi tên file này.
 */

// Chép wallets.js:240 (không export). Bộ kiểm nhóm S so khớp hai bản — sửa một bên là đỏ.
const LOAI_TINH_VAO_VI = ['topup', 'purchase', 'refund', 'adjust', 'compensation'];
const IN = (ds) => ds.map((t) => `'${t}'`).join(', ');
const so = (x) => Number(x || 0);
const tien = (x) => so(x).toLocaleString('vi-VN') + 'đ';

const BAT_BIEN = {
  // I1 — mã bill chỉ dùng trên đơn đã thu, chưa huỷ. Huỷ/hoàn SAU lúc dùng là hợp lệ (>= vì getNow theo giây).
  // Nhánh 'refunded': KB13 (P26b) phủ — dùng mã rồi hoàn qua yêu cầu + duyệt. Đổi nhánh này thành false → KB13 → I1 lệch
  // (viec/P26b/dot_bien.py chạy thử). KB12 KHÔNG phủ (không dùng mã).
  async I1(q) {
    const ds = await q(`SELECT s.code, o.code AS don, o.status, o.payment_status, o.cancelled_at,
        CASE WHEN s.claimed_at IS NULL THEN s.diem_nhan_luc WHEN s.diem_nhan_luc IS NULL THEN s.claimed_at
             ELSE MIN(s.claimed_at, s.diem_nhan_luc) END AS luc_dung,
        (SELECT MAX(r.processed_at) FROM pos_refund_requests r WHERE r.order_id = o.id AND r.status = 'approved') AS luc_hoan
      FROM pos_signup_codes s JOIN pos_orders o ON o.id = s.order_id
      WHERE s.claimed_at IS NOT NULL OR s.diem_nhan_luc IS NOT NULL`);
    return ds.filter((r) => !(r.payment_status === 'paid' && (r.status === 'completed'
      || (r.status === 'cancelled' && String(r.cancelled_at) >= String(r.luc_dung))
      || (r.status === 'refunded' && String(r.luc_hoan) >= String(r.luc_dung)))))
      .map((r) => `mã ${r.code} đã dùng trên đơn ${r.don} (${r.status} · ${r.payment_status})`);
  },
  // I2 — không có mã bill mồ côi (không gắn đơn, hoặc đơn không còn).
  async I2(q) {
    const ds = await q(`SELECT s.code, s.order_id FROM pos_signup_codes s LEFT JOIN pos_orders o ON o.id = s.order_id WHERE o.id IS NULL`);
    return ds.map((r) => `mã ${r.code} mồ côi (order_id ${r.order_id})`);
  },
  // I3 — không có đơn ở trạng thái lạ; trạng thái tiền khớp số nợ.
  async I3(q) {
    const ds = await q(`SELECT code, status, payment_status, debt_amount FROM pos_orders
      WHERE COALESCE(payment_status, '') NOT IN ('paid', 'partial', 'pending')
         OR COALESCE(status, '') NOT IN ('completed', 'cancelled', 'refunded')
         OR (payment_status = 'paid' AND COALESCE(debt_amount, 0) <> 0)
         OR (payment_status IN ('partial', 'pending') AND COALESCE(debt_amount, 0) <= 0)`);
    return ds.map((r) => `đơn ${r.code}: ${r.status} · ${r.payment_status} · nợ ${tien(r.debt_amount)}`);
  },
  // I4 — số dư ví = tổng các dòng sổ thuộc danh sách trắng.
  async I4(q) {
    const ds = await q(`SELECT p.phone, w.balance,
        (SELECT COALESCE(SUM(t.amount), 0) FROM pos_balance_transactions t
          WHERE t.customer_phone = p.phone AND t.type IN (${IN(LOAI_TINH_VAO_VI)})) AS so_sach
      FROM (SELECT phone FROM pos_wallets UNION
            SELECT customer_phone FROM pos_balance_transactions WHERE type IN (${IN(LOAI_TINH_VAO_VI)})) p
      LEFT JOIN pos_wallets w ON w.phone = p.phone`);
    return ds.filter((r) => Math.abs(so(r.balance) - so(r.so_sach)) > 0.5)
      .map((r) => `ví ${r.phone}: số dư ${tien(r.balance)} ≠ sổ ${tien(r.so_sach)}, lệch ${tien(so(r.balance) - so(r.so_sach))}`);
  },
  // I5 — không có loại dòng ví lạ. debt_payment là loại đã biết, KHÔNG tính vào ví (wallets.js:236).
  async I5(q) {
    const ds = await q(`SELECT type, COUNT(*) AS n FROM pos_balance_transactions
      WHERE type NOT IN (${IN([...LOAI_TINH_VAO_VI, 'debt_payment'])}) GROUP BY type`);
    return ds.map((r) => `loại dòng ví lạ "${r.type}": ${r.n} dòng`);
  },
  // I6 — mỗi đơn thu đúng một lần: tiền mặt + CK + ví + ví mẹ + nợ còn lại = tổng đơn (±1đ như orders.js:751).
  async I6(q) {
    const ds = await q(`SELECT code, total, COALESCE(cash_amount, 0) + COALESCE(transfer_amount, 0) + COALESCE(balance_amount, 0)
      + COALESCE(parent_balance_amount, 0) + COALESCE(debt_amount, 0) AS da_ghi FROM pos_orders`);
    return ds.filter((r) => Math.abs(so(r.da_ghi) - so(r.total)) > 1)
      .map((r) => `đơn ${r.code}: đã ghi ${tien(r.da_ghi)} ≠ tổng ${tien(r.total)}, lệch ${tien(so(r.da_ghi) - so(r.total))}`);
  },
  // I7 — mỗi vân tay kho được LÀM ĐÚNG MỘT LẦN: bán → out mỗi món có mã SX; huỷ → thêm in. stt = thứ hạng id trong đơn
  // (orders.js:987–989 theo mảng, :1502–1513 theo SELECT — món INSERT đúng thứ tự mảng).
  // LUOI-1 B4 (AU-G6): "làm" = SX giả nhận, HOẶC một dòng nợ kho CHƯA xong (orders.js:946/:1435/:1568) — không cả hai, không
  // thiếu. Nợ đã xong (đẩy sổ nợ, doSoNo.js) ⇒ SX nhận đúng một lần. Mỗi vân tay SX giả báo lỗi ⇔ đúng một dòng nợ (bắt cả
  // đơn đã xoá); dòng nợ không có lần lỗi tương ứng → lệch (kịch bản không bật lỗi thì như luật cũ: không được có nợ kho);
  // lỗi xảy ra ở kịch bản không bật công tắc (kể cả lúc dựng dữ liệu = kịch bản 0) → lệch.
  async I7(q, ctx) {
    const mon = await q(`SELECT o.id, o.code, o.status,
        (SELECT COUNT(*) FROM pos_order_items x WHERE x.order_id = oi.order_id AND x.id < oi.id) AS stt
      FROM pos_order_items oi JOIN pos_orders o ON o.id = oi.order_id JOIN pos_products p ON p.id = oi.product_id
      WHERE COALESCE(p.sx_product_type, '') <> ''`);
    const can = new Map();
    for (const m of mon) {
      can.set(`POS:${m.id}:out:${m.stt}`, m.code);
      if (m.status === 'cancelled') can.set(`POS:${m.id}:in:${m.stt}`, m.code);
    }
    const dem = new Map();
    for (const n of ctx.nhanKho) dem.set(n.van_tay, (dem.get(n.van_tay) || 0) + 1);
    const no = await q('SELECT order_code, van_tay, status FROM pos_stock_pending');
    const soNo = new Map(), chuaXong = new Map(), daXong = new Map();
    const cong = (m, k) => m.set(k, (m.get(k) || 0) + 1);
    for (const r of no) { cong(soNo, r.van_tay); cong(r.status === 'resolved' ? daXong : chuaXong, r.van_tay); }
    const hong = ctx.sxGia.hong;
    const loi = new Set(hong.map((h) => h.van_tay));
    const lech = [];
    for (const [vt, don] of can) {
      if ((dem.get(vt) || 0) + (chuaXong.get(vt) || 0) !== 1) {
        lech.push(`vân tay ${vt} (đơn ${don}) SX nhận ${dem.get(vt) || 0} lần` + (chuaXong.get(vt) ? `, nợ kho chưa xong ${chuaXong.get(vt)} dòng` : ''));
      }
    }
    for (const [vt, n] of dem) if (!can.has(vt)) lech.push(`SX nhận vân tay lạ ${vt} × ${n}`);
    for (const [vt, n] of daXong) if (n !== 1 || dem.get(vt) !== 1) lech.push(`nợ kho ${vt} đã xong ${n} dòng, SX nhận ${dem.get(vt) || 0} lần`);
    for (const r of no) if (!r.van_tay || !loi.has(r.van_tay)) lech.push(`nợ kho ${r.van_tay} (${r.order_code}) không có lần SX lỗi tương ứng`);
    for (const vt of loi) if (soNo.get(vt) !== 1) lech.push(`SX báo lỗi vân tay ${vt}, sổ nợ kho có ${soNo.get(vt) || 0} dòng`);
    for (const h of hong) if (!ctx.sxGia.kbBat.has(h.kb)) lech.push(`SX lỗi ở kịch bản ${h.kb} không bật công tắc lỗi (vân tay ${h.van_tay})`);
    return lech;
  },
  // I8 — điểm mỗi đơn đúng luật HIỆN TẠI. g = floor(total/per), k = hệ số. Nhận điểm mã bill: g + round(g×(k−1)) nếu đơn
  // đã có điểm lúc bán, round(g×k) nếu chưa (signup-codes.js:197–214). Lúc bán: có SĐT, total > 0, không flash (orders.js:775).
  async I8(q) {
    const cfg = Object.fromEntries((await q(`SELECT key, value FROM pos_settings
      WHERE key IN ('loyalty_enabled', 'loyalty_earn_per_amount', 'nhandiem_he_so')`)).map((r) => [r.key, r.value]));
    const per = Number(cfg.loyalty_earn_per_amount);
    const k = Number(cfg.nhandiem_he_so) >= 1 ? Number(cfg.nhandiem_he_so) : 2;
    const ds = await q(`SELECT o.code, o.total, o.customer_phone, COALESCE(o.flash_discount, 0) AS flash,
        (SELECT COALESCE(SUM(t.points), 0) FROM pos_point_transactions t WHERE t.order_id = o.id) AS diem,
        (SELECT COUNT(*) FROM pos_signup_codes s WHERE s.order_id = o.id AND s.diem_nhan_luc IS NOT NULL) AS da_nhan
      FROM pos_orders o`);
    const lech = ds.flatMap((r) => {
      const g = Math.floor(so(r.total) / per);
      const luBan = cfg.loyalty_enabled === 'true' && !!r.customer_phone && so(r.total) > 0 && so(r.flash) === 0 && g > 0;
      const dung = so(r.da_nhan) ? (luBan ? g + Math.round(g * (k - 1)) : Math.round(g * k)) : (luBan ? g : 0);
      return so(r.diem) === dung ? [] : [`đơn ${r.code}: ${so(r.diem)} điểm, đúng luật là ${dung}`];
    });
    // LUOI-1 B1 — vế ĐỔI ĐIỂM (loyalty.js:124–219): mỗi dòng 'redeem' có đúng một quà trỏ tới (point_tx_id) và trừ đúng
    // points_cost của quà; không có loại dòng điểm lạ. ĐIỂM HẾT HẠN: số dư = SUM các dòng còn hạn (loyalty.js:28–32), dòng
    // redeem không có hạn (trừ vĩnh viễn) — vế này soát TỪNG DÒNG, KHÔNG so số dư với tích − đổi (đổi xong mà phần tích hết hạn
    // thì số dư âm là đúng luật hiện tại). Ca điểm hết hạn rồi đổi: CHƯA KIỂM (giả lập chạy trong một ngày, không dòng nào hết hạn).
    const doi = await q(`SELECT t.id, t.customer_phone, t.points,
        (SELECT COUNT(*) FROM pos_voucher_grants g WHERE g.point_tx_id = t.id) AS so_qua,
        (SELECT r.points_cost FROM pos_voucher_grants g JOIN pos_reward_catalog r ON r.id = g.reward_id WHERE g.point_tx_id = t.id) AS gia
      FROM pos_point_transactions t WHERE t.type = 'redeem'`);
    for (const r of doi) {
      if (so(r.so_qua) !== 1 || (r.gia != null && so(r.points) !== -so(r.gia))) {
        lech.push(`dòng đổi điểm #${r.id} (${r.customer_phone}): ${so(r.points)} điểm, ${so(r.so_qua)} quà trỏ tới, quà giá ${so(r.gia)} điểm`);
      }
    }
    const la = await q("SELECT type, COUNT(*) AS n FROM pos_point_transactions WHERE COALESCE(type, '') NOT IN ('earn', 'redeem') GROUP BY type");
    return lech.concat(la.map((r) => `loại dòng điểm lạ "${r.type}": ${r.n} dòng`));
  },
  // I9 — mỗi thao tác tiền có đúng một dòng nhật ký đơn (nhatKyDon.js): 'thu' khớp sổ phía quầy (số dòng + số tiền),
  // 'doi' khớp số lần đổi; đơn có SĐT thì mỗi dòng 'thu' có đúng một dòng sổ debt_payment (orders.js:1303).
  async I9(q, ctx) {
    const log = await q('SELECT order_id, loai, chi_tiet FROM pos_order_log');
    const don = new Map((await q('SELECT id, code, customer_phone FROM pos_orders')).map((r) => [Number(r.id), r]));
    const no = new Map((await q(`SELECT order_id, COUNT(*) AS n FROM pos_balance_transactions
      WHERE type = 'debt_payment' GROUP BY order_id`)).map((r) => [Number(r.order_id), so(r.n)]));
    const ids = new Set([...ctx.soQuay.thu.keys(), ...ctx.soQuay.doi.keys(), ...log.map((l) => Number(l.order_id)), ...no.keys()]);
    const lech = [];
    for (const id of ids) {
      const ma = don.get(id)?.code || `#${id}`;
      const thu = log.filter((l) => Number(l.order_id) === id && l.loai === 'thu');
      const quay = ctx.soQuay.thu.get(id) || [];
      const tong = (a) => a.reduce((s, x) => s + so(x), 0);
      const tongLog = tong(thu.map((l) => { try { return JSON.parse(l.chi_tiet).so_tien; } catch { return NaN; } }));
      if (thu.length !== quay.length || tongLog !== tong(quay)) {
        lech.push(`đơn ${ma}: nhật ký 'thu' ${thu.length} dòng ${tien(tongLog)}, quầy thu ${quay.length} lần ${tien(tong(quay))}`);
      }
      const doi = log.filter((l) => Number(l.order_id) === id && l.loai === 'doi').length;
      if (doi !== (ctx.soQuay.doi.get(id) || 0)) lech.push(`đơn ${ma}: nhật ký 'doi' ${doi} dòng, quầy đổi ${ctx.soQuay.doi.get(id) || 0} lần`);
      if (don.get(id)?.customer_phone && (no.get(id) || 0) !== thu.length) {
        lech.push(`đơn ${ma}: ${no.get(id) || 0} dòng sổ debt_payment, ${thu.length} dòng nhật ký 'thu'`);
      }
    }
    return lech;
  },
  // I11 (P26b, Q9) — theo TỪNG ví (ví khách + ví mẹ): mỗi ví, theo một order_id, tổng refund ≤ phần ví đó đã trả cho đơn.
  // Đọc theo SỔ nên đơn đã xoá vẫn soát. Đền bù báo hỏng ('compensation') không tính: nó đền cả đơn trả tiền mặt.
  // (I10 gộp mọi ví đã bỏ ở HOC-2b, chủ quán chốt 2a: với số tiền đồng NGUYÊN — mọi kịch bản giả lập gửi số nguyên — tổng các
  // ví lệch > 0,5 ⇒ có một ví lệch ≥ 1 ⇒ I11 lệch, nên I10 ⊂ I11. Tiền lẻ < 1đ chia nhiều ví thì I10 thấy mà I11 không.)
  async I11(q) {
    const ds = await q(`SELECT order_id, customer_phone, SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) AS hoan,
        -SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) AS tra
      FROM pos_balance_transactions WHERE order_id IS NOT NULL GROUP BY order_id, customer_phone`);
    return ds.filter((r) => so(r.hoan) > so(r.tra) + 0.5)
      .map((r) => `đơn #${r.order_id}, ví ${r.customer_phone}: hoàn ${tien(r.hoan)} > ví này đã trả ${tien(r.tra)}`);
  },
  // ── LUOI-1: lưới tiền/kho cho 4 lỗ NẶNG của AUDIT-1 (AU-G1/G2/G3) + AU-G4 ──
  // I12 (AU-G1) — mỗi quà đã đổi trỏ đúng dòng 'redeem' cùng SĐT trừ đúng giá quà; mã đẻ ra có loại/trị giá = quà, dùng 1 lần.
  // So với quà HIỆN TẠI: chủ sửa quà sau khi đổi thì đỏ (không kịch bản nào sửa quà).
  async I12(q) {
    const ds = await q(`SELECT g.id, g.code, g.customer_phone AS sdt, t.type, t.customer_phone AS sdt_tx, t.points,
        r.points_cost, r.discount_type AS loai_qua, r.discount_value AS tri_gia_qua,
        d.discount_type, d.discount_value, d.usage_limit, (SELECT COUNT(*) FROM pos_discount_codes x WHERE x.code = g.code) AS so_ma
      FROM pos_voucher_grants g LEFT JOIN pos_point_transactions t ON t.id = g.point_tx_id
      LEFT JOIN pos_reward_catalog r ON r.id = g.reward_id LEFT JOIN pos_discount_codes d ON d.code = g.code`);
    return ds.filter((r) => r.type !== 'redeem' || r.sdt_tx !== r.sdt || so(r.points) !== -so(r.points_cost) || so(r.so_ma) !== 1
      || r.discount_type !== r.loai_qua || so(r.discount_value) !== so(r.tri_gia_qua) || so(r.usage_limit) !== 1)
      .map((r) => `quà #${r.id} mã ${r.code}: dòng điểm ${r.type} ${so(r.points)} (giá ${so(r.points_cost)}), ${so(r.so_ma)} mã `
        + `${r.discount_type} ${so(r.discount_value)} (quà ${r.loai_qua} ${so(r.tri_gia_qua)}), dùng tối đa ${r.usage_limit}`);
  },
  // I13 (AU-G2) — used_count ≤ usage_limit; used_count = số đơn ĐÃ ÁP mã + số lần /increment-usage trả 200 (sổ quầy). Huỷ / xoá
  // đơn KHÔNG trả lượt (orders.js:1296–1590 không đụng pos_discount_codes) nên đếm đơn MỌI trạng thái. "Đã áp" = mã trên đơn VÀ
  // loại + trị giá chiết khấu của đơn = của mã: máy chủ lưu discount_code cả khi mã KHÔNG được áp (orders.js:450), lúc đó loại/trị
  // giá lấy từ hồ sơ khách (orders.js:504–520) hoặc trống. Giới hạn: hồ sơ khách trùng đúng loại + trị giá của mã gõ mà không áp;
  // xoá đơn đã áp mã làm mất dòng đơn (không kịch bản nào làm hai việc này).
  async I13(q, ctx) {
    const ds = await q(`SELECT d.code, d.usage_limit, d.used_count,
        (SELECT COUNT(*) FROM pos_orders o WHERE UPPER(o.discount_code) = UPPER(d.code) AND o.discount_type = d.discount_type
          AND o.discount_value = d.discount_value) AS so_don
      FROM pos_discount_codes d`);
    return ds.flatMap((r) => {
      const tay = ctx.soQuay.tangMa.get(String(r.code).toUpperCase()) || 0;
      const sai = (so(r.usage_limit) > 0 && so(r.used_count) > so(r.usage_limit)) || so(r.used_count) !== so(r.so_don) + tay;
      return sai ? [`mã ${r.code}: đã dùng ${so(r.used_count)}/${so(r.usage_limit)}, đơn đã áp ${so(r.so_don)} + quầy tăng tay ${tay}`] : [];
    });
  },
  // I14 (AU-G3) — gói: lượt đã giao ≤ tổng; gói chưa huỷ: lượt = món lấy-từ-gói (product_id > 0, giá 0 — như orders.js:1382)
  // của đơn KHÔNG huỷ trỏ tới gói + lần /deliver trả 200 (sổ quầy); gói của đơn mua đã huỷ / đã xoá không còn dùng được;
  // đơn chỉ trỏ gói còn tồn tại; đơn mua gói có lấy ngay trỏ đúng gói đầu của chính nó (orders.js:985).
  async I14(q, ctx) {
    const goi = await q(`SELECT cp.id, cp.status, cp.total_qty, cp.delivered_qty, cp.order_id, o.id AS co_don, o.status AS tt_don,
        (SELECT COALESCE(SUM(oi.quantity), 0) FROM pos_orders x JOIN pos_order_items oi ON oi.order_id = x.id
          WHERE x.customer_package_id = cp.id AND x.status <> 'cancelled' AND oi.product_id > 0 AND COALESCE(oi.unit_price, 0) = 0) AS da_lay
      FROM pos_customer_packages cp LEFT JOIN pos_orders o ON o.id = cp.order_id`);
    const lech = [];
    for (const g of goi) {
      const tay = ctx.soQuay.giaoGoi.get(Number(g.id)) || 0;
      if (so(g.delivered_qty) > so(g.total_qty)) lech.push(`gói #${g.id}: đã giao ${so(g.delivered_qty)} > tổng ${so(g.total_qty)}`);
      if (g.status !== 'cancelled' && so(g.delivered_qty) !== so(g.da_lay) + tay) {
        lech.push(`gói #${g.id}: đã giao ${so(g.delivered_qty)}, đơn lấy từ gói ${so(g.da_lay)} + quầy giao tay ${tay}`);
      }
      if (g.order_id != null && (g.co_don == null || g.tt_don === 'cancelled') && g.status !== 'cancelled') {
        lech.push(`gói #${g.id} (${g.status}) của đơn mua #${g.order_id} ${g.co_don == null ? 'đã xoá' : 'đã huỷ'} vẫn dùng được`);
      }
    }
    const tro = await q(`SELECT o.code, o.customer_package_id FROM pos_orders o
      LEFT JOIN pos_customer_packages cp ON cp.id = o.customer_package_id WHERE o.customer_package_id IS NOT NULL AND cp.id IS NULL`);
    const mua = await q(`SELECT o.code, o.customer_package_id, (SELECT MIN(cp.id) FROM pos_customer_packages cp WHERE cp.order_id = o.id) AS goi_dau
      FROM pos_orders o WHERE EXISTS (SELECT 1 FROM pos_customer_packages cp WHERE cp.order_id = o.id)
        AND EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id > 0 AND COALESCE(oi.unit_price, 0) = 0)`);
    return lech.concat(tro.map((r) => `đơn ${r.code} trỏ gói #${r.customer_package_id} không còn`),
      mua.filter((r) => so(r.customer_package_id) !== so(r.goi_dau))
        .map((r) => `đơn mua gói ${r.code} lấy ngay: trỏ gói #${r.customer_package_id}, gói của chính nó #${r.goi_dau}`));
  },
  // I15 (AU-G3) — thẻ hội viên: đơn không huỷ có món thẻ (product_id ≤ −1000000, orders.js:397) và có SĐT ⇒ đúng một dòng mua
  // thẻ cùng order_id; mỗi dòng mua thẻ ⇒ đơn còn và không huỷ.
  async I15(q) {
    const thieu = await q(`SELECT o.code, (SELECT COUNT(*) FROM pos_membership_purchases m WHERE m.order_id = o.id) AS n
      FROM pos_orders o WHERE o.status <> 'cancelled' AND COALESCE(o.customer_phone, '') <> ''
        AND EXISTS (SELECT 1 FROM pos_order_items oi WHERE oi.order_id = o.id AND oi.product_id <= -1000000)`);
    const thua = await q(`SELECT m.id, m.order_id, o.status FROM pos_membership_purchases m LEFT JOIN pos_orders o ON o.id = m.order_id
      WHERE o.id IS NULL OR o.status = 'cancelled'`);
    return thieu.filter((r) => so(r.n) !== 1).map((r) => `đơn mua thẻ ${r.code}: ${so(r.n)} dòng mua thẻ`)
      .concat(thua.map((r) => `dòng mua thẻ #${r.id} của đơn #${r.order_id} ${r.status ? 'đã huỷ' : 'không còn'}`));
  },
  // I16 (AU-G4) — đổi cách trả (don-mo-rong.js:107–160): dòng nhật ký 'doi' CUỐI của đơn khớp tiền đang ghi trên đơn: tổng
  // = so_tien, cột của cách KIA = 0 (đổi sai cách thì cột kia còn tiền — không cần so riêng tên cách).
  async I16(q) {
    const ds = await q(`SELECT o.code, o.cash_amount, o.transfer_amount, l.chi_tiet FROM pos_order_log l JOIN pos_orders o ON o.id = l.order_id
      WHERE l.loai = 'doi' AND l.id = (SELECT MAX(x.id) FROM pos_order_log x WHERE x.order_id = l.order_id AND x.loai = 'doi')`);
    return ds.flatMap((r) => {
      let ct = {};
      try { ct = JSON.parse(r.chi_tiet) || {}; } catch { /* hỏng = lệch */ }
      const dung = so(ct.so_tien) === so(r.cash_amount) + so(r.transfer_amount)
        && so(ct.sang === 'cash' ? r.transfer_amount : r.cash_amount) === 0;
      return dung ? [] : [`đơn ${r.code}: nhật ký đổi sang ${ct.sang} ${so(ct.so_tien)}, đơn ghi tiền mặt ${so(r.cash_amount)} · CK ${so(r.transfer_amount)}`];
    });
  },
  // I17 (AU-G4) — yêu cầu hoàn đã duyệt gắn đúng dòng sổ ví (refunds.js:159–161): loại refund, cùng đơn, cùng SĐT, đúng số tiền.
  async I17(q) {
    const ds = await q(`SELECT r.id, r.order_id, r.customer_phone, r.refund_amount, t.id AS tid, t.type, t.order_id AS t_don,
        t.customer_phone AS t_sdt, t.amount FROM pos_refund_requests r LEFT JOIN pos_balance_transactions t ON t.id = r.balance_transaction_id
      WHERE r.status = 'approved'`);
    return ds.filter((r) => r.tid == null || r.type !== 'refund' || so(r.t_don) !== so(r.order_id) || r.t_sdt !== r.customer_phone
      || Math.abs(so(r.amount) - so(r.refund_amount)) > 0.5)
      .map((r) => `yêu cầu hoàn #${r.id} (đơn #${r.order_id}): gắn dòng sổ ${r.tid == null ? '(không có)' : `#${r.tid} ${r.type} ${so(r.amount)}`}, hoàn ${so(r.refund_amount)}`);
  },
};

module.exports = { BAT_BIEN, LOAI_TINH_VAO_VI };
