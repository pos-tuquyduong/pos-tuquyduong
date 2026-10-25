/**
 * Ghi chú nhanh MẶC ĐỊNH theo nhóm sản phẩm (p.category).
 * TOPPING-1 thay bằng cài đặt theo từng sản phẩm — khi đó bỏ file này.
 */
const THEO_NHOM = {
  tea: ['Ít đá', 'Không đá', 'Ít ngọt', 'Nóng'],
  juice: ['Ít đá', 'Không đá', 'Không đường'],
};
const DU_PHONG = ['Ít đá', 'Không đá', 'Ít đường', 'Không đường'];

export const ghiChuMacDinh = (nhom) => THEO_NHOM[nhom] || DU_PHONG;
