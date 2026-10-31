/**
 * Chỗ nhớ nhỏ của màn khách / máy quầy (localStorage). Mọi đọc / ghi bọc try-catch: cửa sổ ẩn danh hoặc bị chặn dữ liệu thì chỉ
 * mất việc "nhớ" (ghép lại một lần), không sập màn.
 */
const KHOA_MAN = 'tqd_man_khach_khoa';     // khoá riêng của màn khách (máy chủ cấp lúc ghép)
const KHOA_QUAY = 'tqd_man_khach_quay';    // quay_id của máy quầy

const doc = (k) => { try { return window.localStorage.getItem(k) || ''; } catch { return ''; } };
const ghi = (k, v) => { try { if (v) window.localStorage.setItem(k, v); else window.localStorage.removeItem(k); } catch { /* không nhớ được: chấp nhận */ } };

export const docKhoaMan = () => doc(KHOA_MAN);
export const ghiKhoaMan = (v) => ghi(KHOA_MAN, v);
export const docQuayId = () => doc(KHOA_QUAY);
export const ghiQuayId = (v) => ghi(KHOA_QUAY, v);
