// Khung chung cho màn tải dữ liệu: đang tải / lỗi (có nút thử lại) / nội dung. Không bao giờ trắng màn.
export default function TrangTai({ tai, children }) {
  if (tai.dangTai && !tai.dl) return <div className="giua">Đang tải…</div>;
  if (tai.loi) {
    return (
      <div>
        <div className="loi">{tai.loi}</div>
        <button className="nut" onClick={tai.taiLai}>Thử lại</button>
      </div>
    );
  }
  return children(tai.dl);
}
