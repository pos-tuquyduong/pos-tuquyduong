/**
 * Trang Quản lý (GIAO-DIEN-2, chủ quán duyệt mẫu 17.11): 6 nhóm, mỗi nút mở THẲNG đúng màn + ô "Tìm nhanh một mục cài đặt".
 * MỘT nguồn dữ liệu (menu.js) cho cả máy tính (lưới 3 cột) lẫn điện thoại (danh sách, CSS @media 768 ở index.css).
 * Chỉ dẫn tới trang — quyền mỗi nút giữ đúng quyền trước đây (nút cần quyền mà người dùng không có thì ẩn; máy chủ vẫn là bên kiểm quyền thật).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Users, Megaphone, Wallet, UserCog, Store, LayoutGrid, ChevronRight } from 'lucide-react';
import TieuDeMan from '../../components/TieuDeMan';   // GIAO-DIEN-4
import { useAuth } from '../../contexts/AuthContext';
import { timMuc, nutDuyNhat } from './menu';

// GIAO-DIEN-4 E1: tên icon (menu.js, mỗi nhóm một tên) → icon lucide. Tên lạ → LayoutGrid, không vỡ màn.
const ICON_NHOM = { Coffee, Users, Megaphone, Wallet, UserCog, Store };

export default function QuanLy() {
  const { hasPermission, user } = useAuth();
  const dieuHuong = useNavigate();
  const [chuoi, setChuoi] = useState('');
  const nhom = timMuc(chuoi, hasPermission);
  const enter = (e) => {
    if (e.key !== 'Enter') return;
    const nut = nutDuyNhat(nhom);
    if (nut) dieuHuong(nut.to);
  };
  return (
    <div>
      <header className="page-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <TieuDeMan icon={LayoutGrid} ten="Quản lý" />
        <input type="search" className="input" style={{ maxWidth: 360, flex: '1 1 220px' }} value={chuoi} onChange={(e) => setChuoi(e.target.value)}
          onKeyDown={enter} placeholder="Tìm nhanh một mục cài đặt" aria-label="Tìm nhanh một mục cài đặt" />
      </header>
      <div className="page-content">
        {chuoi.trim() === '' && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Gõ: PIN, giờ mở cửa, hạng Vàng, máy in…</div>}
        {nhom.length === 0 && <div className="text-gray" style={{ padding: '1rem 0' }}>Không có mục nào khớp "{chuoi}".</div>}
        <div className="ql-luoi">
          {nhom.map((g) => {
            const Icon = ICON_NHOM[g.icon] || LayoutGrid;
            return (
            <div key={g.ten} className={`card ql-the ql-mau-${g.mau}`}>
              <div className="ql-the-ten"><span className="ql-the-o" aria-hidden="true"><Icon size={20} /></span>{g.ten}</div>
              <div className="ql-nut-hang">
                {g.nut.map((n) => (
                  <Link key={n.ten} to={n.to} className="btn btn-outline ql-nut">{n.ten}<ChevronRight className="ql-chevron" size={18} aria-hidden="true" /></Link>
                ))}
              </div>
            </div>
            );
          })}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '1rem 0' }}>Mỗi nút mở thẳng đúng màn. Một món chỉ sửa ở MỘT chỗ.</div>
        {user?.role === 'owner' && (   // KH-SDT-1: ngoài 6 nhóm (menu.js); chỉ chủ quán
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: 360 }}>
            <b>Dọn dữ liệu thử</b>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Chạy một lần trước khai trương</span>
            <div><Link to="/don-thu" className="btn btn-outline">Mở</Link></div>
          </div>
        )}
      </div>
    </div>
  );
}
