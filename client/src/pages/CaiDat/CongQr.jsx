// TINGEE-1 — dòng "Cổng QR: <tên> ✓ / chưa cài ✗" đầu màn Cài đặt. Máy chủ chỉ trả tên cổng + đã cài đủ biến chưa (GET /settings → cong_qr),
// không bao giờ trả khoá. Đổi cổng = biến CONG_QR trên Render (viec/TINGEE-1/cai_dat_tingee.md), không đổi ở đây.
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';

export default function CongQr() {
  const [cong, setCong] = useState(null);
  const [loi, setLoi] = useState('');
  useEffect(() => { api.get('/settings').then((d) => setCong(d.cong_qr || null)).catch((e) => { setCong(null); setLoi(lyDoLoi(e)); baoLoiTu('đọc cổng QR', e); }); }, []);
  if (loi) return <LoiO loi={`Chưa đọc được cổng QR đang chạy: ${loi}`} />;
  if (!cong) return null;
  return (
    <div style={{ fontSize: 13.5, marginBottom: 8, color: cong.da_cai ? '#15803d' : '#b91c1c' }}>
      Cổng QR: <b>{cong.ten}</b> {cong.da_cai ? '✓' : '— chưa cài ✗'}
    </div>
  );
}
