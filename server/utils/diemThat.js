/**
 * Điểm thưởng tính trên tiền khách trả cho đơn: tiền mặt + chuyển khoản + trừ tài khoản (tài khoản khách / tài khoản mẹ — CẢ hai ngăn tiền nạp
 * và thưởng nạp), KHÔNG tính phí giao. NAP-1 (chủ quán 01.11) đổi luật DIEM-THAT-1 24.10: phần trả bằng tài khoản nay CÓ điểm như tiền mặt
 * (lúc nạp KHÔNG tích — đơn nạp không cộng điểm ở orders.js, không phát mã bill).
 * Trần total: phép kiểm tổng của POST /orders cho lệch ±1đ, tiền mặt máy khách gửi thừa 1đ không được thêm điểm (chủ quán chốt 25.10 giữ trần
 * trong hàm chung — cả pay-debt, /nhan-diem). Thiếu `total` → trần 0 → 0 điểm (thà thiếu điểm hơn cộng sai).
 * MỘT hàm cho mọi chỗ cộng điểm: POST /orders, pay-debt (orders.js) và /nhan-diem (signup-codes.js).
 * `dong` là một dòng pos_orders (hoặc cùng các trường dưới); số nguyên đồng, không âm.
 */
const tienTinhDiem = (dong) => {
  const tra = (Number(dong.cash_amount) || 0) + (Number(dong.transfer_amount) || 0)
    + (Number(dong.balance_amount) || 0) + (Number(dong.parent_balance_amount) || 0);
  return Math.max(0, Math.round(Math.min(tra, Number(dong.total) || 0) - (Number(dong.shipping_fee) || 0)));
};

/**
 * NAP-1 (soát bảo mật, chủ quán 06.11 chọn (a)): tiền trả vào tài khoản `tienHoan` (duyệt hoàn, đền bù, kết thúc gói) → số điểm trừ = phần `diem` theo tỷ lệ
 * tienHoan / tienDiem (tiền tính điểm của đơn — tienTinhDiem), làm tròn LÊN, không quá `diem`. Phần tiền mặt / CK không hoàn giữ điểm.
 */
const diemTruKhiHoan = (diem, tienHoan, tienDiem) =>
  (diem > 0 && tienHoan > 0 && tienDiem > 0 ? Math.min(diem, Math.ceil((diem * tienHoan) / tienDiem)) : 0);

/**
 * NAP-1 — trừ điểm khi tiền của đơn TRẢ VÀO TÀI KHOẢN (chủ quán 06.11: duyệt hoàn (a); đền bù, kết thúc gói có hoàn — "(a) + thêm hai file").
 * MỘT hàm cho refunds.js, damages.js, packages.js; gọi SAU khi đã ghi khoản trả vào ví, CÙNG giao dịch. Nhận điểm mã bill (signup-codes.js, chủ quán
 * 07.11) gọi lại ngay SAU khi cộng — điểm mã bill của đơn đã được đền / kết thúc gói cũng trừ theo phần đã trả vào tài khoản. Trả số điểm vừa trừ. CỘNG DỒN: tổng cần trừ =
 * diemTruKhiHoan(điểm đã cộng, TỔNG tiền sổ ví 'refund' + 'compensation' của đơn (con, mẹ, cả 'hoan_goi'), tiền tính điểm), rồi trừ phần còn
 * thiếu so với dòng 'adjust' đã ghi — nhiều lần đền nhỏ không cộng dồn làm tròn. Chỉ tính dòng earn / adjust ghi TỪ lúc chạy bước 014_nap
 * (luật tiêu ví có điểm); dòng cũ tích theo luật "ví 0 điểm" → không trừ (LUAT §6.6). Dòng 'adjust' gắn đơn như huỷ (P24, I8 canh); số dư điểm
 * được âm. Trừ nhóm hạn xa nhất trước (không hạn → hạn muộn → hạn sớm). Mốc theo TÊN bước, không theo số.
 */
async function truDiemHoan(tx, don, nguoi, luc, lyDo) {
  const moc = (await tx.queryOne("SELECT luc FROM pos_nang_cap WHERE ten = '014_nap'"))?.luc;
  if (!moc) return 0;
  const tra = await tx.queryOne(`SELECT COALESCE(SUM(amount), 0) AS n FROM pos_balance_transactions
    WHERE order_id = ? AND type IN ('refund', 'compensation')`, [don.id]);
  const nhom = await tx.query(`SELECT customer_phone, expires_at, SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) AS diem, SUM(points) AS con
    FROM pos_point_transactions WHERE order_id = ? AND type IN ('earn', 'adjust') AND created_at >= ?
    GROUP BY customer_phone, expires_at ORDER BY expires_at IS NULL DESC, expires_at DESC`, [don.id, moc]);
  const diem = nhom.reduce((t, r) => t + Number(r.diem || 0), 0);
  let conTru = diemTruKhiHoan(diem, Number(tra?.n || 0), tienTinhDiem(don)) - (diem - nhom.reduce((t, r) => t + Number(r.con || 0), 0));
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

module.exports = { tienTinhDiem, diemTruKhiHoan, truDiemHoan };
