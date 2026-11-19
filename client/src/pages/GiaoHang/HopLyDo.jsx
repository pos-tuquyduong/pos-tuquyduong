/**
 * GIAO-3 E — hộp nhập lý do của POS (thay hộp hỏi của trình duyệt): đóng thẻ, huỷ chuyến, huỷ / từ chối đơn giao. Lý do ngắn hơn LY_DO_TOI_THIEU →
 * báo ngay dưới ô, không gửi. Thôi → không gửi gì. Lỗi máy chủ do nơi gọi báo (thanh lỗi như cũ).
 * `hop` = { cau, xong } — xong(lyDo | null) trả lời cho lời hỏi đang chờ (index.jsx hoiLyDo).
 */
import { useState } from 'react';

const LY_DO_TOI_THIEU = 3;   // cùng số máy chủ (server/utils/giaoHang.js LY_DO_TOI_THIEU) — máy chủ vẫn kiểm lại

export default function HopLyDo({ hop }) {
  const [chu, setChu] = useState('');
  const [loi, setLoi] = useState('');
  const xacNhan = () => {
    if (chu.trim().length < LY_DO_TOI_THIEU) { setLoi(`Nhập lý do (ít nhất ${LY_DO_TOI_THIEU} ký tự)`); return; }
    hop.xong(chu.trim());
  };
  return (
    <div className="gh-nen">
      <div className="gh-chi-tiet" onClick={(e) => e.stopPropagation()}>
        <div><b>{hop.cau}</b></div>
        <textarea className="gh-o-ly-do" rows={3} value={chu} autoFocus onChange={(e) => { setChu(e.target.value); setLoi(''); }} />
        {loi && <div className="gh-loi">{loi}</div>}
        <div className="gh-hang-nut">
          <button className="gh-nut" onClick={xacNhan}>Xác nhận</button>
          <button className="gh-nut-phu" onClick={() => hop.xong(null)}>Thôi</button>
        </div>
      </div>
    </div>
  );
}
