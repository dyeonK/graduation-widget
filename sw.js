// 캐시 우선 + 백그라운드 갱신: 네트워크가 느리거나 막혀도 즉시 표시
const CACHE = 'grad-widget-v3';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // APK는 캐시하지 않고 항상 최신 파일을 받는다
  if (new URL(e.request.url).pathname.endsWith('.apk')) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request)
      .then(res => {
        if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
        return res;
      })
      .catch(() => cached);
    if (cached) {
      e.waitUntil(network);
      return cached;
    }
    return network;
  }));
});
