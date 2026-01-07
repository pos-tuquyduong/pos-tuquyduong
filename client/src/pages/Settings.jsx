// Settings.jsx - Có thêm tab Backup/Restore
import { useState, useEffect } from 'react';
import { productsApi, usersApi } from '../utils/api';
import { Save, Plus, Users, Package, Download, Upload, Database } from 'lucide-react';

export default function Settings() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Backup state
  const [backupInfo, setBackupInfo] = useState(null);
  const [restoring, setRestoring] = useState(false);

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
      } else if (tab === 'backup') {
        await loadBackupInfo();
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadBackupInfo = async () => {
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/backup/info', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      setBackupInfo(data);
    } catch (err) { console.error(err); }
  };

  // SỬA: Dùng unique_id (sx_product_type + sx_product_id) thay vì id
  const getUniqueId = (p) => `${p.sx_product_type}_${p.sx_product_id}`;

  const updatePrice = (uniqueId, price) => {
    setProducts(products.map(p => 
      getUniqueId(p) === uniqueId ? { ...p, price: parseInt(price) || 0 } : p
    ));
  };

  const savePrices = async () => {
    setSaving(true);
    try {
      await productsApi.updatePricesBatch(products.map(p => ({ 
        sx_product_type: p.sx_product_type,
        sx_product_id: p.sx_product_id,
        code: p.code,
        name: p.name,
        price: p.price 
      })));
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

  // Backup functions
  const downloadBackup = () => {
    const token = localStorage.getItem('pos_token');
    window.open('/api/pos/backup/download?token=' + token, '_blank');
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      setMessage('Lỗi: Vui lòng chọn file .db');
      return;
    }

    if (!confirm('Bạn có chắc muốn khôi phục database? Dữ liệu hiện tại sẽ được backup trước khi khôi phục.')) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    try {
      const token = localStorage.getItem('pos_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pos/backup/restore', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Khôi phục thành công! Trang sẽ tải lại sau 3 giây...');
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
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
          <button className={`btn ${tab === 'backup' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('backup')}>
            <Database size={16} /> Sao lưu
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
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên SP</th>
                    <th>Loại</th>
                    <th>Giá bán (VND)</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={getUniqueId(p)}>
                      <td>
                        <span style={{ marginRight: '0.25rem' }}>{p.icon || (p.category === 'tea' ? '🍵' : '🥤')}</span>
                        <strong style={{ color: p.color || '#333' }}>{p.code}</strong>
                      </td>
                      <td>{p.name}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          background: p.category === 'tea' ? '#fffbeb' : '#f0fdf4',
                          color: p.category === 'tea' ? '#f59e0b' : '#22c55e',
                          fontSize: '0.85rem'
                        }}>
                          {p.category === 'juice' ? 'Nước ép' : 'Trà'}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="input" 
                          style={{ width: '120px' }} 
                          value={p.price || ''} 
                          placeholder="0"
                          onChange={e => updatePrice(getUniqueId(p), e.target.value)} 
                        />
                      </td>
                      <td>
                        {p.is_active ? 
                          <span className="badge badge-success">Đang bán</span> : 
                          <span className="badge badge-gray">Tạm dừng</span>
                        }
                      </td>
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
          ) : tab === 'permissions' ? (
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
          ) : tab === 'backup' ? (
            <>
              <div className="card-title">Sao lưu & Khôi phục Database</div>

              {/* Thông tin database */}
              {backupInfo && backupInfo.exists && (
                <div style={{ 
                  background: '#f0fdf4', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.5rem' 
                }}>
                  <p style={{ margin: 0 }}>
                    <strong>📁 Database hiện tại:</strong> {backupInfo.sizeFormatted}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    Cập nhật lần cuối: {new Date(backupInfo.modified).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-1">
                <button className="btn btn-primary" onClick={downloadBackup}>
                  <Download size={16} /> Tải file Backup
                </button>

                <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                  <Upload size={16} /> {restoring ? 'Đang khôi phục...' : 'Khôi phục từ file'}
                  <input 
                    type="file" 
                    accept=".db" 
                    style={{ display: 'none' }} 
                    onChange={handleRestore}
                    disabled={restoring}
                  />
                </label>
              </div>

              {/* Hướng dẫn */}
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: '#fffbeb', 
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <strong>💡 Hướng dẫn:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                  <li>Nên backup định kỳ mỗi ngày</li>
                  <li>Lưu file backup vào Google Drive hoặc máy tính</li>
                  <li>Khi khôi phục, dữ liệu hiện tại sẽ được backup tự động trước</li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
