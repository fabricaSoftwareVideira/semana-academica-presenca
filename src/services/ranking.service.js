const AlunoRepository = require('../repositories/aluno.repository.js');
const TurmaRepository = require('../repositories/turma.repository.js');

function listarRankingDasTurmas() {
    const alunos = AlunoRepository.getAll();
    const turmas = TurmaRepository.getAll();

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

    // Se duas turmas tiverem o mesmo total, desempatar por pontos de vitórias
    ranking.sort((a, b) => {
        if (b.pontosTotal === a.pontosTotal) {
            return b.pontosVitorias - a.pontosVitorias;
        }
        return 0;
    });
    return ranking;
}


function listarRankingPublicoDasTurmas() {
    const ranking = listarRankingDasTurmas().map(turma => ({
        id: turma.id,
        nome: turma.nome,
        pontosVitorias: turma.pontosVitorias,
        pontosTotalAlunos: turma.pontosTotalAlunos,
        pontosTotal: turma.pontosTotal,
        vitorias: turma.vitorias || []
    }));
    // Ordena o ranking por nome de turma
    const vitoriasOrdenadas = ranking
        .map(turma => ({
            ...turma,
            vitorias: (turma.vitorias || []).sort((a, b) => new Date(b.data) - new Date(a.data))
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    return { ranking, vitoriasOrdenadas };
}

module.exports = {
    listarRankingDasTurmas,
    listarRankingPublicoDasTurmas
};
