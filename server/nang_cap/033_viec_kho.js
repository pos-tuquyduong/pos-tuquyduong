/**
 * Bước 033 (KHO-GON-1): việc hôm nay ở đầu Kho, kiểm kê / bàn giao, diễn biến. Chỉ THÊM bảng / chỉ mục / cột (cột qua themCot — tự sao lưu).
 * Tồn vẫn chỉ đổi qua phiếu (KK đã có trong CHECK của kho_phieu, bước 001). Giờ là chuỗi getNow (giờ VN).
 * - kho_viec_mau: việc cố định có thứ tự; mỗi loại đặc biệt (bangiao · phache · kiemke) đúng MỘT dòng.
 * - kho_viec: việc của MỘT ngày — chép từ mẫu lúc sinh (sửa mẫu áp dụng từ ngày sau); UNIQUE(ngay, mau_id) chống sinh đôi;
 *   việc gọi hàng gắn nguyen_lieu_id — một việc CHƯA XONG mỗi nguyên liệu mỗi ngày.
 * - kho_dien_bien: nhật ký dòng chữ (chu_y = 1 → tô cam). kho_dien_bien_xem: đã xem tới id nào, theo NGƯỜI.
 * - kho_chot: một lần chốt kiểm kê / nhận bàn giao / chỉnh tay, `anh` = JSON tồn sau chốt từng thứ + ghi chú; `chinhtay` = MỌI lần chỉnh tay (đổi
 *   lô, chỉ trừ phiếu chờ, hay không đổi) — dấu vết theo món để khoá kết quả pha chế và lọc dòng cam (chủ quán 28.11 Q13b, Q14).
 */
const MAU_MAC_DINH = [
  ['Nhận bàn giao', 'nv', '08:00', 'bangiao', 1],
  ['Pha sẵn theo định mức', 'nv', null, 'phache', 2],
  ['Kiểm kê & chốt cuối ngày', 'nv', null, 'kiemke', 3],
];

module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.query('PRAGMA table_info(kho_phieu)')).length) return;   // kho thử thiếu bảng kho
  await tx.run(`CREATE TABLE IF NOT EXISTS kho_viec_mau (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT NOT NULL,
    giao TEXT NOT NULL CHECK (giao IN ('nv', 'sang', 'toi', 'ql', 'tat_ca')),
    gio_han TEXT,
    loai TEXT NOT NULL CHECK (loai IN ('thuong', 'bangiao', 'phache', 'kiemke')),
    thu_tu INTEGER NOT NULL DEFAULT 0,
    sua_luc TEXT
  )`);
  await tx.run("CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_viec_mau_loai ON kho_viec_mau(loai) WHERE loai <> 'thuong'");
  await tx.run(`CREATE TABLE IF NOT EXISTS kho_viec (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay TEXT NOT NULL,
    mau_id INTEGER,
    ten TEXT NOT NULL,
    giao TEXT NOT NULL,
    gio_han TEXT,
    loai TEXT NOT NULL,
    thu_tu INTEGER NOT NULL DEFAULT 0,
    nguyen_lieu_id INTEGER,
    nguoi_tao TEXT,
    tao_luc TEXT NOT NULL,
    nguoi_xong TEXT,
    xong_luc TEXT
  )`);
  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_viec_ngay_mau ON kho_viec(ngay, mau_id) WHERE mau_id IS NOT NULL');
  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_viec_goi_hang ON kho_viec(ngay, nguyen_lieu_id) WHERE nguyen_lieu_id IS NOT NULL AND xong_luc IS NULL');
  await tx.run(`CREATE TABLE IF NOT EXISTS kho_dien_bien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay TEXT NOT NULL,
    luc TEXT NOT NULL,
    loai TEXT NOT NULL,
    viec TEXT NOT NULL,
    chi_tiet TEXT,
    nguoi TEXT,
    chu_y INTEGER NOT NULL DEFAULT 0,
    phieu_id INTEGER
  )`);
  await tx.run('CREATE INDEX IF NOT EXISTS idx_kho_dien_bien_ngay ON kho_dien_bien(ngay)');
  await tx.run('CREATE TABLE IF NOT EXISTS kho_dien_bien_xem (nguoi TEXT PRIMARY KEY, den_id INTEGER NOT NULL DEFAULT 0)');
  await tx.run(`CREATE TABLE IF NOT EXISTS kho_chot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    che_do TEXT NOT NULL CHECK (che_do IN ('kiemke', 'bangiao', 'chinhtay')),
    ngay TEXT NOT NULL,
    luc TEXT NOT NULL,
    nguoi TEXT NOT NULL,
    phieu_id INTEGER,
    ghi_chu_chung TEXT,
    anh TEXT NOT NULL,
    ma_gui TEXT
  )`);
  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_chot_ma_gui ON kho_chot(ma_gui) WHERE ma_gui IS NOT NULL');
  await themCot('kho_nguyen_lieu', 'kiem_hang_ngay INTEGER NOT NULL DEFAULT 0');
  if (!Number((await tx.queryOne('SELECT COUNT(*) AS n FROM kho_viec_mau')).n)) {
    for (const m of MAU_MAC_DINH) await tx.run('INSERT INTO kho_viec_mau (ten, giao, gio_han, loai, thu_tu) VALUES (?, ?, ?, ?, ?)', m);
  }
};
