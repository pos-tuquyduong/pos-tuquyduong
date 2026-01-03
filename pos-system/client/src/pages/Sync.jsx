// Sync.jsx - Đồng bộ với SX
import { useState, useEffect } from 'react';
import { syncApi } from '../utils/api';
import { RefreshCw, Upload, Download, AlertTriangle } from 'lucide-react';

export default function Sync() {
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statusData, previewData, logsData] = await Promise.all([
        syncApi.status(), syncApi.exportPreview(), syncApi.logs(10)
      ]);
      setStatus(statusData);
      setPreview(previewData);
      setLogs(logsData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await syncApi.export(); setMessage('Đã export thành công!'); loadData(); } 
    catch (err) { setMessage('Lỗi: ' + err.message); } 
    finally { setExporting(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try { 
      const result = await syncApi.import(file); 
      setMessage(`Đã import: ${result.results.updated} cập nhật, ${result.results.created} mới`);
      loadData();
    } catch (err) { setMessage('Lỗi: ' + err.message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <>
      <header className="page-header"><h1 className="page-title">🔄 Đồng bộ với Sản xuất</h1></header>
      <div className="page-content">
        {message && <div className={`alert ${message.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}
        
        {/* Status */}
        <div className="grid grid-4 mb-2">
          <div className="stat-card"><div className="stat-label">🟡 Mới tạo</div><div className="stat-value">{status?.stats?.new_count || 0}</div></div>
          <div className="stat-card"><div className="stat-label">🟠 Chờ SX</div><div className="stat-value">{status?.stats?.exported_count || 0}</div></div>
          <div className="stat-card"><div className="stat-label">🟢 Đã xếp</div><div className="stat-value">{status?.stats?.synced_count || 0}</div></div>
          <div className="stat-card"><div className="stat-label">⚪ Mua lẻ</div><div className="stat-value">{status?.stats?.retail_count || 0}</div></div>
        </div>

        {/* Warnings */}
        {status?.warnings?.length > 0 && (
          <div className="card mb-2" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
            {status.warnings.map((w, i) => (
              <div key={i} className="flex flex-center gap-1"><AlertTriangle size={16} color="#f59e0b" /> {w.message}</div>
            ))}
          </div>
        )}

        <div className="grid grid-2 gap-2">
          {/* Export */}
          <div className="card">
            <div className="card-title">📤 Export khách mới → Sản xuất</div>
            {preview?.count > 0 ? (
              <>
                <p className="mb-2">Có <strong>{preview.count}</strong> khách mới chờ export:</p>
                <div style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '1rem' }}>
                  {preview.customers.map(c => (
                    <div key={c.id} className="text-sm" style={{ padding: '0.25rem 0' }}>
                      {c.phone} - {c.name} - {c.requested_product || ''}
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                  <Download size={16} /> {exporting ? 'Đang export...' : 'Export CSV'}
                </button>
              </>
            ) : <p className="text-gray">Không có khách mới cần export</p>}
          </div>

          {/* Import */}
          <div className="card">
            <div className="card-title">📥 Import từ Sản xuất</div>
            <p className="mb-2">Upload file CSV từ hệ thống Sản xuất để cập nhật thông tin khách hàng đã được xếp nhóm.</p>
            <label className="btn btn-success" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> {importing ? 'Đang import...' : 'Chọn file CSV'}
              <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
            </label>
            {status?.last_import && (
              <p className="text-sm text-gray mt-2">
                Lần import cuối: {new Date(status.last_import.created_at).toLocaleString('vi-VN')} - {status.last_import.record_count} khách
              </p>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="card mt-2">
          <div className="card-title">📋 Lịch sử đồng bộ</div>
          <table className="table">
            <thead><tr><th>Thời gian</th><th>Loại</th><th>Số lượng</th><th>Người thực hiện</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString('vi-VN')}</td>
                  <td>{l.type === 'export_new' ? '📤 Export' : '📥 Import'}</td>
                  <td>{l.record_count} khách</td>
                  <td>{l.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
