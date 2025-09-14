const path = require("path");
const { readJson, writeJson } = require("../utils/file.utils");

const ALUNOS_FILE = path.join(__dirname, "../data/alunos.json");
const TURMAS_FILE = path.join(__dirname, "../data/turmas.json");

// Listar ranking de alunos baseado nos pontos
function listarRankingDosAlunos() {
    const alunos = readJson(ALUNOS_FILE);
    return alunos
        .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
        .map((aluno) => ({
            matricula: aluno.matricula,
            nome: aluno.nome,
            turma: aluno.turma,
            pontos: aluno.pontos || 0
        }));
}

function rankingAlunosHandler(req, res) {
    const ranking = listarRankingDosAlunos();
    res.json(ranking);
}

// Listar ranking de turmas baseado nos pontos dos alunos
function listarRankingDasTurmas() {
    const alunos = readJson(ALUNOS_FILE);
    const turmas = readJson(TURMAS_FILE);

    // Calcular pontos totais por turma
    const ranking = turmas.map(turma => {
        const pontosTotalAlunos = alunos
            .filter(a => a.turma === turma.id)
            .reduce((sum, a) => sum + (a.pontos || 0), 0);

        const pontosVitorias = turma.pontos || 0;
        const pontosTotal = pontosVitorias + pontosTotalAlunos;

        return {
            ...turma,
            pontosTotalAlunos,
            pontosVitorias,
            pontosTotal
        };
    }).sort((a, b) => b.pontosTotal - a.pontosTotal);

    return ranking;
}

function rankingTurmasHandler(req, res) {
    const ranking = listarRankingDasTurmas();
    res.json(ranking);
}

// Rota pública que retorna apenas a pontuação por turma
function rankingPublico() {
    const ranking = listarRankingDasTurmas().map(turma => ({
        id: turma.id,
        nome: turma.nome,
        pontosVitorias: turma.pontosVitorias,
        pontosTotalAlunos: turma.pontosTotalAlunos,
        pontosTotal: turma.pontosTotal,
        vitorias: turma.vitorias || []
    }));
    return ranking;
}

module.exports = { rankingAlunosHandler, rankingTurmasHandler, rankingPublico };