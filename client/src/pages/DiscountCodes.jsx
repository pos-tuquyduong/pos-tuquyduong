/**
 * DiscountCodes.jsx - Quản lý mã chiết khấu
 * Phase B: CRUD mã chiết khấu
 */

import { useState, useEffect } from 'react';
import { discountCodesApi } from '../utils/api';
import { 
  Plus, Edit2, Trash2, Search, X, Check, 
  Percent, DollarSign, Calendar, Tag, Copy, CheckCircle
} from 'lucide-react';

export default function DiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter
  const [filter, setFilter] = useState('all'); // all, active, expired, used
  const [search, setSearch] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: null,
    usage_limit: null,
    start_date: '',
    end_date: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const result = await discountCodesApi.list();
      setCodes(result.data || []);
    } catch (err) {
      setError('Không thể tải danh sách mã chiết khấu');
    } finally {
      setLoading(false);
    }
  };

  // Filter codes
  const filteredCodes = codes.filter(code => {
    // Search
    if (search) {
      const s = search.toLowerCase();
      if (!code.code.toLowerCase().includes(s) && 
          !(code.description || '').toLowerCase().includes(s)) {
        return false;
      }
    }
    
    // Status filter
    const now = new Date();
    const startDate = code.start_date ? new Date(code.start_date) : null;
    const endDate = code.end_date ? new Date(code.end_date) : null;
    const isExpired = endDate && endDate < now;
    const isNotStarted = startDate && startDate > now;
    const isUsedUp = code.usage_limit && code.used_count >= code.usage_limit;
    
    if (filter === 'active') {
      return code.is_active && !isExpired && !isNotStarted && !isUsedUp;
    }
    if (filter === 'expired') {
      return isExpired || isUsedUp;
    }
    if (filter === 'inactive') {
      return !code.is_active;
    }
    
    return true;
  });

  // Generate random code
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TQD';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  // Copy code
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open modal for create/edit
  const openModal = (code = null) => {
    if (code) {
      setEditingCode(code);
      setFormData({
        code: code.code,
        description: code.description || '',
        discount_type: code.discount_type,
        discount_value: code.discount_value,
        min_order_amount: code.min_order_amount || 0,
        max_discount_amount: code.max_discount_amount || null,
        usage_limit: code.usage_limit || null,
        start_date: code.start_date ? code.start_date.slice(0, 10) : '',
        end_date: code.end_date ? code.end_date.slice(0, 10) : '',
        is_active: code.is_active
      });
    } else {
      setEditingCode(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: 0,
        min_order_amount: 0,
        max_discount_amount: null,
        usage_limit: null,
        start_date: '',
        end_date: '',
        is_active: true
      });
    }
    setShowModal(true);
    setError('');
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      setError('Vui lòng nhập mã chiết khấu');
      return;
    }
    if (formData.discount_value <= 0) {
      setError('Giá trị chiết khấu phải > 0');
      return;
    }
    if (formData.discount_type === 'percent' && formData.discount_value > 100) {
      setError('Chiết khấu % không được > 100');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        max_discount_amount: formData.max_discount_amount || null,
        usage_limit: formData.usage_limit || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingCode) {
        await discountCodesApi.update(editingCode.id, data);
        setSuccess('Cập nhật mã chiết khấu thành công');
      } else {
        await discountCodesApi.create(data);
        setSuccess('Tạo mã chiết khấu thành công');
      }

      setShowModal(false);
      loadCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active
  const toggleActive = async (code) => {
    try {
      await discountCodesApi.update(code.id, { is_active: !code.is_active });
      loadCodes();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete code
  const deleteCode = async (code) => {
    if (!confirm(`Xóa mã "${code.code}"?`)) return;
    
    try {
      await discountCodesApi.delete(code.id);
      setSuccess('Đã xóa mã chiết khấu');
      loadCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPrice = (price) => (price || 0).toLocaleString() + 'đ';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  // Get status badge
  const getStatusBadge = (code) => {
    const now = new Date();
    const startDate = code.start_date ? new Date(code.start_date) : null;
    const endDate = code.end_date ? new Date(code.end_date) : null;
    
    if (!code.is_active) {
      return <span className="badge badge-secondary">Tắt</span>;
    }
    if (endDate && endDate < now) {
      return <span className="badge badge-danger">Hết hạn</span>;
    }
    if (startDate && startDate > now) {
      return <span className="badge badge-warning">Chưa bắt đầu</span>;
    }
    if (code.usage_limit && code.used_count >= code.usage_limit) {
      return <span className="badge badge-danger">Đã dùng hết</span>;
    }
    return <span className="badge badge-success">Hoạt động</span>;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">🎫 Mã chiết khấu</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Tạo mã
        </button>
      </header>

      <div className="page-content">
        {/* Messages */}
        {error && (
          <div className="alert alert-danger mb-1">
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-1">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-4 mb-2">
          <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer', opacity: filter === 'all' ? 1 : 0.7 }}>
            <div className="stat-label">Tổng số mã</div>
            <div className="stat-value">{codes.length}</div>
          </div>
          <div className="stat-card" onClick={() => setFilter('active')} style={{ cursor: 'pointer', opacity: filter === 'active' ? 1 : 0.7 }}>
            <div className="stat-label">Đang hoạt động</div>
            <div className="stat-value text-success">
              {codes.filter(c => {
                const now = new Date();
                const endDate = c.end_date ? new Date(c.end_date) : null;
                const isUsedUp = c.usage_limit && c.used_count >= c.usage_limit;
                return c.is_active && (!endDate || endDate >= now) && !isUsedUp;
              }).length}
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilter('expired')} style={{ cursor: 'pointer', opacity: filter === 'expired' ? 1 : 0.7 }}>
            <div className="stat-label">Hết hạn/Dùng hết</div>
            <div className="stat-value text-danger">
              {codes.filter(c => {
                const now = new Date();
                const endDate = c.end_date ? new Date(c.end_date) : null;
                const isUsedUp = c.usage_limit && c.used_count >= c.usage_limit;
                return (endDate && endDate < now) || isUsedUp;
              }).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tổng lượt dùng</div>
            <div className="stat-value text-primary">
              {codes.reduce((sum, c) => sum + (c.used_count || 0), 0)}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-1">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="input"
                placeholder="Tìm mã..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'expired', 'inactive'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'active' ? 'Hoạt động' : f === 'expired' ? 'Hết hạn' : 'Đã tắt'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Mô tả</th>
                  <th>Giảm giá</th>
                  <th>Điều kiện</th>
                  <th>Thời hạn</th>
                  <th>Đã dùng</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '120px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Không có mã chiết khấu nào
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map(code => (
                    <tr key={code.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code style={{ 
                            background: '#f1f5f9', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            color: '#3b82f6'
                          }}>
                            {code.code}
                          </code>
                          <button 
                            onClick={() => copyCode(code.code)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: copiedCode === code.code ? '#22c55e' : '#94a3b8'
                            }}
                            title="Copy mã"
                          >
                            {copiedCode === code.code ? <CheckCircle size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {code.description || '-'}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          fontWeight: 'bold',
                          color: '#dc2626'
                        }}>
                          {code.discount_type === 'percent' ? (
                            <><Percent size={14} /> {code.discount_value}%</>
                          ) : (
                            <>{formatPrice(code.discount_value)}</>
                          )}
                        </span>
                        {code.max_discount_amount && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Tối đa: {formatPrice(code.max_discount_amount)}
                          </div>
                        )}
                      </td>
                      <td>
                        {code.min_order_amount > 0 ? (
                          <span style={{ fontSize: '0.85rem' }}>
                            Đơn từ {formatPrice(code.min_order_amount)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Không</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {code.start_date || code.end_date ? (
                          <>
                            {formatDate(code.start_date)} - {formatDate(code.end_date)}
                          </>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Không giới hạn</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 'bold' }}>{code.used_count || 0}</span>
                        {code.usage_limit && (
                          <span style={{ color: '#94a3b8' }}>/{code.usage_limit}</span>
                        )}
                      </td>
                      <td>{getStatusBadge(code)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => toggleActive(code)}
                            className={`btn btn-sm ${code.is_active ? 'btn-warning' : 'btn-success'}`}
                            title={code.is_active ? 'Tắt' : 'Bật'}
                          >
                            {code.is_active ? <X size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => openModal(code)}
                            className="btn btn-sm btn-outline"
                            title="Sửa"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteCode(code)}
                            className="btn btn-sm btn-danger"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingCode ? 'Sửa mã chiết khấu' : 'Tạo mã chiết khấu mới'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger mb-1">{error}</div>
                )}

                {/* Code */}
                <div className="form-group">
                  <label>Mã chiết khấu *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="VD: SALE50"
                      style={{ flex: 1 }}
                      disabled={!!editingCode}
                    />
                    {!editingCode && (
                      <button type="button" onClick={generateCode} className="btn btn-outline">
                        Tạo ngẫu nhiên
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>Mô tả</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="VD: Giảm 10% cho khách mới"
                  />
                </div>

                {/* Discount Type & Value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Loại chiết khấu *</label>
                    <select
                      className="input"
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    >
                      <option value="percent">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Giá trị *</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })}
                      placeholder={formData.discount_type === 'percent' ? 'VD: 10' : 'VD: 50000'}
                    />
                  </div>
                </div>

                {/* Min order & Max discount */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Đơn tối thiểu</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.min_order_amount || ''}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: parseInt(e.target.value) || 0 })}
                      placeholder="0 = không giới hạn"
                    />
                  </div>
                  {formData.discount_type === 'percent' && (
                    <div className="form-group">
                      <label>Giảm tối đa (đ)</label>
                      <input
                        type="number"
                        className="input"
                        value={formData.max_discount_amount || ''}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: parseInt(e.target.value) || null })}
                        placeholder="Không giới hạn"
                      />
                    </div>
                  )}
                </div>

                {/* Usage limit */}
                <div className="form-group">
                  <label>Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || null })}
                    placeholder="Không giới hạn"
                  />
                  {editingCode && editingCode.used_count > 0 && (
                    <small style={{ color: '#94a3b8' }}>Đã dùng: {editingCode.used_count} lượt</small>
                  )}
                </div>

                {/* Date range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Kích hoạt ngay
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : editingCode ? 'Cập nhật' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
