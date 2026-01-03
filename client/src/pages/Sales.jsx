/**
 * POS - Sales Page (Màn hình bán hàng chính)
 */

import { useState, useEffect } from 'react';
import { productsApi, customersApi, ordersApi, stockApi } from '../utils/api';
import { Search, User, Trash2, Plus, Minus, CreditCard, Banknote, Wallet } from 'lucide-react';

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
    if (product.stock_quantity <= 0) {
      setError(`${product.name} đã hết hàng`);
      return;
    }

    if (product.price <= 0) {
      setError(`${product.name} chưa có giá bán`);
      return;
    }

    const existing = cart.find(item => item.product_id === product.id);
    
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        setError(`Không đủ hàng. Tồn kho: ${product.stock_quantity}`);
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        unit_price: product.price,
        quantity: 1,
        stock: product.stock_quantity
      }]);
    }
    setError('');
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) {
          setError(`Không đủ hàng. Tồn kho: ${item.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
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
      
      // Reload products to update stock
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

  const formatPrice = (price) => price.toLocaleString() + 'đ';

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
                <div className="customer-info">
                  <div className="flex flex-between flex-center">
                    <div>
                      <div className="font-bold">{customer.name}</div>
                      <div className="text-sm text-gray">{customer.phone}</div>
                      {customer.sx_group_name && (
                        <div className="text-sm">📍 {customer.sx_group_name}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-sm text-gray">Số dư</div>
                      <div className="font-bold text-lg" style={{ color: '#2563eb' }}>
                        {formatPrice(customer.balance || 0)}
                      </div>
                    </div>
                  </div>
                  {customer.children?.length > 0 && (
                    <div className="text-sm mt-1">
                      👨‍👩‍👧 Mua cho: {customer.children.map(c => c.name).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 mb-2">
              <button 
                className={`btn ${category === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('all')}
              >
                Tất cả
              </button>
              <button 
                className={`btn ${category === 'juice' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('juice')}
              >
                Nước ép
              </button>
              <button 
                className={`btn ${category === 'tea' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCategory('tea')}
              >
                Trà
              </button>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className={`product-card ${product.stock_quantity <= 0 ? 'out-of-stock' : ''}`}
                    onClick={() => addToCart(product)}
                  >
                    <div className="product-name">{product.code}</div>
                    <div className="text-sm text-gray" style={{ marginBottom: '0.25rem' }}>
                      {product.name}
                    </div>
                    <div className="product-price">
                      {product.price > 0 ? formatPrice(product.price) : 'Chưa có giá'}
                    </div>
                    <div className="product-stock">
                      {product.stock_quantity <= 0 ? (
                        <span style={{ color: '#ef4444' }}>🔴 Hết hàng</span>
                      ) : product.stock_quantity <= 10 ? (
                        <span style={{ color: '#f59e0b' }}>🟡 {product.stock_quantity}</span>
                      ) : (
                        <span style={{ color: '#22c55e' }}>🟢 {product.stock_quantity}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="card" style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
            <div className="card-title">🛒 Giỏ hàng ({cart.length})</div>

            {cart.length === 0 ? (
              <div className="text-gray text-sm" style={{ padding: '2rem', textAlign: 'center' }}>
                Chưa có sản phẩm
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.product_id} className="cart-item">
                    <div style={{ flex: 1 }}>
                      <div className="font-bold">{item.product_name}</div>
                      <div className="text-sm text-gray">
                        {formatPrice(item.unit_price)} x {item.quantity}
                      </div>
                    </div>
                    <div className="flex flex-center gap-1">
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem' }}
                        onClick={() => updateQuantity(item.product_id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem' }}
                        onClick={() => updateQuantity(item.product_id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.25rem', marginLeft: '0.5rem' }}
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="font-bold" style={{ minWidth: '80px', textAlign: 'right' }}>
                      {formatPrice(item.quantity * item.unit_price)}
                    </div>
                  </div>
                ))}

                {/* Discount */}
                <div className="form-group mt-2">
                  <label className="form-label">Giảm giá</label>
                  <input
                    type="number"
                    className="input"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                  />
                </div>

                {/* Totals */}
                <div style={{ padding: '0.75rem 0', borderTop: '1px solid #e2e8f0' }}>
                  <div className="flex flex-between mb-1">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex flex-between mb-1 text-danger">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="cart-total flex flex-between">
                  <span>Tổng cộng</span>
                  <span style={{ color: '#2563eb' }}>{formatPrice(total)}</span>
                </div>

                {/* Payment Method */}
                <div className="mt-2">
                  <label className="form-label">Thanh toán</label>
                  <div className="flex gap-1">
                    <button
                      className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <Banknote size={16} /> Tiền mặt
                    </button>
                    <button
                      className={`btn ${paymentMethod === 'transfer' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setPaymentMethod('transfer')}
                    >
                      <CreditCard size={16} /> CK
                    </button>
                    {customer && (
                      <button
                        className={`btn ${paymentMethod === 'balance' ? 'btn-success' : 'btn-outline'}`}
                        style={{ flex: 1 }}
                        onClick={() => setPaymentMethod('balance')}
                      >
                        <Wallet size={16} /> Số dư
                      </button>
                    )}
                  </div>
                  {paymentMethod === 'balance' && customer && (
                    <div className="text-sm mt-1" style={{ color: customer.balance >= total ? '#22c55e' : '#ef4444' }}>
                      Số dư: {formatPrice(customer.balance)} → Còn lại: {formatPrice(customer.balance - total)}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  className="btn btn-success btn-lg mt-2"
                  style={{ width: '100%' }}
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
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
