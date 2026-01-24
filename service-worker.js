const CACHE_NAME = "aix-sec-pwa-v3";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // FlightRadar API – Network first
  if (url.hostname.includes("flightradar24.com")) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets – Cache first
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
