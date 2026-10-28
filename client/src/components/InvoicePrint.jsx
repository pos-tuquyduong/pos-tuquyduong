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
 * - inLai: true → in lại từ màn Đơn hàng (bill + tem + phiếu đều mang dòng "IN LẠI")
 * - nhomTheoMa: bảng mã món → nhóm nếu nơi gọi đã có (Sales); không có thì tự tải
 *
 * HD-1: bill vẽ từ GET /api/pos/hoa-don/:id (một cửa dữ liệu, cùng số lúc mua và lúc in lại) — 2 tờ GIAO KHÁCH / LƯU QUẦY
 * (cài đặt `invoice_so_to`). Cửa lỗi / đơn không có id → rơi về bố cục cũ (InvoicePreview), việc in không bị chặn.
 *
 * P16: ngoài bill còn tem cốc + phiếu pha chế; loại nào in, mấy bản: cài đặt `invoice_print_set`
 * (utils/inPhieu.js). Bấm In → lần lượt từng loại, mỗi loại một hộp in.
 *
 * LƯU TRỮ:
 * - Hóa đơn được log vào bảng pos_invoice_logs khi in
 * - invoice_number được lưu vào pos_orders
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import InvoicePreview, { HoaDonTo } from './InvoicePreview';
import { VungTrang, useNhomTheoMa, taiLieuIn, inQuaIframe } from './InPhieu';
import { LOAI_IN, NHAN_LOAI, docBoIn, dungBoIn } from '../utils/inPhieu';
import { danhSachTo, sanSangIn } from '../utils/hoaDon';
import { api } from '../utils/api';

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
  inLai = false,
  nhomTheoMa: nhomBietSan,
  onClose,
  onPrintComplete
}) {
  const boIn = useMemo(() => docBoIn(settings), [settings]);
  const [paperSize, setPaperSize] = useState(initialPaperSize || boIn.bill.kho);
  const [printing, setPrinting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(order.invoice_number || '');
  const [chon, setChon] = useState(() => Object.fromEntries(LOAI_IN.map((l) => [l, boIn[l].bat])));
  const [xem, setXem] = useState('bill');
  const [hd, setHd] = useState(null);          // HD-1: dữ liệu hoá đơn từ máy chủ
  const [hdLoi, setHdLoi] = useState(false);
  const printRef = useRef(null);
  const vungRef = useRef({});
  const daTuMo = useRef(false);
  const { nhomTheoMa, sanSang } = useNhomTheoMa(nhomBietSan);
  const tatCa = useMemo(
    () => dungBoIn(order, settings, { nhomTheoMa, loai: LOAI_IN, inLai }),
    [order, settings, nhomTheoMa, inLai],
  );
  const viec = tatCa.filter((v) => chon[v.loai]);

  useEffect(() => {
    if (!order?.id) return undefined;
    let huy = false;
    api.get(`/hoa-don/${order.id}`)
      .then((r) => { if (!huy) setHd(r.hoa_don); })
      .catch((e) => { console.warn('Không tải được dữ liệu hoá đơn (dùng bố cục cũ):', e); if (!huy) setHdLoi(true); });
    return () => { huy = true; };
  }, [order?.id]);
  const cacTo = useMemo(() => (hd ? danhSachTo(hd, settings, { inLai }) : null), [hd, settings, inLai]);
  const sanSangDeIn = sanSangIn({ sanSang, coId: !!order?.id, hd, hdLoi });   // nút In và tự mở in dùng chung: in sớm sẽ ra bố cục cũ

  // Get paper config (for print sizing)
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES['a5'];

  // Parse invoice_config từ settings (cùng format với InvoiceSettings/InvoicePreview)
  const invoiceConfig = useMemo(() => {
    // Default config nếu chưa cài đặt
    const defaults = {
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

    try {
      if (settings.invoice_config) {
        const saved = JSON.parse(settings.invoice_config);
        // Merge: defaults ← saved (đảm bảo field mới không bị undefined)
        return {
          ...defaults,
          ...saved,
          show: { ...defaults.show, ...(saved.show || {}) },
          text: { ...defaults.text, ...(saved.text || {}) },
          align: { ...defaults.align, ...(saved.align || {}) }
        };
      }
    } catch (e) {
      console.warn('Không parse được invoice_config đã lưu (dữ liệu hỏng, dùng mặc định):', e);
    }
    return defaults;
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
      address: order.customer_address || '',
      balance: order.customer_balance || 0,
      type: order.customer_type || '',
      note: order.customer_note || '',
      tier: order.customer_tier || null,
    },
    items: (order.items || []).map(item => ({
      code: item.product_code,
      name: item.product_name,
      unit: item.unit || '',
      qty: item.quantity,
      price: item.unit_price,
      total: (item.unit_price || 0) * (item.quantity || 0),
      note: item.note ?? item.notes ?? '',
      flash_price: item.flash_unit_price ?? null,
      tier_price: item.tier_unit_price ?? null,
      signup_price: item.signup_unit_price ?? null,
    })),
    subtotal: order.subtotal || 0,
    discount: order.discount || 0,
    flash_discount: order.flash_discount || 0,
    tier_discount: order.tier_discount || 0,
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
    signup_code: order.signup_code || null,
    signup_nhan: order.signup_nhan || null,   // POS-NHANDIEM-UI-v1
    signup_loi: order.signup_loi || null,
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
  const inBill = async (viecBill) => {
      // Lấy số hóa đơn mới nếu chưa có
      const invNumber = await getNextInvoiceNumber();
      
      // Log in hóa đơn vào database — lỗi log KHÔNG được chặn việc in (và các loại in sau bill)
      try {
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
      } catch (err) {
        console.warn('Không ghi được log in hóa đơn (vẫn in):', err);
      }

      // Dựng tài liệu in (iframe ẩn: không dính chặn popup khi in nhiều loại liên tiếp)
      const banner = viecBill.inLai && !cacTo   // bố cục mới tự mang dòng "IN LẠI · LẦN n"
        ? '<div style="text-align:center;font-weight:bold;border:2px solid #000;padding:2px;margin-bottom:6px">IN LẠI</div>' : '';
      const thanBill = viecBill.trang.map((_, i) =>
        `<div${i < viecBill.trang.length - 1 ? ' style="page-break-after:always"' : ''}>${banner}${printRef.current.innerHTML}</div>`).join('');
      await inQuaIframe(`
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
            img { max-width: 100%; height: auto; }
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
          ${thanBill}
        </body>
        </html>
      `);
  };

  // In theo bộ đã chọn: bill → tem → phiếu pha chế, mỗi loại một hộp in. In hỏng KHÔNG đụng tới đơn (đã lưu từ trước).
  const handlePrint = async () => {
    if (!printRef.current) return;   // modal đã đóng (tự mở in chạy trễ)
    setPrinting(true);

    // Mỗi loại một lần thử riêng: loại này hỏng thì các loại sau vẫn in; báo lỗi một lần ở cuối
    const loi = [];
    for (const v of viec) {
      try {
        if (v.loai === 'bill') {
          await inBill(v);
        } else {
          const than = vungRef.current[v.loai]?.innerHTML;
          if (than) await inQuaIframe(taiLieuIn(`${NHAN_LOAI[v.loai]} ${order.code}`, than, v.kho));
        }
      } catch (err) {
        console.error('Print error:', v.loai, err);
        loi.push(`${NHAN_LOAI[v.loai]}: ${err.message}`);
      }
    }
    if (loi.length) alert('Lỗi khi in (đơn đã lưu, không bị ảnh hưởng):\n' + loi.join('\n'));
    setPrinting(false);

    if (!loi.length && onPrintComplete) {
      onPrintComplete(order.code, paperSize);
    }
  };

  // "Tự mở in sau thanh toán": đúng một lần, sau khi tem/phiếu đã vẽ (cần bảng nhóm món) — chỉ ở màn thanh toán, không phải In lại
  useEffect(() => {
    if (!successInfo || inLai || !boIn.tu_mo || !sanSangDeIn || daTuMo.current || !viec.length) return;
    daTuMo.current = true;
    setTimeout(handlePrint, 0);   // chờ React vẽ xong vùng tem / phiếu
  });

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

        {/* P16: chọn loại sẽ in (tích) + loại đang xem trước (bấm tên) */}
        <div style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {inLai && <b style={{ color: '#dc2626' }}>IN LẠI</b>}
          {LOAI_IN.map((l) => {
            const v = tatCa.find((x) => x.loai === l);
            return (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: xem === l ? '#dbeafe' : '#f1f5f9', opacity: v ? 1 : 0.5 }}>
                <input type="checkbox" disabled={!v} checked={!!v && !!chon[l]} onChange={() => setChon((c) => ({ ...c, [l]: !c[l] }))} />
                <button type="button" onClick={() => setXem(l)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: xem === l ? 'bold' : 'normal' }}>
                  {NHAN_LOAI[l]}{v ? ` ×${v.trang.length}` : ' (không có món)'}
                </button>
              </label>
            );
          })}
        </div>

        {/* Paper Size Selector */}
        {xem === 'bill' && <div style={{
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
        </div>}

        {/* Invoice Preview - dùng InvoicePreview (cùng component với Cài đặt HĐ) */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          background: '#e5e7eb',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ display: xem === 'bill' ? 'block' : 'none' }}>
            <div ref={printRef}>
              {cacTo ? cacTo.map((to, i) => (
                <div key={to.lien} style={i < cacTo.length - 1 ? { pageBreakAfter: 'always' } : undefined}>
                  <HoaDonTo to={to} size={paperSize} logo={settings.store_logo || ''} />
                </div>
              )) : (
                <InvoicePreview
                  config={invoiceConfig}
                  size={paperSize}
                  logo={settings.store_logo || ''}
                  orderData={orderData}
                />
              )}
            </div>
          </div>
          {tatCa.filter((v) => v.loai !== 'bill').map((v) => (
            <div key={v.loai} style={{ display: xem === v.loai ? 'block' : 'none', zoom: 2, boxShadow: '0 0 4px #888' }}>
              <VungTrang viec={v} cha={(el) => { vungRef.current[v.loai] = el; }} />
            </div>
          ))}
          {xem !== 'bill' && !tatCa.some((v) => v.loai === xem) && <p>Đơn này không có món cần {NHAN_LOAI[xem].toLowerCase()}.</p>}
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
            disabled={printing || !sanSangDeIn || !viec.length}   // chờ bảng nhóm món: in sớm sẽ bỏ qua nhóm đã tắt
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
            {printing ? 'Đang xử lý...' : `🖨 ${inLai ? 'In lại' : 'In'}${viec.length ? '' : ' (chưa chọn loại)'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
