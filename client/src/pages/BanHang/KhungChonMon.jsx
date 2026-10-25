/**
 * Khung chọn món: ghi chú nhanh + ô tự gõ + số ly + "Thêm vào giỏ · <giá>". Trên điện thoại trượt từ đáy, máy tính bảng nổi giữa.
 * Mở lại từ dòng giỏ để sửa / xoá (có `dong`).
 */
import { useState } from 'react';
import { ghiChuMacDinh } from './ghiChuMacDinh';
import { ghepGhiChu } from './tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function KhungChonMon({ sp, dong, giaMotLy, noi, onLuu, onXoa, onDong }) {
  const [nhan, setNhan] = useState(() => (dong?.note || '').split(',').map((s) => s.trim()).filter((s) => s && ghiChuMacDinh(sp.category).includes(s)));
  const [tuGo, setTuGo] = useState(() => (dong?.note || '').split(',').map((s) => s.trim()).filter((s) => s && !ghiChuMacDinh(sp.category).includes(s)).join(', '));
  const [soLy, setSoLy] = useState(dong?.quantity || 1);

  const bat = (n) => setNhan((ds) => (ds.includes(n) ? ds.filter((x) => x !== n) : [...ds, n]));
  return (
    <div className="bh-lop" onClick={onDong}>
      <div className={`bh-khung${noi ? ' bh-noi' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0 }}>{sp.name}</h3>
          <span className="bh-gia">{vnd(giaMotLy)}</span>
        </div>
        <div className="bh-chip-hang">
          {ghiChuMacDinh(sp.category).map((n) => (
            <button key={n} className={`bh-chip${nhan.includes(n) ? ' bh-chon' : ''}`} onClick={() => bat(n)}>{n}</button>
          ))}
        </div>
        <input type="text" value={tuGo} onChange={(e) => setTuGo(e.target.value)} placeholder="Ghi chú khác (tự gõ)" maxLength={120} />
        <div className="bh-so-ly">
          <button onClick={() => setSoLy((n) => Math.max(1, n - 1))} aria-label="Bớt một ly">−</button>
          <b>{soLy}</b>
          <button onClick={() => setSoLy((n) => n + 1)} aria-label="Thêm một ly">+</button>
        </div>
        <button className="bh-nut" onClick={() => onLuu({ note: ghepGhiChu(nhan, tuGo), quantity: soLy })}>
          {dong ? 'Lưu' : 'Thêm vào giỏ'} · {vnd(giaMotLy * soLy)}
        </button>
        {dong && <button className="bh-nut bh-phu" onClick={onXoa}>Xoá khỏi giỏ</button>}
      </div>
    </div>
  );
}
