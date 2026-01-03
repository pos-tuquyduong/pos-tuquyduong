// Settings.jsx
import { useState, useEffect } from 'react';
import { productsApi, usersApi } from '../utils/api';
import { Save, Plus, Users, Package } from 'lucide-react';

export default function Settings() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'products') {
        const data = await productsApi.list({ active: '' });
        setProducts(data);
      } else if (tab === 'users') {
        const data = await usersApi.list();
        setUsers(data);
      } else if (tab === 'permissions') {
        const data = await usersApi.permissions();
        setPermissions(data.permissions);
        setAllPerms(data.all_permissions);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updatePrice = (id, price) => {
    setProducts(products.map(p => p.id === id ? { ...p, price: parseInt(price) || 0 } : p));
  };

  const savePrices = async () => {
    setSaving(true);
    try {
      await productsApi.updatePricesBatch(products.map(p => ({ id: p.id, price: p.price })));
      setMessage('Đã lưu giá thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  const togglePermission = (role, perm) => {
    setPermissions({
      ...permissions,
      [role]: { ...permissions[role], [perm]: !permissions[role]?.[perm] }
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await usersApi.updatePermissions('staff', permissions.staff);
      setMessage('Đã lưu phân quyền!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <header className="page-header"><h1 className="page-title">⚙️ Cài đặt</h1></header>
      <div className="page-content">
        {message && <div className={`alert ${message.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}
        
        <div className="flex gap-1 mb-2">
          <button className={`btn ${tab === 'products' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('products')}>
            <Package size={16} /> Giá bán
          </button>
          <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('users')}>
            <Users size={16} /> Nhân viên
          </button>
          <button className={`btn ${tab === 'permissions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('permissions')}>
            🔐 Phân quyền
          </button>
        </div>

        <div className="card">
          {loading ? <div className="loading">Đang tải...</div> : tab === 'products' ? (
            <>
              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>Quản lý giá bán</div>
                <button className="btn btn-primary" onClick={savePrices} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu tất cả'}
                </button>
              </div>
              <table className="table">
                <thead><tr><th>Mã</th><th>Tên SP</th><th>Loại</th><th>Giá bán (VND)</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.code}</strong></td>
                      <td>{p.name}</td>
                      <td>{p.category === 'juice' ? 'Nước ép' : 'Trà'}</td>
                      <td><input type="number" className="input" style={{ width: '120px' }} value={p.price} onChange={e => updatePrice(p.id, e.target.value)} /></td>
                      <td>{p.is_active ? <span className="badge badge-success">Đang bán</span> : <span className="badge badge-gray">Tạm dừng</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : tab === 'users' ? (
            <>
              <div className="card-title">Danh sách nhân viên</div>
              <table className="table">
                <thead><tr><th>Username</th><th>Tên hiển thị</th><th>Vai trò</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.display_name}</td>
                      <td>{u.role === 'admin' ? '👑 Admin' : '👤 Staff'}</td>
                      <td>{u.is_active ? <span className="badge badge-success">Hoạt động</span> : <span className="badge badge-danger">Vô hiệu</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>Phân quyền cho Staff</div>
                <button className="btn btn-primary" onClick={savePermissions} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              <div className="grid grid-2 gap-1">
                {allPerms.map(p => (
                  <label key={p.key} className="flex flex-center gap-1" style={{ padding: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={permissions.staff?.[p.key] || false} onChange={() => togglePermission('staff', p.key)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
