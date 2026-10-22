import { useState } from 'react';
import { nhanMaBill, nhanDiem } from '../api.js';
import { moTaGiam } from '../dinhDang.js';

// Một ô mã in trên bill, hai nút — khách tự chọn, máy KHÔNG tự gọi cả hai. Lỗi hiện đúng `error` máy chủ trả về.

export default function NhanMa({ khiXong }) {
  const [ma, datMa] = useState('');
  const [dang, datDang] = useState(false);
  const [loi, datLoi] = useState('');
  const [kq, datKq] = useState('');

  async function gui(ham, loiBaoOk) {
    datDang(true); datLoi(''); datKq('');
    try {
      const r = await ham(ma.trim());
      datKq(loiBaoOk(r));
      datMa('');
      khiXong();
    } catch (e) {
      datLoi(e.message);
    } finally {
      datDang(false);
    }
  }

  const trong = !ma.trim();
  return (
    <div className="the">
      <b>Nhập mã trên bill</b>
      <label htmlFor="ma-bill">Mã in trên hoá đơn (dán hoặc gõ)</label>
      <input id="ma-bill" value={ma} onChange={(e) => datMa(e.target.value)} autoCapitalize="characters" autoComplete="off" />
      <button className="nut" disabled={dang || trong} onClick={() => gui(nhanDiem, (r) => r.message || `Đã cộng ${r.diem_cong} điểm`)}>
        Cộng điểm cho đơn này
      </button>
      <button className="nut phu-nut" disabled={dang || trong}
        onClick={() => gui(nhanMaBill, (r) => `Đã nhận ưu đãi khách mới: mã ${r.data.voucher_code} ${moTaGiam(r.data.discount_type, r.data.discount_value)}`)}>
        Nhận ưu đãi khách mới
      </button>
      {loi && <div className="loi">{loi}</div>}
      {kq && <div className="ok">{kq}</div>}
    </div>
  );
}
