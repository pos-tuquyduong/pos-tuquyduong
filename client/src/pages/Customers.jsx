/**
 * POS - Customers Page
 * Hiện danh sách khách từ SX + POS với STT, subscription info, relationship
 * Phase B: Click vào row để mở modal sửa CK + ghi chú
 */

import { useState, useEffect } from 'react';
import { customersV2Api, registrationsApi } from '../utils/api';
import { Search, Plus, X, Phone, Users, RefreshCw, User, Percent, FileText } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, synced: 0, pending: 0, hasBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: '', name: '', notes: '',
    parent_phone: '',
    relationship: '',
    requested_product: 'Nước ép',
    requested_cycles: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal chi tiết khách hàng (CK + ghi chú POS)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // LOY-2: đổi quà tại quầy (dùng chung API mà app KH sẽ gọi)
  const [rewards, setRewards] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [detailForm, setDetailForm] = useState({
    discount_type: 'percent',
    discount_value: 0,
    discount_note: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersV2Api.list();
      const allCustomers = data.customers || [];

      setCustomers(allCustomers);
      setStats({
        total: allCustomers.length,
        synced: allCustomers.filter(c => c.is_synced).length,
        pending: allCustomers.filter(c => c.is_pending).length,
        hasBalance: allCustomers.filter(c => c.balance > 0).length
      });
    } catch (err) {
      setError('Không thể tải danh sách khách hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter và search
  const filteredCustomers = customers.filter(c => {
    if (filter === 'synced' && !c.is_synced) return false;
    if (filter === 'pending' && !c.is_pending) return false;
    if (filter === 'has_balance' && (!c.balance || c.balance <= 0)) return false;
    if (filter === 'has_discount' && (!c.discount_value || c.discount_value <= 0)) return false;

    if (search) {
      const q = search.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.phone?.includes(q)) return false;
    }

    return true;
  });

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await registrationsApi.create({
        phone: formData.phone,
        name: formData.name,
        notes: formData.notes,
        parent_phone: formData.parent_phone || null,
        relationship: formData.relationship || null,
        requested_product: formData.requested_product,
        requested_cycles: formData.requested_cycles
      });

      setSuccess('Đã thêm khách hàng mới! Chờ đồng bộ với SX.');
      setShowModal(false);
      setFormData({
        phone: '', name: '', notes: '',
        parent_phone: '',
        relationship: '',
        requested_product: 'Nước ép',
        requested_cycles: 1
      });
      loadCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal chi tiết khi click vào row
  const openDetailModal = (customer) => {
    setSelectedCustomer(customer);
    setShowRedeem(false);
    setRedeemResult(null);
    setRewards([]);
    setVouchers([]);
    setDetailForm({
      discount_type: customer.discount_type || 'percent',
      discount_value: customer.discount_value || 0,
      discount_note: customer.discount_note || '',
      address: customer.address || ''
    });
    setShowDetailModal(true);
    setError('');
  };

  // ─── LOY-2: đổi quà tại quầy — dùng ĐÚNG 3 API mà app KH sẽ gọi (không viết logic riêng) ───
  const loyaltyApi = async (method, url, body) => {
    const token = localStorage.getItem('pos_token');
    const opts = { method, headers: { 'Authorization': 'Bearer ' + token } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(url, opts);
    return res.json();
  };

  const openRedeem = async () => {
    if (!selectedCustomer?.phone) return;
    setShowRedeem(true);
    setRedeemResult(null);
    setError('');
    try {
      const ph = encodeURIComponent(selectedCustomer.phone);
      const [r, v, p] = await Promise.all([
        loyaltyApi('GET', '/api/pos/rewards?active=1'),
        loyaltyApi('GET', `/api/pos/loyalty/vouchers/${ph}`),
        loyaltyApi('GET', `/api/pos/loyalty/points/${ph}`),
      ]);
      // Báo lỗi THẬT — đừng để màn hình nói "chưa có quà" khi thực ra là lỗi tải.
      if (!r.success) throw new Error(r.error || 'Không tải được kho quà');
      setRewards(r.data || []);
      if (v.success) setVouchers(v.data || []);
      // Lấy điểm TƯƠI (số ở danh sách có thể cũ nếu khách vừa mua ở quầy khác).
      if (p.success) setSelectedCustomer(prev => ({ ...prev, points: p.points }));
    } catch (err) {
      setError('Không tải được kho quà: ' + err.message);
      setShowRedeem(false);
    }
  };

  const doRedeem = async (reward) => {
    if (!selectedCustomer?.phone || redeeming) return;
    if (!window.confirm(`Đổi ${reward.points_cost} điểm lấy "${reward.name}" cho khách ${selectedCustomer.phone}?`)) return;
    setRedeeming(true);
    setError('');
    try {
      const data = await loyaltyApi('POST', '/api/pos/loyalty/redeem', {
        phone: selectedCustomer.phone,
        reward_id: reward.id,
      });
      if (!data.success) throw new Error(data.error || 'Đổi quà thất bại');
      setRedeemResult(data.data);
      // cập nhật điểm hiển thị ngay + tải lại ví
      setSelectedCustomer(prev => ({ ...prev, points: data.data.points_left }));
      const v = await loyaltyApi('GET', `/api/pos/loyalty/vouchers/${encodeURIComponent(selectedCustomer.phone)}`);
      if (v.success) setVouchers(v.data || []);
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  // Kiểm tra khách có SĐT không (để cho phép set CK)
  const canSetDiscount = (customer) => !!customer?.phone;

  // Lưu thông tin (CK + ghi chú + địa chỉ)
  const handleSaveDetail = async () => {
    if (!selectedCustomer) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      // Cập nhật chiết khấu
      await customersV2Api.updateDiscount(selectedCustomer.phone, {
        discount_type: detailForm.discount_value > 0 ? detailForm.discount_type : null,
        discount_value: detailForm.discount_value,
        discount_note: detailForm.discount_note
      });

      // Cập nhật địa chỉ
      const token = localStorage.getItem('pos_token');
      const addrRes = await fetch(`/api/pos/v2/customers/${selectedCustomer.phone}/address`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: detailForm.address })
      });
      if (!addrRes.ok) {
        const err = await addrRes.json().catch(() => ({}));
        throw new Error(err.error || 'Không thể cập nhật địa chỉ');
      }
      
      setSuccess(`Đã cập nhật thông tin cho ${selectedCustomer.name || selectedCustomer.phone}`);
      setShowDetailModal(false);
      loadCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Không thể cập nhật thông tin');
    } finally {
      setSubmitting(false);
    }
  };

  const relationships = [
    { value: '', label: '-- Chọn quan hệ --' },
    { value: 'con', label: 'Con' },
    { value: 'bố', label: 'Bố' },
    { value: 'mẹ', label: 'Mẹ' },
    { value: 'vợ', label: 'Vợ' },
    { value: 'chồng', label: 'Chồng' },
    { value: 'anh/chị/em', label: 'Anh/Chị/Em' },
    { value: 'bạn bè', label: 'Bạn bè' },
    { value: 'khác', label: 'Khác' }
  ];

  const getStatusBadge = (customer) => {
    if (customer.is_synced) {
      return <span className="badge badge-success">🟢 Đã đồng bộ</span>;
    }
    if (customer.is_pending) {
      return <span className="badge badge-warning">🟡 Chờ đồng bộ</span>;
    }
    if (customer.is_retail) {
      return <span className="badge badge-gray">⚪ Khách lẻ</span>;
    }
    return null;
  };

  const formatMoney = (amount) => {
    return (amount || 0).toLocaleString() + 'đ';
  };

  const formatDiscount = (type, value) => {
    if (!value || value <= 0) return '-';
    if (type === 'percent') return `${value}%`;
    return formatMoney(value);
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">👥 Khách hàng</h1>
        <div className="flex gap-1">
          <button className="btn btn-outline" onClick={loadCustomers}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Thêm khách
          </button>
        </div>
      </header>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats */}
        <div className="grid grid-4 mb-2">
          <div className="stat-card">
            <div className="stat-label">Tổng KH</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🟢 Đã đồng bộ SX</div>
            <div className="stat-value">{stats.synced}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🟡 Chờ đồng bộ</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">💰 Có số dư</div>
            <div className="stat-value">{stats.hasBalance}</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card">
          <form onSubmit={handleSearch} className="flex gap-1 mb-2">
            <input
              type="text"
              className="input"
              placeholder="Tìm theo SĐT hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Search size={16} /> Tìm
            </button>
          </form>

          <div className="flex gap-1 mb-2" style={{ flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'synced', label: '🟢 Đã đồng bộ' },
              { key: 'pending', label: '🟡 Chờ đồng bộ' },
              { key: 'has_balance', label: '💰 Có số dư' },
              { key: 'has_discount', label: '🏷️ Có CK' }
            ].map(f => (
              <button
                key={f.key}
                className={`btn ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-gray text-center" style={{ padding: '2rem' }}>
              Không có khách hàng nào
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>SĐT</th>
                  <th>Tên KH</th>
                  <th>Gói đăng ký</th>
                  <th style={{ textAlign: 'right' }}>Số dư</th>
                  <th style={{ textAlign: 'right' }}>🎁 Điểm</th>
                  <th style={{ textAlign: 'center' }}>CK</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr 
                    key={c.phone || idx}
                    onClick={() => openDetailModal(c)}
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td className="text-gray">{idx + 1}</td>
                    <td>
                      <div className="flex flex-center gap-1">
                        <Phone size={14} className="text-gray" />
                        {c.phone || <span className="text-gray">(trống)</span>}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{c.name || 'Chưa có tên'}</strong>
                      </div>
                      {c.relationship && c.parent_name && (
                        <div className="text-sm" style={{ color: '#8b5cf6' }}>
                          <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {c.relationship} của <strong>{c.parent_name}</strong>
                        </div>
                      )}
                      {c.children_count > 0 && (
                        <div className="text-sm text-gray">
                          <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Có {c.children_count} người nhận
                        </div>
                      )}
                      {c.notes && (
                        <div className="text-sm text-gray">
                          <FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />
                          {c.notes}
                        </div>
                      )}
                      {c.discount_note && c.discount_value > 0 && (
                        <div className="text-sm" style={{ color: '#dc2626' }}>
                          💬 {c.discount_note}
                        </div>
                      )}
                    </td>
                    <td>
                      {c.subscriptions && c.subscriptions.length > 0 ? (
                        c.subscriptions.map((sub, i) => (
                          <div key={i} className="text-sm" style={{ marginBottom: '2px' }}>
                            <span className="badge badge-info" style={{ marginRight: '4px' }}>
                              {sub.product_name || sub.product_type}
                            </span>
                            {sub.group_name && (
                              <span 
                                className="badge" 
                                style={{ 
                                  background: sub.group_color || '#e2e8f0',
                                  color: '#1e293b'
                                }}
                              >
                                {sub.group_name}
                              </span>
                            )}
                            {sub.cycles > 1 && (
                              <span className="text-gray"> ({sub.cycles} CT)</span>
                            )}
                          </div>
                        ))
                      ) : c.requested_product ? (
                        <div className="text-sm">
                          <span className="badge badge-warning">
                            {c.requested_product}
                          </span>
                          {c.requested_cycles && (
                            <span className="text-gray"> ({c.requested_cycles} CT)</span>
                          )}
                          <div className="text-gray" style={{ fontSize: '0.7rem' }}>
                            Chờ xếp nhóm
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray">-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-bold" style={{ 
                        color: c.balance > 0 ? '#22c55e' : '#64748b' 
                      }}>
                        {formatMoney(c.balance)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-bold" style={{ color: c.points > 0 ? '#7c3aed' : '#94a3b8' }}>
                        {c.points || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.discount_value > 0 ? (
                        <span 
                          className="badge" 
                          style={{ 
                            background: '#fef2f2', 
                            color: '#dc2626',
                            border: '1px solid #fecaca'
                          }}
                        >
                          {formatDiscount(c.discount_type, c.discount_value)}
                        </span>
                      ) : (
                        <span className="text-gray">-</span>
                      )}
                    </td>
                    <td>{getStatusBadge(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Hướng dẫn */}
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: '#f0f9ff', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#0369a1'
          }}>
            💡 Click vào dòng khách hàng để cài đặt chiết khấu và ghi chú
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Thêm khách hàng mới</div>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="form-group">
                  <label className="form-label">SĐT *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0901234567"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tên KH *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nguyễn Thị A"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Ghi chú thêm..."
                  />
                </div>

                <div className="grid grid-2 gap-1">
                  <div className="form-group">
                    <label className="form-label">Sản phẩm</label>
                    <select
                      className="select"
                      value={formData.requested_product}
                      onChange={(e) => setFormData({...formData, requested_product: e.target.value})}
                    >
                      <option value="Nước ép">Nước ép</option>
                      <option value="Trà">Trà</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số chu kỳ</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.requested_cycles}
                      onChange={(e) => setFormData({...formData, requested_cycles: parseInt(e.target.value) || 1})}
                      min="1"
                    />
                  </div>
                </div>

                {/* Khách phụ (mua hộ) */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '8px' 
                }}>
                  <div className="form-label" style={{ marginBottom: '0.75rem' }}>
                    👥 Là người nhận của khách khác (tùy chọn)
                  </div>
                  <div className="form-group">
                    <label className="form-label">SĐT khách chính</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                      placeholder="SĐT người thanh toán"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quan hệ</label>
                    <select
                      className="select"
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    >
                      {relationships.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết khách hàng - CK + Ghi chú */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                👤 Chi tiết khách hàng
              </div>
              <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              {/* Thông tin cơ bản */}
              <div style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {selectedCustomer.name || 'Khách lẻ'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                      <Phone size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
                      {selectedCustomer.phone}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(selectedCustomer)}
                    <div style={{ marginTop: '8px', fontWeight: 600, color: selectedCustomer.balance > 0 ? '#22c55e' : '#64748b' }}>
                      💰 {formatMoney(selectedCustomer.balance)}
                    </div>
                    <div style={{ marginTop: '4px', fontWeight: 600, color: selectedCustomer.points > 0 ? '#7c3aed' : '#94a3b8' }}>
                      🎁 {selectedCustomer.points || 0} điểm
                    </div>
                    {selectedCustomer.phone && (
                      <button className="btn btn-outline" style={{ marginTop: '6px', padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => (showRedeem ? setShowRedeem(false) : openRedeem())}>
                        {showRedeem ? 'Đóng' : '🎫 Đổi quà'}
                      </button>
                    )}
                  </div>
                </div>

                {/* LOY-2: khu đổi quà tại quầy */}
                {showRedeem && (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                    {redeemResult && (
                      <div style={{ padding: '10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>✅ Mã voucher: {redeemResult.code}</div>
                        <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '2px' }}>
                          {redeemResult.reward_name} · hạn {redeemResult.expires_at} · đã trừ {redeemResult.points_spent} điểm, còn {redeemResult.points_left}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '4px' }}>
                          Đọc mã này cho khách. Chỉ dùng được cho đơn của chính SĐT này.
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Kho quà</div>
                    {rewards.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Chưa có quà. Thêm ở Cài đặt → 🎫 Kho quà.</div>
                    ) : rewards.map(r => {
                      const enough = (selectedCustomer.points || 0) >= r.points_cost;
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f3e8ff' }}>
                          <div style={{ fontSize: '0.85rem' }}>
                            {r.name}
                            <span style={{ color: '#7c3aed', fontWeight: 600, marginLeft: '6px' }}>{r.points_cost} điểm</span>
                          </div>
                          <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }} disabled={!enough || redeeming}
                            title={enough ? '' : 'Khách chưa đủ điểm'}
                            onClick={() => doRedeem(r)}>
                            {redeeming ? '...' : 'Đổi'}
                          </button>
                        </div>
                      );
                    })}

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, margin: '10px 0 6px' }}>Ví voucher ({vouchers.length})</div>
                    {vouchers.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Chưa có voucher nào chưa dùng.</div>
                    ) : vouchers.map(v => (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #f3e8ff', fontSize: '0.82rem' }}>
                        <span><b>{v.code}</b> · {v.reward_name || '—'}</span>
                        <span style={{ color: '#64748b' }}>hạn {v.expires_at || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCustomer.relationship && selectedCustomer.parent_name && (                  <div style={{ marginTop: '8px', padding: '8px', background: '#f3e8ff', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <User size={14} style={{ display: 'inline', marginRight: '6px', color: '#8b5cf6' }} />
                    {selectedCustomer.relationship} của <strong>{selectedCustomer.parent_name}</strong>
                  </div>
                )}

                {selectedCustomer.subscriptions && selectedCustomer.subscriptions.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {selectedCustomer.subscriptions.map((sub, i) => (
                      <span key={i} className="badge badge-info" style={{ marginRight: '4px' }}>
                        {sub.product_name || sub.product_type}
                        {sub.group_name && ` - ${sub.group_name}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ghi chú từ SX (readonly) */}
                {selectedCustomer.notes && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                    <FileText size={12} style={{ display: 'inline', marginRight: '6px' }} />
                    <span style={{ fontStyle: 'italic' }}>Ghi chú SX: {selectedCustomer.notes}</span>
                  </div>
                )}
              </div>

              {/* Chiết khấu mặc định */}
              {canSetDiscount(selectedCustomer) ? (
                <>
                  <div style={{ 
                    padding: '1rem', 
                    background: '#fffbeb', 
                    borderRadius: '8px',
                    border: '1px solid #fde68a',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.75rem', color: '#92400e' }}>
                      <Percent size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                      Chiết khấu mặc định
                    </div>
                    
                    <div className="grid grid-2 gap-1">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Loại</label>
                        <select
                          className="select"
                          value={detailForm.discount_type}
                          onChange={(e) => setDetailForm({...detailForm, discount_type: e.target.value})}
                        >
                          <option value="percent">Phần trăm (%)</option>
                          <option value="fixed">Số tiền (đ)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">
                          Giá trị {detailForm.discount_type === 'percent' ? '(%)' : '(đ)'}
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={detailForm.discount_value}
                          onChange={(e) => setDetailForm({...detailForm, discount_value: parseFloat(e.target.value) || 0})}
                          min="0"
                          max={detailForm.discount_type === 'percent' ? 100 : undefined}
                          step={detailForm.discount_type === 'percent' ? 1 : 1000}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lý do chiết khấu */}
                  <div className="form-group">
                    <label className="form-label">
                      💬 Lý do chiết khấu
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={detailForm.discount_note}
                      onChange={(e) => setDetailForm({...detailForm, discount_note: e.target.value})}
                      placeholder="VD: Khách VIP, mua số lượng lớn..."
                    />
                  </div>

                  {/* Địa chỉ giao hàng */}
                  <div className="form-group">
                    <label className="form-label">
                      📍 Địa chỉ (hiển thị trên hóa đơn)
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={detailForm.address}
                      onChange={(e) => setDetailForm({...detailForm, address: e.target.value})}
                      placeholder="VD: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                    />
                  </div>
                </>
              ) : (
                <div style={{ 
                  padding: '1rem', 
                  background: '#fef2f2', 
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  marginBottom: '1rem',
                  color: '#991b1b'
                }}>
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                    ⚠️ Không thể cài đặt chiết khấu
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Khách hàng chưa có SĐT. Vui lòng bổ sung SĐT ở hệ thống SX trước khi cài đặt chiết khấu.
                  </div>
                </div>
              )}

              <div style={{ 
                padding: '0.5rem 0.75rem', 
                background: '#f0f9ff', 
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#0369a1'
              }}>
                💡 Chiết khấu tự động áp dụng khi bán hàng
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
              {canSetDiscount(selectedCustomer) && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveDetail}
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-row:hover {
          background-color: #f8fafc !important;
        }
        .hover-row:hover td {
          background-color: #f8fafc !important;
        }
      `}</style>
    </>
  );
}
