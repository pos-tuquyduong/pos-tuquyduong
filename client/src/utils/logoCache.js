/**
 * Logo Cache Helper — Single source of truth
 * Cache-first + TTL 24h: trả cache ngay, tự refresh nền nếu cũ
 * Mọi trang import { getLogo } từ đây
 */
const CACHE_KEY = 'pos_invoice_settings_cache';
const TTL = 24 * 60 * 60 * 1000; // 24 giờ

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function writeLogoToCache(logo) {
  try {
    const cached = readCache() || {};
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...cached, logo, timestamp: Date.now()
    }));
  } catch (e) {}
}

async function fetchLogoFromAPI() {
  const token = localStorage.getItem('pos_token');
  if (!token) return '';
  const res = await fetch('/api/pos/settings/store_logo', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  if (data.success && data.data?.value) {
    writeLogoToCache(data.data.value);
    return data.data.value;
  }
  return '';
}

export async function getLogo() {
  const cached = readCache();
  const cachedLogo = cached?.logo || '';
  const age = cached?.timestamp ? Date.now() - cached.timestamp : Infinity;

  // Cache có logo + còn fresh → trả ngay
  if (cachedLogo && age < TTL) return cachedLogo;

  // Cache có logo + cũ → trả ngay, refresh ngầm
  if (cachedLogo && age >= TTL) {
    fetchLogoFromAPI().catch(() => {});
    return cachedLogo;
  }

  // Không có cache → fetch đồng bộ
  try {
    return await fetchLogoFromAPI();
  } catch (e) {
    console.warn('Logo API failed');
    return '';
  }
}
