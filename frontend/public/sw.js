// PagaTiempo Service Worker
// Estrategia:
//   - Navegaciones (HTML): network-first con fallback a index.html cacheado.
//   - Assets estáticos: cache-first.
//   - API: nunca se intercepta ni se cachea (datos privados y cambiantes).

const CACHE_NAME = "pagatiempo-v2";
const APP_SHELL = ["/logo.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar mutaciones ni peticiones de otros orígenes.
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // La API siempre va directo a la red: sin cache ni respuestas viejas.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navegaciones: red primero para no servir un index.html viejo que
  // apunte a assets inexistentes. Si no hay red, usamos el shell cacheado.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("/index.html", cloned);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/index.html");
          return cached ?? Response.error();
        })
    );
    return;
  }

  // Assets estáticos: cache-first con relleno de cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      });
    })
  );
});
