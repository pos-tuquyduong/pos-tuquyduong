// GIAO-DIEN-2 (B4) — màn riêng "PIN chủ quán", tách từ thẻ Hạng thành viên (HANG-1). Cùng lời gọi hangApi.datPin, cùng luật cũ:
// chỉ tài khoản chủ quán, gõ lại mật khẩu đăng nhập; đã có PIN thì gõ cả PIN cũ (chủ quán 05.11 — quên PIN: nhờ chat xoá, không có nút).
// PIN dùng khi lưu / xoá hạng và cấp / thu hồi hạng (chủ quán 04.11 — máy chủ kiểm, sai 5 lần khoá). Máy chủ không đổi.
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hangApi } from '../../utils/api';
import { baoXong, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';

export default function PinChuQuan() {
  const { user } = useAuth();
  const [coPin, setCoPin] = useState(null);
  const [loiPin, setLoiPin] = useState('');
  const [dangPin, setDangPin] = useState(false);
  const [pin, setPin] = useState({ mat_khau: '', pin_cu: '', pin: '', pin_lai: '' });

  useEffect(() => {
    hangApi.coPin().then((r) => setCoPin(r.data?.co_pin === true)).catch((e) => baoLoiTu('đọc trạng thái PIN chủ quán', e));
  }, []);

  const datPin = async () => {
    setLoiPin(''); setDangPin(true);
    try {
      await hangApi.datPin(pin.mat_khau, pin.pin, pin.pin_lai, pin.pin_cu);
      setPin({ mat_khau: '', pin_cu: '', pin: '', pin_lai: '' });
      baoXong(coPin ? 'Đã đổi PIN chủ quán' : 'Đã đặt PIN chủ quán');
      setCoPin(true);
    } catch (e) { setLoiPin(lyDoLoi(e)); baoLoiTu(coPin ? 'đổi PIN chủ quán' : 'đặt PIN chủ quán', e); } finally { setDangPin(false); }
  };

  const dong = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 };
  const soThoi = (khoa) => (e) => setPin((p) => ({ ...p, [khoa]: e.target.value.replace(/\D/g, '') }));
  return (
    <>
      <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🔐 PIN chủ quán</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.5rem' }}>
        Dùng khi cấp / thu hồi hạng ở trang Khách hàng và khi lưu / xoá hạng ở Hạng thành viên. {coPin ? 'Đã đặt.' : 'Chưa đặt — chưa cấp hạng, chưa lưu / xoá hạng được.'}
      </p>
      {user?.role === 'owner' && (
        <div style={dong}>
          <input className="input" type="password" style={{ width: 170 }} placeholder="Mật khẩu đăng nhập" value={pin.mat_khau} aria-label="Mật khẩu đăng nhập"
            onChange={(e) => setPin((p) => ({ ...p, mat_khau: e.target.value }))} />
          {coPin && <input className="input" type="password" inputMode="numeric" maxLength={6} style={{ width: 130 }} placeholder="PIN cũ" value={pin.pin_cu}
            aria-label="PIN cũ" onChange={soThoi('pin_cu')} />}
          <input className="input" type="password" inputMode="numeric" maxLength={6} style={{ width: 130 }} placeholder="PIN mới (4–6 số)" value={pin.pin}
            aria-label="PIN mới" onChange={soThoi('pin')} />
          <input className="input" type="password" inputMode="numeric" maxLength={6} style={{ width: 130 }} placeholder="Nhập lại PIN" value={pin.pin_lai}
            aria-label="Nhập lại PIN" onChange={soThoi('pin_lai')} />
          <button className="btn btn-primary" onClick={datPin} disabled={dangPin}>{dangPin ? 'Đang lưu…' : coPin ? 'Đổi PIN' : 'Đặt PIN'}</button>
        </div>
      )}
      <LoiO loi={loiPin} />
    </>
  );
}
