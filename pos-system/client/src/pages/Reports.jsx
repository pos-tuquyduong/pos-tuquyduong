// Reports.jsx
import { useState, useEffect } from 'react';
import { reportsApi } from '../utils/api';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReport(); }, [date]);

  const loadReport = async () => {
    setLoading(true);
    try { const data = await reportsApi.daily(date); setReport(data); } 
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">📊 Báo cáo</h1>
        <input type="date" className="input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
      </header>
      <div className="page-content">
        <div className="grid grid-4 mb-2">
          <div className="stat-card"><div className="stat-label">Tổng đơn</div><div className="stat-value">{report?.order_stats?.total_orders || 0}</div></div>
          <div className="stat-card"><div className="stat-label">Doanh thu</div><div className="stat-value text-success">{formatPrice(report?.order_stats?.total_revenue)}</div></div>
          <div className="stat-card"><div className="stat-label">Tiền mặt</div><div className="stat-value">{formatPrice(report?.order_stats?.cash_revenue)}</div></div>
          <div className="stat-card"><div className="stat-label">Chuyển khoản</div><div className="stat-value">{formatPrice(report?.order_stats?.transfer_revenue)}</div></div>
        </div>
        <div className="grid grid-2 gap-2">
          <div className="card">
            <div className="card-title">💰 Số dư</div>
            <div>Tổng nạp: <strong className="text-success">{formatPrice(report?.balance_stats?.total_topup)}</strong></div>
            <div>Tổng hoàn: <strong className="text-warning">{formatPrice(report?.balance_stats?.total_refund)}</strong></div>
          </div>
          <div className="card">
            <div className="card-title">🏆 Sản phẩm bán chạy</div>
            {report?.top_products?.slice(0, 5).map(p => (
              <div key={p.product_code} className="flex flex-between" style={{ padding: '0.25rem 0' }}>
                <span>{p.product_name}</span>
                <span className="font-bold">{p.total_quantity} túi</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
