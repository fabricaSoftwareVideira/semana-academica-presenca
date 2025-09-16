const TurmaModel = require('../models/turma.model');

const TurmaRepository = {
    getAll: () => TurmaModel.getAllTurmas(),
    saveAll: (turmas) => TurmaModel.saveTurmas(turmas),
};

module.exports = TurmaRepository;
