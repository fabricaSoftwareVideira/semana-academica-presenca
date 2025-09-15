const resultado = document.getElementById("resultado");
const erro = document.getElementById("erro");
const eventoSelect = document.getElementById("eventoSelect");
const btnStart = document.getElementById("btnStart");
const btnToggle = document.getElementById("btnToggle");
const readerDiv = document.getElementById("reader");

let html5QrcodeScanner;
let modo = "registrar";
let scannerAtivo = false; // controle do scanner
let processingScan = false;
let posicaoSelecionada = 'participacao';

// Resetar posição selecionada
function resetPosicaoSelecionada() {
    posicaoSelecionada = 'participacao';
    // Limpa seleção visual dos radios
    document.querySelectorAll("#registroGroup input[name=posicao]").forEach(radio => radio.checked = false);
    marcarPosicaoSelecionada(posicaoSelecionada);
}

function marcarPosicaoSelecionada(valor) {
    const radio = document.querySelector(`#registroGroup input[value='${valor}']`);
    if (radio) {
        radio.checked = true;
        posicaoSelecionada = valor;
    }
}

// alterna registrar/cancelar
btnToggle.addEventListener("click", () => {
    if (modo === "registrar") {
        modo = "cancelar";
        btnToggle.textContent = "🔴 Modo: Cancelar Participação / Vitória";
        btnToggle.className = "btn btn-danger";
    } else {
        modo = "registrar";
        btnToggle.textContent = "🔵 Modo: Registrar Participação / Vitória";
        btnToggle.className = "btn btn-success";
    }
});

// Atualizar posição selecionada
document.querySelectorAll("#registroGroup input[name=posicao]").forEach(radio => {
    radio.addEventListener("change", function () {
        posicaoSelecionada = this.value;
    });
});

eventoSelect.addEventListener("change", function () {
    resetPosicaoSelecionada(); // reset ao mudar evento
    const selected = this.options[this.selectedIndex];
    const temPremiacao = selected.dataset.primeiro > 0 || selected.dataset.segundo > 0 || selected.dataset.terceiro > 0;
    const registroGroup = document.getElementById("registroGroup");

    if (temPremiacao) {
        registroGroup.style.display = "block";
    } else {
        registroGroup.style.display = "none";
    }
});

function registrarOuCancelar(token, eventoId) {
    if (!eventoId) {
        erro.innerText = "Selecione o evento!";
        return;
    }
    const url = `/participacao/${eventoId}`;
    const method = modo === "registrar" ? "POST" : "DELETE";

    fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        method,
        body: JSON.stringify({ token }) // 🔑 envia JWT no body
    })
        .then(async res => {
            // Tenta extrair o JSON da resposta
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Usa a mensagem do servidor se existir
                const msg = data.error || `Erro ${res.status}`;
                throw new Error(msg);
            }

            return data;
        })
        .then(data => {
            const acao = modo === "registrar" ? "Registrado" : "Cancelado";
            resultado.innerText = `${acao}: ${data.aluno.nome} | Pontos: ${data.aluno.pontos}`;
            erro.innerText = "";
        })
        .catch(e => {
            erro.innerText = e.message || "Erro na requisição";
            resultado.innerText = "";
            console.error(e);
        });
}


// Registrar ou cancelar vitória
async function registrarVitoriaParaTurma(token, eventoId) {
    if (!posicaoSelecionada) {
        alert("Selecione uma posição antes de escanear.");
        return;
    }

    const method = modo === "registrar" ? "POST" : "DELETE";
    try {
        const res = await fetch(`/participacao/vitoria/${eventoId}/${posicaoSelecionada}`, {
            method,
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }) // 🔑 envia JWT
        });
        const data = await res.json();
        if (data.error) {
            erro.innerText = data.error;
        } else {
            const acao = modo === "registrar" ? "Registrada" : "Cancelada";
            resultado.innerText = `Vitória ${acao}: ${posicaoSelecionada}º lugar (+${data.vitorias?.at(-1)?.pontos || 0} pontos)`;
            erro.innerText = "";
        }
    } catch (err) {
        erro.innerText = "Erro ao registrar vitória.";
        console.error(err);
    }
}

// Callback do QR Code
function onScanSuccess(decodedText) {
    if (processingScan) return;
    processingScan = true;

    const eventoId = eventoSelect.value;
    try {
        const token = decodedText; // 🔑 agora o QR code contém JWT

        if (posicaoSelecionada && posicaoSelecionada !== "participacao") {
            registrarVitoriaParaTurma(token, eventoId);
        } else {
            registrarOuCancelar(token, eventoId);
        }

        pararScanner(); // fecha scanner automaticamente após leitura
    } catch (e) {
        erro.innerText = "Erro ao ler QR Code!";
        console.error(e);
    } finally {
        processingScan = false;
    }
}

// iniciar scanner
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

// parar scanner
function pararScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
            readerDiv.style.display = "none";
            scannerAtivo = false;
            btnStart.textContent = "📷 Iniciar Scanner";
            btnStart.className = "btn btn-primary";
            // resetPosicaoSelecionada(); // resetar posição ao parar
            marcarPosicaoSelecionada(posicaoSelecionada); // marcar radio novamente
        }).catch(err => {
            console.error("Erro ao parar scanner:", err);
        });
    }
}

// clique do botão iniciar/parar
btnStart.addEventListener("click", () => {
    if (scannerAtivo) {
        pararScanner();
    } else {
        iniciarScanner();
    }
});