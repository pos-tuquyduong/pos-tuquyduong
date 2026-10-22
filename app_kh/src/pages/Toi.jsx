import { useState } from 'react';
import { layToi, doiTen } from '../api.js';
import { dungTai } from '../dungTai.js';
import TrangTai from '../components/TrangTai.jsx';

function Sua({ khach, dangXuat }) {
  const [ten, datTen] = useState(khach.ten || '');
  const [dang, datDang] = useState(false);
  const [loi, datLoi] = useState('');
  const [xong, datXong] = useState(false);

  async function luu() {
    datDang(true); datLoi(''); datXong(false);
    try {
      const r = await doiTen(ten.trim());
      datTen(r.khach.ten);
      datXong(true);
    } catch (e) {
      datLoi(e.message);
    } finally {
      datDang(false);
    }
  }

  return (
    <>
      <div className="the">
        <div className="phu">Số điện thoại</div>
        <div>{khach.sdt}</div>
        <label htmlFor="ten-toi">Tên</label>
        <input id="ten-toi" value={ten} onChange={(e) => { datTen(e.target.value); datXong(false); }} />
        <button className="nut" disabled={dang || !ten.trim()} onClick={luu}>Lưu tên</button>
        {loi && <div className="loi">{loi}</div>}
        {xong && <div className="ok">Đã lưu tên.</div>}
      </div>
      <div className="the khung-qr">
        <b>Mã QR thành viên</b>
        <div>Sắp có</div>
      </div>
      <button className="nut phu-nut" onClick={dangXuat}>Đăng xuất</button>
    </>
  );
}

export default function Toi({ dangXuat }) {
  const tai = dungTai(layToi);
  return (
    <div>
      <h2>Tôi</h2>
      <TrangTai tai={tai}>{(dl) => <Sua khach={dl.khach} dangXuat={dangXuat} />}</TrangTai>
    </div>
  );
}
