// index.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(__dirname, "data", "alunos.json");

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


// Ranking por aluno
app.get("/ranking/alunos", (req, res) => {
    const alunos = lerAlunos().sort((a, b) => b.pontos - a.pontos);
    res.json(alunos);
});

// Ranking por turma
app.get("/ranking/turmas", (req, res) => {
    const alunos = lerAlunos();
    const turmas = {};

    alunos.forEach(a => {
        if (!turmas[a.turma]) turmas[a.turma] = 0;
        turmas[a.turma] += a.pontos;
    });

    const ranking = Object.entries(turmas)
        .map(([turma, pontos]) => ({ turma, pontos }))
        .sort((a, b) => b.pontos - a.pontos);

    res.json(ranking);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
