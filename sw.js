// F5 五人手账 Service Worker v12
// 策略：HTML页面=网络优先（保证拿到最新版），静态资源=缓存优先（加速加载）
var CACHE_NAME = 'f5-journal-v12';

self.addEventListener('install', function(e) {
  // 立即激活，不等待旧 SW 释放
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) { return caches.delete(k); })
      );
    })
  );
  // 立即接管所有页面
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // 只处理同源请求，跨域 API 请求不拦截
  if (!e.request.url.startsWith(self.location.origin)) return;

  // 页面导航请求：网络优先（确保用户总拿到最新版 HTML）
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(response) {
        // 网络成功 → 更新缓存（静默，下次离线时可用）
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // 网络失败 → 尝试缓存（离线兜底）
        return caches.match(e.request);
      })
    );
    return;
  }

  // 静态资源（图标、manifest）：缓存优先，网络静默更新
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var fetched = fetch(e.request).then(function(response) {
          if (response.ok) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() {
          return cached;
        });
        // 有缓存先返回缓存，同时后台更新
        return cached || fetched;
      });
    })
  );
});
