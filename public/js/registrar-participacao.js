const resultado = document.getElementById("resultado");
const erro = document.getElementById("erro");
const eventoSelect = document.getElementById("eventoSelect");
const btnStart = document.getElementById("btnStart");
const btnToggle = document.getElementById("btnToggle");
const readerDiv = document.getElementById("reader");

let html5QrcodeScanner;
let modo = "registrar";
let scannerAtivo = false; // novo controle

// alterna registrar/cancelar
btnToggle.addEventListener("click", () => {
    if (modo === "registrar") {
        modo = "cancelar";
        btnToggle.textContent = "🔴 Modo: Cancelar Participação";
        btnToggle.className = "btn btn-danger";
    } else {
        modo = "registrar";
        btnToggle.textContent = "🔵 Modo: Registrar Participação";
        btnToggle.className = "btn btn-success";
    }
});

function registrarOuCancelar(matricula, eventoId) {
    if (!eventoId) {
        erro.innerText = "Selecione o evento!";
        return;
    }
    const url = `/participacao/${matricula}/${eventoId}`;
    const method = modo === "registrar" ? "POST" : "DELETE";

    fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        method,
    })
        .then(res => {
            if (res.status === 401) throw new Error("Você precisa estar logado.");
            return res.json();
        })
        .then(data => {
            if (data.error) {
                erro.innerText = data.error;
                resultado.innerText = "";
            } else {
                const acao = modo === "registrar" ? "Registrado" : "Cancelado";
                resultado.innerText = `${acao}: ${data.aluno.nome} | Pontos: ${data.aluno.pontos}`;
                erro.innerText = "";
            }
        })
        .catch(e => {
            erro.innerText = e.message || "Erro na requisição";
            resultado.innerText = "";
            console.error(e);
        });
}

let processingScan = false;

function onScanSuccess(decodedText) {
    if (processingScan) return;
    processingScan = true;

    const eventoId = eventoSelect.value;
    try {
        let payload = decodedText;
        try { payload = JSON.parse(decodedText); } catch { }

        if (payload) {
            registrarOuCancelar(payload, eventoId);

            pararScanner(); // fecha scanner automaticamente após leitura
            processingScan = false;
        } else {
            erro.innerText = "QR Code inválido!";
            processingScan = false;
        }
    } catch (e) {
        erro.innerText = "Erro ao ler QR Code!";
        console.error(e);
        processingScan = false;
    }
}

// inicia scanner
function iniciarScanner() {
    if (!eventoSelect.value) {
        erro.innerText = "Selecione o evento antes de iniciar!";
        return;
    }

    resultado.innerText = "";
    erro.innerText = "";

    readerDiv.style.display = "block";

    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onScanSuccess
    ).then(() => {
        scannerAtivo = true;
        btnStart.textContent = "🛑 Parar Scanner";
        btnStart.className = "btn btn-warning";
    }).catch(err => {
        erro.innerText = "Erro ao iniciar câmera!";
        console.error(err);
        scannerAtivo = false;
    });
}

// parar scanner manualmente
function pararScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
            readerDiv.style.display = "none";
            scannerAtivo = false;
            btnStart.textContent = "📷 Iniciar Scanner";
            btnStart.className = "btn btn-primary";
        }).catch(err => {
            console.error("Erro ao parar scanner:", err);
        });
    }
}

// clique do botão
btnStart.addEventListener("click", () => {
    if (scannerAtivo) {
        pararScanner();
    } else {
        iniciarScanner();
    }
});