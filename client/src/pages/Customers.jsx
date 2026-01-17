/**
 * POS - Customers Page
 * Hiện danh sách khách từ SX + POS với STT, subscription info, relationship
 * Phase B: Thêm chiết khấu mặc định cho mỗi khách hàng
 */

import { useState, useEffect } from 'react';
import { customersV2Api, registrationsApi } from '../utils/api';
import { Search, Plus, X, Phone, Users, RefreshCw, User, Percent } from 'lucide-react';

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

  // Phase B: Modal chiết khấu
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCustomer, setDiscountCustomer] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discount_type: 'percent',
    discount_value: 0
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
    // Filter
    if (filter === 'synced' && !c.is_synced) return false;
    if (filter === 'pending' && !c.is_pending) return false;
    if (filter === 'has_balance' && (!c.balance || c.balance <= 0)) return false;
    if (filter === 'has_discount' && (!c.discount_value || c.discount_value <= 0)) return false;

    // Search
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

  // Phase B: Mở modal chiết khấu
  const openDiscountModal = (customer) => {
    setDiscountCustomer(customer);
    setDiscountForm({
      discount_type: customer.discount_type || 'percent',
      discount_value: customer.discount_value || 0
    });
    setShowDiscountModal(true);
    setError('');
  };

  // Phase B: Lưu chiết khấu
  const handleSaveDiscount = async () => {
    if (!discountCustomer) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      await customersV2Api.updateDiscount(discountCustomer.phone, {
        discount_type: discountForm.discount_value > 0 ? discountForm.discount_type : null,
        discount_value: discountForm.discount_value
      });
      
      setSuccess(`Đã cập nhật chiết khấu cho ${discountCustomer.name || discountCustomer.phone}`);
      setShowDiscountModal(false);
      loadCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Không thể cập nhật chiết khấu');
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
                  <th style={{ textAlign: 'center' }}>CK mặc định</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr key={c.phone || idx}>
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
                      {/* Hiển thị quan hệ nếu là khách phụ */}
                      {c.relationship && c.parent_name && (
                        <div className="text-sm" style={{ color: '#8b5cf6' }}>
                          <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {c.relationship} của <strong>{c.parent_name}</strong>
                        </div>
                      )}
                      {/* Hiển thị số người nhận nếu có */}
                      {c.children_count > 0 && (
                        <div className="text-sm text-gray">
                          <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Có {c.children_count} người nhận
                        </div>
                      )}
                      {c.notes && (
                        <div className="text-sm text-gray">{c.notes}</div>
                      )}
                    </td>
                    <td>
                      {/* Hiển thị thông tin subscription từ SX */}
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
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline"
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.8rem',
                          color: c.discount_value > 0 ? '#dc2626' : '#64748b',
                          borderColor: c.discount_value > 0 ? '#fecaca' : undefined,
                          background: c.discount_value > 0 ? '#fef2f2' : undefined
                        }}
                        onClick={() => openDiscountModal(c)}
                        title="Cài đặt chiết khấu mặc định"
                      >
                        <Percent size={12} style={{ marginRight: '4px' }} />
                        {c.discount_value > 0 
                          ? formatDiscount(c.discount_type, c.discount_value)
                          : 'Cài đặt'
                        }
                      </button>
                    </td>
                    <td>{getStatusBadge(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

      {/* Modal Chiết khấu mặc định - Phase B */}
      {showDiscountModal && discountCustomer && (
        <div className="modal-overlay" onClick={() => setShowDiscountModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Percent size={18} style={{ marginRight: '8px' }} />
                Chiết khấu mặc định
              </div>
              <button className="btn btn-outline" onClick={() => setShowDiscountModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div style={{ 
                padding: '0.75rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 500 }}>{discountCustomer.name || 'Khách lẻ'}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  <Phone size={12} style={{ marginRight: '4px', display: 'inline' }} />
                  {discountCustomer.phone}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Loại chiết khấu</label>
                <select
                  className="select"
                  value={discountForm.discount_type}
                  onChange={(e) => setDiscountForm({...discountForm, discount_type: e.target.value})}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (đ)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Giá trị {discountForm.discount_type === 'percent' ? '(%)' : '(đ)'}
                </label>
                <input
                  type="number"
                  className="input"
                  value={discountForm.discount_value}
                  onChange={(e) => setDiscountForm({...discountForm, discount_value: parseFloat(e.target.value) || 0})}
                  min="0"
                  max={discountForm.discount_type === 'percent' ? 100 : undefined}
                  step={discountForm.discount_type === 'percent' ? 1 : 1000}
                  placeholder={discountForm.discount_type === 'percent' ? '0-100' : 'Số tiền'}
                />
              </div>

              <div style={{ 
                padding: '0.75rem', 
                background: '#fef3c7', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#92400e'
              }}>
                💡 Chiết khấu này sẽ tự động áp dụng khi chọn khách trong màn hình Bán hàng.
                Mã chiết khấu hoặc chiết khấu thủ công vẫn có thể ghi đè.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setDiscountForm({ ...discountForm, discount_value: 0 })}
              >
                Xóa CK
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveDiscount}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
