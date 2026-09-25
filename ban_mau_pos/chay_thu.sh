#!/usr/bin/env bash
# Chạy toàn bộ bộ thử của bản mẫu.
# Bài nào KHÔNG in ra được dòng "N đạt · M hỏng" (sập giữa chừng, lỗi cú pháp, thiếu tệp)
# thì bị tính là HỎNG — không bao giờ được lặng lẽ bỏ qua rồi báo tổng xanh.
cd "$(dirname "$0")"
tong=0; hong=0; sap=0
for f in thu/*.js; do
  ra=$(node "$f" 2>&1)
  kq=$(printf '%s\n' "$ra" | grep -oE '[0-9]+ đạt · [0-9]+ hỏng' | tail -1)
  ten=$(basename "$f" .js)
  if [ -z "$kq" ]; then                         # không in ra kết quả = sập
    loi=$(printf '%s\n' "$ra" | grep -m1 -E 'Error|error' | cut -c1-90)
    printf "  %-14s ✗ SẬP — %s\n" "$ten" "${loi:-không in ra kết quả}"
    sap=$((sap+1)); hong=$((hong+1)); continue
  fi
  d=${kq%% đạt*}; h=${kq##*· }; h=${h%% hỏng}
  printf "  %-14s %s\n" "$ten" "$kq"
  tong=$((tong+d)); hong=$((hong+h))
done
echo "  ──────────────────────────────"
if [ "$sap" -gt 0 ]; then echo "  ⚠ $sap bài thử bị sập — mỗi bài tính là 1 hỏng"; fi
echo "  TỔNG: $tong đạt · $hong hỏng"
[ "$hong" -eq 0 ]
