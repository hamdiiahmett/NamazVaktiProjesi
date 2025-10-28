// Önbellek adını 'v3' olarak güncelliyoruz.
const CACHE_NAME = 'namaz-vakti-cache-v3';

// Önbelleğe eklenecek temel dosyalar
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.jpeg',
  '/icon-512.jpeg'
];

// 1. Service Worker'ı Yükle (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache açıldı (v3)');
        // Temel dosyaları önbelleğe al
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache (v3) install failed:', err);
      })
  );
});

// 2. Eski Önbellekleri Temizle (Activate)
// Bu, eski 'v2' önbelleğini silecek
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Sadece 'v3' kalsın
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // v3 dışındaki her şeyi sil
          }
        })
      );
    })
  );
});

// 3. İstekleri Yakala (Fetch) - "Çevrimdışı-Öncelikli" Strateji
self.addEventListener('fetch', event => {
  
  // API isteklerini ASLA önbelleğe alma, her zaman internetten çek
  if (event.request.url.includes('api.collectapi.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Diğer tüm istekler için (HTML, CSS, JS, İKONLAR):
  event.respondWith(
    // Önce önbellekte (cache) var mı diye bak
    caches.match(event.request).then(cachedResponse => {
      
      // Önbellekte varsa, hemen oradan döndür
      if (cachedResponse) {
        return cachedResponse;
      }

      // Önbellekte yoksa, internetten çek
      return fetch(event.request).then(networkResponse => {
        // Gelen cevabı bir sonraki sefer için önbelleğe de kaydet
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse; // Cevabı döndür
        });
      });
    })
  );
});
