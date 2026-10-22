import { layDiem } from '../api.js';
import { dungTai } from '../dungTai.js';
import { dinhDangNgay } from '../dinhDang.js';
import TrangTai from '../components/TrangTai.jsx';
import NhanMa from '../components/NhanMa.jsx';

const LOAI_DIEM = { earn: 'Tích điểm', redeem: 'Đổi điểm' };
const dau = (n) => (n > 0 ? `+${n}` : String(n));

export default function Diem() {
  const tai = dungTai(layDiem);
  return (
    <div>
      <h2>Điểm</h2>
      <TrangTai tai={tai}>
        {(dl) => (
          <>
            <div className="the">
              <div className="phu">Điểm của bạn</div>
              <div className="so-lon">{dl.points}</div>
            </div>
            <NhanMa khiXong={tai.taiLai} />
            <div className="nhom">Lịch sử điểm</div>
            <div className="the">
              {dl.history.length === 0 && <div className="phu">Chưa có điểm nào.</div>}
              {dl.history.map((h) => (
                <div className="dong" key={h.id}>
                  <div>
                    <div>{h.reason || LOAI_DIEM[h.type] || 'Giao dịch điểm'}</div>
                    <div className="phu">{dinhDangNgay(h.created_at)}</div>
                  </div>
                  <b>{dau(h.points)}</b>
                </div>
              ))}
            </div>
          </>
        )}
      </TrangTai>
    </div>
  );
}
