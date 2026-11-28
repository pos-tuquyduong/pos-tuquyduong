/**
 * ANH-MON-1 — ô ảnh vuông bo góc của món (thẻ món, dòng giỏ). Chỗ giữ chỗ CỐ ĐỊNH (kích thước viết sẵn → ảnh tải chậm không làm nhảy bố cục);
 * ảnh tải lười, không chặn bấm. Chưa có ảnh / ảnh lỗi → chữ viết tắt trên nền màu (màu theo tên, mỗi lần một màu giống nhau).
 * Hoá đơn / tem KHÔNG dùng component này.
 */
import { useState } from 'react';

const MAU_NEN = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe', '#fed7aa', '#a7f3d0', '#fecaca'];

/** Tối đa 2 chữ cái đầu của 2 từ đầu ("Thanh Tân Dưỡng" → "TT"). */
export const chuVietTat = (ten) => [...String(ten || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((t) => [...t][0].toUpperCase())].join('') || '?';
const mauTheoTen = (ten) => MAU_NEN[[...String(ten || '')].reduce((t, c) => (t * 31 + c.codePointAt(0)) % 997, 7) % MAU_NEN.length];

export default function AnhMon({ anh, ten, kich = 44 }) {
  const [hong, setHong] = useState(null);   // đường dẫn đã tải lỗi — đổi ảnh (đường dẫn mới) thì thử lại
  const coAnh = !!anh && hong !== anh;
  return (
    <span className="bh-anh" aria-hidden="true" style={{ width: kich, height: kich, background: coAnh ? '#f1f5f9' : mauTheoTen(ten), fontSize: Math.round(kich * 0.36) }}>
      {coAnh
        ? <img src={anh} alt="" loading="lazy" decoding="async" width={kich} height={kich} onError={() => setHong(anh)} />
        : chuVietTat(ten)}
    </span>
  );
}
