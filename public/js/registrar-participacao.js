const resultado = document.getElementById("resultado");
const erro = document.getElementById("erro");
const eventoSelect = document.getElementById("eventoSelect");
const btnStart = document.getElementById("btnStart");
// const btnToggle = document.getElementById("btnToggle");
const modeToggle = document.getElementById("modeToggle");
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

// Event listener para o toggle slider
modeToggle.addEventListener("change", function () {
    if (this.checked) {
        modo = "cancelar";
        toggleLabel.textContent = "Cancelar Participação / Vitória";
        toggleLabel.className = "toggle-label cancelar";
    } else {
        modo = "registrar";
        toggleLabel.textContent = "Registrar Participação / Vitória";
        toggleLabel.className = "toggle-label registrar";
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
    pararScanner(); // opcional: parar scanner ao mudar evento
});

// Verificar se há apenas um evento e processá-lo automaticamente
document.addEventListener("DOMContentLoaded", function () {
    const options = eventoSelect.options;

    // Se há apenas uma opção (além da opção padrão vazia) ou apenas uma opção total
    if ((options.length === 2 && options[0].value === "") || (options.length === 1 && options[0].value !== "")) {
        // Se há um evento selecionado automaticamente, processar
        const selectedOption = eventoSelect.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            resetPosicaoSelecionada();
            const temPremiacao = selectedOption.dataset.primeiro > 0 || selectedOption.dataset.segundo > 0 || selectedOption.dataset.terceiro > 0;
            const registroGroup = document.getElementById("registroGroup");

            if (temPremiacao) {
                registroGroup.style.display = "block";
            } else {
                registroGroup.style.display = "none";
            }
        }
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
        headers: { "Content-Type": "application/json" },
        method,
        body: JSON.stringify({ token }) // 🔑 envia JWT no body
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || "Erro desconhecido");
            }

            const acao = modo === "registrar" ? "Registrado" : "Cancelado";
            resultado.innerText = `${acao}: ${data.data.aluno.nome} | Pontos: ${data.data.aluno.pontos}`;
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }) // 🔑 envia JWT
        });
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Erro ao registrar vitória");
        }

        const acao = modo === "registrar" ? "Registrada" : "Cancelada";
        resultado.innerText = `Vitória ${acao}: ${posicaoSelecionada}º lugar (+${data.vitoria?.pontos || 0} pontos)`;
        erro.innerText = "";
    } catch (err) {
        erro.innerText = err.message;
        console.error(err);
    }
}

// Callback do QR Code
function onScanSuccess(decodedText) {
    if (processingScan) return;
    processingScan = true;
    // Limpar mensagens
    resultado.innerText = "";
    erro.innerText = "";

    if (!eventoSelect.value) {
        erro.innerText = "Selecione o evento antes de escanear!";
        processingScan = false;
        return;
    }

    const eventoId = eventoSelect.value;
    try {
        const token = decodedText;

        // Desativa o scanner temporariamente por 2 segundos após cada leitura
        html5QrcodeScanner.pause();
        setTimeout(() => {
            html5QrcodeScanner.resume();
        }, 2000);


        if (posicaoSelecionada && posicaoSelecionada !== "participacao") {
            registrarVitoriaParaTurma(token, eventoId);
        } else {
            registrarOuCancelar(token, eventoId);
        }

        // pararScanner(); // fecha scanner automaticamente após leitura
    } catch (e) {
        erro.innerText = "Erro ao ler QR Code!";
        console.error(e);
    } finally {
        // Libera o processamento após 2 segundos, junto com o scanner
        setTimeout(() => {
            processingScan = false;
        }, 2000);
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