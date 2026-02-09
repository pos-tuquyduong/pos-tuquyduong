/**
 * POS - Login Page
 * Style: Glassmorphism với particles effect (giống SX)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Generate particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className="login-container">
      {/* Background với gradient và wave effect */}
      <div className="login-bg">
        <div className="login-wave login-wave-1"></div>
        <div className="login-wave login-wave-2"></div>
        <div className="login-wave login-wave-3"></div>
      </div>

      {/* Particles/Bokeh effect */}
      <div className="login-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: p.size + 'px',
              height: p.size + 'px',
              left: p.left + '%',
              top: p.top + '%',
              animationDuration: p.duration + 's',
              animationDelay: p.delay + 's',
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Glassmorphism Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img 
            src="/icons/icon-192x192.png" 
            alt="Tứ Quý Đường"
          />
        </div>

        {/* Title */}
        <h1 className="login-title">Tứ Quý Đường</h1>
        <p className="login-subtitle">Hệ thống Quản lý Bán hàng</p>

        {/* Error */}
        {error && <div className="login-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          © 2026 Tứ Quý Đường
        </div>
      </div>
    </div>
  );
}
