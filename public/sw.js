const CACHE_NAME = "finance-app-cache-v1";

const ASSETS_TO_CACHE = [
  "/",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Solo procesar peticiones GET
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Evitar interceptar peticiones de NextJS hot reloading (desarrollo), API y Auth
  if (
    url.pathname.startsWith("/_next/") || 
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("webpack")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en caché respuestas exitosas que sean de nuestro origen
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En caso de estar offline, servir desde la caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no hay caché, retornar error de red genérico
          return new Response("Network error", { status: 408, headers: { "Content-Type": "text/plain" } });
        });
      })
  );
});
