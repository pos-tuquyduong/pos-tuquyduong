/**
 * POS - Customers Page
 * Updated: Dùng customersV2Api + registrationsApi
 */

import { useState, useEffect } from 'react';
import { customersV2Api, registrationsApi, walletsApi } from '../utils/api';
import { Search, Plus, X, Phone, User, Users, RefreshCw } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, synced: 0, pending: 0 });
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

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Lấy danh sách khách từ V2 API (merge SX + POS)
      const data = await customersV2Api.list();
      let filtered = data.customers || [];

      // Filter theo trạng thái
      if (filter === 'synced') {
        filtered = filtered.filter(c => c.is_synced);
      } else if (filter === 'pending') {
        filtered = filtered.filter(c => c.is_pending);
      } else if (filter === 'has_balance') {
        filtered = filtered.filter(c => c.balance > 0);
      }

      // Search
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name?.toLowerCase().includes(q) || 
          c.phone?.includes(q)
        );
      }

      setCustomers(filtered);

      // Tính stats
      const allCustomers = data.customers || [];
      setStats({
        total: allCustomers.length,
        synced: allCustomers.filter(c => c.is_synced).length,
        pending: allCustomers.filter(c => c.is_pending).length,
        has_balance: allCustomers.filter(c => c.balance > 0).length
      });
    } catch (err) {
      setError('Không thể tải danh sách khách hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Tạo đăng ký mới qua registrationsApi
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
            <div className="stat-value">{stats.has_balance}</div>
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
              { key: 'has_balance', label: '💰 Có số dư' }
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
          ) : customers.length === 0 ? (
            <div className="text-gray text-center" style={{ padding: '2rem' }}>
              Không có khách hàng nào
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SĐT</th>
                  <th>Tên KH</th>
                  <th>Số dư</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c.phone || idx}>
                    <td>
                      <div className="flex flex-center gap-1">
                        <Phone size={14} className="text-gray" />
                        {c.phone}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{c.name || 'Chưa có tên'}</strong>
                      </div>
                      {c.notes && (
                        <div className="text-sm text-gray">{c.notes}</div>
                      )}
                      {c.requested_product && (
                        <div className="text-sm text-gray">
                          📦 {c.requested_product} ({c.requested_cycles || 1} CT)
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: c.balance > 0 ? '#22c55e' : '#64748b' }}>
                        {(c.balance || 0).toLocaleString()}đ
                      </span>
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
                    👥 Mua hộ người khác (tùy chọn)
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
    </>
  );
}
