#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DÒ ĐƠN CHƯA THU (P12) — chỉ ĐỌC mã nguồn, không chạy server, không ghi gì
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ POS-CHUATHU-v1. Xanh ngay từ đầu = vô giá trị.
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/do_chuathu.js
 *
 *  Không chỉ tìm chữ: phần [B] rút NGUYÊN VĂN công thức chọn payment_method
 *  trong Sales.jsx ra CHẠY THẬT với bốn cách trả, so kết quả.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require("fs");

const C = { do: "\x1b[31m", xanh: "\x1b[32m", mo: "\x1b[2m", dam: "\x1b[1m", het: "\x1b[0m" };
let dat = 0, hong = 0;
const ok = (a, b = "") => { dat++; console.log(`  ${C.xanh}✓${C.het} ${a}${b ? "  " + C.mo + b + C.het : ""}`); };
const xau = (a, b = "") => { hong++; console.log(`  ${C.do}✗ ${a}${b ? "  — " + b : ""}${C.het}`); };
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const doc = (p) => { try { return fs.readFileSync(p, "utf8"); } catch (e) { return null; } };

const S = doc("client/src/pages/Sales.jsx");
const O = doc("client/src/pages/Orders.jsx");
const B = doc("client/src/components/InvoicePreview.jsx");
if (!S || !O || !B) {
  console.error(`\n${C.do}✖ Không đọc được mã nguồn — chạy ở GỐC kho POS (cạnh package.json).${C.het}\n`);
  process.exit(1);
}

console.log(`\n${C.dam}DÒ ĐƠN CHƯA THU (P12)${C.het}`);

// ─── A. Khách lẻ có tạo được đơn chưa thu không ───────────────────────────
muc("[A] Khách lẻ phải bấm được “Chưa thu”");
{
  const i = S.indexOf("{customer && (\n                  <button");
  const nut = S.indexOf("Chưa thu\n                </button>");
  if (nut === -1) xau("Chưa có nút “Chưa thu” trong popup thanh toán");
  else if (i !== -1 && nut > i && nut < S.indexOf("</button>", i)) xau("Nút “Chưa thu” bị bọc trong {customer && …} — khách lẻ không thấy");
  else ok("Có nút “Chưa thu”, không đòi khách hàng");

  if (/else if \(!choThuTaiQuay\) \{[\s\S]{0,400}Vui lòng chọn khách hàng để ghi nợ/.test(S))
    ok("Phép chặn “phải có khách” bỏ qua đơn chưa thu");
  else xau("handleSubmit vẫn chặn khách lẻ khi chọn Chưa thu");
}

// ─── B. Chạy THẬT công thức chọn payment_method ──────────────────────────
muc("[B] Công thức ghi sổ — rút nguyên văn ra chạy với 4 cách trả");
{
  const m = S.match(/const cachGhiSo = ([\s\S]*?);/);
  const g = S.match(/const laGhiNo = ([^;]*);/);
  if (!m || !g) {
    xau("Không tìm thấy cachGhiSo / laGhiNo", "chưa vá, hoặc công thức còn nằm rải rác nhiều chỗ");
  } else {
    const tinh = (isDebt, choThuTaiQuay, paymentMethod) =>
      Function("isDebt", "choThuTaiQuay", "paymentMethod",
        `return [${m[1]}, ${g[1]}];`)(isDebt, choThuTaiQuay, paymentMethod);
    const ca = [
      ["Tiền mặt",     false, false, "cash",     "cash",     false],
      ["Chuyển khoản", false, false, "transfer", "transfer", false],
      ["Ghi nợ",       true,  false, "debt",     "debt",     true ],
      ["Chưa thu",     true,  true,  "debt",     "cho_thu",  false],
    ];
    for (const [ten, a, b, c, mongPm, mongNo] of ca) {
      const [pm, no] = tinh(a, b, c);
      if (pm === mongPm && no === mongNo) ok(`${ten.padEnd(13)} → ghi “${pm}”, hỏi hạn: ${no ? "có" : "không"}`);
      else xau(`${ten}`, `ra “${pm}”/${no}, mong “${mongPm}”/${mongNo}`);
    }
  }
  const lap = (S.match(/isDebt && !choThuTaiQuay/g) || []).length;
  if (lap <= 1) ok("Mỗi câu hỏi một chỗ trả lời", "không có công thức lặp lại (K10)");
  else xau(`“isDebt && !choThuTaiQuay” lặp ${lap} lần`, "sửa một chỗ quên chỗ kia là lệch");
}

// ─── C. Luồng GHI NỢ cũ phải y nguyên (K5 — ca “phải KHÔNG bị đổi”) ───────
muc("[C] Luồng Ghi nợ khách quen phải chạy y như trước");
{
  if (S.includes("setError('Vui lòng chọn khách hàng để ghi nợ')")) ok("Ghi nợ vẫn bắt buộc có khách");
  else xau("Mất phép chặn “phải có khách để ghi nợ”");
  if (/\{customer && \(\s*<button/.test(S)) ok("Nút Ghi nợ vẫn chỉ hiện khi có khách");
  else xau("Nút Ghi nợ không còn bọc trong {customer && …}");
  if (S.includes("setIsDebt(true); setChoThuTaiQuay(false); setPaymentMethod('debt');"))
    ok("Bấm Ghi nợ thì tắt cờ chưa thu");
  else xau("Bấm Ghi nợ sau Chưa thu có thể giữ nhầm cờ chưa thu");
}

// ─── D. Mọi chỗ khách và nhân viên NHÌN THẤY phải gọi đúng tên ───────────
muc("[D] Không chỗ nào in chữ gốc “cho_thu” ra cho người đọc");
{
  if (B.includes("'cho_thu' ? '🧾 Chưa thu'")) ok("Bill · dòng “Thanh toán:”");
  else xau("Bill · dòng “Thanh toán:” sẽ in nguyên văn “cho_thu”");
  if (B.includes("'cho_thu' ? 'CHƯA THU:'")) ok("Bill · dòng số tiền còn lại");
  else xau("Bill · dòng số tiền còn lại vẫn ghi “Ghi nợ:”");
  if (S.includes("'Chưa thu' : 'Ghi nợ'")) ok("Popup · dòng tóm tắt trước khi bấm");
  else xau("Popup · dòng tóm tắt vẫn ghi “Ghi nợ”");
  if (/case 'cho_thu'/.test(O)) ok("Trang Đơn hàng · biểu tượng");
  else xau("Trang Đơn hàng không có biểu tượng cho đơn chưa thu");
  if (S.includes("<Printer size={18} /> Chưa thu")) ok("Nút “Chưa thu” có biểu tượng riêng", "không trùng nút Ghi nợ");
  else xau("Nút “Chưa thu” trùng biểu tượng với nút Ghi nợ");
}

// ─── E. Cờ phải được dọn ở mọi chỗ đặt lại ──────────────────────────────
muc("[E] Cờ “chưa thu” không được sót sang đơn sau");
{
  const tat = (S.match(/setChoThuTaiQuay\(false\)/g) || []).length;
  if (tat === 7) ok("Tắt cờ đủ 7 chỗ", "4 chỗ đặt lại · Tiền mặt · Chuyển khoản · Ghi nợ");
  else xau(`Tắt cờ ở ${tat} chỗ, cần đúng 7`);
}

console.log(`\n${hong ? C.do + "✖ CHƯA ĐẠT" : C.xanh + "✓ ĐẠT HẾT"}${C.het}  —  ${dat} đạt · ${hong} hỏng\n`);
if (hong) console.log(`${C.mo}Chạy TRƯỚC khi vá POS-CHUATHU-v1 thì đỏ là đúng.${C.het}\n`);
process.exit(hong ? 1 : 0);
