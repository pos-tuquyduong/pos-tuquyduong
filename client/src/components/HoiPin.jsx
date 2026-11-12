/**
 * BAO-1b — ô nổi hỏi PIN chủ quán lúc bấm Lưu / Xoá (nút Lưu không mờ vì thiếu PIN). `chay(pin)` làm việc thật, ném lỗi nếu hỏng.
 * PIN sai / khoá → báo NGAY DƯỚI ô PIN + thông báo nổi, ô vẫn mở, dữ liệu đã gõ ở thẻ giữ nguyên. Lỗi khác → đóng ô, trả cho nơi gọi (loiKhac).
 */
import { useState, useEffect } from 'react';
import { baoLoi, lyDoLoi } from './thongBaoKho.js';
import { laLoiPin } from './loiPin.js';
import LoiO from './LoiO';

export default function HoiPin({ mo, tieuDe, ten, chay, loiKhac, dong }) {
  const [pin, setPin] = useState('');
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);
  useEffect(() => { if (mo) { setPin(''); setLoi(''); } }, [mo]);
  if (!mo) return null;
  const xacNhan = async (ev) => {
    ev.preventDefault();
    if (!pin) { setLoi('Gõ PIN chủ quán (4–6 số) rồi bấm Xác nhận'); return; }
    setDang(true); setLoi('');
    try { await chay(pin); setPin(''); dong(); } catch (e) {
      if (laLoiPin(e)) { setLoi(lyDoLoi(e)); baoLoi(`Chưa ${ten || 'lưu'} được`, lyDoLoi(e)); } else { dong(); loiKhac(e); }
    } finally { setDang(false); }
  };
  return (
    <div className="hoi-pin-nen" role="dialog" aria-modal="true" aria-label="Hỏi PIN chủ quán">
      <form className="hoi-pin" onSubmit={xacNhan}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{tieuDe}</div>
        <input className="input" type="password" inputMode="numeric" maxLength={6} autoFocus style={{ width: '100%' }} placeholder="PIN chủ quán" aria-label="PIN chủ quán"
          value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        <LoiO loi={loi} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="btn btn-outline" disabled={dang} onClick={dong}>Huỷ</button>
          <button type="submit" className="btn btn-primary" disabled={dang}>{dang ? 'Đang lưu…' : 'Xác nhận'}</button>
        </div>
      </form>
    </div>
  );
}
