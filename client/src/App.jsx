/**
 * POS System - Main App
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Layout from './components/Layout';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Balance from './pages/Balance';
import Orders from './pages/Orders';
import Sync from './pages/Sync';
import Reports from './pages/Reports';
import Refunds from './pages/Refunds';
import Settings from './pages/Settings';

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
        <Route index element={<Sales />} />
        <Route path="customers" element={<Customers />} />
        <Route path="balance" element={<Balance />} />
        <Route path="orders" element={<Orders />} />
        <Route path="sync" element={<Sync />} />
        <Route path="reports" element={<Reports />} />
        <Route path="refunds" element={<Refunds />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
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
