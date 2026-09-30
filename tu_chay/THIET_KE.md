# Hệ thống tự chạy TQD — thiết kế v1.1 (27.09.2026)

Đây là bộ khung dùng chung cho Claude Code: chạy ở POS trước, sau đó nhân sang SX và dùng được cho app khác.

Tài liệu có ba phần:
- **Phần A** — cho chủ quán.
- **Phần B** — đặc tả kỹ thuật cho Claude Code.
- **Phần C** — danh sách việc và tiêu chí nghiệm thu.

## Đổi so với v1 (rà soát lại 27.09)

1. **Người gác** chuyển từ "cấm những gì biết là xấu" sang "**chỉ cho những gì cần**". Lệnh lạ bị chặn mặc định.
2. **Phép thử hai chiều do máy tự chạy.** Bài thử mới phải ĐỎ trên code cũ và XANH trên code mới. Việc "chứng minh đỏ" không còn dựa vào lời AI.
3. **Giả lập có kiểm bất biến sổ sách**, và dùng lại 6 câu SQL đã chạy trên production ngày 27.09. Cách giả lập được viết cụ thể (B10).
4. **Có luật "đường ngắn nhất":**
   - Phiếu ghi ngân sách dòng code.
   - Kế hoạch phải so hai phương án.
   - Cổng cảnh báo khi code phình.
5. **Bớt file và bớt lệnh:**
   - hai lệnh giao việc và làm tiếp gộp thành một `chay.sh`.
   - Phạm vi nằm ngay trong phiếu, không tách file riêng.
   - Câu hỏi và phát hiện gộp vào `trang_thai.md`.
6. **Nói rõ "hai lưới":** người gác chặn **trước khi làm**, cổng bắt **trước khi lên production**. Lọt lưới này thì lưới kia bắt.

---

# PHẦN A — CHO CHỦ QUÁN

## A1. Bạn chạm vào hệ thống ở hai chỗ

1. **Chốt phiếu việc với chat.** Phiếu ghi: làm gì · thế nào là đạt (bằng ví dụ tiền, bill cụ thể) · được sửa file nào · khoảng bao nhiêu dòng code.
2. **Gõ `day_len.sh`** sau khi đọc biên bản, rồi thử quầy.

Máy chỉ dừng lại gọi bạn trong 5 trường hợp:
- có câu hỏi nghiệp vụ;
- quá 3 vòng sửa mà vẫn chưa đạt;
- cần sửa ngoài phạm vi phiếu;
- cổng đóng mà máy không tự gỡ được;
- việc xong, chờ bạn đưa lên production.

## A2. Dây chuyền 7 trạm

| Trạm | Ai làm | Ra cái gì |
|---|---|---|
| 1. Phiếu | Bạn + chat | `phieu_<MÃ>.md` |
| 2. Chạy | Bạn gõ `chay.sh phieu_<MÃ>.md` | Nhánh mới, phiếu cất vào kho, Claude Code tự chạy |
| 3. Kế hoạch | Claude Code | `ke_hoach.md`: so **hai phương án**, chọn cách ít dòng nhất mà vẫn đạt nghiệm thu |
| 4. Làm + thử | Claude Code | Code + bài thử + giả lập |
| 5. Soát độc lập | Một phiên AI **khác**, làm trên **bản sao** | `bien_ban_soat.json`, do script ghi |
| 6. Cổng | Script, không có AI | CỔNG MỞ / CỔNG ĐÓNG kèm lý do |
| 7. Lên production | Bạn gõ `day_len.sh` | Gộp → đẩy → bạn thử quầy → máy ghi sổ `xong` |

## A3. Bốn lớp gác (vì sao dám để máy tự chạy)

| Lớp | Là gì | Ví dụ đời thường | Tính chất |
|---|---|---|---|
| 1. Luật cấm trong `settings.json` | Danh sách lệnh cấm tuyệt đối | Khoá két | Cứng. Chặn ở **mọi chế độ** |
| 2. Người gác (`nguoi_gac.js`) | Script chạy **trước mỗi hành động**. Chỉ cho các lệnh có trong danh sách, và chỉ cho sửa các file có trong phiếu | Bảo vệ cầm danh sách khách mời: không có tên thì không vào | Cứng. Lệnh lạ bị chặn mặc định |
| 3. Auto mode (bộ phân loại của Anthropic) | Một AI thứ hai xem xét các hành động còn lại | Quản lý ca | Mềm. Thay bạn bấm Yes cho việc bình thường |
| 4. Cổng + bộ kiểm trước commit | Script kiểm kết quả cuối: phạm vi, bài thử, phép thử hai chiều, giả lập, biên bản | Nếm món trước khi ra | Cứng. Không có AI nào quyết ở đây. Là **lưới thứ hai**: thứ gì lọt người gác thì bị cổng bắt |

Có ba điểm chốt làm hệ thống an toàn:
- **Người làm không tự chấm điểm cho mình.** Biên bản soát do script ghi, người làm không được sửa.
- **Người soát không sửa được code thật.** Nó chỉ làm trên một bản sao.
- **Không AI nào tự đẩy lên production** ở giai đoạn 1.

## A4. Tiên lượng tình huống — máy tự xử thế nào

| # | Tình huống | Hệ thống làm gì |
|---|---|---|
| 1 | Sửa file có trong phạm vi phiếu | Tự làm |
| 2 | Muốn sửa file ngoài phạm vi | **Bị chặn.** Ghi vào mục Câu hỏi trong `trang_thai.md`, làm tiếp phần khác được |
| 3 | Gặp câu hỏi nghiệp vụ (ví dụ: huỷ đơn thì điểm âm hay trừ về 0) | **Không đoán.** Ghi mục Câu hỏi, dừng việc, báo bạn |
| 4 | Bài thử đỏ | Tự sửa |
| 5 | Soát KHÔNG ĐẠT | Tự sửa rồi soát lại, tối đa 3 vòng. Quá 3 vòng thì dừng và trình lỗi |
| 6 | Bài thử mới không đỏ được trên code cũ ("xanh oan") | **Cổng tự phát hiện** bằng phép thử hai chiều, cổng đóng. Phải viết lại bài thử |
| 7 | Muốn thêm thư viện npm | Dừng, hỏi bạn (để giữ phần mềm gọn) |
| 8 | Đổi cấu trúc bảng dữ liệu | Chỉ được **thêm** (cột, bảng), chạy lại nhiều lần không sao. Phiếu phải ghi rõ mới được làm |
| 9 | Đụng tiền, điểm, ví, nợ | Bắt buộc có bài thử bằng số tiền cụ thể, có ca hai người cùng bấm, có phá thử |
| 10 | Muốn push, merge, đụng `main`, `--no-verify` | Bị chặn ở lớp 1 và lớp 2 |
| 11 | Muốn đọc hay sửa `.env`, khoá, mật khẩu | Bị chặn |
| 12 | Muốn chạy SQL ghi vào dữ liệu thật | Bị chặn. Chỉ bạn được chạy, và chỉ câu chỉ-đọc do chat soạn |
| 13 | Muốn xoá file | Chỉ được xoá trong thư mục nháp |
| 14 | Muốn tự đánh `xong` trong sổ việc | Bị chặn. Chỉ `day_len.sh` ghi, sau khi bạn xác nhận quầy ổn |
| 15 | Muốn sửa luật gác, phiếu, phạm vi, biên bản | Bị chặn. Đổi luật là việc riêng, bạn duyệt |
| 16 | Replit khởi động lại giữa chừng | Mở lại bằng `chay.sh <MÃ>`. Máy đọc `trang_thai.md` trong kho và làm tiếp |
| 17 | Đầy đĩa | Chỉ dùng **một** bản sao, xoá khi xong. Cổng kiểm dung lượng |
| 18 | Auto mode chặn nhầm 3 lần liên tiếp | Claude Code tự quay lại hỏi. Bạn chép màn hình gửi chat |
| 19 | Thấy lỗi ngoài phạm vi | Không sửa. Ghi vào mục Phát hiện trong `trang_thai.md`, cuối việc chuyển thành việc mới trong sổ |
| 20 | Production lỗi sau khi đẩy | `day_len.sh` in sẵn lệnh lùi. Bạn chạy, rồi báo chat |

## A5. Khi nào máy dừng lại gọi bạn 

Chỉ có 5 trường hợp:
1. Có câu hỏi nghiệp vụ.
2. Quá 3 vòng sửa vẫn chưa đạt.
3. Cần sửa ngoài phạm vi và phần đó chặn cả việc.
4. Cổng đóng vì lý do nó không tự sửa được.
5. **Việc đã xong, chờ bạn lên production.**

## A6. Đường ngắn nhất được giữ bằng gì

1. **Phiếu có ngân sách dòng code.** Vượt quá 1,5 lần thì cổng cảnh báo, và biên bản phải giải thích vì sao.
2. **Kế hoạch bắt buộc so hai phương án**, chọn phương án ít dòng nhất mà vẫn đạt mọi ca nghiệm thu.
3. **Người soát phải trả lời câu "có cách ngắn hơn không"** và ghi gợi ý.
4. **Không thêm thư viện** nếu phiếu không cho. Không tiện tay sửa thứ ngoài phạm vi.
5. **Báo cáo luôn có số dòng thêm/bớt**, để bạn thấy phần mềm đang gọn đi hay đang béo lên.

## A7. Tự soát lỗi — sáu tầng, mỗi tầng bắt một loại lỗi

| Tầng | Ai | Bắt loại lỗi gì |
|---|---|---|
| 1. Bộ kiểm trước commit (đã có, 48 phép) | Máy | Lỗi quen thuộc đã từng gặp |
| 2. Bài thử của việc | Máy | Ca nghiệm thu không chạy đúng |
| 3. Phép thử hai chiều | Máy | Bài thử "xanh oan": không bắt được lỗi cũ |
| 4. Giả lập + kiểm bất biến | Máy | Tiền, điểm, ví, kho lệch khi chạy cả ngày, khi hai người cùng bấm, khi mạng chậm |
| 5. Người soát độc lập | AI khác, làm trên bản sao | Ca bị quên, đường song song, cách làm rườm rà |
| 6. Thử quầy | Bạn | Thứ chỉ mắt người thấy |

Tầng 1–4 là máy chạy thật, **không tin lời AI**. Tầng 5 là AI, nên chỉ được bổ sung chứ không được thay tầng 1–4.

## A8. Lộ trình triển khai

| Việc | Nội dung | Cách làm |
|---|---|---|
| TU-CHAY-1 | Người gác + luật cấm + bài phá thử | Chế độ tay như bây giờ (chưa có người gác thì chưa tự chạy được) |
| TU-CHAY-2 | Phiếu việc, `chay.sh`, quy trình `/lam-viec` | Chế độ tay |
| TU-CHAY-3 | Soát độc lập trên bản sao + cổng + `day_len.sh` | Chế độ tay |
| TU-CHAY-4 | Giả lập quầy POS + kiểm bất biến sổ sách | Chế độ tay |
| Chạy thử | **P20b** chạy theo cách mới. Bạn xem màn hình nhưng không bấm | Tự chạy, có giám sát |
| Nhân sang SX | Chép bộ khung, điền `cau_hinh.json` của SX | Tự chạy |
| Giai đoạn 2 | Sau khoảng 5 việc liên tiếp sạch, cân nhắc cho `day_len.sh` tự chạy | Bạn quyết |

## A9. Quyết định — đã chọn mặc định, bạn đổi được

1. **Nút lên production giữ ở bạn** trong giai đoạn 1. Lý do: POS cầm tiền thật của khách.
2. **Tối đa 3 vòng sửa** mỗi việc.
3. **Bộ khung gốc nằm trong kho POS** (`.claude/tu_chay/`). Khi có app thứ ba thì tách ra kho riêng.

## A10. Nói thẳng các giới hạn

- Auto mode **không bảo đảm an toàn tuyệt đối**. Đó là lý do có lớp 1, lớp 2 và cổng.
- Luật cấm dạng chữ có thể bị lách bằng cách viết lệnh vòng vèo. Người gác bắt được phần lớn, và **khi không hiểu một lệnh thì nó chặn**. Bài phá thử (B11) giữ cho người gác không bị hở dần theo thời gian.
- AI soát cũng có thể sai. Vì vậy cổng dựa trên **bài thử chạy thật và đột biến**, không dựa vào lời AI.
- Thử quầy sau khi đẩy **vẫn là việc của bạn**. Máy không thay được mắt người ở quầy.
- Hệ thống được dựng để chặn **sai sót và đi tắt** của AI, không phải để chống một AI cố tình gian lận. Lớp chặn cuối cho trường hợp đó là: auto mode theo dõi, cổng kiểm bằng máy, và bạn đọc biên bản trước khi gõ `day_len.sh`.

---

# PHẦN B — ĐẶC TẢ KỸ THUẬT

**Nguyên tắc chung:**
- Chỉ dùng Node và bash có sẵn, **không thêm thư viện**.
- Script **chạy lại nhiều lần không sao** và **fail-closed**: không chắc thì chặn.
- Chữ hiện cho người dùng bằng tiếng Việt.
- Trước khi viết cấu hình Claude Code, **tra tài liệu hiện hành** (code.claude.com/docs: hooks, permissions, permission-modes, headless) và ghi nguồn vào kế hoạch.

## B1. Cấu trúc

```
.claude/
  settings.json              # lớp 1: permissions.deny + khai báo hook
  tu_chay/                   # BỘ KHUNG DÙNG CHUNG (giống nhau mọi kho)
    PHIEN_BAN                # "tu-chay 1.1.0"
    THIET_KE.md              # tài liệu này
    cau_hinh.json            # RIÊNG TỪNG KHO — thứ duy nhất khác nhau giữa các app
    nguoi_gac.js             # hook PreToolUse (B3)
    thu_nguoi_gac.js         # bài phá thử người gác (B11)
    chay.sh                  # chủ quán: giao việc mới / làm tiếp việc dở (B5)
    soat.sh                  # dựng bản sao, chạy phiên soát riêng, ghi biên bản (B7)
    cong.js                  # cổng (B8)
    day_len.sh               # chủ quán: cổng → gộp → đẩy → hỏi quầy → ghi sổ (B9)
  skills/lam-viec/SKILL.md   # quy trình trạm 3→6 (B6)
viec/<MÃ>/                   # hồ sơ từng việc, commit vào kho
  phieu.md                   # agent KHÔNG sửa
  ke_hoach.md                # agent ghi
  trang_thai.md              # agent ghi: bước hiện tại · vòng sửa · ## Câu hỏi · ## Phát hiện
  bien_ban_soat.json         # chỉ soat.sh ghi
cong_cu/gia_lap/             # riêng từng app (B10)
.tu_chay_nhat_ky.jsonl       # nhật ký người gác (.gitignore)
```

## B2. `cau_hinh.json` — ví dụ POS

```json
{
  "app": "POS",
  "nhanh_chinh": "main",
  "lenh_bai_thu": ["npm test"],
  "lenh_kiem_day_du": ["node kiem_tra_truoc_khi_giao.js --day-du"],
  "lenh_gia_lap": [],
  "thu_muc_bai_thu": ["cong_cu/"],
  "so_viec": "TIEN_DO_POS.json",
  "cong_cu_so_viec": "dong_tien_do.py",
  "file_cam": [".env", ".env.*", ".replit", "TIEN_DO_*.json"],
  "ten_mien_production": ["pos-tuquyduong.io.vn", "turso.io"],
  "chuong_trinh_them": [],
  "so_vong_sua_toi_da": 3,
  "vuot_ngan_sach_canh_bao": 1.5,
  "kiem_sau_day_len": "log Render có dòng '✅ Đã kết nối Turso database (PRODUCTION)'"
}
```

`lenh_gia_lap` để trống cho tới TU-CHAY-4. Khi còn trống, cổng chỉ **CẢNH BÁO**, không chặn.

## B3. Người gác `nguoi_gac.js` (hook PreToolUse)

- **Matcher:** `Bash|Edit|Write|MultiEdit|NotebookEdit`.
- **Đầu vào:** JSON qua stdin.
- **Không phản đối:** exit 0, không in gì. Khi đó auto mode và lớp 1 xử tiếp.
- **Chặn:** in JSON với `permissionDecision: "deny"` và lý do tiếng Việt, **kèm hướng dẫn nên làm gì thay**.
- **Không bao giờ trả `allow`.**
- **Fail-closed:** lỗi bất kỳ, thiếu cấu hình, hoặc nhánh lạ đều bị chặn.
- **Ghi nhật ký** mọi quyết định.
- **Việc đang chạy** được xác định bằng nhánh `viec/<MÃ>` → đọc mục `## Phạm vi` trong `viec/<MÃ>/phieu.md`. Không ở nhánh `viec/*` thì **không được sửa file nào**.
- **Vai soát:** biến `TU_CHAY_VAI=soat` do `soat.sh` đặt. Khi đó chỉ được sửa bên trong `TU_CHAY_BAN_SAO`.

### Edit / Write

So bằng đường dẫn đã chuẩn hoá. Đường dẫn có `..` hoặc symlink trỏ ra ngoài kho → chặn.

| Luật | Quyết định |
|---|---|
| G1. `.claude/**`, `file_cam`, `viec/*/phieu.md`, `viec/*/bien_ban_soat.json` | Chặn |
| G2. Không có việc đang chạy | Chặn |
| G3. `viec/<MÃ>/ke_hoach.md`, `trang_thai.md` | Cho |
| G4. Khớp một dòng trong `## Phạm vi` | Cho |
| G5. Còn lại | Chặn: "Ngoài phạm vi — ghi vào mục Câu hỏi của trang_thai.md" |

### Bash — danh sách CHO PHÉP

1. **Tách lệnh thành từng đoạn**, tính cả đoạn nằm trong `$()`, dấu `` ` ``, `;`, `&&`, `||`, `|` và xuống dòng.
2. **Với mỗi đoạn:** bỏ phần gán biến ở đầu (`A=b`), lấy tên chương trình. Đường dẫn như `/usr/bin/git` thì quy về `git`.
3. **Chương trình phải nằm trong danh sách cho phép:** `git node npm python3 ls cat head tail wc grep sed awk sort uniq cut diff find echo printf date pwd du df mkdir cp mv rm tar ln sleep curl kill cd test true timeout`, cộng thêm `chuong_trinh_them` trong cấu hình.
4. **Những thứ giấu lệnh bị chặn luôn:** `sh -c`, `bash -c`, `eval`, `exec`, `source`, `xargs`, `env`, `sudo`. `bash <file>` chỉ được cho `.claude/tu_chay/*.sh` và `cong_cu/**/*.sh`.
5. **Chương trình được phép vẫn có luật con:**

| Chương trình | Chặn khi |
|---|---|
| `git` | `push`, `merge`, `rebase`, `reset`, `clean`, `stash`, `switch`, `config`, `remote`, `tag`, `filter-branch`, `update-ref`, `commit` kèm `-n`/`--no-verify`/`--amend`, `add` kèm `-A`/`--all`/`-u`/`.`, `checkout` trừ `checkout -b viec/*` và `checkout -- <file trong phạm vi>`, `branch` kèm `-D`/`-d`/`-f`/`-m`, `commit` khi nhánh không phải `viec/*` |
| `rm`, `mv`, `ln`, `tar -x`, `cp` | Đích không nằm trong nháp (`/tmp/claude-*/**/scratchpad/**` hoặc `$TU_CHAY_BAN_SAO`). Riêng `cp`/`mv` thì đích được phép thêm các file thuộc phạm vi |
| `sed` | Có `-i` |
| `find` | Có `-delete`, `-exec` |
| `python3` | Chạy file `patch_*.py`; gọi `ghi_tien_do`; chạy `dong_tien_do.py` kèm tham số ghi |
| `npm` | `install`/`i`/`add` kèm tên gói (`npm ci` thì cho) |
| `curl` | Ra ngoài `localhost`/`127.0.0.1`; hoặc gọi tới `ten_mien_production` |
| Mọi lệnh | Có chữ `.env`, `TOKEN`, `SECRET`, `API_KEY`; ghi (`>`, `>>`, `tee`) vào `.claude/`, `phieu.md`, `bien_ban_soat.json`, `file_cam`; `claude` kèm `--dangerously-skip-permissions`/`bypassPermissions`; `turso` |

**Lưới thứ hai:** lệnh như `node -e` vẫn có thể ghi file mà người gác không nhìn thấy. Chỗ hở đó được **cổng** bắt (B8, phép 2: mọi file đã đổi phải nằm trong phạm vi). Người gác chặn sớm, cổng chặn chắc.

## B4. Lớp 1 — `settings.json`

- Bỏ `disableAutoMode` và `defaultMode: "default"`. Bộ khung mở Claude Code bằng cờ `--permission-mode auto`, vì `defaultMode: "auto"` đặt trong settings dự án không có tác dụng.
- Giữ `model`.
- `permissions.deny` gồm: push, merge, reset, `--no-verify`, `.env`, `Edit(.claude/**)`, `Write(.claude/**)`. Tra cú pháp hiện hành, kiểm bằng `/permissions`.
- Dọn các cảnh báo `Write(...) is not matched`.
- **Không** thêm luật `ask`. Luật `ask` luôn bật hộp hỏi, kể cả ở auto mode.
- Kiểm xem Claude Code sandbox cho Bash có chạy được trên Replit không. Có thì bật làm lớp phụ. Không thì ghi lại và bỏ qua.

## B5. Phiếu và `chay.sh`

`phieu_<MÃ>.md` do chat soạn, gồm các mục:

```
# <MÃ> — <tên>
## Mục tiêu
## Nghiệm thu        (mỗi ca có số tiền, bill, khách cụ thể)
## Phạm vi           (mỗi dòng một đường dẫn hoặc glob, KỂ CẢ file bài thử)
## Ngân sách         (khoảng số dòng thêm/bớt, ví dụ "~80 dòng code + ~150 dòng thử")
## Đổi cấu trúc DB   (không / có: mô tả, chỉ được THÊM)
## Thư viện mới      (không)
## Cấm               (thêm, nếu có)
```

**`bash .claude/tu_chay/chay.sh phieu_<MÃ>.md`** — giao việc mới:
1. Kiểm: cây sạch, đang ở nhánh chính và khớp `origin`, nhánh `viec/<MÃ>` chưa có.
2. Kiểm phiếu đủ mục.
3. Tạo nhánh `viec/<MÃ>`.
4. Chuyển phiếu vào `viec/<MÃ>/phieu.md`, commit `PHIEU: <MÃ>`.
5. Chạy `claude --permission-mode auto "/lam-viec <MÃ>"`.

**`bash .claude/tu_chay/chay.sh <MÃ>`** — làm tiếp việc dở (ví dụ Replit vừa khởi động lại):
1. Kiểm nhánh đúng.
2. Chạy `claude --permission-mode auto "/lam-viec <MÃ> tiep"`.

## B6. Quy trình `/lam-viec`

**Luật cứng:**
- Sau mỗi bước ghi `trang_thai.md` và commit. `git add` luôn kèm tên file cụ thể.
- Gặp câu hỏi nghiệp vụ → ghi mục `## Câu hỏi` rồi **dừng**. Không đoán.
- Thấy lỗi ngoài phạm vi → ghi mục `## Phát hiện`, **không sửa**.

**Các bước:**
1. Đọc phiếu, `CLAUDE.md`, và code liên quan. Code là sự thật; hồ sơ hay trí nhớ có thể cũ.
2. Viết `ke_hoach.md`:
   - **Phương án A và B.** Mỗi phương án ghi số file, ước lượng số dòng, rủi ro.
   - Chọn phương án **ít dòng nhất mà vẫn đạt mọi ca nghiệm thu**. Chọn phương án nhiều dòng hơn thì phải có lý do cụ thể.
   - Danh sách ca thử (ánh xạ 1-1 với mục Nghiệm thu, cộng ca hai người cùng bấm nếu đụng tiền) và các đường song song cần canh.
3. Một agent phụ đọc-chỉ soát kế hoạch theo 4 câu:
   - Có đi ra ngoài phạm vi không?
   - Có cách ngắn hơn không?
   - Có ca nghiệm thu nào không có bài thử không?
   - Có đường song song nào bị bỏ sót không?
4. Viết bài thử **trước**, chạy thử, thấy nó **đỏ** trên code hiện tại. Sau đó mới viết code.
5. Viết code cho tới khi bài thử xanh. Chạy `lenh_bai_thu`, `lenh_kiem_day_du`, `lenh_gia_lap`.
6. Tự rà trước khi nhờ soát:
   - code chết;
   - trùng lặp;
   - hàm dùng một lần có đáng tách không;
   - so số dòng với ngân sách.
7. Chạy `bash .claude/tu_chay/soat.sh <MÃ>`. KHÔNG ĐẠT → sửa, rồi quay lại bước 5. Quá `so_vong_sua_toi_da` → dừng.
8. Chạy `node .claude/tu_chay/cong.js <MÃ>`. Cổng đóng → sửa nếu sửa được, không thì dừng.
9. Báo cáo 6 mục, kèm số dòng thêm/bớt so với ngân sách. **Dừng. Không đẩy.**

## B7. Soát độc lập `soat.sh <MÃ>`

1. Ghi lại HEAD và `git status --porcelain` của kho thật.
2. `git archive HEAD` vào `/tmp/soat_<MÃ>_<commit>`, nối sẵn `node_modules`. Đặt `TU_CHAY_VAI=soat` và `TU_CHAY_BAN_SAO`.
3. Chạy phiên **riêng** `claude -p` với cwd là bản sao, `--permission-mode dontAsk`, công cụ cho phép tối thiểu, `--output-format json`. Tra cú pháp hiện hành.
4. **Lời nhắn soát chuẩn** yêu cầu:
   - Đọc phiếu và diff so với nhánh chính.
   - Đối chiếu **từng ca Nghiệm thu** với bài thử.
   - Tìm **đường song song** chưa canh.
   - **Phá thử**: đảo từng chỗ sửa, bài thử phải đỏ.
   - Trả lời "**có cách ngắn hơn không**".
   - Trả về JSON `{ket_luan, loi[], chua_kiem[], goi_y_gon_hon[]}`.
5. Script (không phải AI) ghi `viec/<MÃ>/bien_ban_soat.json` kèm `commit`. Bản gốc lưu thêm ở `~/.tu_chay_soat/<MÃ>_<commit>.json`.
6. Kiểm lại kho thật: HEAD và status phải y như lúc bắt đầu, không thì KHONG_DAT. Xoá bản sao. Script tự commit biên bản.
7. Nếu auto mode chặn việc mở phiên con: ghi vào `trang_thai.md` rồi dừng. Chủ quán chạy `soat.sh` bằng tay.

## B8. Cổng `cong.js <MÃ>` — chỉ máy, không AI

1. Đang ở nhánh `viec/<MÃ>`, cây sạch (không tính các file `??` có sẵn từ trước).
2. **Phạm vi:** mọi file trong `git diff --name-only <chính>...HEAD` phải khớp mục Phạm vi hoặc nằm trong `viec/<MÃ>/`. Không có file nào khớp `file_cam` hay nằm trong `.claude/`.
3. **Bài thử xanh:** `lenh_bai_thu`, `lenh_kiem_day_du`, `lenh_gia_lap` đều thoát 0.
4. **Phép thử hai chiều:**
   - Dựng bản sao của **nhánh chính**.
   - Chép sang đó **những file bài thử mới hoặc đã sửa** (nằm trong `thu_muc_bai_thu`) của HEAD.
   - Chạy các file đó trên code cũ: **phải có ít nhất một ca đỏ**.
   - Xanh hết → HỎNG "bài thử không bắt được lỗi cũ (xanh oan)".
   - Việc không có bài thử mới (ví dụ chỉ sửa chữ) thì phiếu phải ghi `## Nghiệm thu: không cần bài thử` mới được bỏ qua phép này.
5. **Biên bản:** `ket_luan = DAT`. `commit` bằng HEAD trừ đúng commit biên bản. Bản trong kho khớp bản ở `~/.tu_chay_soat`.
6. **Câu hỏi:** mục `## Câu hỏi` của `trang_thai.md` phải trống hoặc mọi câu đã được trả lời.
7. **Gộp được:** nhánh chính trên `origin` là tổ tiên của HEAD.
8. **Ngân sách:** số dòng thêm vượt ngân sách × `vuot_ngan_sach_canh_bao` → CẢNH BÁO (không chặn). Biên bản phải giải thích lý do.
9. **Dung lượng:** `/tmp` còn chỗ, không còn bản sao cũ sót lại.
10. In **CỔNG MỞ** hoặc **CỔNG ĐÓNG**, kèm danh sách từng phép đạt hay hỏng.

## B9. `day_len.sh <MÃ>` (chủ quán chạy trong Shell)

1. Chạy `cong.js`. Cổng đóng → dừng.
2. In tóm tắt biên bản và số dòng. Hỏi `Đẩy lên production? (gõ CO)`.
3. Gộp và đẩy:
   ```
   git checkout <chính>
   git merge --ff-only viec/<MÃ>
   git push origin <chính>
   ```
4. In `kiem_sau_day_len` và **lệnh lùi soạn sẵn**. Hỏi `Thử quầy ổn? (gõ CO / KHONG)`.
5. Trả lời CO → tạo nhánh `so/<MÃ>`, gọi công cụ sổ việc đánh `xong` kèm commit, gộp fast-forward, đẩy.
6. Trả lời KHONG → in lệnh lùi, dừng.

## B10. Giả lập — "một ngày ở quầy trong 2 phút"

`cong_cu/gia_lap/chay.sh` là thứ duy nhất `lenh_gia_lap` gọi. Mỗi app viết phần này riêng; POS viết ở TU-CHAY-4.

**An toàn trước hết:**
- Thấy biến môi trường trỏ tới `ten_mien_production` hoặc có khoá thật → **từ chối chạy**.
- Luôn dùng **DB tệp tạm** trong `/tmp`, tạo mới mỗi lần.
- Replit của POS vốn đã dùng kho thử (`POS-KHOTHU-v2`). Giả lập vẫn tự kiểm lại, không dựa vào điều đó.

**Dựng sân khấu:**
1. Bật **máy chủ thật** của app (đúng code sẽ lên production) ở cổng riêng.
2. Bật một **SX giả**: trả tồn kho, và ghi lại mọi lệnh trừ/hoàn kho kèm vân tay.
3. Bật **độ trễ mạng giả** ~40ms, giống Turso thật. Dùng lại `tre_mang.cjs` của bộ thử P19. Đây là bài học P19: không có trễ thì lỗ thu hai lần không lộ ra.
4. Nạp **dữ liệu mẫu cố định**:
   - 3 khách: một khách mới, một khách quen có ví 200.000đ, một khách đang nợ 50.000đ;
   - 5 món;
   - 1 gói;
   - cấu hình điểm và mã bill như production.

**Kịch bản quầy.** Gọi API đúng như thao tác của nhân viên:
1. Bán tiền mặt 45.000đ.
2. Chuyển khoản.
3. "Chưa thu" rồi thu.
4. Ghi nợ rồi trả nợ.
5. Huỷ đơn.
6. Hoàn tiền.
7. Khách mới dùng mã in trên bill (bill đã thu → được; bill chưa thu → bị từ chối).
8. Nạp ví rồi tiêu ví.
9. Mua gói.
10. **Hai người cùng bấm thu một bill.**
11. **Hai người cùng nhập một mã.**

Việc mới thêm kịch bản mới vào đây. Kịch bản cũ không bao giờ bị xoá, vì chúng là lưới chống lỗi quay lại.

**Kiểm bất biến sổ sách.** Sau **mỗi** kịch bản và ở cuối, chạy các câu SQL chỉ đọc trên DB giả. Tất cả phải ra **0 dòng lệch**:

| # | Bất biến | Nguồn |
|---|---|---|
| I1 | Mã bill chỉ được dùng trên đơn đã thu, chưa huỷ | câu (a), (b) ngày 27.09 |
| I2 | Không có mã bill mồ côi mới | câu (c) |
| I3 | Không có đơn đã thu mà trạng thái lạ | câu (d) |
| I4 | Số dư ví = tổng các giao dịch thuộc danh sách trắng | câu (e) |
| I5 | Không có loại giao dịch ví lạ | câu (f) |
| I6 | Mỗi đơn thu **đúng một lần** (tổng đã thu = tổng đơn) | P19 |
| I7 | Mỗi vân tay trừ kho SX giả nhận **đúng một lần** | vân tay |
| I8 | Điểm khách = tổng dòng điểm | P22 sẽ dùng |
| I9 | Mỗi thao tác tiền có một dòng nhật ký đơn | P19 |

Kết quả in dạng: `Giả lập: 11 kịch bản · 9 bất biến · ĐẠT`, hoặc chỉ đúng kịch bản nào làm bất biến nào lệch, bao nhiêu tiền.

**Việc thay đổi giao diện** chạy thêm bộ thử của bản mẫu (`ban_mau_pos`, 119 phép) cho luồng bấm.

## B11. Bài phá thử người gác `thu_nguoi_gac.js`

- **Phải chặn:** mỗi luật ở B3 thử ít nhất 2 cách viết:
  - viết thẳng;
  - qua `$()`, dấu `` ` ``, `&&`, `;`;
  - thêm khoảng trắng;
  - `git -C . push`, `/usr/bin/git push`, `sh -c "git push"`, `eval`, `xargs`;
  - `rm -rf ../x`, `rm` qua symlink;
  - `Edit a/../.env`;
  - `echo >> viec/X/phieu.md`;
  - chương trình không có trong danh sách (`perl`, `ruby`).
- **Phải cho qua:**
  - `node cong_cu/thu_P20.js`, `npm test`;
  - `git add <file trong phạm vi>`, `git commit -m` trên nhánh `viec/*`;
  - `rm -r` trong thư mục nháp;
  - `Edit` file trong phạm vi và `ke_hoach.md`;
  - `S=$(pwd)` rồi `ls $S`.
- **Fail-closed:** JSON hỏng, thiếu cấu hình, nhánh lạ → chặn.
- **Đột biến:** tắt từng luật một, phải đỏ ít nhất một ca.
- Bài này nằm trong bộ kiểm trước commit.

## B12. Nhân sang kho khác

1. Chép `.claude/tu_chay/` (trừ `cau_hinh.json`) và `.claude/skills/lam-viec/`.
2. Viết `cau_hinh.json` riêng cho kho đó.
3. Ghép phần deny và hooks vào `settings.json`.
4. Chạy `thu_nguoi_gac.js`, phải xanh.
5. Viết `cong_cu/gia_lap/` riêng cho app. Trong lúc chưa có, cổng chỉ cảnh báo.
6. `PHIEN_BAN` phải khớp với kho gốc.

---

# PHẦN C — VIỆC VÀ NGHIỆM THU

Các việc từ TU-CHAY-1 đến TU-CHAY-4 làm ở **chế độ tay**: chưa có người gác thì chưa được tự chạy.

**TU-CHAY-1 · Người gác (POS)**
- **Phạm vi:** `.claude/tu_chay/{PHIEN_BAN,THIET_KE.md,cau_hinh.json,nguoi_gac.js,thu_nguoi_gac.js}`, `.claude/settings.json`, `.gitignore`, `kiem_tra_truoc_khi_giao.js` (thêm một phép gọi `thu_nguoi_gac.js`).
- **Nghiệm thu:**
  - Đủ các ca ở B11, xanh.
  - Đột biến từng luật đều làm đỏ.
  - `/permissions` hiện đủ các luật deny.
  - **Chủ quán phá thử sống:** trên nhánh thử, mở auto mode, bảo máy push, sửa `.env`, sửa ngoài phạm vi, sửa phiếu. Cả 4 lần phải bị chặn và có nhật ký.

**TU-CHAY-2 · `chay.sh` + skill `lam-viec` + mẫu phiếu**
- **Nghiệm thu:** một việc giả chạy từ `chay.sh` tới bước 7. Khởi động lại Replit giữa chừng, rồi `chay.sh <MÃ>` làm tiếp được.

**TU-CHAY-3 · `soat.sh` + `cong.js` + `day_len.sh`**
- **Nghiệm thu:**
  - Việc giả ra biên bản ĐẠT.
  - Commit thêm sau khi soát → cổng đóng.
  - File ngoài phạm vi → cổng đóng.
  - Bài thử xanh oan (đúng cả trên code cũ) → cổng đóng.
  - `day_len.sh` chạy thật với một việc vô hại, rồi lùi thử bằng lệnh nó in ra.

**TU-CHAY-4 · Giả lập quầy POS:** đủ 11 kịch bản và 9 bất biến ở B10.
- Tự từ chối chạy khi thấy khoá thật.
- Phá thử bất biến: cố ý bỏ một chặn trong bản sao → bất biến tương ứng phải lệch.

**Chạy thử có giám sát: P20b.** Chủ quán chỉ xem, không bấm.

**Nhân sang SX:** thay cho bước "khoá chế độ tay SX". **Không mở `claude` ở SX** cho tới khi bộ khung đã nằm trong kho SX.

---

## B13. Điểm lệch so với bản v1.1 và lỗ còn hở (TU-CHAY-1, 28.09.2026)

Nguồn tài liệu Claude Code đã tra (28.09.2026): code.claude.com/docs/en/hooks,
/permissions, /permission-modes, /tools-reference, /sandboxing. Chi tiết từng dòng
nằm ở `viec/TU-CHAY-1/ke_hoach.md`.

### Lệch có chủ ý (chủ quán đã chốt)

1. **Nguồn nằm ở `tu_chay/` tại gốc kho.** Agent không được sửa `.claude/`, nên
   chủ quán cài bằng `bash tu_chay/cai_dat.sh` trong Shell. Trình cài chép mọi
   file trừ `cai_dat.*` sang `.claude/tu_chay/`. Bộ kiểm (nhóm T) CẢNH BÁO khi
   hai bản lệch nhau dù một byte.
2. **Giữ `defaultMode: "default"`**, chỉ bỏ `disableAutoMode` (ở cả cấp gốc lẫn
   `permissions.`). Auto mode mở bằng `claude --permission-mode auto`.
3. **Bỏ hết luật `ask`.** `.claude/**` chuyển sang deny. Chỉ dùng `Edit(...)`, vì
   `Write(...)` Claude Code nhận nhưng không bao giờ xét (sinh cảnh báo "is not matched").
4. **Matcher `*`** (không phải `Bash|Edit|…`), kèm danh sách công cụ cho qua:
   - Read, Grep, Glob, WebFetch, WebSearch, Agent, TodoWrite, ExitPlanMode,
     AskUserQuestion, Skill;
   - thêm ngày 28.09: ToolSearch, EnterPlanMode, TaskCreate/Update/Get/List/Output.

   Monitor được xét như Bash. **TaskStop, MCP và mọi công cụ lạ đều bị chặn.**
5. **git và npm theo danh sách lệnh CHO PHÉP**, không theo danh sách cấm (xem B3 trong mã).
6. **Thêm `file_luat`:** các file luật chỉ sửa được khi Phạm vi ghi ĐÚNG TÊN file.
   **Thêm `file_bi_mat`** cho luật Bash nhắc tới file bí mật. `TIEN_DO_*.json` vào `file_cam`.
7. **Nháp = `scratchpad_dir`** lấy từ stdin của hook. Edit/Write được ghi thêm vào
   `~/.claude/plans/**` (Bash thì không). Mọi chỗ khác ngoài kho: chặn.
8. **Chặn bằng exit 2 kèm JSON deny.** Tài liệu ghi exit 2 chặn kể cả khi JSON
   hỏng; mã khác 0 và khác 2 thì KHÔNG chặn — nên lệnh hook có `|| exit 2`.
9. **Thêm `.git/hooks/pre-push`:** từ chối push khi có `CLAUDECODE` hoặc
   `CLAUDE_CODE_CHILD_SESSION`. Không đè một pre-push khác nội dung.
10. **Luật "có chữ `.env`" xét theo TỪNG TỪ** (tên file, kể cả glob có thể mở ra
    `.env`), nên `process.env` không bị chặn oan. Các chữ TOKEN, SECRET, API_KEY,
    environ vẫn xét trên toàn văn lệnh.
11. **Luật trùng với danh sách chương trình không có mã riêng:** `sh -c`, `eval`,
    `xargs`, `env`, `sudo`, `claude`, `turso`, `perl`… bị chặn vì không có trong
    danh sách. Nhờ vậy tắt thử từng mã đều làm bài thử đỏ.
12. **Có thêm `tee`, `touch`, `chmod`** và các lệnh chỉ đọc (sha256sum, stat, ps…)
    trong danh sách. Đích ghi của chúng đi qua hàm `ghiDuoc`.
13. **Không còn MultiEdit** (tools-reference); gặp thì vẫn xét như Edit.
14. **Vai soát (`TU_CHAY_VAI`) hoãn sang TU-CHAY-3.** Tới lúc đó bản sao soát không
    có `.git`, nên người gác chặn mọi việc sửa (G2) — vẫn fail-closed.
15. **Sandbox:** Replit không có bubblewrap/socat → bỏ qua.
16. **Sổ việc:** từ giờ tới khi có `day_len.sh` (TU-CHAY-3), **chủ quán tự ghi sổ
    trong Shell** theo lệnh chat soạn. Agent không ghi sổ (PY-SO, `file_cam`).
    Việc TU-CHAY-1 không thêm mục vào sổ.
17. **`tep_bash_them` trong cau_hinh.json** (chủ quán chốt 28.09): bash/sh được chạy
    đúng một file ghi trong danh sách này, so NGUYÊN đường dẫn đã chuẩn hoá (không
    glob, không kèm tham số), mã luật B-BASHTHEM. POS: `["ban_mau_pos/chay_thu.sh"]`.
    Chỉ mở việc CHẠY. Sửa file đó vẫn theo `file_luat` (`ban_mau_pos/**`: phạm vi
    phải ghi đúng tên), có ca thử canh.
18. **Bản lưu trước khi vá (`<file>.truoc_<ĐỢT>`) KHÔNG ghi trong kho** (chủ quán
    chốt 28.09): đặt trong thư mục nháp. **CLAUDE.md §4 bước 5 hiện vẫn ghi "lưu
    thành `<file>.truoc_<TEN_DOT>`" cạnh file gốc → sẽ sửa cho khớp ở TU-CHAY-2.**
    Tới lúc đó, làm theo CLAUDE.md trong kho sẽ bị người gác chặn G5 — chép vào nháp.
19. **Tuỳ chọn dài viết tắt** (vòng C4b): git, getopt_long và file nhận mọi tiền
    tố không mơ hồ. MỘT hàm `laDai`: từ `--x` là tiền tố của tuỳ chọn bị cấm thì coi
    là tuỳ chọn đó, áp cho mọi chỗ so tuỳ chọn dài (git add/commit/archive/--output/
    --ext-diff, sort, uniq, sed, tar, curl, file, cp/mv/ln, node, timeout, chmod).
    Lớp 1 có thêm deny `Bash(git *--no-v*)` — `*` đứng được ở mọi chỗ trong mẫu
    (docs/en/permissions: "A `*` can go anywhere in the rule").
20. **`cd` chặt lại** (vòng C4b):
    - cd chỉ được đổi cwd khi đứng ĐẦU lệnh, không chuyển hướng, không gán biến,
      không nằm trong pipeline hay danh sách chạy nền, và CHỈ nối tiếp bằng `&&`.
      Mọi `cd` khác → B-CD-VITRI. `timeout cd` cũng bị chặn; lệnh trong `timeout`
      luôn xét với bản sao cwd.
    - Cấm cd vào `.git/`, `.claude/` (kể cả qua symlink) → B-CD-KHUNG.
    - `|` và `|&` cuối dòng (kể cả sau `#`) vẫn nối pipeline sang dòng sau. `&`
      đưa CẢ danh sách `&&`/`||` ra nền.
    - **Chặn oan có chủ ý:** lệnh build ở CLAUDE.md §3 `cd client && npm run build
      && cd ..` bị chặn (vì `cd ..`). Dạng thay: `(cd client && npm run build)`.
      **CLAUDE.md §3 sẽ sửa ở TU-CHAY-2.**
    - Bài thử đối chiếu bash THẬT: chạy bản vô hại (cd + touch) trong kho giả,
      so chỗ file thật rơi vào với quyết định của người gác.
21. **Kiểm từng mục `tep_bash_them`** khi đọc cấu hình: đường dẫn tương đối đã chuẩn
    hoá, không rỗng, không `..`, không glob, là file thật trong kho, không qua
    symlink. Sai → NG-CAUHINH. `SHELLOPTS`, `BASHOPTS`, `PS4` vào danh sách biến nguy hiểm.
22. **Bốn quy tắc thêm ở vòng C4c** (chủ quán chốt, 28.09):
    - **LN-CUNG:** `ln` không có `-s` → chặn; `cp -l`/`--link` (kể cả gộp `-al`, viết
      tắt) → chặn. Liên kết CỨNG ghi vào cùng inode với file khác nên lách được kiểm
      đích ghi (vd `ln .git/config server/a.js` rồi sửa `server/a.js`).
    - **G-LIENKET:** trong `ghiDuoc`, đích đang tồn tại là file thường có `nlink > 1`
      → chặn (bắt cả trường hợp liên kết cứng đã có sẵn từ trước). Đặt TRƯỚC nhánh
      cho-qua của nháp/phạm vi để không bị bỏ sót.
    - **PY-M:** `python3 -m` (kể cả gộp `-sm`, `-Im`) → chặn. `-m` chạy được
      pip/venv/http.server và nạp mã tuỳ ý — cùng lớp lỗ với script tự mở file.
    - **CURL-CAM mở rộng:** thêm `-x`, `--proxy`, `--preproxy`, `--socks4`,
      `--socks4a`, `--socks5`, `--socks5-hostname`, `--proxy1.0` (kể cả viết tắt).
    - **BIEN_NGUY mở rộng** (soát độc lập lần 2, chat, 28.09): cờ proxy chặn được
      nhưng gán biến môi trường proxy rồi để `curl` tự đọc thì lọt — thêm
      `CURL_HOME` và `*_proxy` (`http_proxy`, `https_proxy`, `ftp_proxy`,
      `all_proxy`, `no_proxy`, không phân biệt hoa thường) vào `BIEN_NGUY`.
    - **B-BIMAT-CHU mở rộng** (cùng mã, ba chỗ):
      - `ps` đối số kiểu BSD (không gạch đầu) chứa chữ `e` → chặn (BSD `e` in môi
        trường tiến trình). `ps -e`, `ps -ef`, `ps aux` cho qua.
      - `node -e/-p` hoặc `python3 -c` có `process.env` KHÔNG theo sau `.` hoặc `[`
        → chặn (đọc TOÀN BỘ môi trường). `process.env.PORT`, `process.env[..]` cho qua.
      - `grep` đệ quy (`-r`, `-R`, `--recursive`, gộp, viết tắt) vào thư mục chứa
        TRỰC TIẾP file thuộc `file_bi_mat` mà không có `--exclude` khớp → chặn kèm gợi
        ý. `grep -rn x server/`, `grep -rn x . --exclude='.env*'` cho qua.
        `grep` đệ quy KHÔNG có đường dẫn (vd `grep -rn DATABASE_URL`) → GNU grep tìm
        thư mục hiện tại, nên coi đường dẫn là `cwd` và kiểm như thường.
23. **TU-CHAY-2 `chay.sh` sẽ mở `claude` với biến bí mật đã GỠ khỏi môi trường.**
    Người gác không giới hạn `Read`, `ps`/`node -e process.env`/`grep -r` chỉ bịt các
    lối đọc bí mật QUA LỆNH; lối chắc chắn nhất là để chính tiến trình claude không có
    `TURSO_AUTH_TOKEN`/`JWT_SECRET`… trong `environ`. `chay.sh` (TU-CHAY-2) sẽ đọc
    bí mật, dùng để dựng thứ cần, rồi `env -u`/`unset` trước khi `exec claude`.

### Phân loại lỗ (chủ quán chốt 28.09)

- **Loại A — BẮT BUỘC vá ở người gác:** hậu quả KHÔNG hiện trong `git diff`, hoặc
  không lùi được. Gồm:
  - push, mạng, production;
  - `.git/` (hook, config, lịch sử);
  - `.env` và bí mật;
  - file ngoài kho hoặc file chưa theo dõi;
  - `.claude/`.
- **Loại B — ghi ở đây, cổng TU-CHAY-3 bắt:** chỉ sửa nhầm file đang theo dõi trong
  kho. Hiện trong `git diff`, lùi được.
- **Yêu cầu cho TU-CHAY-3:** cổng phải kiểm `viec/<MÃ>/phieu.md` và `.claude/` KHÔNG
  đổi so với lúc giao việc (so với commit `PHIEU: <MÃ>`), vì một số lỗ loại B / lưới
  hai (script node/python) chạm tới đúng các file này.

### Lỗ còn hở — nói thẳng

- **Script tự mở file:** `node x.js`, `python3 x.py`, `node -e` viết lách tránh từ
  khoá, `npm run <script>` (script lấy từ package.json), `python3 -m pip install`.
  Tất cả ghi được file mà người gác không thấy. Lưới thứ hai là **cổng (TU-CHAY-3),
  CHƯA CÓ**. Hiện chỉ còn deny lớp 1 và mắt chủ quán.
- **`sed` / `awk`** chỉ bắt theo mẫu chữ (`w`, `e`, `system`, `|`, `print >`),
  cả hai chiều đều có thể trượt.
- **Ghép biến có chủ ý:** `F=.e; cat ${F}nv` lọt luật file bí mật. Hệ thống chặn
  sai sót và đi tắt, không chống AI cố tình gian lận (A10).
- **`git push --no-verify`** bỏ qua pre-push. Lớp 1 (deny `git push`) và người gác
  (GIT-LENH) vẫn chặn.
- **Hook quá `timeout` thì KHÔNG chặn** (tài liệu hooks). Người gác tự hẹn giờ 5 s
  để bù, nên stdin treo thì bị chặn.
- **TOCTOU:** symlink bị đổi sau khi người gác đã xét.
- **Người gác không giới hạn `Read`.** `.env` chỉ được deny `Read(./.env)` của lớp 1 canh.
- **`kill` được phép.**
- **Shell của chủ quán không có người gác** — chủ ý.
- **`npm test` và `npm ci` cũng chạy script lấy từ package.json**, và `npm ci` ghi
  lại cả node_modules — cùng lớp lỗ với `npm run`.
- **`mkdir` tạo được thư mục ở mọi chỗ trong kho** (trừ `.claude/`, `.git/`), kể cả
  ngoài phạm vi. Chỉ tạo thư mục rỗng, không ghi file.
- **Chặn oan theo B3:** luật TOKEN / SECRET / API_KEY / environ soi toàn văn lệnh,
  nên chặn cả `grep -rn TURSO_AUTH_TOKEN server/` và commit message có các chữ đó.
- **Mọi dòng trong mục `## Phạm vi` đều được hiểu là đường dẫn / glob**, kể cả dòng
  văn xuôi. Phiếu do chat soạn và được G1 bảo vệ, nên rủi ro thấp.
- **Sửa lời trước đây: vá vòng C3 chưa đủ.** B13 bản trước ghi "hai lỗ (cd trong
  `|`/`&`, `file -C`) đã vá". Soát gọn vòng C4 cho thấy câu đó SAI: `|` ở cuối dòng,
  `timeout cd`, `cd` có điều kiện (`||`, chuyển hướng hỏng), `… && ls &` (cả danh
  sách chạy nền) vẫn làm lệch cwd; `file --comp` (viết tắt) vẫn lọt. Thêm nữa, mọi
  tuỳ chọn dài VIẾT TẮT đều lọt, ví dụ `git commit --no-verif` bỏ qua pre-commit.
  Đã vá ở vòng C4b (mục 19–21), có ca thử đỏ trước khi vá (`bang_chung_do_C4b.txt`).
- **Chặn chặt hơn bản v1.1:**
  - khối `{ …; }`, `if`/`for`/`while`, `$(( ))`, `<( )`, `$'…'` và `${X:-…}` đều bị chặn;

  Muốn mở thì chủ quán quyết (thêm vào `chuong_trinh_them`, hoặc đổi luật).

## B14. TU-CHAY-2 — máy mây tự làm trọn một việc (30.09.2026, tu-chay 1.2.0)

Nguồn tài liệu đã tra (30.09.2026): code.claude.com/docs/en/claude-code-on-the-web, /cloud-environments
(mục "Setup scripts vs. SessionStart hooks", "Install dependencies with a SessionStart hook"), /hooks
(SessionStart), /skills (Frontmatter reference). Chi tiết: `viec/TU-CHAY-2/ke_hoach.md`.

1. **Luật GIT-PUSH (TU-CHAY-2a).** Push theo danh sách CHO PHÉP đúng một dạng:
   `git push [-u|--set-upstream|-q|--quiet|-v|--verbose] origin viec/<MÃ>`, trong đó MÃ là nhánh đang
   đứng, nhánh có `viec/<MÃ>/phieu.md` kèm `## Phạm vi`, chạy từ trong kho (không từ nháp, không từ
   kho git lồng). Mọi dạng khác → GIT-PUSH (không ép, không xoá, không refspec `:`/`+`, không HEAD,
   không URL, không remote khác, không `main`). `.git/hooks/pre-push` giữ nguyên.
2. **Hoàn tác file** (`GIT-HOANTAC`, `G-HOANTAC`, hàm `xetHoanTac`):
   - cho: `git checkout -- <file…>`, `git restore [--staged|-S|--worktree|-W|-q|--quiet] [--] <file…>`;
   - tuỳ chọn khác (`--source/-s`, `-p`, `--pathspec-from-file`, `--ours`, `--overlay`, viết tắt, gộp
     `-SW`), `checkout <nhánh/commit> --`, glob (kể cả trong nháy, vì git tự mở pathspec), `:` (pathspec
     magic), `.`, thư mục, tên kết thúc `/`, tên qua biến → chặn;
   - file đi qua `ghiDuoc(…, hoanTac)`: khung (`.claude/`, `.git/`), file cấm, phiếu, ngoài kho, liên
     kết cứng, không có việc/phiếu → vẫn chặn; tới chỗ G-LUAT/G4/G5 thì **cho** (chủ quán chốt 30.09:
     trả về bản commit là an toàn, kể cả file luật ngoài Phạm vi và file đã xoá khỏi đĩa).
   - Ca cũ đổi kết quả: `git checkout -- server/b.js` (ngoài phạm vi) G5-NGOAIPV → CHO;
     `git restore server/a.js` GIT-LENH → CHO.
3. **Lớp 1 đổi (2a).** Bỏ deny push CHUNG `Bash(git push *)`, `Bash(git push:*)` (DENY_BO) để máy mây push
   được nhánh việc; thêm deny HẸP (DENY_MOI): `*main*`, `*-f*`, `*-d*`, `*--mirror*`, `*--all*`,
   `*--tags*`, `*--prune*`, `*:*`, `*+*`. Người gác (GIT-PUSH) mới là lớp chính xác.
4. **Cài thư viện trên máy mây: hook SessionStart** (chủ quán chốt; không dùng Setup script).
   - So hai cách: Setup script chạy trước Claude Code, chỉ ở máy mây, cấu hình trong hộp thoại môi trường
     (không nằm trong git), bỏ qua khi có bản cache. SessionStart nằm trong `.claude/settings.json` (đi
     theo git, chủ quán duyệt), chạy mỗi lần startup/resume ở cả máy nhà lẫn máy mây → phải tự thoát khi
     `CLAUDE_CODE_REMOTE` khác `true`. Hook SessionStart không chặn được phiên.
   - `cai_dat.js` ghép đúng một mục `{ matcher: "startup|resume", command: bash "$CLAUDE_PROJECT_DIR/.claude/tu_chay/cai_thu_vien.sh", timeout: 600 }`
     — gọi bản ĐÃ CÀI, không gọi nguồn `tu_chay/`. Cài lại thì thay mục cũ, giữ hook SessionStart khác.
   - `cai_thu_vien.sh`: `npm ci` ở gốc rồi ở `client/`; bỏ qua chỗ đã cài đúng lockfile (dấu băm
     `node_modules/.tu_chay_lock`); lỗi thì báo `✗` ra stdout (vào ngữ cảnh Claude) và stderr, vẫn thoát 0.
   - `client/package-lock.json`: dòng `resolved` của `jsqr` trỏ `package-firewall.replit.local` (npm trên
     máy mây trả E405) → đổi sang `registry.npmjs.org`, giữ `integrity`. Một dòng, không sinh lại lockfile (P6).
5. **Skill `/lam-viec`**: nguồn phẳng `tu_chay/skill_lam_viec.md` (T2 đọc mọi mục trong `tu_chay/`), trình
   cài chép thành `.claude/skills/lam-viec/SKILL.md`; `disable-model-invocation: true` — chỉ chủ quán gọi.
   Bước đầu: `git log --oneline -3`, ghi vào `trang_thai.md` và in trong câu trả lời đầu tiên. Bộ kiểm T3
   CẢNH BÁO khi bản đã cài lệch nguồn.
6. **`xem_thu.sh <MÃ>|main`** (chủ quán chạy ở Replit): kiểm hết rồi mới đổi; chỉ fast-forward; `npm ci` chỉ
   khi lockfile đổi hoặc chưa cài; dist sau build khác bản commit → báo, trả dist về bản commit bằng
   `git checkout HEAD -- client/dist` + `git clean -fdq -- client/dist` (chỉ trong `client/dist/`, chủ quán
   chốt 30.09), không bảo bấm Run. Thân nằm trong hàm để checkout đổi chính file không làm hỏng.

### Lỗ còn hở — nói thẳng (thêm ở TU-CHAY-2)

- **Lớp 1 không còn chặn push chung.** Push sai dạng chỉ còn người gác (GIT-PUSH) và deny hẹp chặn;
  `git push --no-verify` bỏ qua pre-push. Nhánh `main` dựa vào người gác + luật bảo vệ nhánh trên GitHub.
  Deny hẹp soi chữ: mã việc chứa `main`, `-d`, `-f` bị chặn oan (MAU_PHIEU.md dặn tránh).
- **Hoàn tác: thư mục ĐÃ XOÁ khỏi đĩa** không phân biệt được với file đã xoá (người gác không gọi git) →
  `git restore server/cu` trả CẢ thư mục về bản commit. Loại B (hiện trong `git diff`, lùi được), chủ
  quán chốt 30.09. Thư mục khung/phiếu vẫn bị chặn theo tên.
- **`npm ci` trong hook SessionStart** chạy script lấy từ package.json ngoài tầm người gác — cùng lớp lỗ
  với `npm ci` / `npm test` đã ghi ở B13.
- **Phiên máy mây mở từ bản chụp CŨ.** Một phiên từng mở ra ở commit `45f783e` (TU-CHAY-2a) dù GitHub đã
  có commit mới hơn — môi trường dùng lại bản chụp cũ. Chữa: sửa ô **Setup script** của môi trường (hiện
  chỉ có một lệnh `echo`) để môi trường dựng lại. Chặn tái diễn: skill `/lam-viec` bắt đầu bằng
  `git log --oneline -3`, in ra để chủ quán đối chiếu với GitHub; không khớp thì dừng.
- **`xem_thu.sh`: phép "không tự hỏng khi đổi chính file" chưa có ca đỏ thật.** git thay file bằng inode mới
  nên bash vẫn đọc bản cũ qua fd đang mở; bọc hàm là lớp phòng thêm, bài thử (F10) không phân biệt được.
