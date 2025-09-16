const TurmaRepository = require('../repositories/turma.repository.js');

function validarCamposObrigatorios({ id, nome }, next) {
    if (!id || !nome) return { error: 'id e nome são obrigatórios' };
    return next();
}

function validarDuplicidade({ id }, next) {
    if (TurmaRepository.findById(id)) return { error: 'Turma já cadastrada' };
    return next();
}

function validarCadastroTurma(dados) {
    return validarCamposObrigatorios(dados, () =>
        validarDuplicidade(dados, () => ({}))
    );
}

module.exports = {
    validarCadastroTurma
};
