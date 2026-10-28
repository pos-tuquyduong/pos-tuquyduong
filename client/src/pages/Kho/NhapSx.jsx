/**
 * KHO-1 — Nhập danh mục từ bản sao lưu SX (chỉ chủ quán): chọn file .db → XEM TRƯỚC → Nhập. Nhập lại không nhân đôi, không ghi đè.
 */
import { useState } from 'react';
import { api } from '../../utils/api';

export default function NhapSx() {
  const [file, setFile] = useState(null);
  const [kh, setKh] = useState(null);
  const [daGhi, setDaGhi] = useState(false);
  const [loi, setLoi] = useState('');
  const [dang, setDang] = useState(false);

  const gui = async (ghi) => {
    setLoi('');
    setDang(true);
    const f = new FormData();
    f.append('file', file);
    f.append('ghi', ghi ? '1' : '0');
    try {
      const kq = await api.upload('/kho/nhap-sx', f);
      setKh(kq.ke_hoach);
      setDaGhi(kq.da_ghi);
    } catch (e) { setLoi(e.message); } finally { setDang(false); }
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h3 className="card-title">Nhập danh mục từ bản sao lưu SX</h3>
      <p className="kho-nho">Lấy nguyên liệu, nhóm sản phẩm, món, công thức. KHÔNG lấy tồn, lô, khách. Nhập lại chỉ thêm cái còn thiếu.</p>
      <div className="kho-hang">
        <input type="file" accept=".db,.sqlite" onChange={(e) => { setFile(e.target.files[0] || null); setKh(null); setDaGhi(false); }} />
        <button className="btn btn-outline" disabled={!file || dang} onClick={() => gui(false)}>Xem trước</button>
      </div>
      {loi && <div className="kho-loi">{loi}</div>}
      {kh && (
        <div>
          {daGhi && <div className="kho-ok">✓ Đã nhập xong.</div>}
          <ul>
            <li>{kh.nguyen_lieu_them} nguyên liệu {daGhi ? 'đã' : 'sẽ'} thêm · {kh.nhom_nguyen_lieu_them} nhóm nguyên liệu</li>
            <li>{kh.nhom_san_pham_them} nhóm sản phẩm · {kh.mon_tao_an} món tạo ẩn · {kh.cong_thuc_ghi} công thức</li>
          </ul>
          {kh.gop.length > 0 && (
            <>
              <b>Tên gộp</b>
              <ul>{kh.gop.map((g) => <li key={g.giu}>{g.giu} ← {g.cu.map((c) => `"${c}"`).join(', ')}</li>)}</ul>
            </>
          )}
          {kh.canh_bao.length > 0 && (
            <>
              <b>Cảnh báo ({kh.canh_bao.length})</b>
              <ul>{kh.canh_bao.map((c, i) => <li key={i} className="kho-thieu">{c.loi}</li>)}</ul>
            </>
          )}
          {!daGhi && <button className="btn btn-primary" disabled={dang} onClick={() => gui(true)}>Nhập</button>}
        </div>
      )}
    </div>
  );
}
