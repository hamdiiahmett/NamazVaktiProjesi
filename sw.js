// Önbellek adını 'v4' olarak güncelliyoruz. En son ve en stabil sürüm.
const CACHE_NAME = 'namaz-vakti-cache-v4';
const OFFLINE_URL = '/index.html'; // İnternet yoksa bu sayfayı aç

// Önbelleğe eklenecek temel dosyalar (Uygulamanın "kabuğu")
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
        console.log('Cache açıldı (v4)');
        // Önce 'kabuğu' yükle
        return cache.addAll(urlsToCache)
          .then(() => {
            // Sonra 'çevrimdışı' sayfasını da garantiye al
            return cache.add(OFFLINE_URL);
          });
      })
      .catch(err => {
        console.error('Cache (v4) install failed:', err);
      })
  );
  // Yeni SW'nin beklemeden aktif olmasını sağla
  self.skipWaiting();
});

// 2. Eski Önbellekleri Temizle (Activate)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Sadece 'v4' kalsın
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // v4 dışındaki her şeyi (v1, v2, v3) sil
          }
        })
      );
    }).then(() => {
      // Aktif olur olmaz tüm istemcileri (sekmeleri) kontrolü altına al
      return self.clients.claim();
    })
  );
});

// 3. İstekleri Yakala (Fetch)
self.addEventListener('fetch', event => {
  // API isteklerini ASLA önbelleğe alma, her zaman internetten çek
  if (event.request.url.includes('api.collectapi.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Diğer tüm istekler için (HTML, CSS, JS, İKONLAR):
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. ÖNCELİK: Önbellekte varsa, hemen oradan döndür
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 2. ÖNCELİK: İnternetten çekmeye çalış
      return fetch(event.request).catch(() => {
        // 3. ÖNCELİK (HATA DURUMU): İnternet de yoksa, 'çevrimdışı' sayfasını göster
        return caches.match(OFFLINE_URL);
      });
    })
  );
});
