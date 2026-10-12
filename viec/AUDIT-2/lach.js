#!/usr/bin/env node
// AUDIT-2 A3 — lệnh lách TỐI THIỂU cho các mã người gác chưa có ca nhắc tên trong tu_chay/thu_nguoi_gac.js (bảng lach.json).
// KHÔNG thực thi lệnh nào: chép tu_chay/nguoi_gac.js vào thư mục tạm, nạp BẢN SAO đó, đưa từng mục lach.json (dữ liệu JSON đầu vào
// hook) vào xet() trên một kho giả (khuôn viec/AUDIT-1/lach.js). In CHẶN|LỌT từng mục; LỌT = phát hiện. Chạy ở GỐC kho:
//   node viec/AUDIT-2/lach.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'au2lach_')));
process.on('exit', () => fs.rmSync(TAM, { recursive: true, force: true }));
fs.copyFileSync(path.join(__dirname, '..', '..', 'tu_chay', 'nguoi_gac.js'), path.join(TAM, 'nguoi_gac.js'));
const gac = require(path.join(TAM, 'nguoi_gac.js'));
const THU = JSON.parse(fs.readFileSync(path.join(__dirname, 'lach.json'), 'utf8'));

const viet = (g, rel, nd) => { const p = path.join(g, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, nd); };
const CH = {
  app: 'THU', file_cam: ['.env', '.env.*', '.replit', 'TIEN_DO_*.json', '.github/**'],
  file_luat: ['kiem_tra_truoc_khi_giao.js', 'tu_chay/**', 'package.json'],
  file_bi_mat: ['.env', '.env.*', '.replit'], chuong_trinh_them: [], tep_bash_them: ['ban_mau_pos/chay_thu.sh'],
};
const KHO = path.join(TAM, 'kho');
viet(KHO, '.git/HEAD', 'ref: refs/heads/viec/X\n');
viet(KHO, '.claude/tu_chay/cau_hinh.json', JSON.stringify(CH));
viet(KHO, 'ban_mau_pos/chay_thu.sh', 'echo x\n');
viet(KHO, 'viec/X/phieu.md', '# X\n## Mục tiêu\nx\n## Phạm vi\n- viec/X/**\n- server/a.js\n## Ngân sách\nx\n');
viet(KHO, 'viec/Y/trang_thai.md', 'x');
viet(KHO, 'server/a.js', 'x');
viet(KHO, '.env', 'SECRET\n');
viet(KHO, 'tu_chay/nguoi_gac.js', 'x');
const NHAP = path.join(TAM, 'nhap'); viet(NHAP, 'x', 'x');
const HOME = path.join(TAM, 'home'); fs.mkdirSync(path.join(HOME, '.claude', 'plans'), { recursive: true });
const thay = (v) => (typeof v === 'string' ? v.replace('@NHAP', NHAP).replace('@HOME', HOME) : v);

let lot = 0;
for (const t of THU) {
  const vao = Object.fromEntries(Object.entries(t.vao).map(([k, v]) => [k, thay(v)]));
  let kq;
  try {
    const r = gac.xet(JSON.stringify({ cwd: KHO, scratchpad_dir: NHAP, tool_name: t.cong_cu, tool_input: vao }), { CLAUDE_PROJECT_DIR: KHO, HOME });
    kq = r && r.quyet === 'CHO' ? 'CHO' : 'CHAN:' + (r && r.ma);
  } catch (e) { kq = 'LỖI:' + e.message; }
  if (kq === 'CHO') lot++;
  console.log(`${kq === 'CHO' ? 'LỌT ' : 'CHẶN'} [nhắm ${t.ma}] ${t.mo} → ${kq}`);
}
console.log(`\n  ${THU.length - lot}/${THU.length} lệnh lách bị chặn · ${lot} LỌT`);
process.exit(lot ? 1 : 0);
