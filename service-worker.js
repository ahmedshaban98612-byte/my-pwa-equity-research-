// FinVal Pro - Service Worker
const CACHE_NAME = 'finval-pro-v1';
const ASSETS_TO_CACHE = [
  './',
  './zai',
  './manifest.json',
  './service-worker.js'
];

// حدث التثبيت
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: جاري التثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 جاري تخزين الملفات الضرورية...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('❌ خطأ في التثبيت:', error);
      })
  );
});

// حدث التفعيل
self.addEventListener('activate', (event) => {
  console.log('✨ Service Worker: جاري التفعيل...');
  
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

// حدث الجلب - استراتيجية Cache First
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // من الـ cache أولاً
        if (response) {
          console.log(`✅ من Cache: ${event.request.url}`);
          return response;
        }

        // ثم من الإنترنت
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
            
            // في حالة الفشل، حاول إرجاع الصفحة المحفوظة
            if (event.request.destination === 'document') {
              return caches.match('./zai');
            }
          });
      })
  );
});

// معالجة الرسائل
self.addEventListener('message', (event) => {
  console.log('📨 رسالة من الصفحة:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('🗑️ تم حذف الـ cache');
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('🚀 FinVal Pro Service Worker جاهز!');
