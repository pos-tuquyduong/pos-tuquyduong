// NAP-1 — thẻ Báo cáo "Sổ sách": ba ô cho chủ quán đọc tiền nạp đúng nghĩa. Số do máy chủ tính (GET /reports/so-sach), màn chỉ hiện.
//   1. Tiền thật vào quán (khớp két / sao kê) — trong đó tiền nạp.   2. Bán hàng − Thưởng nạp đã dùng = doanh thu thật (nạp không là doanh thu).
//   3. Quán đang giữ hộ khách tới cuối kỳ — tách tiền nạp / thưởng nạp.
import { useEffect, useState } from 'react';
import { reportsApi } from '../utils/api';
import { ngayVN } from '../utils/ngayVN';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const Dong = ({ ten, so, dam, phu }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontWeight: dam ? 700 : 400, color: phu ? '#6b7280' : undefined }}>
    <span>{ten}</span><span>{so}</span>
  </div>
);

export default function SoSach() {
  const [ky, setKy] = useState({ tu: ngayVN(), den: ngayVN() });
  const [kq, setKq] = useState(null);
  const [loi, setLoi] = useState('');

  useEffect(() => {
    let con = true;
    setLoi('');
    reportsApi.soSach(ky.tu, ky.den).then((r) => { if (con) setKq(r); }).catch((e) => { if (con) { setKq(null); setLoi(e.message || 'Không tải được sổ sách'); } });
    return () => { con = false; };
  }, [ky]);

  return (
    <>
      <div className="card mb-1" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span>Từ</span><input type="date" className="input" style={{ width: 'auto' }} value={ky.tu} onChange={(e) => setKy((k) => ({ ...k, tu: e.target.value }))} />
        <span>đến</span><input type="date" className="input" style={{ width: 'auto' }} value={ky.den} onChange={(e) => setKy((k) => ({ ...k, den: e.target.value }))} />
      </div>
      {loi && <div className="card mb-1" style={{ color: '#b91c1c' }}>{loi}</div>}
      {kq && (
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="card">
            <div className="card-title">💵 Tiền thật đã vào quán</div>
            <Dong ten="Tiền mặt (két)" so={vnd(kq.tien_vao.tien_mat)} />
            <Dong ten="Chuyển khoản (sao kê)" so={vnd(kq.tien_vao.chuyen_khoan)} />
            <Dong ten="Trong đó tiền nạp" so={vnd(kq.tien_vao.trong_do_nap)} phu />
          </div>
          <div className="card">
            <div className="card-title">🧾 Bán được bao nhiêu</div>
            <Dong ten="Tổng bán (không gồm nạp)" so={vnd(kq.ban_hang.tong_ban)} />
            <Dong ten="Thưởng nạp đã dùng" so={'−' + vnd(kq.ban_hang.thuong_nap_da_dung)} />
            <Dong ten="Doanh thu thật" so={vnd(kq.ban_hang.doanh_thu_that)} dam />
          </div>
          <div className="card">
            <div className="card-title">🏦 Quán đang giữ hộ khách (cuối {kq.den})</div>
            <Dong ten="Tiền nạp" so={vnd(kq.giu_ho.tien_nap)} />
            <Dong ten="Thưởng nạp" so={vnd(kq.giu_ho.thuong_nap)} />
            <Dong ten="Tổng số dư khách" so={vnd(kq.giu_ho.tong)} dam />
          </div>
        </div>
      )}
    </>
  );
}
