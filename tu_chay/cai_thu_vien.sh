#!/usr/bin/env bash
# cai_thu_vien.sh — mở phiên trên máy mây: kéo nhánh việc mới nhất (TU-CHAY-3 C) rồi cài thư viện (TU-CHAY-2 E).
# Hook SessionStart (do cai_dat.js ghép vào .claude/settings.json) gọi bản ĐÃ CÀI:
#   bash "$CLAUDE_PROJECT_DIR/.claude/tu_chay/cai_thu_vien.sh"
# Chỉ làm việc khi CLAUDE_CODE_REMOTE=true (máy mây); Replit / máy nhà thoát ngay.
# Kéo nhánh: chỉ khi đứng ở viec/*, không có file đã theo dõi đang sửa dở; lệnh git có ghi CHỈ là
# `git fetch origin <nhánh>` + `git merge --ff-only`. Lệch nhau, mất mạng: cảnh báo, không đổi gì.
# Kéo TRƯỚC npm ci (lockfile có thể vừa đổi). Không bọc hàm: git thay file bằng inode mới nên bash vẫn đọc bản cũ.
# npm ci ở gốc kho rồi ở client/. Bỏ qua chỗ nào đã cài đúng lockfile (dấu băm trong node_modules/).
# Lỗi: báo rõ ra stdout (vào ngữ cảnh Claude) và stderr, vẫn thoát 0 — hook SessionStart không chặn được phiên.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || { echo "✗ cai_thu_vien: không vào được thư mục kho"; exit 0; }
nhanh=$(git symbolic-ref --short -q HEAD 2>/dev/null)
case "$nhanh" in
  viec/?*)
    if ! git diff --quiet HEAD -- 2>/dev/null; then
      echo "⚠ kéo nhánh: có file đã theo dõi đang sửa dở — KHÔNG kéo $nhanh, cây giữ nguyên"
    elif ! timeout 60 git fetch -q origin "$nhanh" 2>/dev/null; then
      echo "⚠ kéo nhánh: không kéo được origin/$nhanh (mạng?) — làm tiếp trên bản đang có"
    elif git merge-base --is-ancestor FETCH_HEAD HEAD; then
      echo "· kéo nhánh: $nhanh đã có đủ commit của origin — không kéo"
    elif ! git merge-base --is-ancestor HEAD FETCH_HEAD; then
      echo "✗ kéo nhánh: $nhanh ở máy và origin lệch nhau — máy DỪNG, báo chủ quán (không merge, không reset)"
    else
      truoc=$(git rev-parse --short HEAD)
      if git merge -q --ff-only FETCH_HEAD; then
        echo "✓ kéo nhánh $nhanh: $truoc → $(git rev-parse --short HEAD)"
      else
        echo "⚠ kéo nhánh: fast-forward $nhanh hỏng (file chưa theo dõi bị đè?) — cây giữ nguyên"
      fi
    fi
    ;;
esac
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
