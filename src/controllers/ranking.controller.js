const RankingRepository = require("../repositories/ranking.repository.js");
const { listarRankingDasTurmas } = require('../services/ranking.service.js');
const { listarRankingPublicoDasTurmas } = require('../services/ranking.service.js');

function listarRankingDosAlunos() {
    return RankingRepository.getRanking().map((aluno) => ({
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

function rankingTurmasHandler(req, res) {
    const ranking = listarRankingDasTurmas();
    res.json(ranking);
}

function rankingPublico() {
    const { ranking, vitoriasOrdenadas } = listarRankingPublicoDasTurmas();
    return { ranking, vitoriasOrdenadas };
}

module.exports = { rankingAlunosHandler, rankingTurmasHandler, rankingPublico };