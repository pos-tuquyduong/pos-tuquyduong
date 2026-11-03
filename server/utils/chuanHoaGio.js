/**
 * GIO-VN-1 — đổi giờ CŨ sang giờ Việt Nam dạng `YYYY-MM-DDTHH:mm:ss` (chủ quán 28.10). MỘT quy tắc, hai chỗ gọi: bước nâng cấp
 * server/nang_cap/012_gio_viet_nam.js (dữ liệu đang có) và utils/khoiPhuc.js (nạp bản sao lưu CŨ, ghi trước GIO-VN-1).
 * Chỉ đổi giá trị nhận biết CHẮC CHẮN (rà toàn bộ lịch sử git các nơi ghi — viec/GIO-VN-1/ke_hoach.md mục B), không đoán:
 *   1. đuôi Z (`toISOString()`, đủ 20 hoặc 24 ký tự) — chắc chắn UTC ở MỌI cột → +7 giờ;
 *   2. dấu cách ở cột mà mọi nơi ghi chỉ từng ghi UTC (CURRENT_TIMESTAMP / datetime('now')) → +7 giờ (chủ quán 02.11: sổ ví cũng đổi giờ);
 *   3. dấu cách ở cột mà mọi nơi ghi chỉ từng ghi giờ VN ('+7 hours', nowVn, hạn thẻ) → chỉ đổi dấu cách thành T;
 *   4. cột LẪN UTC / VN không biết chắc (pos_settings.updated_at — chủ quán 03.11, thay quyết định 02.11 "để nguyên"): mọi giá trị chưa đúng
 *      dạng T (dấu cách, mili-giây, chữ lạ, rỗng — trừ NULL) → giờ VN lúc chạy (getNow); đuôi Z đã qua luật 1 trước.
 * Mẫu GLOB đủ độ dài — ngày thuần, giá trị lạ, dạng T không đuôi không khớp luật 1–3 → không đụng; chạy lần hai không đổi gì (luật 4 chỉ
 * chọn dòng CHƯA dạng T, sau lần một mọi dòng đã dạng T).
 * saoLuu: bảng có dòng sẽ đổi → chép sang _sao_luu_012_<bảng> TRƯỚC khi UPDATE (khuôn 004). Khôi phục sao lưu gọi saoLuu: false.
 */
const { getNow } = require('./helpers');

const SO = '[0-9]';
const NGAY = `${SO}${SO}${SO}${SO}-${SO}${SO}-${SO}${SO}`;
const GIO = `${SO}${SO}:${SO}${SO}:${SO}${SO}`;
const MAU_CACH = `'${NGAY} ${GIO}'`;
const MAU_T = `'${NGAY}T${GIO}'`;
const MAU_Z = [`'${NGAY}T${GIO}Z'`, `'${NGAY}T${GIO}.${SO}${SO}${SO}Z'`];
const CONG7 = (c) => `strftime('%Y-%m-%dT%H:%M:%S', ${c}, '+7 hours')`;
const ten = (x) => `"${String(x).replace(/"/g, '""')}"`;   // tên bảng / cột trong ngoặc kép — chạy trên MỌI bảng của kho thật (tên lạ, từ khoá)

const UTC = 'UTC dấu cách', VN = 'VN dấu cách', LAN = 'chưa dạng T → giờ chạy nâng cấp';
const COT_CACH = {
  pos_users: { created_at: UTC },
  pos_permissions: { created_at: UTC },
  pos_customers: { created_at: UTC, updated_at: UTC },
  pos_products: { created_at: UTC, updated_at: UTC, ton_luc: VN },
  pos_orders: { created_at: UTC },
  pos_wallets: { created_at: UTC, updated_at: UTC },
  pos_balance_transactions: { created_at: UTC },
  pos_damage_logs: { created_at: UTC },
  pos_stock_pending: { resolved_at: UTC },
  pos_export_logs: { created_at: UTC },
  pos_membership_tiers: { created_at: UTC, updated_at: VN },
  pos_product_groups: { created_at: UTC },
  pos_product_group_members: { created_at: UTC },
  pos_invoice_logs: { printed_at: VN, deleted_at: VN },
  pos_membership_purchases: { expires_at: VN },
  pos_discount_codes: { valid_to: VN },
  pos_settings: { updated_at: LAN },
};

async function chuanHoaGio(tx, { saoLuu = true } = {}) {
  const ketQua = [];
  const bayGio = getNow();   // luật 4: một giờ cho cả lượt chạy
  const bangs = (await tx.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    AND name NOT LIKE '\\_sao\\_luu\\_%' ESCAPE '\\' AND name <> 'pos_nang_cap' ORDER BY name`)).map((r) => r.name);
  for (const bang of bangs) {
    const cot = (await tx.query(`PRAGMA table_info(${ten(bang)})`)).filter((c) => /TEXT|DATE|TIME|^$/i.test(c.type || '')).map((c) => c.name);
    if (!cot.length) continue;
    const viec = [];   // [cột, loại, điều kiện, giá trị mới]
    for (const cTen of cot) {
      const c = ten(cTen);
      viec.push([c, 'đuôi Z', MAU_Z.map((m) => `${c} GLOB ${m}`).join(' OR '), CONG7(c), cTen]);
      const loai = COT_CACH[bang]?.[cTen];
      if (loai === LAN) viec.push([c, loai, `${c} IS NOT NULL AND NOT ${c} GLOB ${MAU_T}`, `'${bayGio}'`, cTen]);
      else if (loai) viec.push([c, loai, `${c} GLOB ${MAU_CACH}`, loai === UTC ? CONG7(c) : `substr(${c}, 1, 10) || 'T' || substr(${c}, 12)`, cTen]);
    }
    const dem = await tx.queryOne(`SELECT ${viec.map((v, i) => `SUM(CASE WHEN ${v[2]} THEN 1 ELSE 0 END) AS n${i}`).join(', ')} FROM ${ten(bang)}`);
    let daLuu = false;
    for (const [i, [c, loai, dk, moi, cTen]] of viec.entries()) {
      const n = Number(dem[`n${i}`] || 0);
      if (!n) continue;
      if (saoLuu && !daLuu) { await tx.run(`CREATE TABLE IF NOT EXISTS ${ten('_sao_luu_012_' + bang)} AS SELECT * FROM ${ten(bang)}`); daLuu = true; }
      const r = await tx.run(`UPDATE ${ten(bang)} SET ${c} = ${moi} WHERE ${dk}`);
      ketQua.push({ bang, cot: cTen, loai, doi: Number(r.changes ?? r.rowsAffected ?? n) });
    }
  }
  for (const k of ketQua) {
    console.log(`🔧 Nâng cấp 012: ${k.bang}.${k.cot} đổi ${k.doi} dòng (${k.loai})`);
  }
  return ketQua;
}

module.exports = { chuanHoaGio };
