/**
 * Ảnh của màn Kho — MỘT chỗ thu nhỏ ở máy (máy chủ chỉ kiểm kiểu thật + cỡ, rồi lưu). Không hàm nào ở đây gửi tiền / kho.
 * ANH-MON-1: ảnh món cắt vuông giữa CO_ANH × CO_ANH, WebP (máy không ra WebP thì JPEG), CHAT_LUONG_ANH.
 * KHO-GON-2 B2: ảnh hoá đơn giữ khung, cạnh dài ≤ CANH_HOA_DON, JPEG CHAT_LUONG_HOA_DON (máy chủ chặn > 400 KB).
 */
import { api } from '../../utils/api';

export const CO_ANH = 400;               // ảnh món: cạnh sau thu nhỏ (px)
export const CHAT_LUONG_ANH = 0.7;       // ảnh món: chất lượng WebP / JPEG
export const CANH_HOA_DON = 1280;        // ảnh hoá đơn: cạnh dài tối đa (px)
export const CHAT_LUONG_HOA_DON = 0.6;   // ảnh hoá đơn: chất lượng JPEG
export const SO_ANH_HOA_DON = 3;         // cùng số máy chủ chặn (server/utils/anhMon.js SO_ANH_PHIEU_TOI_DA)
export const ANH_MON = { canh: CO_ANH, vuong: true, chatLuong: CHAT_LUONG_ANH, webp: true };
export const ANH_HOA_DON = { canh: CANH_HOA_DON, vuong: false, chatLuong: CHAT_LUONG_HOA_DON, webp: false };
export const kb = (byte) => `${Math.max(1, Math.round(byte / 1024))} KB`;
export const mb = (byte) => `${(byte / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

/** Tệp người chọn → Blob đã thu nhỏ (null nếu máy không vẽ được). vuong: cắt giữa thành vuông `canh`; không: giữ khung, cạnh dài ≤ `canh`. */
export async function thuNhoAnh(tep, { canh, vuong, chatLuong, webp }) {
  const bm = await createImageBitmap(tep);
  const cv = document.createElement('canvas');
  if (vuong) {
    const c = Math.min(bm.width, bm.height);
    cv.width = canh; cv.height = canh;
    cv.getContext('2d').drawImage(bm, (bm.width - c) / 2, (bm.height - c) / 2, c, c, 0, 0, canh, canh);
  } else {
    const ti = Math.min(1, canh / Math.max(bm.width, bm.height));
    cv.width = Math.round(bm.width * ti); cv.height = Math.round(bm.height * ti);
    cv.getContext('2d').drawImage(bm, 0, 0, cv.width, cv.height);
  }
  if (bm.close) bm.close();
  const lam = (kieu) => new Promise((xong) => cv.toBlob(xong, kieu, chatLuong));
  const web = webp ? await lam('image/webp') : null;
  return web && web.type === 'image/webp' ? web : lam('image/jpeg');
}

/** Gửi MỘT ảnh hoá đơn (đã thu nhỏ) vào phiếu nhận. Trả { anh: { id, kieu, co } }. */
export const guiAnhPhieu = (phieuId, khoi) => api.request(`/kho/phieu/${phieuId}/anh`, { method: 'POST', headers: { 'Content-Type': khoi.type }, body: khoi });
