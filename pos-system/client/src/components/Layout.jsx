/**
 * POS - Main Layout with Sidebar
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingCart, 
  Users, 
  Wallet, 
  Package, 
  RefreshCw, 
  BarChart3,
  Settings,
  LogOut,
  AlertCircle
} from 'lucide-react';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: ShoppingCart, label: 'Bán hàng' },
    { to: '/customers', icon: Users, label: 'Khách hàng' },
    { to: '/balance', icon: Wallet, label: 'Số dư', permission: 'view_customer_balance' },
    { to: '/orders', icon: Package, label: 'Đơn hàng' },
    { to: '/sync', icon: RefreshCw, label: 'Đồng bộ' },
    { to: '/reports', icon: BarChart3, label: 'Báo cáo', permission: 'view_reports' },
    { to: '/refunds', icon: AlertCircle, label: 'Hoàn tiền', permission: 'approve_refund' },
    { to: '/settings', icon: Settings, label: 'Cài đặt', permission: 'manage_users' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <ShoppingCart size={24} />
          <span style={{ marginLeft: '0.5rem' }}>POS System</span>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, paddingTop: '0.5rem' }}>
          {navItems.map((item) => {
            // Kiểm tra quyền
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
              {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
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

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
