// Reports.jsx - Phase B: Thêm báo cáo chiết khấu + shipping + Gói SP
import { useState, useEffect, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState('daily'); // daily, discount, packages

  // Packages state
  const [pkgData, setPkgData] = useState([]);
  const [pkgFilter, setPkgFilter] = useState('all');
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgOpen, setPkgOpen] = useState({});
  const [pkgDetailOpen, setPkgDetailOpen] = useState({});
  const [pkgDeliveries, setPkgDeliveries] = useState({});

  useEffect(() => { 
    if (activeTab === 'daily') {
      loadReport(); 
    } else if (activeTab === 'discount') {
      loadDiscountReport();
    } else if (activeTab === 'packages') {
      loadPackageData();
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

  const loadPackageData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/packages/customer-packages/all', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) setPkgData(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDeliveries = async (cpId) => {
    if (pkgDeliveries[cpId]) return;
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch(`/api/pos/packages/customer-packages/${cpId}/deliveries`, { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) setPkgDeliveries(prev => ({ ...prev, [cpId]: data.data }));
    } catch (err) { console.error(err); }
  };

  const pkgStats = useMemo(() => {
    const t = pkgData.length, a = pkgData.filter(p => p.status === 'active').length;
    const c = pkgData.filter(p => p.status === 'completed').length;
    const n = pkgData.filter(p => { const pct = Math.round((p.delivered_qty / p.total_qty) * 100); return pct >= 80 && pct < 100; }).length;
    const rev = pkgData.reduce((s, p) => s + (p.pkg_price || 0), 0);
    const tSP = pkgData.reduce((s, p) => s + p.total_qty, 0);
    const dSP = pkgData.reduce((s, p) => s + p.delivered_qty, 0);
    return { t, a, c, n, rev, tSP, dSP, pct: tSP > 0 ? Math.round((dSP / tSP) * 100) : 0, custs: new Set(pkgData.map(p => p.customer_phone)).size };
  }, [pkgData]);

  const pkgGrouped = useMemo(() => {
    let data = [...pkgData];
    if (pkgFilter === 'active') data = data.filter(p => p.status === 'active');
    else if (pkgFilter === 'near') data = data.filter(p => { const pct = Math.round((p.delivered_qty / p.total_qty) * 100); return pct >= 80 && pct < 100; });
    else if (pkgFilter === 'done') data = data.filter(p => p.status === 'completed');
    if (pkgSearch) { const s = pkgSearch.toLowerCase(); data = data.filter(p => (p.customer_phone || '').includes(s) || (p.pkg_name || '').toLowerCase().includes(s)); }
    const map = {};
    data.forEach(p => { const ph = p.customer_phone; if (!map[ph]) map[ph] = { phone: ph, pkgs: [], rev: 0 }; map[ph].pkgs.push(p); map[ph].rev += (p.pkg_price || 0); });
    return Object.values(map).sort((a, b) => b.pkgs.length - a.pkgs.length);
  }, [pkgData, pkgFilter, pkgSearch]);

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

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
          <button 
            className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('packages')}
            style={{ background: activeTab === 'packages' ? '#7c3aed' : undefined, borderColor: activeTab === 'packages' ? '#7c3aed' : undefined }}
          >
            📦 Gói SP
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

        {/* Tab: Gói sản phẩm */}
        {activeTab === 'packages' && (
          loading ? <div className="loading">Đang tải...</div> : (
            <>
              <div className="grid grid-4 mb-2">
                <div className="stat-card"><div className="stat-label">📦 Tổng gói</div><div className="stat-value" style={{ color: '#7c3aed' }}>{pkgStats.t}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pkgStats.custs} khách</div></div>
                <div className="stat-card"><div className="stat-label">🚚 Đang giao</div><div className="stat-value" style={{ color: '#3b82f6' }}>{pkgStats.a}</div>{pkgStats.n > 0 && <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>⚡ {pkgStats.n} sắp hết</div>}</div>
                <div className="stat-card"><div className="stat-label">✅ Hoàn thành</div><div className="stat-value text-success">{pkgStats.c}</div></div>
                <div className="stat-card"><div className="stat-label">💰 DT gói</div><div className="stat-value text-danger">{formatPrice(pkgStats.rev)}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pkgStats.dSP}/{pkgStats.tSP} SP</div></div>
              </div>

              <div className="card mb-1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#7c3aed' }}>📈 Tiến độ</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f3f4f6' }}><div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #7c3aed, #c084fc)', width: `${pkgStats.pct}%` }} /></div>
                <strong style={{ color: '#7c3aed' }}>{pkgStats.pct}%</strong>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{pkgStats.dSP}/{pkgStats.tSP}</span>
              </div>

              <div className="card mb-1" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={pkgSearch} onChange={e => setPkgSearch(e.target.value)} placeholder="🔍 Tìm SĐT, gói..." className="input" style={{ flex: '1 1 180px', maxWidth: 240 }} />
                {[{ k: 'all', l: 'Tất cả' }, { k: 'active', l: 'Đang giao' }, { k: 'near', l: '⚡ Sắp hết' }, { k: 'done', l: '✅ Xong' }].map(f => (
                  <button key={f.k} onClick={() => setPkgFilter(f.k)} className={`btn ${pkgFilter === f.k ? 'btn-primary' : 'btn-outline'}`}
                    style={pkgFilter === f.k ? { background: '#7c3aed', borderColor: '#7c3aed' } : {}}>{f.l}</button>
                ))}
              </div>

              {pkgGrouped.length === 0 ? <div className="card" style={{ textAlign: 'center', color: '#999' }}>Không có gói nào</div> : pkgGrouped.map(cust => {
                const isO = pkgOpen[cust.phone] !== false;
                const cD = cust.pkgs.reduce((s, p) => s + p.delivered_qty, 0), cT = cust.pkgs.reduce((s, p) => s + p.total_qty, 0), cP = cT > 0 ? Math.round((cD / cT) * 100) : 0;
                return (
                  <div key={cust.phone} className="card mb-1" style={{ padding: 0, overflow: 'hidden' }}>
                    <div onClick={() => setPkgOpen(p => ({ ...p, [cust.phone]: !isO }))} style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isO ? 'rgba(124,58,237,0.04)' : 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{(cust.phone || '').slice(-2)}</div>
                        <div><strong>{cust.phone}</strong> <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 10, background: '#f3e8ff', color: '#7c3aed', fontWeight: 600 }}>{cust.pkgs.length} gói</span></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed' }}>{cP}%</span>
                        <div style={{ width: 60, height: 4, borderRadius: 2, background: '#f3f4f6' }}><div style={{ width: `${cP}%`, height: '100%', borderRadius: 2, background: '#7c3aed' }} /></div>
                        <strong style={{ color: '#B91C1C' }}>{formatPrice(cust.rev)}</strong>
                        <span style={{ color: '#999', transform: isO ? 'rotate(180deg)' : '', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                    </div>
                    {isO && <div style={{ padding: '0.5rem 0.75rem' }}>
                      {cust.pkgs.map(pkg => {
                        const pct = Math.round((pkg.delivered_qty / pkg.total_qty) * 100), rem = pkg.total_qty - pkg.delivered_qty;
                        const done = pct >= 100, near = pct >= 80 && !done, bc = done ? '#22c55e' : near ? '#f59e0b' : '#7c3aed';
                        const dO = pkgDetailOpen[pkg.id], dels = pkgDeliveries[pkg.id] || [];
                        return (
                          <div key={pkg.id} style={{ margin: '3px 0', borderRadius: 8, border: `1.5px solid ${done ? '#bbf7d0' : near ? '#fde68a' : '#e9d5ff'}`, overflow: 'hidden' }}>
                            <div onClick={() => { setPkgDetailOpen(p => ({ ...p, [pkg.id]: !dO })); if (!dO) loadDeliveries(pkg.id); }}
                              style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: done ? '#f0fdf4' : near ? '#fffbeb' : '#faf5ff' }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>📦 {pkg.pkg_name} </span>
                                <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 10, fontWeight: 600, background: done ? '#dcfce7' : near ? '#fef3c7' : '#dbeafe', color: done ? '#166534' : near ? '#92400e' : '#1e40af' }}>{done ? '✅' : near ? '⚡' : '🔄'}</span>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 1 }}>{fmtDate(pkg.created_at)} · {formatPrice(pkg.pkg_price)}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <strong style={{ color: bc }}>{pct}%</strong>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: '#f3f4f6' }}><div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 2, background: bc }} /></div>
                                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{pkg.delivered_qty}/{pkg.total_qty}</span>
                              </div>
                            </div>
                            {near && <div style={{ padding: '2px 10px', background: '#fffbeb', fontSize: '0.7rem', color: '#92400e' }}>⚡ Còn {rem} — nhắc gia hạn</div>}
                            {dO && <div style={{ padding: '0.4rem 0.75rem', background: '#fafafa', borderTop: '1px solid #f3f4f6', fontSize: '0.8rem' }}>
                              {dels.length === 0 ? <div style={{ color: '#999', textAlign: 'center', padding: '0.3rem' }}>Chưa giao</div> : dels.map((d, j) => (
                                <div key={j} style={{ display: 'flex', gap: 5, padding: '2px 0', borderBottom: j < dels.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: '0.75rem' }}>
                                  <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>#{j + 1}</span>
                                  <span>{fmtDate(d.created_at)}</span>
                                  <span style={{ flex: 1, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.items}</span>
                                  <strong style={{ color: '#7c3aed' }}>{d.total_qty}</strong>
                                </div>
                              ))}
                            </div>}
                          </div>
                        );
                      })}
                    </div>}
                  </div>
                );
              })}
            </>
          )
        )}
      </div>
    </>
  );
}
