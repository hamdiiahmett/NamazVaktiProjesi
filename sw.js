// Çevrimdışı önbelleğe alınacak dosyaların listesi
const CACHE_NAME = 'namaz-vakti-cache-v1';
const urlsToCache = [
  '/', // Ana sayfa (index.html)
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.jpeg', // YENİ EKLENDİ (JPEG)
  '/icon-512.jpeg'  // YENİ EKLENDİ (JPEG)
];

// 1. Service Worker'ı Yükle (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. İstekleri Yakala (Fetch)
self.addEventListener('fetch', event => {
  // API isteklerini cache'leme
  if (event.request.url.includes('api.collectapi.com')) {
    return event.respondWith(fetch(event.request));
  }

  // Diğer her şey için (HTML, CSS, JS, İkonlar) önce cache'e bak
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache'ten döndür
        }
        return fetch(event.request); // İnternetten çek
      }
    )
  );
});