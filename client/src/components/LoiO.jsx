// BAO-1b — chữ đỏ NGAY DƯỚI ô bị lỗi (đi cùng thông báo nổi của BAO-1a, không thay nó).
export default function LoiO({ loi }) {
  if (!loi) return null;
  return <div className="loi-o" role="alert">{loi}</div>;
}
