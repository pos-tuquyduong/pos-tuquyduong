import { layVoucher } from '../api.js';
import { dungTai } from '../dungTai.js';
import { dinhDangGia, dinhDangNgay, moTaGiam } from '../dinhDang.js';
import TrangTai from '../components/TrangTai.jsx';

function The({ ten, ma, loai, giaTri, toiThieu, han }) {
  return (
    <div className="the">
      <div className="dong">
        <b>{ten || 'Mã giảm giá'}</b>
        <span>{moTaGiam(loai, giaTri)}</span>
      </div>
      <div>Mã: <b>{ma}</b></div>
      {toiThieu > 0 && <div className="phu">Đơn từ {dinhDangGia(toiThieu)}</div>}
      {han && <div className="phu">Hạn dùng đến {dinhDangNgay(han)}</div>}
    </div>
  );
}

export default function Voucher() {
  const tai = dungTai(layVoucher);
  return (
    <div>
      <h2>Voucher</h2>
      <TrangTai tai={tai}>
        {(dl) => {
          const dung = dl.data.filter((v) => v.status === 'available');
          const khongCo = dl.ma_khach_moi.length === 0 && dung.length === 0;
          return (
            <>
              {khongCo && <div className="giua">Bạn chưa có voucher nào.</div>}
              {dl.ma_khach_moi.map((v) => (
                <The key={v.code} ten="Ưu đãi khách mới" ma={v.code} loai={v.discount_type} giaTri={v.discount_value} toiThieu={v.min_order} han={v.valid_to} />
              ))}
              {dung.map((v) => (
                <The key={v.id} ten={v.reward_name} ma={v.code} loai={v.discount_type} giaTri={v.discount_value} han={v.expires_at} />
              ))}
            </>
          );
        }}
      </TrangTai>
    </div>
  );
}
