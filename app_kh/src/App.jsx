import { useEffect, useState } from 'react';
import { docToken, xoaToken, datKhiHetPhien } from './api.js';
import ThanhTab from './components/ThanhTab.jsx';
import DangNhap from './pages/DangNhap.jsx';
import Menu from './pages/Menu.jsx';
import Diem from './pages/Diem.jsx';
import Voucher from './pages/Voucher.jsx';
import Don from './pages/Don.jsx';
import Toi from './pages/Toi.jsx';

// Không router: một trạng thái `tab`. Token hết hạn / 401 → api.js xoá token và gọi lại về màn đăng nhập.
export default function App() {
  const [dangNhap, datDangNhap] = useState(() => !!docToken());
  const [tab, datTab] = useState('menu');

  useEffect(() => {
    datKhiHetPhien(() => datDangNhap(false));
  }, []);

  const dangXuat = () => { xoaToken(); datDangNhap(false); datTab('menu'); };

  if (!dangNhap) return <div className="khung"><DangNhap khiXong={() => datDangNhap(true)} /></div>;
  return (
    <div className="khung">
      <header className="dau">Tứ Quý Đường</header>
      <main className="noi-dung">
        {tab === 'menu' && <Menu />}
        {tab === 'diem' && <Diem />}
        {tab === 'voucher' && <Voucher />}
        {tab === 'don' && <Don />}
        {tab === 'toi' && <Toi dangXuat={dangXuat} />}
      </main>
      <ThanhTab tab={tab} chon={datTab} />
    </div>
  );
}
