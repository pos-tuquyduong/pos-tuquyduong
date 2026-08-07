/**
 * Hạng thành viên — trạng thái dùng chung (TIER-1c/TIER-2).
 * MỘT NGUỒN logic cho cả API tra cứu (routes/membership.js) lẫn luồng bán (routes/orders.js)
 * → hai nơi không bao giờ tính khác nhau (đúng khuôn mẫu flashState.js).
 *
 * Nguyên tắc: pos_membership_purchases CHỈ THÊM DÒNG, không sửa/xóa.
 * Hạng hiện tại = dòng MỚI NHẤT (purchased_at, rồi tới id — chống trùng giây) mà expires_at > hiện tại.
 */

async function getMembershipStatus(query, queryOne, getNow, phone) {
  const row = await queryOne(
    `SELECT * FROM pos_membership_purchases WHERE customer_phone = ? ORDER BY purchased_at DESC, id DESC LIMIT 1`,
    [phone],
  );
  if (!row) return { tier_id: null, tier_name: null, status: 'none' };

  const now = new Date(getNow().replace(' ', 'T'));
  const expires = new Date(String(row.expires_at).replace(' ', 'T'));
  const msRemaining = expires.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  let status = 'active';
  if (msRemaining <= 0) status = 'expired';
  else if (daysRemaining <= 7) status = 'expiring_soon';

  return {
    tier_id: row.tier_id,
    tier_name: row.tier_name,
    expires_at: row.expires_at,
    days_remaining: daysRemaining,
    status, // 'active' | 'expiring_soon' | 'expired' | 'none'
  };
}

// TIER-2: hạng còn dùng được để áp giá = active HOẶC expiring_soon (chỉ 'expired'/'none' là hết quyền lợi)
function isTierUsable(status) {
  return status === 'active' || status === 'expiring_soon';
}

module.exports = { getMembershipStatus, isTierUsable };
