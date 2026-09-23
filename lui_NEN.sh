#!/usr/bin/env bash
# Duong lui cua POS-NEN-v1
set -e
cp ".gitignore.truoc_NEN" ".gitignore"
cp "kiem_tra_truoc_khi_giao.js.truoc_NEN" "kiem_tra_truoc_khi_giao.js"
cp "server/database.js.truoc_NEN" "server/database.js"
cp "server/index.js.truoc_NEN" "server/index.js"
cp "server/routes/backup.js.truoc_NEN" "server/routes/backup.js"
cp "server/routes/orders.js.truoc_NEN" "server/routes/orders.js"
rm -f "server/utils/nhatKyDon.js" "server/routes/don-mo-rong.js"
cp "TIEN_DO_POS.json.truoc_NEN" "TIEN_DO_POS.json"   # P19 tro lai dang mo
echo "Da tra ve ban truoc POS-NEN-v1. Bang pos_order_log (neu da tao) de nguyen — vo hai."
