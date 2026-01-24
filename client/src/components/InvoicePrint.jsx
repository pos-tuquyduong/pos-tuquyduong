/**
 * InvoicePrint.jsx - Component in hóa đơn
 * Phase A: Hệ thống hóa đơn cơ bản
 * 
 * FIX:
 * - Sửa chữ bị nhảy ra ngoài (overflow)
 * - Hiển thị chi tiết thanh toán (TM, CK, Số dư, Nợ)
 * - Checkbox TM/CK cho đơn ghi nợ
 * 
 * Props:
 * - order: Object chứa thông tin đơn hàng
 * - settings: Object chứa cài đặt hóa đơn từ pos_settings
 * - paperSize: '58mm' | '80mm' | 'a5' | 'a4' (default từ settings)
 * - onClose: Function đóng modal
 * - onPrintComplete: Function callback sau khi in xong
 * 
 * LƯU TRỮ:
 * - Hóa đơn được log vào bảng pos_invoice_logs khi in
 * - invoice_number được lưu vào pos_orders
 */

import { useState, useRef } from 'react';
import { X, Printer } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// PAPER SIZE CONFIG - Chuẩn kích thước thực tế
// ═══════════════════════════════════════════════════════════════════════════
const PAPER_SIZES = {
  '58mm': { 
    width: '58mm',
    minWidth: '180px',
    maxWidth: '220px',
    name: '58mm (Nhiệt nhỏ)', 
    fontSize: '9px',
    padding: '6px',
    productColWidth: '45%'
  },
  '80mm': { 
    width: '80mm',
    minWidth: '260px',
    maxWidth: '302px',
    name: '80mm (Nhiệt)', 
    fontSize: '10px',
    padding: '10px',
    productColWidth: '48%'
  },
  'a5': { 
    width: '148mm',
    minWidth: '400px',
    maxWidth: '560px',
    name: 'A5 (148×210mm)', 
    fontSize: '12px',
    padding: '16px',
    productColWidth: '50%'
  },
  'a4': { 
    width: '210mm',
    minWidth: '600px',
    maxWidth: '794px',
    name: 'A4 (210×297mm)', 
    fontSize: '14px',
    padding: '20px',
    productColWidth: '55%'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
const formatPrice = (price) => {
  if (!price && price !== 0) return '0đ';
  return price.toLocaleString('vi-VN') + 'đ';
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  return new Date(dateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function InvoicePrint({ 
  order, 
  settings = {}, 
  paperSize: initialPaperSize,
  onClose, 
  onPrintComplete 
}) {
  const [paperSize, setPaperSize] = useState(initialPaperSize || settings.invoice_default_size || 'a5');
  const [printing, setPrinting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(order.invoice_number || '');
  const printRef = useRef(null);

  // Helper to check if a setting is enabled
  const isEnabled = (key) => settings[key] === 'true' || settings[key] === true;

  // Get paper config
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES['a5'];

  // ═══════════════════════════════════════════════════════════════════════════
  // GET NEXT INVOICE NUMBER
  // ═══════════════════════════════════════════════════════════════════════════
  const getNextInvoiceNumber = async () => {
    if (invoiceNumber) return invoiceNumber;
    
    try {
      const token = localStorage.getItem('pos_token');
      const res = await fetch('/api/pos/settings/invoice/next-number', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setInvoiceNumber(data.data.invoiceNumber);
        return data.data.invoiceNumber;
      }
    } catch (err) {
      console.error('Get invoice number error:', err);
    }
    return '';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINT FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePrint = async () => {
    setPrinting(true);

    try {
      // Lấy số hóa đơn mới nếu chưa có
      const invNumber = await getNextInvoiceNumber();
      
      // Log in hóa đơn vào database
      const token = localStorage.getItem('pos_token');
      await fetch('/api/pos/settings/invoice/log', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: order.id,
          order_code: order.code,
          invoice_number: invNumber,
          paper_size: paperSize,
          print_type: 'print'
        })
      });

      // Open print dialog
      const printContent = printRef.current;
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Hóa đơn ${order.code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: ${paper.fontSize};
              width: ${paper.width};
              max-width: ${paper.width};
              margin: 0 auto;
              padding: ${paper.padding};
            }
            .invoice { 
              width: 100%; 
              overflow-wrap: break-word;
              word-wrap: break-word;
              word-break: break-word;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .mb-1 { margin-bottom: 8px; }
            .mb-2 { margin-bottom: 16px; }
            .border-b { border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; }
            .border-t { border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 8px; }
            .flex { display: flex; justify-content: space-between; }
            .logo { max-width: 80px; max-height: 80px; margin: 0 auto 8px; display: block; }
            .store-name { font-size: 1.3em; font-weight: bold; }
            .invoice-number { font-size: 1.1em; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              table-layout: fixed;
            }
            th, td { 
              padding: 4px 2px; 
              text-align: left; 
              overflow: hidden;
              text-overflow: ellipsis;
              vertical-align: top;
            }
            th:last-child, td:last-child { text-align: right; }
            .total-row { font-size: 1.2em; font-weight: bold; }
            .debt-box {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 8px;
              margin-top: 8px;
              border-radius: 4px;
            }
            @media print {
              body { 
                width: ${paper.width}; 
                max-width: ${paper.width};
                padding: ${paper.padding};
              }
              @page { 
                size: ${paperSize === 'a4' ? 'A4' : paperSize === 'a5' ? 'A5' : paper.width + ' auto'}; 
                margin: ${paperSize === 'a4' || paperSize === 'a5' ? '10mm' : '2mm'}; 
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();

        if (onPrintComplete) {
          onPrintComplete(order.code, paperSize);
        }
      }, 250);

    } catch (err) {
      console.error('Print error:', err);
      alert('Lỗi khi in: ' + err.message);
    } finally {
      setPrinting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMON STYLES - Chống overflow
  // ═══════════════════════════════════════════════════════════════════════════
  const textWrapStyle = {
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto'
  };

  const cellStyle = {
    padding: '4px 2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'top',
    ...textWrapStyle
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '95%',
        maxWidth: paperSize === 'a4' ? '850px' : paperSize === 'a5' ? '620px' : '450px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🧾 Xem trước hóa đơn
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#64748b'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Paper Size Selector */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {Object.entries(PAPER_SIZES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setPaperSize(key)}
              style={{
                padding: '0.5rem 0.75rem',
                background: paperSize === key ? '#3b82f6' : '#f1f5f9',
                color: paperSize === key ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: paperSize === key ? 'bold' : 'normal'
              }}
            >
              {config.name}
            </button>
          ))}
        </div>

        {/* Invoice Preview */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          background: '#e5e7eb',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div 
            ref={printRef}
            style={{
              background: 'white',
              width: paper.width,
              minWidth: paper.minWidth,
              maxWidth: paper.maxWidth,
              padding: paper.padding,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: paper.fontSize,
              ...textWrapStyle
            }}
          >
            {/* === INVOICE CONTENT === */}
            <div className="invoice" style={{ width: '100%', ...textWrapStyle }}>
              
              {/* Header - Logo & Store Info */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '10px', 
                paddingBottom: '10px', 
                borderBottom: '1px dashed #ccc' 
              }}>
                {isEnabled('invoice_show_logo') && settings.store_logo && (
                  <img 
                    src={settings.store_logo} 
                    alt="Logo" 
                    style={{ maxWidth: '70px', maxHeight: '70px', margin: '0 auto 6px', display: 'block' }}
                  />
                )}
                {isEnabled('invoice_show_store_name') && (
                  <div style={{ fontSize: '1.2em', fontWeight: 'bold', ...textWrapStyle }}>
                    {settings.store_name || 'TÚ QUÝ ĐƯỜNG'}
                  </div>
                )}
                {isEnabled('invoice_show_address') && settings.store_address && (
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px', ...textWrapStyle }}>
                    {settings.store_address}
                  </div>
                )}
                {isEnabled('invoice_show_phone') && settings.store_phone && (
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    ☎ {settings.store_phone}
                  </div>
                )}
              </div>

              {/* Invoice Title & Number */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '3px' }}>
                  HÓA ĐƠN BÁN HÀNG
                </div>
                {isEnabled('invoice_show_invoice_number') && invoiceNumber && (
                  <div style={{ fontSize: '0.95em' }}>
                    Số: <strong>{invoiceNumber}</strong>
                  </div>
                )}
                {isEnabled('invoice_show_order_code') && (
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    Mã ĐH: {order.code}
                  </div>
                )}
                {isEnabled('invoice_show_datetime') && (
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    {formatDateTime(order.created_at)}
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div style={{ 
                marginBottom: '10px', 
                paddingBottom: '8px', 
                borderBottom: '1px dashed #ccc',
                fontSize: '0.9em'
              }}>
                {isEnabled('invoice_show_customer_name') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Khách hàng:</span>
                    <span style={{ fontWeight: 'bold', maxWidth: '60%', textAlign: 'right', ...textWrapStyle }}>
                      {order.customer_name || 'Khách lẻ'}
                    </span>
                  </div>
                )}
                {isEnabled('invoice_show_customer_phone') && order.customer_phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>SĐT:</span>
                    <span>{order.customer_phone}</span>
                  </div>
                )}
                {isEnabled('invoice_show_staff') && order.created_by && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>NV bán:</span>
                    <span>{order.created_by}</span>
                  </div>
                )}
              </div>

              {/* Products Table */}
              {isEnabled('invoice_show_products') && order.items && order.items.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    tableLayout: 'fixed',
                    fontSize: '0.9em'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #999' }}>
                        <th style={{ ...cellStyle, width: paper.productColWidth, textAlign: 'left' }}>Sản phẩm</th>
                        <th style={{ ...cellStyle, width: '15%', textAlign: 'center' }}>SL</th>
                        <th style={{ ...cellStyle, width: '35%', textAlign: 'right' }}>T.Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dotted #ddd' }}>
                          <td style={{ ...cellStyle, textAlign: 'left' }}>
                            <div style={{ fontWeight: '500', ...textWrapStyle }}>
                              {item.product_code || item.product_name}
                            </div>
                            {paperSize !== '58mm' && item.product_name && item.product_code && (
                              <div style={{ fontSize: '0.85em', color: '#666', ...textWrapStyle }}>
                                {item.product_name}
                              </div>
                            )}
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'right' }}>
                            {formatPrice((item.unit_price || 0) * (item.quantity || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              <div style={{ paddingTop: '8px', borderTop: '1px dashed #ccc', fontSize: '0.9em' }}>
                {isEnabled('invoice_show_subtotal') && order.subtotal !== order.total && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>Tạm tính:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                )}
                {isEnabled('invoice_show_discount') && order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#dc2626' }}>
                    <span>Chiết khấu
                      {order.discount_code ? ` (${order.discount_code})` : 
                       order.discount_type === 'percent' ? ` (${order.discount_value}%)` : ''}:
                    </span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                {/* === Phase B: Phí vận chuyển === */}
                {order.shipping_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#f97316' }}>
                    <span>Phí vận chuyển:</span>
                    <span>+{formatPrice(order.shipping_fee)}</span>
                  </div>
                )}
                {isEnabled('invoice_show_total') && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '1.15em', 
                    fontWeight: 'bold',
                    borderTop: '2px solid #333',
                    paddingTop: '6px',
                    marginTop: '6px'
                  }}>
                    <span>TỔNG CỘNG:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {/* PAYMENT INFO - Chi tiết thanh toán */}
                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {isEnabled('invoice_show_payment_method') && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                    
                    {/* Hiển thị số dư đã dùng */}
                    {order.balance_amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>💰 Trừ số dư:</span>
                        <span>{formatPrice(order.balance_amount)}</span>
                      </div>
                    )}
                    
                    {/* Hiển thị tiền mặt */}
                    {order.cash_amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>💵 Tiền mặt:</span>
                        <span>{formatPrice(order.cash_amount)}</span>
                      </div>
                    )}
                    
                    {/* Hiển thị chuyển khoản */}
                    {order.transfer_amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>🏦 Chuyển khoản:</span>
                        <span>{formatPrice(order.transfer_amount)}</span>
                      </div>
                    )}
                    
                    {/* Hiển thị ghi nợ - với checkbox TM/CK */}
                    {order.debt_amount > 0 && (
                      <div style={{ 
                        marginTop: '6px', 
                        padding: '8px', 
                        background: '#fff8e1', 
                        border: '1px solid #ffcc02',
                        borderRadius: '4px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontWeight: 'bold',
                          color: '#b45309',
                          marginBottom: '4px'
                        }}>
                          <span>📝 CÒN NỢ:</span>
                          <span>{formatPrice(order.debt_amount)}</span>
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#92400e' }}>
                          Thanh toán khi nhận hàng:
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '16px', 
                          marginTop: '4px',
                          fontSize: '0.95em'
                        }}>
                          <span>☐ Tiền mặt</span>
                          <span>☐ Chuyển khoản</span>
                        </div>
                        {order.due_date && (
                          <div style={{ fontSize: '0.85em', color: '#92400e', marginTop: '4px' }}>
                            Hạn TT: {new Date(order.due_date).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Nếu không có các trường chi tiết, hiển thị phương thức đơn giản */}
                    {!order.balance_amount && !order.cash_amount && !order.transfer_amount && !order.debt_amount && order.payment_method && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Thanh toán:</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {order.payment_method === 'cash' ? 'Tiền mặt' : 
                           order.payment_method === 'transfer' ? 'Chuyển khoản' : 
                           order.payment_method === 'balance' ? 'Trừ số dư' : 
                           order.payment_method === 'debt' ? 'Ghi nợ' : order.payment_method}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Messages */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                paddingTop: '10px', 
                borderTop: '1px dashed #ccc',
                fontSize: '0.85em'
              }}>
                {settings.invoice_thank_you && (
                  <div style={{ fontWeight: 'bold', marginBottom: '3px', ...textWrapStyle }}>
                    {settings.invoice_thank_you}
                  </div>
                )}

                {settings.invoice_policy && (
                  <div style={{ color: '#666', marginBottom: '3px', ...textWrapStyle }}>
                    {settings.invoice_policy}
                  </div>
                )}

                {settings.invoice_note && (
                  <div style={{ fontSize: '0.9em', color: '#888', fontStyle: 'italic', ...textWrapStyle }}>
                    {settings.invoice_note}
                  </div>
                )}

                {isEnabled('invoice_show_vat') && settings.store_tax_id && (
                  <div style={{ 
                    fontSize: '0.85em', 
                    color: '#666', 
                    marginTop: '6px', 
                    borderTop: '1px dashed #ddd', 
                    paddingTop: '6px' 
                  }}>
                    MST: {settings.store_tax_id}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: printing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: printing ? 0.7 : 1
            }}
          >
            <Printer size={18} />
            {printing ? 'Đang xử lý...' : 'In hóa đơn'}
          </button>
        </div>
      </div>
    </div>
  );
}
