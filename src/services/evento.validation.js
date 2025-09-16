const EventoRepository = require('../repositories/evento.repository.js');

function validarCamposObrigatorios({ id, nome, data }, next) {
    if (!id || !nome || !data) return { error: 'id, nome e data são obrigatórios' };
    return next();
}

function validarDuplicidade({ id }, next) {
    if (EventoRepository.findById(id)) return { error: 'Evento já cadastrado' };
    return next();
}

function validarCadastroEvento(dados) {
    return validarCamposObrigatorios(dados, () =>
        validarDuplicidade(dados, () => ({}))
    );
}

module.exports = {
    validarCadastroEvento
};
