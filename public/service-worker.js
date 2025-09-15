// Nenhum fetch interceptado


const CACHE_NAME = "semana-academica-v1";
const STATIC_ASSETS = [
    "/css/style.css",
    "/img/favicon.svg",
    "/img/ifc.webp",
    "/manifest.json",
];

// Install - pré-cache dos arquivos estáticos
self.addEventListener("install", (event) => {
    console.log("[ServiceWorker] Install");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[ServiceWorker] Caching static assets");
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate - limpar caches antigos
self.addEventListener("activate", (event) => {
    console.log("[ServiceWorker] Activate");
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log("[ServiceWorker] Removing old cache:", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - servir do cache ou buscar na rede
// self.addEventListener("fetch", (event) => {
//     const { request } = event;

//     // Ignorar requests cross-origin (redirecionamentos externos)
//     if (!request.url.startsWith(self.location.origin)) return;

//     event.respondWith(
//         caches.match(request).then((cachedResponse) => {
//             if (cachedResponse) {
//                 return cachedResponse;
//             }
//             return fetch(request, { redirect: "follow" }).then((networkResponse) => {
//                 // Só cacheia respostas válidas
//                 if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
//                     return networkResponse;
//                 }
//                 // Clonar a resposta porque a Response é um stream
//                 const responseToCache = networkResponse.clone();
//                 caches.open(CACHE_NAME).then((cache) => {
//                     cache.put(request, responseToCache);
//                 });
//                 return networkResponse;
//             }).catch(() => {
//                 // Fallback offline
//                 if (request.destination === "document") {
//                     return caches.match("/"); // página inicial offline
//                 }
//             });
//         })
//     );
// });
