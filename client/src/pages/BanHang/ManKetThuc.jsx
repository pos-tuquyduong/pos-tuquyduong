/**
 * Màn "Đã thanh toán · đơn #<số>": ô Trả lại khách (tiền mặt), xem / in hoá đơn bằng InvoicePrint sẵn có.
 * Lưới món khoá tới khi bấm In (cờ daIn do cha giữ). Hoá đơn lấy số từ máy chủ trả về.
 */
import { useState } from 'react';
import InvoicePrint from '../../components/InvoicePrint';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function ManKetThuc({ don, caiDatHoaDon, nhomTheoMa, daIn, onIn, onDonMoi }) {
  const [xem, setXem] = useState(false);
  const { order, successInfo } = don;
  const soDon = order.invoice_number || order.code;
  return (
    <div className="bh-xong">
      <h2>Đã thanh toán · đơn #{soDon}</h2>
      <div>{order.customer_name} · Tổng {vnd(order.total)}</div>
      {successInfo.paymentMethod === 'cash' && (
        <div className="bh-tra-lai">Trả lại khách<b>{vnd(successInfo.change)}</b></div>
      )}
      {successInfo.balanceUsed > 0 && (
        <div className="bh-ghi-chu-ngu">Trừ tài khoản {vnd(successInfo.balanceUsed)}{successInfo.balanceAfter !== undefined ? ` · còn ${vnd(successInfo.balanceAfter)}` : ''}</div>
      )}
      <button className="bh-nut" onClick={() => setXem(true)}>{daIn ? 'Xem / In lại hoá đơn' : 'In hoá đơn'}</button>
      <button className="bh-nut bh-phu" onClick={onDonMoi}>Đơn mới</button>
      {!daIn && <div className="bh-ghi-chu-ngu">Bấm In để mở lại lưới món. Đơn đã ghi rồi.</div>}
      {xem && (
        <InvoicePrint
          order={order}
          settings={caiDatHoaDon}
          nhomTheoMa={nhomTheoMa}
          successInfo={successInfo}
          inLai={daIn}
          onClose={() => setXem(false)}
          onPrintComplete={onIn}
        />
      )}
    </div>
  );
}
