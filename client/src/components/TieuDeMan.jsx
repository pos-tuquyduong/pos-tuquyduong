/**
 * GIAO-DIEN-4 B1 — tiêu đề màn: ô icon (lucide, thay emoji) + tên màn bằng phông Playfair (lớp .page-title ở index.css).
 * Dùng: <TieuDeMan icon={Receipt} ten="Đơn hàng" /> ; `phu` = dòng phụ nhỏ bên dưới (tuỳ chọn).
 */
export default function TieuDeMan({ icon: Icon, ten, phu }) {
  return (
    <h1 className="page-title">
      {Icon && <span className="tieu-de-o" aria-hidden="true"><Icon size={20} /></span>}
      <span>{ten}{phu && <small>{phu}</small>}</span>
    </h1>
  );
}
