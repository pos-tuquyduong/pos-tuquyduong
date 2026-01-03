/**
 * POS - Customers Page
 */

import { useState, useEffect } from 'react';
import { customersApi } from '../utils/api';
import { Search, Plus, X, Phone, User, Users } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: '', name: '', notes: '',
    customer_type: 'subscription',
    requested_product: 'Nước ép',
    requested_cycles: 1,
    children: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const loadCustomers = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.sync_status = filter;
      if (search) params.search = search;
      
      const data = await customersApi.list(params);
      setCustomers(data.customers);
      setStats(data.stats);
    } catch (err) {
      setError('Không thể tải danh sách khách hàng');
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
      await customersApi.create(formData);
      setShowModal(false);
      setFormData({
        phone: '', name: '', notes: '',
        customer_type: 'subscription',
        requested_product: 'Nước ép',
        requested_cycles: 1,
        children: []
      });
      loadCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addChild = () => {
    setFormData({
      ...formData,
      children: [...formData.children, { name: '', phone: '', relationship: '' }]
    });
  };

  const updateChild = (index, field, value) => {
    const newChildren = [...formData.children];
    newChildren[index][field] = value;
    setFormData({ ...formData, children: newChildren });
  };

  const removeChild = (index) => {
    setFormData({
      ...formData,
      children: formData.children.filter((_, i) => i !== index)
    });
  };

  const getSyncBadge = (status) => {
    switch(status) {
      case 'new': return <span className="badge badge-warning">🟡 Mới</span>;
      case 'exported': return <span className="badge badge-info">🟠 Chờ SX</span>;
      case 'synced': return <span className="badge badge-success">🟢 Đã xếp</span>;
      case 'retail_only': return <span className="badge badge-gray">⚪ Mua lẻ</span>;
      default: return null;
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">👥 Khách hàng</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Thêm khách
        </button>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div className="grid grid-4 mb-2">
          <div className="stat-card">
            <div className="stat-label">Tổng KH</div>
            <div className="stat-value">{Object.values(stats).reduce((a, b) => a + b, 0)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🟢 Đã xếp nhóm</div>
            <div className="stat-value">{stats.synced || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🟡 Mới tạo</div>
            <div className="stat-value">{stats.new || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">🟠 Chờ SX</div>
            <div className="stat-value">{stats.exported || 0}</div>
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

          <div className="flex gap-1 mb-2">
            {['all', 'new', 'exported', 'synced', 'retail_only'].map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Tất cả' :
                 f === 'new' ? '🟡 Mới' :
                 f === 'exported' ? '🟠 Chờ SX' :
                 f === 'synced' ? '🟢 Đã xếp' : '⚪ Mua lẻ'}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SĐT</th>
                  <th>Tên KH</th>
                  <th>Số dư</th>
                  <th>Nhóm</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex flex-center gap-1">
                        <Phone size={14} className="text-gray" />
                        {c.phone}
                      </div>
                    </td>
                    <td>
                      <div>
                        {c.parent_phone && <span className="text-gray">└─ </span>}
                        <strong>{c.name}</strong>
                      </div>
                      {c.children_count > 0 && (
                        <div className="text-sm text-gray">
                          <Users size={12} /> Có {c.children_count} người nhận
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: '#2563eb' }}>
                        {(c.balance || 0).toLocaleString()}đ
                      </span>
                    </td>
                    <td>{c.sx_group_name || '-'}</td>
                    <td>{getSyncBadge(c.sync_status)}</td>
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
                    placeholder="chị Nguyễn Thị A"
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
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Loại khách</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`btn ${formData.customer_type === 'subscription' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setFormData({...formData, customer_type: 'subscription'})}
                    >
                      Đăng ký Subscription
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.customer_type === 'retail' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setFormData({...formData, customer_type: 'retail'})}
                    >
                      Chỉ mua lẻ
                    </button>
                  </div>
                </div>

                {formData.customer_type === 'subscription' && (
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
                )}

                {/* Children */}
                <div className="form-group">
                  <div className="flex flex-between flex-center mb-1">
                    <label className="form-label" style={{ margin: 0 }}>Người nhận</label>
                    <button type="button" className="btn btn-outline" onClick={addChild}>
                      <Plus size={14} /> Thêm
                    </button>
                  </div>
                  {formData.children.map((child, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <input
                        type="text"
                        className="input"
                        placeholder="Tên"
                        value={child.name}
                        onChange={(e) => updateChild(i, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder="SĐT (nếu có)"
                        value={child.phone}
                        onChange={(e) => updateChild(i, 'phone', e.target.value)}
                      />
                      <select
                        className="select"
                        value={child.relationship}
                        onChange={(e) => updateChild(i, 'relationship', e.target.value)}
                      >
                        <option value="">Quan hệ</option>
                        <option value="mẹ">Mẹ</option>
                        <option value="bố">Bố</option>
                        <option value="chị gái">Chị gái</option>
                        <option value="anh">Anh</option>
                        <option value="bạn">Bạn</option>
                        <option value="khác">Khác</option>
                      </select>
                      <button type="button" className="btn btn-danger" onClick={() => removeChild(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
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
