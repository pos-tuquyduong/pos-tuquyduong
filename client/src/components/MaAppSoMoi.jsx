/**
 * KH-QUAY-2 — ô "Mã đăng nhập App cho số mới" ở màn Khách hàng: SĐT chưa là khách vẫn lấy được mã để tự đăng ký trên App.
 * Chỉ kiểm SĐT rồi giao cho MaDangNhapApp (gọi POST /kh/cap-ma). Không tạo khách, không giữ mã ở đâu ngoài state thành phần đó.
 */
import { useState } from 'react';
import MaDangNhapApp from './MaDangNhapApp';
import { chuanSdtQuay } from '../utils/maApp';

export default function MaAppSoMoi() {
  const [go, setGo] = useState('');
  const [sdt, setSdt] = useState('');     // số đã qua kiểm — chỉ khi có số này mới hiện MaDangNhapApp (và mới gọi máy chủ)
  const [loi, setLoi] = useState('');

  const capMa = (e) => {
    e.preventDefault();
    const s = chuanSdtQuay(go);
    setLoi(s ? '' : 'SĐT không hợp lệ — nhập số bắt đầu bằng 0, đủ 10–11 số');
    setSdt(s || '');
  };

  return (
    <form onSubmit={capMa} style={{ marginBottom: '1rem', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <div style={{ fontWeight: 600, marginBottom: '6px' }}>🔑 Mã đăng nhập App cho số mới</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input className="form-input" type="tel" inputMode="numeric" placeholder="SĐT khách chưa có trong danh sách" value={go}
          onChange={(e) => { setGo(e.target.value); setSdt(''); setLoi(''); }} style={{ flex: '1 1 200px' }} />
        <button type="submit" className="btn btn-primary">Cấp mã</button>
      </div>
      {loi && <div className="alert alert-danger" style={{ marginTop: '8px' }}>{loi}</div>}
      {sdt && <MaDangNhapApp key={sdt} sdt={sdt} tuLay />}
    </form>
  );
}
