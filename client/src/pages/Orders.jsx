// Orders.jsx
import { useState, useEffect } from 'react';
import { ordersApi } from '../utils/api';
import { Package } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadOrders();
  }, [date]);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.list({ date });
      setOrders(data.orders);
      setStats(data.todayStats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';
  const formatTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="badge badge-success">Hoàn thành</span>;
      case 'cancelled': return <span className="badge badge-danger">Đã hủy</span>;
      case 'refund_pending': return <span className="badge badge-warning">Chờ hoàn tiền</span>;
      case 'refunded': return <span className="badge badge-info">Đã hoàn tiền</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">📦 Đơn hàng</h1>
        <input type="date" className="input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
      </header>
      <div className="page-content">
        <div className="grid grid-3 mb-2">
          <div className="stat-card"><div className="stat-label">Tổng đơn</div><div className="stat-value">{stats.order_count || 0}</div></div>
          <div className="stat-card"><div className="stat-label">Doanh thu</div><div className="stat-value text-success">{formatPrice(stats.total_revenue)}</div></div>
          <div className="stat-card"><div className="stat-label">Đã hủy</div><div className="stat-value text-danger">{stats.cancelled_count || 0}</div></div>
        </div>
        <div className="card">
          {loading ? <div className="loading">Đang tải...</div> : (
            <table className="table">
              <thead><tr><th>Mã đơn</th><th>Giờ</th><th>Khách hàng</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.code}</strong></td>
                    <td>{formatTime(o.created_at)}</td>
                    <td>{o.customer_name || 'Khách lẻ'}</td>
                    <td className="font-bold">{formatPrice(o.total)}</td>
                    <td>{o.payment_method === 'cash' ? '💵' : o.payment_method === 'transfer' ? '🏦' : '💳'}</td>
                    <td>{getStatusBadge(o.status)}</td>
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
