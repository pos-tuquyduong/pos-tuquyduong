/**
 * InvoiceSettings.jsx - Trang cài đặt hóa đơn
 * UI 2 cột: Tùy chỉnh bên trái + Preview realtime bên phải
 * 
 * FIX 1: Sub-components BÊN NGOÀI để tránh mất focus khi gõ
 * FIX 2: STALE-WHILE-REVALIDATE pattern - 1 API duy nhất + cache
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ Có cache? → Hiển thị NGAY (0ms), API update ngầm       │
 * │ Không cache? → Hiện loading, chờ API                   │
 * │ Kết quả: Trang mở tức thì như app native!              │
 * └─────────────────────────────────────────────────────────┘
 */
import { useState, useEffect } from 'react';
import { 
  Save, RotateCcw, ChevronDown, ChevronRight, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Upload, Trash2, Eye
} from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
  default_size: 'a5',
  text: {
    store_name: 'TỨ QUÝ ĐƯỜNG',
    slogan: 'Sức khỏe từ thiên nhiên',
    address: 'LK4-129 Trương Định, Tương Mai, HN',
    phone: '024 2245 5565',
    email: '',
    thank_you: 'Cảm ơn quý khách!',
    policy: 'Đổi trả trong 24h'
  },
  show: {
    logo: true, store_name: true, slogan: true, address: true, phone: true, email: false,
    invoice_number: true, order_code: true, datetime: true, staff: true, qr_code: true,
    customer_name: true, customer_phone: true, customer_address: true, customer_balance: true,
    customer_type: false, customer_note: false,
    col_stt: true, col_product_code: false, col_unit: false, col_price: true,
    discount_detail: true, shipping_fee: true, amount_words: false, payment_checkbox: true,
    sig_seller: true, sig_shipper: true, sig_customer: true,
    thank_you: true, policy: true
  },
  align: {
    header: 'center',
    order_info: 'justify',
    customer: 'left',
    totals: 'right',
    signatures: 'justify',
    footer: 'center'
  }
};

const PRESETS = {
  basic: {
    name: 'Cơ bản',
    show: {
      logo: true, store_name: true, slogan: false, address: true, phone: true, email: false,
      invoice_number: true, order_code: false, datetime: true, staff: true, qr_code: false,
      customer_name: true, customer_phone: true, customer_address: false, customer_balance: false,
      customer_type: false, customer_note: false,
      col_stt: false, col_product_code: false, col_unit: false, col_price: true,
      discount_detail: false, shipping_fee: true, amount_words: false, payment_checkbox: false,
      sig_seller: false, sig_shipper: false, sig_customer: false,
      thank_you: true, policy: false
    }
  },
  full: {
    name: 'Đầy đủ',
    show: {
      logo: true, store_name: true, slogan: true, address: true, phone: true, email: false,
      invoice_number: true, order_code: true, datetime: true, staff: true, qr_code: true,
      customer_name: true, customer_phone: true, customer_address: true, customer_balance: true,
      customer_type: false, customer_note: true,
      col_stt: true, col_product_code: false, col_unit: false, col_price: true,
      discount_detail: true, shipping_fee: true, amount_words: true, payment_checkbox: true,
      sig_seller: true, sig_shipper: true, sig_customer: true,
      thank_you: true, policy: true
    }
  },
  delivery: {
    name: 'Giao hàng',
    show: {
      logo: true, store_name: true, slogan: false, address: false, phone: true, email: false,
      invoice_number: true, order_code: true, datetime: true, staff: true, qr_code: true,
      customer_name: true, customer_phone: true, customer_address: true, customer_balance: false,
      customer_type: false, customer_note: true,
      col_stt: false, col_product_code: false, col_unit: false, col_price: true,
      discount_detail: true, shipping_fee: true, amount_words: false, payment_checkbox: true,
      sig_seller: true, sig_shipper: true, sig_customer: true,
      thank_you: true, policy: false
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (định nghĩa BÊN NGOÀI để tránh mất focus)
// ═══════════════════════════════════════════════════════════════════════════

// Alignment button
const AlignButton = ({ section, value, currentAlign, onUpdate }) => {
  const icons = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify };
  const Icon = icons[value];
  const isActive = currentAlign === value;
  
  return (
    <button
      className={`align-btn ${isActive ? 'active' : ''}`}
      onClick={() => onUpdate(section, value)}
      title={value === 'justify' ? 'Đều 2 bên' : value.charAt(0).toUpperCase() + value.slice(1)}
    >
      <Icon size={14} />
    </button>
  );
};

// Toggle field (chỉ toggle, không có input con)
const ToggleOnly = ({ field, label, checked, onToggle }) => (
  <div className="toggle-field">
    <label className="toggle-label">
      <input type="checkbox" checked={checked} onChange={() => onToggle(field)} />
      <span className="toggle-switch"></span>
      <span className="toggle-text">{label}</span>
    </label>
  </div>
);

// Toggle field với input text
const ToggleWithInput = ({ field, label, checked, onToggle, textValue, onTextChange, placeholder, inputType = 'text' }) => (
  <div className="toggle-field">
    <label className="toggle-label">
      <input type="checkbox" checked={checked} onChange={() => onToggle(field)} />
      <span className="toggle-switch"></span>
      <span className="toggle-text">{label}</span>
    </label>
    {checked && (
      <div className="toggle-input">
        <input
          type={inputType}
          value={textValue}
          onChange={e => onTextChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    )}
  </div>
);

// Section header
const SectionHeader = ({ id, title, alignable, expanded, onToggle, currentAlign, onAlignUpdate }) => (
  <div className="section-header" onClick={() => onToggle(id)}>
    <div className="section-title">
      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      <span>{title}</span>
    </div>
    {alignable && expanded && (
      <div className="align-buttons" onClick={e => e.stopPropagation()}>
        <AlignButton section={id} value="left" currentAlign={currentAlign} onUpdate={onAlignUpdate} />
        <AlignButton section={id} value="center" currentAlign={currentAlign} onUpdate={onAlignUpdate} />
        <AlignButton section={id} value="right" currentAlign={currentAlign} onUpdate={onAlignUpdate} />
        {(id === 'order_info' || id === 'signatures') && (
          <AlignButton section={id} value="justify" currentAlign={currentAlign} onUpdate={onAlignUpdate} />
        )}
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// API - 1 API DUY NHẤT + TIMEOUT (pattern giống Customers/Orders)
// ═══════════════════════════════════════════════════════════════════════════
const CACHE_KEY = 'pos_invoice_settings_cache';
const API_TIMEOUT = 10000; // 10 giây

const api = {
  // Load TẤT CẢ settings trong 1 call
  loadAll: async () => {
    const token = localStorage.getItem('pos_token');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const res = await fetch('/api/pos/settings', {
        headers: { 'Authorization': 'Bearer ' + token },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Timeout - API không phản hồi');
      throw err;
    }
  },
  
  saveConfig: async (config) => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { invoice_config: JSON.stringify(config) } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  
  uploadLogo: async (file) => {
    const token = localStorage.getItem('pos_token');
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch('/api/pos/settings/logo', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function InvoiceSettings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewSize, setPreviewSize] = useState('a5');
  const [expandedSections, setExpandedSections] = useState({
    header: true, order_info: true, customer: true, products: true, 
    totals: true, signatures: true, footer: true
  });
  const [activePreset, setActivePreset] = useState('custom');

  // ═══════════════════════════════════════════════════════════════════════════
  // STALE-WHILE-REVALIDATE: Có cache → hiện ngay, API chạy ngầm
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    let hasCache = false;
    
    // Bước 1: Load từ cache NGAY LẬP TỨC (0ms)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { config: cachedConfig, logo: cachedLogo } = JSON.parse(cached);
        if (cachedConfig) {
          setConfig(prev => mergeConfig(prev, cachedConfig));
          hasCache = true;
        }
        if (cachedLogo) setLogo(cachedLogo);
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    // Bước 2: Chỉ hiện loading nếu KHÔNG có cache
    if (!hasCache) {
      setLoading(true);
    }
    
    // Bước 3: Load từ API (chạy ngầm nếu có cache)
    try {
      const result = await api.loadAll();
      
      if (result.success && result.data) {
        const settings = result.data;
        
        // Parse invoice_config
        let newConfig = DEFAULT_CONFIG;
        if (settings.invoice_config) {
          try {
            const parsed = JSON.parse(settings.invoice_config);
            newConfig = mergeConfig(DEFAULT_CONFIG, parsed);
          } catch (e) {
            console.warn('Parse config error:', e);
          }
        }
        setConfig(newConfig);
        
        // Get logo
        const newLogo = settings.store_logo || '';
        setLogo(newLogo);
        
        // Save to cache
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            config: newConfig, logo: newLogo, timestamp: Date.now()
          }));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Load settings error:', err);
      if (!hasCache) {
        showMessage('error', 'Không thể tải cài đặt: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const mergeConfig = (defaults, loaded) => ({
    ...defaults, ...loaded,
    text: { ...defaults.text, ...(loaded.text || {}) },
    show: { ...defaults.show, ...(loaded.show || {}) },
    align: { ...defaults.align, ...(loaded.align || {}) }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveConfig(config);
      // Update cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          config, logo, timestamp: Date.now()
        }));
      } catch (e) {}
      showMessage('success', '✓ Đã lưu cài đặt hóa đơn!');
    } catch (err) {
      showMessage('error', 'Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc muốn reset về mặc định?')) {
      setConfig(DEFAULT_CONFIG);
      setActivePreset('custom');
      showMessage('info', 'Đã reset. Nhấn "Lưu cài đặt" để áp dụng.');
    }
  };

  const applyPreset = (key) => {
    if (key === 'custom') { setActivePreset('custom'); return; }
    const preset = PRESETS[key];
    if (preset) {
      setConfig(prev => ({ ...prev, show: { ...prev.show, ...preset.show } }));
      setActivePreset(key);
      showMessage('info', `Đã áp dụng mẫu "${preset.name}". Nhấn Lưu để áp dụng.`);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleShow = (field) => {
    setConfig(prev => ({ ...prev, show: { ...prev.show, [field]: !prev.show[field] } }));
    setActivePreset('custom');
  };

  const updateText = (field, value) => {
    setConfig(prev => ({ ...prev, text: { ...prev.text, [field]: value } }));
  };

  const updateAlign = (section, value) => {
    setConfig(prev => ({ ...prev, align: { ...prev.align, [section]: value } }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showMessage('error', 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)');
      return;
    }
    if (file.size > 500 * 1024) {
      showMessage('error', 'File quá lớn (tối đa 500KB)');
      return;
    }
    setSaving(true);
    try {
      await api.uploadLogo(file);
      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result);
      reader.readAsDataURL(file);
      showMessage('success', '✓ Đã upload logo!');
    } catch (err) {
      showMessage('error', 'Lỗi: ' + err.message);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  if (loading) {
    return (
      <div className="invoice-settings">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải cài đặt...</p>
        </div>
        <style>{`
          .invoice-settings { padding: 1rem; }
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; gap: 1rem; }
          .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="invoice-settings">
      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Cài đặt Hóa đơn</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleReset} disabled={saving}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {message.text && <div className={`message message-${message.type}`}>{message.text}</div>}

      {/* Preset bar */}
      <div className="preset-bar">
        <span className="preset-label">Mẫu nhanh:</span>
        <div className="preset-buttons">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button key={key} className={`preset-btn ${activePreset === key ? 'active' : ''}`} onClick={() => applyPreset(key)}>
              {preset.name}
            </button>
          ))}
          <button className={`preset-btn ${activePreset === 'custom' ? 'active' : ''}`} onClick={() => setActivePreset('custom')}>
            Tùy chỉnh
          </button>
        </div>
        <div className="size-selector">
          <span>Khổ mặc định:</span>
          <select value={config.default_size} onChange={e => setConfig(prev => ({ ...prev, default_size: e.target.value }))}>
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
            <option value="a5">A5</option>
            <option value="a4">A4</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      <div className="settings-content">
        {/* Left: Settings */}
        <div className="settings-panel">
          <h2>📝 Tùy chỉnh</h2>

          {/* HEADER Section */}
          <div className="section">
            <SectionHeader id="header" title="HEADER" alignable expanded={expandedSections.header} 
              onToggle={toggleSection} currentAlign={config.align.header} onAlignUpdate={updateAlign} />
            {expandedSections.header && (
              <div className="section-content">
                {/* Logo */}
                <div className="toggle-field logo-field">
                  <label className="toggle-label">
                    <input type="checkbox" checked={config.show.logo} onChange={() => toggleShow('logo')} />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">Logo</span>
                  </label>
                  {config.show.logo && (
                    <div className="logo-upload">
                      {logo ? (
                        <div className="logo-preview">
                          <img src={logo} alt="Logo" />
                          <button className="btn-remove-logo" onClick={() => setLogo('')} title="Xóa logo">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="upload-btn">
                          <Upload size={14} /><span>Upload</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <ToggleWithInput field="store_name" label="Tên cửa hàng" checked={config.show.store_name}
                  onToggle={toggleShow} textValue={config.text.store_name} onTextChange={v => updateText('store_name', v)} placeholder="Tên cửa hàng" />
                <ToggleWithInput field="slogan" label="Slogan" checked={config.show.slogan}
                  onToggle={toggleShow} textValue={config.text.slogan} onTextChange={v => updateText('slogan', v)} placeholder="Slogan" />
                <ToggleWithInput field="address" label="Địa chỉ" checked={config.show.address}
                  onToggle={toggleShow} textValue={config.text.address} onTextChange={v => updateText('address', v)} placeholder="Địa chỉ" />
                <ToggleWithInput field="phone" label="Hotline" checked={config.show.phone}
                  onToggle={toggleShow} textValue={config.text.phone} onTextChange={v => updateText('phone', v)} placeholder="Số điện thoại" />
                <ToggleWithInput field="email" label="Email" checked={config.show.email}
                  onToggle={toggleShow} textValue={config.text.email} onTextChange={v => updateText('email', v)} placeholder="Email" inputType="email" />
              </div>
            )}
          </div>

          {/* ORDER INFO Section */}
          <div className="section">
            <SectionHeader id="order_info" title="ĐƠN HÀNG" alignable expanded={expandedSections.order_info}
              onToggle={toggleSection} currentAlign={config.align.order_info} onAlignUpdate={updateAlign} />
            {expandedSections.order_info && (
              <div className="section-content">
                <ToggleOnly field="invoice_number" label="Số hóa đơn" checked={config.show.invoice_number} onToggle={toggleShow} />
                <ToggleOnly field="order_code" label="Mã đơn hàng" checked={config.show.order_code} onToggle={toggleShow} />
                <ToggleOnly field="datetime" label="Ngày giờ" checked={config.show.datetime} onToggle={toggleShow} />
                <ToggleOnly field="staff" label="Nhân viên" checked={config.show.staff} onToggle={toggleShow} />
                <ToggleOnly field="qr_code" label="QR code tra cứu" checked={config.show.qr_code} onToggle={toggleShow} />
              </div>
            )}
          </div>

          {/* CUSTOMER Section */}
          <div className="section">
            <SectionHeader id="customer" title="KHÁCH HÀNG" alignable expanded={expandedSections.customer}
              onToggle={toggleSection} currentAlign={config.align.customer} onAlignUpdate={updateAlign} />
            {expandedSections.customer && (
              <div className="section-content">
                <ToggleOnly field="customer_name" label="Tên khách" checked={config.show.customer_name} onToggle={toggleShow} />
                <ToggleOnly field="customer_phone" label="Số điện thoại" checked={config.show.customer_phone} onToggle={toggleShow} />
                <ToggleOnly field="customer_address" label="Địa chỉ giao hàng" checked={config.show.customer_address} onToggle={toggleShow} />
                <ToggleOnly field="customer_balance" label="Số dư tài khoản" checked={config.show.customer_balance} onToggle={toggleShow} />
                <ToggleOnly field="customer_type" label="Loại khách hàng" checked={config.show.customer_type} onToggle={toggleShow} />
                <ToggleOnly field="customer_note" label="Ghi chú" checked={config.show.customer_note} onToggle={toggleShow} />
              </div>
            )}
          </div>

          {/* PRODUCTS Section */}
          <div className="section">
            <SectionHeader id="products" title="BẢNG SẢN PHẨM" expanded={expandedSections.products} onToggle={toggleSection} />
            {expandedSections.products && (
              <div className="section-content">
                <ToggleOnly field="col_stt" label="Cột STT" checked={config.show.col_stt} onToggle={toggleShow} />
                <ToggleOnly field="col_product_code" label="Cột mã SP" checked={config.show.col_product_code} onToggle={toggleShow} />
                <ToggleOnly field="col_unit" label="Cột đơn vị tính" checked={config.show.col_unit} onToggle={toggleShow} />
                <ToggleOnly field="col_price" label="Cột đơn giá" checked={config.show.col_price} onToggle={toggleShow} />
              </div>
            )}
          </div>

          {/* TOTALS Section */}
          <div className="section">
            <SectionHeader id="totals" title="THANH TOÁN" alignable expanded={expandedSections.totals}
              onToggle={toggleSection} currentAlign={config.align.totals} onAlignUpdate={updateAlign} />
            {expandedSections.totals && (
              <div className="section-content">
                <ToggleOnly field="discount_detail" label="Chi tiết chiết khấu" checked={config.show.discount_detail} onToggle={toggleShow} />
                <ToggleOnly field="shipping_fee" label="Phí giao hàng" checked={config.show.shipping_fee} onToggle={toggleShow} />
                <ToggleOnly field="amount_words" label="Số tiền bằng chữ" checked={config.show.amount_words} onToggle={toggleShow} />
                <ToggleOnly field="payment_checkbox" label="Checkbox xác nhận TT" checked={config.show.payment_checkbox} onToggle={toggleShow} />
              </div>
            )}
          </div>

          {/* SIGNATURES Section */}
          <div className="section">
            <SectionHeader id="signatures" title="CHỮ KÝ" alignable expanded={expandedSections.signatures}
              onToggle={toggleSection} currentAlign={config.align.signatures} onAlignUpdate={updateAlign} />
            {expandedSections.signatures && (
              <div className="section-content">
                <ToggleOnly field="sig_seller" label="NV bán hàng" checked={config.show.sig_seller} onToggle={toggleShow} />
                <ToggleOnly field="sig_shipper" label="NV giao hàng" checked={config.show.sig_shipper} onToggle={toggleShow} />
                <ToggleOnly field="sig_customer" label="Khách hàng" checked={config.show.sig_customer} onToggle={toggleShow} />
              </div>
            )}
          </div>

          {/* FOOTER Section */}
          <div className="section">
            <SectionHeader id="footer" title="FOOTER" alignable expanded={expandedSections.footer}
              onToggle={toggleSection} currentAlign={config.align.footer} onAlignUpdate={updateAlign} />
            {expandedSections.footer && (
              <div className="section-content">
                <ToggleWithInput field="thank_you" label="Lời cảm ơn" checked={config.show.thank_you}
                  onToggle={toggleShow} textValue={config.text.thank_you} onTextChange={v => updateText('thank_you', v)} placeholder="Lời cảm ơn" />
                <ToggleWithInput field="policy" label="Chính sách" checked={config.show.policy}
                  onToggle={toggleShow} textValue={config.text.policy} onTextChange={v => updateText('policy', v)} placeholder="Chính sách đổi trả" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2><Eye size={18} /> Xem trước</h2>
            <div className="preview-size-buttons">
              {['58mm', '80mm', 'a5', 'a4'].map(size => (
                <button key={size} className={`size-btn ${previewSize === size ? 'active' : ''}`} onClick={() => setPreviewSize(size)}>
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="preview-container">
            <InvoicePreview config={config} size={previewSize} logo={logo} />
          </div>
        </div>
      </div>

      <style>{`
        .invoice-settings { padding: 1rem; max-width: 1600px; margin: 0 auto; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; gap: 1rem; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
        .settings-header h1 { margin: 0; font-size: 1.5rem; }
        .header-actions { display: flex; gap: 0.5rem; }
        
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
        .btn-primary { background: #10b981; color: white; border: none; }
        .btn-primary:hover { background: #059669; }
        .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
        .btn-outline { background: white; color: #374151; border: 1px solid #d1d5db; }
        .btn-outline:hover { background: #f3f4f6; }
        
        .message { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-weight: 500; }
        .message-success { background: #d1fae5; color: #065f46; }
        .message-error { background: #fee2e2; color: #991b1b; }
        .message-info { background: #dbeafe; color: #1e40af; }
        
        .preset-bar { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
        .preset-label { font-weight: 500; color: #64748b; }
        .preset-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .preset-btn { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; }
        .preset-btn:hover { border-color: #10b981; color: #10b981; }
        .preset-btn.active { background: #10b981; color: white; border-color: #10b981; }
        .size-selector { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
        .size-selector select { padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; }
        
        .settings-content { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
        @media (max-width: 1024px) { .settings-content { grid-template-columns: 1fr; } }
        
        .settings-panel { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .settings-panel h2 { margin: 0; padding: 1rem; font-size: 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        
        .section { border-bottom: 1px solid #e2e8f0; }
        .section:last-child { border-bottom: none; }
        .section-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; cursor: pointer; background: #fafafa; user-select: none; }
        .section-header:hover { background: #f0f0f0; }
        .section-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.8rem; color: #374151; }
        .align-buttons { display: flex; gap: 2px; }
        .align-btn { padding: 4px 6px; border: 1px solid #d1d5db; background: white; cursor: pointer; color: #64748b; border-radius: 3px; }
        .align-btn:hover { background: #f3f4f6; }
        .align-btn.active { background: #10b981; color: white; border-color: #10b981; }
        .section-content { padding: 0.5rem 1rem 1rem; }
        
        .toggle-field { margin-bottom: 0.5rem; }
        .toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.25rem 0; }
        .toggle-label input { display: none; }
        .toggle-switch { width: 36px; height: 20px; background: #d1d5db; border-radius: 10px; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s; }
        .toggle-label input:checked + .toggle-switch { background: #10b981; }
        .toggle-label input:checked + .toggle-switch::after { transform: translateX(16px); }
        .toggle-text { font-size: 0.875rem; color: #374151; }
        .toggle-input { margin-top: 0.375rem; margin-left: 44px; }
        .toggle-input input { width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.875rem; }
        .toggle-input input:focus { outline: none; border-color: #10b981; }
        
        .logo-field { display: flex; align-items: center; justify-content: space-between; }
        .logo-upload { display: flex; align-items: center; }
        .logo-preview { position: relative; width: 40px; height: 40px; }
        .logo-preview img { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; }
        .btn-remove-logo { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .upload-btn { display: flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.5rem; background: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 4px; cursor: pointer; font-size: 0.75rem; color: #64748b; }
        .upload-btn:hover { background: #e5e7eb; }
        
        .preview-panel { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .preview-header h2 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .preview-size-buttons { display: flex; gap: 0.25rem; }
        .size-btn { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; background: white; cursor: pointer; font-size: 0.75rem; font-weight: 500; border-radius: 4px; }
        .size-btn:hover { background: #f3f4f6; }
        .size-btn.active { background: #1e293b; color: white; border-color: #1e293b; }
        .preview-container { padding: 1.5rem; background: #f1f5f9; min-height: 600px; display: flex; justify-content: center; overflow: auto; }
        
        @media (max-width: 640px) {
          .settings-header { flex-direction: column; align-items: stretch; }
          .header-actions { justify-content: flex-end; }
          .preset-bar { flex-direction: column; align-items: stretch; }
          .size-selector { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
