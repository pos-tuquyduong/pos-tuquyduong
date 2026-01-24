/**
 * InvoiceSettings.jsx - Trang cài đặt hóa đơn
 * UI 2 cột: Tùy chỉnh bên trái + Preview realtime bên phải
 */
import { useState, useEffect } from 'react';
import { 
  Save, RotateCcw, ChevronDown, ChevronRight, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image, Upload, Trash2, Eye
} from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
  // Khổ in mặc định
  default_size: 'a5',
  
  // Nội dung text
  text: {
    store_name: 'TỨ QUÝ ĐƯỜNG',
    slogan: 'Sức khỏe từ thiên nhiên',
    address: 'LK4-129 Trương Định, Tương Mai, HN',
    phone: '024 2245 5565',
    email: '',
    thank_you: 'Cảm ơn quý khách!',
    policy: 'Đổi trả trong 24h'
  },
  
  // Bật/tắt các trường
  show: {
    logo: true,
    store_name: true,
    slogan: true,
    address: true,
    phone: true,
    email: false,
    invoice_number: true,
    order_code: true,
    datetime: true,
    staff: true,
    qr_code: true,
    customer_name: true,
    customer_phone: true,
    customer_address: true,
    customer_balance: true,
    customer_type: false,
    customer_note: false,
    col_stt: true,
    col_product_code: false,
    col_unit: false,
    col_price: true,
    discount_detail: true,
    shipping_fee: true,
    amount_words: false,
    payment_checkbox: true,
    sig_seller: true,
    sig_shipper: true,
    sig_customer: true,
    thank_you: true,
    policy: true
  },
  
  // Căn chỉnh theo cụm
  align: {
    header: 'center',
    order_info: 'justify',
    customer: 'left',
    totals: 'right',
    signatures: 'justify',
    footer: 'center'
  }
};

// Preset mẫu
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
// SETTINGS API
// ═══════════════════════════════════════════════════════════════════════════
const api = {
  getConfig: async () => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings/invoice_config', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    // Nếu chưa có config (404), trả về object rỗng để sử dụng DEFAULT
    if (res.status === 404) {
      return { success: true, data: { value: null } };
    }
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  
  saveConfig: async (config) => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings', {
      method: 'PUT',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        settings: { 
          invoice_config: JSON.stringify(config) 
        } 
      })
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
  },
  
  getLogo: async () => {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings/store_logo', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    // Nếu chưa có logo (404), trả về rỗng
    if (res.status === 404) {
      return { success: true, data: { value: '' } };
    }
    if (!res.ok) throw new Error(data.error);
    return data;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
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

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // Load invoice config
      const result = await api.getConfig();
      if (result.success && result.data?.value) {
        const parsed = JSON.parse(result.data.value);
        setConfig(prev => mergeConfig(prev, parsed));
      }
      
      // Load logo
      const logoResult = await api.getLogo();
      if (logoResult.success && logoResult.data?.value) {
        setLogo(logoResult.data.value);
      }
    } catch (err) {
      console.error('Load config error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Merge config with defaults (để đảm bảo không thiếu field)
  const mergeConfig = (defaults, loaded) => {
    return {
      ...defaults,
      ...loaded,
      text: { ...defaults.text, ...(loaded.text || {}) },
      show: { ...defaults.show, ...(loaded.show || {}) },
      align: { ...defaults.align, ...(loaded.align || {}) }
    };
  };

  // Save config
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveConfig(config);
      showMessage('success', 'Đã lưu cài đặt hóa đơn!');
    } catch (err) {
      showMessage('error', 'Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (confirm('Bạn có chắc muốn reset về mặc định? Các cài đặt hiện tại sẽ mất.')) {
      setConfig(DEFAULT_CONFIG);
      setActivePreset('custom');
      showMessage('info', 'Đã reset về mặc định. Nhấn Lưu để áp dụng.');
    }
  };

  // Apply preset
  const applyPreset = (presetKey) => {
    if (presetKey === 'custom') {
      setActivePreset('custom');
      return;
    }
    
    const preset = PRESETS[presetKey];
    if (preset) {
      setConfig(prev => ({
        ...prev,
        show: { ...prev.show, ...preset.show }
      }));
      setActivePreset(presetKey);
      showMessage('info', `Đã áp dụng mẫu "${preset.name}". Nhấn Lưu để áp dụng.`);
    }
  };

  // Toggle section expand
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Update show field
  const toggleShow = (field) => {
    setConfig(prev => ({
      ...prev,
      show: { ...prev.show, [field]: !prev.show[field] }
    }));
    setActivePreset('custom');
  };

  // Update text field
  const updateText = (field, value) => {
    setConfig(prev => ({
      ...prev,
      text: { ...prev.text, [field]: value }
    }));
  };

  // Update alignment
  const updateAlign = (section, value) => {
    setConfig(prev => ({
      ...prev,
      align: { ...prev.align, [section]: value }
    }));
  };

  // Upload logo
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
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result);
      reader.readAsDataURL(file);
      showMessage('success', 'Đã upload logo!');
    } catch (err) {
      showMessage('error', 'Lỗi: ' + err.message);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Alignment button component
  const AlignButton = ({ section, value }) => {
    const icons = {
      left: AlignLeft,
      center: AlignCenter,
      right: AlignRight,
      justify: AlignJustify
    };
    const Icon = icons[value];
    const isActive = config.align[section] === value;
    
    return (
      <button
        className={`align-btn ${isActive ? 'active' : ''}`}
        onClick={() => updateAlign(section, value)}
        title={value === 'justify' ? 'Đều 2 bên' : value.charAt(0).toUpperCase() + value.slice(1)}
      >
        <Icon size={14} />
      </button>
    );
  };

  // Toggle with label component
  const ToggleField = ({ field, label, children }) => (
    <div className="toggle-field">
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={config.show[field]}
          onChange={() => toggleShow(field)}
        />
        <span className="toggle-switch"></span>
        <span className="toggle-text">{label}</span>
      </label>
      {children && config.show[field] && (
        <div className="toggle-input">
          {children}
        </div>
      )}
    </div>
  );

  // Section header component
  const SectionHeader = ({ id, title, alignable = false }) => (
    <div className="section-header" onClick={() => toggleSection(id)}>
      <div className="section-title">
        {expandedSections[id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span>{title}</span>
      </div>
      {alignable && expandedSections[id] && (
        <div className="align-buttons" onClick={e => e.stopPropagation()}>
          <AlignButton section={id} value="left" />
          <AlignButton section={id} value="center" />
          <AlignButton section={id} value="right" />
          {(id === 'order_info' || id === 'signatures') && (
            <AlignButton section={id} value="justify" />
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải cài đặt...</p>
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

      {/* Message */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Preset buttons */}
      <div className="preset-bar">
        <span className="preset-label">Mẫu nhanh:</span>
        <div className="preset-buttons">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`preset-btn ${activePreset === key ? 'active' : ''}`}
              onClick={() => applyPreset(key)}
            >
              {preset.name}
            </button>
          ))}
          <button
            className={`preset-btn ${activePreset === 'custom' ? 'active' : ''}`}
            onClick={() => setActivePreset('custom')}
          >
            Tùy chỉnh
          </button>
        </div>
        <div className="size-selector">
          <span>Khổ mặc định:</span>
          <select 
            value={config.default_size} 
            onChange={e => setConfig(prev => ({ ...prev, default_size: e.target.value }))}
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
            <option value="a5">A5</option>
            <option value="a4">A4</option>
          </select>
        </div>
      </div>

      {/* Main content: 2 columns */}
      <div className="settings-content">
        {/* Left column: Settings */}
        <div className="settings-panel">
          <h2>📝 Tùy chỉnh</h2>

          {/* HEADER Section */}
          <div className="section">
            <SectionHeader id="header" title="HEADER" alignable />
            {expandedSections.header && (
              <div className="section-content">
                {/* Logo */}
                <div className="toggle-field logo-field">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={config.show.logo}
                      onChange={() => toggleShow('logo')}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">Logo</span>
                  </label>
                  {config.show.logo && (
                    <div className="logo-upload">
                      {logo ? (
                        <div className="logo-preview">
                          <img src={logo} alt="Logo" />
                          <button 
                            className="btn-remove-logo"
                            onClick={() => setLogo('')}
                            title="Xóa logo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="upload-btn">
                          <Upload size={14} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <ToggleField field="store_name" label="Tên cửa hàng">
                  <input
                    type="text"
                    value={config.text.store_name}
                    onChange={e => updateText('store_name', e.target.value)}
                    placeholder="Tên cửa hàng"
                  />
                </ToggleField>

                <ToggleField field="slogan" label="Slogan">
                  <input
                    type="text"
                    value={config.text.slogan}
                    onChange={e => updateText('slogan', e.target.value)}
                    placeholder="Slogan"
                  />
                </ToggleField>

                <ToggleField field="address" label="Địa chỉ">
                  <input
                    type="text"
                    value={config.text.address}
                    onChange={e => updateText('address', e.target.value)}
                    placeholder="Địa chỉ"
                  />
                </ToggleField>

                <ToggleField field="phone" label="Hotline">
                  <input
                    type="text"
                    value={config.text.phone}
                    onChange={e => updateText('phone', e.target.value)}
                    placeholder="Số điện thoại"
                  />
                </ToggleField>

                <ToggleField field="email" label="Email">
                  <input
                    type="email"
                    value={config.text.email}
                    onChange={e => updateText('email', e.target.value)}
                    placeholder="Email"
                  />
                </ToggleField>
              </div>
            )}
          </div>

          {/* ORDER INFO Section */}
          <div className="section">
            <SectionHeader id="order_info" title="ĐƠN HÀNG" alignable />
            {expandedSections.order_info && (
              <div className="section-content">
                <ToggleField field="invoice_number" label="Số hóa đơn" />
                <ToggleField field="order_code" label="Mã đơn hàng" />
                <ToggleField field="datetime" label="Ngày giờ" />
                <ToggleField field="staff" label="Nhân viên" />
                <ToggleField field="qr_code" label="QR code tra cứu" />
              </div>
            )}
          </div>

          {/* CUSTOMER Section */}
          <div className="section">
            <SectionHeader id="customer" title="KHÁCH HÀNG" alignable />
            {expandedSections.customer && (
              <div className="section-content">
                <ToggleField field="customer_name" label="Tên khách" />
                <ToggleField field="customer_phone" label="Số điện thoại" />
                <ToggleField field="customer_address" label="Địa chỉ giao hàng" />
                <ToggleField field="customer_balance" label="Số dư tài khoản" />
                <ToggleField field="customer_type" label="Loại khách hàng" />
                <ToggleField field="customer_note" label="Ghi chú" />
              </div>
            )}
          </div>

          {/* PRODUCTS Section */}
          <div className="section">
            <SectionHeader id="products" title="BẢNG SẢN PHẨM" />
            {expandedSections.products && (
              <div className="section-content">
                <ToggleField field="col_stt" label="Cột STT" />
                <ToggleField field="col_product_code" label="Cột mã SP" />
                <ToggleField field="col_unit" label="Cột đơn vị tính" />
                <ToggleField field="col_price" label="Cột đơn giá" />
              </div>
            )}
          </div>

          {/* PAYMENT Section */}
          <div className="section">
            <SectionHeader id="totals" title="THANH TOÁN" alignable />
            {expandedSections.totals && (
              <div className="section-content">
                <ToggleField field="discount_detail" label="Chi tiết chiết khấu" />
                <ToggleField field="shipping_fee" label="Phí giao hàng" />
                <ToggleField field="amount_words" label="Số tiền bằng chữ" />
                <ToggleField field="payment_checkbox" label="Checkbox xác nhận TT" />
              </div>
            )}
          </div>

          {/* SIGNATURES Section */}
          <div className="section">
            <SectionHeader id="signatures" title="CHỮ KÝ" alignable />
            {expandedSections.signatures && (
              <div className="section-content">
                <ToggleField field="sig_seller" label="NV bán hàng" />
                <ToggleField field="sig_shipper" label="NV giao hàng" />
                <ToggleField field="sig_customer" label="Khách hàng" />
              </div>
            )}
          </div>

          {/* FOOTER Section */}
          <div className="section">
            <SectionHeader id="footer" title="FOOTER" alignable />
            {expandedSections.footer && (
              <div className="section-content">
                <ToggleField field="thank_you" label="Lời cảm ơn">
                  <input
                    type="text"
                    value={config.text.thank_you}
                    onChange={e => updateText('thank_you', e.target.value)}
                    placeholder="Lời cảm ơn"
                  />
                </ToggleField>

                <ToggleField field="policy" label="Chính sách">
                  <input
                    type="text"
                    value={config.text.policy}
                    onChange={e => updateText('policy', e.target.value)}
                    placeholder="Chính sách đổi trả"
                  />
                </ToggleField>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2><Eye size={18} /> Xem trước</h2>
            <div className="preview-size-buttons">
              {['58mm', '80mm', 'a5', 'a4'].map(size => (
                <button
                  key={size}
                  className={`size-btn ${previewSize === size ? 'active' : ''}`}
                  onClick={() => setPreviewSize(size)}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="preview-container">
            <InvoicePreview 
              config={config} 
              size={previewSize} 
              logo={logo}
            />
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .invoice-settings {
          padding: 1rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #10b981;
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background: #059669;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-outline {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover {
          background: #f3f4f6;
        }

        .message {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .message-success {
          background: #d1fae5;
          color: #065f46;
        }

        .message-error {
          background: #fee2e2;
          color: #991b1b;
        }

        .message-info {
          background: #dbeafe;
          color: #1e40af;
        }

        .preset-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .preset-label {
          font-weight: 500;
          color: #64748b;
        }

        .preset-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .preset-btn {
          padding: 0.375rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          border-color: #10b981;
          color: #10b981;
        }

        .preset-btn.active {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .size-selector {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .size-selector select {
          padding: 0.375rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .settings-content {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .settings-content {
            grid-template-columns: 1fr;
          }
        }

        .settings-panel {
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .settings-panel h2 {
          margin: 0;
          padding: 1rem;
          font-size: 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .section {
          border-bottom: 1px solid #e2e8f0;
        }

        .section:last-child {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          background: #fafafa;
          user-select: none;
        }

        .section-header:hover {
          background: #f0f0f0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.8rem;
          color: #374151;
        }

        .align-buttons {
          display: flex;
          gap: 2px;
        }

        .align-btn {
          padding: 4px 6px;
          border: 1px solid #d1d5db;
          background: white;
          cursor: pointer;
          color: #64748b;
          border-radius: 3px;
        }

        .align-btn:hover {
          background: #f3f4f6;
        }

        .align-btn.active {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .section-content {
          padding: 0.5rem 1rem 1rem;
        }

        .toggle-field {
          margin-bottom: 0.5rem;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem 0;
        }

        .toggle-label input {
          display: none;
        }

        .toggle-switch {
          width: 36px;
          height: 20px;
          background: #d1d5db;
          border-radius: 10px;
          position: relative;
          transition: background 0.2s;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .toggle-label input:checked + .toggle-switch {
          background: #10b981;
        }

        .toggle-label input:checked + .toggle-switch::after {
          transform: translateX(16px);
        }

        .toggle-text {
          font-size: 0.875rem;
          color: #374151;
        }

        .toggle-input {
          margin-top: 0.375rem;
          margin-left: 44px;
        }

        .toggle-input input {
          width: 100%;
          padding: 0.375rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .toggle-input input:focus {
          outline: none;
          border-color: #10b981;
        }

        .logo-field {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-upload {
          display: flex;
          align-items: center;
        }

        .logo-preview {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .logo-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .btn-remove-logo {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.5rem;
          background: #f3f4f6;
          border: 1px dashed #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          color: #64748b;
        }

        .upload-btn:hover {
          background: #e5e7eb;
        }

        .preview-panel {
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .preview-header h2 {
          margin: 0;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-size-buttons {
          display: flex;
          gap: 0.25rem;
        }

        .size-btn {
          padding: 0.375rem 0.75rem;
          border: 1px solid #d1d5db;
          background: white;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 4px;
        }

        .size-btn:hover {
          background: #f3f4f6;
        }

        .size-btn.active {
          background: #1e293b;
          color: white;
          border-color: #1e293b;
        }

        .preview-container {
          padding: 1.5rem;
          background: #f1f5f9;
          min-height: 600px;
          display: flex;
          justify-content: center;
          overflow: auto;
        }

        @media (max-width: 640px) {
          .settings-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: flex-end;
          }

          .preset-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .size-selector {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
