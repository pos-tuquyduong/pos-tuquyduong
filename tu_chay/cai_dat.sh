#!/usr/bin/env bash
# cai_dat.sh — CHỦ QUÁN gõ trong Shell Replit (KHÔNG chạy trong Claude Code):
#
#   bash tu_chay/cai_dat.sh
#
# Chép tu_chay/ (trừ cai_dat.*) vào .claude/tu_chay/, ghép hook người gác + luật
# deny vào .claude/settings.json, cài .git/hooks/pre-push. Chạy lại lần hai
# không đổi gì. In sẵn lệnh git add / git commit. Chi tiết: tu_chay/cai_dat.js.
set -e
if ! command -v node >/dev/null 2>&1; then
  echo "✗ Không thấy node — không cài được." >&2
  exit 1
fi
exec node "$(cd "$(dirname "$0")" && pwd)/cai_dat.js" "$@"
