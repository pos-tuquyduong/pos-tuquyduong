// Reports.jsx - Phase B: Thêm báo cáo chiết khấu + shipping
import { useState, useEffect } from 'react';
import { reportsApi } from '../utils/api';
import { Calendar, TrendingUp, TrendingDown, Truck, Percent, Tag } from 'lucide-react';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [discountReport, setDiscountReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().slice(0, 10), // Đầu tháng
    to: new Date().toISOString().slice(0, 10)
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily'); // daily, discount

  useEffect(() => { 
    if (activeTab === 'daily') {
      loadReport(); 
    } else {
      loadDiscountReport();
    }
  }, [date, dateRange, activeTab]);

  const loadReport = async () => {
    setLoading(true);
    try { const data = await reportsApi.daily(date); setReport(data); } 
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDiscountReport = async () => {
    setLoading(true);
    try { 
      const data = await reportsApi.discounts({ from: dateRange.from, to: dateRange.to }); 
      setDiscountReport(data); 
    } 
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">📊 Báo cáo</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'daily' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('daily')}
          >
            Hàng ngày
          </button>
          <button 
            className={`btn ${activeTab === 'discount' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('discount')}
          >
            <Percent size={16} /> Chiết khấu
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Tab: Báo cáo hàng ngày */}
        {activeTab === 'daily' && (
          <>
            <div className="card mb-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} />
                <input 
                  type="date" 
                  className="input" 
                  style={{ width: 'auto' }} 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                />
              </div>
            </div>

            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <>
                <div className="grid grid-4 mb-2">
                  <div className="stat-card">
                    <div className="stat-label">Tổng đơn</div>
                    <div className="stat-value">{report?.order_stats?.total_orders || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Doanh thu</div>
                    <div className="stat-value text-success">{formatPrice(report?.order_stats?.total_revenue)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Tiền mặt</div>
                    <div className="stat-value">{formatPrice(report?.order_stats?.cash_revenue)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Chuyển khoản</div>
                    <div className="stat-value">{formatPrice(report?.order_stats?.transfer_revenue)}</div>
                  </div>
                </div>

                {/* Phase B: Thêm thống kê chiết khấu + shipping */}
                <div className="grid grid-4 mb-2">
                  <div className="stat-card">
                    <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingDown size={14} color="#dc2626" /> Chiết khấu
                    </div>
                    <div className="stat-value text-danger">{formatPrice(report?.order_stats?.total_discount)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Truck size={14} color="#f97316" /> Phí ship
                    </div>
                    <div className="stat-value text-warning">{formatPrice(report?.order_stats?.total_shipping)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Tag size={14} color="#8b5cf6" /> Đơn có mã CK
                    </div>
                    <div className="stat-value">{report?.order_stats?.orders_with_discount_code || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <TrendingUp size={14} color="#22c55e" /> Thực thu
                    </div>
                    <div className="stat-value text-success">
                      {formatPrice((report?.order_stats?.total_revenue || 0) - (report?.order_stats?.total_discount || 0) + (report?.order_stats?.total_shipping || 0))}
                    </div>
                  </div>
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
              </>
            )}
          </>
        )}

        {/* Tab: Báo cáo chiết khấu */}
        {activeTab === 'discount' && (
          <>
            <div className="card mb-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Calendar size={18} />
                <input 
                  type="date" 
                  className="input" 
                  style={{ width: 'auto' }} 
                  value={dateRange.from} 
                  onChange={e => setDateRange({ ...dateRange, from: e.target.value })} 
                />
                <span>đến</span>
                <input 
                  type="date" 
                  className="input" 
                  style={{ width: 'auto' }} 
                  value={dateRange.to} 
                  onChange={e => setDateRange({ ...dateRange, to: e.target.value })} 
                />
              </div>
            </div>

            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <>
                {/* Tổng quan */}
                <div className="grid grid-4 mb-2">
                  <div className="stat-card">
                    <div className="stat-label">Tổng đơn có CK</div>
                    <div className="stat-value">{discountReport?.summary?.total_orders_with_discount || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Tổng chiết khấu</div>
                    <div className="stat-value text-danger">{formatPrice(discountReport?.summary?.total_discount_amount)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Tổng phí ship</div>
                    <div className="stat-value text-warning">{formatPrice(discountReport?.summary?.total_shipping_fee)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">CK trung bình/đơn</div>
                    <div className="stat-value">{formatPrice(discountReport?.summary?.avg_discount_per_order)}</div>
                  </div>
                </div>

                <div className="grid grid-2 gap-2">
                  {/* Thống kê theo mã CK */}
                  <div className="card">
                    <div className="card-title">🎫 Thống kê theo mã chiết khấu</div>
                    {discountReport?.by_code?.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Mã</th>
                              <th style={{ textAlign: 'right' }}>Lượt dùng</th>
                              <th style={{ textAlign: 'right' }}>Tổng CK</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discountReport.by_code.map(item => (
                              <tr key={item.discount_code}>
                                <td>
                                  <code style={{ 
                                    background: '#f1f5f9', 
                                    padding: '0.125rem 0.375rem', 
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    color: '#3b82f6'
                                  }}>
                                    {item.discount_code}
                                  </code>
                                </td>
                                <td style={{ textAlign: 'right' }}>{item.usage_count}</td>
                                <td style={{ textAlign: 'right', color: '#dc2626' }}>{formatPrice(item.total_discount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                        Chưa có đơn nào dùng mã chiết khấu
                      </div>
                    )}
                  </div>

                  {/* Thống kê theo ngày */}
                  <div className="card">
                    <div className="card-title">📅 Thống kê theo ngày</div>
                    {discountReport?.by_date?.length > 0 ? (
                      <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Ngày</th>
                              <th style={{ textAlign: 'right' }}>Đơn</th>
                              <th style={{ textAlign: 'right' }}>CK</th>
                              <th style={{ textAlign: 'right' }}>Ship</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discountReport.by_date.map(item => (
                              <tr key={item.date}>
                                <td>{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                                <td style={{ textAlign: 'right' }}>{item.order_count}</td>
                                <td style={{ textAlign: 'right', color: '#dc2626' }}>{formatPrice(item.total_discount)}</td>
                                <td style={{ textAlign: 'right', color: '#f97316' }}>{formatPrice(item.total_shipping)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                        Không có dữ liệu trong khoảng thời gian này
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
