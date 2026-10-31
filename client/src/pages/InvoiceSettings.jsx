/**
 * InvoiceSettings.jsx - Trang cài đặt hóa đơn
 * UI 2 cột: Tùy chỉnh bên trái + Preview realtime bên phải
 *
 * FIX 1: Sub-components BÊN NGOÀI để tránh mất focus khi gõ
 * FIX 2: STALE-WHILE-REVALIDATE pattern - 1 API duy nhất + cache
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Có cache? → Hiển thị NGAY (0ms), API update ngầm       │
 * │ Không cache? → Hiện loading, chờ API                   │
 * │ Kết quả: Trang mở tức thì như app native!              │
 * └─────────────────────────────────────────────────────────┘
 */
import { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Upload,
  Trash2,
  Eye,
} from "lucide-react";
import InvoicePreview, { HoaDonTo } from "../components/InvoicePreview";
import { VungTrang, useNhomTheoMa } from "../components/InPhieu";
import { getLogo } from "../utils/logoCache";
import {
  KHOA_BO_IN, LOAI_IN, NHAN_LOAI, NHAN_NHOM, KHO_BILL, KHO_TEM, KHO_PHIEU, SO_BAN_TOI_DA,
  DON_MAU, NHOM_MAU, docBoIn, dungBoIn, khoHoaDon,
} from "../utils/inPhieu";
import {
  NHOM_CHU, KHONG_AN, CHU_MAC_DINH, chuMacDinhCuaQuan, GIOI_HAN_CHU, GIOI_HAN_TEM, gioiHanChu, KHOA_DIA_CHI_KH, KHOA_SO_TO,
  MAU_XEM_TRUOC, caiDatTuChuDangSua, khoaChuGhiKhiReset, docChu, soToTuCaiDat, demChu, dungHoaDon,
} from "../utils/hoaDon";

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
  text: {
    store_name: "TỨ QUÝ ĐƯỜNG",
    slogan: "Sức khỏe từ thiên nhiên",
    address: "LK4-129 Trương Định, Tương Mai, HN",
    phone: "024 2245 5565",
    email: "",
    thank_you: "Cảm ơn quý khách!",
    policy: "Đổi trả trong 24h",
  },
  show: {
    logo: true,
    store_name: true,
    slogan: true,
    address: true,
    phone: true,
    email: false,
    invoice_number: true,
    order_code: true,
    datetime: true,
    staff: true,
    qr_code: true,
    customer_name: true,
    customer_phone: true,
    customer_address: true,
    customer_balance: true,
    customer_type: false,
    customer_note: false,
    col_stt: true,
    col_product_code: false,
    col_unit: false,
    col_price: true,
    discount_detail: true,
    shipping_fee: true,
    amount_words: false,
    payment_checkbox: true,
    sig_seller: true,
    sig_shipper: true,
    sig_customer: true,
    thank_you: true,
    policy: true,
  },
  align: {
    header: "center",
    order_info: "justify",
    customer: "left",
    totals: "right",
    signatures: "justify",
    footer: "center",
  },
};

const PRESETS = {
  basic: {
    name: "Cơ bản",
    show: {
      logo: true,
      store_name: true,
      slogan: false,
      address: true,
      phone: true,
      email: false,
      invoice_number: true,
      order_code: false,
      datetime: true,
      staff: true,
      qr_code: false,
      customer_name: true,
      customer_phone: true,
      customer_address: false,
      customer_balance: false,
      customer_type: false,
      customer_note: false,
      col_stt: false,
      col_product_code: false,
      col_unit: false,
      col_price: true,
      discount_detail: false,
      shipping_fee: true,
      amount_words: false,
      payment_checkbox: false,
      sig_seller: false,
      sig_shipper: false,
      sig_customer: false,
      thank_you: true,
      policy: false,
    },
  },
  full: {
    name: "Đầy đủ",
    show: {
      logo: true,
      store_name: true,
      slogan: true,
      address: true,
      phone: true,
      email: false,
      invoice_number: true,
      order_code: true,
      datetime: true,
      staff: true,
      qr_code: true,
      customer_name: true,
      customer_phone: true,
      customer_address: true,
      customer_balance: true,
      customer_type: false,
      customer_note: true,
      col_stt: true,
      col_product_code: false,
      col_unit: false,
      col_price: true,
      discount_detail: true,
      shipping_fee: true,
      amount_words: true,
      payment_checkbox: true,
      sig_seller: true,
      sig_shipper: true,
      sig_customer: true,
      thank_you: true,
      policy: true,
    },
  },
  delivery: {
    name: "Giao hàng",
    show: {
      logo: true,
      store_name: true,
      slogan: false,
      address: false,
      phone: true,
      email: false,
      invoice_number: true,
      order_code: true,
      datetime: true,
      staff: true,
      qr_code: true,
      customer_name: true,
      customer_phone: true,
      customer_address: true,
      customer_balance: false,
      customer_type: false,
      customer_note: true,
      col_stt: false,
      col_product_code: false,
      col_unit: false,
      col_price: true,
      discount_detail: true,
      shipping_fee: true,
      amount_words: false,
      payment_checkbox: true,
      sig_seller: true,
      sig_shipper: true,
      sig_customer: true,
      thank_you: true,
      policy: false,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (định nghĩa BÊN NGOÀI để tránh mất focus)
// ═══════════════════════════════════════════════════════════════════════════

// Alignment button
const AlignButton = ({ section, value, currentAlign, onUpdate }) => {
  const icons = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
    justify: AlignJustify,
  };
  const Icon = icons[value];
  const isActive = currentAlign === value;

  return (
    <button
      className={`align-btn ${isActive ? "active" : ""}`}
      onClick={() => onUpdate(section, value)}
      title={
        value === "justify"
          ? "Đều 2 bên"
          : value.charAt(0).toUpperCase() + value.slice(1)
      }
    >
      <Icon size={14} />
    </button>
  );
};

// Toggle field (chỉ toggle, không có input con)
const ToggleOnly = ({ field, label, checked, onToggle }) => (
  <div className="toggle-field">
    <label className="toggle-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(field)}
      />
      <span className="toggle-switch"></span>
      <span className="toggle-text">{label}</span>
    </label>
  </div>
);

// Toggle field với input text
const ToggleWithInput = ({
  field,
  label,
  checked,
  onToggle,
  textValue,
  onTextChange,
  placeholder,
  inputType = "text",
}) => (
  <div className="toggle-field">
    <label className="toggle-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(field)}
      />
      <span className="toggle-switch"></span>
      <span className="toggle-text">{label}</span>
    </label>
    {checked && (
      <div className="toggle-input">
        <input
          type={inputType}
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    )}
  </div>
);

// Section header
const SectionHeader = ({
  id,
  title,
  alignable,
  expanded,
  onToggle,
  currentAlign,
  onAlignUpdate,
}) => (
  <div className="section-header" onClick={() => onToggle(id)}>
    <div className="section-title">
      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      <span>{title}</span>
    </div>
    {alignable && expanded && (
      <div className="align-buttons" onClick={(e) => e.stopPropagation()}>
        <AlignButton
          section={id}
          value="left"
          currentAlign={currentAlign}
          onUpdate={onAlignUpdate}
        />
        <AlignButton
          section={id}
          value="center"
          currentAlign={currentAlign}
          onUpdate={onAlignUpdate}
        />
        <AlignButton
          section={id}
          value="right"
          currentAlign={currentAlign}
          onUpdate={onAlignUpdate}
        />
        {(id === "order_info" || id === "signatures") && (
          <AlignButton
            section={id}
            value="justify"
            currentAlign={currentAlign}
            onUpdate={onAlignUpdate}
          />
        )}
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// API - 1 API DUY NHẤT + TIMEOUT (pattern giống Customers/Orders)
// ═══════════════════════════════════════════════════════════════════════════
const CACHE_KEY = "pos_invoice_settings_cache";
const API_TIMEOUT = 10000; // 10 giây

const api = {
  // Load TẤT CẢ settings trong 1 call
  loadAll: async () => {
    const token = localStorage.getItem("pos_token");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const res = await fetch("/api/pos/settings", {
        headers: { Authorization: "Bearer " + token },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError")
        throw new Error("Timeout - API không phản hồi");
      throw err;
    }
  },

  saveConfig: async (config, boIn, chuHd) => {
    const token = localStorage.getItem("pos_token");
    const res = await fetch("/api/pos/settings", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // boIn null = chưa nạp được từ máy chủ → KHÔNG gửi khoá này (tránh ghi đè cài đặt đã lưu bằng mặc định)
        // KHO-IN-1: khổ hoá đơn khách MỘT nguồn = boIn.bill.kho; invoice_default_size (khoá lệnh in đọc khi chưa có bộ in lưu) ghi cùng giá trị
        settings: { invoice_config: JSON.stringify(config), ...(boIn ? { [KHOA_BO_IN]: JSON.stringify(boIn), invoice_default_size: khoHoaDon(boIn.bill.kho) } : {}), ...(chuHd || {}) },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  uploadLogo: async (file) => {
    const token = localStorage.getItem("pos_token");
    const formData = new FormData();
    formData.append("logo", file);
    const res = await fetch("/api/pos/settings/logo", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  deleteLogo: async () => {
    const token = localStorage.getItem("pos_token");
    const res = await fetch("/api/pos/settings/logo", {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HD-1 — KHỐI "CHỮ TRÊN HOÁ ĐƠN & TEM" (ngoài component chính: tránh mất focus)
// Chữ = invoice_chu_<khoá>, ẩn = invoice_an_<khoá>; KHÔNG sửa được số tiền / điểm / số bill; mục trong KHONG_AN không ẩn được.
// ═══════════════════════════════════════════════════════════════════════════
function chuHdThanhCaiDat(c) {
  const out = { [KHOA_SO_TO]: String(c.soTo), [KHOA_DIA_CHI_KH]: c.khUrl.trim() };
  for (const k of Object.keys(CHU_MAC_DINH)) {
    if (c.daSua.includes(k)) out[`invoice_chu_${k}`] = c.chu[k];
    if (!KHONG_AN.includes(k)) out[`invoice_an_${k}`] = c.an[k] ? "true" : "false";
  }
  return out;
}

function ChuHoaDon({ c, setC, caiDat, size }) {
  const [mau, setMau] = useState("quen");
  const [lien, setLien] = useState("khach");
  const sua = (k, v) => setC((x) => ({ ...x, chu: { ...x.chu, [k]: v }, daSua: x.daSua.includes(k) ? x.daSua : [...x.daSua, k] }));
  const an = (k) => setC((x) => ({ ...x, an: { ...x.an, [k]: !x.an[k] } }));
  const settings = caiDatTuChuDangSua(caiDat, c);
  const mauDangXem = MAU_XEM_TRUOC.find((m) => m.khoa === mau) || MAU_XEM_TRUOC[0];
  const to = dungHoaDon(mauDangXem.hd, settings, { lien, inLai: mauDangXem.inLai });
  const coQuaDai = NHOM_CHU.some((n) => n[1].some(([k]) => demChu(c.chu[k], gioiHanChu(k)).qua));
  const chip = (on) => ({ minHeight: 36, padding: "0 12px", borderRadius: 18, border: "1px solid " + (on ? "#1C1B1A" : "#D6D2CA"), background: on ? "#1C1B1A" : "#fff", color: on ? "#fff" : "#1C1B1A", cursor: "pointer" });
  return (
    <div className="section" style={{ padding: "0.75rem 1rem" }}>
      <b>🧾 Chữ trên hoá đơn &amp; tem</b>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", padding: "0.35rem 0" }}>
        <label>Số tờ mỗi lần in{" "}
          <select value={c.soTo} onChange={(e) => setC((x) => ({ ...x, soTo: Number(e.target.value) }))}>
            <option value={2}>2 tờ (giao khách + lưu quầy)</option>
            <option value={1}>1 tờ</option>
          </select>
        </label>
      </div>
      <label style={{ display: "block", padding: "0.35rem 0" }}>Địa chỉ đăng ký App KH (in thành QR; {"{ma}"} = mã nhận điểm của khách lẻ){" "}
        <input style={{ width: "100%" }} value={c.khUrl} placeholder="https://<địa-chỉ-app>/?ma={ma}" onChange={(e) => setC((x) => ({ ...x, khUrl: e.target.value }))} />
      </label>
      {!c.khUrl.trim() && <div style={{ color: "#B42318", fontSize: 13 }}>⚠ Chưa có địa chỉ App KH — hoá đơn sẽ KHÔNG in QR đăng ký.</div>}
      {coQuaDai && <div style={{ color: "#B42318", fontSize: 13, fontWeight: 700 }}>⚠ Có dòng quá {GIOI_HAN_CHU} ký tự (tem: {GIOI_HAN_TEM}) — giấy 58 mm sẽ bị cắt / xuống dòng.</div>}
      {NHOM_CHU.map(([ten, dong]) => (
        <details key={ten} style={{ margin: "0.4rem 0" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>{ten}</summary>
          {dong.map(([k, nhan]) => {
            const gh = gioiHanChu(k);
            const dem = demChu(c.chu[k], gh);
            return (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 0", flexWrap: "wrap" }}>
                <span style={{ minWidth: 150 }}>{nhan}</span>
                <input style={{ flex: 1, minWidth: 160 }} value={c.chu[k]} onChange={(e) => sua(k, e.target.value)} />
                <span style={{ fontSize: 11, color: dem.qua ? "#B42318" : "#8A847A", fontWeight: dem.qua ? 700 : 400 }}>{dem.dai}{Number.isFinite(gh) ? `/${gh}` : ""}</span>
                {KHONG_AN.includes(k)
                  ? <span style={{ fontSize: 11, color: "#8A847A", minWidth: 84 }}>luôn hiện</span>
                  : <button type="button" style={chip(!c.an[k])} onClick={() => an(k)}>{c.an[k] ? "Đang ẩn" : "Hiện"}</button>}
              </div>
            );
          })}
        </details>
      ))}
      <small>Chữ tự điền: {"{ten_khach} {hang} {phan_tram} {diem} {gio} {lan}"} (mỗi dòng dùng được những chữ hợp với nó). Số tiền, điểm, số bill do máy chủ tính — không sửa ở đây.</small>
      <div style={{ display: "flex", gap: 8, margin: "0.5rem 0", flexWrap: "wrap" }}>
        {MAU_XEM_TRUOC.map((m) => <button key={m.khoa} type="button" style={chip(mau === m.khoa)} onClick={() => setMau(m.khoa)}>{m.nhan}</button>)}
        <button type="button" style={chip(lien === "khach")} onClick={() => setLien("khach")}>Tờ khách</button>
        <button type="button" style={chip(lien === "luu")} onClick={() => setLien("luu")}>Tờ lưu</button>
      </div>
      <div style={{ background: "#e5e7eb", padding: 8, display: "flex", justifyContent: "center", overflow: "auto" }}>
        <HoaDonTo to={to} size={size} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// P16 — KHỐI "BỘ IN SAU THANH TOÁN" (ngoài component chính: tránh mất focus)
// ═══════════════════════════════════════════════════════════════════════════
const KHO_THEO_LOAI = { bill: KHO_BILL, tem: KHO_TEM, pha_che: KHO_PHIEU };

function BoInCaiDat({ boIn, setBoIn, xemBill, caiDatChu }) {
  const [xem, setXem] = useState(null);
  const [xemInLai, setXemInLai] = useState(false);
  const { nhomTheoMa } = useNhomTheoMa();
  const dsNhom = [...new Set(Object.values(nhomTheoMa))];
  const sua = (loai, kv) => setBoIn((b) => ({ ...b, [loai]: { ...b[loai], ...kv } }));
  const viec = xem && xem !== "bill"
    ? dungBoIn(DON_MAU, { ...caiDatChu, [KHOA_BO_IN]: JSON.stringify(boIn) }, { nhomTheoMa: NHOM_MAU, loai: [xem], inLai: xemInLai })[0] : null;
  const dong = { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", padding: "0.35rem 0" };
  return (
    <div className="section" style={{ padding: "0.75rem 1rem" }}>
      <b>🖨 Bộ in sau thanh toán</b>
      {LOAI_IN.map((l) => (
        <div key={l} style={dong}>
          <label style={{ minWidth: "9rem" }}>
            <input type="checkbox" checked={boIn[l].bat} onChange={(e) => sua(l, { bat: e.target.checked })} /> {NHAN_LOAI[l]}
          </label>
          <label>Số bản{" "}
            <select value={boIn[l].ban} onChange={(e) => sua(l, { ban: Number(e.target.value) })}>
              {Array.from({ length: SO_BAN_TOI_DA }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <label>Khổ{" "}
            <select value={boIn[l].kho} onChange={(e) => sua(l, { kho: e.target.value })}>
              {KHO_THEO_LOAI[l].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-outline" onClick={() => { setXem(xem === l ? null : l); if (l === "bill") xemBill(); }}>
            <Eye size={14} /> Xem trước
          </button>
        </div>
      ))}
      {dsNhom.length > 0 && (
        <div style={dong}>
          <span>Nhóm món là đồ uống pha (in tem + phiếu pha chế):</span>
          {dsNhom.map((g) => (
            <label key={g}>
              <input type="checkbox" checked={!boIn.khong_pha.includes(g)}
                onChange={(e) => setBoIn((b) => ({ ...b, khong_pha: e.target.checked ? b.khong_pha.filter((x) => x !== g) : [...b.khong_pha, g] }))} /> {NHAN_NHOM[g] || g}
            </label>
          ))}
        </div>
      )}
      <label style={dong}>
        <input type="checkbox" checked={boIn.tu_mo} onChange={(e) => setBoIn((b) => ({ ...b, tu_mo: e.target.checked }))} /> Tự mở in sau thanh toán
      </label>
      {xem === "bill" && <small>Bill: xem ở khung xem trước bên phải.</small>}
      {xem && xem !== "bill" && (
        <label style={dong}><input type="checkbox" checked={xemInLai} onChange={(e) => setXemInLai(e.target.checked)} /> Xem dạng IN LẠI</label>
      )}
      {viec && (
        <div style={{ zoom: 2, display: "inline-block", boxShadow: "0 0 4px #888" }}>
          <VungTrang viec={viec} cha={null} />
        </div>
      )}
      {xem && xem !== "bill" && !viec && <small>Loại này đang không có gì để in với đơn mẫu (kiểm tra nhóm món).</small>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function InvoiceSettings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [boIn, setBoIn] = useState(() => docBoIn({}));   // P16: bộ in sau thanh toán
  const [boInDaNap, setBoInDaNap] = useState(false);     // chỉ true khi đã đọc được từ máy chủ (không có bản nháp trong cache)
  const [chuHd, setChuHd] = useState(() => ({ ...docChu({}), soTo: soToTuCaiDat({}), khUrl: "", daSua: [] }));   // HD-1
  const [chuHdDaNap, setChuHdDaNap] = useState(false);
  const [caiDatTho, setCaiDatTho] = useState({});
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [previewSize, setPreviewSize] = useState("80mm");
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    order_info: true,
    customer: true,
    products: true,
    totals: true,
    signatures: true,
    footer: true,
  });
  const [activePreset, setActivePreset] = useState("custom");

  // ═══════════════════════════════════════════════════════════════════════════
  // STALE-WHILE-REVALIDATE: Có cache → hiện ngay, API chạy ngầm
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    let hasCache = false;

    // Bước 1: Load từ cache NGAY LẬP TỨC (0ms)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { config: cachedConfig, logo: cachedLogo } = JSON.parse(cached);
        if (cachedConfig) {
          setConfig((prev) => mergeConfig(prev, cachedConfig));
          hasCache = true;
        }
        if (cachedLogo) setLogo(cachedLogo);
      }
    } catch (e) {
      console.warn("Cache read error:", e);
    }

    // Bước 2: Chỉ hiện loading nếu KHÔNG có cache
    if (!hasCache) {
      setLoading(true);
    }

    // Bước 3: Load từ API (chạy ngầm nếu có cache)
    try {
      const result = await api.loadAll();

      if (result.success && result.data) {
        const settings = result.data;

        // Parse invoice_config
        let newConfig = DEFAULT_CONFIG;
        if (settings.invoice_config) {
          try {
            const parsed = JSON.parse(settings.invoice_config);
            newConfig = mergeConfig(DEFAULT_CONFIG, parsed);
          } catch (e) {
            console.warn("Parse config error:", e);
          }
        }
        setConfig(newConfig);
        setBoIn(docBoIn(settings));
        setBoInDaNap(true);
        setChuHd({ ...docChu(settings), soTo: soToTuCaiDat(settings), khUrl: String(settings[KHOA_DIA_CHI_KH] || ""), daSua: [] });
        setCaiDatTho(settings);
        setChuHdDaNap(true);

        // Logo: dùng shared helper (cache-first, chỉ gọi API nếu cache trống)
        const newLogo = await getLogo();
        if (newLogo) setLogo(newLogo);

        // Save to cache
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              config: newConfig,
              logo: newLogo,
              timestamp: Date.now(),
            }),
          );
        } catch (e) { console.warn('Không lưu được cache cấu hình hoá đơn sau khi tải (localStorage đầy/chặn, bỏ qua):', e); }
      }
    } catch (err) {
      console.error("Load settings error:", err);
      if (!hasCache) {
        showMessage("error", "Không thể tải cài đặt: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const mergeConfig = (defaults, loaded) => ({
    ...defaults,
    ...loaded,
    text: { ...defaults.text, ...(loaded.text || {}) },
    show: { ...defaults.show, ...(loaded.show || {}) },
    align: { ...defaults.align, ...(loaded.align || {}) },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveConfig(config, boInDaNap ? boIn : null, chuHdDaNap ? chuHdThanhCaiDat(chuHd) : null);
      // Update cache
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            config,
            logo,
            timestamp: Date.now(),
          }),
        );
      } catch (e) { console.warn('Không lưu được cache sau khi lưu cài đặt (đã lưu server thành công, chỉ cache lỗi):', e); }
      showMessage("success", "✓ Đã lưu cài đặt hóa đơn!");
    } catch (err) {
      showMessage("error", "Lỗi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc muốn reset về mặc định?")) {
      setConfig(DEFAULT_CONFIG);
      setBoIn(docBoIn({}));
      // Tên quán + địa chỉ/SĐT mặc định là của quán (store_*), không phải hằng số: reset không được xoá địa chỉ / đè tên quán
      setChuHd({ chu: chuMacDinhCuaQuan(caiDatTho), an: Object.fromEntries(Object.keys(CHU_MAC_DINH).map((k) => [k, false])), soTo: soToTuCaiDat({}), khUrl: chuHd.khUrl, daSua: khoaChuGhiKhiReset(caiDatTho) });
      setActivePreset("custom");
      showMessage("info", 'Đã reset. Nhấn "Lưu cài đặt" để áp dụng.');
    }
  };

  const applyPreset = (key) => {
    if (key === "custom") {
      setActivePreset("custom");
      return;
    }
    const preset = PRESETS[key];
    if (preset) {
      setConfig((prev) => ({
        ...prev,
        show: { ...prev.show, ...preset.show },
      }));
      setActivePreset(key);
      showMessage(
        "info",
        `Đã áp dụng mẫu "${preset.name}". Nhấn Lưu để áp dụng.`,
      );
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleShow = (field) => {
    setConfig((prev) => ({
      ...prev,
      show: { ...prev.show, [field]: !prev.show[field] },
    }));
    setActivePreset("custom");
  };

  const updateText = (field, value) => {
    setConfig((prev) => ({ ...prev, text: { ...prev.text, [field]: value } }));
  };

  const updateAlign = (section, value) => {
    setConfig((prev) => ({
      ...prev,
      align: { ...prev.align, [section]: value },
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      showMessage("error", "Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)");
      return;
    }
    if (file.size > 500 * 1024) {
      showMessage("error", "File quá lớn (tối đa 500KB)");
      return;
    }
    setSaving(true);
    try {
      const result = await api.uploadLogo(file);
      // Dùng base64 từ server (đã verify lưu DB thành công) thay vì FileReader
      const verifiedLogo = result.data?.logo;
      if (verifiedLogo) {
        setLogo(verifiedLogo);
        // Cập nhật cache NGAY để Orders/Sales dùng được
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              config,
              logo: verifiedLogo,
              timestamp: Date.now(),
            }),
          );
        } catch (ce) { console.warn('Không lưu được cache logo sau khi upload (đã lưu server thành công, chỉ cache lỗi):', ce); }
      } else {
        // Fallback: dùng FileReader nếu server không trả base64
        const reader = new FileReader();
        reader.onload = () => {
          setLogo(reader.result);
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                config,
                logo: reader.result,
                timestamp: Date.now(),
              }),
            );
          } catch (ce) { console.warn('Không lưu được cache logo (nhánh FileReader fallback, không ảnh hưởng hiện logo):', ce); }
        };
        reader.readAsDataURL(file);
      }
      showMessage("success", "✓ Đã upload logo!");
    } catch (err) {
      showMessage("error", "Lỗi: " + err.message);
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  if (loading) {
    return (
      <div className="invoice-settings">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải cài đặt...</p>
        </div>
        <style>{`
          .invoice-settings { padding: 1rem; }
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; gap: 1rem; }
          .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="invoice-settings">
      {/* Header */}
      <div className="settings-header">
        <h1>⚙️ Cài đặt Hóa đơn</h1>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>{message.text}</div>
      )}

      {/* Preset bar */}
      <div className="preset-bar">
        <span className="preset-label">Mẫu nhanh:</span>
        <div className="preset-buttons">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`preset-btn ${activePreset === key ? "active" : ""}`}
              onClick={() => applyPreset(key)}
            >
              {preset.name}
            </button>
          ))}
          <button
            className={`preset-btn ${activePreset === "custom" ? "active" : ""}`}
            onClick={() => setActivePreset("custom")}
          >
            Tùy chỉnh
          </button>
        </div>
        <div className="size-selector">
          <span>Khổ mặc định:</span>
          <select
            value={khoHoaDon(boIn.bill.kho)}
            onChange={(e) =>
              setBoIn((b) => ({ ...b, bill: { ...b.bill, kho: e.target.value } }))
            }
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      <div className="settings-content">
        {/* Left: Settings */}
        <div className="settings-panel">
          <h2>📝 Tùy chỉnh</h2>

          <fieldset disabled={!boInDaNap} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
            <BoInCaiDat boIn={boIn} setBoIn={setBoIn} xemBill={() => setPreviewSize(boIn.bill.kho)} caiDatChu={caiDatTuChuDangSua(caiDatTho, chuHd)} />
          </fieldset>

          <fieldset disabled={!chuHdDaNap} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
            <ChuHoaDon c={chuHd} setC={setChuHd} caiDat={caiDatTho} size={boIn.bill.kho} />
          </fieldset>

          {/* HEADER Section */}
          <div className="section">
            <SectionHeader
              id="header"
              title="HEADER"
              alignable
              expanded={expandedSections.header}
              onToggle={toggleSection}
              currentAlign={config.align.header}
              onAlignUpdate={updateAlign}
            />
            {expandedSections.header && (
              <div className="section-content">
                {/* Logo */}
                <div className="toggle-field logo-field">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={config.show.logo}
                      onChange={() => toggleShow("logo")}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">Logo</span>
                  </label>
                  {config.show.logo && (
                    <div className="logo-upload">
                      {logo ? (
                        <div className="logo-preview">
                          <img src={logo} alt="Logo" />
                          <button
                            className="btn-remove-logo"
                            onClick={async () => {
                              if (!confirm("Bạn có chắc muốn xóa logo?"))
                                return;
                              try {
                                await api.deleteLogo();
                                setLogo("");
                                // Xóa logo khỏi cache
                                try {
                                  const cached =
                                    localStorage.getItem(CACHE_KEY);
                                  const cacheData = cached
                                    ? JSON.parse(cached)
                                    : {};
                                  localStorage.setItem(
                                    CACHE_KEY,
                                    JSON.stringify({
                                      ...cacheData,
                                      logo: "",
                                      timestamp: Date.now(),
                                    }),
                                  );
                                } catch (ce) { console.warn('Không lưu được cache sau khi xoá logo (đã xoá server thành công, chỉ cache lỗi):', ce); }
                                showMessage("success", "✓ Đã xóa logo");
                              } catch (err) {
                                showMessage("error", "Lỗi: " + err.message);
                              }
                            }}
                            title="Xóa logo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="upload-btn">
                          <Upload size={14} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: "none" }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <ToggleWithInput
                  field="store_name"
                  label="Tên cửa hàng"
                  checked={config.show.store_name}
                  onToggle={toggleShow}
                  textValue={config.text.store_name}
                  onTextChange={(v) => updateText("store_name", v)}
                  placeholder="Tên cửa hàng"
                />
                <ToggleWithInput
                  field="slogan"
                  label="Slogan"
                  checked={config.show.slogan}
                  onToggle={toggleShow}
                  textValue={config.text.slogan}
                  onTextChange={(v) => updateText("slogan", v)}
                  placeholder="Slogan"
                />
                <ToggleWithInput
                  field="address"
                  label="Địa chỉ"
                  checked={config.show.address}
                  onToggle={toggleShow}
                  textValue={config.text.address}
                  onTextChange={(v) => updateText("address", v)}
                  placeholder="Địa chỉ"
                />
                <ToggleWithInput
                  field="phone"
                  label="Hotline"
                  checked={config.show.phone}
                  onToggle={toggleShow}
                  textValue={config.text.phone}
                  onTextChange={(v) => updateText("phone", v)}
                  placeholder="Số điện thoại"
                />
                <ToggleWithInput
                  field="email"
                  label="Email"
                  checked={config.show.email}
                  onToggle={toggleShow}
                  textValue={config.text.email}
                  onTextChange={(v) => updateText("email", v)}
                  placeholder="Email"
                  inputType="email"
                />
              </div>
            )}
          </div>

          {/* ORDER INFO Section */}
          <div className="section">
            <SectionHeader
              id="order_info"
              title="ĐƠN HÀNG"
              alignable
              expanded={expandedSections.order_info}
              onToggle={toggleSection}
              currentAlign={config.align.order_info}
              onAlignUpdate={updateAlign}
            />
            {expandedSections.order_info && (
              <div className="section-content">
                <ToggleOnly
                  field="invoice_number"
                  label="Số hóa đơn"
                  checked={config.show.invoice_number}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="order_code"
                  label="Mã đơn hàng"
                  checked={config.show.order_code}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="datetime"
                  label="Ngày giờ"
                  checked={config.show.datetime}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="staff"
                  label="Nhân viên"
                  checked={config.show.staff}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="qr_code"
                  label="QR code tra cứu"
                  checked={config.show.qr_code}
                  onToggle={toggleShow}
                />
              </div>
            )}
          </div>

          {/* CUSTOMER Section */}
          <div className="section">
            <SectionHeader
              id="customer"
              title="KHÁCH HÀNG"
              alignable
              expanded={expandedSections.customer}
              onToggle={toggleSection}
              currentAlign={config.align.customer}
              onAlignUpdate={updateAlign}
            />
            {expandedSections.customer && (
              <div className="section-content">
                <ToggleOnly
                  field="customer_name"
                  label="Tên khách"
                  checked={config.show.customer_name}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="customer_phone"
                  label="Số điện thoại"
                  checked={config.show.customer_phone}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="customer_address"
                  label="Địa chỉ giao hàng"
                  checked={config.show.customer_address}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="customer_balance"
                  label="Số dư tài khoản"
                  checked={config.show.customer_balance}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="customer_type"
                  label="Hạng Thành viên"
                  checked={config.show.customer_type}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="customer_note"
                  label="Ghi chú"
                  checked={config.show.customer_note}
                  onToggle={toggleShow}
                />
              </div>
            )}
          </div>

          {/* PRODUCTS Section */}
          <div className="section">
            <SectionHeader
              id="products"
              title="BẢNG SẢN PHẨM"
              expanded={expandedSections.products}
              onToggle={toggleSection}
            />
            {expandedSections.products && (
              <div className="section-content">
                <ToggleOnly
                  field="col_stt"
                  label="Cột STT"
                  checked={config.show.col_stt}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="col_product_code"
                  label="Cột mã SP"
                  checked={config.show.col_product_code}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="col_unit"
                  label="Cột đơn vị tính"
                  checked={config.show.col_unit}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="col_price"
                  label="Cột đơn giá"
                  checked={config.show.col_price}
                  onToggle={toggleShow}
                />
              </div>
            )}
          </div>

          {/* TOTALS Section */}
          <div className="section">
            <SectionHeader
              id="totals"
              title="THANH TOÁN"
              alignable
              expanded={expandedSections.totals}
              onToggle={toggleSection}
              currentAlign={config.align.totals}
              onAlignUpdate={updateAlign}
            />
            {expandedSections.totals && (
              <div className="section-content">
                <ToggleOnly
                  field="discount_detail"
                  label="Chi tiết chiết khấu"
                  checked={config.show.discount_detail}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="shipping_fee"
                  label="Phí giao hàng"
                  checked={config.show.shipping_fee}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="amount_words"
                  label="Số tiền bằng chữ"
                  checked={config.show.amount_words}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="payment_checkbox"
                  label="Checkbox xác nhận TT"
                  checked={config.show.payment_checkbox}
                  onToggle={toggleShow}
                />
              </div>
            )}
          </div>

          {/* SIGNATURES Section */}
          <div className="section">
            <SectionHeader
              id="signatures"
              title="CHỮ KÝ"
              alignable
              expanded={expandedSections.signatures}
              onToggle={toggleSection}
              currentAlign={config.align.signatures}
              onAlignUpdate={updateAlign}
            />
            {expandedSections.signatures && (
              <div className="section-content">
                <ToggleOnly
                  field="sig_seller"
                  label="NV bán hàng"
                  checked={config.show.sig_seller}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="sig_shipper"
                  label="NV giao hàng"
                  checked={config.show.sig_shipper}
                  onToggle={toggleShow}
                />
                <ToggleOnly
                  field="sig_customer"
                  label="Khách hàng"
                  checked={config.show.sig_customer}
                  onToggle={toggleShow}
                />
              </div>
            )}
          </div>

          {/* FOOTER Section */}
          <div className="section">
            <SectionHeader
              id="footer"
              title="FOOTER"
              alignable
              expanded={expandedSections.footer}
              onToggle={toggleSection}
              currentAlign={config.align.footer}
              onAlignUpdate={updateAlign}
            />
            {expandedSections.footer && (
              <div className="section-content">
                <ToggleWithInput
                  field="thank_you"
                  label="Lời cảm ơn"
                  checked={config.show.thank_you}
                  onToggle={toggleShow}
                  textValue={config.text.thank_you}
                  onTextChange={(v) => updateText("thank_you", v)}
                  placeholder="Lời cảm ơn"
                />
                <ToggleWithInput
                  field="policy"
                  label="Chính sách"
                  checked={config.show.policy}
                  onToggle={toggleShow}
                  textValue={config.text.policy}
                  onTextChange={(v) => updateText("policy", v)}
                  placeholder="Chính sách đổi trả"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2>
              <Eye size={18} /> Xem trước
            </h2>
            <div className="preview-size-buttons">
              {KHO_BILL.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${previewSize === size ? "active" : ""}`}
                  onClick={() => setPreviewSize(size)}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="preview-container">
            <InvoicePreview config={config} size={previewSize} logo={logo} />
          </div>
        </div>
      </div>

      <style>{`
        .invoice-settings { padding: 1rem; max-width: 1600px; margin: 0 auto; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; gap: 1rem; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
        .settings-header h1 { margin: 0; font-size: 1.5rem; }
        .header-actions { display: flex; gap: 0.5rem; }
        
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
        .btn-primary { background: #10b981; color: white; border: none; }
        .btn-primary:hover { background: #059669; }
        .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
        .btn-outline { background: white; color: #374151; border: 1px solid #d1d5db; }
        .btn-outline:hover { background: #f3f4f6; }
        
        .message { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-weight: 500; }
        .message-success { background: #d1fae5; color: #065f46; }
        .message-error { background: #fee2e2; color: #991b1b; }
        .message-info { background: #dbeafe; color: #1e40af; }
        
        .preset-bar { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem; flex-wrap: wrap; }
        .preset-label { font-weight: 500; color: #64748b; }
        .preset-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .preset-btn { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; }
        .preset-btn:hover { border-color: #10b981; color: #10b981; }
        .preset-btn.active { background: #10b981; color: white; border-color: #10b981; }
        .size-selector { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
        .size-selector select { padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; }
        
        .settings-content { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
        @media (max-width: 1024px) { .settings-content { grid-template-columns: 1fr; } }
        
        .settings-panel { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .settings-panel h2 { margin: 0; padding: 1rem; font-size: 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        
        .section { border-bottom: 1px solid #e2e8f0; }
        .section:last-child { border-bottom: none; }
        .section-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; cursor: pointer; background: #fafafa; user-select: none; }
        .section-header:hover { background: #f0f0f0; }
        .section-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.8rem; color: #374151; }
        .align-buttons { display: flex; gap: 2px; }
        .align-btn { padding: 4px 6px; border: 1px solid #d1d5db; background: white; cursor: pointer; color: #64748b; border-radius: 3px; }
        .align-btn:hover { background: #f3f4f6; }
        .align-btn.active { background: #10b981; color: white; border-color: #10b981; }
        .section-content { padding: 0.5rem 1rem 1rem; }
        
        .toggle-field { margin-bottom: 0.5rem; }
        .toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.25rem 0; }
        .toggle-label input { display: none; }
        .toggle-switch { width: 36px; height: 20px; background: #d1d5db; border-radius: 10px; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s; }
        .toggle-label input:checked + .toggle-switch { background: #10b981; }
        .toggle-label input:checked + .toggle-switch::after { transform: translateX(16px); }
        .toggle-text { font-size: 0.875rem; color: #374151; }
        .toggle-input { margin-top: 0.375rem; margin-left: 44px; }
        .toggle-input input { width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.875rem; }
        .toggle-input input:focus { outline: none; border-color: #10b981; }
        
        .logo-field { display: flex; align-items: center; justify-content: space-between; }
        .logo-upload { display: flex; align-items: center; }
        .logo-preview { position: relative; width: 40px; height: 40px; }
        .logo-preview img { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; }
        .btn-remove-logo { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .upload-btn { display: flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.5rem; background: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 4px; cursor: pointer; font-size: 0.75rem; color: #64748b; }
        .upload-btn:hover { background: #e5e7eb; }
        
        .preview-panel { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .preview-header h2 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .preview-size-buttons { display: flex; gap: 0.25rem; }
        .size-btn { padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; background: white; cursor: pointer; font-size: 0.75rem; font-weight: 500; border-radius: 4px; }
        .size-btn:hover { background: #f3f4f6; }
        .size-btn.active { background: #1e293b; color: white; border-color: #1e293b; }
        .preview-container { padding: 1.5rem; background: #f1f5f9; min-height: 600px; display: flex; justify-content: center; overflow: auto; }
        
        @media (max-width: 640px) {
          .settings-header { flex-direction: column; align-items: stretch; }
          .header-actions { justify-content: flex-end; }
          .preset-bar { flex-direction: column; align-items: stretch; }
          .size-selector { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
