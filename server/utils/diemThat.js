/**
 * Điểm thưởng tính trên tiền khách trả cho đơn: tiền mặt + chuyển khoản + trừ tài khoản (tài khoản khách / tài khoản mẹ — CẢ hai ngăn tiền nạp
 * và thưởng nạp), KHÔNG tính phí giao. NAP-1 (chủ quán 01.11) đổi luật DIEM-THAT-1 24.10: phần trả bằng tài khoản nay CÓ điểm như tiền mặt
 * (lúc nạp KHÔNG tích — đơn nạp không cộng điểm ở orders.js, không phát mã bill).
 * Trần total: phép kiểm tổng của POST /orders cho lệch ±1đ, tiền mặt máy khách gửi thừa 1đ không được thêm điểm (chủ quán chốt 25.10 giữ trần
 * trong hàm chung — cả pay-debt, /nhan-diem). Thiếu `total` → trần 0 → 0 điểm (thà thiếu điểm hơn cộng sai).
 * MỘT hàm cho mọi chỗ cộng điểm: POST /orders, pay-debt (orders.js) và /nhan-diem (signup-codes.js).
 * `dong` là một dòng pos_orders (hoặc cùng các trường dưới); số nguyên đồng, không âm.
 */
const tienTraDon = (dong) => {
  const tra = (Number(dong.cash_amount) || 0) + (Number(dong.transfer_amount) || 0)
    + (Number(dong.balance_amount) || 0) + (Number(dong.parent_balance_amount) || 0);
  return Math.max(0, Math.round(Math.min(tra, Number(dong.total) || 0) - (Number(dong.shipping_fee) || 0)));
};

/** Dòng thẻ hạng có product_id = ID_THE_TU − id hạng (orders.js, membership_buy); dòng gói trả trước = −id gói, nằm giữa ID_THE_TU và 0. */
const ID_THE_TU = -1000000;

/** DIEM-MON-1: dòng đơn / món / gói / hạng có tích điểm không — cờ `tich_diem` 0 = tắt; thiếu / NULL (dữ liệu cũ) = bật. MỘT vị từ cho lúc bán và lúc trừ. */
const batDiem = (d) => d.tich_diem == null || Number(d.tich_diem) !== 0;

/**
 * DIEM-MON-1 — lúc bán: phần tiền hàng `tienHang` (total − phí giao) thuộc các dòng BẬT điểm. Cùng quy tắc chia theo dòng của
 * utils/tienDaTra.js tienDaTraTheoDong: giá dòng = (giá flash || giá hạng || giá) × số lượng; khoản giảm cấp đơn (mã cả đơn, mã 1 món) chia theo
 * tỷ lệ; làm tròn xuống. Không dòng nào có giá (đơn chỉ lấy từ gói) → 0. Lưu vào pos_orders.tien_hang_diem — đổi công tắc sau không đổi đơn cũ.
 */
const tienHangDiem = (dongDon, tienHang) => {
  const gia = dongDon.map((d) => Number(d.flash_unit_price || d.tier_unit_price || d.unit_price || 0) * Number(d.quantity));
  const tong = gia.reduce((a, b) => a + b, 0);
  const bat = gia.reduce((t, g, i) => t + (batDiem(dongDon[i]) ? g : 0), 0);
  return tong > 0 ? Math.floor((bat * Math.min(tong, Math.max(0, tienHang))) / tong) : 0;
};

/**
 * DIEM-MON-1: tiền tính điểm = tiền khách trả (tienTraDon) × phần tiền hàng của dòng bật (`tien_hang_diem` đã lưu lúc bán, ≤ tiền hàng — tienHangDiem)
 * / tiền hàng (total − phí giao), làm tròn. Đơn cũ (`tien_hang_diem` không có / NULL) → như trước. Tiền hàng ≤ 0 → 0 (không chia cho 0).
 * `dong` phải có tien_hang_diem nếu cột có (mọi chỗ gọi đọc SELECT * hoặc kê cột — signup-codes.js kiemDonCuaMa).
 */
const tienTinhDiem = (dong) => {
  const tra = tienTraDon(dong);
  if (dong.tien_hang_diem == null) return tra;
  const hang = (Number(dong.total) || 0) - (Number(dong.shipping_fee) || 0);
  return hang > 0 ? Math.round((tra * (Number(dong.tien_hang_diem) || 0)) / hang) : 0;
};

/**
 * NAP-1 (soát bảo mật, chủ quán 06.11 chọn (a)): tiền trả vào tài khoản `tienHoan` (duyệt hoàn, đền bù, kết thúc gói) → số điểm trừ = phần `diem` theo tỷ lệ
 * tienHoan / tienDiem (tiền tính điểm của đơn — tienTinhDiem), làm tròn LÊN, không quá `diem`. Phần tiền mặt / CK không hoàn giữ điểm.
 */
const diemTruKhiHoan = (diem, tienHoan, tienDiem) =>
  (diem > 0 && tienHoan > 0 && tienDiem > 0 ? Math.min(diem, Math.ceil((diem * tienHoan) / tienDiem)) : 0);

/**
 * DIEM-MON-1 (chủ quán 09.11 CÁCH 2) — tiền đã trả vào tài khoản của đơn (sổ ví 'refund' + 'compensation'), quy về đơn vị "tiền tính điểm":
 * - gắn dòng BẬT: tính đủ; gắn dòng TẮT: bỏ (dòng đó không sinh điểm, không trừ); không gắn dòng: × tiền tính điểm / tiền trả (theo toàn đơn).
 * - Đền ('compensation') gắn món theo pos_damage_logs (action 'refund', damages.js ghi dòng nhật ký TRƯỚC khi gọi truDiemHoan).
 * - 'refund' của đơn CÓ dòng gói trả trước (product_id −1…−999999) = kết thúc gói (duyệt hoàn chặn đơn có gói / thẻ — refunds.js DON_CO_GOI) → gắn
 *   dòng gói; đơn khác → duyệt hoàn, không gắn dòng.
 * Đơn cũ (dòng không cờ = bật, tien_hang_diem NULL): tiền tính điểm = tiền trả → đúng tổng sổ ví như trước.
 */
async function tienHoanTinhDiem(tx, d, tienDiem) {
  const so = await tx.queryOne(`SELECT COALESCE(SUM(amount), 0) AS n, COALESCE(SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END), 0) AS hoan
    FROM pos_balance_transactions WHERE order_id = ? AND type IN ('refund', 'compensation')`, [d.id]);
  const hoan = Number(so?.hoan || 0), den = Number(so?.n || 0) - hoan;
  const dong = await tx.query('SELECT product_id, product_code, tich_diem FROM pos_order_items WHERE order_id = ?', [d.id]);
  const tat = new Set(dong.filter((x) => !batDiem(x)).map((x) => x.product_code));
  const denTat = tat.size ? Number((await tx.queryOne(`SELECT COALESCE(SUM(refund_amount), 0) AS n FROM pos_damage_logs
    WHERE order_id = ? AND action = 'refund' AND product_code IN (${[...tat].map(() => '?').join(', ')})`, [d.id, ...tat]))?.n || 0) : 0;
  const goi = dong.find((x) => Number(x.product_id) < 0 && Number(x.product_id) > ID_THE_TU);
  const tra = tienTraDon(d);
  const khongGan = goi ? 0 : hoan;
  return (den - Math.min(den, denTat)) + (goi && batDiem(goi) ? hoan : 0) + (tra > 0 ? (khongGan * tienDiem) / tra : 0);
}

/**
 * NAP-1 — trừ điểm khi tiền của đơn TRẢ VÀO TÀI KHOẢN (chủ quán 06.11: duyệt hoàn (a); đền bù, kết thúc gói có hoàn — "(a) + thêm hai file").
 * MỘT hàm cho refunds.js, damages.js, packages.js; gọi SAU khi đã ghi khoản trả vào ví, CÙNG giao dịch. Nhận điểm mã bill (signup-codes.js, chủ quán
 * 07.11) gọi lại ngay SAU khi cộng — điểm mã bill của đơn đã được đền / kết thúc gói cũng trừ theo phần đã trả vào tài khoản. Trả số điểm vừa trừ. CỘNG DỒN: tổng cần trừ =
 * diemTruKhiHoan(điểm đã cộng, tiền sổ ví 'refund' + 'compensation' của đơn (con, mẹ, cả 'hoan_goi') quy theo dòng — tienHoanTinhDiem, DIEM-MON-1 —,
 * tiền tính điểm), rồi trừ phần còn
 * thiếu so với dòng 'adjust' đã ghi — nhiều lần đền nhỏ không cộng dồn làm tròn. Chỉ tính dòng earn / adjust ghi TỪ lúc chạy bước 014_nap
 * (luật tiêu ví có điểm); dòng cũ tích theo luật "ví 0 điểm" → không trừ (LUAT §6.6). Dòng 'adjust' gắn đơn như huỷ (P24, I8 canh); số dư điểm
 * được âm. Trừ nhóm hạn xa nhất trước (không hạn → hạn muộn → hạn sớm). Mốc theo TÊN bước, không theo số.
 */
async function truDiemHoan(tx, don, nguoi, luc, lyDo) {
  const moc = (await tx.queryOne("SELECT luc FROM pos_nang_cap WHERE ten = '014_nap'"))?.luc;
  if (!moc) return 0;
  const tienDiem = tienTinhDiem(don);
  const hoan = await tienHoanTinhDiem(tx, don, tienDiem);
  const nhom = await tx.query(`SELECT customer_phone, expires_at, SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) AS diem, SUM(points) AS con
    FROM pos_point_transactions WHERE order_id = ? AND type IN ('earn', 'adjust') AND created_at >= ?
    GROUP BY customer_phone, expires_at ORDER BY expires_at IS NULL DESC, expires_at DESC`, [don.id, moc]);
  const diem = nhom.reduce((t, r) => t + Number(r.diem || 0), 0);
  let conTru = diemTruKhiHoan(diem, hoan, tienDiem) - (diem - nhom.reduce((t, r) => t + Number(r.con || 0), 0));
  let daTru = 0;
  for (const r of nhom) {
    const tru = Math.min(conTru, Number(r.con || 0));
    if (!(tru > 0)) continue;
    conTru -= tru;
    daTru += tru;
    await tx.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at)
      VALUES (?, 'adjust', ?, ?, ?, ?, ?, ?)`, [r.customer_phone, -tru, don.id, r.expires_at, `${lyDo} — trừ điểm phần trả vào tài khoản`, nguoi, luc]);
  }
  return daTru;
}

module.exports = { tienTinhDiem, tienHangDiem, batDiem, diemTruKhiHoan, truDiemHoan };
