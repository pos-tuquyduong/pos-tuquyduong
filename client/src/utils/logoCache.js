/**
 * Logo Cache Helper — Single source of truth
 * Cache-first: đọc localStorage ngay, fallback API nếu máy mới
 * Mọi trang import { getLogo } từ đây
 */
const CACHE_KEY = 'pos_invoice_settings_cache';

export async function getLogo() {
  // 1. Đọc từ cache (nhanh, offline-ready)
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { logo } = JSON.parse(cached);
      if (logo) return logo;
    }
  } catch (e) {}

  // 2. Cache trống (máy mới) → gọi API riêng
  try {
    const token = localStorage.getItem('pos_token');
    const res = await fetch('/api/pos/settings/store_logo', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.success && data.data?.value) {
      // Lưu cache cho lần sau
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cacheData = cached ? JSON.parse(cached) : {};
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ...cacheData, logo: data.data.value, timestamp: Date.now()
        }));
      } catch (ce) {}
      return data.data.value;
    }
  } catch (e) {
    console.warn('Logo API failed, no logo available');
  }

  return ''; // Không có logo → InvoicePreview hiện placeholder "LOGO"
}
