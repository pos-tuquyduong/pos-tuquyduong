import { useState } from 'react';
import { xinMa, xacMinh, luuToken } from '../api.js';

// SĐT → mã → (tên nếu khách mới) → vào App. Mã lấy tại quầy khi máy chủ báo lay_ma_tai_quay.
export default function DangNhap({ khiXong }) {
  const [sdt, datSdt] = useState('');
  const [ma, datMa] = useState('');
  const [ten, datTen] = useState('');
  const [buoc, datBuoc] = useState('sdt');
  const [taiQuay, datTaiQuay] = useState(false);
  const [canTen, datCanTen] = useState(false);
  const [dang, datDang] = useState(false);
  const [loi, datLoi] = useState('');

  async function lam(viec) {
    datDang(true); datLoi('');
    try { await viec(); } catch (e) { datLoi(e.message); } finally { datDang(false); }
  }

  const guiSdt = () => lam(async () => {
    const r = await xinMa(sdt.trim());
    datTaiQuay(!!r.lay_ma_tai_quay);
    datBuoc('ma');
  });

  const guiMa = () => lam(async () => {
    try {
      const r = await xacMinh(sdt.trim(), ma.trim(), canTen ? ten.trim() : undefined);
      luuToken(r.token);
      khiXong();
    } catch (e) {
      if (e.code === 'CAN_TEN') datCanTen(true);
      throw e;
    }
  });

  return (
    <div className="dang-nhap">
      <h2>Đăng nhập</h2>
      {buoc === 'sdt' ? (
        <>
          <label htmlFor="sdt">Số điện thoại</label>
          <input id="sdt" type="tel" inputMode="tel" autoComplete="tel" value={sdt} onChange={(e) => datSdt(e.target.value)} />
          <button className="nut" disabled={dang || !sdt.trim()} onClick={guiSdt}>Tiếp tục</button>
        </>
      ) : (
        <>
          <div className="phu">Số {sdt.trim()}</div>
          {taiQuay && <div className="the">Hỏi nhân viên quầy để lấy mã đăng nhập</div>}
          <label htmlFor="ma">Mã đăng nhập</label>
          <input id="ma" inputMode="numeric" autoComplete="one-time-code" value={ma} onChange={(e) => datMa(e.target.value)} />
          {canTen && (
            <>
              <label htmlFor="ten">Tên của bạn</label>
              <input id="ten" autoComplete="name" value={ten} onChange={(e) => datTen(e.target.value)} />
            </>
          )}
          <button className="nut" disabled={dang || !ma.trim()} onClick={guiMa}>Đăng nhập</button>
          <button className="nut chu" onClick={() => { datBuoc('sdt'); datMa(''); datLoi(''); datCanTen(false); }}>Đổi số điện thoại</button>
        </>
      )}
      {loi && <div className="loi">{loi}</div>}
    </div>
  );
}
