// index.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // para ler dados do form

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const DATA_FILE = path.join(__dirname, "data", "alunos.json");

const maxWidth = 280; // largura máxima do texto

function drawTextWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let testLine, metrics;

    words.forEach((word) => {
        testLine = line + word + " ";
        metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, x, y);
            line = word + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    });

    ctx.fillText(line, x, y);
    return y + lineHeight;
}


async function gerarQrCodeComTexto(payload, aluno) {
    if (!payload) throw new Error("Matrícula não fornecida");

    const canvasWidth = 300;
    const canvasHeight = 420; // QR 300 + espaço 120px para texto
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // fundo branco
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // QR Code
    const qrCanvas = createCanvas(300, 300);
    await QRCode.toCanvas(qrCanvas, payload, { width: 300, margin: 2 });
    ctx.drawImage(qrCanvas, 0, 0);

    // texto
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    // Nome do aluno (com quebra automática se precisar)
    ctx.font = "bold 18px Arial";
    let y = 320;
    y = drawTextWrapped(ctx, aluno.nome, canvasWidth / 2, y, 280, 20);

    // Turma
    ctx.font = "16px Arial";
    ctx.fillText(`Turma: ${aluno.turma}`, canvasWidth / 2, y);

    return canvas.toDataURL();
}

// Função para ler alunos do JSON
function lerAlunos() {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

// Função para ler eventos do JSON
// { id, nome, descricao, data, horario, local, tipo, pontos }
function lerEventos() {
    const eventosFile = path.join(__dirname, "data", "eventos.json");
    if (!fs.existsSync(eventosFile)) return [];
    const data = fs.readFileSync(eventosFile);
    return JSON.parse(data);
}

function lerTurmas() {
    const turmasFile = path.join(__dirname, "data", "turmas.json");
    if (!fs.existsSync(turmasFile)) return {};
    const data = fs.readFileSync(turmasFile);
    return JSON.parse(data);
}

// Função para salvar alunos no JSON
function salvarAlunos(alunos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(alunos, null, 2));
}

// Função para salvar eventos no JSON
function salvarEventos(eventos) {
    const eventosFile = path.join(__dirname, "data", "eventos.json");
    fs.writeFileSync(eventosFile, JSON.stringify(eventos, null, 2));
}

function salvarTurmas(turmas) {
    const turmasFile = path.join(__dirname, "data", "turmas.json");
    fs.writeFileSync(turmasFile, JSON.stringify(turmas, null, 2));
}

// Rota para cadastrar aluno
app.post("/alunos", (req, res) => {
    const { matricula, nome, turma } = req.body;
    if (!matricula || !nome || !turma) {
        return res.status(400).json({ error: "matricula, nome e turma são obrigatórios" });
    }

    const alunos = lerAlunos();
    if (alunos.find(a => a.matricula === matricula)) {
        return res.status(400).json({ error: "Aluno já cadastrado" });
    }

    const novoAluno = { matricula, nome, turma, pontos: 0 };
    alunos.push(novoAluno);
    salvarAlunos(alunos);

    res.json(novoAluno);
});

// Rota para cadastrar evento
app.post("/eventos", (req, res) => {
    const { nome, descricao, data, horario, local, tipo, pontos } = req.body;
    if (!nome || !descricao || !data || !horario || !local || !tipo || pontos === undefined) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    const eventos = lerEventos();
    const novoEvento = { id: eventos.length + 1, nome, descricao, data, horario, local, tipo, pontos };
    eventos.push(novoEvento);
    salvarEventos(eventos);

    res.json(novoEvento);
});

// Rota para cadastrar turma
app.post("/turmas", (req, res) => {
    const { sigla } = req.body;
    if (!sigla) {
        return res.status(400).json({ error: "sigla é obrigatória" });
    }

    const turmas = lerTurmas();
    if (turmas[sigla]) {
        return res.status(400).json({ error: "Turma já cadastrada" });
    }

    salvarTurmas(turmas);

    res.json({ sigla, pontos: 0 });
});


// Rota para listar eventos
app.get("/eventos", (req, res) => {
    const eventos = lerEventos();
    res.json(eventos);
});

// Rota para listar alunos
app.get("/alunos", (req, res) => {
    const alunos = lerAlunos();
    console.log("Quantidade de alunos lidos:", alunos.length);
    res.json(alunos);
});

// Rota para listar turmas
app.get("/turmas", (req, res) => {
    const turmas = lerTurmas();
    res.json(turmas);
});

// Rota para registrar participação em um evento (cada evento tem pontos diferentes). 
// Registrar que participou da oficina para evitar múltiplas participações.
app.post("/participacao/:matricula/:eventoId", (req, res) => {
    const { matricula, eventoId } = req.params;
    const alunos = lerAlunos();
    const eventos = lerEventos();

    const aluno = alunos.find(a => a.matricula === matricula);
    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });

    const evento = eventos.find(e => e.id === parseInt(eventoId));
    if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

    // Verificar se o aluno já participou do evento
    if (!aluno.participacoes) aluno.participacoes = [];
    if (aluno.participacoes.find(p => p.id === evento.id)) {
        return res.status(400).json({ error: "Aluno já participou deste evento" });
    }

    if (aluno.pontos === null || aluno.pontos === undefined) aluno.pontos = 0;

    aluno.pontos += evento.pontos;
    aluno.participacoes.push({ id: evento.id, nome: evento.nome, data: new Date().toISOString() });
    salvarAlunos(alunos);
    res.json({ message: "Participação registrada", aluno });
});

// Rota para registrar vitória para a turma em um evento (cada evento tem pontos diferentes).
// O evento tem pontos diferentes para primeiro, segundo e terceiro lugar.
// Registrar pontos no arquivo turmas.json, não no aluno. Vincular o evento à turma em turma.json
// turmas.json {"id": "1A", "nome": "Turma 1A" }
app.post("/vitoria/:turmaId/:eventoId/:posicao", (req, res) => {
    const { turmaId, eventoId, posicao } = req.params;
    const eventos = lerEventos();
    const turmas = lerTurmas();

    // Verificar se a turma existe
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) {
        return res.status(404).json({ error: "Turma não encontrada" });
    }

    const evento = eventos.find(e => e.id === parseInt(eventoId));
    if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

    if (!["1", "2", "3"].includes(posicao)) {
        return res.status(400).json({ error: "Posição inválida. Use 1, 2 ou 3." });
    }

    if (!evento.primeiroLugar || !evento.segundoLugar || !evento.terceiroLugar) {
        return res.status(400).json({ error: "Evento não tem pontos definidos para posições" });
    }

    // Verificar se a turma já registrou vitória no evento ou se outra turma ganhou na mesma posição
    if (!turma.vitorias) turma.vitorias = [];
    if (turma.vitorias.find(v => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
        return res.status(400).json({ error: "Turma já registrou vitória nesta posição para este evento" });
    }
    const todasVitorias = Object.values(turmas).flatMap(t => t.vitorias || []);
    if (todasVitorias.find(v => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
        return res.status(400).json({ error: "Outra turma já registrou vitória nesta posição para este evento" });
    }

    // Determinar pontos com base na posição

    let pontos = 0;
    if (posicao === "1") pontos = evento.primeiroLugar;
    else if (posicao === "2") pontos = evento.segundoLugar;
    else if (posicao === "3") pontos = evento.terceiroLugar;

    // Adicionar pontos ao objeto turma no turmas.json
    if (turma.pontos === null || turma.pontos === undefined) turma.pontos = 0;
    turma.pontos += pontos;

    // Registrar vitória na turma
    if (!turma.vitorias) turma.vitorias = [];
    turma.vitorias.push({ eventoId: evento.id, eventoNome: evento.nome, posicao: parseInt(posicao), pontos, data: new Date().toISOString() });

    salvarTurmas(turmas);

    res.json({ message: "Vitória registrada", turma, pontosTotais: turmas[turma] });
});

// Cancelar participação em um evento
app.delete("/participacao/:matricula/:eventoId", (req, res) => {
    const { matricula, eventoId } = req.params;
    const alunos = lerAlunos();
    const eventos = lerEventos();

    const aluno = alunos.find(a => a.matricula === matricula);
    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });

    const evento = eventos.find(e => e.id === parseInt(eventoId));
    if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

    if (!aluno.participacoes) aluno.participacoes = [];
    const participacaoIndex = aluno.participacoes.findIndex(p => p.id === evento.id);
    if (participacaoIndex === -1) {
        return res.status(400).json({ error: "Aluno não participou deste evento" });
    }

    // Remover participação e subtrair pontos
    aluno.participacoes.splice(participacaoIndex, 1);
    aluno.pontos -= evento.pontos;
    if (aluno.pontos < 0) aluno.pontos = 0; // Evitar pontos negativos

    salvarAlunos(alunos);
    res.json({ message: "Participação cancelada", aluno });
});

// Cancelar vitória de uma turma em um evento
app.delete("/vitoria/:turmaId/:eventoId/:posicao", (req, res) => {
    const { turmaId, eventoId, posicao } = req.params;
    const turmas = lerTurmas();
    const eventos = lerEventos();

    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return res.status(404).json({ error: "Turma não encontrada" });

    const evento = eventos.find(e => e.id === parseInt(eventoId));
    if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

    if (!turma.vitorias) turma.vitorias = [];
    const vitoriaIndex = turma.vitorias.findIndex(v => v.eventoId === evento.id && v.posicao === parseInt(posicao));
    if (vitoriaIndex === -1) {
        return res.status(400).json({ error: "Turma não registrou vitória nesta posição para este evento" });
    }

    // Remover vitória e subtrair pontos
    const vitoria = turma.vitorias[vitoriaIndex];
    turma.vitorias.splice(vitoriaIndex, 1);
    turma.pontos -= vitoria.pontos;
    if (turma.pontos < 0) turma.pontos = 0; // Evitar pontos negativos

    salvarTurmas(turmas);
    res.json({ message: "Vitória cancelada", turma });
});


// Ranking por aluno
app.get("/ranking/alunos", (req, res) => {
    const alunos = lerAlunos().sort((a, b) => b.pontos - a.pontos);
    res.json(alunos);
});

// Ranking por turma, incluindo pontuação total de cada turma
app.get("/ranking/turmas", (req, res) => {
    const turmas = lerTurmas();
    const alunos = lerAlunos();

    // Calcular pontos totais por turma com base nos alunos
    const ranking = Object.values(turmas).map(turma => {
        const pontosTotalAlunos = alunos
            .filter(a => a.turma === turma.id)
            .reduce((sum, a) => sum + (a.pontos || 0), 0);
        return { ...turma, pontosTotalAlunos };
    }).sort((a, b) => b.pontosTotalAlunos - a.pontosTotalAlunos);

    // Somar pontos da turma (vitorias) com pontos dos alunos
    ranking.forEach(turma => {
        turma.pontosTotal = (turma.pontos || 0) + (turma.pontosTotalAlunos || 0);
    });

    // Ordenar pelo total completo
    ranking.sort((a, b) => b.pontosTotal - a.pontosTotal);

    res.json(ranking);
});

app.get("/", (req, res) => {
    res.send("API da Semana Acadêmica");
});

// Rota para abrir a tela public/gerar-qrcode.html
app.get("/gerar", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "gerar-qrcode.html"));
});

// Rota para gerar QR code a partir da matrícula
app.post("/gerar", (req, res) => {
    const { matricula } = req.body;
    if (!matricula) {
        return res.status(400).json({ error: "Matrícula é obrigatória" });
    }

    // Verifica se aluno existe
    const alunos = lerAlunos();
    const aluno = alunos.find(a => a.matricula === matricula);
    if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // Conteúdo que vai dentro do QR Code (pode ser só matrícula ou JSON)
    const payload = JSON.stringify(aluno.matricula);

    // Gerar QR code em Base64
    // QRCode.toDataURL(payload, { width: 250 }, (err, url) => {
    //     if (err) {
    //         return res.status(500).json({ error: "Erro ao gerar QR Code" });
    //     }

    //     res.json({
    //         aluno: {
    //             matricula: aluno.matricula,
    //             nome: aluno.nome,
    //             turma: aluno.turma,
    //         },
    //         qrcode: url // imagem base64
    //     });
    // });
    gerarQrCodeComTexto(payload, aluno)
        .then((url) => {
            res.render("qrcode", { aluno, qrcode: url });
        })
        .catch(() => {
            res.render("form", { error: "Erro ao gerar QR Code" });
        });

    // Gravar log de geração de QR code (opcional)
    const logFile = path.join(__dirname, "data", "qrcode_logs.txt");
    const logEntry = `${new Date().toISOString()} - QR Code gerado para matrícula: ${matricula}\n`;
    fs.appendFileSync(logFile, logEntry);


    // Gravar em alunos.json que o QR code foi gerado (opcional)
    aluno.qrcodeGerado = true;
    aluno.qrcodeGeradoEm = new Date().toISOString();
    salvarAlunos(alunos);
});

// Gerar QR code para todos os alunos em lote e salvar em arquivos PNG na pasta "qrcodes"
app.post("/gerar-lote", (req, res) => {
    const alunos = lerAlunos();
    const outputDir = path.join(__dirname, "qrcodes");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Gerar QR code para cada aluno usando a função gerarQrCodeComTexto
    let gerados = 0;
    alunos.forEach(async (aluno) => {
        const payload = JSON.stringify(aluno.matricula);
        try {
            const dataUrl = await gerarQrCodeComTexto(payload, aluno);
            // Remover o prefixo "data:image/png;base64,"
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            const outputFile = path.join(outputDir, `${aluno.matricula}.png`);
            fs.writeFileSync(outputFile, base64Data, "base64");
            gerados++;
            console.log(`QR Code gerado para ${aluno.matricula} (${gerados}/${alunos.length})`);
        } catch (err) {
            console.error(`Erro ao gerar QR Code para ${aluno.matricula}:`, err);
        }
    });

    res.json({ message: "Geração de QR Codes em lote iniciada. Verifique a pasta 'qrcodes'." });
});

// Ir para tela public/registrar-participacao.html, enviando lista de eventos usando ejs
app.get("/registrar-participacao", (req, res) => {
    const eventos = lerEventos();
    res.render("registrar-participacao", { eventos });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
