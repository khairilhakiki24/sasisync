const CACHE_NAME = 'sasisync-parity-v3';

// Daftar semua library eksternal dan file lokal yang ada di index.html
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://unpkg.com/html5-qrcode',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Hapus cache lama jika versi berubah
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Hanya cegat (intercept) request GET. Biarkan POST lewat langsung ke server (untuk Push Sync)
  if (event.request.method !== 'GET') return;
  
  // JANGAN cache request ke API Google Apps Script untuk memastikan sinkronisasi selalu real-time
  if (event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Jika ada di dalam cache, kembalikan response cache
      if (response) {
        return response;
      }

      // Jika tidak ada di cache, ambil dari network
      return fetch(event.request).then(res => {
        // Cek validitas response
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }

        // Simpan ke cache untuk penggunaan offline selanjutnya
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });

        return res;
      }).catch(err => {
        // Fallback jika offline dan aset tidak ada di cache
        console.warn('Network request failed and no cache available', err);
      });
    })
  );
});