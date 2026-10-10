/* OpenAA EN service worker：静态资源缓存优先，页面网络优先 */
var CACHE = 'openaa-en-v1';
var STATIC_RE = /\.(?:css|js|png|jpg|jpeg|gif|webp|svg|ico|json|woff2?)$/;
var INDEX_RE = /^\/search-index\..*\.json$/;

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

function putIfOk(cache, req, res) {
  if (res && res.ok) {
    try { cache.put(req, res.clone()); } catch (e) { /* ignore */ }
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  var path = new URL(req.url).pathname;

  /* 搜索索引：network-first，保证部署新内容后立即生效 */
  if (INDEX_RE.test(path)) {
    e.respondWith(
      fetch(req).then(function (res) {
        return caches.open(CACHE).then(function (cache) { return putIfOk(cache, req, res); });
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  if (STATIC_RE.test(path)) {
    /* stale-while-revalidate；缓存未命中且离线时抛给浏览器处理，不 respondWith(null) */
    e.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match(req).then(function (hit) {
          var net = fetch(req).then(function (res) {
            return putIfOk(cache, req, res);
          }).catch(function () {
            if (hit) return hit;
            throw new Error('offline');
          });
          return hit || net;
        });
      })
    );
  } else {
    /* 页面 network-first；只缓存 2xx，不缓存 404/500 */
    e.respondWith(
      fetch(req).then(function (res) {
        return caches.open(CACHE).then(function (cache) { return putIfOk(cache, req, res); });
      }).catch(function () {
        return caches.match(req);
      })
    );
  }
});
