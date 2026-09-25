const CACHE_NAME = "cric-scorer-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/matches",
  "/teams",
  "/players",
  "/statistics",
  "/manifest.json",
  "/icon.svg"
];

// Install: Cache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, fallback to cache for offline availability
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome extension / API mutation requests
  if (request.method !== "GET" || url.pathname.startsWith("/api/matches/") && request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback for HTML navigation
        if (request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});
