// HUY-1 (A, C — chủ quán 05.11; bản mẫu ban_mau_pos/ khungHuyDon): hộp "Huỷ đơn" dùng ở chi tiết Lịch sử đơn và thẻ Đơn App.
// Huỷ CẢ đơn; lý do lấy từ máy chủ (GET /orders/ly-do-huy — một danh sách), "Khác" phải ghi thêm; nút khoá tới khi đủ.
// Máy chủ tự tính số hoàn (toàn bộ đã trả vào tài khoản khách; khách lẻ: trả tiền mặt từ két) và trả { hoan } — màn chỉ báo lại.
// Không hoàn tác 5 giây (tiền đã vào tài khoản khách / đã ra khỏi két).
import { useState, useEffect } from 'react';
import { ordersApi } from '../utils/api';
import { baoXong, baoLoi, baoLoiTu } from './thongBaoKho.js';
import { ngayVN } from '../utils/ngayVN';

const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

/** Hiện nút "Huỷ đơn"? — CÙNG luật máy chủ (orders.js route huỷ): quyền cancel_order, đơn ngày trước chỉ chủ quán. Chỉ giấu nút; máy chủ kiểm lại. */
export const hienNutHuy = (user, hasPermission, ngayTao) => hasPermission('cancel_order')
  && (user?.role === 'owner' || String(ngayTao || '').slice(0, 10) === ngayVN());

/** don = { id (pos_orders.id), code, ten_khach, co_tai_khoan }; dong() đóng hộp; xong() chạy sau khi huỷ được (tải lại danh sách). */
export default function HopHuyDon({ don, dong, xong }) {
  const [dsLyDo, setDsLyDo] = useState([]);
  const [ma, setMa] = useState(null);
  const [ghiThem, setGhiThem] = useState('');
  const [dangGui, setDangGui] = useState(false);

  useEffect(() => {
    ordersApi.lyDoHuy().then((r) => setDsLyDo(r.data || [])).catch((e) => baoLoiTu('tải lý do huỷ', e));
  }, []);

  const du = !!ma && (ma !== 'khac' || !!ghiThem.trim());
  const tenKhach = don.ten_khach || 'khách';

  const huy = async () => {
    if (!du || dangGui) return;
    setDangGui(true);
    try {
      const r = await ordersApi.cancel(don.id, { ly_do_ma: ma, ghi_them: ghiThem.trim() });
      const h = r.hoan || {};
      baoXong(`Đã huỷ đơn ${don.code}` + (h.tai_khoan > 0 ? ` — đã hoàn ${tien(h.tai_khoan)} vào tài khoản ${tenKhach}` : '')
        + (h.tien_mat > 0 ? ` — trả khách ${tien(h.tien_mat)} tiền mặt từ két` : ''));
      xong();
    } catch (e) {
      // Đơn giao đang pha cần chọn "đồ đã pha" — hộp này không có chỗ chọn, dẫn sang màn Giao hàng (giaoHang.js CHON_DO_DA_PHA)
      if (e?.code === 'CHON_DO_DA_PHA') baoLoi('Chưa huỷ đơn được', 'Đơn giao đang pha — huỷ ở màn Giao hàng để chọn đồ đã pha (dùng lại / bỏ đi).');
      else baoLoiTu('huỷ đơn', e);
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1rem' }} onClick={dong}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 440, padding: '1rem' }}>
        <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>Huỷ đơn {don.code} — lý do (bắt buộc)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {dsLyDo.map((l) => (
            <button key={l.ma} type="button" className="btn btn-outline" onClick={() => setMa(l.ma)}
              style={ma === l.ma ? { background: '#fee2e2', borderColor: '#dc2626' } : undefined}>{l.nhan}</button>
          ))}
        </div>
        <input className="input" style={{ width: '100%', marginTop: 8, boxSizing: 'border-box' }} value={ghiThem} maxLength={300}
          placeholder={ma === 'khac' ? 'Ghi rõ lý do (bắt buộc)' : 'Ghi thêm (không bắt buộc)'} onChange={(e) => setGhiThem(e.target.value)} />
        <div style={{ fontSize: 13, color: '#7f1d1d', margin: '8px 0' }}>
          Huỷ cả đơn: {don.co_tai_khoan ? `hoàn toàn bộ số khách đã trả vào tài khoản ${tenKhach}` : 'trả khách số đã trả bằng tiền mặt từ két'};
          trả hàng về kho. Không hoàn tác được.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={dong} disabled={dangGui}>Không huỷ</button>
          <button type="button" className="btn" style={{ flex: 1.4, background: '#dc2626', color: 'white' }} disabled={!du || dangGui}
            onClick={huy}>{dangGui ? 'Đang huỷ…' : 'Huỷ đơn'}</button>
        </div>
      </div>
    </div>
  );
}
