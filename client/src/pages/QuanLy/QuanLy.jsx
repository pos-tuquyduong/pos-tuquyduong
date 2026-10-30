/**
 * Trang Quản lý (BH-2, menu 6 mục): lưới ô dẫn tới các màn đã có. Chỉ dẫn tới trang — không đổi màn nào, quyền như từng mục cũ
 * (lối cần quyền mà người dùng không có thì ẩn; máy chủ vẫn là bên kiểm quyền thật).
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { luoiQuanLy } from './menu';

export default function QuanLy() {
  const { hasPermission } = useAuth();
  return (
    <div>
      <header className="page-header"><h1>Quản lý</h1></header>
      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {luoiQuanLy(hasPermission).map((o) => (
          <div key={o.ten} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <b>{o.ten}</b>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.ghiChu}</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
              {o.loi.map((l) => <Link key={l.to} to={l.to} className="btn btn-outline">{l.ten}</Link>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
