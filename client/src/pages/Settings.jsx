// Settings.jsx - HOÀN CHỈNH với Quản lý Nhân viên + Backup + HÓA ĐƠN (Phase A)
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

  // Loyalty settings (LOY-1)
  const [loyalty, setLoyalty] = useState({
    loyalty_enabled: 'true',
    loyalty_earn_per_amount: '10000',
    loyalty_expiry_mode: 'none',
  });

  // Bước 4 — Cấu hình "Ưu đãi khách mới" (dùng chung cơ chế /api/pos/settings key-value)
  const [signupCfg, setSignupCfg] = useState({
    signup_enabled: 'false',
    signup_scope: 'order',      // 'order' | 'item'
    signup_discount_type: 'fixed',
    signup_discount_value: '20000',
    signup_min_order: '50000',  // chỉ có ý nghĩa khi scope='order'
    signup_voucher_valid_days: '30',
  });

  // Reward catalog (LOY-2a)
  const [rewards, setRewards] = useState([]);
  const [rewardForm, setRewardForm] = useState({
    name: '', points_cost: '', discount_type: 'fixed', discount_value: '', valid_days: '30',
  });

  // Packages state
  const [packages, setPackages] = useState([]);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({ code: '', name: '', description: '', price: '', unit: 'túi', total_qty: '', package_items: [], is_active: true });
  const [allProducts, setAllProducts] = useState([]); // For package items checklist

  // Flash sale state (F1)
  const [flash, setFlash] = useState({
    enabled: false, start: '19:00', end: '20:00', percent: '50',
    product_keys: [], is_flash_now: false, server_time_vn: '',
  });

  // Membership tiers state (TIER-1a-v2)
  const [tiers, setTiers] = useState([]);
  const [tierRound, setTierRound] = useState({ round_to: 500, round_mode: 'nearest' });
  const [tierValidMonths, setTierValidMonths] = useState(3);

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

  // Bước 1 — Nhóm sản phẩm "khach_moi" (dùng cho voucher khách-mới sau này).
  // Set các key `${sx_product_type}_${sx_product_id}` đang thuộc nhóm.
  const [signupGroupMembers, setSignupGroupMembers] = useState(new Set());
  const [savingSignupGroup, setSavingSignupGroup] = useState(false);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'products') {
        const data = await productsApi.list({ active: '' });
        setProducts(data);
        await loadSignupGroup();
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
      } else if (tab === 'loyalty') {
        await loadLoyalty();
      } else if (tab === 'signup') {
        const prodData = await productsApi.list({ active: '' });
        setProducts(prodData);
        await loadSignupCfg();
        await loadSignupGroup();
      } else if (tab === 'rewards') {
        await loadRewards();
      } else if (tab === 'flash') {
        await loadFlash();
      } else if (tab === 'tiers') {
        await loadTiers();
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

  // Bước 1 — nhóm sản phẩm "khach_moi": load thành viên hiện có, đổ vào Set để tick sẵn checkbox
  const loadSignupGroup = async () => {
    const data = await pkgApi('GET', '/api/pos/product-groups/khach_moi/members');
    if (data.success) {
      const keys = data.data.members.map(m => `${m.sx_product_type}_${m.sx_product_id}`);
      setSignupGroupMembers(new Set(keys));
    }
  };

  const toggleSignupGroupMember = (uniqueId) => {
    setSignupGroupMembers(prev => {
      const next = new Set(prev);
      if (next.has(uniqueId)) next.delete(uniqueId); else next.add(uniqueId);
      return next;
    });
  };

  const saveSignupGroup = async () => {
    setSavingSignupGroup(true);
    try {
      const members = Array.from(signupGroupMembers).map(key => {
        // key có dạng "${sx_product_type}_${sx_product_id}" — product_type có thể chứa dấu "_",
        // nên tách bằng cách lấy đúng sx_product_id ở cuối (phần số) thay vì split('_') ngây thơ.
        const lastUnderscore = key.lastIndexOf('_');
        return {
          sx_product_type: key.slice(0, lastUnderscore),
          sx_product_id: parseInt(key.slice(lastUnderscore + 1), 10),
        };
      });
      const data = await pkgApi('PUT', '/api/pos/product-groups/khach_moi/members', { members });
      setMessage(data.success ? `Đã lưu nhóm sản phẩm (${data.data.count} món)` : 'Lỗi: ' + data.error);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Lỗi: ' + err.message);
    } finally {
      setSavingSignupGroup(false);
    }
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

  // Products functions
  const getUniqueId = (p) => `${p.sx_product_type}_${p.sx_product_id}`;

  const updatePrice = (uniqueId, price) => {
    setProducts(products.map(p => 
      getUniqueId(p) === uniqueId ? { ...p, price: parseInt(price) || 0 } : p
    ));
  };

  const updateSpecialGroup = (uniqueId, checked) => {
    setProducts(products.map(p =>
      getUniqueId(p) === uniqueId ? { ...p, is_special_group: checked } : p
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
        price: p.price,
        is_special_group: !!p.is_special_group
      })));
      setMessage('Đã lưu giá thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  // Bước 4 — Ưu đãi khách mới: dùng chung endpoint /api/pos/settings, chỉ khác tiền tố key
  const loadSignupCfg = async () => {
    const data = await pkgApi('GET', '/api/pos/settings');
    if (data.success) {
      const s = data.data || {};
      setSignupCfg(prev => ({
        signup_enabled: s.signup_enabled ?? prev.signup_enabled,
        signup_scope: s.signup_scope ?? prev.signup_scope,
        signup_discount_type: s.signup_discount_type ?? prev.signup_discount_type,
        signup_discount_value: s.signup_discount_value ?? prev.signup_discount_value,
        signup_min_order: s.signup_min_order ?? prev.signup_min_order,
        signup_voucher_valid_days: s.signup_voucher_valid_days ?? prev.signup_voucher_valid_days,
      }));
    }
  };
  const saveSignupCfg = async () => {
    setSaving(true);
    try {
      const value = parseFloat(signupCfg.signup_discount_value) || 0;
      if (value <= 0) throw new Error('Giá trị giảm phải > 0');
      if (signupCfg.signup_discount_type === 'percent' && value > 100) throw new Error('% giảm không được vượt quá 100');
      const validDays = parseInt(signupCfg.signup_voucher_valid_days) || 30;
      const minOrder = signupCfg.signup_scope === 'order' ? (parseInt(signupCfg.signup_min_order) || 0) : 0;
      const data = await pkgApi('PUT', '/api/pos/settings', {
        settings: {
          signup_enabled: signupCfg.signup_enabled === 'true' || signupCfg.signup_enabled === true ? 'true' : 'false',
          signup_scope: signupCfg.signup_scope === 'item' ? 'item' : 'order',
          signup_discount_type: signupCfg.signup_discount_type === 'percent' ? 'percent' : 'fixed',
          signup_discount_value: String(value),
          signup_min_order: String(minOrder),
          signup_voucher_valid_days: String(validDays),
        },
      });
      if (!data.success) throw new Error(data.error);
      setMessage('Đã lưu cấu hình ưu đãi khách mới!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  // Loyalty functions (LOY-1) — dùng endpoint /api/pos/settings có sẵn
  const loadLoyalty = async () => {
    const data = await pkgApi('GET', '/api/pos/settings');
    if (data.success) {
      const s = data.data || {};
      setLoyalty(prev => ({
        loyalty_enabled: s.loyalty_enabled ?? prev.loyalty_enabled,
        loyalty_earn_per_amount: s.loyalty_earn_per_amount ?? prev.loyalty_earn_per_amount,
        loyalty_expiry_mode: s.loyalty_expiry_mode ?? prev.loyalty_expiry_mode,
      }));
    }
  };
  const saveLoyalty = async () => {
    setSaving(true);
    try {
      const per = parseInt(loyalty.loyalty_earn_per_amount) || 0;
      if (per < 1000) throw new Error('Mức quy đổi tối thiểu 1.000đ');
      const mode = (loyalty.loyalty_expiry_mode === 'quarter') ? 'quarter' : 'none';
      const enabled = (loyalty.loyalty_enabled === 'true' || loyalty.loyalty_enabled === true) ? 'true' : 'false';
      const data = await pkgApi('PUT', '/api/pos/settings', {
        settings: {
          loyalty_enabled: enabled,
          loyalty_earn_per_amount: String(per),
          loyalty_expiry_mode: mode,
        },
      });
      if (!data.success) throw new Error(data.error);
      setMessage('Đã lưu cài đặt điểm thưởng!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  // Reward catalog functions (LOY-2a)
  const loadRewards = async () => {
    const data = await pkgApi('GET', '/api/pos/rewards');
    if (data.success) setRewards(data.data || []);
  };
  const addReward = async () => {
    setSaving(true);
    try {
      const cost = parseInt(rewardForm.points_cost) || 0;
      const value = parseFloat(rewardForm.discount_value) || 0;
      if (!rewardForm.name.trim()) throw new Error('Nhập tên quà');
      if (cost < 1) throw new Error('Giá điểm phải ≥ 1');
      if (value <= 0) throw new Error('Trị giá giảm phải > 0');
      const data = await pkgApi('POST', '/api/pos/rewards', {
        name: rewardForm.name.trim(),
        points_cost: cost,
        discount_type: rewardForm.discount_type,
        discount_value: value,
        valid_days: parseInt(rewardForm.valid_days) || 30,
      });
      if (!data.success) throw new Error(data.error);
      setRewardForm({ name: '', points_cost: '', discount_type: 'fixed', discount_value: '', valid_days: '30' });
      await loadRewards();
      setMessage('Đã thêm quà!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };
  const toggleReward = async (r) => {
    const data = await pkgApi('PUT', `/api/pos/rewards/${r.id}`, { is_active: r.is_active ? 0 : 1 });
    if (data.success) await loadRewards();
  };
  const deleteReward = async (r) => {
    if (!window.confirm(`Ẩn quà "${r.name}"?`)) return;
    const data = await pkgApi('DELETE', `/api/pos/rewards/${r.id}`);
    if (data.success) await loadRewards();
  };

  // Flash sale functions (F1)
  const loadFlash = async () => {
    const data = await pkgApi('GET', '/api/pos/flash');
    if (data.success && data.data) {
      setFlash({
        enabled: !!data.data.enabled,
        start: data.data.start || '19:00',
        end: data.data.end || '20:00',
        percent: String(data.data.percent || 50),
        product_keys: Array.isArray(data.data.product_keys) ? data.data.product_keys : [],
        is_flash_now: !!data.data.is_flash_now,
        server_time_vn: data.data.server_time_vn || '',
      });
    }
    if (allProducts.length === 0) {
      const prods = await pkgApi('GET', '/api/pos/products?with_stock=true');
      if (Array.isArray(prods)) setAllProducts(prods);
    }
  };
  const toggleFlashProduct = (uid) => {
    setFlash(prev => {
      const has = prev.product_keys.includes(uid);
      return { ...prev, product_keys: has ? prev.product_keys.filter(k => k !== uid) : [...prev.product_keys, uid] };
    });
  };
  const saveFlash = async () => {
    setSaving(true);
    try {
      const pct = parseInt(flash.percent) || 0;
      if (pct < 1 || pct > 90) throw new Error('% giảm phải từ 1 đến 90');
      const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!hhmm.test(flash.start) || !hhmm.test(flash.end)) throw new Error('Giờ không hợp lệ (HH:mm)');
      if (flash.start === flash.end) throw new Error('Giờ bắt đầu và kết thúc không được trùng');
      const data = await pkgApi('PUT', '/api/pos/settings', {
        settings: {
          flash_enabled: flash.enabled ? 'true' : 'false',
          flash_start: flash.start,
          flash_end: flash.end,
          flash_percent: String(pct),
          flash_product_keys: JSON.stringify(flash.product_keys),
        },
      });
      if (!data.success) throw new Error(data.error);
      setMessage('Đã lưu cấu hình flash sale!');
      setTimeout(() => setMessage(''), 3000);
      await loadFlash();
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };

  // Membership tier functions (TIER-1a-v2)
  const loadTiers = async () => {
    const data = await pkgApi('GET', '/api/pos/tiers');
    if (data.success && data.data) {
      setTiers(data.data.tiers || []);
      setTierRound({
        round_to: data.data.round_to ?? 500,
        round_mode: data.data.round_mode || 'nearest',
      });
      setTierValidMonths(data.data.valid_months ?? 3);
    }
  };
  const updateTier = (id, field, value) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const saveTiers = async () => {
    setSaving(true);
    try {
      for (const t of tiers) {
        if (!String(t.name).trim()) throw new Error('Tên hạng không được trống');
        const price = Number(t.card_price), pct = Number(t.discount_percent);
        const specialPct = Number(t.special_discount_percent) || 0;
        if (!Number.isFinite(price) || price < 0) throw new Error('Giá thẻ không hợp lệ');
        if (!Number.isFinite(pct) || pct < 0 || pct > 90) throw new Error('% giảm phải từ 0 đến 90');
        if (specialPct < 0 || specialPct > 90) throw new Error('% giảm SP đặc biệt phải từ 0 đến 90');
      }
      const vm = Number(tierValidMonths);
      if (!Number.isFinite(vm) || vm < 1 || vm > 24) throw new Error('Số tháng hiệu lực phải từ 1 đến 24');
      const data = await pkgApi('PUT', '/api/pos/tiers', {
        tiers: tiers.map(t => ({ id: t.id, name: String(t.name).trim(), card_price: Number(t.card_price), discount_percent: Number(t.discount_percent), special_discount_percent: Number(t.special_discount_percent) || 0 })),
        round_to: tierRound.round_to,
        round_mode: tierRound.round_mode,
        valid_months: vm,
      });
      if (!data.success) throw new Error(data.error);
      setMessage('Đã lưu hạng thành viên!');
      setTimeout(() => setMessage(''), 3000);
      await loadTiers();
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setSaving(false); }
  };
  const deleteTier = async (id, name) => {
    if (!window.confirm(`Xóa hạng "${name}"? (Khách đã mua thẻ hạng này trước đây không bị ảnh hưởng, chỉ ẩn khỏi danh sách bán thẻ.)`)) return;
    setSaving(true);
    try {
      const data = await pkgApi('DELETE', `/api/pos/tiers/${id}`);
      if (!data.success) throw new Error(data.error);
      setMessage('Đã xóa hạng!');
      setTimeout(() => setMessage(''), 3000);
      await loadTiers();
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

  const deleteUser = async (user) => {
    if (!confirm(`Xóa vĩnh viễn nhân viên "${user.display_name || user.username}"?\nHành động này không thể hoàn tác.`)) return;
    try {
      await usersApi.delete(user.id);
      setMessage('Đã xóa nhân viên');
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
          <button className={`btn ${tab === 'backup' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('backup')}>
            <Database size={16} /> Sao lưu
          </button>
          <button className={`btn ${tab === 'loyalty' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('loyalty')}>
            🎁 Điểm thưởng
          </button>
          <button className={`btn ${tab === 'rewards' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('rewards')}>
            🎫 Kho quà
          </button>
          <button className={`btn ${tab === 'signup' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('signup')}>
            🎯 Ưu đãi khách mới
          </button>
          <button className={`btn ${tab === 'flash' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('flash')}>
            ⚡ Flash sale
          </button>
          <button className={`btn ${tab === 'tiers' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('tiers')}>
            🏅 Hạng thành viên
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
              <div className="flex flex-between mb-2">
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                  Cột "Áp voucher khách mới" lưu riêng, không chung nút "Lưu tất cả" ở trên.
                </p>
                <button className="btn btn-secondary" onClick={saveSignupGroup} disabled={savingSignupGroup}>
                  <Save size={16} /> {savingSignupGroup ? 'Đang lưu...' : 'Lưu nhóm voucher khách mới'}
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên SP</th>
                    <th>Loại</th>
                    <th>Giá bán (VND)</th>
                    <th style={{ textAlign: 'center' }}>SP đặc biệt</th>
                    <th style={{ textAlign: 'center' }}>Áp voucher khách mới</th>
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
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!p.is_special_group}
                          onChange={e => updateSpecialGroup(getUniqueId(p), e.target.checked)}
                          title="SP thuộc nhóm đặc biệt (vd cà phê) — nhận % giảm hạng riêng, khác % giảm thường"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={signupGroupMembers.has(getUniqueId(p))}
                          onChange={() => toggleSignupGroupMember(getUniqueId(p))}
                          title="Món này được phép áp voucher khách-mới (giảm 50% 1 món)"
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
                          <button 
                            className="btn btn-sm btn-outline" 
                            title="Xóa vĩnh viễn"
                            style={{ color: '#ef4444' }}
                            onClick={() => deleteUser(u)}
                            disabled={u.role === 'owner' && users.filter(x => x.role === 'owner').length <= 1}
                          >
                            <Trash2 size={14} />
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
          ) : tab === 'loyalty' ? (
            /* TAB ĐIỂM THƯỞNG (LOY-1) */
            <>
              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🎁 Điểm thưởng</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
                Các con số dưới đây lưu trong cài đặt, không nằm trong code. Chỉnh xong bấm Lưu là áp dụng ngay.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Bật tích điểm</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Tắt thì đơn không cộng điểm</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={loyalty.loyalty_enabled === 'true' || loyalty.loyalty_enabled === true}
                    onChange={e => setLoyalty({ ...loyalty, loyalty_enabled: e.target.checked ? 'true' : 'false' })} />
                  <span>{(loyalty.loyalty_enabled === 'true' || loyalty.loyalty_enabled === true) ? 'Đang bật' : 'Đang tắt'}</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Bao nhiêu tiền = 1 điểm</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Mặc định 10.000đ</div>
                </div>
                <input type="number" className="input" style={{ width: 140, textAlign: 'right' }} min="1000" step="1000"
                  value={loyalty.loyalty_earn_per_amount}
                  onChange={e => setLoyalty({ ...loyalty, loyalty_earn_per_amount: e.target.value })} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Hạn điểm</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Cuốn chiếu theo quý: điểm tích quý nào → hết hạn đầu quý đó năm sau</div>
                </div>
                <select className="input" style={{ width: 180 }}
                  value={loyalty.loyalty_expiry_mode}
                  onChange={e => setLoyalty({ ...loyalty, loyalty_expiry_mode: e.target.value })}>
                  <option value="none">Không hết hạn</option>
                  <option value="quarter">Cuốn chiếu theo quý</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee', opacity: 0.55 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Món trị liệu nhân đôi ×2</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Để sau — bật khi có app</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>Chưa bật</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={saveLoyalty} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </>
          ) : tab === 'signup' ? (
            /* TAB ƯU ĐÃI KHÁCH MỚI (Bước 4) */
            <>
              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🎯 Ưu đãi khách mới</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
                In mã trên bill khi bán — khách tạo tài khoản app trong 24h để đổi mã lấy voucher.
                Bỏ qua nếu SĐT đơn đó đã từng đổi ưu đãi này trước đây.
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={signupCfg.signup_enabled === 'true' || signupCfg.signup_enabled === true}
                  onChange={e => setSignupCfg({ ...signupCfg, signup_enabled: e.target.checked ? 'true' : 'false' })}
                />
                Bật chương trình (in mã trên bill)
              </label>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Kiểu khuyến mãi</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${signupCfg.signup_scope === 'order' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSignupCfg({ ...signupCfg, signup_scope: 'order' })}
                  >
                    Giảm cả đơn
                  </button>
                  <button
                    type="button"
                    className={`btn ${signupCfg.signup_scope === 'item' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSignupCfg({ ...signupCfg, signup_scope: 'item' })}
                  >
                    Giảm 1 món
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, maxWidth: 480 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Loại giảm</label>
                  <select
                    className="input"
                    value={signupCfg.signup_discount_type}
                    onChange={e => setSignupCfg({ ...signupCfg, signup_discount_type: e.target.value })}
                  >
                    <option value="fixed">Số tiền cố định</option>
                    <option value="percent">Phần trăm</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>
                    Giá trị giảm {signupCfg.signup_discount_type === 'percent' ? '(%)' : '(đ)'}
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={signupCfg.signup_discount_value}
                    onChange={e => setSignupCfg({ ...signupCfg, signup_discount_value: e.target.value })}
                  />
                </div>
                {signupCfg.signup_scope === 'order' && (
                  <div>
                    <label style={{ fontSize: 12, color: '#6b7280' }}>Đơn tối thiểu (đ)</label>
                    <input
                      className="input"
                      type="number"
                      value={signupCfg.signup_min_order}
                      onChange={e => setSignupCfg({ ...signupCfg, signup_min_order: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Hạn dùng voucher sau khi đổi (ngày)</label>
                  <input
                    className="input"
                    type="number"
                    value={signupCfg.signup_voucher_valid_days}
                    onChange={e => setSignupCfg({ ...signupCfg, signup_voucher_valid_days: e.target.value })}
                  />
                </div>
              </div>

              {signupCfg.signup_scope === 'item' && (
                <div style={{ marginBottom: 16, maxWidth: 480 }}>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>
                    Nhóm sản phẩm được áp ({signupGroupMembers.size} món đã chọn) — tick trong danh sách bên dưới
                  </p>
                  <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                    {products.map(p => {
                      const uid = getUniqueId(p);
                      return (
                        <label key={uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={signupGroupMembers.has(uid)}
                            onChange={() => toggleSignupGroupMember(uid)}
                          />
                          {p.name} <span style={{ color: '#9ca3af' }}>({(p.price || 0).toLocaleString('vi-VN')}đ)</span>
                        </label>
                      );
                    })}
                  </div>
                  <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={saveSignupGroup} disabled={savingSignupGroup}>
                    <Save size={16} /> {savingSignupGroup ? 'Đang lưu...' : 'Lưu nhóm sản phẩm'}
                  </button>
                </div>
              )}

              <button className="btn btn-primary" onClick={saveSignupCfg} disabled={saving}>
                <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </>
          ) : tab === 'rewards' ? (
            /* TAB KHO QUÀ (LOY-2a) */
            <>
              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🎫 Kho quà đổi điểm</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
                Danh sách "bao nhiêu điểm đổi được gì". Khách sẽ đổi trên app; đây là nơi bạn quản.
              </p>

              {/* form thêm quà */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', padding: '0.75rem', background: '#f9fafb', borderRadius: 8, marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Tên quà</div>
                  <input className="input" style={{ width: 170 }} placeholder="Phiếu giảm 20k"
                    value={rewardForm.name} onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Giá (điểm)</div>
                  <input type="number" className="input" style={{ width: 90, textAlign: 'right' }} min="1"
                    value={rewardForm.points_cost} onChange={e => setRewardForm({ ...rewardForm, points_cost: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Loại giảm</div>
                  <select className="input" style={{ width: 120 }}
                    value={rewardForm.discount_type} onChange={e => setRewardForm({ ...rewardForm, discount_type: e.target.value })}>
                    <option value="fixed">Số tiền (đ)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Trị giá</div>
                  <input type="number" className="input" style={{ width: 90, textAlign: 'right' }} min="1"
                    value={rewardForm.discount_value} onChange={e => setRewardForm({ ...rewardForm, discount_value: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Hạn (ngày)</div>
                  <input type="number" className="input" style={{ width: 80, textAlign: 'right' }} min="1"
                    value={rewardForm.valid_days} onChange={e => setRewardForm({ ...rewardForm, valid_days: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={addReward} disabled={saving}>
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {/* danh sách quà */}
              {rewards.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có quà nào. Thêm ở trên.</p>
              ) : (
                <table className="table" style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: '#6b7280', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>Tên quà</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Giá điểm</th>
                      <th style={{ padding: '6px 8px' }}>Ưu đãi</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Hạn</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>Trạng thái</th>
                      <th style={{ padding: '6px 8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map(r => (
                      <tr key={r.id} style={{ borderTop: '1px solid #eee', opacity: r.is_active ? 1 : 0.5 }}>
                        <td style={{ padding: '8px' }}>{r.name}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{r.points_cost} đ</td>
                        <td style={{ padding: '8px' }}>
                          {r.discount_type === 'percent'
                            ? `Giảm ${r.discount_value}%`
                            : `Giảm ${Number(r.discount_value).toLocaleString('vi-VN')}đ`}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{r.valid_days} ngày</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => toggleReward(r)}>
                            {r.is_active ? 'Đang bật' : 'Đã tắt'}
                          </button>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => deleteReward(r)} title="Ẩn quà">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : tab === 'flash' ? (
            /* TAB FLASH SALE (F1) */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 0.25rem' }}>
                <div className="card-title" style={{ margin: 0 }}>⚡ Flash sale</div>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: !flash.enabled ? '#f1f5f9' : flash.is_flash_now ? '#fee2e2' : '#f1f5f9',
                  color: !flash.enabled ? '#64748b' : flash.is_flash_now ? '#b91c1c' : '#475569',
                }}>
                  {!flash.enabled ? 'Đang tắt'
                    : flash.is_flash_now ? `🔴 ĐANG FLASH (VN ${flash.server_time_vn})`
                    : `⚪ Ngoài giờ (VN ${flash.server_time_vn})`}
                </span>
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
                Giảm giá theo khung giờ cho một số món. Trạng thái tính theo giờ Việt Nam ở máy chủ. App KH đọc cấu hình này để hiện đếm ngược.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontWeight: 600 }}>Bật flash sale</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Tắt thì không món nào được giảm</div></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={flash.enabled}
                    onChange={e => setFlash({ ...flash, enabled: e.target.checked })} />
                  <span>{flash.enabled ? 'Đang bật' : 'Đang tắt'}</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontWeight: 600 }}>Khung giờ <span style={{ color: '#7c3aed' }}>(giờ Việt Nam)</span></div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Chỉ giảm trong khoảng này mỗi ngày</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="time" className="input" style={{ width: 110 }} value={flash.start}
                    onChange={e => setFlash({ ...flash, start: e.target.value })} />
                  <span style={{ color: '#9ca3af' }}>→</span>
                  <input type="time" className="input" style={{ width: 110 }} value={flash.end}
                    onChange={e => setFlash({ ...flash, end: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontWeight: 600 }}>% giảm</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Áp cho các món được tích bên dưới</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="number" className="input" style={{ width: 80, textAlign: 'right' }} min="1" max="90"
                    value={flash.percent} onChange={e => setFlash({ ...flash, percent: e.target.value })} />
                  <span>%</span>
                </div>
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #eee', marginTop: '0.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  Chọn món được sale <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>· {flash.product_keys.length} món</span>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Tích món muốn giảm. Món không tích giữ giá gốc.</div>
                {allProducts.length === 0 ? (
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>Đang tải sản phẩm...</div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
                    {allProducts.filter(p => p.price > 0).map(p => {
                      const uid = p.unique_id;
                      const checked = flash.product_keys.includes(uid);
                      const pct = parseInt(flash.percent) || 0;
                      const fp = Math.round(p.price * (1 - pct / 100));
                      return (
                        <label key={uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderTop: '1px solid #f3f4f6', cursor: 'pointer' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleFlashProduct(uid)} />
                          <span style={{ flex: 1, fontSize: 14 }}>
                            {p.name} <span style={{ fontSize: 11, color: '#9ca3af' }}>({uid})</span>
                          </span>
                          {checked ? (
                            <span style={{ fontSize: 13 }}>
                              <s style={{ color: '#9ca3af' }}>{p.price.toLocaleString('vi-VN')}đ</s>{' '}
                              <b style={{ color: '#b91c1c' }}>{fp.toLocaleString('vi-VN')}đ</b>
                            </span>
                          ) : (
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>{p.price.toLocaleString('vi-VN')}đ</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={saveFlash} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </>
          ) : tab === 'tiers' ? (
            /* TAB HẠNG THÀNH VIÊN (TIER-1a-v2) */
            <>
              <div className="card-title" style={{ margin: '0 0 0.5rem' }}>🏅 Hạng thành viên</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 1rem' }}>
                Khách <b>mua thẻ hạng này</b> để được giá ưu đãi (giảm % cho mọi món). Mua hàng thường không lên hạng — chỉ tích điểm đổi quà.
                Thẻ có hạn dùng, hết hạn tự về giá gốc. (Bán thẻ &amp; nhóm ưu đãi đặc biệt làm ở bước sau.)
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontWeight: 600 }}>Hiệu lực thẻ</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Áp dụng chung cho mọi hạng, tính từ ngày mua</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" className="input" style={{ width: 70, textAlign: 'right' }} min="1" max="24"
                    value={tierValidMonths} onChange={e => setTierValidMonths(e.target.value)} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>tháng</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid #eee' }}>
                <div><div style={{ fontWeight: 600 }}>Làm tròn giá</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Giá sau giảm được làm tròn cho đẹp</div></div>
                <select className="input" style={{ width: 200 }}
                  value={`${tierRound.round_to}_${tierRound.round_mode}`}
                  onChange={e => { const [rt, rm] = e.target.value.split('_'); setTierRound({ round_to: parseInt(rt), round_mode: rm }); }}>
                  <option value="500_nearest">Gần nhất tới 500đ</option>
                  <option value="1000_nearest">Gần nhất tới 1.000đ</option>
                  <option value="500_down">Tròn xuống tới 500đ (lợi khách)</option>
                  <option value="1000_down">Tròn xuống tới 1.000đ (lợi khách)</option>
                  <option value="0_nearest">Không làm tròn</option>
                </select>
              </div>

              {tiers.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13, paddingTop: '0.75rem', borderTop: '1px solid #eee' }}>Đang tải hạng...</p>
              ) : (
                <table className="table" style={{ width: '100%', fontSize: 13, marginTop: '0.5rem' }}>
                  <thead>
                    <tr style={{ color: '#6b7280', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>Tên hạng</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Giá bán thẻ (đ)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Giảm %</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Giảm % SP đặc biệt</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map(t => (
                      <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <input className="input" style={{ width: '95%' }} value={t.name}
                            onChange={e => updateTier(t.id, 'name', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          <input type="number" className="input" style={{ width: 130, textAlign: 'right' }} min="0" step="1000"
                            value={t.card_price} onChange={e => updateTier(t.id, 'card_price', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          <input type="number" className="input" style={{ width: 70, textAlign: 'right' }} min="0" max="90"
                            value={t.discount_percent} onChange={e => updateTier(t.id, 'discount_percent', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          <input type="number" className="input" style={{ width: 70, textAlign: 'right' }} min="0" max="90"
                            value={t.special_discount_percent ?? 0} onChange={e => updateTier(t.id, 'special_discount_percent', e.target.value)}
                            title="% giảm riêng cho SP đặc biệt (vd cà phê) — tick ở tab Giá bán" />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12, color: '#dc2626' }}
                            onClick={() => deleteTier(t.id, t.name)} disabled={saving}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* xem trước 1 ví dụ */}
              {tiers.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '10px 12px', background: '#faf5ff', borderRadius: 8, fontSize: 13 }}>
                  <b>Xem trước</b> — món thường giá 50.500đ:
                  <span style={{ marginLeft: 8 }}>
                    {tiers.map(t => {
                      const pct = Number(t.discount_percent) || 0;
                      let p = 50500 * (1 - pct / 100);
                      const rt = tierRound.round_to;
                      if (rt > 0) p = tierRound.round_mode === 'down' ? Math.floor(p / rt) * rt : Math.round(p / rt) * rt;
                      return <span key={t.id} style={{ marginRight: 12 }}>{t.name}: <b style={{ color: '#7c3aed' }}>{p.toLocaleString('vi-VN')}đ</b></span>;
                    })}
                  </span>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={saveTiers} disabled={saving}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
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
