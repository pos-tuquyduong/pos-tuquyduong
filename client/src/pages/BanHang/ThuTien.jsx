/**
 * Thu tiền: tiền mặt (dãy tờ + bàn phím số có 000) · chuyển khoản (như màn cũ) · trừ tài khoản.
 * Bán hàng không có công nợ (DAC_TA_BAN_HANG_2410 mục 1.1). Đợt 2 (BH-2) thay chuyển khoản bằng QR payOS.
 */
import { useState } from 'react';
import { conThieu, danhSachTo, duDuoc, traLai } from './tinh';

const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const PHIM = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function ThuTien({ tong, khach, soDuDung, soDuMeDung, dungTK, dungMe, onDungTK, onDungMe, dangGui, onThu }) {
  const [cach, setCach] = useState('cash');
  const [dua, setDua] = useState(0);
  const [moPhim, setMoPhim] = useState(false);

  const phaiTra = tong - soDuDung - soDuMeDung;
  const duTaiKhoan = tong > 0 && phaiTra <= 0;
  const coMe = (khach?.parent_balance || 0) > 0;
  const bam = (p) => setDua((n) => (p === '⌫' ? Math.floor(n / 10) : Number(String(n === 0 ? '' : n) + p)));

  const guiDuTK = () => onThu({ cach: soDuMeDung > 0 ? 'cash' : 'balance', khachDua: 0 });

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
      <div className="bh-tien-dong bh-tong"><span>Phải trả</span><span>{vnd(Math.max(0, phaiTra))}</span></div>

      {duTaiKhoan ? (
        <button className="bh-nut bh-xanh bh-lon" disabled={dangGui} onClick={guiDuTK}>Trả đủ bằng tài khoản</button>
      ) : (
        <>
          <div className="bh-to">
            <button className={`bh-nut ${cach === 'cash' ? '' : 'bh-phu'}`} onClick={() => setCach('cash')}>Tiền mặt</button>
            <button className={`bh-nut ${cach === 'transfer' ? '' : 'bh-phu'}`} onClick={() => setCach('transfer')}>Chuyển khoản</button>
          </div>
          {cach === 'cash' ? (
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
              <button className="bh-nut bh-xanh bh-lon" disabled={dangGui || !duDuoc(phaiTra, dua)} onClick={() => onThu({ cach: 'cash', khachDua: dua })}>Đã nhận tiền</button>
            </>
          ) : (
            <button className="bh-nut bh-xanh bh-lon" disabled={dangGui || phaiTra <= 0} onClick={() => onThu({ cach: 'transfer', khachDua: 0 })}>Đã nhận chuyển khoản · {vnd(phaiTra)}</button>
          )}
        </>
      )}
    </div>
  );
}
