#!/usr/bin/env bash
# cai_git_hook.sh — POS Tứ Quý Đường
#
# Cài hook pre-commit chạy kiem_tra_truoc_khi_giao.js. Có lỗi thì CHẶN commit.
#
#   bash cai_git_hook.sh          # cài / cài lại
#   bash cai_git_hook.sh --go     # gỡ hook
#
# VÌ SAO PHẢI CÓ SCRIPT NÀY: thư mục .git/hooks/ KHÔNG đi theo git. Clone repo
# về máy mới là mất hook. Phải chạy lại script này sau mỗi lần clone.
#
# ĐIỂM YẾU PHẢI BIẾT: `git commit --no-verify` qua mặt được hook. Nó chặn được
# NHẦM LẪN, không chặn được CỐ Ý. Đủ cho nhu cầu hiện tại.

set -e

GOC="$(cd "$(dirname "$0")" && pwd)"
HOOK="$GOC/.git/hooks/pre-commit"

if [ ! -d "$GOC/.git" ]; then
  echo "✗ Không thấy .git — chạy script này từ gốc repo POS."
  exit 1
fi

if [ "$1" = "--go" ]; then
  rm -f "$HOOK"
  echo "✓ Đã gỡ hook. Commit sẽ không còn được kiểm tự động."
  exit 0
fi

if [ ! -f "$GOC/kiem_tra_truoc_khi_giao.js" ]; then
  echo "✗ Không thấy kiem_tra_truoc_khi_giao.js ở gốc repo."
  exit 1
fi

cat > "$HOOK" <<'HET'
#!/usr/bin/env bash
# pre-commit — POS. Cài bằng: bash cai_git_hook.sh
# Gỡ bằng: bash cai_git_hook.sh --go
GOC="$(git rev-parse --show-toplevel)"
[ -f "$GOC/kiem_tra_truoc_khi_giao.js" ] || exit 0

# Không có node thì KHÔNG chặn. Chặn mọi commit bằng lỗi 127 khó hiểu còn tệ
# hơn là bỏ qua một lần kiểm — người dùng sẽ gỡ luôn hook.
if ! command -v node >/dev/null 2>&1; then
  echo "  ! Không thấy node — BỎ QUA kiểm tra tự động lần này."
  echo "    Nhớ chạy: node kiem_tra_truoc_khi_giao.js  trước khi push."
  exit 0
fi

node "$GOC/kiem_tra_truoc_khi_giao.js" || {
  echo ""
  echo "  ┌────────────────────────────────────────────────────────────┐"
  echo "  │  COMMIT BỊ CHẶN — sửa các mục ✗ ở trên rồi commit lại.     │"
  echo "  │  Đọc CHECKLIST_CODE.md để biết vì sao mục đó tồn tại.      │"
  echo "  │                                                            │"
  echo "  │  Nếu CHẮC CHẮN muốn bỏ qua:  git commit --no-verify        │"
  echo "  └────────────────────────────────────────────────────────────┘"
  echo ""
  exit 1
}
HET

chmod +x "$HOOK"

echo "✓ Đã cài $HOOK"
echo ""
echo "Từ giờ mỗi lần git commit sẽ tự chạy 26 phép kiểm; có lỗi thì chặn."
echo ""
echo "Nhớ:"
echo "  · Hook KHÔNG đi theo git — clone về máy mới phải chạy lại script này."
echo "  · Trước khi push nên chạy thêm bản đầy đủ (kiểm dist có khớp src không):"
echo "      node kiem_tra_truoc_khi_giao.js --day-du"
echo ""
echo "Chạy thử ngay bây giờ:"
node "$GOC/kiem_tra_truoc_khi_giao.js" || true
