// Hook PostToolUse — nhắc việc BẮT BUỘC ngay sau khi sửa file (POS).
// Thoát mã 2 = Claude Code đọc được lời nhắc.
let vao = '';
process.stdin.on('data', (d) => (vao += d)).on('end', () => {
  let p = '';
  try { p = (JSON.parse(vao).tool_input || {}).file_path || ''; } catch {}
  p = p.replace(/\\/g, '/');
  if (/(^|\/)client\/src\//.test(p)) {
    console.error('P1 — vừa sửa client/src: BẮT BUỘC chạy [cd client && npm run build && cd ..] '
      + 'rồi commit CẢ client/dist. Quên build là lỗi ÂM THẦM, quầy vẫn chạy mã cũ.');
    process.exit(2);
  }
});
