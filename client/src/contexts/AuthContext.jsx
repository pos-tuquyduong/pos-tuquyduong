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
      // Ignore
    }
    api.setToken(null);
    setUser(null);
    setPermissions({});
  };

  const hasPermission = (permission) => {
    if (user?.role === 'admin') return true;
    return !!permissions[permission];
  };

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    hasPermission,
    isAdmin: user?.role === 'admin'
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
