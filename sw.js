/* Офлайн-кэш: игра — статика, поэтому кэшируем всё, чем пользовались.
   Стратегия: сеть в приоритете для index.html (чтобы обновления доезжали),
   кэш в приоритете для портретов (их много и они не меняются). */
const V = "wolf-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" || (req.destination === "document");
  if (isPage) {
    e.respondWith(
      fetch(req).then((r) => { caches.open(V).then((c) => c.put(req, r.clone())); return r; })
        .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok) caches.open(V).then((c) => c.put(req, r.clone()));
      return r;
    }))
  );
});
