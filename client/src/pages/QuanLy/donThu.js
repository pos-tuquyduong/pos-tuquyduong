/**
 * QuanLy/donThu.js — hàm thuần của màn Dọn dữ liệu thử (KH-SDT-1). Không React, không mạng. Bài thử: cong_cu/thu_KHSDT1.js.
 * Máy chủ là bên kiểm thật (server/utils/donThu.js); ở đây chỉ đọc ô nhập, dựng file danh sách, và khoá nút Dọn theo đúng thứ tự
 * chủ quán chốt 01.11: liệt kê → tải danh sách → tải sao lưu → gõ chữ.
 */
export const CHU_XAC_NHAN = 'DON DU LIEU THU';

/** Ô SĐT: mỗi dòng hoặc cách nhau dấu phẩy; bỏ khoảng trắng / chấm / gạch, bỏ dòng trống. */
export const docDanhSachSdt = (chu) => String(chu || '').split(/[\n,;]/).map((s) => s.replace(/[\s.\-]/g, '')).filter(Boolean);

const o = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const dong = (...cot) => cot.map(o).join(',');

/** File danh sách để chủ quán duyệt (CSV, mở được bằng Excel). */
export function dungCsv(kq) {
  const ra = ['﻿' + dong('Phần', 'Mục', 'Ngày', 'SĐT', 'Số tiền / số dòng', 'Ghi chú')];
  for (const [bang, n] of Object.entries(kq.so_dong || {})) ra.push(dong('Số dòng sẽ xoá', bang, '', '', n, ''));
  for (const d of kq.don || []) ra.push(dong('Đơn sẽ xoá', d.code, d.created_at, d.customer_phone, d.total, d.status));
  for (const s of kq.sdt || []) ra.push(dong('SĐT xoá sạch', '', '', s, '', ''));
  for (const v of (kq.giu_lai && kq.giu_lai.vi) || []) ra.push(dong('GIỮ LẠI — ví còn tiền', '', '', v.phone, v.balance, 'xử lý tay'));
  for (const d of (kq.giu_lai && kq.giu_lai.don) || []) ra.push(dong('GIỮ LẠI — đơn', d.code, d.created_at, '', '', d.ly_do));
  for (const d of kq.diem_am || []) ra.push(dong('CHẶN — điểm âm', '', '', d.phone, d.con_lai, 'thêm số này vào danh sách SĐT'));
  return ra.join('\r\n');
}

/** Nút Dọn chỉ mở khi: đã liệt kê, có dòng, không điểm âm, đã tải danh sách, đã tải sao lưu, gõ đúng nguyên chữ. */
export const moNutDon = ({ ketQua, daTaiDs, daTaiSaoLuu, go }) =>
  !!ketQua && ketQua.tong_dong > 0 && !(ketQua.diem_am || []).length && daTaiDs === true && daTaiSaoLuu === true && go === CHU_XAC_NHAN;
