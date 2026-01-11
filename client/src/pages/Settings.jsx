// Settings.jsx - HOÀN CHỈNH với Quản lý Nhân viên + Backup
import { useState, useEffect } from 'react';
import { productsApi, usersApi } from '../utils/api';
import { Save, Plus, Users, Package, Download, Upload, Database, X, Edit2, Key, Trash2 } from 'lucide-react';

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

  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', display_name: '', role: 'staff' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // Products functions
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

  // Permissions functions
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

  // User management functions
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', password: '', display_name: '', role: 'staff' });
    setShowUserModal(true);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ 
      username: user.username, 
      password: '', 
      display_name: user.display_name, 
      role: user.role 
    });
    setShowUserModal(true);
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        await usersApi.update(editingUser.id, {
          display_name: userForm.display_name,
          role: userForm.role
        });
        setMessage('Đã cập nhật nhân viên!');
      } else {
        // Create new user
        if (!userForm.username || !userForm.password) {
          setMessage('Lỗi: Vui lòng nhập đầy đủ thông tin');
          setSaving(false);
          return;
        }
        await usersApi.create(userForm);
        setMessage('Đã thêm nhân viên mới!');
      }
      setShowUserModal(false);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { 
      setMessage('Lỗi: ' + err.message); 
    }
    finally { setSaving(false); }
  };

  const toggleUserActive = async (user) => {
    try {
      await usersApi.update(user.id, { is_active: !user.is_active });
      setMessage(user.is_active ? 'Đã vô hiệu hóa nhân viên' : 'Đã kích hoạt nhân viên');
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
  };

  const openResetPassword = (user) => {
    setEditingUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage('Lỗi: Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Lỗi: Mật khẩu xác nhận không khớp');
      return;
    }
    setSaving(true);
    try {
      await usersApi.resetPassword(editingUser.id, newPassword);
      setMessage('Đã đặt lại mật khẩu!');
      setShowPasswordModal(false);
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

        <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
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
            /* TAB GIÁ BÁN */
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
            /* TAB NHÂN VIÊN */
            <>
              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>Quản lý nhân viên</div>
                <button className="btn btn-primary" onClick={openAddUser}>
                  <Plus size={16} /> Thêm nhân viên
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Tên hiển thị</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Đăng nhập cuối</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.display_name}</td>
                      <td>
                        <span className={`badge ${u.role === 'owner' ? 'badge-warning' : u.role === 'manager' ? 'badge-info' : 'badge-info'}`}>
                          {u.role === 'owner' ? '👑 Owner' : u.role === 'manager' ? '📋 Manager' : '👤 Staff'}
                        </span>
                      </td>
                      <td>
                        {u.is_active ? 
                          <span className="badge badge-success">Hoạt động</span> : 
                          <span className="badge badge-danger">Vô hiệu</span>
                        }
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#666' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                      </td>
                      <td>
                        <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                          <button 
                            className="btn btn-sm btn-outline" 
                            title="Sửa"
                            onClick={() => openEditUser(u)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline" 
                            title="Đổi mật khẩu"
                            onClick={() => openResetPassword(u)}
                          >
                            <Key size={14} />
                          </button>
                          <button 
                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            title={u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            onClick={() => toggleUserActive(u)}
                            disabled={u.role === 'owner' && users.filter(x => x.role === 'owner' && x.is_active).length <= 1}
                          >
                            {u.is_active ? '🚫' : '✅'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : tab === 'permissions' ? (
            /* TAB PHÂN QUYỀN */
            <>
              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>Phân quyền cho Staff</div>
                <button className="btn btn-primary" onClick={savePermissions} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Admin luôn có tất cả quyền. Chỉ cần cấu hình quyền cho Staff.
              </p>
              <div className="grid grid-2 gap-1">
                {allPerms.map(p => (
                  <label key={p.key} className="flex flex-center gap-1" style={{ 
                    padding: '0.75rem', 
                    cursor: 'pointer',
                    background: permissions.staff?.[p.key] ? '#f0fdf4' : '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={permissions.staff?.[p.key] || false} 
                      onChange={() => togglePermission('staff', p.key)} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ flex: 1 }}>{p.label}</span>
                  </label>
                ))}
              </div>
            </>
          ) : tab === 'backup' ? (
            /* TAB SAO LƯU */
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

      {/* Modal Thêm/Sửa Nhân viên */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
              <button className="btn-close" onClick={() => setShowUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên đăng nhập *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="vd: staff01"
                />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Tên hiển thị</label>
                <input 
                  type="text" 
                  className="input" 
                  value={userForm.display_name}
                  onChange={e => setUserForm({ ...userForm, display_name: e.target.value })}
                  placeholder="vd: Nguyễn Văn A"
                />
              </div>
              <div className="form-group">
                <label>Vai trò</label>
                <select 
                  className="input" 
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="staff">👤 Staff</option>
                  <option value="manager">📋 Manager</option>
                  <option value="owner">👑 Owner</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUserModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveUser} disabled={saving}>
                {saving ? 'Đang lưu...' : (editingUser ? 'Cập nhật' : 'Thêm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đổi mật khẩu */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Đặt lại mật khẩu</h3>
              <button className="btn-close" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Đặt lại mật khẩu cho: <strong>{editingUser?.display_name || editingUser?.username}</strong>
              </p>
              <div className="form-group">
                <label>Mật khẩu mới *</label>
                <input 
                  type="password" 
                  className="input" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu *</label>
                <input 
                  type="password" 
                  className="input" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Mật khẩu không khớp
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={resetPassword} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Đặt lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS cho Modal */}
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h3 {
          margin: 0;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: #64748b;
        }
        .btn-close:hover {
          color: #1e293b;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.85rem;
        }
        .badge-warning {
          background: #fef3c7;
          color: #b45309;
        }
        .badge-info {
          background: #dbeafe;
          color: #1d4ed8;
        }
      `}</style>
    </>
  );
}
