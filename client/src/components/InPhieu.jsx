/**
 * InPhieu.jsx — vẽ và in tem cốc / phiếu pha chế (P16, giai đoạn 1: in qua trình duyệt).
 *
 * Nội dung từng trang do hàm thuần utils/inPhieu.js dựng; file này chỉ VẼ và đưa ra hộp in.
 * Hàng đợi in / chọn máy in là P17 — ở đây mỗi loại một hộp in của trình duyệt (chọn được máy in riêng cho từng loại).
 */
import { useEffect, useState } from 'react';
import { productsApi } from '../utils/api';

const KHO_GIAY = { '40x30': '40mm 30mm', '58mm': '58mm auto', '80mm': '80mm auto', a5: 'A5', a4: 'A4' };

// ─── Nhóm món theo mã (đơn lưu không mang nhóm) ───────────────────────────
const CHO_NHOM_TOI_DA_MS = 4000;   // SX chậm thì thôi chờ: tem in mọi món, không giữ bill đứng đợi
/** Bảng mã → nhóm từ danh sách sản phẩm. */
export const bangNhomTuDanhSach = (ds) => Object.fromEntries((ds || []).filter((p) => p.code && p.category).map((p) => [p.code, p.category]));

/**
 * Trả { nhomTheoMa, sanSang }. `bietSan` = bảng đã có (Sales đang giữ danh sách sản phẩm) → không gọi lại máy chủ.
 * Tải hỏng / quá CHO_NHOM_TOI_DA_MS → bảng rỗng (tem vẫn in, mặc định bật mọi nhóm).
 */
export function useNhomTheoMa(bietSan) {
  const [tai, setTai] = useState(null);
  const [het, setHet] = useState(false);
  useEffect(() => {
    if (bietSan) return undefined;
    let huy = false;
    const hen = setTimeout(() => setHet(true), CHO_NHOM_TOI_DA_MS);
    productsApi.list()
      .then((ds) => { if (!huy) setTai(bangNhomTuDanhSach(ds)); })
      .catch((e) => { console.warn('Không tải được nhóm món để lọc tem (in tem mọi món):', e); if (!huy) setHet(true); });
    return () => { huy = true; clearTimeout(hen); };
  }, [bietSan]);
  return { nhomTheoMa: bietSan || tai || {}, sanSang: !!(bietSan || tai || het) };
}

// ─── Trang tem / phiếu ───────────────────────────────────────────────────
const chuKieu = { fontFamily: 'Arial, sans-serif', color: '#000', boxSizing: 'border-box', overflow: 'hidden', background: '#fff' };
const nhanInLai = (chu = 'IN LẠI') => <b style={{ border: '1px solid #000', padding: '0 1mm', marginLeft: '1mm' }}>{chu}</b>;

function Tem({ t }) {
  // HD-1: số bill TO ở đầu tem; dòng đầu / cuối là chữ chủ quán tự đặt (trống thì không có)
  return (
    <div className="trang" style={{ ...chuKieu, width: '40mm', height: '29.5mm', padding: '1mm 1.5mm', fontSize: '7.5pt', lineHeight: 1.15, pageBreakAfter: 'always' }}>
      {t.dau && <div style={{ fontSize: '6.5pt', textAlign: 'center' }}>{t.dau}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '15pt', fontWeight: 'bold' }}>#{t.ma}</span>
        <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>{t.stt}</span>
      </div>
      <div style={{ fontSize: '9.5pt', fontWeight: 'bold' }}>{t.ten}</div>
      {t.ghiChu && <div style={{ fontWeight: 'bold', whiteSpace: 'pre-line' }}>{t.ghiChu}</div>}
      <div>{[t.khach, t.gio].filter(Boolean).join(' · ')}{t.inLai && nhanInLai(t.chuInLai)}</div>
      {t.chan && <div style={{ fontSize: '6.5pt', textAlign: 'center' }}>{t.chan}</div>}
    </div>
  );
}

function PhieuPhaChe({ p, kho }) {
  return (
    <div className="trang" style={{ ...chuKieu, width: kho === '58mm' ? '52mm' : '72mm', padding: '2mm', fontSize: '11pt', pageBreakAfter: 'always' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt' }}>PHIẾU PHA CHẾ{p.inLai && nhanInLai()}</div>
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '1.5mm', marginBottom: '1.5mm' }}>{p.ma} · {p.gio}</div>
      {p.dong.map((d, i) => (
        <div key={i} style={{ marginBottom: '1mm' }}>
          <b>{d.sl} × {d.ten}</b>{d.ghiChu && <div style={{ paddingLeft: '4mm', whiteSpace: 'pre-line' }}>— {d.ghiChu}</div>}
        </div>
      ))}
    </div>
  );
}

/** Các trang của một việc tem / phiếu. `cha` gắn ref vào khối cần lấy innerHTML để in. */
export function VungTrang({ viec, cha }) {
  return (
    <div ref={cha}>
      {viec.trang.map((t, i) => (viec.loai === 'tem' ? <Tem key={i} t={t} /> : <PhieuPhaChe key={i} p={t} kho={viec.kho} />))}
    </div>
  );
}

// ─── Đưa ra hộp in ───────────────────────────────────────────────────────
/** Tài liệu in cho tem / phiếu: lấy innerHTML của VungTrang, khổ giấy theo `kho`. */
export function taiLieuIn(tieuDe, than, kho) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tieuDe}</title><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .trang { border: none !important; }
    .trang:last-child { page-break-after: auto !important; }
    @page { size: ${KHO_GIAY[kho] || 'auto'}; margin: ${kho === '40x30' ? '0' : '2mm'}; }
  </style></head><body>${than}</body></html>`;
}

/** In một tài liệu HTML bằng iframe ẩn (không bị chặn popup như window.open sau khi hộp in trước đóng). Xong khi hộp in đóng. */
export function inQuaIframe(taiLieu) {
  return new Promise((xong, loi) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const dep = () => { f.remove(); xong(); };
    try {
      const w = f.contentWindow;
      w.document.open();
      w.document.write(taiLieu);
      w.document.close();
      const anh = Array.from(w.document.querySelectorAll('img'))
        .map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; })));
      Promise.all(anh).then(() => new Promise((r) => setTimeout(r, 300))).then(() => {
        w.onafterprint = dep;
        w.focus();
        w.print();
        setTimeout(dep, 60000);   // trình duyệt không báo afterprint → không treo chuỗi in
      }).catch((e) => { f.remove(); loi(e); });
    } catch (e) { f.remove(); loi(e); }
  });
}
