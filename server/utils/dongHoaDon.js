/**
 * HD-KH-1 — dòng hoá đơn cho App KH: cùng hàm dựng tờ GIAO KHÁCH của quầy (client/src/utils/hoaDon.js dungHoaDon, nạp bằng import()
 * động — một nguồn, không chép) trên cùng dữ liệu (routes/hoaDon.js dungHoaDon) + cùng cài đặt chữ. Ở đây chỉ DẸT tờ thành danh sách dòng
 * { loai, trai, phai, dam, gach, ghi_chu } theo đúng thứ tự HoaDonTo vẽ, để App vẽ theo, không tự tính / tự xếp.
 * Bỏ có chủ ý: QR + ô mã nhận điểm (của quầy / khách lẻ, không phải của khách đang xem), dòng IN LẠI, tờ lưu.
 */
const path = require('path');
const { pathToFileURL } = require('url');
const { query } = require('../database');
const hoaDonQuay = require('../routes/hoaDon');

const FILE_HOA_DON = path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'hoaDon.js');
let nap = null;
const hamQuay = () => (nap ||= import(pathToFileURL(FILE_HOA_DON).href).catch((e) => { nap = null; throw e; }));

/** Cài đặt mà hàm quầy đọc: mọi khoá invoice_* (chữ, ẩn, khoá cũ) + tên / địa chỉ / SĐT quán. */
async function docCaiDat() {
  const s = {};
  for (const r of await query("SELECT key, value FROM pos_settings WHERE key LIKE 'invoice%' OR key IN ('store_name', 'store_address', 'store_phone')")) s[r.key] = r.value;
  return s;
}

const dong = (loai, trai = '', phai = '', them = {}) => ({ loai, trai, phai, dam: false, gach: '', ghi_chu: '', ...them });

/** Dẹt một tờ (kết quả dungHoaDon của quầy) thành danh sách dòng, đúng thứ tự vẽ của HoaDonTo. */
function detTo(to) {
  const { dau } = to;
  const ds = [];
  if (to.canh_bao) ds.push(dong('canh_bao', to.canh_bao, '', { dam: true }));
  ds.push(dong('ten_quan', dau.ten_quan, '', { dam: true }));
  if (dau.dia_chi) ds.push(dong('dia_chi', dau.dia_chi));
  ds.push(dong('so_bill', dau.chu_so_bill, dau.so_bill, { dam: true }));
  if (to.nhan) ds.push(dong('nhan', to.nhan, '', { dam: true }));
  ds.push(dong('gio', dau.gio, dau.nhan_vien ? `${dau.nhan_nv ? dau.nhan_nv + ': ' : ''}${dau.nhan_vien}` : ''));
  ds.push(dong('khach', dau.nhan_khach, dau.khach, { dam: true }));
  for (const m of to.mon) ds.push(dong('mon', `${m.sl} x ${m.ten}`, m.tien, { gach: m.tien_goc, ghi_chu: m.ghi_chu }));
  for (const d of to.tien) ds.push(dong(d.khoa, d.ten, d.tien, { dam: d.dam }));
  for (const d of [...to.thanh_toan, ...to.diem]) ds.push(d.khoa.startsWith('tieu_de') ? dong('tieu_de', d.ten) : dong(d.khoa, d.ten, d.tien, { dam: d.dam }));
  for (const c of to.chan) ds.push(dong('chan', c.chu));
  return ds;
}

/** Dòng hoá đơn tờ giao khách của MỘT đơn thật (dòng pos_orders của chính khách đang xem).
 *  anNhanVien (đơn App, chủ quán chốt 03.11): bỏ tên người tạo đơn khỏi dòng giờ — người tạo đơn App là "app_kh" hoặc nhân viên xác nhận tay. */
async function dongHoaDonKhach(o, { anNhanVien = false } = {}) {
  const [{ dungHoaDon: dungTo }, hd, caiDat] = await Promise.all([hamQuay(), hoaDonQuay.dungHoaDon(o), docCaiDat()]);
  if (anNhanVien) hd.don.nhan_vien = '';
  return detTo(dungTo(hd, caiDat, { lien: 'khach', inLai: false }));
}

module.exports = { dongHoaDonKhach };
