/**
 * POS Frontend - Auth Context
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { api, authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data.user);
      setPermissions(data.permissions);
    } catch (err) {
      console.error('Kiểm tra phiên đăng nhập thất bại, xoá token:', err?.message || err);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    api.setToken(data.token);
    setUser(data.user);
    setPermissions(data.permissions);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Đăng xuất vẫn nên coi là thành công dù API lỗi (token phía client vẫn bị xoá) — chỉ log để biết
      console.error('Lỗi gọi API đăng xuất (bỏ qua, vẫn đăng xuất phía client):', err?.message || err);
    }
    api.setToken(null);
    setUser(null);
    setPermissions({});
  };

  const hasPermission = (permission) => {
    // BUG-FIX (09.08.2026): role thật trong toàn hệ thống luôn là 'owner', KHÔNG BAO GIỜ
    // là 'admin' — dòng cũ khiến owner luôn bị coi là không có quyền gì (permissions object
    // của owner rỗng, không ai seed permission tường minh cho role 'owner' vì backend đã
    // bypass hoàn toàn ở middleware/auth.js). Hậu quả thật: các tab/menu dùng hàm này để
    // ẩn/hiện (Cài đặt, Báo cáo, Sản phẩm, Flash sale...) bị ẩn nhầm khỏi tài khoản owner.
    if (user?.role === 'owner') return true;
    return !!permissions[permission];
  };

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    hasPermission,
    isAdmin: user?.role === 'owner'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
