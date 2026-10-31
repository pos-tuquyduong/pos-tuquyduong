/**
 * Nội dung lúc rảnh: chạy vòng các "trang" quán đã cài (thứ tự, bật / tắt, số giây do máy chủ trả trong `nd.trang`).
 * Trang không có gì để hiện thì bỏ qua (Giờ vàng không chạy, chưa có địa chỉ App, menu rỗng). Trang "ảnh" chờ KH-SP-2: chưa vẽ.
 */
import { useEffect, useMemo, useState } from 'react';
import { qrSvg } from '../../utils/veQr';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const TEN_NHOM = { juice: 'Nước ép', tea: 'Trà' };
const MON_MOI_TRANG = 12;

/** Danh sách "màn" thật sự hiện được, theo thứ tự quán cài; menu dài tách nhiều màn, mỗi màn đủ số giây của trang. */
function dungDanhSach(nd) {
  const ra = [];
  for (const t of nd?.trang || []) {
    if (t.loai === 'menu') {
      for (let i = 0; i < nd.menu.length; i += MON_MOI_TRANG) ra.push({ ...t, mon: nd.menu.slice(i, i + MON_MOI_TRANG) });
    } else if (t.loai === 'flash' && nd.flash?.dang_chay) ra.push({ ...t, flash: nd.flash });
    else if (t.loai === 'qr_app' && nd.dia_chi_app) ra.push({ ...t, dia_chi: nd.dia_chi_app });
    else if (t.loai === 'chu' && (t.tieu_de || t.noi_dung)) ra.push(t);
  }
  return ra;
}

export default function TrangRanh({ nd }) {
  const ds = useMemo(() => dungDanhSach(nd), [nd]);
  const [i, setI] = useState(0);
  const cur = ds.length ? ds[i % ds.length] : null;
  useEffect(() => {
    if (!cur) return undefined;
    const h = setTimeout(() => setI((n) => n + 1), cur.giay * 1000);
    return () => clearTimeout(h);
  }, [cur, i]);
  const svgApp = useMemo(() => (cur?.dia_chi ? qrSvg(cur.dia_chi) : ''), [cur?.dia_chi]);

  if (!cur) return <div className="mk-giua"><div className="mk-to">Xin chào quý khách</div></div>;
  return (
    <div className="mk-trang" key={i}>
      {cur.loai === 'menu' && (
        <>
          <div className="mk-to">Thực đơn</div>
          <div className="mk-menu">
            {cur.mon.map((m, j) => (
              <div key={j} className="mk-dong"><span className={m.het ? 'mk-het' : ''}>{m.ten}{m.het && <span className="mk-ten-het">Hết hàng</span>}</span><span>{vnd(m.gia)}</span></div>
            ))}
          </div>
          {cur.mon.some((m) => m.nhom) && <div className="mk-mo">{[...new Set(cur.mon.map((m) => TEN_NHOM[m.nhom] || m.nhom).filter(Boolean))].join(' · ')}</div>}
        </>
      )}
      {cur.loai === 'flash' && (
        <div className="mk-giua">
          <div className="mk-to">Giờ vàng — giảm {cur.flash.phan_tram}%</div>
          {cur.flash.mon.length > 0 && <div className="mk-vua">{cur.flash.mon.join(' · ')}</div>}
          {cur.flash.den && <div className="mk-vua mk-mo">Đến {cur.flash.den}</div>}
        </div>
      )}
      {cur.loai === 'qr_app' && (
        <div className="mk-giua">
          <div className="mk-to">{cur.tieu_de || 'Tải ứng dụng — tích điểm, nhận ưu đãi'}</div>
          {svgApp && <div className="mk-qr-app" dangerouslySetInnerHTML={{ __html: svgApp }} />}
          {cur.noi_dung && <div className="mk-vua mk-mo">{cur.noi_dung}</div>}
        </div>
      )}
      {cur.loai === 'chu' && (
        <div className="mk-giua">
          {cur.tieu_de && <div className="mk-to">{cur.tieu_de}</div>}
          {cur.noi_dung && <div className="mk-vua" style={{ whiteSpace: 'pre-line' }}>{cur.noi_dung}</div>}
        </div>
      )}
    </div>
  );
}
