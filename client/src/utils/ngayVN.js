/** GIO-VN-1: ngày "YYYY-MM-DD" theo giờ Việt Nam của thời điểm `d` (mặc định bây giờ). Không dùng toISOString() — đó là giờ UTC,
 *  từ 0 tới 7 giờ sáng ra ngày hôm qua. */
export function ngayVN(d = new Date()) {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}
