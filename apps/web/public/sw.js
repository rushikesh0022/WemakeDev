const CACHE = "zaply-shell-v2";
const SHELL = ["/", "/manifest.webmanifest", "/nesto/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    const url = new URL(event.request.url);
    if (response.ok && event.request.destination === "document" && url.pathname === "/") {
      caches.open(CACHE).then((cache) => cache.put("/", response.clone()));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (new URL(event.request.url).pathname === "/") {
      const home = await caches.match("/");
      if (home) return home;
    }
    return new Response("Zaply is temporarily offline. Please reconnect and try again.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }));
});
