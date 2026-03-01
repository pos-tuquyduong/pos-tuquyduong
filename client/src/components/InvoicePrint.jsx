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

import { useState, useRef, useMemo } from 'react';
import { X, Printer } from 'lucide-react';
import InvoicePreview from './InvoicePreview';

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
  successInfo,
  onClose, 
  onPrintComplete 
}) {
  const [paperSize, setPaperSize] = useState(initialPaperSize || settings.invoice_default_size || 'a5');
  const [printing, setPrinting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(order.invoice_number || '');
  const printRef = useRef(null);

  // Get paper config (for print sizing)
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES['a5'];

  // DEBUG - xóa sau khi fix xong
  console.log('🔍 InvoicePrint settings:', {
    hasInvoiceConfig: !!settings.invoice_config,
    hasStoreLogo: !!settings.store_logo,
    logoLength: settings.store_logo?.length,
    allKeys: Object.keys(settings)
  });

  // Parse invoice_config từ settings (cùng format với InvoiceSettings/InvoicePreview)
  const invoiceConfig = useMemo(() => {
    try {
      if (settings.invoice_config) return JSON.parse(settings.invoice_config);
    } catch (e) {}
    // Default config nếu chưa cài đặt
    return {
      show: {
        logo: true, store_name: true, slogan: true, address: true, phone: true, email: false,
        invoice_number: true, order_code: true, datetime: true, staff: true, qr_code: false,
        customer_name: true, customer_phone: true, customer_address: false, customer_balance: false,
        customer_type: false, customer_note: false,
        col_stt: false, col_product_code: false, col_unit: false, col_price: true,
        discount_detail: true, shipping_fee: true, amount_words: false, payment_checkbox: true,
        sig_seller: true, sig_shipper: true, sig_customer: true,
        thank_you: true, policy: true
      },
      text: {
        store_name: settings.store_name || 'TỨ QUÝ ĐƯỜNG',
        slogan: settings.store_slogan || '',
        address: settings.store_address || '',
        phone: settings.store_phone || '',
        email: settings.store_email || '',
        thank_you: settings.invoice_thank_you || 'Cảm ơn quý khách!',
        policy: settings.invoice_policy || ''
      },
      align: { header: 'center', order_info: 'justify', customer: 'left', totals: 'right', signatures: 'justify', footer: 'center' }
    };
  }, [settings]);

  // Map order data sang format InvoicePreview
  const orderData = useMemo(() => ({
    invoice_number: invoiceNumber || order.invoice_number || '',
    order_code: order.code,
    datetime: formatDateTime(order.created_at),
    staff: order.created_by,
    customer: {
      name: order.customer_name || 'Khách lẻ',
      phone: order.customer_phone || '',
      address: '',
      balance: 0,
    },
    items: (order.items || []).map(item => ({
      code: item.product_code,
      name: item.product_name,
      unit: '',
      qty: item.quantity,
      price: item.unit_price,
      total: (item.unit_price || 0) * (item.quantity || 0)
    })),
    subtotal: order.subtotal || 0,
    discount: order.discount || 0,
    discount_type: order.discount_type,
    discount_value: order.discount_value,
    discount_code: order.discount_code,
    shipping: order.shipping_fee || 0,
    total: order.total || 0,
    payment_method: order.payment_method,
    cash_received: order.cash_received,
    change_amount: order.change_amount,
    debt_amount: order.debt_amount,
    balance_amount: order.balance_amount,
  }), [order, invoiceNumber]);

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
          background: successInfo ? '#22c55e' : '#f8fafc'
        }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: successInfo ? 'white' : 'inherit' }}>
            {successInfo ? '✅ Thanh toán thành công!' : '🧾 Xem trước hóa đơn'}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: successInfo ? 'white' : '#64748b'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Info: Tiền thối, số dư */}
        {successInfo && (
          <div style={{
            padding: '0.75rem 1.5rem',
            background: '#f0fdf4',
            borderBottom: '1px solid #bbf7d0',
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '0.95rem'
          }}>
            <span><strong>Đơn:</strong> {order.code}</span>
            {successInfo.paymentMethod === 'cash' && successInfo.change > 0 && (
              <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '1.05rem' }}>
                💰 Tiền thối: {formatPrice(successInfo.change)}
              </span>
            )}
            {successInfo.balanceUsed > 0 && successInfo.balanceAfter !== undefined && (
              <span>Dư còn: <strong>{formatPrice(successInfo.balanceAfter)}</strong></span>
            )}
            {successInfo.debtAmount > 0 && (
              <span style={{ color: '#ea580c' }}>Ghi nợ: <strong>{formatPrice(successInfo.debtAmount)}</strong></span>
            )}
          </div>
        )}

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

        {/* Invoice Preview - dùng InvoicePreview (cùng component với Cài đặt HĐ) */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          background: '#e5e7eb',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div ref={printRef}>
            <InvoicePreview
              config={invoiceConfig}
              size={paperSize}
              logo={settings.store_logo || ''}
              orderData={orderData}
            />
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
              background: successInfo ? '#3b82f6' : '#f1f5f9',
              color: successInfo ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            {successInfo ? '➕ Đơn mới' : 'Đóng'}
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: successInfo ? '#22c55e' : '#3b82f6',
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
            {printing ? 'Đang xử lý...' : '🖨 In hóa đơn'}
          </button>
        </div>
      </div>
    </div>
  );
}
