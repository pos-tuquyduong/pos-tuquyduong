// DoiSoat.jsx — tab "Đối soát" trong Báo cáo (DOI-SOAT-1). Chỉ BÁO: máy chủ chạy các bất biến sổ sách trên dữ liệu thật (chỉ đọc);
// màn này không tự tính tiền, không sửa số nào. Chỉ có hai thứ được ghi: tiền két đếm cuối ngày và đánh dấu đã so sao kê tuần
// (mỗi lần ghi là THÊM một dòng mới ở máy chủ, không ghi đè).
import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const KIEU = [['ngay', 'Ngày'], ['tuan', 'Tuần'], ['thang', 'Tháng']];
const NHOM = [
  ['do', '🔴 LỆCH — cần xử lý', '#dc2626'],
  ['can_xem', '🟡 CẦN XEM — so với trạng thái hiện tại nên có thể oan', '#d97706'],
  ['cu', '🟡 LỆCH CŨ (trước bản vá) — không làm kết quả đỏ', '#a16207'],
];
const KET = { chua_dem: '🟡 chưa đếm két', chua_co_moc: '🟡 chưa có số để lại của ngày trước để so', khop: '🟢 khớp', lech: '🔴 LỆCH' };
const dong = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const soNguyen = (v) => (/^\s*\d+\s*$/.test(String(v)) ? Number(String(v).trim()) : null);

export default function DoiSoat() {
  const { hasPermission } = useAuth();
  const duocGhi = hasPermission('view_reports');   // máy chủ kiểm quyền thật; đây chỉ ẩn nút
  const [kieu, setKieu] = useState('ngay');
  const [ngay, setNgay] = useState('');
  const [kq, setKq] = useState(null);
  const [dangChay, setDangChay] = useState(false);
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [ket, setKet] = useState({ so_tien: '', de_lai: '' });
  const [saoKe, setSaoKe] = useState({ da_so: false, ghi_chu: '' });

  const chay = async (k = kieu, n = ngay) => {
    setDangChay(true); setLoi(''); setThongBao('');
    try {
      const r = await api.get(`/reports/doi-soat?kieu=${k}${n ? '&ngay=' + n : ''}`);
      setKq(r);
      if (!n) setNgay(r.hom_nay);
      setKet({ so_tien: r.ket?.so_dem ?? '', de_lai: r.ket?.de_lai ?? '' });
      setSaoKe({ da_so: r.sao_ke?.da_so === 1, ghi_chu: r.sao_ke?.ghi_chu || '' });
    } catch (e) {
      setLoi(e.message || 'Không đối soát được');
    } finally {
      setDangChay(false);
    }
  };
  useEffect(() => { chay('ngay', ''); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const ghi = async (body, viec) => {
    setLoi(''); setThongBao('');
    try {
      await api.post('/reports/doi-soat/ghi', body);
      setThongBao(viec);
      await chay(kieu, ngay);
    } catch (e) {
      setLoi(e.message || 'Không ghi được');
    }
  };
  const luuKet = () => {
    const soTien = soNguyen(ket.so_tien), deLai = soNguyen(ket.de_lai);
    if (soTien === null || deLai === null) { setLoi('Nhập số nguyên đồng, không dấu chấm / phẩy'); return; }
    ghi({ loai: 'ket', ky: kq.tu, so_tien: soTien, de_lai: deLai }, 'Đã ghi số két — dòng mới, dòng cũ vẫn còn trong lịch sử');
  };
  const luuSaoKe = () => ghi({ loai: 'sao_ke', ky: kq.tu, da_so: saoKe.da_so ? 1 : 0, ghi_chu: saoKe.ghi_chu }, 'Đã ghi đánh dấu sao kê');

  const t = kq?.tien;
  const theoSo = (c, ten) => c && (
    <div className="card mb-1">
      <b>{ten} theo sổ: {dong(c.rong)}</b>
      <div style={{ fontSize: '0.85rem', color: '#555' }}>
        bán {dong(c.ban)} + thu nợ {dong(c.thu_no)} + nạp ví {dong(c.nap_vi)} − trả ra {dong(c.tra_ra)}
      </div>
    </div>
  );

  return (
    <>
      <div className="card mb-1">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {KIEU.map(([k, ten]) => (
            <button key={k} className={`btn ${kieu === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setKieu(k); chay(k, ngay); }}>{ten}</button>
          ))}
          <input type="date" className="input" style={{ width: 'auto' }} value={ngay} onChange={(e) => setNgay(e.target.value)} />
          <button className="btn btn-primary" disabled={dangChay} onClick={() => chay()}>{dangChay ? 'Đang đối soát…' : 'Đối soát'}</button>
        </div>
        {kq && <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Kỳ: {kq.tu === kq.den ? kq.tu : `${kq.tu} → ${kq.den}`} (giờ Việt Nam)</div>}
      </div>

      {loi && <div className="card mb-1" style={{ color: '#dc2626' }}>{loi}</div>}
      {thongBao && <div className="card mb-1" style={{ color: '#15803d' }}>{thongBao}</div>}

      {kq && (
        <>
          <div className="card mb-1" style={{ borderLeft: `6px solid ${kq.ket_qua === 'XANH' ? '#16a34a' : '#dc2626'}` }}>
            <b style={{ fontSize: '1.2rem', color: kq.ket_qua === 'XANH' ? '#16a34a' : '#dc2626' }}>
              {kq.ket_qua === 'XANH' ? '🟢 XANH — sổ sách khớp' : `🔴 ĐỎ — ${kq.so_luong.do} chỗ lệch`}
            </b>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>
              Chỉ báo, không tự sửa số. Cần xem {kq.so_luong.can_xem} · lệch cũ {kq.so_luong.cu}.
            </div>
          </div>

          {NHOM.map(([nhom, tieuDe, mau]) => kq[nhom].length > 0 && (
            <div className="card mb-1" key={nhom}>
              <b style={{ color: mau }}>{tieuDe} ({kq.so_luong[nhom]})</b>
              <div className="table-responsive">
                <table className="table table-sm">
                  <tbody>
                    {kq[nhom].map((l, i) => (
                      <tr key={i}>
                        <td>{l.bat_bien}{l.nhan ? ` · ${l.nhan}` : ''}</td>
                        <td>{l.mo_ta}</td>
                        <td>{l.pham_vi === 'toan_so' ? 'toàn sổ' : l.ngay || 'không rõ ngày'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {kq.so_luong[nhom] > kq[nhom].length && <div style={{ fontSize: '0.85rem' }}>… còn {kq.so_luong[nhom] - kq[nhom].length} dòng nữa</div>}
            </div>
          ))}

          {kieu === 'ngay' && kq.ket && (
            <div className="card mb-1">
              <b>Két ngày {kq.tu}: {KET[kq.ket.trang_thai]}</b>
              {theoSo(t?.tien_mat, 'Tiền mặt')}
              {kq.ket.so_theo_so !== null && (
                <div>Sổ két = để lại {kq.ket.moc.ky} ({dong(kq.ket.moc.de_lai)}) + tiền mặt vào/ra đến hết ngày = <b>{dong(kq.ket.so_theo_so)}</b>
                  {kq.ket.so_dem !== null && <> · đếm {dong(kq.ket.so_dem)} · chênh {dong(kq.ket.chenh)}</>}</div>
              )}
              {duocGhi && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <input className="input" style={{ width: '12rem' }} inputMode="numeric" placeholder="Tiền đếm cuối ngày" value={ket.so_tien} onChange={(e) => setKet({ ...ket, so_tien: e.target.value })} />
                  <input className="input" style={{ width: '12rem' }} inputMode="numeric" placeholder="Để lại cho mai" value={ket.de_lai} onChange={(e) => setKet({ ...ket, de_lai: e.target.value })} />
                  <button className="btn btn-primary" onClick={luuKet}>Lưu số két</button>
                </div>
              )}
              {kq.ket.nguoi && <div style={{ fontSize: '0.85rem' }}>Lần ghi cuối: {kq.ket.nguoi} lúc {kq.ket.luc?.replace('T', ' ')}</div>}
              {kq.ket.lich_su.length > 1 && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Lịch sử: {kq.ket.lich_su.map((h) => `${h.luc?.slice(11, 16)} ${h.nguoi}: ${dong(h.so_tien)} / để lại ${dong(h.de_lai)}`).join(' · ')}
                </div>
              )}
            </div>
          )}

          {kieu === 'tuan' && (
            <div className="card mb-1">
              {theoSo(t?.chuyen_khoan, 'Chuyển khoản')}
              <div style={{ fontSize: '0.85rem' }}>So với sao kê ngân hàng của tuần này (người so, khoảng 5 phút). {kq.sao_ke ? '' : '🟡 Chưa so sao kê.'}</div>
              {duocGhi && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
                  <label><input type="checkbox" checked={saoKe.da_so} onChange={(e) => setSaoKe({ ...saoKe, da_so: e.target.checked })} /> Đã so sao kê</label>
                  <input className="input" style={{ width: '16rem' }} placeholder="Ghi chú" maxLength={200} value={saoKe.ghi_chu} onChange={(e) => setSaoKe({ ...saoKe, ghi_chu: e.target.value })} />
                  <button className="btn btn-primary" onClick={luuSaoKe}>Lưu</button>
                </div>
              )}
              {kq.sao_ke && <div style={{ fontSize: '0.85rem' }}>Lần ghi cuối: {kq.sao_ke.nguoi} lúc {kq.sao_ke.luc?.replace('T', ' ')}</div>}
            </div>
          )}

          {kieu === 'thang' && t && (
            <div className="card mb-1">
              {theoSo(t.tien_mat, 'Tiền mặt')}
              {theoSo(t.chuyen_khoan, 'Chuyển khoản')}
              <div>Ví: nạp {dong(t.vi.nap)} · khách dùng mua hàng {dong(t.vi.chi)}</div>
              <div>Điểm: cộng {(t.diem.cong || 0).toLocaleString('vi-VN')} · trừ {(t.diem.tru || 0).toLocaleString('vi-VN')}</div>
              <div style={{ marginTop: '0.5rem' }}>📋 {kq.nhac_kho}</div>
            </div>
          )}

          <details className="card mb-1">
            <summary>Các phép đã chạy ({kq.bat_bien.length})</summary>
            <div style={{ fontSize: '0.85rem' }}>
              {kq.bat_bien.map((b) => (
                <div key={b.ten}>{b.ten} — {b.pham_vi === 'toan_so' ? 'toàn sổ' : 'theo kỳ'}
                  {b.trang_thai === 'rut_gon' && ' · bản rút gọn (không có số quầy tự đếm)'}
                  {b.trang_thai === 'bo' && ` · KHÔNG chạy: ${b.ly_do}`}</div>
              ))}
            </div>
          </details>
        </>
      )}
    </>
  );
}
