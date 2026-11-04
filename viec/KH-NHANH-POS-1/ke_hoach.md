# Kế hoạch KH-NHANH-POS-1

Việc [Th], không chờ duyệt kế hoạch.

## Phương án
- **A (chọn):** thêm `maxAge` vào lời gọi `cors(...)` sẵn có ở `server/index.js` (1 file, ~3 dòng gồm hằng có tên + chú thích). Một chỗ cài cho mọi đường, đúng điều phiếu chấp nhận.
- B: gắn `cors` riêng cho `/api/kh` với `maxAge`. Hai chỗ cài, thêm ~8 dòng, phải giữ hai bản `origin/methods/allowedHeaders` đồng bộ — bỏ.

## Ca thử ↔ Nghiệm thu (`cong_cu/thu_KHNHANHPOS1.js`, máy chủ thật)
- A → A1 (GET + authorization), A2 (POST + authorization,content-type): `Access-Control-Max-Age: 7200`.
- B → B1 origin `*`, B2 methods, B3 allowedHeaders, B4 OPTIONS vẫn 204.
- K5 → K5a GET thường vẫn 200 + origin `*`; K5b GET thường không mang Max-Age. Bộ `npm test` xanh.

## Đường song song / luồng hợp lệ (K4, K5)
`grep cors server/` — chỉ `server/index.js` cài CORS; không route nào đặt `Access-Control-*` riêng. Luồng hợp lệ (quầy cùng gốc, App KH, yêu cầu thường) không bị chặn vì không đổi origin/methods/headers.

## Đột biến (`dot_bien.py`)
BV-BO-MAXAGE · VS-MAXAGE-SAI-SO · VS-MAXAGE-NOI-NGOAI-CORS · VS-DOI-ORIGIN · VS-DOI-HEADERS.
