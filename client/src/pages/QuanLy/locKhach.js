/**
 * locKhach.js — lọc danh sách khách (GIAO-DIEN-2 D2, mẫu M5): chip Tất cả · Có số dư · Có hạng · Sinh nhật tháng này + ô tìm tên / SĐT.
 * HÀM THUẦN (không React, không mạng): `homNay` là ngày "YYYY-MM-DD" theo giờ VN do nơi gọi truyền vào (utils/ngayVN.ngayVN()),
 * để bài thử chọn ngày bất kỳ. Bài thử: cong_cu/thu_GIAODIEN2.js.
 */

export const BO_LOC = [['all', 'Tất cả'], ['co_so_du', 'Có số dư'], ['co_hang', 'Có hạng'], ['sinh_nhat', 'Sinh nhật tháng này']];

// Hạng còn hạn: máy chủ trả membership.status = active | expiring_soon | expired | none (membershipStatus.js); hết hạn hoặc không có hạng → không.
const conHang = (m) => !!m && !!m.tier_name && (m.status === 'active' || m.status === 'expiring_soon');

// ngay_sinh "YYYY-MM-DD" (CT-1a); trống / sai dạng → không có sinh nhật.
const thangSinh = (ngaySinh) => { const m = /^\d{4}-(\d{2})-\d{2}$/.exec(String(ngaySinh || '')); return m ? m[1] : null; };

export function locKhach(ds, { tim = '', loc = 'all', homNay = '' } = {}) {
  const q = String(tim).trim().toLowerCase();
  const thangNay = String(homNay).slice(5, 7);
  return (ds || []).filter((c) => {
    if (loc === 'co_so_du' && !(c.balance > 0)) return false;
    if (loc === 'co_hang' && !conHang(c.membership)) return false;
    if (loc === 'sinh_nhat' && (!thangNay || thangSinh(c.ngay_sinh) !== thangNay)) return false;
    if (q && !c.name?.toLowerCase().includes(q) && !c.phone?.includes(q)) return false;
    return true;
  });
}
