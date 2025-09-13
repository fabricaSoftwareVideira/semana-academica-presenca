const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const ALUNOS_FILE = path.join(__dirname, "../data/alunos.json");
const EVENTOS_FILE = path.join(__dirname, "../data/eventos.json");

function registrarParticipacao(matricula, eventoId) {
    const alunos = readJson(ALUNOS_FILE);
    const eventos = readJson(EVENTOS_FILE);

    const aluno = alunos.find((a) => a.matricula === matricula);
    if (!aluno) {
        return { error: "Aluno não encontrado" };
    }

    const evento = eventos.find((e) => e.id === parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado" };
    }

    if (aluno.participacoes && aluno.participacoes.find((p) => p.id === evento.id)) {
        return { error: "Participação já registrada" };
    }

    const participacao = {
        id: evento.id,
        nome: evento.nome,
        data: new Date().toISOString()
    };

    if (!aluno.participacoes) aluno.participacoes = [];
    aluno.participacoes.push(participacao);
    aluno.pontos = (aluno.pontos || 0) + 1;

    writeJson(ALUNOS_FILE, alunos);
    return { success: true, aluno };
}

function participarHandler(req, res) {
    const { matricula, eventoId } = req.params;
    const resultado = registrarParticipacao(matricula, eventoId);

    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    res.json(resultado.aluno);
}

// Registrar vitória para a turma em um evento com base nisso
function registrarVitoria(turmaId, eventoId, posicao) {
    const turmas = readJson(path.join(__dirname, "../data/turmas.json"));
    const eventos = readJson(EVENTOS_FILE);

    const turma = turmas.find((t) => t.id === turmaId);
    if (!turma) {
        return { error: "Turma não encontrada" };
    }

    const evento = eventos.find((e) => e.id === parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado" };
    }

    if (!["1", "2", "3"].includes(posicao)) {
        return { error: "Posição inválida. Use 1, 2 ou 3." };
    }

    if (!evento.primeiroLugar || !evento.segundoLugar || !evento.terceiroLugar) {
        return { error: "Evento não tem pontos definidos para posições" };
    }

    if (!turma.vitorias) turma.vitorias = [];
    if (turma.vitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
        return { error: "Turma já registrou vitória nesta posição para este evento" };
    }

    const todasVitorias = turmas.flatMap((t) => t.vitorias || []);
    if (todasVitorias.find((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao))) {
        return { error: "Outra turma já registrou vitória nesta posição para este evento" };
    }

    let pontos = 0;
    if (posicao === "1") pontos = evento.primeiroLugar;
    else if (posicao === "2") pontos = evento.segundoLugar;
    else if (posicao === "3") pontos = evento.terceiroLugar;

    if (turma.pontos === null || turma.pontos === undefined) turma.pontos = 0;
    turma.pontos += pontos;

    turma.vitorias.push({
        eventoId: evento.id,
        eventoNome: evento.nome,
        posicao: parseInt(posicao),
        pontos,
        data: new Date().toISOString()
    });

    writeJson(path.join(__dirname, "../data/turmas.json"), turmas);
    return { success: true, turma };
}

function registrarVitoriaHandler(req, res) {
    const { turmaId, eventoId, posicao } = req.body;
    const resultado = registrarVitoria(turmaId, eventoId, posicao);

    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    res.json(resultado.turma);
}

function cancelarParticipacao(matricula, eventoId) {
    const alunos = readJson(ALUNOS_FILE);
    const eventos = readJson(EVENTOS_FILE);

    const aluno = alunos.find((a) => a.matricula === matricula);
    if (!aluno) {
        return { error: "Aluno não encontrado" };
    }

    const evento = eventos.find((e) => e.id === parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado" };
    }

    if (!aluno.participacoes) aluno.participacoes = [];
    const participacaoIndex = aluno.participacoes.findIndex((p) => p.id === evento.id);
    if (participacaoIndex === -1) {
        return { error: "Aluno não participou deste evento" };
    }

    aluno.participacoes.splice(participacaoIndex, 1);
    aluno.pontos -= 1;
    if (aluno.pontos < 0) aluno.pontos = 0;

    writeJson(ALUNOS_FILE, alunos);
}

function cancelarVitoria(turmaId, eventoId, posicao) {
    const turmas = readJson(path.join(__dirname, "../data/turmas.json"));
    const eventos = readJson(EVENTOS_FILE);
    const turma = turmas.find((t) => t.id === turmaId);
    if (!turma) {
        return { error: "Turma não encontrada" };
    }

    const evento = eventos.find((e) => e.id === parseInt(eventoId));
    if (!evento) {
        return { error: "Evento não encontrado" };
    }

    if (!turma.vitorias) turma.vitorias = [];
    const vitoriaIndex = turma.vitorias.findIndex((v) => v.eventoId === evento.id && v.posicao === parseInt(posicao));
    if (vitoriaIndex === -1) {
        return { error: "Turma não registrou vitória nesta posição para este evento" };
    }

    const vitoria = turma.vitorias[vitoriaIndex];
    turma.vitorias.splice(vitoriaIndex, 1);
    turma.pontos -= vitoria.pontos;
    if (turma.pontos < 0) turma.pontos = 0;

    writeJson(path.join(__dirname, "../data/turmas.json"), turmas);
    return { success: true, turma };
}

function cancelarParticipacaoHandler(req, res) {
    const { matricula, eventoId } = req.params;
    const resultado = cancelarParticipacao(matricula, eventoId);

    if (resultado && resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    res.json({ success: true });
}

function cancelarVitoriaHandler(req, res) {
    const { turmaId, eventoId, posicao } = req.body;
    const resultado = cancelarVitoria(turmaId, eventoId, posicao);

    if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
    }

    res.json(resultado.turma);
}

module.exports = { participarHandler, registrarVitoriaHandler, cancelarParticipacaoHandler, cancelarVitoriaHandler };