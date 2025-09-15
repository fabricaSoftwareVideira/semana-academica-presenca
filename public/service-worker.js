const CACHE_NAME = "semana-academica-v1";
const urlsToCache = [
    "/",
    "/css/style.css",
    "/img/favicon.svg",
    "/manifest.json"
];

// Instala o Service Worker e armazena os arquivos no cache
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Ativa e remove caches antigos
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            )
        )
    );
});

// Intercepta requisições e serve do cache se disponível
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
