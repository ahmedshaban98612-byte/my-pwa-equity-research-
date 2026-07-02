// اسم الـ Cache
const CACHE_NAME = 'equity-research-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js'
];

// 1. حدث التثبيت - تخزين الملفات
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: تثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 تخزين الملفات المهمة...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('❌ خطأ في التثبيت:', error);
      })
  );
});

// 2. حدث التفعيل - تنظيف الـ Caches القديمة
self.addEventListener('activate', (event) => {
  console.log('✨ Service Worker: تفعيل...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ حذف cache قديم: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. حدث الجلب - استراتيجية الـ Cache First
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log(`✅ من Cache: ${event.request.url}`);
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log(`📥 تخزين: ${event.request.url}`);
              });

            return response;
          })
          .catch((error) => {
            console.error(`❌ خطأ في الجلب: ${event.request.url}`, error);
            
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

console.log('🚀 Service Worker جاهز!');
