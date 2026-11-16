/**
 * KH-NAP-1 (D) — lịch sử tài khoản cho App KH (`GET /api/kh/vi`): đọc thẳng sổ ví pos_balance_transactions của CHÍNH SĐT token.
 * - Chỉ dòng làm đổi số dư: danh sách trắng LOAI_TINH_VAO_VI của wallets.js (không lập danh sách thứ hai) — thu nợ (debt_payment) không hiện.
 * - Mỗi dòng sổ ra ĐÚNG MỘT dòng: mã đơn App đọc bằng câu con LIMIT 1 (một đơn có thể có hơn một phiên) — không JOIN nhân dòng.
 * - Không lộ dữ liệu người khác / nội bộ: `ma_don` chỉ khi đơn là của CHÍNH khách (mở được bằng GET /don/:ma); ví của bạn trả hộ / được hoàn đơn
 *   người khác → `ma_don` null, không tên / SĐT người đó; đơn đã bị xoá (không còn dòng đơn) → câu chung, `ma_don` null. `ghi_chu` là câu cố định dựng theo loại — KHÔNG đưa ghi chú nhân viên gõ tay.
 */
const { query } = require('../database');
const { LOAI_TINH_VAO_VI } = require('../routes/wallets');
const { TEN_CONG } = require('./congQr');

const MOI_TRANG = 20;
const CONG = Object.keys(TEN_CONG);   // vaoVi (thanh-toan.js) ghi created_by = tên cổng: tiền QR về muộn / đơn App không tạo được

/** Một dòng sổ (+ SĐT chủ đơn, mã App) → { loai, ghi_chu } khách thấy. */
function phanLoai(t) {
  const traHo = t.don_phone != null && t.don_phone !== t.customer_phone;   // đơn còn và là của người khác (ví mẹ); đơn đã xoá → không biết → câu chung
  if (t.type === 'topup') {
    return { loai: 'nap', ghi_chu: t.order_id ? 'Nạp tiền vào tài khoản'
      : CONG.includes(t.created_by) ? 'Tiền chuyển khoản của đơn App chưa tạo được — đã cộng vào tài khoản' : 'Nạp tiền tại quầy' };
  }
  if (t.type === 'purchase') {
    if (!t.order_id) return { loai: 'dieu_chinh', ghi_chu: 'Quán điều chỉnh số dư' };
    return { loai: 'tra_don', ghi_chu: traHo ? 'Trả hộ đơn bằng tài khoản của bạn' : 'Thanh toán đơn' };
  }
  if (t.type === 'refund') return { loai: 'hoan_don', ghi_chu: traHo ? 'Hoàn tiền đơn trả hộ' : 'Hoàn tiền đơn' };
  if (t.type === 'compensation') return { loai: 'hoan_don', ghi_chu: 'Đền bù đơn' };
  return { loai: 'dieu_chinh', ghi_chu: 'Quán điều chỉnh số dư' };   // adjust (±)
}

async function lichSuVi(phone, trang) {
  const ds = await query(`SELECT t.type, t.amount, t.thuong, t.created_at, t.order_id, t.created_by, t.customer_phone, o.customer_phone AS don_phone, o.code,
      (SELECT a.ma FROM pos_phien_thanh_toan p JOIN pos_don_app a ON a.phien_id = p.id WHERE p.order_id = o.id ORDER BY a.id LIMIT 1) AS ma_app
    FROM pos_balance_transactions t LEFT JOIN pos_orders o ON o.id = t.order_id
    WHERE t.customer_phone = ? AND t.type IN (${LOAI_TINH_VAO_VI.map(() => '?').join(', ')})
    ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?`, [phone, ...LOAI_TINH_VAO_VI, MOI_TRANG + 1, (trang - 1) * MOI_TRANG]);
  return {
    trang, con_nua: ds.length > MOI_TRANG,
    data: ds.slice(0, MOI_TRANG).map((t) => ({
      ngay: t.created_at, ...phanLoai(t), so_tien: Number(t.amount), thuong: Number(t.thuong || 0),
      ma_don: t.don_phone != null && t.don_phone === t.customer_phone ? (t.ma_app || t.code) : null,
    })),
  };
}

module.exports = { lichSuVi, MOI_TRANG };
