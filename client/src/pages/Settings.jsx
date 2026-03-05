// Settings.jsx - HOÀN CHỈNH với Quản lý Nhân viên + Backup + HÓA ĐƠN (Phase A)
import { useState, useEffect } from 'react';
import { productsApi, usersApi } from '../utils/api';
import { Save, Plus, Users, Package, Download, Upload, Database, X, Edit2, Key, Trash2, FileText, Image } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS API (mới cho Phase A)
// ═══════════════════════════════════════════════════════════════════════════
const settingsApi = {
  getAll: async () => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  update: async (settings) => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings', {
      method: 'PUT',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ settings })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  uploadLogo: async (file) => {
    const token = localStorage.getItem('pos_token');
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch('/api/pos/settings/logo', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  deleteLogo: async () => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings/logo', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
};

export default function Settings() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Packages state
  const [packages, setPackages] = useState([]);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({ code: '', name: '', description: '', price: '', unit: 'túi', total_qty: '', package_items: [], is_active: true });
  const [allProducts, setAllProducts] = useState([]); // For package items checklist

  // Backup state
  const [backupInfo, setBackupInfo] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', display_name: '', role: 'staff' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE SETTINGS STATE (mới cho Phase A)
  // ═══════════════════════════════════════════════════════════════════════════
  const [invoiceSettings, setInvoiceSettings] = useState({
    // Thông tin cửa hàng
    store_name: '',
    store_address: '',
    store_phone: '',
    store_slogan: '',
    store_tax_id: '',
    store_logo: '',
    // Cài đặt in
    invoice_default_size: 'a5',
    invoice_quick_size: '80mm',
    invoice_copies: '1',
    invoice_auto_print: 'false',
    // Nội dung hiển thị
    invoice_show_logo: 'true',
    invoice_show_store_name: 'true',
    invoice_show_address: 'true',
    invoice_show_phone: 'true',
    invoice_show_slogan: 'false',
    invoice_show_invoice_number: 'true',
    invoice_show_order_code: 'true',
    invoice_show_datetime: 'true',
    invoice_show_staff: 'true',
    invoice_show_customer_name: 'true',
    invoice_show_customer_phone: 'false',
    invoice_show_products: 'true',
    invoice_show_subtotal: 'true',
    invoice_show_discount: 'true',
    invoice_show_total: 'true',
    invoice_show_cash_received: 'true',
    invoice_show_change: 'true',
    invoice_show_payment_method: 'true',
    invoice_show_qr_lookup: 'true',
    invoice_show_qr_zalo: 'false',
    invoice_show_vat: 'false',
    // Lời nhắn
    invoice_thank_you: '',
    invoice_policy: '',
    invoice_note: ''
  });

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'products') {
        const data = await productsApi.list({ active: '' });
        setProducts(data);
      } else if (tab === 'packages') {
        await loadPackages();
      } else if (tab === 'users') {
        const data = await usersApi.list();
        setUsers(data);
      } else if (tab === 'permissions') {
        const data = await usersApi.permissions();
        setPermissions(data.permissions);
        setAllPerms(data.all_permissions);
      } else if (tab === 'backup') {
        await loadBackupInfo();
      } else if (tab === 'invoice') {
        await loadInvoiceSettings();
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PACKAGES FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const pkgApi = (method, url, body) => {
    const token = localStorage.getItem('pos_token');
    const opts = { method, headers: { 'Authorization': 'Bearer ' + token } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(url, opts).then(r => r.json());
  };
  const loadPackages = async () => {
    const data = await pkgApi('GET', '/api/pos/packages?active=');
    if (data.success) setPackages(data.data);
  };
  const openPkgModal = (pkg = null) => {
    setEditingPkg(pkg);
    const existingItems = pkg?.package_items ? (typeof pkg.package_items === 'string' ? JSON.parse(pkg.package_items) : pkg.package_items) : [];
    setPkgForm(pkg ? {
      code: pkg.code, name: pkg.name, description: pkg.description || '', price: pkg.price || '',
      unit: pkg.unit || 'túi', total_qty: pkg.total_qty || '', package_items: existingItems, is_active: !!pkg.is_active
    } : { code: '', name: '', description: '', price: '', unit: 'túi', total_qty: '', package_items: [], is_active: true });
    setShowPkgModal(true);
    // Load products for checklist
    if (allProducts.length === 0) {
      pkgApi('GET', '/api/pos/products?with_stock=true').then(data => {
        if (Array.isArray(data)) setAllProducts(data);
      }).catch(() => {});
    }
  };
  const savePkg = async () => {
    if (!pkgForm.code || !pkgForm.name) { setMessage('Lỗi: Mã và tên bắt buộc'); return; }
    setSaving(true);
    try {
      const url = editingPkg ? `/api/pos/packages/${editingPkg.id}` : '/api/pos/packages';
      const body = {
        ...pkgForm,
        price: parseFloat(pkgForm.price) || 0,
        total_qty: parseInt(pkgForm.total_qty) || 0,
        package_items: pkgForm.package_items.filter(i => i.qty > 0),
      };
      const data = await pkgApi(editingPkg ? 'PUT' : 'POST', url, body);
      if (!data.success) throw new Error(data.error);
      setMessage(data.message); setShowPkgModal(false); await loadPackages();
    } catch (err) { setMessage('Lỗi: ' + err.message); } finally { setSaving(false); }
  };
  const deletePkg = async (pkg) => {
    if (!confirm(`Xóa gói "${pkg.name}"?`)) return;
    const data = await pkgApi('DELETE', `/api/pos/packages/${pkg.id}`);
    setMessage(data.success ? data.message : 'Lỗi: ' + data.error); if (data.success) await loadPackages();
  };
  const togglePkg = async (pkg) => {
    await pkgApi('PUT', `/api/pos/packages/${pkg.id}`, { is_active: !pkg.is_active });
    await loadPackages();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE FUNCTIONS (mới cho Phase A)
  // ═══════════════════════════════════════════════════════════════════════════
  const loadInvoiceSettings = async () => {
    try {
      const result = await settingsApi.getAll();
      if (result.success && result.data) {
        setInvoiceSettings(prev => ({ ...prev, ...result.data }));
      }
    } catch (err) { 
      console.error('Load invoice settings error:', err); 
      setMessage('Lỗi: ' + err.message);
    }
  };

  const saveInvoiceSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.update(invoiceSettings);
      setMessage('Đã lưu cài đặt hóa đơn!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { 
      setMessage('Lỗi: ' + err.message); 
    }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setMessage('Lỗi: Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)');
      return;
    }
    if (file.size > 500 * 1024) {
      setMessage('Lỗi: File quá lớn (tối đa 500KB)');
      return;
    }

    setSaving(true);
    try {
      await settingsApi.uploadLogo(file);
      await loadInvoiceSettings(); // Reload to get new logo
      setMessage('Đã upload logo thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Bạn có chắc muốn xóa logo?')) return;

    setSaving(true);
    try {
      await settingsApi.deleteLogo();
      setInvoiceSettings(prev => ({ ...prev, store_logo: '' }));
      setMessage('Đã xóa logo!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateInvoiceSetting = (key, value) => {
    setInvoiceSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleInvoiceShow = (key) => {
    setInvoiceSettings(prev => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }));
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
      await usersApi.updatePermissions('manager', permissions.manager);
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
  const downloadBackupAll = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/backup/export-all', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `POS-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('✅ Đã tải file backup');
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadBackupTable = async (tableName) => {
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch(`/api/pos/backup/export/${tableName}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `POS-${tableName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    }
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      setMessage('Lỗi: Vui lòng chọn file .xlsx');
      e.target.value = '';
      return;
    }

    // Preview trước
    try {
      const token = localStorage.getItem('pos_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pos/backup/preview-restore', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setRestorePreview(data.preview);
        setRestoreFile(file);
        setShowRestoreConfirm(true);
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    }
    e.target.value = '';
  };

  const confirmRestore = async () => {
    if (!restoreFile) return;
    
    setRestoring(true);
    try {
      const token = localStorage.getItem('pos_token');
      const formData = new FormData();
      formData.append('file', restoreFile);

      const res = await fetch('/api/pos/backup/restore', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        const summary = data.results
          .filter(r => r.status === 'restored')
          .map(r => `${r.sheet}: ${r.rows}/${r.total}`)
          .join(', ');
        setMessage(`✅ Khôi phục thành công! ${summary}. Trang sẽ tải lại...`);
        setShowRestoreConfirm(false);
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE DISPLAY FIELDS CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  const invoiceDisplayFields = [
    { key: 'invoice_show_logo', label: 'Logo cửa hàng' },
    { key: 'invoice_show_store_name', label: 'Tên cửa hàng' },
    { key: 'invoice_show_address', label: 'Địa chỉ' },
    { key: 'invoice_show_phone', label: 'Số điện thoại' },
    { key: 'invoice_show_slogan', label: 'Slogan' },
    { key: 'invoice_show_invoice_number', label: 'Số hóa đơn' },
    { key: 'invoice_show_order_code', label: 'Mã đơn hàng' },
    { key: 'invoice_show_datetime', label: 'Ngày giờ' },
    { key: 'invoice_show_staff', label: 'Nhân viên bán' },
    { key: 'invoice_show_customer_name', label: 'Tên khách hàng' },
    { key: 'invoice_show_customer_phone', label: 'SĐT khách hàng' },
    { key: 'invoice_show_products', label: 'Danh sách SP' },
    { key: 'invoice_show_subtotal', label: 'Tạm tính' },
    { key: 'invoice_show_discount', label: 'Giảm giá' },
    { key: 'invoice_show_total', label: 'Tổng tiền' },
    { key: 'invoice_show_cash_received', label: 'Tiền khách đưa' },
    { key: 'invoice_show_change', label: 'Tiền thừa' },
    { key: 'invoice_show_payment_method', label: 'Phương thức TT' },
    { key: 'invoice_show_qr_lookup', label: 'QR tra cứu' },
    { key: 'invoice_show_vat', label: 'Thông tin VAT' }
  ];

  return (
    <>
      <header className="page-header"><h1 className="page-title">⚙️ Cài đặt</h1></header>
      <div className="page-content">
        {message && <div className={`alert ${message.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

        <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
          <button className={`btn ${tab === 'products' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('products')}>
            <Package size={16} /> Giá bán
          </button>
          <button className={`btn ${tab === 'packages' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('packages')}
            style={{ background: tab === 'packages' ? '#7c3aed' : undefined, borderColor: tab === 'packages' ? '#7c3aed' : undefined }}>
            📦 Gói SP
          </button>
          <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('users')}>
            <Users size={16} /> Nhân viên
          </button>
          <button className={`btn ${tab === 'permissions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('permissions')}>
            🔐 Phân quyền
          </button>
          <button className={`btn ${tab === 'invoice' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('invoice')}>
            <FileText size={16} /> Hóa đơn
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
          ) : tab === 'packages' ? (
            /* TAB GÓI SẢN PHẨM */
            <>
              <div className="flex flex-between mb-2">
                <div>
                  <div className="card-title" style={{ margin: 0, color: '#7c3aed' }}>📦 Template gói sản phẩm</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>Chỉ cần tên + giá. Số lượng SP đặt linh hoạt khi bán.</div>
                </div>
                <button className="btn btn-primary" onClick={() => openPkgModal()} style={{ background: '#7c3aed' }}>
                  <Plus size={16} /> Thêm gói
                </button>
              </div>
              {packages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Chưa có gói nào.</div>
              ) : (
                <table className="table">
                  <thead><tr><th>Mã</th><th>Tên gói</th><th>SL SP</th><th>Giá bán</th><th>TT</th><th></th></tr></thead>
                  <tbody>
                    {packages.map(pkg => {
                      const locked = pkg.active_users > 0;
                      return (
                      <tr key={pkg.id} style={{ opacity: pkg.is_active ? 1 : 0.5 }}>
                        <td><strong style={{ color: '#7c3aed' }}>📦 {pkg.code}</strong></td>
                        <td>
                          {pkg.name}
                          {locked && <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem', color: '#f59e0b' }}>🔒 {pkg.active_users} KH</span>}
                        </td>
                        <td><span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>{pkg.total_qty || '-'}</span></td>
                        <td><strong style={{ color: '#2563eb' }}>{(pkg.price || 0).toLocaleString()}đ</strong></td>
                        <td>
                          <span onClick={() => togglePkg(pkg)} style={{ cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px', background: pkg.is_active ? '#dcfce7' : '#f3f4f6', color: pkg.is_active ? '#166534' : '#9ca3af', fontSize: '0.85rem' }}>
                            {pkg.is_active ? 'Đang bán' : 'Ngừng bán'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.25rem' }}
                            onClick={() => { if (locked) { setMessage(`Lỗi: ${pkg.active_users} KH đang dùng gói — không sửa được. Tạo gói mới!`); return; } openPkgModal(pkg); }}>
                            {locked ? '🔒' : <Edit2 size={14} />}
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#ef4444' }} onClick={() => deletePkg(pkg)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {showPkgModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                  <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', background: '#7c3aed', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>📦 {editingPkg ? 'Sửa gói' : 'Thêm gói mới'}</h3>
                      <button onClick={() => setShowPkgModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div><label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Mã gói *</label>
                        <input className="input" placeholder="VD: PKG-DETOX30" value={pkgForm.code} onChange={e => setPkgForm({ ...pkgForm, code: e.target.value.toUpperCase() })} disabled={!!editingPkg} /></div>
                      <div><label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Tên gói *</label>
                        <input className="input" placeholder="VD: Gói Detox 30 ngày" value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} /></div>
                      <div><label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Mô tả</label>
                        <input className="input" placeholder="Mô tả ngắn" value={pkgForm.description} onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })} /></div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 2 }}><label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Giá bán (VND)</label>
                          <input className="input" type="number" min="0" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} /></div>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Tổng SL SP</label>
                          <input className="input" type="number" min="0" value={pkgForm.total_qty} onChange={e => setPkgForm({ ...pkgForm, total_qty: e.target.value })} /></div>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>ĐVT</label>
                          <input className="input" value={pkgForm.unit} onChange={e => setPkgForm({ ...pkgForm, unit: e.target.value })} /></div>
                      </div>
                      {/* SP trong gói */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>📋 SP trong gói (chọn + nhập SL)</label>
                        <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
                          {allProducts.filter(p => p.price > 0).map(p => {
                            const key = `${p.sx_product_type}_${p.sx_product_id}`;
                            const existing = pkgForm.package_items.find(i => `${i.sx_product_type}_${i.sx_product_id}` === key);
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', borderBottom: '1px solid #f3f4f6' }}>
                                <input type="checkbox" checked={!!existing}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setPkgForm({ ...pkgForm, package_items: [...pkgForm.package_items, { sx_product_type: p.sx_product_type, sx_product_id: p.sx_product_id, code: p.code, name: p.name, qty: 0 }] });
                                    } else {
                                      setPkgForm({ ...pkgForm, package_items: pkgForm.package_items.filter(i => `${i.sx_product_type}_${i.sx_product_id}` !== key) });
                                    }
                                  }} />
                                <span style={{ flex: 1, fontSize: '0.8rem' }}>{p.icon || '📦'} {p.code} — {p.name}</span>
                                {existing && (
                                  <input type="number" min="0" value={existing.qty || ''} placeholder="SL"
                                    onChange={e => setPkgForm({ ...pkgForm, package_items: pkgForm.package_items.map(i => `${i.sx_product_type}_${i.sx_product_id}` === key ? { ...i, qty: parseInt(e.target.value) || 0 } : i) })}
                                    style={{ width: '55px', padding: '2px 4px', borderRadius: 4, border: '1px solid #c4b5fd', fontSize: '0.8rem', textAlign: 'center' }} />
                                )}
                              </div>
                            );
                          })}
                          {allProducts.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '0.5rem', fontSize: '0.8rem' }}>Đang tải SP...</div>}
                        </div>
                        {pkgForm.package_items.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '0.25rem' }}>
                            {pkgForm.package_items.filter(i => i.qty > 0).length} SP · Tổng từ items: {pkgForm.package_items.reduce((s, i) => s + (i.qty || 0), 0)}
                          </div>
                        )}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={pkgForm.is_active} onChange={e => setPkgForm({ ...pkgForm, is_active: e.target.checked })} /> Đang bán
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPkgModal(false)}>Hủy</button>
                      <button className="btn btn-primary" style={{ flex: 2, background: '#7c3aed' }} onClick={savePkg} disabled={saving}>
                        <Save size={16} /> {saving ? 'Đang lưu...' : (editingPkg ? 'Cập nhật' : 'Thêm gói')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                <div className="card-title" style={{ margin: 0 }}>Phân quyền theo vai trò</div>
                <button className="btn btn-primary" onClick={savePermissions} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Owner luôn có tất cả quyền. Cấu hình quyền cho Manager và Staff.
              </p>

              {/* PHÂN QUYỀN CHO MANAGER */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: '#fef3c7', 
                borderRadius: '12px',
                border: '2px solid #fbbf24'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#92400e'
                }}>
                  📋 Phân quyền cho Manager
                </div>
                <div className="grid grid-2 gap-1">
                  {allPerms.map(p => (
                    <label key={`manager-${p.key}`} className="flex flex-center gap-1" style={{ 
                      padding: '0.5rem 0.75rem', 
                      cursor: 'pointer',
                      background: permissions.manager?.[p.key] ? '#fef9c3' : '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={permissions.manager?.[p.key] || false} 
                        onChange={() => togglePermission('manager', p.key)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ flex: 1 }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PHÂN QUYỀN CHO STAFF */}
              <div style={{ 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '12px',
                border: '2px solid #86efac'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#166534'
                }}>
                  👤 Phân quyền cho Staff
                </div>
                <div className="grid grid-2 gap-1">
                  {allPerms.map(p => (
                    <label key={`staff-${p.key}`} className="flex flex-center gap-1" style={{ 
                      padding: '0.5rem 0.75rem', 
                      cursor: 'pointer',
                      background: permissions.staff?.[p.key] ? '#dcfce7' : '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={permissions.staff?.[p.key] || false} 
                        onChange={() => togglePermission('staff', p.key)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ flex: 1 }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : tab === 'invoice' ? (
            /* ═══════════════════════════════════════════════════════════════════════════
               TAB HÓA ĐƠN (MỚI - Phase A)
               ═══════════════════════════════════════════════════════════════════════════ */
            <>
              <div className="flex flex-between mb-2">
                <div className="card-title" style={{ margin: 0 }}>🧾 Cài đặt Hóa đơn</div>
                <button className="btn btn-primary" onClick={saveInvoiceSettings} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </div>

              {/* SECTION 1: THÔNG TIN CỬA HÀNG */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: '#fef3c7', 
                borderRadius: '12px',
                border: '2px solid #fbbf24'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#92400e'
                }}>
                  🏪 Thông tin cửa hàng
                </div>

                {/* Logo */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Logo cửa hàng</label>
                  <div className="flex gap-1" style={{ alignItems: 'center' }}>
                    {invoiceSettings.store_logo ? (
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff'
                      }}>
                        <img 
                          src={invoiceSettings.store_logo} 
                          alt="Logo" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        border: '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        color: '#94a3b8'
                      }}>
                        <Image size={24} />
                      </div>
                    )}
                    <div>
                      <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', marginRight: '0.5rem' }}>
                        <Upload size={14} /> Tải lên
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/gif"
                          style={{ display: 'none' }}
                          onChange={handleLogoUpload}
                        />
                      </label>
                      {invoiceSettings.store_logo && (
                        <button className="btn btn-danger btn-sm" onClick={handleDeleteLogo}>
                          <Trash2 size={14} /> Xóa
                        </button>
                      )}
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                        PNG/JPG, tối đa 500KB, nên vuông 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-2 gap-1">
                  <div className="form-group">
                    <label>Tên cửa hàng *</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={invoiceSettings.store_name}
                      onChange={e => updateInvoiceSetting('store_name', e.target.value)}
                      placeholder="VD: TÚ QUÝ ĐƯỜNG"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hotline</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={invoiceSettings.store_phone}
                      onChange={e => updateInvoiceSetting('store_phone', e.target.value)}
                      placeholder="VD: 024 2245 5565"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={invoiceSettings.store_address}
                    onChange={e => updateInvoiceSetting('store_address', e.target.value)}
                    placeholder="VD: LK4 - 129 Trương Định, Tương Mai, Hà Nội"
                  />
                </div>

                <div className="grid grid-2 gap-1">
                  <div className="form-group">
                    <label>Slogan</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={invoiceSettings.store_slogan}
                      onChange={e => updateInvoiceSetting('store_slogan', e.target.value)}
                      placeholder="VD: Sức khỏe từ thiên nhiên"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mã số thuế</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={invoiceSettings.store_tax_id}
                      onChange={e => updateInvoiceSetting('store_tax_id', e.target.value)}
                      placeholder="VD: 0123456789"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CÀI ĐẶT IN */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: '#dbeafe', 
                borderRadius: '12px',
                border: '2px solid #60a5fa'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#1e40af'
                }}>
                  🖨️ Cài đặt in
                </div>

                <div className="grid grid-2 gap-1">
                  <div className="form-group">
                    <label>Khổ giấy mặc định</label>
                    <select 
                      className="input"
                      value={invoiceSettings.invoice_default_size}
                      onChange={e => updateInvoiceSetting('invoice_default_size', e.target.value)}
                    >
                      <option value="58mm">58mm (Máy in nhiệt nhỏ)</option>
                      <option value="80mm">80mm (Máy in nhiệt)</option>
                      <option value="a5">A5 (148 x 210 mm)</option>
                      <option value="a4">A4 (210 x 297 mm)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Khổ in nhanh</label>
                    <select 
                      className="input"
                      value={invoiceSettings.invoice_quick_size}
                      onChange={e => updateInvoiceSetting('invoice_quick_size', e.target.value)}
                    >
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                      <option value="a5">A5</option>
                      <option value="a4">A4</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2 gap-1">
                  <div className="form-group">
                    <label>Số bản in mặc định</label>
                    <select 
                      className="input"
                      value={invoiceSettings.invoice_copies}
                      onChange={e => updateInvoiceSetting('invoice_copies', e.target.value)}
                    >
                      <option value="1">1 bản</option>
                      <option value="2">2 bản</option>
                      <option value="3">3 bản</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tự động in</label>
                    <select 
                      className="input"
                      value={invoiceSettings.invoice_auto_print}
                      onChange={e => updateInvoiceSetting('invoice_auto_print', e.target.value)}
                    >
                      <option value="false">Không (hỏi trước khi in)</option>
                      <option value="true">Có (in ngay sau thanh toán)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: NỘI DUNG HIỂN THỊ */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '12px',
                border: '2px solid #86efac'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#166534'
                }}>
                  📝 Nội dung hiển thị trên hóa đơn
                </div>

                <div className="grid grid-3 gap-1">
                  {invoiceDisplayFields.map(field => (
                    <label key={field.key} className="flex flex-center gap-1" style={{ 
                      padding: '0.5rem 0.75rem', 
                      cursor: 'pointer',
                      background: invoiceSettings[field.key] === 'true' ? '#dcfce7' : '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={invoiceSettings[field.key] === 'true'} 
                        onChange={() => toggleInvoiceShow(field.key)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ flex: 1 }}>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SECTION 4: LỜI NHẮN */}
              <div style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: '#fdf4ff', 
                borderRadius: '12px',
                border: '2px solid #e879f9'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#86198f'
                }}>
                  💬 Lời nhắn trên hóa đơn
                </div>

                <div className="form-group">
                  <label>Lời cảm ơn</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={invoiceSettings.invoice_thank_you}
                    onChange={e => updateInvoiceSetting('invoice_thank_you', e.target.value)}
                    placeholder="VD: Cảm ơn quý khách đã mua hàng!"
                  />
                </div>

                <div className="form-group">
                  <label>Chính sách đổi trả</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={invoiceSettings.invoice_policy}
                    onChange={e => updateInvoiceSetting('invoice_policy', e.target.value)}
                    placeholder="VD: Đổi trả trong 24h với hóa đơn"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Ghi chú thêm</label>
                  <textarea 
                    className="input" 
                    rows="2"
                    value={invoiceSettings.invoice_note}
                    onChange={e => updateInvoiceSetting('invoice_note', e.target.value)}
                    placeholder="Ghi chú bổ sung (nếu có)"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* SECTION 5: THÔNG BÁO TỰ ĐỘNG (disabled, chuẩn bị sẵn) */}
              <div style={{ 
                padding: '1rem', 
                background: '#f1f5f9', 
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                opacity: 0.7
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#64748b'
                }}>
                  🔔 Thông báo tự động (Sắp ra mắt)
                </div>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  Gửi hóa đơn qua Zalo ZNS hoặc Email - Tính năng đang phát triển (Phase C)
                </p>
              </div>
            </>
          ) : tab === 'backup' ? (
            /* TAB SAO LƯU */
            <>
              <div className="card-title">📦 Sao lưu & Khôi phục (Excel)</div>

              {/* Thống kê bảng */}
              {backupInfo && backupInfo.tables && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ 
                    background: '#f0fdf4', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span>🗄️ Turso Cloud • <strong>{backupInfo.totalRows}</strong> dòng dữ liệu</span>
                    <button 
                      className="btn btn-primary"
                      onClick={downloadBackupAll}
                      disabled={exporting}
                      style={{ fontSize: '0.85rem' }}
                    >
                      {exporting ? '⏳ Đang xuất...' : '📥 Tải tất cả (.xlsx)'}
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>Bảng</th>
                          <th style={{ textAlign: 'right' }}>Số dòng</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Tải về</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupInfo.tables.map(t => (
                          <tr key={t.name}>
                            <td>
                              <div style={{ fontWeight: '500' }}>{t.label}</div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>{t.name}</div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{t.count}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => downloadBackupTable(t.name)}
                                style={{
                                  background: 'none',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                📥 xlsx
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Khôi phục */}
              <div style={{ 
                background: '#fef3c7', 
                padding: '1rem', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <strong>⚠️ Khôi phục từ file Excel</strong>
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                  Upload file .xlsx đã backup trước đó. Dữ liệu hiện tại sẽ bị ghi đè.
                </p>
                <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={16} /> Chọn file .xlsx để khôi phục
                  <input 
                    type="file" 
                    accept=".xlsx" 
                    style={{ display: 'none' }} 
                    onChange={handleRestoreFile}
                    disabled={restoring}
                  />
                </label>
              </div>

              {/* Hướng dẫn */}
              <div style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <strong>💡 Hướng dẫn:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                  <li>Nên backup định kỳ mỗi ngày</li>
                  <li>"Tải tất cả" → 1 file Excel chứa toàn bộ data</li>
                  <li>Tải từng bảng để kiểm tra hoặc chỉnh sửa riêng</li>
                  <li>Khôi phục: upload file đã tải → xem preview → xác nhận</li>
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

      {/* CSS cho Modal + Invoice */}
      {/* Modal xác nhận restore */}
      {showRestoreConfirm && restorePreview && (
        <div className="modal-overlay" onClick={() => setShowRestoreConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>⚠️ Xác nhận khôi phục</h3>
              <button className="btn-close" onClick={() => setShowRestoreConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#dc2626', fontWeight: '500', marginTop: 0 }}>
                Dữ liệu hiện tại sẽ bị ghi đè bởi file backup!
              </p>
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Bảng</th>
                    <th style={{ textAlign: 'right' }}>Hiện tại</th>
                    <th style={{ textAlign: 'center' }}>→</th>
                    <th style={{ textAlign: 'right' }}>Từ file</th>
                  </tr>
                </thead>
                <tbody>
                  {restorePreview.map(p => (
                    <tr key={p.sheet} style={{ opacity: p.recognized ? 1 : 0.5 }}>
                      <td>
                        {p.label}
                        {!p.recognized && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}> (bỏ qua)</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.currentRows}</td>
                      <td style={{ textAlign: 'center' }}>→</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: p.fileRows > 0 ? '#2563eb' : '#999' }}>
                        {p.fileRows}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowRestoreConfirm(false)} disabled={restoring}>
                Hủy
              </button>
              <button 
                className="btn" 
                style={{ background: '#dc2626', color: 'white' }}
                onClick={confirmRestore}
                disabled={restoring}
              >
                {restoring ? '⏳ Đang khôi phục...' : '⚠️ Xác nhận ghi đè'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 768px) {
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .grid-3 {
            grid-template-columns: 1fr;
          }
        }
        textarea.input {
          font-family: inherit;
          min-height: 60px;
        }
      `}</style>
    </>
  );
}
