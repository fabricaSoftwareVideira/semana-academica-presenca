// Instalação PWA: botão customizado
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.style.display = 'flex';
});

document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installBtn.style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }
});
// src/public/js/main.js (ou outro arquivo JS externo)
document.addEventListener("DOMContentLoaded", () => {
    const topBtn = document.getElementById("topBtn");
    if (topBtn) {
        topBtn.addEventListener("click", () => {
            window.location.href = "/participacao";
        });
    }
});

// Service Worker (se disponível)
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
        .then((reg) => console.log("Service Worker registrado:", reg))
        .catch((err) => console.error("Erro ao registrar Service Worker:", err));
}
