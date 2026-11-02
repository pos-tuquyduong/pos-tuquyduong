/**
 * Màn khách lúc thu: ĐÚNG chuỗi `qr` máy chủ trả (vẽ to), số phải trả, món, dòng giảm, đếm ngược. Không tự tính tiền —
 * danh sách món do máy chủ dựng; thiếu danh sách (giá vừa đổi) thì chỉ hiện tổng.
 */
import { useEffect, useMemo, useState } from 'react';
import { qrSvg } from '../../utils/veQr';
import { dinhDangDemNguoc } from '../BanHang/tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function ManThu({ thu, nhanLuc }) {
  const svg = useMemo(() => qrSvg(thu.qr), [thu.qr]);
  const [, nhip] = useState(0);
  useEffect(() => { const h = setInterval(() => nhip((n) => n + 1), 1000); return () => clearInterval(h); }, []);
  // Đếm theo đồng hồ đơn điệu của máy này kể từ lúc nhận số của máy chủ — không tin đồng hồ ngày giờ của máy khách.
  const giay = Math.max(0, thu.con_giay - Math.floor((performance.now() - nhanLuc) / 1000));

  return (
    <div className="mk-thu">
      <div className="mk-qr-khung">
        <div className="mk-vua mk-mo">Quý khách quét mã để thanh toán</div>
        {svg ? <div className="mk-qr" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="mk-vua">Không hiển thị được mã QR — nhờ nhân viên hỗ trợ</div>}
        <div className="mk-vua mk-mo">{giay > 0 ? `Còn ${dinhDangDemNguoc(giay)}` : 'Đang kiểm tra…'}</div>
      </div>
      <div className="mk-ds">
        {thu.ten_khach && <div className="mk-vua mk-mo">Khách: {thu.ten_khach}</div>}
        {(thu.mon || []).map((m, i) => (
          <div key={i} className="mk-dong"><span>{m.so_luong} × {m.ten}</span><span>{vnd(m.thanh_tien)}</span></div>
        ))}
        {thu.mon && <div className="mk-dong mk-mo"><span>Tạm tính</span><span>{vnd(thu.tam_tinh)}</span></div>}
        {(thu.giam || []).map((g, i) => (
          <div key={i} className="mk-dong mk-dong-giam"><span>{g.ten}</span><span>−{vnd(g.tien)}</span></div>
        ))}
        {thu.tru_tai_khoan > 0 && <div className="mk-dong mk-dong-giam"><span>Trừ tài khoản</span><span>−{vnd(thu.tru_tai_khoan)}</span></div>}
        <div className="mk-dong mk-dong-tong"><span>Cần thanh toán</span><span className="mk-tien">{vnd(thu.con_lai)}</span></div>
      </div>
    </div>
  );
}
