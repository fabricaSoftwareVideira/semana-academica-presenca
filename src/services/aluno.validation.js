const AlunoRepository = require('../repositories/aluno.repository.js');

function validarCamposObrigatorios({ matricula, nome, turma }, next) {
    if (!matricula || !nome || !turma) return { error: 'matricula, nome e turma são obrigatórios' };
    return next();
}

function validarDuplicidade({ matricula }, next) {
    if (AlunoRepository.findByMatricula(matricula)) return { error: 'Aluno já cadastrado' };
    return next();
}

function validarCadastroAluno(dados) {
    return validarCamposObrigatorios(dados, () =>
        validarDuplicidade(dados, () => ({}))
    );
}

module.exports = {
    validarCadastroAluno
};
