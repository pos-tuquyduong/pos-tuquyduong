// Hook Stop — Claude Code CHƯA được kết thúc lượt khi bộ kiểm còn ĐỎ.
// Là KHOÁ cho luật K6 "chạy bộ kiểm TRƯỚC khi giao", không phải lời dặn.
//
// Chống vòng lặp: nếu đã bị chặn một lần mà vẫn đỏ (stop_hook_active = true)
// thì CHO DỪNG, để Claude Code báo lỗi ra thay vì kẹt mãi. Lớp chặn cuối vẫn
// còn: git pre-commit hook không cho commit khi bộ kiểm đỏ.
const { spawnSync } = require('child_process');
const path = require('path');

let vao = '';
process.stdin.on('data', (d) => (vao += d)).on('end', () => {
  let tt = {};
  try { tt = JSON.parse(vao); } catch {}
  const goc = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const r = spawnSync(process.execPath, [path.join(goc, 'kiem_tra_truoc_khi_giao.js')],
    { cwd: goc, encoding: 'utf8' });
  if (r.status === 0) process.exit(0);

  const loi = String(r.stdout || '').split('\n').filter((d) => d.includes('✗')).slice(0, 6).join('\n');
  if (tt.stop_hook_active) {
    console.error('Bộ kiểm VẪN ĐỎ. Dừng lại, ghi rõ vào mục CHƯA KIỂM của báo cáo:\n' + loi);
    process.exit(0);
  }
  console.error('Bộ kiểm đang ĐỎ — chạy [npm test], sửa các mục ✗ rồi mới báo xong.\n'
    + 'KHÔNG được nới lỏng bộ kiểm (K8).\n' + loi);
  process.exit(2);
});
