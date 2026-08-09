/**
 * InvoicePreview.jsx - Component preview hóa đơn realtime
 * Hiển thị hóa đơn theo config và size được chọn
 */
import { useMemo } from 'react';

// Sample data for preview
const SAMPLE_DATA = {
  invoice_number: '00001/2026',
  order_code: 'DH-230126-001',
  datetime: '23/01/2026 11:30',
  staff: 'Nhân viên A',
  customer: {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    balance: 150000,
    type: 'VIP',
    note: 'Giao buổi sáng'
  },
  items: [
    { code: 'HTS01', name: 'Hồng Tân Sinh', unit: 'Túi', qty: 2, price: 25000, total: 50000 },
    { code: 'LTK01', name: 'Lục Tân Khí', unit: 'Túi', qty: 1, price: 30000, total: 30000 },
    { code: 'TQD01', name: 'Trà Tứ Quý', unit: 'Hộp', qty: 1, price: 45000, total: 45000 }
  ],
  subtotal: 125000,
  discount: 12500,
  discount_type: 'percent',  // 'percent' | 'fixed' | null
  discount_value: 10,        // Giá trị: 10 (%) hoặc 50000 (đ)
  discount_code: null,       // Mã code nếu có
  shipping: 15000,
  total: 127500,
  // Payment info (hiển thị section thanh toán trên hóa đơn)
  payment_method: 'cash',
  cash_received: 200000,
  change_amount: 72500,
  balance_amount: 0,
  debt_amount: 0,
  signup_code: null  // Bước 3: mã ưu đãi khách mới, null = không hiện khối này (mẫu xem trước không cần bịa mã)
};

// Number to Vietnamese words
const numberToWords = (num) => {
  if (num === 0) return 'Không đồng';
  
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  
  const readThreeDigits = (n) => {
    let str = '';
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    
    if (hundreds > 0) str += digits[hundreds] + ' trăm ';
    if (tens > 1) str += digits[tens] + ' mươi ';
    else if (tens === 1) str += 'mười ';
    else if (tens === 0 && hundreds > 0 && ones > 0) str += 'lẻ ';
    
    if (ones > 0) {
      if (tens > 1 && ones === 1) str += 'mốt';
      else if (tens >= 1 && ones === 5) str += 'lăm';
      else str += digits[ones];
    }
    
    return str.trim();
  };
  
  let result = '';
  let unitIndex = 0;
  
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      result = readThreeDigits(chunk) + ' ' + units[unitIndex] + ' ' + result;
    }
    num = Math.floor(num / 1000);
    unitIndex++;
  }
  
  return result.trim().replace(/\s+/g, ' ') + ' đồng';
};

// Format currency
const formatCurrency = (num) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export default function InvoicePreview({ config, size = 'a5', logo = '', orderData = null }) {
  // Dùng orderData thật nếu có, nếu không dùng SAMPLE_DATA (cho preview trong settings)
  const data = orderData || SAMPLE_DATA;
  // Compute styles based on size
  const styles = useMemo(() => {
    const baseStyles = {
      '58mm': {
        width: '58mm',
        padding: '3mm',
        fontSize: '8px',
        lineHeight: '1.3',
        logoSize: '30px',
        qrSize: '25px',
        titleSize: '10px',
        borderStyle: 'dashed'
      },
      '80mm': {
        width: '80mm',
        padding: '4mm',
        fontSize: '9px',
        lineHeight: '1.4',
        logoSize: '40px',
        qrSize: '35px',
        titleSize: '12px',
        borderStyle: 'dashed'
      },
      'a5': {
        width: '148mm',
        minHeight: '210mm',
        padding: '8mm',
        fontSize: '11px',
        lineHeight: '1.5',
        logoSize: '50px',
        qrSize: '50px',
        titleSize: '16px',
        borderStyle: 'solid'
      },
      'a4': {
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm',
        fontSize: '12px',
        lineHeight: '1.6',
        logoSize: '60px',
        qrSize: '60px',
        titleSize: '18px',
        borderStyle: 'solid'
      }
    };
    return baseStyles[size] || baseStyles['a5'];
  }, [size]);

  // Get alignment style
  const getAlign = (section) => {
    const align = config.align?.[section] || 'left';
    if (align === 'justify') return 'space-between';
    return align;
  };

  // Check if thermal (58mm or 80mm)
  const isThermal = size === '58mm' || size === '80mm';

  return (
    <div 
      className="invoice-preview-wrapper"
      style={{
        width: styles.width,
        minHeight: styles.minHeight || 'auto',
        padding: styles.padding,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
        color: '#1a1a1a'
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div 
        className="invoice-header"
        style={{ 
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: isThermal ? '2mm' : '4mm',
          marginBottom: isThermal ? '2mm' : '5mm'
        }}
      >
      <div style={{ flex: 1, textAlign: getAlign('header') }}>
        {/* Thermal: Logo + Name + QR inline */}
        {isThermal ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: config.align?.header === 'center' ? 'center' : 'space-between',
            gap: '2mm'
          }}>
            {config.show?.logo && (
              <div style={{ width: styles.logoSize, height: styles.logoSize, flexShrink: 0 }}>
                {logo ? (
                  <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ 
                    width: '100%', height: '100%', 
                    background: '#f0f0f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '6px',
                    color: '#999',
                    borderRadius: '2px'
                  }}>LOGO</div>
                )}
              </div>
            )}
            
            <div style={{ flex: 1, textAlign: 'center' }}>
              {config.show?.store_name && (
                <div style={{ fontWeight: 'bold', fontSize: styles.titleSize }}>
                  {config.text?.store_name || 'TỨ QUÝ ĐƯỜNG'}
                </div>
              )}
              {config.show?.slogan && config.text?.slogan && (
                <div style={{ fontSize: '7px', fontStyle: 'italic', color: '#666' }}>
                  "{config.text.slogan}"
                </div>
              )}
              {config.show?.address && config.text?.address && (
                <div style={{ fontSize: '7px', color: '#444' }}>{config.text.address}</div>
              )}
              {config.show?.phone && (
                <div style={{ fontSize: '8px' }}>{config.text?.phone || '024 2245 5565'}</div>
              )}
            </div>

            {config.show?.qr_code && (
              <div style={{ 
                width: styles.qrSize, 
                height: styles.qrSize, 
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5px',
                flexShrink: 0
              }}>QR</div>
            )}
          </div>
        ) : (
          /* A5/A4: Full header */
          <>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              justifyContent: config.align?.header === 'center' ? 'center' : 'space-between',
              gap: '5mm',
              marginBottom: '3mm'
            }}>
              {config.show?.qr_code && (
                <div style={{ 
                  width: styles.qrSize, 
                  height: styles.qrSize, 
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  flexShrink: 0,
                  border: '1px solid #ddd'
                }}>QR Code</div>
              )}

              <div style={{ flex: 1, textAlign: 'center' }}>
                {config.show?.logo && (
                  <div style={{ 
                    width: styles.logoSize, 
                    height: styles.logoSize, 
                    margin: '0 auto 2mm',
                  }}>
                    {logo ? (
                      <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ 
                        width: '100%', height: '100%', 
                        background: '#f0f0f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#999',
                        borderRadius: '4px'
                      }}>LOGO</div>
                    )}
                  </div>
                )}
                
                {config.show?.store_name && (
                  <div style={{ fontWeight: 'bold', fontSize: styles.titleSize, marginBottom: '1mm' }}>
                    {config.text?.store_name || 'TỨ QUÝ ĐƯỜNG'}
                  </div>
                )}
                
                {config.show?.slogan && config.text?.slogan && (
                  <div style={{ fontStyle: 'italic', color: '#666', marginBottom: '1mm' }}>
                    "{config.text.slogan}"
                  </div>
                )}
              </div>

              {/* Spacer for balance when QR is shown */}
              {config.show?.qr_code && <div style={{ width: styles.qrSize, flexShrink: 0 }} />}
            </div>

            {/* Contact info */}
            <div style={{ fontSize: '0.9em', color: '#444', textAlign: 'center' }}>
              {config.show?.address && <div>{config.text?.address || 'Địa chỉ cửa hàng'}</div>}
              {config.show?.phone && <div>Hotline: {config.text?.phone || '024 2245 5565'}</div>}
              {config.show?.email && config.text?.email && <div>Email: {config.text.email}</div>}
            </div>
          </>
        )}
      </div>

      {config.show?.order_code && (
        <div style={{
          flexShrink: 0,
          background: '#f5f0e8',
          borderRadius: isThermal ? '4px' : '6px',
          padding: isThermal ? '2px 6px' : '4px 10px',
          fontSize: isThermal ? '13px' : '18px',
          fontWeight: 'bold',
          color: '#8b3a1a'
        }}>
          #{(data.order_code || '').split('-').pop()}
        </div>
      )}
      </div>

      {/* Divider */}
      <div style={{ 
        borderTop: `1px ${styles.borderStyle} #999`, 
        margin: isThermal ? '2mm 0' : '4mm 0' 
      }} />

      {/* ═══════════════════════════════════════════════════════════════════════════
          INVOICE TITLE
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: isThermal ? '11px' : '14px',
        margin: isThermal ? '2mm 0' : '4mm 0'
      }}>
        HÓA ĐƠN BÁN HÀNG
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ORDER INFO
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: getAlign('order_info'),
        gap: '1mm 3mm',
        marginBottom: isThermal ? '2mm' : '4mm',
        fontSize: '0.9em'
      }}>
        {config.show?.invoice_number && (
          <span>Số HĐ: <strong>{data.invoice_number}</strong></span>
        )}
        {config.show?.datetime && (
          <span>{data.datetime}</span>
        )}
        {config.show?.staff && (
          <span>NV: {data.staff}</span>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px ${styles.borderStyle} #ccc`, margin: isThermal ? '2mm 0' : '3mm 0' }} />

      {/* ═══════════════════════════════════════════════════════════════════════════
          CUSTOMER INFO
      ═══════════════════════════════════════════════════════════════════════════ */}
      {(config.show?.customer_name || config.show?.customer_phone || config.show?.customer_address) && (
        <div style={{ 
          textAlign: getAlign('customer'),
          marginBottom: isThermal ? '2mm' : '4mm',
          fontSize: '0.95em'
        }}>
          {config.show?.customer_name && (
            <div>
              <strong>KH:</strong> {data.customer.name}
              {data.customer.tier && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '0.8em',
                  fontWeight: 'bold',
                  padding: '1px 7px',
                  borderRadius: '4px',
                  background: '#efe6fb',
                  color: '#5b3ea3'
                }}>{data.customer.tier}</span>
              )}
            </div>
          )}
          {config.show?.customer_phone && (
            <div><strong>SĐT:</strong> {data.customer.phone}</div>
          )}
          {config.show?.customer_address && (
            <div><strong>Địa chỉ:</strong> {data.customer.address}</div>
          )}
          {config.show?.customer_balance && (
            <div><strong>Số dư TK:</strong> {formatCurrency(data.customer.balance)}</div>
          )}
          {config.show?.customer_type && (
            <div><strong>Hạng Thành viên:</strong> {data.customer.type}</div>
          )}
          {config.show?.customer_note && data.customer.note && (
            <div><strong>Ghi chú:</strong> {data.customer.note}</div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          PRODUCTS TABLE
      ═══════════════════════════════════════════════════════════════════════════ */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: isThermal ? '8px' : '0.9em',
        marginBottom: isThermal ? '2mm' : '4mm'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #999' }}>
            {config.show?.col_stt && <th style={{ padding: '1mm', textAlign: 'center', width: '8%' }}>STT</th>}
            {config.show?.col_product_code && <th style={{ padding: '1mm', textAlign: 'left', width: '15%' }}>Mã</th>}
            <th style={{ padding: '1mm', textAlign: 'left' }}>Sản phẩm</th>
            {config.show?.col_unit && <th style={{ padding: '1mm', textAlign: 'center', width: '10%' }}>ĐVT</th>}
            <th style={{ padding: '1mm', textAlign: 'center', width: '10%' }}>SL</th>
            {config.show?.col_price && <th style={{ padding: '1mm', textAlign: 'right', width: '18%' }}>Giá</th>}
            <th style={{ padding: '1mm', textAlign: 'right', width: '20%' }}>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => {
            // Flash và giảm hạng KHÔNG BAO GIỜ cùng áp cho 1 món (đúng luật đã chốt: đơn dính
            // Flash thì hạng không cộng thêm) — nên tối đa chỉ 1 trong 2 có giá trị, ưu tiên hiện
            // đúng cái nào server đã tính (không cần "chọn", chỉ cần đọc đúng field có giá trị).
            const hasFlash = item.flash_price != null && item.flash_price !== item.price;
            const hasTier = !hasFlash && item.tier_price != null && item.tier_price !== item.price;
            // Bước 5: ưu đãi khách mới CHỈ giảm giá ĐÚNG 1 ĐƠN VỊ của món, khác hẳn flash/tier
            // (giảm mọi đơn vị trong dòng) — không được dùng chung công thức realPrice*qty,
            // nếu không sẽ hiện giảm nhầm cho TOÀN BỘ số lượng.
            const hasSignup = !hasFlash && !hasTier && item.signup_price != null && item.signup_price !== item.price;
            const hasDiscount = hasFlash || hasTier || hasSignup;
            const realPrice = hasFlash ? item.flash_price : hasTier ? item.tier_price : hasSignup ? item.signup_price : item.price;
            // Công thức đúng cho cả 2 trường hợp: flash/tier (giảm mọi đơn vị) dùng realPrice*qty
            // như cũ; signup (giảm đúng 1 đơn vị) = (qty-1) đơn vị giá gốc + 1 đơn vị đã giảm.
            const realTotal = hasSignup
              ? (item.price * Math.max(0, item.qty - 1)) + realPrice
              : realPrice * item.qty;
            return (
              <tr key={idx} style={{ borderBottom: '1px dashed #ddd' }}>
                {config.show?.col_stt && <td style={{ padding: '1mm', textAlign: 'center', verticalAlign: 'top' }}>{idx + 1}</td>}
                {config.show?.col_product_code && <td style={{ padding: '1mm', verticalAlign: 'top' }}>{item.code}</td>}
                <td style={{ padding: '1mm' }}>
                  <div style={{ fontSize: isThermal ? '1.5em' : '1.25em', fontWeight: 'bold' }}>{item.name}</div>
                  {item.note && (
                    <div style={{
                      display: 'inline-block',
                      fontSize: isThermal ? '1.1em' : '1em',
                      fontWeight: 'bold',
                      color: '#0f6e56',
                      background: '#e1f5ee',
                      padding: '1px 7px',
                      borderRadius: '5px',
                      marginTop: '0.5mm'
                    }}>{item.note}</div>
                  )}
                  {hasFlash && (
                    <div style={{ fontSize: '0.75em', color: '#a32d2d', fontWeight: 'bold', marginTop: '0.5mm' }}>⚡ Flash</div>
                  )}
                  {hasTier && (
                    <div style={{ fontSize: '0.75em', color: '#5b3ea3', fontWeight: 'bold', marginTop: '0.5mm' }}>
                      🎖️ Khách hàng {data.customer?.tier || 'hội viên'}
                    </div>
                  )}
                </td>
                {config.show?.col_unit && <td style={{ padding: '1mm', textAlign: 'center', verticalAlign: 'top' }}>{item.unit}</td>}
                <td style={{ padding: '1mm', textAlign: 'center', verticalAlign: 'top' }}>{item.qty}</td>
                {config.show?.col_price && (
                  <td style={{ padding: '1mm', textAlign: 'right', verticalAlign: 'top' }}>
                    {hasDiscount && (
                      <div style={{ fontSize: '0.75em', color: '#999', textDecoration: 'line-through' }}>{formatCurrency(item.price)}</div>
                    )}
                    {formatCurrency(realPrice)}
                  </td>
                )}
                <td style={{ padding: '1mm', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(realTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TOTALS
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        textAlign: getAlign('totals'),
        borderTop: '1px solid #999',
        paddingTop: isThermal ? '2mm' : '3mm',
        marginBottom: isThermal ? '2mm' : '4mm'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
          <span>Tiền hàng:</span>
          <span>{formatCurrency(data.subtotal - (data.flash_discount || 0) - (data.tier_discount || 0))}</span>
        </div>

        {config.show?.discount_detail && (data.discount - (data.flash_discount || 0) - (data.tier_discount || 0)) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm', color: '#059669' }}>
            <span>Chiết khấu
              {data.discount_code ? ` (${data.discount_code})` : 
               data.discount_type === 'percent' ? ` (${data.discount_value}%)` : ''}:
            </span>
            <span>-{formatCurrency(data.discount - (data.flash_discount || 0) - (data.tier_discount || 0))}</span>
          </div>
        )}
        
        {config.show?.shipping_fee && data.shipping > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
            <span>Phí giao hàng:</span>
            <span>{formatCurrency(data.shipping)}</span>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: 'bold',
          fontSize: isThermal ? '10px' : '1.1em',
          borderTop: '1px dashed #999',
          paddingTop: '2mm',
          marginTop: '2mm'
        }}>
          <span>TỔNG CỘNG:</span>
          <span>{formatCurrency(data.total)}</span>
        </div>

        {config.show?.amount_words && (
          <div style={{ 
            fontStyle: 'italic', 
            fontSize: '0.85em', 
            marginTop: '1mm',
            textAlign: 'left'
          }}>
            ({numberToWords(data.total)})
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAYMENT DETAILS - Chi tiết thanh toán thực tế
      ═══════════════════════════════════════════════════════════════════════════ */}
      {data.payment_method && (
        <div style={{ 
          marginBottom: isThermal ? '2mm' : '4mm',
          fontSize: '0.9em'
        }}>
          {/* Phương thức thanh toán */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
            <span>Thanh toán:</span>
            <span style={{ fontWeight: '500' }}>
              {data.payment_method === 'cash' ? '💵 Tiền mặt' :
               data.payment_method === 'transfer' ? '🏦 Chuyển khoản' :
               data.payment_method === 'balance' ? '💰 Số dư' :
               data.payment_method === 'debt' ? '📝 Ghi nợ' :
               data.payment_method === 'combined' ? '🔀 Kết hợp' : data.payment_method}
            </span>
          </div>

          {/* Trừ số dư */}
          {data.balance_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm', color: '#2563eb' }}>
              <span>  Trừ số dư:</span>
              <span>{formatCurrency(data.balance_amount)}</span>
            </div>
          )}

          {/* Tiền mặt khách đưa + tiền thối */}
          {data.payment_method === 'cash' && data.cash_received > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
                <span>  Tiền khách đưa:</span>
                <span>{formatCurrency(data.cash_received)}</span>
              </div>
              {data.change_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm', fontWeight: '600' }}>
                  <span>  Tiền thối:</span>
                  <span>{formatCurrency(data.change_amount)}</span>
                </div>
              )}
            </>
          )}

          {/* Ghi nợ */}
          {data.debt_amount > 0 && (
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', marginBottom: '1mm',
              color: '#ea580c', fontWeight: '600'
            }}>
              <span>  Ghi nợ:</span>
              <span>{formatCurrency(data.debt_amount)}</span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAYMENT CHECKBOX
      ═══════════════════════════════════════════════════════════════════════════ */}
      {config.show?.payment_checkbox && (
        <div style={{ 
          display: 'flex', 
          gap: '4mm', 
          marginBottom: isThermal ? '2mm' : '4mm',
          fontSize: '0.9em'
        }}>
          <span>Xác nhận TT:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <span style={{ 
              width: isThermal ? '10px' : '12px', 
              height: isThermal ? '10px' : '12px', 
              border: '1px solid #333',
              display: 'inline-block'
            }} />
            <span>TM</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
            <span style={{ 
              width: isThermal ? '10px' : '12px', 
              height: isThermal ? '10px' : '12px', 
              border: '1px solid #333',
              display: 'inline-block'
            }} />
            <span>CK</span>
          </label>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          SIGNATURES
      ═══════════════════════════════════════════════════════════════════════════ */}
      {(config.show?.sig_seller || config.show?.sig_shipper || config.show?.sig_customer) && (
        <>
          <div style={{ borderTop: `1px ${styles.borderStyle} #ccc`, margin: isThermal ? '2mm 0' : '4mm 0' }} />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: getAlign('signatures'),
            gap: '3mm',
            textAlign: 'center',
            fontSize: '0.85em'
          }}>
            {config.show?.sig_seller && (
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', marginBottom: '1mm' }}>NV Bán hàng</div>
                <div style={{ 
                  height: isThermal ? '12mm' : '20mm', 
                  borderBottom: '1px dotted #999',
                  marginBottom: '1mm'
                }} />
                <div style={{ fontSize: '0.8em', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
              </div>
            )}
            
            {config.show?.sig_shipper && (
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', marginBottom: '1mm' }}>NV Giao hàng</div>
                <div style={{ 
                  height: isThermal ? '12mm' : '20mm', 
                  borderBottom: '1px dotted #999',
                  marginBottom: '1mm'
                }} />
                <div style={{ fontSize: '0.8em', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
              </div>
            )}
            
            {config.show?.sig_customer && (
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', marginBottom: '1mm' }}>Khách hàng</div>
                <div style={{ 
                  height: isThermal ? '12mm' : '20mm', 
                  borderBottom: '1px dotted #999',
                  marginBottom: '1mm'
                }} />
                <div style={{ fontSize: '0.8em', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          BƯỚC 3 (08.08.2026): MÃ ƯU ĐÃI KHÁCH MỚI — chỉ hiện khi đơn có mã (server quyết định
          có sinh mã hay không, xem orders.js). Không có config bật/tắt riêng ở đây vì việc
          bật/tắt tính năng nằm ở phía server (Bước sau sẽ có cờ bật/tắt trong Cài đặt).
      ═══════════════════════════════════════════════════════════════════════════ */}
      {data.signup_code && (
        <>
          <div style={{ borderTop: `1px dashed #ccc`, margin: isThermal ? '2mm 0' : '4mm 0' }} />
          <div style={{ textAlign: 'center', fontSize: '0.9em' }}>
            <div style={{ color: '#666', marginBottom: '1mm' }}>Mã ưu đãi khách mới</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.3em', letterSpacing: '2px', marginBottom: '1mm' }}>
              {data.signup_code}
            </div>
            <div style={{ color: '#666', fontSize: '0.85em' }}>
              Tạo tài khoản app trong 24h để nhận ưu đãi
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════════ */}
      {(config.show?.thank_you || config.show?.policy) && (
        <>
          <div style={{ borderTop: `1px ${styles.borderStyle} #ccc`, margin: isThermal ? '2mm 0' : '5mm 0' }} />
          
          <div style={{ textAlign: getAlign('footer'), fontSize: '0.9em' }}>
            {config.show?.thank_you && config.text?.thank_you && (
              <div style={{ fontWeight: '500', marginBottom: '1mm' }}>
                {config.text.thank_you}
              </div>
            )}
            {config.show?.policy && config.text?.policy && (
              <div style={{ color: '#666', fontSize: '0.85em' }}>
                {config.text.policy}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
