import { useCallback, useEffect, useState } from 'react';
import { layDon, layChiTietDon } from '../api.js';
import { dungTai } from '../dungTai.js';
import { dinhDangGia, dinhDangNgay } from '../dinhDang.js';
import TrangTai from '../components/TrangTai.jsx';

// Nhãn trạng thái suy từ trường máy chủ trả (trang_thai, thanh_toan, tong, da_tra) — không tự tính tiền.
function nhanDon(d) {
  if (d.trang_thai === 'cancelled') return <span className="nhan-xau">Đã huỷ</span>;
  if (d.thanh_toan === 'paid') return <span className="nhan-tot">Đã thanh toán</span>;
  return <span className="nhan-xau">Còn nợ {dinhDangGia(d.tong - d.da_tra)}</span>;
}

function ChiTiet({ ma, quayLai }) {
  const tai = dungTai(useCallback(() => layChiTietDon(ma), [ma]));
  return (
    <div>
      <button className="nut chu" style={{ width: 'auto', marginTop: 0 }} onClick={quayLai}>‹ Quay lại</button>
      <TrangTai tai={tai}>
        {({ don }) => (
          <div className="the">
            <b>Đơn {don.ma}</b>
            <div className="phu">{dinhDangNgay(don.ngay)}</div>
            {don.mon.map((m, i) => (
              <div className="dong" key={i}>
                <div>
                  <div>{m.so_luong} × {m.ten}</div>
                  {m.ghi_chu && <div className="phu">{m.ghi_chu}</div>}
                </div>
                <span>{dinhDangGia(m.thanh_tien)}</span>
              </div>
            ))}
            <div className="dong"><b>Tổng</b><b>{dinhDangGia(don.tong)}</b></div>
            <div>{nhanDon(don)}</div>
          </div>
        )}
      </TrangTai>
    </div>
  );
}

export default function Don() {
  const [ds, datDs] = useState([]);
  const [trang, datTrang] = useState(0);
  const [conNua, datConNua] = useState(false);
  const [dang, datDang] = useState(true);
  const [loi, datLoi] = useState('');
  const [chon, datChon] = useState('');

  const tai = useCallback(async (t) => {
    datDang(true); datLoi('');
    try {
      const r = await layDon(t);
      // Phân trang theo OFFSET: đơn mới làm trang sau lặp lại đơn cuối trang trước → bỏ đơn đã có (key trùng).
      datDs((cu) => (t === 1 ? r.data : [...cu, ...r.data.filter((d) => !cu.some((c) => c.ma === d.ma))]));
      datTrang(t); datConNua(r.con_nua);
    } catch (e) {
      datLoi(e.message);
    } finally {
      datDang(false);
    }
  }, []);
  useEffect(() => { tai(1); }, [tai]);

  if (chon) return <ChiTiet ma={chon} quayLai={() => datChon('')} />;
  return (
    <div>
      <h2>Đơn của bạn</h2>
      {ds.length === 0 && !dang && !loi && <div className="giua">Bạn chưa có đơn nào.</div>}
      {ds.length > 0 && (
        <div className="the">
          {ds.map((d) => (
            <div className="dong" key={d.ma} onClick={() => datChon(d.ma)} style={{ cursor: 'pointer' }}>
              <div>
                <div>Đơn {d.ma}</div>
                <div className="phu">{dinhDangNgay(d.ngay)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{dinhDangGia(d.tong)}</div>
                {nhanDon(d)}
              </div>
            </div>
          ))}
        </div>
      )}
      {dang && <div className="giua">Đang tải…</div>}
      {loi && <div className="loi">{loi}</div>}
      {loi && <button className="nut" onClick={() => tai(trang + 1)}>Thử lại</button>}
      {conNua && !dang && !loi && <button className="nut phu-nut" onClick={() => tai(trang + 1)}>Xem thêm</button>}
    </div>
  );
}
