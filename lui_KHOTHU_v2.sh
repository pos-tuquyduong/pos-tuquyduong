#!/usr/bin/env bash
# Duong lui cua POS-KHOTHU-v2
set -e
for f in server/database.js server/utils/sxApi.js cong_cu/thu_p1.js \
         kiem_tra_truoc_khi_giao.js CHECKLIST_CODE.md CLAUDE.md; do
  if [ -f "$f.truoc_KHOTHU2" ]; then cp "$f.truoc_KHOTHU2" "$f"; echo "  tra ve: $f"; fi
done
rm -f server/ketNoiKho.js && echo "  xoa:    server/ketNoiKho.js"
echo "Xong. Kho thu data/pos_thu.db van con, khong anh huong gi."
