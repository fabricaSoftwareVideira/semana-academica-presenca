document.addEventListener('DOMContentLoaded', () => {
    const resultadoDiv = document.getElementById("resultado");
    const readerDiv = document.getElementById("reader");
    const btnStart = document.getElementById("btnStart");

    let html5QrcodeScanner = null;
    let scannerAtivo = false;
    let processingScan = false;

    function safeResume() {
        try {
            if (html5QrcodeScanner && typeof html5QrcodeScanner.resume === 'function') html5QrcodeScanner.resume();
        } catch (e) { console.warn('resume falhou', e); }
    }

    function safePause() {
        try {
            if (html5QrcodeScanner && typeof html5QrcodeScanner.pause === 'function') html5QrcodeScanner.pause();
        } catch (e) { console.warn('pause falhou', e); }
    }

    function onScanSuccess(decodedText) {
        if (processingScan) return;
        processingScan = true;

        // Pausar scanner temporariamente (se disponível)
        safePause();

        // Consultar pontuação
        fetch('/pontuacao/ler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: decodedText })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    resultadoDiv.innerHTML = `
                        <div class="sucesso" style="display:flex;gap:12px;align-items:center;">
                            <div id="miniatura-wrap" style="width:120px;height:90px;overflow:hidden;border-radius:6px;background:#111;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">Sem imagem</div>
                            <div>
                                <h2><i class="fa fa-user"></i> ${data.aluno.nome}</h2>
                                <p><strong>Matrícula:</strong> ${data.aluno.matricula}</p>
                                <p><strong>Turma:</strong> ${data.aluno.turma}</p>
                                <h3><i class="fa fa-trophy"></i> Pontuação: ${data.pontuacao}</h3>
                            </div>
                        </div>
                    `;

                    // tenta capturar frame de vídeo do leitor e inserir como miniatura
                    try {
                        const video = document.querySelector('#reader video');
                        if (video && video.readyState >= 2) {
                            const canvas = document.createElement('canvas');
                            canvas.width = 320;
                            canvas.height = 240;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const img = document.createElement('img');
                            img.src = canvas.toDataURL('image/png');
                            img.style.width = '120px';
                            img.style.height = '90px';
                            img.style.objectFit = 'cover';
                            const wrap = document.getElementById('miniatura-wrap');
                            if (wrap) { wrap.innerHTML = ''; wrap.appendChild(img); }
                        }
                    } catch (e) {
                        console.warn('Não foi possível capturar miniatura:', e);
                    }
                } else {
                    resultadoDiv.innerHTML = `<div class="erro"><i class="fa fa-exclamation-triangle"></i> ${data.message}</div>`;
                }
            })
            .catch(err => {
                resultadoDiv.innerHTML = `<div class="erro">Erro ao consultar pontuação.</div>`;
                console.error(err);
            })
            .finally(() => {
                // Retomar scanner após 2 segundos
                setTimeout(() => {
                    safeResume();
                    processingScan = false;
                }, 2000);
            });
    }

    function iniciarScanner() {
        if (typeof Html5Qrcode === 'undefined') {
            resultadoDiv.innerHTML = `<div class="erro">Biblioteca de QR Code não encontrada.</div>`;
            return;
        }
        readerDiv.style.display = "block";
        if (!html5QrcodeScanner) html5QrcodeScanner = new Html5Qrcode("reader");

        // calcula qrbox baseado na largura disponível do elemento leitor
        const availableWidth = Math.min(window.innerWidth || 360, Math.max(240, readerDiv.clientWidth || 360));
        // aumenta qrbox em telas largas
        const base = Math.floor(Math.min(availableWidth * 0.85, 640));
        const qrboxSize = Math.max(200, Math.min(base, 520));

        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: qrboxSize },
            onScanSuccess
        ).then(() => {
            scannerAtivo = true;
            btnStart.innerHTML = "<i class='fa fa-stop'></i> Parar Scanner";
            btnStart.classList.remove('btn-primary');
            btnStart.classList.add('btn-danger');
            btnStart.classList.add('btn-scan-active');
        }).catch(err => {
            resultadoDiv.innerHTML = `<div class="erro">Erro ao iniciar câmera: ${err && err.message ? err.message : err}</div>`;
            console.error(err);
            scannerAtivo = false;
        });
    }

    function pararScanner() {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                try { html5QrcodeScanner.clear(); } catch (e) { /* ignore */ }
                readerDiv.style.display = "none";
                scannerAtivo = false;
                btnStart.innerHTML = "<i class='fa fa-camera'></i> Iniciar Scanner";
                btnStart.classList.remove('btn-danger');
                btnStart.classList.remove('btn-scan-active');
                btnStart.classList.add('btn-primary');
            }).catch(err => {
                console.error("Erro ao parar scanner:", err);
            });
        }
    }

    btnStart.addEventListener("click", () => {
        if (scannerAtivo) {
            pararScanner();
        } else {
            iniciarScanner();
        }
    });
});