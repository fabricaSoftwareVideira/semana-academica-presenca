const TurmaRepository = require('../repositories/turma.repository.js');

function validarTurmaPayload({ id, nome }) {
    if (!id || !nome) {
        return { error: 'id e nome são obrigatórios' };
    }
    return {};
}

function turmaJaExiste(id) {
    if (TurmaRepository.findById(id)) {
        return { error: 'Turma já cadastrada' };
    }
    return {};
}

module.exports = {
    validarTurmaPayload,
    turmaJaExiste
};
