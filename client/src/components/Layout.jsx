/**
 * POS - Main Layout with Sidebar + Bottom Navigation (Mobile)
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingCart, 
  Users, 
  Wallet, 
  Package, 
  ClipboardList, 
  BarChart3,
  Settings,
  LogOut,
  AlertCircle,
  Menu,
  X,
  Tag
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: ShoppingCart, label: 'Bán hàng' },
    { to: '/customers', icon: Users, label: 'Khách hàng' },
    { to: '/balance', icon: Wallet, label: 'Số dư', permission: 'view_customer_balance' },
    { to: '/orders', icon: Package, label: 'Đơn hàng' },
    { to: '/registrations', icon: ClipboardList, label: 'Đăng ký mới' },
    { to: '/discount-codes', icon: Tag, label: 'Mã chiết khấu', permission: 'manage_users' },
    { to: '/reports', icon: BarChart3, label: 'Báo cáo', permission: 'view_reports' },
    { to: '/refunds', icon: AlertCircle, label: 'Hoàn tiền', permission: 'approve_refund' },
    { to: '/settings', icon: Settings, label: 'Cài đặt', permission: 'manage_users' },
  ];

  // Menu items cho bottom nav (5 quan trọng nhất)
  const bottomNavItems = [
    { to: '/', icon: ShoppingCart, label: 'Bán hàng' },
    { to: '/customers', icon: Users, label: 'Khách' },
    { to: '/orders', icon: Package, label: 'Đơn hàng' },
    { to: '/balance', icon: Wallet, label: 'Số dư', permission: 'view_customer_balance' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar - Desktop */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <ShoppingCart size={24} />
          <span style={{ marginLeft: '0.5rem' }}>POS System</span>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '0.5rem' }}>
          {navItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.to === '/'}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid #334155' 
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
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button 
          className="bottom-nav-item"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span>Menu</span>
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
                if (item.permission && !hasPermission(item.permission)) {
                  return null;
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
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
