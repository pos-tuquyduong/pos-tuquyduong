/**
 * KH-QUAY-1 — nút "Mã đăng nhập App" trong khung chi tiết khách (Customers.jsx).
 * Bấm → POST /api/pos/kh/cap-ma → mã 6 số + đồng hồ đếm ngược theo `het_han_giay` của máy chủ.
 * Mã chỉ sống trong state của thành phần này: đóng modal / đổi khách (key={sdt}) là mất, không ghi đâu khác.
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { dinhDangDemNguoc, giayConLai, loiMaApp } from '../utils/maApp';

export default function MaDangNhapApp({ sdt }) {
  const [ma, setMa] = useState(null);            // { ma, hetHanLuc }
  const [giay, setGiay] = useState(0);
  const [dangLay, setDangLay] = useState(false);
  const [loi, setLoi] = useState('');
  const dangBay = useRef(false);                 // khoá đồng bộ: hai cú bấm sát nhau không lọt qua trước khi render
  const conSong = useRef(true);

  useEffect(() => {
    conSong.current = true;
    return () => { conSong.current = false; };
  }, []);

  useEffect(() => {
    if (!ma) return undefined;
    const tick = () => setGiay(giayConLai(ma.hetHanLuc, Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [ma]);

  const layMa = async () => {
    if (dangBay.current) return;
    dangBay.current = true;
    setDangLay(true);
    setLoi('');
    try {
      const r = await api.post('/kh/cap-ma', { sdt });
      if (conSong.current) setMa({ ma: r.ma, hetHanLuc: Date.now() + r.het_han_giay * 1000 });
    } catch (err) {
      if (conSong.current) { setMa(null); setLoi(loiMaApp(err)); }
    } finally {
      dangBay.current = false;
      if (conSong.current) setDangLay(false);
    }
  };

  const hetHan = ma && giay <= 0;

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
      {ma && (
        <div style={{ textAlign: 'center', marginBottom: '8px', padding: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
          <div style={{
            fontSize: '2.2rem', fontWeight: 800, letterSpacing: '0.35em', paddingLeft: '0.35em',
            fontFamily: 'monospace', color: hetHan ? '#94a3b8' : '#0c4a6e', opacity: hetHan ? 0.4 : 1,
          }}>{ma.ma}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px', color: hetHan ? '#b91c1c' : '#475569' }}>
            {hetHan ? 'Hết hạn' : `Còn ${dinhDangDemNguoc(giay)}`}
          </div>
          {!hetHan && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Đọc mã này cho khách nhập vào App.</div>}
        </div>
      )}
      {loi && <div className="alert alert-danger" style={{ marginBottom: '8px' }}>{loi}</div>}
      <button type="button" className="btn btn-outline" onClick={layMa} disabled={dangLay}>
        {dangLay ? 'Đang lấy mã...' : hetHan ? '🔑 Lấy mã mới' : ma ? '🔑 Lấy mã khác' : '🔑 Mã đăng nhập App'}
      </button>
    </div>
  );
}
