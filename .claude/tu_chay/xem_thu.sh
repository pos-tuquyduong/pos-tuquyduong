#!/usr/bin/env bash
# xem_thu.sh — CHỦ QUÁN gõ trong Shell Replit (KHÔNG chạy trong Claude Code):
#
#   bash tu_chay/xem_thu.sh TU-CHAY-9     # sang viec/TU-CHAY-9 mới nhất trên origin, build, kiểm, rồi bấm Run
#   bash tu_chay/xem_thu.sh main          # quay về main mới nhất
#
# Từ chối, KHÔNG đổi gì, khi: chạy trong Claude Code · file đã theo dõi đang bị sửa (trừ client/dist/) ·
# nhánh không có trên origin · nhánh ở máy lệch, không fast-forward được. File chưa theo dõi (??) không cản.
# Chỉ npm ci khi lockfile đổi hoặc chưa có node_modules. Build xong mà client/dist/ khác bản commit → báo,
# trả dist về bản commit (git clean chỉ trong client/dist/), không bảo bấm Run.
# Toàn bộ nằm trong hàm chinh: bash đọc xong cả hàm rồi mới chạy, nên checkout đổi chính file này không làm hỏng.

tra_dist() {
  git checkout -q HEAD -- client/dist && git clean -fdq -- client/dist
}

bam_lock() {
  git rev-parse -q --verify "HEAD:$1" 2>/dev/null
}

ci_neu_can() { # $1 thư mục, $2 lockfile, $3 băm lockfile trước khi đổi nhánh
  if [ "$(bam_lock "$2")" = "$3" ] && [ -d "$1/node_modules" ]; then return 0; fi
  echo "· npm ci ở $1 (lockfile đổi hoặc chưa cài)"
  (cd "$1" && npm ci) || { echo "✗ npm ci ở $1 hỏng — KHÔNG bấm Run" >&2; return 1; }
}

chinh() {
  if [ -n "$CLAUDECODE" ] || [ -n "$CLAUDE_CODE_CHILD_SESSION" ]; then
    echo "✗ xem_thu.sh chỉ chủ quán chạy, gõ trong Shell Replit — không chạy trong Claude Code." >&2
    return 1
  fi
  local ma="$1"
  if ! [[ "$ma" =~ ^[A-Za-z0-9._-]+$ ]]; then
    echo "✗ Cách dùng: bash tu_chay/xem_thu.sh <MÃ việc>   hoặc   bash tu_chay/xem_thu.sh main" >&2
    return 1
  fi
  local nhanh="viec/$ma"
  [ "$ma" = main ] && nhanh=main
  local goc
  goc=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "✗ Không ở trong kho git." >&2; return 1; }
  cd "$goc" || return 1

  # 1. Kiểm hết — chưa đổi gì
  local sua
  sua=$(git status --porcelain --untracked-files=no | grep -v '^.. client/dist/')
  if [ -n "$sua" ]; then
    echo "✗ Có file đang bị sửa — xử lý xong rồi chạy lại. Không đổi gì:" >&2
    echo "$sua" >&2
    return 1
  fi
  if ! git fetch -q origin "$nhanh" 2>/dev/null; then
    echo "✗ Nhánh $nhanh không có trên origin. Không đổi gì." >&2
    return 1
  fi
  local xa
  xa=$(git rev-parse -q --verify "refs/remotes/origin/$nhanh") || { echo "✗ Không đọc được origin/$nhanh." >&2; return 1; }
  if git rev-parse -q --verify "refs/heads/$nhanh" >/dev/null && ! git merge-base --is-ancestor "refs/heads/$nhanh" "$xa"; then
    echo "✗ Nhánh $nhanh ở máy lệch với origin (có commit riêng) — không fast-forward được. Không đổi gì." >&2
    return 1
  fi

  # 2. Đổi nhánh
  if [ -n "$(git status --porcelain -- client/dist)" ]; then
    tra_dist || return 1
    echo "· client/dist/ đang bị sửa ở máy — đã trả về bản commit."
  fi
  local lock_goc lock_client
  lock_goc=$(bam_lock package-lock.json)
  lock_client=$(bam_lock client/package-lock.json)
  if git rev-parse -q --verify "refs/heads/$nhanh" >/dev/null; then
    git checkout -q "$nhanh" || return 1
  else
    git checkout -q -b "$nhanh" --track "origin/$nhanh" || return 1
  fi
  git merge -q --ff-only "$xa" || return 1

  # 3. Thư viện, build, kiểm
  ci_neu_can . package-lock.json "$lock_goc" || return 1
  ci_neu_can client client/package-lock.json "$lock_client" || return 1
  echo "· build client…"
  (cd client && npm run build) || { echo "✗ Build client hỏng — KHÔNG bấm Run." >&2; return 1; }
  if [ -n "$(git status --porcelain -- client/dist)" ]; then
    tra_dist
    echo "✗ dist trong nhánh không khớp src — nhánh $nhanh chưa build/commit client/dist. Đã trả dist về bản commit." >&2
    echo "  Đừng chạy thử bản này; báo máy mây build lại rồi đẩy lên." >&2
    return 1
  fi
  node kiem_tra_truoc_khi_giao.js --day-du || { echo "✗ Bộ kiểm đỏ — đừng chạy thử bản này." >&2; return 1; }
  echo "✓ $nhanh @ $(git rev-parse --short HEAD) — bộ kiểm xanh, bấm Run"
}

chinh "$@"; exit $?
