/**
 * Màn chuyển khoản = QR payOS (DAC_TA_BAN_HANG_2410 mục 1.10). Phiên đã tạo ở máy chủ; màn chỉ VẼ QR, đếm ngược tới `het_han` máy chủ trả,
 * và hỏi lại phiên cho tới khi máy chủ báo đã nhận (tiền về → webhook payOS chốt). KHÔNG có nút tự đánh dấu đã thu: ngoại lệ duy nhất là
 * "Xác nhận tay" — chỉ người có quyền xac_nhan_ck_tay, bắt buộc lý do, máy chủ ghi nhật ký.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { thanhToanApi } from '../../utils/api';
import { qrSvg } from '../../utils/veQr';
import { conLaiGiay, dinhDangDemNguoc, hanhDongPhien } from './tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const CHU_KY_HOI_MS = 3000;
const LY_DO_TOI_THIEU = 3;                                   // khớp máy chủ (thanh-toan.js)

export default function ManQr({ phien, onXong, onNha }) {
  const { hasPermission } = useAuth();
  const [giay, setGiay] = useState(() => conLaiGiay(phien.het_han, Date.now()));
  const [moTay, setMoTay] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);
  const daXong = useRef(false);                             // chỉ báo kết quả một lần (hỏi lại và bấm tay có thể chồng nhau)
  const svg = useMemo(() => qrSvg(phien.qr), [phien.qr]);

  const hoi = useCallback(async () => {
    if (daXong.current) return;
    try {
      const r = await thanhToanApi.hoiPhien(phien.id);
      const viec = hanhDongPhien(r.phien?.trang_thai);
      if (viec === 'doi' || daXong.current) return;
      daXong.current = true;
      if (viec === 'xong') onXong(r.phien.order?.id);
      else onNha(r.phien.trang_thai === 'het_han' ? 'QR đã hết hạn — chưa nhận được tiền. Giỏ còn nguyên.' : 'Đã huỷ chuyển khoản. Giỏ còn nguyên.');
    } catch { /* mạng chập chờn: hỏi lại lượt sau, không bỏ phiên */ }
  }, [phien.id, onXong, onNha]);

  useEffect(() => {
    const dem = setInterval(() => setGiay(conLaiGiay(phien.het_han, Date.now())), 1000);
    const hoiLai = setInterval(hoi, CHU_KY_HOI_MS);
    return () => { clearInterval(dem); clearInterval(hoiLai); };
  }, [phien.het_han, hoi]);
  useEffect(() => { if (giay === 0) hoi(); }, [giay, hoi]);   // hết giờ: hỏi máy chủ ngay (máy chủ mới là bên quyết)

  const huy = async () => {
    setDang(true); setLoi('');
    try { await thanhToanApi.huyPhien(phien.id); } catch { /* đã chốt / đã huỷ: hỏi lại bên dưới để biết kết quả thật */ }
    await hoi();
    setDang(false);
  };
  const xacNhanTay = async () => {
    if (lyDo.trim().length < LY_DO_TOI_THIEU) { setLoi(`Nhập lý do (ít nhất ${LY_DO_TOI_THIEU} ký tự)`); return; }
    setDang(true); setLoi('');
    try {
      const r = await thanhToanApi.xacNhanTay(phien.id, lyDo.trim());
      if (!daXong.current) { daXong.current = true; onXong(r.order?.id); }
    } catch (e) { setLoi(e.message || 'Không xác nhận được'); }
    setDang(false);
  };

  return (
    <div className="bh-lop" style={{ alignItems: 'center' }}>
      <div className="bh-khung bh-noi" style={{ textAlign: 'center' }}>
        <b>Chuyển khoản · {vnd(phien.con_lai)}</b>
        {svg ? <div style={{ width: 240, height: 240, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="bh-trong">Không vẽ được mã QR — huỷ và thu lại</div>}
        <div>Nội dung: <b>{phien.noi_dung}</b></div>
        <div className="bh-so-lon" style={{ textAlign: 'center' }}>{giay > 0 ? `Còn ${dinhDangDemNguoc(giay)}` : 'Đang kiểm tra…'}</div>
        <div className="bh-ghi-chu-ngu">Tiền về sẽ tự sang màn kết thúc.</div>
        {loi && <div className="bh-loi"><span>{loi}</span></div>}
        {hasPermission('xac_nhan_ck_tay') && (moTay ? (
          <>
            <input type="text" value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do xác nhận tay (bắt buộc)" maxLength={200} />
            <button className="bh-nut" disabled={dang} onClick={xacNhanTay}>Xác nhận đã nhận tiền (ghi nhật ký)</button>
          </>
        ) : <button className="bh-nut-nho" onClick={() => setMoTay(true)}>Xác nhận tay…</button>)}
        <button className="bh-nut bh-phu" disabled={dang} onClick={huy}>Huỷ — quay về giỏ</button>
      </div>
    </div>
  );
}
