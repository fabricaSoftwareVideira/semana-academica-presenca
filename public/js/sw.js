// Service Worker (se disponível)
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
        .then((reg) => console.log("Service Worker registrado:", reg))
        .catch((err) => console.error("Erro ao registrar Service Worker:", err));
}