/**
 * Danh sách quan hệ gia đình - GIỐNG HỆT SX
 * Dùng cho dropdown khi tạo khách phụ
 */

const RELATIONSHIPS = [
  { value: "", label: "-- Chọn quan hệ --" },
  { value: "con", label: "Con" },
  { value: "bố", label: "Bố" },
  { value: "mẹ", label: "Mẹ" },
  { value: "vợ", label: "Vợ" },
  { value: "chồng", label: "Chồng" },
  { value: "anh/chị/em", label: "Anh/Chị/Em" },
  { value: "bạn bè", label: "Bạn bè" },
  { value: "khác", label: "Khác" }
];

const RELATIONSHIP_VALUES = RELATIONSHIPS.map(r => r.value).filter(v => v !== "");

module.exports = { 
  RELATIONSHIPS,
  RELATIONSHIP_VALUES
};
