/**
 * POS-DODNO-v1 — NGUOI DI DOI so no
 *
 * So no `pos_stock_pending` truoc day chi co ghi vao, khong ai doc ra.
 * File nay la ben doc: gui lai SX nhung viec con no, kem DUNG van tay da luu.
 *
 * An toan tuyet doi khi gui lai vi SX chong trung bang van tay: gui muoi lan
 * cung chi tru kho mot lan, lan sau tra ve `da_lam_roi`.
 */

const { query, run } = require('../database');
const { isSxConfigured, outStockFIFO, inStockReturn } = require('./sxApi');

const SO_LAN_TOI_DA = 5;      // thu qua nguong nay -> can nguoi xem
const MOI_LAN_TOI_DA = 20;    // moi lan doi toi da bao nhieu dong
const GIAN_CACH_MS = 3 * 60 * 1000;  // 3 phut

let dangChay = false;   // chong hai nguoi bam cung luc
let lanCuoi = 0;        // moc thoi gian lan doi truoc

/** Dem viec dang ket — dung cho dai bao tren thanh dieu huong. */
async function demViecKet() {
  const r = await query(
    `SELECT status, COUNT(*) AS n FROM pos_stock_pending
      WHERE status IN ('pending', 'can_xem') GROUP BY status`,
  );
  const lay = (s) => {
    const d = r.find((x) => x.status === s);
    return d ? Number(d.n) : 0;
  };
  return { cho: lay('pending'), canXem: lay('can_xem'), dangChay };
}

/**
 * Doi mot luot. Tra ve so lieu de hien cho nguoi dung.
 * KHONG BAO GIO nem loi ra ngoai — noi goi khong duoc hong vi viec nay.
 */
async function doSoNo() {
  if (dangChay) return { boQua: 'dang chay' };
  if (!isSxConfigured()) return { boQua: 'chua cau hinh SX' };

  dangChay = true;
  const kq = { daDoc: 0, xong: 0, hong: 0, canXem: 0 };
  try {
    const ds = await query(
      `SELECT * FROM pos_stock_pending
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT ${MOI_LAN_TOI_DA}`,
    );
    kq.daDoc = ds.length;

    for (const d of ds) {
      // Khong co van tay thi TUYET DOI khong gui lai: SX se khong nhan ra
      // la viec cu va tru kho LAN NUA. Chuyen thang sang cho nguoi xem.
      if (!d.van_tay) {
        await run(
          `UPDATE pos_stock_pending
              SET status = 'can_xem',
                  error_message = 'Khong co van tay — khong the gui lai an toan, can xu ly tay'
            WHERE id = ?`,
          [d.id],
        );
        kq.canXem++;
        continue;
      }

      try {
        const ham = d.direction === 'in' ? inStockReturn : outStockFIFO;
        await ham(
          d.sx_product_type,
          d.sx_product_id,
          d.quantity,
          d.order_code,
          d.van_tay,
        );
        // SX tra ve `da_lam_roi` cung di vao day — voi POS thi ca hai deu la XONG.
        await run(
          `UPDATE pos_stock_pending
              SET status = 'resolved', resolved_at = datetime('now')
            WHERE id = ?`,
          [d.id],
        );
        kq.xong++;
      } catch (err) {
        const soLan = Number(d.retry_count || 0) + 1;
        const het = soLan >= SO_LAN_TOI_DA;
        await run(
          `UPDATE pos_stock_pending
              SET retry_count = ?, status = ?, error_message = ?
            WHERE id = ?`,
          [soLan, het ? 'can_xem' : 'pending', String(err.message).slice(0, 300), d.id],
        );
        if (het) kq.canXem++;
        else kq.hong++;
      }
    }
  } catch (err) {
    console.error('Doi so no gap loi:', err.message);
    kq.loi = err.message;
  } finally {
    dangChay = false;
    lanCuoi = Date.now();
  }
  if (kq.daDoc) console.log('So no:', JSON.stringify(kq));
  return kq;
}

/**
 * LOP 1 — an theo hoat dong.
 * Goi sau moi yeu cau cua nguoi dung. KHONG await o noi goi: nguoi dung
 * khong phai cho viec nay. Gian cach 3 phut de khong doi lien tuc.
 */
function doNeuDenLuc() {
  if (dangChay) return;
  if (Date.now() - lanCuoi < GIAN_CACH_MS) return;
  lanCuoi = Date.now();   // dat truoc de hai yeu cau sat nhau khong cung kich hoat
  demViecKet()
    .then((d) => { if (d.cho > 0) return doSoNo(); })
    .catch((e) => console.error('doNeuDenLuc:', e.message));
}

module.exports = { demViecKet, doSoNo, doNeuDenLuc };
