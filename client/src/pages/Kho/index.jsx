/**
 * KHO-1 — màn Quản lý kho: Nguyên liệu · Sản phẩm & công thức · Nhập từ SX. Quyền kiểm ở máy chủ; ở đây chỉ ẩn tab không dùng được.
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NguyenLieu from './NguyenLieu';
import SanPham from './SanPham';
import NhapSx from './NhapSx';
import './kho.css';

export default function Kho() {
  const { user } = useAuth();
  const vaiTro = user?.role;
  const tabs = [
    { ma: 'nl', ten: 'Nguyên liệu', hien: true },
    { ma: 'sp', ten: 'Sản phẩm & công thức', hien: vaiTro === 'owner' || vaiTro === 'manager' },
    { ma: 'sx', ten: 'Nhập từ SX', hien: vaiTro === 'owner' },
  ].filter((t) => t.hien);
  const [tab, setTab] = useState('nl');

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">📦 Quản lý kho</h1>
      </header>
      <div className="page-content">
        {tabs.length > 1 && (
          <div className="kho-tabs">
            {tabs.map((t) => (
              <button key={t.ma} className={`kho-tab ${tab === t.ma ? 'on' : ''}`} onClick={() => setTab(t.ma)}>{t.ten}</button>
            ))}
          </div>
        )}
        {tab === 'nl' && <NguyenLieu vaiTro={vaiTro} />}
        {tab === 'sp' && <SanPham vaiTro={vaiTro} />}
        {tab === 'sx' && <NhapSx />}
      </div>
    </div>
  );
}
