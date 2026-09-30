#!/usr/bin/env bash
# cai_thu_vien.sh — cài thư viện trên máy mây (TU-CHAY-2, mục E).
# Hook SessionStart (do cai_dat.js ghép vào .claude/settings.json) gọi bản ĐÃ CÀI:
#   bash "$CLAUDE_PROJECT_DIR/.claude/tu_chay/cai_thu_vien.sh"
# Chỉ làm việc khi CLAUDE_CODE_REMOTE=true (máy mây); Replit / máy nhà thoát ngay.
# npm ci ở gốc kho rồi ở client/. Bỏ qua chỗ nào đã cài đúng lockfile (dấu băm trong node_modules/).
# Lỗi: báo rõ ra stdout (vào ngữ cảnh Claude) và stderr, vẫn thoát 0 — hook SessionStart không chặn được phiên.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || { echo "✗ cai_thu_vien: không vào được thư mục kho"; exit 0; }
for d in . client; do
  [ -f "$d/package-lock.json" ] || continue
  bam=$(sha256sum "$d/package-lock.json" | cut -d' ' -f1)
  if [ "$(cat "$d/node_modules/.tu_chay_lock" 2>/dev/null)" = "$bam" ]; then continue; fi
  if log=$(cd "$d" && npm ci 2>&1); then
    echo "$bam" > "$d/node_modules/.tu_chay_lock"
    echo "✓ cai_thu_vien: npm ci ở $d xong"
  else
    msg="✗ cai_thu_vien: npm ci ở $d hỏng — npm test sẽ cảnh báo thiếu node_modules. Cuối log:"
    echo "$msg"; echo "$log" | tail -n 10
    echo "$msg" >&2; echo "$log" | tail -n 10 >&2
  fi
done
exit 0
