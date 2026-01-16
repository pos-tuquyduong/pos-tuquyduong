/**
 * Orders.jsx - Quản lý đơn hàng
 * Tính năng:
 * - Xem danh sách đơn hàng theo ngày
 * - Click xem chi tiết đơn (popup)
 * - In hóa đơn từ chi tiết
 * - Xác nhận thanh toán nợ (TM/CK)
 */
import { useState, useEffect } from 'react';
import { ordersApi } from '../utils/api';
import { Eye, Printer, X, Check, CreditCard, Banknote } from 'lucide-react';
import InvoicePrint from '../components/InvoicePrint';

export default function Orders() {
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

  useEffect(() => {
    loadOrders();
    loadInvoiceSettings();
  }, [date]);

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

  const formatPrice = (p) => (p || 0).toLocaleString() + 'đ';
  const formatTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' 
  });
  const formatDateTime = (d) => new Date(d).toLocaleString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh' 
  });

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

  const handlePrintInvoice = () => {
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
                    <th>Mã đơn</th>
                    <th>Giờ</th>
                    <th>Khách hàng</th>
                    <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ textAlign: 'center' }}>Thanh toán</th>
                    <th style={{ textAlign: 'center' }}>TT Nợ</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '60px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
    </>
  );
}
