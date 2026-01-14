/**
 * POS Tú Quý Đường - Service Worker v1
 * Network-first với cache fallback
 */

const CACHE_NAME = 'pos-tqd-v1';

// Assets cache khi install
const PRECACHE = [
  '/',
  '/manifest.json'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install failed:', err))
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - Network first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET
  if (request.method !== 'GET') return;
  
  // Skip API - luôn lấy từ network
  if (request.url.includes('/api/')) return;
  
  // Skip external
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('/');
        return new Response('Offline', { status: 503 });
      }))
  );
});
