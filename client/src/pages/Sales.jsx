/**
 * POS - Sales Page
 * Hiển thị sản phẩm với icon/color từ SX (nhất quán 100%)
 * v2: Thêm popup xác nhận, tiền khách đưa, màn hình thành công
 * v3: Tích hợp InvoicePrint - In hóa đơn (Phase A)
 */

import { useState, useEffect } from 'react';
import { productsApi, customersApi, ordersApi } from '../utils/api';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Wallet, X, CheckCircle, Printer, AlertCircle, FileText } from 'lucide-react';
import InvoicePrint from '../components/InvoicePrint';
import CustomerSearch from '../components/CustomerSearch';

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
  // State cho thanh toán linh hoạt (V4)
  const [useBalance, setUseBalance] = useState(false);        // Có dùng số dư không
  const [balanceToUse, setBalanceToUse] = useState(0);        // Số tiền dư muốn dùng
  const [isDebt, setIsDebt] = useState(false);                // Có ghi nợ không
  const [dueDate, setDueDate] = useState('');                 // Hạn thanh toán

  // State cho số dư mẹ (khách con)
  const [useParentBalance, setUseParentBalance] = useState(false);  // Có dùng số dư mẹ không
  const [parentBalanceToUse, setParentBalanceToUse] = useState(0);  // Số tiền dư mẹ muốn dùng

  // === Phase B: State cho chiết khấu + shipping ===
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);       // Giá trị chiết khấu
  const [discountCode, setDiscountCode] = useState('');        // Mã chiết khấu
  const [discountCodeValid, setDiscountCodeValid] = useState(null); // Kết quả validate mã
  const [shippingFee, setShippingFee] = useState(0);           // Phí vận chuyển
  const [validatingCode, setValidatingCode] = useState(false); // Đang validate mã

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
    setShowSuccessModal(false); // Đóng modal thành công trước
    setShowInvoice(true);
  };

  // Callback sau khi in xong
  const handlePrintComplete = (orderCode, paperSize) => {
    console.log(`Đã in hóa đơn ${orderCode} - khổ ${paperSize}`);
  };

  // === Phase B: Validate mã chiết khấu ===
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountCodeValid(null);
      return;
    }
    
    setValidatingCode(true);
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/discount-codes/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token 
        },
        body: JSON.stringify({ 
          code: discountCode.trim(),
          order_subtotal: subtotal
        })
      });
      const result = await res.json();
      
      if (res.ok && result.valid) {
        setDiscountCodeValid(result);
        setError('');
      } else {
        setDiscountCodeValid({ valid: false, error: result.error });
        setError(result.error || 'Mã không hợp lệ');
      }
    } catch (err) {
      setDiscountCodeValid({ valid: false, error: 'Lỗi kiểm tra mã' });
      setError('Lỗi kiểm tra mã chiết khấu');
    } finally {
      setValidatingCode(false);
    }
  };

  // Reset mã chiết khấu
  const clearDiscountCode = () => {
    setDiscountCode('');
    setDiscountCodeValid(null);
  };

  // Áp dụng chiết khấu mặc định của khách hàng
  const applyCustomerDiscount = () => {
    if (customer?.discount_value > 0) {
      setDiscountType(customer.discount_type || 'percent');
      setDiscountValue(customer.discount_value);
      setDiscountCode('');
      setDiscountCodeValid(null);
    }
  };

  // Xử lý khi chọn khách hàng từ CustomerSearch
  const handleSelectCustomer = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setError('');
    
    // Reset các option thanh toán khi đổi khách
    setUseBalance(false);
    setBalanceToUse(0);
    setUseParentBalance(false);
    setParentBalanceToUse(0);
    setIsDebt(false);
    
    // Áp dụng chiết khấu mặc định của KH (nếu có)
    if (selectedCustomer?.discount_value > 0) {
      setDiscountType(selectedCustomer.discount_type || 'percent');
      setDiscountValue(selectedCustomer.discount_value);
      setDiscountCode('');
      setDiscountCodeValid(null);
    }
  };

  // Xử lý khi bỏ chọn khách hàng
  const handleClearCustomer = () => {
    setCustomer(null);
    setUseBalance(false);
    setBalanceToUse(0);
    setUseParentBalance(false);
    setParentBalanceToUse(0);
    setIsDebt(false);
    setPaymentMethod('cash');
    // === Phase B: Reset chiết khấu ===
    setDiscountType('percent');
    setDiscountValue(0);
    setDiscountCode('');
    setDiscountCodeValid(null);
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
  
  // === Phase B: Tính chiết khấu ===
  let discountAmount = 0;
  if (discountCodeValid?.valid) {
    // Ưu tiên 1: Mã chiết khấu đã validate
    discountAmount = discountCodeValid.discount_amount || 0;
  } else if (discountType === 'percent' && discountValue > 0) {
    // Ưu tiên 2: Chiết khấu %
    discountAmount = subtotal * discountValue / 100;
  } else if (discountType === 'fixed' && discountValue > 0) {
    // Ưu tiên 3: Chiết khấu số tiền cố định
    discountAmount = discountValue;
  } else if (discount > 0) {
    // Backward compatible
    discountAmount = discount;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  
  const total = Math.max(0, subtotal - discountAmount + (shippingFee || 0));

  // Tính toán thanh toán linh hoạt
  const customerBalance = customer?.balance || 0;
  const maxBalanceCanUse = Math.min(customerBalance, total);
  const actualBalanceUsed = useBalance ? Math.min(balanceToUse || 0, maxBalanceCanUse) : 0;
  const remainingAfterOwnBalance = total - actualBalanceUsed;

  // Tính toán thanh toán - Số dư mẹ (nếu có)
  const parentBalance = customer?.parent_balance || 0;
  const parentPhone = customer?.parent_phone || null;
  const parentName = customer?.parent_name || null;
  const maxParentBalanceCanUse = Math.min(parentBalance, remainingAfterOwnBalance);
  const actualParentBalanceUsed = useParentBalance ? Math.min(parentBalanceToUse || 0, maxParentBalanceCanUse) : 0;

  // Tổng còn lại sau khi dùng cả 2 nguồn
  const remainingAfterBalance = remainingAfterOwnBalance - actualParentBalanceUsed;

  const cashReceivedNum = parseInt(cashReceived) || 0;
  const changeAmount = Math.max(0, cashReceivedNum - remainingAfterBalance);

  // Số tiền ghi nợ (nếu chọn ghi nợ và còn tiền chưa TT)
  const debtAmount = isDebt ? remainingAfterBalance : 0;

  // Mở popup xác nhận thanh toán
  const openPaymentModal = () => {
    if (cart.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }

    // Reset state thanh toán
    setError('');
    setCashReceived('');
    setUseBalance(customerBalance > 0);
    setBalanceToUse(Math.min(customerBalance, total));
    setIsDebt(false);
    setDueDate('');
    setShowPaymentModal(true);
  };

  // Xử lý thanh toán
  const handleSubmit = async () => {
    // Tính toán lại các giá trị
    const balanceUsed = useBalance ? actualBalanceUsed : 0;
    const parentBalanceUsed = useParentBalance ? actualParentBalanceUsed : 0;
    const remaining = total - balanceUsed - parentBalanceUsed;

    // Validate
    if (!isDebt) {
      // Nếu không ghi nợ, phải thanh toán đủ
      if (paymentMethod === 'cash' && cashReceivedNum < remaining) {
        setError('Tiền khách đưa chưa đủ');
        return;
      }
    } else {
      // Nếu ghi nợ, cần có khách hàng
      if (!customer) {
        setError('Vui lòng chọn khách hàng để ghi nợ');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // Tính số tiền thanh toán thực tế
      let cashAmount = 0;
      let transferAmount = 0;
      let debtAmountFinal = 0;

      if (isDebt) {
        // Ghi nợ toàn bộ phần còn lại
        debtAmountFinal = remaining;
      } else {
        // Thanh toán bình thường
        if (paymentMethod === 'cash') {
          cashAmount = remaining;
        } else if (paymentMethod === 'transfer') {
          transferAmount = remaining;
        }
      }

      const orderData = {
        customer_phone: customer?.phone || null,
        customer_name: customer?.name || 'Khách lẻ',
        is_new_customer: customer?.isNew || false, // Flag để backend tạo registration
        items: cart.map(item => ({
          product_id: item.product_id,
          sx_product_type: item.sx_product_type,
          sx_product_id: item.sx_product_id,
          quantity: item.quantity
        })),
        payment_method: isDebt ? 'debt' : paymentMethod,
        discount: discount, // backward compatible
        discount_reason: discountAmount > 0 ? 'Giảm giá' : null,
        // === Phase B: Chiết khấu + Shipping ===
        discount_type: discountCodeValid?.valid ? discountCodeValid.discount_type : (discountValue > 0 ? discountType : null),
        discount_value: discountCodeValid?.valid ? discountCodeValid.discount_value : discountValue,
        discount_code: discountCodeValid?.valid ? discountCodeValid.code : null,
        shipping_fee: shippingFee || 0,
        // Thêm thông tin thanh toán linh hoạt
        balance_amount: balanceUsed,
        cash_amount: cashAmount,
        transfer_amount: transferAmount,
        debt_amount: debtAmountFinal,
        due_date: isDebt && dueDate ? dueDate : null,
        payment_status: debtAmountFinal > 0 ? (balanceUsed > 0 || parentBalanceUsed > 0 ? 'partial' : 'pending') : 'paid',
        // === Số dư mẹ (nếu có) ===
        parent_phone: parentBalanceUsed > 0 ? parentPhone : null,
        parent_balance_amount: parentBalanceUsed
      };

      const result = await ordersApi.create(orderData);

      // Lưu thông tin đơn hàng để hiển thị màn hình thành công
      setCompletedOrder({
        id: result.order.id,
        code: result.order.code,
        invoice_number: result.order.invoice_number,
        subtotal: result.order.subtotal || subtotal,
        discount: discountAmount,
        discount_type: result.order.discount_type,
        discount_value: result.order.discount_value,
        discount_code: result.order.discount_code,
        shipping_fee: result.order.shipping_fee || shippingFee,
        total: total,
        paymentMethod: isDebt ? 'debt' : paymentMethod,
        balanceUsed: balanceUsed,
        cashReceived: cashReceivedNum,
        change: isDebt ? 0 : changeAmount,
        debtAmount: debtAmountFinal,
        dueDate: dueDate,
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
      setUseBalance(false);
      setBalanceToUse(0);
      setUseParentBalance(false);
      setParentBalanceToUse(0);
      setIsDebt(false);
      setDueDate('');
      // === Phase B: Reset chiết khấu + shipping ===
      setDiscountType('percent');
      setDiscountValue(0);
      setDiscountCode('');
      setDiscountCodeValid(null);
      setShippingFee(0);
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
        {/* Customer Search - Autocomplete + Thêm khách mới */}
        <div className="card" style={{ marginBottom: '1rem', position: 'relative', zIndex: 100 }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#B91C1C', fontWeight: '500' }}>
            👤 Khách hàng
          </div>
          <CustomerSearch 
            onSelect={handleSelectCustomer}
            selectedCustomer={customer}
            onClear={handleClearCustomer}
          />
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

            {/* === Phase B: Chiết khấu + Shipping === */}
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              {/* Mã chiết khấu */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                  Mã chiết khấu
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountCodeValid(null);
                    }}
                    placeholder="Nhập mã..."
                    style={{ flex: 1 }}
                    disabled={discountCodeValid?.valid}
                  />
                  {discountCodeValid?.valid ? (
                    <button
                      onClick={clearDiscountCode}
                      style={{
                        padding: '0 0.75rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={validateDiscountCode}
                      disabled={!discountCode.trim() || validatingCode}
                      style={{
                        padding: '0 0.75rem',
                        background: discountCode.trim() ? '#3b82f6' : '#e2e8f0',
                        color: discountCode.trim() ? 'white' : '#999',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: discountCode.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '0.85rem'
                      }}
                    >
                      {validatingCode ? '...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                {discountCodeValid?.valid && (
                  <div style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.8rem', 
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    ✓ {discountCodeValid.message}
                  </div>
                )}
              </div>

              {/* Chiết khấu manual (ẩn nếu đã dùng mã) */}
              {!discountCodeValid?.valid && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                    Chiết khấu
                    {customer?.discount_value > 0 && (
                      <span 
                        onClick={applyCustomerDiscount}
                        style={{ 
                          marginLeft: '0.5rem', 
                          color: '#3b82f6', 
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        (KH: {customer.discount_type === 'percent' ? customer.discount_value + '%' : customer.discount_value.toLocaleString() + 'đ'})
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: 'white',
                        width: '80px'
                      }}
                    >
                      <option value="percent">%</option>
                      <option value="fixed">đ</option>
                    </select>
                    <input
                      type="number"
                      className="input"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              )}

              {/* Phí vận chuyển */}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                  Phí vận chuyển
                </label>
                <input
                  type="number"
                  className="input"
                  value={shippingFee || ''}
                  onChange={(e) => setShippingFee(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
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
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', marginBottom: '0.25rem' }}>
                  <span>
                    Chiết khấu
                    {discountCodeValid?.valid && <span style={{ fontSize: '0.75rem' }}> ({discountCodeValid.code})</span>}
                    {!discountCodeValid?.valid && discountType === 'percent' && discountValue > 0 && <span style={{ fontSize: '0.75rem' }}> ({discountValue}%)</span>}
                  </span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              {shippingFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f97316', marginBottom: '0.25rem' }}>
                  <span>Phí vận chuyển</span>
                  <span>+{formatPrice(shippingFee)}</span>
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

      {/* ========== POPUP XÁC NHẬN THANH TOÁN - V4 ========== */}
      {/* THAY THẾ toàn bộ phần {showPaymentModal && (...)} cũ bằng code này */}

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
        maxWidth: '500px',
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
            background: customer ? '#f0fdf4' : '#f8fafc', 
            borderRadius: '8px',
            marginBottom: '1rem',
            border: customer ? '1px solid #86efac' : '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: 'bold', color: customer ? '#166534' : '#333' }}>
              {customer?.name || 'Khách lẻ'}
            </div>
            {customer && (
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>📱 {customer.phone}</span>
                <span style={{ color: '#2563eb' }}>💰 Dư: {formatPrice(customerBalance)}</span>
                {customer.total_debt > 0 && (
                  <span style={{ color: '#dc2626' }}>📕 Nợ: {formatPrice(customer.total_debt)}</span>
                )}
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

          {/* ========== THANH TOÁN LINH HOẠT ========== */}

          {/* 1. Dùng số dư (nếu có khách và có dư) */}
          {customer && customerBalance > 0 && (
            <div style={{ 
              padding: '1rem', 
              background: '#f8fafc', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: useBalance ? '2px solid #3b82f6' : '1px solid #e2e8f0'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                marginBottom: useBalance ? '0.75rem' : 0
              }}>
                <input
                  type="checkbox"
                  checked={useBalance}
                  onChange={(e) => {
                    setUseBalance(e.target.checked);
                    if (e.target.checked) {
                      setBalanceToUse(Math.min(customerBalance, total));
                    } else {
                      setBalanceToUse(0);
                    }
                  }}
                  style={{ width: '18px', height: '18px' }}
                />
                <Wallet size={18} color="#3b82f6" />
                <span style={{ fontWeight: '500' }}>Dùng số dư ({formatPrice(customerBalance)})</span>
              </label>

              {useBalance && (
                <div style={{ marginLeft: '26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Số tiền dùng:</span>
                    <input
                      type="number"
                      value={balanceToUse}
                      onChange={(e) => setBalanceToUse(Math.min(parseInt(e.target.value) || 0, maxBalanceCanUse))}
                      style={{
                        width: '120px',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        textAlign: 'right',
                        fontWeight: 'bold'
                      }}
                    />
                    <button
                      onClick={() => setBalanceToUse(maxBalanceCanUse)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Tối đa
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    Tối đa có thể dùng: {formatPrice(maxBalanceCanUse)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1b. Dùng số dư mẹ (nếu khách con có parent và parent có dư) */}
          {customer && parentPhone && parentBalance > 0 && (
            <div style={{ 
              padding: '1rem', 
              background: '#faf5ff', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: useParentBalance ? '2px solid #7c3aed' : '1px solid #e9d5ff'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                marginBottom: useParentBalance ? '0.75rem' : 0
              }}>
                <input
                  type="checkbox"
                  checked={useParentBalance}
                  onChange={(e) => {
                    setUseParentBalance(e.target.checked);
                    if (e.target.checked) {
                      setParentBalanceToUse(Math.min(parentBalance, remainingAfterOwnBalance));
                    } else {
                      setParentBalanceToUse(0);
                    }
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                />
                <Wallet size={18} color="#7c3aed" />
                <span style={{ fontWeight: '500', color: '#6b21a8' }}>
                  Dùng số dư mẹ - {parentName || parentPhone} ({formatPrice(parentBalance)})
                </span>
              </label>

              {useParentBalance && (
                <div style={{ marginLeft: '26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#7c3aed' }}>Số tiền dùng:</span>
                    <input
                      type="number"
                      value={parentBalanceToUse}
                      onChange={(e) => setParentBalanceToUse(Math.min(parseInt(e.target.value) || 0, maxParentBalanceCanUse))}
                      style={{
                        width: '120px',
                        padding: '0.5rem',
                        border: '1px solid #c4b5fd',
                        borderRadius: '6px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: '#6b21a8'
                      }}
                    />
                    <button
                      onClick={() => setParentBalanceToUse(maxParentBalanceCanUse)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#ede9fe',
                        color: '#6b21a8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Tối đa
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7c3aed', marginTop: '0.5rem' }}>
                    Tối đa có thể dùng: {formatPrice(maxParentBalanceCanUse)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Số tiền còn lại cần thanh toán */}
          {(actualBalanceUsed > 0 || actualParentBalanceUsed > 0 || (customer && (customerBalance > 0 || parentBalance > 0))) && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: remainingAfterBalance > 0 ? '#fef3c7' : '#dcfce7',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '500' }}>
                {actualBalanceUsed > 0 ? 'Còn lại cần thanh toán' : 'Cần thanh toán'}
              </span>
              <span style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                color: remainingAfterBalance > 0 ? '#d97706' : '#16a34a'
              }}>
                {formatPrice(remainingAfterBalance)}
              </span>
            </div>
          )}

          {/* 3. Chọn phương thức cho phần còn lại */}
          {remainingAfterBalance > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                Thanh toán phần còn lại:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setPaymentMethod('cash'); setIsDebt(false); }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem',
                    border: '2px solid',
                    borderColor: paymentMethod === 'cash' && !isDebt ? '#3b82f6' : '#e2e8f0',
                    background: paymentMethod === 'cash' && !isDebt ? '#3b82f6' : 'white',
                    color: paymentMethod === 'cash' && !isDebt ? 'white' : '#333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  <Banknote size={18} /> Tiền mặt
                </button>
                <button
                  onClick={() => { setPaymentMethod('transfer'); setIsDebt(false); }}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.75rem',
                    border: '2px solid',
                    borderColor: paymentMethod === 'transfer' && !isDebt ? '#3b82f6' : '#e2e8f0',
                    background: paymentMethod === 'transfer' && !isDebt ? '#3b82f6' : 'white',
                    color: paymentMethod === 'transfer' && !isDebt ? 'white' : '#333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  <CreditCard size={18} /> Chuyển khoản
                </button>
                {customer && (
                  <button
                    onClick={() => { setIsDebt(true); setPaymentMethod('debt'); }}
                    style={{
                      flex: 1,
                      minWidth: '100px',
                      padding: '0.75rem',
                      border: '2px solid',
                      borderColor: isDebt ? '#f97316' : '#e2e8f0',
                      background: isDebt ? '#f97316' : 'white',
                      color: isDebt ? 'white' : '#333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '500'
                    }}
                  >
                    <FileText size={18} /> Ghi nợ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Input tiền mặt (nếu chọn tiền mặt) */}
          {paymentMethod === 'cash' && !isDebt && remainingAfterBalance > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Tiền khách đưa
              </label>
              <input
                type="number"
                className="input"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={`Tối thiểu ${formatPrice(remainingAfterBalance)}`}
                style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}
                autoFocus
              />

              {/* Nút chọn nhanh */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {[remainingAfterBalance, Math.ceil(remainingAfterBalance / 10000) * 10000, Math.ceil(remainingAfterBalance / 50000) * 50000, Math.ceil(remainingAfterBalance / 100000) * 100000]
                  .filter((v, i, arr) => arr.indexOf(v) === i && v >= remainingAfterBalance)
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
              {cashReceivedNum >= remainingAfterBalance && cashReceivedNum > 0 && (
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
                    {formatPrice(cashReceivedNum - remainingAfterBalance)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 5. Hạn thanh toán (nếu ghi nợ) */}
          {isDebt && (
            <div style={{ 
              padding: '1rem', 
              background: '#fff7ed', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fed7aa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={18} color="#ea580c" />
                <span style={{ fontWeight: 'bold', color: '#ea580c' }}>
                  Ghi nợ: {formatPrice(remainingAfterBalance)}
                </span>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Hạn thanh toán (không bắt buộc):
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    width: '100%'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Nợ hiện tại: {formatPrice(customer?.total_debt || 0)} → Sau đơn này: {formatPrice((customer?.total_debt || 0) + remainingAfterBalance)}
              </div>
            </div>
          )}

          {/* 6. Tóm tắt thanh toán */}
          <div style={{ 
            padding: '1rem', 
            background: '#f8fafc', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#666' }}>📋 Tóm tắt:</div>
            {actualBalanceUsed > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>Trừ số dư</span>
                <span style={{ color: '#2563eb' }}>-{formatPrice(actualBalanceUsed)}</span>
              </div>
            )}
            {!isDebt && remainingAfterBalance > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>{paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                <span>{formatPrice(remainingAfterBalance)}</span>
              </div>
            )}
            {isDebt && remainingAfterBalance > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#ea580c' }}>Ghi nợ</span>
                <span style={{ color: '#ea580c' }}>{formatPrice(remainingAfterBalance)}</span>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: 'bold',
              paddingTop: '0.5rem',
              borderTop: '1px solid #e2e8f0',
              marginTop: '0.5rem'
            }}>
              <span>Tổng</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

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
            disabled={submitting || (!isDebt && paymentMethod === 'cash' && remainingAfterBalance > 0 && cashReceivedNum < remainingAfterBalance)}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: (!isDebt && paymentMethod === 'cash' && remainingAfterBalance > 0 && cashReceivedNum < remainingAfterBalance) 
                ? '#94a3b8' 
                : isDebt ? '#f97316' : '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!isDebt && paymentMethod === 'cash' && remainingAfterBalance > 0 && cashReceivedNum < remainingAfterBalance) 
                ? 'not-allowed' 
                : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {submitting ? 'Đang xử lý...' : isDebt ? '📝 Tạo đơn ghi nợ' : '✓ Xác nhận thanh toán'}
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
        subtotal: completedOrder.subtotal || completedOrder.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
        discount: completedOrder.discount || 0,
        discount_code: completedOrder.discount_code,
        shipping_fee: completedOrder.shipping_fee || 0,
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
