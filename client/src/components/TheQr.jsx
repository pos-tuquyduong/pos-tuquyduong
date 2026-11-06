/**
 * TheQr — thẻ mã QR thanh toán thương hiệu (GIAO-DIEN-1 F), DÙNG CHUNG cho màn quầy (ManQr) và màn khách (ManThu): mọi cổng QR (payOS / SePay /
 * Tingee) đều đi qua `phien.qr`. Bill in nhiệt không dùng thẻ này. Màu cố định theo mẫu chủ quán duyệt (không theo giao diện tối).
 * Đồng hồ đếm ngược / trạng thái phiên do chỗ gọi vẽ ngoài thẻ — thẻ chỉ có: đầu thẻ, ô trắng (số tiền, mã, dòng "<HD> · <nội dung CK>").
 */
import { useMemo } from 'react';
import { qrThuongHieuSvg, dongChanThe } from '../utils/veQrThuongHieu';
import logo from '../assets/logo_TQD_bieu_tuong.png';

export default function TheQr({ qr, tien, noiDung, khongVe = 'Không vẽ được mã QR', className, style }) {
  const svg = useMemo(() => qrThuongHieuSvg(qr, logo), [qr]);
  const chan = dongChanThe(noiDung);
  return (
    <div className={className} style={{ background: '#FBF3E6', border: '3px solid #B08028', borderRadius: 24, padding: '4%', boxSizing: 'border-box', containerType: 'inline-size', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3%', marginBottom: '3%' }}>
        <img src={logo} alt="" style={{ width: '16%', aspectRatio: '1', objectFit: 'contain' }} />
        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ color: '#7A1E18', fontWeight: 800, fontSize: 'clamp(1.1rem, 4.4cqw, 1.7rem)' }}>Tứ Quý Đường</div>
          <div style={{ color: '#7A6249', fontSize: 'clamp(0.8rem, 3cqw, 1.1rem)' }}>Quét mã để thanh toán</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: '4%', boxSizing: 'border-box' }}>
        <div style={{ color: '#7A1E18', fontWeight: 800, textAlign: 'center', fontSize: 'clamp(1.6rem, 8cqw, 2.6rem)' }}>{(Number(tien) || 0).toLocaleString('vi-VN')}đ</div>
        {svg ? <div style={{ aspectRatio: '1', margin: '2% 0' }} dangerouslySetInnerHTML={{ __html: svg }} />
          : <div style={{ color: '#7A6249', textAlign: 'center', padding: '2rem 0' }}>{khongVe}</div>}
        {chan && <div style={{ color: '#444', textAlign: 'center', fontSize: 'clamp(0.75rem, 2.8cqw, 1rem)', wordBreak: 'break-all' }}>{chan}</div>}
      </div>
    </div>
  );
}
