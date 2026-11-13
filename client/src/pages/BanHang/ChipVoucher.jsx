// VOUCHER-2 (chủ quán Q14 12.11; bản mẫu ban_mau_pos — thu/thu_voucher.js): hàng chip voucher của khách, đặt NGAY DƯỚI ô mã khuyến mãi.
// "🎟 <mo_ta>" — câu máy chủ dựng, hiện nguyên. Bấm chọn / bấm lại bỏ; đủ N (Cài đặt voucher_toi_da) thì chip chưa chọn mờ; máy chủ báo một
// voucher không dùng được → viền đỏ + lý do. Chỉ vẽ — chọn / bỏ / lý do do màn Bán hàng giữ (đi vào khoá tinh-thu).
export default function ChipVoucher({ vi, chon, loi, toiDa, onLat }) {
  if (!vi.length) return null;
  return (
    <div className="bh-chip-hang" style={{ padding: '0.3rem 0.9rem' }}>
      {vi.map((v) => {
        const dangChon = chon.includes(v.code), loiV = loi[v.code];
        return (
          <button key={v.code} className={`bh-chip bh-chip-voucher${dangChon ? ' bh-chon' : ''}`} disabled={!dangChon && chon.length >= toiDa}
            onClick={() => onLat(v.code)} style={loiV ? { border: '2px solid var(--bh-do)' } : undefined}>
            🎟 {v.mo_ta}{loiV && <small style={{ display: 'block', color: 'var(--bh-do)' }}>{loiV}</small>}
          </button>
        );
      })}
      <span className="bh-ghi-chu-ngu">{chon.length}/{toiDa} voucher</span>
    </div>
  );
}
