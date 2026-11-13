/**
 * BAO-1b — sổ "thẻ nào còn thay đổi chưa lưu" (thuần JS). ThanhLuu.jsx ghi vào đây khi thẻ có thay đổi và gỡ khi hết / khi thẻ bị đóng;
 * Settings.doiThe hỏi lại trước khi chuyển thẻ nếu coChuaLuu(). Đặt hai lần cùng một thẻ vẫn chỉ tính một.
 */
const dangDoi = new Set();

export function datChuaLuu(id, coDoi) {
  if (coDoi) dangDoi.add(id); else dangDoi.delete(id);
}

export const coChuaLuu = () => dangDoi.size > 0;
