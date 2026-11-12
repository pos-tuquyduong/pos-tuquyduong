// DIEM-MON-1 — Cài đặt → Điểm thưởng: công tắc "Tích điểm" cho từng món, gói trả trước, hạng thẻ bán được.
// Chọn nhiều (ô chọn + "Chọn tất cả / Bỏ chọn") rồi "Bật / Tắt tích điểm", hoặc bấm công tắc từng dòng. Lưu cần quyền manage_promotions
// (máy chủ chặn; không quyền thì chỉ xem). Máy chủ chỉ cộng điểm phần tiền của dòng đang bật; đổi công tắc không đổi đơn đã bán.
// BAO-1b: bật / tắt báo qua thông báo chung; lỗi hiện thêm dưới nhóm vừa bấm. Công tắc đổi là máy chủ ghi ngay (không có ô chờ Lưu).
import { useEffect, useState } from 'react';
import { tichDiemApi } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { baoXong, baoLoiTu, lyDoLoi } from '../../components/thongBaoKho.js';
import LoiO from '../../components/LoiO';

const NHOM = [['mon', 'Món'], ['goi', 'Gói trả trước'], ['hang', 'Thẻ hạng']];
const NUT = { padding: '0.3rem 0.6rem', fontSize: 13 };

export default function TichDiem() {
  const { hasPermission } = useAuth();
  const duocSua = hasPermission('manage_promotions');
  const [ds, setDs] = useState({ mon: [], goi: [], hang: [] });
  const [chon, setChon] = useState({ mon: [], goi: [], hang: [] });
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState({});   // nhóm (mon / goi / hang / tai) → câu lỗi hiện dưới nhóm đó

  const tai = async () => {
    try {
      const r = await tichDiemApi.danhSach();
      setDs({ mon: r.mon || [], goi: r.goi || [], hang: r.hang || [] });
      setLoi((l) => ({ ...l, tai: '' }));
    } catch (e) { setLoi((l) => ({ ...l, tai: lyDoLoi(e) })); baoLoiTu('tải danh sách tích điểm', e); }
  };
  useEffect(() => { tai(); }, []);

  const doi = async (loai, ids, bat) => {
    if (!ids.length) return;
    setDangLuu(true); setLoi((l) => ({ ...l, [loai]: '' }));
    try {
      await tichDiemApi.dat(loai, ids, bat);
      baoXong(`Đã ${bat ? 'bật' : 'tắt'} tích điểm cho ${ids.length} mục (${NHOM.find(([x]) => x === loai)[1]})`);
      setChon((c) => ({ ...c, [loai]: [] }));
      await tai();
    } catch (e) { setLoi((l) => ({ ...l, [loai]: lyDoLoi(e) })); baoLoiTu(`${bat ? 'bật' : 'tắt'} tích điểm`, e); }
    setDangLuu(false);
  };
  const daChon = (loai, id) => chon[loai].includes(id);
  const lat = (loai, id) => setChon((c) => ({ ...c, [loai]: daChon(loai, id) ? c[loai].filter((x) => x !== id) : [...c[loai], id] }));

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
      <div className="card-title" style={{ marginBottom: '0.5rem' }}>✅ Tích điểm theo món / gói / thẻ</div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 0.75rem' }}>
        Mục đang tắt thì phần tiền của nó không được cộng điểm (đơn có cả mục bật lẫn tắt chỉ cộng phần bật). Gói nạp và phí giao không tích điểm.
        Đổi công tắc chỉ áp cho đơn bán SAU đó.{duocSua ? '' : ' Bạn chỉ xem được — cần quyền "Quản lý khuyến mãi" để đổi.'}
      </p>
      <LoiO loi={loi.tai && `Chưa tải được danh sách tích điểm: ${loi.tai}`} />
      {NHOM.map(([loai, ten]) => (
        <div key={loai} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <b style={{ marginRight: 'auto' }}>{ten} ({ds[loai].length})</b>
            {duocSua && ds[loai].length > 0 && (
              <>
                <button className="btn btn-outline" style={NUT} disabled={dangLuu} onClick={() => setChon((c) => ({ ...c, [loai]: ds[loai].map((x) => x.id) }))}>Chọn tất cả</button>
                <button className="btn btn-outline" style={NUT} disabled={dangLuu || !chon[loai].length} onClick={() => setChon((c) => ({ ...c, [loai]: [] }))}>Bỏ chọn</button>
                <button className="btn btn-primary" style={NUT} disabled={dangLuu || !chon[loai].length} onClick={() => doi(loai, chon[loai], true)}>Bật tích điểm</button>
                <button className="btn btn-outline" style={NUT} disabled={dangLuu || !chon[loai].length} onClick={() => doi(loai, chon[loai], false)}>Tắt tích điểm</button>
              </>
            )}
          </div>
          <LoiO loi={loi[loai]} />
          {ds[loai].length === 0 && <div style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có mục nào.</div>}
          {ds[loai].map((x) => (
            <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0', borderTop: '1px solid #f3f4f6' }}>
              {duocSua && <input type="checkbox" aria-label={`Chọn ${x.ten}`} checked={daChon(loai, x.id)} onChange={() => lat(loai, x.id)} />}
              <span style={{ flex: 1, opacity: x.tich_diem ? 1 : 0.6 }}>{x.ten}</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: duocSua ? 'pointer' : 'default', fontSize: 13 }}>
                <input type="checkbox" disabled={!duocSua || dangLuu} checked={!!x.tich_diem} onChange={(e) => doi(loai, [x.id], e.target.checked)} />
                {x.tich_diem ? 'Tích điểm' : 'Không tích điểm'}
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
