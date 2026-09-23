#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
POS-NEN-v1 — NỀN MÁY CHỦ CHO P13–P18  (việc P19)
================================================================================
Chay:  python3 patch_pos_nen_v1.py          (o GOC kho POS, canh package.json)
Lui :  bash lui_NEN.sh                      (patch tu sinh ra)

BA PHAN, TOAN BO LA CONG THEM — khong sua duong tao don:
  1. NHAT KY DON — bang pos_order_log chi ghi viec CHUA co cho luu (thu tien sau,
     doi cach tra). Gio tao/huy da nam san trong pos_orders -> khong ghi lai.
  2. BILL CHO THU — GET /orders/cho-thu, de man ban hang dung day the so bill.
  3. DOI CACH TRA — POST /orders/:id/doi-cach-tra, 4 chot: trong ngay · mot cach
     tra · bat buoc ly do · chong doi hai lan.

VA MOT CHO VA DUONG TIEN DANG CHAY:
  pay-debt (thu tien sau) KHONG kiem no con dung bang so vua doc. Da CHUNG MINH
  tren may chu that co gia lap do tre mang Turso 40ms: bam dup "thu tien mat" cho
  don 19.000d -> ket ghi 38.000d, ca hai lenh bao thanh cong. Khong co do tre thi
  KHONG tai hien duoc (co so du lieu tep qua nhanh) — nen bai thu luon chay kem do tre.
  Sua: UPDATE ... WHERE debt_amount = <so vua doc> AND chua paid, roi kiem so dong doi.
  Hai nhanh tien mat / chuyen khoan gop thanh mot (ten cot lay tu danh sach trang).

  -> Day cung chinh la phep chan P3 can: payOS goi webhook hai lan.

KEM HAI LUAT MOI TRONG BO KIEM:
  · moi bang tao trong database.js phai co trong danh sach sao luu
    (phat hien nang nhat dot truoc: sao luu thieu 15/29 bang)
  · pay-debt phai con phep chan thu hai lan

KHONG LAM: bang hang doi in -> chuyen sang P17, noi no duoc dung ngay.
KHONG DUNG client/ -> KHONG can npm run build.
"""
import hashlib, io, os, shutil, subprocess, sys, tempfile

MA_PATCH = "POS-NEN-v1"
MA_VIEC = "P19"
DB, BK, OR, IX, KT = ("server/database.js", "server/routes/backup.js", "server/routes/orders.js",
                      "server/index.js", "kiem_tra_truoc_khi_giao.js")
MOI_NK, MOI_DR = "server/utils/nhatKyDon.js", "server/routes/don-mo-rong.js"
GI = ".gitignore"

NHAT_KY = "/**\n * POS-NEN-v1 (P19) — ghi một dòng vào nhật ký đơn.\n *\n * Nhật ký chỉ ghi những việc CHƯA có chỗ lưu: thu tiền sau, đổi cách trả,\n * (sau này) in lại. Giờ tạo / người tạo / giờ huỷ / lý do huỷ ĐÃ nằm sẵn trong\n * pos_orders — ghi lại ở đây là hai nơi giữ cùng một sự thật, nên không ghi.\n * Khi xem, đường /orders/:id/nhat-ky ghép cả hai nguồn.\n *\n * KHÔNG BAO GIỜ ném lỗi: nhật ký hỏng thì thao tác chính (thu tiền, đổi cách trả)\n * vẫn phải thành công — mất một dòng nhật ký đỡ hại hơn mất một lần thu tiền.\n */\nconst { run } = require('../database');\nconst { getNow } = require('./helpers');\n\nasync function ghiNhatKy(orderId, loai, noiDung, nguoi, chiTiet) {\n  try {\n    await run(\n      `INSERT INTO pos_order_log (order_id, loai, noi_dung, chi_tiet, nguoi, luc)\n       VALUES (?, ?, ?, ?, ?, ?)`,\n      [orderId, loai, noiDung, chiTiet ? JSON.stringify(chiTiet) : null, nguoi || null, getNow()],\n    );\n  } catch (e) {\n    console.error('⚠️ Không ghi được nhật ký đơn', orderId, loai, e.message);\n  }\n}\n\nconst tenCach = (c) => (c === 'cash' ? 'tiền mặt' : c === 'transfer' ? 'chuyển khoản' : c);\nconst tien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';\n\nmodule.exports = { ghiNhatKy, tenCach, tien };\n"
DON_MO_RONG = "/**\n * POS-NEN-v1 (P19) — ba đường mới, để RIÊNG một tệp thay vì chèn vào orders.js\n * (\"cộng thêm, không viết lại\"). Gắn TRƯỚC orderRoutes trong index.js: nhờ vậy\n * /orders/cho-thu không bị đường /orders/:id của orders.js hiểu nhầm là một mã đơn.\n *\n *   GET  /api/pos/orders/cho-thu            bill \"mang ra bàn\" chưa thu — dựng dãy thẻ ở màn Bán hàng\n *   GET  /api/pos/orders/:id/nhat-ky        nhật ký một đơn — ghép cột có sẵn + bảng pos_order_log\n *   POST /api/pos/orders/:id/doi-cach-tra   tiền mặt ↔ chuyển khoản sau khi đã in bill\n */\nconst express = require('express');\nconst router = express.Router();\nconst { query, queryOne, run } = require('../database');\nconst { authenticate } = require('../middleware/auth');\nconst { getToday } = require('../utils/helpers');\nconst { ghiNhatKy, tenCach, tien } = require('../utils/nhatKyDon');\n\n// Số bill in to = số thứ tự trong ngày ở cuối mã đơn (ORD-20260922-014 → \"014\").\n// Mã dự phòng dạng khác (POS-MADON-v1, khi tranh số quá 30 lần) → null: thẻ hiện mã đầy đủ.\nconst soBill = (code) => { const m = /^ORD-\\d{8}-(\\d{3,})$/.exec(String(code || '')); return m ? m[1] : null; };\n\n// ─────────────────────────────────────────────────────────────────────────────\nrouter.get('/cho-thu', authenticate, async (req, res) => {\n  try {\n    const ds = await query(\n      `SELECT id, code, customer_name, customer_phone, total, debt_amount, payment_status,\n              created_at, created_by\n         FROM pos_orders\n        WHERE payment_method = 'cho_thu'\n          AND payment_status != 'paid'\n          AND status = 'completed'\n        ORDER BY created_at ASC, id ASC\n        LIMIT 200`,\n    );\n    // Whitelist 'completed' chứ không loại trừ 'cancelled': đơn còn có 'refunded',\n    // và trạng thái mới thêm sau này sẽ tự động NẰM NGOÀI thay vì lọt vào.\n    // LIMIT 200: bill chờ thu thực tế chỉ vài cái; chặn để câu lấy món bên dưới\n    // không vượt số tham số tối đa của SQLite nếu có ngày dồn bất thường.\n    const theoDon = {};\n    if (ds.length) {\n      const mon = await query(\n        `SELECT order_id, product_code, product_name, quantity, unit, notes\n           FROM pos_order_items WHERE order_id IN (${ds.map(() => '?').join(',')})\n          ORDER BY id ASC`,\n        ds.map((d) => d.id),\n      );\n      for (const m of mon) (theoDon[m.order_id] = theoDon[m.order_id] || []).push(m);\n    }\n    const homNay = getToday();\n    res.json({\n      success: true,\n      con_nua: ds.length === 200,   // dồn quá 200 bill chưa thu = có chuyện, màn hình phải báo\n      data: ds.map((d) => ({\n        ...d,\n        so_bill: soBill(d.code),\n        ngay_cu: String(d.created_at || '').slice(0, 10) !== homNay,   // bill hôm trước chưa xử — phải hiện nổi bật\n        items: theoDon[d.id] || [],\n      })),\n    });\n  } catch (err) {\n    console.error('cho-thu error:', err);\n    res.status(500).json({ error: err.message });\n  }\n});\n\n// ─────────────────────────────────────────────────────────────────────────────\nrouter.get('/:id/nhat-ky', authenticate, async (req, res) => {\n  try {\n    const id = parseInt(req.params.id, 10);\n    const o = await queryOne(\n      `SELECT id, code, total, payment_method, status, created_at, created_by,\n              cancelled_at, cancelled_by, cancelled_reason\n         FROM pos_orders WHERE id = ?`, [id]);\n    if (!o) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });\n\n    const log = await query(\n      `SELECT loai, noi_dung, chi_tiet, nguoi, luc FROM pos_order_log WHERE order_id = ? ORDER BY luc ASC, id ASC`, [id]);\n\n    // Cách bán LÚC TẠO: nếu đơn từng bị đổi cách trả, cách gốc là \"tu\" của lần đổi đầu tiên.\n    let goc = o.payment_method;\n    const doiDau = log.find((x) => x.loai === 'doi');\n    if (doiDau) { try { goc = JSON.parse(doiDau.chi_tiet || '{}').tu || goc; } catch { /* giữ cách hiện tại */ } }\n    const moTaTao =\n      goc === 'cho_thu' ? `In bill mang ra bàn · chưa thu ${tien(o.total)}`\n      : goc === 'debt' ? `Ghi nợ ${tien(o.total)}`\n      : goc === 'cash' || goc === 'transfer' ? `Bán tại quầy · ${tenCach(goc)} ${tien(o.total)}`\n      : `Tạo đơn · ${goc} ${tien(o.total)}`;\n\n    const viec = [{ luc: o.created_at, loai: 'tao', noi_dung: moTaTao, nguoi: o.created_by }];\n    for (const x of log) viec.push({ luc: x.luc, loai: x.loai, noi_dung: x.noi_dung, nguoi: x.nguoi });\n    if (o.status === 'cancelled') {\n      viec.push({ luc: o.cancelled_at, loai: 'huy', noi_dung: `Huỷ · ${o.cancelled_reason || 'không ghi lý do'}`, nguoi: o.cancelled_by });\n    }\n    // Giữ thứ tự chèn khi trùng giây (tạo luôn đứng đầu).\n    const daXep = viec.map((v, i) => ({ v, i }))\n      .sort((a, b) => String(a.v.luc || '').localeCompare(String(b.v.luc || '')) || a.i - b.i)\n      .map((x) => x.v);\n    res.json({ success: true, data: daXep });\n  } catch (err) {\n    console.error('nhat-ky error:', err);\n    res.status(500).json({ error: err.message });\n  }\n});\n\n// ─────────────────────────────────────────────────────────────────────────────\n// Đổi cách trả — chạm tiền, nên bốn chốt:\n//   ① chỉ bill trong ngày (bill hôm trước đã vào sổ chốt ca)\n//   ② chỉ bill trả MỘT cách: toàn tiền mặt hoặc toàn chuyển khoản\n//   ③ bắt buộc lý do — ghi vào nhật ký cùng người làm\n//   ④ chống đổi hai lần: chỉ ghi khi số tiền trong sổ còn đúng như lúc đọc\n// Không cần quyền riêng: nhân viên vốn đã tự chọn tiền mặt / chuyển khoản lúc bán,\n// đường này không mở thêm khả năng nào — nhưng mọi lần đổi đều để lại dấu vết.\nrouter.post('/:id/doi-cach-tra', authenticate, async (req, res) => {\n  try {\n    const id = parseInt(req.params.id, 10);\n    const sang = req.body?.sang;\n    const lyDo = String(req.body?.ly_do || '').trim();\n    if (!['cash', 'transfer'].includes(sang)) return res.status(400).json({ error: 'Cách trả chỉ nhận cash hoặc transfer', code: 'CACH_TRA_LA' });\n    if (!lyDo) return res.status(400).json({ error: 'Bắt buộc ghi lý do đổi cách trả', code: 'THIEU_LY_DO' });\n    if (lyDo.length > 100) return res.status(400).json({ error: 'Lý do tối đa 100 ký tự', code: 'LY_DO_DAI' });\n\n    const o = await queryOne('SELECT * FROM pos_orders WHERE id = ?', [id]);\n    if (!o) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });\n    // Chỉ đơn còn \"sống\" mới đổi được. Liệt kê cái ĐƯỢC PHÉP: đơn còn có trạng thái\n    // 'refunded' (refunds.js đặt khi duyệt hoàn tiền) — đổi cách trả cho đơn đã hoàn tiền\n    // là làm sai sổ. Trạng thái mới thêm sau này cũng tự động bị chặn.\n    if (o.status !== 'completed') {\n      return res.status(409).json({ error: `Đơn đang ở trạng thái \"${o.status}\" — không đổi cách trả`, code: 'TRANG_THAI_KHONG_DOI_DUOC' });\n    }\n    if (o.payment_status !== 'paid') return res.status(409).json({ error: 'Bill chưa thu xong — thu tiền trước', code: 'CHUA_THU_XONG' });\n    if (String(o.created_at || '').slice(0, 10) !== getToday())\n      return res.status(409).json({ error: 'Chỉ đổi được bill trong ngày', code: 'KHONG_TRONG_NGAY' });\n\n    const tm = Number(o.cash_amount) || 0;\n    const ck = Number(o.transfer_amount) || 0;\n    const ketHop = (Number(o.balance_amount) || 0) > 0 || (Number(o.parent_balance_amount) || 0) > 0\n                || (Number(o.debt_amount) || 0) > 0 || (tm > 0 && ck > 0) || (tm <= 0 && ck <= 0);\n    if (ketHop) return res.status(409).json({ error: 'Bill trả kết hợp nhiều cách — không đổi ở đây', code: 'TRA_KET_HOP' });\n\n    const tu = tm > 0 ? 'cash' : 'transfer';\n    if (sang === tu) return res.status(400).json({ error: `Bill đang là ${tenCach(tu)} rồi`, code: 'DA_LA_CACH_NAY' });\n\n    const soTien = tm + ck;\n    // Bill \"mang ra bàn\" (cho_thu) giữ nguyên dấu gốc — số tiền nói nó đã trả bằng gì.\n    const pmMoi = ['cash', 'transfer'].includes(o.payment_method) ? sang : o.payment_method;\n    const kq = await run(\n      `UPDATE pos_orders\n          SET cash_amount = ?, transfer_amount = ?, payment_method = ?,\n              cash_received = NULL, change_amount = 0\n        WHERE id = ? AND COALESCE(cash_amount, 0) = ? AND COALESCE(transfer_amount, 0) = ?\n          AND status = 'completed' AND payment_status = 'paid'`,\n      [sang === 'cash' ? soTien : 0, sang === 'transfer' ? soTien : 0, pmMoi, id, tm, ck],\n    );\n    if (kq.changes !== 1) {\n      return res.status(409).json({ error: 'Bill vừa bị thay đổi bởi thao tác khác — tải lại để xem', code: 'VUA_BI_DOI' });\n    }\n    await ghiNhatKy(id, 'doi', `Đổi ${tenCach(tu)} → ${tenCach(sang)} ${tien(soTien)} · ${lyDo}`,\n      req.user?.username, { tu, sang, so_tien: soTien, ly_do: lyDo });\n\n    res.json({ success: true, data: { order_id: id, tu, sang, so_tien: soTien } });\n  } catch (err) {\n    console.error('doi-cach-tra error:', err);\n    res.status(500).json({ error: err.message });\n  }\n});\n\nmodule.exports = router;\n"

CAP = []

# ── 0. ve sinh kho: moi patch goi so viec deu sinh ra __pycache__/, ma .gitignore
# chua chan -> "git add -A" la rac theo vao kho. Chan mot lan cho xong.
CAP.append((".gitignore", "chan_pycache", """attached_assets/
""", """attached_assets/
__pycache__/
*.pyc
"""))

# ── 1. bảng nhật ký đơn, ngay sau bảng sổ nợ kho
CAP.append((DB, "bang_nhat_ky", """      resolved_at DATETIME,
      van_tay TEXT
    )
  `);
""", """      resolved_at DATETIME,
      van_tay TEXT
    )
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // POS-NEN-v1 (P19): NHẬT KÝ ĐƠN — chỉ ghi việc CHƯA có chỗ lưu (thu tiền sau,
  // đổi cách trả, sau này in lại). Giờ tạo / huỷ đã nằm trong pos_orders.
  // Nhớ: bảng mới nào cũng phải vào BACKUP_TABLES — bộ kiểm có luật chặn.
  // ═══════════════════════════════════════════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pos_order_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      loai TEXT NOT NULL,
      noi_dung TEXT,
      chi_tiet TEXT,
      nguoi TEXT,
      luc TEXT NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_order_log_order ON pos_order_log(order_id)`);
"""))

# ── 2. sao lưu bảng mới (sau pos_orders trong danh sách: cha trước con)
CAP.append((BK, "sao_luu", """  { name: 'pos_stock_pending', label: 'Sổ nợ kho', key: 'id' },
""", """  { name: 'pos_stock_pending', label: 'Sổ nợ kho', key: 'id' },
  { name: 'pos_order_log', label: 'Nhật ký đơn', key: 'id' },   // POS-NEN-v1 (P19)
"""))

# ── 3. pay-debt: chống thu hai lần + ghi nhật ký
CAP.append((OR, "nap_nhat_ky", """const { checkStock, outStockFIFO, inStockReturn } = require("../utils/sxApi");
""", """const { checkStock, outStockFIFO, inStockReturn } = require("../utils/sxApi");
const nhatKyDon = require("../utils/nhatKyDon"); // POS-NEN-v1 (P19)
"""))
CAP.append((OR, "chong_thu_hai_lan", "    // Cập nhật đơn hàng\n    if (payment_method === \"cash\") {\n      await run(\n        `\n        UPDATE pos_orders SET \n          cash_amount = COALESCE(cash_amount, 0) + ?,\n          debt_amount = ?,\n          payment_status = ?\n        WHERE id = ?\n      `,\n        [paidAmount, remainingDebt, newPaymentStatus, id],\n      );\n    } else {\n      await run(\n        `\n        UPDATE pos_orders SET \n          transfer_amount = COALESCE(transfer_amount, 0) + ?,\n          debt_amount = ?,\n          payment_status = ?\n        WHERE id = ?\n      `,\n        [paidAmount, remainingDebt, newPaymentStatus, id],\n      );\n    }\n\n", """    // Cập nhật đơn hàng
    // POS-NEN-v1 (P19): CHỐNG THU HAI LẦN. Trước đây câu UPDATE chỉ lọc theo id —
    // hai lệnh thu cùng lúc (bấm đúp, hay sau này payOS gọi webhook hai lần) cùng đọc
    // thấy "còn nợ 19.000đ" rồi cùng cộng tiền: đơn 19.000đ thành tiền mặt 38.000đ.
    // Đã chứng minh trên máy chủ thật với độ trễ mạng như Turso. Nay chỉ ghi khi nợ
    // trong sổ còn ĐÚNG bằng số vừa đọc, rồi kiểm số dòng bị đổi.
    // payment_method đã được kiểm chỉ là cash|transfer ở trên → tên cột an toàn.
    const cotTien = payment_method === "cash" ? "cash_amount" : "transfer_amount";
    const kqThu = await run(
      `UPDATE pos_orders SET ${cotTien} = COALESCE(${cotTien}, 0) + ?, debt_amount = ?, payment_status = ?
        WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'`,
      [paidAmount, remainingDebt, newPaymentStatus, id, order.debt_amount],
    );
    if (kqThu.changes !== 1) {
      return res.status(409).json({
        error: "Đơn vừa được thu bởi một thao tác khác — tải lại để xem",
        code: "DA_THU_ROI",
      });
    }
    await nhatKyDon.ghiNhatKy(Number(id), "thu",
      `Thu ${nhatKyDon.tenCach(payment_method)} ${nhatKyDon.tien(paidAmount)}` +
        (remainingDebt > 0 ? ` · còn nợ ${nhatKyDon.tien(remainingDebt)}` : ""),
      req.user.username, { cach: payment_method, so_tien: paidAmount, con_no: remainingDebt });

"""))

# ── 4. gắn ba đường mới TRƯỚC orderRoutes
CAP.append((IX, "nap_route", """const orderRoutes = require('./routes/orders');
""", """const orderRoutes = require('./routes/orders');
const donMoRongRoutes = require('./routes/don-mo-rong'); // POS-NEN-v1 (P19)
"""))
CAP.append((IX, "gan_route", """app.use('/api/pos/orders', orderRoutes);
""", """// POS-NEN-v1: gắn TRƯỚC orderRoutes — nếu sau, /orders/cho-thu bị /orders/:id hiểu là một mã đơn
app.use('/api/pos/orders', donMoRongRoutes);
app.use('/api/pos/orders', orderRoutes);
"""))

# ── 5. hai luật mới trong bộ kiểm, cuối nhóm E
CAP.append((KT, "luat_moi", """// ⚠ ĐIỀU PHÉP KIỂM NÀY KHÔNG BAO PHỦ (E6): chỉ canh được `from_package`.
// `discount_type`/`discount_value` không có mẫu thô đặc trưng để kiểm vắng mặt
// — chúng chỉ là biến đọc từ body rồi dùng thẳng. Phải tự soi bằng mắt, mục G.
""", """// ⚠ ĐIỀU PHÉP KIỂM NÀY KHÔNG BAO PHỦ (E6): chỉ canh được `from_package`.
// `discount_type`/`discount_value` không có mẫu thô đặc trưng để kiểm vắng mặt
// — chúng chỉ là biến đọc từ body rồi dùng thẳng. Phải tự soi bằng mắt, mục G.

// E7 — POS-NEN-v1: pay-debt phải chặn thu hai lần. Gỡ điều kiện debt_amount khỏi
// WHERE là hai lệnh thu cùng lúc cùng cộng tiền (đã chứng minh với độ trễ Turso).
{
  const src = boGhiChu(doc('server/routes/orders.js'));
  const a = src.indexOf('"/:id/pay-debt"');
  const khoi = a < 0 ? '' : src.slice(a, src.indexOf('router.', a + 20));
  chac('pay-debt chặn thu hai lần (WHERE … debt_amount = ? + kiểm số dòng đổi)',
    /WHERE id = \\? AND debt_amount = \\?/.test(khoi) && /changes !== 1/.test(khoi),
    'bấm đúp hoặc webhook gọi hai lần sẽ cộng tiền hai lần');
}

// E8 — POS-NEN-v1: mọi bảng tạo trong database.js phải có trong danh sách sao lưu.
// Đợt 17.09 phát hiện sao lưu thiếu 15/29 bảng — khôi phục là mất điểm, gói, tài khoản.
{
  const db = doc('server/database.js'), bk = doc('server/routes/backup.js');
  const tao = [...new Set([...db.matchAll(/CREATE TABLE IF NOT EXISTS (\\w+)/g)].map(m => m[1]))];
  const i = bk.indexOf('BACKUP_TABLES');
  const sl = i < 0 ? '' : bk.slice(i, bk.indexOf('];', i));
  const thieu = tao.filter(t => !new RegExp(`name:\\\\s*'${t}'`).test(sl));
  chac(`mọi bảng đều được sao lưu (${tao.length} bảng)`, tao.length > 0 && thieu.length === 0,
    'thiếu trong BACKUP_TABLES: ' + thieu.join(', '));
}
"""))


def doc(t): return io.open(t, encoding="utf-8").read()


def main():
    print("=" * 74); print("  %s — NEN MAY CHU CHO P13-P18 (viec %s)" % (MA_PATCH, MA_VIEC)); print("=" * 74)
    tep = sorted({t for t, _, _, _ in CAP})
    thieu = [t for t in tep if not os.path.exists(t)]
    if thieu:
        print("\n[DUNG] Khong thay: %s — chay o GOC kho POS." % ", ".join(thieu)); return 1
    goc = {t: doc(t) for t in tep}

    if any(MA_PATCH in v for v in goc.values()) or os.path.exists(MOI_DR):
        print("\n[BO QUA] %s da co — khong lam gi. Muon va lai: bash lui_NEN.sh" % MA_PATCH); return 0
    if os.path.exists(MOI_NK):
        print("\n[DUNG] %s da ton tai ma khong phai do patch nay tao — kiem tay." % MOI_NK); return 1

    print("\nKiem mo neo:")
    hong = []
    for t, ten, cu, _ in CAP:
        n = goc[t].count(cu)
        print("  [%s] %-18s %d lan   %s" % ("OK " if n == 1 else "SAI", ten, n, t))
        if n != 1: hong.append(ten)
    if hong:
        print("\n[DUNG] mo neo khong khop: %s — KHONG ghi gi." % ", ".join(hong)); return 1

    moi = dict(goc)
    for t, _, cu, m in CAP: moi[t] = moi[t].replace(cu, m, 1)

    # ── phep chot: noi dung
    loi = []
    o = moi[OR]
    if o.count("AND debt_amount = ? AND payment_status != 'paid'") != 1: loi.append("pay-debt thieu dieu kien chong thu hai lan")
    if "WHERE id = ?\n      `,\n        [paidAmount" in o: loi.append("con sot cau UPDATE cu khong dieu kien")
    ix = moi[IX]
    if not (0 <= ix.find("app.use('/api/pos/orders', donMoRongRoutes)") < ix.find("app.use('/api/pos/orders', orderRoutes)")):
        loi.append("duong moi phai gan TRUOC orderRoutes")
    import re
    bang = set(re.findall(r"CREATE TABLE IF NOT EXISTS (\w+)", moi[DB]))
    sl = moi[BK][moi[BK].index("BACKUP_TABLES"):moi[BK].index("];", moi[BK].index("BACKUP_TABLES"))]
    thieu_sl = [b for b in bang if ("name: '%s'" % b) not in sl]
    if thieu_sl: loi.append("bang chua vao sao luu: %s" % thieu_sl)

    # ── phep chot: cu phap — viet ra tep tam roi node --check tung tep JS
    tam = tempfile.mkdtemp()
    kiem = dict(moi); kiem[MOI_NK] = NHAT_KY; kiem[MOI_DR] = DON_MO_RONG
    for t, nd in kiem.items():
        if not t.endswith(".js"): continue
        p = os.path.join(tam, t.replace("/", "__"))
        io.open(p, "w", encoding="utf-8").write(nd)
        r = subprocess.run(["node", "--check", p], capture_output=True, text=True)
        if r.returncode != 0: loi.append("loi cu phap %s: %s" % (t, (r.stderr or "").strip().splitlines()[-1:]))
    shutil.rmtree(tam, ignore_errors=True)

    if loi:
        print("\n[DUNG] Ket qua khong dat:"); [print("   - " + x) for x in loi]
        print("       KHONG ghi gi ca."); return 1

    for t in tep: shutil.copy2(t, t + ".truoc_NEN")
    co_so = os.path.exists("TIEN_DO_POS.json")
    if co_so: shutil.copy2("TIEN_DO_POS.json", "TIEN_DO_POS.json.truoc_NEN")   # lui thi so viec cung lui
    with io.open("lui_NEN.sh", "w", encoding="utf-8") as f:
        f.write("#!/usr/bin/env bash\n# Duong lui cua %s\nset -e\n" % MA_PATCH)
        for t in tep: f.write('cp "%s.truoc_NEN" "%s"\n' % (t, t))
        f.write('rm -f "%s" "%s"\n' % (MOI_NK, MOI_DR))
        if co_so: f.write('cp "TIEN_DO_POS.json.truoc_NEN" "TIEN_DO_POS.json"   # P19 tro lai dang mo\n')
        f.write('echo "Da tra ve ban truoc %s. Bang pos_order_log (neu da tao) de nguyen — vo hai."\n' % MA_PATCH)
    for t in tep: io.open(t, "w", encoding="utf-8").write(moi[t])
    io.open(MOI_NK, "w", encoding="utf-8").write(NHAT_KY)
    io.open(MOI_DR, "w", encoding="utf-8").write(DON_MO_RONG)

    print("\nDa ghi:")
    for t in tep + [MOI_NK, MOI_DR]:
        b = io.open(t, "rb").read(); print("  %-36s %s  %d byte" % (t, hashlib.sha256(b).hexdigest()[:16], len(b)))
    print("  Ban luu: *.truoc_NEN  ·  Duong lui: bash lui_NEN.sh")
    try:
        sys.path.insert(0, os.getcwd()); from dong_tien_do import ghi_tien_do; ghi_tien_do(MA_VIEC, MA_PATCH)
    except Exception as e:
        print("  [tien do] khong goi duoc dong_tien_do.py (%s)" % e)
    print("""
VIEC TIEP THEO
  1. node kiem_tra_truoc_khi_giao.js     <- phai 33 dat · 0 loi (them 2 luat moi)
  2. git add -A && git commit && git push   (KHONG can npm run build — khong dung client/)
  3. Doi Render dung xong, THU TAY: xem huong dan trong doan chat
DUONG LUI: bash lui_NEN.sh roi push lai.
""")
    return 0


if __name__ == "__main__":
    sys.exit(main())
