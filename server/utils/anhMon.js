/**
 * ANH-MON-1 — ảnh nhỏ của món: hằng số, đường dẫn, đọc bản đồ ảnh cho menu. Bảng pos_anh_mon (bước 037) giữ MỘT ảnh / món.
 * Kiểu ảnh kiểm theo BYTE ĐẦU bằng hàm chung của kho nội dung (nd/tinh.js loaiAnh) — không chép lại.
 */
const { loaiAnh } = require('../nd/tinh');

const GIOI_HAN_ANH = 120 * 1024;                    // byte — quá → 413 ANH_QUA_LON (bộ đọc thân chặn, một chỗ)
const GIOI_HAN_ANH_PHIEU = 400 * 1024;              // KHO-GON-2 B3: ảnh hoá đơn phiếu nhận (đã thu nhỏ ở máy: cạnh dài 1280, JPEG 0,6)
const SO_ANH_PHIEU_TOI_DA = 3;                      // KHO-GON-2 B3: tối đa ảnh / phiếu nhận
const DO_DAI_PHIEN_BAN = 12;                        // ký tự đầu của băm SHA-256 nội dung ảnh
const CACHE_ANH = 'public, max-age=31536000, immutable';   // đường dẫn đã mang phiên bản → nhớ lâu an toàn

const duongAnh = (productId, phienBan) => `/api/pos/products/anh/${productId}/${phienBan}`;

/** Bản đồ product_id → đường dẫn ảnh. Chỉ đọc cột nhỏ (không kéo byte ảnh). Kho ảnh hỏng → bản đồ rỗng + log: menu KHÔNG được chết vì ảnh. */
async function docAnhMon(csdl) {
  try {
    const ds = await csdl.query('SELECT product_id, phien_ban FROM pos_anh_mon');
    return new Map(ds.map((r) => [Number(r.product_id), duongAnh(r.product_id, r.phien_ban)]));
  } catch (e) {
    console.error('docAnhMon (menu vẫn trả, không ảnh):', e.message);
    return new Map();
  }
}

module.exports = { GIOI_HAN_ANH, GIOI_HAN_ANH_PHIEU, SO_ANH_PHIEU_TOI_DA, DO_DAI_PHIEN_BAN, CACHE_ANH, duongAnh, docAnhMon, loaiAnh };
