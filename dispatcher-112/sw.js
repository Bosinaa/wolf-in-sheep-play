/* Офлайн-кэш игры. Версию кэша подставляет сборщик, поэтому
   каждый новый деплой заводит свежий кэш и удаляет прежний — иначе у
   вернувшегося игрока навсегда остались бы старые портреты и старая вёрстка. */
const V = "wolf-202608121823";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // чужие домены не кэшируем

  // страницу берём из сети (чтобы обновления доезжали), кэш — только запас на офлайн
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req)
        .then((r) => { const c = r.clone(); caches.open(V).then((k) => k.put(req, c)); return r; })
        .catch(() => caches.match(req).then((r) => r || caches.match("./")))
    );
    return;
  }

  // остальное — из кэша сразу, но в фоне подтягиваем свежую версию
  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((r) => {
        if (r && r.ok) { const c = r.clone(); caches.open(V).then((k) => k.put(req, c)); }
        return r;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
