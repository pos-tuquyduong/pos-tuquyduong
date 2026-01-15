/**
 * POS - Sales Page
 * Hiển thị sản phẩm với icon/color từ SX (nhất quán 100%)
 * v2: Thêm popup xác nhận, tiền khách đưa, màn hình thành công
 * v3: Tích hợp InvoicePrint - In hóa đơn (Phase A)
 */

import { useState, useEffect } from 'react';
import { productsApi, customersApi, ordersApi } from '../utils/api';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Wallet, X, CheckCircle, Printer } from 'lucide-react';
import InvoicePrint from '../components/InvoicePrint';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [category, setCategory] = useState('all');

  // State cho popup thanh toán
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // State cho hóa đơn (Phase A)
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({});

  useEffect(() => {
    loadProducts();
    loadInvoiceSettings();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.list({ with_stock: 'true' });
      setProducts(data);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Load cài đặt hóa đơn (Phase A)
  const loadInvoiceSettings = async () => {
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/settings', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setInvoiceSettings(result.data);
      }
    } catch (err) {
      console.error('Load invoice settings error:', err);
    }
  };

  // Mở popup in hóa đơn (Phase A)
  const openInvoice = () => {
    setShowInvoice(true);
  };

  // Callback sau khi in xong
  const handlePrintComplete = (orderCode, paperSize) => {
    console.log(`Đã in hóa đơn ${orderCode} - khổ ${paperSize}`);
  };

  const searchCustomer = async () => {
    if (!searchPhone.trim()) return;
    try {
      const data = await customersApi.getByPhone(searchPhone.trim());
      setCustomer(data);
      setError('');
    } catch (err) {
      setError('Không tìm thấy khách hàng');
      setCustomer(null);
    }
  };

  const addToCart = (product) => {
    if (product.price <= 0) {
      setError(`${product.name} chưa có giá bán`);
      return;
    }

    const uniqueKey = `${product.sx_product_type}_${product.sx_product_id}`;
    const existing = cart.find(item => item.unique_key === uniqueKey);

    if (existing) {
      if (product.stock_quantity > 0 && existing.quantity >= product.stock_quantity) {
        setError(`Không đủ hàng. Tồn kho: ${product.stock_quantity}`);
        return;
      }
      setCart(cart.map(item => 
        item.unique_key === uniqueKey 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        unique_key: uniqueKey,
        product_id: product.id,
        sx_product_type: product.sx_product_type,
        sx_product_id: product.sx_product_id,
        product_code: product.code,
        product_name: product.name,
        unit_price: product.price,
        quantity: 1,
        stock: product.stock_quantity,
        icon: product.icon,
        color: product.color
      }]);
    }
    setError('');
  };

  const updateQuantity = (uniqueKey, delta) => {
    setCart(cart.map(item => {
      if (item.unique_key === uniqueKey) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (item.stock > 0 && newQty > item.stock) {
          setError(`Không đủ hàng. Tồn kho: ${item.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (uniqueKey) => {
    setCart(cart.filter(item => item.unique_key !== uniqueKey));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = Math.max(0, subtotal - discount);
  const cashReceivedNum = parseInt(cashReceived) || 0;
  const changeAmount = Math.max(0, cashReceivedNum - total);

  // Mở popup xác nhận thanh toán
  const openPaymentModal = () => {
    if (cart.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }

    if (paymentMethod === 'balance') {
      if (!customer) {
        setError('Vui lòng chọn khách hàng để thanh toán bằng số dư');
        return;
      }
      if (customer.balance < total) {
        setError(`Số dư không đủ. Hiện có: ${customer.balance.toLocaleString()}đ`);
        return;
      }
    }

    setError('');
    setCashReceived('');
    setShowPaymentModal(true);
  };

  // Xử lý thanh toán
  const handleSubmit = async () => {
    // Validate tiền mặt
    if (paymentMethod === 'cash' && cashReceivedNum < total) {
      setError('Tiền khách đưa chưa đủ');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const orderData = {
        customer_phone: customer?.phone || null,
        customer_name: customer?.name || 'Khách lẻ',
        items: cart.map(item => ({
          product_id: item.product_id,
          sx_product_type: item.sx_product_type,
          sx_product_id: item.sx_product_id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        discount: discount,
        discount_reason: discount > 0 ? 'Giảm giá' : null
      };

      const result = await ordersApi.create(orderData);

      // Lưu thông tin đơn hàng để hiển thị màn hình thành công
      setCompletedOrder({
        id: result.order.id,
        code: result.order.code,
        invoice_number: result.order.invoice_number,
        total: total,
        discount: discount,
        paymentMethod: paymentMethod,
        cashReceived: cashReceivedNum,
        change: changeAmount,
        customerName: customer?.name || 'Khách lẻ',
        customerPhone: customer?.phone || null,
        createdBy: result.order.created_by,
        createdAt: result.order.created_at,
        items: cart,
        balanceAfter: result.order.balance_after
      });

      // Đóng popup thanh toán, mở popup thành công
      setShowPaymentModal(false);
      setShowSuccessModal(true);

      // Reset
      setCart([]);
      setCustomer(null);
      setSearchPhone('');
      setDiscount(0);
      setPaymentMethod('cash');
      loadProducts();

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Đóng popup thành công và tiếp tục
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setCompletedOrder(null);
  };

  const filteredProducts = category === 'all' 
    ? products 
    : products.filter(p => p.category === category);

  const formatPrice = (price) => price?.toLocaleString() + 'đ';

  // Thống kê theo category
  const juiceCount = products.filter(p => p.category === 'juice').length;
  const teaCount = products.filter(p => p.category === 'tea').length;
  const juiceStock = products.filter(p => p.category === 'juice').reduce((sum, p) => sum + p.stock_quantity, 0);
  const teaStock = products.filter(p => p.category === 'tea').reduce((sum, p) => sum + p.stock_quantity, 0);

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">🛒 Bán hàng</h1>
        <div className="text-sm text-gray">
          {new Date().toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      </header>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="sales-layout">
          {/* Left: Products */}
          <div>
            {/* Customer Search */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="flex gap-1" style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Nhập SĐT khách hàng..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                />
                <button className="btn btn-primary" onClick={searchCustomer}>
                  <Search size={16} />
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={() => { setCustomer(null); setSearchPhone(''); }}
                >
                  Khách lẻ
                </button>
              </div>

              {customer && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: '#f0fdf4', 
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#166534' }}>{customer.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{customer.phone}</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Số dư: <strong style={{ color: '#2563eb' }}>{formatPrice(customer.balance || 0)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1" style={{ marginBottom: '1rem' }}>
              <button 
                className={`btn ${category === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('all')}
              >
                Tất cả ({products.length})
              </button>
              <button 
                className={`btn ${category === 'juice' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('juice')}
                style={{ background: category === 'juice' ? '#22c55e' : undefined }}
              >
                🥤 Nước ép ({juiceCount}) - {juiceStock}
              </button>
              <button 
                className={`btn ${category === 'tea' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('tea')}
                style={{ background: category === 'tea' ? '#f97316' : undefined }}
              >
                🍵 Trà ({teaCount}) - {teaStock}
              </button>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="card">Đang tải sản phẩm...</div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '0.75rem' 
              }}>
                {filteredProducts.map(product => (
                  <div
                    key={`${product.sx_product_type}_${product.sx_product_id}`}
                    onClick={() => addToCart(product)}
                    style={{
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      cursor: product.price > 0 ? 'pointer' : 'not-allowed',
                      opacity: product.stock_quantity <= 0 ? 0.5 : 1,
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      if (product.price > 0) e.currentTarget.style.borderColor = product.color || '#3b82f6';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {/* Icon */}
                    <div style={{ 
                      fontSize: '2rem', 
                      textAlign: 'center', 
                      marginBottom: '0.5rem' 
                    }}>
                      {product.icon || '📦'}
                    </div>

                    {/* Info */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: product.color || '#333',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem'
                      }}>
                        {product.code}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#666',
                        marginBottom: '0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {product.name}
                      </div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: product.price > 0 ? '#2563eb' : '#ef4444',
                        fontSize: '0.9rem'
                      }}>
                        {product.price > 0 ? formatPrice(product.price) : 'Chưa có giá'}
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: product.stock_quantity > 0 ? '#dcfce7' : '#fee2e2',
                      color: product.stock_quantity > 0 ? '#166534' : '#dc2626',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      {product.stock_quantity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="card" style={{ 
            position: 'sticky', 
            top: '1rem', 
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>
              🛒 Giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)
            </h3>

            {cart.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#999' 
              }}>
                Chưa có sản phẩm nào
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div 
                    key={item.unique_key}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem' }}>{item.icon || '📦'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: item.color }}>
                        {item.product_code}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {formatPrice(item.unit_price)} × {item.quantity}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button 
                        onClick={() => updateQuantity(item.unique_key, -1)}
                        style={{
                          width: '24px', height: '24px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.unique_key, 1)}
                        style={{
                          width: '24px', height: '24px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.unique_key)}
                        style={{
                          width: '24px', height: '24px',
                          border: 'none',
                          borderRadius: '4px',
                          background: '#fee2e2',
                          color: '#ef4444',
                          cursor: 'pointer',
                          marginLeft: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div style={{ 
                      fontWeight: 'bold', 
                      minWidth: '70px', 
                      textAlign: 'right',
                      fontSize: '0.9rem'
                    }}>
                      {formatPrice(item.quantity * item.unit_price)}
                    </div>
                  </div>
                ))}

                {/* Giảm giá */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#666' }}>Giảm giá</label>
                  <input
                    type="number"
                    className="input"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>

                {/* Tổng */}
                <div style={{ 
                  marginTop: '0.75rem', 
                  paddingTop: '0.75rem', 
                  borderTop: '2px solid #e2e8f0' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.25rem' }}>
                      <span>Giảm giá</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  padding: '0.75rem',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  marginTop: '0.5rem'
                }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: '#2563eb' }}>{formatPrice(total)}</span>
                </div>

                {/* Thanh toán */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Thanh toán
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '2px solid',
                        borderColor: paymentMethod === 'cash' ? '#3b82f6' : '#e2e8f0',
                        background: paymentMethod === 'cash' ? '#3b82f6' : 'white',
                        color: paymentMethod === 'cash' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Banknote size={14} /> Tiền mặt
                    </button>
                    <button
                      onClick={() => setPaymentMethod('transfer')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '2px solid',
                        borderColor: paymentMethod === 'transfer' ? '#3b82f6' : '#e2e8f0',
                        background: paymentMethod === 'transfer' ? '#3b82f6' : 'white',
                        color: paymentMethod === 'transfer' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <CreditCard size={14} /> CK
                    </button>
                    {customer && (
                      <button
                        onClick={() => setPaymentMethod('balance')}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '2px solid',
                          borderColor: paymentMethod === 'balance' ? '#22c55e' : '#e2e8f0',
                          background: paymentMethod === 'balance' ? '#22c55e' : 'white',
                          color: paymentMethod === 'balance' ? 'white' : '#333',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Wallet size={14} /> Số dư
                      </button>
                    )}
                  </div>
                </div>

                {/* Nút thanh toán - MỞ POPUP */}
                <button
                  onClick={openPaymentModal}
                  disabled={cart.length === 0}
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '0.875rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: cart.length === 0 ? 0.7 : 1
                  }}
                >
                  💳 Thanh toán {formatPrice(total)}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========== POPUP XÁC NHẬN THANH TOÁN ========== */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '450px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: 0 }}>💳 Xác nhận thanh toán</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Thông tin khách hàng */}
              <div style={{ 
                padding: '0.75rem', 
                background: '#f8fafc', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 'bold' }}>
                  {customer?.name || 'Khách lẻ'}
                </div>
                {customer && (
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {customer.phone} • Số dư: {formatPrice(customer.balance || 0)}
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  Chi tiết đơn hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)
                </div>
                {cart.map(item => (
                  <div key={item.unique_key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '0.9rem'
                  }}>
                    <span>
                      {item.icon} {item.product_code} × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tổng tiền */}
              <div style={{ 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                {discount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Tạm tính</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#ef4444' }}>
                      <span>Giảm giá</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  </>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: '#2563eb' }}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div style={{ 
                padding: '0.75rem', 
                background: paymentMethod === 'cash' ? '#fef3c7' : paymentMethod === 'transfer' ? '#dbeafe' : '#dcfce7',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {paymentMethod === 'cash' && <><Banknote size={20} /> Thanh toán tiền mặt</>}
                {paymentMethod === 'transfer' && <><CreditCard size={20} /> Thanh toán chuyển khoản</>}
                {paymentMethod === 'balance' && <><Wallet size={20} /> Thanh toán bằng số dư</>}
              </div>

              {/* Tiền khách đưa - CHỈ HIỆN KHI CHỌN TIỀN MẶT */}
              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Tiền khách đưa
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={`Tối thiểu ${formatPrice(total)}`}
                    style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      textAlign: 'right'
                    }}
                    autoFocus
                  />

                  {/* Nút chọn nhanh */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {[total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000]
                      .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                      .slice(0, 4)
                      .map(amount => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount.toString())}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: cashReceivedNum === amount ? '#3b82f6' : '#f1f5f9',
                            color: cashReceivedNum === amount ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          {formatPrice(amount)}
                        </button>
                      ))
                    }
                  </div>

                  {/* Tiền thừa */}
                  {cashReceivedNum >= total && cashReceivedNum > 0 && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.1rem'
                    }}>
                      <span>Tiền thừa</span>
                      <span style={{ fontWeight: 'bold', color: '#22c55e' }}>
                        {formatPrice(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error trong modal */}
              {error && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: '#fee2e2', 
                  color: '#dc2626',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (paymentMethod === 'cash' && cashReceivedNum < total)}
                style={{
                  flex: 2,
                  padding: '0.875rem',
                  background: (paymentMethod === 'cash' && cashReceivedNum < total) ? '#94a3b8' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (paymentMethod === 'cash' && cashReceivedNum < total) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                {submitting ? 'Đang xử lý...' : '✓ Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== POPUP THÀNH CÔNG ========== */}
      {showSuccessModal && completedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Success Icon */}
            <div style={{ 
              background: '#22c55e', 
              padding: '2rem',
              color: 'white'
            }}>
              <CheckCircle size={64} style={{ marginBottom: '0.5rem' }} />
              <h2 style={{ margin: 0 }}>Thanh toán thành công!</h2>
            </div>

            {/* Order Info */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666',
                marginBottom: '0.5rem'
              }}>
                Mã đơn hàng
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                {completedOrder.code}
              </div>

              <div style={{ 
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#666' }}>Khách hàng</span>
                  <span style={{ fontWeight: 'bold' }}>{completedOrder.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#666' }}>Tổng tiền</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{formatPrice(completedOrder.total)}</span>
                </div>
                {completedOrder.paymentMethod === 'cash' && completedOrder.change > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#666' }}>Tiền khách đưa</span>
                      <span>{formatPrice(completedOrder.cashReceived)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      paddingTop: '0.5rem',
                      borderTop: '1px dashed #e2e8f0'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Tiền thừa</span>
                      <span style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '1.1rem' }}>
                        {formatPrice(completedOrder.change)}
                      </span>
                    </div>
                  </>
                )}
                {completedOrder.paymentMethod === 'balance' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Số dư còn lại</span>
                    <span style={{ fontWeight: 'bold' }}>{formatPrice(completedOrder.balanceAfter)}</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={openInvoice}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#f1f5f9',
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
                  <Printer size={18} /> In hóa đơn
                </button>
                <button
                  onClick={closeSuccessModal}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Đơn mới
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== POPUP IN HÓA ĐƠN (Phase A) ========== */}
      {showInvoice && completedOrder && (
        <InvoicePrint
          order={{
            id: completedOrder.id,
            code: completedOrder.code,
            invoice_number: completedOrder.invoice_number,
            customer_name: completedOrder.customerName,
            customer_phone: completedOrder.customerPhone,
            created_by: completedOrder.createdBy,
            created_at: completedOrder.createdAt,
            items: completedOrder.items.map(item => ({
              product_code: item.product_code,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price
            })),
            subtotal: completedOrder.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
            discount: completedOrder.discount || 0,
            total: completedOrder.total,
            payment_method: completedOrder.paymentMethod,
            cash_received: completedOrder.cashReceived,
            change_amount: completedOrder.change
          }}
          settings={invoiceSettings}
          onClose={() => setShowInvoice(false)}
          onPrintComplete={handlePrintComplete}
        />
      )}
    </>
  );
}
