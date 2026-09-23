/**
 * POS-NEN-v1 (P19) — ba đường mới, để RIÊNG một tệp thay vì chèn vào orders.js
 * ("cộng thêm, không viết lại"). Gắn TRƯỚC orderRoutes trong index.js: nhờ vậy
 * /orders/cho-thu không bị đường /orders/:id của orders.js hiểu nhầm là một mã đơn.
 *
 *   GET  /api/pos/orders/cho-thu            bill "mang ra bàn" chưa thu — dựng dãy thẻ ở màn Bán hàng
 *   GET  /api/pos/orders/:id/nhat-ky        nhật ký một đơn — ghép cột có sẵn + bảng pos_order_log
 *   POST /api/pos/orders/:id/doi-cach-tra   tiền mặt ↔ chuyển khoản sau khi đã in bill
 */
const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database');
const { authenticate } = require('../middleware/auth');
const { getToday } = require('../utils/helpers');
const { ghiNhatKy, tenCach, tien } = require('../utils/nhatKyDon');

// Số bill in to = số thứ tự trong ngày ở cuối mã đơn (ORD-20260922-014 → "014").
// Mã dự phòng dạng khác (POS-MADON-v1, khi tranh số quá 30 lần) → null: thẻ hiện mã đầy đủ.
const soBill = (code) => { const m = /^ORD-\d{8}-(\d{3,})$/.exec(String(code || '')); return m ? m[1] : null; };

// ─────────────────────────────────────────────────────────────────────────────
router.get('/cho-thu', authenticate, async (req, res) => {
  try {
    const ds = await query(
      `SELECT id, code, customer_name, customer_phone, total, debt_amount, payment_status,
              created_at, created_by
         FROM pos_orders
        WHERE payment_method = 'cho_thu'
          AND payment_status != 'paid'
          AND status = 'completed'
        ORDER BY created_at ASC, id ASC
        LIMIT 200`,
    );
    // Whitelist 'completed' chứ không loại trừ 'cancelled': đơn còn có 'refunded',
    // và trạng thái mới thêm sau này sẽ tự động NẰM NGOÀI thay vì lọt vào.
    // LIMIT 200: bill chờ thu thực tế chỉ vài cái; chặn để câu lấy món bên dưới
    // không vượt số tham số tối đa của SQLite nếu có ngày dồn bất thường.
    const theoDon = {};
    if (ds.length) {
      const mon = await query(
        `SELECT order_id, product_code, product_name, quantity, unit, notes
           FROM pos_order_items WHERE order_id IN (${ds.map(() => '?').join(',')})
          ORDER BY id ASC`,
        ds.map((d) => d.id),
      );
      for (const m of mon) (theoDon[m.order_id] = theoDon[m.order_id] || []).push(m);
    }
    const homNay = getToday();
    res.json({
      success: true,
      con_nua: ds.length === 200,   // dồn quá 200 bill chưa thu = có chuyện, màn hình phải báo
      data: ds.map((d) => ({
        ...d,
        so_bill: soBill(d.code),
        ngay_cu: String(d.created_at || '').slice(0, 10) !== homNay,   // bill hôm trước chưa xử — phải hiện nổi bật
        items: theoDon[d.id] || [],
      })),
    });
  } catch (err) {
    console.error('cho-thu error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/nhat-ky', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const o = await queryOne(
      `SELECT id, code, total, payment_method, status, created_at, created_by,
              cancelled_at, cancelled_by, cancelled_reason
         FROM pos_orders WHERE id = ?`, [id]);
    if (!o) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    const log = await query(
      `SELECT loai, noi_dung, chi_tiet, nguoi, luc FROM pos_order_log WHERE order_id = ? ORDER BY luc ASC, id ASC`, [id]);

    // Cách bán LÚC TẠO: nếu đơn từng bị đổi cách trả, cách gốc là "tu" của lần đổi đầu tiên.
    let goc = o.payment_method;
    const doiDau = log.find((x) => x.loai === 'doi');
    if (doiDau) { try { goc = JSON.parse(doiDau.chi_tiet || '{}').tu || goc; } catch { /* giữ cách hiện tại */ } }
    const moTaTao =
      goc === 'cho_thu' ? `In bill mang ra bàn · chưa thu ${tien(o.total)}`
      : goc === 'debt' ? `Ghi nợ ${tien(o.total)}`
      : goc === 'cash' || goc === 'transfer' ? `Bán tại quầy · ${tenCach(goc)} ${tien(o.total)}`
      : `Tạo đơn · ${goc} ${tien(o.total)}`;

    const viec = [{ luc: o.created_at, loai: 'tao', noi_dung: moTaTao, nguoi: o.created_by }];
    for (const x of log) viec.push({ luc: x.luc, loai: x.loai, noi_dung: x.noi_dung, nguoi: x.nguoi });
    if (o.status === 'cancelled') {
      viec.push({ luc: o.cancelled_at, loai: 'huy', noi_dung: `Huỷ · ${o.cancelled_reason || 'không ghi lý do'}`, nguoi: o.cancelled_by });
    }
    // Giữ thứ tự chèn khi trùng giây (tạo luôn đứng đầu).
    const daXep = viec.map((v, i) => ({ v, i }))
      .sort((a, b) => String(a.v.luc || '').localeCompare(String(b.v.luc || '')) || a.i - b.i)
      .map((x) => x.v);
    res.json({ success: true, data: daXep });
  } catch (err) {
    console.error('nhat-ky error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Đổi cách trả — chạm tiền, nên bốn chốt:
//   ① chỉ bill trong ngày (bill hôm trước đã vào sổ chốt ca)
//   ② chỉ bill trả MỘT cách: toàn tiền mặt hoặc toàn chuyển khoản
//   ③ bắt buộc lý do — ghi vào nhật ký cùng người làm
//   ④ chống đổi hai lần: chỉ ghi khi số tiền trong sổ còn đúng như lúc đọc
// Không cần quyền riêng: nhân viên vốn đã tự chọn tiền mặt / chuyển khoản lúc bán,
// đường này không mở thêm khả năng nào — nhưng mọi lần đổi đều để lại dấu vết.
router.post('/:id/doi-cach-tra', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const sang = req.body?.sang;
    const lyDo = String(req.body?.ly_do || '').trim();
    if (!['cash', 'transfer'].includes(sang)) return res.status(400).json({ error: 'Cách trả chỉ nhận cash hoặc transfer', code: 'CACH_TRA_LA' });
    if (!lyDo) return res.status(400).json({ error: 'Bắt buộc ghi lý do đổi cách trả', code: 'THIEU_LY_DO' });
    if (lyDo.length > 100) return res.status(400).json({ error: 'Lý do tối đa 100 ký tự', code: 'LY_DO_DAI' });

    const o = await queryOne('SELECT * FROM pos_orders WHERE id = ?', [id]);
    if (!o) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    // Chỉ đơn còn "sống" mới đổi được. Liệt kê cái ĐƯỢC PHÉP: đơn còn có trạng thái
    // 'refunded' (refunds.js đặt khi duyệt hoàn tiền) — đổi cách trả cho đơn đã hoàn tiền
    // là làm sai sổ. Trạng thái mới thêm sau này cũng tự động bị chặn.
    if (o.status !== 'completed') {
      return res.status(409).json({ error: `Đơn đang ở trạng thái "${o.status}" — không đổi cách trả`, code: 'TRANG_THAI_KHONG_DOI_DUOC' });
    }
    if (o.payment_status !== 'paid') return res.status(409).json({ error: 'Bill chưa thu xong — thu tiền trước', code: 'CHUA_THU_XONG' });
    if (String(o.created_at || '').slice(0, 10) !== getToday())
      return res.status(409).json({ error: 'Chỉ đổi được bill trong ngày', code: 'KHONG_TRONG_NGAY' });

    const tm = Number(o.cash_amount) || 0;
    const ck = Number(o.transfer_amount) || 0;
    const ketHop = (Number(o.balance_amount) || 0) > 0 || (Number(o.parent_balance_amount) || 0) > 0
                || (Number(o.debt_amount) || 0) > 0 || (tm > 0 && ck > 0) || (tm <= 0 && ck <= 0);
    if (ketHop) return res.status(409).json({ error: 'Bill trả kết hợp nhiều cách — không đổi ở đây', code: 'TRA_KET_HOP' });

    const tu = tm > 0 ? 'cash' : 'transfer';
    if (sang === tu) return res.status(400).json({ error: `Bill đang là ${tenCach(tu)} rồi`, code: 'DA_LA_CACH_NAY' });

    const soTien = tm + ck;
    // Bill "mang ra bàn" (cho_thu) giữ nguyên dấu gốc — số tiền nói nó đã trả bằng gì.
    const pmMoi = ['cash', 'transfer'].includes(o.payment_method) ? sang : o.payment_method;
    const kq = await run(
      `UPDATE pos_orders
          SET cash_amount = ?, transfer_amount = ?, payment_method = ?,
              cash_received = NULL, change_amount = 0
        WHERE id = ? AND COALESCE(cash_amount, 0) = ? AND COALESCE(transfer_amount, 0) = ?
          AND status = 'completed' AND payment_status = 'paid'`,
      [sang === 'cash' ? soTien : 0, sang === 'transfer' ? soTien : 0, pmMoi, id, tm, ck],
    );
    if (kq.changes !== 1) {
      return res.status(409).json({ error: 'Bill vừa bị thay đổi bởi thao tác khác — tải lại để xem', code: 'VUA_BI_DOI' });
    }
    await ghiNhatKy(id, 'doi', `Đổi ${tenCach(tu)} → ${tenCach(sang)} ${tien(soTien)} · ${lyDo}`,
      req.user?.username, { tu, sang, so_tien: soTien, ly_do: lyDo });

    res.json({ success: true, data: { order_id: id, tu, sang, so_tien: soTien } });
  } catch (err) {
    console.error('doi-cach-tra error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
