#!/usr/bin/env bash
# Duong lui cua POS-CHUATHU-v1
set -e
cp "client/src/components/InvoicePreview.jsx.truoc_CHUATHU" "client/src/components/InvoicePreview.jsx"
cp "client/src/pages/Orders.jsx.truoc_CHUATHU" "client/src/pages/Orders.jsx"
cp "client/src/pages/Sales.jsx.truoc_CHUATHU" "client/src/pages/Sales.jsx"
echo "Da tra 3 tep ve ban truoc patch. Nho: cd client && npm run build && cd .."
