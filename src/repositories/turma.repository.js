const TurmaModel = require('../models/turma.model');

const TurmaRepository = {
    getAll: () => TurmaModel.getAllTurmas(),
    saveAll: (turmas) => TurmaModel.saveTurmas(turmas),
    findById: (id) => {
        const turmas = TurmaModel.getAllTurmas();
        return turmas.find(t => t.id === id);
    }
};

module.exports = TurmaRepository;
