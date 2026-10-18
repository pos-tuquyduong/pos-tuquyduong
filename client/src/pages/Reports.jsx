// Reports.jsx - Phase B: Thêm báo cáo chiết khấu + shipping + Gói SP
import { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, reportsApi } from '../utils/api';
import DoiSoat from '../components/DoiSoat';
import { useAuth } from '../contexts/AuthContext';
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
  // GOI-1 (Q3): /reports?tab=packages&goi=<mã gói> mở thẳng tab Gói SP, lọc sẵn gói đó + "Đang giao" (khớp "🔒 N KH" ở Cài đặt).
  const [searchParams, setSearchParams] = useSearchParams();
  const goiLoc = Number(searchParams.get('goi')) || null;
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'packages' ? 'packages' : 'daily'); // daily, discount, packages

  // GOI-2 (Q1, Q2): máy chủ gom MỖI KHÁCH MỘT DÒNG (`theo-khach`) + lọc Đang dùng / Lâu chưa lấy / Đã xong; ?goi= (từ Cài đặt) và ?phone=
  // (từ chi tiết khách) lọc sẵn; tìm tên / SĐT tại màn. Gói: Đã xong (lấy đủ) · Đã kết thúc (chủ quán kết thúc, Q4).
  const sdtLoc = searchParams.get('phone') || null;
  const [pkgData, setPkgData] = useState([]);
  const [pkgFilter, setPkgFilter] = useState('dang_dung');
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgKhachOpen, setPkgKhachOpen] = useState({});
  const [pkgDetailOpen, setPkgDetailOpen] = useState({});
  const [pkgDeliveries, setPkgDeliveries] = useState({});
  const [ketThuc, setKetThuc] = useState(null);   // hộp "Kết thúc gói…": { cp, hoan, lyDo, duKien, loiDuKien, loi }

  useEffect(() => {
    if (activeTab === 'daily') {
      loadReport();
    } else if (activeTab === 'discount') {
      loadDiscountReport();
    } else if (activeTab === 'packages') {
      loadPackageData();
    }
  }, [date, dateRange, activeTab, pkgFilter, goiLoc, sdtLoc]);

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
      const qs = new URLSearchParams({ loc: pkgFilter });
      if (goiLoc) qs.set('goi', goiLoc);
      if (sdtLoc) qs.set('phone', sdtLoc);
      const data = await api.get(`/packages/customer-packages/theo-khach?${qs}`);
      if (data.success) setPkgData(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDeliveries = async (cpId) => {
    if (pkgDeliveries[cpId]) return;
    try {
      const data = await api.get(`/packages/customer-packages/${cpId}/deliveries`);
      if (data.success) setPkgDeliveries(prev => ({ ...prev, [cpId]: data.data }));
    } catch (err) { console.error(err); }
  };

  // GOI-2 (Q4): "Kết thúc gói…" — hộp 2 lựa chọn + lý do. Số tiền hoàn do máy chủ tính, hiện TRƯỚC khi xác nhận và gửi lại để máy chủ
  // đối chiếu (có người lấy hàng giữa chừng → 409, hiện số mới, bắt chọn lại). Máy chủ chặn quyền, trạng thái, hai người cùng bấm.
  const taiDuKien = async (cp) => {
    try {
      const r = await api.get(`/packages/customer-packages/${cp}/hoan-du-kien`);
      setKetThuc(kt => kt?.cp === cp ? { ...kt, duKien: r.data, loiDuKien: '' } : kt);
    } catch (err) { setKetThuc(kt => kt?.cp === cp ? { ...kt, duKien: null, loiDuKien: err.message } : kt); }
  };
  const moKetThuc = (pkg) => { setKetThuc({ cp: pkg.id, hoan: null, lyDo: '', duKien: null, loiDuKien: '', loi: '' }); taiDuKien(pkg.id); };
  const xacNhanKetThuc = async () => {
    const kt = ketThuc;
    if (kt.hoan === null) return setKetThuc({ ...kt, loi: 'Chọn một trong hai cách xử lý' });
    if (!kt.lyDo.trim()) return setKetThuc({ ...kt, loi: 'Phải nhập lý do' });
    try {
      await api.put(`/packages/customer-packages/${kt.cp}/cancel`, { reason: kt.lyDo.trim(), hoan: kt.hoan, so_tien: kt.hoan ? kt.duKien?.tong : undefined });
      setKetThuc(null);
      loadPackageData();
    } catch (err) {
      setKetThuc({ ...kt, loi: err.message, hoan: err.code === 'GOI_HOAN_DOI_SO' ? null : kt.hoan });
      if (err.code === 'GOI_HOAN_DOI_SO') taiDuKien(kt.cp);
    }
  };

  const pkgStats = useMemo(() => ({
    kh: pkgData.length, goi: pkgData.reduce((s, p) => s + p.so_goi, 0), con: pkgData.reduce((s, p) => s + p.con_lai, 0), lau: pkgData.filter(p => p.lau).length,
  }), [pkgData]);

  // Tìm tên khách / SĐT trong danh sách máy chủ đã lọc.
  const pkgList = useMemo(() => {
    if (!pkgSearch) return pkgData;
    const s = pkgSearch.toLowerCase();
    return pkgData.filter(p => (p.customer_phone || '').includes(s) || (p.customer_name || '').toLowerCase().includes(s));
  }, [pkgData, pkgSearch]);
  const TRANG_THAI = { active: '🔄 Đang dùng', completed: '✅ Đã xong', cancelled: '⛔ Đã kết thúc' };

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
          <button
            className={`btn ${activeTab === 'doisoat' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('doisoat')}
          >
            🧾 Đối soát
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Tab: Đối soát (DOI-SOAT-1) — chỉ báo, không tự sửa số */}
        {activeTab === 'doisoat' && <DoiSoat />}

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
                <div className="stat-card"><div className="stat-label">👥 Khách</div><div className="stat-value" style={{ color: '#7c3aed' }}>{pkgStats.kh}</div></div>
                <div className="stat-card"><div className="stat-label">📦 Gói</div><div className="stat-value" style={{ color: '#3b82f6' }}>{pkgStats.goi}</div></div>
                <div className="stat-card"><div className="stat-label">🛍 Còn lại</div><div className="stat-value text-success">{pkgStats.con} túi</div></div>
                <div className="stat-card"><div className="stat-label">⏳ Lâu chưa lấy</div><div className="stat-value" style={{ color: pkgStats.lau ? '#f59e0b' : '#6b7280' }}>{pkgStats.lau}</div></div>
              </div>

              <div className="card mb-1" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={pkgSearch} onChange={e => setPkgSearch(e.target.value)} placeholder="🔍 Tìm tên, SĐT..." className="input" style={{ flex: '1 1 180px', maxWidth: 240 }} />
                {[{ k: 'dang_dung', l: 'Đang dùng' }, { k: 'lau', l: '⏳ Lâu chưa lấy' }, { k: 'xong', l: '✅ Đã xong / đã kết thúc' }].map(f => (
                  <button key={f.k} onClick={() => setPkgFilter(f.k)} className={`btn ${pkgFilter === f.k ? 'btn-primary' : 'btn-outline'}`}
                    style={pkgFilter === f.k ? { background: '#7c3aed', borderColor: '#7c3aed' } : {}}>{f.l}</button>
                ))}
                {goiLoc && <button onClick={() => setSearchParams({ tab: 'packages' })} className="btn btn-outline">
                  Gói: {pkgData[0]?.goi[0]?.pkg_name || '#' + goiLoc} ✕</button>}
                {sdtLoc && <button onClick={() => setSearchParams({ tab: 'packages' })} className="btn btn-outline">
                  Khách: {pkgData[0]?.customer_name || sdtLoc} ✕</button>}
              </div>

              {pkgList.length === 0 ? <div className="card" style={{ textAlign: 'center', color: '#999' }}>Không có khách nào</div> : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="table">
                    <thead><tr><th>Khách</th><th>Số gói</th><th>Còn lại</th><th>Lần lấy gần nhất</th></tr></thead>
                    <tbody>
                      {pkgList.map(kh => {
                        const mo = pkgKhachOpen[kh.customer_phone];
                        return (
                          <Fragment key={kh.customer_phone}>
                            <tr onClick={() => setPkgKhachOpen(p => ({ ...p, [kh.customer_phone]: !mo }))} style={{ cursor: 'pointer', background: kh.lau ? '#fffbeb' : undefined }}>
                              <td>
                                <Link to={`/customers?phone=${encodeURIComponent(kh.customer_phone)}`} onClick={e => e.stopPropagation()}><strong>{kh.customer_name || '—'}</strong></Link>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{kh.customer_phone}</div>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>{kh.so_goi} gói{kh.so_dang_dung !== kh.so_goi && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}> · {kh.so_dang_dung} đang dùng</span>}</td>
                              <td style={{ color: '#7c3aed', fontWeight: 700, whiteSpace: 'nowrap' }}>{kh.con_lai} túi</td>
                              <td>{kh.moc_lay ? fmtDate(kh.moc_lay) : '—'}
                                {kh.lau && <span style={{ color: '#b45309', fontWeight: 600, marginLeft: 6 }}>⏳ {Math.floor(kh.ngay_chua_lay / 30)} tháng chưa lấy</span>}</td>
                            </tr>
                            {mo && <tr><td colSpan={4} style={{ background: '#fafafa', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                              {kh.goi.map(pkg => {
                                const pct = pkg.total_qty > 0 ? Math.round((pkg.delivered_qty / pkg.total_qty) * 100) : 0;
                                const vuot = pct > 100;
                                const dO = pkgDetailOpen[pkg.id], dels = pkgDeliveries[pkg.id] || [];
                                const ngay = (t) => String(t).slice(0, 10);
                                return (
                                  <div key={pkg.id} style={{ borderBottom: '1px solid #eee', padding: '0.35rem 0' }}>
                                    <div onClick={() => { setPkgDetailOpen(p => ({ ...p, [pkg.id]: !dO })); if (!dO) loadDeliveries(pkg.id); }}
                                      style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap' }}>
                                      <strong>📦 {pkg.pkg_name}</strong>
                                      <span>mua <Link to={`/orders?code=${encodeURIComponent(pkg.order_code || '')}&ngay=${ngay(pkg.created_at)}`} onClick={e => e.stopPropagation()}>{fmtDate(pkg.created_at)}</Link></span>
                                      <span>{formatPrice(pkg.pkg_price)}</span>
                                      <span style={{ color: vuot ? '#dc2626' : '#7c3aed', fontWeight: 700, whiteSpace: 'nowrap' }}>{pkg.delivered_qty}/{pkg.total_qty} · {pct}%</span>
                                      <span>{pkg.last_delivery_at ? fmtDate(pkg.last_delivery_at) : 'chưa lấy'}</span>
                                      <span style={{ whiteSpace: 'nowrap' }}>{TRANG_THAI[pkg.status] || pkg.status}</span>
                                    </div>
                                    {dO && <div style={{ fontSize: '0.75rem', marginTop: 4, paddingLeft: 8 }}>
                                      {pkg.notes && <div style={{ color: '#92400e', whiteSpace: 'pre-line', marginBottom: 4 }}>{pkg.notes}</div>}
                                      {dels.length === 0 ? <div style={{ color: '#999' }}>Chưa giao</div> : dels.map((d, j) => (
                                        <div key={j} style={{ display: 'flex', gap: 5, padding: '2px 0' }}>
                                          <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>#{j + 1}</span>
                                          <Link to={`/orders?code=${encodeURIComponent(d.order_code)}&ngay=${ngay(d.created_at)}`}>{fmtDate(d.created_at)}</Link>
                                          <span style={{ flex: 1, color: '#666' }}>{d.items}</span>
                                          <strong style={{ color: '#7c3aed' }}>{d.total_qty}</strong>
                                        </div>
                                      ))}
                                      {hasPermission('refund_package') && pkg.status === 'active' && pkg.delivered_qty < pkg.total_qty && ketThuc?.cp !== pkg.id && (
                                        <button className="btn btn-outline" style={{ marginTop: 6, padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#dc2626' }}
                                          onClick={() => moKetThuc(pkg)}>Kết thúc gói…</button>
                                      )}
                                      {ketThuc?.cp === pkg.id && (
                                        <div style={{ marginTop: 6, padding: 8, background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, fontSize: '0.8rem' }}>
                                          <div style={{ fontWeight: 700, color: '#9a3412' }}>Kết thúc gói "{pkg.pkg_name}" — không mở lại được. Chọn một cách xử lý:</div>
                                          <label style={{ display: 'block', marginTop: 4 }}>
                                            <input type="radio" name="kt_hoan" checked={ketThuc.hoan === true} disabled={!ketThuc.duKien} onChange={() => setKetThuc({ ...ketThuc, hoan: true, loi: '' })} />
                                            {' '}Hoàn phần còn lại vào ví khách: <strong>{ketThuc.duKien ? formatPrice(ketThuc.duKien.tong) : (ketThuc.loiDuKien || 'đang tính…')}</strong>
                                          </label>
                                          <label style={{ display: 'block', marginTop: 4 }}>
                                            <input type="radio" name="kt_hoan" checked={ketThuc.hoan === false} onChange={() => setKetThuc({ ...ketThuc, hoan: false, loi: '' })} />
                                            {' '}Không hoàn tiền (khách bỏ, dùng thử, đã giao ngoài máy)
                                          </label>
                                          <input className="input" style={{ marginTop: 6, width: '100%' }} placeholder="Lý do (bắt buộc)" value={ketThuc.lyDo}
                                            onChange={e => setKetThuc({ ...ketThuc, lyDo: e.target.value, loi: '' })} />
                                          {ketThuc.loi && <div style={{ color: '#dc2626', marginTop: 4, fontWeight: 600 }}>{ketThuc.loi}</div>}
                                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                            <button className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={xacNhanKetThuc}>Xác nhận kết thúc</button>
                                            <button className="btn btn-outline" onClick={() => setKetThuc(null)}>Thôi</button>
                                          </div>
                                        </div>
                                      )}
                                    </div>}
                                  </div>
                                );
                              })}
                            </td></tr>}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}
      </div>
    </>
  );
}
