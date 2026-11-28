/**
 * ANH-MON-1 — ô ảnh vuông bo góc của món (thẻ món, dòng giỏ, ô topping). Chỗ giữ chỗ CỐ ĐỊNH (kích thước viết sẵn → ảnh tải chậm không làm nhảy bố cục);
 * ảnh tải lười, không chặn bấm. Hoá đơn / tem KHÔNG dùng component này.
 * GIAO-DIEN-4 D2: chưa có ảnh / ảnh lỗi → HÌNH LY vẽ (ly, nước, đá, bóng) — màu nước + nền theo NHÓM món (`nhom` = mã nhóm của món, vd tea / coffee / juice).
 * Không thêm cột CSDL: bảng màu nằm ngay dưới, MỘT chỗ; nhóm lạ / không truyền nhóm → màu mặc định.
 */
import { useId, useState } from 'react';

const MAU_NHOM = {
  tea: { nuoc: '#d68a2f', nen: '#f6e7c8' },      // hổ phách
  coffee: { nuoc: '#3d2418', nen: '#ead9cb' },   // nâu cà phê
  juice: { nuoc: '#e2733a', nen: '#fde2cf' },    // cam
};
const MAU_MAC_DINH = { nuoc: '#c4573b', nen: '#f3e3cf' };

/** Màu nước + màu nền của một nhóm món. Nhóm lạ / rỗng / không truyền → màu mặc định. */
export const mauNhom = (nhom) => (typeof nhom === 'string' && Object.prototype.hasOwnProperty.call(MAU_NHOM, nhom) ? MAU_NHOM[nhom] : MAU_MAC_DINH);

/** Hình ly vẽ (cao `kich` px, tỉ lệ 84 : 104). Dùng ở ô ảnh món và ô icon của chip nhóm. */
export function HinhLy({ nhom, kich = 40 }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');   // mỗi ly một id gradient — nhiều ly cùng trang không lẫn màu
  const { nuoc } = mauNhom(nhom);
  return (
    <svg viewBox="0 0 84 104" width={Math.round((kich * 84) / 104)} height={kich} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={nuoc} stopOpacity=".75" /><stop offset="1" stopColor={nuoc} /></linearGradient>
      </defs>
      <ellipse cx="42" cy="99" rx="26" ry="4" fill="#7f1d1d" opacity=".12" />
      <path d="M18 36h48l-5 56a7 7 0 0 1-7 6H30a7 7 0 0 1-7-6z" fill="#fff" opacity=".6" stroke="#e8d6c0" strokeWidth="1.2" />
      <path d="M21.5 44h41l-4.3 47.5a5 5 0 0 1-5 4.5H30.8a5 5 0 0 1-5-4.5z" fill={`url(#g${id})`} />
      <rect x="29" y="52" width="11" height="11" rx="2.5" fill="#fff" opacity=".45" transform="rotate(-12 34 57)" />
      <rect x="43" y="58" width="10" height="10" rx="2.5" fill="#fff" opacity=".35" transform="rotate(10 48 63)" />
      <path d="M26 46l3.5 46" stroke="#fff" strokeWidth="3" opacity=".35" strokeLinecap="round" />
      <rect x="15" y="32" width="54" height="6" rx="3" fill="#fff" stroke="#e8d6c0" />
    </svg>
  );
}

export default function AnhMon({ anh, nhom, kich = 44 }) {
  const [hong, setHong] = useState(null);   // đường dẫn đã tải lỗi — đổi ảnh (đường dẫn mới) thì thử lại
  const coAnh = !!anh && hong !== anh;
  return (
    <span className="bh-anh" aria-hidden="true" style={{ width: kich, height: kich, background: coAnh ? '#f1f5f9' : mauNhom(nhom).nen }}>
      {coAnh
        ? <img src={anh} alt="" loading="lazy" decoding="async" width={kich} height={kich} onError={() => setHong(anh)} />
        : <HinhLy nhom={nhom} kich={Math.round(kich * 0.9)} />}
    </span>
  );
}
