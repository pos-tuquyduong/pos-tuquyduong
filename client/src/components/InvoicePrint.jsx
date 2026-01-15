/**
 * InvoicePrint.jsx - Component in hóa đơn
 * Phase A: Hệ thống hóa đơn cơ bản
 * 
 * Props:
 * - order: Object chứa thông tin đơn hàng
 * - settings: Object chứa cài đặt hóa đơn từ pos_settings
 * - paperSize: '58mm' | '80mm' | 'a5' | 'a4' (default từ settings)
 * - onClose: Function đóng modal
 * - onPrintComplete: Function callback sau khi in xong
 */

import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// PAPER SIZE CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const PAPER_SIZES = {
  '58mm': { width: '58mm', name: '58mm (Máy in nhiệt nhỏ)', fontSize: '10px' },
  '80mm': { width: '80mm', name: '80mm (Máy in nhiệt)', fontSize: '11px' },
  'a5': { width: '148mm', name: 'A5 (148 × 210 mm)', fontSize: '12px' },
  'a4': { width: '210mm', name: 'A4 (210 × 297 mm)', fontSize: '13px' }
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
  const printRef = useRef(null);

  // Helper to check if a setting is enabled
  const isEnabled = (key) => settings[key] === 'true' || settings[key] === true;

  // Get paper config
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES['a5'];

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINT FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePrint = async () => {
    setPrinting(true);
    
    try {
      // Log in hóa đơn
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
              margin: 0 auto;
              padding: 10px;
            }
            .invoice { width: 100%; }
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
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 0; text-align: left; }
            th:last-child, td:last-child { text-align: right; }
            .total-row { font-size: 1.2em; font-weight: bold; }
            .qr-code { width: 80px; height: 80px; margin: 8px auto; }
            @media print {
              body { width: ${paper.width}; }
              @page { size: ${paper.width} auto; margin: 5mm; }
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
      zIndex: 1100
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '500px',
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
          background: '#f1f5f9',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div 
            ref={printRef}
            style={{
              background: 'white',
              width: paper.width,
              minWidth: paperSize === '58mm' ? '200px' : paperSize === '80mm' ? '280px' : '400px',
              padding: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: paper.fontSize
            }}
          >
            {/* === INVOICE CONTENT === */}
            <div className="invoice">
              {/* Header - Logo & Store Info */}
              <div className="text-center mb-2 border-b">
                {isEnabled('invoice_show_logo') && settings.store_logo && (
                  <img 
                    src={settings.store_logo} 
                    alt="Logo" 
                    className="logo"
                    style={{ maxWidth: '80px', maxHeight: '80px', margin: '0 auto 8px', display: 'block' }}
                  />
                )}
                {isEnabled('invoice_show_store_name') && (
                  <div className="store-name" style={{ fontSize: '1.3em', fontWeight: 'bold' }}>
                    {settings.store_name || 'TÚ QUÝ ĐƯỜNG'}
                  </div>
                )}
                {isEnabled('invoice_show_address') && settings.store_address && (
                  <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                    {settings.store_address}
                  </div>
                )}
                {isEnabled('invoice_show_phone') && settings.store_phone && (
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    ☎ {settings.store_phone}
                  </div>
                )}
                {isEnabled('invoice_show_slogan') && settings.store_slogan && (
                  <div style={{ fontSize: '0.85em', fontStyle: 'italic', color: '#888', marginTop: '4px' }}>
                    {settings.store_slogan}
                  </div>
                )}
              </div>

              {/* Invoice Number & Info */}
              <div className="text-center mb-2">
                <div style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '4px' }}>
                  HÓA ĐƠN BÁN HÀNG
                </div>
                {isEnabled('invoice_show_invoice_number') && order.invoice_number && (
                  <div style={{ fontSize: '1em' }}>
                    Số: <strong>{order.invoice_number}</strong>
                  </div>
                )}
                {isEnabled('invoice_show_order_code') && (
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    Mã ĐH: {order.code}
                  </div>
                )}
                {isEnabled('invoice_show_datetime') && (
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    {formatDateTime(order.created_at)}
                  </div>
                )}
              </div>

              {/* Customer & Staff Info */}
              <div className="mb-2 border-b" style={{ paddingBottom: '8px' }}>
                {isEnabled('invoice_show_customer_name') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Khách hàng:</span>
                    <span style={{ fontWeight: 'bold' }}>{order.customer_name || 'Khách lẻ'}</span>
                  </div>
                )}
                {isEnabled('invoice_show_customer_phone') && order.customer_phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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

              {/* Products */}
              {isEnabled('invoice_show_products') && order.items && order.items.length > 0 && (
                <div className="mb-2">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Sản phẩm</th>
                        <th style={{ textAlign: 'center', padding: '4px 0' }}>SL</th>
                        <th style={{ textAlign: 'right', padding: '4px 0' }}>T.Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dotted #eee' }}>
                          <td style={{ padding: '4px 0' }}>
                            {item.product_code || item.product_name}
                            {paperSize !== '58mm' && item.product_name && item.product_code && (
                              <div style={{ fontSize: '0.85em', color: '#666' }}>{item.product_name}</div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 0' }}>
                            {item.quantity}
                          </td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>
                            {formatPrice(item.unit_price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              <div className="border-t" style={{ paddingTop: '8px' }}>
                {isEnabled('invoice_show_subtotal') && order.subtotal !== order.total && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Tạm tính:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                )}
                {isEnabled('invoice_show_discount') && order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#dc2626' }}>
                    <span>Giảm giá:</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                {isEnabled('invoice_show_total') && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '1.2em', 
                    fontWeight: 'bold',
                    borderTop: '1px solid #ddd',
                    paddingTop: '8px',
                    marginTop: '8px'
                  }}>
                    <span>TỔNG CỘNG:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                )}

                {/* Payment Info */}
                {isEnabled('invoice_show_payment_method') && order.payment_method && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.9em' }}>
                    <span>Thanh toán:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {order.payment_method === 'cash' ? 'Tiền mặt' : 
                       order.payment_method === 'transfer' ? 'Chuyển khoản' : 
                       order.payment_method === 'balance' ? 'Trừ số dư' : order.payment_method}
                    </span>
                  </div>
                )}

                {isEnabled('invoice_show_cash_received') && order.payment_method === 'cash' && order.cash_received > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9em' }}>
                    <span>Tiền khách đưa:</span>
                    <span>{formatPrice(order.cash_received)}</span>
                  </div>
                )}

                {isEnabled('invoice_show_change') && order.payment_method === 'cash' && order.change_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9em' }}>
                    <span>Tiền thừa:</span>
                    <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{formatPrice(order.change_amount)}</span>
                  </div>
                )}
              </div>

              {/* Footer Messages */}
              <div className="text-center border-t" style={{ marginTop: '12px', paddingTop: '12px' }}>
                {isEnabled('invoice_show_qr_lookup') && order.code && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: '#f1f5f9', 
                      margin: '0 auto 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      fontSize: '0.75em',
                      color: '#666'
                    }}>
                      QR Code
                    </div>
                    <div style={{ fontSize: '0.75em', color: '#666' }}>
                      Quét để tra cứu đơn hàng
                    </div>
                  </div>
                )}

                {settings.invoice_thank_you && (
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {settings.invoice_thank_you}
                  </div>
                )}

                {settings.invoice_policy && (
                  <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '4px' }}>
                    {settings.invoice_policy}
                  </div>
                )}

                {settings.invoice_note && (
                  <div style={{ fontSize: '0.8em', color: '#888', fontStyle: 'italic' }}>
                    {settings.invoice_note}
                  </div>
                )}

                {isEnabled('invoice_show_vat') && settings.store_tax_id && (
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px', borderTop: '1px dashed #ddd', paddingTop: '8px' }}>
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
              gap: '0.5rem'
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
