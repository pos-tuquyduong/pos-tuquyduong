/**
 * TOPPING-1 — MỘT chỗ cho luật topping (chủ quán 22.10 · 24.10 · 17.11 · 26.11; chat bàn 41 duyệt 27.11).
 * - Topping = một sản phẩm POS có `la_topping = 1` (kho làm sẵn, lô, hạn — kho/banHang.js lo như mọi món). Giá thêm vào ly = `price`;
 *   bán riêng theo `gia_ban_rieng` (NULL = không bán riêng).
 * - Món cài danh sách topping được thêm (`topping_cho_mon`, mảng id) + ghi chú nhanh (`ghi_chu_nhanh`, mảng chữ).
 * - Đơn gửi topping LỒNG trong dòng món: { ..., topping: [{ product_id | sx_product_type + sx_product_id, so_phan }] }. Máy chủ dựng mỗi topping thành
 *   MỘT dòng đơn riêng ngay sau dòng cha (`cha` = chỉ số dòng cha; ghi xuống `pos_order_items.dong_cha_id`), số lượng = phần × số ly, giá tra ở DB.
 *   Nhờ là dòng hàng thật, giảm hạng / mã / voucher / Flash / điểm / kho / huỷ đi qua đường sẵn có của orders.js.
 */
const TOPPING_TOI_DA_PHAN = 3;        // mỗi topping tối đa 3 phần / ly (DAC_TA_BAN_HANG_2410 mục 7)
const GHI_CHU_TOI_DA = 12;            // số nút ghi chú nhanh tối đa một món
const GHI_CHU_DAI_TOI_DA = 30;        // ký tự mỗi nút

/** Đọc cột JSON mảng an toàn: hỏng / trống → []. */
function docDs(v) {
  if (Array.isArray(v)) return v;
  try { const x = JSON.parse(v || '[]'); return Array.isArray(x) ? x : []; } catch { return []; }
}

const laTopping = (p) => Number(p?.la_topping) === 1;
const loi = (code, error) => ({ status: 400, body: { error, code } });

/** Cùng câu tra sản phẩm của vòng món (orders.js): có khoá SX thì theo khoá, không thì theo id; chỉ sản phẩm đang bán. */
async function traSanPham(queryOne, t) {
  return t.sx_product_type && t.sx_product_id !== undefined
    ? queryOne('SELECT * FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ? AND is_active = 1', [t.sx_product_type, t.sx_product_id])
    : queryOne('SELECT * FROM pos_products WHERE id = ? AND is_active = 1', [t.product_id]);
}

/**
 * Dòng topping của MỘT dòng món → { dong: [orderItem…] } hoặc { loi }.
 * `cha` = sản phẩm món (dòng DB), `ds` = item.topping thân gửi, `sl` = số ly đã kiểm, `viTri` = chỉ số dòng cha trong orderItems, `batDiem` = cờ điểm.
 */
async function dongTopping(queryOne, { cha, ds, sl, viTri, batDiem }) {
  if (ds === undefined || ds === null) return { dong: [] };
  const choPhep = laTopping(cha) ? [] : docDs(cha.topping_cho_mon).map(Number);
  if (!Array.isArray(ds) || ds.length > Math.max(1, choPhep.length)) return { loi: loi('YEU_CAU_KHONG_HOP_LE', `Topping của ${cha.name} không hợp lệ`) };
  const daCo = new Set();
  const dong = [];
  for (const t of ds) {
    if (!t || typeof t !== 'object') return { loi: loi('YEU_CAU_KHONG_HOP_LE', `Topping của ${cha.name} không hợp lệ`) };
    const p = await traSanPham(queryOne, t);
    if (!p) return { loi: { status: 400, body: { error: 'Sản phẩm không tồn tại hoặc đã ngừng bán' } } };   // cùng lời của vòng món
    if (!laTopping(p) || !choPhep.includes(Number(p.id))) return { loi: loi('TOPPING_KHONG_CHO_MON', `${p.name} không phải topping của ${cha.name}`) };
    const phan = t.so_phan;
    if (!Number.isInteger(phan) || phan < 1 || phan > TOPPING_TOI_DA_PHAN || daCo.has(p.id)) {
      return { loi: loi('TOPPING_SO_PHAN', `${p.name}: mỗi topping từ 1 tới ${TOPPING_TOI_DA_PHAN} phần một ly, mỗi topping một lần`) };
    }
    daCo.add(p.id);
    if (!(Number(p.price) > 0)) return { loi: { status: 400, body: { error: `Sản phẩm ${p.name} chưa có giá bán` } } };
    dong.push({
      product_id: p.id, product_code: p.code, product_name: p.name, unit: p.unit || 'phần',
      quantity: phan * sl, unit_price: p.price, total_price: p.price * phan * sl,
      sx_product_type: p.sx_product_type, sx_product_id: p.sx_product_id, from_package: false,
      is_special_group: !!p.is_special_group, note: null, tich_diem: batDiem(p) ? 1 : 0,
      cha: viTri, so_phan: phan,
    });
  }
  return { dong };
}

/** Topping đứng một mình (không dòng cha) = bán riêng: giá bán riêng, hoặc lỗi khi không bán riêng. Món thường → null (giá như cũ). */
function giaBanRieng(p) {
  if (!laTopping(p)) return null;
  const g = Number(p.gia_ban_rieng);
  return Number.isInteger(g) && g > 0 ? { gia: g } : { loi: loi('TOPPING_KHONG_BAN_RIENG', `${p.name} chỉ thêm vào ly, không bán riêng`) };
}

/** Ghi chú nhanh hợp lệ? → mảng đã gọn, hoặc null. */
function docGhiChuNhanh(v) {
  if (!Array.isArray(v) || v.length > GHI_CHU_TOI_DA) return null;
  const ra = v.map((x) => (typeof x === 'string' ? x.trim().replace(/\s+/g, ' ') : ''));
  return ra.every((x) => x && [...x].length <= GHI_CHU_DAI_TOI_DA) && new Set(ra).size === ra.length ? ra : null;
}

/**
 * Dòng đơn → dòng hiển thị: dòng cha mang `topping: [{ dong, so_phan }]`, dòng con bị gom. Nhận CẢ hai dạng — đơn vừa tạo (`cha` = chỉ số) và dòng
 * CSDL (`dong_cha_id` = id dòng cha); `so_phan` thiếu thì suy = số lượng dòng con ÷ số ly của cha.
 */
function gomTopping(items) {
  const ds = Array.isArray(items) ? items : [];
  const chaCua = (d) => (d.cha != null ? ds[d.cha] : d.dong_cha_id != null ? ds.find((x) => Number(x.id) === Number(d.dong_cha_id)) : null);
  const goc = ds.filter((d) => !chaCua(d));   // dòng con mất cha (dữ liệu hỏng) vẫn hiện như dòng thường — không giấu hàng đã bán
  const ra = goc.map((d) => ({ ...d, topping: [] }));
  for (const d of ds) {
    const c = chaCua(d);
    if (c && goc.includes(c)) ra[goc.indexOf(c)].topping.push({ dong: d, so_phan: d.so_phan ?? Math.round(Number(d.quantity) / Math.max(1, Number(c.quantity))) });
  }
  return ra;
}

module.exports = { TOPPING_TOI_DA_PHAN, GHI_CHU_DAI_TOI_DA, docDs, laTopping, dongTopping, giaBanRieng, docGhiChuNhanh, gomTopping };
