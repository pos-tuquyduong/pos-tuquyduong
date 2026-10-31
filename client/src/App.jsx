/**
 * POS System - Main App
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Layout from './components/Layout';
import DonApp from './pages/DonApp';
import TrangChu from './pages/BanHang';
import Customers from './pages/Customers';
import Balance from './pages/Balance';
import Orders from './pages/Orders';
import Registrations from './pages/Registrations';
import Reports from './pages/Reports';
import Refunds from './pages/Refunds';
import Settings from './pages/Settings';
import DiscountCodes from './pages/DiscountCodes';
import InvoiceSettings from './pages/InvoiceSettings';
import Kho from './pages/Kho';
import QuanLy from './pages/QuanLy/QuanLy';
import ThanhLoi from './pages/QuanLy/ThanhLoi';
import ManKhach from './pages/ManKhach';   // MANKHACH-1

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        color: '#64748b'
      }}>
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<TrangChu />} />
        <Route path="customers" element={<ThanhLoi man="customers"><Customers /></ThanhLoi>} />
        <Route path="balance" element={<Balance />} />
        <Route path="orders" element={<ThanhLoi man="orders"><Orders /></ThanhLoi>} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="sync" element={<Navigate to="/registrations" replace />} />
        <Route path="reports" element={<Reports />} />
        <Route path="discount-codes" element={<DiscountCodes />} />
        <Route path="refunds" element={<Refunds />} />
        <Route path="settings" element={<Settings />} />
        <Route path="invoice-settings" element={<InvoiceSettings />} />
        <Route path="kho" element={<Kho />} />
        <Route path="hom-nay" element={<Reports />} />   {/* BH-2: "Hôm nay" = Báo cáo / Đối soát (mặc định đã là ngày hôm nay) */}
        <Route path="quan-ly" element={<QuanLy />} />
        <Route path="don-app" element={<ThanhLoi man="don-app"><DonApp /></ThanhLoi>} />   {/* KH-MUA-1 */}
      </Route>

      {/* MANKHACH-1: máy tính bảng quay về phía khách — không cần đăng nhập nhân viên (dùng khoá ghép riêng) */}
      <Route path="/man-khach" element={<ManKhach />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
