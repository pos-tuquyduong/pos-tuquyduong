/**
 * POS - Registrations Page
 * Quản lý đăng ký mới + Export 2 bước + Log + Hoàn tác
 * v3: Fix page refresh sau confirm export
 */

import { useState, useEffect } from 'react';
import { registrationsApi } from '../utils/api';
import { hienNgayGio } from '../utils/ngayVN';
import { Download, Check, Trash2, Edit2, X, RefreshCw, FileText, History, RotateCcw } from 'lucide-react';

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, exported: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Export state
  const [exporting, setExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingCount, setPendingCount] = useState(0); // Lưu số lượng pending khi bắt đầu export

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Log modal
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;

      const data = await registrationsApi.list(params);
      setRegistrations(data.registrations || []);
      setStats(data.stats || { total: 0, pending: 0, exported: 0 });
    } catch (err) {
      setError('Không thể tải danh sách: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 1: Tải CSV
  const handleDownloadCsv = async () => {
    if (stats.pending === 0) {
      setError('Không có đăng ký mới để export');
      return;
    }

    setExporting(true);
    setError('');
    try {
      await registrationsApi.exportCsv();
      setPendingCount(stats.pending); // Lưu số lượng để hiện trong confirm
      setSuccess('✅ Đã tải file CSV! Kiểm tra file rồi bấm "Xác nhận" bên dưới.');
      setShowConfirm(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // BƯỚC 2: Xác nhận export
  const handleConfirmExport = async () => {
    setConfirming(true);
    setError('');
    try {
      const result = await registrationsApi.confirmExport();
      setSuccess(`🎉 ${result.message}`);
      setShowConfirm(false);
      setPendingCount(0);

      // Reload data ngay lập tức
      await loadData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Lỗi: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  // Hủy confirm
  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setPendingCount(0);
    setSuccess('');
  };

  // Hoàn tác 1 đăng ký
  const handleRevert = async (id) => {
    if (!confirm('Hoàn tác đăng ký này về trạng thái "Chờ export"?')) return;

    setError('');
    try {
      await registrationsApi.revert(id);
      setSuccess('Đã hoàn tác!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Hoàn tác lần export gần nhất
  const handleRevertLast = async () => {
    if (!confirm('Hoàn tác TẤT CẢ khách từ lần export gần nhất?')) return;

    setError('');
    try {
      const result = await registrationsApi.revertLast();
      setSuccess(result.message);
      await loadData();
      await loadLogs();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Xem logs
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await registrationsApi.getLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const openLogs = () => {
    setShowLogs(true);
    loadLogs();
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa đăng ký này?')) return;

    setError('');
    try {
      await registrationsApi.delete(id);
      setSuccess('Đã xóa!');
      await loadData();
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
    setError('');
    try {
      await registrationsApi.update(editData.id, editData);
      setSuccess('Đã cập nhật!');
      setShowEdit(false);
      await loadData();
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
    return hienNgayGio(date, {
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
          <button className="btn btn-outline" onClick={openLogs} title="Lịch sử export">
            <History size={16} />
          </button>
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

        {/* Export Actions */}
        <div className="card mb-2">
          <div className="card-title">Export cho SX</div>
          <p className="text-sm text-gray mb-2">
            Bước 1: Tải file CSV → Bước 2: Xác nhận để đánh dấu đã export
          </p>

          <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
            {/* Bước 1 */}
            <button 
              className="btn btn-primary" 
              onClick={handleDownloadCsv}
              disabled={exporting || stats.pending === 0 || showConfirm}
            >
              <Download size={16} /> 
              {exporting ? 'Đang tải...' : `1. Tải CSV (${stats.pending} khách)`}
            </button>

            {/* Bước 2 - chỉ hiện sau khi tải */}
            {showConfirm && (
              <button 
                className="btn btn-success" 
                onClick={handleConfirmExport}
                disabled={confirming}
              >
                <Check size={16} /> 
                {confirming ? 'Đang xử lý...' : `2. Xác nhận đã export (${pendingCount} khách)`}
              </button>
            )}
          </div>

          {showConfirm && (
            <div style={{ 
              marginTop: '0.75rem', 
              padding: '0.75rem', 
              background: '#fef3c7', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              ⚠️ Đã tải file CSV? Bấm "Xác nhận" để đánh dấu {pendingCount} khách đã export.
              <button 
                className="btn btn-outline" 
                style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={handleCancelConfirm}
              >
                Hủy
              </button>
            </div>
          )}
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
                  <th style={{ width: '40px' }}>#</th>
                  <th>SĐT</th>
                  <th>Tên KH</th>
                  <th>Sản phẩm</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="text-gray">{idx + 1}</td>
                    <td>
                      <div>{r.phone}</div>
                      {r.parent_phone && (
                        <div className="text-sm text-gray">
                          ← {r.parent_phone} ({r.relationship || 'KH chính'})
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{r.name}</strong>
                      {r.notes && <div className="text-sm text-gray">{r.notes}</div>}
                    </td>
                    <td>
                      {r.requested_product || '-'}
                      {r.requested_cycles && <span className="text-gray"> ({r.requested_cycles} CT)</span>}
                    </td>
                    <td className="text-sm">{formatDate(r.created_at)}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <span className="badge badge-warning">🟡 Chờ</span>
                      ) : (
                        <div>
                          <span className="badge badge-success">🟢 Exported</span>
                          <div className="text-sm text-gray">{formatDate(r.exported_at)}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {r.status === 'pending' ? (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => openEdit(r)}
                              title="Sửa"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.25rem 0.5rem' }}
                              onClick={() => handleDelete(r.id)}
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleRevert(r.id)}
                            title="Hoàn tác"
                          >
                            <RotateCcw size={14} />
                          </button>
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

      {/* Logs Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">📜 Lịch sử Export</div>
              <button className="btn btn-outline" onClick={() => setShowLogs(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {loadingLogs ? (
                <div className="loading">Đang tải...</div>
              ) : logs.length === 0 ? (
                <div className="text-gray text-center">Chưa có lịch sử export</div>
              ) : (
                <>
                  {logs.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <button className="btn btn-warning" onClick={handleRevertLast}>
                        <RotateCcw size={16} /> Hoàn tác lần export gần nhất
                      </button>
                    </div>
                  )}
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Người thực hiện</th>
                        <th>Số KH</th>
                        <th>File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td className="text-sm">{formatDate(log.exported_at)}</td>
                          <td>{log.exported_by}</td>
                          <td>{log.customer_count}</td>
                          <td className="text-sm">{log.file_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
