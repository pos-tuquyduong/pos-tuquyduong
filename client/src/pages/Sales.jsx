/**
 * POS - Sales Page
 * Hiển thị sản phẩm với icon/color từ SX (nhất quán 100%)
 */

import { useState, useEffect } from 'react';
import { productsApi, customersApi, ordersApi } from '../utils/api';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Wallet } from 'lucide-react';

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

  useEffect(() => {
    loadProducts();
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
        // Lấy icon/color từ SX
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

  const handleSubmit = async () => {
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

    setSubmitting(true);
    setError('');

    try {
      const orderData = {
        customer_id: customer?.id || null,
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

      setSuccess(`Đã tạo đơn hàng ${result.order.code} thành công!`);
      setCart([]);
      setCustomer(null);
      setSearchPhone('');
      setDiscount(0);
      setPaymentMethod('cash');
      loadProducts();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
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
                  background: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <div className="flex flex-between flex-center">
                    <div>
                      <div className="font-bold">{customer.name}</div>
                      <div className="text-sm text-gray">{customer.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-sm text-gray">Số dư</div>
                      <div className="font-bold" style={{ color: '#2563eb', fontSize: '1.1rem' }}>
                        {formatPrice(customer.balance || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter - Giống SX */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => setCategory('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid',
                  borderColor: category === 'all' ? '#3b82f6' : '#e2e8f0',
                  background: category === 'all' ? '#3b82f6' : 'white',
                  color: category === 'all' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Tất cả ({products.length})
              </button>
              <button 
                onClick={() => setCategory('juice')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #22c55e',
                  background: category === 'juice' ? '#22c55e' : '#f0fdf4',
                  color: category === 'juice' ? 'white' : '#22c55e',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🥤 Nước ép ({juiceCount}) - {juiceStock} túi
              </button>
              <button 
                onClick={() => setCategory('tea')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #f59e0b',
                  background: category === 'tea' ? '#f59e0b' : '#fffbeb',
                  color: category === 'tea' ? 'white' : '#f59e0b',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🍵 Trà ({teaCount}) - {teaStock} gói
              </button>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>
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
                      borderRadius: '12px',
                      border: `2px solid ${product.color || '#e2e8f0'}`,
                      background: product.stock_quantity <= 0 ? '#f9fafb' : (product.bg_color || 'white'),
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: product.stock_quantity <= 0 ? 0.6 : 1,
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${product.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Icon từ SX */}
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                      {product.icon || '📦'}
                    </div>

                    {/* Mã sản phẩm */}
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1rem',
                      color: product.color || '#333'
                    }}>
                      {product.code}
                    </div>

                    {/* Tên sản phẩm */}
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#666',
                      marginBottom: '0.25rem',
                      minHeight: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1.2'
                    }}>
                      {product.name}
                    </div>

                    {/* Giá */}
                    <div style={{ 
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      color: product.price > 0 ? '#1e40af' : '#ef4444',
                      marginBottom: '0.25rem'
                    }}>
                      {product.price > 0 ? formatPrice(product.price) : 'Chưa có giá'}
                    </div>

                    {/* Tồn kho - Icon + màu từ SX */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      background: product.stock_quantity <= 0 ? '#fef2f2' : 
                                  product.stock_quantity <= 10 ? '#fffbeb' : '#f0fdf4',
                      color: product.stock_color || '#666',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      <span>{product.stock_icon || '⚪'}</span>
                      <span>
                        {product.stock_quantity <= 0 ? 'Hết' : product.stock_quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="card" style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              🛒 Giỏ hàng ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </div>

            {cart.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                Chưa có sản phẩm
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.unique_key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #f1f5f9',
                    gap: '0.5rem'
                  }}>
                    {/* Icon từ SX */}
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>

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

                {/* Nút thanh toán */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
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
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Đang xử lý...' : `💳 Thanh toán ${formatPrice(total)}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
