// Repository para ranking
const AlunoModel = require('../models/aluno.model');

const RankingRepository = {
    getRanking: () => {
        const alunos = AlunoModel.getAllAlunos();
        // Ordena por pontos decrescentes
        return alunos.sort((a, b) => (b.pontos || 0) - (a.pontos || 0));
    },
    getAll: () => AlunoModel.getAllAlunos(),
    saveAll: (alunos) => AlunoModel.saveAlunos(alunos),
};

module.exports = RankingRepository;
