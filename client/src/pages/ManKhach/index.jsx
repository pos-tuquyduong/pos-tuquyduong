/**
 * Trang /man-khach — máy tính bảng quay về phía khách (MANKHACH-1). KHÔNG cần đăng nhập nhân viên: nhập mã ghép hiện ở góc màn Bán hàng
 * của quầy → máy chủ cấp khoá riêng (lưu trong máy này). Khoá chỉ đọc được "quầy đang hiện gì" của quầy đã ghép.
 */
import { useState } from 'react';
import { manKhachApi } from '../../utils/api';
import ManChay from './ManChay';
import { docKhoaMan, ghiKhoaMan } from './luu';
import './manKhach.css';

const SO_CHU_SO = 6;   // khớp máy chủ (utils/manKhach.js)

function ManGhep({ onXong, ghiChu }) {
  const [ma, setMa] = useState('');
  const [loi, setLoi] = useState(ghiChu || '');
  const [dang, setDang] = useState(false);
  const gui = async () => {
    setDang(true); setLoi('');
    try {
      const r = await manKhachApi.ghep(ma, 'Màn khách');
      ghiKhoaMan(r.khoa);
      onXong(r.khoa);
    } catch (e) { setLoi(e.message || 'Không ghép được'); }
    setDang(false);
  };
  return (
    <div className="mk-giua">
      <div className="mk-to">Ghép với máy quầy</div>
      <div className="mk-vua mk-mo">Nhập mã hiện ở góc màn Bán hàng (nút “Màn khách”)</div>
      <input className="mk-o-ma" inputMode="numeric" autoComplete="off" maxLength={SO_CHU_SO} value={ma}
        onChange={(e) => setMa(e.target.value.replace(/\D/g, '').slice(0, SO_CHU_SO))} onKeyDown={(e) => { if (e.key === 'Enter' && ma.length === SO_CHU_SO && !dang) gui(); }} />
      <div className="mk-loi">{loi}</div>
      <button className="mk-nut" disabled={dang || ma.length !== SO_CHU_SO} onClick={gui}>Ghép</button>
    </div>
  );
}

export default function ManKhach() {
  const [khoa, setKhoa] = useState(docKhoaMan);
  const [ghiChu, setGhiChu] = useState('');
  const matQuyen = () => { ghiKhoaMan(''); setKhoa(''); setGhiChu('Màn này đã bị thu hồi hoặc chưa ghép — nhập mã mới để ghép lại'); };
  return (
    <div className="mk">
      {khoa ? <ManChay khoa={khoa} onMatQuyen={matQuyen} /> : <ManGhep onXong={setKhoa} ghiChu={ghiChu} />}
    </div>
  );
}
