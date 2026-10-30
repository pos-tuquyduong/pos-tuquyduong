/**
 * Thu tiền (BH-2): trừ tài khoản khách / mẹ (nút Bỏ) · tiền mặt (dãy tờ + bàn phím số có 000) · chuyển khoản = QR payOS.
 * Bán hàng không có công nợ; không trộn tiền mặt + chuyển khoản. Màn chỉ chọn cách — máy chủ tính, giữ và chốt tiền (BanHangMoi → phiên).
 * Nút thu CHỈ sáng khi có số máy chủ cho đúng giỏ này (`coSo`).
 */
import { useState } from 'react';
import { cachTraKhaDung, conThieu, danhSachTo, duDuoc, nutThuSang, traLai } from './tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const PHIM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function ThuTien({ coSo, tong, phaiTra, khach, soDuDung, soDuMeDung, dungTK, dungMe, onDungTK, onDungMe, dangGui, onThu }) {
  const [cach, setCach] = useState('tien_mat');
  const [dua, setDua] = useState(0);
  const [moPhim, setMoPhim] = useState(false);

  const coMe = (khach?.parent_balance || 0) > 0;
  const dsCach = cachTraKhaDung({ phaiTra });
  const bam = (p) => setDua((n) => (p === '⌫' ? Math.floor(n / 10) : Number(String(n === 0 ? '' : n) + p)));
  const sang = (c, d = 0) => nutThuSang({ coSo, dangGui, cach: c, phaiTra, dua: d });

  return (
    <div className="bh-chan-gio">
      {(khach?.balance || 0) > 0 && (
        <div className="bh-tien-dong">
          <span>Trừ tiền tài khoản</span>
          <span>{dungTK ? <>−{vnd(soDuDung)} <button className="bh-nut-nho" onClick={() => onDungTK(false)}>Bỏ</button></> : <button className="bh-nut-nho" onClick={() => onDungTK(true)}>Dùng {vnd(Math.min(khach.balance, tong))}</button>}</span>
        </div>
      )}
      {coMe && (
        <div className="bh-tien-dong">
          <span>Tài khoản mẹ{khach.parent_name ? ` (${khach.parent_name})` : ''}</span>
          <span>{dungMe ? <>−{vnd(soDuMeDung)} <button className="bh-nut-nho" onClick={() => onDungMe(false)}>Bỏ</button></> : <button className="bh-nut-nho" onClick={() => onDungMe(true)}>Dùng</button>}</span>
        </div>
      )}
      <div className="bh-tien-dong bh-tong"><span>Phải trả</span><span>{coSo ? vnd(phaiTra) : 'Đang tính…'}</span></div>

      {dsCach[0] === 'tai_khoan' ? (
        <button className="bh-nut bh-xanh bh-lon" disabled={!sang('tai_khoan')} onClick={() => onThu({ cach: 'tai_khoan' })}>
          {soDuDung + soDuMeDung > 0 ? 'Trả đủ bằng tài khoản' : 'Đơn 0đ — hoàn tất'}
        </button>
      ) : (
        <>
          <div className="bh-to">
            <button className={`bh-nut ${cach === 'tien_mat' ? '' : 'bh-phu'}`} onClick={() => setCach('tien_mat')}>Tiền mặt</button>
            <button className={`bh-nut ${cach === 'chuyen_khoan' ? '' : 'bh-phu'}`} onClick={() => setCach('chuyen_khoan')}>Chuyển khoản</button>
          </div>
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
