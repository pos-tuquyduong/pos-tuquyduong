/**
 * Thu tiền (BH-2, QUAY-UI-1): ba nút chọn cách trả — Tiền mặt · Chuyển khoản · Trừ tài khoản. KHÔNG tự trừ tài khoản.
 * Chỉ khi bấm "Trừ tài khoản" mới hiện số dư có thể trừ (khách, mẹ), số sẽ trừ, phần còn lại (chọn tiền mặt / chuyển khoản) rồi bước PIN.
 * Tiền mặt = dãy tờ + bàn phím số có 000; chuyển khoản = QR payOS. Bán hàng không có công nợ; không trộn tiền mặt + chuyển khoản.
 * Màn chỉ chọn cách — máy chủ tính, giữ và chốt tiền (BanHangMoi → phiên). Nút thu CHỈ sáng khi có số máy chủ cho đúng giỏ này (`coSo`).
 */
import { useState } from 'react';
import { conThieu, danhSachTo, duDuoc, lyDoKhongTru, nutThuSang, traLai } from './tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const PHIM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function ThuTien({ coSo, tong, phaiTra, khach, soDuDung, soDuMeDung, cachTra, onCachTra, cachConLai, onCachConLai, laNap, dungMe, onDungMe, dangGui, onThu }) {
  const [dua, setDua] = useState(0);
  const [moPhim, setMoPhim] = useState(false);

  const lyDoMo = lyDoKhongTru({ khach, laNap });
  const trongTK = cachTra === 'tai_khoan' && !lyDoMo;          // đang ở chế độ trừ tài khoản
  const cach = trongTK ? cachConLai : (cachTra === 'chuyen_khoan' ? 'chuyen_khoan' : 'tien_mat');   // cách trả phần tiền thật
  const coMe = (khach?.parent_balance || 0) > 0;
  const bam = (p) => setDua((n) => (p === '⌫' ? Math.floor(n / 10) : Number(String(n === 0 ? '' : n) + p)));
  const sang = (c, d = 0) => nutThuSang({ coSo, dangGui, cach: c, phaiTra, dua: d });
  const chonCach = (c) => { setDua(0); setMoPhim(false); onCachTra(c); };

  return (
    <div className="bh-chan-gio">
      <div className="bh-to">
        <button className={`bh-nut ${cachTra === 'tien_mat' ? '' : 'bh-phu'}`} onClick={() => chonCach('tien_mat')}>Tiền mặt</button>
        <button className={`bh-nut ${cachTra === 'chuyen_khoan' ? '' : 'bh-phu'}`} onClick={() => chonCach('chuyen_khoan')}>Chuyển khoản</button>
        <button className={`bh-nut ${trongTK ? '' : 'bh-phu'}`} disabled={!!lyDoMo} onClick={() => chonCach('tai_khoan')}>Trừ tài khoản</button>
      </div>
      {lyDoMo && <div className="bh-ghi-chu-ngu" style={{ padding: '0 0.9rem' }}>Trừ tài khoản: {lyDoMo}</div>}

      {trongTK && (
        <>
          <div className="bh-tien-dong"><span>Tài khoản{khach?.name ? ` (${khach.name})` : ''} có thể trừ</span><span>{vnd(khach?.balance)}</span></div>
          {coMe && (
            <div className="bh-tien-dong">
              <span>Tài khoản mẹ{khach.parent_name ? ` (${khach.parent_name})` : ''} có thể trừ {vnd(khach.parent_balance)}</span>
              <span>{dungMe ? <button className="bh-nut-nho" onClick={() => onDungMe(false)}>Không dùng</button> : <button className="bh-nut-nho" onClick={() => onDungMe(true)}>Dùng</button>}</span>
            </div>
          )}
          <div className="bh-tien-dong"><span>Sẽ trừ tài khoản</span><span>−{vnd(soDuDung + soDuMeDung)}</span></div>
        </>
      )}
      <div className="bh-tien-dong bh-tong"><span>{trongTK ? 'Còn lại phải trả' : 'Phải trả'}</span><span>{coSo ? vnd(phaiTra) : 'Đang tính…'}</span></div>

      {phaiTra <= 0 ? (
        <button className="bh-nut bh-xanh bh-lon" disabled={!sang('tai_khoan')} onClick={() => onThu({ cach: 'tai_khoan' })}>
          {soDuDung + soDuMeDung > 0 ? 'Trả đủ bằng tài khoản' : 'Đơn 0đ — hoàn tất'}
        </button>
      ) : (
        <>
          {trongTK && (
            <div className="bh-to">
              <button className={`bh-nut ${cachConLai === 'tien_mat' ? '' : 'bh-phu'}`} onClick={() => { setDua(0); setMoPhim(false); onCachConLai('tien_mat'); }}>Còn lại: Tiền mặt</button>
              <button className={`bh-nut ${cachConLai === 'chuyen_khoan' ? '' : 'bh-phu'}`} onClick={() => { setDua(0); setMoPhim(false); onCachConLai('chuyen_khoan'); }}>Còn lại: Chuyển khoản</button>
            </div>
          )}
          {cach === 'tien_mat' ? (
            <>
              <div className="bh-to">
                {danhSachTo(phaiTra).map((t) => (
                  <button key={t.dua} className={`bh-nut bh-phu${dua === t.dua ? ' bh-chon' : ''}`} onClick={() => { setDua(t.dua); setMoPhim(false); }}>
                    {t.dungTien ? 'Đúng tiền' : vnd(t.dua)}
                    <small>{t.dungTien ? vnd(t.dua) : `trả lại ${vnd(t.traLai)}`}</small>
                  </button>
                ))}
                <button className="bh-nut bh-phu" onClick={() => { setDua(0); setMoPhim(true); }}>Số tiền khác…</button>
              </div>
              {moPhim && (
                <>
                  <div className="bh-so-lon">{vnd(dua)}</div>
                  <div className="bh-phim">{PHIM.map((p) => <button key={p} onClick={() => bam(p)}>{p}</button>)}</div>
                </>
              )}
              {dua > 0 && (
                <div className={`bh-bao ${duDuoc(phaiTra, dua) ? 'bh-du' : 'bh-thieu'}`}>
                  {duDuoc(phaiTra, dua) ? `Trả lại ${vnd(traLai(phaiTra, dua))}` : `Còn thiếu ${vnd(conThieu(phaiTra, dua))}`}
                </div>
              )}
              <button className="bh-nut bh-xanh bh-lon" disabled={dangGui || !duDuoc(phaiTra, dua) || !sang('tien_mat', dua)} onClick={() => onThu({ cach: 'tien_mat', khachDua: dua })}>Đã nhận tiền</button>
            </>
          ) : (
            <button className="bh-nut bh-xanh bh-lon" disabled={!sang('chuyen_khoan')} onClick={() => onThu({ cach: 'chuyen_khoan' })}>Hiện mã QR · {vnd(phaiTra)}</button>
          )}
        </>
      )}
    </div>
  );
}
