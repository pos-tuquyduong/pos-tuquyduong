/**
 * Orders.jsx - Quản lý đơn hàng
 * Tính năng:
 * - Xem danh sách đơn hàng theo ngày
 * - Click xem chi tiết đơn (popup)
 * - In hóa đơn từ chi tiết
 * - Xác nhận thanh toán nợ (TM/CK)
 * - Sort theo các cột
 * - Filter theo trạng thái thanh toán
 * - Xóa/Hủy đơn (Owner only)
 */
import { useState, useEffect } from 'react';
import { ordersApi, productsApi } from '../utils/api';
import { Eye, Printer, X, Check, CreditCard, Banknote, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import InvoicePrint from '../components/InvoicePrint';
import { useAuth } from '../contexts/AuthContext';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  // State cho popup
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({});
  
  // State cho xác nhận thanh toán nợ
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  // State cho sort
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  // State cho filter
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'paid' | 'pending' | 'partial' | 'cancelled'
  const [searchCode, setSearchCode] = useState(''); // Tìm theo mã đơn
  const [filterProduct, setFilterProduct] = useState(''); // Lọc theo SP
  const [productsList, setProductsList] = useState([]);

  // State cho tab sự cố
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'damages'
  const [damages, setDamages] = useState([]);
  const [loadingDamages, setLoadingDamages] = useState(false);
  
  // State cho modal xử lý sự cố
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageForm, setDamageForm] = useState({
    order_id: null, items: [], product_code: '', quantity: 1,
    reason: 'damaged', reason_note: '', action: 'refund', refund_amount: 0
  });
  const [submittingDamage, setSubmittingDamage] = useState(false);

  // State cho modal xóa/hủy
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [deleteType, setDeleteType] = useState('cancel'); // 'cancel' | 'delete'
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadOrders();
    loadInvoiceSettings();
  }, [date]);

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { if (activeTab === 'damages') loadDamages(); }, [activeTab]);

  const loadProducts = async () => {
    try {
      const data = await productsApi.list();
      setProductsList(data || []);
    } catch (err) { console.error('Load products error:', err); }
  };

  const loadDamages = async () => {
    setLoadingDamages(true);
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/damages', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDamages(data.logs || []);
    } catch (err) { console.error('Load damages error:', err); }
    finally { setLoadingDamages(false); }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.list({ date });
      setOrders(data.orders || []);
      setStats(data.todayStats || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceSettings = async () => {
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInvoiceSettings(data.data);
      }
    } catch (err) {
      console.error('Load settings error:', err);
    }
  };

  // === SORT & FILTER ===
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ChevronsUpDown size={14} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // Sort & filter orders
  const getFilteredAndSortedOrders = () => {
    let result = [...orders];
    
    // Search theo mã đơn
    if (searchCode.trim()) {
      const search = searchCode.trim().toLowerCase();
      result = result.filter(o => 
        (o.code || '').toLowerCase().includes(search) ||
        (o.customer_phone || '').includes(search) ||
        (o.customer_name || '').toLowerCase().includes(search)
      );
    }
    
    // Filter theo trạng thái
    if (filterStatus !== 'all') {
      if (filterStatus === 'cancelled') {
        result = result.filter(o => o.status === 'cancelled');
      } else {
        result = result.filter(o => o.payment_status === filterStatus && o.status !== 'cancelled');
      }
    }

    // Filter theo sản phẩm
    if (filterProduct) {
      result = result.filter(o => (o.items || []).some(item => item.product_code === filterProduct));
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'code':
          valA = a.code || '';
          valB = b.code || '';
          break;
        case 'customer_name':
          valA = a.customer_name || '';
          valB = b.customer_name || '';
          break;
        case 'total':
          valA = a.total || 0;
          valB = b.total || 0;
          break;
        case 'payment_status':
          valA = a.payment_status || '';
          valB = b.payment_status || '';
          break;
        case 'created_at':
        default:
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
      }
      
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  };

  // === XÓA / HỦY ĐƠN ===
  const handleOpenDeleteModal = (order, e) => {
    e.stopPropagation();
    setDeleteOrder(order);
    setDeleteType(order.status === 'cancelled' ? 'delete' : 'cancel');
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteOrder) return;
    
    // Double confirm cho xóa hẳn
    if (deleteType === 'delete') {
      const confirmed = window.confirm(
        `⚠️ XÓA VĨNH VIỄN đơn #${deleteOrder.code}?\n\nHành động này KHÔNG THỂ hoàn tác!`
      );
      if (!confirmed) return;
    }
    
    setDeleting(true);
    try {
      if (deleteType === 'delete') {
        await ordersApi.delete(deleteOrder.id);
      } else {
        await ordersApi.cancel(deleteOrder.id, deleteReason || 'Hủy đơn');
      }
      
      setShowDeleteModal(false);
      setDeleteOrder(null);
      loadOrders(); // Reload
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';
  const formatTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' 
  });
  const formatDateTime = (d) => new Date(d).toLocaleString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh' 
  });

  // === DAMAGE HANDLING ===
  const DAMAGE_REASONS = {
    'damaged': 'Hỏng khi vận chuyển', 'wrong_product': 'Giao sai sản phẩm',
    'rejected': 'Khách từ chối nhận', 'quality': 'Chất lượng không đạt', 'other': 'Lý do khác'
  };
  const DAMAGE_ACTIONS = { 'refund': 'Hoàn tiền', 'return_stock': 'Hoàn kho SX', 'none': 'Chỉ ghi nhận' };

  const openDamageModal = (order) => {
    const firstItem = order.items?.[0];
    setDamageForm({
      order_id: order.id, order_code: order.code, items: order.items || [],
      product_code: firstItem?.product_code || '', quantity: 1, max_qty: firstItem?.quantity || 1,
      reason: 'damaged', reason_note: '', action: 'refund', 
      refund_amount: (firstItem?.unit_price || 0) * 1
    });
    setShowDamageModal(true);
  };

  const submitDamage = async () => {
    if (!damageForm.product_code || !damageForm.quantity || !damageForm.action) {
      alert('Vui lòng điền đầy đủ thông tin'); return;
    }
    setSubmittingDamage(true);
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/damages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          order_id: damageForm.order_id, product_code: damageForm.product_code,
          quantity: damageForm.quantity, reason: damageForm.reason,
          reason_note: damageForm.reason_note, action: damageForm.action,
          refund_amount: damageForm.action === 'refund' ? damageForm.refund_amount : 0,
          return_to_stock: damageForm.action === 'return_stock'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowDamageModal(false);
        setShowDetailModal(false);
      } else alert(data.error || 'Có lỗi xảy ra');
    } catch (err) { alert('Lỗi: ' + err.message); }
    finally { setSubmittingDamage(false); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { bg: '#dcfce7', color: '#166534', text: 'Hoàn thành' },
      cancelled: { bg: '#fee2e2', color: '#dc2626', text: 'Đã hủy' },
      refund_pending: { bg: '#fef3c7', color: '#b45309', text: 'Chờ hoàn tiền' },
      refunded: { bg: '#dbeafe', color: '#1d4ed8', text: 'Đã hoàn tiền' }
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#64748b', text: status };
    return (
      <span style={{ 
        background: s.bg, color: s.color, 
        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' 
      }}>
        {s.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      paid: { bg: '#dcfce7', color: '#166534', text: 'Đã TT' },
      pending: { bg: '#fef3c7', color: '#b45309', text: 'Chưa TT' },
      partial: { bg: '#dbeafe', color: '#1d4ed8', text: 'TT một phần' }
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#64748b', text: status || 'N/A' };
    return (
      <span style={{ 
        background: s.bg, color: s.color, 
        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' 
      }}>
        {s.text}
      </span>
    );
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return '💵';
      case 'transfer': return '🏦';
      case 'balance': return '💰';
      case 'debt': return '📝';
      default: return '💳';
    }
  };

  const handleViewDetail = async (order) => {
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch(`/api/pos/orders/${order.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedOrder(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Load order detail error:', err);
      setSelectedOrder(order);
      setShowDetailModal(true);
    }
  };

  const handlePrintInvoice = async () => {
    // Fetch địa chỉ & số dư khách hàng (nếu có) để hiển thị trên hóa đơn
    if (selectedOrder?.customer_phone) {
      try {
        const token = localStorage.getItem('pos_token');
        const res = await fetch(`/api/pos/v2/customers/${selectedOrder.customer_phone}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const custData = await res.json();
          setSelectedOrder(prev => ({
            ...prev,
            customer_address: custData.address || '',
            customer_balance: custData.balance || 0,
            customer_type: custData.customer_type || '',
            customer_note: custData.discount_note || '',
          }));
        }
      } catch (err) {
        console.warn('Fetch customer address error:', err);
      }
    }
    setShowDetailModal(false);
    setShowInvoiceModal(true);
  };

  const openPayDebtModal = () => {
    setPaymentMethod('cash');
    setShowDetailModal(false);
    setShowPayDebtModal(true);
  };

  // Xác nhận thanh toán nợ
  const handleConfirmPayDebt = async () => {
    if (!selectedOrder) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch(`/api/pos/orders/${selectedOrder.id}/pay-debt`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          amount: selectedOrder.debt_amount
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Đã xác nhận thanh toán thành công!');
        setShowPayDebtModal(false);
        setSelectedOrder(null);
        loadOrders();
      } else {
        alert('❌ Lỗi: ' + (data.error || 'Không thể xác nhận thanh toán'));
      }
    } catch (err) {
      console.error('Pay debt error:', err);
      alert('❌ Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">📦 Đơn hàng</h1>
        <input 
          type="date" 
          className="input" 
          style={{ width: 'auto' }} 
          value={date} 
          onChange={e => setDate(e.target.value)} 
        />
      </header>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '1rem' }}>
        {[
          { key: 'orders', label: '📋 Đơn hàng' },
          { key: 'damages', label: '⚠️ Lịch sử sự cố' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '0.75rem 1.5rem', background: 'none', border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-2px', color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === tab.key ? '600' : '400', cursor: 'pointer', fontSize: '1rem'
          }}>{tab.label}</button>
        ))}
      </div>
      
      {/* TAB: ĐƠN HÀNG */}
      {activeTab === 'orders' && (
      <div className="page-content">
        {/* Stats */}
        <div className="grid grid-3 mb-2">
          <div className="stat-card">
            <div className="stat-label">Tổng đơn</div>
            <div className="stat-value">{stats.order_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Doanh thu</div>
            <div className="stat-value text-success">{formatPrice(stats.total_revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Chờ thanh toán</div>
            <div className="stat-value text-warning">
              {orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'partial').length}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tất cả', count: orders.length },
            { key: 'paid', label: '✓ Đã TT', count: orders.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled').length },
            { key: 'pending', label: 'Chưa TT', count: orders.filter(o => o.payment_status === 'pending' && o.status !== 'cancelled').length },
            { key: 'partial', label: 'Nợ', count: orders.filter(o => o.payment_status === 'partial' && o.status !== 'cancelled').length },
            { key: 'cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '16px',
                border: filterStatus === f.key ? 'none' : '1px solid #ddd',
                background: filterStatus === f.key ? '#3b82f6' : 'white',
                color: filterStatus === f.key ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: filterStatus === f.key ? '600' : '400'
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Search Box + Product Filter */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="🔍 Tìm mã đơn, SĐT, tên..." value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', maxWidth: '250px' }}
          />
          <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', background: 'white' }}>
            <option value="">📦 Tất cả SP</option>
            {productsList.map(p => <option key={p.code || p.unique_id} value={p.code}>{p.code} - {p.name}</option>)}
          </select>
          {(searchCode || filterProduct) && (
            <button onClick={() => { setSearchCode(''); setFilterProduct(''); }}
              style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
              ✕ Xóa lọc
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="card">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Không có đơn hàng nào trong ngày này
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort('code')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Mã đơn {getSortIcon('code')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('created_at')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Giờ {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('customer_name')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Khách hàng {getSortIcon('customer_name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('total')} 
                      style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        Tổng tiền {getSortIcon('total')}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center' }}>Thanh toán</th>
                    <th 
                      onClick={() => handleSort('payment_status')} 
                      style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        TT Nợ {getSortIcon('payment_status')}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: user?.role === 'owner' ? '100px' : '60px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAndSortedOrders().map(o => (
                    <tr 
                      key={o.id} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewDetail(o)}
                    >
                      <td><strong>{o.code}</strong></td>
                      <td>{formatTime(o.created_at)}</td>
                      <td>
                        <div>{o.customer_name || 'Khách lẻ'}</div>
                        {o.customer_phone && (
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{o.customer_phone}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatPrice(o.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span title={o.payment_method}>{getPaymentIcon(o.payment_method)}</span>
                        {o.debt_amount > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#ea580c' }}>
                            Nợ: {formatPrice(o.debt_amount)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getPaymentStatusBadge(o.payment_status)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getStatusBadge(o.status)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewDetail(o); }}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 8px',
                              cursor: 'pointer'
                            }}
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          {user?.role === 'owner' && (
                            <button
                              onClick={(e) => handleOpenDeleteModal(o, e)}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                cursor: 'pointer'
                              }}
                              title="Xóa/Hủy đơn"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* TAB: LỊCH SỬ SỰ CỐ */}
      {activeTab === 'damages' && (
        <div className="page-content">
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>📋 Lịch sử xử lý sự cố</h3>
            {loadingDamages ? <div className="loading">Đang tải...</div> 
            : damages.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Chưa có sự cố nào</div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr><th>Ngày</th><th>Đơn</th><th>SP</th><th>SL</th><th>Lý do</th><th>Xử lý</th><th>Hoàn tiền</th><th>Người XL</th></tr></thead>
                  <tbody>
                    {damages.map(d => (
                      <tr key={d.id}>
                        <td>{new Date(d.created_at).toLocaleDateString('vi-VN')}</td>
                        <td><strong>{d.order_code}</strong></td>
                        <td>{d.product_code}</td>
                        <td>{d.quantity}</td>
                        <td>{DAMAGE_REASONS[d.reason] || d.reason}</td>
                        <td>{DAMAGE_ACTIONS[d.action] || d.action}</td>
                        <td>{d.refund_amount > 0 ? formatPrice(d.refund_amount) : '-'}</td>
                        <td>{d.processed_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Modal Chi tiết đơn hàng */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {showDetailModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                📦 Đơn hàng #{selectedOrder.code}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              {/* Thông tin chung */}
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Thời gian</div>
                    <div style={{ fontWeight: '500' }}>{formatDateTime(selectedOrder.created_at)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Trạng thái</div>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Khách hàng</div>
                    <div style={{ fontWeight: '500' }}>{selectedOrder.customer_name || 'Khách lẻ'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>SĐT</div>
                    <div>{selectedOrder.customer_phone || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Nhân viên</div>
                    <div>{selectedOrder.created_by || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>TT Thanh toán</div>
                    <div>{getPaymentStatusBadge(selectedOrder.payment_status)}</div>
                  </div>
                </div>
              </div>

              {/* Sản phẩm */}
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', marginTop: 0 }}>🛒 Sản phẩm</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>Sản phẩm</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px', width: '50px' }}>SL</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', width: '90px' }}>Đơn giá</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', width: '100px' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ fontWeight: '500' }}>{item.product_code}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.product_name}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 4px' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '8px 4px' }}>{formatPrice(item.unit_price)}</td>
                        <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: '500' }}>
                          {formatPrice(item.total_price || item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thanh toán */}
              <div style={{ 
                background: '#f0fdf4', 
                borderRadius: '8px', 
                padding: '1rem'
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: 0 }}>💰 Thanh toán</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Tạm tính:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#dc2626' }}>
                    <span>Giảm giá:</span>
                    <span>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  borderTop: '2px solid #86efac',
                  paddingTop: '8px',
                  marginTop: '8px',
                  marginBottom: '12px'
                }}>
                  <span>Tổng cộng:</span>
                  <span style={{ color: '#16a34a' }}>{formatPrice(selectedOrder.total)}</span>
                </div>

                {/* Chi tiết thanh toán */}
                <div style={{ borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
                  {selectedOrder.balance_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>💰 Trừ số dư:</span>
                      <span>{formatPrice(selectedOrder.balance_amount)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.cash_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>💵 Tiền mặt:</span>
                      <span>{formatPrice(selectedOrder.cash_amount)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.transfer_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>🏦 Chuyển khoản:</span>
                      <span>{formatPrice(selectedOrder.transfer_amount)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.debt_amount > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '4px',
                      padding: '8px',
                      background: '#fef3c7',
                      borderRadius: '6px',
                      color: '#b45309',
                      fontWeight: 'bold'
                    }}>
                      <span>📝 Còn nợ:</span>
                      <span>{formatPrice(selectedOrder.debt_amount)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.due_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                      <span>📅 Hạn thanh toán:</span>
                      <span>{new Date(selectedOrder.due_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              {selectedOrder.notes && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#fefce8', 
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <strong>📝 Ghi chú:</strong> {selectedOrder.notes}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Đóng
              </button>
              
              {/* Nút xác nhận thanh toán nợ - chỉ hiện khi còn nợ */}
              {selectedOrder.debt_amount > 0 && selectedOrder.payment_status !== 'paid' && (
                <button
                  onClick={openPayDebtModal}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '0.75rem',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={18} />
                  Xác nhận TT
                </button>
              )}
              
              {/* Nút xử lý sự cố - chỉ Manager/Owner */}
              {selectedOrder.status !== 'cancelled' && (user?.role === 'owner' || user?.role === 'manager') && (
                <button onClick={() => openDamageModal(selectedOrder)} style={{
                  flex: 1, minWidth: '120px', padding: '0.75rem',
                  background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                  <AlertTriangle size={18} /> Xử lý sự cố
                </button>
              )}
              
              <button
                onClick={handlePrintInvoice}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.75rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Printer size={18} />
                In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Modal Xác nhận thanh toán nợ */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {showPayDebtModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f97316',
              color: 'white'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                ✓ Xác nhận thanh toán nợ
              </h2>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                  Đơn hàng #{selectedOrder.code}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f97316' }}>
                  {formatPrice(selectedOrder.debt_amount)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                  Khách: {selectedOrder.customer_name || 'Khách lẻ'}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Phương thức thanh toán:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: '2px solid',
                      borderColor: paymentMethod === 'cash' ? '#22c55e' : '#e2e8f0',
                      background: paymentMethod === 'cash' ? '#f0fdf4' : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Banknote size={24} color={paymentMethod === 'cash' ? '#22c55e' : '#666'} />
                    <span style={{ fontWeight: paymentMethod === 'cash' ? 'bold' : 'normal' }}>
                      Tiền mặt
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: '2px solid',
                      borderColor: paymentMethod === 'transfer' ? '#3b82f6' : '#e2e8f0',
                      background: paymentMethod === 'transfer' ? '#eff6ff' : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CreditCard size={24} color={paymentMethod === 'transfer' ? '#3b82f6' : '#666'} />
                    <span style={{ fontWeight: paymentMethod === 'transfer' ? 'bold' : 'normal' }}>
                      Chuyển khoản
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => { setShowPayDebtModal(false); setShowDetailModal(true); }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPayDebt}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Đang xử lý...' : '✓ Xác nhận đã thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal In hóa đơn */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Modal Xóa/Hủy đơn hàng (Owner only) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {showDeleteModal && deleteOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowDeleteModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>🗑️ Xử lý đơn hàng #{deleteOrder.code}</h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ padding: '1rem' }}>
              {/* Chọn loại xử lý */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                  Chọn cách xử lý:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {deleteOrder?.status !== 'cancelled' && (
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: deleteType === 'cancel' ? '2px solid #f59e0b' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: deleteType === 'cancel' ? '#fef3c7' : 'white'
                  }}>
                    <input 
                      type="radio" 
                      name="deleteType" 
                      checked={deleteType === 'cancel'}
                      onChange={() => setDeleteType('cancel')}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>❌ Hủy đơn (giữ lịch sử)</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Đơn sẽ được đánh dấu đã hủy</div>
                    </div>
                  </label>
                  )}
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: deleteType === 'delete' ? '2px solid #ef4444' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: deleteType === 'delete' ? '#fee2e2' : 'white'
                  }}>
                    <input 
                      type="radio" 
                      name="deleteType" 
                      checked={deleteType === 'delete'}
                      onChange={() => setDeleteType('delete')}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>🗑️ Xóa hẳn (không khôi phục)</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Xóa vĩnh viễn khỏi hệ thống</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Lý do (chỉ khi hủy) */}
              {deleteType === 'cancel' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Lý do hủy:
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="VD: Khách hủy, nhập sai..."
                    value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)}
                  />
                </div>
              )}

              {/* Thông báo hoàn tiền/kho */}
              <div style={{ 
                background: '#fef3c7', 
                padding: '0.75rem', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={16} color="#b45309" />
                  <strong style={{ color: '#b45309' }}>Sẽ thực hiện:</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                  {deleteOrder.balance_amount > 0 && (
                    <li>Hoàn <strong>{formatPrice(deleteOrder.balance_amount)}</strong> số dư cho {deleteOrder.customer_name}</li>
                  )}
                  <li>Hoàn tồn kho SX (các sản phẩm trong đơn)</li>
                </ul>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button 
                  style={{ padding: '0.75rem 1.5rem', background: deleteType === 'delete' ? '#ef4444' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xử lý...' : (deleteType === 'delete' ? '🗑️ Xóa hẳn' : '❌ Hủy đơn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && selectedOrder && (
        <InvoicePrint
          order={selectedOrder}
          settings={invoiceSettings}
          onClose={() => setShowInvoiceModal(false)}
          onPrintComplete={() => {
            setShowInvoiceModal(false);
            loadOrders();
          }}
        />
      )}

      {/* Modal Xử lý sự cố */}
      {showDamageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>⚠️ Xử lý sự cố - {damageForm.order_code}</h3>
              <button onClick={() => setShowDamageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <div style={{ padding: '1rem' }}>
              {/* Chọn SP */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Sản phẩm *</label>
                <select value={damageForm.product_code} onChange={(e) => {
                  const item = damageForm.items?.find(i => i.product_code === e.target.value);
                  setDamageForm({ ...damageForm, product_code: e.target.value, max_qty: item?.quantity || 1, 
                    quantity: 1, refund_amount: item?.unit_price || 0 });
                }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                  {(damageForm.items || []).map(item => (
                    <option key={item.product_code} value={item.product_code}>{item.product_code} - {item.product_name} (SL: {item.quantity})</option>
                  ))}
                </select>
              </div>
              {/* Số lượng */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Số lượng * (tối đa {damageForm.max_qty})</label>
                <input type="number" min="1" max={damageForm.max_qty} value={damageForm.quantity}
                  onChange={(e) => {
                    const qty = Math.min(parseInt(e.target.value) || 1, damageForm.max_qty);
                    const item = damageForm.items?.find(i => i.product_code === damageForm.product_code);
                    setDamageForm({ ...damageForm, quantity: qty, refund_amount: (item?.unit_price || 0) * qty });
                  }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }} />
              </div>
              {/* Lý do */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lý do *</label>
                <select value={damageForm.reason} onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                  {Object.entries(DAMAGE_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {/* Phương án */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phương án xử lý *</label>
                <select value={damageForm.action} onChange={(e) => setDamageForm({ ...damageForm, action: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                  {Object.entries(DAMAGE_ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {/* Số tiền hoàn */}
              {damageForm.action === 'refund' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Số tiền hoàn</label>
                  <input type="number" min="0" value={damageForm.refund_amount}
                    onChange={(e) => setDamageForm({ ...damageForm, refund_amount: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                </div>
              )}
              {/* Ghi chú */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Ghi chú</label>
                <textarea value={damageForm.reason_note} onChange={(e) => setDamageForm({ ...damageForm, reason_note: e.target.value })}
                  rows={2} placeholder="Mô tả thêm..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }} />
              </div>
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowDamageModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button onClick={submitDamage} disabled={submittingDamage} style={{ flex: 1, padding: '0.75rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {submittingDamage ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
