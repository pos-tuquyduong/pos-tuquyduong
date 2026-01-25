/**
 * CustomerInput - Smart Customer Input Component
 * 2 input fields: Phone + Name với auto-detection
 * 
 * States:
 * - null: Chưa nhập (khách lẻ)
 * - 'existing': Khách cũ (có trong hệ thống)
 * - 'new': Khách mới (chưa có trong hệ thống)
 */

import { useState, useEffect, useRef } from 'react';
import { User, Phone, AlertCircle, CheckCircle, Zap, Loader2, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Normalize phone: bỏ +84, 84 -> 0
const normalizePhone = (phone) => {
  if (!phone) return '';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('84') && p.length >= 11) {
    p = '0' + p.slice(2);
  }
  return p;
};

export default function CustomerInput({ onCustomerChange }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null); // null | 'existing' | 'new'
  const [customerData, setCustomerData] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  
  // Ref to always have latest callback
  const onChangeRef = useRef(onCustomerChange);
  onChangeRef.current = onCustomerChange;

  // Debounce check phone
  useEffect(() => {
    const normalizedPhone = normalizePhone(phone);
    
    // Reset nếu phone trống hoặc quá ngắn
    if (!normalizedPhone || normalizedPhone.length < 10) {
      setStatus(null);
      setCustomerData(null);
      setName('');
      setError('');
      onChangeRef.current(null);
      return;
    }

    // Debounce 500ms
    const timer = setTimeout(() => {
      checkPhone(normalizedPhone);
    }, 500);

    return () => clearTimeout(timer);
  }, [phone]);

  // Check phone via API
  const checkPhone = async (normalizedPhone) => {
    setChecking(true);
    setError('');
    
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch(`${API_BASE}/api/pos/v2/customers/${normalizedPhone}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Khách cũ - có trong hệ thống
        const data = await res.json();
        setStatus('existing');
        setCustomerData(data);
        setName(data.name || '');
        
        onChangeRef.current({
          phone: normalizedPhone,
          name: data.name || '',
          isNew: false,
          balance: data.balance || 0,
          discount_type: data.discount_type,
          discount_value: data.discount_value || 0,
          source: data.source,
          is_synced: data.is_synced
        });
      } else if (res.status === 404) {
        // Khách mới - chưa có trong hệ thống
        setStatus('new');
        setCustomerData(null);
        setName(''); // Reset name để user nhập
        
        // Chưa gọi onCustomerChange vì chưa có tên
      } else {
        throw new Error('Lỗi kiểm tra số điện thoại');
      }
    } catch (err) {
      setError(err.message);
      setStatus(null);
      setCustomerData(null);
      onChangeRef.current(null); // Clear customer on error
    } finally {
      setChecking(false);
    }
  };

  // Handle name change for new customer
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    if (status === 'new' && newName.trim()) {
      onChangeRef.current({
        phone: normalizePhone(phone),
        name: newName.trim(),
        isNew: true,
        balance: 0,
        discount_type: null,
        discount_value: 0,
        source: 'pos',
        is_synced: false
      });
    } else if (status === 'new' && !newName.trim()) {
      // Name empty, clear customer
      onChangeRef.current(null);
    }
  };

  // Clear all
  const handleClear = () => {
    setPhone('');
    setName('');
    setStatus(null);
    setCustomerData(null);
    setError('');
    onChangeRef.current(null);
  };

  // Format balance
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  return (
    <div className="customer-input-container">
      {/* Row 1: Phone + Name inputs */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        {/* Phone Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }}>
            <Phone size={16} />
          </div>
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.95rem'
            }}
          />
          {checking && (
            <div style={{ 
              position: 'absolute', 
              right: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)'
            }}>
              <Loader2 size={16} className="spin" style={{ color: '#666' }} />
            </div>
          )}
        </div>

        {/* Name Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }}>
            <User size={16} />
          </div>
          <input
            type="text"
            placeholder="Tên khách hàng"
            value={name}
            onChange={handleNameChange}
            disabled={status === 'existing'} // Disable nếu khách cũ
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.95rem',
              backgroundColor: status === 'existing' ? '#f5f5f5' : 'white'
            }}
          />
        </div>

        {/* Clear button */}
        {(phone || name) && (
          <button
            onClick={handleClear}
            style={{
              padding: '0.6rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Xóa"
          >
            <X size={16} color="#666" />
          </button>
        )}
      </div>

      {/* Row 2: Status Badge + Info */}
      <div style={{ marginTop: '0.5rem' }}>
        {/* Error */}
        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#dc2626',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Status: Existing Customer */}
        {status === 'existing' && customerData && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              backgroundColor: '#dcfce7',
              color: '#16a34a'
            }}>
              <CheckCircle size={12} />
              KHÁCH CŨ
            </span>
            
            {customerData.balance > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#16a34a' }}>
                💰 Số dư: {formatMoney(customerData.balance)}đ
              </span>
            )}
            
            {customerData.discount_value > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#2563eb' }}>
                🏷️ CK: {customerData.discount_type === 'percent' 
                  ? `${customerData.discount_value}%` 
                  : `${formatMoney(customerData.discount_value)}đ`}
              </span>
            )}
            
            {customerData.source === 'sx' && (
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                (Đã sync SX)
              </span>
            )}
          </div>
        )}

        {/* Status: New Customer */}
        {status === 'new' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              backgroundColor: '#fef3c7',
              color: '#d97706'
            }}>
              <Zap size={12} />
              KHÁCH MỚI
            </span>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>
              Sẽ tự động tạo đăng ký khi thanh toán
            </span>
          </div>
        )}

        {/* Status: Empty (walk-in) */}
        {!status && !checking && !error && normalizePhone(phone).length < 10 && (
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            Để trống nếu khách lẻ
          </div>
        )}
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
