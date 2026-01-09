/**
 * POS - Registrations Page (thay thế Sync.jsx)
 * Quản lý đăng ký subscription mới, export CSV cho SX
 */

import { useState, useEffect } from 'react';
import { registrationsApi } from '../utils/api';
import { Download, Check, Trash2, Edit2, X, RefreshCw, FileText } from 'lucide-react';

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, exported: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;

      const data = await registrationsApi.list(params);
      setRegistrations(data.registrations || []);
      setStats(data.stats || { total: 0, pending: 0, exported: 0 });
    } catch (err) {
      setError('Không thể tải danh sách');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (stats.pending === 0) {
      setError('Không có đăng ký mới để export');
      return;
    }

    setExporting(true);
    try {
      await registrationsApi.exportCsv();
      setSuccess('Đã tải file CSV!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleMarkExported = async () => {
    if (stats.pending === 0) {
      setError('Không có đăng ký nào để đánh dấu');
      return;
    }

    if (!confirm(`Đánh dấu ${stats.pending} đăng ký đã export?`)) return;

    try {
      await registrationsApi.markExported();
      setSuccess('Đã đánh dấu exported!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa đăng ký này?')) return;

    try {
      await registrationsApi.delete(id);
      setSuccess('Đã xóa!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (reg) => {
    setEditData({ ...reg });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await registrationsApi.update(editData.id, editData);
      setSuccess('Đã cập nhật!');
      setShowEdit(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const relationships = [
    { value: '', label: '-- Không --' },
    { value: 'con', label: 'Con' },
    { value: 'bố', label: 'Bố' },
    { value: 'mẹ', label: 'Mẹ' },
    { value: 'vợ', label: 'Vợ' },
    { value: 'chồng', label: 'Chồng' },
    { value: 'anh/chị/em', label: 'Anh/Chị/Em' },
    { value: 'bạn bè', label: 'Bạn bè' },
    { value: 'khác', label: 'Khác' }
  ];

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">📋 Đăng ký mới</h1>
        <div className="flex gap-1">
          <button className="btn btn-outline" onClick={loadData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats */}
        <div className="grid grid-3 mb-2">
          <div className="stat-card">
            <div className="stat-label">Tổng đăng ký</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card" style={{ background: '#fef3c7' }}>
            <div className="stat-label">🟡 Chờ export</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card" style={{ background: '#dcfce7' }}>
            <div className="stat-label">🟢 Đã export</div>
            <div className="stat-value">{stats.exported}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="card mb-2">
          <div className="card-title">Export cho SX</div>
          <p className="text-sm text-gray mb-2">
            Tải file CSV chứa danh sách khách mới để import vào hệ thống SX
          </p>
          <div className="flex gap-1">
            <button 
              className="btn btn-primary" 
              onClick={handleExportCsv}
              disabled={exporting || stats.pending === 0}
            >
              <Download size={16} /> 
              {exporting ? 'Đang tải...' : `Tải CSV (${stats.pending} khách)`}
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleMarkExported}
              disabled={stats.pending === 0}
            >
              <Check size={16} /> Đánh dấu đã export
            </button>
          </div>
        </div>

        {/* Filter & List */}
        <div className="card">
          <div className="flex gap-1 mb-2">
            {[
              { key: 'pending', label: '🟡 Chờ export' },
              { key: 'exported', label: '🟢 Đã export' },
              { key: 'all', label: 'Tất cả' }
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

          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : registrations.length === 0 ? (
            <div className="text-gray text-center" style={{ padding: '2rem' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <div>Không có đăng ký nào</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SĐT</th>
                  <th>Tên KH</th>
                  <th>Sản phẩm</th>
                  <th>Khách chính</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(r => (
                  <tr key={r.id}>
                    <td>{r.phone}</td>
                    <td>
                      <strong>{r.name}</strong>
                      {r.notes && <div className="text-sm text-gray">{r.notes}</div>}
                    </td>
                    <td>
                      {r.requested_product || '-'}
                      {r.requested_cycles && <span className="text-gray"> ({r.requested_cycles} CT)</span>}
                    </td>
                    <td>
                      {r.parent_phone ? (
                        <div>
                          <div>{r.parent_phone}</div>
                          {r.relationship && (
                            <span className="badge badge-info">{r.relationship}</span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="text-sm">{formatDate(r.created_at)}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <span className="badge badge-warning">🟡 Chờ</span>
                      ) : (
                        <span className="badge badge-success">🟢 Exported</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {r.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => openEdit(r)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && editData && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Sửa đăng ký</div>
              <button className="btn btn-outline" onClick={() => setShowEdit(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">SĐT</label>
                <input type="text" className="input" value={editData.phone} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Tên KH</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editData.notes || ''}
                  onChange={e => setEditData({...editData, notes: e.target.value})}
                />
              </div>
              <div className="grid grid-2 gap-1">
                <div className="form-group">
                  <label className="form-label">Sản phẩm</label>
                  <select 
                    className="select"
                    value={editData.requested_product || ''}
                    onChange={e => setEditData({...editData, requested_product: e.target.value})}
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
                    value={editData.requested_cycles || 1}
                    onChange={e => setEditData({...editData, requested_cycles: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">SĐT Khách chính</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editData.parent_phone || ''}
                  onChange={e => setEditData({...editData, parent_phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quan hệ</label>
                <select 
                  className="select"
                  value={editData.relationship || ''}
                  onChange={e => setEditData({...editData, relationship: e.target.value})}
                >
                  {relationships.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEdit(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
