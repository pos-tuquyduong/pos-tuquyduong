// Refunds.jsx
import { useState, useEffect } from 'react';
import { refundsApi } from '../utils/api';
import { Check, X } from 'lucide-react';
import { baoXong, baoLoiTu } from '../components/thongBaoKho.js';   // BAO-1a

export default function Refunds() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try { const data = await refundsApi.pending(); setPending(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const maDon = (id) => pending.find(r => r.id === id)?.order_code || '';

  const handleApprove = async (id) => {
    setProcessing(id);
    try { await refundsApi.approve(id); baoXong(`Đã duyệt hoàn tiền đơn ${maDon(id)}`); loadPending(); }
    catch (err) { baoLoiTu('duyệt hoàn tiền', err); }
    finally { setProcessing(null); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    setProcessing(id);
    try { await refundsApi.reject(id, reason); baoXong(`Đã từ chối hoàn tiền đơn ${maDon(id)}`); loadPending(); }
    catch (err) { baoLoiTu('từ chối hoàn tiền', err); }
    finally { setProcessing(null); }
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">💸 Yêu cầu hoàn tiền</h1>
        <span className="badge badge-warning">{pending.length} chờ duyệt</span>
      </header>
      <div className="page-content">
        <div className="card">
          {loading ? <div className="loading">Đang tải...</div> : pending.length === 0 ? (
            <p className="text-gray">Không có yêu cầu hoàn tiền</p>
          ) : (
            <table className="table">
              <thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Số tiền</th><th>Lý do</th><th>Thao tác</th></tr></thead>
              <tbody>
                {pending.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.order_code}</strong></td>
                    <td>{r.customer_name}<br/><span className="text-sm text-gray">{r.customer_phone}</span></td>
                    <td className="font-bold text-success">{formatPrice(r.refund_amount)}</td>
                    <td>{r.reason}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-success" onClick={() => handleApprove(r.id)} disabled={processing === r.id}>
                          <Check size={14} /> Duyệt
                        </button>
                        <button className="btn btn-danger" onClick={() => handleReject(r.id)} disabled={processing === r.id}>
                          <X size={14} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
