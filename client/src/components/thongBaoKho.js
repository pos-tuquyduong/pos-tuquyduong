/**
 * BAO-1a — kho thông báo nổi (thuần JS, không React): mọi màn gọi baoXong / baoLoi, ThongBao.jsx vẽ.
 * Xanh tự ẩn sau TG_TU_AN ms; đỏ KHÔNG tự ẩn, chỉ đóng bằng nút ×. Tối đa TOI_DA thông báo xếp chồng.
 */
export const TG_TU_AN = 4000;
export const TOI_DA = 3;

let ds = [];
let dem = 0;
const nghe = new Set();
const hen = new Map();

// Báo cho màn vẽ ở lượt microtask kế tiếp: có màn gọi baoLoi từ trong hàm cập nhật state (setCart(...)) — báo ngay sẽ cập nhật ThongBao giữa lúc đang vẽ màn khác.
let dangHen = false;
const phat = () => {
  if (dangHen) return;
  dangHen = true;
  queueMicrotask(() => { dangHen = false; for (const f of nghe) f(); });
};

export function dangKy(f) { nghe.add(f); return () => nghe.delete(f); }
export function laySnapshot() { return ds; }

export function bo(id) {
  clearTimeout(hen.get(id)); hen.delete(id);
  ds = ds.filter((t) => t.id !== id);
  phat();
}

function them(loai, tieuDe, lyDo) {
  // Cùng một câu đang hiện thì không chất thêm (bấm liên tục "hết hàng" không đẩy các thông báo khác ra); xanh thì tính lại giờ ẩn.
  const trung = ds.find((t) => t.loai === loai && t.tieuDe === tieuDe && t.lyDo === (lyDo || ''));
  if (trung) {
    if (loai === 'xong') { clearTimeout(hen.get(trung.id)); hen.set(trung.id, setTimeout(() => bo(trung.id), TG_TU_AN)); }
    return trung.id;
  }
  const id = ++dem;
  ds = [...ds, { id, loai, tieuDe, lyDo: lyDo || '' }];
  while (ds.length > TOI_DA) { const cu = ds[0]; clearTimeout(hen.get(cu.id)); hen.delete(cu.id); ds = ds.slice(1); }
  if (loai === 'xong') hen.set(id, setTimeout(() => bo(id), TG_TU_AN));
  phat();
  return id;
}

/** Báo xong: nói rõ đã làm gì, vd baoXong('Đã lưu khách Nguyễn Thị Hoa'). */
export const baoXong = (chu) => them('xong', chu);

/** Báo lỗi: tiêu đề = việc không làm được; lý do = câu máy chủ trả hoặc cách sửa. Không tự ẩn. */
export const baoLoi = (tieuDe, lyDo) => them('loi', tieuDe, lyDo);

const KY_THUAT = /^(HTTP \d+|Failed to fetch|NetworkError|TypeError|SyntaxError|Unexpected token|Load failed)|stack|at \w+ \(/i;

const CAU_CHUNG = 'Thử lại; vẫn lỗi thì báo chủ quán.';

/** Lý do cho người dùng: lấy câu máy chủ trả; trống hoặc chữ kỹ thuật → câu chung. */
export function lyDoLoi(err) {
  const s = String((err && (err.error || err.message)) || (typeof err === 'string' ? err : '') || '').trim();
  return !s || KY_THUAT.test(s) ? CAU_CHUNG : s;
}

/** Gọi ngắn khi bắt lỗi: baoLoiTu('lưu khách', err) → "Chưa lưu khách được" + lý do. */
export const baoLoiTu = (viec, err) => baoLoi(`Chưa ${viec} được`, lyDoLoi(err));
