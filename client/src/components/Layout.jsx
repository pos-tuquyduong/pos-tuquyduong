/**
 * POS - Main Layout with Sidebar + Bottom Navigation (Mobile)
 */

import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Warehouse,
  LayoutGrid
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { dungMenu } from '../pages/QuanLy/menu';
// POS-DODNO-v1: goi qua lop chung, KHONG fetch tran (luat banh coc cua bo kiem)
import { soNoApi } from '../utils/api';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  // ═══ POS-DODNO-v1 · LOP 2 + 3: dai bao viec ket, bam vao la doi ngay ═══
  // Gop hai lop vao MOT khoi: thay so va xu ly ngay tai cho, khong phai di
  // tim man hinh khac. Goi qua soNoApi (lop chung) chu KHONG fetch tran.
  const [soNo, setSoNo] = useState({ cho: 0, canXem: 0 });
  const [dangDoi, setDangDoi] = useState(false);

  const xemSoNo = async () => {
    try {
      setSoNo(await soNoApi.xem());
    } catch { /* im lang: dai bao hong khong duoc lam hong ca man hinh */ }
  };

  useEffect(() => {
    xemSoNo();
    const h = setInterval(xemSoNo, 60000);
    return () => clearInterval(h);
  }, []);

  const doiNgay = async () => {
    if (dangDoi) return;
    setDangDoi(true);
    try {
      await soNoApi.doiNgay();
      await xemSoNo();
    } catch { /* im lang */ }
    finally { setDangDoi(false); }
  };
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // BH-2: menu 6 mục (máy tính) / 5 mục (điện thoại) — danh sách và quyền ở pages/QuanLy/menu.js. Các màn cũ chuyển vào trang Quản lý.
  const bieuTuong = [
    { to: '/', icon: ShoppingCart },
    { to: '/hom-nay', icon: BarChart3 },
    { to: '/orders', icon: Package },
    { to: '/customers', icon: Users },
    { to: '/kho', icon: Warehouse },
    { to: '/quan-ly', icon: LayoutGrid },
  ];
  const { mayTinh, dienThoai } = dungMenu(hasPermission);
  const gan = (m) => ({ ...m, icon: bieuTuong.find((b) => b.to === m.to)?.icon || Menu });   // "Thêm" (to: null) dùng icon Menu
  const navItems = mayTinh.map(gan);
  const bottomNavItems = dienThoai.map(gan);

  return (
    <div className="app-layout">
      {/* Sidebar - Desktop */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/icons/icon-72x72.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
          <span>Tứ Quý Đường</span>
        </div>

        {/* POS-DODNO-v1: chi hien khi CO viec ket — khong co thi khong chiem cho */}
        {(soNo.cho > 0 || soNo.canXem > 0) && (
          <div
            onClick={doiNgay}
            title="Việc kho chưa gửi được sang bên sản xuất. Bấm để gửi lại ngay."
            style={{
              margin: '0.5rem 0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8,
              background: soNo.canXem > 0 ? '#fee2e2' : '#fef3c7',
              color: soNo.canXem > 0 ? '#991b1b' : '#92400e',
              fontSize: '0.75rem', fontWeight: 600,
              cursor: dangDoi ? 'wait' : 'pointer', lineHeight: 1.35,
            }}
          >
            {dangDoi
              ? 'Đang gửi lại...'
              : <>
                  ⏳ {soNo.cho > 0 && <>{soNo.cho} việc kho chờ gửi</>}
                  {soNo.cho > 0 && soNo.canXem > 0 && ' · '}
                  {soNo.canXem > 0 && <>{soNo.canXem} việc cần bạn xem</>}
                  <div style={{ fontWeight: 400, marginTop: 2 }}>Bấm để gửi lại ngay</div>
                </>}
          </div>
        )}
        <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '0.5rem' }}>
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.to === '/'}
              >
                <item.icon size={20} />
                <span>{item.ten}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid rgba(255,255,255,0.15)' 
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>{user?.display_name || user?.username}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {user?.role === 'owner' ? 'Owner' : user?.role === 'manager' ? 'Manager' : 'Staff'}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              color: '#94a3b8',
              borderColor: '#475569'
            }}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* POS-2 (POS-ERRHANDLING-v1) — lưới đỡ BÊN TRONG: một màn hình vỡ
            thì sidebar và bottom-nav vẫn còn, nhân viên chuyển sang tab khác
            bán tiếp được. key theo đường dẫn để mỗi lần chuyển tab là lưới đỡ
            được dựng lại — nếu không, đã vỡ một lần là kẹt màn báo lỗi mãi. */}
        <ErrorBoundary key={location.pathname} label="Màn hình này">
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => (item.to === null ? (
          <button key={item.ten} className="bottom-nav-item" onClick={() => setMobileMenuOpen(true)}>
            <item.icon size={20} />
            <span>{item.ten}</span>
          </button>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            <item.icon size={20} />
            <span>{item.ten}</span>
          </NavLink>
        )))}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/icons/icon-72x72.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <span>Tứ Quý Đường</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="mobile-menu-user">
              <div style={{ fontWeight: 600 }}>{user?.display_name || user?.username}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {user?.role === 'owner' ? 'Owner' : user?.role === 'manager' ? 'Manager' : 'Staff'}
              </div>
            </div>
            <nav className="mobile-menu-nav">
              {navItems.map((item) => {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon size={20} />
                    <span>{item.ten}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button 
              onClick={handleLogout}
              className="mobile-menu-logout"
            >
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
