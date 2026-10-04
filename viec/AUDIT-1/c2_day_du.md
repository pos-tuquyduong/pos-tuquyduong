# AUDIT-1 — C2 ĐỦ: mỗi câu ghi ở 11 file routes tiền (86 đột biến bỏ câu)

HEAD b9759cf + sản phẩm, đo 04.10.2026. `python3 viec/AUDIT-1/dot_bien.py C2F` (cách `c2full`: tầng 1 giả lập 18 KB
+ thu_P26a + thu_P26b; SỐNG thì tầng 2 thu_P20 + thu_P21). Bỏ câu = thay callee bằng stub `(0?callee:STUB)(…)`.

Tổng **86 câu** (75 run/tx.run + 11 lời gọi ghiVi; bỏ ĐỊNH NGHĨA function ghiVi). **40 BẮT · 45 SỐNG · 1 LẠC · 0 HỎNG.**
LẠC = `C2F-orders-02` (bỏ INSERT pos_orders → FK gãy → giả lập SẬP; chạy lại -j1 vẫn LẠC — câu nền, "bỏ" tất sập).
60 đột biến P26b (logic/VÁ SAI) KHÔNG thay được việc này (bỏ TỪNG câu một cách hệ thống).

## SỐNG đụng TIỀN/ĐIỂM/VÍ/GÓI (lưới KHÔNG phủ — "ở quầy sẽ sai gì")

- **C2F-loyalty-01-insert-khach-app**: khách đổi quà bị TRỪ SAI/không trừ điểm (dòng redeem) — I8 chỉ soát điểm tích
- **C2F-loyalty-02-insert-khach-app**: mã giảm giá đổi-điểm đẻ sai mệnh giá/không đẻ — không KB nào kiểm discount_value của redeem
- **C2F-orders-05-update-quay**: dùng voucher khi BÁN mà used_count không tăng → mã dùng-một-lần DÙNG LẠI được (giả lập không có KB áp voucher)
- **C2F-orders-10-update-quay**: lấy hàng từ gói: customer_package_id của đơn không gán → sai liên kết gói
- **C2F-orders-11-insert-quay**: mua thẻ thành viên: pos_membership_purchases không ghi → thẻ trả tiền mà không có bản ghi
- **C2F-orders-21-update-quay**: trừ lượt giao của gói (delivered_qty) không chạy → khách lấy hàng từ gói quá số lượt
- **C2F-orders-23-update-quay**: đơn mua-gói: customer_package_id không gán
- **C2F-orders-24-delete-quay**: huỷ đơn mua thẻ: pos_membership_purchases không xoá → thẻ ảo còn lại
- **C2F-orders-25-update-quay**: huỷ/xoá đơn: hoàn lượt gói (delivered_qty) không chạy
- **C2F-orders-30-update-quay**: xoá đơn: lượt gói không hoàn
- **C2F-orders-32-update-quay**: xoá đơn mua-gói: delivered_qty của gói khác không chỉnh
- **C2F-packages-05-update-quay**: POS trừ lượt giao gói (deliver) không chạy → lấy quá số lượt gói
- **C2F-wallets-08-insert-quay**: đối soát ví khi ví CHƯA tồn tại: không tạo ví → số dư đối soát mất
- **C2F-refunds-05-update-quay**: không gắn balance_transaction_id vào yêu cầu hoàn → chỉ mất liên kết sổ (không mất tiền)
- **C2F-don-mo-rong-01-update-quay**: đổi cách trả: số cash/transfer không đổi → sai PHÂN LOẠI tiền (tổng không đổi)
- **C2F-discount-codes-05-update-quay**: /increment-usage không tăng used_count (endpoint riêng, chưa rõ có gọi ở quầy)

## SỐNG dọn dẹp / degraded (NHẸ — không mất tiền)
- stock_pending (orders-07/27/39): chỉ chạy khi SX lỗi; SX giả không lỗi nên KB không chạm.
- registrations (orders-13/14): ghi SĐT/ghi chú sang SX — không phải sổ tiền quầy.
- DELETE dọn khi xoá đơn (orders-22/31/35/36/37/38): để lại dòng mồ côi, không bất biến nào canh orphan; xoá đơn là thao tác hiếm/admin.

## SỐNG admin config (đúng như đã ghi — tạo/sửa/xoá gói·mã·khách·thưởng, KB không chạm)
- packages 01-06, discount-codes 02-04, rewards 02-03, signup-codes 05-06, customers-v2 01-05, damages-03.

## BẮT (40) — câu ghi đường tiền lõi được lưới phủ
Gồm: orders ghiVi/điểm/huỷ/xoá/tạo (bắt qua I3-I11/HTTP), refunds tạo/duyệt/từ chối/ghiVi mẹ, wallets nạp/trừ/điều chỉnh/đối soát,
damages báo hỏng, signup-codes chiếm mã/điểm/claim (thu_P20/giả lập), loyalty-03 voucher_grants (thu_P26a C8).

## Bảng đầy đủ 86 câu
- SỐNG `C2F-customers-v2-01-insert-khong-ro` — INSERT pos_customers
- SỐNG `C2F-customers-v2-02-update-quan-tri` — UPDATE pos_customers
- SỐNG `C2F-customers-v2-03-insert-quan-tri` — INSERT pos_customers
- SỐNG `C2F-customers-v2-04-update-quan-tri` — UPDATE pos_customers
- SỐNG `C2F-customers-v2-05-insert-quan-tri` — INSERT pos_customers
- BẮT  `C2F-damages-01-ghiVi-quan-tri` — ghiVi
- BẮT  `C2F-damages-02-insert-quan-tri` — INSERT pos_damage_logs
- SỐNG `C2F-damages-03-update-quan-tri` — UPDATE pos_damage_logs
- BẮT  `C2F-discount-codes-01-insert-quan-tri` — INSERT pos_discount_codes
- SỐNG `C2F-discount-codes-02-update-quan-tri` — UPDATE pos_discount_codes
- SỐNG `C2F-discount-codes-03-update-quan-tri` — UPDATE pos_discount_codes
- SỐNG `C2F-discount-codes-04-delete-quan-tri` — DELETE pos_discount_codes
- SỐNG `C2F-discount-codes-05-update-quay` — UPDATE pos_discount_codes
- SỐNG `C2F-don-mo-rong-01-update-quay` — UPDATE pos_orders
- SỐNG `C2F-loyalty-01-insert-khach-app` — INSERT pos_point_transactions
- SỐNG `C2F-loyalty-02-insert-khach-app` — INSERT pos_discount_codes
- BẮT  `C2F-loyalty-03-insert-khach-app` — INSERT pos_voucher_grants
- BẮT  `C2F-orders-01-ghiVi-quay` — ghiVi
- LẠC  `C2F-orders-02-insert-quay` — INSERT pos_orders
- BẮT  `C2F-orders-03-update-quay` — UPDATE pos_balance_transactions
- BẮT  `C2F-orders-04-insert-quay` — INSERT pos_order_items
- SỐNG `C2F-orders-05-update-quay` — UPDATE pos_discount_codes
- BẮT  `C2F-orders-06-insert-quay` — INSERT pos_point_transactions
- SỐNG `C2F-orders-07-insert-quay` — INSERT pos_stock_pending
- BẮT  `C2F-orders-08-insert-quay` — INSERT pos_customer_packages
- BẮT  `C2F-orders-09-update-quay` — UPDATE pos_customer_packages
- SỐNG `C2F-orders-10-update-quay` — UPDATE pos_orders
- SỐNG `C2F-orders-11-insert-quay` — INSERT pos_membership_purchases
- BẮT  `C2F-orders-12-update-quay` — UPDATE pos_customer_packages
- SỐNG `C2F-orders-13-update-quay` — UPDATE pos_registrations
- SỐNG `C2F-orders-14-insert-quay` — INSERT pos_registrations
- BẮT  `C2F-orders-15-insert-quay` — INSERT pos_signup_codes
- BẮT  `C2F-orders-16-update-quay` — UPDATE pos_orders
- BẮT  `C2F-orders-17-insert-quay` — INSERT pos_balance_transactions
- BẮT  `C2F-orders-18-update-quay` — UPDATE pos_orders
- BẮT  `C2F-orders-19-ghiVi-quay` — ghiVi
- BẮT  `C2F-orders-20-ghiVi-quay` — ghiVi
- SỐNG `C2F-orders-21-update-quay` — UPDATE pos_customer_packages
- SỐNG `C2F-orders-22-delete-quay` — DELETE pos_customer_packages
- SỐNG `C2F-orders-23-update-quay` — UPDATE pos_orders
- SỐNG `C2F-orders-24-delete-quay` — DELETE pos_membership_purchases
- SỐNG `C2F-orders-25-update-quay` — UPDATE pos_customer_packages
- BẮT  `C2F-orders-26-update-quay` — UPDATE pos_refund_requests
- SỐNG `C2F-orders-27-insert-quay` — INSERT pos_stock_pending
- BẮT  `C2F-orders-28-ghiVi-quay` — ghiVi
- BẮT  `C2F-orders-29-ghiVi-quay` — ghiVi
- SỐNG `C2F-orders-30-update-quay` — UPDATE pos_orders
- SỐNG `C2F-orders-31-delete-quay` — DELETE pos_customer_packages
- SỐNG `C2F-orders-32-update-quay` — UPDATE pos_customer_packages
- BẮT  `C2F-orders-33-delete-quay` — DELETE pos_order_items
- BẮT  `C2F-orders-34-delete-quay` — DELETE pos_refund_requests
- SỐNG `C2F-orders-35-delete-quay` — DELETE pos_damage_logs
- SỐNG `C2F-orders-36-delete-quay` — DELETE pos_promotion_usage
- SỐNG `C2F-orders-37-delete-quay` — DELETE pos_invoice_logs
- SỐNG `C2F-orders-38-delete-quay` — DELETE pos_orders
- SỐNG `C2F-orders-39-insert-quay` — INSERT pos_stock_pending
- SỐNG `C2F-packages-01-insert-quan-tri` — INSERT pos_packages
- SỐNG `C2F-packages-02-update-quan-tri` — UPDATE pos_packages
- SỐNG `C2F-packages-03-update-quan-tri` — UPDATE pos_packages
- SỐNG `C2F-packages-04-delete-quan-tri` — DELETE pos_packages
- SỐNG `C2F-packages-05-update-quay` — UPDATE pos_customer_packages
- SỐNG `C2F-packages-06-update-quan-tri` — UPDATE pos_customer_packages
- BẮT  `C2F-refunds-01-insert-quay` — INSERT pos_refund_requests
- BẮT  `C2F-refunds-02-update-quay` — UPDATE pos_refund_requests
- BẮT  `C2F-refunds-03-update-quay` — UPDATE pos_orders
- BẮT  `C2F-refunds-04-ghiVi-quay` — ghiVi
- SỐNG `C2F-refunds-05-update-quay` — UPDATE pos_refund_requests
- BẮT  `C2F-refunds-06-ghiVi-quay` — ghiVi
- BẮT  `C2F-refunds-07-update-quay` — UPDATE pos_refund_requests
- BẮT  `C2F-rewards-01-insert-quan-tri` — INSERT pos_reward_catalog
- SỐNG `C2F-rewards-02-update-quan-tri` — UPDATE pos_reward_catalog
- SỐNG `C2F-rewards-03-update-quan-tri` — UPDATE pos_reward_catalog
- BẮT  `C2F-signup-codes-01-update-khach-app` — UPDATE pos_signup_codes
- BẮT  `C2F-signup-codes-02-insert-khach-app` — INSERT pos_point_transactions
- BẮT  `C2F-signup-codes-03-update-khach-app` — UPDATE pos_signup_codes
- BẮT  `C2F-signup-codes-04-insert-khach-app` — INSERT pos_discount_codes
- SỐNG `C2F-signup-codes-05-update-quan-tri` — UPDATE pos_signup_codes
- SỐNG `C2F-signup-codes-06-delete-quan-tri` — DELETE pos_discount_codes
- BẮT  `C2F-wallets-01-update-quay` — UPDATE pos_wallets
- BẮT  `C2F-wallets-02-insert-quay` — INSERT pos_wallets
- BẮT  `C2F-wallets-03-insert-quay` — INSERT pos_balance_transactions
- BẮT  `C2F-wallets-04-ghiVi-quay` — ghiVi
- BẮT  `C2F-wallets-05-ghiVi-quay` — ghiVi
- BẮT  `C2F-wallets-06-ghiVi-quay` — ghiVi
- BẮT  `C2F-wallets-07-update-quay` — UPDATE pos_wallets
- SỐNG `C2F-wallets-08-insert-quay` — INSERT pos_wallets
