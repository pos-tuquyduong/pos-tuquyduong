/**
 * POS-DOICHIEU-v1 — doi chieu so van tay cua SX voi so don cua POS
 *
 *   GET /api/pos/doi-chieu?tu=YYYY-MM-DD&den=YYYY-MM-DD
 *
 * Chieu doi chieu: SX -> POS. Voi moi lenh tru kho / hoan kho ma SX da xu ly,
 * kiem xem o POS co don tuong ung khong. Van tay co dang `POS:<id don>:<out|in>:<stt>`
 * nen suy ra ma don rat chac — KHONG phai doan.
 *
 * GIOI HAN (doc ky): KHONG phat hien duoc ca POS tao don xong roi chet TRUOC
 * khi gui lenh. Ca do khong de lai dau vet o ca hai ben. Xem ghi chu dau patch.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query, queryOne } = require('../database');
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

router.get('/', authenticate, async (req, res) => {
  try {
    if (!isSxConfigured()) {
      return res.status(400).json({
        error: 'Chua cau hinh ket noi tu POS sang SX — khong doi chieu duoc.',
        code: 'CHUA_CAU_HINH_SX',
      });
    }

    const homNay = new Date()
      .toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const tu = req.query.tu || homNay;
    const den = req.query.den || tu;

    // ── Ben SX: so van tay ──────────────────────────────────────────────
    let sx;
    try {
      sx = await callSxApi(`/api/pos/van-tay?tu=${encodeURIComponent(tu)}&den=${encodeURIComponent(den)}`);
    } catch (err) {
      return res.status(502).json({
        error: `Khong goi duoc sang SX: ${err.message}`,
        code: 'SX_KHONG_TRA_LOI',
      });
    }
    const dsSx = Array.isArray(sx?.danh_sach) ? sx.danh_sach : [];

    // ── Ben POS: don trong khoang (chi de bao cao tong) ─────────────────
    const donPos = await query(
      `SELECT id, code, status, total, cancelled_at FROM pos_orders
        WHERE DATE(created_at) BETWEEN ? AND ?`,
      [tu, den],
    );

    // Tra don theo ID lay tu van tay, KHONG gioi han ngay.
    // Ly do: bo di doi (POS-DODNO-v1) gui lai viec cu — don tao HOM QUA nhung
    // SX ghi van tay HOM NAY. Neu chi tra don trong khoang thi bao "kho bi tru
    // oan" OAN cho moi lan doi so thanh cong. Chinh bo di doi tao ra ca nay.
    const idTuVanTay = [
      ...new Set(
        dsSx
          .map((d) => String(d.van_tay || '').split(':')[1])
          .filter((x) => /^[0-9]+$/.test(x || '')),
      ),
    ];
    const theoId = new Map();
    // Chia lo 100 de cau lenh khong dai vo han khi doi chieu ca thang.
    for (let i = 0; i < idTuVanTay.length; i += 100) {
      const lo = idTuVanTay.slice(i, i + 100);
      const rows = await query(
        `SELECT id, code, status, total, cancelled_at FROM pos_orders
          WHERE id IN (${lo.map(() => '?').join(',')})`,
        lo,
      );
      for (const d of rows) theoId.set(String(d.id), d);
    }

    // ── Doi chieu tung dong cua SX ──────────────────────────────────────
    const khoTruOan = [];   // SX da tru nhung POS khong co don / don da huy
    const khongDocDuoc = []; // van tay khong theo dang POS:<id>:...
    let khop = 0;

    for (const d of dsSx) {
      const vt = String(d.van_tay || '');
      const phan = vt.split(':');
      // Dang chuan: POS:<id>:<out|in>:<stt>
      if (phan.length < 3 || phan[0] !== 'POS') {
        khongDocDuoc.push({ van_tay: vt, order_code: d.order_code, ghi_chu: 'khong theo dang POS:<id>:...' });
        continue;
      }
      const idDon = phan[1];
      const chieu = phan[2];
      const don = theoId.get(idDon);

      if (!don) {
        khoTruOan.push({
          van_tay: vt, chieu, order_code: d.order_code,
          san_pham: `${d.product_type}/${d.product_id}`, so_luong: d.quantity,
          luc: d.created_at,
          ly_do: 'POS KHONG co don nao mang ma nay',
        });
        continue;
      }
      // Don da huy ma SX chi tru kho (chieu out) va KHONG co lenh hoan (chieu in)
      if (don.status === 'cancelled' && chieu === 'out') {
        const coHoan = dsSx.some(
          (x) => String(x.van_tay || '').startsWith(`POS:${idDon}:in:`),
        );
        if (!coHoan) {
          khoTruOan.push({
            van_tay: vt, chieu, order_code: don.code,
            san_pham: `${d.product_type}/${d.product_id}`, so_luong: d.quantity,
            luc: d.created_at,
            ly_do: 'Don DA HUY nhung kho chua duoc hoan lai',
          });
          continue;
        }
      }
      khop++;
    }

    // ── So no con dang ket (de nhin cung mot cho) ───────────────────────
    const soNo = await query(
      `SELECT status, COUNT(*) AS n FROM pos_stock_pending
        WHERE status IN ('pending','can_xem') GROUP BY status`,
    );
    const demNo = { cho: 0, can_xem: 0 };
    for (const r of soNo) {
      if (r.status === 'pending') demNo.cho = Number(r.n);
      if (r.status === 'can_xem') demNo.can_xem = Number(r.n);
    }

    const donHopLe = donPos.filter((d) => d.status !== 'cancelled').length;

    res.json({
      tu, den,
      ben_sx: { so_lenh: dsSx.length },
      ben_pos: { so_don: donPos.length, so_don_hop_le: donHopLe },
      khop,
      kho_bi_tru_oan: khoTruOan,
      van_tay_khong_doc_duoc: khongDocDuoc,
      so_no_dang_ket: demNo,
      ket_luan:
        khoTruOan.length === 0 && khongDocDuoc.length === 0 && demNo.cho === 0 && demNo.can_xem === 0
          ? 'Khong thay lech.'
          : 'CO CHUYEN — xem cac muc ben duoi.',
      gioi_han:
        'Chua phat hien duoc ca POS tao don xong roi chet TRUOC khi gui lenh sang SX. ' +
        'Ca do khong de lai dau vet o ca hai ben.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
