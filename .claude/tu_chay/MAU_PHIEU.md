# <MÃ> — <tên việc>

<!-- MẪU PHIẾU tu-chay (THIET_KE.md B5). Chat soạn, chủ quán đặt vào viec/<MÃ>/phieu.md trên nhánh
     viec/<MÃ> và commit "PHIEU: <MÃ>". Máy mây gọi /lam-viec <MÃ>. Phiếu KHÔNG ai trong Claude Code sửa được.

     MÃ việc: chữ, số, dấu chấm, gạch dưới, gạch nối. KHÔNG chứa "main" và KHÔNG chứa "-d" hay "-f"
     (kể cả hoa: MAIN, -D, -F) — luật deny lớp 1 (Bash(git push *main*), *-d*, *-f*) sẽ chặn oan lệnh push
     nhánh việc. Ví dụ tốt: P7-TAB-NHOM, TU-CHAY-3.

     File trong .github/ máy KHÔNG sửa được (file cấm). Cổng PR (.github/workflows/cong.yml) do chủ quán
     cài bằng bash tu_chay/cai_dat.sh từ nguồn tu_chay/cong_github.yml. -->

**Chờ duyệt kế hoạch:** viết `viec/<MÃ>/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
<Bỏ dòng trên khi chủ quán muốn máy làm thẳng, không chờ duyệt kế hoạch.>

## Mục tiêu
<Một đoạn: quầy được gì sau việc này. Vì sao làm bây giờ.>

## Nghiệm thu
<Mỗi ca cụ thể, kiểm được: số tiền, bill, khách, lệnh. Chia nhóm A, B, C… để kế hoạch ánh xạ 1-1.>
- Cho qua / phải chạy được: …
- Phải chặn / phải báo lỗi: …
- Luồng hợp lệ phải KHÔNG bị chặn (K5): …

## Phạm vi
<Mỗi dòng một đường dẫn hoặc glob, KỂ CẢ file bài thử. Mọi dòng ở mục này đều được hiểu là đường dẫn.>
<File luật (kiem_tra_truoc_khi_giao.js, CHECKLIST_CODE.md, ban_mau_pos/**, tu_chay/**) và mọi file mới
 trong tu_chay/ phải ghi ĐÚNG TÊN từng file — glob chung như tu_chay/** KHÔNG mở được file luật.>
- viec/<MÃ>/**
- <đường dẫn>

## Bài thử đỏ
<TUỲ CHỌN — chỉ ghi khi phiếu cho miễn "bài thử phải đỏ trên code gốc" (cổng PR A5). Một dòng:>
không — <lý do>

## Ngân sách
<Khoảng số dòng thêm/bớt, ví dụ "~80 dòng code + ~150 dòng thử". Vượt 1,5 lần thì phải giải thích.>

## Đổi cấu trúc DB
không
<hoặc: có — mô tả; chỉ được THÊM bảng/cột, không xoá, không đổi tên>

## Thư viện mới
không

## Cấm
<Thêm nếu có. Mặc định luôn áp dụng: không sửa .claude/, không merge, không tạo PR, không đụng main,
 chỉ push đúng git push -u origin viec/<MÃ>, không sửa sổ việc, không chạy patch_*.py.>
