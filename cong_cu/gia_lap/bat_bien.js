/**
 * GIẢ LẬP QUẦY (TU-CHAY-4) — 10 bất biến sổ sách. SQL CHỈ ĐỌC trên kho tạm.
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
  // I7 — mỗi vân tay kho SX giả nhận ĐÚNG MỘT LẦN: bán → out mỗi món có mã SX; huỷ → thêm in. stt = thứ hạng id trong đơn
  // (orders.js:987–989 theo mảng, :1502–1513 theo SELECT — món INSERT đúng thứ tự mảng). SX giả không lỗi → không được có nợ kho.
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
    const lech = [];
    for (const [vt, don] of can) if (dem.get(vt) !== 1) lech.push(`vân tay ${vt} (đơn ${don}) SX nhận ${dem.get(vt) || 0} lần`);
    for (const [vt, n] of dem) if (!can.has(vt)) lech.push(`SX nhận vân tay lạ ${vt} × ${n}`);
    const no = await q("SELECT order_code, van_tay FROM pos_stock_pending");
    return lech.concat(no.map((r) => `nợ kho ${r.van_tay} (${r.order_code}) dù SX giả không lỗi`));
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
    return ds.flatMap((r) => {
      const g = Math.floor(so(r.total) / per);
      const luBan = cfg.loyalty_enabled === 'true' && !!r.customer_phone && so(r.total) > 0 && so(r.flash) === 0 && g > 0;
      const dung = so(r.da_nhan) ? (luBan ? g + Math.round(g * (k - 1)) : Math.round(g * k)) : (luBan ? g : 0);
      return so(r.diem) === dung ? [] : [`đơn ${r.code}: ${so(r.diem)} điểm, đúng luật là ${dung}`];
    });
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
  // I10 (P26b) — hoàn vào ví của mỗi đơn ≤ số đơn đó đã trả bằng ví (ví khách + ví mẹ). Đọc theo SỔ nên đơn đã xoá vẫn soát.
  // Đền bù báo hỏng ('compensation') không tính: nó đền cả đơn trả tiền mặt.
  async I10(q) {
    const ds = await q(`SELECT order_id, SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) AS hoan,
        -SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) AS tra
      FROM pos_balance_transactions WHERE order_id IS NOT NULL GROUP BY order_id`);
    return ds.filter((r) => so(r.hoan) > so(r.tra) + 0.5)
      .map((r) => `đơn #${r.order_id}: hoàn vào ví ${tien(r.hoan)} > đã trả bằng ví ${tien(r.tra)}`);
  },
};

module.exports = { BAT_BIEN, LOAI_TINH_VAO_VI };
